import { sectionOptions, type SectionKey, PAGE_SIZES } from './shared'
export type DisclosureQuery = {
  dataset: string
  section: SectionKey
  groupKeys: string[]
  period?: string
  query: string
  page: number
  limit: number
  periodPage: number
  periodQuery: string
  draft: boolean
}
export function parseDisclosureQuery(params: URLSearchParams): DisclosureQuery {
  const dataset = params.get('dataset') ?? ''
  const section = params.get('section') ?? ''
  const groupKeys = (params.get('groups') ?? '').split(',').filter(Boolean)
  const period = params.get('period') || undefined
  const query = (params.get('q') ?? '').trim()
  const periodQuery = (params.get('periodQuery') ?? '').trim()
  const page = Number(params.get('page') ?? 1)
  const periodPage = Number(params.get('periodPage') ?? 1)
  const limit = Number(params.get('limit') ?? 10)
  if (
    !/^[a-zA-Z0-9_-]{1,100}$/.test(dataset) ||
    (period && !/^[a-zA-Z0-9_-]{1,100}$/.test(period)) ||
    !sectionOptions.some((s) => s.value === section) ||
    !groupKeys.length ||
    groupKeys.length > 8 ||
    new Set(groupKeys).size !== groupKeys.length ||
    groupKeys.some((g) => !/^[a-z][a-z0-9-]{0,63}$/.test(g)) ||
    query.length > 100 ||
    periodQuery.length > 100 ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    !Number.isInteger(periodPage) ||
    periodPage < 1 ||
    periodPage > 10000 ||
    !(PAGE_SIZES as readonly number[]).includes(limit) ||
    (params.has('draft') && !['true', 'false'].includes(params.get('draft')!))
  )
    throw new Error('Invalid disclosure filters.')
  return {
    dataset,
    section: section as SectionKey,
    groupKeys,
    period,
    query,
    page,
    limit,
    periodPage,
    periodQuery,
    draft: params.get('draft') === 'true',
  }
}
