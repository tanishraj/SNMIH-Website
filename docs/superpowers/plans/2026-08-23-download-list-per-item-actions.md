# Download List Per-Item Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Download List document an ordered list of up to two independently configured Download, View, or Custom actions with clear conditional authoring and button-only icons.

**Architecture:** Add a new `documentActions` Payload array as the sole new-authoring API and retain the current automatic, `customAction`, and older `actions` fields as hidden compatibility inputs. Centralize precedence and normalization in `resolveActions.ts`, pass only serializable action metadata to the existing presentation layer, and resolve configurable Lucide icons safely at render time.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react, Vitest, Testing Library.

## Global Constraints

- Each document accepts zero to two ordered `documentActions` rows.
- Action types are Download, View, and Custom.
- Download and View are buttons with fixed icons; Custom can be Link or Button.
- Only button actions render icons; Custom Link remains visible text in every presentation.
- Labelled grids show button label plus icon; Inline and Grid Icon-only show compact icon buttons.
- Custom Button requires a configurable Lucide icon and falls back to `ArrowUpRight` for invalid historical values.
- Duplicate Download and duplicate View rows are invalid; two Custom rows require different destinations.
- Any authored `documentActions` list is authoritative and never reveals hidden legacy fallbacks.
- Documents without `documentActions` preserve the existing compatibility chain and visual output.
- Preserve the approved Stacked/Split section behavior and all four document presentations.
- Add no dependency, perform no content migration, preserve unrelated working-tree edits, and create no commit or staged change.

---

## File Map

- `src/blocks/DownloadList/config.ts` — new conditional action-row schema, validation, and hidden compatibility controls.
- `src/blocks/DownloadList/types.ts` — serializable normalized action contract including configurable icon name.
- `src/blocks/DownloadList/resolveActions.ts` — authoritative-new-list resolution and legacy precedence boundary.
- `src/blocks/DownloadList/Component.tsx` — passes each document's new and compatibility fields to the resolver.
- `src/blocks/DownloadList/Presentation.tsx` — renders text links separately from labelled or icon-only buttons and safely resolves custom icons.
- `tests/int/download-list.int.spec.tsx` — schema, validation, precedence, rendering, accessibility, theme, and regression contracts.
- `src/payload-types.ts` — generated Payload interfaces.
- `docs/guides/blocks.md` — editor-facing Download List contract.
- `docs/architecture/feature-inventory.md` — maintained runtime and compatibility summary.

---

### Task 1: Build the per-document Payload action editor

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/config.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Produces: optional `downloads[].documentActions`, maximum two rows.
- Produces: row fields `actionType`, `label`, `viewOpenInNewTab`, `linkType`, `page`, `url`, `openInNewTab`, `mode`, `variant`, and `icon`.
- Preserves: hidden `downloads[].customAction`, hidden `downloads[].actions`, and hidden block automatic fallback fields.

- [ ] **Step 1: Replace compatibility-field schema assertions with failing per-item action-flow tests**

In `DownloadListBlock schema`, add imports for `CollapsibleField` and `RadioField`, then replace the current automatic/custom-action assertions with:

```tsx
it('offers at most two ordered actions per document', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const actions = findNamedField(downloads.fields, 'documentActions') as ArrayField
  const actionType = findNamedField(actions.fields, 'actionType') as RadioField

  expect(actions).toMatchObject({ type: 'array', maxRows: 2 })
  expect(actionType).toMatchObject({
    type: 'radio',
    defaultValue: 'download',
    required: true,
    options: [
      { label: 'Download', value: 'download' },
      { label: 'View', value: 'view' },
      { label: 'Custom', value: 'custom' },
    ],
  })
})

it('reveals only fields relevant to the selected action type', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const actions = findNamedField(downloads.fields, 'documentActions') as ArrayField
  const viewOpenInNewTab = findNamedField(actions.fields, 'viewOpenInNewTab')
  const linkType = findNamedField(actions.fields, 'linkType')
  const mode = findNamedField(actions.fields, 'mode')
  const variant = findNamedField(actions.fields, 'variant')
  const icon = findNamedField(actions.fields, 'icon')

  expect(viewOpenInNewTab?.admin?.condition?.({}, { actionType: 'view' }, {} as never)).toBe(true)
  expect(viewOpenInNewTab?.admin?.condition?.({}, { actionType: 'download' }, {} as never)).toBe(
    false,
  )
  expect(linkType?.admin?.condition?.({}, { actionType: 'custom' }, {} as never)).toBe(true)
  expect(mode?.admin?.condition?.({}, { actionType: 'custom' }, {} as never)).toBe(true)
  expect(
    variant?.admin?.condition?.({}, { actionType: 'custom', mode: 'button' }, {} as never),
  ).toBe(true)
  expect(icon?.admin?.condition?.({}, { actionType: 'custom', mode: 'button' }, {} as never)).toBe(
    true,
  )
  expect(icon?.admin?.condition?.({}, { actionType: 'custom', mode: 'link' }, {} as never)).toBe(
    false,
  )
})

it('hides every compatibility action control from new authoring', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const currentCustomAction = findNamedField(downloads.fields, 'customAction') as ArrayField
  const legacyActions = findNamedField(downloads.fields, 'actions') as ArrayField
  const automaticFallback = DownloadListBlock.fields
    .flatMap((field) => (field.type === 'tabs' ? field.tabs.flatMap((tab) => tab.fields) : [field]))
    .find(
      (field): field is CollapsibleField =>
        field.type === 'collapsible' && field.label === 'Automatic Action Fallback',
    )

  expect(currentCustomAction.admin?.hidden).toBe(true)
  expect(legacyActions.admin?.hidden).toBe(true)
  expect(automaticFallback?.admin?.hidden).toBe(true)
  for (const name of ['showViewAction', 'openViewInNewTab', 'showDownloadAction']) {
    expect(findNamedField(DownloadListBlock.fields, name)?.validate).toBeUndefined()
  }
})
```

- [ ] **Step 2: Add failing validation tests for destinations, duplicate built-ins, and duplicate Custom destinations**

Add:

```tsx
it('validates document action destinations and duplicate choices', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const actions = findNamedField(downloads.fields, 'documentActions') as ArrayField
  const validate = actions.validate

  expect(typeof validate).toBe('function')
  if (typeof validate !== 'function') return

  expect(validate([{ actionType: 'download' }], { siblingData: { file: null } } as never)).toBe(
    'Download action 1 requires File Upload.',
  )
  expect(
    validate([{ actionType: 'view' }], {
      siblingData: { externalUrl: '', file: null },
    } as never),
  ).toBe('View action 1 requires View URL or File Upload.')
  expect(
    validate([{ actionType: 'download' }, { actionType: 'download' }], {
      siblingData: { file: 'media-id' },
    } as never),
  ).toBe('Add Download only once per document.')
  expect(
    validate(
      [
        { actionType: 'custom', label: 'First', linkType: 'custom', url: '/notice' },
        { actionType: 'custom', label: 'Second', linkType: 'custom', url: ' /notice ' },
      ],
      { siblingData: {} } as never,
    ),
  ).toBe('Custom actions must use different destinations.')
  expect(
    validate(
      [
        { actionType: 'view' },
        {
          actionType: 'custom',
          icon: 'ExternalLink',
          label: 'Admissions',
          linkType: 'custom',
          mode: 'button',
          url: '/admissions',
        },
      ],
      { siblingData: { externalUrl: '/viewer' } } as never,
    ),
  ).toBe(true)
})
```

- [ ] **Step 3: Run the schema suite and verify the new tests fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadListBlock schema"
```

Expected: FAIL because `documentActions` does not exist and compatibility controls remain visible.

- [ ] **Step 4: Add exact conditional helpers and document-action validation**

In `config.ts`, import `Condition`, `createIconField`, `buttonVariantOptions`, and `buttonVariantDescription`. Add these local contracts and helpers:

```ts
type DocumentActionSiblingData = {
  actionType?: 'custom' | 'download' | 'view' | null
  linkType?: 'custom' | 'page' | null
  mode?: 'button' | 'link' | null
}

type DocumentActionValue = DocumentActionSiblingData & {
  icon?: string | null
  label?: string | null
  page?: unknown
  url?: string | null
}

type DownloadItemSiblingData = {
  externalUrl?: string | null
  file?: unknown
}

const isViewAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'view'
const isCustomAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom'
const isCustomPageAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom' && siblingData?.linkType === 'page'
const isCustomUrlAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom' && siblingData?.linkType === 'custom'
const isCustomButtonAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom' && siblingData?.mode === 'button'

const getCustomDestinationKey = (action: DocumentActionValue): string | undefined => {
  if (action.linkType === 'custom') {
    const url = action.url?.trim()
    return url ? `url:${url}` : undefined
  }
  if (action.linkType === 'page' && action.page) {
    const page = action.page
    const id = typeof page === 'object' && page && 'id' in page ? page.id : page
    return id !== undefined && id !== null ? `page:${String(id)}` : undefined
  }
  return undefined
}

const validateDocumentActions = (
  value: unknown,
  { siblingData }: { siblingData?: DownloadItemSiblingData },
) => {
  const actions = Array.isArray(value) ? (value as DocumentActionValue[]).slice(0, 2) : []
  const actionTypes = actions.map((action) => action.actionType)

  for (const type of ['download', 'view'] as const) {
    if (actionTypes.filter((actionType) => actionType === type).length > 1) {
      return `Add ${type === 'download' ? 'Download' : 'View'} only once per document.`
    }
  }

  const customDestinations: string[] = []
  for (const [index, action] of actions.entries()) {
    const position = index + 1
    if (action.actionType === 'download' && !siblingData?.file) {
      return `Download action ${position} requires File Upload.`
    }
    if (action.actionType === 'view' && !siblingData?.file && !siblingData?.externalUrl?.trim()) {
      return `View action ${position} requires View URL or File Upload.`
    }
    if (action.actionType === 'custom') {
      if (!action.label?.trim()) return `Custom action ${position} requires a label.`
      const destination = getCustomDestinationKey(action)
      if (!destination) return `Custom action ${position} requires a destination.`
      if (action.mode === 'button' && !action.icon?.trim()) {
        return `Custom Button action ${position} requires an icon.`
      }
      customDestinations.push(destination)
    }
  }

  return new Set(customDestinations).size === customDestinations.length
    ? true
    : 'Custom actions must use different destinations.'
}
```

- [ ] **Step 5: Define the new `documentActionsField` with concise conditional fields**

Add this array next to the hidden legacy action declarations:

```ts
const customButtonIconBase = createIconField({
  label: 'Button Icon',
  description: 'Required for Custom Button. Enter a Lucide icon name such as ExternalLink.',
})

const documentActionsField: ArrayField = {
  name: 'documentActions',
  label: 'Document Actions',
  type: 'array',
  maxRows: 2,
  validate: validateDocumentActions,
  admin: {
    initCollapsed: true,
    description: 'Add up to two ordered Download, View, or Custom actions.',
  },
  fields: [
    {
      name: 'actionType',
      label: 'Action Type',
      type: 'radio',
      defaultValue: 'download',
      required: true,
      options: [
        { label: 'Download', value: 'download' },
        { label: 'View', value: 'view' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: { layout: 'horizontal' },
    } satisfies RadioField,
    {
      name: 'label',
      type: 'text',
      admin: { description: 'Download and View use their action name when left empty.' },
    },
    {
      name: 'viewOpenInNewTab',
      label: 'Open View in New Tab',
      type: 'checkbox',
      defaultValue: true,
      admin: { condition: isViewAction },
    } satisfies CheckboxField,
    {
      name: 'linkType',
      label: 'Custom Destination',
      type: 'radio',
      defaultValue: 'page',
      options: [
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
      admin: { condition: isCustomAction, layout: 'horizontal' },
    } satisfies RadioField,
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: isCustomPageAction },
    },
    {
      name: 'url',
      label: 'Custom URL',
      type: 'text',
      admin: { condition: isCustomUrlAction },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: isCustomAction },
    } satisfies CheckboxField,
    {
      name: 'mode',
      label: 'Display As',
      type: 'select',
      defaultValue: 'link',
      options: [
        { label: 'Link', value: 'link' },
        { label: 'Button', value: 'button' },
      ],
      admin: { condition: isCustomAction },
    } satisfies SelectField,
    {
      name: 'variant',
      label: 'Button Variant',
      type: 'select',
      defaultValue: 'default',
      options: buttonVariantOptions,
      admin: {
        condition: isCustomButtonAction,
        description: buttonVariantDescription,
      },
    } satisfies SelectField,
    {
      ...customButtonIconBase,
      admin: {
        ...customButtonIconBase.admin,
        condition: isCustomButtonAction,
      },
    },
  ],
}
```

Insert the new `documentActionsField` after File Type Label. Rename the existing variable for the hidden `actions` array to `legacyActionsField` so the two declarations cannot collide. Wrap the current `customAction` helper output in a `legacyCustomActionField` whose `admin.hidden` is true, retain the existing hidden `actions`, and hide the complete Automatic Action Fallback collapsible. Remove `validateActionAvailability` and both checkbox `validate` assignments while preserving their stored names and defaults.

- [ ] **Step 6: Regenerate types and run schema tests**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadListBlock schema"
```

