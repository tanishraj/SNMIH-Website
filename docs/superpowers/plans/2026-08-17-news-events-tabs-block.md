# News & Events Tabs Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore News Grid to its original contract and add a standalone, theme-aligned `News & Events Tabs` block backed by the governed News & Events collection.

**Architecture:** Keep the seven-classification contract and grouped server query in the shared News & Events data layer. Move all tab-specific schema, presentation, card, client interaction, preview, and thumbnail ownership into `src/blocks/NewsEventsTabs`; the existing News Grid returns to its title-required News/Event-only grid implementation.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19, TypeScript 5.7, Tailwind CSS 4, installed shadcn Badge/Button/Empty primitives, Vitest 4, Testing Library 16.

## Global Constraints

- Do not stage or commit any file.
- Preserve the approved Featured Carousel mode in News & Events Highlights.
- Restore News Grid schema, loading, presentation, preview, generated type shape, documentation, tests, and thumbnail to the pre-tabs contract.
- Register `newsEventsTabs` on Pages and Reusable Sections and in both production/live-preview renderers.
- Use fixed tabs in this order: All, News, Events, Notice, Holiday, Achievements, Announcement, Others.
- Render text-only cards with classification, date, title, excerpt, and action.
- Use semantic theme tokens, shared section typography/actions/spacing, and `var(--radius)`; add no hardcoded SNMIH colors or manual dark-mode overrides.
- Load 3, 6, 9, or 12 records per tab on the server; perform no browser collection fetches.

---

### Task 1: Restore the existing News Grid contract

**Files:**
- Modify: `src/blocks/NewsGrid/config.ts`
- Modify: `src/blocks/NewsGrid/Component.tsx`
- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Modify: `src/blocks/NewsGrid/PreviewComponent.tsx`
- Modify: `src/blocks/NewsGrid/newsGridShared.ts`
- Modify: `src/lib/newsEvents.ts`
- Modify: `tests/int/news-grid.int.spec.tsx`

**Interfaces:**
- Preserves: `NewsGridBlock`, `NewsGridBlockComponent`, `NewsGridBlockPresentation`, `NewsGridBlockLike`.
- Removes from News Grid: `displayMode`, `itemsPerTab`, grouped props, classification-tab rendering, and tab-specific normalizers.
- Restores: News Grid public selection to `{ contentType: { equals: 'news' } }` plus current/upcoming Events.

- [ ] **Step 1: Change the News Grid tests back to the legacy schema/query contract**

Assert `title.required === true`, no `displayMode` or `itemsPerTab` fields, one mixed query containing News plus current/upcoming Events, and the original title-guarded grid/feature-card behavior.

- [ ] **Step 2: Run the focused test and verify the current implementation fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx
```

Expected: FAIL on the temporary classification-tab fields and optional-title contract.

- [ ] **Step 3: Restore News Grid config, loader, presentation, preview, and helpers**

Restore the original required title field:

```ts
{
  name: 'title',
  type: 'text',
  required: true,
}
```

Restore the server loader to:

```ts
const itemCount = getNewsGridCollectionItemCount(props.totalCards, props.featureCard)
const nowISO = new Date().toISOString()
const items = itemCount > 0 ? await getNewsGridItems(itemCount, nowISO).catch(() => []) : []
return <NewsGridBlockPresentation {...props} items={items} />
```

Remove tab branches and restore the original inline News/Event collection card markup. Restore the preview component to `newsGridByCount` only and remove tab-only exports from `newsGridShared.ts`.

- [ ] **Step 4: Restore the News Grid query predicate**

In `fetchNewsGridItems()`, use:

```ts
or: [
  { contentType: { equals: 'news' } },
  currentOrUpcomingEventPredicate(nowISO),
]
```

Keep expanded classifications and grouped queries for the new block.

- [ ] **Step 5: Run the legacy News Grid test**

Run the Task 1 Vitest command. Expected: PASS.

---

### Task 2: Create the standalone block schema and themed presentation

**Files:**
- Create: `src/blocks/NewsEventsTabs/config.ts`
- Create: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Create: `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`
- Create: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Create: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Create: `src/blocks/NewsEventsTabs/Component.tsx`
- Create: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**
- Produces: `NewsEventsTabsBlock` with slug `newsEventsTabs` and interface `NewsEventsTabsBlock`.
- Produces: `normalizeNewsEventsTabsItemsPerTab(value): 3 | 6 | 9 | 12`.
- Consumes: `getNewsEventGroups()`, `PublicNewsEventGroups`, classification labels/badge variants, shared appearance/actions/spacing.

- [ ] **Step 1: Write failing schema, rendering, and interaction tests**

Assert the exact slug/interface, optional section heading, items-per-tab values, two/three/four column values, fixed tab order, ARIA keyboard behavior, text-only cards, excerpts, event date range/action label, themed `bg-card`/`text-card-foreground`/`var(--radius)` classes, empty state, and footer action.

- [ ] **Step 2: Run the test and verify it fails because the block does not exist**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

- [ ] **Step 3: Add normalization and responsive grid helpers**

```ts
export const NEWS_EVENTS_TABS_ITEM_VALUES = ['3', '6', '9', '12'] as const
export type NewsEventsTabsItemsPerTab = 3 | 6 | 9 | 12
export type NewsEventsTabsCardsPerRow = '2' | '3' | '4'

export function normalizeNewsEventsTabsItemsPerTab(value?: string | null) {
  return NEWS_EVENTS_TABS_ITEM_VALUES.includes(value as never)
    ? (Number(value) as NewsEventsTabsItemsPerTab)
    : 6
}

