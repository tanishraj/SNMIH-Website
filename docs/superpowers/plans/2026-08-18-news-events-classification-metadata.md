# News & Events Classification and Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every News & Events classification a distinct theme-aware badge and standardize date metadata across the featured carousel and tabbed cards.

**Architecture:** Add two focused News & Events presentation components: one wraps the generic `Badge` with classification normalization and token-driven styling, and one renders calendar/date metadata with an explicit typography contract. Migrate the featured highlight model and both consumers to those components, then remove the obsolete generic badge-variant mapping.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide React, Vitest, Testing Library.

## Global Constraints

- Classification colors are theme-token driven: News primary/navy, Event success/green, Notice information/blue, Holiday warning/amber, Achievement violet, Announcement teal, and Other muted neutral.
- Badge text remains present; color is never the only classification cue.
- Card and rail dates use the regular text family, `font-normal`, normal tracking, and tabular numerals.
- Compact dates use `text-xs`; the feature-image date remains `text-sm`.
- The News Event detail sidebar typography remains unchanged.
- Do not change collection schemas, admin configuration, data fetching, pagination, carousel behavior, or card layout.
- Do not stage or commit any changes.

---

## File Structure

- Create `src/components/news-events/NewsEventClassificationBadge.tsx`: shared classification normalization and badge rendering.
- Create `src/components/news-events/NewsEventDateMeta.tsx`: shared calendar/date rendering and typography.
- Modify `src/styles/custom.css`: token-driven classification badge colors.
- Modify `src/lib/newsEventClassifications.ts`: expose classification normalization and remove the obsolete variant mapping after migration.
- Modify `src/components/news-events/featuredHighlightsShared.ts`: carry a normalized classification instead of a generic badge variant.
- Modify `src/blocks/NewsEventsHighlights/resolveItems.ts`: populate the normalized classification.
- Modify `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`: use the shared badge and date metadata components.
- Modify `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`: use the shared badge and date metadata components.
- Modify `src/block-thumbnails/fixtures.tsx`: update News & Events highlight fixtures to the normalized model.
- Create `tests/int/news-events-classification-metadata.int.spec.tsx`: focused shared-presentation contract tests.
- Modify `tests/int/news-events-featured-carousel.int.spec.tsx`: carousel and rail integration assertions.
- Modify `tests/int/news-events-highlights.int.spec.tsx`: normalized highlight model assertions.
- Modify `tests/int/news-events-tabs.int.spec.tsx`: tabbed-card date and badge assertions.
- Modify `tests/int/news-events-data.int.spec.ts`: normalization and fallback assertions.

---

### Task 1: Shared Classification and Date Presentation

**Files:**

- Create: `src/components/news-events/NewsEventClassificationBadge.tsx`
- Create: `src/components/news-events/NewsEventDateMeta.tsx`
- Modify: `src/lib/newsEventClassifications.ts`
- Modify: `src/styles/custom.css`
- Create: `tests/int/news-events-classification-metadata.int.spec.tsx`

**Interfaces:**

- Produces: `normalizeNewsEventClassification(value?: string | null): NewsEventClassification`
- Produces: `NewsEventClassificationBadge({ classification, className? })`
- Produces: `NewsEventDateMeta({ className?, dateISO?, dateLabel, size? })`
- Consumes: existing `Badge`, `CalendarDays`, `cn`, and semantic theme tokens.

- [ ] **Step 1: Write failing normalization and component tests**

Create `tests/int/news-events-classification-metadata.int.spec.tsx` with coverage equivalent to:

