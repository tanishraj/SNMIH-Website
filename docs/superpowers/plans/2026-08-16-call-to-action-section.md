# Call to Action Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Call to Action block as a surface-inheriting, readable stacked/split section with the standard Payload configuration controls.

**Architecture:** The Payload block schema owns content and layout choices while the server component normalizes stale values and maps them to shared section primitives. The outer section remains the only visual surface; stacked and split compositions share the same semantic content order, typography, action resolver, and responsive container.

**Tech Stack:** Payload CMS 3.85, Next.js 16.2, React 19, Tailwind CSS 4, TypeScript, Vitest

## Global Constraints

- The section must not render an inner background, border, radius, or boxed padding.
- The outer section must continue to honor shared appearance background and border controls.
- Existing blocks without `headerLayout` must render as `stacked`.
- Existing blocks without `splitContentAlignment` must use `center` when split is selected.
- The description must use shared section typography and a `max-w-2xl` readable line length.
- The content model must include eyebrow, required title, accent title, description, up to two section actions, and up to two footer actions.
- Theme Settings must include appearance, header layout, content alignment, split content alignment, and section padding.
- The obsolete `borderStyle` field must be removed without a data migration.
- Existing action variants, storage, theme tokens, and other blocks must remain unchanged.

---

## File Structure

- Create `tests/int/cta39.int.spec.tsx`: focused schema, rendering, fallback, and integration contracts.
- Modify `src/blocks/Cta39/config.ts`: standard content fields and stacked/split theme controls.
- Modify `src/blocks/Cta39/Component.tsx`: surface-inheriting responsive compositions.
- Modify `tests/int/page-blocks.int.spec.ts`: update the existing public-render assertion for normalized surfaces.
- Modify `src/block-thumbnails/fixtures.tsx`: exercise the new eyebrow and split layout in the admin preview.
- Regenerate `src/payload-types.ts`: remove `borderStyle` and add the new fields.
- Regenerate `public/block-thumbnails/cta-39.jpg`: reflect the production component.

### Task 1: Lock the CTA schema and rendering contract

**Files:**

- Create: `tests/int/cta39.int.spec.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `Cta39Block`, `Cta39BlockComponent`, shared section classes, Pages registration, and both page renderers.
- Produces: regression coverage for the exact admin fields, responsive layouts, inherited surfaces, actions, and fallbacks.

- [ ] **Step 1: Add recursive schema helpers and the admin contract**

Create `tests/int/cta39.int.spec.tsx` with:

```tsx
import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Cta39BlockComponent } from '@/blocks/Cta39/Component'
import { Cta39Block } from '@/blocks/Cta39/config'

const findNamedField = (fields: unknown[], name: string): Record<string, unknown> | undefined => {
  for (const candidate of fields) {
    if (!candidate || typeof candidate !== 'object') continue
    const field = candidate as Record<string, unknown>
    if (field.name === name) return field

    if (Array.isArray(field.fields)) {
      const nested = findNamedField(field.fields, name)
      if (nested) return nested
    }

    if (Array.isArray(field.tabs)) {
      for (const candidateTab of field.tabs) {
        if (!candidateTab || typeof candidateTab !== 'object') continue
        const tab = candidateTab as Record<string, unknown>
        if (!Array.isArray(tab.fields)) continue
        const nested = findNamedField(tab.fields, name)
        if (nested) return nested
      }
    }
  }
}

const selectValues = (name: string) => {
  const field = findNamedField(Cta39Block.fields, name)
  const options = Array.isArray(field?.options) ? field.options : []
  return options.map((candidate) =>
    candidate && typeof candidate === 'object' && 'value' in candidate
      ? (candidate as { value: unknown }).value
      : candidate,
  )
}

