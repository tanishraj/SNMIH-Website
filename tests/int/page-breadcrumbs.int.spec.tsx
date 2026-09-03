import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PageContent } from '@/app/(frontend)/PageContent'
import { PageHeaderBlockComponent } from '@/blocks/PageHeader/Component'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import {
  resolveAutomaticPageBreadcrumbs,
  resolvePageBreadcrumbsForLayout,
  resolvePageHeaderBreadcrumbs,
  toBreadcrumbListStructuredData,
} from '@/lib/pageBreadcrumbs'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import type { Page } from '@/payload-types'

const page = (value: Partial<Page>): Page => value as Page

const academics = page({
  id: 'academics',
  parent: null,
  slug: 'academics',
  title: 'Academics',
})
const undergraduate = page({
  id: 'undergraduate',
  parent: academics,
  slug: 'undergraduate',
  title: 'Undergraduate Programmes',
})
const mbbs = page({
  id: 'mbbs',
  layout: [
    {
      appearance: { background: 'none', border: 'none' },
      blockType: 'pageHeader',
      breadcrumbMode: 'automatic',
      contentAlignment: 'left',
      height: 'default',
      overlayStyle: 'dark',
      title: 'Study MBBS',
      topContent: 'breadcrumb',
      variant: 'minimal',
    },
  ],
  parent: undergraduate,
  slug: 'mbbs',
  title: 'MBBS',
})

