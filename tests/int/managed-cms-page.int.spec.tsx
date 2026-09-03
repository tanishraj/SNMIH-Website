import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getHomepagePath: vi.fn(),
  getPageByPath: vi.fn(),
  getRedirectByPath: vi.fn(),
  getSystemPageRenderState: vi.fn(),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  permanentRedirect: mocks.permanentRedirect,
  redirect: mocks.redirect,
}))

vi.mock('@/app/(frontend)/PageContent', () => ({
  PageContent: ({ page }: { page: { title: string } }) => (
    <main data-page-content={page.title} />
  ),
}))

vi.mock('@/app/(frontend)/SystemFallbackPage', () => ({
  SystemModeFallbackPage: ({ mode }: { mode: string }) => (
    <main data-system-fallback={mode} />
  ),
}))

vi.mock('@/app/(frontend)/pageData', () => ({
  getHomepagePath: mocks.getHomepagePath,
  getPageByPath: mocks.getPageByPath,
  getSystemPageRenderState: mocks.getSystemPageRenderState,
}))

vi.mock('@/lib/redirects', () => ({
  getRedirectByPath: mocks.getRedirectByPath,
}))

vi.mock('@/lib/pageBreadcrumbs', () => ({
  resolvePageBreadcrumbsForLayout: vi.fn(() => []),
  toBreadcrumbListStructuredData: vi.fn(() => null),
}))

vi.mock('@/lib/siteUrl', () => ({
  toAbsoluteSiteUrl: vi.fn((pathname: string) => `https://example.test${pathname}`),
}))

import { ManagedCmsPage } from '@/app/(frontend)/ManagedCmsPage'

describe('managed CMS Page renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSystemPageRenderState.mockResolvedValue({ mode: null, page: null })
    mocks.getHomepagePath.mockResolvedValue(null)
    mocks.getRedirectByPath.mockResolvedValue(null)
  })

  it('renders the published Page through PageContent', async () => {
    mocks.getPageByPath.mockResolvedValue({ id: 'news-page', title: 'News & Events' })

    const html = renderToStaticMarkup(await ManagedCmsPage({ segments: ['news-events'] }))

    expect(mocks.getPageByPath).toHaveBeenCalledWith(['news-events'])
    expect(html).toContain('data-page-content="News &amp; Events"')
    expect(html).toContain('"@type":"WebPage"')
  })

  it('renders a configured system Page before the requested Page', async () => {
    mocks.getSystemPageRenderState.mockResolvedValue({
      mode: 'maintenance',
      page: { id: 'maintenance', title: 'Maintenance' },
    })

    const html = renderToStaticMarkup(await ManagedCmsPage({ segments: ['news-events'] }))

    expect(html).toContain('data-page-content="Maintenance"')
    expect(mocks.getPageByPath).not.toHaveBeenCalled()
  })

  it('renders the fallback when a system mode has no configured Page', async () => {
    mocks.getSystemPageRenderState.mockResolvedValue({ mode: 'comingSoon', page: null })

    const html = renderToStaticMarkup(await ManagedCmsPage({ segments: ['news-events'] }))

    expect(html).toContain('data-system-fallback="comingSoon"')
  })

  it('uses managed not-found behavior when no published Page exists', async () => {
    mocks.getPageByPath.mockResolvedValue(null)
    mocks.notFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND')
    })

    await expect(ManagedCmsPage({ segments: ['news-events'] })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    )
  })

  it('honors permanent redirects before Page lookup', async () => {
    mocks.getRedirectByPath.mockResolvedValue({
      destination: '/replacement',
      permanent: true,
    })
    mocks.permanentRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    await expect(ManagedCmsPage({ segments: ['news-events'] })).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.permanentRedirect).toHaveBeenCalledWith('/replacement')
    expect(mocks.getPageByPath).not.toHaveBeenCalled()
  })

  it('honors temporary redirects before Page lookup', async () => {
    mocks.getRedirectByPath.mockResolvedValue({
      destination: '/temporary',
      permanent: false,
    })
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })

    await expect(ManagedCmsPage({ segments: ['news-events'] })).rejects.toThrow('NEXT_REDIRECT')
    expect(mocks.redirect).toHaveBeenCalledWith('/temporary')
    expect(mocks.getPageByPath).not.toHaveBeenCalled()
  })
})
