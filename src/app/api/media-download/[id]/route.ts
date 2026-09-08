import { getPayload } from 'payload'
import config from '@payload-config'

import { normalizeMediaPublicURL } from '@/config/mediaPublicURL'
import { getSiteURL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const unavailable = (status: number) =>
  Response.json({ message: 'Unable to download this file.' }, { status })

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return unavailable(400)

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'media',
      where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
      depth: 0,
      limit: 1,
      overrideAccess: false,
      user: null,
      draft: false,
      select: { filename: true, url: true },
    })
    const media = docs[0]
    if (!media?.url || !media.filename) return unavailable(404)

    const siteOrigin = new URL(getSiteURL()).origin
    const assetOrigin = normalizeMediaPublicURL(process.env.S3_PUBLIC_URL)
    const source = new URL(media.url, siteOrigin)
    // Use only a stored Media URL on a trusted origin. Never accept a caller URL
    // or follow redirects to an unchecked destination.
    if (
      !['http:', 'https:'].includes(source.protocol) ||
      source.username ||
      source.password ||
      (source.origin !== siteOrigin && source.origin !== assetOrigin) ||
      (source.origin === siteOrigin && !source.pathname.startsWith('/api/media/file/'))
    )
      return unavailable(404)

    const upstream = await fetch(source, {
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(60_000)]),
    })
    if (!upstream.ok || !upstream.body) {
      await upstream.body?.cancel()
      return unavailable(upstream.status === 404 ? 404 : 502)
    }

    const filename = media.filename.replace(/[\r\n\u0000-\u001f\u007f/\\]/g, '_')
    const fallback = filename.replace(/[^\x20-\x7e]|[";]/g, '_')
    const encoded = encodeURIComponent(filename).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return unavailable(502)
  }
}
