# Annual Calendar PDF Document Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Annual Calendar's button-only PDF panel with a Fee Structure-aligned document label and compact download action.

**Architecture:** Keep the existing PDF upload and hidden invalid-media behavior. Extend its small resolved presentation contract with a document title, then render a File icon/title group beside the existing shadcn download button. Production and live preview continue sharing `AnnualCalendarBlockPresentation`.

**Tech Stack:** Payload CMS 3.85, React 19, TypeScript, Tailwind CSS v4, shadcn/ui Button, Lucide React, Vitest, Testing Library.

## Global Constraints

- Do not create, stage, or commit Git changes; preserve the existing staged index exactly.
- Change only the Annual Calendar PDF authoring, resolver, presentation, focused tests, generated types, thumbnail, documentation, and maintained project context.
- `calendarPdfTitle` defaults to `Academic calendar PDF` and controls the left document label.
- `calendarPdfLabel` defaults to `Download` and controls only the button text.
- Follow the Fee Structure composition: File icon and document label on the left, compact Download-icon button on the right, stacking without reordering on narrow widths.
- Keep PDF Media validation, event queries, response snapshots, cache identity, Coming Next data, and invalid-media hiding unchanged.
- Use semantic surface and button variants across light, subtle, brand, and dark modes.
- Do not add a migration for these uncommitted fields.

---

### Task 1: Add the separate PDF title contract

**Files:**
- Modify: `src/blocks/AnnualCalendar/config.ts:140-175`
- Modify: `src/blocks/AnnualCalendar/annualCalendarPdf.ts:1-28`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx:25-90`
- Modify: `tests/int/annual-calendar.int.spec.tsx:68-170`
- Generated: `src/payload-types.ts`

**Interfaces:**
- Consumes: the existing populated PDF-only Media contract.
- Produces: `calendarPdfTitle?: string | null` and `ResolvedAnnualCalendarPdf.title: string` for the PDF panel.

- [ ] **Step 1: Record the staged-index baseline**

Run:

```bash
git diff --cached | shasum -a 256
```

Expected: capture the hash verbatim and do not run `git add`.

- [ ] **Step 2: Write failing schema and resolver tests**

Extend the Annual Calendar authoring-contract test:

```tsx
const calendarPdfTitle = findNamedField(AnnualCalendarBlock.fields, 'calendarPdfTitle') as
  | (Field & {
      admin?: {
        condition?: (_data: unknown, siblingData?: Record<string, unknown>) => boolean
      }
    })
  | undefined

expect(calendarPdfTitle).toMatchObject({
  defaultValue: 'Academic calendar PDF',
  label: 'PDF Document Label',
  type: 'text',
})
expect(calendarPdfTitle?.admin?.condition?.({}, {})).toBe(false)
expect(calendarPdfTitle?.admin?.condition?.({}, { calendarPdf: 'media-id' })).toBe(true)
expect(calendarPdfLabel).toMatchObject({
  defaultValue: 'Download',
  label: 'PDF Button Label',
  type: 'text',
})
```

Update the resolver expectations:

```tsx
expect(resolveAnnualCalendarPdf(pdf, ' Academic year calendar ', ' Save PDF ')).toEqual({
  filename: 'academic-calendar-2026-27.pdf',
  href: '/media/academic-calendar-2026-27.pdf',
  label: 'Save PDF',
  title: 'Academic year calendar',
})
expect(resolveAnnualCalendarPdf(pdf, '   ', '   ')).toMatchObject({
  label: 'Download',
  title: 'Academic calendar PDF',
})
```

- [ ] **Step 3: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because `calendarPdfTitle` and `ResolvedAnnualCalendarPdf.title` do not exist and the button default is still `Download calendar PDF`.

- [ ] **Step 4: Add the conditional Payload title field and refine button copy**

Add this between `calendarPdf` and `calendarPdfLabel` in `config.ts`:

```ts
{
  name: 'calendarPdfTitle',
  label: 'PDF Document Label',
  type: 'text',
  defaultValue: 'Academic calendar PDF',
  admin: {
    condition: (_data, siblingData) => Boolean(siblingData?.calendarPdf),
  },
},
```

Change `calendarPdfLabel` to:

```ts
{
  name: 'calendarPdfLabel',
  label: 'PDF Button Label',
  type: 'text',
  defaultValue: 'Download',
  admin: {
    condition: (_data, siblingData) => Boolean(siblingData?.calendarPdf),
  },
},
```

- [ ] **Step 5: Extend the resolver contract**

Update `annualCalendarPdf.ts`:

```ts
export const DEFAULT_ANNUAL_CALENDAR_PDF_TITLE = 'Academic calendar PDF'
export const DEFAULT_ANNUAL_CALENDAR_PDF_LABEL = 'Download'

export type ResolvedAnnualCalendarPdf = {
  filename?: string
  href: string
  label: string
  title: string
}

