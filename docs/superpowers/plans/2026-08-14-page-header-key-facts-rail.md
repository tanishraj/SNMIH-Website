# Page Header Key Facts Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Split Page Header's narrow Key Facts card with a responsive image-backed, numbered and ruled editorial fact rail.

**Architecture:** Keep the existing `keyFacts` array and Split variant, but make `label` optional and treat `value` as the primary statement. The Page Header renderer owns a focused fact-rail region that reuses the existing background image, theme primitives and shared typography without adding tokens or admin variants.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19 server components, Tailwind CSS 4, TypeScript, Vitest and React DOM server rendering.

## Global Constraints

- Preserve all staged dynamic-breadcrumb changes and their current staging state.
- `label` is optional; `value` remains required.
- Existing saved label/value rows remain compatible without migration.
- Key Facts remains exclusive to the Split Page Header variant.
- Row numbers are generated from array order and zero padded from `01` through `06`.
- Values are never line-clamped and must wrap safely.
- The fact rail remains one column at every viewport.
- The configured Split background image is decorative and uses `alt=""`.
- Missing images fall back to the selected appearance surface; None uses the existing muted token.
- Missing valid facts omit the rail and leave a content-only header.
- Use existing theme variables, radius, eyebrow accents and border opacity; add no color token or SNMIH-only selector.
- Do not change Minimal or Banner Page Header behavior.
- Do not commit unless the user explicitly authorizes it.

---

## File map

- Create `tests/int/page-header-key-facts.int.spec.tsx`: schema and renderer regression coverage for the fact rail.
- Modify `src/blocks/PageHeader/config.ts`: optional label, Split-only visibility and editor guidance.
- Modify `src/blocks/PageHeader/Component.tsx`: normalized values, responsive split grid and image-backed ruled rail.
- Modify `src/block-thumbnails/fixtures.tsx`: provide a representative Split Page Header fixture with labelled and unlabelled facts.
- Regenerate `src/payload-types.ts`: update `PageHeaderBlock.keyFacts[].label` to optional.
- Preserve `tests/int/page-breadcrumbs.int.spec.tsx`: run it as a regression suite because Page Header is shared.

---

### Task 1: Update the Payload Key Facts contract

**Files:**

- Create: `tests/int/page-header-key-facts.int.spec.tsx`
- Modify: `src/blocks/PageHeader/config.ts:57-80`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Produces: `PageHeaderBlock['keyFacts'][number]` with optional `label` and required `value`.
- Produces: `isSplitVariant` admin condition used by `keyFactsField.admin.condition`.

- [ ] **Step 1: Add failing schema tests**

Create `tests/int/page-header-key-facts.int.spec.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'

const getContentFields = () => {
  const tabs = PageHeaderBlock.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') throw new Error('Expected tabs')
  return tabs.tabs[0]?.fields ?? []
}

describe('Page Header key facts', () => {
  it('uses an optional label and required primary value', () => {
    const keyFacts = getContentFields().find(
      (field) => 'name' in field && field.name === 'keyFacts',
    )
    if (!keyFacts || keyFacts.type !== 'array') throw new Error('Expected keyFacts array')

    const label = keyFacts.fields.find((field) => 'name' in field && field.name === 'label')
    const value = keyFacts.fields.find((field) => 'name' in field && field.name === 'value')

    expect(label).not.toHaveProperty('required', true)
    expect(value).toMatchObject({ required: true })
  })

  it('shows key facts only for the Split variant', () => {
    const keyFacts = getContentFields().find(
      (field) => 'name' in field && field.name === 'keyFacts',
    )

    expect(keyFacts?.admin?.condition?.({}, { variant: 'split' }, {} as never)).toBe(true)
    expect(keyFacts?.admin?.condition?.({}, { variant: 'banner' }, {} as never)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests and verify the contract failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-key-facts.int.spec.tsx`

Expected: FAIL because `label` is required and Key Facts has no Split condition.

- [ ] **Step 3: Update the field contract and guidance**

Add a sibling-data guard near the existing breadcrumb conditions:

```ts
type PageHeaderVariantSiblingData = {
  variant?: 'banner' | 'minimal' | 'split' | null
}

const isSplitVariant = (_data: unknown, siblingData: PageHeaderVariantSiblingData) =>
  siblingData?.variant === 'split'
```

Update `keyFactsField`:

