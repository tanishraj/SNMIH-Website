# Annual Calendar Dividers and PDF Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle dividers and smaller centered markers to the Annual Calendar Year Stream, plus an optional editor-uploaded PDF download panel beneath Coming Next.

**Architecture:** Keep event loading, annual period normalization, response snapshots, and cache identity unchanged. Add a Payload upload field and a small client-safe PDF resolver, then pass the resolved download into a dedicated sidebar presentation component. The Year Stream owns only its marker/divider geometry; the Annual Calendar presentation owns sidebar composition and sticky behavior.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui Button, Lucide React, Vitest, Testing Library.

## Global Constraints

- Do not create, stage, or commit Git changes; preserve the existing staged index exactly.
- Change only the Annual Calendar block, its focused tests, generated types, thumbnail fixture/image, operator documentation, and maintained project context.
- Use an editor-uploaded PDF from the existing `media` collection; do not generate or synchronize a PDF from News & Events.
- A missing, non-PDF, ID-only, or URL-less Media value must render no download panel and no broken link.
- The visible button label defaults to `Download calendar PDF` and remains editor-configurable.
- Display typography remains reserved for the block-level section title.
- Dividers, panels, buttons, focus states, and supporting text must use existing semantic surface tokens across light, subtle, brand, and dark website modes.
- Keep the current Annual Calendar query, cache, preview-snapshot, period, and Coming Next event semantics unchanged.
- Do not add a migration or compatibility bridge for these uncommitted fields.

---

### Task 1: Add the PDF authoring and normalization contract

**Files:**
- Create: `src/blocks/AnnualCalendar/annualCalendarPdf.ts`
- Modify: `src/blocks/AnnualCalendar/config.ts:1-146`
- Modify: `tests/int/annual-calendar.int.spec.tsx:1-128`
- Generated: `src/payload-types.ts`

**Interfaces:**
- Consumes: `Media` from `src/payload-types.ts`, plus `isMediaDoc()` and `getMediaAbsoluteUrl()` from `src/lib/media.ts`.
- Produces: `ResolvedAnnualCalendarPdf`, `resolveAnnualCalendarPdf()`, `calendarPdf`, and `calendarPdfLabel` for the presentation task.

- [ ] **Step 1: Record the staged-index baseline**

Run:

```bash
git diff --cached | shasum -a 256
```

Expected: capture the hash verbatim for the final comparison. Do not run `git add`.

- [ ] **Step 2: Write failing schema and resolver tests**

Add the `Media` type and resolver imports to `tests/int/annual-calendar.int.spec.tsx`:

```tsx
import type { Media } from '@/payload-types'
import { resolveAnnualCalendarPdf } from '@/blocks/AnnualCalendar/annualCalendarPdf'
```

Extend the authoring-contract test with exact upload behavior:

```tsx
const calendarPdf = findNamedField(AnnualCalendarBlock.fields, 'calendarPdf')
const calendarPdfLabel = findNamedField(AnnualCalendarBlock.fields, 'calendarPdfLabel') as Field & {
  admin?: { condition?: (_data: unknown, siblingData?: Record<string, unknown>) => boolean }
}

expect(calendarPdf).toMatchObject({
  label: 'Calendar PDF',
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { equals: 'application/pdf' } },
})
expect(calendarPdfLabel).toMatchObject({
  defaultValue: 'Download calendar PDF',
  label: 'PDF Download Label',
  type: 'text',
})
expect(calendarPdfLabel.admin?.condition?.({}, {})).toBe(false)
expect(calendarPdfLabel.admin?.condition?.({}, { calendarPdf: 'media-id' })).toBe(true)
```

Add a resolver test:

```tsx
it('resolves only populated PDF Media into a safe download contract', () => {
  const pdf = {
    id: 'calendar-pdf',
    filename: 'academic-calendar-2026-27.pdf',
    mimeType: 'application/pdf',
    url: '/media/academic-calendar-2026-27.pdf',
  } as Media

  expect(resolveAnnualCalendarPdf(pdf, ' Academic year PDF ')).toEqual({
    filename: 'academic-calendar-2026-27.pdf',
    href: '/media/academic-calendar-2026-27.pdf',
    label: 'Academic year PDF',
  })
  expect(resolveAnnualCalendarPdf(pdf, '   ')?.label).toBe('Download calendar PDF')
  expect(resolveAnnualCalendarPdf('calendar-pdf', null)).toBeUndefined()
  expect(
    resolveAnnualCalendarPdf({ ...pdf, mimeType: 'image/jpeg' } as Media, null),
  ).toBeUndefined()
  expect(resolveAnnualCalendarPdf({ ...pdf, url: null } as Media, null)).toBeUndefined()
})
```

