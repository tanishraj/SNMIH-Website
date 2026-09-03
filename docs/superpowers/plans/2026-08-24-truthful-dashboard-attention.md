# Truthful Dashboard Attention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Admin dashboard's aggregate `In Review` and `Scheduled` counts truthful by exposing exact, permission-aware collection destinations and visible unavailable states.

**Architecture:** Add a pure dashboard-attention model that owns count settlement, aggregation, and exact filtered URLs. Render that model through one server-compatible workflow card component, then adapt `DashboardOverview` to preserve authorized Local API queries while distinguishing zero counts from query failures.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript 5.7, SCSS, Vitest, Testing Library

## Global Constraints

- Keep the project one client per deployment; do not add tenant-aware data or navigation.
- Preserve the existing Payload server-component dashboard and capability-filtered query boundary.
- Every user-scoped Local API query must pass `user` and `overrideAccess: false`.
- The aggregate workflow card is not a link; only collection rows with known non-zero counts are links.
- Render authorized unavailable collections as non-interactive `Count unavailable` rows.
- Omit authorized collections with a successful zero count from the row list.
- A partial failure displays the successful lower bound as `N+` with `Partial count`.
- A complete workflow-query failure displays an em dash with `Count unavailable`.
- A successful zero aggregate displays `0` with `Nothing waiting` and no links.
- Keep Open Submissions, Action Queue, Content Overview, Quick Actions, Recently Edited, and Recent Submissions behavior unchanged.
- Use Payload theme variables for the new UI; do not introduce collection-specific colors.
- Respect keyboard focus, 44px minimum row targets, narrow layouts, and reduced-motion preferences.

---

## File Structure

- Create `src/components/admin/dashboardAttention.ts`: own workflow collection types, count settlement, exact Admin filter URLs, and summary derivation.
- Create `src/components/admin/DashboardWorkflowCard.tsx`: render one semantic aggregate card from attention items.
- Create `src/components/admin/DashboardWorkflowCard.scss`: own the card's theme-aware, responsive, focus-visible presentation.
- Create `tests/int/dashboard-attention.int.spec.tsx`: cover pure state derivation, URLs, semantic markup, empty states, and unavailable rows.
- Modify `src/components/admin/DashboardOverview.tsx`: settle workflow queries without converting failures to zero, build authorized item arrays, and render the new cards.
- Modify `tests/int/dashboard-capability-filtering.int.spec.tsx`: cover authorized query isolation, truthful collection links, ordering, mixed counts, and partial failures.
- Modify `docs/guides/dashboard.md`: explain aggregate cards and their collection rows.
- Modify `.agents/skills/project-context/references/architecture.md`: record the dashboard attention data and navigation boundary.
- Update `.agents/skills/project-context/references/project-inventory.json` only when `pnpm project-context:update` produces a deterministic change.

---

### Task 1: Build the pure attention-state model

**Files:**
- Create: `src/components/admin/dashboardAttention.ts`
- Create: `tests/int/dashboard-attention.int.spec.tsx`

**Interfaces:**
- Produces: `DashboardWorkflowCollection`, the supported workflow collection union.
- Produces: `DashboardCountResult`, the available/unavailable count union.
- Produces: `DashboardAttentionItem`, a labeled count with its exact Admin destination.
- Produces: `settleDashboardCount(promise): Promise<DashboardCountResult>`.
- Produces: `buildInReviewAdminURL(collection): string`.
- Produces: `buildScheduledAdminURL(collection, requestTime): string`.
- Produces: `summarizeDashboardAttention(items): DashboardAttentionSummary`.

- [ ] **Step 1: Write the failing state and URL contract**

Create `tests/int/dashboard-attention.int.spec.tsx` with the model tests first:

```tsx
import { describe, expect, it } from 'vitest'

import {
  buildInReviewAdminURL,
  buildScheduledAdminURL,
  settleDashboardCount,
  summarizeDashboardAttention,
  type DashboardAttentionItem,
} from '@/components/admin/dashboardAttention'

const item = (
  label: string,
  result: DashboardAttentionItem['result'],
  href = `/admin/collections/${label.toLowerCase()}`,
): DashboardAttentionItem => ({ href, label, result })

describe('dashboard attention model', () => {
  it('settles successful and failed counts without treating failure as zero', async () => {
    await expect(settleDashboardCount(Promise.resolve({ totalDocs: 3 }))).resolves.toEqual({
      status: 'available',
      value: 3,
    })
    await expect(settleDashboardCount(Promise.reject(new Error('offline')))).resolves.toEqual({
      status: 'unavailable',
    })
  })

  it('builds exact In Review and future Scheduled destinations', () => {
    const requestTime = '2026-08-24T12:30:00.000Z'

    expect(buildInReviewAdminURL('news-events')).toBe(
      '/admin/collections/news-events?where[workflowState][equals]=in_review',
    )
    expect(buildScheduledAdminURL('pages', requestTime)).toBe(
      '/admin/collections/pages?where[and][0][scheduledPublishAt][exists]=true' +
        '&where[and][1][scheduledPublishAt][greater_than]=2026-08-24T12%3A30%3A00.000Z',
    )
  })

  it('omits successful zero rows and sums known work', () => {
    expect(
      summarizeDashboardAttention([
        item('Pages', { status: 'available', value: 2 }),
        item('Articles', { status: 'available', value: 0 }),
        item('Reviews', { status: 'available', value: 4 }),
      ]),
    ).toEqual({
      displayValue: '6',
      rows: [
        item('Pages', { status: 'available', value: 2 }),
        item('Reviews', { status: 'available', value: 4 }),
      ],
      stateLabel: 'Needs attention',
    })
  })

  it('represents partial results as a lower bound', () => {
    expect(
      summarizeDashboardAttention([
        item('Pages', { status: 'available', value: 2 }),
        item('Articles', { status: 'unavailable' }),
        item('Reviews', { status: 'available', value: 0 }),
      ]),
    ).toEqual({
      displayValue: '2+',
      rows: [
        item('Pages', { status: 'available', value: 2 }),
        item('Articles', { status: 'unavailable' }),
      ],
      stateLabel: 'Partial count',
    })
  })

  it('distinguishes a complete failure from a successful empty state', () => {
    expect(
      summarizeDashboardAttention([
        item('Pages', { status: 'unavailable' }),
        item('Articles', { status: 'unavailable' }),
      ]),
    ).toMatchObject({ displayValue: '—', stateLabel: 'Count unavailable' })

    expect(
      summarizeDashboardAttention([
        item('Pages', { status: 'available', value: 0 }),
        item('Articles', { status: 'available', value: 0 }),
      ]),
    ).toEqual({ displayValue: '0', rows: [], stateLabel: 'Nothing waiting' })
  })
})
```

- [ ] **Step 2: Run the model test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-attention.int.spec.tsx
```

Expected: FAIL because `@/components/admin/dashboardAttention` does not exist.

- [ ] **Step 3: Implement the pure model**

Create `src/components/admin/dashboardAttention.ts`:

```ts
export type DashboardWorkflowCollection = 'articles' | 'news-events' | 'pages' | 'reviews'

export type DashboardCountResult =
  | { status: 'available'; value: number }
  | { status: 'unavailable' }

export type DashboardAttentionItem = {
  href: string
  label: string
  result: DashboardCountResult
}

export type DashboardAttentionSummary = {
  displayValue: string
  rows: DashboardAttentionItem[]
  stateLabel: 'Count unavailable' | 'Needs attention' | 'Nothing waiting' | 'Partial count'
}

export async function settleDashboardCount(
  countPromise: Promise<{ totalDocs: number }>,
): Promise<DashboardCountResult> {
  try {
    const { totalDocs } = await countPromise
    return { status: 'available', value: totalDocs }
  } catch {
    return { status: 'unavailable' }
  }
}

export const buildInReviewAdminURL = (collection: DashboardWorkflowCollection): string =>
  `/admin/collections/${collection}?where[workflowState][equals]=in_review`

export const buildScheduledAdminURL = (
  collection: Exclude<DashboardWorkflowCollection, 'reviews'>,
  requestTime: string,
): string =>
  `/admin/collections/${collection}?where[and][0][scheduledPublishAt][exists]=true` +
  `&where[and][1][scheduledPublishAt][greater_than]=${encodeURIComponent(requestTime)}`

