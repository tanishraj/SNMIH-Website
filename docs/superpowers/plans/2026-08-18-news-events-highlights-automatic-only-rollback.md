# News & Events Highlights Automatic-Only Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Manual Entries from `newsEventsHighlights`, restore automatic News & Events ownership and naming, and preserve the current overlay and image-position controls.

**Architecture:** Keep the internal block slug, renderer registration, generic client-safe carousel item model, and current synchronized carousel UI. Simplify the Payload schema, server component, live preview, and automatic adapter so collection data is the only source, while retaining block-wide media-overlay and image-position normalization.

**Tech Stack:** Payload CMS 3 fields and generated types, Next.js/React server and client components, TypeScript, shadcn carousel/card primitives, Vitest, Testing Library, Tailwind semantic tokens.

## Global Constraints

- Keep the internal slug `newsEventsHighlights` and interface `NewsEventsHighlightsBlock`.
- Restore the Payload Admin and thumbnail label to `News & Events Highlights`.
- Remove `contentSource`, `manualSlides`, manual validation, manual adapters, and manual runtime/preview branches.
- Always load automatic News & Events records in production and live preview.
- Preserve Number of Items with range 1–6 and default 3.
- Preserve Autoplay and Empty State Message.
- Preserve Image Position Override with Use Item Setting, Center, Top, Bottom, Left, and Right.
- Preserve Overlay Tone, Strength, Direction, and Coverage.
- Preserve legacy overlay defaults: Dark, Darker, Bottom to Top, and Full.
- Preserve the existing layout, typography, clamps, fallback image, responsive rail, and interaction behavior.
- Do not change News Grid or News & Events Tabs.
- Preserve unrelated worktree changes.
- Do not stage or commit any file.

---

## File Structure

### Keep And Simplify

- `src/components/news-events/featuredHighlightsShared.ts` — retain generic item, image-position, and overlay contracts; remove content-source types and normalization.
- `src/blocks/NewsEventsHighlights/resolveItems.ts` — retain only the automatic News & Events adapter.

### Modify

- `src/blocks/NewsEventsHighlights/config.ts` — remove source/manual fields and conditions; keep media controls.
- `src/blocks/NewsEventsHighlights/Component.tsx` — always query and adapt automatic entries.
- `src/blocks/NewsEventsHighlights/PreviewComponent.tsx` — always adapt the automatic snapshot.
- `src/blocks/NewsEventsHighlights/Presentation.tsx` — remove manual/source props; keep overlay and position plumbing.
- `src/lib/newsEventsPreviewShared.ts` — include every Highlights block item count.
- `src/block-thumbnails/definitions.ts` — restore label and alt text.
- `src/payload-types.ts` — regenerate after schema rollback.
- `public/block-thumbnails/news-events-highlights.jpg` — regenerate the single block preview.
- `tests/int/news-events-highlights.int.spec.tsx` — replace dual-source contracts with automatic-only contracts.
- `tests/int/news-events-featured-carousel.int.spec.tsx` — retain overlay, image-position, fallback, responsive, and interaction coverage.
- `tests/int/block-thumbnails.int.spec.ts` — restore picker naming contract.
- `docs/guides/blocks.md` — restore automatic-only operator guidance while documenting media controls.
- `docs/architecture/feature-inventory.md` — restore current block name and ownership.
- `.agents/skills/project-context/references/block-system.md` — restore automatic-only architecture contract.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate after removing exported manual/source symbols.

### Preserve As History

- `docs/superpowers/specs/2026-08-18-featured-highlights-content-sources-design.md`
- `docs/superpowers/plans/2026-08-18-featured-highlights-content-sources.md`

---

### Task 1: Restore The Automatic-Only Payload Schema

**Files:**
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**
- Produces: an automatic-only `NewsEventsHighlightsBlock` without `contentSource` or `manualSlides`.
- Preserves: `itemCount`, `imagePositionOverride`, `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage`.

- [ ] **Step 1: Replace the dual-source schema assertions with an automatic-only failing contract**

In the schema test, assert the restored labels and absence of manual fields while keeping media controls:

```tsx
expect(NewsEventsHighlightsBlock.labels).toEqual({
  plural: 'News & Events Highlights',
  singular: 'News & Events Highlights',
})

expect(findNamedField(contentFields, 'contentSource')).toBeUndefined()
expect(findNamedField(contentFields, 'manualSlides')).toBeUndefined()

const itemCount = findNamedField(themeFields, 'itemCount')
expect(itemCount).toMatchObject({
  defaultValue: 3,
  max: 6,
  min: 1,
  required: true,
  type: 'number',
})
expect((itemCount?.admin as { condition?: unknown } | undefined)?.condition).toBeUndefined()

expect(findNamedField(themeFields, 'imagePositionOverride')).toMatchObject({
  defaultValue: 'item',
  required: true,
  type: 'select',
})
expect(findNamedField(themeFields, 'themeMode')).toMatchObject({ defaultValue: 'dark' })
expect(findNamedField(themeFields, 'overlayStyle')).toMatchObject({ defaultValue: 'darker' })
expect(findNamedField(themeFields, 'overlayDirection')).toMatchObject({
  defaultValue: 'bottomToTop',
})
expect(findNamedField(themeFields, 'overlayCoverage')).toMatchObject({ defaultValue: 'full' })
```

Delete manual array, condition, and validation assertions from this test.

- [ ] **Step 2: Run the schema test and confirm it fails for the dual-source fields**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `contentSource`, `manualSlides`, and the Featured Highlights labels still exist.

- [ ] **Step 3: Remove manual schema code and restore automatic naming**

In `config.ts`, reduce Payload imports to:

```ts
import type { Block, CheckboxField, NumberField, SelectField, TabsField } from 'payload'
```

Delete `HighlightsSourceData`, both conditions, `manualSlideFields`, and `manualSlidesField`. Keep the reusable `imagePositionOptions` constant because Image Position Override still uses it.

Restore labels:

```ts
labels: {
  singular: 'News & Events Highlights',
  plural: 'News & Events Highlights',
},
```

The Content tab begins directly with the existing section fields:

```ts
fields: [
  { name: 'eyebrow', type: 'text' },
  { name: 'title', type: 'text' },
  { name: 'description', type: 'textarea' },
  createContentActionsField({ maxRows: 1 }),
  createContentActionsField({
    name: 'footerActions',
    label: 'Footer Actions',
    maxRows: 2,
  }),
]
```

Remove `admin.condition` from Number of Items. Change Empty State Message help text to:

```ts
description: 'Optional message shown when no published news or upcoming events exist.'
```

Keep these media controls unchanged:

```ts
{
  name: 'imagePositionOverride',
  label: 'Image Position Override',
  type: 'select',
  defaultValue: 'item',
  options: [{ label: 'Use Item Setting', value: 'item' }, ...imagePositionOptions],
  required: true,
} satisfies SelectField,
createMediaOverlayToneField({ defaultValue: 'dark' }),
createMediaOverlayStrengthField({ defaultValue: 'darker' }),
createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' }),
createMediaOverlayCoverageField({ defaultValue: 'full' }),
```

- [ ] **Step 4: Run the focused schema test**

Run the command from Step 2.

Expected: PASS. Runtime tests still exercise the current branches until Task 2 replaces them.

- [ ] **Step 5: Regenerate and inspect Payload types**

Run:

```bash
pnpm generate:types
```

Inspect `NewsEventsHighlightsBlock` and confirm:

```ts
itemCount: number
imagePositionOverride: 'item' | 'center' | 'top' | 'bottom' | 'left' | 'right'
themeMode: 'auto' | 'light' | 'dark' | 'brand'
overlayStyle: 'light' | 'dark' | 'darker'
overlayDirection: 'vertical' | 'leftToRight' | 'rightToLeft' | 'bottomToTop' | 'topToBottom'
overlayCoverage: 'full' | 'split'
```

The interface must not contain `contentSource` or `manualSlides`.

- [ ] **Step 6: Review without staging or committing**

Run:

```bash
git diff --check -- src/blocks/NewsEventsHighlights/config.ts tests/int/news-events-highlights.int.spec.tsx src/payload-types.ts
```

Expected: no output. Do not run `git add` or `git commit`.

---

### Task 2: Restore Automatic Production And Preview Loading

