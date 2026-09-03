import Image from 'next/image'
import { UserRound } from 'lucide-react'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { cn } from '@/lib/utils'

import type {
  DepartmentProfilesCardFrame,
  DepartmentProfilesCardLayout,
  DepartmentProfilesCardSize,
  ResolvedDepartmentProfile,
} from './types'

type DepartmentProfileCardProps = {
  background: BlockBackground
  frame: DepartmentProfilesCardFrame
  hasSectionHeading: boolean
  imageSizes: string
  layout: DepartmentProfilesCardLayout
  overlayCoverage: MediaOverlayCoverage
  overlayDirection: MediaOverlayDirection
  overlayStyle: MediaOverlayStrength
  profile: ResolvedDepartmentProfile
  size: DepartmentProfilesCardSize
  themeMode: MediaOverlayTone
}

const imagePositionClasses = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
} as const

const overlaySizeClasses = {
  lg: {
    card: 'aspect-4/5 sm:aspect-3/4',
    content: 'gap-1 p-5 pt-20',
    department: 'text-xs leading-5',
    designation: 'text-xs leading-5',
    name: 'text-lg leading-tight',
  },
  md: {
    card: 'aspect-4/5 sm:aspect-3/4',
    content: 'gap-1 p-4 pt-16',
    department: 'text-[0.6875rem] leading-4',
    designation: 'text-xs leading-4',
    name: 'text-base leading-tight',
  },
  sm: {
    card: 'aspect-4/5 sm:aspect-3/4',
    content: 'gap-0.5 p-3.5 pt-12',
    department: 'text-[0.625rem] leading-4',
    designation: 'text-[0.6875rem] leading-4',
    name: 'text-sm leading-tight',
  },
} as const

const inlineSizeClasses = {
  lg: {
    card: 'gap-5 p-5',
    department: 'text-[0.6875rem] leading-4',
    designation: 'text-sm leading-5',
    image: 'size-24',
    imageSizes: '96px',
    name: 'text-lg leading-tight',
  },
  md: {
    card: 'gap-4 p-4',
    department: 'text-[0.625rem] leading-4',
    designation: 'text-xs leading-4',
    image: 'size-20',
    imageSizes: '80px',
    name: 'text-base leading-tight',
  },
  sm: {
    card: 'gap-3 p-3',
    department: 'text-[0.625rem] leading-4',
    designation: 'text-xs leading-4',
    image: 'size-16',
    imageSizes: '64px',
    name: 'text-sm leading-tight',
  },
} as const

type ProfileMediaProps = {
  className?: string
  imageSizes: string
  placeholderClassName?: string
  profile: ResolvedDepartmentProfile
}

function ProfileMedia({ className, imageSizes, placeholderClassName, profile }: ProfileMediaProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {profile.image ? (
        <Image
          alt={profile.image.alt}
          className={cn('object-cover', imagePositionClasses[profile.imagePosition])}
          fill
          sizes={imageSizes}
          src={profile.image.src}
        />
      ) : (
        <div
          className={cn(
            'flex size-full items-center justify-center',
            placeholderClassName ?? 'bg-muted text-muted-foreground',
          )}
          data-department-profile-placeholder="true"
        >
          <UserRound aria-hidden="true" className="size-1/3" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}

export function DepartmentProfileCard({
  background,
  frame,
  hasSectionHeading,
  imageSizes,
  layout,
  overlayCoverage,
  overlayDirection,
  overlayStyle,
  profile,
  size,
  themeMode,
}: DepartmentProfileCardProps) {
  const NameHeading = hasSectionHeading ? 'h3' : 'h2'

  if (layout === 'inline') {
    const inlineSize = inlineSizeClasses[size]
    const isBoxed = frame === 'boxed'
    const surface = resolveCardSurface(isBoxed ? 'muted' : 'default', background)

    return (
      <article
        className={cn(
          'flex min-w-0 items-center',
          isBoxed ? 'rounded-card border' : 'h-full',
          inlineSize.card,
          surface.className,
          isBoxed && surface.divider,
        )}
        data-department-profile-card="true"
        data-department-profile-frame={frame}
        data-department-profile-layout="inline"
        data-department-profile-size={size}
        data-testid="department-profile-card"
      >
        <ProfileMedia
          className={cn('shrink-0 rounded-compact', inlineSize.image)}
          imageSizes={inlineSize.imageSizes}
          placeholderClassName={cn('bg-current/10', surface.secondary)}
          profile={profile}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <NameHeading
            className={cn('wrap-break-word font-sans font-medium text-current', inlineSize.name)}
          >
            {profile.name}
          </NameHeading>
          {profile.designation ? (
            <p className={cn('wrap-break-word', surface.secondary, inlineSize.designation)}>
              {profile.designation}
            </p>
          ) : null}
          <p
            className={cn(
              'wrap-break-word mt-0.5 font-mono font-semibold uppercase tracking-[0.14em]',
              surface.icon,
              inlineSize.department,
            )}
            data-department-profile-accent-surface="inline"
            data-department-profile-department="true"
          >
            {profile.departmentName}
          </p>
        </div>
      </article>
    )
  }

  const overlaySize = overlaySizeClasses[size]
  const resolvedOverlay = resolveMediaOverlay({
    coverage: overlayCoverage,
    direction: overlayDirection,
    sectionBackground: background,
    strength: overlayStyle,
    tone: themeMode,
  })

  return (
    <article
      className={cn(
        'relative isolate min-w-0 overflow-hidden',
        frame === 'boxed' && 'rounded-card border border-current/20',
        overlaySize.card,
        resolvedOverlay.text.title,
      )}
      data-block-surface={resolvedOverlay.blockSurface}
      data-department-profile-card="true"
      data-department-profile-frame={frame}
      data-department-profile-layout="overlay"
      data-department-profile-size={size}
      data-testid="department-profile-card"
    >
      <ProfileMedia className="absolute inset-0" imageSizes={imageSizes} profile={profile} />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute z-10',
          resolvedOverlay.frameClassName,
          resolvedOverlay.className,
        )}
        data-department-profile-overlay={resolvedOverlay.strength}
        data-department-profile-overlay-coverage={resolvedOverlay.coverage}
        data-department-profile-overlay-direction={resolvedOverlay.direction}
        data-department-profile-overlay-tone={resolvedOverlay.tone}
      />
      <div
        className={cn(
          'absolute inset-0 z-20 flex min-w-0 flex-col justify-end',
          overlaySize.content,
        )}
      >
        <p
          className={cn(
            'wrap-break-word font-mono font-semibold uppercase tracking-[0.16em]',
            overlaySize.department,
            resolvedOverlay.text.title,
          )}
          data-department-profile-accent-surface={resolvedOverlay.blockSurface}
          data-department-profile-department="true"
        >
          {profile.departmentName}
        </p>
        <NameHeading
          className={cn(
            'wrap-break-word font-sans font-medium',
            overlaySize.name,
            resolvedOverlay.text.title,
          )}
        >
          {profile.name}
        </NameHeading>
        {profile.designation ? (
          <p
            className={cn(
              'wrap-break-word',
              overlaySize.designation,
              resolvedOverlay.text.secondary,
            )}
          >
            {profile.designation}
          </p>
        ) : null}
      </div>
    </article>
  )
}
