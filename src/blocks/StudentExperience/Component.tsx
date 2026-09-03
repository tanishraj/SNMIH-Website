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
import {
  resolveCmsActions,
  resolveCmsLink,
  type CmsActionValue,
  type CmsLinkValue,
} from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

type ContentAlignment = 'center' | 'left' | 'right'
type CardHeight = 'comfortable' | 'compact' | 'default'
type ImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
type LegacyOverlayStrength = 'default' | 'soft' | 'strong'

type ExperienceValue = Omit<CmsLinkValue, 'linkType'> & {
  id?: string | null
  image?: unknown
  imagePosition?: ImagePosition | null
  linkType?: 'custom' | 'none' | 'page' | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStrength?: LegacyOverlayStrength | MediaOverlayStrength | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

type StudentExperienceBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardHeight?: CardHeight | null
  contentAlignment?: ContentAlignment | null
  description?: string | null
  eyebrow?: string | null
  experiences?: ExperienceValue[] | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: 'split' | 'stacked' | null
  showNumbers?: boolean | null
  size?: RegularBlockSize | null
  title?: string | null
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const stackedHeaderAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const gridRowClasses = {
  compact: 'auto-rows-[15rem] sm:auto-rows-[17rem] xl:auto-rows-[14rem]',
  default: 'auto-rows-[18rem] sm:auto-rows-[20rem] xl:auto-rows-[17rem]',
  comfortable: 'auto-rows-[21rem] sm:auto-rows-[23rem] xl:auto-rows-[20rem]',
} as const

const imagePositionClasses = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
} as const

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const satisfies Record<RegularBlockSize, string>

const validAlignments = new Set<ContentAlignment>(['left', 'center', 'right'])
const validCardHeights = new Set<CardHeight>(['compact', 'default', 'comfortable'])
const validImagePositions = new Set<ImagePosition>(['center', 'top', 'bottom', 'left', 'right'])