export function summarizeDashboardAttention(
  items: DashboardAttentionItem[],
): DashboardAttentionSummary {
  const available = items.filter(
    (item): item is DashboardAttentionItem & { result: { status: 'available'; value: number } } =>
      item.result.status === 'available',
  )
  const unavailable = items.filter((item) => item.result.status === 'unavailable')
  const knownTotal = available.reduce((total, item) => total + item.result.value, 0)
  const rows = items.filter(
    (item) => item.result.status === 'unavailable' || item.result.value > 0,
  )

  if (available.length === 0) {
    return { displayValue: '—', rows, stateLabel: 'Count unavailable' }
  }

  if (unavailable.length > 0) {
    return { displayValue: `${knownTotal}+`, rows, stateLabel: 'Partial count' }
  }

  return {
    displayValue: String(knownTotal),
    rows,
    stateLabel: knownTotal === 0 ? 'Nothing waiting' : 'Needs attention',
  }
}
```

- [ ] **Step 4: Run the model contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-attention.int.spec.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit the pure model**

```bash
git add src/components/admin/dashboardAttention.ts tests/int/dashboard-attention.int.spec.tsx
git commit -m "feat(admin): model dashboard attention"
```

---

### Task 2: Render a semantic workflow attention card

**Files:**
- Create: `src/components/admin/DashboardWorkflowCard.tsx`
- Create: `src/components/admin/DashboardWorkflowCard.scss`
- Modify: `tests/int/dashboard-attention.int.spec.tsx`

**Interfaces:**
- Consumes: `DashboardAttentionItem` and `summarizeDashboardAttention` from Task 1.
- Produces: `DashboardWorkflowCard({ items, label })` for `DashboardOverview`.

- [ ] **Step 1: Add failing semantic component tests**

Append these imports and tests to `tests/int/dashboard-attention.int.spec.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'

import { DashboardWorkflowCard } from '@/components/admin/DashboardWorkflowCard'

describe('DashboardWorkflowCard', () => {
  it('renders exact non-zero links without making the aggregate a link', () => {
    const html = renderToStaticMarkup(
      <DashboardWorkflowCard
        items={[
          item('Pages', { status: 'available', value: 2 }, '/admin/pages?review=true'),
          item('Articles', { status: 'available', value: 0 }, '/admin/articles?review=true'),
          item('Reviews', { status: 'available', value: 1 }, '/admin/reviews?review=true'),
        ]}
        label="In Review"
      />,
    )

    expect(html).toContain('<section')
    expect(html).toContain('>3<')
    expect(html).toContain('href="/admin/pages?review=true"')
    expect(html).toContain('href="/admin/reviews?review=true"')
    expect(html).not.toContain('href="/admin/articles?review=true"')
    expect(html.match(/<a /g)).toHaveLength(2)
  })

  it('renders a successful zero state without links', () => {
    const html = renderToStaticMarkup(
      <DashboardWorkflowCard
        items={[item('Pages', { status: 'available', value: 0 })]}
        label="Scheduled"
      />,
    )

    expect(html).toContain('Nothing waiting')
    expect(html).not.toContain('<a ')
  })

  it('renders unavailable rows as non-interactive status', () => {
    const html = renderToStaticMarkup(
      <DashboardWorkflowCard
        items={[
          item('Pages', { status: 'available', value: 2 }, '/admin/pages'),
          item('Articles', { status: 'unavailable' }, '/admin/articles'),
        ]}
        label="In Review"
      />,
    )

    expect(html).toContain('2+')
    expect(html).toContain('Partial count')
    expect(html).toContain('Articles')
    expect(html).toContain('Count unavailable')
    expect(html).not.toContain('href="/admin/articles"')
  })
})
```

- [ ] **Step 2: Run the component contract to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-attention.int.spec.tsx
```

Expected: FAIL because `DashboardWorkflowCard` does not exist.

- [ ] **Step 3: Implement the server-compatible card**

Create `src/components/admin/DashboardWorkflowCard.tsx`:

```tsx
import { ArrowRight } from 'lucide-react'

import {
  summarizeDashboardAttention,
  type DashboardAttentionItem,
} from '@/components/admin/dashboardAttention'

import './DashboardWorkflowCard.scss'

type DashboardWorkflowCardProps = {
  items: DashboardAttentionItem[]
  label: 'In Review' | 'Scheduled'
}

export function DashboardWorkflowCard({ items, label }: DashboardWorkflowCardProps) {
  const summary = summarizeDashboardAttention(items)
  const headingID = `dashboard-workflow-${label.toLowerCase().replaceAll(' ', '-')}`

  return (
    <section aria-labelledby={headingID} className="dashboard-workflow-card">
      <header className="dashboard-workflow-card__header">
        <span className="dashboard-workflow-card__value">{summary.displayValue}</span>
        <h3 className="dashboard-workflow-card__title" id={headingID}>
          {label}
        </h3>
        <span className="dashboard-workflow-card__state">{summary.stateLabel}</span>
      </header>

      {summary.rows.length > 0 ? (
        <ul className="dashboard-workflow-card__rows">
          {summary.rows.map((item) => (
            <li className="dashboard-workflow-card__row" key={item.label}>
              {item.result.status === 'available' ? (
                <a className="dashboard-workflow-card__link" href={item.href}>
                  <span>{item.label}</span>
                  <span className="dashboard-workflow-card__count">
                    <span>{item.result.value}</span>
                    <ArrowRight aria-hidden="true" size={14} strokeWidth={1.75} />
                  </span>
                </a>
              ) : (
                <div className="dashboard-workflow-card__unavailable">
                  <span>{item.label}</span>
                  <span>Count unavailable</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 4: Add theme-aware interaction styles**

Create `src/components/admin/DashboardWorkflowCard.scss`:

```scss
.dashboard-workflow-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--theme-elevation-200);
  border-radius: 8px;
  background: var(--theme-elevation-100);

  &__header {
    display: grid;
    gap: 6px;
    padding: 20px 24px;
  }

  &__value {
    color: var(--theme-elevation-900);
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  &__title {
    margin: 0;
    color: var(--theme-elevation-700);
    font-size: 13px;
    font-weight: 600;
  }

  &__state {
    color: var(--theme-elevation-550);
    font-size: 11px;
    font-weight: 600;
  }

  &__rows {
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--theme-elevation-200);
    list-style: none;
  }

  &__row + &__row {
    border-top: 1px solid var(--theme-elevation-150);
  }

  &__link,
  &__unavailable {
    display: flex;
    min-height: 44px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 16px;
    color: var(--theme-text);
    font-size: 12px;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__link {
    text-decoration: none;
    transition:
      background-color 120ms ease,
      color 120ms ease;

    &:hover {
      background: var(--theme-elevation-150);
    }

    &:focus-visible {
      outline: 2px solid var(--theme-elevation-800);
      outline-offset: -3px;
    }
  }

  &__unavailable {
    color: var(--theme-elevation-550);
  }

  @media (prefers-reduced-motion: reduce) {
    &__link {
      transition: none;
    }
  }
}
```

- [ ] **Step 5: Run and inspect the focused component contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-attention.int.spec.tsx
```

Expected: 8 tests PASS.

- [ ] **Step 6: Commit the presentation component**

```bash
git add src/components/admin/DashboardWorkflowCard.tsx src/components/admin/DashboardWorkflowCard.scss tests/int/dashboard-attention.int.spec.tsx
git commit -m "feat(admin): render workflow attention cards"
```

---

### Task 3: Integrate truthful counts into the dashboard

**Files:**
- Modify: `src/components/admin/DashboardOverview.tsx`
- Modify: `tests/int/dashboard-capability-filtering.int.spec.tsx`

**Interfaces:**
- Consumes: `settleDashboardCount`, URL builders, and `DashboardAttentionItem` from Task 1.
- Consumes: `DashboardWorkflowCard` from Task 2.
- Preserves: authenticated server rendering and every non-workflow dashboard section.

- [ ] **Step 1: Add failing integration assertions for per-collection rows**

Extend `tests/int/dashboard-capability-filtering.int.spec.tsx` with a full workflow manager and deterministic count responses:

```tsx
const workflowManager = {
  capabilities: {
    manage_articles: true,
    manage_news_events: true,
    manage_pages: true,
    manage_reviews: true,
  },
  id: 'workflow-manager',
  role: 'contentManager',
}

it('links every non-zero workflow count to its exact collection', async () => {
  mocks.auth.mockResolvedValue({ user: workflowManager })
  mocks.count.mockImplementation(async ({ collection, where }) => {
    if (!where) return { totalDocs: 10 }
    if ('workflowState' in where) {
      return { totalDocs: { pages: 2, articles: 3, 'news-events': 0, reviews: 1 }[collection] ?? 0 }
    }
    return { totalDocs: { pages: 1, articles: 0, 'news-events': 2 }[collection] ?? 0 }
  })

  const html = renderToStaticMarkup(await DashboardOverview())

  expect(html).toContain('>6<')
  expect(html).toContain(
    'href="/admin/collections/pages?where[workflowState][equals]=in_review"',
  )
  expect(html).toContain(
    'href="/admin/collections/articles?where[workflowState][equals]=in_review"',
  )
  expect(html).toContain(
    'href="/admin/collections/reviews?where[workflowState][equals]=in_review"',
  )
  expect(html).not.toContain(
    'href="/admin/collections/news-events?where[workflowState][equals]=in_review"',
  )
  expect(html.indexOf('Pages')).toBeLessThan(html.indexOf('Articles'))
  expect(html.indexOf('Articles')).toBeLessThan(html.indexOf('Reviews'))
  expect(html).toMatch(/where\[and\]\[0\]\[scheduledPublishAt\]\[exists\]=true/)
  expect(html).toMatch(/where\[and\]\[1\]\[scheduledPublishAt\]\[greater_than\]=/)
})
```

