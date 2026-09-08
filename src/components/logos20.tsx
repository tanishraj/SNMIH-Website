'use client'

// Adapted from @shadcnblocks/logos20: rows moving in alternating directions.
import { Pause, Play } from 'lucide-react'
import Image from 'next/image'
import { useState, useSyncExternalStore } from 'react'
import Marquee from 'react-fast-marquee'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentSectionHeadingClasses,
  contentSectionDescriptionClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Button } from '@/components/ui/button'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type Logos20Item = {
  id: string
  name: string
  image: { src: string; alt: string; width?: number; height?: number }
}

type Logos20Props = {
  additionalRows?: { id: string; logos: Logos20Item[] }[]
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  bottomRow: Logos20Item[]
  contentAlignment?: 'left' | 'center' | 'right' | null
  description?: string | null
  enableMotion?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  grayscale?: boolean | null
  logoHeight?: 'sm' | 'md' | 'lg' | null
  showLabels?: boolean | null
  size?: RegularBlockSize | null
  speed?: 'slow' | 'normal' | 'fast' | null
  title?: string | null
  topRow: Logos20Item[]
}

const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
const readMotion = () => window.matchMedia(motionQuery).matches
// Server-render a complete static list; animate only after hydration confirms the preference.
const serverMotion = () => true
const alignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const
const heightClasses = { sm: 'h-8', md: 'h-12', lg: 'h-16' } as const
const speeds = { slow: 25, normal: 40, fast: 65 } as const

type LogoProps = {
  logo: Logos20Item
  grayscale: boolean
  height: string
  showLabels: boolean
  decorative?: boolean
}
function Logo({ logo, grayscale, height, showLabels, decorative }: LogoProps) {
  const [failedSource, setFailedSource] = useState<string>()
  const failed = failedSource === logo.image.src
  return (
    <div className="flex w-40 max-w-full flex-col items-center justify-center gap-3 text-center">
      {failed ? (
        <span
          className={cn(
            'flex items-center justify-center text-sm font-medium [overflow-wrap:anywhere]',
            height,
          )}
        >
          {logo.name}
        </span>
      ) : (
        <Image
          src={logo.image.src}
          alt={decorative || showLabels ? '' : logo.name}
          width={logo.image.width || 160}
          height={logo.image.height || 64}
          onError={() => setFailedSource(logo.image.src)}
          className={cn('w-full object-contain', height, grayscale && 'grayscale')}
        />
      )}
      {showLabels && !failed ? (
        <span className="text-sm leading-5 [overflow-wrap:anywhere]">{logo.name}</span>
      ) : null}
    </div>
  )
}

function MarqueeRow({
  logos,
  direction,
  animated,
  paused,
  speed,
  ...logoProps
}: {
  logos: Logos20Item[]
  direction: 'left' | 'right'
  animated: boolean
  paused: boolean
  speed: number
} & Omit<LogoProps, 'logo' | 'decorative'>) {
  if (!logos.length) return null
  return (
    <div
      data-logos20-row={direction}
      data-logos20-motion={animated ? 'animated' : 'static'}
      className="min-w-0"
    >
      {animated ? (
        <>
          <ul className="sr-only">
            {logos.map((logo) => (
              <li key={logo.id}>{logo.name}</li>
            ))}
          </ul>
          <div
            aria-hidden="true"
            className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
          >
            <Marquee
              direction={direction}
              speed={speed}
              pauseOnHover
              autoFill
              play={!paused}
              gradient={false}
            >
              {logos.map((logo) => (
                <div className="mx-8 flex items-center justify-center py-2 lg:mx-10" key={logo.id}>
                  <Logo {...logoProps} logo={logo} decorative />
                </div>
              ))}
            </Marquee>
          </div>
        </>
      ) : (
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((logo) => (
            <li key={logo.id}>
              <Logo {...logoProps} logo={logo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Logos20({
  additionalRows,
  accentTitle,
  actions,
  appearance,
  bottomRow,
  contentAlignment,
  description,
  enableMotion,
  eyebrow,
  footerActions,
  grayscale,
  logoHeight,
  showLabels,
  size,
  speed,
  title,
  topRow,
}: Logos20Props) {
  const [paused, setPaused] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion)
  const animated = enableMotion !== false && !reducedMotion
  const alignment = contentAlignment ?? 'center'
  const { className, background } = resolveBlockAppearanceClasses(appearance)
  const surface = resolveCardSurface('default', background)
  const headerActions = resolveCmsActions(actions)
  const endActions = resolveCmsActions(footerActions)
  const hasHeader =
    title?.trim() ||
    accentTitle?.trim() ||
    description?.trim() ||
    eyebrow?.trim() ||
    headerActions.length > 0
  const rowProps = {
    animated,
    paused,
    speed: speeds[speed ?? 'normal'],
    grayscale: grayscale ?? false,
    height: heightClasses[logoHeight ?? 'md'],
    showLabels: showLabels ?? false,
  }

  return (
    <section
      data-logos20="true"
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], className)}
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
        {hasHeader ? (
          <div
            className={cn(
              'flex w-full min-w-0 flex-col gap-4 [overflow-wrap:anywhere]',
              alignmentClasses[alignment],
            )}
          >
            {eyebrow?.trim() ? (
              <SectionEyebrow surface={background}>{eyebrow.trim()}</SectionEyebrow>
            ) : null}
            {title?.trim() || accentTitle?.trim() ? (
              <h2 className={contentSectionHeadingClasses}>
                {title?.trim()}
                {accentTitle?.trim() ? (
                  <>
                    {title?.trim() ? ' ' : ''}
                    <span className="italic">{accentTitle.trim()}</span>
                  </>
                ) : null}
              </h2>
            ) : null}
            {description?.trim() ? (
              <p className={cn(contentSectionDescriptionClasses, 'text-current/80')}>
                {description.trim()}
              </p>
            ) : null}
            <ContentActions
              actions={headerActions}
              alignment={alignment}
              buttonClassNames={surface.button}
              linkClassName={surface.link}
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col gap-8">
          <MarqueeRow logos={topRow} direction="left" {...rowProps} />
          <MarqueeRow logos={bottomRow} direction="right" {...rowProps} />
          {additionalRows?.map((row, index) => (
            <MarqueeRow
              key={row.id}
              logos={row.logos}
              direction={index % 2 === 0 ? 'left' : 'right'}
              {...rowProps}
            />
          ))}
          {animated ? (
            <div className="flex justify-center">
              <Button
                type="button"
                size="sm"
                className={surface.button.default}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? (
                  <Play data-icon="inline-start" aria-hidden="true" />
                ) : (
                  <Pause data-icon="inline-start" aria-hidden="true" />
                )}
                {paused ? 'Resume logos' : 'Pause logos'}
              </Button>
            </div>
          ) : null}
        </div>
        <ContentActions
          actions={endActions}
          alignment={alignment}
          buttonClassNames={surface.button}
          linkClassName={surface.link}
        />
      </div>
    </section>
  )
}