```ts
const keyFactsField: ArrayField = {
  name: 'keyFacts',
  label: 'Key Facts',
  type: 'array',
  maxRows: 6,
  admin: {
    condition: isSplitVariant,
    initCollapsed: true,
    description:
      'Numbered statements displayed in the Split variant. Label is optional; Value is the primary text.',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: { description: 'Optional short context, such as Duration or Clinical Training.' },
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      admin: { description: 'Primary fact statement displayed in the numbered rail.' },
    },
  ],
}
```

Update the background-image description to: `Used as the Banner backdrop or behind the Split variant's Key Facts rail.`

- [ ] **Step 4: Regenerate Payload types**

Run: `pnpm run generate:types`

Expected: `PageHeaderBlock.keyFacts[].label` becomes optional while `value` remains required.

- [ ] **Step 5: Run schema and breadcrumb tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-key-facts.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx`

Expected: PASS.

- [ ] **Step 6: Commit when authorized**

```bash
git add src/blocks/PageHeader/config.ts src/payload-types.ts tests/int/page-header-key-facts.int.spec.tsx
git commit -m "feat: refine page header key facts"
```

---

### Task 2: Build the image-backed editorial fact rail

**Files:**

- Modify: `src/blocks/PageHeader/Component.tsx:17-250`
- Test: `tests/int/page-header-key-facts.int.spec.tsx`

**Interfaces:**

- Consumes: `keyFacts?: { label?: string | null; value?: string | null }[]`.
- Produces: `data-page-header-key-facts="true"` on the rail and `data-page-header-key-fact="true"` on valid rows.

- [ ] **Step 1: Add failing renderer tests**

Extend the new test with a representative media value and helper:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { PageHeaderBlockComponent } from '@/blocks/PageHeader/Component'

const media = {
  alt: 'Medical students in clinical training',
  height: 900,
  id: 'clinical-training',
  url: '/clinical-training.jpg',
  width: 1200,
}

const renderSplit = (props = {}) =>
  renderToStaticMarkup(
    <PageHeaderBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      backgroundImage={media}
      breadcrumbMode="hidden"
      contentAlignment="left"
      height="default"
      keyFacts={[
        { value: 'Medical education connected with patient care.' },
        { label: 'Teaching hospital', value: 'A multidisciplinary teaching hospital in Saharsa.' },
        { label: 'Ignored', value: '   ' },
      ]}
      overlayStyle="dark"
      title="Where learning meets patient care"
      variant="split"
      {...props}
    />,
  )

it('renders a decorative image-backed, numbered and ruled fact rail', () => {
  const html = renderSplit()
  expect(html).toContain('data-page-header-key-facts="true"')
  expect(html).toContain('data-page-header-key-fact="true"')
  expect(html).toContain('alt=""')
  expect(html).toContain('01')
  expect(html).toContain('02')
  expect(html).not.toContain('03')
  expect(html).toContain('Medical education connected with patient care.')
  expect(html).toContain('Teaching hospital')
})

it('omits the rail when no fact has a value', () => {
  expect(renderSplit({ keyFacts: [{ label: 'Empty', value: ' ' }] })).not.toContain(
    'data-page-header-key-facts="true"',
  )
})

it('uses the primary fallback when no image is configured', () => {
  const html = renderSplit({ backgroundImage: null })
  expect(html).toContain('data-page-header-key-facts-fallback="true"')
})
```

- [ ] **Step 2: Run tests and verify the markup failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-key-facts.int.spec.tsx`

Expected: FAIL because the current renderer uses the old metadata card and requires both fields.

- [ ] **Step 3: Normalize facts by primary value**

Change `KeyFact.label` to optional and replace the current filter with:

```ts
const resolvedKeyFacts = (keyFacts ?? []).flatMap((fact) => {
  const value = fact.value?.trim()
  if (!value) return []
  return [{ label: fact.label?.trim() || undefined, value }]
})
```

- [ ] **Step 4: Replace the fixed flex/card layout with a responsive grid**

Use this structure in the Split branch:

```tsx
<div
  className={cn(
    'grid gap-8 lg:items-stretch lg:gap-12',
    resolvedKeyFacts.length > 0 && 'lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]',
  )}
>
  <div className="flex min-w-0 flex-col gap-4">{/* existing intro */}</div>
  {resolvedKeyFacts.length > 0 ? <Key facts rail /> : null}
</div>
```

Do not alter breadcrumbs, eyebrow, title, subtitle, actions or footer actions.

- [ ] **Step 5: Implement the fact rail markup**

Import `contentItemMetadataClasses` and `sectionEyebrowClasses`. Render:

```tsx
<aside
  className="relative isolate min-w-0 overflow-hidden rounded-[var(--radius)] bg-primary text-primary-foreground"
  data-page-header-key-facts="true"
