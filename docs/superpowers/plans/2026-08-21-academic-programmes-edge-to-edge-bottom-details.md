# Academic Programmes Edge-to-Edge Bottom Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make bottom-positioned Academic Programmes metadata an edge-to-edge footer with the CTA above it and no nested bottom border.

**Architecture:** Keep the existing bounded metadata model and client component. Add a presentation variant to `ProgrammeMetadata`, conditionally remove content padding only when bottom metadata exists, and reorder the already-resolved action/metadata elements in bottom mode without absolute positioning.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Change only the `Bottom of Card` presentation.
- Keep `After Description` order, padding, spacing, and two-sided metadata border unchanged.
- Put the CTA above metadata in bottom mode.
- Make bottom metadata edge-to-edge and top-bordered only.
- Preserve standard padding when bottom mode has no metadata.
- Preserve card theming, full-card links, semantics, and responsive grid/list behaviour.
- Do not add CMS fields or regenerate Payload types.
- Preserve unrelated and user-authored uncommitted changes.
- Do not stage, unstage, or commit files.

---

### Task 1: Define the edge-to-edge rendering contract

**Files:**

- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`

**Interfaces:**

- Consumes `metadataPosition="bottom"` and the existing metadata/action values.
- Produces observable bottom metadata and content-container attributes for focused layout assertions.

- [ ] **Step 1: Add failing bottom-order and edge tests**

Extend the existing bottom-mode server render test:

```ts
const actionIndex = html.indexOf('Explore MBBS')
const metadataIndex = html.indexOf('Programme duration')
expect(actionIndex).toBeGreaterThan(-1)
expect(metadataIndex).toBeGreaterThan(actionIndex)
expect(html).toContain('data-academic-programme-content="bottom-metadata"')
expect(html).toContain('data-academic-programme-metadata="bottom"')
expect(html).toContain('-mx-7')
expect(html).toContain('sm:-mx-8')
expect(html).toContain('border-t')
```

Extract the bottom metadata element and assert that its classes do not contain `border-y` or `border-b`.

- [ ] **Step 2: Add failing flow and no-metadata compatibility tests**

For flow mode, assert:

```ts
expect(flowMetadataClasses).toContain('border-y')
expect(html).toContain('data-academic-programme-content="standard"')
```

For bottom mode with an action but no metadata, assert the content container remains `standard`, the CTA remains in the bottom wrapper, and no metadata element renders.

- [ ] **Step 3: Run focused tests and confirm the new assertions fail**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx
```

Expected: failures for missing variant attributes, flow/bottom border classes, and old metadata-before-action ordering.

### Task 2: Implement and verify the presentation refinement

**Files:**

- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify if behaviour narrative requires it: `.agents/skills/project-context/references/block-system.md`
- Modify through updater: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- `ProgrammeMetadata` gains `position: 'bottom' | 'flow'`.
- The card content container exposes `data-academic-programme-content="bottom-metadata" | "standard"`.
- The metadata element exposes `data-academic-programme-metadata={position}`.

- [ ] **Step 1: Add a position prop to metadata presentation**

Use position-specific classes while preserving cell internals:

```tsx
<dl
  className={cn(
    'mt-6 grid grid-cols-2',
    position === 'bottom'
      ? '-mx-7 border-t sm:-mx-8'
      : 'border-y',
    dividerClassName,
  )}
  data-academic-programme-metadata={position}
>
```

- [ ] **Step 2: Remove bottom padding only when bottom metadata exists**

Derive:

```ts
const hasBottomMetadata = metadataPosition === 'bottom' && hasMetadata
```

Apply:

```tsx
<div
  className={cn(
    'flex min-w-0 flex-1 flex-col px-7 pt-7 sm:px-8 sm:pt-8',
    hasBottomMetadata ? 'pb-0' : 'pb-7 sm:pb-8',
  )}
  data-academic-programme-content={hasBottomMetadata ? 'bottom-metadata' : 'standard'}
>
```

- [ ] **Step 3: Put the action before metadata in bottom mode**

Keep flow mode unchanged and update only the bottom wrapper:

```tsx
<div className="mt-auto flow-root" data-academic-programme-bottom-content="true">
  {actionElement}
  {metadataElement}
</div>
```

Continue omitting the wrapper when both are absent. When only an action exists, standard bottom padding remains because `hasBottomMetadata` is false.

- [ ] **Step 4: Run focused and neighbouring tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts
```

Expected: all selected tests pass.

- [ ] **Step 5: Run static quality checks**

```bash
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AcademicProgrammes
```

Expected: TypeScript passes, lint has no new issues, and the layout detector returns `[]`.

- [ ] **Step 6: Complete project-context maintenance**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands succeed. Update the Academic Programmes paragraph in `block-system.md` only if needed to describe the edge-to-edge bottom footer; preserve the stale knowledge-graph advisory as non-blocking.

- [ ] **Step 7: Audit the final diff without changing Git state**

```bash
git diff --check
git status --short
git diff -- src/blocks/AcademicProgrammes tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx .agents/skills/project-context/references docs/superpowers
```

Expected: no whitespace errors and only the intended refinement plus pre-existing user work. Do not stage, unstage, or commit.
