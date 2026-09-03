import type { PGFeeCategoryValue, ResolvedPGFeeCategory } from './types'

const normalizeText = (value?: string | null) => value?.trim() || undefined

export const isNumericPGFeeValue = (value: string) => /\d/.test(value)

export function normalizePGFeeCategories(
  categories?: PGFeeCategoryValue[] | null,
): ResolvedPGFeeCategory[] {
  return (categories ?? []).flatMap((category, categoryIndex) => {
    const label = normalizeText(category.label)
    const columns = (category.columns ?? []).flatMap((column, columnIndex) => {
      const columnLabel = normalizeText(column.label)

      if (!columnLabel) return []

      return [
        {
          id: `${column.id ?? `column-${categoryIndex}`}-${columnIndex}`,
          label: columnLabel,
          sharedValue: normalizeText(column.sharedValue),
          valueMode: column.valueMode === 'shared' ? ('shared' as const) : ('department' as const),
        },
      ]
    })
    const departments = (category.departments ?? []).flatMap(
      (department, departmentIndex) => {
        const name = normalizeText(department.name)

        if (!name) return []

        let variableIndex = 0
        const cells = columns.map((column) => {
          if (column.valueMode === 'shared') return column.sharedValue ?? '—'

          const value = normalizeText(department.variableValues?.[variableIndex]?.value) ?? '—'
          variableIndex += 1
          return value
        })

        return [
          {
            cells,
            id: `${department.id ?? `department-${categoryIndex}`}-${departmentIndex}`,
            name,
            note: normalizeText(department.note),
          },
        ]
      },
    )

    if (!label || columns.length === 0 || departments.length === 0) return []

    const notes = (category.notes ?? []).flatMap((note, noteIndex) => {
      const text = normalizeText(note.text)

      return text
        ? [
            {
              emphasis: note.emphasis === true,
              id: `${note.id ?? `note-${categoryIndex}`}-${noteIndex}`,
              text,
            },
          ]
        : []
    })

    return [
      {
        caption: normalizeText(category.caption),
        columns: columns.map(({ id, label: columnLabel, sharedValue, valueMode }) => ({
          id,
          label: columnLabel,
          sharedValue: valueMode === 'shared' ? sharedValue : undefined,
          valueMode,
        })),
        departments,
        id: `${category.id ?? 'category'}-${categoryIndex}`,
        label,
        notes,
      },
    ]
  })
}
