import { describe, expect, it } from 'vitest'

import { SearchSettings } from '@/globals/SearchSettings'
import {
  MAX_SEARCH_SUGGESTIONS,
  normalizeSuggestedSearchTerms,
  validateSuggestedSearchTerms,
} from '@/lib/searchSuggestions'

const getSuggestedSearchesField = () =>
  SearchSettings.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'suggestedSearches',
  )

describe('Search suggestions', () => {
  it('caps the authoring field at six ordered terms', () => {
    const field = getSuggestedSearchesField()

    expect(MAX_SEARCH_SUGGESTIONS).toBe(6)
    expect(field).toMatchObject({
      maxRows: 6,
      type: 'array',
      validate: validateSuggestedSearchTerms,
    })
  })

  it('normalizes legacy rows without rewriting their stored document', () => {
    const rows = [
      { term: ' Admissions ' },
      { term: 'Research' },
      { term: 'admissions' },
      { term: '' },
      { term: null },
      { term: 'Campus Life' },
      { term: 'Scholarships' },
      { term: 'Faculty' },
      { term: 'Contact' },
      { term: 'Seventh unique term' },
    ]

    expect(normalizeSuggestedSearchTerms(rows)).toEqual([
      'Admissions',
      'Research',
      'Campus Life',
      'Scholarships',
      'Faculty',
      'Contact',
    ])
    expect(rows).toHaveLength(10)
  })

  it('rejects case-insensitive duplicate terms with actionable copy', () => {
    expect(validateSuggestedSearchTerms([{ term: 'Admissions' }, { term: ' admissions ' }])).toBe(
      'Suggested search "admissions" is duplicated. Use each term only once.',
    )
  })

  it('accepts empty state and six unique terms', () => {
    expect(validateSuggestedSearchTerms(undefined)).toBe(true)
    expect(
      validateSuggestedSearchTerms(
        ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((term) => ({ term })),
      ),
    ).toBe(true)
  })
})