Expected: all Download List schema tests PASS and generated `DownloadListBlock` includes optional `documentActions` with at most two runtime rows.

---

### Task 2: Make the new action list authoritative in the resolver

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/types.ts`
- Modify: `src/blocks/DownloadList/resolveActions.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`

**Interfaces:**

- Produces: `DownloadDocumentActionInput` for new Payload rows.
- Produces: `resolveDocumentActions(input: ResolveDocumentActionsInput): ResolvedDownloadAction[]`.
- Extends: `ResolvedDownloadAction.icon?: string` as serializable render metadata.
- Guarantees: a non-empty `documentActions` array suppresses every compatibility fallback, even when its rows are invalid.

- [ ] **Step 1: Add failing resolver tests for independent choices, order, defaults, Custom modes, and authoritative invalid rows**

Replace positional calls to `resolveDocumentActions` with the object API and add:

```tsx
it('resolves new per-document actions in editor order with built-in defaults', () => {
  expect(
    resolveDocumentActions({
      documentActions: [
        { actionType: 'view', viewOpenInNewTab: false },
        { actionType: 'download', label: 'Save PDF' },
      ],
      fallback,
    }),
  ).toEqual([
    {
      href: '/fallback',
      icon: 'Eye',
      kind: 'view',
      label: 'View',
      mode: 'button',
      openInNewTab: false,
      showArrow: false,
      variant: 'default',
    },
    {
      href: '/api/media/file/fallback.pdf',
      icon: 'Download',
      kind: 'download',
      label: 'Save PDF',
      mode: 'button',
      openInNewTab: false,
      showArrow: false,
      variant: 'default',
    },
  ])
})

