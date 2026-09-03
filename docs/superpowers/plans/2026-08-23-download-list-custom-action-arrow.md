# Download List Custom Action Arrow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Download List Custom Button icon authoring with an optional shared trailing arrow while keeping every Custom Button visibly labelled.

**Architecture:** Remove the document-action icon field and internal icon data path, add one Custom Button-only `showArrow` checkbox, and normalize it in the existing action resolver. The presentation keeps Download/View fixed icons, renders Custom Links as text, and exempts Custom Buttons from compact icon-only treatment so the shared `ActionArrow` can follow a visible label.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Change only Download List Document Actions and their maintained documentation/tests.
- Remove `documentActions[].icon` without a migration or compatibility field.
- Show **Show Arrow** only for Custom actions displayed as Button.
- Missing, null, or invalid Show Arrow values resolve to `false`.
- Download keeps its fixed animated Download icon; View keeps its fixed Eye icon.
- Custom Link remains an underlined text link without an icon or arrow.
- Custom Button remains visibly labelled in every layout and adds the shared trailing arrow only when enabled.
- Preserve destination, target, Button Variant, action ordering, and maximum-two-action behavior.
- Preserve unrelated working-tree and staged changes; do not stage or commit any file.
- Do not rerun the previously denied project-context updater without separate explicit approval.

---

## File Map

- `tests/int/download-list.int.spec.tsx` — locks schema, validation, resolution, compact presentation, arrow behavior, and generated types.
- `src/blocks/DownloadList/config.ts` — removes Button Icon and adds the conditional Show Arrow checkbox.
- `src/blocks/DownloadList/resolveActions.ts` — removes icon input/resolution and normalizes Show Arrow.
- `src/blocks/DownloadList/types.ts` — removes the resolved icon property while retaining `showArrow`.
- `src/blocks/DownloadList/Presentation.tsx` — keeps Custom Buttons labelled and renders the shared arrow conditionally.
- `src/payload-types.ts` — regenerated Payload schema contract.
- `docs/guides/blocks.md` — updates editor-facing action behavior.
- `docs/architecture/feature-inventory.md` — updates the maintained runtime summary.
- `.agents/skills/project-context/references/block-system.md` — updates the project-context Download List contract.

---

### Task 1: Replace Custom Button icon authoring with Show Arrow

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/DownloadList/resolveActions.ts`
- Modify: `src/blocks/DownloadList/types.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Produces: `DownloadDocumentActionInput.showArrow?: boolean | null`.
- Removes: `DownloadDocumentActionInput.icon` and `ResolvedDownloadAction.icon`.
- Guarantees: only literal `true` enables the arrow; every other value resolves to `false`.

- [ ] **Step 1: Add failing schema and validation assertions**

In `tests/int/download-list.int.spec.tsx`, update the relevant-field test to assert that the icon field
is absent and Show Arrow uses the Custom Button-only condition:

```tsx
const showArrow = findNamedField(actions.fields, 'showArrow')

expect(findNamedField(actions.fields, 'icon')).toBeUndefined()
expect(showArrow).toMatchObject({
  defaultValue: false,
  label: 'Show Arrow',
  type: 'checkbox',
})
expect(
  showArrow?.admin?.condition?.({}, { actionType: 'custom', mode: 'button' }, {} as never),
).toBe(true)
expect(showArrow?.admin?.condition?.({}, { actionType: 'custom', mode: 'link' }, {} as never)).toBe(
  false,
)
expect(showArrow?.admin?.condition?.({}, { actionType: 'view' }, {} as never)).toBe(false)
```

In the validation test, replace the former missing-icon error expectation with:

```tsx
expect(
  validate(
    [
      {
        actionType: 'custom',
        label: 'Admissions',
        linkType: 'custom',
        mode: 'button',
        url: '/admissions',
      },
    ],
    { siblingData: {} } as never,
  ),
).toBe(true)
```

- [ ] **Step 2: Add failing resolver and generated-type assertions**

Replace the current Custom Button icon resolver test with this contract:

```tsx
expect(
  resolveDocumentActions({
    documentActions: [
      {
        actionType: 'custom',
        label: 'Requirements',
        linkType: 'custom',
        mode: 'link',
        showArrow: true,
        url: '/requirements',
      },
      {
        actionType: 'custom',
        label: 'Apply',
        linkType: 'custom',
        mode: 'button',
        openInNewTab: true,
        showArrow: true,
        url: '/apply',
        variant: 'outline',
      },
    ],
    fallback,
  }),
).toEqual([
  {
    href: '/requirements',
    kind: 'custom',
    label: 'Requirements',
    mode: 'link',
    openInNewTab: false,
    showArrow: false,
    variant: 'default',
  },
  {
    href: '/apply',
    kind: 'custom',
    label: 'Apply',
    mode: 'button',
    openInNewTab: true,
    showArrow: true,
    variant: 'outline',
  },
])
```

Add one runtime hard-removal assertion by passing historical icon input through `as never`:

```tsx
const [historicalIconAction] = resolveDocumentActions({
  documentActions: [
    {
      actionType: 'custom',
      icon: 'ExternalLink',
      label: 'Apply',
      linkType: 'custom',
      mode: 'button',
      url: '/apply',
    },
  ] as never,
  fallback,
})

expect(historicalIconAction).not.toHaveProperty('icon')
expect(historicalIconAction?.showArrow).toBe(false)
```

Add a generated-type contract that isolates only the current `documentActions` subsection. Do not
search the whole block interface because the retained hidden legacy action data may still contain
unrelated icon fields:

```tsx
const generatedTypes = readFileSync(join(process.cwd(), 'src/payload-types.ts'), 'utf8')
const downloadListStart = generatedTypes.indexOf('export interface DownloadListBlock')
const downloadListEnd = generatedTypes.indexOf(
  'export interface DownloadListBlockSelect',
  downloadListStart,
)
const generatedDownloadList = generatedTypes.slice(downloadListStart, downloadListEnd)
const documentActionsStart = generatedDownloadList.indexOf('documentActions?:')
const documentActionsEnd = generatedDownloadList.indexOf('customAction?:', documentActionsStart)
const generatedDocumentActions = generatedDownloadList.slice(
  documentActionsStart,
  documentActionsEnd,
)

expect(generatedDocumentActions).toContain('showArrow?: boolean | null')
expect(generatedDocumentActions).not.toContain('icon?: string | null')
```

- [ ] **Step 3: Run the focused suite and verify the new tests fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
```

Expected: FAIL because Button Icon still exists, Show Arrow is absent, Custom Button validation still
requires an icon, and resolution still forces `showArrow: false`.

- [ ] **Step 4: Change the Payload schema**

In `src/blocks/DownloadList/config.ts`:

1. Remove the `createIconField` import and `customButtonIconBase` declaration.
2. Remove this validation branch:

```ts
if (action.mode === 'button' && !action.icon?.trim()) {
  return `Custom Button action ${position} requires an icon.`
}
```

3. Remove `icon` from `DocumentActionValue` if it is declared there.
4. Replace the spread icon field after Button Variant with:

```ts
{
  name: 'showArrow',
  label: 'Show Arrow',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    condition: isCustomButtonAction,
    description: 'Adds a trailing arrow when this action is displayed as a button.',
  },
} satisfies CheckboxField,
```

- [ ] **Step 5: Remove icon resolution and normalize Show Arrow**

In `src/blocks/DownloadList/resolveActions.ts`, change the new action input to:

```ts
export type DownloadDocumentActionInput = CmsLinkValue & {
  actionType?: 'custom' | 'download' | 'view' | null
  label?: string | null
  mode?: 'button' | 'link' | null
  showArrow?: boolean | null
  variant?: CmsActionVariant | null
  viewOpenInNewTab?: boolean | null
}
```

Remove the internal `icon` assignments from Download and View actions. Resolve Custom with:

```ts
const mode = action.mode === 'button' ? 'button' : 'link'
return [
  {
    ...resolved,
    kind: 'custom',
    mode,
    openInNewTab: Boolean(resolved.openInNewTab),
    showArrow: mode === 'button' && action.showArrow === true,
  },
]
```

In `src/blocks/DownloadList/types.ts`, remove `icon?: string` from `ResolvedDownloadAction`.

- [ ] **Step 6: Generate Payload types and pass the schema/resolver contract**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write src/blocks/DownloadList/config.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/types.ts tests/int/download-list.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
```

Expected: resolver/schema assertions pass; rendering assertions that still expect configurable icons
remain red until Task 2.

---

### Task 2: Render labelled Custom Buttons with the shared arrow

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`

**Interfaces:**

- Consumes: `ResolvedDownloadAction.showArrow: boolean` from Task 1.
- Produces: labelled Custom Buttons with optional `ActionArrow` in every presentation.

- [ ] **Step 1: Replace configurable-icon rendering tests**

Replace the Custom Button configured-icon and invalid-icon fallback tests with:

```tsx
it('renders Custom Link as text and Custom Button with an optional shared arrow', () => {
  render(
    <DownloadListBlockComponent
      displayMode="framedGrid"
      downloads={[
        {
          documentActions: [
            {
              actionType: 'custom',
              label: 'Requirements',
              linkType: 'custom',
              mode: 'link',
              showArrow: true,
              url: '/requirements',
            },
            {
              actionType: 'custom',
              label: 'Apply',
              linkType: 'custom',
              mode: 'button',
              showArrow: true,
              url: '/apply',
            },
          ],
          title: 'Admissions',
        },
      ]}
    />,
  )

  const link = screen.getByRole('link', { name: 'Requirements' })
  const button = screen.getByRole('link', { name: 'Apply' })
  expect(link.className).toContain('underline-offset-4')
  expect(link.querySelector('[data-action-arrow="true"]')).toBeNull()
  expect(button.textContent).toBe('Apply')
  expect(button.querySelector('[data-action-arrow="true"]')).toBeTruthy()
})
```

Add a compact-layout regression test:

```tsx
it.each([
  ['cards', 'icons'],
  ['list', 'labelled'],
] as const)('keeps Custom Button labels visible in %s', (displayMode, gridActionDisplay) => {
  render(
    <DownloadListBlockComponent
      displayMode={displayMode}
      downloads={[
        {
          documentActions: [
            {
              actionType: 'custom',
              label: 'Apply',
              linkType: 'custom',
              mode: 'button',
              url: '/apply',
            },
          ],
          title: 'Admissions',
        },
      ]}
      gridActionDisplay={gridActionDisplay}
    />,
  )

  const button = screen.getByRole('link', { name: 'Apply' })
  expect(button.textContent).toBe('Apply')
  expect(button.getAttribute('title')).toBeNull()
  expect(button.querySelector('[data-document-action-label="true"]')).toBeTruthy()
  expect(button.querySelector('[data-action-arrow="true"]')).toBeNull()
})
```

- [ ] **Step 2: Run the focused suite and verify presentation failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
```

