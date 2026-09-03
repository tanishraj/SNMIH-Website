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

import { AcademicProgrammesClient } from './AcademicProgrammesClient'
import type {
  AcademicProgrammesViewMode,
  ResolvedAcademicProgramme,
  ResolvedProgrammeFact,
} from './types'

type ProgrammeFactValue = {
  icon?: string | null
  id?: string | null
  label?: string | null
  value?: string | null
}

type ProgrammeValue = Omit<CmsLinkValue, 'linkType'> & {
  badge?: string | null
  cardBackground?: string | null
  ctaLabel?: string | null
  description?: string | null
  duration?: string | null
  durationLabel?: string | null
  eyebrow?: string | null
  facts?: ProgrammeFactValue[] | null
  id?: string | null
  image?: unknown
  icon?: string | null
  intake?: string | null
  intakeLabel?: string | null
  linkType?: 'custom' | 'none' | 'page' | null
  title?: string | null
}

type AcademicProgrammesBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: '2' | '3' | '4' | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  descriptionPosition?: 'side' | 'underTitle' | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: 'split' | 'stacked' | null
  metadataPosition?: 'bottom' | 'flow' | null
  programmes?: ProgrammeValue[] | null
  showFilter?: boolean | null
  sideContentAlignment?: 'bottom' | 'top' | null
  size?: RegularBlockSize | null
  title?: string | null
  viewMode?: AcademicProgrammesViewMode | null
}

const validColumns = new Set<NonNullable<AcademicProgrammesBlockLike['columns']>>(['2', '3', '4'])

const contentAlignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const stackedHeaderAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const validContentAlignments = new Set<
  NonNullable<AcademicProgrammesBlockLike['contentAlignment']>
>(['left', 'center', 'right'])

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const satisfies Record<RegularBlockSize, string>

export function AcademicProgrammesBlockComponent({
  accentTitle,
  actions,
  appearance,
  columns = '3',
  contentAlignment = 'left',
  description,
  descriptionPosition = 'side',
  eyebrow,
  footerActions,
  headerLayout = 'split',
  metadataPosition = 'flow',
  programmes,
  showFilter = false,
  sideContentAlignment = 'bottom',
  size = 'default',
  title,
  viewMode = 'grid',
}: AcademicProgrammesBlockLike) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null

  const resolvedProgrammes = (programmes ?? []).flatMap(
    (programme, index): ResolvedAcademicProgramme[] => {
      const programmeTitle = programme.title?.trim()
      if (!programmeTitle) return []

      const image = getMediaImageProps({
        media: programme.image as Media | string | number | null | undefined,
        fallbackAlt: programmeTitle,
      })
      const destination = resolveCmsLink({
        linkType: programme.linkType === 'none' ? null : programme.linkType,
        openInNewTab: programme.openInNewTab,
        page: programme.page,
        url: programme.url,
      })

      return [
        {
          badge: programme.badge?.trim() || undefined,
          cardBackground: programme.cardBackground,
          ctaLabel: programme.ctaLabel?.trim() || 'Explore programme',
          description: programme.description?.trim() || undefined,
          duration: programme.duration?.trim() || undefined,
          durationLabel: programme.durationLabel?.trim() || 'Duration',
          eyebrow: programme.eyebrow?.trim() || undefined,
          facts: (programme.facts ?? [])
            .flatMap((fact): ResolvedProgrammeFact[] => {
              const label = fact.label?.trim()
              const value = fact.value?.trim()
              if (!label || !value) return []

              return [{ icon: fact.icon?.trim() || undefined, label, value }]
            })
            .slice(0, 4),
          href: destination.href,
          id: programme.id ?? index,
          image,
          icon: programme.icon?.trim() || undefined,
          intake: programme.intake?.trim() || undefined,
          intakeLabel: programme.intakeLabel?.trim() || 'Intake',
          openInNewTab: destination.openInNewTab ?? false,
          title: programmeTitle,
        },
      ]
    },
  )

  if (!resolvedProgrammes.length) return null

  const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedColumns = validColumns.has(columns ?? '3') ? (columns ?? '3') : '3'
  const resolvedContentAlignment = validContentAlignments.has(contentAlignment ?? 'left')
    ? (contentAlignment ?? 'left')
    : 'left'
  const resolvedDescription = description?.trim()
  const resolvedDescriptionPosition = descriptionPosition === 'underTitle' ? 'underTitle' : 'side'
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedHeaderLayout = headerLayout === 'stacked' ? 'stacked' : 'split'
  const resolvedMetadataPosition = metadataPosition === 'bottom' ? 'bottom' : 'flow'
  const resolvedSideContentAlignment = sideContentAlignment === 'top' ? 'top' : 'bottom'
  const resolvedSize = size ?? 'default'
  const resolvedViewMode: AcademicProgrammesViewMode =
    viewMode === 'list' || viewMode === 'detailedCards' ? viewMode : 'grid'

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}
      data-academic-programmes="true"
    >
      <div className={regularBlockContainerClasses}>
        <div className={cn('flex flex-col', sectionGapClasses[resolvedSize])}>
          <header
            className={cn(
              'grid gap-6',
              resolvedHeaderLayout === 'split'
                ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:items-end lg:gap-16'
                : cn('w-full max-w-3xl', stackedHeaderAlignmentClasses[resolvedContentAlignment]),
            )}
            data-academic-programmes-header={resolvedHeaderLayout}
          >
            <div
              className={cn(contentIntroClasses, contentAlignmentClasses[resolvedContentAlignment])}
              data-content-alignment={resolvedContentAlignment}
            >
              {resolvedEyebrow ? (
                <SectionEyebrow surface={background}>{resolvedEyebrow}</SectionEyebrow>
              ) : null}
              <h2 className={contentSectionHeadingClasses}>
                <span className="block font-[inherit]">{resolvedTitle}</span>
                {resolvedAccentTitle ? (
                  <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                ) : null}
              </h2>
              {resolvedHeaderLayout === 'stacked' && resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
              {resolvedHeaderLayout === 'split' &&
              resolvedDescriptionPosition === 'underTitle' &&
              resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
              {resolvedHeaderLayout === 'stacked' ? (
                <ContentActions actions={resolvedActions} alignment={resolvedContentAlignment} />
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
                    : contentAlignmentClasses[resolvedContentAlignment],
                  resolvedSideContentAlignment === 'top' ? 'lg:self-start' : 'lg:self-end lg:pb-1',
                )}
                data-academic-programmes-side-alignment={resolvedSideContentAlignment}
              >
                {resolvedDescriptionPosition === 'side' && resolvedDescription ? (
                  <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
                ) : null}
                <ContentActions
                  actions={resolvedActions}
                  alignment={
                    resolvedDescriptionPosition === 'underTitle'
                      ? 'right'
                      : resolvedContentAlignment
                  }
                />
              </div>
            ) : null}
          </header>

          <AcademicProgrammesClient
            background={background}
            columns={resolvedColumns}
            contentAlignment={resolvedContentAlignment}
            metadataPosition={resolvedMetadataPosition}
            programmes={resolvedProgrammes}
            showFilter={showFilter ?? false}
            viewMode={resolvedViewMode}
          />
        </div>
        <div data-academic-programmes-footer-actions="true">
          <BlockFooterActions actions={footerActions} alignment="center" />
        </div>
      </div>
    </section>
  )
}