it('resolves Custom Link without an icon and Custom Button with its configured icon', () => {
  expect(
    resolveDocumentActions({
      documentActions: [
        {
          actionType: 'custom',
          label: 'Requirements',
          linkType: 'custom',
          mode: 'link',
          url: '/requirements',
        },
        {
          actionType: 'custom',
          icon: 'ExternalLink',
          label: 'Apply',
          linkType: 'custom',
          mode: 'button',
          openInNewTab: true,
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
      icon: 'ExternalLink',
      kind: 'custom',
      label: 'Apply',
      mode: 'button',
      openInNewTab: true,
      showArrow: false,
      variant: 'outline',
    },
  ])
})

it('does not expose hidden fallbacks when an authored new list is unusable', () => {
  expect(
    resolveDocumentActions({
      customActions: [{ label: 'Legacy custom', linkType: 'custom', url: '/legacy-custom' }],
      documentActions: [{ actionType: 'download' }],
      fallback: { ...fallback, downloadHref: undefined },
      legacyActions: [
        { actionType: 'link', label: 'Legacy manual', linkType: 'custom', url: '/legacy' },
      ],
    }),
  ).toEqual([])
})
```

Retain explicit tests for the compatibility sequence: current `customAction` plus automatic actions, old manual replacement, and automatic fallback.

- [ ] **Step 2: Run resolver tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadList action resolution"
```

Expected: FAIL because the resolver has no new-list input and still uses positional parameters.

- [ ] **Step 3: Extend the serializable action type**

In `types.ts`, add the optional icon name:

```ts
export type ResolvedDownloadAction = {
  href: string
  icon?: string
  kind: DownloadActionKind
  label: string
  mode: CmsActionMode
  openInNewTab: boolean
  showArrow: boolean
  variant: CmsActionVariant
}
```

- [ ] **Step 4: Define the new resolver input and authoritative resolver**

In `resolveActions.ts`, add:

```ts
export type DownloadDocumentActionInput = CmsLinkValue & {
  actionType?: 'custom' | 'download' | 'view' | null
  icon?: string | null
  label?: string | null
  mode?: 'button' | 'link' | null
  variant?: CmsActionVariant | null
  viewOpenInNewTab?: boolean | null
}

type ResolveDocumentActionsInput = {
  customActions?: CmsActionValue[] | null
  documentActions?: DownloadDocumentActionInput[] | null
  fallback: AutomaticDownloadActionFallback
  legacyActions?: DownloadManualActionInput[] | null
}

const resolveNewDocumentActions = (
  actions: DownloadDocumentActionInput[],
  fallback: AutomaticDownloadActionFallback,
): ResolvedDownloadAction[] =>
  actions.slice(0, 2).flatMap((action): ResolvedDownloadAction[] => {
    if (action.actionType === 'download') {
      return fallback.downloadHref
        ? [
            createResolvedAction({
              href: fallback.downloadHref,
              icon: 'Download',
              kind: 'download',
              label: action.label?.trim() || 'Download',
              mode: 'button',
              openInNewTab: false,
            }),
          ]
        : []
    }

    if (action.actionType === 'view') {
      return fallback.viewHref
        ? [
            createResolvedAction({
              href: fallback.viewHref,
              icon: 'Eye',
              kind: 'view',
              label: action.label?.trim() || 'View',
              mode: 'button',
              openInNewTab: action.viewOpenInNewTab ?? true,
            }),
          ]
        : []
    }

    if (action.actionType !== 'custom') return []
    const [resolved] = resolveCmsActions([action])
    if (!resolved) return []
    const mode = action.mode === 'button' ? 'button' : 'link'
    return [
      {
        ...resolved,
        ...(mode === 'button' && action.icon?.trim() ? { icon: action.icon.trim() } : {}),
        kind: 'custom',
        mode,
        showArrow: false,
      },
    ]
  })

export function resolveDocumentActions({
  customActions,
  documentActions,
  fallback,
  legacyActions,
}: ResolveDocumentActionsInput): ResolvedDownloadAction[] {
  if ((documentActions ?? []).length > 0) {
    return resolveNewDocumentActions(documentActions ?? [], fallback)
  }

  const resolvedCustomActions = resolveCustomAction(customActions)
  if (resolvedCustomActions.length === 0) {
    const resolvedLegacyActions = resolveManualActions(legacyActions)
    if (resolvedLegacyActions.length > 0) return resolvedLegacyActions
  }

  const automaticActions = resolveAutomaticActions(fallback)
  return [...automaticActions, ...resolvedCustomActions]
}
```

Extract the current automatic View/Download construction into `resolveAutomaticActions()`. Preserve its current legacy modes and labels exactly: View remains a link named `View Document`, Download remains a button named `Download`.

- [ ] **Step 5: Pass all action generations from `Component.tsx`**

Extend `DownloadItem`:

```ts
documentActions?: DownloadDocumentActionInput[] | null
```

Replace the resolver call with:

```ts
const documentActions = resolveDocumentActions({
  customActions: item.customAction,
  documentActions: item.documentActions,
  fallback: {
    downloadHref,
    openViewInNewTab: openViewInNewTab ?? true,
    showDownload: showDownloadAction ?? true,
    showView: showViewAction ?? false,
    viewHref,
  },
  legacyActions: item.actions,
})
```

Keep the existing empty-action document omission guard.

- [ ] **Step 6: Run the resolver suite and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadList action resolution"
pnpm exec tsc --noEmit
```

Expected: resolver tests PASS. TypeScript can identify Presentation branches that require Task 3's icon-aware rendering.

---

### Task 3: Render links as links and buttons with the correct icons

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`

**Interfaces:**

- Consumes: `ResolvedDownloadAction.icon?: string` from Task 2.
- Consumes: `resolveLucideIcon(name)` from `src/blocks/shared/resolveLucideIcon.ts`.
- Produces: mixed action groups in which links remain text and buttons adapt between labelled and icon-only modes.

- [ ] **Step 1: Add failing labelled-grid rendering tests**

Add:

```tsx
it('renders ordered per-document buttons with labels and fixed icons in labelled grids', () => {
  render(
    <DownloadListBlockComponent
      displayMode="cards"
      downloads={[
        {
          documentActions: [
            { actionType: 'view', label: 'Preview' },
            { actionType: 'download', label: 'Save PDF' },
          ],
          externalUrl: '/preview',
          file: sharedMedia,
          title: 'Policy',
        },
      ]}
    />,
  )

  const actions = screen.getAllByRole('link')
  expect(actions.map((action) => action.textContent)).toEqual(['Preview', 'Save PDF'])
  expect(actions[0]?.querySelector('[data-document-action-icon="eye"]')).toBeTruthy()
  expect(actions[1]?.querySelector('[data-document-action-icon="arrow-down"]')).toBeTruthy()
})

it('renders Custom Link as text and Custom Button with its configured icon', () => {
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
              url: '/requirements',
            },
            {
              actionType: 'custom',
              icon: 'ExternalLink',
              label: 'Apply',
              linkType: 'custom',
              mode: 'button',
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
  expect(link.querySelector('svg')).toBeNull()
  expect(button.querySelector('.lucide-external-link')).toBeTruthy()
})
```

- [ ] **Step 2: Add failing compact mixed-action and icon-fallback tests**

Add:

```tsx
it.each([
  ['list', 'labelled'],
  ['openGrid', 'icons'],
] as const)('keeps Custom Link textual while compacting buttons in %s', (displayMode, display) => {
  render(
    <DownloadListBlockComponent
      displayMode={displayMode}
      downloads={[
        {
          documentActions: [
            {
              actionType: 'custom',
              label: 'Requirements',
              linkType: 'custom',
              mode: 'link',
              url: '/requirements',
            },
            { actionType: 'view' },
          ],
          externalUrl: '/preview',
          title: 'Policy',
        },
      ]}
      gridActionDisplay={display}
    />,
  )

  const textLink = screen.getByRole('link', { name: 'Requirements' })
  const viewButton = screen.getByRole('link', { name: 'View' })
  expect(textLink.getAttribute('title')).toBeNull()
  expect(textLink.textContent).toBe('Requirements')
  expect(textLink.querySelector('svg')).toBeNull()
  expect(viewButton.getAttribute('title')).toBe('View')
  expect(viewButton.textContent).toBe('')
  expect(viewButton.querySelector('[data-document-action-icon="eye"]')).toBeTruthy()
})

it('falls back to ArrowUpRight for an unresolved Custom Button icon', () => {
  render(
    <DownloadListBlockComponent
      displayMode="cards"
      downloads={[
        {
          documentActions: [
            {
              actionType: 'custom',
              icon: 'NotARealLucideIcon',
              label: 'Apply',
              linkType: 'custom',
              mode: 'button',
              url: '/apply',
            },
          ],
          title: 'Admissions',
        },
      ]}
    />,
  )

  expect(
    screen
      .getByRole('link', { name: 'Apply' })
      .querySelector('[data-document-action-icon="arrow-up-right"]'),
  ).toBeTruthy()
})
```

- [ ] **Step 3: Run rendering tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadList rendering"
```

Expected: FAIL because every Inline/Icon-only action is currently compacted and Custom Button always uses `ArrowUpRight`.

- [ ] **Step 4: Introduce one button-icon renderer**

In `Presentation.tsx`, import `resolveLucideIcon`. Replace `InlineActionIcon` with this final implementation, resolving a configurable icon only once:

```tsx
function DocumentActionIcon({ action }: { action: ResolvedDownloadAction }) {
  if (action.kind === 'download') return <AnimatedDownloadIcon />

  const CustomIcon = action.kind === 'custom' ? resolveLucideIcon(action.icon) : undefined
  const Icon = action.kind === 'view' ? Eye : (CustomIcon ?? ArrowUpRight)
  const iconName =
    action.kind === 'view' ? 'eye' : CustomIcon ? action.icon?.trim() : 'arrow-up-right'

  return (
    <Icon
      aria-hidden="true"
      className="size-4"
      data-document-action-icon={iconName}
      strokeWidth={2.25}
    />
  )
}
```

- [ ] **Step 5: Separate link semantics from compact button semantics**

Inside `DocumentActions`, replace `isIconOnly` with:

```ts
const isLink = action.mode === 'link'
const isCompactButton = !isLink && (layout === 'inline' || display === 'icons')
const buttonVariant = action.mode === 'button' ? action.variant : 'default'
```

Use these branches:

```tsx
className={cn(
  isLink
    ? cn(
        buttonVariants({ variant: 'link' }),
        'h-auto px-0 py-0 text-sm font-semibold underline decoration-current decoration-2 underline-offset-4',
        linkClassName,
      )
    : isCompactButton
      ? buttonVariants({ size: 'icon-sm', variant: buttonVariant })
      : buttonVariants({ size: 'sm', variant: buttonVariant }),
  'group/button',
  isLink ? undefined : buttonClassNames?.[buttonVariant],
)}
```

Set `aria-label` and `title` only when `isCompactButton`. Render content with:

```tsx
{
  isLink ? (
    <span data-document-action-label="true">{action.label}</span>
  ) : isCompactButton ? (
    <DocumentActionIcon action={action} />
  ) : (
    <>
      <span data-document-action-label="true">{action.label}</span>
      <DocumentActionIcon action={action} />
    </>
  )
}
```

Keep `download` only on Download actions and preserve safe new-tab attributes.

- [ ] **Step 6: Run the focused suite, neighboring presentation contracts, and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: all selected suites PASS and TypeScript exits with code 0.

---

### Task 4: Update documentation and complete repository checks

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Verify: all files changed in Tasks 1–3

**Interfaces:**

- Consumes: final field labels, action precedence, and rendering behavior.
- Produces: accurate operator and architectural contracts.

- [ ] **Step 1: Replace the Download List operator action guidance**

In `docs/guides/blocks.md`, document:

```md
Each document owns an ordered **Document Actions** list with at most two entries. Download uses the uploaded file and a fixed Download icon; View uses View URL then File Upload and a fixed Eye icon. Both are buttons with optional labels. Custom actions use an internal Page or Custom URL and can be a text Link or a Button with the shared variants and a required Lucide icon. Duplicate Download or View actions are rejected.

Labelled grids show button labels with icons. Inline List and Grid Icon-only compact buttons to accessible icon controls, while Custom Link always remains a visible underlined text link. New document actions suppress hidden legacy fallbacks. Documents without the new list preserve existing Custom Action, manual-action, and automatic-fallback behavior without migration.
```

Update the catalog row to say `up to two ordered per-document Download, View, or Custom actions` instead of one optional custom action.

- [ ] **Step 2: Update the feature inventory action contract**

In `docs/architecture/feature-inventory.md`, replace the additive fixed-action description with this concrete contract: `downloads[].documentActions` is the authoritative ordered list when non-empty; it has at most two rows, disallows duplicate Download/View rows, and requires distinct destinations for two Custom rows. Download and View are fixed-icon buttons; Custom Link stays textual; Custom Button uses its configured Lucide icon. Labelled grids show labels and icons, whereas Inline List and Grid Icon-only compact only button actions. When the new list is empty, compatibility precedence is current `customAction` plus automatic actions, then older manual `actions`, then automatic fallback. Preserve the existing split, presentation, document-icon, badge, and column documentation.

- [ ] **Step 3: Format and regenerate Payload types**

Run:

```bash
pnpm exec prettier --write src/blocks/DownloadList/config.ts src/blocks/DownloadList/types.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-23-download-list-per-item-actions-design.md docs/superpowers/plans/2026-08-23-download-list-per-item-actions.md
pnpm generate:types
```

Expected: formatting succeeds and generated types match the final schema.

- [ ] **Step 4: Run final focused and static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-23-download-list-per-item-actions-design.md docs/superpowers/plans/2026-08-23-download-list-per-item-actions.md
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/Presentation.tsx
git diff --check
```

Expected: tests, TypeScript, ESLint, Prettier, and diff checks pass; the detector returns `[]`.

- [ ] **Step 5: Complete the project-context handoff without overwriting user work**

Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md`, run:

```bash
pnpm project-context:check
git diff --cached --quiet
git status --short
```

Expected: no staged changes. The previously denied project-context updater is not retried without new explicit approval; report the known stale inventory and knowledge-graph warning if the check remains non-zero. Report all unrelated repository-wide failures separately from the focused feature result.
