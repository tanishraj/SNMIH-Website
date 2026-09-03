# Calendar Shared Download Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Calendar PDF document panel and title while replacing its bespoke button configuration and rendering with one restricted shared File Download Button in Calendar and Annual Calendar.

**Architecture:** Extend the shared action-field factory with opt-in restrictions whose defaults preserve every current consumer. A Calendar-specific field composer uses those restrictions to expose one PDF-only Button action inside a Download Panel collapsible, while a shared resolver gives new action data authority and retains hidden legacy PDF fields as a no-migration fallback. The existing panel shell then renders the resolved action through `ContentActions`.

**Tech Stack:** Payload CMS 3.85.2, React 19, TypeScript, Lucide React, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Keep `calendarPdfTitle` as the visible PDF Document Label and public panel heading.
- Put Calendar download configuration in a dedicated **Download Panel** collapsible under Content.
- Expose only Button Label, PDF File, Button Variant, Show Download Icon, and Download Icon Position for the new action.
- Fix destination to File, behavior to Download, and presentation to Button.
- Accept only `application/pdf` Media and at most one action.
- Preserve the existing desktop-bottom and compact-source-order panel placement.
- A non-empty new action is authoritative; invalid new data must not fall back to legacy data.
- Preserve hidden `calendarPdf` and `calendarPdfLabel` values as fallback only when the new action is empty.
- Do not write a migration.
- Do not stage or commit changes.

## File Structure

- Modify `src/blocks/shared/contentActionsFields.ts` — add opt-in restrictions to the canonical shared action-field factory without changing its defaults.
- Modify `src/blocks/shared/calendarPdfFields.ts` — compose the Download Panel collapsible, restricted new action, unchanged title, and hidden legacy fields.
- Modify `src/blocks/shared/calendarPdf.ts` — resolve new shared action data and legacy fallback into one panel contract.
- Modify `src/blocks/shared/CalendarPdfDownload.tsx` — retain the panel shell but render its action through `ContentActions`.
- Modify `src/blocks/shared/CalendarSidebar.tsx` — consume the resolved panel contract.
- Modify `src/blocks/Calendar/config.ts` and `src/blocks/AnnualCalendar/config.ts` — register the same Download Panel fields.
- Modify `src/blocks/Calendar/Presentation.tsx`, `src/blocks/Calendar/CalendarClient.tsx`, and `src/blocks/AnnualCalendar/Presentation.tsx` — forward and render the new/legacy normalized panel.
- Modify `tests/int/content-action-presentation.int.spec.tsx` — protect generic defaults and restricted-action behavior.
- Modify `tests/int/calendar-pdf-download.int.spec.tsx`, `tests/int/calendar.int.spec.tsx`, and `tests/int/annual-calendar.int.spec.tsx` — cover schema, authority, fallback, shared markup, surfaces, and placement.
- Regenerate `src/payload-types.ts`.
- Modify `.agents/skills/project-context/references/block-system.md` and refresh `.agents/skills/project-context/references/project-inventory.json`.

---

### Task 1: Restricted Shared Action Field Options

**Files:**

- Modify: `src/blocks/shared/contentActionsFields.ts`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**

- Produces `ContentActionLinkType`, `ContentActionFileBehavior`, and `ContentActionButtonVariant` string unions.
- Extends `createContentActionsField(options)` with `actionLabel`, `allowedLinkTypes`, `defaultVariant`, `fileFilterOptions`, `fixedFileBehavior`, and `includeNavigationArrow`.
- All new options are opt-in; calling `createContentActionsField()` must produce the existing Page/Custom URL/File schema and defaults.

- [ ] **Step 1: Add failing restricted-field tests**

Add this case to `tests/int/content-action-presentation.int.spec.tsx`:

```tsx
it('can restrict a shared action to one PDF Download Button', () => {
  const field = createContentActionsField({
    actionLabel: 'Button Label',
    allowedLinkTypes: ['file'],
    defaultVariant: 'outline',
    fileFilterOptions: { mimeType: { equals: 'application/pdf' } },
    fixedFileBehavior: 'download',
    includeDisplayMode: false,
    includeNavigationArrow: false,
    label: 'Download Button',
    maxRows: 1,
    name: 'calendarPdfAction',
  })
  const tabs = (field.fields[0] as TestField).tabs ?? []
  const content = tabs.find((tab) => tab.label === 'Content')?.fields ?? []
  const theme = tabs.find((tab) => tab.label === 'Theme Settings')?.fields ?? []

  expect(field).toMatchObject({ label: 'Download Button', maxRows: 1, name: 'calendarPdfAction' })
  expect(content.map((item) => item.name)).toEqual(['label', 'linkType', 'file', 'fileBehavior'])
  expect(content.find((item) => item.name === 'label')).toMatchObject({
    label: 'Button Label',
    required: true,
  })
  expect(content.find((item) => item.name === 'linkType')).toMatchObject({
    defaultValue: 'file',
    options: [{ label: 'File', value: 'file' }],
    admin: expect.objectContaining({ hidden: true }),
  })
  expect(content.find((item) => item.name === 'file')).toMatchObject({
    filterOptions: { mimeType: { equals: 'application/pdf' } },
    relationTo: 'media',
  })
  expect(content.find((item) => item.name === 'fileBehavior')).toMatchObject({
    defaultValue: 'download',
    admin: expect.objectContaining({ hidden: true }),
  })
  expect(theme.map((item) => item.name)).toEqual(['variant', 'showFileIcon', 'fileIconPosition'])
  expect(theme.find((item) => item.name === 'variant')).toMatchObject({ defaultValue: 'outline' })
})
```

Extend `TestField` in that test with the properties used above:

```tsx
type TestField = {
  admin?: { condition?: unknown; hidden?: boolean }
  defaultValue?: unknown
  filterOptions?: unknown
  label?: string
  name?: string
  options?: Array<{ label: string; value: string }>
  relationTo?: string
  required?: boolean
  tabs?: Array<{ fields: TestField[]; label: string }>
  type?: string
}
```

- [ ] **Step 2: Run the focused test and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx
```

Expected: FAIL because `createContentActionsField` does not accept or enforce the restriction options.

- [ ] **Step 3: Add the option types and content-field factory**

In `src/blocks/shared/contentActionsFields.ts`, import `UploadField`, then define:

```ts
export type ContentActionLinkType = 'custom' | 'file' | 'page'
export type ContentActionFileBehavior = 'download' | 'view'
export type ContentActionButtonVariant =
  'default' | 'outline' | 'primary' | 'secondary' | 'white' | 'whiteOutline'

type CreateContentActionsFieldOptions = {
  actionLabel?: string
  allowedLinkTypes?: readonly ContentActionLinkType[]
  defaultVariant?: ContentActionButtonVariant
  fileFilterOptions?: UploadField['filterOptions']
  fixedFileBehavior?: ContentActionFileBehavior
  includeDisplayMode?: boolean
  includeNavigationArrow?: boolean
  label?: string
  maxRows?: number
  name?: string
}
```

Replace the module-level `actionContentFields` array with a `createActionContentFields` function. It must retain the current field order for unrestricted callers and omit irrelevant destination controls for restricted callers:

```ts
const allLinkTypes: readonly ContentActionLinkType[] = ['page', 'custom', 'file']

const linkTypeLabels: Record<ContentActionLinkType, string> = {
  page: 'Page',
  custom: 'Custom URL',
  file: 'File',
}

