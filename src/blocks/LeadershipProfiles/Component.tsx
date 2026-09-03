import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import type { CardSurfaceValue } from '@/blocks/shared/cardThemeFields'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

import type {
  LeadershipProfileImagePosition,
  LeadershipProfilesAlignment,
  LeadershipProfilesCardLayout,
  LeadershipProfilesColumns,
  ResolvedLeadershipProfile,
} from './types'

type ExpertiseValue = {
  id?: string | null
  item?: string | null
}

type LeadershipProfileValue = {
  cardBackground?: string | null
  designation?: string | null
  expertise?: ExpertiseValue[] | null
  id?: string | null
  image?: unknown
  imagePosition?: string | null
  leadershipLabel?: string | null
  name?: string | null
  qualification?: string | null
}

type LeadershipProfilesBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardBackground?: string | null
  cardLayout?: LeadershipProfilesCardLayout | null
  columns?: LeadershipProfilesColumns | null
  contentAlignment?: LeadershipProfilesAlignment | null
  description?: string | null
  descriptionPosition?: 'side' | 'underTitle' | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: 'split' | 'stacked' | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  profiles?: LeadershipProfileValue[] | null
  sideContentAlignment?: 'bottom' | 'top' | null
  size?: RegularBlockSize | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

const validColumns = new Set<LeadershipProfilesColumns>(['2', '3', '4'])
const validAlignments = new Set<LeadershipProfilesAlignment>(['left', 'center', 'right'])
const validCardLayouts = new Set<LeadershipProfilesCardLayout>(['standard', 'imageOverlay'])
const validImagePositions = new Set<LeadershipProfileImagePosition>([
  'center',
  'top',
  'bottom',
  'left',
  'right',
])
const validSizes = new Set<RegularBlockSize>(['none', 'compact', 'default', 'comfortable'])

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const stackedAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const gridClasses = {
  '2': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const

const imagePositionClasses = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
} as const

const imageSizes = {
  '2': '(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw',
  '3': '(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw',
  '4': '(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw',
} as const

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const satisfies Record<RegularBlockSize, string>

