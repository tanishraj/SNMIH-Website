import type {
  FeeStructureCategoryValue,
  FeeStructureProgrammeDetailValue,
  ResolvedFeeStructureCategory,
  ResolvedFeeStructureProgrammeDetail,
} from './types'

const numericValuePattern = /\d/

const normalizeText = (value?: string | null) => value?.trim() || undefined

export const isNumericFeeValue = (value: string) => numericValuePattern.test(value)

export function normalizeProgrammeDetails(
  details?: FeeStructureProgrammeDetailValue[] | null,
): ResolvedFeeStructureProgrammeDetail[] {
  return (details ?? []).flatMap((detail, index) => {
    const label = normalizeText(detail.label)
    const value = normalizeText(detail.value)

    return label && value ? [{ id: `${detail.id ?? 'detail'}-${index}`, label, value }] : []
  })
}

export function normalizeFeeCategories(
  categories?: FeeStructureCategoryValue[] | null,
): ResolvedFeeStructureCategory[] {
  return (categories ?? []).flatMap((category, categoryIndex) => {
    const label = normalizeText(category.label)
    const validColumns = (category.columns ?? []).flatMap((column, sourceIndex) => {
      const columnLabel = normalizeText(column.label)

      return columnLabel
        ? [
            {
              id: `${column.id ?? `column-${categoryIndex}`}-${sourceIndex}`,
              label: columnLabel,
              sourceIndex,
            },
          ]
        : []
    })
    const rows = (category.rows ?? []).flatMap((row, rowIndex) => {
      const rowLabel = normalizeText(row.label)
      if (!rowLabel) return []

      return [
        {
          id: `${row.id ?? `row-${categoryIndex}`}-${rowIndex}`,
          label: rowLabel,
          note: normalizeText(row.note),
          emphasis: row.emphasis === 'total' ? ('total' as const) : ('standard' as const),
          cells: validColumns.map(
            ({ sourceIndex }) => normalizeText(row.cells?.[sourceIndex]?.value) ?? '—',
          ),
        },
      ]
    })

    if (!label || validColumns.length === 0 || rows.length === 0) return []

    const notes = (category.notes ?? []).flatMap((note, noteIndex) => {
      const noteText = normalizeText(note.text)

      return noteText
        ? [
            {
              id: `${note.id ?? `note-${categoryIndex}`}-${noteIndex}`,
              text: noteText,
              emphasis: note.emphasis === true,
            },
          ]
        : []
    })

    return [
      {
        id: `${category.id ?? 'category'}-${categoryIndex}`,
        label,
        caption: normalizeText(category.caption),
        completeProgrammeExpense: normalizeText(category.completeProgrammeExpense),
        completeProgrammeExpenseLabel:
          normalizeText(category.completeProgrammeExpenseLabel) ?? 'Complete programme expense',
        completeProgrammeExpenseNote: normalizeText(category.completeProgrammeExpenseNote),
        columns: validColumns.map(({ id, label: columnLabel }) => ({
          id,
          label: columnLabel,
        })),
        rows,
        notes,
      },
    ]
  })
}
