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
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

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
  appearance?: BlockAppearance | null
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
  presentation?: 'ledger' | 'tracker' | null
  progressLabel?: string | null
  sectionVerticalAlignment?: 'top' | 'topStatic' | 'center' | 'bottom' | null
  showPrintButton?: boolean | null
  showProgressPanel?: boolean | null
  sidebarBackground?: string | null
  size?: RegularBlockSize | null
  splitProportion?: 'balanced' | 'checklistFocus' | 'sectionFocus' | null
  title?: string | null
}

const alignmentClasses: Record<ContentAlignment, string> = {
  left: 'items-start justify-self-start text-left',
  center: 'items-center justify-self-center text-center',
  right: 'items-end justify-self-end text-right',
}

export function DocumentChecklistBlockComponent({
  accentTitle,
  actions,
  appearance,
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
  const layout: DocumentChecklistLayout = {
    checklistPosition: checklistPosition === 'left' ? 'left' : 'right',
    mode: layoutMode === 'split' ? 'split' : 'stacked',
    proportion: splitProportion ?? 'checklistFocus',
    verticalAlignment: sectionVerticalAlignment ?? 'top',
  }

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
      <h2 className={contentSectionHeadingClasses}>
        {resolvedTitle}
        {resolvedAccentTitle ? (
          <>
            {resolvedTitle ? ' ' : ''}
            <span className="italic">{resolvedAccentTitle}</span>
          </>
        ) : null}
      </h2>
      {description?.trim() ? (
        <p className={contentSectionDescriptionClasses}>{description.trim()}</p>
      ) : null}
      {resolvedActions.length > 0 ? (
        <ContentActions actions={resolvedActions} alignment={alignment} className="mt-2" />
      ) : null}
    </div>
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-document-checklist="true"
    >
      <div className={regularBlockContainerClasses}>
        <DocumentChecklistTracker
          columns={normalizeChecklistColumns(columns)}
          enableTracking={enableTracking !== false}
          header={header}
          items={resolvedItems}
          layout={layout}
          markerStyle={markerStyle ?? 'lowerRoman'}
          notes={normalizeChecklistNotes(notes)}
          presentation={normalizeChecklistPresentation(presentation)}
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
