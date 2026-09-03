# News Grid Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing News Grid draft as a separately selectable, collection-backed page block with feature-inclusive total counts, configurable two-to-four-column desktop layouts, live preview, semantic theming, documentation, and regression coverage.

**Architecture:** Keep collection selection in the existing News & Events server helper and share its count-indexed snapshot with live preview. Add small pure News Grid count/grid resolvers so production, preview, presentation, tests, and snapshot discovery agree about whether the optional promotional card consumes one configured slot. Keep `Presentation.tsx` database-free and theme-semantic; register the block through the same Page, Reusable Section, renderer, thumbnail, and generated-type surfaces as News & Events Highlights.

**Tech Stack:** Payload CMS 3.85, Next.js 16 server components, React 19, TypeScript 5.7, Tailwind CSS 4, Vitest 4, Next Image, and the existing block-thumbnail generator.

## Global Constraints

- Preserve the existing News & Events Highlights block and its query semantics.
- News Grid entries are automatic; never add manual News/Event relationships or card-content overrides.
- `totalCards` includes the optional promotional card and accepts integers from 1 through 6; default to 3.
- A promotional card is valid only when enabled and its trimmed title is non-empty.
- Query `totalCards - 1` collection entries for a valid promotional card; query the full total otherwise.
- Skip the collection query when the resolved collection count is zero.
- Defensively cap collection items so the presentation never exceeds the configured total.
- Add `cardsPerRow` values 2, 3, and 4; default to 3.
- Render one column on mobile, at most two at `md`, and the configured desktop count at `xl`.
- Reuse the current published-News/current-or-upcoming-Event interleaving helper and canonical URLs.
- Reuse existing appearance, spacing, typography, eyebrow, link, action, radius, and border contracts; add no raw SNMIH colors or new theme tokens.
- Preserve unrelated modifications in `src/components/footer56.tsx`, `src/components/image-mosaic.tsx`, and `src/components/services21.tsx`.
- Do not stage or commit implementation changes unless the user explicitly requests it.
- The user explicitly selected the in-app browser for interactive visual QA; do not substitute another browser surface if it remains unavailable.

## File Map

- Modify `src/blocks/NewsGrid/config.ts` to replace `itemCount` with `totalCards` and add `cardsPerRow`.
- Create `src/blocks/NewsGrid/newsGridShared.ts` for normalized totals, feature validity, collection count, and static grid-class resolution.
- Modify `src/blocks/NewsGrid/Component.tsx` to query only the required automatic-card count and skip zero-count queries.
- Modify `src/blocks/NewsGrid/PreviewComponent.tsx` to consume the same derived count from the preview snapshot.
- Modify `src/blocks/NewsGrid/Presentation.tsx` for total capping, responsive 2/3/4-column layout, shared content typography, surface-safe feature fallback, and media positioning.
- Modify `src/lib/newsEventsPreviewShared.ts` so News Grid snapshot counts use the derived automatic-card count.
- Expand `tests/int/news-grid.int.spec.tsx` to cover schema, count resolution, presentation, registration, theming, and preview behavior.
- Modify `src/collections/Pages.ts`, `src/collections/ReusableSections.ts`, `src/blocks/renderPageBlocks.tsx`, and `src/blocks/renderLivePreviewPageBlocks.tsx` only as needed to finish or correct the existing draft registration.
- Modify `src/block-thumbnails/definitions.ts` and `src/block-thumbnails/fixtures.tsx`; generate `public/block-thumbnails/news-grid.jpg`.
- Regenerate `src/payload-types.ts` after schema completion.
- Modify `docs/guides/blocks.md`, `docs/guides/news-events.md`, `docs/guides/pages.md`, and `docs/architecture/feature-inventory.md`.
- Keep `docs/superpowers/specs/2026-08-14-news-grid-block-design.md` synchronized if implementation review exposes a contradiction.

---

### Task 1: Define the News Grid schema contract

**Files:**

- Modify: `src/blocks/NewsGrid/config.ts`
- Test: `tests/int/news-grid.int.spec.tsx`

**Interfaces:**

- Consumes: Payload `NumberField`, `SelectField`, shared appearance fields, shared content-action fields, and existing Page/custom link conditions.
- Produces: `totalCards: number | null` and `cardsPerRow: '2' | '3' | '4' | null` for generated Payload types and renderers.

- [ ] **Step 1: Add failing schema assertions**

Add a recursive named-field helper and assert these exact contracts:

```ts
expect(findNamedField(NewsGridBlock.fields, 'totalCards')).toMatchObject({
  type: 'number',
  defaultValue: 3,
  min: 1,
  max: 6,
  required: true,
})

expect(findNamedField(NewsGridBlock.fields, 'cardsPerRow')).toMatchObject({
  type: 'select',
  defaultValue: '3',
  required: true,
  options: [
    { label: '2 Cards', value: '2' },
    { label: '3 Cards', value: '3' },
    { label: '4 Cards', value: '4' },
  ],
})

expect(findNamedField(NewsGridBlock.fields, 'itemCount')).toBeUndefined()
```

Also assert Content/Theme Settings tabs, required `title`, two header/footer shared-action arrays, `contentAlignment` default Left, `size` default Default, and the feature-card Page/custom/new-tab conditions.

- [ ] **Step 2: Run the focused schema test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx -t 'schema'
```

Expected: FAIL because the draft still exposes `itemCount` and has no `cardsPerRow` field.

- [ ] **Step 3: Implement the schema fields**

Import `NumberField`. Replace the draft `itemCount` field with:

```ts
{
  name: 'totalCards',
  label: 'Total Cards',
  type: 'number',
  defaultValue: 3,
  min: 1,
  max: 6,
  required: true,
  admin: {
    description:
      'Total visible cards. A valid enabled promotional card occupies the final slot.',
  },
} satisfies NumberField,
```

Add this field in Theme Settings after `contentAlignment`:

```ts
{
  name: 'cardsPerRow',
  label: 'Cards Per Row',
  type: 'select',
  defaultValue: '3',
  required: true,
  options: [
    { label: '2 Cards', value: '2' },
    { label: '3 Cards', value: '3' },
    { label: '4 Cards', value: '4' },
  ],
  admin: {
    description: 'Desktop column count. Mobile and tablet layouts adapt automatically.',
  },
} satisfies SelectField,
```

Keep the draft feature-card fields, conditional visibility, labels, defaults, and shared appearance/action controls.

- [ ] **Step 4: Run the schema tests**

Run the Step 2 command again.

Expected: the News Grid schema test PASS.

---

### Task 2: Resolve feature-inclusive totals once

**Files:**

- Create: `src/blocks/NewsGrid/newsGridShared.ts`
- Modify: `src/blocks/NewsGrid/Component.tsx`
- Modify: `src/blocks/NewsGrid/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Test: `tests/int/news-grid.int.spec.tsx`

**Interfaces:**

- Consumes: `totalCards`, feature-card enabled/title values, and the existing count-keyed `NewsEventsPreviewSnapshot`.
- Produces: `normalizeNewsGridTotalCards`, `hasValidNewsGridFeature`, `getNewsGridCollectionItemCount`, and count-consistent production/preview behavior.

- [ ] **Step 1: Add failing pure-count tests**

Import the new helpers and assert:

```ts
expect(normalizeNewsGridTotalCards(undefined)).toBe(3)
expect(normalizeNewsGridTotalCards(0)).toBe(3)
expect(normalizeNewsGridTotalCards(7)).toBe(3)
expect(normalizeNewsGridTotalCards(4)).toBe(4)

expect(hasValidNewsGridFeature({ enabled: true, title: 'Campus' })).toBe(true)
expect(hasValidNewsGridFeature({ enabled: true, title: '   ' })).toBe(false)
expect(hasValidNewsGridFeature({ enabled: false, title: 'Campus' })).toBe(false)

expect(getNewsGridCollectionItemCount({ totalCards: 3 })).toBe(3)
expect(
  getNewsGridCollectionItemCount({
    totalCards: 3,
    featureCard: { enabled: true, title: 'Campus' },
  }),
).toBe(2)
expect(
  getNewsGridCollectionItemCount({
    totalCards: 1,
    featureCard: { enabled: true, title: 'Campus' },
  }),
).toBe(0)
```

Add snapshot scanning assertions: a News Grid with total 3 and a valid feature contributes count 2; total 1 with a valid feature contributes no count; an invalid feature contributes the full total. Existing News & Events Highlights count behavior must remain unchanged.

- [ ] **Step 2: Run count/snapshot tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx -t 'count|snapshot'
```

Expected: FAIL because the helpers do not exist and snapshot discovery still reads `itemCount` directly.

- [ ] **Step 3: Implement the shared resolvers**

Create `newsGridShared.ts`:

```ts
export const NEWS_GRID_DEFAULT_TOTAL_CARDS = 3
export const NEWS_GRID_MAX_TOTAL_CARDS = 6

