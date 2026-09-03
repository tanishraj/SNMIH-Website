# Fee Structure Layout and Download Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add equal full-width tabs, a constrained programme/session band, consistent table hover and weight behavior, and a configurable file-locked download action and container background.

**Architecture:** Extend the Fee Structure schema without renaming existing fields or changing its fee model. Reuse the shared tab, block-appearance, button, and Payload field contracts; pass normalized presentation values from the server component to the client table renderer. Existing documents retain content-width tabs, a Button/Outline download action, and a transparent outlined download container through runtime fallbacks.

**Tech Stack:** Next.js 16, React 19, TypeScript, Payload CMS 3, Tailwind CSS 4 semantic tokens, Radix Tabs, Vitest, Testing Library.

## Global Constraints

- Do not stage or commit any changes.
- Equal Full Width tabs apply on mobile, tablet, and desktop.
- Existing documents without `tabWidth` render Content Width.
- `feeDocument` remains the only rendered download destination.
- Existing documents without download presentation fields render Button, Outline, and a transparent outlined container.
- Use section background values and semantic tokens; do not hard-code SNMIH colors.
- Keep standard fee-head labels medium and total labels/values bold.
- Keep the header row stable on hover and preserve total-row emphasis during hover.
- Do not change fee values, normalization, calculations, categories, academic periods, or upload limits.
- Run Payload type generation and the project-context update/check loop.

---

### Task 1: Add failing schema and generated-contract tests

**Files:**
- Modify: `tests/int/fee-structure.int.spec.tsx`
- Verify: `src/blocks/FeeStructure/config.ts`
- Verify: `src/payload-types.ts`

**Interfaces:**
- Consumes: `FeeStructureBlock`, `findNamedField()`, Payload `SelectField` and `GroupField` contracts.
- Produces: failing tests for `tabWidth`, `downloadActionMode`, `downloadButtonVariant`, and `downloadAppearance`.

- [ ] **Step 1: Import `GroupField` and add schema assertions**

Change the Payload type import in `tests/int/fee-structure.int.spec.tsx`:

```tsx
import type { Field, GroupField, SelectField, TabsField } from 'payload'
```

Extend `uses only the approved theme controls and hides tab style for one category`:

```tsx
const tabWidth = findNamedField(FeeStructureBlock.fields, 'tabWidth') as SelectField
const downloadActionMode = findNamedField(
  FeeStructureBlock.fields,
  'downloadActionMode',
) as SelectField
const downloadButtonVariant = findNamedField(
  FeeStructureBlock.fields,
  'downloadButtonVariant',
) as SelectField
const downloadAppearance = findNamedField(
  FeeStructureBlock.fields,
  'downloadAppearance',
) as GroupField

expect(tabWidth).toMatchObject({
  defaultValue: 'content',
  required: true,
  options: [
    { label: 'Content Width', value: 'content' },
    { label: 'Equal Full Width', value: 'equal' },
  ],
})
expect(tabWidth.admin?.condition?.({}, { feeCategories: [{}] }, {} as never)).toBe(false)
expect(tabWidth.admin?.condition?.({}, { feeCategories: [{}, {}] }, {} as never)).toBe(true)

expect(downloadActionMode).toMatchObject({
  defaultValue: 'button',
  required: true,
  options: [
    { label: 'Link', value: 'link' },
    { label: 'Button', value: 'button' },
  ],
})
expect(downloadActionMode.admin?.condition?.({}, { feeDocument: null }, {} as never)).toBe(false)
expect(downloadActionMode.admin?.condition?.({}, { feeDocument: 'fees' }, {} as never)).toBe(true)

expect(downloadButtonVariant).toMatchObject({
  defaultValue: 'outline',
  required: true,
})
expect(
  downloadButtonVariant.admin?.condition?.(
    {},
    { downloadActionMode: 'link', feeDocument: 'fees' },
    {} as never,
  ),
).toBe(false)
expect(
  downloadButtonVariant.admin?.condition?.(
    {},
    { downloadActionMode: 'button', feeDocument: 'fees' },
    {} as never,
  ),
).toBe(true)

expect(downloadAppearance).toMatchObject({
  label: 'Download Container Appearance',
  type: 'group',
})
expect(downloadAppearance.fields).toHaveLength(1)
expect(findNamedField(downloadAppearance.fields, 'background')).toMatchObject({
  defaultValue: 'none',
  required: true,
})
expect(downloadAppearance.admin?.condition?.({}, { feeDocument: null }, {} as never)).toBe(false)
expect(downloadAppearance.admin?.condition?.({}, { feeDocument: 'fees' }, {} as never)).toBe(true)
```