const createActionContentFields = ({
  actionLabel,
  allowedLinkTypes = allLinkTypes,
  fileFilterOptions,
  fixedFileBehavior,
}: Pick<
  CreateContentActionsFieldOptions,
  'actionLabel' | 'allowedLinkTypes' | 'fileFilterOptions' | 'fixedFileBehavior'
>): Field[] => {
  const resolvedLinkTypes = allowedLinkTypes.length ? [...allowedLinkTypes] : [...allLinkTypes]
  const includes = (value: ContentActionLinkType) => resolvedLinkTypes.includes(value)

  return [
    {
      name: 'label',
      label: actionLabel,
      type: 'text',
      required: true,
    },
    {
      name: 'linkType',
      type: 'radio',
      defaultValue: resolvedLinkTypes[0],
      options: resolvedLinkTypes.map((value) => ({ label: linkTypeLabels[value], value })),
      admin: {
        hidden: resolvedLinkTypes.length === 1,
        layout: 'horizontal',
      },
    } satisfies RadioField,
    ...(includes('page')
      ? [
          {
            name: 'page',
            type: 'relationship',
            relationTo: 'pages',
            admin: { condition: isPageLink },
          } satisfies Field,
        ]
      : []),
    ...(includes('custom')
      ? [
          {
            name: 'url',
            label: 'Custom URL',
            type: 'text',
            admin: { condition: isCustomLink },
          } satisfies Field,
          {
            name: 'openInNewTab',
            type: 'checkbox',
            defaultValue: false,
            admin: { condition: isNavigationalLink },
          } satisfies CheckboxField,
        ]
      : includes('page')
        ? [
            {
              name: 'openInNewTab',
              type: 'checkbox',
              defaultValue: false,
              admin: { condition: isNavigationalLink },
            } satisfies CheckboxField,
          ]
        : []),
    ...(includes('file')
      ? [
          {
            name: 'file',
            label: 'File',
            type: 'upload',
            relationTo: 'media',
            filterOptions: fileFilterOptions,
            admin: {
              condition: isFileLink,
              description: 'Choose the Media asset this action should view or download.',
            },
          } satisfies UploadField,
          {
            name: 'fileBehavior',
            label: 'File Behavior',
            type: 'select',
            defaultValue: fixedFileBehavior ?? 'view',
            options: fixedFileBehavior
              ? [
                  {
                    label: fixedFileBehavior === 'download' ? 'Download' : 'View',
                    value: fixedFileBehavior,
                  },
                ]
              : [
                  { label: 'View', value: 'view' },
                  { label: 'Download', value: 'download' },
                ],
            admin: {
              condition: isFileLink,
              hidden: Boolean(fixedFileBehavior),
            },
          } satisfies SelectField,
          ...(fixedFileBehavior === 'download'
            ? []
            : [
                {
                  name: 'openFileInNewTab',
                  label: 'Open View in New Tab',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { condition: isFileView },
                } satisfies CheckboxField,
              ]),
        ]
      : []),
  ]
}
```

Keep `isPageLink`, `isCustomLink`, `isFileLink`, `isNavigationalLink`, and `isFileView` unchanged so unrestricted consumers retain their current conditions.

- [ ] **Step 4: Make layout controls opt-in configurable**

Change `createActionLayoutFields` to accept an options object:

```ts
const createActionLayoutFields = ({
  defaultVariant = 'default',
  includeDisplayMode,
  includeNavigationArrow,
}: Pick<
  CreateContentActionsFieldOptions,
  'defaultVariant' | 'includeDisplayMode' | 'includeNavigationArrow'
>): Field[] => [
  ...(includeDisplayMode
    ? [
        {
          name: 'mode',
          label: 'Display As',
          type: 'select',
          defaultValue: 'link',
          options: [
            { label: 'Link', value: 'link' },
            { label: 'Button', value: 'button' },
          ],
          required: false,
        } satisfies SelectField,
      ]
    : []),
  {
    name: 'variant',
    label: 'Button Variant',
    type: 'select',
    defaultValue: defaultVariant,
    options: buttonVariantOptions,
    required: true,
    admin: {
      description: buttonVariantDescription,
      ...(includeDisplayMode ? { condition: isButtonMode } : {}),
    },
  } satisfies SelectField,
  ...(includeNavigationArrow
    ? [
        {
          name: 'showArrow',
          label: 'Show arrow',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Adds a trailing arrow when this action is displayed as a button.',
            condition: includeDisplayMode ? isButtonWithoutDownloadIndicator : isNotFileDownload,
          },
        } satisfies CheckboxField,
      ]
    : []),
  {
    name: 'showFileIcon',
    label: 'Show Download Icon',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      condition: isFileDownload,
      description: 'Shows an animated down arrow for this file download.',
    },
  } satisfies CheckboxField,
  {
    name: 'fileIconPosition',
    label: 'Download Icon Position',
    type: 'select',
    defaultValue: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
    admin: { condition: showsFileIcon },
  } satisfies SelectField,
]
```

Destructure `includeNavigationArrow = true` in `createContentActionsField`, pass the complete options to both factories, and use `createActionContentFields(options)` instead of the former constant.

- [ ] **Step 5: Run shared-action and schema-parity tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: PASS. Existing unrestricted action tests must remain unchanged and green.

---

### Task 2: Download Panel Schema and Resolution

**Files:**

- Modify: `src/blocks/shared/calendarPdfFields.ts`
- Modify: `src/blocks/shared/calendarPdf.ts`
- Modify: `src/blocks/Calendar/config.ts`
- Modify: `src/blocks/AnnualCalendar/config.ts`
- Test: `tests/int/calendar-pdf-download.int.spec.tsx`
- Test: `tests/int/annual-calendar.int.spec.tsx`

**Interfaces:**

- Produces `createCalendarDownloadPanelFields(): Field[]`.
- Produces `ResolvedCalendarDownloadPanel = { action: ResolvedCmsAction; title: string }`.
- Produces `resolveCalendarDownloadPanel(value): ResolvedCalendarDownloadPanel | undefined`.
- Retains `resolveCalendarPdf` only for legacy fallback normalization.

- [ ] **Step 1: Write failing Download Panel schema tests**

Replace the old reusable-field expectations in `tests/int/calendar-pdf-download.int.spec.tsx` with:

```tsx
it('defines one restricted shared action inside the Download Panel', () => {
  const fields = createCalendarDownloadPanelFields()
  const panel = fields[0]
  const title = findNamedField(fields, 'calendarPdfTitle')
  const action = findNamedField(fields, 'calendarPdfAction')
  const legacyPdf = findNamedField(fields, 'calendarPdf')
  const legacyLabel = findNamedField(fields, 'calendarPdfLabel')

  expect(panel).toMatchObject({
    label: 'Download Panel',
    type: 'collapsible',
    admin: { initCollapsed: true },
  })
  expect(title).toMatchObject({
    defaultValue: 'Academic calendar PDF',
    label: 'PDF Document Label',
    type: 'text',
  })
  expect(action).toMatchObject({
    label: 'Download Button',
    maxRows: 1,
    name: 'calendarPdfAction',
    type: 'array',
  })
  expect(legacyPdf).toMatchObject({ admin: { hidden: true }, type: 'upload' })
  expect(legacyLabel).toMatchObject({ admin: { hidden: true }, type: 'text' })
})

