# PG Fee Structure Split Atlas Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PG Fee Structure's desktop table and mobile cards with the approved responsive 50/50 department-chapters atlas while preserving its current authoring model.

**Architecture:** Keep Payload configuration and saved content unchanged. Extend normalized column metadata with its resolved shared value, render one new presentation-only atlas component, and keep `PGFeeStructureClient` responsible only for category tab state while the server component continues resolving section actions, media, and appearance.

**Tech Stack:** Payload CMS 3, Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Radix Tabs, Vitest, Testing Library, Playwright thumbnail capture.

## Global Constraints

- Do not add, remove, or rename Payload fields; no migration or `generate:types` run is required.
- Do not calculate totals, parse amounts, convert currencies, infer values, or reformat authored text.
- Keep the existing General/NRI category tabs, tab styles, tab widths, section appearance, actions, footer actions, spacing, and official-document settings.
- Category tabs sit above the complete split frame and switch both panels.
- Large screens use a 50/50 Primary/Card composition; compact screens stack summary then statement in DOM order.
- Shared charges appear in the summary and repeat in every department chapter.
- Display typography remains limited to the outer section-level title.
- The page must not gain horizontal overflow; fee cells reflow only while remaining readable.
- Preserve both SNMIH-Blue and SNMIH-Green light/dark semantic token behavior and the theme radius contract.
- Preserve unrelated dirty-worktree changes. The current PG Fee Structure baseline is untracked, so
  every commit step below is a gated checkpoint: do not run it unless the user first authorizes
  committing that baseline; otherwise complete and verify the task without committing.

---

## File Structure

