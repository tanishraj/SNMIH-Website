# Download List Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Download List's visual action controls with fixed per-layout behavior and one shared responsive Columns setting.

**Architecture:** Simplify the Payload schema and normalized action contract first, then make the shared presentation renderer choose fixed action markup from layout and action kind. Inline uses a container-aware content/divider/action anatomy; Boxed, Open, and Framed retain one shared grid anatomy with optional icons, fixed badges, and labelled actions.

**Tech Stack:** Payload CMS fields and generated types, React, TypeScript, Tailwind CSS 4 container queries, Lucide React, Vitest, Testing Library, and existing thumbnail/project-context tooling.

## Global Constraints

- Do not commit, stage, unstage, or alter branch history.
- One shared `columns` field is always visible, supports `1` through `8`, and defaults/falls back to `3` for every variant.
- Remove `inlineColumns` and `showInlineFileType`.
- Add `showDocumentIcon`, default and runtime fallback On, for every variant.
- Preserve `gridIconPosition` values; label `above` Above Title and `inline` Left of Content.
- Remove automatic/manual action appearance and icon controls plus automatic label controls.
- Keep View/Download toggles, View new-tab behavior, and manual type/label/destination/new-tab fields.
- Inline never shows a badge and uses fixed icon-only Eye/ArrowDown actions.
- Boxed/Open/Framed keep top-right badges, labelled links, and labelled Download buttons with animated trailing ArrowDown.
- Existing identities, manual precedence, destinations, filtering, themes, and Open/Framed borders remain unchanged.

---

### Task 1: Simplify the Payload authoring schema

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces `showDocumentIcon?: boolean | null`, default `true`.
- Keeps `columns?: '1' | ... | '8' | null`, default `3`, without an Admin condition.
- Removes the visual fields named in Global Constraints from the active schema.

- [ ] **Step 1: Replace schema tests with the simplified contract**

Add:

```tsx
it('uses one shared Columns control for every presentation', () => {
  const columns = findNamedField(DownloadListBlock.fields, 'columns') as SelectField
  expect(columns.options).toHaveLength(8)
  expect(columns).toMatchObject({ type: 'select', defaultValue: '3', required: true })
  expect(columns.admin?.condition).toBeUndefined()
  expect(findNamedField(DownloadListBlock.fields, 'inlineColumns')).toBeUndefined()
})

it('offers one shared optional document-icon control', () => {
  expect(findNamedField(DownloadListBlock.fields, 'showDocumentIcon')).toMatchObject({
    type: 'checkbox',
    defaultValue: true,
  })
  expect(findNamedField(DownloadListBlock.fields, 'gridIconPosition')).toMatchObject({
    options: [
      { label: 'Above Title', value: 'above' },
      { label: 'Left of Content', value: 'inline' },
    ],
  })
})

it('removes visual action controls and the Inline badge control', () => {
  for (const name of [
    'showInlineFileType',
    'viewActionAppearance',
    'viewActionLabel',
    'viewActionIconMode',
    'viewActionIcon',
    'downloadActionAppearance',
    'downloadActionLabel',
    'downloadActionIconMode',
    'downloadActionIcon',
  ])
    expect(findNamedField(DownloadListBlock.fields, name)).toBeUndefined()

  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const manualActions = findNamedField(downloads.fields, 'actions') as ArrayField
  expect(findNamedField(manualActions.fields, 'actionAppearance')).toBeUndefined()
  expect(findNamedField(manualActions.fields, 'iconMode')).toBeUndefined()
  expect(findNamedField(manualActions.fields, 'icon')).toBeUndefined()
})
```

Retain tests for automatic toggles/new-tab, the at-least-one validator, and manual destinations.

- [ ] **Step 2: Run schema tests and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "shared Columns|optional document-icon|removes visual"`.

Expected: failures identify conditional Columns, the missing icon toggle, old labels, and old fields.

- [ ] **Step 3: Remove visual-action field definitions**

Delete `actionAppearanceOptions`, `actionIconModeOptions`, `customActionIconField`, `isCustomIcon`,
`showsCustomViewIcon`, `showsCustomDownloadIcon`, and their exclusive imports/types. Retain only these
manual row fields in their current validated/conditional form:

```ts
actionType
label
linkType
page
url
openInNewTab
file
```

- [ ] **Step 4: Reduce automatic and presentation fields**

Automatic Action Fallback retains, in order, `showViewAction`, `openViewInNewTab`, and
`showDownloadAction` with current defaults/validator. Delete all automatic visual fields.

Remove `admin.condition` from `columns`. Delete `inlineColumns` and `showInlineFileType`. Add after
`documentIconSize`:

```ts
{
  name: 'showDocumentIcon',
  label: 'Show File Icon',
  type: 'checkbox',
  defaultValue: true,
  admin: { description: 'Shows the main file icon in every Download List presentation.' },
} satisfies CheckboxField,
```

Set grid-icon options to:

```ts
;[
  { label: 'Above Title', value: 'above' },
  { label: 'Left of Content', value: 'inline' },
]
```

- [ ] **Step 5: Run schema tests**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "DownloadListBlock schema"`.

