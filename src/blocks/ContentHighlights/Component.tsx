import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import {
  ContentHighlights,
  type ContentHighlightItem,
  type ContentHighlightsAlignment,
  type ContentHighlightsCardLayout,
  type ContentHighlightsCardStyle,
  type ContentHighlightsEyebrowPlacement,
  type ContentHighlightsGridColumns,
  type ContentHighlightsHeaderLayout,
  type ContentHighlightsItemsLayout,
  type ContentHighlightsItemTreatment,
  type ContentHighlightsLayout,
  type ContentHighlightsRuledDividers,
  type ContentHighlightsSize,
  type ContentHighlightsSplitAlignment,
} from '@/components/content-highlights'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'

type ContentHighlightItemValue = {
  cardAction?: CmsActionValue[] | null
  cardBackground?: string | null
  description?: string | null
  markerLabel?: string | null
  markerMode?: 'custom' | 'hidden' | 'numbered' | null
  metadata?: string | null
  title?: string | null
}

type ContentHighlightsBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardLayout?: ContentHighlightsCardLayout | null
  cardStyle?: ContentHighlightsCardStyle | null
  contentAlignment?: ContentHighlightsAlignment | null
  description?: string | null
  enableSplitLayout?: boolean | null
  eyebrow?: string | null
  eyebrowPlacement?: ContentHighlightsEyebrowPlacement | null
  footerActions?: CmsActionValue[] | null
  gridColumns?: ContentHighlightsGridColumns | null
  headerLayout?: ContentHighlightsHeaderLayout | null
  items?: ContentHighlightItemValue[] | null
  itemsLayout?: ContentHighlightsItemsLayout | 'list' | null
  itemTreatment?: ContentHighlightsItemTreatment | null
  layout?: ContentHighlightsLayout | 'numberedSteps' | null
  ruledDividers?: ContentHighlightsRuledDividers | null
  size?: ContentHighlightsSize | null
  splitContentAlignment?: ContentHighlightsSplitAlignment | null
  title?: string | null
}

export function ContentHighlightsBlockComponent({
  accentTitle,
  actions,
  appearance,
  cardLayout,
  cardStyle,
  contentAlignment = 'left',
  description,
  enableSplitLayout = false,
  eyebrow,
  eyebrowPlacement,
  footerActions,
  gridColumns,
  headerLayout,
  items,
  itemsLayout,
  itemTreatment,
  layout,
  ruledDividers,
  size = 'default',
  splitContentAlignment = 'top',
  title,
}: ContentHighlightsBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedItems = (items ?? []).flatMap((item): ContentHighlightItem[] => {
    const itemTitle = item.title?.trim()

    if (!itemTitle) {
      return []
    }

    const markerMode =
      item.markerMode === 'custom' || item.markerMode === 'hidden' ? item.markerMode : 'numbered'

    return [
      {
        cardAction: resolveCmsActions(item.cardAction)[0],
        cardBackground: item.cardBackground,
        description: item.description?.trim() || undefined,
        markerLabel: markerMode === 'custom' ? item.markerLabel?.trim() || undefined : undefined,
        markerMode,
        metadata: item.metadata?.trim() || undefined,
        title: itemTitle,
      },
    ]
  })

  if (!resolvedTitle || !resolvedItems.length) {
    return null
  }

  const resolvedActions = resolveCmsActions(actions)
  const resolvedItemsLayout: ContentHighlightsItemsLayout | undefined =
    itemsLayout === 'list' ? '1' : (itemsLayout ?? undefined)
  const resolvedAlignment: ContentHighlightsAlignment =
    contentAlignment === 'center' || contentAlignment === 'right' ? contentAlignment : 'left'
  const resolvedHeaderLayout: ContentHighlightsHeaderLayout =
    headerLayout === 'split' || headerLayout === 'stacked'
      ? headerLayout
      : enableSplitLayout === true
        ? 'split'
        : 'stacked'
  const resolvedActionNode = resolvedActions.length ? (
    <ContentActions
      actions={resolvedActions}
      alignment={resolvedHeaderLayout === 'split' ? 'left' : resolvedAlignment}
      data-content-highlights-actions="true"
    />
  ) : null

  return (
    <>
      <ContentHighlights
        accentTitle={accentTitle?.trim() || undefined}
        actions={resolvedActionNode}
        appearance={appearance}
        cardLayout={cardLayout}
        cardStyle={cardStyle}
        contentAlignment={resolvedAlignment}
        description={description?.trim() || undefined}
        eyebrow={eyebrow?.trim() || undefined}
        eyebrowPlacement={eyebrowPlacement}
        gridColumns={gridColumns}
        headerLayout={resolvedHeaderLayout}
        items={resolvedItems}
        itemsLayout={resolvedItemsLayout}
        itemTreatment={itemTreatment}
        layout={layout}
        ruledDividers={ruledDividers}
        size={size ?? 'default'}
        splitContentAlignment={splitContentAlignment ?? 'top'}
        title={resolvedTitle}
      />
      <BlockFooterActions
        actions={footerActions}
        alignment={resolvedHeaderLayout === 'split' ? 'left' : resolvedAlignment}
      />
    </>
  )
}
