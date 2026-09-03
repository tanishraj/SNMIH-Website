# Download List Split Layout and Card Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive section-level split layout and one additive, fully configurable custom action to every Download List document while preserving existing saved manual actions.

**Architecture:** Extend the existing Payload block schema with three section-layout fields and a shared one-row `customAction` field. Normalize automatic, custom, and legacy actions in `resolveActions.ts`, then keep presentation components concerned only with semantics and styling. Compose the introduction and document presentation in a responsive 40/60 grid inside the server component so content order remains accessible and footer actions remain section-wide.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS 4, lucide-react, Vitest, Testing Library.

## Global Constraints

- Preserve Stacked as the default layout and existing Download List visual output where the new fields are unset.
- Split uses an introduction/document ratio of `2fr / 3fr`, supports introduction Left or Right, and supports Top, Center, or Bottom vertical alignment.
- Mobile always renders the introduction before the document collection.
- Keep all four existing display modes and the existing 1–8 Columns setting.
- Add exactly one optional custom action per document using the shared Link/Button and button-variant fields.
- Modern action order is View, Download, Custom; an unavailable action is skipped independently.
- Keep the existing `actions` data field registered and hidden; do not migrate or delete saved data.
- If no new Custom Action resolves, valid legacy actions retain their current replacement behavior.
- Reuse shared action, surface, spacing, and appearance utilities; add no dependency.
- Preserve all unrelated working-tree edits and create no git commit.

---

## File Map

- `src/blocks/DownloadList/config.ts` — Payload editor fields, conditions, and hidden legacy schema.
- `src/blocks/DownloadList/types.ts` — normalized layout and action contracts shared by server and client renderers.
- `src/blocks/DownloadList/resolveActions.ts` — compatibility boundary that resolves automatic, custom, and legacy actions.
- `src/blocks/DownloadList/Component.tsx` — server normalization and Stacked/Split section composition.
- `src/blocks/DownloadList/Presentation.tsx` — labelled and icon-only rendering for View, Download, and Custom actions.
- `tests/int/download-list.int.spec.tsx` — schema, resolver, semantics, layout, and regression coverage.
- `src/payload-types.ts` — generated Payload types after the schema changes.
- `docs/guides/blocks.md` — operator-facing Download List behavior.
- `docs/architecture/feature-inventory.md` — architectural feature summary.

---

### Task 1: Add the editor schema and runtime contracts

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/DownloadList/types.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Produces: `DownloadSectionLayout = 'split' | 'stacked'`.
- Produces: `DownloadIntroPosition = 'left' | 'right'`.
- Produces: `DownloadIntroVerticalAlignment = 'bottom' | 'center' | 'top'`.
- Produces: `ResolvedDownloadAction` with `kind`, `mode`, `variant`, and `showArrow` presentation metadata.
- Consumes: `createContentActionsField({ name: 'customAction', maxRows: 1 })` from the shared action-field builder.

- [ ] **Step 1: Add failing schema tests for the split controls, new custom action, and hidden legacy field**

Add tests in the existing `DownloadListBlock schema` suite:

```tsx
it('offers a stacked or split section with responsive introduction placement', () => {
  const sectionLayout = findNamedField(DownloadListBlock.fields, 'sectionLayout') as SelectField
  const introPosition = findNamedField(DownloadListBlock.fields, 'introPosition') as SelectField
  const introVerticalAlignment = findNamedField(
    DownloadListBlock.fields,
    'introVerticalAlignment',
  ) as SelectField

  expect(sectionLayout).toMatchObject({
    type: 'select',
    defaultValue: 'stacked',
    required: true,
    options: [
      { label: 'Stacked', value: 'stacked' },
      { label: 'Split', value: 'split' },
    ],
  })
  expect(introPosition.admin?.condition?.({}, { sectionLayout: 'split' }, {} as never)).toBe(true)
  expect(introPosition.admin?.condition?.({}, { sectionLayout: 'stacked' }, {} as never)).toBe(
    false,
  )
  expect(introVerticalAlignment).toMatchObject({
    defaultValue: 'top',
    options: [
      { label: 'Top', value: 'top' },
      { label: 'Center', value: 'center' },
      { label: 'Bottom', value: 'bottom' },
    ],
  })
})

it('adds one shared custom action and preserves legacy actions as hidden data', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const customAction = findNamedField(downloads.fields, 'customAction') as ArrayField
  const legacyActions = findNamedField(downloads.fields, 'actions') as ArrayField

  expect(customAction).toMatchObject({ type: 'array', maxRows: 1 })
  expect(findNamedField(customAction.fields, 'mode')).toMatchObject({
    type: 'select',
    defaultValue: 'link',
    options: [
      { label: 'Link', value: 'link' },
      { label: 'Button', value: 'button' },
    ],
  })
  expect(findNamedField(customAction.fields, 'variant')).toMatchObject({
    type: 'select',
    defaultValue: 'default',
  })
  expect(legacyActions.admin?.hidden).toBe(true)
  expect(legacyActions.maxRows).toBe(2)
})
```