Expected: every schema test passes.

---

### Task 2: Reduce normalized action and server contracts

**Files:**

- Modify: `src/blocks/DownloadList/types.ts`
- Modify: `src/blocks/DownloadList/resolveActions.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- `DownloadActionSettings` contains optional `openViewInNewTab`, `showDownload`, and `showView`.
- `ResolvedDownloadAction` contains `href`, `kind`, `label`, and `openInNewTab`.
- Server/client props use shared `columns` and `showDocumentIcon` without removed visual props.

- [ ] **Step 1: Replace resolver expectations**

Automatic fallback must equal:

```ts
;[
  { href: '/fallback', kind: 'link', label: 'View Document', openInNewTab: true },
  {
    href: '/api/media/file/fallback.pdf',
    kind: 'download',
    label: 'Download',
    openInNewTab: false,
  },
]
```

Manual expectations use the same four properties while retaining trimming, order, two-row maximum,
invalid-row fallback, and replacement behavior. Delete appearance/icon normalization tests. Add:

```ts
it('ignores historical manual visual settings', () => {
  expect(
    resolveDocumentActions(
      [
        {
          actionAppearance: 'iconOnly',
          actionType: 'link',
          icon: 'Star',
          iconMode: 'custom',
          label: 'Historical link',
          linkType: 'custom',
          url: '/historical',
        },
      ],
      fallback,
    ),
  ).toEqual([{ href: '/historical', kind: 'link', label: 'Historical link', openInNewTab: false }])
})
```

- [ ] **Step 2: Run resolver tests and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "DownloadList action resolution"`.

Expected: action objects still contain visual properties/configurable labels.

- [ ] **Step 3: Simplify shared types and resolver**

Delete `DownloadActionAppearance` and `DownloadActionIconMode`. Replace types with:

```ts
export type DownloadActionSettings = {
  openViewInNewTab?: boolean | null
  showDownload?: boolean | null
  showView?: boolean | null
}

export type ResolvedDownloadAction = {
  href: string
  kind: DownloadActionKind
  label: string
  openInNewTab: boolean
}
```

Historical visual properties may remain optional on `DownloadManualActionInput` but are ignored.
Delete visual normalizers and return only the four resolved properties. Use fixed automatic labels:

```ts
if (fallback.showView === true && fallback.viewHref) {
  resolvedFallback.push({
    href: fallback.viewHref,
    kind: 'link',
    label: 'View Document',
    openInNewTab: fallback.openViewInNewTab ?? true,
  })
}
if (fallback.showDownload !== false && fallback.downloadHref) {
  resolvedFallback.push({
    href: fallback.downloadHref,
    kind: 'download',
    label: 'Download',
    openInNewTab: false,
  })
}
```

- [ ] **Step 4: Reduce server and client props**

Delete automatic visual props plus `inlineColumns` and `showInlineFileType` from Component defaults,
types, fallback arguments, and client props. Add/default:

```ts
showDocumentIcon?: boolean | null
showDocumentIcon = true
```

Pass `showDocumentIcon={showDocumentIcon ?? true}` and shared `columns={columns ?? '3'}` to the client.
The client passes `columns={normalizeGridColumns(columns)}` and `showDocumentIcon` to Presentation.
Delete `normalizeInlineColumns`; keep `normalizeGridColumns` as the shared fallback.

- [ ] **Step 5: Run resolver tests**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "DownloadList action resolution"`.

Expected: resolver tests pass. TypeScript runs after Task 3 updates Presentation props.

---

### Task 3: Implement the fixed Inline and boxed presentation anatomies

**Files:**

- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`
- Test: `tests/int/download-list-card-renderers.int.spec.tsx`

**Interfaces:**

