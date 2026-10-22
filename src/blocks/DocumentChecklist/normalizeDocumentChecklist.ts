import { cn } from '@/lib/utils'

export type DocumentChecklistMarkerStyle = 'check' | 'decimal' | 'lowerRoman'

export type DocumentChecklistItemInput = {
  details?: string | null
  icon?: string | null
  id?: string | null
  label?: string | null
  qualifier?: string | null
}

export type DocumentChecklistNoteInput = {
  id?: string | null
  label?: string | null
  text?: string | null
}

export type DocumentChecklistItem = {
  details?: string
  icon?: string
  key: string
  label: string
  qualifier?: string
}

export type DocumentChecklistNote = {
  key: string
  label?: string
  text: string
}

const romanNumerals: ReadonlyArray<readonly [number, string]> = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
]

export const toLowerRoman = (value: number) => {
  let remaining = Math.max(0, Math.floor(value))
  let result = ''

  for (const [amount, numeral] of romanNumerals) {
    while (remaining >= amount) {
      result += numeral
      remaining -= amount
    }
  }

  return result
}

export const formatChecklistMarker = (index: number, markerStyle: DocumentChecklistMarkerStyle) => {
  if (markerStyle === 'decimal') return `${index + 1}.`
  if (markerStyle === 'lowerRoman') return `${toLowerRoman(index + 1)}.`

  return ''
}

/** Trims authored text, drops blank rows, and assigns a stable key used for visitor progress. */
export const normalizeChecklistItems = (
  items?: DocumentChecklistItemInput[] | null,
): DocumentChecklistItem[] =>
  (items ?? []).flatMap((item, index) => {
    const label = item.label?.trim()
    if (!label) return []

    return [
      {
        details: item.details?.trim() || undefined,
        icon: item.icon?.trim() || undefined,
        key: item.id?.trim() || `item-${index}`,
        label,
        qualifier: item.qualifier?.trim() || undefined,
      },
    ]
  })

export const normalizeChecklistNotes = (
  notes?: DocumentChecklistNoteInput[] | null,
): DocumentChecklistNote[] =>
  (notes ?? []).flatMap((note, index) => {
    const text = note.text?.trim()
    if (!text) return []

    return [
      { key: note.id?.trim() || `note-${index}`, label: note.label?.trim() || undefined, text },
    ]
  })

export const getChecklistStorageKey = (blockId?: string | null) => {
  const id = blockId?.trim()

  return id ? `document-checklist:${id}` : undefined
}

/** Keeps only stored keys that still match a rendered item, so removed items never count. */
export const parseStoredChecklistKeys = (raw: string | null, validKeys: readonly string[]) => {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const valid = new Set(validKeys)

    return parsed.filter((key): key is string => typeof key === 'string' && valid.has(key))
  } catch {
    return []
  }
}

export type DocumentChecklistColumns = 'one' | 'two' | 'three'

export const normalizeChecklistColumns = (value: unknown): DocumentChecklistColumns =>
  value === 'one' || value === 'three' ? value : 'two'

/**
 * Lays items out top-to-bottom in aligned rows. Columns are added by container width, so split
 * layouts get them too whenever their column is wide enough: two at 36rem, three at 48rem.
 */
export const getChecklistGridLayout = (count: number, columns: DocumentChecklistColumns) => {
  const twoColumnRows = Math.ceil(count / 2)
  const threeColumnRows = Math.ceil(count / 3)
  const usesTwo = columns !== 'one' && count > 1
  const usesThree = columns === 'three' && count > 2

  const container = cn(
    'grid grid-cols-1',
    usesTwo &&
      '@xl:grid-flow-col @xl:grid-cols-2 @xl:[grid-template-rows:repeat(var(--checklist-rows-2),auto)]',
    usesThree && '@3xl:grid-cols-3 @3xl:[grid-template-rows:repeat(var(--checklist-rows-3),auto)]',
  )

  const style = {
    ...(usesTwo ? { '--checklist-rows-2': String(twoColumnRows) } : {}),
    ...(usesThree ? { '--checklist-rows-3': String(threeColumnRows) } : {}),
  } as Record<string, string>

  // Each item draws its own bottom and left rules, so they must match the active column count.
  const item = (index: number) => {
    const isLast = index === count - 1
    const endsTwoColumn = isLast || index % twoColumnRows === twoColumnRows - 1
    const endsThreeColumn = isLast || index % threeColumnRows === threeColumnRows - 1

    return cn(
      isLast ? 'border-b-0' : 'border-b',
      usesTwo && (endsTwoColumn ? '@xl:border-b-0' : '@xl:border-b'),
      usesTwo && index >= twoColumnRows && '@xl:border-l',
      usesThree && (endsThreeColumn ? '@3xl:border-b-0' : '@3xl:border-b'),
      usesThree && (index >= threeColumnRows ? '@3xl:border-l' : '@3xl:border-l-0'),
    )
  }

  // Ledger rows sit on the section itself: every row has a top rule, each column closes with a
  // bottom rule, and columns are separated by a gutter instead of a vertical rule.
  const ledgerItem = (index: number) => {
    const isLast = index === count - 1
    const endsTwoColumn = isLast || index % twoColumnRows === twoColumnRows - 1
    const endsThreeColumn = isLast || index % threeColumnRows === threeColumnRows - 1

    return cn(
      'border-t',
      isLast ? 'border-b' : 'border-b-0',
      usesTwo && (endsTwoColumn ? '@xl:border-b' : '@xl:border-b-0'),
      usesThree && (endsThreeColumn ? '@3xl:border-b' : '@3xl:border-b-0'),
    )
  }

  return { container, item, ledgerItem, style, usesThree, usesTwo }
}

export type DocumentChecklistPresentation = 'composition' | 'ledger' | 'tracker'

export const normalizeChecklistPresentation = (value: unknown): DocumentChecklistPresentation =>
  value === 'ledger' || value === 'composition' ? value : 'tracker'