- [ ] **Step 2: Run the focused tests and verify the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
```

Expected: FAIL because `sectionLayout`, `introPosition`, `introVerticalAlignment`, and `customAction` do not exist and the legacy field is not hidden.

- [ ] **Step 3: Add exact section conditions and fields to `config.ts`**

Extend sibling data and add a condition near the existing helpers:

```ts
type DownloadListSiblingData = {
  displayMode?: 'cards' | 'compact' | 'framedGrid' | 'list' | 'openGrid' | null
  sectionLayout?: 'split' | 'stacked' | null
  showDownloadAction?: boolean | null
  showViewAction?: boolean | null
}

const isSplitSection = (_data: unknown, siblingData: DownloadListSiblingData) =>
  siblingData?.sectionLayout === 'split'
```

Insert `createContentActionsField` before the legacy field in each document's Content tab and hide the old field without changing its name or children:

```ts
createContentActionsField({
  name: 'customAction',
  label: 'Custom Action',
  maxRows: 1,
}),
documentActionsField,
```

Change only the legacy field's admin object:

```ts
admin: {
  hidden: true,
  initCollapsed: true,
  description:
    'Legacy action data retained for existing content. Use Custom Action for new content.',
},
```

Add these fields to Theme Settings after `createBlockAppearanceFields()` and before `displayMode`:

```ts
{
  name: 'sectionLayout',
  label: 'Section Layout',
  type: 'select',
  defaultValue: 'stacked',
  required: true,
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Split', value: 'split' },
  ],
} satisfies SelectField,
{
  name: 'introPosition',
  label: 'Introduction Position',
  type: 'select',
  defaultValue: 'left',
  required: true,
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
  admin: {
    condition: isSplitSection,
    description: 'Choose which side contains the section introduction on large screens.',
  },
} satisfies SelectField,
{
  name: 'introVerticalAlignment',
  label: 'Introduction Vertical Alignment',
  type: 'select',
  defaultValue: 'top',
  required: true,
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ],
  admin: {
    condition: isSplitSection,
    description: 'Position the introduction relative to the downloads on large screens.',
  },
} satisfies SelectField,
```

- [ ] **Step 4: Extend the normalized runtime types**

Update `src/blocks/DownloadList/types.ts`:

```ts
import type { CmsActionMode, CmsActionVariant } from '@/lib/cmsLinks'

export type DownloadActionKind = 'custom' | 'download' | 'view'
export type DownloadSectionLayout = 'split' | 'stacked'
export type DownloadIntroPosition = 'left' | 'right'
export type DownloadIntroVerticalAlignment = 'bottom' | 'center' | 'top'

export type ResolvedDownloadAction = {
  href: string
  kind: DownloadActionKind
  label: string
  mode: CmsActionMode
  openInNewTab: boolean
  showArrow: boolean
  variant: CmsActionVariant
}
```

Retain the other existing types unchanged.

- [ ] **Step 5: Regenerate Payload types and rerun the focused suite**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
```

Expected: schema tests PASS; resolver tests may fail to compile until Task 2 supplies the new normalized action fields.

---

