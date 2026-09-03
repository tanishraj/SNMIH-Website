# News & Events Tabs Editorial List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Editorial List layout to the existing News & Events Tabs block while preserving the current Card Grid, automatic collection data, configurable tabs, and Load More behavior.

**Architecture:** Add one normalized presentation setting to the existing block and branch only at the active-items rendering boundary. Card Grid keeps the current card component and column resolver; Editorial List receives the same `PublicNewsEventCard[]` through a focused row component, so filtering, pagination, retry, and data fetching remain shared.

**Tech Stack:** Payload CMS 3 block fields and generated types, Next.js/React, Tailwind CSS theme tokens, existing shadcn Button primitives, Lucide icons through shared components, Vitest, Testing Library.

## Global Constraints

- Keep `newsEventsTabs` as the existing block slug; do not create a second block or API route.
- Card Grid (`cardGrid`) is the required admin default and the runtime fallback for legacy, missing, or invalid values.
- Editorial List (`editorialList`) uses the same automatic News & Events collection data and Load More endpoint.
- Move `cardsPerRow` to Theme Settings without renaming it or changing its stored values.
- The entire editorial row is one accessible link; its `ActionArrow` is decorative and uses the existing `group/button` animation contract.
- Use existing semantic theme tokens and responsive utility classes; add no dependency and no hardcoded color.
- Preserve existing section content, appearance, spacing, actions, tabs, empty state, and pagination behavior.
- Do not stage or commit changes.

---

### Task 1: Add and normalize the layout setting

**Files:**

- Modify: `tests/int/news-events-tabs.int.spec.tsx`
- Modify: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Modify: `src/blocks/NewsEventsTabs/config.ts`

**Interfaces:**

- Produces: `NewsEventsTabsLayoutStyle = 'cardGrid' | 'editorialList'`.
- Produces: `normalizeNewsEventsTabsLayoutStyle(value?: string | null): NewsEventsTabsLayoutStyle`.
- Preserves: `cardsPerRow` field name and `'2' | '3' | '4'` values.

- [ ] **Step 1: Write failing schema and normalization tests**

Add imports for `normalizeNewsEventsTabsLayoutStyle`, then assert the new select and legacy fallback:

```tsx
expect(findNamedField(NewsEventsTabsBlock.fields, 'layoutStyle')).toMatchObject({
  defaultValue: 'cardGrid',
  options: [
    { label: 'Card Grid', value: 'cardGrid' },
    { label: 'Editorial List', value: 'editorialList' },
  ],
  required: true,
  type: 'select',
})

expect(normalizeNewsEventsTabsLayoutStyle('editorialList')).toBe('editorialList')
expect(normalizeNewsEventsTabsLayoutStyle('cardGrid')).toBe('cardGrid')
expect(normalizeNewsEventsTabsLayoutStyle('invalid')).toBe('cardGrid')
expect(normalizeNewsEventsTabsLayoutStyle(undefined)).toBe('cardGrid')
```

Invoke `cardsPerRow.admin.condition` with `{ layoutStyle: 'cardGrid' }` and `{ layoutStyle: 'editorialList' }`, asserting `true` and `false` respectively.

- [ ] **Step 2: Run the focused test and verify the new assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx
```

Expected: FAIL because `layoutStyle` and `normalizeNewsEventsTabsLayoutStyle` do not exist.

- [ ] **Step 3: Add the shared layout type and normalizer**

Add to `newsEventsTabsShared.ts`:

```ts
export const NEWS_EVENTS_TABS_LAYOUT_STYLES = ['cardGrid', 'editorialList'] as const

export type NewsEventsTabsLayoutStyle = (typeof NEWS_EVENTS_TABS_LAYOUT_STYLES)[number]

