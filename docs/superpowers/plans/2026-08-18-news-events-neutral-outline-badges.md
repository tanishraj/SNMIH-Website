# News & Events Neutral Outline Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the colorful News & Events classification palette with one restrained, surface-aware outline badge treatment everywhere.

**Architecture:** Keep the existing shared `NewsEventClassificationBadge` boundary and classification normalization. Move the neutral card-surface outline into that component, remove all classification-specific CSS, and give the featured-image instance a current-color outline so it remains legible for every overlay tone.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vitest, Testing Library.

## Global Constraints

- Every classification uses a transparent background, one-pixel semantic border, and regular foreground text.
- No classification-specific fill, border color, or text color remains.
- Card and rail badges use `border-border bg-transparent text-foreground`.
- Featured-image badges use a transparent background, the resolved overlay text color, and `border-current/40`.
- Classification labels and `data-news-event-classification` remain unchanged.
- Date metadata behavior and typography remain unchanged.
- Do not alter collection data, filtering, pagination, carousel behavior, or card layout.
- Do not stage or commit any changes.

---

### Task 1: Replace Classification Colors With Neutral Outlines

**Files:**

- Modify: `tests/int/news-events-classification-metadata.int.spec.tsx`
- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventClassificationBadge.tsx`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Modify: `src/styles/custom.css`

**Interfaces:**

- Preserves: `NewsEventClassificationBadge({ classification, className?, ...badgeProps })`
- Preserves: `data-news-event-classification` for semantic and test identification.
- Removes: `--news-event-classification-color` and every classification-specific CSS selector.

- [ ] **Step 1: Replace the colorful-palette assertions with neutral-outline assertions**

In `tests/int/news-events-classification-metadata.int.spec.tsx`, remove the semantic color-token test and assert that every rendered classification shares the same outline classes:

```tsx
it('renders every classification with the same neutral outline treatment', () => {
  const markup = NEWS_EVENT_CLASSIFICATIONS.map(({ value }) =>
    renderToStaticMarkup(<NewsEventClassificationBadge classification={value} />),
  )

  for (const badge of markup) {
    expect(badge).toContain('border-border')
    expect(badge).toContain('bg-transparent')
    expect(badge).toContain('text-foreground')
  }

  const css = readFileSync('src/styles/custom.css', 'utf8')
  expect(css).not.toContain('--news-event-classification-color')
  expect(css).not.toContain("[data-news-event-classification='news']")
})
```

Retain the existing normalization, visible-label, fallback, and date metadata assertions.

In `tests/int/news-events-featured-carousel.int.spec.tsx`, extend the rail/layout test:

```ts
const featureBadge = feature?.querySelector('[data-news-event-classification]')
const railBadges = verticalContent?.querySelectorAll('[data-news-event-classification]') ?? []

expect(featureBadge?.className).toContain('border-current/40')
expect(featureBadge?.className).toContain('bg-transparent')
expect(Array.from(railBadges).every((badge) => badge.className.includes('border-border'))).toBe(
  true,
)
expect(Array.from(railBadges).every((badge) => badge.className.includes('bg-transparent'))).toBe(
  true,
)
```

- [ ] **Step 2: Run the two focused tests and confirm the colorful implementation fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx
```

Expected: FAIL because `custom.css` still contains classification color variables and the featured badge lacks `border-current/40`.

- [ ] **Step 3: Put the neutral card outline in the shared badge component**

Update `src/components/news-events/NewsEventClassificationBadge.tsx`:

```tsx
<Badge
  className={cn('border-border bg-transparent text-foreground', className)}
  data-news-event-classification={resolvedClassification}
  variant="outline"
  {...props}
>
  {getNewsEventClassificationLabel(resolvedClassification)}
</Badge>
```

Remove the `news-event-classification-badge` class because no global classification CSS remains.

- [ ] **Step 4: Make the featured-image badge inherit overlay contrast**

Update only the featured-image instance in `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`:

```tsx
<NewsEventClassificationBadge
  className={cn('border-current/40 bg-transparent', featureOverlay.text.title)}
  classification={activeItem.classification}
/>
```

Rail and tabbed-card instances continue using the shared component defaults.

- [ ] **Step 5: Remove the colorful classification CSS**

Delete the complete News & Events classification section from `src/styles/custom.css`, beginning with:

```css
/* News & Events classifications share one token-driven badge language across
   collection cards, carousel rails, and image overlays. */
```

and ending after the announcement selector. Do not remove or modify unrelated custom styles.

- [ ] **Step 6: Run all affected News & Events presentation tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 7: Run type, lint, formatting, and diff verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx
pnpm exec prettier --check src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx src/styles/custom.css tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx docs/superpowers/specs/2026-08-18-news-events-classification-metadata-design.md docs/superpowers/plans/2026-08-18-news-events-neutral-outline-badges.md
git diff --check
```

Expected: all commands pass.

- [ ] **Step 8: Refresh project context and review scope**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git status --short
```

Expected: project context is current, with only the existing knowledge-graph warning if unchanged. Confirm no files were staged or committed.