- `src/blocks/PGFeeStructure/types.ts`: expose resolved shared values without changing authored types.
- `src/blocks/PGFeeStructure/normalizePGFeeStructure.ts`: retain each normalized shared value alongside the existing expanded department cells.
- `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx`: own the two-panel visitor composition, summary, shared charges, department chapters, and embedded document panel.
- `src/blocks/PGFeeStructure/PGFeeStructureClient.tsx`: retain category state and tab geometry, replacing table/card rendering with the atlas presenter.
- `src/blocks/PGFeeStructure/Component.tsx`: retain server-side normalization/resolution and pass programme/session/download context into the client.
- `tests/int/pg-fee-structure.int.spec.tsx`: replace table/card contracts with normalization, atlas, tabs, accessibility, and edge-case contracts.
- `src/block-thumbnails/fixtures.tsx`: continue supplying representative General/NRI data; change only if the atlas capture needs a more balanced fixture.
- `public/block-thumbnails/pg-fee-structure.jpg`: regenerate the 1600×900 picker preview.
- `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, `.agents/skills/project-context/references/block-system.md`: replace the obsolete table/mobile-card contract.
- `.agents/skills/project-context/references/project-inventory.json`: refresh generated project knowledge after the source change.

---

### Task 1: Preserve shared-charge metadata in normalization

**Files:**
- Modify: `src/blocks/PGFeeStructure/types.ts:57-62`
- Modify: `src/blocks/PGFeeStructure/normalizePGFeeStructure.ts:55-59`
- Test: `tests/int/pg-fee-structure.int.spec.tsx:103-164`

**Interfaces:**
- Consumes: existing `PGFeeColumnValue.sharedValue` and `PGFeeColumnValueMode`.
- Produces: `ResolvedPGFeeColumn.sharedValue?: string`, available only for normalized shared columns; existing `ResolvedPGFeeDepartment.cells` stays unchanged.

- [ ] **Step 1: Add a failing shared-value normalization assertion**

Extend the first normalization test so it verifies the new metadata while retaining the existing expanded cell assertion:

```tsx
expect(normalized[0]?.columns).toEqual([
  {
    id: expect.any(String),
    label: 'Tuition (Per Annum)',
    sharedValue: undefined,
    valueMode: 'department',
  },
  {
    id: expect.any(String),
    label: 'Hostel (Per Annum)',
    sharedValue: '₹3,15,000',
    valueMode: 'shared',
  },
  {
    id: expect.any(String),
    label: 'Security (One Time)',
    sharedValue: '₹2,00,000',
    valueMode: 'shared',
  },
])
expect(normalized[0]?.departments[0]?.cells).toEqual([
  '₹28,00,000',
  '₹3,15,000',
  '₹2,00,000',
])
```

Store the normalizer result in `const normalized = normalizePGFeeCategories(...)` so both assertions use the same value.

- [ ] **Step 2: Run the focused test and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because normalized columns do not yet expose `sharedValue`.

- [ ] **Step 3: Extend the resolved column type**

Change `ResolvedPGFeeColumn` to:

```ts
export type ResolvedPGFeeColumn = {
  id: string
  label: string
  sharedValue?: string
  valueMode: PGFeeColumnValueMode
}
```

- [ ] **Step 4: Retain resolved shared values in normalized columns**

Replace the final column projection with:

```ts
columns: columns.map(({ id, label: columnLabel, sharedValue, valueMode }) => ({
  id,
  label: columnLabel,
  sharedValue: valueMode === 'shared' ? sharedValue : undefined,
  valueMode,
})),
```

Do not change the department cell expansion loop.

- [ ] **Step 5: Run the focused test and type check**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: the focused suite passes and TypeScript exits 0.

- [ ] **Step 6: Commit only the normalization contract**

```bash
git add src/blocks/PGFeeStructure/types.ts src/blocks/PGFeeStructure/normalizePGFeeStructure.ts tests/int/pg-fee-structure.int.spec.tsx
git commit -m "refactor(pg-fees): expose shared charges"
```

---

### Task 2: Build and wire the department-chapters atlas

**Files:**
- Create: `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx`
- Modify: `src/blocks/PGFeeStructure/PGFeeStructureClient.tsx:1-321`
- Modify: `src/blocks/PGFeeStructure/Component.tsx:118-148`
- Test: `tests/int/pg-fee-structure.int.spec.tsx:273-369`

**Interfaces:**
- Consumes: `ResolvedPGFeeCategory`, `ResolvedFeeDocumentDownload`, `programmeName`, and `academicSession`.
- Produces: `PGFeeStructureAtlasPresentation(props)` plus stable `data-pg-fee-atlas-*` hooks used by focused tests and visual diagnosis.
- Produces: `PGFeeStructureClient` props `academicSession: string`, `categories`, `download?`, `programmeName: string`, `sectionBackground?`, `tabStyle?`, and `tabWidth?`.

- [ ] **Step 1: Replace table/card expectations with failing atlas contracts**

Replace the first component test with:

```tsx
it('renders a complete department-chapters atlas without a visitor table', () => {
  const { container } = render(
    <PGFeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory]}
      programmeName="Postgraduate Medical Courses"
      title="PG Fee Structure"
    />,
  )

  expect(container.querySelector('[data-pg-fee-atlas="true"]')).toBeTruthy()
  expect(container.querySelector('[data-pg-fee-atlas-summary="true"]')).toBeTruthy()
  expect(container.querySelector('[data-pg-fee-atlas-statement="true"]')).toBeTruthy()
  expect(container.querySelectorAll('[data-pg-fee-department-chapter="true"]')).toHaveLength(2)
  expect(container.querySelector('[data-pg-fee-shared-charges="true"]')).toBeTruthy()
  expect(screen.getByText('Postgraduate Medical Courses')).toBeTruthy()
  expect(screen.getByText('2026-27')).toBeTruthy()
  expect(screen.getByText('General')).toBeTruthy()
  expect(screen.getByText('2 Departments')).toBeTruthy()
  expect(screen.getByText('Resident Indian postgraduate fee structure.')).toBeTruthy()
  expect(screen.getByText('Amounts are displayed exactly as officially published.')).toBeTruthy()
  expect(container.querySelector('table')).toBeNull()
  expect(container.querySelector('[data-pg-fee-table-scroll]')).toBeNull()
  expect(container.querySelector('[data-pg-fee-department-card]')).toBeNull()

  for (const chapter of container.querySelectorAll('[data-pg-fee-department-chapter="true"]')) {
    expect(chapter.textContent).toContain('Tuition (Per Annum)')
    expect(chapter.textContent).toContain('Hostel (Per Annum)')
    expect(chapter.textContent).toContain('Security (One Time)')
    expect(chapter.textContent).toContain('₹3,15,000')
    expect(chapter.textContent).toContain('₹2,00,000')
  }
})
```

Update the tab test name to `switches the complete summary and department chapters through tabs`, and assert after selecting NRI:

```tsx
expect(screen.getByText('NRI category department fees')).toBeTruthy()
expect(screen.getByText('USD 64,000')).toBeTruthy()
expect(screen.getByText('Radiology')).toBeTruthy()
expect(screen.getByText('NRI tuition remains in the published currency.')).toBeTruthy()
expect(screen.queryByText('General Surgery')).toBeNull()
```

Update the download test to assert the document panel is nested inside the active summary:

```tsx
const summary = container.querySelector('[data-pg-fee-atlas-summary="true"]')
expect(summary?.querySelector('[data-fee-document="true"]')).toBeTruthy()
expect(summary?.querySelector('[data-fee-download-mode="link"]')).toBeTruthy()
```

- [ ] **Step 2: Add edge-case and accessibility tests before implementation**

Add these focused cases:

```tsx
it('omits optional summary regions and preserves missing authored values', () => {
  const { container } = render(
    <PGFeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[
        {
          label: 'General',
          columns: [{ label: 'Tuition', valueMode: 'department' }],
          departments: [{ name: 'Pathology', variableValues: [] }],
        },
      ]}
      programmeName="Postgraduate Medical Courses"
    />,
  )

  expect(container.querySelector('[data-pg-fee-shared-charges]')).toBeNull()
  expect(container.querySelector('[data-pg-fee-category-notes]')).toBeNull()
  expect(container.querySelector('[data-fee-document]')).toBeNull()
  expect(screen.getByText('1 Department')).toBeTruthy()
  expect(screen.getByText('—')).toBeTruthy()
})

