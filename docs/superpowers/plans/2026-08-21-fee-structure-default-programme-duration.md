# Fee Structure Default Programme Duration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize newly created Fee Structure blocks with an editable `Programme Duration` / `4.5 Years` Additional Programme Details row without changing existing saved blocks or the Atlas renderer.

**Architecture:** Add a static array `defaultValue` to the existing Payload `programmeDetails` field and lock it with the current Fee Structure schema integration test. Preserve runtime normalization and presentation behavior; Payload’s generated types retain the same optional array shape because the field itself does not become required.

**Tech Stack:** Payload CMS 3.85.2, TypeScript 5.7, React 19, Vitest, project-context tooling.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-21-fee-structure-default-programme-duration-design.md`.
- The exact editable default is `{ label: 'Programme Duration', value: '4.5 Years' }`.
- Keep `programmeDetails` optional, limited to four rows, and conditional on `programmeCostAtlas`.
- Do not add a dedicated duration property, make the row required, add a runtime fallback, or migrate existing content.
- Do not change normalization, React rendering, Fee Structure presentation classes, tabs, downloads, categories, totals, or content order.
- Preserve `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx` byte-for-byte, including the user’s current staged and unstaged edits.
- If the user edits that presentation file again during execution, stop before any overlapping write, re-inspect its new checksum, and preserve the newer user version.
- Do not regenerate `public/block-thumbnails/fee-structure.jpg`; its fixture already authors the same detail and frontend output does not change.
- Do not stage, unstage, or commit any files. Preserve the user’s current index and worktree state.

---

## File Map

- Modify `tests/int/fee-structure.int.spec.tsx`: assert the exact programme-detail array default.
- Modify `src/blocks/FeeStructure/config.ts`: add the editable array default to `programmeDetails`.
- Regenerate `src/payload-types.ts`: verify the optional `programmeDetails` shape remains structurally unchanged.
- Modify `docs/guides/blocks.md`: document the new-block authoring default for editors.
- Modify `docs/architecture/feature-inventory.md`: record the default without implying a runtime fallback.
- Modify `.agents/skills/project-context/references/block-system.md`: keep the maintained block contract current.
- Refresh `.agents/skills/project-context/references/project-inventory.json`: run the required generated inventory update/check loop.
- Do not modify `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`, `src/blocks/FeeStructure/FeeStructureClient.tsx`, `src/blocks/FeeStructure/Component.tsx`, normalization, fixtures, or thumbnails.

---

### Task 1: Record the user-owned staging boundary

**Files:**

- Inspect only: repository index and worktree

**Interfaces:**

- Consumes: the user’s current staged Fee Structure feature and unstaged Atlas presentation refinements.
- Produces: before-state evidence used during the final audit; no filesystem mutation.

- [ ] **Step 1: Record staged and unstaged paths before editing**

Run:

```bash
git status --short
git diff --cached --name-status
git diff --name-status
```

Expected: the existing Fee Structure feature files are staged, `ProgrammeCostAtlasPresentation.tsx` also has unstaged user edits, and the focused design/plan documents may be untracked. Do not change the index.

- [ ] **Step 2: Capture the exact Atlas presentation checksum**

Run:

```bash
shasum -a 256 src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
```

Expected: record the checksum for comparison in Task 3. The file must have the same checksum after implementation.

---

### Task 2: Add the editable programme-duration default test-first

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/config.ts`

**Interfaces:**

- Consumes: existing `findNamedField(FeeStructureBlock.fields, 'programmeDetails')` schema helper and Payload `ArrayField.defaultValue` support.
- Produces: `programmeDetails.defaultValue = [{ label: 'Programme Duration', value: '4.5 Years' }]` for newly initialized Fee Structure blocks.

- [ ] **Step 1: Extend the existing programme-details schema assertion**

Change the current assertion in `defines the approved identity, tabs, limits, and defaults` to:

```ts
expect(findNamedField(FeeStructureBlock.fields, 'programmeDetails')).toMatchObject({
  type: 'array',
  defaultValue: [
    {
      label: 'Programme Duration',
      value: '4.5 Years',
    },
  ],
  maxRows: 4,
})
```

Do not modify any rendering assertion or test fixture.

- [ ] **Step 2: Run the focused test and verify it fails for the missing default**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: exactly the schema-default assertion fails because the current `programmeDetails` field has no `defaultValue`; the remaining Fee Structure tests pass.

- [ ] **Step 3: Add the static default to the existing Payload array field**

In `src/blocks/FeeStructure/config.ts`, change only the `programmeDetails` field opening to:

```ts
{
  name: 'programmeDetails',
  label: 'Additional Programme Details',
  type: 'array',
  defaultValue: [
    {
      label: 'Programme Duration',
      value: '4.5 Years',
    },
  ],
  maxRows: 4,
```

