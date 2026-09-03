# Download List Grid Action Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one grid-only setting that switches all Boxed, Open, and Framed document actions between labelled and accessible icon-only treatments.

**Architecture:** Add a narrow `DownloadGridActionDisplay` union to the schema-to-presentation prop chain. Keep action destinations and labels unchanged; `DocumentActions` decides whether to expose labels visually or use the existing Eye/animated ArrowDown icon controls.

**Tech Stack:** Payload CMS fields and generated types, React, TypeScript, Tailwind CSS, Lucide React, Vitest, Testing Library, and project-context tooling.

## Global Constraints

- Do not stage, unstage, commit, or alter branch history.
- Add only one block-level setting; do not add per-action or per-document appearance controls.
- `labelled` is the saved and runtime fallback.
- Inline remains icon-only regardless of the new setting.
- Icon-only actions retain accessible labels, tooltips, destinations, download semantics, and new-tab behavior.

---

### Task 1: Add the grid action display schema and prop contract

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/DownloadList/types.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces `DownloadGridActionDisplay = 'icons' | 'labelled'`.
- Produces `gridActionDisplay?: DownloadGridActionDisplay | null` in the server/client input contracts.
- Passes a normalized `gridActionDisplay: DownloadGridActionDisplay` to `DownloadListPresentation`.

- [ ] **Step 1: Add a failing schema test**

Add to `DownloadListBlock schema`:

```tsx
it('offers one grid-wide labelled or icon-only action setting', () => {
  const field = findNamedField(DownloadListBlock.fields, 'gridActionDisplay') as SelectField

  expect(field).toMatchObject({
    type: 'select',
    defaultValue: 'labelled',
    required: true,
    options: [
      { label: 'Labelled', value: 'labelled' },
      { label: 'Icon only', value: 'icons' },
    ],
  })
  expect(field.admin?.condition?.({}, { displayMode: 'cards' }, {} as never)).toBe(true)
  expect(field.admin?.condition?.({}, { displayMode: 'openGrid' }, {} as never)).toBe(true)
  expect(field.admin?.condition?.({}, { displayMode: 'framedGrid' }, {} as never)).toBe(true)
  expect(field.admin?.condition?.({}, { displayMode: 'list' }, {} as never)).toBe(false)
})
```

- [ ] **Step 2: Run the schema test and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "grid-wide"`.

Expected: the field lookup is undefined.

- [ ] **Step 3: Add the Payload select**

After `gridIconPosition` in `config.ts`, add:

```ts
{
  name: 'gridActionDisplay',
  label: 'Grid Action Display',
  type: 'select',
  defaultValue: 'labelled',
  required: true,
  options: [
    { label: 'Labelled', value: 'labelled' },
    { label: 'Icon only', value: 'icons' },
  ],
  admin: {
    condition: isGridMode,
    description: 'Show every grid action with its label or as an accessible icon-only control.',
  },
} satisfies SelectField,
```

- [ ] **Step 4: Thread the typed prop to Presentation**

Add to `types.ts`:

```ts
export type DownloadGridActionDisplay = 'icons' | 'labelled'
```

Add `gridActionDisplay?: DownloadGridActionDisplay | null` to `DownloadListBlockLike` and client
`Props`. Default it to `labelled` in both components. Pass it from the server component to the client,
then pass this normalized value to Presentation:

```tsx
gridActionDisplay={gridActionDisplay === 'icons' ? 'icons' : 'labelled'}
```

- [ ] **Step 5: Run schema tests**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "DownloadListBlock schema"`.

Expected: every schema test passes. TypeScript runs after Task 2 adds the Presentation contract.

---

### Task 2: Render icon-only grid actions without changing Inline

**Files:**

- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- `PresentationProps.gridActionDisplay: DownloadGridActionDisplay`.
- `DocumentActionsProps.display: DownloadGridActionDisplay`.
- `layout` remains `'grid' | 'inline'` for layout evidence and styling context.

- [ ] **Step 1: Add failing automatic icon-mode tests**

Render a Framed Grid with an uploaded file, external View URL, `showViewAction`, and
`gridActionDisplay="icons"`. Assert:

```tsx
expect(screen.getByRole('link', { name: 'View Document' }).getAttribute('title')).toBe(
  'View Document',
)
expect(screen.getByRole('link', { name: 'Download' }).getAttribute('title')).toBe('Download')
expect(screen.getByTestId('download-action-eye')).toBeTruthy()
expect(screen.getByTestId('download-action-arrow-down')).toBeTruthy()
expect(document.querySelector('[data-document-action-label="true"]')).toBeNull()
```

Also verify View keeps `target="_blank"`/`rel="noreferrer"`, Download keeps the `download` attribute,
and the ArrowDown markup retains hover/focus/reduced-motion classes.

- [ ] **Step 2: Add failing manual-label and compatibility tests**

Render manual Link and Download actions in grid icon mode and assert their required labels become
`aria-label` and `title`. Render invalid or missing `gridActionDisplay` and assert the existing visible
labelled View link and Download button remain. Render Inline with `gridActionDisplay="labelled"` and
assert it still uses icon-only actions.

- [ ] **Step 3: Run the new rendering tests and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "grid icon mode|manual grid icons|labelled fallback|Inline ignores"`.

Expected: the component does not accept the new prop and grids still render visible labels.

- [ ] **Step 4: Generalize DocumentActions display behavior**

Import `DownloadGridActionDisplay`. Add `gridActionDisplay` to `PresentationProps` and `display` to
`DocumentActionsProps`. In `DocumentActions`, replace the current Inline-only decision with:

```ts
const isIconOnly = layout === 'inline' || display === 'icons'
const isGridLink = !isIconOnly && action.kind === 'link'
```

Use `isIconOnly` for icon-sized button variants, `aria-label`, `title`, and `InlineActionIcon`. Keep
`data-document-actions-layout={layout}` and add `data-document-actions-display={display}`. Preserve all
destination attributes.

- [ ] **Step 5: Thread the resolved display through grid and Inline call sites**

Pass `gridActionDisplay` through `GridPresentation` and `GridDocumentItem`, then call:

```tsx
<DocumentActions display={gridActionDisplay} layout="grid" ... />
```

Inline must call:

```tsx
<DocumentActions display="icons" layout="inline" ... />
```

- [ ] **Step 6: Run focused rendering and static checks**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
```

Expected: all focused tests, TypeScript, and ESLint pass.

---

### Task 3: Regenerate contracts and update maintained documentation

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `src/payload-types.ts` (generated)
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Verify/update: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Fixture explicitly demonstrates `gridActionDisplay="labelled"`.
- Generated types expose only `'labelled' | 'icons'` for the new field.
- Documentation describes one grid-wide setting and fixed Inline behavior.

- [ ] **Step 1: Update fixture and fixture test**

Add `gridActionDisplay="labelled"` to the Download List thumbnail fixture. Extend its source test to
assert that exact prop. Do not change the fixture layout, documents, or automatic actions.

- [ ] **Step 2: Generate and inspect Payload types**

Run `pnpm generate:types`, then confirm the Download List interface contains:

```ts
gridActionDisplay?: ('labelled' | 'icons') | null
```

Confirm no per-action visual fields return.

- [ ] **Step 3: Regenerate only the Download List thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=downloadList pnpm generate:block-thumbnails
```

Inspect `public/block-thumbnails/download-list.jpg`; it must remain a labelled Framed Grid preview.

- [ ] **Step 4: Update maintained documentation**

Document **Grid Action Display** in the operator guide, feature inventory, and block-system reference:

- Labelled is the default and compatibility fallback.
- Icon only converts every boxed-family View/Download action to Eye/ArrowDown controls.
- Manual labels become accessible names/tooltips in icon mode.
- Inline remains icon-only and ignores this grid-only setting.

- [ ] **Step 5: Complete project-context update and final verification**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
pnpm exec prettier --check src/blocks/DownloadList src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-20-download-list-grid-action-display-design.md docs/superpowers/plans/2026-08-20-download-list-grid-action-display.md
git diff HEAD --check
```

Expected: all five suites, TypeScript, ESLint, Prettier, context, and diff checks pass. Report the known
stale knowledge-graph warning separately. Do not stage or commit the result.