- Inline actions are icon-only Eye and ArrowDown controls with accessible names.
- Boxed/Open/Framed actions are a labelled text link and a labelled Download button.
- All presentations consume shared `columns` and `showDocumentIcon`.
- Inline changes between a bottom action row and right-side action rail from its own available width.

- [ ] **Step 1: Add failing fixed-action presentation tests**

Render an Inline item with both actions and assert:

```tsx
expect(screen.getByRole('link', { name: 'View Document' })).toHaveAttribute(
  'title',
  'View Document',
)
expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('title', 'Download')
expect(screen.getByTestId('download-action-eye')).toBeInTheDocument()
expect(screen.getByTestId('download-action-arrow-down')).toBeInTheDocument()
expect(screen.queryByText('PDF')).not.toBeInTheDocument()
```

Render Boxed, Open, and Framed variants and assert that `View Document` and `Download` are visible,
the link is underlined, the Download button contains the ArrowDown icon, and none has an action divider.

- [ ] **Step 2: Add failing icon, columns, and adaptive-divider tests**

Cover these contracts:

```tsx
it.each(['cards', 'openGrid', 'framedGrid', 'list'] as const)(
  'hides the document icon in %s when disabled',
  (displayMode) => {
    renderDownloadList({ displayMode, showDocumentIcon: false })
    expect(screen.queryByTestId('download-document-icon')).not.toBeInTheDocument()
  },
)

it.each(['list', 'compact'] as const)(
  'uses shared Columns for the %s Inline presentation',
  (displayMode) => {
    const { container } = renderDownloadList({ columns: '8', displayMode })
    expect(container.querySelector('[data-download-grid]')).toHaveClass('2xl:grid-cols-8')
  },
)
```

Also assert each Inline item has `data-download-inline-item-container="true"`; its divider has bottom-row
border styling by default and named-container right-rail styling at the wide breakpoint; its action group
uses the corresponding named-container column placement.

- [ ] **Step 3: Run presentation tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/download-list-card-renderers.int.spec.tsx -t "fixed|document icon|shared Columns|adaptive"
```

Expected: tests fail against configurable action visuals, the Inline badge, separate Inline columns, and
the missing shared icon toggle/container anatomy.

- [ ] **Step 4: Replace configurable action visuals with layout-owned renderers**

In `Presentation.tsx`, import `ArrowDown` and `Eye` directly and remove dynamic action-icon imports and
icon-name plumbing. Keep an `AnimatedDownloadIcon` composed from two ArrowDown spans so hover and
focus-visible move the outgoing and incoming arrows in the same direction as the existing link-arrow
motion.

Change `DocumentActions` to receive `layout: 'grid' | 'inline'`:

- Inline renders every action with the existing icon-sized button treatment, no visible label, and
  `aria-label`/`title` from the fixed resolved label. Link uses Eye; download uses
  `AnimatedDownloadIcon`.
- Grid renders link actions as underlined labelled text without an icon. Download renders a labelled
  small button with the animated trailing ArrowDown.
- Only download actions receive the `download` attribute; preserve external target/rel behavior.
- Mark the wrapper with `data-document-actions-layout` to make the fixed contract testable.

- [ ] **Step 5: Apply the shared boxed anatomy**

Thread `showDocumentIcon` through GridPresentation and GridDocumentItem. Conditionally render the
existing sized file icon for both Above Title and Left of Content positions, marking it with
`data-testid="download-document-icon"`. Keep FileTypeBadge pinned at the top-right regardless of icon
visibility or position. Keep category/title/description content and pass `layout="grid"` to actions.
Do not render a divider between content and actions.

- [ ] **Step 6: Build the container-aware Inline anatomy**

Use the shared `gridColumnClasses[columns]` on the ruled outer grid. Each item remains `min-w-0` with
the existing inter-item bottom/right rules. Make its inner wrapper a named container:

```tsx
<div
  className={cn(
    '@container/download-item grid min-w-0 gap-4 p-5',
    showDocumentIcon ? 'grid-cols-[auto_minmax(0,1fr)]' : 'grid-cols-1',
    showDocumentIcon
      ? '@xl/download-item:grid-cols-[auto_minmax(0,1fr)_auto_auto]'
      : '@xl/download-item:grid-cols-[minmax(0,1fr)_auto_auto]',
  )}
  data-download-inline-item-container="true"