Expected: FAIL because Custom Buttons still enter compact icon-only rendering and the presentation
does not yet render `ActionArrow` from `showArrow`.

- [ ] **Step 3: Simplify the document icon renderer**

In `src/blocks/DownloadList/Presentation.tsx`:

- Remove `ArrowUpRight`, `createElement`, `ComponentProps`, and `resolveLucideIcon` imports.
- Import the shared component directly:

```ts
import { ActionArrow } from '@/components/ActionArrow'
```

- Restrict `DocumentActionIcon` to fixed Download/View behavior:

```tsx
function DocumentActionIcon({ action }: { action: ResolvedDownloadAction }) {
  if (action.kind === 'download') return <AnimatedDownloadIcon />

  if (action.kind === 'view') {
    return (
      <Eye
        aria-hidden="true"
        className="size-4"
        data-document-action-icon="eye"
        data-testid="download-action-eye"
        strokeWidth={2.25}
      />
    )
  }

  return null
}
```

- [ ] **Step 4: Exempt Custom Buttons from compact icon-only treatment**

Inside the action map, replace the compact-state declarations with:

```ts
const usesCompactActions = layout === 'inline' || display === 'icons'
const isLink = action.mode === 'link' && (action.kind === 'custom' || !usesCompactActions)
const isCustomButton = action.kind === 'custom' && action.mode === 'button'
const isCompactButton = !isLink && !isCustomButton && usesCompactActions
const buttonVariant = action.mode === 'button' ? action.variant : 'default'
```

Keep Custom Buttons on `buttonVariants({ size: 'sm', variant: buttonVariant })`. Replace their content
branch with:

```tsx
{
  isLink ? (
    <span data-document-action-label="true">{action.label}</span>
  ) : isCompactButton ? (
    <DocumentActionIcon action={action} />
  ) : isCustomButton ? (
    <>
      <span data-document-action-label="true">{action.label}</span>
      {action.showArrow ? <ActionArrow data-action-arrow="true" data-icon="inline-end" /> : null}
    </>
  ) : (
    <>
      <span data-document-action-label="true">{action.label}</span>
      <DocumentActionIcon action={action} />
    </>
  )
}
```

- [ ] **Step 5: Pass focused rendering and TypeScript checks**

Run:

```bash
pnpm exec prettier --write src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: Download List tests pass and TypeScript exits with code 0.

---

### Task 3: Update maintained guidance and complete verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Verify: every file changed in Tasks 1 and 2

**Interfaces:**

- Consumes: final schema and runtime behavior from Tasks 1 and 2.
- Produces: accurate editor and architecture documentation.

- [ ] **Step 1: Update the operator guide**

Replace the Custom action sentence in `docs/guides/blocks.md` with:

```md
Custom actions use an internal Page or Custom URL and can be a visible text Link or a labelled Button
with a shared semantic variant and optional trailing arrow. Show Arrow appears only for Custom Button.
Custom Buttons remain labelled in Grid Icon-only and Inline List presentations; Download and View
retain their compact fixed-icon controls.
```

- [ ] **Step 2: Update maintained architecture references**

In both `docs/architecture/feature-inventory.md` and
`.agents/skills/project-context/references/block-system.md`, replace the configured-icon contract with:

```md
Download and View retain fixed icons. Custom Link remains textual in every layout. Custom Button is
always labelled and may add the shared trailing arrow; Show Arrow is available only for Custom Button.
Historical document-action icon values are ignored without migration.
```

- [ ] **Step 3: Run final focused and static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-23-download-list-custom-action-arrow-design.md docs/superpowers/plans/2026-08-23-download-list-custom-action-arrow.md
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/Presentation.tsx
git diff --check
git diff --cached --check
```

Expected: focused and theme tests, TypeScript, ESLint, Prettier, and diff checks pass; the detector
returns `[]`.

- [ ] **Step 4: Complete the project-context handoff without changing the existing index**

Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md`, then
run:

```bash
pnpm project-context:check
git status --short
```

Expected: report the previously known stale project inventory and knowledge graph if the context check
remains non-zero. Do not run `pnpm project-context:update` without new explicit permission. Do not
stage, unstage, or commit any file.
