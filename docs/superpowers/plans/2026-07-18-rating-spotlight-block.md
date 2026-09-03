# Rating Spotlight Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a theme-native Rating Spotlight page block that shows a live aggregate of published reviews or a complete manual override alongside editorial content and one action.

**Architecture:** A focused server utility calculates the aggregate with five parallel Payload count queries and React request-level deduplication. A pure synchronous presentation renders resolved content and metrics, while the Payload adapter keeps Manual mode synchronous and delegates only Live mode to a small async server child.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19 Server Components and `cache()`, TypeScript 5.7, Tailwind CSS 4, shadcn/ui Button, Lucide React, Vitest, Playwright thumbnail generator.

## Global Constraints

- Canonical slug is `ratingSpotlight`; generated interface is `RatingSpotlightBlock`.
- Live mode aggregates only `reviews` records where `_status` equals `published`.
- Raw form submissions, drafts, scheduled reviews, and in-review content never affect the metric.
- Live mode uses five concurrent `payload.count()` calls and never loads review documents.
- Manual Override supplies both rating and review count; mixed live/manual metrics are not supported.
- Live mode with zero published reviews or a failed query omits only the rating row.
- Query failures are recorded through `payload.logger.error()`.
- The block remains server-rendered and introduces no client component, effect, browser API, or client fetch.
- Use semantic theme tokens, shared appearance, shared ContentActions, shared Button variants, normalized typography, and regular block spacing.
- No new dependency or global CSS is required.
- Do not stage or commit any files.

---

## File Structure

- Create `src/lib/reviewRatingSummary.ts`: published-review aggregate types, pure weighted-average calculation, Payload count-query runner, safe logger-backed resolver, and React-cached public resolver.
- Create `src/blocks/RatingSpotlight/config.ts`: two-tab Payload block schema with conditional all-or-nothing manual data validation.
- Create `src/components/rating-spotlight.tsx`: pure synchronous themed presentation.
- Create `src/blocks/RatingSpotlight/Component.tsx`: Payload adapter, manual normalization, resolved actions, and isolated async Live child.
- Create `tests/int/review-rating-summary.int.spec.ts`: aggregate query, parallelism, calculation, zero-state, and logging tests.
- Create `tests/int/rating-spotlight.int.spec.ts`: schema, manual adapter, live child, presentation, accessibility, registration, and source-boundary tests.
- Modify `src/block-thumbnails/definitions.ts`: add deterministic thumbnail metadata before the block config references it.
- Modify `src/block-thumbnails/fixtures.tsx`: add a manual-mode production fixture alongside the presentation.
- Modify `src/collections/Pages.ts`: add the block to page layouts.
- Modify `src/blocks/renderPageBlocks.tsx`: render the new block type.
- Modify `tests/int/page-blocks.int.spec.ts`, `tests/int/system-page-blocks.int.spec.ts`, and `tests/int/block-thumbnails.int.spec.ts`: extend canonical block expectations.
- Regenerate `src/payload-types.ts`: include `RatingSpotlightBlock` in the Page layout union.
- Generate `public/block-thumbnails/rating-spotlight.jpg`: real-render block thumbnail.

### Task 1: Build the published-review rating aggregate

**Files:**

- Create: `src/lib/reviewRatingSummary.ts`
- Create: `tests/int/review-rating-summary.int.spec.ts`

**Interfaces:**

- Produces `PublishedReviewRatingSummary = { average: number; count: number }`.
- Produces `calculatePublishedReviewRatingSummary(counts: readonly number[]): PublishedReviewRatingSummary | null`.
- Produces `fetchPublishedReviewRatingSummary(payload: ReviewRatingPayload): Promise<PublishedReviewRatingSummary | null>` for isolated testing.
- Produces cached `getPublishedReviewRatingSummary(): Promise<PublishedReviewRatingSummary | null>` for server rendering.

- [ ] **Step 1: Write failing aggregate tests**

