import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LiveRatingSpotlight,
  RatingSpotlightBlockComponent,
} from '@/blocks/RatingSpotlight/Component'
import { RatingSpotlightBlock } from '@/blocks/RatingSpotlight/config'
import { ContentActions } from '@/components/ContentActions'
import { RatingSpotlight } from '@/components/rating-spotlight'

const { getPublishedReviewRatingSummaryMock } = vi.hoisted(() => ({
  getPublishedReviewRatingSummaryMock: vi.fn(),
}))

vi.mock('@/lib/reviewRatingSummary', async () => {
  const actual = await vi.importActual<typeof import('@/lib/reviewRatingSummary')>(
    '@/lib/reviewRatingSummary',
  )

  return {
    ...actual,
    getPublishedReviewRatingSummary: getPublishedReviewRatingSummaryMock,
  }
})

type TestField = {
  admin?: { condition?: (data: unknown, siblingData: unknown) => boolean }
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  max?: number
  maxRows?: number
  min?: number
  name?: string
  options?: Array<{ value: string }>
  required?: boolean
  tabs?: TestTab[]
  type?: string
  validate?: (value: unknown, context: { siblingData?: unknown }) => true | string
}

type TestTab = {
  fields: TestField[]
  label: string
}

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

describe('Rating Spotlight', () => {
  beforeEach(() => {
    getPublishedReviewRatingSummaryMock.mockReset()
  })

  it('defines the canonical two-tab schema and manual override validation', () => {
    expect(RatingSpotlightBlock.slug).toBe('ratingSpotlight')
    expect(RatingSpotlightBlock.interfaceName).toBe('RatingSpotlightBlock')
    expect(RatingSpotlightBlock.labels).toEqual({
      plural: 'Rating Spotlights',
      singular: 'Rating Spotlight',
    })

    const tabsField = RatingSpotlightBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Theme Settings')
    const actionsField = getField(contentTab?.fields ?? [], 'actions')
    const ratingDataField = getField(contentTab?.fields ?? [], 'ratingData')
    const dataModeField = getField(ratingDataField?.fields ?? [], 'dataMode')
    const manualRatingField = getField(ratingDataField?.fields ?? [], 'manualRating')
    const manualReviewCountField = getField(ratingDataField?.fields ?? [], 'manualReviewCount')
    const actionsTabsField = actionsField?.fields?.[0]?.tabs ?? []
    const actionThemeSettingsTab = actionsTabsField.find((tab) => tab.label === 'Theme Settings')
    const actionModeField = getField(actionThemeSettingsTab?.fields ?? [], 'mode')
    const contentAlignmentField = getField(layoutTab?.fields ?? [], 'contentAlignment')
    const sizeField = getField(layoutTab?.fields ?? [], 'size')

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(getField(contentTab?.fields ?? [], 'eyebrow')?.type).toBe('text')
    expect(getField(contentTab?.fields ?? [], 'title')).toMatchObject({
      type: 'text',
    })
    expect(getField(contentTab?.fields ?? [], 'description')?.type).toBe('textarea')
    expect(actionsField).toMatchObject({ label: 'Action', maxRows: 1, type: 'array' })
    expect(dataModeField).toMatchObject({
      defaultValue: 'live',
      required: true,
      type: 'select',
    })
    expect(dataModeField?.options?.map(({ value }) => value)).toEqual(['live', 'manual'])
    expect(manualRatingField).toMatchObject({ max: 5, min: 0, type: 'number' })
    expect(manualReviewCountField).toMatchObject({ min: 0, type: 'number' })
    expect(manualRatingField?.admin?.condition?.({}, { dataMode: 'manual' })).toBe(true)
    expect(manualRatingField?.admin?.condition?.({}, { dataMode: 'live' })).toBe(false)
    expect(manualRatingField?.validate?.(undefined, { siblingData: { dataMode: 'live' } })).toBe(
      true,
    )
    expect(
      manualRatingField?.validate?.(undefined, { siblingData: { dataMode: 'manual' } }),
    ).toBeTypeOf('string')
    expect(manualRatingField?.validate?.(5.1, { siblingData: { dataMode: 'manual' } })).toBeTypeOf(
      'string',
    )
    expect(manualRatingField?.validate?.(4.8, { siblingData: { dataMode: 'manual' } })).toBe(true)
    expect(
      manualReviewCountField?.validate?.(-1, { siblingData: { dataMode: 'manual' } }),
    ).toBeTypeOf('string')
    expect(
      manualReviewCountField?.validate?.(1.5, { siblingData: { dataMode: 'manual' } }),
    ).toBeTypeOf('string')
    expect(manualReviewCountField?.validate?.(1240, { siblingData: { dataMode: 'manual' } })).toBe(
      true,
    )
    expect(actionModeField?.defaultValue).toBe('link')
    expect(contentAlignmentField?.defaultValue).toBe('center')
    expect(sizeField?.defaultValue).toBe('default')
  })

  it('renders semantic theme, normalized content, rating accessibility, and shared action', () => {
    const actions = createElement(ContentActions, {
      actions: [
        {
          href: '/reviews/new',
          label: 'Leave a review',
          mode: 'button',
          openInNewTab: false,
          showArrow: false,
          variant: 'default',
        },
      ],
      alignment: 'center',
    })
    const html = renderToStaticMarkup(
      RatingSpotlight({
        actions,
        alignment: 'center',
        appearance: { background: 'subtle', border: 'topAndBottom' },
        description: 'Your feedback helps us improve.',
        eyebrow: 'Feedback',
        size: 'compact',
        summary: { average: 4.8, count: 1240 },
        title: "Tell us how we're doing.",
      }),
    )

    expect(html).toContain('data-rating-spotlight="true"')
    expect(html).toContain('data-rating-spotlight-data="resolved"')
    expect(html).toContain('4.8 / 5')
    expect(html).toContain('1,240 reviews')
    expect(html).toContain('aria-label="4.8 out of 5 from 1,240 reviews"')
    expect(html.match(/data-rating-star=/g)).toHaveLength(5)
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html).toContain(
      'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).toContain('text-base leading-7 text-balance text-current')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('href="/reviews/new"')
  })

  it('formats singular reviews and omits an unavailable summary', () => {
    const singular = renderToStaticMarkup(
      RatingSpotlight({ summary: { average: 5, count: 1 }, title: 'One review' }),
    )
    const empty = renderToStaticMarkup(RatingSpotlight({ summary: null, title: 'No reviews' }))

    expect(singular).toContain('1 review')
    expect(singular).not.toContain('1 reviews')
    expect(empty).toContain('data-rating-spotlight-data="empty"')
    expect(empty).not.toContain('data-rating-summary="true"')
  })

  it('uses complete manual data without calling the live resolver', () => {
    const html = renderToStaticMarkup(
      RatingSpotlightBlockComponent({
        actions: [
          {
            label: 'Leave a review',
            linkType: 'custom',
            mode: 'button',
            url: '/reviews/new',
            variant: 'default',
          },
        ],
        ratingData: { dataMode: 'manual', manualRating: 4.7, manualReviewCount: 52 },
        title: 'Share your experience',
      }),
    )

    expect(html).toContain('4.7 / 5')
    expect(html).toContain('52 reviews')
    expect(html).toContain('data-action-mode="button"')
    expect(getPublishedReviewRatingSummaryMock).not.toHaveBeenCalled()
  })

  it('rejects partial manual data and resolves Live data through the async server child', async () => {
    const partial = renderToStaticMarkup(
      RatingSpotlightBlockComponent({
        ratingData: { dataMode: 'manual', manualRating: 4.7 },
        title: 'Partial manual data',
      }),
    )

    expect(partial).toContain('data-rating-spotlight-data="empty"')

    getPublishedReviewRatingSummaryMock.mockResolvedValueOnce({ average: 4.6, count: 18 })
    const liveElement = await LiveRatingSpotlight({ title: 'Live reviews' })
    const live = renderToStaticMarkup(liveElement)

    expect(live).toContain('4.6 / 5')
    expect(live).toContain('18 reviews')
    expect(getPublishedReviewRatingSummaryMock).toHaveBeenCalledTimes(1)
  })

  it('preserves content and action when Live data is unavailable', async () => {
    getPublishedReviewRatingSummaryMock.mockResolvedValueOnce(null)
    const element = await LiveRatingSpotlight({
      actions: 'Leave a review',
      description: 'Help us improve.',
      eyebrow: 'Feedback',
      title: 'Share your experience',
    })
    const html = renderToStaticMarkup(element)

    expect(html).toContain('Feedback')
    expect(html).toContain('Share your experience')
    expect(html).toContain('Help us improve.')
    expect(html).toContain('Leave a review')
    expect(html).toContain('data-rating-spotlight-data="empty"')
    expect(html).not.toContain('data-rating-summary="true"')
  })

  it('keeps the runtime server-only', () => {
    for (const path of [
      'src/blocks/RatingSpotlight/config.ts',
      'src/blocks/RatingSpotlight/Component.tsx',
      'src/components/rating-spotlight.tsx',
    ]) {
      const source = readFileSync(path, 'utf8')

      expect(source).not.toContain("'use client'")
      expect(source).not.toContain('useEffect')
      expect(source).not.toContain('useState')
      expect(source).not.toContain('window.')
      expect(source).not.toContain('fetch(')
    }
  })
})
