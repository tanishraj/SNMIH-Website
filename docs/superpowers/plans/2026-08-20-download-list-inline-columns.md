# Download List Inline Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compatibility-safe one-to-eight-column control to Download List's unboxed Inline List presentation.

**Architecture:** Add a dedicated `inlineColumns` Payload field so existing grid defaults cannot change saved Inline Lists. Normalize it independently with a one-column fallback, pass it through the existing server/client boundary, and reuse the static responsive column map while giving multi-column inline items a narrower, wrap-safe anatomy.

**Tech Stack:** Payload CMS fields and generated types, React, TypeScript, Tailwind CSS, Vitest, Testing Library, and the existing project-context tooling.

## Global Constraints

- Do not commit, stage, unstage, or alter branch history.
- `inlineColumns` supports string values `1` through `8` and defaults to `1`.
- Existing grid `columns` remains grid-only and defaults to `3`.
- Existing Inline List and legacy `compact` content without `inlineColumns` remains one column.
- Inline List remains unboxed with top/bottom outer rules and subtle internal dividers.
- Phone renders one column; tablet up to two; laptop up to four; wide desktop up to the selected maximum.
- Multi-column items wrap without clipping or horizontal scrolling.
- Existing content, actions, filtering, file-type badges, and grid presentations remain unchanged.

---

### Task 1: Add the Inline Columns authoring contract

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces Payload field `inlineColumns?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | null`.
- Reuses the existing `columnOptions` while retaining separate conditions/defaults.

- [ ] **Step 1: Write the failing schema test**

Add beside the existing Grid Columns test:

```tsx
it('offers one-to-eight columns separately for Inline List', () => {
  const inlineColumns = findNamedField(DownloadListBlock.fields, 'inlineColumns') as SelectField

  expect(inlineColumns.options).toHaveLength(8)
  expect(inlineColumns).toMatchObject({ type: 'select', defaultValue: '1', required: true })
  expect(inlineColumns.admin?.condition?.({}, { displayMode: 'list' }, {} as never)).toBe(true)
  expect(inlineColumns.admin?.condition?.({}, { displayMode: 'cards' }, {} as never)).toBe(false)
  expect(inlineColumns.admin?.condition?.({}, { displayMode: 'openGrid' }, {} as never)).toBe(false)
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "one-to-eight columns"`.

Expected: the new assertion fails because `inlineColumns` is undefined; the existing Grid Columns test passes.

- [ ] **Step 3: Add the dedicated Payload field**

Insert after Grid Columns in `src/blocks/DownloadList/config.ts`:

```ts
{
  name: 'inlineColumns',
  label: 'Inline Columns',
  type: 'select',
  defaultValue: '1',
  required: true,
  options: columnOptions,
  admin: {
    condition: isInlineList,
    description:
      'Sets the maximum number of responsive Inline List columns. Existing lists remain one column by default.',
  },
} satisfies SelectField,
```

Do not change the existing `columns` name, condition, or default.

- [ ] **Step 4: Run the schema tests**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "one-to-eight columns"`.

Expected: both Grid Columns and Inline Columns tests pass.

---

### Task 2: Thread and render responsive Inline Columns

**Files:**

- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- `DownloadListBlockLike.inlineColumns?: DownloadGridColumns | null` defaults to `'1'`.
- `DownloadListClient` accepts `inlineColumns?: DownloadGridColumns | null`.
- `normalizeInlineColumns(value?: string | null): DownloadGridColumns` returns a valid value or `'1'`.
- `DownloadListPresentation` consumes normalized `inlineColumns: DownloadGridColumns`.

- [ ] **Step 1: Write failing normalization and rendering tests**

Import `normalizeInlineColumns` from `@/blocks/DownloadList/Presentation`, then add:

```tsx
it('normalizes missing and invalid Inline Columns to one', () => {
  expect(normalizeInlineColumns()).toBe('1')
  expect(normalizeInlineColumns('9')).toBe('1')
  expect(normalizeInlineColumns('8')).toBe('8')
})

it('keeps Inline List one column by default', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent displayMode="list" downloads={documents} />,
  )

  expect(html).toContain('data-download-inline-columns="1"')
  expect(html).toContain('grid-cols-1')
  expect(html).not.toContain('2xl:grid-cols-8')
})

it('renders responsive ruled Inline List columns', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="list"
      downloads={[...documents, { ...documents[0], id: 'policy-2', title: 'Policy Two' }]}
      inlineColumns="8"
    />,
  )

  expect(html).toContain('data-download-inline-columns="8"')
  expect(html).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8')
  expect(html).toContain('data-download-inline-grid="true"')
  expect(html).toContain('border-y')
  expect(html).toContain('border-r border-b')
  expect(html).not.toContain('rounded-[var(--radius)]')
})

it('applies Inline Columns to legacy compact fallback', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent displayMode="compact" downloads={documents} inlineColumns="2" />,
  )

  expect(html).toContain('data-download-presentation="inline"')
  expect(html).toContain('data-download-inline-columns="2"')
  expect(html).toContain('sm:grid-cols-2')
})
```

- [ ] **Step 2: Run the rendering tests and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "Inline Columns|Inline List one column|legacy compact"`.

Expected: failures identify the missing normalizer, prop, responsive classes, and ruled grid markup.

- [ ] **Step 3: Add the server and client props**

