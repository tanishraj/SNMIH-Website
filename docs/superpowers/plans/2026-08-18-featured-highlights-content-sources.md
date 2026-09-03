# Featured Highlights Content Sources Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Highlights carousel with automatic News & Events and fully custom manual content sources, plus shared image-position and overlay controls, without changing its layout or breaking existing blocks.

**Architecture:** Keep the `newsEventsHighlights` Payload slug and both renderer registrations, but rename its Admin label to `Featured Highlights Carousel`. Normalize automatic records and manual rows into a client-safe `FeaturedHighlightItem` model; production and live preview choose the source before passing those items into the unchanged shared carousel layout. Resolve image-position and overlay defaults through small shared helpers so legacy blocks reproduce the current Dark/Darker/Bottom-to-Top/Full presentation.

**Tech Stack:** Payload CMS 3 field configuration and generated types, Next.js/React server and client components, TypeScript, shadcn Card/Carousel/Badge primitives, Vitest, Testing Library, Tailwind theme tokens.

## Global Constraints

- Preserve the internal `newsEventsHighlights` slug and `NewsEventsHighlightsBlock` interface name.
- Use `automatic` as the persisted and runtime fallback content source.
- Manual mode contains fully custom slides, not relationships to News & Events records.
- Manual badge, date, description, image, and action are optional; title is required.
- Missing or failed images use `/images/snmih-news-events-default.png`.
- Manual actions are optional, have customizable labels, and support internal pages or custom URLs.
- Keep the existing feature/rail layout, dimensions, typography, clamping, autoplay interval, reduced-motion behavior, and responsive breakpoints.
- Use existing semantic theme primitives and shared media-overlay field/presentation helpers.
- Default legacy overlay output is Dark tone, Darker strength, Bottom to Top direction, and Full coverage.
- `Empty State Message` applies to both sources; `Number of Items` applies only to Automatic.
- Do not alter News Grid or News & Events Tabs behavior.
- Preserve unrelated worktree changes. Do not stage or commit any file unless the user explicitly changes the commit policy.

---

## File Structure

### Create

- `src/components/news-events/featuredHighlightsShared.ts` — client-safe generic carousel item types plus overlay and image-position normalization.
- `src/blocks/NewsEventsHighlights/resolveItems.ts` — automatic/manual adapters, Media normalization, date formatting, and manual action resolution.
- `docs/superpowers/plans/2026-08-18-featured-highlights-content-sources.md` — this plan.

### Modify

- `src/blocks/NewsEventsHighlights/config.ts` — Admin label, content-source select, conditional manual slides, and shared feature-image controls.
- `src/blocks/NewsEventsHighlights/Component.tsx` — source selection and automatic-query gating.
- `src/blocks/NewsEventsHighlights/PreviewComponent.tsx` — source-aware live preview without collection data for Manual blocks.
- `src/blocks/NewsEventsHighlights/Presentation.tsx` — generic item and theme-control plumbing.
- `src/components/news-events/NewsEventsFeaturedCarousel.tsx` — generic item and theme-control props.
- `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx` — optional metadata/action rendering and configurable overlay/image positioning.
- `src/lib/newsEventsPreviewShared.ts` — exclude Manual blocks from automatic preview counts.
- `src/block-thumbnails/definitions.ts` — new Admin label and alt text.
- `src/block-thumbnails/fixtures.tsx` — generic fixture items and explicit legacy-compatible controls.
- `src/payload-types.ts` — generated schema types.
- `public/block-thumbnails/news-events-highlights.jpg` — regenerated picker preview.
- `tests/int/news-events-highlights.int.spec.tsx` — schema, adapters, source selection, legacy, empty-state, and preview tests.
- `tests/int/news-events-featured-carousel.int.spec.tsx` — optional UI, action, image-position, overlay, fallback, and existing layout tests.
- `tests/int/block-thumbnails.int.spec.ts` — renamed thumbnail label contract.
- `docs/guides/blocks.md` — editor-facing usage and precedence rules.
- `.agents/skills/project-context/references/block-system.md` — maintained block architecture contract.
- `.agents/skills/project-context/references/project-inventory.json` — generated repository inventory.

