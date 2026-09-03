# News & Events Highlights Carousel-Only Implementation Plan

> **For agentic workers:** Implement this plan inline and verify each task before continuing. Do not dispatch subagents for this repository session.

**Goal:** Convert News & Events Highlights into an automatic carousel-only block with a branded default image.

**Architecture:** Keep the existing published mixed-entry query as the sole data source. Simplify the block adapter and presentation to one carousel path, remove manual-selection and cards-only code, and let the client render a bundled public fallback asset whenever normalized media is absent.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19, TypeScript, shadcn carousel/card primitives, Vitest, Testing Library.

## Global Constraints

- Do not modify News Grid or News & Events Tabs behavior.
- Do not add a database migration for obsolete block keys.
- Do not commit or stage changes.
- Keep all existing section-level content, appearance, alignment, spacing, action, empty-state, autoplay, responsive, and accessibility behavior.

---

### Task 1: Lock the carousel-only contracts

**Files:**

- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `tests/int/news-events-data.int.spec.ts`

**Interfaces:**

- Consumes: `NewsEventsHighlightsBlock`, `NewsEventsHighlightsBlockPresentation`, `NewsEventsFeaturedCarouselClient`, and `fetchNewsEventsHighlights`.
- Produces: failing contracts for field placement, removed legacy controls, unconditional carousel rendering, and the branded missing-image fallback.

- [ ] Replace legacy layout/manual-selection assertions with checks that `itemCount`, `autoplay`, and `emptyStateMessage` live in Theme Settings and that `layout` and `featuredEntries` do not exist.
- [ ] Replace cards-branch rendering assertions with unconditional featured-carousel assertions.
- [ ] Require the missing-image client state to render `/images/snmih-news-events-default.png` with empty alt text and the normal overlay.
- [ ] Remove the manual carousel resolver test while retaining automatic mixed-query coverage.
- [ ] Run the three focused tests and confirm they fail against the current implementation.

### Task 2: Simplify schema, data, and presentation

**Files:**

- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Modify: `src/blocks/NewsEventsHighlights/Component.tsx`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Modify: `src/lib/newsEvents.ts`
- Delete: `src/components/news-events/NewsEventsHighlights.tsx`

**Interfaces:**

- Consumes: `getNewsEventsHighlights(limit, nowISO)` and `NewsEventsFeaturedCarousel`.
- Produces: one automatic server query and one carousel presentation for every Highlights block.

- [ ] Remove Layout and Featured Entries from Content and move Number of Items, Autoplay, and Empty State Message into Theme Settings.
- [ ] Remove relationship-ID parsing and `getNewsEventsCarouselItems`; always load normalized automatic highlights.
- [ ] Remove layout/manual props and cards imports from the presentation; always return `NewsEventsFeaturedCarousel`.
- [ ] Remove the unreferenced manual resolver and cards-only component.
- [ ] Update spacing/eyebrow contract lists that explicitly enumerate the deleted cards component.

### Task 3: Add and render the default image

**Files:**

- Create: `public/images/snmih-news-events-default.png`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`

**Interfaces:**

- Consumes: an optional `PublicNewsEventCard.image`.
- Produces: an always-present featured image using authored media first and `/images/snmih-news-events-default.png` otherwise.

- [ ] Copy the approved 1672×941 PNG without recompression.
- [ ] Resolve the active image source, alt, and object position; use empty alt text and centered positioning for the fallback.
- [ ] Keep the dark overlay and overlay text contrast for both image sources.
- [ ] Run focused tests and confirm the new contracts pass.

### Task 4: Update generated and maintained contracts

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/news-events-highlights.jpg` if the generated fixture output changes
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` when generated facts change

**Interfaces:**

- Consumes: the final Payload schema and production carousel presentation.
- Produces: current generated types, thumbnail fixture, operator documentation, and project knowledge.

- [ ] Remove the fixture's obsolete `layout` prop and keep it representative of the production carousel.
- [ ] Regenerate Payload types and block thumbnails using repository scripts.
- [ ] Update maintained documentation from optional/curated carousel wording to automatic carousel-only behavior.
- [ ] Run `pnpm project-context:update` and inspect its changes.

### Task 5: Verify and hand off

**Files:**

- Inspect: every changed file from `git diff` and `git diff --cached`.

**Interfaces:**

- Consumes: all completed implementation tasks.
- Produces: evidence that carousel-only schema, rendering, data, assets, documentation, and project context agree.

- [ ] Run focused News & Events tests plus Page block, live-preview, thumbnail, spacing, eyebrow, and theme contracts.
- [ ] Run `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm project-context:check`.
- [ ] Inspect the final diff for accidental News Grid/News & Events Tabs changes introduced by this task, legacy layout/manual references, and staging changes.
- [ ] Report changed behavior, fallback asset, verification results, known unrelated failures, and that no commit was created.
