# CTA Action Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add distinct Content Split and Action Split CTA layouts, including inline or stacked right-column actions, without breaking stored `split` records.

**Architecture:** Keep `split` as the persisted Content Split value and add `actionSplit` plus its conditional `actionLayout` field to the Payload schema. The server component will normalize stale values and resolve actions before choosing a layout, then render one semantic copy group and layout-specific supporting or action columns using the existing section, typography, and action primitives.

**Tech Stack:** Payload CMS 3.85, Next.js 16.2, React 19, Tailwind CSS 4, TypeScript, Vitest

## Global Constraints

- `headerLayout: 'split'` remains the stored value for Content Split so existing records require no migration.
- Header Layout offers Stacked, Content Split, and Action Split; the default remains `stacked`.
- Content Split renders eyebrow and title in the lead column, with description and section actions in the supporting column.
- Action Split renders eyebrow, title, and description in the lead column, with section actions alone in a right-aligned desktop column.
- `actionLayout` offers `inline` and `stacked`, defaults to `inline`, and appears only for Action Split.
- On smaller screens, Action Split actions follow the copy and use normal `contentAlignment`; desktop right-edge positioning starts at `lg`.
- Action Split with no valid resolved section actions falls back to Stacked.
- Content Split retains `splitContentAlignment` with `top`, `center`, and `bottom`; the default remains `center`.
- The description remains constrained to `max-w-2xl` in every layout.
- Footer actions remain outside the main CTA composition and keep existing behavior.
- The section remains the only visual surface; do not add an inner background, border, radius, or boxed padding.
- Existing action variants, shared theme tokens, and other blocks remain unchanged.

---

## File Structure

- Modify `tests/int/cta39.int.spec.tsx`: define the admin schema, three layout compositions, action arrangements, semantic order, and fallback contracts.
- Modify `src/blocks/Cta39/config.ts`: add the backward-compatible layout option and conditional Action Layout control.
- Modify `src/blocks/Cta39/Component.tsx`: normalize the new inputs and render Content Split and Action Split independently.
- Regenerate `src/payload-types.ts`: expose `actionSplit` and `actionLayout` in generated Payload types.
- Modify `src/block-thumbnails/fixtures.tsx`: demonstrate Action Split with the two shared white button variants.
- Regenerate `public/block-thumbnails/cta-39.jpg`: keep the admin block picker preview aligned with production rendering.

### Task 1: Lock the Action Split contracts

**Files:**

- Modify: `tests/int/cta39.int.spec.tsx`
- Test: `tests/int/cta39.int.spec.tsx`

**Interfaces:**

- Consumes: `Cta39Block`, `Cta39BlockComponent`, and the existing recursive field helpers.
- Produces: failing regression tests for `headerLayout: 'actionSplit'`, `actionLayout`, desktop arrangement, semantic order, and safe fallbacks.

- [ ] **Step 1: Extend the schema field test**

Update the expected Theme Settings field order and option assertions in `tests/int/cta39.int.spec.tsx`:

```tsx
expect(themeTab?.fields.map((field) => field.name)).toEqual([
  'appearance',
  'headerLayout',
  'contentAlignment',
  'splitContentAlignment',
  'actionLayout',
  'size',
])
expect(selectValues(allFields, 'headerLayout')).toEqual(['stacked', 'split', 'actionSplit'])
expect(findNamedField(allFields, 'headerLayout')?.options).toEqual([
  { label: 'Stacked', value: 'stacked' },
  { label: 'Content Split', value: 'split' },
  { label: 'Action Split', value: 'actionSplit' },
])
expect(findNamedField(allFields, 'actionLayout')).toMatchObject({
  defaultValue: 'inline',
  required: true,
  type: 'select',
})
expect(findNamedField(allFields, 'actionLayout')?.admin?.condition).toBeTypeOf('function')
expect(selectValues(allFields, 'actionLayout')).toEqual(['inline', 'stacked'])
```

Keep the existing `splitContentAlignment` condition and values assertions to prove Content Split remains intact.

- [ ] **Step 2: Add the Action Split composition test**

