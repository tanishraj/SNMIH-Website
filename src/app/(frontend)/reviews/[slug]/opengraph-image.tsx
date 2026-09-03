import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ImageResponse } from 'next/og'

import { getOpenGraphMediaImage } from '@/lib/media'
import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'

export const alt = 'Review preview'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

type Props = { params: Promise<{ slug: string }> }

export default async function ReviewOgImage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const [result, siteSettings] = await Promise.all([
    payload.find({
      collection: 'reviews',
      depth: 0,
      limit: 1,
      where: { slug: { equals: slug }, _status: { equals: 'published' } },
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])

  const review = result.docs[0]

  if (!review) {
    return createOpenGraphFallbackResponse()
  }

  const title = review.reviewTitle
  const rating = review.rating ? parseInt(review.rating, 10) : null
  const reviewer = review.displayName?.trim() || review.reviewerName?.trim() || ''
  const subjectLabel = review.subjectLabel?.trim() ?? ''
  const siteName = siteSettings.siteName
  const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

  if (!logoImage) {
    return createOpenGraphFallbackResponse()
  }

  const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : ''

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
      {/* Top — logo + label */}
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
            background: '#d97706',
            padding: '3px 10px',
            borderRadius: '99px',
            letterSpacing: '0.04em',
          }}
        >
          {subjectLabel || 'Review'}
        </span>
      </div>

      {/* Middle — title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {stars ? (
          <div style={{ fontSize: 28, color: '#f59e0b', letterSpacing: '0.05em' }}>{stars}</div>
        ) : null}
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
      </div>

      {/* Bottom — reviewer */}
      {reviewer ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#4b5563', fontSize: 18 }}>By</span>
          <span style={{ color: '#9ca3af', fontSize: 18, fontWeight: 500 }}>{reviewer}</span>
        </div>
      ) : (
        <div />
      )}
    </div>,
    { ...size },
  )
}