In `Component.tsx`, extend the input and pass it through:

```ts
// DownloadListBlockLike, after gridIconPosition
inlineColumns?: DownloadGridColumns | null

// DownloadListBlockComponent destructuring, after gridIconPosition
inlineColumns = '1',

// DownloadListClient props, after gridIconPosition
inlineColumns={inlineColumns ?? '1'}
```

In `DownloadListClient.tsx`, add the named import and these exact lines:

```ts
// Named import from Presentation
normalizeInlineColumns

// Props, after gridIconPosition
inlineColumns?: DownloadGridColumns | null

// DownloadListClient destructuring, after gridIconPosition
inlineColumns = '1',

// DownloadListPresentation props, after gridIconPosition
inlineColumns={normalizeInlineColumns(inlineColumns)}
```

- [ ] **Step 4: Add independent column normalization**

In `Presentation.tsx`, retain Grid Columns fallback `3` and add:

```ts
export function normalizeInlineColumns(value?: string | null): DownloadGridColumns {
  return value && value in gridColumnClasses ? (value as DownloadGridColumns) : '1'
}
```

Add `inlineColumns: DownloadGridColumns` to `PresentationProps`.

- [ ] **Step 5: Build the unboxed ruled Inline grid**

Update `InlinePresentation` to consume `inlineColumns` and use this structure:

```tsx
const isSingleColumn = inlineColumns === '1'

return (
  <div
    data-download-inline-columns={inlineColumns}
    data-download-inline-grid="true"
    data-download-presentation="inline"
    className="overflow-hidden border-y border-current/15"
  >
    <ul className={cn('-mb-px -mr-px grid', gridColumnClasses[inlineColumns])}>
      {downloads.map((document) => (
        <li
          className={cn(
            'grid min-w-0 gap-4 border-r border-b border-current/15 py-5',
            isSingleColumn
              ? 'md:grid-cols-[auto_minmax(0,1fr)_minmax(8rem,auto)_auto] md:items-center'
              : 'grid-cols-[auto_minmax(0,1fr)] items-start px-4',
          )}
          key={document.id}
        >
          <DocumentIcon className={surface.icon} size={documentIconSize} type={document.fileType} />
          <div className="flex min-w-0 flex-col items-start">
            {showInlineFileType ? (
              <FileTypeBadge surface={surface} type={document.fileType} />
            ) : null}
            <DocumentTitle className={showInlineFileType && document.fileType ? 'mt-2' : undefined}>
              {document.title}
            </DocumentTitle>
            {document.description ? (
              <p className="mt-1 text-sm leading-6 text-current/70">{document.description}</p>
            ) : null}
          </div>
          <span
            className={cn('text-sm text-current/70', isSingleColumn ? undefined : 'col-start-2')}
          >
            {document.category ?? '—'}
          </span>
          <DocumentActions
            buttonClassName={surface.button.default}
            className={isSingleColumn ? undefined : 'col-start-2'}
            document={document}
            linkClassName={surface.link}
          />
        </li>
      ))}
    </ul>
  </div>
)
```

The negative bottom/right offsets retain internal rules while clipping the final boundary rules. Do not add gaps, radii, independent surfaces, or card-background attributes.

- [ ] **Step 6: Run focused verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx tests/int/download-list.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/DownloadListClient.tsx
```

Expected: tests, TypeScript, and ESLint pass; detector returns `[]`.

---

### Task 3: Regenerate types, documentation, and project context

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Generated `DownloadListBlock.inlineColumns` exposes the one-to-eight union.
- Docs distinguish Grid Columns default `3` from Inline Columns default `1`.

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write src/payload-types.ts
```

Verify `DownloadListBlock` includes:

```ts
inlineColumns?: ('1' | '2' | '3' | '4' | '5' | '6' | '7' | '8') | null
```

- [ ] **Step 2: Update maintained documentation**

Add this operator-facing paragraph to the Download List section in `docs/guides/blocks.md`:

```md
Inline List exposes a separate **Inline Columns** control with one to eight responsive columns. It
defaults and falls back to one column so existing Inline Lists remain unchanged. Multi-column Inline
List stays unboxed and uses subtle internal rules; the separate **Grid Columns** control continues to
default to three for Boxed Card, Open Grid, and Framed Grid. Legacy Compact content follows Inline
List and honors a valid Inline Columns value.
```

Add this runtime contract to the Download List paragraph in `.agents/skills/project-context/references/block-system.md`:

```md
Inline List has an independent one-to-eight-column setting with a one-column saved and runtime
default. Its responsive multi-column form remains an unboxed ruled list. Grid Columns remains a
separate three-column default, and legacy `compact` values honor Inline Columns through the Inline
List fallback.
```

Add this feature summary after the Download List paragraph in `docs/architecture/feature-inventory.md`:

```md
Inline List independently supports one to eight responsive columns and defaults to one for saved
content compatibility. Its multi-column presentation remains unboxed and ruled, while the three grid
presentations retain their separate Grid Columns setting and three-column default.
```

- [ ] **Step 3: Run the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: Project context is current; the known stale knowledge-graph warning may remain.

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/config.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/types.ts tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx src/payload-types.ts docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
git diff --check
git diff --cached --check
```

Expected: every command succeeds. Inspect staged and unstaged diffs separately without changing the index; report that no commit or staging operation was performed.