describe('Call to Action block', () => {
  it('defines the standard content and theme controls', () => {
    expect(Cta39Block).toMatchObject({
      interfaceName: 'Cta39Block',
      labels: { plural: 'Call to Actions', singular: 'Call to Action' },
      slug: 'cta39',
    })
    expect(findNamedField(Cta39Block.fields, 'eyebrow')).toMatchObject({ type: 'text' })
    expect(findNamedField(Cta39Block.fields, 'title')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(findNamedField(Cta39Block.fields, 'description')).toMatchObject({ type: 'textarea' })
    expect(findNamedField(Cta39Block.fields, 'borderStyle')).toBeUndefined()
    expect(selectValues('headerLayout')).toEqual(['stacked', 'split'])
    expect(selectValues('contentAlignment')).toEqual(['left', 'center', 'right'])
    expect(selectValues('splitContentAlignment')).toEqual(['top', 'center', 'bottom'])
    expect(selectValues('size')).toEqual(['none', 'compact', 'default', 'comfortable'])
  })
})
```

- [ ] **Step 2: Add stacked, surface, wrapping, and action assertions**

Add this stacked rendering test:

```tsx
const stacked = renderToStaticMarkup(
  <Cta39BlockComponent
    actions={[{ label: 'Visit campus', linkType: 'custom', url: '/visit' }]}
    appearance={{ background: 'subtle', border: 'topAndBottom' }}
    contentAlignment="center"
    description="Visit SNMIH and experience the campus, classrooms, teaching facilities, and hospital environment."
    eyebrow="Plan your visit"
    footerActions={[{ label: 'Admissions', linkType: 'custom', url: '/admissions' }]}
    title="Come see our campus for yourself."
  />,
)

expect(stacked).toContain('data-cta39="true"')
expect(stacked).toContain('data-cta39-layout="stacked"')
expect(stacked).toContain('data-cta39-background="subtle"')
expect(stacked).toContain('bg-subtle')
expect(stacked).toContain('border-y border-border')
expect(stacked).toContain('data-section-eyebrow="true"')
expect(stacked).toContain('Plan your visit')
expect(stacked).toContain('max-w-2xl')
expect(stacked).toContain('text-base leading-7 text-balance text-current/70')
expect(stacked).toContain('href="/visit"')
expect(stacked).toContain('href="/admissions"')
expect(stacked).not.toContain('rounded-xl')
expect(stacked).not.toContain('bg-background')
expect(stacked).not.toContain('border-dashed')
```

Add the surface cases:

```tsx
it.each([
  ['none', '', 'none'],
  ['subtle', 'bg-subtle', 'subtle'],
  ['brand', 'bg-brand', 'brand'],
] as const)('inherits the %s section surface', (background, backgroundClass, eyebrowSurface) => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent
      appearance={{ background, border: 'none' }}
      eyebrow="Apply today"
      title="Begin your journey."
    />,
  )

  if (backgroundClass) expect(html).toContain(backgroundClass)
  expect(html).toContain(`data-cta39-background="${background}"`)
  expect(html).toContain(`data-section-eyebrow-surface="${eyebrowSurface}"`)
  expect(html).not.toContain('bg-background')
})
```

- [ ] **Step 3: Add split layout, alignment, and fallback assertions**

Add split alignment coverage:

```tsx
it.each([
  ['top', 'lg:self-start'],
  ['center', 'lg:self-center'],
  ['bottom', 'lg:self-end'],
] as const)('aligns split supporting content to the %s', (splitContentAlignment, className) => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent
      actions={[{ label: 'Apply', linkType: 'custom', url: '/apply' }]}
      description="Choose the route that fits your next step."
      headerLayout="split"
      splitContentAlignment={splitContentAlignment}
      title="Start your application."
    />,
  )

  expect(html).toContain('data-cta39-layout="split"')
  expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]')
  expect(html).toContain(`data-cta39-split-alignment="${splitContentAlignment}"`)
  expect(html).toContain(className)
})
```

Add content alignment and fallback coverage:

```tsx
it.each([
  ['left', 'items-start text-left'],
  ['center', 'items-center text-center'],
  ['right', 'items-end text-right'],
] as const)('aligns CTA content to the %s', (contentAlignment, className) => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent contentAlignment={contentAlignment} title="Take the next step." />,
  )
  expect(html).toContain(`data-content-alignment="${contentAlignment}"`)
  expect(html).toContain(className)
})

