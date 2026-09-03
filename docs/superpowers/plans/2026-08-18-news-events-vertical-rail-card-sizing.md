# News & Events Vertical Rail Card Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every desktop vertical-carousel card fill the complete width and height of its allocated slide regardless of content length.

**Architecture:** Preserve the existing carousel structure and make sizing explicit through the vertical `CarouselItem` → button → `RailCard` chain. Keep the horizontal mobile carousel full-width but content-height, and protect both contracts with focused integration assertions.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4 utilities, shadcn Carousel/Button/Card primitives, Vitest, Testing Library.

## Global Constraints

- Keep the existing 36rem desktop rail and three-card viewport.
- Keep the current slide basis, scrolling, selection, autoplay, typography, clamping, and card styling.
- Preserve the horizontal mobile rail's content-driven height.
- Do not change collection loading, carousel configuration, Admin fields, generated Payload types, or unrelated thumbnails.
- Do not stage or commit changes.

---

### Task 1: Enforce the vertical rail sizing chain

**Files:**

- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: `Rail`, `RailCard`, `CarouselItem`, and the existing `data-news-events-carousel-rail-card`/carousel slot attributes.
- Produces: an explicit vertical slide/button/card full-size contract without changing component props or exported APIs.

- [ ] **Step 1: Add failing sparse-content sizing assertions**

Extend the existing minimal-item test in `tests/int/news-events-featured-carousel.int.spec.tsx`, or add a focused test beside it, so the vertical rail is exercised with an item whose optional classification, date, and description are absent:

```tsx
const verticalContent = container.querySelector('[data-news-events-carousel-rail="vertical"]')
const verticalSlide = verticalContent?.querySelector('[data-slot="carousel-item"]')
const verticalButton = verticalSlide?.querySelector('[data-slot="button"]')
const verticalCard = verticalSlide?.querySelector('[data-news-events-carousel-rail-card="true"]')
const horizontalContent = container.querySelector('[data-news-events-carousel-rail="horizontal"]')
const horizontalButton = horizontalContent?.querySelector('[data-slot="button"]')

expect(verticalSlide?.className).toContain('w-full')
expect(verticalButton?.className).toContain('h-full')
expect(verticalButton?.className).toContain('w-full')
expect(verticalCard?.className).toContain('h-full')
expect(verticalCard?.className).toContain('w-full')
expect(horizontalButton?.className).toContain('h-auto')
expect(horizontalButton?.className).toContain('w-full')
```

- [ ] **Step 2: Run the focused test and confirm the missing width contract**

Run:

```bash
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx
```

Expected: FAIL because the current vertical slide and `RailCard` do not explicitly include `w-full`.

- [ ] **Step 3: Make sizing explicit only where required**

Update `RailCard` in `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx` so its root card fills both dimensions:

```tsx
'h-full w-full justify-center gap-0 overflow-hidden rounded-[var(--radius)] ...'
```

Update the vertical `CarouselItem` branch to span the rail width while retaining the existing three-card basis:

```tsx
isVertical ? 'w-full basis-[calc((100%_-_2rem)/3)] pt-0' : 'basis-[88%] sm:basis-[58%]'
```

Keep the button branch explicit:

```tsx
className={cn(
  'w-full touch-manipulation justify-start p-0 whitespace-normal',
  isVertical ? 'h-full' : 'h-auto',
)}
```

The shared `w-full` supplies width for both orientations; only the vertical branch receives forced height.

- [ ] **Step 4: Update the maintained block contract**

In `.agents/skills/project-context/references/block-system.md`, refine the News & Events Highlights paragraph to state:

```markdown
Each vertical slide, button, and card surface spans its complete allocated width and height, so sparse supporting content cannot shrink the visible card.
```

Do not change historical plans or generated Payload types because the schema and data contract are unchanged.

- [ ] **Step 5: Format and run focused verification**

Run:

```bash
pnpm exec prettier --write src/components/news-events/NewsEventsFeaturedCarouselClient.tsx tests/int/news-events-featured-carousel.int.spec.tsx .agents/skills/project-context/references/block-system.md
pnpm exec vitest run tests/int/news-events-featured-carousel.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/news-events/NewsEventsFeaturedCarouselClient.tsx
```

Expected: all carousel tests PASS and the layout detector returns no unexplained findings.

- [ ] **Step 6: Run repository verification and refresh project context**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/news-events/NewsEventsFeaturedCarouselClient.tsx tests/int/news-events-featured-carousel.int.spec.tsx
pnpm exec prettier --check src/components/news-events/NewsEventsFeaturedCarouselClient.tsx tests/int/news-events-featured-carousel.int.spec.tsx .agents/skills/project-context/references/block-system.md
git diff --check
pnpm project-context:update
pnpm project-context:check
```

Expected: TypeScript, ESLint, Prettier, and diff checks PASS; project context is current. The existing stale knowledge-graph commit warning is acceptable. Confirm that no unrelated generated files or thumbnails changed and leave all changes unstaged and uncommitted.