it.each([
  ['Calendar', CalendarBlock],
  ['Annual Calendar', AnnualCalendarBlock],
])('registers the shared Download Panel in %s', (_label, block) => {
  expect(findNamedField(block.fields, 'calendarPdfAction')).toMatchObject({
    label: 'Download Button',
    maxRows: 1,
    type: 'array',
  })
  expect(findNamedField(block.fields, 'calendarPdfTitle')).toMatchObject({
    defaultValue: 'Academic calendar PDF',
  })
})
```

Update the Annual Calendar schema test to expect `calendarPdfAction` and hidden legacy fields instead of conditional bespoke controls.

- [ ] **Step 2: Write failing authority and compatibility resolver tests**

Add to `tests/int/calendar-pdf-download.int.spec.tsx`:

```tsx
it('resolves a new PDF action through the shared Button contract', () => {
  expect(
    resolveCalendarDownloadPanel({
      actions: [
        {
          file: pdf,
          fileBehavior: 'download',
          fileIconPosition: 'right',
          label: 'Save calendar',
          linkType: 'file',
          showFileIcon: true,
          variant: 'secondary',
        },
      ],
      title: 'Academic year 2026–27',
    }),
  ).toMatchObject({
    action: {
      download: 'academic-calendar-2026-27.pdf',
      href: '/media/academic-calendar-2026-27.pdf',
      indicator: 'download',
      indicatorPosition: 'right',
      label: 'Save calendar',
      mode: 'button',
      variant: 'secondary',
    },
    title: 'Academic year 2026–27',
  })
})

