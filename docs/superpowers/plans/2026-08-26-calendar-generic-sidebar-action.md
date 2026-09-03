# Calendar Generic Sidebar Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Calendar and Annual Calendar panel's restricted PDF Download Button configuration with one complete canonical shared action while preserving the panel, legacy PDF fallback, and current layout.

**Architecture:** Keep `calendarPdfAction` and the existing shared panel contract, but register the canonical one-row action schema without Calendar restrictions. Resolve explicit Page, Custom URL, File View, File Download, Button, and Link choices through `resolveCmsActions`; use Button only as the fallback mode for rows saved by the preceding restricted schema. Preserve the hidden legacy PDF resolver exclusively when the new action is empty.

**Tech Stack:** Payload CMS 3.85.2, React 19, TypeScript, Lucide React, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Keep the existing Download Panel collapsible, `calendarPdfTitle`, FileText icon, sidebar placement, and one-action limit.
- Expose the same Page, Custom URL, File, View/Download, Button/Link, new-tab, variant, arrow, and download-icon settings as normal shared actions.
- Keep the stored field name `calendarPdfAction`.
- Preserve explicit action values without Calendar-specific coercion.
- Treat a non-empty new action as authoritative; invalid new data must not fall back to legacy data.
- Use Button as the fallback mode only when a saved new action has no explicit `mode`.
- Preserve hidden `calendarPdf` and `calendarPdfLabel` as fallback only when the new action is empty.
- Do not write a migration.
- Do not stage or commit changes.

## File Structure

- Modify `src/blocks/shared/calendarPdfFields.ts` — register one unrestricted canonical shared action inside the existing panel.
- Modify `src/blocks/shared/calendarPdf.ts` — stop coercing new actions and retain compatibility fallback behavior.
- Keep `src/blocks/shared/CalendarPdfDownload.tsx` unchanged unless a failing presentation test identifies a contract mismatch; it already renders `ContentActions` and makes only Button actions full width.
- Modify `tests/int/calendar-pdf-download.int.spec.tsx` — cover the generic schema, all destination/behavior contracts, mode compatibility, rendering, and generated types.
- Modify `tests/int/calendar.int.spec.tsx` and `tests/int/annual-calendar.int.spec.tsx` — prove generic Link and Button actions flow through both block presentations.
- Regenerate `src/payload-types.ts`.
- Modify `.agents/skills/project-context/references/block-system.md` and refresh `.agents/skills/project-context/references/project-inventory.json`.

---

### Task 1: Replace the Restricted Calendar Field with One Normal Shared Action

**Files:**

- Modify: `src/blocks/shared/calendarPdfFields.ts`
- Test: `tests/int/calendar-pdf-download.int.spec.tsx`

**Interfaces:**

- Consumes `createContentActionsField(options)` with its canonical defaults.
- Produces `calendarPdfAction` as one normal shared action row with `maxRows: 1` and label `Action`.
- Leaves `calendarPdfTitle`, `calendarPdf`, and `calendarPdfLabel` unchanged.

- [ ] **Step 1: Change the field-contract test to require the complete normal action schema**

In `tests/int/calendar-pdf-download.int.spec.tsx`, import `ArrayField` and `TabsField` from Payload and replace the restricted-action assertions with:

```tsx
it('defines one normal shared action inside the Download Panel', () => {
  const fields = createCalendarDownloadPanelFields()
  const panel = fields[0]
  const action = findNamedField(fields, 'calendarPdfAction') as ArrayField
  const actionTabs = (action.fields[0] as TabsField).tabs
  const content = actionTabs.find(({ label }) => label === 'Content')?.fields ?? []
  const theme = actionTabs.find(({ label }) => label === 'Theme Settings')?.fields ?? []
  const named = (field: Field) => ('name' in field ? field.name : undefined)

  expect(panel).toMatchObject({
    admin: { initCollapsed: true },
    label: 'Download Panel',
    type: 'collapsible',
  })
  expect(action).toMatchObject({
    label: 'Action',
    maxRows: 1,
    name: 'calendarPdfAction',
    type: 'array',
  })
  expect(content.map(named)).toEqual([
    'label',
    'linkType',
    'page',
    'url',
    'openInNewTab',
    'file',
    'fileBehavior',
    'openFileInNewTab',
  ])
  expect(theme.map(named)).toEqual([
    'mode',
    'variant',
    'showArrow',
    'showFileIcon',
    'fileIconPosition',
  ])
  expect(findNamedField(content, 'linkType')).toMatchObject({
    defaultValue: 'page',
    options: [
      { label: 'Page', value: 'page' },
      { label: 'Custom URL', value: 'custom' },
      { label: 'File', value: 'file' },
    ],
  })
  expect(findNamedField(content, 'file')).not.toHaveProperty('filterOptions')
  expect(findNamedField(content, 'fileBehavior')).toMatchObject({
    defaultValue: 'view',
    options: [
      { label: 'View', value: 'view' },
      { label: 'Download', value: 'download' },
    ],
  })
  expect(findNamedField(theme, 'mode')).toMatchObject({ defaultValue: 'link' })
})
```

