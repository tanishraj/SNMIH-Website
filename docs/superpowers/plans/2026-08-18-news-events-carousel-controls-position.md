# News & Events Carousel Controls Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors place the News & Events Highlights status/navigation row above or below its carousel while preserving bottom placement for existing blocks.

**Architecture:** Add one required Payload select field and carry its value through the existing shared production/live-preview presentation path. Normalize the value at the client carousel boundary and render one shared controls-row element before or after the carousel content, avoiding duplicated controls and preserving all current carousel behavior.

**Tech Stack:** Payload CMS block fields and generated types, React 19, Next.js, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- `carouselControlsPosition` supports exactly `top` and `bottom`.
- `bottom` is the schema default and the runtime fallback for missing or invalid legacy values.
- The setting moves only the status and previous/next controls row.
- Production, live preview, and thumbnail presentation continue using the same shared block presentation path.
- Do not change News & Events queries, autoplay timing, item selection, image presentation, section content, supporting rails, or footer actions.
- Do not add dependencies.
- Do not stage or commit changes.

---

### Task 1: Add the Payload field and generated type contract

**Files:**

- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Produces: `carouselControlsPosition: 'top' | 'bottom'` on `NewsEventsHighlightsBlock`.
- Consumes: the existing `Theme Settings` tab and Payload `SelectField` configuration.

- [ ] **Step 1: Add the failing schema assertion**

Add this assertion beside the existing `autoplay` assertion in the first Highlights test:

```tsx
const carouselControlsPosition = findNamedField(themeFields, 'carouselControlsPosition')
expect(carouselControlsPosition).toMatchObject({
  defaultValue: 'bottom',
  label: 'Carousel Controls Position',
  required: true,
  type: 'select',
})
expect(carouselControlsPosition?.options).toEqual([
  { label: 'Bottom', value: 'bottom' },
  { label: 'Top', value: 'top' },
])
```

- [ ] **Step 2: Run the focused schema test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx
```

Expected: FAIL because `carouselControlsPosition` is not defined.

- [ ] **Step 3: Add the required Theme Settings select field**

Add the field immediately after `autoplay` in `src/blocks/NewsEventsHighlights/config.ts`:

```ts
{
  name: 'carouselControlsPosition',
  label: 'Carousel Controls Position',
  type: 'select',
  defaultValue: 'bottom',
  options: [
    { label: 'Bottom', value: 'bottom' },
    { label: 'Top', value: 'top' },
  ],
  required: true,
} satisfies SelectField,
```

- [ ] **Step 4: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains:

```ts
carouselControlsPosition: 'bottom' | 'top'
```

Do not run the import-map or thumbnail generators because this change adds no Admin component and does not alter thumbnail artwork.

- [ ] **Step 5: Run the schema test and verify it passes**

Run:

```bash
pnpm exec vitest run tests/int/news-events-highlights.int.spec.tsx
```

Expected: PASS.

---

### Task 2: Normalize and render the controls in the configured position

**Files:**

- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `src/components/news-events/featuredHighlightsShared.ts`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Modify: `src/components/news-events/NewsEventsFeaturedCarousel.tsx`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Modify: `src/block-thumbnails/fixtures.tsx`

**Interfaces:**

- Produces: `FeaturedHighlightsControlsPosition` and `normalizeFeaturedHighlightsControlsPosition(value)` in `featuredHighlightsShared.ts`.
- Consumes: `NewsEventsHighlightsBlockLike.carouselControlsPosition` from Task 1.
- Preserves: one status/navigation row, current button labels, live status, autoplay pausing, wrapping selection, and responsive rail layout.

- [ ] **Step 1: Add failing position and fallback tests**

In `tests/int/news-events-featured-carousel.int.spec.tsx`, add a helper that reads the direct shell children:

```tsx
function getCarouselChildOrder(container: HTMLElement) {
  const shell = container.querySelector('[data-news-events-carousel-shell="true"]')
  if (!shell) throw new Error('Expected carousel shell')

  return Array.from(shell.children).map((child) => {
    if (child.hasAttribute('data-news-events-carousel-layout')) return 'layout'
    if (child.hasAttribute('data-news-events-carousel-controls-position')) return 'controls'
    if (child.querySelector('[data-news-events-carousel-rail="horizontal"]')) return 'mobile-rail'
    return 'other'
  })
}
```

Add tests:

```tsx
it('places one controls row above the carousel when configured', () => {
  const { container } = render(
    <NewsEventsFeaturedCarouselClient
      autoplay={false}
      carouselControlsPosition="top"
      items={items}
    />,
  )

  const controls = container.querySelectorAll('[data-news-events-carousel-controls-position="top"]')
  expect(controls).toHaveLength(1)
  expect(getCarouselChildOrder(container).slice(0, 2)).toEqual(['controls', 'layout'])
  expect(controls[0]?.className).toContain('border-b')
  expect(controls[0]?.className).toContain('pb-4')
})

it('defaults missing and invalid controls positions to the bottom', () => {
  const { container, rerender } = render(
    <NewsEventsFeaturedCarouselClient autoplay={false} items={items} />,
  )

  expect(
    container.querySelectorAll('[data-news-events-carousel-controls-position="bottom"]'),
  ).toHaveLength(1)
  expect(getCarouselChildOrder(container).slice(-2)).toEqual(['mobile-rail', 'controls'])

  rerender(
    <NewsEventsFeaturedCarouselClient
      autoplay={false}
      carouselControlsPosition={'side' as never}
      items={items}
    />,
  )

  expect(
    container.querySelectorAll('[data-news-events-carousel-controls-position="bottom"]'),
  ).toHaveLength(1)
  expect(getCarouselChildOrder(container).slice(-2)).toEqual(['mobile-rail', 'controls'])
})
```

- [ ] **Step 2: Run the carousel test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx
```

