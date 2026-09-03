import Image from 'next/image'

import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'

export type LogoMediaLike =
  | {
      alt?: string | null
      height?: number | null
      updatedAt?: string | null
      url?: string | null
      width?: number | null
    }
  | Media
  | null
  | number
  | string

type SiteLogoProps = {
  customDark?: LogoMediaLike
  customLight?: LogoMediaLike
  fallbackText: string
  height: number
  mode: 'siteDefault' | 'customLogo'
  siteLogo?: LogoMediaLike
}

const getLogoImageProps = (
  media: LogoMediaLike | undefined,
  fallbackText: string,
  displayHeight: number,
) => {
  if (!media || typeof media !== 'object') {
    return undefined
  }

  const image = getMediaImageProps({
    fallbackAlt: fallbackText,
    media: media as Media,
    preset: 'logo',
  })

  if (!image) {
    return undefined
  }

  const sourceWidth = typeof image.width === 'number' && image.width > 0 ? image.width : null
  const sourceHeight = typeof image.height === 'number' && image.height > 0 ? image.height : null
  const fallbackSize = Math.max(1, Math.round(displayHeight))
  const width = sourceWidth ?? fallbackSize
  const height = sourceHeight ?? fallbackSize
  const renderedWidth =
    sourceWidth && sourceHeight
      ? Math.max(1, Math.round(displayHeight * (sourceWidth / sourceHeight)))
      : fallbackSize

  return {
    alt: image.alt,
    height,
    sizes: `${renderedWidth}px`,
    src: image.src,
    width,
  }
}

export function SiteLogo({
  customDark,
  customLight,
  fallbackText,
  height,
  mode,
  siteLogo,
}: SiteLogoProps) {
  const lightLogo = mode === 'customLogo' ? customLight : siteLogo
  const darkLogo = mode === 'customLogo' ? customDark || customLight : siteLogo

  const lightImage = getLogoImageProps(lightLogo, fallbackText, height)
  const darkImage = getLogoImageProps(darkLogo, fallbackText, height)

  if (!lightImage) {
    return <span className="inline-flex items-center font-semibold tracking-tight text-foreground">{fallbackText}</span>
  }

  if (!darkImage || darkImage.src === lightImage.src) {
    return (
      <Image
        alt={lightImage.alt}
        className="block h-auto w-auto object-contain"
        src={lightImage.src}
        width={lightImage.width}
        height={lightImage.height}
        sizes={lightImage.sizes}
        style={{ height }}
      />
    )
  }

  return (
    <>
      <Image
        alt={lightImage.alt}
        className="block h-auto w-auto object-contain dark:hidden"
        src={lightImage.src}
        width={lightImage.width}
        height={lightImage.height}
        sizes={lightImage.sizes}
        style={{ height }}
      />
      <Image
        alt={darkImage.alt}
        className="hidden h-auto w-auto object-contain dark:block"
        src={darkImage.src}
        width={darkImage.width}
        height={darkImage.height}
        sizes={darkImage.sizes}
        style={{ height }}
      />
    </>
  )
}