- [ ] **Step 3: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because `annualCalendarPdf.ts`, `calendarPdf`, and `calendarPdfLabel` do not exist.

- [ ] **Step 4: Implement the client-safe PDF resolver**

Create `src/blocks/AnnualCalendar/annualCalendarPdf.ts`:

```ts
import { getMediaAbsoluteUrl, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'

export const DEFAULT_ANNUAL_CALENDAR_PDF_LABEL = 'Download calendar PDF'

export type ResolvedAnnualCalendarPdf = {
  filename?: string
  href: string
  label: string
}

export function resolveAnnualCalendarPdf(
  media: string | number | Media | null | undefined,
  label?: string | null,
): ResolvedAnnualCalendarPdf | undefined {
  if (!isMediaDoc(media) || media.mimeType?.toLowerCase() !== 'application/pdf') return undefined

  const href = getMediaAbsoluteUrl(media)
  if (!href) return undefined

  return {
    filename: media.filename?.trim() || undefined,
    href,
    label: label?.trim() || DEFAULT_ANNUAL_CALENDAR_PDF_LABEL,
  }
}
```

- [ ] **Step 5: Add the optional Payload upload fields**

In `src/blocks/AnnualCalendar/config.ts`, import `UploadField`, then add these fields after `upcomingTitle` and before `emptyStateMessage`:

```ts
{
  name: 'calendarPdf',
  label: 'Calendar PDF',
  type: 'upload',
  relationTo: 'media',
  filterOptions: { mimeType: { equals: 'application/pdf' } },
  admin: {
    description: 'Optional PDF shown as a download below Coming Next.',
  },
} satisfies UploadField,
{
  name: 'calendarPdfLabel',
  label: 'PDF Download Label',
  type: 'text',
  defaultValue: 'Download calendar PDF',
  admin: {
    condition: (_data, siblingData) => Boolean(siblingData?.calendarPdf),
  },
},
```

- [ ] **Step 6: Generate Payload types and verify the schema contract**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: type generation succeeds; the schema and resolver tests pass. Confirm `AnnualCalendarBlock` and `AnnualCalendarBlockSelect` contain `calendarPdf` and `calendarPdfLabel`.

---

### Task 2: Refine the Year Stream geometry

**Files:**
- Modify: `src/blocks/AnnualCalendar/AnnualCalendarYearStream.tsx:109-180`
- Modify: `tests/int/annual-calendar.int.spec.tsx:181-214`

**Interfaces:**
- Consumes: `CalendarSurfaceClasses.separator` for theme-aware divider color.
- Produces: eleven `data-annual-calendar-month-divider` elements and twelve `data-annual-calendar-marker` elements aligned to the spine.

- [ ] **Step 1: Add failing divider and marker assertions**

In the populated stream test, add:

```tsx
expect(container.querySelectorAll('[data-annual-calendar-month-divider="true"]')).toHaveLength(11)
expect(container.querySelectorAll('[data-annual-calendar-marker="true"]')).toHaveLength(12)
expect(container.querySelector('[data-annual-calendar-marker="true"]')?.className).toContain(
  'size-2.5',
)
expect(container.querySelector('[data-annual-calendar-spine="true"]')?.className).toContain(
  'left-[0.28125rem]',
)
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because the stream has no month-divider/marker hooks and still uses the 15px marker geometry.

- [ ] **Step 3: Implement the divider and smaller-marker geometry**

Update the spine to:

```tsx
className={cn('absolute top-7 bottom-0 left-[0.28125rem] w-px', styles.separator)}
```

Map with an index while retaining the existing `gap-9` chapter rhythm:

```tsx
{months.map((month, monthIndex) => {
  const isCurrentMonth = month.monthKey === currentMonthKey
  const hasFollowingMonth = monthIndex < months.length - 1
```

Change the marker to:

```tsx
<span
  aria-hidden="true"
  className={cn(
    'absolute top-1 left-0 size-2.5 rounded-none border border-current bg-current',
    isCurrentMonth && 'border-success bg-success',
  )}
  data-annual-calendar-marker="true"
/>
```

Add this as the final child of each month section so it sits halfway through the existing 36px inter-chapter gap without crossing the spine:

```tsx
{hasFollowingMonth ? (
  <span
    aria-hidden="true"
    className={cn('absolute right-0 -bottom-[1.125rem] left-7 h-px', styles.separator)}
    data-annual-calendar-month-divider="true"
  />
) : null}
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: PASS with 11 dividers, 12 markers, and the smaller centered spine geometry.

---

### Task 3: Add the theme-aware sidebar PDF panel

**Files:**
- Create: `src/blocks/AnnualCalendar/AnnualCalendarPdfDownload.tsx`
- Modify: `src/blocks/AnnualCalendar/AnnualCalendarUpcoming.tsx:13-33`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx:1-162`
- Modify: `tests/int/annual-calendar.int.spec.tsx:181-251`

**Interfaces:**
- Consumes: `ResolvedAnnualCalendarPdf`, `resolveAnnualCalendarPdf()`, `BlockSurface`, `resolveCalendarSurfaceClasses()`, shadcn `Button`, and Lucide `Download`.
- Produces: optional `data-annual-calendar-pdf-download` panel placed after Coming Next inside one sticky sidebar group.

- [ ] **Step 1: Add failing render, hidden-state, and theme assertions**

Add a populated PDF fixture:

```tsx
const calendarPdf = {
  id: 'calendar-pdf',
  filename: 'academic-calendar-2026-27.pdf',
  mimeType: 'application/pdf',
  url: '/media/academic-calendar-2026-27.pdf',
} as Media
```

Add this test:

```tsx
it('renders an optional configured PDF after Coming Next and hides unresolved Media', () => {
  const { container, rerender } = render(
    <AnnualCalendarBlockPresentation
      calendarPdf={calendarPdf}
      calendarPdfLabel="Download 2026–27 calendar"
      initial={initial}
    />,
  )

  const upcoming = container.querySelector('[data-annual-calendar-upcoming="true"]')
  const download = container.querySelector('[data-annual-calendar-pdf-download="true"]')
  const link = download?.querySelector('a')

  expect(upcoming).toBeTruthy()
  expect(download).toBeTruthy()
  expect(
    upcoming?.compareDocumentPosition(download as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(link?.getAttribute('href')).toBe('/media/academic-calendar-2026-27.pdf')
  expect(link?.getAttribute('download')).toBe('academic-calendar-2026-27.pdf')
  expect(link?.textContent).toContain('Download 2026–27 calendar')

  rerender(
    <AnnualCalendarBlockPresentation calendarPdf="calendar-pdf" initial={initial} />,
  )
  expect(container.querySelector('[data-annual-calendar-pdf-download="true"]')).toBeNull()
})
```

Extend the semantic theme test:

```tsx
const brandWithPdf = renderToStaticMarkup(
  <AnnualCalendarBlockPresentation
    appearance={{ background: 'brand', border: 'none' }}
    calendarPdf={calendarPdf}
    initial={initial}
  />,
)
expect(brandWithPdf).toContain('border-white')
expect(brandWithPdf).toContain('text-white')
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because the PDF props and sidebar panel do not exist.

- [ ] **Step 3: Create the dedicated PDF download panel**

Create `src/blocks/AnnualCalendar/AnnualCalendarPdfDownload.tsx`:

```tsx
import { Download } from 'lucide-react'

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
      className={cn(styles.panel, 'p-4')}
      data-annual-calendar-pdf-download="true"
    >
      <Button
        asChild
        className="w-full justify-between"
        size="lg"
        variant={surface === 'brand' ? 'whiteOutline' : 'outline'}
      >
        <a download={download.filename || true} href={download.href}>
          <span>{download.label}</span>
          <Download aria-hidden="true" data-icon="inline-end" />
        </a>
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Compose Coming Next and PDF as one sticky sidebar**

In `AnnualCalendarUpcoming.tsx`, remove its sticky wrapper and mark its root for ordering tests:

```tsx
return (
  <div data-annual-calendar-upcoming="true">
    <CalendarUpcoming
      classifications={[]}
      emptyMessage={emptyMessage}
      eyebrow={eyebrow}
      events={events}
      showLegend={false}
      surface={surface}
      title={title}
    />
  </div>
)
```

In `Presentation.tsx`:

1. Add `calendarPdf?: string | number | Media | null` and `calendarPdfLabel?: string | null` to `AnnualCalendarBlockLike`.
2. Import `Media`, `resolveAnnualCalendarPdf`, and `AnnualCalendarPdfDownload`.
3. Resolve the PDF before rendering:

```tsx
const resolvedCalendarPdf = resolveAnnualCalendarPdf(calendarPdf, calendarPdfLabel)
```

4. Replace the standalone `AnnualCalendarUpcoming` with one sticky group:

```tsx
<div className="flex flex-col gap-4 lg:sticky lg:top-6">
  <AnnualCalendarUpcoming
    emptyMessage={resolvedEmptyMessage}
    eyebrow={upcomingEyebrow?.trim() || 'Up next'}
    events={initial.upcoming}
    surface={appearanceClasses.surface}
    title={upcomingTitle?.trim() || 'Coming next'}
  />
  {resolvedCalendarPdf ? (
    <AnnualCalendarPdfDownload
      download={resolvedCalendarPdf}
      surface={appearanceClasses.surface}
    />
  ) : null}
</div>
```

- [ ] **Step 5: Run focused UI and preview-contract tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/annual-calendar.int.spec.tsx \
  tests/int/annual-calendar-data.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: PASS. The PDF remains presentation-only; annual snapshot and preview scope keys do not change.

---

### Task 4: Refresh visual evidence, documentation, context, and verification

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx:830-836`
- Regenerate: `public/block-thumbnails/annual-calendar.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Verify generated inventory files changed only when `project-context:update` requires it.

**Interfaces:**
- Consumes: completed Annual Calendar schema and presentation.
- Produces: accurate editor thumbnail, operator guidance, maintained architecture narrative, and a verified no-commit handoff.

- [ ] **Step 1: Add PDF data to the Annual Calendar thumbnail fixture**

Update the fixture to exercise the sidebar panel:

```tsx
<AnnualCalendarBlockPresentation
  calendarPdf={{
    id: 'annual-calendar-pdf',
    filename: 'academic-calendar-2026-27.pdf',
    mimeType: 'application/pdf',
    url: '/academic-calendar-2026-27.pdf',
  } as Media}
  initial={annualCalendarInitialSnapshot}
  size="compact"
  title="Academic calendar"
/>
```

- [ ] **Step 2: Regenerate only the Annual Calendar thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=annualCalendar pnpm generate:block-thumbnails
```

Expected: only `public/block-thumbnails/annual-calendar.jpg` is rewritten. Inspect the 1600×900 JPEG and confirm the dividers, smaller markers, Coming Next, and PDF action are legible without clipping.

- [ ] **Step 3: Update operator and architecture documentation**

In `docs/guides/blocks.md`, describe:

- the optional Calendar PDF upload and conditional label;
- the separate panel beneath Coming Next;
- hidden behavior for missing/unresolved Media;
- month dividers and smaller markers.

In `.agents/skills/project-context/references/block-system.md`, update the Annual Calendar paragraph to state that month chapters use inset semantic dividers and 10px square markers, and that the block may present an editor-uploaded PDF beneath Coming Next without changing event queries or cache identity.

- [ ] **Step 4: Run focused contracts, generated checks, and the design detector**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/annual-calendar-data.int.spec.ts \
  tests/int/annual-calendar.int.spec.tsx \
  tests/int/block-thumbnail-fixtures.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/AnnualCalendar
```

Expected: all focused tests and TypeScript pass; lint has no new warning; the detector returns no unexplained Annual Calendar finding.

- [ ] **Step 5: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` A stale optional knowledge graph is a warning, not a blocker.

- [ ] **Step 6: Run the full integration suite**

Run:

```bash
pnpm test:int
```

Expected: all repository integration tests pass. If MongoMemoryServer cannot bind inside the sandbox, rerun only the affected suites with the required execution permission and report both results precisely.

- [ ] **Step 7: Audit the final diff and prove the index was untouched**

Run:

```bash
git diff --check
git status --short
git diff --cached | shasum -a 256
```

Expected: no whitespace errors; only approved Annual Calendar-related working-tree changes plus pre-existing user changes; the final staged-index hash exactly matches Task 1 Step 1. Do not stage or commit any file.