Create `tests/int/review-rating-summary.int.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import {
  calculatePublishedReviewRatingSummary,
  fetchPublishedReviewRatingSummary,
  type ReviewRatingPayload,
} from '@/lib/reviewRatingSummary'

describe('published review rating summary', () => {
  it('calculates a weighted average and total from five rating buckets', () => {
    expect(calculatePublishedReviewRatingSummary([1, 2, 3, 4, 10])).toEqual({
      average: 4,
      count: 20,
    })
    expect(calculatePublishedReviewRatingSummary([0, 0, 0, 0, 0])).toBeNull()
  })

  it('counts all five published rating buckets concurrently', async () => {
    const resolvers: Array<(value: { totalDocs: number }) => void> = []
    const count = vi.fn(
      () =>
        new Promise<{ totalDocs: number }>((resolve) => {
          resolvers.push(resolve)
        }),
    )
    const logger = { error: vi.fn() }
    const payload = { count, logger } as unknown as ReviewRatingPayload
    const summaryPromise = fetchPublishedReviewRatingSummary(payload)

    expect(count).toHaveBeenCalledTimes(5)
    expect(count.mock.calls.map(([request]) => request.where)).toEqual(
      ['1', '2', '3', '4', '5'].map((rating) => ({
        and: [{ _status: { equals: 'published' } }, { rating: { equals: rating } }],
      })),
    )

    ;[1, 2, 3, 4, 10].forEach((totalDocs, index) => resolvers[index]?.({ totalDocs }))

    await expect(summaryPromise).resolves.toEqual({ average: 4, count: 20 })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns null and logs when a count query fails', async () => {
    const failure = new Error('database unavailable')
    const logger = { error: vi.fn() }
    const count = vi.fn().mockRejectedValue(failure)
    const payload = { count, logger } as unknown as ReviewRatingPayload

    await expect(fetchPublishedReviewRatingSummary(payload)).resolves.toBeNull()
    expect(logger.error).toHaveBeenCalledWith({
      err: failure,
      msg: 'Failed to aggregate published review ratings.',
    })
  })
})
```

- [ ] **Step 2: Run the tests and verify the module is missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-rating-summary.int.spec.ts
```

Expected: FAIL because `@/lib/reviewRatingSummary` does not exist.

- [ ] **Step 3: Implement the pure calculator and five-query resolver**

Create `src/lib/reviewRatingSummary.ts`:

```ts
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

export type PublishedReviewRatingSummary = {
  average: number
  count: number
}

export type ReviewRatingPayload = Pick<Payload, 'count' | 'logger'>

const ratingValues = ['1', '2', '3', '4', '5'] as const

export function calculatePublishedReviewRatingSummary(
  counts: readonly number[],
): PublishedReviewRatingSummary | null {
  const count = counts.reduce((total, current) => total + current, 0)

  if (count === 0) {
    return null
  }

  const weightedTotal = counts.reduce(
    (total, current, index) => total + current * (index + 1),
    0,
  )

  return {
    average: weightedTotal / count,
    count,
  }
}

export async function fetchPublishedReviewRatingSummary(
  payload: ReviewRatingPayload,
): Promise<PublishedReviewRatingSummary | null> {
  try {
    const buckets = await Promise.all(
      ratingValues.map((rating) =>
        payload.count({
          collection: 'reviews',
          overrideAccess: true,
          where: {
            and: [{ _status: { equals: 'published' } }, { rating: { equals: rating } }],
          },
        }),
      ),
    )

    return calculatePublishedReviewRatingSummary(buckets.map(({ totalDocs }) => totalDocs))
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: 'Failed to aggregate published review ratings.',
    })
    return null
  }
}

export const getPublishedReviewRatingSummary = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  return fetchPublishedReviewRatingSummary(payload)
})
```

- [ ] **Step 4: Run focused tests and TypeScript-check the new utility**

Run:

```bash
pnpm exec prettier --write src/lib/reviewRatingSummary.ts tests/int/review-rating-summary.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-rating-summary.int.spec.ts
pnpm exec tsc --noEmit --pretty false 2>&1 | rg 'reviewRatingSummary|review-rating-summary' || true
```

Expected: all three aggregate tests pass and the scoped TypeScript output contains no error from either new file.

### Task 2: Add the Payload schema and pure themed presentation

**Files:**

- Create: `src/blocks/RatingSpotlight/config.ts`
- Create: `src/components/rating-spotlight.tsx`
- Create: `src/blocks/RatingSpotlight/Component.tsx`
- Create: `tests/int/rating-spotlight.int.spec.ts`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`

**Interfaces:**

- Produces `RatingSpotlightBlock` Payload `Block` config.
- Produces pure `RatingSpotlight(props: RatingSpotlightProps)`.
- Produces `RatingSpotlightBlockComponent(props: RatingSpotlightBlockLike)`.
- Produces async `LiveRatingSpotlight(props: RatingSpotlightPresentationProps)` for testable Live resolution.