it('uses legacy PDF data only when the new action is empty', () => {
  expect(
    resolveCalendarDownloadPanel({
      actions: [],
      legacyLabel: 'Download legacy PDF',
      legacyMedia: pdf,
      title: 'Legacy academic calendar',
    }),
  ).toMatchObject({
    action: {
      indicator: 'download',
      indicatorPosition: 'left',
      label: 'Download legacy PDF',
      mode: 'button',
      variant: 'outline',
    },
    title: 'Legacy academic calendar',
  })

  expect(
    resolveCalendarDownloadPanel({
      actions: [{ file: { ...pdf, mimeType: 'image/jpeg' }, label: 'Invalid' }],
      legacyMedia: pdf,
    }),
  ).toBeUndefined()
})
```

- [ ] **Step 3: Run the Calendar PDF test and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because the new field composer and panel resolver do not exist.

- [ ] **Step 4: Compose the Download Panel fields**

In `src/blocks/shared/calendarPdfFields.ts`, retain the two default constants and replace `createCalendarPdfFields` with:

```ts
import type { CollapsibleField, Field, UploadField } from 'payload'

import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const createCalendarDownloadPanelFields = (): Field[] => [
  {
    type: 'collapsible',
    label: 'Download Panel',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'calendarPdfTitle',
        label: 'PDF Document Label',
        type: 'text',
        defaultValue: DEFAULT_CALENDAR_PDF_TITLE,
      },
      createContentActionsField({
        actionLabel: 'Button Label',
        allowedLinkTypes: ['file'],
        defaultVariant: 'outline',
        fileFilterOptions: { mimeType: { equals: 'application/pdf' } },
        fixedFileBehavior: 'download',
        includeDisplayMode: false,
        includeNavigationArrow: false,
        label: 'Download Button',
        maxRows: 1,
        name: 'calendarPdfAction',
      }),
      {
        name: 'calendarPdf',
        label: 'Legacy Calendar PDF',
        type: 'upload',
        relationTo: 'media',
        filterOptions: { mimeType: { equals: 'application/pdf' } },
        admin: { hidden: true },
      } satisfies UploadField,
      {
        name: 'calendarPdfLabel',
        label: 'Legacy PDF Button Label',
        type: 'text',
        defaultValue: DEFAULT_CALENDAR_PDF_LABEL,
        admin: { hidden: true },
      },
    ],
  } satisfies CollapsibleField,
]
```

Update both block configs to import and spread `createCalendarDownloadPanelFields()` where the old PDF fields were registered.

- [ ] **Step 5: Add the normalized panel resolver**

In `src/blocks/shared/calendarPdf.ts`, add:

```ts
import { resolveCmsActions, type CmsActionValue, type ResolvedCmsAction } from '@/lib/cmsLinks'

export type ResolvedCalendarDownloadPanel = {
  action: ResolvedCmsAction
  title: string
}

type CalendarDownloadPanelValue = {
  actions?: CmsActionValue[] | null
  legacyLabel?: string | null
  legacyMedia?: string | number | Media | null
  title?: string | null
}

const isPdfMedia = (media: unknown): media is Media =>
  isMediaDoc(media) && media.mimeType?.toLowerCase() === 'application/pdf'

export function resolveCalendarDownloadPanel({
  actions,
  legacyLabel,
  legacyMedia,
  title,
}: CalendarDownloadPanelValue): ResolvedCalendarDownloadPanel | undefined {
  const resolvedTitle = title?.trim() || DEFAULT_CALENDAR_PDF_TITLE

  if ((actions?.length ?? 0) > 0) {
    const source = actions?.[0]
    if (!source || !isPdfMedia(source.file)) return undefined

    const action = resolveCmsActions(
      [
        {
          ...source,
          fileBehavior: 'download',
          linkType: 'file',
          mode: 'button',
          variant: source.variant === 'link' ? 'outline' : (source.variant ?? 'outline'),
        },
      ],
      'button',
    )[0]

    if (!action || action.download === undefined) return undefined
    return { action, title: resolvedTitle }
  }

  const legacy = resolveCalendarPdf(legacyMedia, resolvedTitle, legacyLabel)
  if (!legacy) return undefined

  return {
    action: {
      download: legacy.filename || true,
      href: legacy.href,
      indicator: 'download',
      indicatorPosition: 'left',
      label: legacy.label,
      mode: 'button',
      openInNewTab: false,
      showArrow: false,
      variant: 'outline',
    },
    title: legacy.title,
  }
}
```

Refactor `resolveCalendarPdf` to reuse `isPdfMedia`, without changing its exported legacy behavior.

- [ ] **Step 6: Re-run schema and resolver tests**

Run the Step 3 command. Expected: PASS.

---

### Task 3: Shared Button Rendering in Both Calendar Sidebars

**Files:**

- Modify: `src/blocks/shared/CalendarPdfDownload.tsx`
- Modify: `src/blocks/shared/CalendarSidebar.tsx`
- Modify: `src/blocks/Calendar/Presentation.tsx`
- Modify: `src/blocks/Calendar/CalendarClient.tsx`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx`
- Test: `tests/int/calendar-pdf-download.int.spec.tsx`
- Test: `tests/int/calendar.int.spec.tsx`
- Test: `tests/int/annual-calendar.int.spec.tsx`

