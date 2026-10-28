import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { parseDisclosureQuery } from '@/blocks/DisclosureProforma/request'
import { DisclosureReadError, loadDisclosure } from '@/blocks/DisclosureProforma/load'
export async function GET(request: Request) {
  let query
  try {
    query = parseDisclosureQuery(new URL(request.url).searchParams)
  } catch {
    return Response.json({ message: 'Invalid disclosure filters.' }, { status: 400 })
  }
  try {
    const user = query.draft
      ? (
          await (
            await getPayload({ config: configPromise })
          ).auth({ headers: request.headers, canSetHeaders: false })
        ).user
      : undefined
    const snapshot = await loadDisclosure(query, user)
    return Response.json(snapshot, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof DisclosureReadError
            ? error.message
            : 'Disclosure information is temporarily unavailable.',
      },
      {
        status: error instanceof DisclosureReadError ? error.status : 500,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    )
  }
}