it('uses safe defaults for stale layout values', () => {
  const html = renderToStaticMarkup(
    <Cta39BlockComponent
      contentAlignment={'stale' as never}
      headerLayout={'stale' as never}
      size={'stale' as never}
      splitContentAlignment={'stale' as never}
      title="Take the next step."
    />,
  )

  expect(html).toContain('data-cta39-layout="stacked"')
  expect(html).toContain('data-content-alignment="center"')
  expect(html).toContain('py-12 md:py-16')

  const staleSplit = renderToStaticMarkup(
    <Cta39BlockComponent
      description="Supporting copy"
      headerLayout="split"
      splitContentAlignment={'stale' as never}
      title="Take the next step."
    />,
  )
  expect(staleSplit).toContain('data-cta39-split-alignment="center"')
  expect(staleSplit).toContain('lg:self-center')
})

it('returns no markup without a usable title', () => {
  expect(Cta39BlockComponent({ title: '   ' })).toBeNull()
})
```

- [ ] **Step 4: Add registration and generated-type assertions**

Read these files in the focused test:

```ts
const sources = [
  'src/collections/Pages.ts',
  'src/collections/ReusableSections.ts',
  'src/blocks/renderPageBlocks.tsx',
  'src/blocks/renderLivePreviewPageBlocks.tsx',
].map((file) => readFileSync(file, 'utf8'))

for (const source of sources) {
  expect(source).toMatch(/Cta39|cta39/)
}

const generatedTypes = readFileSync('src/payload-types.ts', 'utf8')
const ctaType = generatedTypes.slice(
  generatedTypes.indexOf('export interface Cta39Block {'),
  generatedTypes.indexOf('export interface HeroBannerBlock {'),
)
expect(ctaType).toContain('eyebrow?: string | null;')
expect(ctaType).toContain("headerLayout: 'stacked' | 'split';")
expect(ctaType).toContain("splitContentAlignment: 'top' | 'center' | 'bottom';")
expect(ctaType).not.toContain('borderStyle')
```

- [ ] **Step 5: Update the existing normalized-surface expectation**

In `tests/int/page-blocks.int.spec.ts`, change the legacy CTA expectation from:

```ts
expect(html).toContain('data-cta39-background="accent"')
```

to:

```ts
expect(html).toContain('data-cta39-background="subtle"')
expect(html).not.toContain('bg-background')
```

- [ ] **Step 6: Run the new contract and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: FAIL because the old schema still contains `borderStyle`, lacks the new fields, and the component still renders the boxed panel.

### Task 2: Implement the standard stacked/split CTA

**Files:**

- Modify: `src/blocks/Cta39/config.ts`
- Modify: `src/blocks/Cta39/Component.tsx`
- Test: `tests/int/cta39.int.spec.tsx`
- Test: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `createBlockAppearanceFields`, `createContentActionsField`, `resolveBlockAppearanceClasses`, `SectionEyebrow`, shared content typography, spacing primitives, and action resolvers.
- Produces: `Cta39BlockComponent` accepting `eyebrow`, `headerLayout`, and `splitContentAlignment` with stable legacy defaults.

- [ ] **Step 1: Replace the obsolete border field with standard layout fields**

In `src/blocks/Cta39/config.ts`, remove `borderStyleField`. Add:

```ts
type CtaLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

const isSplitLayout = (_data: unknown, siblingData: CtaLayoutSiblingData) =>
  siblingData?.headerLayout === 'split'

const headerLayoutField = {
  name: 'headerLayout',
  label: 'Header Layout',
  type: 'select',
  defaultValue: 'stacked',
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Split', value: 'split' },
  ],
  required: true,
} satisfies SelectField