it('uses semantic chapters and description lists with container-aware fee grids', () => {
  const { container } = render(
    <PGFeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory]}
      programmeName="Postgraduate Medical Courses"
    />,
  )

  const chapters = container.querySelectorAll('article[data-pg-fee-department-chapter="true"]')
  expect(chapters).toHaveLength(2)
  expect(container.querySelectorAll('dl[data-pg-fee-grid="true"]')).toHaveLength(2)
  expect(container.querySelectorAll('[data-pg-fee-grid="true"] dt').length).toBeGreaterThan(0)
  expect(container.querySelectorAll('[data-pg-fee-grid="true"] dd').length).toBeGreaterThan(0)
  expect(container.querySelector('[data-pg-fee-atlas="true"]')?.className).toContain('lg:grid-cols-2')
  expect(container.querySelector('[data-pg-fee-atlas-summary-inner="true"]')?.className).toContain('lg:sticky')
})
```

- [ ] **Step 3: Run the focused suite and verify the presentation tests fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because the current component still renders a table and mobile cards.

- [ ] **Step 4: Create the dedicated atlas presenter**

Create `PGFeeStructureAtlasPresentation.tsx` with this interface and composition:

```tsx
import {
  FeeDocumentDownload,
  type ResolvedFeeDocumentDownload,
} from '@/blocks/shared/FeeDocumentDownload'
import { cn } from '@/lib/utils'

import { isNumericPGFeeValue } from './normalizePGFeeStructure'
import type { ResolvedPGFeeCategory } from './types'

type PGFeeStructureAtlasPresentationProps = {
  academicSession: string
  category: ResolvedPGFeeCategory
  download?: ResolvedFeeDocumentDownload
  programmeName: string
}