>
  {bgImage ? (
    <Image
      alt=""
      aria-hidden="true"
      className="object-cover"
      fill
      sizes="(min-width: 1024px) 40vw, 100vw"
      src={bgImage.src}
    />
  ) : (
    <span className="sr-only" data-page-header-key-facts-fallback="true" />
  )}
  <div className="absolute inset-0 bg-primary/85" aria-hidden="true" />
  <div
    aria-hidden="true"
    className="absolute inset-0"
    style={{
      background:
        'linear-gradient(90deg, color-mix(in oklch, var(--primary) 88%, black) 0%, color-mix(in oklch, var(--primary) 72%, black) 100%)',
    }}
  />
  <ol className="relative border-y border-current/15">
    {resolvedKeyFacts.map((fact, index) => (
      <li
        className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-current/15 px-5 py-6 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-6 sm:px-8 sm:py-7"
        data-page-header-key-fact="true"
        key={index}
      >
        <span
          aria-hidden="true"
          className={cn(sectionEyebrowClasses, 'pt-1')}
          data-section-eyebrow-surface="darkOverlay"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          {fact.label ? (
            <p className={cn(contentItemMetadataClasses, 'mb-2 text-current/65')}>{fact.label}</p>
          ) : null}
          <p className="overflow-wrap-anywhere text-lg font-medium leading-7 text-current/90 sm:text-xl sm:leading-8">
            {fact.value}
          </p>
        </div>
      </li>
    ))}
  </ol>
</aside>
```

If `overflow-wrap-anywhere` is not a project utility, use Tailwind's `break-words` plus `min-w-0`. Keep the underlying `bg-primary/85` layer as the fallback when `color-mix()` is unsupported.

- [ ] **Step 6: Run renderer, breadcrumb and dark-mode tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/page-header-key-facts.int.spec.tsx \
  tests/int/page-breadcrumbs.int.spec.tsx \
  tests/int/dark-mode-media-treatment.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit when authorized**

```bash
git add src/blocks/PageHeader/Component.tsx tests/int/page-header-key-facts.int.spec.tsx
git commit -m "feat: redesign page header key facts"
```

---

### Task 3: Add a representative block-thumbnail fixture

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx:1605-1625`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Consumes: the existing `pageHeader` fixture key.
- Produces: a production-rendered Split Page Header fixture with both labelled and unlabelled facts.

- [ ] **Step 1: Update the Page Header fixture**

Change the fixture from Banner to Split and add:

```tsx
keyFacts={[
  { value: 'Medical education connected with patient care.' },
  {
    label: 'Teaching hospital',
    value: 'A multidisciplinary teaching hospital serving the wider region.',
  },
]}
variant="split"
```

Keep the existing representative image, eyebrow, title, subtitle and automatic/custom breadcrumb fixture behavior. Remove Banner-only height and overlay props only if they no longer communicate useful fixture data.

- [ ] **Step 2: Run thumbnail fixtures and key-facts tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/page-header-key-facts.int.spec.tsx
```

Expected: PASS and every block fixture still renders.

- [ ] **Step 3: Regenerate thumbnails only when the repository expects committed outputs**

Run: `pnpm run generate:block-thumbnails`

Expected: the Page Header thumbnail displays the Split editorial rail. Review generated output before retaining it; do not keep unrelated thumbnail diffs.

- [ ] **Step 4: Commit when authorized**

```bash
git add src/block-thumbnails/fixtures.tsx tests/int/page-header-key-facts.int.spec.tsx
git commit -m "test: cover page header fact rail"
```

---

### Task 4: Verify responsive, theme and regression quality

**Files:**

- Verify: `src/blocks/PageHeader/Component.tsx`
- Verify: `src/blocks/PageHeader/config.ts`
- Verify: `src/payload-types.ts`
- Verify: `tests/int/page-header-key-facts.int.spec.tsx`
- Modify only when verification exposes a Key Facts defect.

**Interfaces:**

- Consumes all preceding tasks.
- Produces a release-ready, theme-adaptive fact rail without disturbing breadcrumbs.

- [ ] **Step 1: Run the impeccable layout detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout \
  src/blocks/PageHeader/Component.tsx
```

Expected: no unexplained layout findings.

- [ ] **Step 2: Run focused lint and TypeScript**

Run:

```bash
pnpm exec eslint \
  src/blocks/PageHeader/config.ts \
  src/blocks/PageHeader/Component.tsx \
  src/block-thumbnails/fixtures.tsx \
  tests/int/page-header-key-facts.int.spec.tsx
pnpm exec tsc --noEmit --incremental false
```

