import { FileText } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  resolveBlockSurface,
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
import { resolveLucideIcon } from '@/blocks/shared/resolveLucideIcon'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

import { DocumentChecklistArt } from './DocumentChecklistArt'
import { DocumentChecklistTracker, type DocumentChecklistLayout } from './DocumentChecklistTracker'
import {
  normalizeChecklistColumns,
  normalizeChecklistPresentation,
  normalizeChecklistItems,
  normalizeChecklistNotes,
  type DocumentChecklistItemInput,
  type DocumentChecklistMarkerStyle,
  type DocumentChecklistNoteInput,
} from './normalizeDocumentChecklist'

type ContentAlignment = 'left' | 'center' | 'right'

type DocumentChecklistBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  actionsPosition?: 'intro' | 'bottom' | null
  appearance?: BlockAppearance | null
  artTitle?: string | null
  checklistPosition?: 'left' | 'right' | null
  columns?: 'one' | 'two' | 'three' | null
  contentAlignment?: ContentAlignment | null
  description?: string | null
  enableTracking?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  id?: string | null
  items?: DocumentChecklistItemInput[] | null
  layoutMode?: 'stacked' | 'split' | null
  markerStyle?: DocumentChecklistMarkerStyle | null
  notes?: DocumentChecklistNoteInput[] | null
  presentation?: 'composition' | 'ledger' | 'tracker' | null
  progressLabel?: string | null
  sealCaption?: string | null
  sealLabel?: string | null
  sectionVerticalAlignment?: 'top' | 'topStatic' | 'center' | 'bottom' | null
  showPrintButton?: boolean | null
  showProgressPanel?: boolean | null
  sidebarBackground?: string | null
  size?: RegularBlockSize | null
  splitProportion?: 'balanced' | 'checklistFocus' | 'sectionFocus' | null
  title?: string | null
}

// Auto margins position the width-capped intro itself, in flex and grid containers alike.
const alignmentClasses: Record<ContentAlignment, string> = {
  left: 'mr-auto items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
}

export function DocumentChecklistBlockComponent({
  accentTitle,
  actions,
  actionsPosition = 'intro',
  appearance,
  artTitle,
  checklistPosition = 'right',
  columns = 'two',
  contentAlignment = 'left',
  description,
  enableTracking = true,
  eyebrow,
  footerActions,
  id,
  items,
  layoutMode = 'stacked',
  markerStyle = 'lowerRoman',
  notes,
  presentation,
  progressLabel,
  sealCaption,
  sealLabel,
  sectionVerticalAlignment = 'top',
  showPrintButton = true,
  showProgressPanel = true,
  sidebarBackground = 'primary',
  size = 'default',
  splitProportion = 'checklistFocus',
  title,
}: DocumentChecklistBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedItems = normalizeChecklistItems(items)
  if ((!resolvedTitle && !resolvedAccentTitle) || resolvedItems.length === 0) return null

  const resolvedActions = resolveCmsActions(actions)
  const alignment: ContentAlignment = contentAlignment ?? 'left'
  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const sectionBackground = appearance?.background ?? 'none'
  const resolvedPresentation = normalizeChecklistPresentation(presentation)
  const isComposition = resolvedPresentation === 'composition'
  const isBrandSurface = resolveBlockSurface(sectionBackground) === 'brand'
  // Icons are resolved on the server so the client bundle never ships the full icon set.
  const trackerItems = isComposition
    ? resolvedItems.map((item) => {
        const Icon = resolveLucideIcon(item.icon) ?? FileText
        return {
          ...item,
          iconNode: <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />,
        }
      })
    : resolvedItems
  const layout: DocumentChecklistLayout = {
    checklistPosition: checklistPosition === 'left' ? 'left' : 'right',
    mode: layoutMode === 'split' ? 'split' : 'stacked',
    proportion: splitProportion ?? 'checklistFocus',
    verticalAlignment: sectionVerticalAlignment ?? 'top',
  }

  const actionsAtBottom = actionsPosition === 'bottom' && resolvedActions.length > 0
  const sectionActions =
    resolvedActions.length > 0 ? (
      <ContentActions
        actions={resolvedActions}
        alignment={alignment}
        className={actionsAtBottom ? undefined : 'mt-2'}
        data-document-checklist-actions={actionsAtBottom ? 'bottom' : 'intro'}
      />
    ) : null

  const header = (
    <div
      className={cn(
        contentIntroClasses,
        'w-full min-w-0 [overflow-wrap:anywhere]',
        alignmentClasses[alignment],
      )}
      data-document-checklist-content="true"
    >
      {eyebrow?.trim() ? (
        <SectionEyebrow surface={sectionBackground}>{eyebrow.trim()}</SectionEyebrow>
      ) : null}
      <h2
        className={
          isComposition
            ? 'font-[family-name:var(--font-display)] text-4xl leading-[1.04] font-medium tracking-tight text-balance text-current sm:text-5xl lg:text-6xl'
            : contentSectionHeadingClasses
        }
      >
        {resolvedTitle}
        {resolvedAccentTitle ? (
          <>
            {resolvedTitle ? ' ' : ''}
            <span
              className={cn(
                'italic',
                isComposition && 'block',
                isComposition && !isBrandSurface && 'text-primary',
              )}
            >
              {resolvedAccentTitle}
            </span>
          </>
        ) : null}
      </h2>
      {description?.trim() ? (
        <p className={contentSectionDescriptionClasses}>{description.trim()}</p>
      ) : null}
      {actionsAtBottom ? null : sectionActions}
    </div>
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-document-checklist="true"
    >
      <div className={regularBlockContainerClasses}>
        <DocumentChecklistTracker
          art={
            isComposition ? (
              <DocumentChecklistArt
                sealCaption={sealCaption?.trim() || undefined}
                sealLabel={sealLabel?.trim() || 'Verified'}
                title={artTitle?.trim() || 'Certificate'}
              />
            ) : undefined
          }
          columns={normalizeChecklistColumns(columns)}
          enableTracking={enableTracking !== false}
          bottomContent={actionsAtBottom ? sectionActions : undefined}
          header={header}
          items={trackerItems}
          layout={layout}
          markerStyle={markerStyle ?? 'lowerRoman'}
          notes={normalizeChecklistNotes(notes)}
          presentation={resolvedPresentation}
          progressLabel={progressLabel?.trim() || 'Your progress'}
          sectionBackground={sectionBackground}
          showPrintButton={showPrintButton !== false}
          showProgressPanel={showProgressPanel !== false}
          sidebarBackground={sidebarBackground}
          storageId={id}
        />

        <BlockFooterActions actions={footerActions} alignment={alignment} />
      </div>
    </section>
  )
}
