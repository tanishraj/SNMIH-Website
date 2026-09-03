# Icon Card Showcase Cards per Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Icon Card Showcase grid control explicitly offer 2, 3, or 4 cards per row while preserving every existing saved value and responsive layout.

**Architecture:** Keep `cardWidth` and its `wide`, `standard`, and `compact` stored values so no migration or renderer change is required. Change only the Payload Admin label and option copy/order, then document the editor-facing contract and refresh the generated project inventory.

**Tech Stack:** Payload CMS 3, TypeScript, React 19, Next.js 16, Tailwind CSS 4, Vitest

## Global Constraints

- Keep the internal field name `cardWidth`.
- Keep stored values `wide`, `standard`, and `compact`.
- Present options in ascending order: 2 Cards, 3 Cards, 4 Cards.
- Keep `standard` as the default.
- Preserve `wide` as 2 columns, `standard` as 3 columns, and `compact` as 4 columns.
- Preserve one mobile column and two tablet columns; four columns continue to begin at `xl`.
- Do not add a migration, dependency, or renderer field.
- Do not change card sizing, spacing, height, alignment, backgrounds, actions, or wrapping.
- Do not modify `src/styles/themes/theme-snmih.css` or unrelated blocks.

---

### Task 1: Clarify the Payload Admin grid control

**Files:**

- Modify: `tests/int/icon-card-showcase.int.spec.tsx:121-129`
- Modify: `src/blocks/IconCardShowcase/config.ts:298-302`
- Modify through generation: `src/payload-types.ts`

**Interfaces:**

- Consumes: the existing `select(name, label, defaultValue, options)` field helper.
- Produces: a `cardWidth` select labeled `Cards per Row` whose editor options map 2 Cards to `wide`, 3 Cards to `standard`, and 4 Cards to `compact`.
- Preserves: the same `cardWidth` union members (`wide`, `standard`, and `compact`) and all renderer inputs.

- [ ] **Step 1: Write the failing schema assertion**

Replace the current `cardWidth` assertions in `tests/int/icon-card-showcase.int.spec.tsx` with:

```tsx
const cardWidthField = findField(IconCardShowcaseBlock.fields, 'cardWidth')
expect(cardWidthField).toMatchObject({
  defaultValue: 'standard',
  label: 'Cards per Row',
  name: 'cardWidth',
  required: true,
  type: 'select',
})
expect(cardWidthField?.options).toEqual([
  { label: '2 Cards', value: 'wide' },
  { label: '3 Cards', value: 'standard' },
  { label: '4 Cards', value: 'compact' },
])
```

In the existing `uses the generated Payload contract` test, replace its `cardWidth` assertion with:

```tsx
expect(contract).toContain("cardWidth: 'wide' | 'standard' | 'compact'")
```

- [ ] **Step 2: Run the focused test and verify the editor contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx -t "defines the complete Payload schema and defaults"
```

Expected: FAIL because the current label is `Card Width` and the options are named Compact, Standard, and Wide.

- [ ] **Step 3: Implement the backward-compatible option labels**

Replace the `cardWidth` field in `src/blocks/IconCardShowcase/config.ts` with:

```ts
select('cardWidth', 'Cards per Row', 'standard', [
  { label: '2 Cards', value: 'wide' },
  { label: '3 Cards', value: 'standard' },
  { label: '4 Cards', value: 'compact' },
]),
```

Do not change `widthClasses` in `src/blocks/IconCardShowcase/Component.tsx`.

- [ ] **Step 4: Run the schema test after the config change**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx -t "defines the complete Payload schema and defaults"
```

Expected: the schema test PASSES. Do not run the generated-contract test until types are regenerated in the next step.

- [ ] **Step 5: Regenerate and verify the reordered Payload type contract**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx
git diff -- src/payload-types.ts
```

Expected: type generation succeeds, every Icon Card Showcase test PASSES, and the generated diff only reorders `cardWidth` to `'wide' | 'standard' | 'compact'`. The same three stored values remain accepted.

- [ ] **Step 6: Run type and lint checks for the implementation**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconCardShowcase/config.ts tests/int/icon-card-showcase.int.spec.tsx
```

Expected: both commands exit with code 0.

- [ ] **Step 7: Commit the editor-contract change**

```bash
git add src/blocks/IconCardShowcase/config.ts src/payload-types.ts tests/int/icon-card-showcase.int.spec.tsx
git commit -m "feat(icon-cards): clarify row count"
```

---

### Task 2: Document and verify the maintained contract

**Files:**

- Modify: `tests/int/icon-card-showcase.int.spec.tsx`
- Modify: `docs/guides/blocks.md:58-63`
- Modify if generated: `.agents/skills/project-context/references/project-inventory.json`
- Review, normally unchanged: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: the implemented `Cards per Row` editor contract and existing responsive mappings.
- Produces: an operator-guide catalog entry that describes explicit 2–4 desktop columns and responsive collapse.
- Produces: a current deterministic project inventory for the completed source and test changes.

- [ ] **Step 1: Add a failing operator-documentation contract**

Add this constant below the existing `cards` fixture in `tests/int/icon-card-showcase.int.spec.tsx`:

```tsx
const blocksGuideSource = readFileSync('docs/guides/blocks.md', 'utf8')
```

Add this test before `uses the generated Payload contract`:

```tsx
it('documents the explicit cards-per-row control', () => {
  expect(blocksGuideSource).toMatch(/\| Icon Card Showcase\s+\|/)
  expect(blocksGuideSource).toContain('Cards per Row supports 2–4 desktop columns')
  expect(blocksGuideSource).toContain('collapse responsively')
})
```

- [ ] **Step 2: Run the documentation contract and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx -t "documents the explicit cards-per-row control"
```

Expected: FAIL because the block catalog does not yet contain an Icon Card Showcase row.

- [ ] **Step 3: Add the operator-guide entry**

In `docs/guides/blocks.md`, insert this row between Timeline and Icon Grid:

```markdown
| Icon Card Showcase | Icon-led cards and values | Cards per Row supports 2–4 desktop columns; cards collapse responsively and support semantic backgrounds and actions |
```

- [ ] **Step 4: Run the documentation and focused block contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Refresh and validate generated project knowledge**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory update completes atomically and the check reports `Project context is current.` A stale knowledge-graph warning is non-blocking. Review `.agents/skills/project-context/references/block-system.md`; leave it unchanged because the block registry, renderer topology, and shared block contract did not change.

- [ ] **Step 6: Run adjacent regression and formatting checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/project-context-repository.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconCardShowcase/config.ts tests/int/icon-card-showcase.int.spec.tsx
pnpm exec prettier --check src/blocks/IconCardShowcase/config.ts tests/int/icon-card-showcase.int.spec.tsx docs/guides/blocks.md
git diff --check
```

Expected: all tests and commands pass with no formatting or whitespace errors.

- [ ] **Step 7: Inspect scope and commit the maintained documentation**

Run:

```bash
git status --short
git diff -- src/blocks/IconCardShowcase/config.ts tests/int/icon-card-showcase.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/project-inventory.json
```

Expected: only the approved Icon Card Showcase files and generated project inventory are changed; `src/styles/themes/theme-snmih.css` is untouched.

Commit:

```bash
git add tests/int/icon-card-showcase.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(icon-cards): explain row control"
```