const splitContentAlignmentField = {
  name: 'splitContentAlignment',
  label: 'Split Content Alignment',
  type: 'select',
  defaultValue: 'center',
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ],
  required: true,
  admin: {
    condition: isSplitLayout,
    description: 'Vertically aligns the description and actions beside the heading.',
  },
} satisfies SelectField
```

Add the eyebrow before title and replace the content action declaration with:

```ts
{
  name: 'eyebrow',
  type: 'text',
  admin: { description: 'Small label above the section title.' },
},
{
  name: 'title',
  label: 'Title',
  type: 'text',
  required: true,
},
{
  name: 'accentTitle',
  label: 'Accent Title (Italic)',
  type: 'text',
},
{
  name: 'description',
  type: 'textarea',
},
createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
```

Order Theme Settings exactly as:

```ts
fields: [
  createBlockAppearanceFields(),
  headerLayoutField,
  contentAlignmentField,
  splitContentAlignmentField,
  ctaSizeField,
]
```

- [ ] **Step 2: Normalize the new component inputs**

In `src/blocks/Cta39/Component.tsx`, remove `Cta39BorderStyle`, `borderStyleClasses`, and `borderStyle`. Add:

```ts
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import {
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { SectionEyebrow } from '@/components/SectionEyebrow'

type Cta39Alignment = 'center' | 'left' | 'right'
type Cta39HeaderLayout = 'split' | 'stacked'
type Cta39SplitContentAlignment = 'bottom' | 'center' | 'top'

const validAlignments = new Set<Cta39Alignment>(['left', 'center', 'right'])
const validSizes = new Set<RegularBlockSize>(['none', 'compact', 'default', 'comfortable'])

const splitContentAlignmentClasses = {
  top: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
} as const
```

Extend `Cta39BlockLike` with:

```ts
eyebrow?: string | null
headerLayout?: Cta39HeaderLayout | null
splitContentAlignment?: Cta39SplitContentAlignment | null
```

Normalize values with:

```ts
const resolvedAlignment = validAlignments.has(contentAlignment ?? 'center')
  ? (contentAlignment ?? 'center')
  : 'center'
const resolvedHeaderLayout = headerLayout === 'split' ? 'split' : 'stacked'
const resolvedSize = validSizes.has(size ?? 'default') ? (size ?? 'default') : 'default'
const resolvedSplitAlignment =
  splitContentAlignment === 'top' || splitContentAlignment === 'bottom'
    ? splitContentAlignment
    : 'center'
const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
```

- [ ] **Step 3: Render the outer section as the only surface**

Use this structure inside the existing component:

```tsx
return (
  <section
    className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}
    data-cta39="true"
    data-cta39-background={background}
    data-cta39-layout={resolvedHeaderLayout}
  >
    <div className={regularBlockContainerClasses}>
      <header
        className={cn(
          'grid gap-6',
          resolvedHeaderLayout === 'split'
            ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:gap-16'
            : cn('max-w-3xl', blockAlignmentClasses[resolvedAlignment]),
        )}
      >
        <div
          className={cn('flex min-w-0 flex-col gap-4', contentAlignmentClasses[resolvedAlignment])}
          data-content-alignment={resolvedAlignment}
        >
          {resolvedEyebrow ? (
            <SectionEyebrow surface={background}>{resolvedEyebrow}</SectionEyebrow>
          ) : null}
          <h2 className={contentSectionHeadingClasses}>
            <span className="block font-[inherit]">{resolvedTitle}</span>
            {resolvedAccentTitle ? (
              <em className="block font-[inherit]">{resolvedAccentTitle}</em>
            ) : null}
          </h2>
          {resolvedHeaderLayout === 'stacked' && resolvedDescription ? (
            <p
              className={cn(
                contentSectionDescriptionClasses,
                'max-w-2xl',
                descriptionAlignmentClasses[resolvedAlignment],
              )}
            >
              {resolvedDescription}
            </p>
          ) : null}
          {resolvedHeaderLayout === 'stacked' ? (
            <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
          ) : null}
        </div>

        {resolvedHeaderLayout === 'split' ? (
          <div
            className={cn(
              'flex min-w-0 max-w-2xl flex-col gap-4',
              contentAlignmentClasses[resolvedAlignment],
              splitContentAlignmentClasses[resolvedSplitAlignment],
            )}
            data-cta39-split-alignment={resolvedSplitAlignment}
          >
            {resolvedDescription ? (
              <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
            ) : null}
            <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
          </div>
        ) : null}
      </header>
      <BlockFooterActions actions={footerActions} alignment={resolvedAlignment} />
    </div>
  </section>
)
```

Define the alignment maps exactly as:

```ts
const blockAlignmentClasses = {
  left: '',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const contentAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

const descriptionAlignmentClasses = {
  left: '',
  center: 'mx-auto',
  right: 'ml-auto',
} as const
```

Do not add any background, border, radius, or inner padding classes.

- [ ] **Step 4: Run the focused component tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: component behavior passes; generated-type assertions remain red until Task 3.

### Task 3: Regenerate types and the admin preview

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/cta-39.jpg`
- Test: `tests/int/cta39.int.spec.tsx`
- Test: `tests/int/block-thumbnails.int.spec.ts`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Consumes: the updated `Cta39Block` schema and component props.
- Produces: generated types and a 1600×900 JPEG matching the production CTA.

- [ ] **Step 1: Update the thumbnail fixture to exercise the new composition**

Change the `cta39` fixture in `src/block-thumbnails/fixtures.tsx` to include:

```tsx
<Cta39BlockComponent
  actions={[
    {
      label: 'Get started',
      linkType: 'custom',
      mode: 'button',
      url: '/get-started',
      variant: 'default',
    },
    {
      label: 'Talk to our team',
      linkType: 'custom',
      mode: 'button',
      url: '/contact',
      variant: 'outline',
    },
  ]}
  appearance={{ background: 'subtle', border: 'topAndBottom' }}
  description="Learn quickly, build confidently, and deliver with quality using a modern production workflow."
  eyebrow="Ready when you are"
  headerLayout="split"
  size="compact"
  splitContentAlignment="center"
  title="Turn goals into action with focused execution."
/>
```

- [ ] **Step 2: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `Cta39Block` contains `eyebrow`, `headerLayout`, and `splitContentAlignment`, and no longer contains `borderStyle`.

- [ ] **Step 3: Generate only the CTA thumbnail from a fresh preview server**

Run:

```bash
BLOCK_THUMBNAIL_BASE_URL=http://127.0.0.1:1 BLOCK_THUMBNAIL_SLUG=cta39 pnpm generate:block-thumbnails
```

Expected: `✓ cta39 -> public/block-thumbnails/cta-39.jpg`.

- [ ] **Step 4: Verify the integration and asset metadata**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all tests pass, including JPEG format and 1600×900 dimensions.

### Task 4: Perform bounded visual and code verification

**Files:**

- Verify: `src/blocks/Cta39/Component.tsx`
- Verify: `src/blocks/Cta39/config.ts`
- Verify: `src/payload-types.ts`
- Verify: `public/block-thumbnails/cta-39.jpg`

**Interfaces:**

- Consumes: the completed CTA schema, renderer, fixture, and generated assets.
- Produces: a verified implementation with no unexplained layout or tooling failures.

- [ ] **Step 1: Load the Impeccable craft floor before final UI edits**

Read `.agents/skills/impeccable/reference/craft-floor.md` completely. Apply any relevant corrections in one bounded edit pass.

- [ ] **Step 2: Run the final mechanical layout scan**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/Cta39/Component.tsx src/blocks/Cta39/config.ts
```

Expected: no unexplained findings.

- [ ] **Step 3: Inspect one desktop and one mobile render in a single browser pass**

Open `/block-thumbnail-previews/cta39` in development at desktop and mobile widths. Confirm:

- stacked and split DOM order remains eyebrow/title, then description/actions;
- the section surface is continuous with no nested white panel or border;
- description lines remain readable and do not span the full viewport;
- left, centered, and right layouts retain correct action alignment;
- mobile split layout collapses without overflow;
- button focus order matches reading order.

Apply one consolidated correction pass if defects appear, then perform at most one confirmation pass.

- [ ] **Step 4: Run final formatting, types, lint, and focused tests**

Run:

```bash
pnpm exec prettier --write src/blocks/Cta39/Component.tsx src/blocks/Cta39/config.ts src/block-thumbnails/fixtures.tsx tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/Cta39/Component.tsx src/blocks/Cta39/config.ts src/block-thumbnails/fixtures.tsx tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: Prettier completes, TypeScript and ESLint exit successfully, and all focused tests pass.

- [ ] **Step 5: Commit the completed CTA redesign**

```bash
git add src/blocks/Cta39/Component.tsx src/blocks/Cta39/config.ts src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/cta-39.jpg tests/int/cta39.int.spec.tsx tests/int/page-blocks.int.spec.ts
git commit -m "feat(cta): add split section layout"
```
