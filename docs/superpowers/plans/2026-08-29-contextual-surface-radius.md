# Contextual Surface Radius Implementation Plan

> **Status:** Superseded by the repository-wide semantic radius contract. Do not continue this plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace oversized theme-radius treatment on outlined, full-bleed media surfaces with the semantic small radius while preserving the SNMIH Green and SNMIH Blue identities.

**Architecture:** Keep the global radius scale unchanged and apply `rounded-sm` locally only where a bordered or ringed outer surface clips edge-to-edge media. Preserve `rounded-[var(--radius)]` for ordinary standalone cards and borderless media, and preserve square cell geometry in joined tables and grids.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4 semantic utilities, Vitest, Testing Library, Payload CMS project-context tooling.

## Global Constraints

- SNMIH Green keeps `--radius: 0.75rem`; `rounded-sm` therefore renders as 6px.
- SNMIH Blue keeps `--radius: 0`; `rounded-sm` therefore remains square.
- Do not change global radius tokens, semantic colors, typography, spacing, carousel behavior, or content.
- Keep focus rings visible and aligned with the clipped surface.
- Do not change pills, badges, dialogs, controls, borderless media, ordinary text cards, or deliberately expressive cards.
- Do not commit or stage implementation changes unless the user explicitly requests it.

## File Structure

- `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`: small radius for featured and rail cards.
- `src/components/news-events/NewsEventStory.tsx`: small radius for the bordered story image.
- `src/components/ui/card.tsx`: theme-aligned outer radius with no competing hard-coded child radius.
- `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`: conditional radius for image-bearing cards and their focus wrapper.
- `src/blocks/NewsGrid/Presentation.tsx`: conditional radius for the image-bearing feature card.
- `src/blocks/TestimonialSpotlight/Component.tsx`: small radius for outlined joined media; standard radius for filled, unoutlined media.
- The corresponding five integration tests contract those decisions.
- `tests/int/theme-contracts.int.spec.ts`: contracts shared Card ownership of corner clipping.
- `.agents/skills/project-context/references/project-inventory.json` changes only if the required update command finds a real factual delta.

## Explicit Audit Decisions

- **Change:** News & Events featured carousel, story featured image, image-bearing Academic Programme cards, image-bearing News Grid feature cards, and outlined Testimonial Spotlight compositions.
- **Retain standard radius:** NewsEventsTabs, detailed Academic Programme text cards, Download/Fee panels, content-highlight cards, and ordinary standalone cards.
- **Retain borderless treatment:** Student Experience and Tabs Content media; they do not reproduce the border/crop conflict.
- **Retain joined outer-container treatment:** Fee Structure, Program Matrix, Calendar, and other tables/grids.
- **Retain media-owned treatment:** Rich-text images, whose border belongs directly to the image.

---

### Task 1: Correct News & Events media surfaces

**Files:**

- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Modify: `src/components/news-events/NewsEventStory.tsx`

**Interfaces:**

- Consumes: the existing Tailwind radius scale from `src/styles/globals.css`.
- Produces: `rounded-sm` on the featured card, every rail card, and the story image frame.

- [ ] **Step 1: Add failing carousel assertions**

Add after the current feature-height and rail-card assertions:

```tsx
expect(feature?.className).toContain('rounded-sm')
expect(feature?.className).not.toContain('rounded-[var(--radius)]')
expect(feature?.className).toContain('ring-inset')
expect(Array.from(verticalCards).every((card) => card.className.includes('rounded-sm'))).toBe(true)
expect(
  Array.from(verticalCards).every((card) => !card.className.includes('rounded-[var(--radius)]')),
).toBe(true)
```

- [ ] **Step 2: Add a failing story-image assertion**

Add to `renders classification and title over the image...`:

```tsx
const imageFrame = markup.match(/<div[^>]*data-news-event-featured-image="true"[^>]*>/)?.[0]

expect(imageFrame).toContain('rounded-sm')
expect(imageFrame).not.toContain('rounded-[var(--radius)]')
```

- [ ] **Step 3: Verify both tests fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-event-story.int.spec.tsx
```

Expected: FAIL because the target surfaces still use `rounded-[var(--radius)]`.

- [ ] **Step 4: Apply the small structural radius**

Use these exact class fragments while preserving all other classes:

```tsx
// NewsEventsFeaturedCarouselClient.tsx — RailCard
'h-full w-full justify-center gap-0 overflow-hidden rounded-sm bg-card py-0 text-left text-card-foreground shadow-none ring-1 ring-inset transition-colors motion-reduce:transition-none'

