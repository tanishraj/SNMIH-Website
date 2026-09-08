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

import { normalizePGFeeCategories } from './normalizePGFeeStructure'
import { PGFeeStructureClient } from './PGFeeStructureClient'
import type { PGFeeStructureBlockLike } from './types'

export function PGFeeStructureBlockComponent({
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
  programmeName,
  size = 'default',
  tabStyle = 'underline',
  tabWidth = 'content',
  title,
}: PGFeeStructureBlockLike) {
  const resolvedProgramme = programmeName?.trim()
  const resolvedSession = academicSession?.trim()
  const categories = normalizePGFeeCategories(feeCategories)

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
      data-pg-fee-structure="true"
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

        <PGFeeStructureClient
          academicSession={resolvedSession}
          categories={categories}
          download={resolvedDownload}
          programmeName={resolvedProgramme}
          sectionBackground={appearanceClasses.background}
          tabStyle={tabStyle}
          tabWidth={tabWidth}
        />

        <BlockFooterActions actions={footerActions} alignment={alignment} className="mt-0" />
      </div>
    </section>
  )
}