```tsx
import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { NewsEventClassificationBadge } from '@/components/news-events/NewsEventClassificationBadge'
import { NewsEventDateMeta } from '@/components/news-events/NewsEventDateMeta'
import {
  NEWS_EVENT_CLASSIFICATIONS,
  normalizeNewsEventClassification,
} from '@/lib/newsEventClassifications'

describe('News & Events classification and date metadata', () => {
  it('normalizes supported classifications and falls back to Other', () => {
    expect(normalizeNewsEventClassification('event')).toBe('event')
    expect(normalizeNewsEventClassification('invalid')).toBe('other')
    expect(normalizeNewsEventClassification(null)).toBe('other')
  })

  it('renders every classification with a distinct data contract and visible label', () => {
    const markup = NEWS_EVENT_CLASSIFICATIONS.map(({ label, value }) =>
      renderToStaticMarkup(<NewsEventClassificationBadge classification={value} />),
    )

    NEWS_EVENT_CLASSIFICATIONS.forEach(({ label, value }, index) => {
      expect(markup[index]).toContain(`data-news-event-classification="${value}"`)
      expect(markup[index]).toContain(label)
      expect(markup[index]).toContain('news-event-classification-badge')
    })
  })

  it('assigns a distinct semantic color token to every non-neutral classification', () => {
    const css = readFileSync('src/styles/custom.css', 'utf8')

    expect(css).toContain("[data-news-event-classification='news']")
    expect(css).toContain("[data-news-event-classification='event']")
    expect(css).toContain("[data-news-event-classification='notice']")
    expect(css).toContain("[data-news-event-classification='holiday']")
    expect(css).toContain("[data-news-event-classification='achievement']")
    expect(css).toContain("[data-news-event-classification='announcement']")
    expect(css).toContain('var(--primary)')
    expect(css).toContain('var(--success)')
    expect(css).toContain('var(--info)')
    expect(css).toContain('var(--warning)')
    expect(css).toContain('var(--color-2)')
    expect(css).toContain('var(--color-4)')
  })

  it('renders a semantic, regular-weight date with a calendar icon', () => {
    const markup = renderToStaticMarkup(
      <NewsEventDateMeta
        className="text-muted-foreground"
        dateISO="2026-08-18T00:00:00.000Z"
        dateLabel="Aug 18, 2026"
      />,
    )

    expect(markup).toContain('<time')
    expect(markup).toContain('datetime="2026-08-18T00:00:00.000Z"')
    expect(markup).toContain('lucide-calendar-days')
    expect(markup).toContain('font-sans')
    expect(markup).toContain('font-normal')
    expect(markup).toContain('tracking-normal')
    expect(markup).toContain('tabular-nums')
    expect(markup).toContain('text-xs')
  })
})
```

- [ ] **Step 2: Run the focused test and confirm the missing interfaces fail**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx
```

Expected: FAIL because the two components and normalization export do not exist.

- [ ] **Step 3: Add classification normalization**

In `src/lib/newsEventClassifications.ts`, add a set derived from `NEWS_EVENT_CLASSIFICATIONS` and export:

```ts
const classificationValues = new Set<NewsEventClassification>(
  NEWS_EVENT_CLASSIFICATIONS.map(({ value }) => value),
)

export function normalizeNewsEventClassification(value?: string | null): NewsEventClassification {
  return classificationValues.has(value as NewsEventClassification)
    ? (value as NewsEventClassification)
    : 'other'
}
```

Update `getNewsEventClassificationLabel()` to read the label using the normalized value.

- [ ] **Step 4: Add the shared classification badge**

Create `src/components/news-events/NewsEventClassificationBadge.tsx`:

```tsx
import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  getNewsEventClassificationLabel,
  normalizeNewsEventClassification,
} from '@/lib/newsEventClassifications'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentProps<typeof Badge>, 'children' | 'variant'> & {
  classification?: string | null
}

export function NewsEventClassificationBadge({ classification, className, ...props }: Props) {
  const resolvedClassification = normalizeNewsEventClassification(classification)

  return (
    <Badge
      className={cn('news-event-classification-badge', className)}
      data-news-event-classification={resolvedClassification}
      variant="outline"
      {...props}
    >
      {getNewsEventClassificationLabel(resolvedClassification)}
    </Badge>
  )
}
```

- [ ] **Step 5: Add theme-token classification colors**

Append a focused News & Events section to `src/styles/custom.css`:

```css
.news-event-classification-badge {
  --news-event-classification-color: var(--muted-foreground);

  border-color: color-mix(in oklch, var(--news-event-classification-color) 32%, transparent);
  background-color: color-mix(in oklch, var(--news-event-classification-color) 18%, var(--card));
  color: color-mix(in oklch, var(--news-event-classification-color) 78%, var(--foreground));
}

.news-event-classification-badge[data-news-event-classification='news'] {
  --news-event-classification-color: var(--primary);
}

.news-event-classification-badge[data-news-event-classification='event'] {
  --news-event-classification-color: var(--success);
}

.news-event-classification-badge[data-news-event-classification='notice'] {
  --news-event-classification-color: var(--info);
}

.news-event-classification-badge[data-news-event-classification='holiday'] {
  --news-event-classification-color: var(--warning);
}

.news-event-classification-badge[data-news-event-classification='achievement'] {
  --news-event-classification-color: var(--color-2);
}

.news-event-classification-badge[data-news-event-classification='announcement'] {
  --news-event-classification-color: var(--color-4);
}
```

`other` intentionally retains the neutral default.

- [ ] **Step 6: Add the shared date metadata component**

Create `src/components/news-events/NewsEventDateMeta.tsx`:

```tsx
import { CalendarDays } from 'lucide-react'