---

### Task 1: Add the source-aware Payload schema

**Files:**
- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Generate: `src/payload-types.ts`

**Interfaces:**
- Produces: `contentSource?: 'automatic' | 'manual' | null`.
- Produces: `manualSlides?: ManualSlide[] | null`, with one-to-six rows in Manual mode.
- Produces: `imagePositionOverride?: 'item' | 'center' | 'top' | 'bottom' | 'left' | 'right' | null`.
- Produces: `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage` using the existing shared media-overlay names.
- Consumes: `createContentActionsField`, `createMediaOverlayToneField`, `createMediaOverlayStrengthField`, `createMediaOverlayDirectionField`, and `createMediaOverlayCoverageField`.

- [ ] **Step 1: Extend the schema test with the new Admin contract**

Add assertions to the first test in `tests/int/news-events-highlights.int.spec.tsx`:

```tsx
expect(NewsEventsHighlightsBlock.labels).toEqual({
  plural: 'Featured Highlights Carousels',
  singular: 'Featured Highlights Carousel',
})

expect(findNamedField(contentFields, 'contentSource')).toMatchObject({
  defaultValue: 'automatic',
  required: true,
  type: 'select',
})
expect(
  (findNamedField(contentFields, 'contentSource')?.options as Array<{ value: string }>).map(
    ({ value }) => value,
  ),
).toEqual(['automatic', 'manual'])

const manualSlidesField = findNamedField(contentFields, 'manualSlides')
expect(manualSlidesField).toMatchObject({
  maxRows: 6,
  type: 'array',
})
const manualSlideFields = manualSlidesField?.fields as unknown[]
expect(findNamedField(manualSlideFields, 'title')).toMatchObject({ required: true, type: 'text' })
expect(findNamedField(manualSlideFields, 'badgeLabel')).toBeDefined()
expect(findNamedField(manualSlideFields, 'date')).toBeDefined()
expect(findNamedField(manualSlideFields, 'image')).toBeDefined()
expect(findNamedField(manualSlideFields, 'imagePosition')).toBeDefined()
expect(findNamedField(manualSlideFields, 'action')).toBeDefined()

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

Also call each conditional Admin function directly and assert:

```tsx
const manualSlides = findNamedField(contentFields, 'manualSlides')
const itemCount = findNamedField(themeFields, 'itemCount')

expect((manualSlides?.admin as { condition?: (data: unknown) => boolean }).condition?.({
  contentSource: 'manual',
})).toBe(true)
expect((manualSlides?.admin as { condition?: (data: unknown) => boolean }).condition?.({
  contentSource: 'automatic',
})).toBe(false)
expect((itemCount?.admin as { condition?: (data: unknown) => boolean }).condition?.({
  contentSource: 'manual',
})).toBe(false)
expect((itemCount?.admin as { condition?: (data: unknown) => boolean }).condition?.({})).toBe(true)
```

- [ ] **Step 2: Run the schema test and verify the expected failure**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the label is still `News & Events Highlights` and the source/manual/overlay fields do not exist.

- [ ] **Step 3: Add source conditions and manual slide fields**

In `src/blocks/NewsEventsHighlights/config.ts`, import `ArrayField`, `DateField`, `Field`, and the four media-overlay factories. Add stable conditions:

```ts
type HighlightsContentSource = 'automatic' | 'manual'

const usesManualEntries = (data: Record<string, unknown> | undefined) =>
  data?.contentSource === 'manual'

const usesAutomaticEntries = (data: Record<string, unknown> | undefined) =>
  data?.contentSource !== 'manual'
