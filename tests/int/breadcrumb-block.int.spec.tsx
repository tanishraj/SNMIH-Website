import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PageContent } from '@/app/(frontend)/PageContent'
import { BreadcrumbBlockComponent } from '@/blocks/Breadcrumb/Component'
import { BreadcrumbBlock } from '@/blocks/Breadcrumb/config'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { createBreadcrumbModeField } from '@/blocks/shared/breadcrumbFields'
import { blockThumbnailDefinitions } from '@/block-thumbnails/definitions'
import { BreadcrumbTrail } from '@/components/BreadcrumbTrail'
import { resolveCustomPageBreadcrumbs } from '@/lib/pageBreadcrumbs'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import type { Page } from '@/payload-types'

const page = (value: Partial<Page>): Page => value as Page

const academics = page({
  id: 'academics',
  parent: null,
  slug: 'academics',
  title: 'Academics',
})
const mbbs = page({
  id: 'mbbs',
  parent: academics,
  slug: 'mbbs',
  title: 'MBBS',
})
const automaticItems = [
  { label: 'Home', url: '/' },
  { label: 'Academics', url: '/academics' },
  { label: 'MBBS', url: '/academics/mbbs' },
]

function getTabs(block: typeof BreadcrumbBlock | typeof PageHeaderBlock) {
  const tabs = block.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') {
    throw new Error('Expected static Content and Theme Settings tabs')
  }
  return tabs.tabs
}

const emptyReviewSnapshot = {
  feedPagesBySize: {},
  ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] as const },
}

describe('Breadcrumb block schema', () => {
  it('offers automatic and custom sources without a hidden option', () => {
    const mode = createBreadcrumbModeField()

    expect(mode).toMatchObject({ defaultValue: 'automatic', required: true })
    expect(mode.options).toEqual([
      { label: 'Automatic — use page hierarchy', value: 'automatic' },
      { label: 'Custom — configure trail below', value: 'custom' },
    ])
  })

  it('preserves hidden mode on the Page Header', () => {
    const [, theme] = getTabs(PageHeaderBlock)
    const mode = theme?.fields.find((field) => 'name' in field && field.name === 'breadcrumbMode')

    expect(mode && 'options' in mode ? mode.options : []).toContainEqual({
      label: 'Hidden',
      value: 'hidden',
    })
  })

  it('exposes the approved appearance and layout controls', () => {
    const [content, theme] = getTabs(BreadcrumbBlock)
    const contentByName = (name: string) =>
      content?.fields.find((field) => 'name' in field && field.name === name)
    const themeByName = (name: string) =>
      theme?.fields.find((field) => 'name' in field && field.name === name)

    expect(contentByName('breadcrumbMode')).toMatchObject({
      defaultValue: 'automatic',
      required: true,
    })
    expect(themeByName('separator')).toMatchObject({
      defaultValue: 'chevron',
      required: true,
    })
    expect(themeByName('alignment')).toMatchObject({ defaultValue: 'left', required: true })
    expect(themeByName('size')).toMatchObject({ defaultValue: 'default', required: true })
    expect(themeByName('showHome')).toMatchObject({ defaultValue: true })
    expect(themeByName('showCurrentPage')).toMatchObject({ defaultValue: true })
    expect(themeByName('sectionPadding')).toMatchObject({
      defaultValue: 'compact',
      required: true,
    })
    expect(themeByName('appearance')).toBeTruthy()
  })

  it('registers a block-picker thumbnail', () => {
    expect(blockThumbnailDefinitions).toContainEqual(
      expect.objectContaining({
        filename: 'breadcrumb.jpg',
        label: 'Breadcrumb',
        slug: 'breadcrumb',
      }),
    )
  })
})

describe('BreadcrumbTrail', () => {
  it('uses ordered navigation and leaves the current page unlinked', () => {
    const html = renderToStaticMarkup(<BreadcrumbTrail items={automaticItems} />)

    expect(html).toContain('<nav aria-label="Breadcrumb"')
    expect(html).toContain('<ol')
    expect(html).toContain('href="/academics"')
    expect(html).toContain('aria-current="page"')
    expect(html).not.toContain('href="/academics/mbbs"')
    expect(html).not.toContain('underline')
    expect(html).toContain('mx-1.5')
    expect(html).not.toContain('gap-x-')
    expect(html).toContain('font-normal text-current/70')
  })

  it.each(['arrow', 'chevron', 'dot', 'slash'] as const)(
    'renders the %s separator decoratively',
    (separator) => {
      const html = renderToStaticMarkup(
        <BreadcrumbTrail items={automaticItems} separator={separator} />,
      )

      expect(html).toContain(`data-breadcrumb-separator="${separator}"`)
      expect(html).toContain('aria-hidden="true"')
    },
  )

  it('can hide Home and current page without marking an ancestor current', () => {
    const html = renderToStaticMarkup(
      <BreadcrumbTrail items={automaticItems} showCurrentPage={false} showHome={false} />,
    )

    expect(html).toContain('Academics')
    expect(html).not.toContain('Home')
    expect(html).not.toContain('MBBS')
    expect(html).not.toContain('aria-current="page"')
  })

  it('does not treat an arbitrary first custom item as Home', () => {
    const html = renderToStaticMarkup(
      <BreadcrumbTrail
        items={[
          { label: 'Admissions', url: '/admissions' },
          { label: 'Apply', url: '/apply' },
        ]}
        showHome={false}
      />,
    )

    expect(html).toContain('Admissions')
  })
})