export function resolveAnnualCalendarPdf(
  media: string | number | Media | null | undefined,
  title?: string | null,
  label?: string | null,
): ResolvedAnnualCalendarPdf | undefined {
  if (!isMediaDoc(media) || media.mimeType?.toLowerCase() !== 'application/pdf') return undefined

  const href = getMediaAbsoluteUrl(media)
  if (!href) return undefined

  return {
    filename: media.filename?.trim() || undefined,
    href,
    label: label?.trim() || DEFAULT_ANNUAL_CALENDAR_PDF_LABEL,
    title: title?.trim() || DEFAULT_ANNUAL_CALENDAR_PDF_TITLE,
  }
}
```

- [ ] **Step 6: Propagate the title through shared presentation**

In `AnnualCalendarBlockLike`, add:

```ts
calendarPdfTitle?: string | null
```

Destructure it and update resolution:

```ts
const resolvedCalendarPdf = resolveAnnualCalendarPdf(
  calendarPdf,
  calendarPdfTitle,
  calendarPdfLabel,
)
```

- [ ] **Step 7: Generate types and verify the contract**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: generation succeeds; `AnnualCalendarBlock` and its select type include `calendarPdfTitle`; focused tests pass.

---

### Task 2: Match the Fee Structure document-action layout

**Files:**
- Modify: `src/blocks/AnnualCalendar/AnnualCalendarPdfDownload.tsx:1-35`
- Modify: `tests/int/annual-calendar.int.spec.tsx:290-355`

**Interfaces:**
- Consumes: `ResolvedAnnualCalendarPdf.title`, existing `surface`, shadcn `Button`, Lucide `FileText`, and Lucide `Download`.
- Produces: a responsive document-identity/action row under Coming Next.

- [ ] **Step 1: Write failing layout and copy assertions**

Pass both labels to the presentation fixture:

```tsx
<AnnualCalendarBlockPresentation
  calendarPdf={calendarPdf}
  calendarPdfLabel="Get PDF"
  calendarPdfTitle="Academic year 2026–27"
  initial={initial}
/>
```

Assert the separate roles:

```tsx
expect(download?.querySelector('[data-annual-calendar-pdf-title="true"]')?.textContent).toBe(
  'Academic year 2026–27',
)
expect(download?.querySelector('[data-annual-calendar-pdf-icon="true"]')).toBeTruthy()
expect(link?.textContent).toContain('Get PDF')
expect(link?.textContent).not.toContain('Academic year 2026–27')
expect(download?.className).toContain('sm:flex-row')
expect(link?.className).not.toContain('w-full')
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because the panel has no File icon/title group and still renders a full-width button.

- [ ] **Step 3: Implement the Fee Structure-aligned panel**

Replace `AnnualCalendarPdfDownload` with:

```tsx
import { Download, FileText } from 'lucide-react'

import type { ResolvedAnnualCalendarPdf } from '@/blocks/AnnualCalendar/annualCalendarPdf'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnnualCalendarPdfDownloadProps = {
  download: ResolvedAnnualCalendarPdf
  surface?: BlockSurface
}

export function AnnualCalendarPdfDownload({
  download,
  surface = 'light',
}: AnnualCalendarPdfDownloadProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  return (
    <div
      className={cn(
        styles.panel,
        'flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between',
      )}
      data-annual-calendar-pdf-download="true"
    >
      <div className="flex min-w-0 items-center gap-3">
        <FileText
          aria-hidden="true"
          className="size-5 shrink-0"
          data-annual-calendar-pdf-icon="true"
        />
        <p className="font-semibold" data-annual-calendar-pdf-title="true">
          {download.title}
        </p>
      </div>
      <Button
        asChild
        className="shrink-0"
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

- [ ] **Step 4: Run focused rendering and theme tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/annual-calendar.int.spec.tsx \
  tests/int/annual-calendar-data.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: all tests and TypeScript pass; brand output retains `whiteOutline` classes and contains no hard-coded color.

---

### Task 3: Refresh the fixture, documentation, context, and verification

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx:830-845`
- Regenerate: `public/block-thumbnails/annual-calendar.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Verify generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: completed two-label PDF panel.
- Produces: accurate editor visual evidence and maintained operator/project knowledge.

- [ ] **Step 1: Exercise both labels in the thumbnail fixture**

Add these props to the existing Annual Calendar thumbnail fixture:

```tsx
calendarPdfLabel="Download"
calendarPdfTitle="Academic calendar PDF"
```

- [ ] **Step 2: Regenerate and inspect only the Annual Calendar thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=annualCalendar pnpm generate:block-thumbnails
```

Expected: only `public/block-thumbnails/annual-calendar.jpg` is rewritten. Confirm the File icon/title group and compact button are legible, aligned, unclipped, and visually consistent with Fee Structure.

- [ ] **Step 3: Update the operator and block-system descriptions**

In `docs/guides/blocks.md`, describe the separate configurable PDF document label and button label.

In `.agents/skills/project-context/references/block-system.md`, state that the optional sidebar panel follows the Fee Structure document-label/action composition and keeps both labels editor-configurable.

- [ ] **Step 4: Run focused quality checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/annual-calendar-data.int.spec.ts \
  tests/int/annual-calendar.int.spec.tsx \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/AnnualCalendar
```

Expected: all focused tests and TypeScript pass; lint has no new warning; the detector returns no unexplained Annual Calendar finding.

- [ ] **Step 5: Complete project-context and full verification**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm test:int
git diff --check
git diff --cached | shasum -a 256
```

Expected: project context is current; all integration tests pass or sandbox-only Mongo failures pass when rerun with required port permission; no whitespace errors; the staged-index hash matches Task 1 Step 1. Do not stage or commit any file.
