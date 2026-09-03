export type QaAccordionLayoutMode = 'split' | 'stacked'
export type QaAccordionLegacyLayoutMode = 'fiftyFifty' | 'fullWidth' | 'oneThird'
export type QaAccordionSplitProportion = 'balanced' | 'qaFocus' | 'sectionFocus'
export type QaAccordionSectionVerticalAlignment = 'bottom' | 'center' | 'top'

export type QaAccordionLayoutInput = {
  layoutMode?: QaAccordionLayoutMode | QaAccordionLegacyLayoutMode | string | null
  sectionVerticalAlignment?: QaAccordionSectionVerticalAlignment | string | null
  splitProportion?: QaAccordionSplitProportion | string | null
}

export type ResolvedQaAccordionLayout = {
  layoutMode: QaAccordionLayoutMode
  sectionVerticalAlignment: QaAccordionSectionVerticalAlignment
  splitProportion: QaAccordionSplitProportion
}

const splitProportions = new Set<QaAccordionSplitProportion>([
  'balanced',
  'qaFocus',
  'sectionFocus',
])

const verticalAlignments = new Set<QaAccordionSectionVerticalAlignment>([
  'bottom',
  'center',
  'top',
])

export function resolveQaAccordionLayout(
  input: QaAccordionLayoutInput,
): ResolvedQaAccordionLayout {
  const legacy =
    input.layoutMode === 'fullWidth'
      ? { layoutMode: 'stacked' as const, splitProportion: 'balanced' as const }
      : input.layoutMode === 'oneThird'
        ? { layoutMode: 'split' as const, splitProportion: 'qaFocus' as const }
        : input.layoutMode === 'fiftyFifty'
          ? { layoutMode: 'split' as const, splitProportion: 'balanced' as const }
          : undefined

  return {
    layoutMode: legacy?.layoutMode ?? (input.layoutMode === 'stacked' ? 'stacked' : 'split'),
    sectionVerticalAlignment: verticalAlignments.has(
      input.sectionVerticalAlignment as QaAccordionSectionVerticalAlignment,
    )
      ? (input.sectionVerticalAlignment as QaAccordionSectionVerticalAlignment)
      : 'top',
    splitProportion:
      legacy?.splitProportion ??
      (splitProportions.has(input.splitProportion as QaAccordionSplitProportion)
        ? (input.splitProportion as QaAccordionSplitProportion)
        : 'balanced'),
  }
}