Expected: FAIL because the client has no position prop or data attribute.

- [ ] **Step 3: Add the shared type and normalizer**

In `src/components/news-events/featuredHighlightsShared.ts`, add:

```ts
export type FeaturedHighlightsControlsPosition = 'bottom' | 'top'

export function normalizeFeaturedHighlightsControlsPosition(
  value: unknown,
): FeaturedHighlightsControlsPosition {
  return value === 'top' ? 'top' : 'bottom'
}
```

- [ ] **Step 4: Add the client prop and one shared controls-row element**

Import the new type and normalizer into `NewsEventsFeaturedCarouselClient.tsx`, then extend its props:

```ts
carouselControlsPosition?: FeaturedHighlightsControlsPosition
```

Resolve it inside the component:

```ts
const resolvedControlsPosition =
  normalizeFeaturedHighlightsControlsPosition(carouselControlsPosition)
```

Move the existing status/navigation markup into one `controlsRow` element after the active-item guard:

```tsx
const controlsRow = (
  <div
    className={cn(
      'flex items-center justify-between gap-4 border-current/15',
      resolvedControlsPosition === 'top' ? 'mb-5 border-b pb-4' : 'mt-5 border-t pt-4',
    )}
    data-news-events-carousel-controls-position={resolvedControlsPosition}
  >
    <p aria-live="polite" className="text-sm tabular-nums text-current/70">
      {resolvedActiveIndex + 1} of {itemCount}
    </p>
    {itemCount > 1 ? (
      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous story"
          onClick={() => selectIndex(resolvedActiveIndex - 1)}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          aria-label="Next story"
          onClick={() => selectIndex(resolvedActiveIndex + 1)}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    ) : null}
  </div>
)
```

Render it exactly once in the shell:

```tsx
{
  resolvedControlsPosition === 'top' ? controlsRow : null
}
{
  /* existing feature/rail layout and mobile rail */
}
{
  resolvedControlsPosition === 'bottom' ? controlsRow : null
}
```

- [ ] **Step 5: Carry the field through the shared presentation path**

Add the optional prop to `NewsEventsFeaturedCarousel`, default it to `bottom`, and pass it to the client:

```tsx
carouselControlsPosition?: FeaturedHighlightsControlsPosition
```

```tsx
<NewsEventsFeaturedCarouselClient
  autoplay={autoplay}
  carouselControlsPosition={carouselControlsPosition}
  imagePositionOverride={imagePositionOverride}
  items={items}
  overlay={overlay}
  sectionBackground={appearanceClasses.background}
/>
```

Add the field to `NewsEventsHighlightsBlockLike`, destructure it in `NewsEventsHighlightsBlockPresentation`, and pass the legacy-safe value:

```tsx
carouselControlsPosition?: FeaturedHighlightsControlsPosition | null
```

```tsx
carouselControlsPosition={carouselControlsPosition ?? 'bottom'}
```

Set `carouselControlsPosition="bottom"` in the `newsEventsHighlights` thumbnail fixture so the fixture records the intended default explicitly.

- [ ] **Step 6: Run the focused behavior tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx
```

Expected: both files PASS; existing selection, autoplay, accessibility, fallback image, overlay, rail sizing, and badge tests remain green.

---

### Task 3: Update operator documentation and verify the complete block contract

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Documents: editor-visible control ownership, bottom compatibility fallback, and unchanged collection-backed behavior.
- Verifies: schema, production presentation, live-preview presentation, thumbnail fixture, generated types, and repository context.

- [ ] **Step 1: Update current operator and architecture references**

Update the News & Events Highlights text in all three Markdown files to state:

```md
Editors can place the carousel status and previous/next controls above or below the carousel. Bottom remains the default and legacy fallback.
```

Keep the existing automatic collection loading, item-count, autoplay, image fallback, and overlay documentation intact.

- [ ] **Step 2: Run focused and cross-surface tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-theme-tabs.int.spec.ts
```

Expected: all selected suites PASS.

- [ ] **Step 3: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/NewsEventsHighlights/config.ts src/blocks/NewsEventsHighlights/Presentation.tsx src/components/news-events/featuredHighlightsShared.ts src/components/news-events/NewsEventsFeaturedCarousel.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/block-thumbnails/fixtures.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx
pnpm exec prettier --check src/blocks/NewsEventsHighlights/config.ts src/blocks/NewsEventsHighlights/Presentation.tsx src/components/news-events/featuredHighlightsShared.ts src/components/news-events/NewsEventsFeaturedCarousel.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/block-thumbnails/fixtures.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: every command exits successfully.

- [ ] **Step 4: Refresh and verify project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The pre-existing stale knowledge-graph commit warning is acceptable.

- [ ] **Step 5: Review the final scoped diff**

Inspect:

```bash
git diff -- src/blocks/NewsEventsHighlights/config.ts src/blocks/NewsEventsHighlights/Presentation.tsx src/components/news-events/featuredHighlightsShared.ts src/components/news-events/NewsEventsFeaturedCarousel.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/block-thumbnails/fixtures.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx src/payload-types.ts docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Confirm the diff contains one new editor field, one shared runtime control, one controls row rendered in the selected position, generated type updates, focused tests, and current documentation—without unrelated edits, staging, or commits.
