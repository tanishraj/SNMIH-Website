# News & Events Highlights Responsive Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the supporting story cards visible across responsive widths and make the featured panel exactly as tall as three vertical rail-card slots.

**Architecture:** Preserve the existing single client component and Embla synchronization. Use Tailwind's `md` breakpoint to switch between a phone-width horizontal rail and a tablet/desktop two-column composition, with a shared `36rem` height and one-third vertical slide bases instead of runtime measurement.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn Carousel/Card/Button primitives, Embla Carousel, Vitest, Testing Library.

## Global Constraints

- At 768px and above, the featured story and vertical supporting-card rail stay side-by-side.
- Both columns use a shared fixed height of `36rem`.
- Exactly three equal vertical card slots are visible; additional entries scroll vertically.
- Below 768px, keep the existing full-width featured story and horizontal supporting-card carousel.
- Preserve data loading, autoplay, pause behavior, controls, accessibility, theming, typography, authored media, and the SNMIH fallback image.
- Do not add runtime height measurement or ResizeObserver-based synchronization.
- Do not change Payload schema, News Grid, or News & Events Tabs.
- Do not commit or stage changes.

---

### Task 1: Define the responsive layout contract

**Files:**

- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**

- Consumes: rendered `NewsEventsFeaturedCarouselClient`, existing `data-news-events-carousel-rail`, and new `data-news-events-carousel-layout` hook.
- Produces: a failing test that locks the 768px breakpoint, shared height, three vertical slots, and phone-only horizontal rail.

- [ ] **Step 1: Add the failing responsive contract test**

Add this test inside the existing `NewsEventsFeaturedCarouselClient` suite:

```tsx
it('keeps a three-card side rail visible from tablet widths and matches the feature height', () => {
  const { container } = render(<NewsEventsFeaturedCarouselClient autoplay={false} items={items} />)

  const layout = container.querySelector('[data-news-events-carousel-layout="true"]')
  const feature = container.querySelector('[data-news-events-carousel-feature="true"]')
  const verticalContent = container.querySelector('[data-news-events-carousel-rail="vertical"]')
  const verticalRail = verticalContent?.closest('[data-slot="carousel"]')
  const horizontalContent = container.querySelector('[data-news-events-carousel-rail="horizontal"]')
  const horizontalRail = horizontalContent?.closest('[data-slot="carousel"]')
  const verticalSlides = verticalContent?.querySelectorAll('[data-slot="carousel-item"]') ?? []

  expect(layout?.className).toContain('md:h-[36rem]')
  expect(layout?.className).toContain('md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)]')
  expect(feature?.className).toContain('md:h-full')
  expect(feature?.className).toContain('md:min-h-0')
  expect(verticalRail?.className).toContain('hidden h-[36rem] md:block')
  expect(verticalContent?.className).toContain('h-[36rem]')
  expect(verticalSlides).toHaveLength(3)
  expect(Array.from(verticalSlides).every((slide) => slide.className.includes('basis-1/3'))).toBe(
    true,
  )
  expect(horizontalRail?.className).toContain('md:hidden')
})
```

- [ ] **Step 2: Run the focused test and verify the contract fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the current component uses `lg`, a `34rem` rail, natural-height vertical slides, and no layout data hook.

### Task 2: Implement one shared responsive height

**Files:**

- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Test: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**

- Consumes: `Rail` orientation, existing Embla APIs, active selection, and fixed line clamps.
- Produces: `md` two-column layout, `36rem` shared column height, three equal vertical slides, and a phone-only horizontal rail.

- [ ] **Step 1: Rename the desktop rail API for its expanded responsibility**

Change:

```tsx
const [desktopApi, setDesktopApi] = useState<CarouselApi>()
```

to:

```tsx
const [sideApi, setSideApi] = useState<CarouselApi>()
```

Update the synchronization effect and vertical `Rail` call to use `sideApi` and `setSideApi`. Keep the mobile API unchanged.

- [ ] **Step 2: Make every vertical rail slide one-third height**

Resolve orientation-specific classes before returning `Rail`:

```tsx
const isVertical = orientation === 'vertical'
```

Use:

```tsx
<CarouselContent
  className={isVertical ? 'h-[36rem]' : undefined}
  data-news-events-carousel-rail={orientation}
>
```

Set vertical items and buttons to:

```tsx
<CarouselItem
  className={isVertical ? 'basis-1/3' : 'basis-[88%] sm:basis-[58%]'}
  key={`${orientation}-${item.id}`}
>
  <Button
    className={cn(
      'w-full touch-manipulation justify-start p-0 whitespace-normal',
      isVertical ? 'h-full' : 'h-auto',
    )}
  >
```

Keep the existing button semantics and handlers unchanged.

- [ ] **Step 3: Move the side-by-side composition to the tablet breakpoint**

Change the primary grid to:

```tsx
<div
  className="grid gap-6 md:h-[36rem] md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)] lg:gap-8"
  data-news-events-carousel-layout="true"
>
```

Change the featured card height classes to:

```tsx
className =
  'relative isolate min-h-[30rem] gap-0 overflow-hidden rounded-[var(--radius)] bg-card py-0 text-card-foreground shadow-none ring-1 ring-border sm:min-h-[34rem] md:h-full md:min-h-0'
```

Render the vertical and horizontal rails with:

```tsx
<Rail className="hidden h-[36rem] md:block" orientation="vertical" />
<Rail className="mt-5 md:hidden" orientation="horizontal" />
```

Preserve all other `Rail` props.

- [ ] **Step 4: Run the focused interaction and responsive tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS for responsive structure, selection, wraparound, autoplay pausing, reduced motion, classification labels, and both image-fallback paths.

### Task 3: Verify the responsive composition and repository contracts

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Inspect: `public/block-thumbnails/news-events-highlights.jpg`
- Inspect: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Inspect: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**

- Consumes: the final responsive component and production block-thumbnail fixture.
- Produces: visual evidence across desktop, tablet, and phone plus current project knowledge.

- [ ] **Step 1: Generate or open the production block fixture once**

Use the existing development thumbnail preview for `newsEventsHighlights`. Inspect these widths in one bounded pass:

```text
1440px: two columns, three complete rail cards, equal column heights
900px: two columns remain visible, no clipped text or horizontal overflow
768px: two columns remain usable at the exact breakpoint
390px: one-column feature plus visible horizontal cards below
```

Expected: no hidden supporting content, no vertical card clipping, and no side-by-side phone squeeze.

- [ ] **Step 2: Apply at most one bounded visual correction batch**

If the inspection exposes clipping or overflow, correct only the approved structural classes in `NewsEventsFeaturedCarouselClient.tsx` while retaining these final contracts:

```tsx
const responsiveLayoutClasses =
  'grid gap-6 md:h-[36rem] md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)] lg:gap-8'
const verticalRailClasses = 'hidden h-[36rem] md:block'
const horizontalRailClasses = 'mt-5 md:hidden'
```

Adjust rail-card padding only if text clips; keep the current two-line title and excerpt clamps. Preserve typography, colors, content, controls, and interaction. Perform at most one confirmation pass.

- [ ] **Step 3: Record the responsive operator contract**

Extend the News & Events Highlights paragraphs in `.agents/skills/project-context/references/block-system.md` and `docs/guides/blocks.md` with:

```markdown
From tablet widths, the featured panel and vertical rail share a 36rem height with three visible
supporting-card slots; phone widths retain the horizontal supporting-card rail below the feature.
```

- [ ] **Step 4: Run focused and adjacent tests**

Run:

```bash
pnpm exec vitest run \
  tests/int/news-events-featured-carousel.int.spec.tsx \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/carousel-blocks.int.spec.tsx \
  tests/int/regular-block-spacing.int.spec.tsx \
  --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 5: Run static and project-context checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm project-context:update
pnpm project-context:check
```

Expected: TypeScript passes; ESLint has no new errors or warnings; project context is current. The known repository GTM lint warning and stale knowledge-graph warning may remain.

- [ ] **Step 6: Audit the final diff without staging or committing**

Run:

```bash
git diff --check
git diff -- src/blocks/NewsGrid src/blocks/NewsEventsTabs
git status --short
```

Expected: no whitespace errors, no new News Grid or News & Events Tabs diff from this task, and no staging or commit operation performed.