>
```

Render, in order:

1. Optional file icon aligned to the upper-left.
2. Title, optional description, and category content.
3. An `aria-hidden` separator spanning the bottom row with a top border, switching at
   `@xl/download-item` to one column with a left border and no top border.
4. Icon-only actions below/right by default, switching at the same named-container breakpoint to the
   final right-side column.

Remove FileTypeBadge from Inline unconditionally. Pass `layout="inline"` to actions. Ensure the no-icon
case removes the unused first column without changing the separator/action behavior.

- [ ] **Step 7: Run presentation and static checks**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/download-list-card-renderers.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList tests/int/download-list.int.spec.tsx tests/int/download-list-card-renderers.int.spec.tsx
```

Expected: both suites, TypeScript, and ESLint pass.

---

### Task 4: Refresh fixtures, generated contracts, documentation, context, and full verification

**Files:**

- Modify: `src/endpoints/seed/fixtures/downloadList.ts`
- Modify: `src/payload-types.ts` (generated)
- Modify: `docs/authoring/download-list.md`
- Modify: `docs/feature-inventory.md`
- Modify: `docs/block-system.md`
- Modify: `docs/project-inventory.md`
- Modify: `public/block-thumbnails/download-list.svg` (generated)
- Verify/update files selected by `pnpm project-context:update`

**Interfaces:**

- Fixture demonstrates the final Framed boxed anatomy without removed configuration.
- Generated Payload types exactly expose the simplified authoring contract.
- Authoring and inventory docs describe one Columns control and fixed layout-owned actions.

- [ ] **Step 1: Simplify the seed fixture**

Keep the thumbnail fixture as a two-column Framed Grid with `gridIconPosition: 'inline'`, PDF files, and
the default automatic Download action. Add `showDocumentIcon: true`. Remove `inlineColumns`,
`showInlineFileType`, action labels/appearances/icon modes/custom icons, and manual visual fields.

- [ ] **Step 2: Regenerate Payload types and assert the contract**

Run:

```bash
pnpm generate:types
```

Inspect the Download List block in `src/payload-types.ts` and confirm:

- `columns`, `showDocumentIcon`, and `gridIconPosition` remain.
- `inlineColumns` and `showInlineFileType` are absent.
- automatic/manual appearance, label-control, icon-mode, and custom-icon fields are absent.
- manual `label` remains required on action rows.

- [ ] **Step 3: Regenerate and inspect the block thumbnail**

Run the repository's Download List thumbnail generation command documented in the existing thumbnail
workflow. Open `public/block-thumbnails/download-list.svg` and confirm the preview shows a Framed Grid,
top-right PDF badge, left icon, title/description, and labelled Download button with trailing ArrowDown.

- [ ] **Step 4: Update authoring and architecture documentation**

Document these exact contracts:

- Boxed Card, Open Grid, Framed Grid, and Inline presentations.
- One 1–8 Columns setting, default/fallback 3, for every presentation.
- One Show File Icon setting, default On.
- Above Title/Left of Content icon position only affects boxed-family presentations.
- Inline has no badge, uses Eye/ArrowDown icon-only actions, and adapts actions from below to the right.
- Boxed-family presentations keep top-right badges, underlined labelled View links, and labelled Download
  buttons with animated trailing ArrowDown.
- View defaults Off, Download defaults On, at least one must remain enabled, and valid manual rows replace
  the automatic fallback.
- Historical removed fields are ignored; no content migration is required.

Update the feature, block-system, and project inventories so field names, runtime contracts, tests, and
thumbnail references agree.

- [ ] **Step 5: Complete the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Inspect the generated change-impact map and every changed context/documentation file. If the checker
reports the repository's known stale graph warning only, record it verbatim; fix any new Download List
context drift before continuing.

- [ ] **Step 6: Run final focused and repository-level verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/download-list-card-renderers.int.spec.tsx tests/int/download-list-theme.int.spec.tsx tests/int/download-list-thumbnail.int.spec.tsx tests/int/download-list-client.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList src/endpoints/seed/fixtures/downloadList.ts tests/int/download-list*.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList src/endpoints/seed/fixtures/downloadList.ts tests/int/download-list*.spec.tsx docs/authoring/download-list.md docs/feature-inventory.md docs/block-system.md docs/project-inventory.md docs/superpowers/specs/2026-08-20-download-list-simplified-layout-design.md docs/superpowers/plans/2026-08-20-download-list-simplification.md
pnpm exec tsx scripts/detect-unregistered-components.ts
git diff --check
```

Expected: all five Download List suites, TypeScript, ESLint, Prettier, component registration, and diff
checks pass. Report any pre-existing project-context warning separately. Do not stage or commit the
result.