Add a test that verifies the copy stays together, the actions follow it semantically, and the dedicated column begins only at the desktop breakpoint:

```tsx
it('renders Action Split with copy left and actions on the desktop right edge', () => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent
      actions={[
        { label: 'Apply now', linkType: 'custom', url: '/apply' },
        { label: 'Book a visit', linkType: 'custom', url: '/visit' },
      ]}
      description="Choose your route and take the next step."
      eyebrow="Admissions"
      headerLayout="actionSplit"
      title="Start your application."
    />,
  )

  expect(html).toContain('data-cta39-layout="actionSplit"')
  expect(html).toContain('lg:grid-cols-[minmax(0,1fr)_auto]')
  expect(html).toContain('lg:justify-self-end')
  expect(html).toContain('data-cta39-action-layout="inline"')
  expect(html).toContain('lg:flex-row')
  expect(html).toContain('max-w-2xl')
  expect(html.indexOf('Admissions')).toBeLessThan(html.indexOf('Start your application.'))
  expect(html.indexOf('Start your application.')).toBeLessThan(
    html.indexOf('Choose your route and take the next step.'),
  )
  expect(html.indexOf('Choose your route and take the next step.')).toBeLessThan(
    html.indexOf('Apply now'),
  )
})
```

- [ ] **Step 3: Add inline, stacked, mobile-alignment, and fallback cases**

Add the arrangement cases:

```tsx
it.each([
  ['inline', 'lg:flex-row'],
  ['stacked', 'lg:flex-col'],
] as const)('arranges Action Split buttons %s on desktop', (actionLayout, className) => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent
      actionLayout={actionLayout}
      actions={[{ label: 'Apply', linkType: 'custom', url: '/apply' }]}
      contentAlignment="center"
      headerLayout="actionSplit"
      title="Take the next step."
    />,
  )

  expect(html).toContain(`data-cta39-action-layout="${actionLayout}"`)
  expect(html).toContain(className)
  expect(html).toContain('items-center sm:justify-center')
})
```

Extend the stale-value test with an Action Split whose stale `actionLayout` resolves to inline:

```tsx
const staleActionSplit = renderToStaticMarkup(
  <Cta39BlockComponent
    actionLayout={'stale' as never}
    actions={[{ label: 'Apply', linkType: 'custom', url: '/apply' }]}
    headerLayout="actionSplit"
    title="Take the next step."
  />,
)
expect(staleActionSplit).toContain('data-cta39-layout="actionSplit"')
expect(staleActionSplit).toContain('data-cta39-action-layout="inline"')
expect(staleActionSplit).toContain('lg:flex-row')
```

Add the invalid-action fallback:

```tsx
it('falls back to Stacked when Action Split has no valid section actions', () => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent
      actions={[{ label: 'Missing destination', linkType: 'custom', url: '' }]}
      description="Supporting copy remains with the CTA."
      headerLayout="actionSplit"
      title="Take the next step."
    />,
  )

  expect(html).toContain('data-cta39-layout="stacked"')
  expect(html).toContain('Supporting copy remains with the CTA.')
  expect(html).not.toContain('data-cta39-action-layout')
  expect(html).not.toContain('lg:justify-self-end')
})
```

- [ ] **Step 4: Update the generated-type expectations**

Replace the CTA type assertions with:

```tsx
expect(ctaType).toContain("headerLayout: 'stacked' | 'split' | 'actionSplit';")
expect(ctaType).toContain("splitContentAlignment?: ('top' | 'center' | 'bottom') | null;")
expect(ctaType).toContain("actionLayout?: ('inline' | 'stacked') | null;")
```