### Task 2: Resolve modern and legacy actions deterministically

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/resolveActions.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`

**Interfaces:**

- Consumes: `CmsActionValue` and `resolveCmsActions()` from `src/lib/cmsLinks.ts`.
- Produces: `resolveDocumentActions(legacyActions, customActions, fallback): ResolvedDownloadAction[]`.
- Guarantees: modern order `view`, `download`, `custom` when one custom action resolves.
- Guarantees: legacy replacement behavior only when no custom action resolves.

- [ ] **Step 1: Replace resolver expectations with failing modern-action and compatibility tests**

Update existing resolver calls to pass `undefined` as the second argument and `fallback` as the third. Add these tests:

```tsx
it('appends one custom action after available automatic actions', () => {
  expect(
    resolveDocumentActions(
      undefined,
      [
        {
          label: 'Admission details',
          linkType: 'custom',
          mode: 'button',
          openInNewTab: true,
          showArrow: true,
          url: '/admissions',
          variant: 'outline',
        },
      ],
      fallback,
    ),
  ).toEqual([
    {
      href: '/fallback',
      kind: 'view',
      label: 'View Document',
      mode: 'link',
      openInNewTab: true,
      showArrow: false,
      variant: 'default',
    },
    {
      href: '/api/media/file/fallback.pdf',
      kind: 'download',
      label: 'Download',
      mode: 'button',
      openInNewTab: false,
      showArrow: false,
      variant: 'default',
    },
    {
      href: '/admissions',
      kind: 'custom',
      label: 'Admission details',
      mode: 'button',
      openInNewTab: true,
      showArrow: true,
      variant: 'outline',
    },
  ])
})

it('skips unavailable automatic actions without suppressing a valid custom action', () => {
  const result = resolveDocumentActions(
    undefined,
    [
      {
        label: 'Open notice',
        linkType: 'custom',
        mode: 'link',
        url: '/notice',
      },
    ],
    {
      showDownload: true,
      showView: true,
    },
  )

  expect(result.map((action) => action.kind)).toEqual(['custom'])
  expect(result[0]?.href).toBe('/notice')
})

it('retains legacy replacement behavior when no custom action resolves', () => {
  const result = resolveDocumentActions(
    [{ actionType: 'link', label: 'Historical link', linkType: 'custom', url: '/historical' }],
    undefined,
    fallback,
  )

  expect(result).toEqual([
    {
      href: '/historical',
      kind: 'view',
      label: 'Historical link',
      mode: 'link',
      openInNewTab: false,
      showArrow: false,
      variant: 'default',
    },
  ])
})
```

- [ ] **Step 2: Run the focused resolver tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadList action resolution"
```

Expected: FAIL because the resolver accepts two arguments and does not expose presentation metadata or additive custom actions.

- [ ] **Step 3: Implement the three-source resolver**

In `resolveActions.ts`, import `resolveCmsActions` and `CmsActionValue`. Normalize legacy actions with explicit defaults:

```ts
const createResolvedAction = (
  action: Omit<ResolvedDownloadAction, 'showArrow' | 'variant'> &
    Partial<Pick<ResolvedDownloadAction, 'showArrow' | 'variant'>>,
): ResolvedDownloadAction => ({
  ...action,
  showArrow: action.showArrow ?? false,
  variant: action.variant ?? 'default',
})
```

Map legacy links to `kind: 'view', mode: 'link'` and legacy downloads to `kind: 'download', mode: 'button'`. Add the modern custom resolver:

```ts
const resolveCustomAction = (actions?: CmsActionValue[] | null): ResolvedDownloadAction[] =>
  resolveCmsActions(actions)
    .slice(0, 1)
    .map((action) => ({
      ...action,
      kind: 'custom' as const,
      openInNewTab: Boolean(action.openInNewTab),
    }))
```

Replace the exported function with:

```ts
export function resolveDocumentActions(
  legacyActions: DownloadManualActionInput[] | null | undefined,
  customActions: CmsActionValue[] | null | undefined,
  fallback: AutomaticDownloadActionFallback,
): ResolvedDownloadAction[] {
  const resolvedCustomActions = resolveCustomAction(customActions)

  if (resolvedCustomActions.length === 0) {
    const resolvedLegacyActions = resolveManualActions(legacyActions)
    if (resolvedLegacyActions.length > 0) return resolvedLegacyActions
  }

  const resolvedActions: ResolvedDownloadAction[] = []
  if (fallback.showView === true && fallback.viewHref) {
    resolvedActions.push(
      createResolvedAction({
        href: fallback.viewHref,
        kind: 'view',
        label: 'View Document',
        mode: 'link',
        openInNewTab: fallback.openViewInNewTab ?? true,
      }),
    )
  }
  if (fallback.showDownload !== false && fallback.downloadHref) {
    resolvedActions.push(
      createResolvedAction({
        href: fallback.downloadHref,
        kind: 'download',
        label: 'Download',
        mode: 'button',
        openInNewTab: false,
      }),
    )
  }

  return [...resolvedActions, ...resolvedCustomActions]
}
```

- [ ] **Step 4: Pass the new document field through the server component**