Expected: no new lint errors and TypeScript passes. Existing unrelated renderer/fixture warnings may remain.

- [ ] **Step 3: Run the full integration suite**

Run: `pnpm run test:int`

Expected: all integration tests pass. If MongoMemoryServer cannot bind inside the sandbox, rerun the same command with approved local-port access.

- [ ] **Step 4: Perform bounded visual verification**

Inspect the Split fixture or a CMS Page containing short, long, labelled and unlabelled facts at:

- 375px: content followed by a full-width rail; stable ordinal gutter; no horizontal overflow.
- 768px: full-width stacked rail with comfortable row cadence.
- 1440px: approximately 60/40 content/facts grid with balanced vertical weight.

Check light and dark modes on `none`, `subtle` and `brand` surfaces. Confirm image contrast, primary fallback, soft hairlines, theme radius and SNMIH ordinal accent. Perform one consolidated correction pass, then one confirmation pass.

- [ ] **Step 5: Verify generated types and diff hygiene**

Run:

```bash
pnpm run generate:types
git diff --check
git status --short
```

Expected: no further generated-type drift, no whitespace errors, and only the approved breadcrumb and Key Facts files remain changed. Preserve pre-existing staged entries.

- [ ] **Step 6: Commit when authorized**

```bash
git add docs/superpowers/specs/2026-08-14-page-header-key-facts-rail-design.md docs/superpowers/plans/2026-08-14-page-header-key-facts-rail.md src/blocks/PageHeader src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/page-header-key-facts.int.spec.tsx
git commit -m "feat: add editorial key facts rail"
```

---

### Task 5: Reorganize editor fields and make the rail appearance-driven

**Files:**

- Modify: `src/blocks/PageHeader/config.ts`
- Modify: `src/blocks/PageHeader/Component.tsx`
- Modify: `tests/int/page-header-key-facts.int.spec.tsx`
- Verify: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**

- Consumes: `resolveBlockAppearanceClasses(appearance)` and its `background`, `backgroundClassName`, `surface`, and `textClassName` result.
- Produces: Content-tab ordering with `backgroundImage` first; Theme Settings ordering with `variant` followed by `breadcrumbMode`; a rail whose tint, fallback, foreground, and ordinal surface follow the selected block background.

- [x] **Step 1: Add failing editor-order and appearance tests**

Extend `tests/int/page-header-key-facts.int.spec.tsx` with assertions that:

```tsx
const contentNames = contentFields.flatMap((field) => ('name' in field ? [field.name] : []))
expect(contentNames[0]).toBe('backgroundImage')
expect(contentNames).not.toContain('breadcrumbMode')

const themeFields = tabs.tabs[1]?.fields ?? []
const themeNames = themeFields.flatMap((field) => ('name' in field ? [field.name] : []))
expect(themeNames.slice(0, 2)).toEqual(['variant', 'breadcrumbMode'])
```

Render Split headers for `none`, `subtle`, `brand`, `gradient-subtle`, and `gradient-brand`; assert that the rail exposes `data-page-header-key-facts-background` with the normalized value, uses the corresponding appearance background and foreground classes, and renders the primary statement with `text-base` but without responsive `text-lg` or `text-xl` classes.

- [x] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/page-header-key-facts.int.spec.tsx
```

Expected: FAIL because Background Image is not first, Breadcrumb Display remains in Content, and the rail still forces `bg-primary text-primary-foreground` with responsive 18–20px statement text.

- [x] **Step 3: Reorder the Payload fields without changing stored names**

In the Content tab, place the existing `backgroundImage` upload first, followed by the conditional custom `breadcrumbs` array and the remaining editorial fields. Remove `breadcrumbModeField` from Content.

In Theme Settings, place the existing fields in this order:

```ts
fields: [
  variantField,
  breadcrumbModeField,
  createBlockAppearanceFields(),
  contentAlignmentField,
  overlayStyleField,
  heightField,
]
```

Keep field names, defaults, options, conditions, and stored data unchanged.

- [x] **Step 4: Derive rail classes from the appearance resolver**

In the Split branch, retain the complete resolver result:

```ts
const appearanceClasses = resolveBlockAppearanceClasses(appearance)
const railBackgroundClassName =
  appearanceClasses.background === 'none'
    ? 'bg-background'
    : appearanceClasses.backgroundClassName