describe('page breadcrumbs', () => {
  it('uses CMS titles and canonical hierarchy paths', () => {
    expect(resolveAutomaticPageBreadcrumbs(mbbs)).toEqual([
      { label: 'Home', url: '/' },
      { label: 'Academics', url: '/academics' },
      { label: 'Undergraduate Programmes', url: '/academics/undergraduate' },
      { label: 'MBBS', url: '/academics/undergraduate/mbbs' },
    ])
  })

  it('returns no automatic trail for the homepage', () => {
    expect(resolveAutomaticPageBreadcrumbs(mbbs, { isHomepage: true })).toEqual([])
  })

  it('bounds circular page relationships', () => {
    const first = page({ id: 'first', slug: 'first', title: 'First' })
    const second = page({ id: 'second', parent: first, slug: 'second', title: 'Second' })
    first.parent = second

    expect(resolveAutomaticPageBreadcrumbs(second)).toEqual([
      { label: 'Home', url: '/' },
      { label: 'First', url: '/first' },
      { label: 'Second', url: '/first/second' },
    ])
  })

  it('defaults to automatic and supports custom and hidden modes', () => {
    const automatic = [
      { label: 'Home', url: '/' },
      { label: 'About', url: '/about' },
    ]
    const custom = [{ label: 'Start', linkType: 'custom' as const, url: '/' }, { label: 'About' }]

    expect(resolvePageHeaderBreadcrumbs({ automatic, breadcrumbs: custom })).toEqual(automatic)
    expect(
      resolvePageHeaderBreadcrumbs({
        automatic,
        breadcrumbMode: 'custom',
        breadcrumbs: custom,
      }),
    ).toEqual([{ label: 'Start', url: '/' }, { label: 'About' }])
    expect(
      resolvePageHeaderBreadcrumbs({
        automatic,
        breadcrumbMode: 'hidden',
        breadcrumbs: custom,
      }),
    ).toEqual([])
  })

  it('uses the first page header mode for the effective layout trail', () => {
    expect(resolvePageBreadcrumbsForLayout(mbbs)).toEqual(resolveAutomaticPageBreadcrumbs(mbbs))

    const hidden = page({
      ...mbbs,
      layout: [
        {
          appearance: { background: 'none', border: 'none' },
          blockType: 'pageHeader',
          breadcrumbMode: 'hidden',
          contentAlignment: 'left',
          height: 'default',
          overlayStyle: 'dark',
          title: 'Hidden',
          topContent: 'breadcrumb',
          variant: 'minimal',
        },
      ],
    })
    expect(resolvePageBreadcrumbsForLayout(hidden)).toEqual([])
  })

  it('formats breadcrumb structured data from resolved items', () => {
    expect(
      toBreadcrumbListStructuredData(
        [
          { label: 'Home', url: '/' },
          { label: 'Academics', url: '/academics' },
        ],
        (path) => `https://example.edu${path}`,
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', item: 'https://example.edu/', name: 'Home', position: 1 },
        {
          '@type': 'ListItem',
          item: 'https://example.edu/academics',
          name: 'Academics',
          position: 2,
        },
      ],
    })
    expect(toBreadcrumbListStructuredData([], (path) => path)).toBeNull()
  })

  it('configures one Breadcrumb-or-Eyebrow top slot', () => {
    const tabs = PageHeaderBlock.fields[0]
    expect(tabs.type).toBe('tabs')
    if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') return

    const contentFields = tabs.tabs[0]?.fields ?? []
    const themeFields = tabs.tabs[1]?.fields ?? []
    const topContent = contentFields.find((field) => 'name' in field && field.name === 'topContent')
    const eyebrow = contentFields.find((field) => 'name' in field && field.name === 'eyebrow')
    const mode = themeFields.find((field) => 'name' in field && field.name === 'breadcrumbMode')
    const breadcrumbs = contentFields.find(
      (field) => 'name' in field && field.name === 'breadcrumbs',
    )

    expect(topContent).toMatchObject({
      defaultValue: 'breadcrumb',
      required: true,
      options: [
        { label: 'Breadcrumb', value: 'breadcrumb' },
        { label: 'Eyebrow', value: 'eyebrow' },
      ],
    })
    expect(mode).toMatchObject({ defaultValue: 'automatic', required: true })
    expect(mode && 'options' in mode ? mode.options : []).toEqual([
      { label: 'Automatic — use page hierarchy', value: 'automatic' },
      { label: 'Custom — configure trail below', value: 'custom' },
      { label: 'Hidden', value: 'hidden' },
    ])
    expect(eyebrow?.admin?.condition?.({}, { topContent: 'eyebrow' }, {} as never)).toBe(true)
    expect(eyebrow?.admin?.condition?.({}, { topContent: 'breadcrumb' }, {} as never)).toBe(false)
    expect(mode?.admin?.condition?.({}, { topContent: 'breadcrumb' }, {} as never)).toBe(true)
    expect(mode?.admin?.condition?.({}, { topContent: 'eyebrow' }, {} as never)).toBe(false)
    expect(
      breadcrumbs?.admin?.condition?.(
        {},
        { breadcrumbMode: 'custom', topContent: 'breadcrumb' },
        {} as never,
      ),
    ).toBe(true)
    expect(
      breadcrumbs?.admin?.condition?.(
        {},
        { breadcrumbMode: 'automatic', topContent: 'breadcrumb' },
        {} as never,
      ),
    ).toBe(false)
    expect(
      breadcrumbs?.admin?.condition?.(
        {},
        { breadcrumbMode: 'custom', topContent: 'eyebrow' },
        {} as never,
      ),
    ).toBe(false)
  })

  it('renders only the selected Page Header top content', () => {
    const breadcrumb = renderToStaticMarkup(
      <PageHeaderBlockComponent
        automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'Admissions' }]}
        eyebrow="Admissions eyebrow"
        title="Admissions"
        topContent="breadcrumb"
      />,
    )
    const eyebrow = renderToStaticMarkup(
      <PageHeaderBlockComponent
        automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'Admissions' }]}
        eyebrow="Admissions eyebrow"
        title="Admissions"
        topContent="eyebrow"
      />,
    )

    expect(breadcrumb).toContain('aria-label="Breadcrumb"')
    expect(breadcrumb).not.toContain('Admissions eyebrow')
    expect(eyebrow).toContain('Admissions eyebrow')
    expect(eyebrow).not.toContain('aria-label="Breadcrumb"')
  })

  it('preserves legacy top-content behavior without rendering both sources', () => {
    const withEyebrow = renderToStaticMarkup(
      <PageHeaderBlockComponent
        automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'About' }]}
        eyebrow="About us"
        title="About"
      />,
    )
    const withoutEyebrow = renderToStaticMarkup(
      <PageHeaderBlockComponent
        automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'About' }]}
        title="About"
      />,
    )

    expect(withEyebrow).toContain('About us')
    expect(withEyebrow).not.toContain('aria-label="Breadcrumb"')
    expect(withoutEyebrow).toContain('aria-label="Breadcrumb"')
  })

  it('renders automatic breadcrumbs with current-page semantics', () => {
    const html = renderToStaticMarkup(<PageContent page={mbbs} />)

    expect(html).toContain('href="/academics"')
    expect(html).toContain('Undergraduate Programmes')
    expect(html).toContain('aria-current="page"')
  })

  it('hides automatic breadcrumbs on the homepage', () => {
    const html = renderToStaticMarkup(<PageContent isHomepage page={mbbs} />)
    expect(html).not.toContain('aria-label="Breadcrumb"')
  })

  it('passes page context through reusable sections', () => {
    const reusablePage = page({
      ...mbbs,
      layout: [
        {
          blockType: 'reusableSection',
          section: {
            createdAt: '2026-08-14T00:00:00.000Z',
            id: 'shared-header',
            layout: [
              {
                appearance: { background: 'none', border: 'none' },
                blockType: 'pageHeader',
                breadcrumbMode: 'automatic',
                contentAlignment: 'left',
                height: 'default',
                overlayStyle: 'dark',
                title: 'Reusable header',
                topContent: 'breadcrumb',
                variant: 'minimal',
              },
            ],
            title: 'Shared header',
            updatedAt: '2026-08-14T00:00:00.000Z',
          },
        },
      ],
    })
    const html = renderToStaticMarkup(<PageContent page={reusablePage} />)

    expect(html).toContain('Undergraduate Programmes')
    expect(html).toContain('aria-current="page"')
  })

  it('renders the same automatic trail in live preview', () => {
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        mbbs.layout,
        {
          feedPagesBySize: {},
          ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        [],
        { page: mbbs },
      ),
    )

    expect(html).toContain('Undergraduate Programmes')
    expect(html).toContain('aria-current="page"')
  })
})
