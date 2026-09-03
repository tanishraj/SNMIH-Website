# Review Feed Container Width Implementation Plan

> **For agentic workers:** Execute this plan inline. Do not stage or commit any files.

**Goal:** Make Review Feed content occupy the complete shared website container width.

**Architecture:** Preserve `regularBlockContainerClasses` as the sole width constraint and remove only the nested `max-w-3xl` wrapper restriction. The block's data flow, content hierarchy, appearance, and pagination remain unchanged.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS, Vitest, Testing Library

## Global Constraints

- Keep the shared `max-w-screen-2xl` site container and its standard `px-4` horizontal padding.
- Do not use viewport-width or edge-to-edge positioning.
- Do not change typography, internal spacing, theme behavior, review data, or pagination.
- Keep every change unstaged and uncommitted.

---

### Task 1: Expand Review Feed within the shared site container

**Files:**
- Modify: `tests/int/review-feed.int.spec.tsx`
- Modify: `src/components/review-feed.tsx`

**Interfaces:**
- Consumes: `regularBlockContainerClasses: string` from `src/blocks/shared/blockSpacing.ts`
- Produces: Review Feed markup whose only maximum-width constraint is the shared website container

- [ ] **Step 1: Add a failing width regression assertion**

In the existing `renders the upstream summary and public review cards without the removed row` test, add:

```ts
expect(html).toContain('max-w-screen-2xl')
expect(html).not.toContain('max-w-3xl')
```

- [ ] **Step 2: Run the focused test and verify the regression assertion fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed.int.spec.tsx -t "renders the upstream summary"
```

Expected: FAIL because the current nested content wrapper contains `max-w-3xl`.

- [ ] **Step 3: Remove the nested width constraint**

In `src/components/review-feed.tsx`, replace:

```tsx
<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
```

with:

```tsx
<div className="flex w-full flex-col gap-6">
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed.int.spec.tsx
pnpm exec eslint src/components/review-feed.tsx tests/int/review-feed.int.spec.tsx
pnpm exec prettier --check src/components/review-feed.tsx tests/int/review-feed.int.spec.tsx
git diff --check
git diff --cached --quiet
```

Expected: all Review Feed tests, lint, formatting, and diff checks pass; the cached diff remains empty.

- [ ] **Step 5: Verify responsive container behavior**

Open the Review Feed block preview at desktop and 390px mobile widths. Confirm the section content spans the shared site container, retains `16px` horizontal padding, and does not produce horizontal overflow.