**Files:**
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `src/blocks/NewsEventsHighlights/Component.tsx`
- Modify: `src/blocks/NewsEventsHighlights/PreviewComponent.tsx`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`

**Interfaces:**
- Consumes: `normalizeHighlightsItemCount(value)` and `getNewsEventsHighlights(count, nowISO)`.
- Consumes: `toAutomaticFeaturedHighlightItems(entries)` retained and simplified in Task 3.
- Produces: automatic-only production and preview rendering.

- [ ] **Step 1: Replace source-selection tests with automatic-only runtime tests**

Keep the mocked collection loader and prove that even stale saved manual fields are ignored:

```tsx
it('always loads the News & Events collection and ignores stale source fields', async () => {
  vi.mocked(getNewsEventsHighlights).mockResolvedValueOnce([
    {
      contentType: 'notice',
      dateISO: '2026-08-17T00:00:00.000Z',
      dateLabel: 'Aug 17, 2026',
      excerpt: 'An important notice.',
      href: '/news-events/notice',
      id: 'notice',
      isPastEvent: false,
      slug: 'notice',
      title: 'Campus notice',
    },
  ])

  const element = await NewsEventsHighlightsBlockComponent({
    contentSource: 'manual',
    itemCount: 4,
    manualSlides: [{ title: 'Stale manual slide' }],
  } as never)

  expect(getNewsEventsHighlights).toHaveBeenCalledWith(4, expect.any(String))
  expect(renderToStaticMarkup(element)).toContain('Campus notice')
  expect(renderToStaticMarkup(element)).not.toContain('Stale manual slide')
})
```

Delete tests that expect manual rendering or expect the collection loader not to run. Keep only the
explicit stale-data compatibility assertions above.

Restore preview-count coverage:

```tsx
expect(
  getNewsEventsPreviewItemCounts([
    {
      blockType: 'newsEventsHighlights',
      contentSource: 'manual',
      itemCount: 5,
      manualSlides: [{ title: 'Stale manual slide' }],
    },
    { blockType: 'newsEventsHighlights', itemCount: 2 },
  ] as never),
).toEqual([2, 5])
```

Add a preview test proving stale manual values cannot bypass the automatic snapshot:

```tsx
it('always renders the automatic live-preview snapshot', () => {
  const element = NewsEventsHighlightsPreviewBlockComponent({
    contentSource: 'manual',
    itemCount: 3,
    manualSlides: [{ title: 'Stale manual slide' }],
    snapshot: {
      ...EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
      highlightsByCount: {
        '3': [
          {
            contentType: 'news',
            dateISO: '2026-08-18T00:00:00.000Z',
            dateLabel: 'Aug 18, 2026',
            excerpt: 'Collection-owned content.',
            href: '/news-events/automatic',
            id: 'automatic',
            isPastEvent: false,
            slug: 'automatic',
            title: 'Automatic highlight',
          },
        ],
      },
    },
  } as never)
  const markup = renderToStaticMarkup(element)

  expect(markup).toContain('Automatic highlight')
  expect(markup).not.toContain('Stale manual slide')
})
```

- [ ] **Step 2: Run the focused test and confirm automatic-only assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL while the production and preview components still branch on `contentSource` and preview counts exclude manual values.

- [ ] **Step 3: Simplify the production component**

Replace the source branch in `Component.tsx` with:

```tsx
export async function NewsEventsHighlightsBlockComponent(props: NewsEventsHighlightsBlockLike) {
  const itemCount = normalizeHighlightsItemCount(props.itemCount)
  const nowISO = new Date().toISOString()
  const entries = await getNewsEventsHighlights(itemCount, nowISO).catch(() => [])
  const items = toAutomaticFeaturedHighlightItems(entries)

  return <NewsEventsHighlightsBlockPresentation {...props} items={items} />
}
```

Remove imports for `toManualFeaturedHighlightItems` and `normalizeFeaturedHighlightsContentSource`.

- [ ] **Step 4: Simplify the live-preview component**

Replace the source branch with:

```tsx
export function NewsEventsHighlightsPreviewBlockComponent({
  snapshot,
  ...props
}: NewsEventsHighlightsPreviewBlockProps) {
  const itemCount = normalizeHighlightsItemCount(props.itemCount)
  const items = toAutomaticFeaturedHighlightItems(
    snapshot.highlightsByCount[String(itemCount)] ?? [],
  )

  return <NewsEventsHighlightsBlockPresentation {...props} items={items} />
}
```

Remove manual/source imports.

- [ ] **Step 5: Restore preview snapshot count collection**

In `getNewsEventsPreviewItemCounts`, use:

```ts
if (block.blockType === 'newsEventsHighlights') {
  counts.add(normalizeHighlightsItemCount(block.itemCount))
}
```

- [ ] **Step 6: Remove manual/source properties from the presentation contract**

Delete these properties and imports from `NewsEventsHighlightsBlockLike`:

```ts
contentSource
manualSlides
FeaturedHighlightsContentSource
ManualFeaturedHighlightValue
```

Keep `imagePositionOverride`, all four overlay properties, and their normalization unchanged.

- [ ] **Step 7: Run the focused runtime and preview tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 8: Review without staging or committing**

Run `git diff --check` for the five files in this task. Expected: no output.

---

### Task 3: Remove Manual-Only Adapter And Shared Types

**Files:**
- Modify: `src/blocks/NewsEventsHighlights/resolveItems.ts`
- Modify: `src/components/news-events/featuredHighlightsShared.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Test: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**
- Produces: `toAutomaticFeaturedHighlightItems(entries: PublicNewsEventCard[]): FeaturedHighlightItem[]`.
- Preserves: `FeaturedHighlightItem`, `FeaturedHighlightImagePositionOverride`, `FeaturedHighlightsOverlayOptions`, `resolveFeaturedHighlightImagePosition`, and `resolveFeaturedHighlightsOverlay`.

