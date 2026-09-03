# Dashboard Capability Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the custom Payload dashboard from querying or rendering areas the authenticated user cannot manage.

**Architecture:** Authenticate the dashboard server component from request headers. Build one capability map that controls both query creation and JSX; every permitted Local API call receives the user and `overrideAccess: false`.

**Tech Stack:** Payload CMS 3, Next.js 15, React 19, TypeScript, Vitest

## Global Constraints

- Do not stage or commit changes.
- Do not add roles, capabilities, dependencies, metrics, or ownership rules.
- Preserve the full dashboard for administrators.
- Hide unauthorized areas instead of rendering zero-value placeholders.
- Never retry with `overrideAccess: true`.

---

### Task 1: Authenticate And Constrain Queries

**Files:**

- Create: `tests/int/dashboard-capability-filtering.int.spec.tsx`
- Modify: `src/components/admin/DashboardOverview.tsx:1-263`

**Interfaces:**

- Consumes: `hasAdminCapability(user, capability)`
- Produces: authenticated queries containing `user` and `overrideAccess: false`

- [ ] **Step 1: Write failing authentication and authorization tests**

Create the test harness:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  count: vi.fn(),
  find: vi.fn(),
  getPayload: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/headers', () => ({ headers: mocks.headers }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))

import { DashboardOverview } from '@/components/admin/DashboardOverview'

const articleManager = {
  capabilities: { manage_articles: true },
  id: 'article-manager',
  role: 'contentManager',
}

