# Academic Programmes Metadata Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both Academic Programmes metadata labels and values editable per card and optionally align the metadata/action group to the bottom of equal-height cards.

**Architecture:** Payload retains a bounded two-item authoring model. The server component normalizes labels and the block-level position before passing client-safe values to the existing client presentation, which composes metadata and CTA in flow or bottom mode without absolute positioning.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Keep exactly two metadata items; do not introduce a generic array.
- Preserve existing records without a migration.
- Use `Duration`, `Intake`, and `flow` as defensive runtime fallbacks.
- Omit an item when its value is empty, even if its label is populated.
- Preserve theming, links, accessibility, and responsive behaviour.
- Preserve unrelated and user-authored uncommitted changes.
- Do not stage, unstage, or commit files.

---

## File Map

- `src/blocks/AcademicProgrammes/config.ts`: Payload authoring fields.
- `src/blocks/AcademicProgrammes/Component.tsx`: server normalization.
- `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`: flow/bottom presentation.
- `tests/int/academic-programmes.int.spec.tsx`: schema and server-render tests.
- `tests/int/academic-programmes-client.int.spec.tsx`: client omission and composition tests.
- `src/payload-types.ts`: regenerated types.
- `.agents/skills/project-context/references/block-system.md`: maintained block contract.
- `.agents/skills/project-context/references/project-inventory.json`: generated project facts.

### Task 1: Add the Payload authoring contract

**Files:**

- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `src/blocks/AcademicProgrammes/config.ts`

**Interfaces:**

- Produces per-programme `durationLabel?: string | null` and `intakeLabel?: string | null`.
- Produces `metadataPosition: 'flow' | 'bottom'`, default `flow`.

- [ ] **Step 1: Write failing schema assertions**

Add:

```ts
expect(findNamedField(fields, 'durationLabel')).toMatchObject({
  defaultValue: 'Duration',
  type: 'text',
})
expect(findNamedField(fields, 'intakeLabel')).toMatchObject({
  defaultValue: 'Intake',
  type: 'text',
})
expect(findNamedField(fields, 'metadataPosition')).toMatchObject({
  defaultValue: 'flow',
  required: true,
  type: 'select',
})
expect(findNamedField(fields, 'metadataPosition')?.options?.map(({ value }) => value)).toEqual([
  'flow',
  'bottom',
])
```

- [ ] **Step 2: Confirm the focused test fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx
```

Expected: missing-field assertions fail.

- [ ] **Step 3: Add label/value fields to each programme**

Place each label directly before its existing value:

```ts
{
  name: 'durationLabel',
  label: 'Duration Label',
  type: 'text',
  defaultValue: 'Duration',
  admin: { description: 'Label shown above the duration value.' },
},
{
  name: 'duration',
  label: 'Duration Value',
  type: 'text',
  admin: { description: 'Editor-authored duration, such as 3 years.' },
},
{
  name: 'intakeLabel',
  label: 'Intake Label',
  type: 'text',
  defaultValue: 'Intake',
  admin: { description: 'Label shown above the intake value.' },
},
{
  name: 'intake',
  label: 'Intake Value',
  type: 'text',
  admin: { description: 'Editor-authored intake, such as Subject to approval.' },
},
```

- [ ] **Step 4: Add the position selector after `viewMode`**

```ts
{
  name: 'metadataPosition',
  label: 'Programme Details Position',
  type: 'select',
  defaultValue: 'flow',
  required: true,
  options: [
    { label: 'After Description', value: 'flow' },
    { label: 'Bottom of Card', value: 'bottom' },
  ],
  admin: {
    description:
      'Places programme details after the description or aligns them with the action at the bottom of each card.',
  },
} satisfies SelectField,
```

- [ ] **Step 5: Re-run the focused test**

Expected: the schema assertions pass.

### Task 2: Normalize and render editable metadata

**Files:**

- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify: `src/blocks/AcademicProgrammes/Component.tsx`
- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`

**Interfaces:**

- `ResolvedAcademicProgramme` gains optional `durationLabel` and `intakeLabel`.
- `AcademicProgrammesClientProps` gains `metadataPosition: 'flow' | 'bottom'`.
- `ProgrammeMetadata` keeps semantic `dl`, `dt`, and `dd` markup.

