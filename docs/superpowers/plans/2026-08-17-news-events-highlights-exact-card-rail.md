# News & Events Highlights Exact Card Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make three equal supporting cards fill the complete News & Events Highlights featured-carousel height, prevent end-card clipping, and align Highlights and tabbed-card typography.

**Architecture:** Keep the existing `NewsEventsFeaturedCarouselClient` and Embla synchronization. Override the shared carousel primitive's vertical offset only inside this block, divide the fixed `36rem` rail into three exact slots separated by two explicit `1rem` gaps, and keep outlines inside the overflow viewport. Apply the approved theme-scale `text-xl`/`text-base` typography through the existing Highlights and News & Events Tabs card components.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn Carousel/Card/Button primitives, Embla Carousel, Vitest, Testing Library.

## Global Constraints

- At widths of 768px and above, the featured panel and vertical rail remain `36rem` tall.
- Three cards plus two `1rem` gaps must fill the rail exactly.
- Highlights titles use the `text-xl` token with semibold weight and a one-line clamp; descriptions retain the `text-base` token, normal weight, and two-line clamp.
- Highlights metadata, title, and description are vertically centered as one group.
- Tabbed-card titles use the `text-xl` token with semibold weight and the existing three-line clamp; descriptions retain the `text-base` token, normal weight, and existing four-line clamp.
- Every supporting card keeps `1.25rem` horizontal/top/bottom padding and a `0.75rem` content separation.
- Below 768px, retain the horizontal supporting-card carousel.
- Preserve collection data, selection, autoplay, pause behavior, reduced-motion handling, controls, fallback media, themes, and section configuration.
- Do not modify the shared carousel primitive, Payload schemas, or News Grid. Limit News & Events Tabs changes to card typography.
- Do not stage or commit changes.

---

### Task 1: Lock the exact rail and card-content contract

**Files:**

- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Test: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**

- Consumes: `NewsEventsFeaturedCarouselClient`, `data-news-events-carousel-rail`, `data-news-events-carousel-rail-card`, and shadcn `data-slot` attributes.
- Produces: failing rendering tests for explicit vertical spacing, exact slide height, full-height cards, inset outlines, vertically centered content, approved typography, and padding.

- [ ] **Step 1: Extend the existing responsive test with the exact geometry and content assertions**

Replace the old one-third-basis assertion and add card-content queries:

```tsx
const verticalCards = verticalContent?.querySelectorAll(
  '[data-news-events-carousel-rail-card="true"]',
) ?? []
const verticalTitles = Array.from(verticalCards).map((card) =>
  card.querySelector('[data-slot="card-title"]'),
)
const verticalDescriptions = Array.from(verticalCards).map((card) =>
  card.querySelector('[data-slot="card-content"] p'),
)

expect(verticalContent?.className).toContain('mt-0')
expect(verticalContent?.className).toContain('h-[36rem]')
expect(verticalContent?.className).toContain('gap-4')
expect(verticalSlides).toHaveLength(3)
expect(
  Array.from(verticalSlides).every(
    (slide) =>
      slide.className.includes('basis-[calc((100%_-_2rem)/3)]') &&
      slide.className.includes('pt-0'),
  ),
).toBe(true)
expect(verticalCards).toHaveLength(3)
expect(Array.from(verticalCards).every((card) => card.className.includes('h-full'))).toBe(true)
expect(Array.from(verticalCards).every((card) => card.className.includes('justify-center'))).toBe(
  true,
)
expect(Array.from(verticalCards).every((card) => card.className.includes('ring-inset'))).toBe(true)
expect(Array.from(verticalCards).every((card) => card.className.includes('overflow-hidden'))).toBe(
  true,
)
expect(verticalTitles.every((title) => title?.className.includes('line-clamp-1'))).toBe(true)
expect(verticalTitles.every((title) => title?.className.includes('text-xl'))).toBe(true)
expect(verticalTitles.every((title) => title?.className.includes('font-semibold'))).toBe(true)
expect(
  verticalDescriptions.every((description) => description?.className.includes('line-clamp-2')),
).toBe(true)
expect(verticalDescriptions.every((description) => description?.className.includes('text-base'))).toBe(
  true,
)
expect(
  verticalDescriptions.every((description) => description?.className.includes('font-normal')),
).toBe(true)
expect(
  Array.from(verticalCards).every((card) => {
    const header = card.querySelector('[data-slot="card-header"]')
    const content = card.querySelector('[data-slot="card-content"]')

    return (
      header?.className.includes('px-5') &&
      header.className.includes('pt-5') &&
      content?.className.includes('px-5') &&
      content.className.includes('pt-3') &&
      content.className.includes('pb-5')
    )
  }),
).toBe(true)
```