describe('dashboard capability filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.headers.mockResolvedValue(new Headers())
    mocks.getPayload.mockResolvedValue({
      auth: mocks.auth,
      count: mocks.count,
      find: mocks.find,
    })
    mocks.count.mockResolvedValue({ totalDocs: 2 })
    mocks.find.mockResolvedValue({ docs: [] })
  })

  it('runs no collection queries for an unauthenticated request', async () => {
    mocks.auth.mockResolvedValue({ user: null })
    expect(renderToStaticMarkup(await DashboardOverview())).toBe('')
    expect(mocks.count).not.toHaveBeenCalled()
    expect(mocks.find).not.toHaveBeenCalled()
  })

  it('runs only authorized queries with access enforcement', async () => {
    mocks.auth.mockResolvedValue({ user: articleManager })
    await DashboardOverview()

    const calls = [...mocks.count.mock.calls, ...mocks.find.mock.calls]
    expect(calls.length).toBeGreaterThan(0)
    for (const [options] of calls) {
      expect(options).toEqual(
        expect.objectContaining({
          collection: 'articles',
          overrideAccess: false,
          user: articleManager,
        }),
      )
    }
    for (const collection of [
      'pages',
      'news-events',
      'reviews',
      'form-submissions',
      'work-queue',
    ]) {
      expect(mocks.count).not.toHaveBeenCalledWith(expect.objectContaining({ collection }))
      expect(mocks.find).not.toHaveBeenCalledWith(expect.objectContaining({ collection }))
    }
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-capability-filtering.int.spec.tsx
```

Expected: FAIL because the dashboard neither authenticates nor constrains its queries.

- [ ] **Step 3: Add the authentication boundary**

Import `headers as getHeaders`, `hasAdminCapability`, and `User`. Begin the component with:

```tsx
const payload = await getPayload({ config: configPromise })
let user: User | null = null

try {
  const authResult = await payload.auth({
    canSetHeaders: false,
    headers: new Headers(await getHeaders()),
  })
  user = authResult.user as User | null
} catch {
  return null
}

if (!user) return null
```

- [ ] **Step 4: Build the shared capability map**

```tsx
const visibility = {
  articles: hasAdminCapability(user, 'manage_articles'),
  formSubmissions: hasAdminCapability(user, 'manage_form_submissions'),
  media: hasAdminCapability(user, 'manage_media'),
  newsEvents: hasAdminCapability(user, 'manage_news_events'),
  pages: hasAdminCapability(user, 'manage_pages'),
  reviews: hasAdminCapability(user, 'manage_reviews'),
  workQueue: hasAdminCapability(user, 'manage_work_queue'),
}
const secureQuery = { overrideAccess: false as const, user }
const zeroCount = () => Promise.resolve({ totalDocs: 0 })
const emptyDocs = () => Promise.resolve({ docs: [] })
```

- [ ] **Step 5: Gate every existing count and find**

Use the relevant visibility flag, retain the current filters, and spread `secureQuery`:

```tsx
visibility.articles
  ? payload
      .count({
        collection: 'articles',
        ...secureQuery,
        where: { workflowState: { equals: 'in_review' } },
      })
      .catch(zeroCount)
  : zeroCount()
```

Apply this to all Page, Article, News & Events, and Review counts; Page, Article, and News & Events
recent queries; both submission queries; and the queue count. Use `emptyDocs` for skipped or failed
`find` calls. Remove every `overrideAccess: true`.

- [ ] **Step 6: Re-run the focused test**

Expected: both tests pass.

### Task 2: Filter Rendered Areas

**Files:**

- Modify: `tests/int/dashboard-capability-filtering.int.spec.tsx`
- Modify: `src/components/admin/DashboardOverview.tsx:265-495`

**Interfaces:**

- Consumes: `visibility` and the gated query results
- Produces: authorized cards, actions, recent edits, and submissions only

- [ ] **Step 1: Add failing rendering tests**

Add cases that render an Article-only manager, an administrator, and an Article manager whose
authorized queries reject:

```tsx
it('renders only an article manager’s authorized areas', async () => {
  mocks.auth.mockResolvedValue({ user: articleManager })
  mocks.find.mockResolvedValue({
    docs: [
      {
        _status: 'draft',
        id: 'article-1',
        title: 'Authorized article',
        updatedAt: '2026-08-05T10:00:00.000Z',
      },
    ],
  })

  const html = renderToStaticMarkup(await DashboardOverview())
  expect(html).toContain('Articles')
  expect(html).toContain('+ New Article')
  expect(html).toContain('Authorized article')
  expect(html).not.toContain('+ New Page')
  expect(html).not.toContain('+ New News / Event')
  expect(html).not.toContain('+ Upload Media')
  expect(html).not.toContain('Open Submissions')
  expect(html).not.toContain('Action Queue')
})

it('preserves all quick actions for an administrator', async () => {
  mocks.auth.mockResolvedValue({ user: { id: 'admin', role: 'admin' } })
  const html = renderToStaticMarkup(await DashboardOverview())
  for (const label of [
    '+ New Page',
    '+ New Article',
    '+ New News / Event',
    '+ New Reusable Section',
    '+ Upload Media',
  ])
    expect(html).toContain(label)
})

it('isolates an authorized query failure', async () => {
  mocks.auth.mockResolvedValue({ user: articleManager })
  mocks.count.mockRejectedValue(new Error('count unavailable'))
  mocks.find.mockRejectedValue(new Error('recent data unavailable'))
  const html = renderToStaticMarkup(await DashboardOverview())
  expect(html).toContain('Articles')
  expect(html).toContain('+ New Article')
  expect(html).not.toContain('Recent Submissions')
})
```

- [ ] **Step 2: Run the test and verify the new cases fail**

Expected: unauthorized actions and cards are still present.

- [ ] **Step 3: Derive section state and accessible destinations**

```tsx
const hasWorkflowContent =
  visibility.pages || visibility.articles || visibility.newsEvents || visibility.reviews
const hasScheduledContent = visibility.pages || visibility.articles || visibility.newsEvents
const hasAttention = hasWorkflowContent || visibility.formSubmissions || visibility.workQueue
const workflowCollection = visibility.pages
  ? 'pages'
  : visibility.articles
    ? 'articles'
    : visibility.newsEvents
      ? 'news-events'
      : 'reviews'
const scheduledCollection = visibility.pages
  ? 'pages'
  : visibility.articles
    ? 'articles'
    : 'news-events'
const quickActions = [
  { enabled: visibility.pages, href: '/admin/collections/pages/create', label: '+ New Page' },
  {
    enabled: visibility.articles,
    href: '/admin/collections/articles/create',
    label: '+ New Article',
  },
  {
    enabled: visibility.newsEvents,
    href: '/admin/collections/news-events/create',
    label: '+ New News / Event',
  },
  {
    enabled: visibility.pages,
    href: '/admin/collections/reusable-sections/create',
    label: '+ New Reusable Section',
  },
  { enabled: visibility.media, href: '/admin/collections/media/create', label: '+ Upload Media' },
].filter(({ enabled }) => enabled)
```

- [ ] **Step 4: Gate the JSX**

Render Needs Attention only when `hasAttention`; gate its four cards with
`hasWorkflowContent`, `hasScheduledContent`, `visibility.formSubmissions`, and
`visibility.workQueue`. Point workflow cards at the derived accessible collection. Render Content
Overview only when `hasWorkflowContent`, with each `MiniStat` gated by its collection flag.
Render Quick Actions only when the filtered array is non-empty. Require
`visibility.formSubmissions && recentSubmissions.length > 0` for Recent Submissions.

- [ ] **Step 5: Run tests and lint**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dashboard-capability-filtering.int.spec.tsx
pnpm exec eslint src/components/admin/DashboardOverview.tsx tests/int/dashboard-capability-filtering.int.spec.tsx
```

Expected: all focused tests and lint pass.

### Task 3: Update Documentation And Verify

**Files:**

- Modify: `docs/guides/dashboard.md`
- Modify: `docs/architecture/feature-inventory.md:164-170`

**Interfaces:**

- Consumes: the completed capability contract
- Produces: documentation that no longer reports this gap

- [ ] **Step 1: Add the operator-facing behavior**

Add after the dashboard guide introduction:

```markdown
The dashboard follows the signed-in user's capabilities. Counts, recent records, operational
cards, and quick actions appear only for areas that user can manage. Administrators see the full
dashboard; restricted users see a smaller workspace without placeholder cards for inaccessible
areas.
```

- [ ] **Step 2: Remove the resolved inventory bullet**

Delete only:

```markdown
- dashboard aggregate/recent-data queries are not capability-filtered at query time
```

- [ ] **Step 3: Run focused regressions**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/dashboard-capability-filtering.int.spec.tsx \
  tests/int/adminCapabilities.int.spec.ts \
  tests/int/admin-documentation.int.spec.ts \
  tests/int/admin-information-architecture.int.spec.ts
```

Expected: all selected files pass.

- [ ] **Step 4: Run final checks without committing**

```bash
pnpm exec eslint src/components/admin/DashboardOverview.tsx tests/int/dashboard-capability-filtering.int.spec.tsx
git diff --check
git status --short
```

Expected: static checks pass and Git lists uncommitted plan, implementation, test, and documentation changes.