// NewsEventsFeaturedCarouselClient.tsx — featured Card
className =
  'relative isolate min-h-[30rem] gap-0 overflow-hidden rounded-sm bg-card py-0 text-card-foreground shadow-none ring-1 ring-inset ring-border sm:min-h-[34rem] md:h-full md:min-h-0'

// NewsEventStory.tsx — featured image owner
;('relative isolate min-h-80 overflow-hidden rounded-sm border border-border bg-muted md:min-h-0')
```

- [ ] **Step 5: Re-run the focused tests**

Run the command from Step 3.

Expected: PASS; selection, autoplay, focus, image fallback, overlay, and story-order contracts remain green.

---

### Task 2: Correct equivalent block-level media surfaces

**Files:**

- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify: `tests/int/news-grid.int.spec.tsx`
- Modify: `tests/int/testimonial-spotlight-render.int.spec.tsx`
- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Modify: `src/blocks/TestimonialSpotlight/Component.tsx`

**Interfaces:**

- Consumes: `programme.image`, `featureImage`, and `resolvedContainerOutline`.
- Produces: conditional small-radius treatment with the standard radius retained outside the target condition.

- [ ] **Step 1: Add a failing Academic Programmes conditional-radius test**

```tsx
it('uses the small structural radius only for cards with full-bleed media', () => {
  const { container } = render(
    <AcademicProgrammesClient
      background="none"
      columns="2"
      contentAlignment="left"
      metadataPosition="flow"
      programmes={[
        {
          ctaLabel: 'Explore MBBS',
          facts: [],
          href: '/programmes/mbbs',
          id: 'mbbs',
          image: { alt: 'Medical students', src: '/media/mbbs.jpg' },
          openInNewTab: false,
          title: 'MBBS',
        },
        {
          ctaLabel: 'Explore MD',
          facts: [],
          href: '/programmes/md',
          id: 'md',
          openInNewTab: false,
          title: 'MD General Medicine',
        },
      ]}
      showFilter={false}
      viewMode="grid"
    />,
  )

  const cards = Array.from(container.querySelectorAll('[data-academic-programme="true"]'))
  const mediaCard = cards.find(
    (card) => card.getAttribute('data-academic-programme-image') === 'true',
  )
  const textCard = cards.find(
    (card) => card.getAttribute('data-academic-programme-image') === 'false',
  )
  const mediaLink = mediaCard?.closest('[data-academic-programme-link="true"]')
  const textLink = textCard?.closest('[data-academic-programme-link="true"]')

  expect(mediaCard?.className).toContain('rounded-sm')
  expect(mediaCard?.className).not.toContain('rounded-[var(--radius)]')
  expect(textCard?.className).toContain('rounded-[var(--radius)]')
  expect(textCard?.className).not.toContain('rounded-sm')
  expect(mediaLink?.className).toContain('rounded-sm')
  expect(mediaLink?.className).not.toContain('rounded-[var(--radius)]')
  expect(textLink?.className).toContain('rounded-[var(--radius)]')
  expect(textLink?.className).not.toContain('rounded-sm')
})
```

- [ ] **Step 2: Add failing News Grid feature assertions**

In `uses a semantic card surface without an image and a decorative image with one`, add:

```tsx
const withoutImageTag = withoutImage.match(/<article[^>]*data-news-grid-feature="true"[^>]*>/)?.[0]
const withImageTag = withImage.match(/<article[^>]*data-news-grid-feature="true"[^>]*>/)?.[0]

expect(withoutImageTag).toContain('rounded-[var(--radius)]')
expect(withoutImageTag).not.toContain('rounded-sm')
expect(withImageTag).toContain('rounded-sm')
expect(withImageTag).not.toContain('rounded-[var(--radius)]')
```

- [ ] **Step 3: Update the failing Testimonial Spotlight contracts**

For outlined semantic surfaces:

```tsx
expect(containerTag).toContain('overflow-hidden')
expect(containerTag).toContain('rounded-sm')
expect(containerTag).not.toContain('rounded-[var(--radius)]')
```

For the existing filled but unoutlined case:

```tsx
expect(containerTag).toContain('overflow-hidden')
expect(containerTag).toContain('rounded-[var(--radius)]')
expect(containerTag).not.toContain('rounded-sm')
```

- [ ] **Step 4: Verify the three tests fail**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes-client.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/testimonial-spotlight-render.int.spec.tsx
```

Expected: FAIL because the media/outlined branches still use the standard radius.

- [ ] **Step 5: Make Academic Programme radii conditional**

```tsx
'group/programme h-full min-w-0 overflow-hidden border',
programme.image ? 'rounded-sm' : 'rounded-[var(--radius)]',
```