const railTextClassName = appearanceClasses.textClassName || 'text-foreground'
```

Apply `railBackgroundClassName` and `railTextClassName` to the rail and apply the same background class to an `absolute inset-0 opacity-85` tint above the decorative image. Remove the fixed primary and black-gradient overlays. Set:

```tsx
data-page-header-key-facts-background={appearanceClasses.background}
```

Pass `appearanceClasses.background` to the ordinal's `data-section-eyebrow-surface` attribute. This keeps ordinal accents aligned with the selected surface contract.

- [x] **Step 5: Set statement typography to exactly 16px**

Replace the responsive value classes with:

```tsx
className="break-words text-base font-medium leading-7 text-current/90"
```

Do not change the optional-label or ordinal typography.

- [x] **Step 6: Run focused regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/page-header-key-facts.int.spec.tsx \
  tests/int/page-breadcrumbs.int.spec.tsx \
  tests/int/section-eyebrow.int.spec.tsx \
  tests/int/block-appearance-contract.int.spec.ts
```

Expected: PASS.

- [x] **Step 7: Verify types, lint, full integration, and visuals**

Run:

```bash
pnpm run generate:types
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/PageHeader/Component.tsx src/blocks/PageHeader/config.ts tests/int/page-header-key-facts.int.spec.tsx
pnpm run test:int
git diff --check
```

Expected: all commands pass. Capture the Split fixture at 375px, 768px, and 1440px and confirm the tint follows light and brand appearance settings while statements remain 16px.

- [x] **Step 8: Commit only when authorized**

Do not stage or commit this refinement until the user explicitly requests it. Preserve the existing staged breadcrumb changes.

---

### Task 6: Compact fact typography and configurable number placement

**Files:**

- Modify: `src/blocks/PageHeader/config.ts`
- Modify: `src/blocks/PageHeader/Component.tsx`
- Modify: `tests/int/page-header-key-facts.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Consumes: the existing optional `keyFacts[].label` for backwards-compatible storage without rendering it.
- Produces: `keyFactsNumberPosition?: 'inline' | 'above' | null` with default `inline`; compact 12px statements; 10px number-to-statement spacing.
- Produces: a visibly tinted default rail by mapping the None appearance to the existing `bg-muted` token without adding a color token.

- [x] **Step 1: Add failing schema and renderer tests**

Assert that the label field has `admin.hidden: true`, Number Position is a Split-only Theme Settings select immediately after Breadcrumb Display, and its options/default are:

```ts
{
  defaultValue: 'inline',
  options: [
    { label: 'Inline with text', value: 'inline' },
    { label: 'Above text', value: 'above' },
  ],
}
```

Render both positions and assert:

```tsx
expect(inlineHtml).toContain('data-page-header-key-facts-number-position="inline"')
expect(inlineHtml).toContain('grid-cols-[auto_minmax(0,1fr)] gap-2.5')
expect(aboveHtml).toContain('data-page-header-key-facts-number-position="above"')
expect(aboveHtml).toContain('flex flex-col gap-2.5')
expect(inlineHtml).toContain('text-xs font-medium leading-5')
expect(inlineHtml).not.toContain('Teaching hospital')
```

- [x] **Step 2: Run the focused test and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-key-facts.int.spec.tsx`

Expected: FAIL because the label is visible, no Number Position field exists, values are 16px, and rows use a fixed ordinal gutter.

- [x] **Step 3: Add the non-destructive Payload control**

Keep the existing `label` field but add `admin.hidden: true`. Add `keyFactsNumberPosition` to Theme Settings immediately after Breadcrumb Display, condition it with `isSplitVariant`, and use the exact default/options above.

- [x] **Step 4: Render compact inline and above layouts**

Add `keyFactsNumberPosition` to `PageHeaderBlockLike`, default it to `inline`, and expose it on the rail data attribute. Replace the fixed row grid with:

```tsx
className={cn(
  'border-b border-current/15 px-5 py-4 last:border-b-0 sm:px-6 sm:py-5',
  keyFactsNumberPosition === 'above'
    ? 'flex flex-col gap-2.5'
    : 'grid grid-cols-[auto_minmax(0,1fr)] gap-2.5',
)}
```

Render only `fact.value` using `break-words text-xs font-medium leading-5 text-current/90`. Remove the metadata-label markup and its shared style import.

- [x] **Step 5: Regenerate types and run verification**

Run:

```bash
pnpm run generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-key-facts.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/PageHeader/Component.tsx src/blocks/PageHeader/config.ts tests/int/page-header-key-facts.int.spec.tsx
pnpm run test:int
git diff --check
```

Expected: all checks pass and responsive captures show a compact tinted rail with 12px statements and no overflow in either number layout.

- [ ] **Step 6: Commit only when authorized**

Do not stage or commit this refinement until the user explicitly requests it. Preserve the existing Git index.