export function PGFeeStructureAtlasPresentation({
  academicSession,
  category,
  download,
  programmeName,
}: PGFeeStructureAtlasPresentationProps) {
  const departmentCount = category.departments.length
  const sharedCharges = category.columns.filter(({ valueMode }) => valueMode === 'shared')
  const summaryFacts = [
    { id: 'programme', label: 'Programme', value: programmeName },
    { id: 'session', label: 'Academic Session', value: academicSession },
    { id: 'category', label: 'Admission Category', value: category.label },
    {
      id: 'departments',
      label: 'Departments',
      value: `${departmentCount} ${departmentCount === 1 ? 'Department' : 'Departments'}`,
    },
  ]

  return (
    <div
      className="grid min-w-0 overflow-clip rounded-card border border-border lg:grid-cols-2"
      data-pg-fee-atlas="true"
      data-pg-fee-category={category.label}
    >
      <aside className="min-w-0 bg-primary text-primary-foreground" data-pg-fee-atlas-summary="true">
        <div
          className="flex min-h-full flex-col gap-8 p-6 sm:p-8 lg:sticky lg:top-24 lg:min-h-[min(42rem,calc(100vh-8rem))]"
          data-pg-fee-atlas-summary-inner="true"
        >
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2" data-pg-fee-summary-facts="true">
            {summaryFacts.map((fact) => (
              <div className="min-w-0" key={fact.id}>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground">
                  {fact.label}
                </dt>
                <dd className="mt-1 wrap-break-word font-sans text-base font-medium">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          {sharedCharges.length > 0 ? (
            <section data-pg-fee-shared-charges="true">
              <h3 className="font-sans text-xl font-semibold tracking-tight">Shared charges</h3>
              <dl className="mt-4 divide-y divide-primary-foreground/20 border-y border-primary-foreground/20">
                {sharedCharges.map((charge) => (
                  <div className="grid min-w-0 gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-5" key={charge.id}>
                    <dt className="wrap-break-word text-sm text-primary-foreground">{charge.label}</dt>
                    <dd className={cn('wrap-break-word text-sm font-semibold', isNumericPGFeeValue(charge.sharedValue ?? '—') && 'tabular-nums')}>
                      {charge.sharedValue ?? '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {category.notes.length > 0 ? (
            <section data-pg-fee-category-notes="true">
              <h3 className="font-sans text-sm font-semibold">Notes</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-primary-foreground">
                {category.notes.map((note) => (
                  <li className={cn(note.emphasis && 'font-semibold')} key={note.id}>{note.text}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {download ? (
            <div className="mt-auto pt-2">
              <FeeDocumentDownload download={{ ...download, sectionBackground: 'brand' }} />
            </div>
          ) : null}
        </div>
      </aside>

      <section className="min-w-0 bg-card text-card-foreground" data-pg-fee-atlas-statement="true">
        <header className="border-b border-border p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Statement breakdown
          </p>
          <h3 className="mt-3 font-sans text-lg font-semibold tracking-tight text-card-foreground">
            {category.label} category department fees
          </h3>
          {category.caption ? (
            <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">{category.caption}</p>
          ) : null}
        </header>

        <div className="divide-y divide-border">
          {category.departments.map((department) => {
            const headingID = `pg-fee-department-${department.id}`

            return (
              <article
                aria-labelledby={headingID}
                className="px-6 py-5 transition-colors hover:bg-accent/35 sm:px-8"
                data-pg-fee-department-chapter="true"
                key={department.id}
              >
                <div className="mb-4">
                  <h4 className="font-sans text-base font-semibold tracking-tight" id={headingID}>
                    {department.name}
                  </h4>
                  {department.note ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{department.note}</p>
                  ) : null}
                </div>
                <dl
                  className="grid gap-x-5 gap-y-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]"
                  data-pg-fee-grid="true"
                >
                  {category.columns.map((column, index) => {
                    const value = department.cells[index] ?? '—'

                    return (
                      <div className="min-w-0 border-l border-border pl-4 first:border-l-0 first:pl-0" key={column.id}>
                        <dt className="wrap-break-word font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {column.label}
                        </dt>
                        <dd className={cn('mt-2 wrap-break-word text-sm font-medium', isNumericPGFeeValue(value) && 'tabular-nums')} data-pg-fee-value="true">
                          {value}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
```

After creating the file, run the focused ESLint command in Step 7 so the repository formatter can
normalize the JSX wrapping without changing the specified classes or markup.

- [ ] **Step 5: Reduce `PGFeeStructureClient` to tabs plus atlas rendering**

Delete the Card/Table imports and the old `PGFeeCategoryPresentation`. Import the new presenter and shared download type, then use:

```tsx
type PGFeeStructureClientProps = {
  academicSession: string
  categories: ResolvedPGFeeCategory[]
  download?: ResolvedFeeDocumentDownload
  programmeName: string
  sectionBackground?: BlockBackground | null
  tabStyle?: PGFeeTabStyle | null
  tabWidth?: PGFeeTabWidth | null
}

export function PGFeeStructureClient({
  academicSession,
  categories,
  download,
  programmeName,
  sectionBackground,
  tabStyle,
  tabWidth,
}: PGFeeStructureClientProps) {
  const storedStyle = tabStyle === 'boxed' || tabStyle === 'pills' ? tabStyle : 'underline'
  const variant = resolvePGFeeTabVariant(storedStyle)
  const tabSurface = resolveBlockSurface(sectionBackground)
  const resolvedTabWidth: PGFeeTabWidth =
    tabWidth === 'centered' || tabWidth === 'equal' ? tabWidth : 'content'
  const [selectedCategoryID, setSelectedCategoryID] = useState(categories[0]?.id ?? '')

  if (categories.length === 0) return null

  if (categories.length === 1) {
    return (
      <div data-pg-fee-categories="true">
        <PGFeeStructureAtlasPresentation
          academicSession={academicSession}
          category={categories[0]!}
          download={download}
          programmeName={programmeName}
        />
      </div>
    )
  }

  const activeCategoryID = categories.some(({ id }) => id === selectedCategoryID)
    ? selectedCategoryID
    : categories[0]!.id

  return (
    <TabsPrimitive.Root
      className="flex flex-col gap-6"
      data-pg-fee-categories="true"
      data-pg-fee-tab-style={storedStyle}
      onValueChange={setSelectedCategoryID}
      value={activeCategoryID}
    >
      <div className="no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain pb-1">
        <TabsPrimitive.List
          aria-label="PG fee categories"
          className={cn(
            'flex flex-nowrap',
            pgFeeTabRailWidthClasses[resolvedTabWidth],
            getContentTabRailClasses(variant, tabSurface),
          )}
          data-content-tab-variant={variant}
          data-pg-fee-tab-width={resolvedTabWidth}
        >
          {categories.map((category) => (
            <TabsPrimitive.Trigger
              className={cn(
                getContentTabClasses(variant, category.id === activeCategoryID, tabSurface),
                resolvedTabWidth === 'equal' &&
                  'w-0 min-w-0 flex-1 shrink overflow-hidden px-2 text-ellipsis',
              )}
              key={category.id}
              value={category.id}
            >
              {category.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </div>
      {categories.map((category) => (
        <TabsPrimitive.Content className="mt-0 outline-none" key={category.id} value={category.id}>
          <PGFeeStructureAtlasPresentation
            academicSession={academicSession}
            category={category}
            download={download}
            programmeName={programmeName}
          />
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
```

Retain `resolvePGFeeTabVariant` and `pgFeeTabRailWidthClasses` above this function unchanged. Import
`ResolvedFeeDocumentDownload`, `PGFeeStructureAtlasPresentation`, and `cn`; remove only the obsolete
Card/Table imports and `isNumericPGFeeValue` import.

- [ ] **Step 6: Move context and download into the active atlas**

In `Component.tsx`, delete the standalone programme/session `<dl>` and the standalone `FeeDocumentDownload` render. Keep resolving `resolvedDownload` server-side and pass the complete context:

```tsx
<PGFeeStructureClient
  academicSession={resolvedSession}
  categories={categories}
  download={resolvedDownload}
  programmeName={resolvedProgramme}
  sectionBackground={appearanceClasses.background}
  tabStyle={tabStyle}
  tabWidth={tabWidth}
/>
```

Remove only imports made unused by deleting the standalone markup; keep `FeeDocumentDownload` type and resolver imports required to build `resolvedDownload`.

- [ ] **Step 7: Run focused tests, TypeScript, and lint on touched source**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/PGFeeStructure tests/int/pg-fee-structure.int.spec.tsx
```

Expected: all PG Fee tests pass; TypeScript and focused ESLint exit 0.

- [ ] **Step 8: Commit only the atlas presentation unit**

```bash
git add src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx src/blocks/PGFeeStructure/PGFeeStructureClient.tsx src/blocks/PGFeeStructure/Component.tsx tests/int/pg-fee-structure.int.spec.tsx
git commit -m "feat(pg-fees): add department atlas"
```

---

### Task 3: Refresh the visual preview and maintained contracts

**Files:**
- Inspect: `src/block-thumbnails/fixtures.tsx:2328-2385`
- Replace: `public/block-thumbnails/pg-fee-structure.jpg`
- Modify: `docs/guides/blocks.md:93,189-203`
- Modify: `docs/architecture/feature-inventory.md:82`
- Modify: `.agents/skills/project-context/references/block-system.md:290-302`
- Update through generator: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: completed atlas presentation and the existing `pgFeeStructure` preview fixture.
- Produces: a 1600×900 JPEG matching the new presentation and current operator/architecture contracts.

- [ ] **Step 1: Confirm the existing thumbnail fixture needs no source edit**

Inspect `src/block-thumbnails/fixtures.tsx:2328-2385` and verify it already provides exactly these
capture conditions:

```text
programmeName: Postgraduate Medical Courses
academicSession: 2026-27
section surface: subtle with topAndBottom border
categories: General and NRI
General columns: department Tuition; shared Hostel ₹3,15,000; shared Security ₹2,00,000
General departments: General Medicine, General Surgery, Orthopedics, Ophthalmology
NRI columns: department Tuition; shared Hostel ₹3,15,000; shared Security ₹2,00,000
NRI departments: General Medicine USD 64,000; OBG USD 82,500; Radiology USD 1,07,500
tab width: centered
block size: compact
```

Expected: no fixture diff. The current data is deliberately retained so the regenerated image isolates
the presentation change.

- [ ] **Step 2: Generate only the PG Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=pgFeeStructure pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/pg-fee-structure.jpg` is replaced and reported as a 1600×900 JPEG.

- [ ] **Step 3: Inspect the generated image**

Open the JPEG and verify:

- the category tabs are above the split frame;
- the Primary summary and Card statement each occupy half the large-screen frame;
- at least two department chapters are legible;
- shared charge labels/values are not clipped;
- no table scrollbar is present;
- the frame uses the theme radius without doubled corner artifacts.

If the capture is unbalanced, adjust only the preview fixture content and regenerate the same slug.

- [ ] **Step 4: Replace obsolete operator and architecture language**

Use this contract consistently in all three narrative files:

```markdown
PG Fee Structure uses a responsive 50/50 Primary/Card department atlas. The Primary summary contains programme, session, active admission category, department count, category-shared charges, category notes, and the optional official-document panel. The statement side renders one complete chapter per department and repeats shared values so every chapter remains self-contained. Multiple categories switch the complete frame through the existing themed tabs. Compact layouts stack summary then statement, fee grids reflow without page-level horizontal scrolling, and runtime never calculates, parses, reformats, or converts authored amounts.
```

Retain the existing authoring limits, validation behavior, excluded payment fields, and no-migration statement.

- [ ] **Step 5: Refresh and inspect project context**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/project-inventory.json .agents/skills/project-context/references/block-system.md
```

Expected: generated inventory changes only if source facts changed; `block-system.md` describes the atlas instead of table/mobile cards. A stale optional knowledge graph is a warning, not a failure.

- [ ] **Step 6: Run the required final verification matrix**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm project-context:check
git diff --check
```

Expected:

- focused PG Fee, registration, renderer, and project-context tests pass;
- TypeScript exits 0;
- lint has no new errors (report any existing unrelated warning separately);
- project context is current;
- no whitespace errors exist.

- [ ] **Step 7: Review the final diff against the change-impact map**

Confirm:

```text
Source producer: normalizePGFeeStructure.ts and types.ts
Frontend consumers: PGFeeStructureAtlasPresentation.tsx, PGFeeStructureClient.tsx, Component.tsx
Payload schema: unchanged
Production/live-preview registrations: unchanged and still covered
Thumbnail fixture/asset: current
Generated Payload types: unchanged
Focused tests: current
Operator/architecture/project context: current
Existing Fee Structure: unchanged
```

- [ ] **Step 8: Commit only the visual and documentation refresh**

```bash
git add public/block-thumbnails/pg-fee-structure.jpg docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(pg-fees): document atlas layout"
```

If `project-inventory.json` is unchanged, omit that path from `git add`.

---

## Completion Criteria

- PG Fee Structure renders no visitor table or mobile-card duplicate branch.
- Every active department has one semantic, complete fee chapter.
- Shared charges are summarized once and repeated per department.
- Programme/session/category/department count, notes, and document panel live in the Primary summary.
- Category tabs switch the entire atlas and preserve all current tab variants and widths.
- Compact and wide layouts remain readable without page-level horizontal scrolling.
- Payload schema, saved content, existing Fee Structure, renderer registrations, and generated types remain unchanged.
- The new thumbnail, focused tests, TypeScript, lint, project-context update/check, and final diff check pass.
