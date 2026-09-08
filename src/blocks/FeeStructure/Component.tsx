import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions } from '@/lib/cmsLinks'
import { resolveFeeDocumentPanel } from '@/blocks/shared/feeDocumentAction'
import { cn } from '@/lib/utils'

import { FeeStructureClient } from './FeeStructureClient'
import { FeeStructureDownload } from './FeeStructureDownload'
import { normalizeFeeCategories, normalizeProgrammeDetails } from './normalizeFeeStructure'
import type { FeeStructureBlockLike, FeeStructureLayout } from './types'

export function FeeStructureBlockComponent({
  academicSession,
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  downloadActionMode = 'button',
  downloadAppearance,
  downloadButtonVariant = 'outline',
  downloadLabel = 'Download Fee Structure',
  eyebrow,
  feeCategories,
  feeDocument,
  feeDocumentAction,
  footerActions,
  layout,
  programmeDetails,
  programmeName,
  size = 'default',
  tabStyle = 'underline',
  tabWidth = 'content',
  title,
}: FeeStructureBlockLike) {
  const resolvedProgramme = programmeName?.trim()
  const resolvedSession = academicSession?.trim()
  const categories = normalizeFeeCategories(feeCategories)
  const resolvedProgrammeDetails = normalizeProgrammeDetails(programmeDetails)
  const resolvedLayout: FeeStructureLayout =
    layout === 'programmeCostAtlas' ? 'programmeCostAtlas' : 'table'

  if (!resolvedProgramme || !resolvedSession || categories.length === 0) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const alignment = contentAlignment === 'center' ? 'center' : 'left'
  const resolvedSize =
    size === 'none' || size === 'compact' || size === 'comfortable' ? size : 'default'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedDescription = description?.trim()
  const resolvedDownload = resolveFeeDocumentPanel({
    feeDocument,
    feeDocumentAction,
    downloadLabel,
    downloadActionMode,
    downloadButtonVariant,
    downloadAppearance,
    sectionBackground: appearanceClasses.background,
  })
  const hasHeader = Boolean(
    resolvedEyebrow || resolvedTitle || resolvedDescription || resolvedActions.length,
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)}
      data-content-alignment={alignment}
      data-fee-structure="true"
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-8 md:gap-10')}>
        {hasHeader ? (
          <div
            className={cn(
              contentIntroClasses,
              alignment === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left',
            )}
            data-content-alignment={alignment}
          >
            {resolvedEyebrow ? (
              <SectionEyebrow surface={appearanceClasses.background}>
                {resolvedEyebrow}
              </SectionEyebrow>
            ) : null}
            {resolvedTitle ? (
              <h2 className={contentSectionHeadingClasses}>
                {resolvedAccentTitle ? (
                  <>
                    <span className="block">{resolvedTitle}</span>
                    <em className="block">{resolvedAccentTitle}</em>
                  </>
                ) : (
                  resolvedTitle
                )}
              </h2>
            ) : null}
            {resolvedDescription ? (
              <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
            ) : null}
            <ContentActions actions={resolvedActions} alignment={alignment} />
          </div>
        ) : null}

        {resolvedLayout === 'table' ? (
          <dl
            className={cn(
              'flex w-full max-w-3xl flex-wrap gap-x-8 gap-y-3 border-y border-current/15 py-4',
              alignment === 'center' ? 'mx-auto justify-center text-center' : 'self-start',
            )}
            data-fee-context="true"
          >
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-current/60">
                Programme
              </dt>
              <dd className="mt-1 font-semibold">{resolvedProgramme}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-current/60">
                Academic Session
              </dt>
              <dd className="mt-1 font-semibold tabular-nums">{resolvedSession}</dd>
            </div>
          </dl>
        ) : null}

        <FeeStructureClient
          academicSession={resolvedSession}
          categories={categories}
          download={resolvedLayout === 'programmeCostAtlas' ? resolvedDownload : undefined}
          layout={resolvedLayout}
          programmeDetails={resolvedProgrammeDetails}
          programmeName={resolvedProgramme}
          sectionBackground={appearanceClasses.background}
          tabStyle={tabStyle}
          tabWidth={tabWidth}
        />

        {resolvedLayout === 'table' && resolvedDownload ? (
          <FeeStructureDownload download={resolvedDownload} />
        ) : null}

        <BlockFooterActions actions={footerActions} alignment={alignment} className="mt-0" />
      </div>
    </section>
  )
}