- [ ] **Step 1: Remove manual adapter and content-source tests**

Delete tests for:

```ts
toManualFeaturedHighlightItems
normalizeFeaturedHighlightsContentSource
manual custom actions
manual internal Page actions
blank manual rows
```

Also delete the client-carousel test named `renders a custom manual action and its new-tab behavior`;
automatic entries always provide the standard `Read more` action. Retain the optional-element,
fallback-image, position-override, overlay, responsive, and interaction tests.

Keep the automatic adapter test and the position/overlay fallback test. The fallback test becomes:

```tsx
expect(resolveFeaturedHighlightImagePosition('top', 'item')).toBe('top')
expect(resolveFeaturedHighlightImagePosition('top', 'left')).toBe('left')
expect(resolveFeaturedHighlightImagePosition('invalid', 'invalid')).toBe('center')
expect(resolveFeaturedHighlightsOverlay({})).toEqual({
  coverage: 'full',
  direction: 'bottomToTop',
  strength: 'darker',
  tone: 'dark',
})
```

- [ ] **Step 2: Remove the manual adapter implementation**

In `resolveItems.ts`, remove imports for `CmsActionValue`, `resolveCmsActions`, `getMediaImageProps`, `formatNewsEventDate`, `Media`, and `FeaturedHighlightImagePosition`. Delete `ManualFeaturedHighlightValue` and `toManualFeaturedHighlightItems` completely.

The file retains only:

```ts
export function toAutomaticFeaturedHighlightItems(
  entries: PublicNewsEventCard[],
): FeaturedHighlightItem[] {
  return entries.map((entry) => ({
    action: { href: entry.href, label: 'Read more' },
    badge: {
      label: getNewsEventClassificationLabel(entry.contentType),
      variant: getNewsEventClassificationBadgeVariant(entry.contentType),
    },
    dateISO: entry.dateISO,
    dateLabel:
      entry.contentType === 'event'
        ? formatNewsEventDateRange(entry.eventStart ?? entry.dateISO, entry.eventEnd)
        : entry.dateLabel,
    description: entry.excerpt?.trim() || undefined,
    id: entry.id,
    image: entry.image,
    title: entry.title,
  }))
}
```

- [ ] **Step 3: Remove content-source symbols from the shared client model**

Delete:

```ts
export type FeaturedHighlightsContentSource = 'automatic' | 'manual'

export function normalizeFeaturedHighlightsContentSource(
  value: string | null | undefined,
): FeaturedHighlightsContentSource {
  return value === 'manual' ? 'manual' : 'automatic'
}
```

Do not change generic item, image, action, image-position, overlay, or object-position exports.

- [ ] **Step 4: Run adapter and carousel tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS, including fallback image, block-wide position override, overlay settings, optional metadata rendering, responsive dimensions, and carousel interaction.

- [ ] **Step 5: Run the live-preview import-boundary test**

Run:

```bash
pnpm exec vitest run tests/int/live-preview-import-boundary.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS; no Payload-backed News & Events loader enters the client preview graph.

- [ ] **Step 6: Review without staging or committing**

Run `git diff --check` for the files in this task. Expected: no output.

---

### Task 4: Restore Naming, Thumbnail, And Current Documentation

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Generate: `public/block-thumbnails/news-events-highlights.jpg`

**Interfaces:**
- Produces: the current operator contract and Admin picker identity.
- Preserves: historical specifications and plans unchanged.

- [ ] **Step 1: Write the failing thumbnail naming assertion**

Use:

```ts
expect(getBlockThumbnailDefinition('newsEventsHighlights')).toMatchObject({
  alt: 'News & Events Highlights block preview',
  filename: 'news-events-highlights.jpg',
  label: 'News & Events Highlights',
  slug: 'newsEventsHighlights',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Run the thumbnail contract and confirm it fails**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL while the definition still uses Featured Highlights Carousel.

- [ ] **Step 3: Restore the thumbnail definition**

Use:

```ts
defineThumbnail({
  alt: 'News & Events Highlights block preview',
  filename: 'news-events-highlights.jpg',
  label: 'News & Events Highlights',
  slug: 'newsEventsHighlights',
  stageAlignment: 'top',
})
```

The generic automatic fixture content remains valid and needs no manual fields.

- [ ] **Step 4: Update current documentation**

Describe News & Events Highlights as automatic-only. Document that it:

- interleaves published non-event entries with current/upcoming Events;
- exposes one-to-six Number of Items;
- preserves Autoplay and Empty State Message;
- uses per-record image positions unless Image Position Override is selected;
- preserves Dark/Darker/Bottom-to-Top/Full overlay defaults;
- uses the centered SNMIH fallback image for missing or failed media;
- does not offer manual entries.

Remove current references to Manual Entries and dual content sources from the three current-doc files. Do not edit historical files under `docs/superpowers/**`.

- [ ] **Step 5: Regenerate only the affected thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=newsEventsHighlights pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/news-events-highlights.jpg` is a 1600×900 JPEG and the command reports only `newsEventsHighlights`.

- [ ] **Step 6: Verify thumbnail contracts**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 7: Review without staging or committing**

Run `git diff --check` for the files in this task. Expected: no output.

---

### Task 5: Regenerate Project Knowledge And Run Regression Checks

**Files:**
- Generate: `.agents/skills/project-context/references/project-inventory.json`
- Inspect: every file changed in Tasks 1–4

**Interfaces:**
- Verifies: schema, server query, live preview, presentation, registration, thumbnail, documentation, and generated inventory remain synchronized.

- [ ] **Step 1: Format only touched TypeScript and test files**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/NewsEventsHighlights/config.ts \
  src/blocks/NewsEventsHighlights/Component.tsx \
  src/blocks/NewsEventsHighlights/PreviewComponent.tsx \
  src/blocks/NewsEventsHighlights/Presentation.tsx \
  src/blocks/NewsEventsHighlights/resolveItems.ts \
  src/components/news-events/featuredHighlightsShared.ts \
  src/lib/newsEventsPreviewShared.ts \
  src/block-thumbnails/definitions.ts \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: exit 0 without formatting unrelated files.

- [ ] **Step 2: Run the affected integration suite**

Run:

```bash
pnpm exec vitest run \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-featured-carousel.int.spec.tsx \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/card-block-renderers.int.spec.tsx \
  tests/int/block-surface-semantics.int.spec.ts \
  tests/int/regular-block-spacing.int.spec.tsx \
  tests/int/section-eyebrow.int.spec.tsx \
  tests/int/news-events-data.int.spec.ts \
  --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits 0; lint has no errors. Report unrelated existing warnings without changing their files.

- [ ] **Step 4: Refresh the required project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: inventory removes manual/source exports if no longer present, and the check reports current. A stale knowledge-graph commit warning is non-blocking.

- [ ] **Step 5: Inspect the final change impact**

Read `.agents/skills/project-context/references/change-impact-map.md` again, then run:

```bash
git diff --check
git status --short
git diff --stat
```

Confirm:

- `contentSource` and `manualSlides` are absent from current schema, runtime, preview, generated
  types, and current docs; their only remaining test references are stale-data compatibility inputs;
- overlay and image-position controls remain;
- automatic collection loading and preview snapshots remain;
- News Grid and News & Events Tabs were not modified by this rollback;
- unrelated staged and unstaged work remains preserved;
- nothing was staged or committed.

- [ ] **Step 6: Handoff without staging or committing**

Report the automatic-only behavior, retained media controls, regenerated files, passing checks, and any unrelated baseline failure. Do not run `git add` or `git commit`.