Extend `DownloadItem` in `Component.tsx`:

```ts
type DownloadItem = {
  actions?: DownloadManualActionInput[] | null
  cardBackground?: string | null
  customAction?: CmsActionValue[] | null
  description?: string | null
  externalUrl?: string | null
  file?: string | number | Media | null
  fileType?: string | null
  id?: string | null
  title?: string | null
}
```

Update the call site:

```ts
const documentActions = resolveDocumentActions(item.actions, item.customAction, {
  downloadHref,
  openViewInNewTab: openViewInNewTab ?? true,
  showDownload: showDownloadAction ?? true,
  showView: showViewAction ?? false,
  viewHref,
})
```

The existing `documentActions.length === 0` guard now permits custom-only documents and continues to omit unusable rows.

- [ ] **Step 5: Run resolver tests and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadList action resolution"
pnpm exec tsc --noEmit
```

Expected: resolver tests PASS; TypeScript may still identify Presentation branches that need the new `custom` kind, which Task 3 resolves.

---

### Task 3: Render custom actions and the responsive section split

**Files:**

- Modify: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Modify: `src/blocks/DownloadList/Component.tsx`

**Interfaces:**

- Consumes: `ResolvedDownloadAction` from Task 1 and `resolveDocumentActions()` from Task 2.
- Produces: semantic labelled and icon-only document actions for all three action kinds.
- Produces: `data-download-section-layout`, `data-download-intro-position`, and `data-download-intro-vertical-alignment` test contracts.

- [ ] **Step 1: Add failing rendering tests for custom action semantics**

Add tests in the rendering suite:

```tsx
it('renders labelled custom links and buttons with configured presentation', () => {
  render(
    <DownloadListBlockComponent
      displayMode="cards"
      downloads={[
        {
          customAction: [
            {
              label: 'Admissions',
              linkType: 'custom',
              mode: 'button',
              showArrow: true,
              url: '/admissions',
              variant: 'outline',
            },
          ],
          file: sharedMedia,
          title: 'Policy',
        },
      ]}
      showViewAction
    />,
  )

  expect(screen.getByRole('link', { name: 'View Document' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Download' })).toBeTruthy()
  const custom = screen.getByRole('link', { name: 'Admissions' })
  expect(custom.getAttribute('data-document-action')).toBe('custom')
  expect(custom.className).toContain('border')
  expect(custom.querySelector('[data-icon="inline-end"]')).toBeTruthy()
})

it('uses an accessible destination icon for custom actions in compact modes', () => {
  render(
    <DownloadListBlockComponent
      displayMode="list"
      downloads={[
        {
          customAction: [
            { label: 'Admissions', linkType: 'custom', mode: 'link', url: '/admissions' },
          ],
          title: 'Policy',
        },
      ]}
    />,
  )

  const custom = screen.getByRole('link', { name: 'Admissions' })
  expect(custom.getAttribute('title')).toBe('Admissions')
  expect(custom.querySelector('[data-document-action-icon="arrow-up-right"]')).toBeTruthy()
})
```

- [ ] **Step 2: Add failing split composition tests**

Add:

```tsx
it.each(['top', 'center', 'bottom'] as const)(
  'renders a left split introduction aligned to %s',
  (introVerticalAlignment) => {
    const html = renderToStaticMarkup(
      <DownloadListBlockComponent
        description="Current notices"
        downloads={documents}
        introPosition="left"
        introVerticalAlignment={introVerticalAlignment}
        sectionLayout="split"
        title="Downloads"
      />,
    )

    expect(html).toContain('data-download-section-layout="split"')
    expect(html).toContain('data-download-intro-position="left"')
    expect(html).toContain(`data-download-intro-vertical-alignment="${introVerticalAlignment}"`)
    expect(html).toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
  },
)

it('keeps introduction first in markup when displayed on the right', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      downloads={documents}
      introPosition="right"
      sectionLayout="split"
      title="Downloads"
    />,
  )

  expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
  expect(html).toContain('data-download-intro-position="right"')
  expect(html.indexOf('data-download-intro="true"')).toBeLessThan(
    html.indexOf('data-download-collection="true"'),
  )
  expect(html).toContain('lg:col-start-2 lg:row-start-1')
  expect(html).toContain('lg:col-start-1 lg:row-start-1')
})

it('uses full width when split is selected without introduction content', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent downloads={documents} sectionLayout="split" />,
  )

  expect(html).toContain('data-download-section-layout="stacked"')
  expect(html).not.toContain('lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')
  expect(html).not.toContain('data-download-intro="true"')
})
```

- [ ] **Step 3: Run rendering tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx -t "DownloadList rendering"
```