- [ ] **Step 1: Write failing schema and presentation tests**

Create `tests/int/rating-spotlight.int.spec.ts` with these schema helpers:

```ts
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
  type?: string
  validate?: (value: unknown, context: { siblingData?: unknown }) => true | string
}

type TestTab = {
  fields: TestField[]
  label: string
}

const getField = (fields: TestField[], name: string) =>
  fields.find((field) => field.name === name)
```

Cover these exact assertions:

```ts
expect(RatingSpotlightBlock.slug).toBe('ratingSpotlight')
expect(RatingSpotlightBlock.interfaceName).toBe('RatingSpotlightBlock')
expect(RatingSpotlightBlock.labels).toEqual({
  singular: 'Rating Spotlight',
  plural: 'Rating Spotlights',
})
expect(tabLabels).toEqual(['Content', 'Layout & Theme'])
expect(actionsField.maxRows).toBe(1)
expect(dataModeField).toMatchObject({ defaultValue: 'live', required: true, type: 'select' })
expect(dataModeField.options.map(({ value }) => value)).toEqual(['live', 'manual'])
expect(manualRatingField).toMatchObject({ min: 0, max: 5, type: 'number' })
expect(manualReviewCountField).toMatchObject({ min: 0, type: 'number' })
expect(actionModeField.defaultValue).toBe('link')
expect(contentAlignmentField.defaultValue).toBe('left')
expect(sizeField.defaultValue).toBe('default')
```

Call both conditional validators with Live and Manual sibling data. Verify Live accepts empty values, Manual rejects missing or invalid values, ratings outside `0–5`, negative counts, and fractional counts.

Render the pure presentation with summary `{ average: 4.8, count: 1240 }`, themed appearance, centered alignment, and a resolved Button action. Assert:

```ts
expect(html).toContain('data-rating-spotlight="true"')
expect(html).toContain('data-rating-spotlight-data="resolved"')
expect(html).toContain('4.8')
expect(html).toContain('/ 5')
expect(html).toContain('1,240 reviews')
expect(html).toContain('aria-label="4.8 out of 5 from 1,240 reviews"')
expect(html.match(/data-rating-star=/g)).toHaveLength(5)
expect(html).toContain('bg-muted')
expect(html).toContain('border-y border-border')
expect(html).toContain('text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl')
expect(html).toContain('text-base leading-7 text-balance text-current/70')
expect(html).toContain('data-action-mode="button"')
```

Also verify a count of one renders `1 review`, `summary={null}` omits the rating row, and source inspection finds no `'use client'`, `useEffect`, `useState`, `window`, or `fetch(` in the three new runtime files.