export function normalizeNewsEventsTabsLayoutStyle(
  value?: string | null,
): NewsEventsTabsLayoutStyle {
  return value === 'editorialList' ? 'editorialList' : 'cardGrid'
}
```

- [ ] **Step 4: Add the Payload field and relocate Cards Per Row**

In the Theme Settings tab, add the required select before `cardsPerRow`:

```ts
{
  name: 'layoutStyle',
  label: 'Layout',
  type: 'select',
  defaultValue: 'cardGrid',
  options: [
    { label: 'Card Grid', value: 'cardGrid' },
    { label: 'Editorial List', value: 'editorialList' },
  ],
  required: true,
  admin: {
    description: 'Choose cards or a full-width editorial list for the tab results.',
  },
} satisfies SelectField,
```

Move the unchanged `cardsPerRow` radio object from Content into Theme Settings immediately after it, and extend its admin config:

```ts
admin: {
  condition: (_data, siblingData) => siblingData?.layoutStyle !== 'editorialList',
  description: 'Maximum cards in each desktop row.',
  layout: 'horizontal',
},
```

- [ ] **Step 5: Run the focused test**

Run `pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx`.

Expected: PASS for schema and normalization tests; existing behavior remains green.

### Task 2: Build the full-row editorial presentation

**Files:**

- Create: `src/blocks/NewsEventsTabs/NewsEventsTabsRow.tsx`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: `item: PublicNewsEventCard`.
- Produces: `NewsEventsTabsRow({ item }: { item: PublicNewsEventCard })`.
- Reuses: `NewsEventClassificationBadge`, `NewsEventDateMeta`, `formatNewsEventDateRange`, and `ActionArrow`.

- [ ] **Step 1: Write failing row-layout tests**

Import and render `NewsEventsTabsRow` directly with `baseCard`, then assert:

```tsx
const row = container.querySelector('[data-news-events-tabs-row="true"]')
expect(row?.tagName).toBe('A')
expect(row?.getAttribute('href')).toBe(baseCard.href)
expect(row?.className).toContain('group/button')
expect(row?.className).toContain(
  'lg:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(6rem,0.35fr)]',
)
expect(row?.className).toContain('lg:items-start')
expect(row?.className).toContain('gap-y-5')
expect(row?.className).toContain('lg:gap-x-8')
const dateColumn = row?.querySelector('[data-news-events-tabs-row-date="true"]')
const titleColumn = row?.querySelector('[data-news-events-tabs-row-title="true"]')
expect(dateColumn?.className).toContain('lg:self-center')
expect(dateColumn?.querySelector('.lucide-calendar-days')).toBeTruthy()
expect(dateColumn?.querySelector('[data-news-event-classification]')).toBeNull()
expect(titleColumn?.querySelector('[data-news-event-classification="news"]')).toBeTruthy()
expect(titleColumn?.querySelector('h3')).toBeTruthy()
expect(row?.querySelector('[aria-hidden="true"] .lucide-arrow-right')).toBeTruthy()
expect(row?.querySelector('h3')?.className).toContain('text-xl')
expect(row?.querySelector('h3')?.className).toContain('font-semibold')
expect(row?.querySelector('p')?.className).toContain('text-base')
expect(row?.querySelector('p')?.className).toContain('font-normal')
```

Add an event fixture with `eventStart` and `eventEnd` and assert the existing formatted range. Add fixtures with an empty excerpt and empty date, asserting those optional elements are omitted without removing the badge or link.

- [ ] **Step 2: Run the focused test and verify the row assertions fail**

Run `pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx`.

Expected: FAIL because the row component does not exist.

- [ ] **Step 3: Implement the focused row component**

Create `NewsEventsTabsRow.tsx` with one Next.js `Link` as the row root. Use this structure and token-based styling:

```tsx
<Link
  className="group/button grid min-h-40 gap-y-5 border-t border-border px-1 py-7 text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 lg:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(6rem,0.35fr)] lg:items-start lg:gap-x-8"
  data-news-events-tabs-row="true"
  href={item.href}
>
  <div className="min-w-0 lg:self-center" data-news-events-tabs-row-date="true">
    {dateLabel ? (
      <NewsEventDateMeta
        className="text-muted-foreground"
        dateISO={item.dateISO}
        dateLabel={dateLabel}
      />
    ) : null}
  </div>
  <div className="flex flex-col items-start gap-3" data-news-events-tabs-row-title="true">
    <NewsEventClassificationBadge classification={item.contentType} />
    <h3 className="line-clamp-2 font-sans text-xl leading-snug font-semibold tracking-tight">
      {item.title}
    </h3>
  </div>
  {excerpt ? (
    <p className="line-clamp-3 text-base leading-6 font-normal text-muted-foreground">{excerpt}</p>
  ) : (
    <span aria-hidden="true" />
  )}
  <ActionArrow className="ml-auto self-end lg:self-center" />
