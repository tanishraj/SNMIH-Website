import { describe, expect, it } from 'vitest'

import { getMediaAbsoluteUrl, getMediaImageProps, getOpenGraphMediaImage } from '@/lib/media'
import type { Media } from '@/payload-types'

const mediaWithURL = (url: string, updatedAt?: string): Media => ({ updatedAt, url }) as Media
const mediaImage = (url: string, width?: number | null, height?: number | null): Media =>
  ({ height, url, width }) as Media

const UPDATED_AT = '2026-09-01T12:34:56.789Z'

describe('media URL resolution', () => {
  it('preserves Payload root-relative media paths for same-origin Next images', () => {
    expect(getMediaAbsoluteUrl(mediaWithURL('/api/media/file/social-image.png'))).toBe(
      '/api/media/file/social-image.png',
    )
  })

  it('preserves absolute media URLs', () => {
    expect(getMediaAbsoluteUrl(mediaWithURL('https://cdn.example.com/social-image.png'))).toBe(
      'https://cdn.example.com/social-image.png',
    )
  })

  it('versions absolute image URLs with the Payload media update timestamp', () => {
    expect(
      getMediaImageProps({
        media: mediaWithURL('https://cdn.example.com/laboratory.avif', UPDATED_AT),
      })?.src,
    ).toBe(
      'https://cdn.example.com/laboratory.avif?v=2026-09-01T12%3A34%3A56.789Z',
    )
  })

  it('preserves existing image query parameters when adding the media version', () => {
    expect(
      getMediaImageProps({
        media: mediaWithURL(
          'https://cdn.example.com/laboratory.avif?fit=crop&width=1200',
          UPDATED_AT,
        ),
      })?.src,
    ).toBe(
      'https://cdn.example.com/laboratory.avif?fit=crop&width=1200&v=2026-09-01T12%3A34%3A56.789Z',
    )
  })

  it('keeps root-relative image paths unchanged when media has a version timestamp', () => {
    expect(
      getMediaImageProps({
        media: mediaWithURL('/api/media/file/laboratory.avif', UPDATED_AT),
      })?.src,
    ).toBe('/api/media/file/laboratory.avif')
  })

  it.each([
    ['missing', undefined],
    ['invalid', 'not-a-timestamp'],
  ])('keeps absolute image URLs unchanged when updatedAt is %s', (_label, updatedAt) => {
    expect(
      getMediaImageProps({
        media: mediaWithURL('https://cdn.example.com/laboratory.avif', updatedAt),
      })?.src,
    ).toBe('https://cdn.example.com/laboratory.avif')
  })

  it('omits root-relative media from build-time Open Graph images', () => {
    expect(
      getOpenGraphMediaImage(mediaImage('/api/media/file/social-image.png', 1200, 630)),
    ).toBeUndefined()
  })

  it('returns absolute Open Graph media with positive intrinsic dimensions', () => {
    expect(
      getOpenGraphMediaImage(mediaImage('https://cdn.example.com/social-image.avif', 1200, 630)),
    ).toEqual({
      height: 630,
      src: 'https://cdn.example.com/social-image.avif',
      width: 1200,
    })
  })

  it.each([
    ['missing width', undefined, 630],
    ['missing height', 1200, undefined],
    ['zero width', 0, 630],
    ['zero height', 1200, 0],
    ['negative width', -1, 630],
    ['negative height', 1200, -1],
  ])('omits Open Graph media with %s', (_label, width, height) => {
    expect(
      getOpenGraphMediaImage(
        mediaImage('https://cdn.example.com/social-image.avif', width, height),
      ),
    ).toBeUndefined()
  })
})