describe('Breadcrumb block rendering', () => {
  it('normalizes structural custom breadcrumb inputs', () => {
    expect(
      resolveCustomPageBreadcrumbs([
        { label: 'Admissions', linkType: 'custom', url: '/admissions' },
        { label: 'Apply', linkType: 'custom' },
      ]),
    ).toEqual([
      { label: 'Admissions', url: '/admissions' },
      { label: 'Apply', url: undefined },
    ])
  })

  it('applies theme, separator, alignment, size, and spacing controls', () => {
    const html = renderToStaticMarkup(
      <BreadcrumbBlockComponent
        alignment="center"
        appearance={{ background: 'brand', border: 'topAndBottom' }}
        automaticBreadcrumbs={automaticItems}
        breadcrumbMode="automatic"
        sectionPadding="compact"
        separator="slash"
        showCurrentPage
        showHome
        size="compact"
      />,
    )

    expect(html).toContain('data-breadcrumb-block="true"')
    expect(html).toContain('data-block-surface="brand"')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('text-current hover:text-current/80')
    expect(html).toContain('data-breadcrumb-separator="slash"')
    expect(html).toContain('justify-center')
    expect(html).toContain('text-xs')
    expect(html).toContain('py-8')
  })

  it('uses the theme primary link color on light surfaces', () => {
    const html = renderToStaticMarkup(
      <BreadcrumbBlockComponent
        appearance={{ background: 'none', border: 'none' }}
        automaticBreadcrumbs={automaticItems}
      />,
    )

    expect(html).toContain('font-semibold')
    expect(html).toContain('text-primary hover:text-primary/80')
    expect(html).toContain('font-normal text-current/70')
  })

  it('renders custom items and omits an empty visible trail', () => {
    const custom = renderToStaticMarkup(
      <BreadcrumbBlockComponent
        breadcrumbMode="custom"
        breadcrumbs={[
          { label: 'Admissions', linkType: 'custom', url: '/admissions' },
          { label: 'Apply', linkType: 'custom' },
        ]}
      />,
    )
    const empty = renderToStaticMarkup(
      <BreadcrumbBlockComponent
        automaticBreadcrumbs={[{ label: 'Home', url: '/' }]}
        showCurrentPage={false}
      />,
    )

    expect(custom).toContain('href="/admissions"')
    expect(custom).toContain('aria-current="page"')
    expect(empty).toBe('')
  })

  it('receives automatic context through production rendering', () => {
    const renderedPage = page({
      ...mbbs,
      layout: [
        {
          alignment: 'left',
          appearance: { background: 'none', border: 'none' },
          blockType: 'breadcrumb',
          breadcrumbMode: 'automatic',
          sectionPadding: 'compact',
          separator: 'chevron',
          showCurrentPage: true,
          showHome: true,
          size: 'default',
        },
      ],
    })
    const html = renderToStaticMarkup(<PageContent page={renderedPage} />)

    expect(html).toContain('href="/academics"')
    expect(html).toContain('aria-current="page"')
  })

  it('receives page context inside reusable sections', () => {
    const renderedPage = page({
      ...mbbs,
      layout: [
        {
          blockType: 'reusableSection',
          section: {
            createdAt: '2026-08-14T00:00:00.000Z',
            id: 'breadcrumb-section',
            layout: [
              {
                alignment: 'left',
                appearance: { background: 'none', border: 'none' },
                blockType: 'breadcrumb',
                breadcrumbMode: 'automatic',
                sectionPadding: 'compact',
                separator: 'slash',
                showCurrentPage: true,
                showHome: true,
                size: 'default',
              },
            ],
            title: 'Breadcrumb section',
            updatedAt: '2026-08-14T00:00:00.000Z',
          },
        },
      ],
    })
    const html = renderToStaticMarkup(<PageContent page={renderedPage} />)

    expect(html).toContain('data-breadcrumb-separator="slash"')
    expect(html).toContain('aria-current="page"')
  })

  it('receives the same automatic context in live preview', () => {
    const layout = [
      {
        alignment: 'right',
        appearance: { background: 'none', border: 'none' },
        blockType: 'breadcrumb',
        breadcrumbMode: 'automatic',
        sectionPadding: 'compact',
        separator: 'arrow',
        showCurrentPage: true,
        showHome: true,
        size: 'default',
      },
    ] as Page['layout']
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        emptyReviewSnapshot,
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        [],
        { page: mbbs },
      ),
    )

    expect(html).toContain('data-breadcrumb-separator="arrow"')
    expect(html).toContain('justify-end')
    expect(html).toContain('aria-current="page"')
  })
})