Keep the current Atlas condition, `initCollapsed`, description, required child fields, and all surrounding fields unchanged.

- [ ] **Step 4: Format only the schema and test files**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure/config.ts tests/int/fee-structure.int.spec.tsx
```

Expected: both files format successfully without modifying the Atlas presentation or other user-owned files.

- [ ] **Step 5: Re-run the focused Fee Structure suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: all 32 Fee Structure tests PASS, including the exact default-value contract.

---

### Task 3: Synchronize generated types and maintained contracts

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the updated Payload config and the existing Fee Structure documentation paragraphs.
- Produces: current generated schema types and explicit operator/architecture wording that distinguishes an authoring default from runtime inference.

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: generation succeeds. The `programmeDetails?: { label: string; value: string; id?: string | null }[] | null` shape remains optional; no presentation or content fixture is rewritten.

- [ ] **Step 2: Update the operator guide**

In the Fee Structure paragraph of `docs/guides/blocks.md`, add this sentence immediately after the sentence describing the Atlas left summary:

```markdown
New blocks start Additional Programme Details with an editable **Programme Duration** / **4.5 Years** row; editors can change or remove it, and existing saved blocks are not backfilled.
```

Retain all existing fee, total, download, theme, and table guidance.

- [ ] **Step 3: Update the architecture feature inventory**

In the Fee Structure paragraph of `docs/architecture/feature-inventory.md`, add this sentence immediately after the sentence that introduces additional programme details:

```markdown
New block authoring initializes those details with an editable `Programme Duration` / `4.5 Years` row without adding a runtime fallback or migrating existing documents.
```

Do not alter the surrounding block count, registry, renderer, or theme descriptions.

- [ ] **Step 4: Update the project-context Fee Structure contract**

In `.agents/skills/project-context/references/block-system.md`, add this sentence after the Atlas left-summary description:

```markdown
New blocks initialize Additional Programme Details with one editable `Programme Duration` / `4.5 Years` row; existing documents are not backfilled and runtime never invents a missing duration.
```

Keep the existing right-density and left-summary-spacing contract unchanged.

- [ ] **Step 5: Format the changed documentation and plan**

Run:

```bash
pnpm exec prettier --write docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-21-fee-structure-default-programme-duration-design.md docs/superpowers/plans/2026-08-21-fee-structure-default-programme-duration.md
```

Expected: all five Markdown files format successfully without changes to unrelated sections.

- [ ] **Step 6: Complete the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `.agents/skills/project-context/references/project-inventory.json` refreshes atomically and the check reports `Project context is current.` The known stale knowledge-graph warning is acceptable only if it remains the sole warning.

---

### Task 4: Verify behavior and preserve every user edit

**Files:**

- Verify: all files listed above
- Preserve unchanged: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`
- Preserve unchanged: `public/block-thumbnails/fee-structure.jpg`

**Interfaces:**

- Consumes: the schema default, regenerated types, focused contracts, and Task 1 before-state evidence.
- Produces: final verification that new authoring receives the editable default while existing runtime and user edits remain untouched.

- [ ] **Step 1: Run affected tests and static checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/FeeStructure/config.ts tests/int/fee-structure.int.spec.tsx
pnpm exec prettier --check src/blocks/FeeStructure/config.ts tests/int/fee-structure.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-21-fee-structure-default-programme-duration-design.md docs/superpowers/plans/2026-08-21-fee-structure-default-programme-duration.md
git diff --check
```

Expected: affected integration tests, TypeScript, focused ESLint, formatting, and whitespace checks PASS. No thumbnail generation or frontend layout scan is needed because React and rendered output are unchanged.

- [ ] **Step 2: Prove the Atlas presentation file was preserved**

Run:

```bash
shasum -a 256 src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
```

Expected: the checksum exactly matches the value recorded in Task 1.

- [ ] **Step 3: Audit index and worktree state without changing either**

Run:

```bash
git status --short
git diff --cached --name-status
git diff --name-status
```

Expected: the original staged paths and their staged content remain in the index, the user’s unstaged Atlas presentation edits remain present, and this task’s config/test/docs/generated-inventory changes appear only as unstaged or untracked work layered on top. No file is staged, unstaged, or committed by this plan.

- [ ] **Step 4: Inspect the focused diff**

Run:

```bash
git diff -- src/blocks/FeeStructure/config.ts tests/int/fee-structure.int.spec.tsx src/payload-types.ts docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: the task-specific unstaged diff contains only the exact editable array default, its test, accurate authoring-default documentation, and generated synchronization. Confirm `ProgrammeCostAtlasPresentation.tsx` and `public/block-thumbnails/fee-structure.jpg` are absent from this task-specific diff.