- [ ] **Step 2: Run the focused test and confirm schema failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: FAIL because the four new fields are undefined.

---

### Task 2: Implement the Payload schema, shared appearance factory option, and types

**Files:**
- Modify: `src/blocks/shared/blockAppearanceFields.ts`
- Modify: `src/blocks/FeeStructure/config.ts`
- Modify: `src/blocks/FeeStructure/types.ts`
- Modify (generated): `src/payload-types.ts`
- Test: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**
- Consumes: `buttonVariantOptions`, Payload `Condition`, `GroupField`, and existing background normalization.
- Produces: customizable `createBlockAppearanceFields({ condition, label, name })`, `FeeStructureTabWidth`, `FeeStructureDownloadActionMode`, and `FeeStructureDownloadButtonVariant`.

- [ ] **Step 1: Make the shared appearance group nameable and conditionally visible**

Update `src/blocks/shared/blockAppearanceFields.ts`:

```tsx
import type { Condition, GroupField, SelectField } from 'payload'

type CreateBlockAppearanceFieldsOptions = {
  condition?: Condition
  includeBackground?: boolean
  includeBorder?: boolean
  label?: string
  name?: string
}
```

Replace the factory signature/body with:

```tsx
export const createBlockAppearanceFields = ({
  condition,
  includeBackground = true,
  includeBorder = true,
  label = 'Appearance',
  name = 'appearance',
}: CreateBlockAppearanceFieldsOptions = {}): GroupField =>
  ({
    name,
    label,
    type: 'group',
    ...(condition ? { admin: { condition } } : {}),
    fields: [
      ...(includeBackground ? [backgroundField] : []),
      ...(includeBorder ? [borderField] : []),
    ],
  }) satisfies GroupField
```

Defaults preserve every existing caller.

- [ ] **Step 2: Define Fee Structure field conditions and add schema fields**

In `src/blocks/FeeStructure/config.ts`, import the shared variants:

```tsx
import {
  buttonVariantOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'
```

Extend `FeeStructureSiblingData`:

```tsx
type FeeStructureSiblingData = {
  downloadActionMode?: 'button' | 'link' | null
  feeCategories?: unknown[] | null
  feeDocument?: unknown
}
```

Add conditions:

```tsx
const hasMultipleFeeCategories = (_data: unknown, siblingData: FeeStructureSiblingData) =>
  Array.isArray(siblingData?.feeCategories) && siblingData.feeCategories.length > 1

const hasFeeDocument = (_data: unknown, siblingData: FeeStructureSiblingData) =>
  Boolean(siblingData?.feeDocument)

const usesDownloadButton = (_data: unknown, siblingData: FeeStructureSiblingData) =>
  hasFeeDocument(_data, siblingData) && siblingData?.downloadActionMode !== 'link'
```

Use `hasMultipleFeeCategories` for the existing `tabStyle` condition, then add directly after `tabStyle`:

```tsx
{
  name: 'tabWidth',
  label: 'Category Tab Width',
  type: 'select',
  defaultValue: 'content',
  required: true,
  options: [
    { label: 'Content Width', value: 'content' },
    { label: 'Equal Full Width', value: 'equal' },
  ],
  admin: {
    condition: hasMultipleFeeCategories,
    description: 'Equal Full Width divides the complete tab rail evenly across every category.',
  },
} satisfies SelectField,
{
  name: 'downloadActionMode',
  label: 'Download Display As',
  type: 'select',
  defaultValue: 'button',
  required: true,
  options: [
    { label: 'Link', value: 'link' },
    { label: 'Button', value: 'button' },
  ],
  admin: { condition: hasFeeDocument },
} satisfies SelectField,
{
  name: 'downloadButtonVariant',
  label: 'Download Button Variant',
  type: 'select',
  defaultValue: 'outline',
  required: true,
  options: buttonVariantOptions,
  admin: { condition: usesDownloadButton },
} satisfies SelectField,
createBlockAppearanceFields({
  condition: hasFeeDocument,
  includeBorder: false,
  label: 'Download Container Appearance',
  name: 'downloadAppearance',
}),
```

