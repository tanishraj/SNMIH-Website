'use client'

import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

export type ResolvedLogo = {
  id: string | number
  src: string
  alt: string
  label?: string
  url?: string
  openInNewTab?: boolean
}

type LogoItemProps = {
  duplicate?: boolean
  grayscale: boolean
  logo: ResolvedLogo
  logoHeightClass: string
  showLabels: boolean
}

function LogoItem({ duplicate = false, grayscale, logo, logoHeightClass, showLabels }: LogoItemProps) {
  const image = (
    <Image
      src={logo.src}
      alt={duplicate ? '' : logo.alt}
      width={120}
      height={64}
      className={cn(
        'w-auto object-contain transition-all duration-300 dark:brightness-0 dark:invert',
        logoHeightClass,
        grayscale && 'grayscale hover:grayscale-0',
      )}
    />
  )

  const content = (
    <div className="flex flex-col items-center gap-1.5">
      {logo.url ? (
        <a
          href={logo.url}
          target={logo.openInNewTab ? '_blank' : undefined}
          rel={logo.openInNewTab ? 'noopener noreferrer' : undefined}
          tabIndex={duplicate ? -1 : undefined}
          aria-hidden={duplicate || undefined}
          className="flex items-center opacity-70 transition-opacity hover:opacity-100"
        >
          {image}
        </a>
      ) : (
        <div className="flex items-center opacity-70 transition-opacity hover:opacity-90">
          {image}
        </div>
      )}
      {showLabels && logo.label ? (
        <span aria-hidden={duplicate || undefined} className="text-xs font-medium text-muted-foreground">
          {logo.label}
        </span>
      ) : null}
    </div>
  )

  return content
}

type LogoStripMarqueeProps = {
  grayscale: boolean
  logoHeightClass: string
  logos: ResolvedLogo[]
  showLabels: boolean
}

// Repeat logos until each track has at least MIN_PER_TRACK items, so the
// track is always wider than the viewport and the loop has no visible gap.
const MIN_PER_TRACK = 10
const BASE_DURATION_S = 25

export function LogoStripMarquee({ grayscale, logoHeightClass, logos, showLabels }: LogoStripMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false)

  const reps = Math.max(1, Math.ceil(MIN_PER_TRACK / logos.length))
  const trackLogos = reps > 1
    ? Array.from({ length: reps }, () => logos).flat()
    : logos
  // Scale duration so visual speed stays constant regardless of how many reps
  const duration = `${BASE_DURATION_S * reps}s`

  const track = (duplicate: boolean) => (
    <div
      aria-hidden={duplicate || undefined}
      className="flex shrink-0 animate-marquee items-center gap-10 pr-10"
      style={{ animationPlayState: isPaused ? 'paused' : 'running', animationDuration: duration }}
    >
      {trackLogos.map((logo, i) => (
        <LogoItem
          key={`${duplicate ? 'dup' : 'pri'}-${i}`}
          duplicate={duplicate}
          grayscale={grayscale}
          logo={logo}
          logoHeightClass={logoHeightClass}
          showLabels={showLabels}
        />
      ))}
    </div>
  )

  return (
    <div
      className="flex w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex w-max min-w-full items-center">
        {track(false)}
        {track(true)}
      </div>
    </div>
  )
}