Match the optional link wrapper to the card:

```tsx
className={cn(
  'group/button block h-full outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
  programme.image ? 'rounded-sm' : 'rounded-[var(--radius)]',
)}
```

- [ ] **Step 6: Make the News Grid feature radius conditional**

```tsx
'relative isolate flex h-full min-h-[18rem] flex-col justify-end overflow-hidden border border-current/15 p-6 sm:p-7',
featureImage ? 'rounded-sm text-white' : 'rounded-[var(--radius)] bg-card text-card-foreground',
```

- [ ] **Step 7: Make Testimonial Spotlight radius conditional**

```tsx
hasContainerTreatment && 'overflow-hidden',
hasContainerTreatment &&
  (resolvedContainerOutline === 'outline'
    ? 'rounded-sm'
    : 'rounded-[var(--radius)]'),
```

Keep its border and semantic divider expression unchanged.

- [ ] **Step 8: Re-run the three focused tests**

Run the command from Step 4.

Expected: PASS, including existing surface, image, layout, and live-preview contracts.

---

### Task 3: Verify themes, interactions, and project context

**Files:**

- Verify: `src/styles/globals.css`
- Verify: `src/styles/themes/theme-snmih-green.css`
- Verify: `src/styles/themes/theme-snmih-blue.css`
- Verify: `.agents/skills/project-context/references/change-impact-map.md`
- Potential generated update: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: Tasks 1–2.
- Produces: a verified Green/Blue, light/dark presentation with current project knowledge.

- [ ] **Step 1: Run the focused presentation regression set**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-event-story.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts tests/int/theme-contracts.int.spec.ts
```

Expected: PASS with no changed theme-token expectations.

- [ ] **Step 2: Run formatting and static checks**

```bash
pnpm exec prettier --check src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/components/news-events/NewsEventStory.tsx src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx src/blocks/NewsGrid/Presentation.tsx src/blocks/TestimonialSpotlight/Component.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-event-story.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/testimonial-spotlight-render.int.spec.tsx
pnpm lint
```

Expected: Prettier PASS. Lint PASS or report only pre-existing warnings with exact paths.

- [ ] **Step 3: Build the frontend**

```bash
pnpm build
```

Expected: Next.js production build completes without class-generation, TypeScript, or route errors.

- [ ] **Step 4: Perform one bounded browser pass**

Open the existing page that reproduces the reported carousel and inspect desktop and mobile widths in SNMIH Green and SNMIH Blue, switching light/dark mode where available:

```text
Featured card: Green border follows a 6px crop with no image bleed; Blue remains square.
Rail cards: ring remains inset; selected, hover, and keyboard-focus states do not change geometry.
Story/programme/news-grid/testimonial: only outlined full-bleed media uses the smaller corner.
Controls, tabs, badges, ordinary cards, tables, and borderless media: unchanged.
```

Apply any correction as one batch and use at most one confirmation pass.

- [ ] **Step 5: Run the project-context loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: PASS. Keep an inventory diff only if the update reports a real factual change; narrative references should remain current.

- [ ] **Step 6: Inspect the final diff**

```bash
git diff --check
git diff --stat
```

Expected: no whitespace errors, no global token/schema/generated Payload type changes, no unrelated UI edits, and no commits.

---

### Visual Feedback Addendum: Remove nested Card radii

The first browser pass showed that the featured card's outer 6px radius was correct while the shared `Card` primitive still applied `rounded-t-4xl` directly to its first image. That nested radius caused the remaining white corner visible in the reported screenshot.

- [ ] **Step 1: Add a failing shared Card ownership contract**

```ts
const cardSource = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/ui/card.tsx'),
  'utf8',
)

expect(cardSource).toContain('overflow-hidden rounded-[var(--radius)]')
expect(cardSource).not.toContain('rounded-4xl')
expect(cardSource).not.toContain('*:[img:first-child]:rounded-t-4xl')
expect(cardSource).not.toContain('*:[img:last-child]:rounded-b-4xl')
```

- [ ] **Step 2: Let the Card shell own all clipping**

Use `rounded-[var(--radius)]` on the shared card shell. Remove hard-coded `rounded-4xl`, `rounded-t-4xl`, and `rounded-b-4xl` utilities from the shell, direct-image selectors, header, and footer. Keep `overflow-hidden` so media is clipped to the owning shell.

- [ ] **Step 3: Verify all shared Card consumers**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx tests/int/fee-structure.int.spec.tsx
```

Expected: PASS. Browser-computed Green values are `6px` for the feature shell and `0px` for its direct image, with parent overflow clipping the image to the same visible corner.