- [ ] **Step 2: Run the focused test and confirm it fails for the old geometry**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the cards do not yet use inset outlines, vertical centering, or the approved `text-xl` title token.

- [ ] **Step 3: Add the five-item end-card regression test**

Add this test to the same suite:

```tsx
it('keeps the final outline inside the viewport when five stories are selected', () => {
  const fiveItems = [
    ...items,
    item('holiday-1', 'holiday'),
    item('other-1', 'other'),
  ]
  const { container } = render(
    <NewsEventsFeaturedCarouselClient autoplay={false} items={fiveItems} />,
  )

  fireEvent.click(screen.getAllByRole('button', { name: `Show ${fiveItems[4].title}` })[0])

  expect(screen.getByText('5 of 5')).toBeTruthy()
  const verticalContent = container.querySelector('[data-news-events-carousel-rail="vertical"]')
  const railCards =
    verticalContent?.querySelectorAll('[data-news-events-carousel-rail-card="true"]') ?? []
  expect(railCards).toHaveLength(5)
  expect(Array.from(railCards).every((card) => card.className.includes('ring-inset'))).toBe(true)
})
```

- [ ] **Step 4: Add the tabbed-card typography regression test**

Add this test to `tests/int/news-events-tabs.int.spec.tsx`:

```tsx
it('uses the shared card title and description typography', () => {
  const { container } = render(<NewsEventsTabsClient {...baseClientProps} />)
  const card = container.querySelector('[data-news-events-tabs-card="true"]')
  const title = card?.querySelector('h3')
  const content = card?.querySelector('[data-slot="card-content"]')
  const description = content?.querySelector('p')

  expect(title?.className).toContain('text-xl')
  expect(title?.className).toContain('font-semibold')
  expect(title?.className).toContain('line-clamp-3')
  expect(title?.className).not.toContain('text-lg')
  expect(content?.className).toContain('text-base')
  expect(content?.className).toContain('font-normal')
  expect(description?.className).toContain('line-clamp-4')
})
```

- [ ] **Step 5: Run both focused tests and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because both card components still use `text-lg` titles instead of the approved `text-xl` token.

### Task 2: Implement exact three-card sizing and content clamps

**Files:**

- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Test: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**

- Consumes: existing `Rail` orientation, the fixed `36rem` layout height, shadcn carousel class merging, and `RailCard` rendering.
- Produces: exactly three equal vertical card surfaces plus two explicit gaps, with visible end outlines, centered content, stable text, and consistent padding.

- [ ] **Step 1: Apply the card overflow and title clamp contract**

Change `RailCard` to use:

```tsx
<Card
  className={cn(
    'h-full justify-center gap-0 overflow-hidden rounded-[var(--radius)] bg-card py-0 text-left text-card-foreground shadow-none ring-1 ring-inset transition-colors motion-reduce:transition-none',
    active ? 'ring-primary' : 'ring-border hover:bg-muted/50',
  )}
  data-news-events-carousel-rail-card="true"
>
  <CardHeader className="gap-3 rounded-none px-5 pt-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Badge variant={getNewsEventClassificationBadgeVariant(item.contentType)}>
        {getNewsEventClassificationLabel(item.contentType)}
      </Badge>
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays aria-hidden="true" className="size-3.5" />
        {getDisplayDate(item)}
      </span>
    </div>
    <CardTitle className="line-clamp-1 text-xl leading-snug font-semibold">
      {item.title}
    </CardTitle>
  </CardHeader>
  <CardContent className="px-5 pt-3 pb-5">
    <p className="line-clamp-2 text-base font-normal leading-6 text-muted-foreground">
      {item.excerpt}
    </p>
  </CardContent>
</Card>
```

