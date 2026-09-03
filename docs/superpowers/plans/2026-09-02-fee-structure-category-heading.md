# Fee Structure Category Heading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hard-coded `fee heads` suffix from the Fee Structure Programme Cost Atlas statement heading so it displays the authored category label verbatim.

**Architecture:** Keep `category.label` as the single source of category-heading copy. Change only the Atlas presentation boundary, protect it with an integration assertion, and record the presentation contract in maintained Fee Structure documentation; no Payload schema, normalization, type generation, or migration work is needed.

**Tech Stack:** React 19, TypeScript, Payload CMS 3, Vitest, Testing Library

## Global Constraints

- Keep the existing `Statement breakdown` eyebrow unchanged.
- Do not add a Payload field, configurable suffix, fallback copy, or content migration.
- Do not change category tabs, the default table/mobile-card layout, fee-row labels, Atlas styling, or download behavior.
- Preserve all unrelated user changes.
- Do not stage or commit files unless the user explicitly requests it.

---

## File Map

- Modify `tests/int/fee-structure.int.spec.tsx`: assert the Atlas statement heading preserves the authored category label exactly.
- Modify `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`: remove the presentation-only suffix from the statement heading.
- Modify `.agents/skills/project-context/references/block-system.md`: record the maintained block-level heading contract.
- Modify `docs/guides/blocks.md`: document the editor-facing result.
- Modify `docs/architecture/feature-inventory.md`: keep the architecture summary aligned with the heading contract.
- Update `.agents/skills/project-context/references/project-inventory.json` only if the required context updater reports generated-fact changes.

### Task 1: Preserve the Authored Atlas Category Heading

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Possibly modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: normalized `ResolvedFeeStructureCategory.label` supplied to `ProgrammeCostAtlasPresentation`.
- Produces: one Atlas `<h3 data-fee-atlas-title="true">` whose text content equals the authored category label.

- [ ] **Step 1: Add the failing regression assertion**

In the existing `renders the Programme Cost Atlas with the approved 50/50 editorial hierarchy` test in `tests/int/fee-structure.int.spec.tsx`, select the statement header title after `atlasTitles` is collected:

```tsx
const statementTitle = container.querySelector(
  '[data-fee-atlas-statement-header="true"] [data-fee-atlas-title="true"]',
)
```

Then add the exact text assertions alongside the existing Atlas-title assertions:

```tsx
expect(statementTitle?.textContent).toBe('General')
expect(statementTitle?.textContent).not.toContain('fee heads')
```

- [ ] **Step 2: Run the focused test and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: FAIL because the current Atlas title is `General fee heads`, not `General`.

- [ ] **Step 3: Implement the minimal presentation change**

In `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`, replace:

```tsx
{category.label} fee heads
```

with:

```tsx
{category.label}
```

Keep the surrounding heading element, classes, data attribute, caption, and `Statement breakdown` eyebrow unchanged.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: the Fee Structure integration test file passes.

- [ ] **Step 5: Update maintained Fee Structure documentation**

In `.agents/skills/project-context/references/block-system.md`, append this sentence to the Programme Cost Atlas presentation paragraph after the sentence describing the right statement:

```markdown
The statement header preserves the authored category label verbatim beneath the fixed `Statement breakdown` eyebrow.
```

In `docs/guides/blocks.md`, append this sentence to the Programme Cost Atlas paragraph after the sentence describing the right statement:

```markdown
The statement heading displays the authored category label verbatim beneath the **Statement breakdown** eyebrow.
```

In `docs/architecture/feature-inventory.md`, add the equivalent architecture summary:

```markdown
Its statement heading preserves the authored category label verbatim beneath the fixed `Statement breakdown` eyebrow.
```

- [ ] **Step 6: Run static verification**

Run:

```bash
pnpm exec eslint src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: both commands exit successfully with no errors.

- [ ] **Step 7: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit successfully. Retain a changed `.agents/skills/project-context/references/project-inventory.json` only if the updater reports a generated-fact change; otherwise the update is a checked no-op.

- [ ] **Step 8: Review the final diff and whitespace**

Run:

```bash
git diff --check
git status --short
git diff -- src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx .agents/skills/project-context/references/block-system.md docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/project-inventory.json
```

Expected: no whitespace errors, no unrelated files, and no schema, normalization, generated-type, migration, style, or download changes.
