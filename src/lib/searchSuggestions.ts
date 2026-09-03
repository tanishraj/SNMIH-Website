export const MAX_SEARCH_SUGGESTIONS = 6

type SuggestedSearchRow = {
  term?: string | null
}

const getNormalizedTerm = (row: unknown): string => {
  if (!row || typeof row !== 'object' || !('term' in row)) return ''

  const term = (row as SuggestedSearchRow).term
  return typeof term === 'string' ? term.trim() : ''
}

export const normalizeSuggestedSearchTerms = (
  rows: null | readonly unknown[] | undefined,
): string[] => {
  const terms: string[] = []
  const seen = new Set<string>()

  for (const row of rows ?? []) {
    const term = getNormalizedTerm(row)
    if (!term) continue

    const normalizedTerm = term.toLocaleLowerCase()
    if (seen.has(normalizedTerm)) continue

    seen.add(normalizedTerm)
    terms.push(term)

    if (terms.length === MAX_SEARCH_SUGGESTIONS) break
  }

  return terms
}

export const validateSuggestedSearchTerms = (
  rows: null | unknown[] | undefined,
): string | true => {
  const seen = new Set<string>()

  for (const row of rows ?? []) {
    const term = getNormalizedTerm(row)
    if (!term) continue

    const normalizedTerm = term.toLocaleLowerCase()
    if (seen.has(normalizedTerm)) {
      return `Suggested search "${term}" is duplicated. Use each term only once.`
    }

    seen.add(normalizedTerm)
  }

  return true
}