- [ ] **Step 5: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx
```

Expected: FAIL because the schema does not yet expose `actionSplit` or `actionLayout`, the component type rejects those props, and the generated type lacks both additions.

- [ ] **Step 6: Commit the failing contract**

```bash
git add tests/int/cta39.int.spec.tsx
git commit -m "test(cta): define action split contract"
```

### Task 2: Implement the schema and three CTA compositions

**Files:**

- Modify: `src/blocks/Cta39/config.ts`
- Modify: `src/blocks/Cta39/Component.tsx`
- Test: `tests/int/cta39.int.spec.tsx`

**Interfaces:**

- Consumes: existing `resolveCmsActions`, `ContentActions`, shared section appearance, spacing, eyebrow, and typography primitives.
- Produces: `Cta39BlockComponent` props `headerLayout?: 'stacked' | 'split' | 'actionSplit' | null` and `actionLayout?: 'inline' | 'stacked' | null`, plus the matching Payload fields.

- [ ] **Step 1: Add the backward-compatible Payload controls**

In `src/blocks/Cta39/config.ts`, replace the sibling type and conditions with:

```ts
type Cta39SiblingData = {
  headerLayout?: 'actionSplit' | 'split' | 'stacked' | null
}

const isSplitLayout = (_data: unknown, siblingData: Cta39SiblingData) =>
  siblingData?.headerLayout === 'split'

const isActionSplitLayout = (_data: unknown, siblingData: Cta39SiblingData) =>
  siblingData?.headerLayout === 'actionSplit'
```

Update `headerLayoutField` exactly as follows:

```ts
const headerLayoutField = {
  name: 'headerLayout',
  label: 'Header Layout',
  type: 'select',
  defaultValue: 'stacked',
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Content Split', value: 'split' },
    { label: 'Action Split', value: 'actionSplit' },
  ],
  required: true,
  admin: {
    description: 'Keep all content together, split copy from the heading, or place actions on the right.',
  },
} satisfies SelectField
```

Add the conditional field after `splitContentAlignmentField`:

```ts
const actionLayoutField = {
  name: 'actionLayout',
  label: 'Action Layout',
  type: 'select',
  defaultValue: 'inline',
  options: [
    { label: 'Inline', value: 'inline' },
    { label: 'Stacked', value: 'stacked' },
  ],
  required: true,
  admin: {
    condition: isActionSplitLayout,
    description: 'Arrange the right-column actions in a row or a vertical stack on desktop.',
  },
} satisfies SelectField
```

Insert `actionLayoutField` between `splitContentAlignmentField` and `ctaSizeField` in Theme Settings.

- [ ] **Step 2: Extend and normalize the component inputs**

In `src/blocks/Cta39/Component.tsx`, define and consume the new values:

```ts
type Cta39ActionLayout = 'inline' | 'stacked'
type Cta39HeaderLayout = 'actionSplit' | 'split' | 'stacked'

type Cta39BlockLike = {
  accentTitle?: string | null
  actionLayout?: Cta39ActionLayout | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: Cta39Alignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: Cta39HeaderLayout | null
  size?: RegularBlockSize | null
  splitContentAlignment?: Cta39SplitContentAlignment | null
  title?: string | null
}
```

Destructure `actionLayout = 'inline'`, then normalize the layout after resolving actions:

```ts
const resolvedActionLayout: Cta39ActionLayout =
  actionLayout === 'stacked' ? 'stacked' : 'inline'
const hasSupportingContent = Boolean(resolvedDescription || resolvedActions.length)
const resolvedHeaderLayout: Cta39HeaderLayout =
  headerLayout === 'actionSplit' && resolvedActions.length
    ? 'actionSplit'
    : headerLayout === 'split' && hasSupportingContent
      ? 'split'
      : 'stacked'
```

- [ ] **Step 3: Separate the reusable description and actions nodes**

Replace the combined `supportingContent` fragment with:

```tsx
const descriptionNode = resolvedDescription ? (
  <p
    className={cn(
      contentSectionDescriptionClasses,
      'max-w-2xl',
      descriptionAlignmentClasses[resolvedContentAlignment],
    )}
  >
    {resolvedDescription}
  </p>
) : null

