# Content Highlights Rule Card Inset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Content Highlights Rule card a consistent horizontal inset so copy never touches an outer edge or responsive column divider.

**Architecture:** Keep the correction inside the existing `divided` presentation branch in the shared Content Highlights component. Apply the standard card inset directly to every divided article so the behavior is independent of header composition, responsive column count, divider mode, and card surface.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Vitest.

## Global Constraints

- Every Rule card uses `px-6 md:px-7`.
- Rule lines remain on card edges and retain their existing responsive selectors.
- Individual Items, Open, and Boxed treatments remain unchanged.
- No Payload fields, saved values, generated types, registrations, or renderer boundaries change.
- Preserve unrelated working-tree changes.

---

### Task 1: Inset every Rule card

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/components/content-highlights.tsx`
- Generated if source inventory changes: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: `ContentHighlightsProps.cardStyle`, `headerLayout`, `itemsLayout`, and the existing responsive `dividedColumnClasses` contract.
- Produces: every article resolved to `cardStyle === 'divided'` includes `px-6 md:px-7` without changing any public TypeScript type.

- [x] **Step 1: Add the failing Split/two-column render contract**

Add this focused test beside the existing Rule treatment tests in `tests/int/content-highlights.int.spec.tsx`:

```tsx
it('insets every Rule card in a Split two-column grid', () => {
  const html = renderToStaticMarkup(
    <ContentHighlights
      headerLayout="split"
      items={[item('One'), item('Two'), item('Three'), item('Four')]}
      itemsLayout="2"
      itemTreatment="ruled"
      ruledDividers="grid"
      title="Highlights"
    />,
  )
  const articleClasses = [...html.matchAll(
    /<article class="([^"]*)"[^>]*data-content-highlight-item="true"/g,
  )].map((match) => match[1] ?? '')

  expect(html).toContain('data-content-highlights-header-layout="split"')
  expect(html).toContain('data-content-highlights-items-layout="2"')
  expect(html).toContain('data-content-highlights-ruled-dividers="grid"')
  expect(html).toContain('md:[&amp;&gt;*:nth-child(2n)]:border-l')
  expect(articleClasses).toHaveLength(4)

  for (const className of articleClasses) {
    expect(className).toContain('border-b px-6 py-8 md:px-7 md:py-10')
  }
})
```

- [x] **Step 2: Run the focused test and verify the failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: the new test fails because inherited-surface Rule cards currently contain `border-b py-8 md:py-10` without horizontal padding.

- [x] **Step 3: Apply the shared Rule-card inset**

In `ContentHighlightItemComponent`, remove the now-unnecessary variable:

```ts
const hasExplicitSurface = surface.value !== 'default'
```

Replace the `cardStyle === 'divided'` branch with:

```ts
: cardStyle === 'divided'
  ? cn(
      'border-b px-6 py-8 md:px-7 md:py-10',
      surface.className,
      surface.divider,
    )
```

Do not change `dividedItemLayoutClasses`, `dividedColumnClasses`, or the Boxed, Individual Items, and Open branches.

- [x] **Step 4: Re-run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: all Content Highlights tests pass, including the four-card inset contract.

- [x] **Step 5: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
git diff --check
```

Expected: every command passes without new errors or warnings.

- [x] **Step 6: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
```

Inspect `.agents/skills/project-context/references/change-impact-map.md`. This is a local spacing correction, so do not alter the maintained architecture narrative unless the generated impact check identifies a changed ownership or behavior contract. Then run:

```bash
pnpm project-context:check
```

Expected: project context is current; a stale optional knowledge graph remains a warning only.

- [x] **Step 7: Review and commit the implementation**

Run:

```bash
git diff -- src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx .agents/skills/project-context/references/project-inventory.json
git status --short
```

Confirm that all divided cards receive the inset, divider selectors are unchanged, and no Payload schema files changed. Then commit:

```bash
git add src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-08-24-content-highlights-rule-card-inset.md
git commit -m "fix(content): inset ruled highlight cards"
```