Update the existing table-driven Calendar/Annual Calendar registration test so each block expects:

```tsx
expect(findNamedField(block.fields, 'calendarPdfAction')).toMatchObject({
  label: 'Action',
  maxRows: 1,
  type: 'array',
})
```

- [ ] **Step 2: Run the schema test and verify the intended failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: FAIL because the Calendar action is still File-only, Download-only, Button-only, and labelled `Download Button`.

- [ ] **Step 3: Register the canonical generic action without restriction options**

In `src/blocks/shared/calendarPdfFields.ts`, replace only the `createContentActionsField` call with:

```ts
createContentActionsField({
  label: 'Action',
  maxRows: 1,
  name: 'calendarPdfAction',
})
```

Do not change the surrounding collapsible, title field, or hidden legacy fields.

- [ ] **Step 4: Re-run shared schema contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: PASS. Existing shared-action consumers retain their current schema and defaults.

---

### Task 2: Resolve Generic Destinations and Modes Without Calendar Coercion

**Files:**

- Modify: `src/blocks/shared/calendarPdf.ts`
- Test: `tests/int/calendar-pdf-download.int.spec.tsx`

**Interfaces:**

- Consumes `CmsActionValue[]` and `resolveCmsActions(actions, fallbackMode)`.
- Produces `ResolvedCalendarDownloadPanel | undefined` with the authored action preserved.
- Uses `fallbackMode: 'button'` only for existing restricted rows without `mode`.
- Retains `resolveCalendarPdf` unchanged for empty-new-action legacy fallback.

- [ ] **Step 1: Add fixtures for Page and unrestricted File destinations**

Update the generated type import in `tests/int/calendar-pdf-download.int.spec.tsx`:

```tsx
import type { Media, Page } from '@/payload-types'
```

Add:

```tsx
const page = {
  id: 'admissions-page',
  parent: null,
  slug: 'admissions',
} as Page

const document = {
  filename: 'academic-calendar.ics',
  id: 'calendar-file',
  mimeType: 'text/calendar',
  url: '/media/academic-calendar.ics',
} as Media
```

- [ ] **Step 2: Replace the forced-PDF resolver test with authored-destination tests**

Add these cases:

```tsx
it('preserves Page and Custom URL action choices', () => {
  expect(
    resolveCalendarDownloadPanel({
      actions: [
        {
          label: 'View admissions',
          linkType: 'page',
          mode: 'link',
          page,
          variant: 'default',
        },
      ],
    }),
  ).toMatchObject({
    action: {
      href: '/admissions',
      label: 'View admissions',
      mode: 'link',
      variant: 'default',
    },
  })

  expect(
    resolveCalendarDownloadPanel({
      actions: [
        {
          label: 'See deadlines',
          linkType: 'custom',
          mode: 'button',
          openInNewTab: true,
          showArrow: true,
          url: '/deadlines',
          variant: 'secondary',
        },
      ],
    }),
  ).toMatchObject({
    action: {
      href: '/deadlines',
      label: 'See deadlines',
      mode: 'button',
      openInNewTab: true,
      showArrow: true,
      variant: 'secondary',
    },
  })
})

it('preserves File View and File Download behavior', () => {
  expect(
    resolveCalendarDownloadPanel({
      actions: [
        {
          file: document,
          fileBehavior: 'view',
          label: 'View calendar feed',
          linkType: 'file',
          mode: 'link',
          openFileInNewTab: true,
        },
      ],
    })?.action,
  ).toMatchObject({
    download: undefined,
    href: '/media/academic-calendar.ics',
    indicator: undefined,
    mode: 'link',
    openInNewTab: true,
  })

  expect(
    resolveCalendarDownloadPanel({
      actions: [
        {
          file: document,
          fileBehavior: 'download',
          fileIconPosition: 'right',
          label: 'Download calendar feed',
          linkType: 'file',
          mode: 'button',
          showFileIcon: true,
          variant: 'outline',
        },
      ],
    })?.action,
  ).toMatchObject({
    download: 'academic-calendar.ics',
    href: '/media/academic-calendar.ics',
    indicator: 'download',
    indicatorPosition: 'right',
    mode: 'button',
  })
})

it('keeps preceding restricted rows as Buttons when mode is absent', () => {
  expect(
    resolveCalendarDownloadPanel({
      actions: [
        {
          file: pdf,
          fileBehavior: 'download',
          label: 'Download PDF',
          linkType: 'file',
          variant: 'outline',
        },
      ],
    })?.action,
  ).toMatchObject({ mode: 'button', variant: 'outline' })
})
```