- [ ] **Step 2: Run the tests and verify the new modules are missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rating-spotlight.int.spec.ts
```

Expected: FAIL because the Rating Spotlight modules do not exist.

- [ ] **Step 3: Implement the conditional Payload schema**

Before the config references its thumbnail, add this definition to `src/block-thumbnails/definitions.ts`:

```ts
defineThumbnail({
  alt: 'Rating Spotlight block preview',
  filename: 'rating-spotlight.jpg',
  label: 'Rating Spotlight',
  slug: 'ratingSpotlight',
}),
```

Create `src/blocks/RatingSpotlight/config.ts` with:

```ts
import type { Block, GroupField, NumberField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  createContentActionModeField,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

type RatingDataSiblingData = {
  dataMode?: 'live' | 'manual' | null
}

const isManualMode = (_data: unknown, siblingData: RatingDataSiblingData) =>
  siblingData?.dataMode === 'manual'

const ratingDataField = {
  name: 'ratingData',
  label: 'Rating Data',
  type: 'group',
  fields: [
    {
      name: 'dataMode',
      label: 'Data Mode',
      type: 'select',
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Manual Override', value: 'manual' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'manualRating',
      label: 'Manual Rating',
      type: 'number',
      min: 0,
      max: 5,
      admin: { condition: isManualMode },
      validate: (value: unknown, { siblingData }: { siblingData?: RatingDataSiblingData }) => {
        if (siblingData?.dataMode !== 'manual') return true
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5
          ? true
          : 'Manual rating is required and must be between 0 and 5.'
      },
    } satisfies NumberField,
    {
      name: 'manualReviewCount',
      label: 'Manual Review Count',
      type: 'number',
      min: 0,
      admin: { condition: isManualMode },
      validate: (value: unknown, { siblingData }: { siblingData?: RatingDataSiblingData }) => {
        if (siblingData?.dataMode !== 'manual') return true
        return typeof value === 'number' && Number.isInteger(value) && value >= 0
          ? true
          : 'Manual review count is required and must be a non-negative integer.'
      },
    } satisfies NumberField,
  ],
} satisfies GroupField
```

Add these fields and the complete block export after `ratingDataField`:

```ts
const contentAlignmentField = {
  name: 'contentAlignment',
  label: 'Content Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField

const sizeField = {
  name: 'size',
  label: 'Size',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Comfortable', value: 'comfortable' },
  ],
  required: true,
} satisfies SelectField

export const RatingSpotlightBlock: Block = {
  slug: 'ratingSpotlight',
  interfaceName: 'RatingSpotlightBlock',
  admin: getBlockThumbnailAdmin('ratingSpotlight'),
  labels: {
    singular: 'Rating Spotlight',
    plural: 'Rating Spotlights',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Action', maxRows: 1 }),
            ratingDataField,
          ],
        },
        {
          label: 'Layout & Theme',
          fields: [
            createBlockAppearanceFields({ includeTextOverride: false }),
            createContentActionModeField(),
            contentAlignmentField,
            sizeField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

- [ ] **Step 4: Implement the pure Rating Spotlight presentation**

Create `src/components/rating-spotlight.tsx` as this pure server presentation:

```tsx
import { Star } from 'lucide-react'
import type { ReactNode } from 'react'

import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import type { PublishedReviewRatingSummary } from '@/lib/reviewRatingSummary'
import { cn } from '@/lib/utils'

export type RatingSpotlightAlignment = 'center' | 'left' | 'right'
export type RatingSpotlightSize = 'comfortable' | 'compact' | 'default'

export type RatingSpotlightPresentationProps = {
  actions?: ReactNode
  alignment?: RatingSpotlightAlignment
  appearance?: BlockAppearance | null
  description?: string | null
  eyebrow?: string | null
  size?: RatingSpotlightSize
  summary?: PublishedReviewRatingSummary | null
  title: string
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const numberFormatter = new Intl.NumberFormat('en-US')
const starIndexes = [0, 1, 2, 3, 4] as const

function RatingSummary({ summary }: { summary: PublishedReviewRatingSummary }) {
  const average = Math.min(5, Math.max(0, summary.average))
  const averageLabel = average.toFixed(1)
  const countLabel = numberFormatter.format(summary.count)
  const reviewLabel = summary.count === 1 ? 'review' : 'reviews'
  const filledStarCount = Math.round(average)

  return (
    <div
      aria-label={`${averageLabel} out of 5 from ${countLabel} ${reviewLabel}`}
      className="flex flex-wrap items-center gap-3"
      data-rating-summary="true"
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        {starIndexes.map((index) => (
          <Star
            className={cn(
              'size-4',
              index < filledStarCount ? 'fill-current text-primary' : 'text-current/20',
            )}
            data-rating-star={index + 1}
            key={index}
          />
        ))}
      </span>
      <span className="text-sm text-current/70">
        <strong className="font-semibold text-current">{averageLabel} / 5</strong>
        {' · '}
        {countLabel} {reviewLabel}
      </span>
    </div>
  )
}

export function RatingSpotlight({
  actions,
  alignment = 'left',
  appearance,
  description,
  eyebrow,
  size = 'default',
  summary,
  title,
}: RatingSpotlightPresentationProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className)}
      data-rating-spotlight="true"
      data-rating-spotlight-alignment={alignment}
      data-rating-spotlight-background={appearance?.background ?? 'none'}
      data-rating-spotlight-data={summary ? 'resolved' : 'empty'}
      data-rating-spotlight-size={size}
    >
      <div
        className={cn(
          regularBlockContainerClasses,
          'grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12',
        )}
      >
        <div className={cn('flex max-w-3xl flex-col gap-6', alignmentClasses[alignment])}>
          <div className="flex flex-col gap-4">
            {eyebrow ? (
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="text-base leading-7 text-balance text-current/70">{description}</p>
            ) : null}
          </div>
          {summary ? <RatingSummary summary={summary} /> : null}
        </div>
        {actions}
      </div>
    </section>
  )
}
```

Keep `RatingSummary` at module scope. The fixed `en-US` formatter makes server output deterministic while providing grouped thousands. The stars are decorative and the surrounding row supplies the complete accessible label.

- [ ] **Step 5: Implement the manual adapter and async Live child**

Complete `src/blocks/RatingSpotlight/Component.tsx` with this server-only adapter:

```tsx
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { ContentActions } from '@/components/ContentActions'
import {
  RatingSpotlight,
  type RatingSpotlightAlignment,
  type RatingSpotlightPresentationProps,
  type RatingSpotlightSize,
} from '@/components/rating-spotlight'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import {
  getPublishedReviewRatingSummary,
  type PublishedReviewRatingSummary,
} from '@/lib/reviewRatingSummary'

export type RatingSpotlightBlockLike = {
  actionMode?: 'button' | 'link' | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: RatingSpotlightAlignment | null
  description?: string | null
  eyebrow?: string | null
  ratingData?: {
    dataMode?: 'live' | 'manual' | null
    manualRating?: number | null
    manualReviewCount?: number | null
  } | null
  size?: RatingSpotlightSize | null
  title?: string | null
}

const resolveManualSummary = (
  ratingData: RatingSpotlightBlockLike['ratingData'],
): PublishedReviewRatingSummary | null => {
  const average = ratingData?.manualRating
  const count = ratingData?.manualReviewCount

  if (
    typeof average !== 'number' ||
    !Number.isFinite(average) ||
    average < 0 ||
    average > 5 ||
    typeof count !== 'number' ||
    !Number.isInteger(count) ||
    count < 0
  ) {
    return null
  }

  return { average, count }
}

export async function LiveRatingSpotlight(
  props: Omit<RatingSpotlightPresentationProps, 'summary'>,
) {
  const summary = await getPublishedReviewRatingSummary()

  return <RatingSpotlight {...props} summary={summary} />
}

export function RatingSpotlightBlockComponent({
  actionMode = 'link',
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  eyebrow,
  ratingData,
  size = 'default',
  title,
}: RatingSpotlightBlockLike) {
  const resolvedTitle = title?.trim()

  if (!resolvedTitle) {
    return null
  }

  const resolvedAlignment = contentAlignment ?? 'left'
  const resolvedSize = size ?? 'default'
  const resolvedActionMode = actionMode ?? 'link'
  const resolvedActions = resolveCmsActions(actions)
  const presentationProps: Omit<RatingSpotlightPresentationProps, 'summary'> = {
    actions: resolvedActions.length ? (
      <ContentActions
        actions={resolvedActions}
        alignment={resolvedAlignment}
        className="lg:w-auto lg:justify-end"
        mode={resolvedActionMode}
      />
    ) : undefined,
    alignment: resolvedAlignment,
    appearance,
    description: description?.trim(),
    eyebrow: eyebrow?.trim(),
    size: resolvedSize,
    title: resolvedTitle,
  }

  if (ratingData?.dataMode === 'manual') {
    return <RatingSpotlight {...presentationProps} summary={resolveManualSummary(ratingData)} />
  }

  return <LiveRatingSpotlight {...presentationProps} />
}
```

- [ ] **Step 6: Complete adapter tests**

Mock `getPublishedReviewRatingSummary` in the Rating Spotlight test file. Verify:

- Manual mode renders `4.7 / 5` and `52 reviews` without calling the live resolver.
- Manual mode with invalid or partial values hides the rating row.
- `await LiveRatingSpotlight(...)` renders mocked live data.
- A mocked `null` live result preserves the eyebrow, title, description, and action while omitting `data-rating-spotlight-data="resolved"`.

Add the Manual Override fixture to `src/block-thumbnails/fixtures.tsx` at the same time so the extended `BlockThumbnailSlug` record stays complete:

```tsx
ratingSpotlight: (
  <RatingSpotlightBlockComponent
    actionMode="button"
    actions={[
      {
        label: 'Leave a review',
        linkType: 'custom',
        url: '/reviews/new',
        variant: 'default',
      },
    ]}
    appearance={{ background: 'muted', border: 'topAndBottom' }}
    description="Students, alumni, parents, and campus visitors — your rating and review help us keep sharpening what works."
    eyebrow="Feedback"
    ratingData={{ dataMode: 'manual', manualRating: 4.8, manualReviewCount: 1240 }}
    size="compact"
    title="Tell us how we're doing."
  />
),
```

- [ ] **Step 7: Format and run both focused suites**

Run:

```bash
pnpm exec prettier --write src/lib/reviewRatingSummary.ts src/blocks/RatingSpotlight/config.ts src/blocks/RatingSpotlight/Component.tsx src/components/rating-spotlight.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/review-rating-summary.int.spec.ts tests/int/rating-spotlight.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-rating-summary.int.spec.ts tests/int/rating-spotlight.int.spec.ts
```

Expected: all new aggregate, schema, presentation, manual, and live tests pass.

### Task 3: Register the block, generate types, and add the real thumbnail

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Regenerate: `src/payload-types.ts`
- Generate: `public/block-thumbnails/rating-spotlight.jpg`

**Interfaces:**

- Extends `Page['layout']` with generated `RatingSpotlightBlock`.
- Extends `BlockThumbnailSlug` with `ratingSpotlight`.
- Makes `renderPageBlocks` render `RatingSpotlightBlockComponent`.

- [ ] **Step 1: Add failing registration expectations**

In `tests/int/rating-spotlight.int.spec.ts`, assert the Pages layout block slugs contain `ratingSpotlight` and `renderPageBlocks([{ blockType: 'ratingSpotlight', ...manualFixture }])` contains `data-rating-spotlight="true"`.

Add `ratingSpotlight` to the canonical block-slug arrays in:

- `tests/int/page-blocks.int.spec.ts`;
- `tests/int/system-page-blocks.int.spec.ts`;
- `tests/int/block-thumbnails.int.spec.ts`.

Expected thumbnail metadata:

```ts
expect(getBlockThumbnailDefinition('ratingSpotlight')).toMatchObject({
  alt: 'Rating Spotlight block preview',
  filename: 'rating-spotlight.jpg',
  label: 'Rating Spotlight',
  slug: 'ratingSpotlight',
})
```

- [ ] **Step 2: Run registration tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/rating-spotlight.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: FAIL because the new block is not registered in Pages, the renderer, or the existing canonical block-slug expectations.

- [ ] **Step 3: Register Pages and the renderer**

Import `RatingSpotlightBlock` in `src/collections/Pages.ts` and place it beside the review-related blocks in the layout array.

Import `RatingSpotlightBlockComponent` in `src/blocks/renderPageBlocks.tsx` and add:

```tsx
case 'ratingSpotlight':
  return (
    <RatingSpotlightBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      {...block}
    />
  )
```

- [ ] **Step 4: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `RatingSpotlightBlock`, includes it in `Page['layout']`, and exposes `ratingSpotlight?: T | RatingSpotlightBlockSelect<T>` in generated selection types.

- [ ] **Step 5: Run focused registration and type checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-rating-summary.int.spec.ts tests/int/rating-spotlight.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts
pnpm exec tsc --noEmit --pretty false 2>&1 | rg 'RatingSpotlight|ratingSpotlight|reviewRatingSummary|rating-spotlight' || true
```

Expected: focused tests pass and no scoped TypeScript errors reference the new block.

- [ ] **Step 6: Regenerate thumbnails and verify deterministic rendering**

Run:

```bash
pnpm generate:block-thumbnails
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: every thumbnail generates without browser-console or hydration errors, `public/block-thumbnails/rating-spotlight.jpg` is a 1600×900 JPEG, and all thumbnail tests pass.

- [ ] **Step 7: Run scoped lint and diff checks**

Run:

```bash
pnpm exec eslint src/lib/reviewRatingSummary.ts src/blocks/RatingSpotlight/config.ts src/blocks/RatingSpotlight/Component.tsx src/components/rating-spotlight.tsx tests/int/review-rating-summary.int.spec.ts tests/int/rating-spotlight.int.spec.ts
git diff --check
git diff --cached --check
```

Expected: scoped lint and both whitespace checks pass.

- [ ] **Step 8: Verify responsive layout in Chromium and WebKit**

Open `/block-thumbnail-previews/ratingSpotlight` in development and verify at 320, 390, 768, and 1440 pixels:

- mobile content, metric, and action stack without overflow;
- desktop content and action occupy separate columns;
- the rating row has five decorative stars and a complete accessible label;
- the action uses the shared themed Button;
- light and dark color schemes use semantic tokens;
- no console, hydration, or runtime errors occur.

- [ ] **Step 9: Confirm everything remains unstaged**

Run:

```bash
git status --short
git diff --stat
```

Expected: all Rating Spotlight implementation files remain in the working tree. Do not run `git add` or `git commit`.
