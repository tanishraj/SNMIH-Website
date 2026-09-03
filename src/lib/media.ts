import { getSiteURL } from '@/lib/siteUrl'
import type { Media } from '@/payload-types'

export type MediaPreset = 'favicon' | 'generic' | 'hero' | 'logo' | 'seo' | 'system'

type ResolvedMediaImage = {
  alt: string
  src: string
  width?: number
  height?: number
}

const defaultSiteURL = getSiteURL()

export const isMediaDoc = (value: string | number | Media | null | undefined): value is Media => {
  return typeof value === 'object' && value !== null
}

export const getMediaAbsoluteUrl = (
  media: string | number | Media | null | undefined,
): string | undefined => {
  if (!isMediaDoc(media) || !media.url) {
    return undefined
  }

  const url = media.url.trim()

  if (url.startsWith('/')) {
    return url
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  return new URL(url, defaultSiteURL).toString()
}

const getVersionedMediaImageUrl = ({ media, src }: { media: Media; src: string }): string => {
  const updatedAt = typeof media.updatedAt === 'string' ? media.updatedAt.trim() : ''

  if (!/^https?:\/\//i.test(src) || !updatedAt || Number.isNaN(Date.parse(updatedAt))) {
    return src
  }

  const versionedURL = new URL(src)
  versionedURL.searchParams.set('v', updatedAt)

  return versionedURL.toString()
}

export type OpenGraphMediaImage = {
  src: string
  width: number
  height: number
}

export const getOpenGraphMediaImage = (
  media: string | number | Media | null | undefined,
): OpenGraphMediaImage | undefined => {
  if (
    !isMediaDoc(media) ||
    !media.url ||
    typeof media.width !== 'number' ||
    media.width <= 0 ||
    typeof media.height !== 'number' ||
    media.height <= 0
  ) {
    return undefined
  }

  const src = media.url.trim()

  if (!/^https?:\/\//i.test(src)) {
    return undefined
  }

  return {
    height: media.height,
    src,
    width: media.width,
  }
}

const getMediaAltFallback = (preset: MediaPreset): string => {
  switch (preset) {
    case 'favicon':
      return 'Favicon'
    case 'hero':
      return 'Hero image'
    case 'logo':
      return 'Site logo'
    case 'seo':
      return 'Social sharing image'
    case 'system':
      return 'System page image'
    default:
      return 'Media asset'
  }
}

export const getMediaImageProps = ({
  media,
  preset = 'generic',
  fallbackAlt,
}: {
  fallbackAlt?: string | null
  media: string | number | Media | null | undefined
  preset?: MediaPreset
}): ResolvedMediaImage | undefined => {
  const absoluteUrl = getMediaAbsoluteUrl(media)

  if (!absoluteUrl) {
    return undefined
  }

  const src = isMediaDoc(media)
    ? getVersionedMediaImageUrl({ media, src: absoluteUrl })
    : absoluteUrl

  const alt =
    (isMediaDoc(media) ? media.alt?.trim() : '') || fallbackAlt?.trim() || getMediaAltFallback(preset)

  return {
    alt,
    src,
    width: isMediaDoc(media) && typeof media.width === 'number' ? media.width : undefined,
    height: isMediaDoc(media) && typeof media.height === 'number' ? media.height : undefined,
  }
}