export function getNewsEventsTabsGridClasses(value?: string | null) {
  if (value === '2') return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2'
  if (value === '4') return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
}
```

- [ ] **Step 4: Build the independent text card**

Use shadcn `Card`, `Badge`, and existing `ContentLink`. Render classification label/variant, compact date or event range, title, excerpt, and a bottom-aligned action. The Card overrides the primitive geometry with:

```tsx
className="h-full min-h-[18rem] gap-0 rounded-[var(--radius)] bg-card py-0 text-card-foreground shadow-none ring-1 ring-border"
```

- [ ] **Step 5: Build the accessible fixed tabs client**

Use one `activeValue` state, `useId`, and roving button refs. Implement Arrow Left/Right, Home, and End selection/focus. Render only the active `tabpanel`; use shared Empty primitives when `groups[activeValue]` is empty.

- [ ] **Step 6: Add the server presentation and loader**

The server component calls:

```ts
const count = normalizeNewsEventsTabsItemsPerTab(props.itemsPerTab)
const groups = await getNewsEventGroups(count, new Date().toISOString())
return <NewsEventsTabsBlockPresentation {...props} groups={groups} />
```

The presentation resolves optional header content, shared actions, appearance, regular spacing, themed section surface, client tabs, and footer actions. It renders without a title and degrades to empty groups on query failure.

- [ ] **Step 7: Run the standalone block tests**

Run the Task 2 Vitest command. Expected: PASS.

---

### Task 3: Register production and live-preview ownership

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Create: `src/blocks/NewsEventsTabs/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Test: `tests/int/news-events-tabs.int.spec.tsx`
- Test: `tests/int/live-preview-import-boundary.int.spec.ts`

**Interfaces:**
- Adds one Page/Reusable block registration and matching production/live-preview cases.
- Moves grouped preview scanning from `newsGrid` to `newsEventsTabs`.
- Preserves `groupsByCount` as the serializable grouped snapshot record.

- [ ] **Step 1: Add failing registration and preview scanner assertions**

Assert Pages and Reusable Sections contain `newsEventsTabs`, both renderer sources contain a matching case, and this layout returns `[9]`:

```ts
getNewsEventsTabsPreviewGroupCounts([
  { blockType: 'newsEventsTabs', itemsPerTab: '9' },
] as never)
```

Also assert News Grid no longer contributes grouped preview counts.

- [ ] **Step 2: Register the block and add renderer cases**

Import `NewsEventsTabsBlock` beside the two existing News blocks, register it after `newsGrid`, and add lazy production/live-preview branches using the established switch pattern.

- [ ] **Step 3: Move grouped preview ownership**

Rename the scanner to `getNewsEventsTabsPreviewGroupCounts` and match only `block.blockType === 'newsEventsTabs'`. The new Preview component normalizes `itemsPerTab` and passes `snapshot.groupsByCount[String(count)]` into its presentation.

- [ ] **Step 4: Run registration and preview tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS without importing the server-only data module into live-preview client boundaries.

---

### Task 4: Add the dedicated picker thumbnail and restore News Grid preview

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Create: `public/block-thumbnails/news-events-tabs.jpg`
- Restore: `public/block-thumbnails/news-grid.jpg`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**
- Adds thumbnail definition `{ slug: 'newsEventsTabs', filename: 'news-events-tabs.jpg' }`.
- Restores the News Grid fixture to its original grid/feature-card presentation.

- [ ] **Step 1: Add failing thumbnail definition and fixture assertions**

Assert the new slug, label, filename, stage alignment, and a production-component fixture. Retain the existing News Grid filename/slug assertions.

- [ ] **Step 2: Add the new fixture and restore the News Grid fixture**

Use classification-varied grouped text-card data for `newsEventsTabs`. Restore News Grid's original two collection cards plus editor-authored feature card.

- [ ] **Step 3: Generate only affected thumbnails**

```bash
BLOCK_THUMBNAIL_SLUG=newsGrid pnpm generate:block-thumbnails
BLOCK_THUMBNAIL_SLUG=newsEventsTabs pnpm generate:block-thumbnails
```

Expected: both JPEG files are 1600×900. Inspect them visually for SNMIH typography, token colors, square radius, tab overflow, card balance, and unclipped copy.

- [ ] **Step 4: Run thumbnail tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS.

---

### Task 5: Generate types, update documentation/context, and verify

**Files:**
- Regenerate: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Generated types add `NewsEventsTabsBlock` while restoring `NewsGridBlock` to its original fields.
- Operator docs describe the tabs as a standalone block, not a News Grid mode.

- [ ] **Step 1: Generate Payload types**

```bash
pnpm generate:types
```

Expected: `NewsEventsTabsBlock` has the configured fields; `NewsGridBlock` has no `displayMode` or `itemsPerTab`.

- [ ] **Step 2: Correct product and project-context narratives**

Document News & Events Tabs as the fixed seven-classification directory block. Restore News Grid wording to the existing News/Event grid and feature-card behavior. Update Page block counts through the generated inventory rather than by hand.

- [ ] **Step 3: Update and check project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: current inventory; stale knowledge-graph metadata may remain a warning.

- [ ] **Step 4: Run focused and global verification**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/news-events-data.int.spec.ts tests/int/news-events-collection.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/live-preview-import-boundary.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx tests/int/project-context-repository.int.spec.ts
```

Expected: typecheck and focused tests pass; lint may retain only the pre-existing Google Tag Manager recommendation.

- [ ] **Step 5: Inspect the final unstaged diff**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no staged paths, no commit, News Grid restored, and the standalone News & Events Tabs block fully registered.
