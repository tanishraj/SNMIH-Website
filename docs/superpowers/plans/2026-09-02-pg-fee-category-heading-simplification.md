# PG Fee Category Heading Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display each PG Fee Structure category label unchanged as the statement heading instead of appending `category department fees`.

**Architecture:** Keep the normalized `ResolvedPGFeeCategory.label` as the single source used throughout the atlas. Change only the statement heading interpolation and its focused contract; no Payload field, local type, normalization, migration, or generated type changes are needed.

**Tech Stack:** React 19, Next.js 16, TypeScript, Vitest, Testing Library.

## Global Constraints

- Keep the existing `Statement breakdown` eyebrow.
- Preserve tabs, summary facts, category captions, department chapters, fee values, layout, scrolling, styling, data attributes, and accessibility labels.
- Do not add or remove Payload Admin fields.
- Do not modify `.env`.
- Do not stage or commit changes unless explicitly requested.

---

## File Structure

- `tests/int/pg-fee-structure.int.spec.tsx`: locks the exact category-only statement heading.
- `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx`: renders the atlas statement heading.
- `.agents/skills/project-context/references/block-system.md`: records the exact visible heading contract if its PG Fee Structure narrative requires clarification.
- `.agents/skills/project-context/references/project-inventory.json`: generated repository inventory refreshed by the required context loop.

### Task 1: Render the category label as the complete heading

**Files:**
- Modify: `tests/int/pg-fee-structure.int.spec.tsx`
- Modify: `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx`

**Interfaces:**
- Consumes: `category.label` from `ResolvedPGFeeCategory`.
- Produces: a statement `<h3>` whose complete text is the normalized category label.

- [x] **Step 1: Write the failing rendering contract**

Replace the active-category assertion with:

```tsx
expect(screen.getByRole('heading', { level: 3, name: 'NRI' })).toBeTruthy()
expect(screen.queryByText('NRI category department fees')).toBeNull()
```

- [x] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because the current `<h3>` still renders `NRI category department fees`.

- [x] **Step 3: Implement the direct category heading**

Replace:

```tsx
{category.label} category department fees
```

with:

```tsx
{category.label}
```

- [x] **Step 4: Run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: PASS.

### Task 2: Complete maintained-context and repository verification

**Files:**
- Modify if required: `.agents/skills/project-context/references/block-system.md`
- Modify if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the final category-only heading contract.
- Produces: current maintained project knowledge and a verified uncommitted worktree.

- [x] **Step 1: Clarify the maintained narrative if needed**

If the PG Fee Structure paragraph does not identify the statement heading source, add one sentence stating that the statement heading repeats the active category label unchanged. Do not rewrite historical specs or plans.

- [x] **Step 2: Run static verification**

Run:

```bash
pnpm exec eslint src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx tests/int/pg-fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: both commands exit successfully.

- [x] **Step 3: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
git status --short --branch
```

Expected: project context is current, the diff has no whitespace errors, the branch remains `fix/pg-fee-category-heading`, and no files are staged or committed.