Keep the existing empty-new-action legacy fallback assertion. Change its invalid-new-action case to an unresolved normal destination so it proves authority without relying on the removed PDF filter:

```tsx
expect(
  resolveCalendarDownloadPanel({
    actions: [{ label: 'Invalid page', linkType: 'page', page: 'page-id' }],
    legacyMedia: pdf,
  }),
).toBeUndefined()
```

- [ ] **Step 3: Run the resolver tests and verify the intended failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: FAIL because the current resolver rejects non-PDF destinations and forces File, Download, Button, and outline normalization.

- [ ] **Step 4: Resolve the authored shared action directly**

In `resolveCalendarDownloadPanel` inside `src/blocks/shared/calendarPdf.ts`, replace the non-empty-action branch with:

```ts
if ((actions?.length ?? 0) > 0) {
  const action = resolveCmsActions(actions, 'button')[0]
  if (!action) return undefined

  return { action, title: resolvedTitle }
}
```

Keep the legacy branch and `resolveCalendarPdf` unchanged. The `'button'` fallback applies only when `source.mode` is absent; explicit `mode: 'link'` and `mode: 'button'` continue to win inside `resolveCmsActions`.

- [ ] **Step 5: Re-run resolver and shared-link contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx
```

Expected: PASS.

---

### Task 3: Verify Generic Links and Buttons Through Both Calendar Presentations

**Files:**

- Test: `tests/int/calendar-pdf-download.int.spec.tsx`
- Test: `tests/int/calendar.int.spec.tsx`
- Test: `tests/int/annual-calendar.int.spec.tsx`
- Inspect: `src/blocks/shared/CalendarPdfDownload.tsx`

**Interfaces:**

- Consumes `ResolvedCalendarDownloadPanel` from Task 2.
- Verifies `CalendarPdfDownload` delegates Button and Link rendering to `ContentActions`.
- Verifies Button actions remain full width while editorial Links retain natural width.

- [ ] **Step 1: Add a panel-level editorial Link presentation test**

In `tests/int/calendar-pdf-download.int.spec.tsx`, add:

```tsx
it('renders a generic editorial Link without Button or download semantics', () => {
  const { container } = render(
    <CalendarPdfDownload
      download={{
        action: {
          href: '/admissions',
          label: 'View admissions',
          mode: 'link',
          openInNewTab: false,
          showArrow: false,
          variant: 'default',
        },
        title: 'Academic calendar PDF',
      }}
    />,
  )

  const link = container.querySelector('[data-content-link="true"]')
  expect(link?.getAttribute('href')).toBe('/admissions')
  expect(link?.getAttribute('download')).toBeNull()
  expect(link?.getAttribute('data-slot')).toBeNull()
  expect(link?.className).not.toContain('w-full')
})
```

- [ ] **Step 2: Exercise a generic Link through Calendar**

In `tests/int/calendar.int.spec.tsx`, add or extend the PDF panel presentation case with:

```tsx
rerender(
  <CalendarBlockPresentation
    calendarPdfAction={[
      {
        label: 'View admissions',
        linkType: 'custom',
        mode: 'link',
        url: '/admissions',
      },
    ]}
    calendarPdfTitle="Academic year 2026–27"
    initial={initial}
  />,
)

const editorialLink = container.querySelector('[data-calendar-pdf-download="true"] a')
expect(editorialLink?.getAttribute('data-content-link')).toBe('true')
expect(editorialLink?.getAttribute('href')).toBe('/admissions')
expect(editorialLink?.getAttribute('download')).toBeNull()
```

- [ ] **Step 3: Exercise a generic Page Button through Annual Calendar**

Add a populated Page fixture to `tests/int/annual-calendar.int.spec.tsx`, then extend its panel case:

```tsx
rerender(
  <AnnualCalendarBlockPresentation
    calendarPdfAction={[
      {
        label: 'View schedule',
        linkType: 'page',
        mode: 'button',
        page: { id: 'schedule-page', parent: null, slug: 'schedule' } as Page,
        showArrow: true,
        variant: 'secondary',
      },
    ]}
    calendarPdfTitle="Academic year 2026–27"
    initial={initial}
  />,
)

