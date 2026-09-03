import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ImageResponse } from 'next/og'

import { getOpenGraphMediaImage } from '@/lib/media'
import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'

export const alt = 'Site preview'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }

export default async function DefaultOgImage() {
  const payload = await getPayload({ config: configPromise })
  const [siteSettings, seoSettings] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
    payload.findGlobal({ slug: 'seo-settings', depth: 1 }),
  ])

  const siteName = siteSettings.siteName
  const description = seoSettings.defaultDescription ?? siteSettings.siteDescription ?? ''
  const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

  if (!logoImage) {
    return createOpenGraphFallbackResponse()
  }

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
      {/* Top — logo or site name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src={logoImage.src}
          alt={siteName}
          width={logoImage.width}
          height={logoImage.height}
          style={{ height: 36, maxWidth: 180, objectFit: 'contain', width: 'auto' }}
        />
      </div>

      {/* Bottom — title + description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          {siteName}
        </div>
        {description ? (
          <div
            style={{
              fontSize: 24,
              color: '#9ca3af',
              lineHeight: 1.5,
              maxWidth: 800,
            }}
          >
            {description.length > 140 ? `${description.slice(0, 137)}…` : description}
          </div>
        ) : null}
      </div>
    </div>,
    { ...size },
  )
}