- [ ] **Step 2: Add failing assertions for partial failure truthfulness**

Append:

```tsx
it('shows an unavailable row without hiding successful sibling counts', async () => {
  mocks.auth.mockResolvedValue({ user: workflowManager })
  mocks.count.mockImplementation(async ({ collection, where }) => {
    if (!where) return { totalDocs: 10 }
    if ('workflowState' in where && collection === 'articles') {
      throw new Error('article count unavailable')
    }
    if ('workflowState' in where) return { totalDocs: collection === 'pages' ? 2 : 0 }
    return { totalDocs: 0 }
  })

  const html = renderToStaticMarkup(await DashboardOverview())

  expect(html).toContain('2+')
  expect(html).toContain('Partial count')
  expect(html).toContain('Count unavailable')
  expect(html).toContain(
    'href="/admin/collections/pages?where[workflowState][equals]=in_review"',
  )
  expect(html).not.toContain(
    'href="/admin/collections/articles?where[workflowState][equals]=in_review"',
  )
})
```

- [ ] **Step 3: Run the dashboard integration test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-capability-filtering.int.spec.tsx
```

Expected: FAIL because the current aggregate cards still link only to the first visible collection and convert query errors to zero.

- [ ] **Step 4: Import the attention model and card**

Add these imports to `src/components/admin/DashboardOverview.tsx`:

```tsx
import { DashboardWorkflowCard } from '@/components/admin/DashboardWorkflowCard'
import {
  buildInReviewAdminURL,
  buildScheduledAdminURL,
  settleDashboardCount,
  type DashboardAttentionItem,
} from '@/components/admin/dashboardAttention'
```

- [ ] **Step 5: Preserve workflow query failures as unavailable results**

Keep `zeroCount` for existing non-workflow totals and operational cards. Wrap only the seven workflow count promises with `settleDashboardCount` and remove their `.catch(zeroCount)` calls. Use a successful zero result for unauthorized slots so no unauthorized query runs:

```tsx
const emptyWorkflowCount = Promise.resolve({ status: 'available' as const, value: 0 })

visibility.pages
  ? settleDashboardCount(
      payload.count({
        collection: 'pages',
        ...secureQuery,
        where: { workflowState: { equals: 'in_review' } },
      }),
    )
  : emptyWorkflowCount
```

Apply that exact wrapper to `inReviewPages`, `inReviewArticles`, `inReviewNews`,
`inReviewReviews`, `scheduledPages`, `scheduledArticles`, and `scheduledNews`. Preserve the existing
future scheduled `where.and` query and the single `now` value shared by all three queries.

- [ ] **Step 6: Build stable authorized attention item arrays**

Replace `totalInReview`, `totalScheduled`, `workflowCollection`, and `scheduledCollection` with:

```tsx
const inReviewItems: DashboardAttentionItem[] = [
  visibility.pages
    ? { href: buildInReviewAdminURL('pages'), label: 'Pages', result: inReviewPages }
    : null,
  visibility.articles
    ? { href: buildInReviewAdminURL('articles'), label: 'Articles', result: inReviewArticles }
    : null,
  visibility.newsEvents
    ? {
        href: buildInReviewAdminURL('news-events'),
        label: 'News & Events',
        result: inReviewNews,
      }
    : null,
  visibility.reviews
    ? { href: buildInReviewAdminURL('reviews'), label: 'Reviews', result: inReviewReviews }
    : null,
].filter((item): item is DashboardAttentionItem => item !== null)