</Link>
```

Compute `dateLabel` exactly as the card does so event ranges remain consistent. The first desktop column contains only the date. The second column owns both classification and title, with the badge directly above the title. Give title and description equal `minmax(0, 1fr)` tracks, then give the right-aligned arrow a wider `minmax(6rem, 0.35fr)` track. Use `gap-y-5` for the stacked mobile rhythm and one `lg:gap-x-8` gutter between every desktop column. The date and arrow are vertically centered; the badge/title group and description begin at the row's top edge. Keep empty grid placeholders hidden from assistive technology so the four-column desktop alignment remains stable without announcing filler content.

- [ ] **Step 4: Run the focused test**

Run `pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx`.

Expected: PASS for row semantics, styling, event ranges, and optional content.

### Task 3: Wire the variant through production and preview rendering

**Files:**

- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Modify: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: `layoutStyle?: NewsEventsTabsLayoutStyle | null` at the presentation boundary.
- Produces: normalized `layoutStyle: NewsEventsTabsLayoutStyle` for `NewsEventsTabsClient`.
- Preserves: current tab state, fetch request, de-duplication, loading, retry, empty state, and Load More button.

- [ ] **Step 1: Add failing propagation and pagination tests**

Assert `NewsEventsTabsBlockPresentation` emits `data-news-events-tabs-layout="editorialList"` when configured and `cardGrid` for missing/invalid values. In the existing Load More test, render Editorial List and assert six initial rows become twelve rows after the same request while no card nodes render:

```tsx
expect(document.querySelectorAll('[data-news-events-tabs-row="true"]')).toHaveLength(6)
expect(document.querySelectorAll('[data-news-events-tabs-card="true"]')).toHaveLength(0)
fireEvent.click(screen.getByRole('button', { name: 'More updates' }))
await screen.findByText('News 12')
expect(document.querySelectorAll('[data-news-events-tabs-row="true"]')).toHaveLength(12)
```

- [ ] **Step 2: Run the focused test and verify the propagation assertions fail**

Run `pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx`.

Expected: FAIL because presentation and client do not pass or branch on `layoutStyle`.

- [ ] **Step 3: Add the client rendering branch without duplicating state**

Add `layoutStyle: NewsEventsTabsLayoutStyle` to `NewsEventsTabsClientProps`, import `NewsEventsTabsRow`, and replace only the active-items container:

```tsx
<div
  className={cn(
    layoutStyle === 'editorialList'
      ? 'border-b border-border'
      : cn('grid items-stretch gap-4', getNewsEventsTabsGridClasses(cardsPerRow)),
  )}
  data-news-events-tabs-items="true"
  data-news-events-tabs-layout={layoutStyle}
>
  {activeItems.map((item) =>
    layoutStyle === 'editorialList' ? (
      <NewsEventsTabsRow item={item} key={item.id} />
    ) : (
      <NewsEventsTabsCard
        eventActionLabel={eventActionLabel}
        item={item}
        key={item.id}
        newsActionLabel={newsActionLabel}
      />
    ),
  )}
</div>
```

Do not move or duplicate `loadNextPage`, tab selection, or page state.

- [ ] **Step 4: Normalize the setting at the presentation boundary**

Extend `NewsEventsTabsBlockLike` with `layoutStyle?: NewsEventsTabsLayoutStyle | null`, destructure it, and pass:

```tsx
layoutStyle={normalizeNewsEventsTabsLayoutStyle(layoutStyle)}
```

The block and live-preview components already spread generated block fields through the shared presentation path, so they require no divergent switch or query.

- [ ] **Step 5: Make the thumbnail fixture exercise Editorial List**

Add `layoutStyle="editorialList"` to the `newsEventsTabs` fixture. Keep its sample groups, heading, actions, and item count so the thumbnail validates the new layout through the same presentation component.

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS, including Card Grid regression, Editorial List rendering, pagination, and thumbnail contracts.

### Task 4: Regenerate contracts, update project knowledge, and verify

**Files:**

- Modify (generated): `src/payload-types.ts`
- Modify as required: `.agents/skills/project-context/references/project-inventory.json`
- Modify if the architecture inventory records the new variant: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`

**Interfaces:**

- Produces: generated `NewsEventsTabsBlock.layoutStyle?: ('cardGrid' | 'editorialList') | null` contract.
- Documents: Card Grid default, Editorial List semantics, Theme Settings location, and shared Load More behavior.

- [ ] **Step 1: Regenerate Payload types**

Run `pnpm generate:types`.

Expected: `src/payload-types.ts` contains the `layoutStyle` union and retains `cardsPerRow` unchanged.

- [ ] **Step 2: Update user-facing block documentation**

In `docs/guides/blocks.md` and `docs/architecture/feature-inventory.md`, document:

```md
- Layout: Card Grid (default) or Editorial List.
- Cards Per Row is available under Theme Settings only for Card Grid.
- Both layouts use the configured classification tabs and the same incremental Load More data flow.
- Editorial List renders each entry as a full-row link with date, equal-width title/description tracks, and a wider trailing animated-arrow track.
```

- [ ] **Step 3: Run the affected test suites**

Run:

```bash
pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS with no existing Card Grid, registration, or preview regression.

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/NewsEventsTabs src/block-thumbnails/fixtures.tsx tests/int/news-events-tabs.int.spec.tsx
pnpm exec prettier --check src/blocks/NewsEventsTabs src/block-thumbnails/fixtures.tsx tests/int/news-events-tabs.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-18-news-events-tabs-editorial-list-design.md docs/superpowers/plans/2026-08-18-news-events-tabs-editorial-list.md
git diff --check
```

Expected: all commands exit successfully and no whitespace errors are reported.

- [ ] **Step 5: Refresh and validate project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; any pre-existing knowledge-graph warning is reported separately and not introduced by this feature.

- [ ] **Step 6: Review scope and leave changes uncommitted**

Run:

```bash
git status --short
git diff --stat
```

Expected: only planned feature files plus pre-existing user changes are modified; nothing is staged or committed.