- [ ] **Step 3: Add precise frontend types and runtime-compatible optional fields**

In `src/blocks/FeeStructure/types.ts`, extend the CMS link import and add aliases:

```tsx
import type { CmsActionValue, CmsActionVariant } from '@/lib/cmsLinks'

export type FeeStructureDownloadActionMode = 'button' | 'link'
export type FeeStructureDownloadButtonVariant = Exclude<CmsActionVariant, 'link'>
export type FeeStructureTabWidth = 'content' | 'equal'
```

Add these optional properties to `FeeStructureBlockLike`:

```tsx
downloadActionMode?: FeeStructureDownloadActionMode | null
downloadAppearance?: BlockAppearance | null
downloadButtonVariant?: FeeStructureDownloadButtonVariant | null
tabWidth?: FeeStructureTabWidth | null
```

- [ ] **Step 4: Generate and format Payload types**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write src/payload-types.ts
```

Expected: `FeeStructureBlock` contains the four new fields and the generated file remains formatted with a focused diff.

- [ ] **Step 5: Run the schema test and confirm it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: all current Fee Structure tests pass.

---

### Task 3: Add and implement tab-width, context-band, hover, and weight contracts

**Files:**
- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/Component.tsx`
- Modify: `src/blocks/FeeStructure/FeeStructureClient.tsx`

**Interfaces:**
- Consumes: `FeeStructureTabWidth`, shared content-tab classes, and the current semantic light/brand table surfaces.
- Produces: `data-fee-tab-width`, `data-fee-table-header-row`, `data-fee-row-label`, and responsive equal-width tab behavior.

- [ ] **Step 1: Add failing equal-width and programme/session-band tests**

Add to `FeeStructureBlockComponent` tests:

```tsx
it('supports equal full-width category tabs at every breakpoint', () => {
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory, nriCategory]}
      programmeName="MBBS"
      tabWidth="equal"
    />,
  )

  const rail = container.querySelector('[data-fee-tab-width="equal"]')
  const tabs = screen.getAllByRole('tab')

  expect(rail?.className).toContain('w-full')
  expect(rail?.className).toContain('min-w-0')
  expect(tabs.every((tab) => tab.className.includes('flex-1'))).toBe(true)
  expect(tabs.every((tab) => tab.className.includes('w-0'))).toBe(true)
  expect(tabs.every((tab) => !tab.className.includes('sm:'))).toBe(true)
})

it.each([
  ['left', 'self-start'],
  ['center', 'mx-auto'],
] as const)('constrains the fee context band when aligned %s', (contentAlignment, alignmentClass) => {
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      contentAlignment={contentAlignment}
      description="Official programme fees."
      feeCategories={[generalCategory]}
      programmeName="MBBS"
    />,
  )

  const context = container.querySelector('[data-fee-context="true"]')
  expect(context?.className).toContain('w-full')
  expect(context?.className).toContain('max-w-3xl')
  expect(context?.className).toContain(alignmentClass)
})
```

- [ ] **Step 2: Add failing hover and weight assertions for light and brand tables**

Add:

```tsx
it.each(['none', 'brand'] as const)(
  'keeps header, standard, and total hover states consistent on %s surfaces',
  (background) => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        appearance={{ background, border: 'none' }}
        feeCategories={[generalCategory]}
        programmeName="MBBS"
      />,
    )

    const header = container.querySelector('[data-fee-table-header-row="true"]')
    const standard = container.querySelector('[data-fee-row-emphasis="standard"]')
    const total = container.querySelector('[data-fee-row-emphasis="total"]')
    const standardLabel = standard?.querySelector('[data-fee-row-label="true"]')
    const totalLabel = total?.querySelector('[data-fee-row-label="true"]')

    expect(header?.className).toContain(
      background === 'brand'
        ? 'hover:bg-primary-foreground/[0.08]'
        : 'hover:bg-transparent',
    )
    expect(standard?.className).toContain(
      background === 'brand'
        ? 'hover:bg-primary-foreground/[0.06]'
        : 'hover:bg-muted/50',
    )
    expect(total?.className).toContain(
      background === 'brand'
        ? 'hover:bg-primary-foreground/[0.14]'
        : 'hover:bg-muted/75',
    )
    expect(standardLabel?.className).toContain('font-medium')
    expect(total?.className).toContain('font-bold')
    expect(totalLabel?.className).toContain('font-bold')
  },
)
```

- [ ] **Step 3: Run the focused test and confirm layout failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: FAIL because the new prop, hooks, width classes, and hover/weight classes are absent.

- [ ] **Step 4: Constrain the programme/session band and pass `tabWidth`**

In `src/blocks/FeeStructure/Component.tsx`, destructure `tabWidth = 'content'` and change the definition-list classes:

```tsx
className={cn(
  'flex w-full max-w-3xl flex-wrap gap-x-8 gap-y-3 border-y border-current/15 py-4',
  alignment === 'center'
    ? 'mx-auto justify-center text-center'
    : 'self-start',
)}
```

Pass the prop:

```tsx
<FeeStructureClient
  categories={categories}
  sectionBackground={appearanceClasses.background}
  tabStyle={tabStyle}
  tabWidth={tabWidth}
/>
```

- [ ] **Step 5: Normalize and render equal-width tabs in the client**

Import `FeeStructureTabWidth`, accept `tabWidth`, and normalize it:

```tsx
import type {
  FeeStructureTabStyle,
  FeeStructureTabWidth,
  ResolvedFeeStructureCategory,
} from './types'

const resolvedTabWidth: FeeStructureTabWidth = tabWidth === 'equal' ? 'equal' : 'content'
```

Replace the tab-list class with:

```tsx
className={cn(
  'flex flex-nowrap',
  resolvedTabWidth === 'equal' ? 'w-full min-w-0' : 'w-max min-w-full',
  getContentTabRailClasses(variant),
)}
data-fee-tab-width={resolvedTabWidth}
```

Add equal-width classes to every trigger:

```tsx
className={cn(
  getContentTabClasses(variant, category.id === activeCategoryID),
  resolvedTabWidth === 'equal' && 'w-0 min-w-0 flex-1 shrink px-2',
)}
```

- [ ] **Step 6: Make header and row hover/weight behavior explicit**

Add `data-fee-table-header-row="true"` to the header `TableRow`. Its light and brand class branch must be:

```tsx
className={cn(
  isBrandSurface
    ? 'bg-primary-foreground/[0.08] hover:bg-primary-foreground/[0.08]'
    : 'hover:bg-transparent',
)}
```

Replace body row classes with:

```tsx
className={cn(
  row.emphasis === 'total'
    ? isBrandSurface
      ? 'bg-primary-foreground/[0.1] font-bold hover:bg-primary-foreground/[0.14]'
      : 'bg-muted/60 font-bold hover:bg-muted/75'
    : isBrandSurface
      ? 'border-primary-foreground/20 hover:bg-primary-foreground/[0.06]'
      : 'hover:bg-muted/50',
)}
```

Apply the row-label weight and hook to the sticky desktop label:

```tsx
className={cn(
  'sticky left-0 z-10 h-auto py-3 text-left whitespace-normal',
  row.emphasis === 'total' ? 'font-bold' : 'font-medium',
  isBrandSurface
    ? 'bg-primary text-primary-foreground'
    : row.emphasis === 'total'
      ? 'bg-muted text-card-foreground'
      : 'bg-card text-card-foreground',
)}
data-fee-row-label="true"
```

Apply the same label weights to mobile:

```tsx
<p
  className={row.emphasis === 'total' ? 'font-bold' : 'font-medium'}
  data-fee-row-label="true"
>
  {row.label}
</p>
```

Change both light and brand mobile total-row classes from `font-semibold` to `font-bold`.

- [ ] **Step 7: Run the focused test and confirm layout contracts pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: all Fee Structure tests pass through Task 3.

---

### Task 4: Add and implement download action and container appearance contracts

**Files:**
- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/Component.tsx`

**Interfaces:**
- Consumes: `downloadActionMode`, `downloadButtonVariant`, `downloadAppearance`, `buttonVariants`, `Button`, and `resolveBlockAppearanceClasses()`.
- Produces: file-locked Link/Button presentation with semantic container backgrounds and runtime fallbacks.

- [ ] **Step 1: Add failing download mode and surface tests**

Extend the Media download test to assert current fallbacks:

```tsx
expect(html).toContain('data-fee-download-mode="button"')
expect(html).toContain('data-variant="outline"')
expect(html).toContain('data-fee-download-background="none"')
```

Add Link mode:

```tsx
it('renders the uploaded fee document as a configured download link', () => {
  const html = renderToStaticMarkup(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      downloadActionMode="link"
      downloadLabel="Get official fees"
      feeCategories={[generalCategory]}
      feeDocument={{ id: 'fees', url: '/media/fees.pdf' } as Media}
      programmeName="MBBS"
    />,
  )

  expect(html).toContain('data-fee-download-mode="link"')
  expect(html).toContain('href="/media/fees.pdf"')
  expect(html).toContain('download=""')
  expect(html).toContain('Get official fees')
  expect(html).toContain('underline')
  expect(html).not.toContain('data-variant="outline"')
})
```

Add Button variant and container background coverage:

```tsx
it.each(['brand', 'gradient-brand'] as const)(
  'applies %s download-container appearance with a readable configured button',
  (background) => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        downloadActionMode="button"
        downloadAppearance={{ background, border: 'none' }}
        downloadButtonVariant="whiteOutline"
        feeCategories={[generalCategory]}
        feeDocument={{ id: 'fees', url: '/media/fees.pdf' } as Media}
        programmeName="MBBS"
      />,
    )

    expect(html).toContain(`data-fee-download-background="${background}"`)
    expect(html).toContain(background === 'brand' ? 'bg-brand' : 'bg-gradient-brand')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('data-variant="whiteOutline"')
    expect(html).toContain('href="/media/fees.pdf"')
    expect(html).toContain('download=""')
  },
)
```

- [ ] **Step 2: Run the focused test and confirm download failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: FAIL because the new download presentation props and data hooks are absent.

- [ ] **Step 3: Add runtime resolvers and destructure download controls**

In `src/blocks/FeeStructure/Component.tsx`, import `buttonVariants`, `CmsActionVariant`, and the new Fee Structure types:

```tsx
import { Button, buttonVariants } from '@/components/ui/button'
import type { CmsActionVariant } from '@/lib/cmsLinks'
import type {
  FeeStructureBlockLike,
  FeeStructureDownloadButtonVariant,
} from './types'
```

Add a resolver:

```tsx
const resolveDownloadButtonVariant = (
  value?: FeeStructureDownloadButtonVariant | null,
): FeeStructureDownloadButtonVariant => {
  const variants: CmsActionVariant[] = [
    'default',
    'primary',
    'secondary',
    'outline',
    'white',
    'whiteOutline',
  ]

  return variants.includes(value as CmsActionVariant)
    ? (value as FeeStructureDownloadButtonVariant)
    : 'outline'
}
```

Destructure with fallbacks:

```tsx
downloadActionMode = 'button',
downloadAppearance,
downloadButtonVariant = 'outline',
```

Resolve presentation after `fileLabel`:

```tsx
const resolvedDownloadMode = downloadActionMode === 'link' ? 'link' : 'button'
const resolvedDownloadVariant = resolveDownloadButtonVariant(downloadButtonVariant)
const downloadAppearanceClasses = resolveBlockAppearanceClasses(downloadAppearance)
```

- [ ] **Step 4: Replace the fixed download button with Link/Button rendering**

Use the resolved appearance on the existing container:

```tsx
<div
  className={cn(
    'flex flex-col gap-4 rounded-[var(--radius)] border border-current/15 p-5 sm:flex-row sm:items-center sm:justify-between',
    downloadAppearanceClasses.className,
  )}
  data-fee-document="true"
  data-fee-download-background={downloadAppearanceClasses.background}
