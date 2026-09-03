# News & Events Tabs Responsive Wrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every configured News & Events tab visible by wrapping complete tab pills onto additional rows whenever the available width is insufficient.

**Architecture:** Preserve the existing client component, tab semantics, selection state, and keyboard navigation. Replace the forced-width horizontal scrolling presentation with content-driven flex wrapping using existing Tailwind layout tokens and no viewport JavaScript.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn Button, Vitest, Testing Library.

## Global Constraints

- The tab list uses natural wrapping at every viewport width.
- Complete tab pills move to following rows in configured DOM order.
- When all pills fit, they remain on one row.
- The wrapper does not create a horizontal scrolling region.
- Preserve all ARIA roles, relationships, selection, focus, and keyboard navigation.
- Do not change Payload schema, tab configuration, cards, typography, or data loading.
- Do not add JavaScript viewport measurement or breakpoint-specific tab logic.
- Do not stage or commit changes.

---

### Task 1: Lock and implement the responsive tab-list contract

**Files:**

- Modify: `tests/int/news-events-tabs.int.spec.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`

**Interfaces:**

- Consumes: `data-news-events-tabs-list-wrap`, the tab list's `role="tablist"`, existing tab order, and keyboard handlers.
- Produces: a content-driven wrapping tab list without horizontal overflow or forced minimum width.

- [ ] **Step 1: Add the failing wrapping test**

Add this test to the `News & Events Tabs` suite:

```tsx
it('wraps configured tabs instead of requiring horizontal scrolling', () => {
  const { container } = render(<NewsEventsTabsClient {...baseClientProps} />)
  const wrapper = container.querySelector('[data-news-events-tabs-list-wrap="true"]')
  const tabList = screen.getByRole('tablist', {
    name: 'News and events classifications',
  })

  expect(wrapper?.className).not.toContain('overflow-x-auto')
  expect(tabList.className).toContain('flex-wrap')
  expect(tabList.className).not.toContain('min-w-max')
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'All',
    'News',
    'Events',
    'Notice',
    'Holiday',
    'Achievements',
    'Announcement',
    'Others',
  ])
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the wrapper still contains `overflow-x-auto`, and the tab list still contains `min-w-max` without `flex-wrap`.

- [ ] **Step 3: Replace forced horizontal sizing with natural wrapping**

Change the tab-list structure to:

```tsx
<div className="pb-1" data-news-events-tabs-list-wrap="true">
  <div
    aria-label="News and events classifications"
    className="flex flex-wrap gap-2"
    role="tablist"
  >
```

Keep the existing mapped buttons, ARIA attributes, event handlers, refs, variants, and button classes unchanged.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS for the new wrapping contract and all existing tab selection, configured order, empty state, and keyboard-navigation tests.

### Task 2: Record and verify the responsive behavior

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Inspect: `public/block-thumbnails/news-events-tabs.jpg`
- Inspect: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Inspect: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: the implemented responsive tab list and production thumbnail fixture.
- Produces: current operator documentation, visual evidence, and validated project knowledge.

- [ ] **Step 1: Document the tab wrapping contract**

Add this sentence to the News & Events Tabs behavior in both maintained references:

```markdown
The tab pills wrap in configured order when the available width is insufficient, keeping every tab
visible without a horizontal scrolling region.
```

- [ ] **Step 2: Regenerate and inspect the News & Events Tabs thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Keep only the intended `public/block-thumbnails/news-events-tabs.jpg` change from this command. Confirm the wide fixture remains a clean single row and that source/test contracts cover narrow-width wrapping without changing tab order or pill styling.

- [ ] **Step 3: Run focused and adjacent tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 4: Run static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript passes. Lint has no new errors or warnings attributable to this change.

- [ ] **Step 5: Complete the project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; report a stale knowledge-graph warning separately if present.

- [ ] **Step 6: Audit the final diff without staging or committing**

Run:

```bash
git diff -- src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx tests/int/news-events-tabs.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md public/block-thumbnails/news-events-tabs.jpg
git status --short
```

Expected: the implementation is limited to the approved responsive tab wrapping contract, maintained documentation, and preview; no staging or commit operation occurs.
