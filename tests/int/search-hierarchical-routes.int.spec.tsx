import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findByID: vi.fn(),
  findGlobal: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return { ...actual, getPayload: mocks.getPayload }
})

import SearchPage from '@/app/(frontend)/search/page'
import { GET } from '@/app/api/search/route'

describe('hierarchical Page search URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findGlobal.mockResolvedValue({
      id: 'search-settings',
      suggestedSearches: [
        { term: ' Admissions ' },
        { term: 'Research' },
        { term: 'admissions' },
        { term: 'Campus Life' },
        { term: 'Scholarships' },
        { term: 'Faculty' },
        { term: 'Contact' },
        { term: 'Hidden legacy term' },
      ],
    })
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      findByID: mocks.findByID,
      findGlobal: mocks.findGlobal,
    })
    mocks.find.mockImplementation(async ({ collection }) => {
      if (collection === 'pages') {
        return {
          docs: [
            {
              id: 'child',
              metaDescription: 'Child page',
              parent: 'parent',
              slug: 'child',
              title: 'Child',
            },
          ],
        }
      }
      if (collection === 'articles') {
        return {
          docs: [
            {
              excerpt: 'Article excerpt',
              id: 'article',
              slug: 'article',
              title: 'Article',
            },
          ],
        }
      }
      return {
        docs: [
          {
            classification: {
              active: true,
              badgeLabel: 'Campus',
              behavior: 'story',
              id: 'campus-classification',
              legacyValue: null,
              slug: 'campus-update',
              title: 'Campus Updates',
            },
            excerpt: 'News excerpt',
            id: 'news',
            slug: 'news',
            title: 'News',
          },
        ],
      }
    })
    mocks.findByID.mockResolvedValue({
      id: 'parent',
      parent: null,
      slug: 'parent',
    })
  })

  it('renders full hierarchical Page URLs on the search page', async () => {
    const html = renderToStaticMarkup(
      await SearchPage({ searchParams: Promise.resolve({ q: 'example' }) }),
    )

    expect(html).toContain('href="/parent/child"')
    expect(html).not.toContain('href="/child"')
    expect(html).toContain('href="/articles/article"')
    expect(html).toContain('href="/news-events/news"')
    expect(html).toContain('Campus')
    expect(html.match(/data-search-suggestion="true"/g)).toHaveLength(6)
    expect(html).toContain('Admissions')
    expect(html).not.toContain('Hidden legacy term')
    expect(html).toContain('lucide-file-text')
    expect(html).toContain('lucide-newspaper')
    expect(html).toContain('lucide-calendar-days')
    expect(html).toContain('lucide-star')
    expect(html).toContain('border-primary/20 bg-primary/10')
  })

  it('returns full hierarchical Page URLs from the search API', async () => {
    const response = await GET(
      new Request('http://localhost/api/search?q=example', {
        headers: { 'x-real-ip': 'search-path-test' },
      }),
    )
    const body = await response.json()

    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/parent/child', type: 'page' }),
        expect.objectContaining({ href: '/articles/article', type: 'article' }),
        expect.objectContaining({ href: '/news-events/news', type: 'news-event' }),
      ]),
    )
    expect(body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: '/news-events/news', label: 'Campus' }),
      ]),
    )
    expect(body.results).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ href: '/child' })]),
    )
  })

  it('uses the same title-first ordering in the dialog API and full search page', async () => {
    const titles = [
      'Public Disclosure',
      'Academic Courses',
      'Fee Structure',
      'Campus Life',
      'Library',
      'Contact',
      'Admission Enquiry',
      'Admission Eligibility',
      'PG Admission',
      'MBBS Admission',
    ]
    mocks.find.mockImplementation(async ({ collection, page }) => {
      if (collection !== 'pages') return { docs: [] }
      const selected = page === 1 ? titles.slice(0, 6) : titles.slice(6)
      return {
        docs: selected.map((title) => ({
          id: title,
          title,
          parent: null,
          slug: title.toLowerCase().replaceAll(' ', '-'),
          metaDescription: 'Admission information',
        })),
        hasNextPage: page === 1,
      }
    })
    const response = await GET(
      new Request('http://localhost/api/search?q=Admission', {
        headers: { 'x-real-ip': 'search-ranking-test' },
      }),
    )
    const body = await response.json()
    const expected = [
      'Admission Eligibility',
      'Admission Enquiry',
      'MBBS Admission',
      'PG Admission',
    ]
    expect(body.results).toHaveLength(6)
    expect(body.results.slice(0, 4).map((item: { title: string }) => item.title)).toEqual(expected)

    const html = renderToStaticMarkup(
      await SearchPage({ searchParams: Promise.resolve({ q: 'Admission' }) }),
    )
    const positions = expected.map((title) =>
      html.indexOf(`href="/${title.toLowerCase().replaceAll(' ', '-')}"`),
    )
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(positions[3]).toBeLessThan(html.indexOf('href="/academic-courses"'))
    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        page: 2,
        limit: 100,
        sort: 'id',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { or: [{ title: { like: 'Admission' } }, { metaDescription: { like: 'Admission' } }] },
          ],
        },
      }),
    )
  })
})