**Interfaces:**

- Consumes `ResolvedCalendarDownloadPanel` from Task 2.
- `CalendarPdfDownload` retains `data-calendar-pdf-download`, `data-calendar-pdf-title`, and embedded placement attributes for stable layout tests.
- Both block-like presentation types accept `calendarPdfAction?: CmsActionValue[] | null` plus legacy fields.

- [ ] **Step 1: Write failing shared-markup and placement tests**

Change the panel test in `tests/int/calendar-pdf-download.int.spec.tsx` to render:

```tsx
<CalendarPdfDownload
  download={{
    action: {
      download: 'academic-calendar.pdf',
      href: '/media/academic-calendar.pdf',
      indicator: 'download',
      indicatorPosition: 'left',
      label: 'Download PDF',
      mode: 'button',
      openInNewTab: false,
      showArrow: false,
      variant: 'outline',
    },
    title: 'Academic calendar document with a long wrapping title',
  }}
  surface="brand"
/>
```

Assert shared behavior:

```tsx
const panel = container.querySelector('[data-calendar-pdf-download="true"]')
const link = panel?.querySelector('a')
expect(panel?.querySelector('[data-calendar-pdf-title="true"]')?.textContent).toContain(
  'Academic calendar document',
)
expect(panel?.querySelector('[data-action-indicator="download"]')).toBeTruthy()
expect(link?.getAttribute('download')).toBe('academic-calendar.pdf')
expect(link?.getAttribute('data-slot')).toBe('button')
expect(link?.getAttribute('data-variant')).toBe('outline')
expect(link?.className).toContain('w-full')
expect(panel?.className).toContain('border-primary-foreground/20')
```

Update Calendar and Annual Calendar presentation tests to pass:

```tsx
calendarPdfAction={[
  {
    file: calendarPdf,
    fileBehavior: 'download',
    label: 'Get PDF',
    linkType: 'file',
    variant: 'outline',
  },
]}
calendarPdfTitle="Academic year 2026–27"
```

Keep existing assertions that the panel follows Upcoming, uses `lg:mt-auto`, and disappears for unresolved Media. Add an assertion for `data-action-indicator="download"` in both block tests.

- [ ] **Step 2: Run rendering tests and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/calendar.int.spec.tsx tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because the panel still consumes bespoke PDF data and renders a bespoke Button.

- [ ] **Step 3: Render the panel action with `ContentActions`**

Replace the bespoke `Button`, `Download` icon, and anchor in `CalendarPdfDownload.tsx` with:

```tsx
import { ContentActions } from '@/components/ContentActions'

type CalendarPdfDownloadProps = {
  download: ResolvedCalendarDownloadPanel
  embedded?: boolean
  surface?: BlockSurface
}

export function CalendarPdfDownload({
  download,
  embedded = false,
  surface = 'light',
}: CalendarPdfDownloadProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-4 p-5',
        embedded ? cn('border-t lg:mt-auto', styles.border) : styles.panel,
      )}
      data-calendar-pdf-download="true"
      data-calendar-pdf-embedded={embedded ? 'true' : undefined}
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileText
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0"
          data-calendar-pdf-icon="true"
        />
        <p className="min-w-0 break-words font-semibold" data-calendar-pdf-title="true">
          {download.title}
        </p>
      </div>
      <ContentActions actions={[download.action]} className="w-full [&>a]:w-full" />
    </div>
  )
}
```