import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'text-sm [&_svg]:size-4',
  xs: 'text-xs [&_svg]:size-3.5',
} as const

export function NewsEventDateMeta({
  className,
  dateISO,
  dateLabel,
  size = 'xs',
}: {
  className?: string
  dateISO?: string
  dateLabel: string
  size?: keyof typeof sizeClasses
}) {
  return (
    <time
      className={cn(
        'inline-flex items-center gap-1.5 font-sans font-normal tracking-normal tabular-nums',
        sizeClasses[size],
        className,
      )}
      dateTime={dateISO}
    >
      <CalendarDays aria-hidden="true" />
      {dateLabel}
    </time>
  )
}
```

- [ ] **Step 7: Run the shared-presentation test**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 8: Run targeted formatting and lint checks**

Run:

```bash
pnpm exec prettier --check src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventDateMeta.tsx src/lib/newsEventClassifications.ts src/styles/custom.css tests/int/news-events-classification-metadata.int.spec.tsx
pnpm exec eslint src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventDateMeta.tsx src/lib/newsEventClassifications.ts tests/int/news-events-classification-metadata.int.spec.tsx
```

Expected: both commands pass.

---

### Task 2: Migrate the Featured Carousel and Rails

**Files:**

- Modify: `src/components/news-events/featuredHighlightsShared.ts`
- Modify: `src/blocks/NewsEventsHighlights/resolveItems.ts`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

**Interfaces:**

- Consumes: `NewsEventClassificationBadge`, `NewsEventDateMeta`, and `NewsEventClassification`.
- Produces: `FeaturedHighlightItem.classification?: NewsEventClassification`.

- [ ] **Step 1: Update carousel tests to describe the new metadata contract**

In `tests/int/news-events-featured-carousel.int.spec.tsx`:

- make the item factory set `classification: contentType` instead of `badge`;
- assert the feature and both rail instances expose `data-news-event-classification`;
- assert rail dates contain `font-sans`, `font-normal`, `tracking-normal`, and `tabular-nums`;
- assert the feature date contains `text-sm` and rail dates contain `text-xs`;
- retain the existing optional-metadata test and expect no badge/calendar for a minimal item.

Add assertions equivalent to:

```ts
const verticalDates = verticalContent?.querySelectorAll('time') ?? []
expect(Array.from(verticalDates).every((date) => date.className.includes('font-normal'))).toBe(true)
expect(Array.from(verticalDates).every((date) => date.className.includes('font-sans'))).toBe(true)
expect(Array.from(verticalDates).every((date) => date.className.includes('tabular-nums'))).toBe(
  true,
)
expect(container.querySelectorAll('[data-news-event-classification="news"]')).not.toHaveLength(0)
```

In `tests/int/news-events-highlights.int.spec.tsx`, replace expected `badge` objects with `classification: 'news'` or the relevant classification.

- [ ] **Step 2: Run carousel/highlight tests and confirm model failures**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx
```

Expected: FAIL because the view model and carousel still use `badge.variant` and local date markup.

- [ ] **Step 3: Replace the highlight badge model with classification**

In `src/components/news-events/featuredHighlightsShared.ts`:

```ts
import type { NewsEventClassification } from '@/lib/newsEventClassifications'

export type FeaturedHighlightItem = {
  action?: FeaturedHighlightAction
  classification?: NewsEventClassification
  dateISO?: string
  dateLabel?: string
  description?: string
  id: string
  image?: FeaturedHighlightImage
  title: string
}
```

Remove `FeaturedHighlightBadgeVariant` and the nested `badge` type.

In `src/blocks/NewsEventsHighlights/resolveItems.ts`, remove the badge helper imports and set:

```ts
classification: entry.contentType,
```

- [ ] **Step 4: Use shared metadata components in the carousel**

In `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`:

- remove the direct `CalendarDays` and `Badge` imports;
- import `NewsEventClassificationBadge` and `NewsEventDateMeta`;
- derive `hasMetadata` from `item.classification || item.dateLabel`;
- render `NewsEventClassificationBadge` for the main feature and rail;
- render rail dates with the default `xs` size and the feature-image date with `size="sm"`;
- use `text-muted-foreground` for rail dates and `featureOverlay.text.secondary` for feature dates.

Use this rail markup:

```tsx
{
  item.classification ? <NewsEventClassificationBadge classification={item.classification} /> : null
}
{
  item.dateLabel ? (
    <NewsEventDateMeta
      className="text-muted-foreground"
      dateISO={item.dateISO}
      dateLabel={item.dateLabel}
    />
  ) : null
}
```

Use `size="sm"` for the feature-image instance. Remove the feature badge's current `bg-background/90` override so the classification color remains visible.

