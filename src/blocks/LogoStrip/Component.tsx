import Image from 'next/image'

import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import {
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

import { LogoStripMarquee, type ResolvedLogo } from './LogoStripMarquee'

type LogoItem = {
  id?: string | null
  image?: unknown
  label?: string | null
  openInNewTab?: boolean | null
  url?: string | null
}

type LogoStripBlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  displayMode?: 'grid' | 'marquee' | null
  eyebrow?: string | null
  grayscale?: boolean | null
  logoHeight?: 'sm' | 'md' | 'lg' | null
  logos?: LogoItem[] | null
  showLabels?: boolean | null
  size?: RegularBlockSize | null
  title?: string | null
}

const logoHeightClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
} as const

export function LogoStripBlockComponent({
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  displayMode = 'marquee',
  eyebrow,
  grayscale = true,
  logoHeight = 'md',
  logos,
  showLabels = false,
  size = 'default',
  title,
}: LogoStripBlockLike) {
  const resolvedLogos: ResolvedLogo[] = (logos ?? []).flatMap((item, index): ResolvedLogo[] => {
    const media = item.image as Media | null | undefined
    if (!isMediaDoc(media)) return []

    const image = getMediaImageProps({ fallbackAlt: item.label, media, preset: 'logo' })
    if (!image) return []

    return [
      {
        id: item.id ?? index,
        src: image.src,
        alt: image.alt,
        label: item.label?.trim() || undefined,
        url: item.url?.trim() || undefined,
        openInNewTab: item.openInNewTab ?? true,
      },
    ]
  })

  if (resolvedLogos.length === 0) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedSize: RegularBlockSize = size ?? 'default'
  const heightClass = logoHeightClasses[logoHeight ?? 'md']
  const isCenter = (contentAlignment ?? 'center') === 'center'
  const resolvedActions = resolveCmsActions(actions)
  const hasHeader = eyebrow?.trim() || title?.trim() || description?.trim() || resolvedActions.length > 0

  return (
    <section className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}>
      <div className="mx-auto w-full max-w-screen-2xl px-4">
        {hasHeader ? (
          <div className={cn('mb-10 flex flex-col gap-4', isCenter ? 'mx-auto max-w-3xl items-center text-center' : 'items-start')}>
            {eyebrow?.trim() ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>
                {eyebrow.trim()}
              </SectionEyebrow>
            ) : null}
            {title?.trim() ? (
              <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                {title.trim()}
              </h2>
            ) : null}
            {description?.trim() ? (
              <p className="text-base leading-7 text-current/70">{description.trim()}</p>
            ) : null}
            {resolvedActions.length > 0 ? (
              <div className="mt-2">
                <ContentActions actions={resolvedActions} />
              </div>
            ) : null}
          </div>
        ) : null}

        {displayMode === 'marquee' ? (
          <LogoStripMarquee
            grayscale={grayscale ?? true}
            logoHeightClass={heightClass}
            logos={resolvedLogos}
            showLabels={showLabels ?? false}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8">
            {resolvedLogos.map((logo) => {
              const image = (
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={64}
                  className={cn(
                    'w-auto object-contain transition-all duration-300 dark:brightness-0 dark:invert',
                    heightClass,
                    grayscale && 'grayscale hover:grayscale-0',
                  )}
                />
              )

              const wrapper = logo.url ? (
                <a
                  href={logo.url}
                  target={logo.openInNewTab ? '_blank' : undefined}
                  rel={logo.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="opacity-70 transition-opacity hover:opacity-100"
                >
                  {image}
                </a>
              ) : (
                <div className="opacity-70 transition-opacity hover:opacity-90">{image}</div>
              )

              return (
                <div key={String(logo.id)} className="flex flex-col items-center gap-1.5">
                  {wrapper}
                  {showLabels && logo.label ? (
                    <span className="text-xs font-medium text-current/70">{logo.label}</span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