const pageButton = container.querySelector('[data-calendar-pdf-download="true"] a')
expect(pageButton?.getAttribute('href')).toBe('/schedule')
expect(pageButton?.getAttribute('data-slot')).toBe('button')
expect(pageButton?.getAttribute('data-variant')).toBe('secondary')
expect(pageButton?.className).toContain('w-full')
expect(pageButton?.querySelector('[data-action-arrow="true"]')).toBeTruthy()
```

- [ ] **Step 4: Run both Calendar presentation suites**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/calendar.int.spec.tsx tests/int/annual-calendar.int.spec.tsx
```

Expected: PASS after Task 2. If the editorial Link receives Button-only width, correct `CalendarPdfDownload` by applying `w-full` only through `buttonClassNames`; do not add Calendar-specific action markup.

- [ ] **Step 5: Run theme and TypeScript regressions**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/button-primary-variant.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all tests and TypeScript pass.

---

### Task 4: Regenerate Types, Update Maintained Context, and Verify the Repository

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `tests/int/calendar-pdf-download.int.spec.tsx`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Generated Calendar and Annual Calendar types contain the complete canonical shared action row.
- Maintained block documentation describes generic action ownership and unchanged legacy fallback.

- [ ] **Step 1: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: both Calendar block interfaces expose `page`, `url`, `openInNewTab`, `file`, `fileBehavior`, `openFileInNewTab`, `mode`, `variant`, `showArrow`, `showFileIcon`, and `fileIconPosition` inside `calendarPdfAction`.

- [ ] **Step 2: Strengthen the generated-type regression**

Replace the current restricted-type assertions in `tests/int/calendar-pdf-download.int.spec.tsx` with:

```tsx
it('keeps generated Calendar actions aligned with the complete shared action', () => {
  const source = readFileSync('src/payload-types.ts', 'utf8')
  const definitions = [...source.matchAll(/calendarPdfAction\?:([\s\S]*?)\n  calendarPdf\?:/g)].map(
    (match) => match[1],
  )

  expect(definitions.length).toBeGreaterThanOrEqual(2)
  for (const definition of definitions) {
    expect(definition).toContain('page?:')
    expect(definition).toContain('url?:')
    expect(definition).toContain('openInNewTab?:')
    expect(definition).toContain('file?:')
    expect(definition).toContain('fileBehavior?:')
    expect(definition).toContain('openFileInNewTab?:')
    expect(definition).toContain('mode?:')
    expect(definition).toContain('showArrow?:')
    expect(definition).toContain('showFileIcon?:')
    expect(definition).toContain('fileIconPosition?:')
  }
  expect(source.match(/calendarPdf\?:/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  expect(source.match(/calendarPdfLabel\?:/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
})
```

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 3: Update the maintained block contract**

In `.agents/skills/project-context/references/block-system.md`, replace the restricted Download Panel wording with:

```md
Calendar and Annual Calendar share one sidebar Download Panel field composer and resolver. The visible PDF Document Label remains `calendarPdfTitle`, while one canonical shared action supports Page, Custom URL, File View, or File Download destinations and Button or editorial Link presentation. Explicit variants, new-tab behavior, navigation arrows, and download-icon settings pass through unchanged. A non-empty new action is authoritative; rows saved by the preceding restricted schema use Button only as their missing-mode compatibility fallback. Hidden legacy PDF Media/label fields remain a no-migration fallback only when the new action is empty. The semantic panel stays at the bottom of the full-height desktop sidebar and renders through the canonical shared Content Actions system.
```

No architecture or Payload-model narrative change is required because `block-system.md` owns this behavior.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/calendar.int.spec.tsx tests/int/annual-calendar.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all focused tests and TypeScript pass. Lint may report only the existing Google Tag Manager recommendation in `src/app/(frontend)/layout.tsx`.

- [ ] **Step 5: Run the full integration suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts --reporter=dot
```

Expected: all integration files and tests pass. MongoMemoryServer-backed tests may require permission to bind local ports.

- [ ] **Step 6: Refresh and check maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The optional knowledge-graph stale warning may remain.

- [ ] **Step 7: Review the final uncommitted workspace**

Read `.agents/skills/project-context/references/change-impact-map.md` again, then run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no implementation-created staged changes, no migration, and no commit.