export type NewsGridFeatureLike = {
  enabled?: boolean | null
  title?: string | null
}

export const normalizeNewsGridTotalCards = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6
    ? value
    : NEWS_GRID_DEFAULT_TOTAL_CARDS

export const hasValidNewsGridFeature = (
  featureCard: NewsGridFeatureLike | null | undefined,
): boolean => Boolean(featureCard?.enabled && featureCard.title?.trim())

export const getNewsGridCollectionItemCount = ({
  featureCard,
  totalCards,
}: {
  featureCard?: NewsGridFeatureLike | null
  totalCards?: number | null
}): number =>
  Math.max(
    0,
    normalizeNewsGridTotalCards(totalCards) - (hasValidNewsGridFeature(featureCard) ? 1 : 0),
  )
```

Keep the file client-safe: no Payload, Next cache, or `server-only` imports.

- [ ] **Step 4: Apply the count to production and preview**

In `Component.tsx`, replace `normalizeHighlightsItemCount(props.itemCount)` with
`getNewsGridCollectionItemCount(props)`. Return an empty items array without calling
`getNewsEventsHighlights` when the result is zero; otherwise call the existing query with that count
and catch failures as the draft already does.

In `PreviewComponent.tsx`, derive the same count. Use `[]` for zero or read
`snapshot.highlightsByCount[String(count)] ?? []` for positive counts.

In `newsEventsPreviewShared.ts`, keep Highlights on `normalizeHighlightsItemCount(block.itemCount)`.
For `newsGrid`, derive `getNewsGridCollectionItemCount(block)` and add it to the set only when positive.

- [ ] **Step 5: Run count, preview, and existing News & Events data tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-grid.int.spec.tsx \
  tests/int/news-events-data.int.spec.ts
```

Expected: all tests PASS; the existing interleaving/publication behavior remains unchanged.

---

### Task 3: Finish the responsive themed presentation

**Files:**

- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Modify: `src/blocks/NewsGrid/newsGridShared.ts`
- Test: `tests/int/news-grid.int.spec.tsx`

**Interfaces:**

- Consumes: automatic `PublicNewsEventCard[]`, `totalCards`, `cardsPerRow`, shared content styles, shared action/link components, and semantic block appearance.
- Produces: a pure semantic section capped to the configured total with static Tailwind grid mappings and a final promotional slot.

- [ ] **Step 1: Add failing presentation assertions**

Render 2/3/4-column variants and assert:

```ts
expect(renderGrid('2')).toContain('md:grid-cols-2 xl:grid-cols-2')
expect(renderGrid('3')).toContain('md:grid-cols-2 xl:grid-cols-3')
expect(renderGrid('4')).toContain('md:grid-cols-2 xl:grid-cols-4')
expect(renderGrid('invalid' as never)).toContain('xl:grid-cols-3')
```

Assert `data-news-grid-columns` exposes the resolved value. Supply four collection items plus a valid
feature with total 3 and assert exactly two `data-news-grid-card` articles plus one feature. Assert an
invalid feature allows three collection cards. Assert the feature follows every collection article.

Add theme/content assertions for:

- `contentSectionHeadingClasses`, `contentSectionDescriptionClasses`,
  `contentItemTitleClasses`, and `contentItemMetadataClasses`;
- `border-current/15` and `rounded-[var(--radius)]`;
- section surface propagation to category eyebrows;
- `data-block-surface="brand"` only when the feature has an image;
- a no-image feature fallback using semantic section/card foreground instead of forced white copy;
- safe external feature destination attributes.

- [ ] **Step 2: Run presentation tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx -t 'column|total|theme|feature|typography'
```

Expected: FAIL because the draft has one fixed three-column class, does not cap collection items, and
forces the image-overlay treatment even without an image.

- [ ] **Step 3: Add static grid resolution**

Add to `newsGridShared.ts`:

```ts
export type NewsGridCardsPerRow = '2' | '3' | '4'