function LeadershipProfileCard({
  cardBackground,
  cardLayout,
  imageSizes,
  nameHeadingLevel,
  overlay,
  profile,
}: {
  cardBackground: CardSurfaceValue
  cardLayout: LeadershipProfilesCardLayout
  imageSizes: string
  nameHeadingLevel: 'h2' | 'h3'
  overlay: ReturnType<typeof resolveMediaOverlay>
  profile: ResolvedLeadershipProfile
}) {
  const surface = resolveCardSurface(cardBackground)
  const isDefault = surface.value === 'default'
  const NameHeading = nameHeadingLevel
  const staticAccentClass = surface.link
    .split(' ')
    .filter((token) => !token.startsWith('hover:'))
    .join(' ')

  if (cardLayout === 'imageOverlay') {
    return (
      <article
        className={cn(
          'relative isolate aspect-4/5 min-w-0 overflow-hidden rounded-card border border-current/20',
          overlay.text.title,
        )}
        data-block-surface={overlay.blockSurface}
        data-leadership-profile-card="true"
        data-leadership-profile-layout="imageOverlay"
      >
        <Image
          alt={profile.image.alt}
          className={cn('object-cover', imagePositionClasses[profile.imagePosition])}
          fill
          sizes={imageSizes}
          src={profile.image.src}
        />
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute z-10',
            overlay.frameClassName,
            overlay.className,
          )}
          data-leadership-profile-overlay={overlay.strength}
          data-leadership-profile-overlay-coverage={overlay.coverage}
          data-leadership-profile-overlay-direction={overlay.direction}
          data-leadership-profile-overlay-tone={overlay.tone}
        />
        <div className="absolute inset-0 z-20 flex min-w-0 flex-col justify-end gap-1 p-5 pt-20">
          {profile.leadershipLabel ? (
            <p
              className={cn(
                'wrap-break-word font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]',
                overlay.text.eyebrow,
              )}
              data-leadership-profile-label="true"
            >
              {profile.leadershipLabel}
            </p>
          ) : null}
          <NameHeading
            className={cn(
              'wrap-break-word font-sans text-lg leading-tight font-medium',
              overlay.text.title,
            )}
          >
            {profile.name}
          </NameHeading>
          {profile.designation ? (
            <p
              className={cn('wrap-break-word text-xs leading-5', overlay.text.secondary)}
              data-leadership-profile-designation="true"
            >
              {profile.designation}
            </p>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'flex h-full min-w-0 flex-col overflow-hidden rounded-card border',
        isDefault
          ? 'border-border bg-card text-card-foreground'
          : [surface.divider, surface.className],
      )}
      data-card-background={surface.value}
      data-card-surface={surface.value}
      data-leadership-profile-card="true"
      data-leadership-profile-layout="standard"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        <Image
          alt={profile.image.alt}
          className={cn('object-cover', imagePositionClasses[profile.imagePosition])}
          fill
          sizes={imageSizes}
          src={profile.image.src}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex min-w-0 flex-col gap-2">
          {profile.leadershipLabel ? (
            <p
              className={cn(
                'wrap-break-word font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]',
                staticAccentClass,
              )}
              data-leadership-profile-accent-surface={surface.value}
              data-leadership-profile-label="true"
            >
              {profile.leadershipLabel}
            </p>
          ) : null}
          <NameHeading className="wrap-break-word font-sans text-lg leading-tight font-semibold text-current">
            {profile.name}
          </NameHeading>
          {profile.designation ? (
            <p
              className={cn('wrap-break-word text-xs leading-5 font-medium', staticAccentClass)}
              data-leadership-profile-accent-surface={surface.value}
              data-leadership-profile-designation="true"
            >
              {profile.designation}
            </p>
          ) : null}
        </div>

        {profile.qualification || profile.expertise.length ? (
          <dl className="flex min-w-0 flex-col gap-1.5">
            {profile.qualification ? (
              <div>
                <dt className="sr-only">Qualification</dt>
                <dd
                  className={cn(
                    'wrap-break-word text-xs leading-5',
                    isDefault ? 'text-muted-foreground' : surface.secondary,
                  )}
                  data-leadership-profile-qualification="true"
                >
                  {profile.qualification}
                </dd>
              </div>
            ) : null}
            {profile.expertise.length ? (
              <div>
                <dt className="sr-only">Expertise</dt>
                <dd data-leadership-profile-expertise="true">
                  <ul
                    aria-label={`${profile.name} expertise`}
                    className={cn(
                      'flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5',
                      isDefault ? 'text-muted-foreground' : surface.secondary,
                    )}
                  >
                    {profile.expertise.map((item, index) => (
                      <li
                        className="inline-flex max-w-full min-w-0 items-baseline gap-2"
                        key={`${item}-${index}`}
                      >
                        <span className="min-w-0 wrap-break-word">{item}</span>
                        {index < profile.expertise.length - 1 ? (
                          <span aria-hidden="true" className="shrink-0">
                            ·
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </article>
  )
}

export function LeadershipProfilesBlockComponent({
  accentTitle,
  actions,
  appearance,
  cardBackground,
  cardLayout = 'standard',
  columns = '3',
  contentAlignment = 'left',
  description,
  descriptionPosition = 'side',
  eyebrow,
  footerActions,
  headerLayout = 'split',
  overlayCoverage = 'full',
  overlayDirection = 'bottomToTop',
  overlayStyle = 'dark',
  profiles,
  sideContentAlignment = 'bottom',
  size = 'default',
  themeMode = 'dark',
  title,
}: LeadershipProfilesBlockLike) {
  const resolvedProfiles = (profiles ?? []).flatMap(
    (profile, index): ResolvedLeadershipProfile[] => {
      const name = profile.name?.trim()
      if (!name) return []

      const image = getMediaImageProps({
        fallbackAlt: name,
        media: profile.image as Media | string | number | null | undefined,
        preset: 'generic',
      })
      if (!image) return []

      const imagePosition = validImagePositions.has(
        profile.imagePosition as LeadershipProfileImagePosition,
      )
        ? (profile.imagePosition as LeadershipProfileImagePosition)
        : 'center'

      return [
        {
          designation: profile.designation?.trim() || undefined,
          expertise: (profile.expertise ?? [])
            .flatMap(({ item }) => (item?.trim() ? [item.trim()] : []))
            .slice(0, 3),
          id: profile.id ?? index,
          image,
          imagePosition,
          leadershipLabel: profile.leadershipLabel?.trim() || undefined,
          name,
          qualification: profile.qualification?.trim() || undefined,
        },
      ]
    },
  )
  if (!resolvedProfiles.length) return null

  const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const legacyCardBackground = profiles?.find((profile) => profile.cardBackground)?.cardBackground
  const resolvedCardBackground = resolveCardSurface(cardBackground ?? legacyCardBackground).value
  const resolvedCardLayout = validCardLayouts.has(cardLayout ?? 'standard')
    ? (cardLayout ?? 'standard')
    : 'standard'
  const resolvedOverlay = resolveMediaOverlay({
    coverage: overlayCoverage ?? 'full',
    direction: overlayDirection ?? 'bottomToTop',
    sectionBackground: background,
    strength: overlayStyle ?? 'dark',
    tone: themeMode ?? 'dark',
  })
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedAlignment = validAlignments.has(contentAlignment ?? 'left')
    ? (contentAlignment ?? 'left')
    : 'left'
  const resolvedColumns = validColumns.has(columns ?? '3') ? (columns ?? '3') : '3'
  const resolvedDescription = description?.trim()
  const resolvedDescriptionPosition = descriptionPosition === 'underTitle' ? 'underTitle' : 'side'
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedHeaderLayout = headerLayout === 'stacked' ? 'stacked' : 'split'
  const resolvedSideAlignment = sideContentAlignment === 'top' ? 'top' : 'bottom'
  const resolvedSize = validSizes.has(size ?? 'default') ? (size ?? 'default') : 'default'
  const resolvedTitle = title?.trim()
  const hasHeading = Boolean(resolvedTitle || resolvedAccentTitle)
  const hasHeader = Boolean(
    resolvedEyebrow || hasHeading || resolvedDescription || resolvedActions.length,
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}
      data-leadership-profiles="true"
    >
      <div className={regularBlockContainerClasses}>
        <div className={cn('flex flex-col', hasHeader && sectionGapClasses[resolvedSize])}>
          {hasHeader ? (
            <header
              className={cn(
                'grid gap-6',
                resolvedHeaderLayout === 'split'
                  ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:items-end lg:gap-16'
                  : cn('w-full max-w-3xl', stackedAlignmentClasses[resolvedAlignment]),
              )}
              data-leadership-profiles-header={resolvedHeaderLayout}
            >
              <div
                className={cn(contentIntroClasses, alignmentClasses[resolvedAlignment])}
                data-content-alignment={resolvedAlignment}
              >
                {resolvedEyebrow ? (
                  <SectionEyebrow surface={background}>{resolvedEyebrow}</SectionEyebrow>
                ) : null}
                {hasHeading ? (
                  <h2 className={contentSectionHeadingClasses}>
                    {resolvedTitle ? (
                      <span className="block font-[inherit]">{resolvedTitle}</span>
                    ) : null}
                    {resolvedAccentTitle ? (
                      <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                    ) : null}
                  </h2>
                ) : null}
                {resolvedDescription &&
                (resolvedHeaderLayout === 'stacked' ||
                  resolvedDescriptionPosition === 'underTitle') ? (
                  <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
                ) : null}
                {resolvedHeaderLayout === 'stacked' ? (
                  <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
                ) : null}
              </div>

              {resolvedHeaderLayout === 'split' &&
              ((resolvedDescriptionPosition === 'side' && resolvedDescription) ||
                resolvedActions.length) ? (
                <div
                  className={cn(
                    contentIntroClasses,
                    'max-w-xl',
                    resolvedDescriptionPosition === 'underTitle'
                      ? 'ml-auto w-full items-end text-right'
                      : alignmentClasses[resolvedAlignment],
                    resolvedSideAlignment === 'top' ? 'lg:self-start' : 'lg:self-end lg:pb-1',
                  )}
                  data-leadership-profiles-side-alignment={resolvedSideAlignment}
                >
                  {resolvedDescriptionPosition === 'side' && resolvedDescription ? (
                    <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
                  ) : null}
                  <ContentActions
                    actions={resolvedActions}
                    alignment={
                      resolvedDescriptionPosition === 'underTitle' ? 'right' : resolvedAlignment
                    }
                  />
                </div>
              ) : null}
            </header>
          ) : null}

          <div
            className={cn('grid gap-6', gridClasses[resolvedColumns])}
            data-leadership-profiles-grid="true"
          >
            {resolvedProfiles.map((profile) => (
              <LeadershipProfileCard
                cardBackground={resolvedCardBackground}
                cardLayout={resolvedCardLayout}
                imageSizes={imageSizes[resolvedColumns]}
                key={profile.id}
                nameHeadingLevel={hasHeading ? 'h3' : 'h2'}
                overlay={resolvedOverlay}
                profile={profile}
              />
            ))}
          </div>
        </div>

        <div data-leadership-profiles-footer-actions="true">
          <BlockFooterActions actions={footerActions} alignment="center" />
        </div>
      </div>
    </section>
  )
}