const actionsNode = (
  <ContentActions
    actions={resolvedActions}
    alignment={resolvedContentAlignment}
    data-cta39-actions="true"
  />
)
```

Render `descriptionNode` followed by `actionsNode` inside the lead content group only when `resolvedHeaderLayout === 'stacked'`. Render the same two nodes in that order inside the existing supporting column only when `resolvedHeaderLayout === 'split'`.

- [ ] **Step 4: Render the Action Split grid and action-only column**

Add the desktop action arrangement classes:

```ts
const actionLayoutClasses = {
  inline: 'lg:w-auto lg:flex-row lg:flex-nowrap lg:justify-end',
  stacked: 'lg:w-auto lg:flex-col lg:flex-nowrap lg:items-end',
} as const
```

Resolve the header grid class with all three layouts:

```tsx
className={cn(
  'grid gap-6',
  resolvedHeaderLayout === 'split'
    ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:gap-16'
    : resolvedHeaderLayout === 'actionSplit'
      ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16'
      : cn('max-w-3xl', blockAlignmentClasses[resolvedContentAlignment]),
)}
```

Inside the lead content group, render `descriptionNode` for Stacked and Action Split, but render `actionsNode` there only for Stacked:

```tsx
{resolvedHeaderLayout !== 'split' ? descriptionNode : null}
{resolvedHeaderLayout === 'stacked' ? actionsNode : null}
```

After the Content Split supporting column, add the Action Split action column:

```tsx
{resolvedHeaderLayout === 'actionSplit' ? (
  <div
    className="flex min-w-0 lg:justify-self-end"
    data-cta39-action-layout={resolvedActionLayout}
  >
    <ContentActions
      actions={resolvedActions}
      alignment={resolvedContentAlignment}
      className={actionLayoutClasses[resolvedActionLayout]}
      data-cta39-actions="true"
    />
  </div>
) : null}
```

Keep `BlockFooterActions` after the header and do not change its props.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx
```

Expected: layout and schema assertions PASS; only generated-type assertions may remain red until Task 3.

- [ ] **Step 6: Commit the implementation**

```bash
git add src/blocks/Cta39/config.ts src/blocks/Cta39/Component.tsx
git commit -m "feat(cta): add action split layout"
```

### Task 3: Regenerate artifacts and verify the complete change

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/cta-39.jpg`
- Test: `tests/int/cta39.int.spec.tsx`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Test: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**

- Consumes: the final CTA schema and renderer from Task 2.
- Produces: generated Payload declarations and a current 1600×900 admin thumbnail.

- [ ] **Step 1: Switch the CTA thumbnail fixture to Action Split**

In `src/block-thumbnails/fixtures.tsx`, keep the current CTA copy, brand appearance, and white button actions, but replace its layout props with:

```tsx
actionLayout="inline"
headerLayout="actionSplit"
```

Remove `splitContentAlignment="center"` because it does not apply to Action Split.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: the generated `Cta39Block` has `headerLayout: 'stacked' | 'split' | 'actionSplit'` and optional `actionLayout: 'inline' | 'stacked'` while retaining `splitContentAlignment`.

- [ ] **Step 3: Run the focused CTA test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx
```

Expected: PASS with all schema, rendering, fallback, registration, and generated-type assertions green.

- [ ] **Step 4: Regenerate only the CTA thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_BASE_URL=http://127.0.0.1:1 BLOCK_THUMBNAIL_SLUG=cta39 pnpm generate:block-thumbnails
```

Expected: the tool starts an isolated preview server, prints `✓ cta39 -> public/block-thumbnails/cta-39.jpg`, and stops the server.

- [ ] **Step 5: Verify thumbnail metadata and rendering**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: PASS; the CTA fixture renders without an error and `cta-39.jpg` remains a valid 1600×900 JPEG.

- [ ] **Step 6: Run project-level verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
```

Expected: TypeScript reports no errors, ESLint exits successfully, and the full integration suite passes.

- [ ] **Step 7: Inspect the generated thumbnail and working tree**

Open `public/block-thumbnails/cta-39.jpg` and confirm it visibly shows the complete copy group on the left and the two white actions aligned on the right without a nested panel. Then run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended CTA test, schema, component, generated type, fixture, and thumbnail files are changed.

- [ ] **Step 8: Commit generated artifacts and verification updates**

```bash
git add tests/int/cta39.int.spec.tsx src/payload-types.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/cta-39.jpg
git commit -m "chore(cta): refresh action split artifacts"
```