const scheduledItems: DashboardAttentionItem[] = [
  visibility.pages
    ? { href: buildScheduledAdminURL('pages', now), label: 'Pages', result: scheduledPages }
    : null,
  visibility.articles
    ? {
        href: buildScheduledAdminURL('articles', now),
        label: 'Articles',
        result: scheduledArticles,
      }
    : null,
  visibility.newsEvents
    ? {
        href: buildScheduledAdminURL('news-events', now),
        label: 'News & Events',
        result: scheduledNews,
      }
    : null,
].filter((item): item is DashboardAttentionItem => item !== null)
```

- [ ] **Step 7: Replace the misleading workflow links**

Change the attention grid minimum from `160px` to `240px`, then replace only the first two cards:

```tsx
{hasWorkflowContent ? (
  <DashboardWorkflowCard items={inReviewItems} label="In Review" />
) : null}
{hasScheduledContent ? (
  <DashboardWorkflowCard items={scheduledItems} label="Scheduled" />
) : null}
```

Keep the existing `AttentionCard` implementation for Open Submissions and Action Queue.

- [ ] **Step 8: Run focused dashboard tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-attention.int.spec.tsx tests/int/dashboard-capability-filtering.int.spec.tsx tests/int/admin-information-architecture.int.spec.ts
```

Expected: all focused tests PASS. The existing capability test must still prove unauthorized collections are neither queried nor rendered.

- [ ] **Step 9: Run TypeScript and lint for the integration**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits 0. Lint exits 0 with no new warnings; the existing GTM warning in `src/app/(frontend)/layout.tsx` may remain.

- [ ] **Step 10: Commit the dashboard integration**

```bash
git add src/components/admin/DashboardOverview.tsx tests/int/dashboard-capability-filtering.int.spec.tsx
git commit -m "fix(admin): make attention links truthful"
```

---

### Task 4: Document and verify the dashboard contract

**Files:**
- Modify: `docs/guides/dashboard.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Update if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Documents: the editor workflow and the server-side capability/query boundary.
- Verifies: focused behavior, full integration safety, maintained project knowledge, and diff integrity.

- [ ] **Step 1: Update the operator guide**

Replace the first dashboard instruction in `docs/guides/dashboard.md` with:

```md
1. Start with `In Review` and `Scheduled`. Their headline values summarize every collection you
   can manage; use the collection rows beneath them to open the exact filtered records. A partial
   or unavailable count is shown explicitly instead of being treated as zero.
2. Open `Action Queue` for assigned operational issues and `Open Submissions` for visitor follow-up.
3. Use recent edits to resume work on active content.
4. Use quick actions only for collections you are responsible for.
5. Treat Content Overview totals as orientation, not as a replacement for filtered collection
   views or the Audit Log.
```

- [ ] **Step 2: Update the architecture reference**

Add this dashboard contract to the Admin/runtime section of
`.agents/skills/project-context/references/architecture.md`:

```md
- Dashboard workflow attention remains source-collection driven. `In Review` and future
  `Scheduled` counts aggregate only capability-authorized Local API queries using the authenticated
  user with `overrideAccess: false`. The aggregate containers are non-interactive; non-zero
  collection rows link to exact matching Payload list filters, and failed counts remain visibly
  unavailable instead of becoming zero.
```

- [ ] **Step 3: Refresh maintained project knowledge**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: context check reports `Project context is current.` A stale optional knowledge graph may remain a warning. Keep `project-inventory.json` only if the update changes it deterministically.

- [ ] **Step 4: Run the full verification gate**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
git diff --check
```

Expected:

- TypeScript exits 0.
- Lint exits 0 with no new warnings; the existing GTM warning may remain.
- All integration test files and assertions pass. If MongoMemoryServer cannot bind inside the sandbox, rerun `pnpm test:int` with permission for ephemeral local ports.
- `git diff --check` prints nothing.

- [ ] **Step 5: Attempt the Admin E2E regression**

Run:

```bash
pnpm test:e2e -- admin.e2e.spec.ts
```

Expected: the Admin suite passes when the existing Playwright `next/cache` ESM loader defect is resolved. If discovery still fails on that pre-existing import, record the blocker without weakening or removing the new integration coverage.

- [ ] **Step 6: Review the final change-impact map and diff**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git status --short
git diff --stat
git diff -- src/components/admin/DashboardOverview.tsx src/components/admin/dashboardAttention.ts src/components/admin/DashboardWorkflowCard.tsx src/components/admin/DashboardWorkflowCard.scss tests/int/dashboard-attention.int.spec.tsx tests/int/dashboard-capability-filtering.int.spec.tsx docs/guides/dashboard.md .agents/skills/project-context/references/architecture.md
```

Expected: only the truthful dashboard attention implementation, tests, documentation, and deterministic project-context output are present.

- [ ] **Step 7: Commit documentation and verification output**

```bash
git add docs/guides/dashboard.md .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(admin): explain attention navigation"
```

If `project-inventory.json` is unchanged, omit it from `git add`.
