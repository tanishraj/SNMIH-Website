# Shared Calendar PDF Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Calendar and Annual Calendar one shared, configurable, sidebar-safe PDF download panel.

**Architecture:** Shared schema fields, a pure Media resolver, and one semantic presentation component replace Annual Calendar-specific PDF modules. Each block resolves its own saved Media relationship and labels, while Calendar passes the serializable result into its existing client composition so event data, filtering, caching, and preview snapshots do not change.

**Tech Stack:** Payload CMS 3 fields and generated types, React 19, Next.js 16, TypeScript, Tailwind CSS 4, shadcn-style Button, Vitest, Testing Library.

## Global Constraints

- Each Calendar and Annual Calendar block instance independently owns its optional PDF and labels.
- Accept only populated Media documents with MIME type `application/pdf` and a resolved URL.
- Default document label: `Academic calendar PDF`.
- Default button label: `Download`.
- Render the document identity first and a full-width action second at every viewport width.
- Render the panel below Upcoming and hide it completely when the PDF cannot be resolved.
- Preserve all Calendar and Annual Calendar event queries, filters, cache keys, preview snapshots, navigation, and Upcoming behavior.
- Use semantic theme surfaces and existing Button variants; display typography is not permitted in this panel.
- Do not create a global setting, generated PDF, migration, new dependency, staged change, or Git commit.

---

### Task 1: Extract the shared PDF schema and resolver

**Files:**
- Create: `src/blocks/shared/calendarPdfFields.ts`
- Create: `src/blocks/shared/calendarPdf.ts`
- Modify: `src/blocks/AnnualCalendar/config.ts`
- Modify: `tests/int/annual-calendar.int.spec.tsx`
- Create: `tests/int/calendar-pdf-download.int.spec.tsx`
- Delete after imports are migrated: `src/blocks/AnnualCalendar/annualCalendarPdf.ts`

**Interfaces:**
- Produces: `createCalendarPdfFields(): Field[]`.
- Produces: `resolveCalendarPdf(media, title?, label?): ResolvedCalendarPdf | undefined`.
- Produces: `ResolvedCalendarPdf = { filename?: string; href: string; label: string; title: string }`.
- Consumes: Payload `Media`, `isMediaDoc`, and `getMediaAbsoluteUrl`.

- [ ] **Step 1: Write failing shared contract tests**

Create `tests/int/calendar-pdf-download.int.spec.tsx` with field traversal and resolver cases:

```tsx
import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { resolveCalendarPdf } from '@/blocks/shared/calendarPdf'
import { createCalendarPdfFields } from '@/blocks/shared/calendarPdfFields'
import type { Media } from '@/payload-types'

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    if ('fields' in field) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
    if ('tabs' in field) {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }
  }
}

const pdf = {
  filename: 'academic-calendar-2026-27.pdf',
  id: 'calendar-pdf',
  mimeType: 'application/pdf',
  url: '/media/academic-calendar-2026-27.pdf',
} as Media

describe('shared calendar PDF contract', () => {
  it('defines the reusable PDF authoring fields', () => {
    const fields = createCalendarPdfFields()
    const upload = findNamedField(fields, 'calendarPdf')
    const title = findNamedField(fields, 'calendarPdfTitle') as Field & {
      admin?: { condition?: (_data: unknown, siblingData?: Record<string, unknown>) => boolean }
    }
    const label = findNamedField(fields, 'calendarPdfLabel') as Field & {
      admin?: { condition?: (_data: unknown, siblingData?: Record<string, unknown>) => boolean }
    }

    expect(upload).toMatchObject({
      filterOptions: { mimeType: { equals: 'application/pdf' } },
      label: 'Calendar PDF',
      relationTo: 'media',
      type: 'upload',
    })
    expect(title).toMatchObject({
      defaultValue: 'Academic calendar PDF',
      label: 'PDF Document Label',
      type: 'text',
    })
    expect(label).toMatchObject({
      defaultValue: 'Download',
      label: 'PDF Button Label',
      type: 'text',
    })
    expect(title.admin?.condition?.({}, {})).toBe(false)
    expect(title.admin?.condition?.({}, { calendarPdf: 'media-id' })).toBe(true)
    expect(label.admin?.condition?.({}, {})).toBe(false)
    expect(label.admin?.condition?.({}, { calendarPdf: 'media-id' })).toBe(true)
  })

  it('resolves only populated PDF Media and normalizes labels', () => {
    expect(resolveCalendarPdf(pdf, ' Academic year calendar ', ' Save PDF ')).toEqual({
      filename: 'academic-calendar-2026-27.pdf',
      href: '/media/academic-calendar-2026-27.pdf',
      label: 'Save PDF',
      title: 'Academic year calendar',
    })
    expect(resolveCalendarPdf(pdf, '   ', '   ')).toMatchObject({
      label: 'Download',
      title: 'Academic calendar PDF',
    })
    expect(resolveCalendarPdf('calendar-pdf')).toBeUndefined()
    expect(resolveCalendarPdf({ ...pdf, mimeType: 'image/jpeg' } as Media)).toBeUndefined()
    expect(resolveCalendarPdf({ ...pdf, url: null } as Media)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the shared contract test and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: FAIL because the shared field and resolver modules do not exist.

- [ ] **Step 3: Implement the shared field factory**

Create `src/blocks/shared/calendarPdfFields.ts`:

```ts
import type { Field, UploadField } from 'payload'

