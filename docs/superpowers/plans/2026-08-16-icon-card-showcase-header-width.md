# Icon Card Showcase Header Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Icon Card Showcase Stacked description use the same full `max-w-3xl` section-intro width as Icon Grid.

**Architecture:** Keep the existing shared `contentIntroClasses` wrapper as the single Stacked width boundary. Remove only the nested `max-w-[65ch]` description constraint in Stacked mode; preserve the Split header's independent supporting-column measure and all existing alignment behavior.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, Vitest

## Global Constraints

- Do not change Icon Grid.
- Do not add a new Payload field or dependency.
- Preserve Left, Center, and Right Stacked header positioning.
- Preserve the Split header's `max-w-xl` supporting column and `max-w-[65ch]` description measure.
- Do not stage or commit files.

---

### Task 1: Match the Stacked description width to Icon Grid

**Files:**

- Modify: `src/blocks/IconCardShowcase/Component.tsx`
- Test: `tests/int/icon-card-showcase.int.spec.tsx`
- Refresh: `public/block-thumbnails/icon-card-showcase.jpg`

**Interfaces:**

- Consumes: `contentIntroClasses = 'flex max-w-3xl flex-col gap-4'`
- Produces: A Stacked header whose title and description share the wrapper's `max-w-3xl` width, while Split mode retains its nested description constraint.

- [ ] **Step 1: Add a failing renderer contract test**

Add this test inside the existing `describe('Icon Card Showcase', ...)` block:

```tsx
it('matches Icon Grid description width in Stacked mode without changing Split mode', () => {
  const stacked = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[cards[0]]}
      description="A long supporting description."
      headerLayout="stacked"
      title="What drives us every day"
    />,
  )
  const split = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[cards[0]]}
      description="A long supporting description."
      headerLayout="split"
      title="What drives us every day"
    />,
  )

  expect(stacked).toContain('flex max-w-3xl flex-col gap-4')
  expect(stacked).not.toContain('max-w-[65ch]')
  expect(split).toContain('max-w-[65ch]')
})
```

- [ ] **Step 2: Run the new contract and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/icon-card-showcase.int.spec.tsx -t "matches Icon Grid description width"
```

Expected: FAIL because Stacked mode still emits `max-w-[65ch]`.

- [ ] **Step 3: Remove only the Stacked nested description limit**

Change the Stacked description branch in `ShowcaseHeader` from:

```tsx
<p className={cn(contentSectionDescriptionClasses, 'max-w-[65ch]', textClasses?.secondary)}>
  {description}
</p>
```

to:

```tsx
<p className={cn(contentSectionDescriptionClasses, textClasses?.secondary)}>{description}</p>
```

Do not modify the Split description branch.

- [ ] **Step 4: Run focused and adjacent regressions**

Run:

```bash
pnpm exec vitest run tests/int/icon-card-showcase.int.spec.tsx tests/int/content-style-parity.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconCardShowcase/Component.tsx tests/int/icon-card-showcase.int.spec.tsx
```

Expected: all tests pass; TypeScript and ESLint exit with code 0.

- [ ] **Step 5: Refresh and inspect the thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=iconCardShowcase pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/icon-card-showcase.jpg` shows the centered Stacked description occupying the same bounded intro width as the title, with no overflow.

- [ ] **Step 6: Check formatting and working-tree integrity**

Run:

```bash
pnpm exec prettier --write src/blocks/IconCardShowcase/Component.tsx tests/int/icon-card-showcase.int.spec.tsx
git diff --check
```

Expected: no formatting or whitespace errors. Leave all files unstaged and uncommitted.