Expected: FAIL because custom actions still use the old Link/Download branch and split composition is not implemented.

- [ ] **Step 4: Make `DocumentActions` presentation-aware**

In `Presentation.tsx`:

- import `ArrowUpRight` and `ActionButtonContent`;
- change `DocumentActionsProps.buttonClassName` to `buttonClassNames?: Partial<Record<CmsActionVariant, string>>`;
- pass `surface.button` from `GridDocumentItem`;
- render icon-only custom actions with `ArrowUpRight` and `data-document-action-icon="arrow-up-right"`;
- derive labelled link styling from `action.mode === 'link'`;
- derive button classes from `buttonVariants({ size: 'sm', variant: action.variant })` plus `buttonClassNames?.[action.variant]`;
- keep `download` only for `kind === 'download'`;
- render custom button content through `ActionButtonContent` so `showArrow` is honored.

Use this labelled-content branch:

```tsx
{
  action.kind === 'download' ? (
    <>
      <span data-document-action-label="true">{action.label}</span>
      <AnimatedDownloadIcon />
    </>
  ) : action.kind === 'custom' && action.mode === 'button' ? (
    <ActionButtonContent label={action.label} showArrow={action.showArrow} />
  ) : (
    <span data-document-action-label="true">{action.label}</span>
  )
}
```

Use this compact custom icon:

```tsx
if (action.kind === 'custom') {
  return (
    <ArrowUpRight
      aria-hidden="true"
      className="size-4"
      data-document-action-icon="arrow-up-right"
      strokeWidth={2.25}
    />
  )
}
```

Automatic View remains an Eye icon, and Download remains the animated ArrowDown.

- [ ] **Step 5: Add exact split props and composition to `Component.tsx`**

Extend `DownloadListBlockLike` with:

```ts
introPosition?: DownloadIntroPosition | null
introVerticalAlignment?: DownloadIntroVerticalAlignment | null
sectionLayout?: DownloadSectionLayout | null
```

Default the destructured values to `left`, `top`, and `stacked`. Normalize them before rendering:

```ts
const resolvedSectionLayout = sectionLayout === 'split' ? 'split' : 'stacked'
const resolvedIntroPosition = introPosition === 'right' ? 'right' : 'left'
const resolvedIntroVerticalAlignment: DownloadIntroVerticalAlignment =
  introVerticalAlignment === 'center' || introVerticalAlignment === 'bottom'
    ? introVerticalAlignment
    : 'top'
const hasIntroduction = Boolean(
  eyebrow?.trim() || title?.trim() || description?.trim() || resolvedActions.length > 0,
)
const usesSplitSection = resolvedSectionLayout === 'split' && hasIntroduction
```

Define the desktop alignment map near the file-type map:

```ts
const splitIntroVerticalAlignmentClasses: Record<DownloadIntroVerticalAlignment, string> = {
  top: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
}
```

Replace the current separate introduction/download markup with a wrapper that preserves document order:

```tsx
<div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10 md:gap-12')}>
  <div
    className={cn(
      'grid gap-10 md:gap-12',
      usesSplitSection &&
        resolvedIntroPosition === 'left' &&
        'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-16',
      usesSplitSection &&
        resolvedIntroPosition === 'right' &&
        'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-16',
    )}
    data-download-intro-position={resolvedIntroPosition}
    data-download-section-layout={usesSplitSection ? 'split' : 'stacked'}
  >
    {hasIntroduction ? (
      <div
        className={cn(
          'flex max-w-3xl flex-col gap-4',
          isCenter ? 'mx-auto items-center text-center' : 'items-start text-left',
          usesSplitSection && resolvedIntroPosition === 'right' && 'lg:col-start-2 lg:row-start-1',
          usesSplitSection && splitIntroVerticalAlignmentClasses[resolvedIntroVerticalAlignment],
        )}
        data-download-intro="true"
        data-download-intro-vertical-alignment={resolvedIntroVerticalAlignment}
      >
        {eyebrow?.trim() ? (
          <SectionEyebrow surface={appearance?.background ?? 'none'}>
            {eyebrow.trim()}
          </SectionEyebrow>
        ) : null}
        {title?.trim() ? (
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
            {resolvedAccentTitle ? (
              <>
                <span className="block font-[inherit]">{title.trim()}</span>
                <em className="block font-[inherit]">{resolvedAccentTitle}</em>
              </>
            ) : (
              title.trim()
            )}
          </h2>
        ) : null}
        {description?.trim() ? (
          <p className="text-base leading-7 text-current/70">{description.trim()}</p>
        ) : null}
        {resolvedActions.length > 0 ? (
          <div className="mt-2">
            <ContentActions actions={resolvedActions} />
          </div>
        ) : null}
      </div>
    ) : null}

    <div
      className={cn(
        'min-w-0',
        usesSplitSection && resolvedIntroPosition === 'right' && 'lg:col-start-1 lg:row-start-1',
      )}
      data-download-collection="true"
    >
      <DownloadListClient
        columns={columns ?? '3'}
        documentIconSize={documentIconSize ?? 'medium'}
        downloads={resolvedDownloads}
        displayMode={displayMode}
        gridActionDisplay={gridActionDisplay ?? 'labelled'}
        gridIconPosition={gridIconPosition ?? 'above'}
        sectionBackground={appearance?.background ?? 'none'}
        showDocumentIcon={showDocumentIcon ?? true}
      />
    </div>
  </div>
  <BlockFooterActions actions={footerActions} />
</div>
```

Do not move `BlockFooterActions` into the grid.

- [ ] **Step 6: Run the complete focused suite and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all Download List tests PASS and TypeScript exits with code 0.

---

### Task 4: Update operator knowledge and complete verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Verify: all files changed by Tasks 1–3

**Interfaces:**

- Consumes: final editor labels and runtime behavior from Tasks 1–3.
- Produces: accurate operator and architecture documentation.

- [ ] **Step 1: Update the block catalog summary**

Change the Download List table row in `docs/guides/blocks.md` to:

```md
| Download List | Files and document libraries | Stacked or responsive 40/60 split introduction, four document layouts, one shared 1–8 Columns setting, optional file icons, controlled file-type labels, automatic View/Download actions, and one optional per-document Link or Button custom action |
```

- [ ] **Step 2: Replace the obsolete manual-action guidance**

Update the Download List prose in `docs/guides/blocks.md` to state explicitly:

```md
**Section Layout** keeps the introduction Stacked by default or places it beside the document collection in a responsive 40/60 Split. Split sections support Left or Right introduction placement and Top, Center, or Bottom vertical alignment. On smaller screens the introduction always returns above the documents. If no introduction content is authored, the documents retain the full container width.

Each document can add one optional **Custom Action** using the shared internal-page or custom-URL destination, Link or Button display mode, button variants, optional arrow, and new-tab behavior. Automatic actions render first in the fixed order View then Download, followed by Custom. Missing destinations are skipped independently. Existing saved manual actions remain compatible and keep their historical replacement behavior until a new Custom Action is authored; the legacy field is hidden for new editing.
```

- [ ] **Step 3: Update the architecture inventory paragraph**

Revise the Download List section in `docs/architecture/feature-inventory.md` to include the same split contract, additive action order, and hidden legacy compatibility rule. Keep the existing presentation, icon, badge, and column descriptions intact.

- [ ] **Step 4: Format and rerun generated types if formatting touched schema output**

Run:

```bash
pnpm exec prettier --write src/blocks/DownloadList/config.ts src/blocks/DownloadList/types.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-23-download-list-split-custom-actions-design.md docs/superpowers/plans/2026-08-23-download-list-split-custom-actions.md
pnpm generate:types
```

Expected: formatting succeeds and generated Payload types contain `sectionLayout`, `introPosition`, `introVerticalAlignment`, and `customAction` under `DownloadListBlock`.

- [ ] **Step 5: Run final focused and static checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-23-download-list-split-custom-actions-design.md docs/superpowers/plans/2026-08-23-download-list-split-custom-actions.md
```

Expected: every command exits with code 0.

- [ ] **Step 6: Complete repository-specific checks without overwriting user work**

Run the repository detector command documented by project-context, inspect `git diff --check`, and run:

```bash
pnpm project-context:check
git diff --check
git status --short
```

Expected: the detector and diff check pass. If `project-context:check` reports the already-known stale inventory/knowledge graph, report that exact limitation; do not rerun the previously denied updater without new explicit approval. Confirm that no files are staged and no commit exists.