export const DEFAULT_CALENDAR_PDF_LABEL = 'Download'
export const DEFAULT_CALENDAR_PDF_TITLE = 'Academic calendar PDF'

export const createCalendarPdfFields = (): Field[] => [
  {
    name: 'calendarPdf',
    label: 'Calendar PDF',
    type: 'upload',
    relationTo: 'media',
    filterOptions: { mimeType: { equals: 'application/pdf' } },
    admin: { description: 'Optional PDF shown as a download below Upcoming.' },
  } satisfies UploadField,
  {
    name: 'calendarPdfTitle',
    label: 'PDF Document Label',
    type: 'text',
    defaultValue: DEFAULT_CALENDAR_PDF_TITLE,
    admin: { condition: (_data, siblingData) => Boolean(siblingData?.calendarPdf) },
  },
  {
    name: 'calendarPdfLabel',
    label: 'PDF Button Label',
    type: 'text',
    defaultValue: DEFAULT_CALENDAR_PDF_LABEL,
    admin: { condition: (_data, siblingData) => Boolean(siblingData?.calendarPdf) },
  },
]
```

- [ ] **Step 4: Implement the pure shared resolver**

Create `src/blocks/shared/calendarPdf.ts`:

```ts
import {
  DEFAULT_CALENDAR_PDF_LABEL,
  DEFAULT_CALENDAR_PDF_TITLE,
} from '@/blocks/shared/calendarPdfFields'
import { getMediaAbsoluteUrl, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'

export type ResolvedCalendarPdf = {
  filename?: string
  href: string
  label: string
  title: string
}

export function resolveCalendarPdf(
  media: string | number | Media | null | undefined,
  title?: string | null,
  label?: string | null,
): ResolvedCalendarPdf | undefined {
  if (!isMediaDoc(media) || media.mimeType?.toLowerCase() !== 'application/pdf') return undefined
  const href = getMediaAbsoluteUrl(media)
  if (!href) return undefined

  return {
    filename: media.filename?.trim() || undefined,
    href,
    label: label?.trim() || DEFAULT_CALENDAR_PDF_LABEL,
    title: title?.trim() || DEFAULT_CALENDAR_PDF_TITLE,
  }
}
```

- [ ] **Step 5: Replace Annual Calendar's inline fields and resolver import**

In `src/blocks/AnnualCalendar/config.ts`, remove `UploadField` from the Payload type import, import `createCalendarPdfFields`, and replace the three inline PDF fields with:

```ts
...createCalendarPdfFields(),
```

In `tests/int/annual-calendar.int.spec.tsx`, remove the duplicate field/resolver cases now owned by the shared contract test and change any remaining resolver import to:

```ts
import { resolveCalendarPdf } from '@/blocks/shared/calendarPdf'
```

Delete `src/blocks/AnnualCalendar/annualCalendarPdf.ts` only after all imports point to the shared resolver.

- [ ] **Step 6: Run the shared and Annual Calendar suites**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/annual-calendar.int.spec.tsx
```

Expected: all shared resolver, field-factory, and Annual Calendar tests pass.

- [ ] **Step 7: Record an uncommitted checkpoint**

Run `git diff -- src/blocks/shared src/blocks/AnnualCalendar tests/int/calendar-pdf-download.int.spec.tsx tests/int/annual-calendar.int.spec.tsx`. Confirm no unrelated edits, and do not stage or commit.

---

### Task 2: Build one sidebar-safe PDF panel and migrate Annual Calendar

**Files:**
- Create: `src/blocks/shared/CalendarPdfDownload.tsx`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx`
- Modify: `tests/int/calendar-pdf-download.int.spec.tsx`
- Modify: `tests/int/annual-calendar.int.spec.tsx`
- Delete: `src/blocks/AnnualCalendar/AnnualCalendarPdfDownload.tsx`

**Interfaces:**
- Consumes: `ResolvedCalendarPdf` from `src/blocks/shared/calendarPdf.ts`.
- Produces: `CalendarPdfDownload({ download, surface }): ReactElement`.
- Produces stable selectors: `data-calendar-pdf-download`, `data-calendar-pdf-icon`, and `data-calendar-pdf-title`.

- [ ] **Step 1: Add a failing presentation test**

Append to `tests/int/calendar-pdf-download.int.spec.tsx`:

```tsx
import { render } from '@testing-library/react'
import { CalendarPdfDownload } from '@/blocks/shared/CalendarPdfDownload'

it('renders a stacked semantic panel with a full-width action', () => {
  const { container } = render(
    <CalendarPdfDownload
      download={{
        filename: 'academic-calendar.pdf',
        href: '/media/academic-calendar.pdf',
        label: 'Download PDF',
        title: 'Academic calendar document with a long wrapping title',
      }}
      surface="brand"
    />,
  )

  const panel = container.querySelector('[data-calendar-pdf-download="true"]')
  const link = panel?.querySelector('a')
  expect(panel?.className).toContain('flex-col')
  expect(panel?.className).not.toContain('sm:flex-row')
  expect(panel?.querySelector('[data-calendar-pdf-title="true"]')?.className).toContain(
    'break-words',
  )
  expect(link?.className).toContain('w-full')
  expect(link?.getAttribute('download')).toBe('academic-calendar.pdf')
  expect(link?.textContent).toContain('Download PDF')
  expect(panel?.className).toContain('border-white')
})
```

- [ ] **Step 2: Run the test and confirm red state**

Run the focused shared test. Expected: FAIL because `CalendarPdfDownload` does not exist.

- [ ] **Step 3: Implement the shared panel**

Create `src/blocks/shared/CalendarPdfDownload.tsx`:

```tsx
import { Download, FileText } from 'lucide-react'

import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import type { ResolvedCalendarPdf } from '@/blocks/shared/calendarPdf'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CalendarPdfDownloadProps = {
  download: ResolvedCalendarPdf
  surface?: BlockSurface
}

export function CalendarPdfDownload({
  download,
  surface = 'light',
}: CalendarPdfDownloadProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  return (
    <div
      className={cn(styles.panel, 'flex flex-col gap-4 p-5')}
      data-calendar-pdf-download="true"
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0" data-calendar-pdf-icon="true" />
        <p className="min-w-0 break-words font-semibold" data-calendar-pdf-title="true">
          {download.title}
        </p>
      </div>
      <Button
        asChild
        className="w-full"
        variant={surface === 'brand' ? 'whiteOutline' : 'outline'}
      >
        <a download={download.filename || true} href={download.href}>
          <Download aria-hidden="true" data-icon="inline-start" />
          {download.label}
        </a>
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Migrate Annual Calendar to the shared component**

In `src/blocks/AnnualCalendar/Presentation.tsx`:

```tsx
import { CalendarPdfDownload } from '@/blocks/shared/CalendarPdfDownload'
import { resolveCalendarPdf } from '@/blocks/shared/calendarPdf'
```

Replace `resolveAnnualCalendarPdf(...)` with `resolveCalendarPdf(...)`, replace `<AnnualCalendarPdfDownload>` with `<CalendarPdfDownload>`, and delete the two Annual-specific imports. Delete `src/blocks/AnnualCalendar/AnnualCalendarPdfDownload.tsx` after no callers remain.

Update `tests/int/annual-calendar.int.spec.tsx` selectors to the shared `data-calendar-pdf-*` contract and assert `flex-col`, `break-words`, and `w-full` instead of `sm:flex-row` and a non-full-width action.

- [ ] **Step 5: Run shared and Annual Calendar tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx tests/int/annual-calendar.int.spec.tsx
```

Expected: all shared presentation and Annual Calendar tests pass.

- [ ] **Step 6: Scan the shared panel mechanically**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/shared/CalendarPdfDownload.tsx
```

Expected: `[]`, or only findings with an explicit documented reason before proceeding.

- [ ] **Step 7: Record an uncommitted checkpoint**

Run `git diff -- src/blocks/shared/CalendarPdfDownload.tsx src/blocks/AnnualCalendar tests/int/annual-calendar.int.spec.tsx tests/int/calendar-pdf-download.int.spec.tsx`. Do not stage or commit.

---

### Task 3: Add the shared PDF contract to Calendar

**Files:**
- Modify: `src/blocks/Calendar/config.ts`
- Modify: `src/blocks/Calendar/Presentation.tsx`
- Modify: `src/blocks/Calendar/CalendarClient.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`
- Modify: `tests/int/calendar-pdf-download.int.spec.tsx`

**Interfaces:**
- `CalendarBlockLike` gains `calendarPdf`, `calendarPdfTitle`, and `calendarPdfLabel`.
- `CalendarClientProps` gains `pdfDownload?: ResolvedCalendarPdf`.
- Calendar passes only the serializable resolved value into the client boundary.

- [ ] **Step 1: Add a failing Calendar composition test**

In `tests/int/calendar-pdf-download.int.spec.tsx`, import both block configs and add a schema-parity test:

```tsx
import { AnnualCalendarBlock } from '@/blocks/AnnualCalendar/config'
import { CalendarBlock } from '@/blocks/Calendar/config'

it.each([
  ['Calendar', CalendarBlock],
  ['Annual Calendar', AnnualCalendarBlock],
])('registers the shared PDF fields in %s', (_label, block) => {
  for (const name of ['calendarPdf', 'calendarPdfTitle', 'calendarPdfLabel']) {
    expect(findNamedField(block.fields, name)).toEqual(
      findNamedField(createCalendarPdfFields(), name),
    )
  }
})
```

In `tests/int/calendar.int.spec.tsx`, import `CalendarBlockPresentation` and `Media`, define the same populated PDF fixture, and add:

```tsx
it('renders the configured PDF below Upcoming and hides unresolved Media', () => {
  const { container, rerender } = render(
    <CalendarBlockPresentation
      calendarPdf={calendarPdf}
      calendarPdfLabel="Get PDF"
      calendarPdfTitle="Academic year 2026–27"
      initial={initial}
    />,
  )

  const upcoming = container.querySelector('[data-calendar-upcoming="true"]')
  const download = container.querySelector('[data-calendar-pdf-download="true"]')
  expect(upcoming).toBeTruthy()
  expect(download).toBeTruthy()
  expect(
    upcoming && download
      ? upcoming.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING
      : 0,
  ).not.toBe(0)
  expect(download?.querySelector('a')?.getAttribute('href')).toBe(
    '/media/academic-calendar-2026-27.pdf',
  )

  rerender(<CalendarBlockPresentation calendarPdf="calendar-pdf" initial={initial} />)
  expect(container.querySelector('[data-calendar-pdf-download="true"]')).toBeNull()
})
```

- [ ] **Step 2: Run Calendar tests and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: FAIL because Calendar has no PDF props, schema fields, or sidebar rendering.

- [ ] **Step 3: Add shared fields to Calendar's Content tab**

Import `createCalendarPdfFields` in `src/blocks/Calendar/config.ts` and insert the fields after `upcomingTitle`:

```ts
...createCalendarPdfFields(),
```

This placement groups Upcoming copy and its directly adjacent sidebar download settings.

- [ ] **Step 4: Resolve PDF data before the Calendar client boundary**

In `src/blocks/Calendar/Presentation.tsx`, add:

```ts
import { resolveCalendarPdf } from '@/blocks/shared/calendarPdf'
import type { Media } from '@/payload-types'
```

Extend `CalendarBlockLike`:

```ts
calendarPdf?: string | number | Media | null
calendarPdfLabel?: string | null
calendarPdfTitle?: string | null
```

Destructure these values, resolve them with:

```ts
const resolvedCalendarPdf = resolveCalendarPdf(calendarPdf, calendarPdfTitle, calendarPdfLabel)
```

and pass `pdfDownload={resolvedCalendarPdf}` to `CalendarClient`.

- [ ] **Step 5: Compose Upcoming and PDF in one Calendar sidebar**

In `src/blocks/Calendar/CalendarClient.tsx`, use type-only imports for `ResolvedCalendarPdf`, import `CalendarPdfDownload`, and extend props:

```ts
pdfDownload?: ResolvedCalendarPdf
```

Replace the standalone Upcoming sibling with:

```tsx
<div className="flex flex-col gap-4">
  <CalendarUpcoming
    classifications={initial.classifications}
    emptyMessage={emptyMessage}
    eyebrow={upcomingEyebrow}
    events={initial.upcoming}
    surface={surface}
    title={upcomingTitle}
  />
  {pdfDownload ? <CalendarPdfDownload download={pdfDownload} surface={surface} /> : null}
</div>
```

Do not move PDF state into `CalendarInitialSnapshot`; the document is block presentation data and must not alter fetch/cache identity.

- [ ] **Step 6: Run Calendar, Annual Calendar, and shared tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/annual-calendar.int.spec.tsx tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: all tests pass, including both schema rows in the parameterized shared contract.

- [ ] **Step 7: Record an uncommitted checkpoint**

Inspect `git diff -- src/blocks/Calendar src/blocks/shared src/blocks/AnnualCalendar tests/int/calendar.int.spec.tsx tests/int/calendar-pdf-download.int.spec.tsx`. Confirm Calendar fetching and snapshot files are untouched. Do not stage or commit.

---

### Task 4: Synchronize fixtures, generated types, docs, thumbnails, and project context

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/calendar.jpg`
- Modify if rendered output changes: `public/block-thumbnails/annual-calendar.jpg`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Regenerate: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate as needed: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Calendar thumbnail fixture supplies a populated PDF Media value and both labels.
- Generated `CalendarBlock` and `AnnualCalendarBlock` types expose the same three optional PDF fields.
- Maintained docs describe identical block-level PDF behavior and shared responsive presentation.

- [ ] **Step 1: Add a failing Calendar thumbnail assertion**

Extend `tests/int/block-thumbnail-fixtures.int.spec.ts`:

```ts
it('renders the Calendar PDF panel in its production fixture', () => {
  const html = renderToStaticMarkup(getBlockThumbnailFixture('calendar'))
  expect(html).toContain('data-calendar-block="true"')
  expect(html).toContain('data-calendar-pdf-download="true"')
  expect(html).toContain('Academic calendar PDF')
  expect(html).toContain('Download')
})
```

- [ ] **Step 2: Run the fixture test and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL because the Calendar fixture does not provide PDF props.

- [ ] **Step 3: Add the configured PDF to the Calendar fixture**

In `src/block-thumbnails/fixtures.tsx`, update the Calendar fixture:

```tsx
<CalendarBlockPresentation
  calendarPdf={{
    filename: 'academic-calendar-2026-27.pdf',
    id: 'calendar-pdf',
    mimeType: 'application/pdf',
    url: '/academic-calendar-2026-27.pdf',
  } as Media}
  calendarPdfLabel="Download"
  calendarPdfTitle="Academic calendar PDF"
  initial={calendarInitialSnapshot}
  size="compact"
  title="Academic calendar"
/>
```

- [ ] **Step 4: Generate Payload types and verify field parity**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `calendarPdf`, `calendarPdfTitle`, and `calendarPdfLabel` in both `CalendarBlock` and `AnnualCalendarBlock`, including matching select projections.

- [ ] **Step 5: Update maintained behavior documentation**

Update the Calendar row in `docs/guides/blocks.md` to state that editors may attach an optional block-level PDF and separately customize its document and button labels. Update `.agents/skills/project-context/references/block-system.md` so Calendar and Annual Calendar explicitly share the same PDF resolver and stacked semantic sidebar panel. Do not alter event-query or caching documentation.

- [ ] **Step 6: Run focused behavioral and contract tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/calendar-pdf-download.int.spec.tsx \
  tests/int/calendar.int.spec.tsx \
  tests/int/annual-calendar.int.spec.tsx \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: all focused suites pass.

- [ ] **Step 7: Regenerate the affected thumbnails**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=calendar pnpm generate:block-thumbnails
BLOCK_THUMBNAIL_SLUG=annualCalendar pnpm generate:block-thumbnails
```

Expected: both 1600×900 JPEGs regenerate successfully and show the stacked document label plus full-width action without overlap. If the local browser is unavailable, retain the existing Annual Calendar image when its pixels are unaffected, report the Calendar thumbnail as blocked, and do not fabricate an asset.

- [ ] **Step 8: Run the project-context update loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: check passes. Inspect generated context changes against `.agents/skills/project-context/references/change-impact-map.md` and keep only facts caused by this work.

- [ ] **Step 9: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both exit successfully; report any pre-existing warning separately.

- [ ] **Step 10: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: all repository tests pass. If MongoMemoryServer cannot bind in the sandbox, rerun only the affected database suites in an approved environment and distinguish environment failures from assertion failures.

- [ ] **Step 11: Perform the final impact and index-preservation review**

Run:

```bash
git diff --check
git status --short
git diff --cached --name-only
git diff --name-only
```

Confirm the final diff matches the design, no secrets or unrelated files were added, existing staged changes were not modified through index operations, and no commit was created.