export function StudentExperienceBlockComponent({
  accentTitle,
  actions,
  appearance,
  cardHeight = 'default',
  contentAlignment = 'left',
  description,
  eyebrow,
  experiences,
  footerActions,
  headerLayout = 'split',
  showNumbers = true,
  size = 'default',
  title,
}: StudentExperienceBlockLike) {
  const resolvedExperiences = (experiences ?? []).flatMap((experience, index) => {
    const resolvedTitle = experience.title?.trim()
    const media = experience.image as Media | number | string | null | undefined
    const image = getMediaImageProps({ media, fallbackAlt: resolvedTitle, preset: 'generic' })

    if (!resolvedTitle || !image) return []

    const destination = resolveCmsLink({
      linkType: experience.linkType === 'none' ? null : experience.linkType,
      openInNewTab: experience.openInNewTab,
      page: experience.page,
      url: experience.url,
    })

    return [
      {
        href: destination.href,
        id: experience.id ?? `${image.src}-${index}`,
        image,
        imagePosition: validImagePositions.has(experience.imagePosition as ImagePosition)
          ? (experience.imagePosition as ImagePosition)
          : 'center',
        openInNewTab: destination.openInNewTab ?? false,
        overlayCoverage: experience.overlayCoverage,
        overlayDirection: experience.overlayDirection,
        overlayStrength: experience.overlayStrength,
        themeMode: experience.themeMode,
        title: resolvedTitle,
      },
    ]
  })

  if (!resolvedExperiences.length) return null

  const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAlignment = validAlignments.has(contentAlignment as ContentAlignment)
    ? (contentAlignment as ContentAlignment)
    : 'left'
  const resolvedCardHeight = validCardHeights.has(cardHeight as CardHeight)
    ? (cardHeight as CardHeight)
    : 'default'
  const resolvedDescription = description?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedHeaderLayout = headerLayout === 'stacked' ? 'stacked' : 'split'
  const resolvedSize = size ?? 'default'
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const visibleExperiences = resolvedExperiences.slice(0, 5)
  const usesEditorialMosaic = visibleExperiences.length >= 4
  const hasHeader = Boolean(
    resolvedEyebrow ||
    resolvedTitle ||
    resolvedAccentTitle ||
    resolvedDescription ||
    resolvedActions.length,
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}
      data-student-experience="true"
      data-student-experience-card-height={resolvedCardHeight}
      data-student-experience-header={resolvedHeaderLayout}
    >
      <div
        className={cn(
          regularBlockContainerClasses,
          'flex flex-col',
          sectionGapClasses[resolvedSize],
        )}
      >
        {hasHeader ? (
          <header
            className={cn(
              'grid gap-6',
              resolvedHeaderLayout === 'split'
                ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:items-end lg:gap-16'
                : cn('w-full max-w-3xl', stackedHeaderAlignmentClasses[resolvedAlignment]),
            )}
            data-student-experience-content-alignment={resolvedAlignment}
          >
            <div className={cn(contentIntroClasses, alignmentClasses[resolvedAlignment])}>
              {resolvedEyebrow ? (
                <SectionEyebrow surface={background}>{resolvedEyebrow}</SectionEyebrow>
              ) : null}
              {resolvedTitle || resolvedAccentTitle ? (
                <h2 className={contentSectionHeadingClasses}>
                  {resolvedTitle ? (
                    <span className="block font-[inherit]">{resolvedTitle}</span>
                  ) : null}
                  {resolvedAccentTitle ? (
                    <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                  ) : null}
                </h2>
              ) : null}
              {resolvedHeaderLayout === 'stacked' && resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
              {resolvedHeaderLayout === 'stacked' ? (
                <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
              ) : null}
            </div>

            {resolvedHeaderLayout === 'split' && (resolvedDescription || resolvedActions.length) ? (
              <div
                className={cn(
                  contentIntroClasses,
                  'max-w-xl lg:pb-1',
                  alignmentClasses[resolvedAlignment],
                )}
              >
                {resolvedDescription ? (
                  <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
                ) : null}
                <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
              </div>
            ) : null}
          </header>
        ) : null}

        <div
          className={cn(
            'grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
            gridRowClasses[resolvedCardHeight],
          )}
          data-student-experience-grid-layout={usesEditorialMosaic ? 'mosaic' : 'balanced'}
          data-student-experience-grid="true"
        >
          {visibleExperiences.map((experience, index) => {
            const overlay = resolveMediaOverlay({
              coverage: experience.overlayCoverage,
              direction: experience.overlayDirection ?? 'bottomToTop',
              sectionBackground: background,
              strength: experience.overlayStrength,
              tone: experience.themeMode,
            })
            const cardContent = (
              <>
                <Image
                  alt={experience.image.alt}
                  className={cn(
                    'object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out group-hover/student-experience:scale-[1.025] group-focus-visible/student-experience:scale-[1.025]',
                    imagePositionClasses[experience.imagePosition],
                  )}
                  fill
                  sizes={
                    index === 0
                      ? '(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 34vw'
                      : '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'
                  }
                  src={experience.image.src}
                />
                <div
                  className={cn(
                    'pointer-events-none absolute',
                    overlay.frameClassName,
                    overlay.className,
                  )}
                  data-student-experience-overlay-coverage={overlay.coverage}
                  data-student-experience-overlay-direction={overlay.direction}
                  data-student-experience-overlay-strength={overlay.strength}
                  data-student-experience-overlay-tone={overlay.tone}
                />
                <div
                  className={cn(
                    'pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 p-6 text-left sm:p-7',
                    overlay.text.title,
                  )}
                  data-block-surface={overlay.blockSurface}
                >
                  {(showNumbers ?? true) ? (
                    <SectionEyebrow surface={overlay.eyebrowSurface}>
                      {String(index + 1).padStart(2, '0')}
                    </SectionEyebrow>
                  ) : null}
                  <h3
                    className={cn(
                      'font-sans text-lg leading-tight font-semibold tracking-tight text-balance sm:text-xl',
                      overlay.text.title,
                    )}
                  >
                    {experience.title}
                  </h3>
                </div>
              </>
            )

            const cardClasses = cn(
              'group/student-experience relative h-full min-h-0 overflow-hidden rounded-card bg-muted',
              usesEditorialMosaic && index === 0 && 'sm:col-span-2 xl:col-span-1 xl:row-span-2',
              experience.href &&
                'block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
            )

            return experience.href ? (
              <a
                aria-label={experience.title}
                className={cardClasses}
                href={experience.href}
                key={experience.id}
                rel={experience.openInNewTab ? 'noopener noreferrer' : undefined}
                target={experience.openInNewTab ? '_blank' : undefined}
              >
                {cardContent}
              </a>
            ) : (
              <article className={cardClasses} key={experience.id}>
                {cardContent}
              </article>
            )
          })}
        </div>

        <BlockFooterActions actions={footerActions} className="mt-0" />
      </div>
    </section>
  )
}