- [ ] **Step 2: Replace implicit vertical padding with an explicit gap and exact slide basis**

Update the orientation-specific carousel classes:

```tsx
<CarouselContent
  className={isVertical ? 'mt-0 h-[36rem] gap-4' : undefined}
  data-news-events-carousel-rail={orientation}
>
  {items.map((item, index) => (
    <CarouselItem
      className={
        isVertical
          ? 'basis-[calc((100%_-_2rem)/3)] pt-0'
          : 'basis-[88%] sm:basis-[58%]'
      }
      key={`${orientation}-${item.id}`}
    >
```

The existing full-height vertical button remains unchanged.

- [ ] **Step 3: Run the focused tests and confirm the contract passes**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS for geometry, text clamps, padding, selection, wraparound, autoplay pausing, reduced motion, classifications, and image fallback.

### Task 3: Align News & Events Tabs card typography

**Files:**

- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: the existing text-only tabbed card layout and clamps.
- Produces: `text-xl` semibold titles and unchanged `text-base` normal descriptions without changing the card layout or content limits.

- [ ] **Step 1: Apply the approved title and description classes**

Use these exact classes while leaving the surrounding card markup unchanged:

```tsx
<h3 className="line-clamp-3 font-sans text-xl font-semibold leading-snug tracking-tight text-foreground">
  {item.title}
</h3>

<CardContent className="px-6 pt-4 text-base font-normal leading-6 text-muted-foreground sm:px-7">
  <p className="line-clamp-4">{item.excerpt.trim()}</p>
</CardContent>
```

- [ ] **Step 2: Run the Highlights and tabbed-card tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS for both card typography contracts and all existing interaction behavior.

### Task 4: Record and verify the final UI contract

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Inspect: `public/block-thumbnails/news-events-highlights.jpg`
- Inspect: `public/block-thumbnails/news-events-tabs.jpg`
- Inspect: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Inspect: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**

- Consumes: the implemented carousel and production block-thumbnail fixture.
- Produces: current operator documentation, visual confirmation, and verified repository knowledge.

- [ ] **Step 1: Update the maintained Highlights behavior sentence**

Use this exact contract in both maintained references:

```markdown
From tablet widths, the featured panel and vertical rail share a 36rem height. Three equal supporting
cards, separated by consistent gaps, fill that height; card titles use one line and descriptions use
two lines. Highlights and tabbed cards use `text-xl` semibold titles and retain `text-base` normal
descriptions. Phone
widths retain the horizontal supporting-card rail below the feature.
```

- [ ] **Step 2: Regenerate and inspect the production Highlights thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Keep only the intended `public/block-thumbnails/news-events-highlights.jpg` and `public/block-thumbnails/news-events-tabs.jpg` changes from this command. Inspect them at full size. Confirm the Highlights first card aligns with the featured panel's top, the third aligns with its bottom, all cards have equal height, and the end-card outlines remain visible. Confirm both block previews use the approved title and description hierarchy.

- [ ] **Step 3: Run focused and adjacent block tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/carousel-blocks.int.spec.tsx tests/int/regular-block-spacing.int.spec.tsx --config ./vitest.config.mts
```

Expected: PASS.

- [ ] **Step 4: Run static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript passes. Lint has no new errors or warnings attributable to this change.

- [ ] **Step 5: Complete the project-context update and check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; a stale knowledge-graph notice is acceptable if reported separately.

- [ ] **Step 6: Audit the final diff without staging or committing**

Run:

```bash
git diff -- src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md public/block-thumbnails/news-events-highlights.jpg public/block-thumbnails/news-events-tabs.jpg
git status --short
```

Expected: the implementation is limited to the approved Highlights card-rail contract, News & Events Tabs typography, and maintained documentation; no staging or commit operation occurs.