```

Define manual fields with the shared action factory:

```ts
const manualSlideFields: Field[] = [
  { name: 'title', type: 'text', required: true },
  { name: 'description', type: 'textarea' },
  { name: 'badgeLabel', label: 'Badge Label', type: 'text' },
  {
    name: 'date',
    type: 'date',
    admin: { date: { pickerAppearance: 'dayOnly' } },
  } satisfies DateField,
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    filterOptions: { mimeType: { contains: 'image' } },
  },
  {
    name: 'imagePosition',
    label: 'Image Position',
    type: 'select',
    defaultValue: 'center',
    options: [
      { label: 'Center', value: 'center' },
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
    required: true,
  },
  createContentActionsField({ label: 'Action', maxRows: 1, name: 'action' }),
]
```

Add `contentSource` before `manualSlides` in the Content tab. Configure the array with `maxRows: 6`, `admin.condition: usesManualEntries`, collapsed rows, and validation that returns `true` outside Manual mode and requires at least one row with a non-empty title inside Manual mode. Keep `minRows` unset so hidden stale values cannot invalidate Automatic mode.

- [ ] **Step 4: Add source-specific and shared Theme Settings**

Add `admin.condition: usesAutomaticEntries` to Number of Items. Leave Empty State Message visible for both modes. Add:

```ts
{
  name: 'imagePositionOverride',
  label: 'Image Position Override',
  type: 'select',
  defaultValue: 'item',
  options: [
    { label: 'Use Item Setting', value: 'item' },
    { label: 'Center', value: 'center' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
},
createMediaOverlayToneField({ defaultValue: 'dark' }),
createMediaOverlayStrengthField({ defaultValue: 'darker' }),
createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' }),
createMediaOverlayCoverageField({ defaultValue: 'full' }),
```

Update the labels to `Featured Highlights Carousel` / `Featured Highlights Carousels` without changing the slug or interface name.

- [ ] **Step 5: Run the focused schema test**

Run the same Vitest command from Step 2.

Expected: PASS for the schema assertions; existing presentation tests remain green.

- [ ] **Step 6: Generate and inspect Payload types**

Run:

```bash
pnpm generate:types
```

Expected: exit 0. Inspect `NewsEventsHighlightsBlock` in `src/payload-types.ts` and confirm it contains `contentSource`, `manualSlides`, `imagePositionOverride`, `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage` with the intended unions. Do not edit the generated file manually.

- [ ] **Step 7: Review checkpoint without staging or committing**

Run:

```bash
git diff --check -- src/blocks/NewsEventsHighlights/config.ts tests/int/news-events-highlights.int.spec.tsx src/payload-types.ts
```

Expected: no output.

---

### Task 2: Introduce the generic item model and adapters

**Files:**
- Create: `src/components/news-events/featuredHighlightsShared.ts`
- Create: `src/blocks/NewsEventsHighlights/resolveItems.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

**Interfaces:**
- Produces: `FeaturedHighlightItem`, `FeaturedHighlightImage`, `FeaturedHighlightImagePosition`, `FeaturedHighlightImagePositionOverride`, `FeaturedHighlightsContentSource`, and `FeaturedHighlightsOverlayOptions`.
- Produces: `normalizeFeaturedHighlightsContentSource(value): 'automatic' | 'manual'`.
- Produces: `resolveFeaturedHighlightImagePosition(itemPosition, override)`.
- Produces: `resolveFeaturedHighlightsOverlay(options)`.
- Produces: `toAutomaticFeaturedHighlightItems(entries)` and `toManualFeaturedHighlightItems(slides)`.
- Consumes: `PublicNewsEventCard`, `getMediaImageProps`, `formatNewsEventDate`, `resolveCmsActions`, and the generated manual slide shape.

- [ ] **Step 1: Write failing adapter and normalization tests**

Add imports and tests to `tests/int/news-events-highlights.int.spec.tsx` covering this exact contract:

```tsx
expect(toAutomaticFeaturedHighlightItems([automaticEntry])).toEqual([
  expect.objectContaining({
    action: expect.objectContaining({ href: '/news-events/story', label: 'Read more' }),
    badge: { label: 'News', variant: 'default' },
    dateLabel: 'Jul 20, 2026',
    description: 'A public story.',
    id: 'story',
    title: 'Public story',
  }),
])

expect(toManualFeaturedHighlightItems([
  {
    id: 'manual-1',
    action: [{ label: 'Explore', linkType: 'custom', url: '/explore' }],
    badgeLabel: 'Campus',
    date: '2026-08-20T00:00:00.000Z',
    description: 'A custom slide.',
    image: { alt: 'Custom alt', height: 900, id: 'image-1', url: '/custom.jpg', width: 1600 },
    imagePosition: 'top',
    title: 'Manual highlight',
  },
])).toEqual([
  expect.objectContaining({
    action: expect.objectContaining({ href: '/explore', label: 'Explore' }),
    badge: { label: 'Campus', variant: 'outline' },
    dateLabel: 'Aug 20, 2026',
    description: 'A custom slide.',
    image: expect.objectContaining({ alt: 'Custom alt', position: 'top', src: '/custom.jpg' }),
    title: 'Manual highlight',
  }),
])

expect(toManualFeaturedHighlightItems([{ id: 'blank', title: '   ' }])).toEqual([])
expect(normalizeFeaturedHighlightsContentSource(undefined)).toBe('automatic')
expect(normalizeFeaturedHighlightsContentSource('automatic')).toBe('automatic')
expect(normalizeFeaturedHighlightsContentSource('manual')).toBe('manual')
expect(normalizeFeaturedHighlightsContentSource('invalid')).toBe('automatic')
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

- [ ] **Step 2: Run the focused test and verify missing-module failures**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the shared model and adapters do not exist.

- [ ] **Step 3: Create the client-safe shared item contract**

In `src/components/news-events/featuredHighlightsShared.ts`, define:

```ts
export type FeaturedHighlightImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type FeaturedHighlightImagePositionOverride = 'item' | FeaturedHighlightImagePosition
export type FeaturedHighlightBadgeVariant = 'default' | 'ghost' | 'outline' | 'secondary'
export type FeaturedHighlightsContentSource = 'automatic' | 'manual'

export type FeaturedHighlightImage = {
  alt: string
  height?: number
  position: FeaturedHighlightImagePosition
  src: string
  width?: number
}

export type FeaturedHighlightItem = {
  action?: { href: string; label: string; openInNewTab?: boolean }
  badge?: { label: string; variant: FeaturedHighlightBadgeVariant }
  dateISO?: string
  dateLabel?: string
  description?: string
  id: string
  image?: FeaturedHighlightImage
  title: string
}
```

Use the existing media-overlay normalizers to implement the source, image, and overlay helpers:

```ts
export function normalizeFeaturedHighlightsContentSource(
  value: string | null | undefined,
): FeaturedHighlightsContentSource {
  return value === 'manual' ? 'manual' : 'automatic'
}

export function resolveFeaturedHighlightImagePosition(
  itemPosition: string | null | undefined,
  override: string | null | undefined,
): FeaturedHighlightImagePosition {
  const resolvedItem = validImagePositions.has(itemPosition as FeaturedHighlightImagePosition)
    ? (itemPosition as FeaturedHighlightImagePosition)
    : 'center'

  return override && override !== 'item' && validImagePositions.has(override as FeaturedHighlightImagePosition)
    ? (override as FeaturedHighlightImagePosition)
    : resolvedItem
}

export function resolveFeaturedHighlightsOverlay({
  coverage,
  direction,
  strength,
  tone,
}: Partial<FeaturedHighlightsOverlayOptions>): FeaturedHighlightsOverlayOptions {
  const resolvedDirection = normalizeMediaOverlayDirection(direction, 'bottomToTop')

  return {
    coverage: normalizeMediaOverlayCoverage(coverage, resolvedDirection),
    direction: resolvedDirection,
    strength: normalizeMediaOverlayStrength(strength, 'darker'),
    tone: normalizeMediaOverlayTone(tone, 'dark'),
  }
}
```

Define `validImagePositions` once and define `FeaturedHighlightsOverlayOptions` with the existing
`MediaOverlayCoverage`, `MediaOverlayDirection`, `MediaOverlayStrength`, and `MediaOverlayTone`
types. Normalize direction before coverage because `vertical` forces Full coverage.

- [ ] **Step 4: Create focused automatic/manual adapters**

In `src/blocks/NewsEventsHighlights/resolveItems.ts`, export a manual value type matching the generated shape and implement:

```ts
export function toAutomaticFeaturedHighlightItems(
  entries: PublicNewsEventCard[],
): FeaturedHighlightItem[]

export function toManualFeaturedHighlightItems(
  slides?: ManualFeaturedHighlightValue[] | null,
): FeaturedHighlightItem[]
```

Automatic items preserve the record ID, title, excerpt, classification label/variant, date values,
image, and automatic `Read more` action.

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

Complete the manual mapping as a defensive `flatMap`:

```ts
export function toManualFeaturedHighlightItems(
  slides?: ManualFeaturedHighlightValue[] | null,
): FeaturedHighlightItem[] {
  return (slides ?? []).flatMap((slide, index) => {
    const title = slide.title?.trim()
    if (!title) return []

    const media = getMediaImageProps({ fallbackAlt: title, media: slide.image, preset: 'generic' })
    const action = resolveCmsActions(slide.action)[0]
    const badgeLabel = slide.badgeLabel?.trim()
    const dateISO =
      slide.date && !Number.isNaN(new Date(slide.date).getTime()) ? slide.date : undefined

    return [{
      action: action
        ? {
            href: action.href,
            label: action.label,
            openInNewTab: action.openInNewTab,
          }
        : undefined,
      badge: badgeLabel ? { label: badgeLabel, variant: 'outline' } : undefined,
      dateISO,
      dateLabel: dateISO ? formatNewsEventDate(dateISO) : undefined,
      description: slide.description?.trim() || undefined,
      id: String(slide.id ?? `manual-${index + 1}`),
      image: media
        ? {
            ...media,
            position: resolveFeaturedHighlightImagePosition(slide.imagePosition, 'item'),
          }
        : undefined,
      title,
    }]
  })
}
```

Use the Payload array row ID when available and `manual-${index + 1}` otherwise. The resolved action
is included only when the shared resolver produced both a destination and label.

- [ ] **Step 5: Run the focused adapter test**

Run the command from Step 2.

Expected: PASS, including automatic and manual mapping, optional-value omission, image position, and overlay defaults.

- [ ] **Step 6: Run TypeScript before changing consumers**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS because the new interfaces are additive and not yet used by existing carousel props.

- [ ] **Step 7: Review checkpoint without staging or committing**

Run `git diff --check` for the two new source files and the focused test. Expected: no output.

---

### Task 3: Make production and preview source-aware

**Files:**
- Modify: `src/blocks/NewsEventsHighlights/Component.tsx`
- Modify: `src/blocks/NewsEventsHighlights/PreviewComponent.tsx`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

**Interfaces:**
- Consumes: Task 1 block fields and Task 2 adapters/types.
- Consumes: `normalizeFeaturedHighlightsContentSource(value): 'automatic' | 'manual'` from Task 2.
- Produces: `NewsEventsHighlightsBlockPresentation` receiving `FeaturedHighlightItem[]` and passing all theme controls through.
- Preserves: `getNewsEventsPreviewItemCounts(layout): number[]`, with Manual blocks excluded and legacy blocks included.

- [ ] **Step 1: Write failing source-selection and preview-count tests**

Add `vi` to the Vitest import and define the loader mock before importing the block components:

```tsx
const { getNewsEventsHighlightsMock } = vi.hoisted(() => ({
  getNewsEventsHighlightsMock: vi.fn(),
}))

vi.mock('@/lib/newsEvents', () => ({
  getNewsEventsHighlights: getNewsEventsHighlightsMock,
}))
```

Import `NewsEventsHighlightsBlockComponent` and `NewsEventsHighlightsPreviewBlockComponent`, then
add these source-selection tests:

```tsx
it('does not query News & Events for manual entries', async () => {
  getNewsEventsHighlightsMock.mockClear()
  const node = await NewsEventsHighlightsBlockComponent({
    contentSource: 'manual',
    manualSlides: [{ id: 'manual-1', title: 'Manual highlight' }],
  })
  const markup = renderToStaticMarkup(node)

  expect(getNewsEventsHighlightsMock).not.toHaveBeenCalled()
  expect(markup).toContain('Manual highlight')
})

it('keeps legacy blocks automatic and queries the normalized count', async () => {
  getNewsEventsHighlightsMock.mockResolvedValue([automaticEntry])
  const node = await NewsEventsHighlightsBlockComponent({ itemCount: 5 })
  const markup = renderToStaticMarkup(node)

  expect(getNewsEventsHighlightsMock).toHaveBeenCalledWith(5, expect.any(String))
  expect(markup).toContain('Public story')
})

expect(getNewsEventsPreviewItemCounts([
  { blockType: 'newsEventsHighlights', contentSource: 'manual', itemCount: 6 },
  { blockType: 'newsEventsHighlights', contentSource: 'automatic', itemCount: 5 },
  { blockType: 'newsEventsHighlights', itemCount: 4 },
] as never)).toEqual([4, 5])
```

Add a preview test using an empty snapshot and Manual props; it must contain the manual title. Add
an Automatic preview test confirming it still reads `snapshot.highlightsByCount`.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because production always calls the loader, preview always reads the snapshot, and Manual counts are still included.

- [ ] **Step 3: Gate the production query by source**

In `Component.tsx`, resolve unknown/missing values to Automatic. For Manual mode, call
`toManualFeaturedHighlightItems(props.manualSlides)` and do not construct `nowISO` or call
`getNewsEventsHighlights`. For Automatic mode, retain the current count normalization and catch-to-empty behavior, then adapt the returned records.

- [ ] **Step 4: Gate the preview snapshot and render Manual data directly**

In `PreviewComponent.tsx`, use Manual rows directly when selected. Otherwise retain the normalized
count lookup and adapt `snapshot.highlightsByCount[String(itemCount)] ?? []`.

Update `getNewsEventsPreviewItemCounts`:

```ts
if (block.blockType === 'newsEventsHighlights' && block.contentSource !== 'manual') {
  counts.add(normalizeHighlightsItemCount(block.itemCount))
}
```

This intentionally includes legacy blocks with `contentSource === undefined`.

- [ ] **Step 5: Pass the new source and theme fields through Presentation**

Expand `NewsEventsHighlightsBlockLike` with generated-compatible optional fields. Change
`NewsEventsHighlightsBlockPresentationProps.items` to `FeaturedHighlightItem[]`. Pass
`imagePositionOverride`, `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage` to
`NewsEventsFeaturedCarousel` without resolving visual classes in the server block.

- [ ] **Step 6: Run focused source and preview tests**

Run the command from Step 2.

Expected: PASS. Manual output is present with no automatic loader call; legacy output remains automatic; Manual blocks do not increase preview snapshot queries.

- [ ] **Step 7: Run preview boundary contracts**

Run:

```bash
pnpm exec vitest run tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS; the preview renderer remains synchronous and imports no server-only loader through `PreviewComponent.tsx`.

- [ ] **Step 8: Review checkpoint without staging or committing**

Run `git diff --check` for the four source files and focused test. Expected: no output.

---

### Task 4: Refactor the carousel to generic optional content and configurable media

**Files:**
- Modify: `src/components/news-events/NewsEventsFeaturedCarousel.tsx`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`

**Interfaces:**
- Consumes: `FeaturedHighlightItem`, `FeaturedHighlightImagePositionOverride`, and overlay option types from Task 2.
- Produces: carousel props for `imagePositionOverride`, `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage`.
- Preserves: current `data-news-events-*` markers, accessibility names, feature/rail dimensions, and selection/autoplay behavior.

- [ ] **Step 1: Convert the test fixture to generic items and add optional-content cases**

Replace the test helper's return type with `FeaturedHighlightItem` and build automatic-style data:

```tsx
const item = (id: string): FeaturedHighlightItem => ({
  action: { href: `/news-events/${id}`, label: 'Read more' },
  badge: { label: 'News', variant: 'default' },
  dateISO: '2026-08-20T09:00:00.000Z',
  dateLabel: 'Aug 20, 2026',
  description: `${id} excerpt`,
  id,
  image: { alt: `${id} image`, position: 'center', src: `/media/${id}.jpg` },
  title: `${id} title`,
})
```

Add tests that render a manual item containing only `id` and `title`, then assert there is no badge,
calendar icon/date text, card-description paragraph, or `data-content-link`. Add a second test with
an optional manual action and `openInNewTab: true`, asserting label, href, target, and rel.

- [ ] **Step 2: Add failing overlay and image override assertions**

Render with:

```tsx
<NewsEventsFeaturedCarouselClient
  autoplay={false}
  imagePositionOverride="left"
  items={[{ ...item('one'), image: { ...item('one').image!, position: 'top' } }]}
  overlayCoverage="split"
  overlayDirection="leftToRight"
  overlayStrength="light"
  overlayTone="brand"
/>
```

Assert the image uses the left-position class and the overlay includes the resolved brand/light,
left-to-right, split-frame classes. Also render without these props and assert the existing
Dark/Darker/Bottom-to-Top/Full class set remains.

- [ ] **Step 3: Run the carousel tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the client still requires `PublicNewsEventCard`, always renders classification/date/link metadata, and hardcodes the overlay and item image position.

- [ ] **Step 4: Change the server wrapper to generic props**

In `NewsEventsFeaturedCarousel.tsx`, replace `PublicNewsEventCard[]` with
`FeaturedHighlightItem[]`. Add optional media-control props and forward them to the client. Keep
section appearance, header actions, footer actions, empty-state behavior, spacing, and alignment
unchanged.

- [ ] **Step 5: Make the client render optional fields without empty spacing**

In `NewsEventsFeaturedCarouselClient.tsx`:

- Replace the News/Event-specific type and classification/date helpers with `FeaturedHighlightItem`.
- Remove `getDisplayDate` and the module-level hardcoded `featureOverlay`.
- Compute the resolved overlay from Task 2 helpers and `sectionBackground`.
- Render the badge/date row only when at least one value exists.
- Render the date as `<time dateTime={item.dateISO}>` when `dateLabel` exists.
- Render rail and feature descriptions only when `item.description` is non-empty.
- Render `ContentLink` only when `item.action` exists, forwarding `openInNewTab`.
- Apply `resolveFeaturedHighlightImagePosition(activeItem.image?.position, imagePositionOverride)`;
  force `center` when the fallback image is active.
- Keep the default image URL, failure tracking, all layout classes, controls, ARIA labels, and six-second timer unchanged.

- [ ] **Step 6: Keep optional rail metadata compact**

Within `RailCard`, use conditional fragments rather than empty wrappers:

```tsx
const hasMetadata = Boolean(item.badge || item.dateLabel)

{hasMetadata ? <div className="flex flex-wrap items-center justify-between gap-2">...</div> : null}
<CardTitle className="line-clamp-1 text-xl leading-snug font-semibold">{item.title}</CardTitle>
{item.description ? <CardContent ...><p ...>{item.description}</p></CardContent> : null}
```

Preserve `justify-center`, equal heights, padding, `line-clamp-1`, `line-clamp-2`, and tokenized
`text-xl`/`text-base` classes.

- [ ] **Step 7: Run carousel and presentation tests**

Run the command from Step 3.

Expected: PASS for existing layout/fallback/autoplay tests plus optional manual fields, custom action,
overlay controls, image override, and legacy defaults.

- [ ] **Step 8: Run theme and spacing regression tests**

Run:

```bash
pnpm exec vitest run tests/int/block-surface-semantics.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS; no hardcoded non-semantic surface or spacing regression.

- [ ] **Step 9: Review checkpoint without staging or committing**

Run `git diff --check` for both carousel files and both focused tests. Expected: no output.

---

### Task 5: Update thumbnails, operator docs, and maintained project knowledge

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Generate: `public/block-thumbnails/news-events-highlights.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Generate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: final generic `FeaturedHighlightItem` props and the `Featured Highlights Carousel` label.
- Produces: picker metadata, production-component fixture, regenerated image, editor guide, and current project inventory.

- [ ] **Step 1: Write the failing thumbnail label assertion**

Update the `newsEventsHighlights` assertion in `tests/int/block-thumbnails.int.spec.ts`:

```ts
expect(getBlockThumbnailDefinition('newsEventsHighlights')).toMatchObject({
  alt: 'Featured Highlights Carousel block preview',
  filename: 'news-events-highlights.jpg',
  label: 'Featured Highlights Carousel',
  slug: 'newsEventsHighlights',
})
```

- [ ] **Step 2: Run the thumbnail contract and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because the definition still uses the old label and alt text.

- [ ] **Step 3: Update the definition and production fixture**

Change only the Highlights definition label and alt text. Convert fixture items from
`PublicNewsEventCard` shape to `FeaturedHighlightItem` shape: `description` replaces `excerpt`,
`badge` replaces `contentType`, and `action` replaces `href`/implicit `Read more`. Pass explicit
Dark/Darker/Bottom-to-Top/Full controls so the fixture demonstrates the legacy default appearance.

- [ ] **Step 4: Run thumbnail and fixture contracts**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 5: Regenerate the block thumbnails**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: exit 0 and a refreshed `public/block-thumbnails/news-events-highlights.jpg`. Inspect
`git status --short -- public/block-thumbnails`; restore generator churn for unrelated thumbnails
while preserving pre-existing user changes and the intended Highlights thumbnail.

- [ ] **Step 6: Visually inspect the regenerated Highlights thumbnail**

Open `public/block-thumbnails/news-events-highlights.jpg` with the local image viewer. Confirm the
feature/rail composition, theme, overlay readability, image crop, and three-card height remain
aligned with the current block.

- [ ] **Step 7: Update maintained documentation**

In `docs/guides/blocks.md` and `block-system.md`, replace the automatic-only statement with the
two-source contract. Document:

- Admin label and unchanged slug.
- Automatic legacy default and collection query behavior.
- One-to-six ordered Manual slides and optional metadata/image/action fields.
- Empty State for both modes and Number of Items only for Automatic.
- Per-item image position versus block override precedence.
- Dark/Darker/Bottom-to-Top/Full legacy defaults.
- Shared layout, responsive rail, fallback image, autoplay, and reduced motion.

- [ ] **Step 8: Refresh project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: inventory update exits 0; check reports `Project context is current.` A stale knowledge-graph hash is an allowed warning under repository policy.

- [ ] **Step 9: Review checkpoint without staging or committing**

Run `git diff --check` for thumbnail metadata/fixture, docs, and project-context files. Expected: no output.

---

### Task 6: Run the complete block change contract

**Files:**
- Verify all files listed above.
- Do not modify unrelated worktree files.

**Interfaces:**
- Consumes: completed Tasks 1–5.
- Produces: a verified, uncommitted implementation ready for user review.

- [ ] **Step 1: Run the focused Highlights suite**

Run:

```bash
pnpm exec vitest run \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-featured-carousel.int.spec.tsx \
  tests/int/news-events-data.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/block-surface-semantics.int.spec.ts \
  tests/int/regular-block-spacing.int.spec.tsx \
  --config ./vitest.config.mts
```

Expected: all selected files and tests PASS.

- [ ] **Step 2: Run registration and renderer contracts**

Run:

```bash
pnpm exec vitest run tests/int/page-blocks.int.spec.ts tests/int/card-block-renderers.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS; `newsEventsHighlights` remains registered for Pages, Reusable Sections, production,
and live preview.

- [ ] **Step 3: Run TypeScript and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits 0. Lint exits 0; report any pre-existing warnings separately and do not
expand scope to unrelated files.

- [ ] **Step 4: Run the final project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` with only the permitted stale knowledge-graph warning, if present.

- [ ] **Step 5: Inspect the final impact map and diff**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git diff --check
git status --short
git diff -- \
  src/blocks/NewsEventsHighlights \
  src/components/news-events/NewsEventsFeaturedCarousel.tsx \
  src/components/news-events/NewsEventsFeaturedCarouselClient.tsx \
  src/components/news-events/featuredHighlightsShared.ts \
  src/lib/newsEventsPreviewShared.ts \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  src/payload-types.ts \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-featured-carousel.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  docs/guides/blocks.md \
  .agents/skills/project-context/references/block-system.md \
  .agents/skills/project-context/references/project-inventory.json
```

Expected: no whitespace errors; only intended feature changes appear in the focused diff. Account for
pre-existing modifications in overlapping files and never overwrite or revert them wholesale.

- [ ] **Step 6: Handoff without commit**

Report source-mode behavior, manual slide fields, media controls, backward compatibility, visual
inspection, test/type/lint results, and project-context status. Explicitly state that no files were
staged or committed.