export const newsGridColumnClasses = {
  '2': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const satisfies Record<NewsGridCardsPerRow, string>

const newsGridCardsPerRowValues = new Set<NewsGridCardsPerRow>(['2', '3', '4'])

export const resolveNewsGridCardsPerRow = (
  value: NewsGridCardsPerRow | null | undefined,
): NewsGridCardsPerRow =>
  newsGridCardsPerRowValues.has(value as NewsGridCardsPerRow) ? value! : '3'
```

- [ ] **Step 4: Normalize and cap presentation input**

Extend `NewsGridBlockLike` with `totalCards` and `cardsPerRow`; remove `itemCount`. Resolve total,
feature validity, and columns through the shared helpers. Compute:

```ts
const collectionLimit = getNewsGridCollectionItemCount({ featureCard, totalCards: resolvedTotal })
const visibleItems = items.slice(0, collectionLimit)
const hasCards = visibleItems.length > 0 || showsFeature
```

Map `visibleItems`, then append the feature. Add `data-news-grid-columns` and the resolved static grid
class to the grid.

- [ ] **Step 5: Align content and feature styling with existing blocks**

Use `contentIntroClasses`, `contentSectionHeadingClasses`, `contentSectionDescriptionClasses`,
`contentItemTitleClasses`, and `contentItemMetadataClasses` where semantically applicable. Keep
collection cards text-led to match the supplied reference; category, date, title, and the foot-aligned
`ContentLink` remain the complete card content.

Give collection cards `rounded-[var(--radius)] border border-current/15`. For the feature:

- use `relative isolate ... rounded-[var(--radius)]`;
- when an image resolves, render Next Image plus a dark `from-black/...` overlay, white copy,
  `surface="darkOverlay"`, and `data-block-surface="brand"`;
- without an image, use a semantic `bg-card text-card-foreground` fallback with
  `border border-current/15`, the current section eyebrow surface, and no forced white text;
- keep the optional destination/link slot absent when resolution fails.

Avoid a second animation system or hover-only information.

- [ ] **Step 6: Run all News Grid presentation tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx
```

Expected: all News Grid tests PASS.

---

### Task 4: Complete registration, thumbnail, and generated types

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Create: `public/block-thumbnails/news-grid.jpg`
- Regenerate: `src/payload-types.ts`
- Test: `tests/int/news-grid.int.spec.tsx`
- Test: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**

- Consumes: `NewsGridBlock`, `NewsGridBlockComponent`, `NewsGridPreviewBlockComponent`, and the block thumbnail catalog.
- Produces: selectable Page/Reusable Section schema, production/live-preview rendering, Admin picker thumbnail, and generated Payload unions/select types.

- [ ] **Step 1: Add failing integration assertions**

Extend the current registration test to assert both Pages and Reusable Sections contain `newsGrid`,
both renderers contain the case, the thumbnail definition uses `news-grid.jpg`, and the fixture catalog
contains a `newsGrid` entry. Add generated-type text assertions for:

```ts
export interface NewsGridBlock
totalCards?: number | null;
cardsPerRow?: ('2' | '3' | '4') | null;
blockType: 'newsGrid';
```

Assert `itemCount` is absent within the `NewsGridBlock` interface section.

- [ ] **Step 2: Run integration tests and verify the remaining failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-grid.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: draft registration checks may pass; generated type and final thumbnail assertions FAIL until regeneration.

- [ ] **Step 3: Reconcile the existing registration draft**

Retain and format the existing News Grid imports/list entries/cases in Pages, Reusable Sections,
production rendering, live preview, thumbnail definitions, and fixtures. Do not reorder unrelated
blocks unless Prettier requires it. Update the fixture to `totalCards={3}` and `cardsPerRow="3"`; keep
two representative collection items plus one valid image feature so the preview demonstrates the
default reference composition.

- [ ] **Step 4: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: `src/payload-types.ts` contains the finalized News Grid interface and union/select entries
for both Pages and Reusable Sections.

- [ ] **Step 5: Generate the News Grid thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=newsGrid pnpm run generate:block-thumbnails
```

Expected: `public/block-thumbnails/news-grid.jpg` is generated. If the thumbnail command requires its
local IPC socket outside the sandbox, request command-specific approval rather than changing scripts.

- [ ] **Step 6: Inspect the thumbnail once**

Open the generated JPEG and verify: heading/action balance, two text cards plus final image feature,
equal card footprint, restrained borders, no clipping, and theme-consistent type. Apply one bounded
correction pass only if the visual evidence identifies defects.

- [ ] **Step 7: Run registration and thumbnail tests**

Run the Step 2 command again.

Expected: all selected tests PASS.

---

### Task 5: Document the block and reconcile catalog counts

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/pages.md`
- Modify: `docs/architecture/feature-inventory.md`
- Test: `tests/int/admin-documentation.int.spec.ts`
- Test: `tests/int/feature-inventory.int.spec.ts`

**Interfaces:**

- Consumes: final admin labels, automatic selection contract, total/feature semantics, and actual Page block count.
- Produces: operator and architecture documentation that matches the registered schema.

- [ ] **Step 1: Determine the actual Page block count**

Use a focused Node/TypeScript inspection or the existing collection tests to count `Pages` layout
blocks after News Grid registration. Do not copy the currently inconsistent prose counts (`39` in
Pages guide and `41` in Feature Inventory) without verifying the schema.

- [ ] **Step 2: Add failing documentation assertions**

Update the documentation tests to require:

- **News Grid** in the Page Blocks catalog;
- the phrases **automatic**, **Total Cards**, **Cards Per Row**, and **promotional card** in the block/news-events guidance;
- the verified Page block count in both Pages guide and Feature Inventory;
- News Grid in the feature inventory's Page block list.

- [ ] **Step 3: Update operator documentation**

Add a Block Catalog row:

```md
| News Grid | Editorial News/Event row with an optional promotional card | Automatically balances published News and current/upcoming Events; Total Cards includes the promotion; 2–4 desktop columns |
```

In `news-events.md`, explain that News & Events Highlights is the standard media-card feed while News
Grid is the text-led editorial/promotion layout. State that both are automatic and neither allows
manual entry selection.

Update the Pages guide and Feature Inventory to the verified count and add News Grid to the exhaustive list.

- [ ] **Step 4: Run documentation tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/admin-documentation.int.spec.ts \
  tests/int/feature-inventory.int.spec.ts
```

Expected: documentation vocabulary/count tests PASS.

---

### Task 6: Final quality gate

**Files:**

- Verify all files from Tasks 1–5.
- Do not modify unrelated dirty files.

**Interfaces:**

- Consumes: complete News Grid schema, renderers, preview, thumbnail, types, docs, and tests.
- Produces: an unstaged implementation ready for user review.

- [ ] **Step 1: Format only in-scope text files**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/NewsGrid \
  src/blocks/renderPageBlocks.tsx \
  src/blocks/renderLivePreviewPageBlocks.tsx \
  src/collections/Pages.ts \
  src/collections/ReusableSections.ts \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  src/lib/newsEventsPreviewShared.ts \
  tests/int/news-grid.int.spec.tsx \
  docs/guides/blocks.md \
  docs/guides/news-events.md \
  docs/guides/pages.md \
  docs/architecture/feature-inventory.md
```

Expected: formatting completes without touching unrelated components.

- [ ] **Step 2: Run focused and adjacent tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-grid.int.spec.tsx \
  tests/int/news-events-data.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/admin-documentation.int.spec.ts \
  tests/int/feature-inventory.int.spec.ts
```

Use `rg --files tests/int | rg 'news.*event'` to discover any additional focused Highlights test and
include it rather than silently omitting adjacent coverage.

Expected: all selected test files PASS.

- [ ] **Step 3: Run static validation**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint \
  src/blocks/NewsGrid \
  src/blocks/renderPageBlocks.tsx \
  src/blocks/renderLivePreviewPageBlocks.tsx \
  src/collections/Pages.ts \
  src/collections/ReusableSections.ts \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  src/lib/newsEventsPreviewShared.ts \
  tests/int/news-grid.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/NewsGrid/Presentation.tsx
git diff --check
```

Expected: TypeScript, ESLint, detector, and whitespace checks complete without in-scope errors.

- [ ] **Step 4: Attempt the requested in-app browser QA**

Reuse the already initialized in-app-browser runtime and request a fresh tab. If available, open the
News Grid thumbnail preview route and inspect light/dark rendering at approximately 1440px, 900px,
and 390px widths. Verify column transitions, header/action wrapping, card order, link focus, and no
horizontal overflow. Capture one desktop and one mobile screenshot.

If the in-app browser still reports unavailable, record that exact limitation and do not substitute
Chrome, Playwright, or another browser surface. The already inspected generated thumbnail remains the
bounded visual fallback.

- [ ] **Step 5: Verify worktree ownership and handoff**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Confirm News Grid files are unstaged, the design-spec commit remains intact, and the pre-existing
footer/image-mosaic/services edits were not altered as part of this implementation. Report the
completed behavior, validation results, browser limitation if any, and that no implementation commit
was created.