- [ ] **Step 1: Add failing server-render assertions**

Render `metadataPosition="bottom"` with trimmed custom labels/values and assert:

```ts
expect(html).toContain('data-academic-programme-metadata-position="bottom"')
expect(html).toContain('Programme duration')
expect(html).toContain('3 years')
expect(html).toContain('Availability')
expect(html).toContain('Subject to approval')
expect(html).toContain('data-academic-programme-bottom-content="true"')
```

Add another render with values but missing labels and assert `Duration` and `Intake`. Cast an unknown position and assert it resolves to `flow`.

- [ ] **Step 2: Add a failing client omission test**

Render a card with `durationLabel` but no duration, plus a populated intake pair:

```tsx
expect(screen.queryByText('Programme duration')).toBeNull()
expect(screen.getByText('Availability')).not.toBeNull()
expect(screen.getByText('Subject to approval')).not.toBeNull()
```

Pass `metadataPosition="flow"` to existing client test renders.

- [ ] **Step 3: Confirm both focused test files fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx
```

Expected: failures for missing props, labels, and bottom composition.

- [ ] **Step 4: Normalize labels and position on the server**

Extend local types with:

```ts
durationLabel?: string | null
intakeLabel?: string | null
metadataPosition?: 'bottom' | 'flow' | null
```

Normalize per programme and at block level:

```ts
durationLabel: programme.durationLabel?.trim() || 'Duration',
intakeLabel: programme.intakeLabel?.trim() || 'Intake',
const resolvedMetadataPosition = metadataPosition === 'bottom' ? 'bottom' : 'flow'
```

Pass `metadataPosition={resolvedMetadataPosition}` to the client.

- [ ] **Step 5: Render normalized labels in `ProgrammeMetadata`**

Add label props and replace hardcoded terms:

```tsx
<dt className={cn(contentItemMetadataClasses, secondaryClassName)}>{durationLabel}</dt>
<dt className={cn(contentItemMetadataClasses, secondaryClassName)}>{intakeLabel}</dt>
```

Keep rendering conditional on `duration` and `intake`, not their labels.

- [ ] **Step 6: Compose bottom content without absolute positioning**

Create metadata and action elements once. In flow mode, render them directly and retain `mt-auto` on the action. In bottom mode, render available lower content inside:

```tsx
<div className="mt-auto" data-academic-programme-bottom-content="true">
  {metadataElement}
  {actionElement}
</div>
```

Do not render the wrapper when both elements are absent. Add:

```tsx
data-academic-programme-metadata-position={metadataPosition}
```

to the card. Preserve the metadata gap, ruled action border, and document order.

- [ ] **Step 7: Pass `metadataPosition` from client to every card**

Add the prop to `AcademicProgrammesClient`, then to each `ProgrammeCard` call.

- [ ] **Step 8: Re-run the focused tests**

Expected: both test files pass.

### Task 3: Regenerate and verify contracts

**Files:**

- Modify: `src/payload-types.ts`
- Modify as required: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Generated Academic Programmes types include both labels and `metadataPosition`.
- Project context records the current authoring and rendering contract.

- [ ] **Step 1: Regenerate Payload types**

Run `pnpm generate:types`.

Expected: success and updated Academic Programmes fields in `src/payload-types.ts`.

- [ ] **Step 2: Run TypeScript**

Run `pnpm exec tsc --noEmit`.

Expected: no diagnostics.

- [ ] **Step 3: Run focused and neighbouring contracts**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: all selected tests pass.

- [ ] **Step 4: Run lint and the layout detector**

```bash
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AcademicProgrammes
```

Expected: no new lint errors and no layout findings; report existing warnings separately.

- [ ] **Step 5: Complete the project-context update/check loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both succeed. Keep generated inventory changes and update `block-system.md` only when the updater does not capture the behaviour sufficiently.

- [ ] **Step 6: Review the final diff without changing Git state**

```bash
git diff --check
git status --short
git diff -- src/blocks/AcademicProgrammes tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx src/payload-types.ts .agents/skills/project-context/references docs/superpowers
```

Expected: no whitespace errors; only intended changes plus pre-existing user work. Do not stage, unstage, or commit.