- [ ] **Step 5: Update block thumbnail fixtures**

In `src/block-thumbnails/fixtures.tsx`, replace each News & Events highlight `badge` object with the corresponding `classification` value.

- [ ] **Step 6: Run focused carousel/highlight tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 7: Run targeted type, lint, and format checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/components/news-events/featuredHighlightsShared.ts src/blocks/NewsEventsHighlights/resolveItems.ts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx
pnpm exec prettier --check src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/components/news-events/featuredHighlightsShared.ts src/blocks/NewsEventsHighlights/resolveItems.ts src/block-thumbnails/fixtures.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx
```

Expected: all commands pass.

---

### Task 3: Migrate Tabbed Cards and Remove Legacy Variant Mapping

**Files:**

- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`
- Modify: `src/lib/newsEventClassifications.ts`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`
- Modify: `tests/int/news-events-data.int.spec.ts`

**Interfaces:**

- Consumes: `NewsEventClassificationBadge` and `NewsEventDateMeta` from Task 1.
- Removes: `NewsEventClassificationBadgeVariant` and `getNewsEventClassificationBadgeVariant()`.

- [ ] **Step 1: Add tabbed-card badge/date assertions**

In `tests/int/news-events-tabs.int.spec.tsx`, extend the card typography test or add a focused test that asserts:

```ts
const card = container.querySelector('[data-news-events-tabs-card="true"]')
const date = card?.querySelector('time')

expect(card?.querySelector('.lucide-calendar-days')).toBeTruthy()
expect(date?.className).toContain('font-sans')
expect(date?.className).toContain('font-normal')
expect(date?.className).toContain('tracking-normal')
expect(date?.className).toContain('tabular-nums')
expect(date?.className).toContain('text-xs')
expect(date?.className).not.toContain('font-mono')
expect(card?.querySelector('[data-news-event-classification="news"]')).toBeTruthy()
```

In `tests/int/news-events-data.int.spec.ts`, remove legacy badge-variant assertions and add normalization assertions for supported and invalid values.

- [ ] **Step 2: Run the tab/data tests and confirm the old card fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-data.int.spec.ts
```

Expected: FAIL because tabbed-card dates have no icon and still use `font-mono font-medium`.

- [ ] **Step 3: Migrate the tabbed card**

In `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`:

- replace the direct `Badge` and classification helper imports with `NewsEventClassificationBadge`;
- import `NewsEventDateMeta`;
- render the shared classification badge using `item.contentType`;
- render the date using `item.dateISO`, the resolved `dateLabel`, and `text-muted-foreground`.

Use:

```tsx
;<NewsEventClassificationBadge classification={item.contentType} />
{
  dateLabel ? (
    <NewsEventDateMeta
      className="text-muted-foreground"
      dateISO={item.dateISO}
      dateLabel={dateLabel}
    />
  ) : null
}
```

- [ ] **Step 4: Remove the obsolete badge-variant API**

In `src/lib/newsEventClassifications.ts`, remove:

- `NewsEventClassificationBadgeVariant`;
- `classificationBadgeVariants`;
- `getNewsEventClassificationBadgeVariant()`.

Confirm no references remain:

```bash
rg -n "NewsEventClassificationBadgeVariant|getNewsEventClassificationBadgeVariant|classificationBadgeVariants" src tests
```

Expected: no output.

- [ ] **Step 5: Run all affected News & Events tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-data.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Run final project verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventDateMeta.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/components/news-events/featuredHighlightsShared.ts src/blocks/NewsEventsHighlights/resolveItems.ts src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx src/lib/newsEventClassifications.ts tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-data.int.spec.ts
pnpm exec prettier --check src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventDateMeta.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/components/news-events/featuredHighlightsShared.ts src/blocks/NewsEventsHighlights/resolveItems.ts src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx src/lib/newsEventClassifications.ts src/styles/custom.css src/block-thumbnails/fixtures.tsx tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx tests/int/news-events-data.int.spec.ts
git diff --check
```

Expected: all commands pass.

- [ ] **Step 7: Refresh and verify maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The known stale knowledge-graph warning is acceptable if no structural graph refresh is required.

- [ ] **Step 8: Review final scope without staging or committing**

Run:

```bash
git status --short
git diff -- src/components/news-events src/blocks/NewsEventsHighlights src/blocks/NewsEventsTabs src/lib/newsEventClassifications.ts src/styles/custom.css src/block-thumbnails/fixtures.tsx tests/int docs/superpowers
```

Confirm the diff contains only the approved shared badge/date presentation work plus pre-existing user changes. Do not stage or commit.
