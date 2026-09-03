import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ImageResponse } from 'next/og'

import { getOpenGraphMediaImage } from '@/lib/media'
import { resolveNewsEventClassificationRecord } from '@/lib/newsEventClassifications'
import { createOpenGraphFallbackResponse, loadOpenGraphRemoteImage } from '@/lib/openGraphImages'

export const alt = 'News & Events preview'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

type Props = { params: Promise<{ slug: string }> }

export default async function NewsEventOgImage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const [result, siteSettings] = await Promise.all([
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit: 1,
      select: {
        classification: true,
        contentType: true,
        excerpt: true,
        title: true,
      },
      where: {
        and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
      },
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])

  const entry = result.docs[0]

  if (!entry) {
    return createOpenGraphFallbackResponse()
  }

  const title = entry.title
  const excerpt = entry.excerpt ?? ''
  const classification = resolveNewsEventClassificationRecord(
    entry.classification,
    entry.contentType,
  )
  const classificationLabel = classification?.badgeLabel ?? 'News & Events'
  const siteName = siteSettings.siteName
  const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

  if (!logoImage) {
    return createOpenGraphFallbackResponse()
  }

  const accentColor = classification?.behavior === 'event' ? '#7c3aed' : '#2563eb'

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0f0f12 0%, #16161e 100%)',
        width: '100%',
        height: '100%',
        padding: '72px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={logoImage.src}
          alt={siteName}
          width={logoImage.width}
          height={logoImage.height}
          style={{ height: 32, maxWidth: 160, objectFit: 'contain', width: 'auto' }}
        />
        <span style={{ color: '#374151', fontSize: 16 }}>·</span>
        <span
          style={{
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            background: accentColor,
            padding: '3px 10px',
            borderRadius: '99px',
            letterSpacing: '0.04em',
          }}
        >
          {classificationLabel}
        </span>
      </div>

      {/* Title + excerpt */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            fontSize: title.length > 60 ? 44 : 56,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: 900,
          }}
        >
          {title.length > 100 ? `${title.slice(0, 97)}…` : title}
        </div>
        {excerpt ? (
          <div style={{ fontSize: 22, color: '#9ca3af', lineHeight: 1.5, maxWidth: 760 }}>
            {excerpt.length > 120 ? `${excerpt.slice(0, 117)}…` : excerpt}
          </div>
        ) : null}
      </div>

      <div />
    </div>,
    { ...size },
  )
}