>
```

Keep the file-title group, then render the action:

```tsx
{resolvedDownloadMode === 'link' ? (
  <a
    className={cn(
      buttonVariants({ variant: 'link' }),
      'group/button h-auto gap-2 px-0 py-0 text-sm font-semibold text-current no-underline hover:text-current/80 hover:no-underline',
    )}
    data-fee-download-mode="link"
    download
    href={fileURL}
  >
    <span className="underline decoration-current decoration-2 underline-offset-4">
      {fileLabel}
    </span>
    <Download aria-hidden="true" data-icon="inline-end" />
  </a>
) : (
  <Button
    asChild
    className={cn(
      downloadAppearanceClasses.surface === 'brand' &&
        resolvedDownloadVariant === 'outline' &&
        'border-current/70 text-current hover:border-current hover:bg-current/10',
    )}
    variant={resolvedDownloadVariant}
  >
    <a data-fee-download-mode="button" download href={fileURL}>
      <Download aria-hidden="true" data-icon="inline-start" />
      {fileLabel}
    </a>
  </Button>
)}
```

Both branches use `fileURL`; do not add Page, URL, or new-tab fields.

- [ ] **Step 5: Run focused tests and confirm download contracts pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: all Fee Structure tests pass.

---

### Task 5: Refresh documentation, thumbnail, and complete verification

**Files:**
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` if refreshed
- Replace: `public/block-thumbnails/fee-structure.jpg`
- Verify: `src/payload-types.ts`
- Verify: `tests/int/page-blocks.int.spec.ts`
- Verify: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**
- Consumes: completed schema and presentation contracts.
- Produces: current maintained documentation, generated types, preview imagery, and a verified uncommitted working tree.

- [ ] **Step 1: Update the maintained Fee Structure behavior paragraph**

Append this text to the Fee Structure paragraph in `.agents/skills/project-context/references/block-system.md`:

```markdown
Category tabs support intrinsic Content Width or Equal Full Width across every breakpoint. The programme/session band follows the shared `max-w-3xl` introduction measure. Standard fee heads remain medium, Total rows are bold, and explicit light/brand hover states preserve row emphasis. The optional fee document remains the fixed download destination; editors can present it as a Link or semantic Button and apply the shared section backgrounds to its outlined container.
```

- [ ] **Step 2: Format changed source and tests**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/shared/blockAppearanceFields.ts \
  src/blocks/FeeStructure/config.ts \
  src/blocks/FeeStructure/types.ts \
  src/blocks/FeeStructure/Component.tsx \
  src/blocks/FeeStructure/FeeStructureClient.tsx \
  tests/int/fee-structure.int.spec.tsx \
  .agents/skills/project-context/references/block-system.md
```

Expected: formatting completes without changing unrelated files.

- [ ] **Step 3: Regenerate only the Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
```

Expected: `✓ feeStructure -> public/block-thumbnails/fee-structure.jpg` and exit code 0.

- [ ] **Step 4: Run focused integration contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/project-context-repository.int.spec.ts \
  --reporter=dot
```

Expected: all selected tests pass.

- [ ] **Step 5: Run static checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm lint
git diff --check
```

Expected: TypeScript and diff checks pass. ESLint has no errors; the existing unchanged Google Tag Manager advisory may remain as a warning.

- [ ] **Step 6: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` A stale knowledge-graph warning is allowed.

- [ ] **Step 7: Inspect the final working tree without changing the index**

Run:

```bash
git diff --stat
git diff --check
git status --short
git diff --cached --name-only
```

Expected: the approved Fee Structure refinements and pre-existing user changes remain visible. Do not stage, unstage, or commit any file.