The surrounding Calendar section already owns `data-block-surface`, so shared outline/default variants inherit the existing brand-surface overrides from `src/styles/custom.css`.

- [ ] **Step 4: Normalize panel data in both presentations**

In `Calendar/Presentation.tsx` and `AnnualCalendar/Presentation.tsx`:

```tsx
calendarPdfAction?: CmsActionValue[] | null
```

Destructure it and replace `resolveCalendarPdf(...)` with:

```tsx
const resolvedCalendarPdf = resolveCalendarDownloadPanel({
  actions: calendarPdfAction,
  legacyLabel: calendarPdfLabel,
  legacyMedia: calendarPdf,
  title: calendarPdfTitle,
})
```

Update imports to use `resolveCalendarDownloadPanel`. Change `CalendarClient` and `CalendarSidebar` type imports from `ResolvedCalendarPdf` to `ResolvedCalendarDownloadPanel`; their existing `pdfDownload`/`download` prop names and layout remain unchanged.

- [ ] **Step 5: Re-run Calendar rendering tests**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 6: Run shared action and theme regressions**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx tests/int/theme-contracts.int.spec.ts tests/int/button-primary-variant.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all tests and TypeScript pass.

---

### Task 4: Generated Types, Documentation, and Full Verification

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`
- Test: `tests/int/calendar-pdf-download.int.spec.tsx`

**Interfaces:**

- Generated Calendar and Annual Calendar types contain `calendarPdfAction` with the restricted shared-action row shape while retaining optional legacy fields.
- Maintained block documentation describes the Download Panel's shared action ownership and fallback order.

- [ ] **Step 1: Generate Payload types**

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `calendarPdfAction` for both blocks, including File Download and indicator fields.

- [ ] **Step 2: Add generated-type regression assertions**

Add to `tests/int/calendar-pdf-download.int.spec.tsx`:

```tsx
it('keeps generated Calendar download actions and legacy fields aligned', () => {
  const source = readFileSync('src/payload-types.ts', 'utf8')

  expect(source.match(/calendarPdfAction\?:/g) ?? []).toHaveLength(2)
  expect(source).toContain("fileBehavior?: ('download') | null")
  expect(source).toContain("fileIconPosition?: ('left' | 'right') | null")
  expect(source).toContain('showFileIcon?: boolean | null')
  expect(source.match(/calendarPdf\?:/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  expect(source.match(/calendarPdfLabel\?:/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
})
```

Add `readFileSync` from `node:fs` to that test file.

- [ ] **Step 3: Update maintained block documentation**

In `.agents/skills/project-context/references/block-system.md`, replace the Calendar/Annual Calendar PDF description with this contract:

```md
Calendar and Annual Calendar share one Download Panel field composer and resolver. The visible PDF Document Label remains `calendarPdfTitle`; one restricted shared action owns Button Label, PDF Media, Button variant, and download-icon visibility/position. File, Download, and Button semantics are fixed, and the upload accepts PDFs only. A non-empty new action is authoritative, while hidden legacy Media/label fields remain a no-migration fallback only when the new action is empty. The semantic panel stays at the bottom of the full-height desktop sidebar and renders its action through the canonical shared Content Actions system.
```

No architecture or Payload model narrative change is required because block-system owns this behavior.

- [ ] **Step 4: Run focused verification**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/calendar.int.spec.tsx tests/int/annual-calendar.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all tests and TypeScript pass. Lint may report only the documented pre-existing Google Tag Manager warning in `src/app/(frontend)/layout.tsx`.

- [ ] **Step 5: Run the full integration suite**

```bash
pnpm exec vitest run --config ./vitest.config.mts --reporter=dot
```

Expected: all integration files and tests pass. MongoMemoryServer-backed tests may require permission to bind local ports.

- [ ] **Step 6: Refresh maintained project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The optional knowledge-graph stale warning may remain.

- [ ] **Step 7: Review the final uncommitted workspace**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no staging changes made by the implementation, and no commit created.
