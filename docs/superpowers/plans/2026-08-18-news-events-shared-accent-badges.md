# News & Events Shared Accent Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply one consistent soft-bluish accent badge treatment to every News & Events classification.

**Architecture:** Keep the existing shared `NewsEventClassificationBadge` component and normalization contract. Replace its neutral transparent classes with the theme's semantic accent pair, then remove the feature-image override so cards, rails, tabs, and image overlays render exactly the same badge.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vitest, Testing Library.

## Global Constraints

- Every classification uses `border-border bg-accent text-accent-foreground`.
- No category-specific color mapping or custom classification CSS is introduced.
- The same badge treatment is used on cards, carousel rails, tabbed cards, and feature images.
- Classification labels and `data-news-event-classification` remain unchanged.
- Date metadata, collection data, layout, filtering, pagination, and carousel behavior remain unchanged.
- Do not stage or commit any changes.

---

### Task 1: Apply the Shared Bluish Accent Badge

**Files:**

- Modify: `tests/int/news-events-classification-metadata.int.spec.tsx`
- Modify: `tests/int/news-events-featured-carousel.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventClassificationBadge.tsx`
- Modify: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`

**Interfaces:**

- Preserves: `NewsEventClassificationBadge({ classification, className?, ...badgeProps })`
- Preserves: `data-news-event-classification` and normalized labels.
- Produces: one semantic accent presentation shared by every consumer.

- [ ] **Step 1: Change focused tests to require the shared accent classes**

In `tests/int/news-events-classification-metadata.int.spec.tsx`, remove the unused `readFileSync` import and replace the neutral-outline assertions with:

```tsx
it('renders every classification with the same semantic accent treatment', () => {
  const markup = NEWS_EVENT_CLASSIFICATIONS.map(({ value }) =>
    renderToStaticMarkup(<NewsEventClassificationBadge classification={value} />),
  )

  NEWS_EVENT_CLASSIFICATIONS.forEach(({ label, value }, index) => {
    expect(markup[index]).toContain(`data-news-event-classification="${value}"`)
    expect(markup[index]).toContain(label)
    expect(markup[index]).toContain('border-border')
    expect(markup[index]).toContain('bg-accent')
    expect(markup[index]).toContain('text-accent-foreground')
    expect(markup[index]).not.toContain('bg-transparent')
  })
})
```

In `tests/int/news-events-featured-carousel.int.spec.tsx`, replace the feature/rail outline assertions with:

```ts
expect(featureBadge?.className).toContain('border-border')
expect(featureBadge?.className).toContain('bg-accent')
expect(featureBadge?.className).toContain('text-accent-foreground')
expect(Array.from(railBadges).every((badge) => badge.className.includes('border-border'))).toBe(
  true,
)
expect(Array.from(railBadges).every((badge) => badge.className.includes('bg-accent'))).toBe(true)
expect(
  Array.from(railBadges).every((badge) => badge.className.includes('text-accent-foreground')),
).toBe(true)
```

- [ ] **Step 2: Run the two focused tests and confirm the neutral implementation fails**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx
```

Expected: FAIL because the shared badge still uses `bg-transparent text-foreground` and the feature image still applies an outline override.

- [ ] **Step 3: Apply semantic accent classes in the shared badge**

Update `src/components/news-events/NewsEventClassificationBadge.tsx`:

```tsx
<Badge
  className={cn('border-border bg-accent text-accent-foreground', className)}
  data-news-event-classification={resolvedClassification}
  variant="outline"
  {...props}
>
  {getNewsEventClassificationLabel(resolvedClassification)}
</Badge>
```

- [ ] **Step 4: Remove the feature-image badge override**

Update the feature-image instance in `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx` to use the same defaults as every other consumer:

```tsx
<NewsEventClassificationBadge classification={activeItem.classification} />
```

Do not change the feature date's overlay-aware classes.

- [ ] **Step 5: Run all affected presentation tests**

Run:

```bash
pnpm exec vitest run tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 6: Run type, lint, formatting, and diff verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx
pnpm exec prettier --check src/components/news-events/NewsEventClassificationBadge.tsx src/components/news-events/NewsEventsFeaturedCarouselClient.tsx tests/int/news-events-classification-metadata.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx docs/superpowers/specs/2026-08-18-news-events-classification-metadata-design.md docs/superpowers/plans/2026-08-18-news-events-shared-accent-badges.md
git diff --check
```

Expected: all commands pass.

- [ ] **Step 7: Refresh project context and review scope**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git status --short
```

Expected: project context is current, with only the existing stale knowledge-graph warning if unchanged. Confirm no files were staged or committed.
