# Page Header Action Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Page Header Key Facts rail and let editors place primary links and buttons inline below the description or in a responsive right-side action column.

**Architecture:** Preserve the existing Page Header block and action schema, but deprecate Key Facts non-destructively by hiding its fields and removing its renderer. Add one action-placement field and expand the shared content-alignment contract to include Right; Minimal and Banner use the configured placement, while legacy Split remains accepted and always maps to the side-action composition.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19 server components, Tailwind CSS 4, TypeScript, Vitest, React DOM server rendering, and Playwright-based block thumbnail verification.

## Global Constraints

- Preserve the current Git index and keep all work unstaged.
- Do not commit unless the user explicitly authorizes it.
- Preserve stored `keyFacts`, `keyFactsNumberPosition`, and `split` values without a destructive migration.
- Do not render Key Facts or expose their controls in Payload.
- `actionPlacement` supports exactly `inline` and `side`.
- Minimal and Banner default to Inline; legacy Split always uses Side.
- Side actions move below the description before the large breakpoint.
- `contentAlignment` supports exactly Left, Center, and Right.
- Preserve existing action semantics, variants, arrows, focus behavior, breadcrumbs, overlay controls, theme appearance, and footer actions.
- Add no dependency, color token, or SNMIH-specific selector.

---

## File map

- Modify `src/blocks/PageHeader/config.ts`: hide legacy Key Facts controls, add Action Placement, add Right alignment, and relabel Split as legacy.
- Modify `src/blocks/PageHeader/Component.tsx`: remove the rail and render Inline/Side action compositions for Minimal, Banner, and legacy Split.
- Delete `tests/int/page-header-key-facts.int.spec.tsx`: remove tests for the retired visible rail.
- Create `tests/int/page-header-actions.int.spec.tsx`: cover the new Payload contract and renderer behavior.
- Modify `tests/int/section-eyebrow.int.spec.tsx`: remove the obsolete Key Facts ordinal-source assertion while retaining normal Page Header eyebrow coverage.
- Modify `src/block-thumbnails/fixtures.tsx`: replace the Key Facts fixture with a Banner using side actions.
- Regenerate `src/payload-types.ts`: include `actionPlacement` and Right alignment while retaining deprecated fields.
- Regenerate `public/block-thumbnails/page-header.jpg`: document the new side-action composition.
- Modify `docs/superpowers/specs/2026-08-14-page-header-key-facts-rail-design.md`: mark the earlier rail design as superseded.

---

### Task 1: Replace the Payload presentation contract

**Files:**

- Create: `tests/int/page-header-actions.int.spec.tsx`
- Modify: `src/blocks/PageHeader/config.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Produces: `PageHeaderBlock['actionPlacement']` as `'inline' | 'side'`.
- Produces: `PageHeaderBlock['contentAlignment']` as `'left' | 'center' | 'right'`.
- Preserves: deprecated `keyFacts`, `keyFactsNumberPosition`, and `variant: 'split'` fields.

- [ ] **Step 1: Write failing schema tests**

Create `tests/int/page-header-actions.int.spec.tsx` with field helpers and these assertions:

```tsx
import { describe, expect, it } from 'vitest'

import { PageHeaderBlock } from '@/blocks/PageHeader/config'

const getTabs = () => {
  const tabs = PageHeaderBlock.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') {
    throw new Error('Expected Page Header tabs')
  }

  return tabs.tabs
}

describe('Page Header action layout schema', () => {
  it('hides the retired Key Facts controls without deleting their fields', () => {
    const tabs = getTabs()
    const content = tabs[0]?.fields ?? []
    const theme = tabs[1]?.fields ?? []
    const keyFacts = content.find((field) => 'name' in field && field.name === 'keyFacts')
    const numberPosition = theme.find(
      (field) => 'name' in field && field.name === 'keyFactsNumberPosition',
    )

    expect(keyFacts?.admin).toMatchObject({ hidden: true })
    expect(numberPosition?.admin).toMatchObject({ hidden: true })
  })

  it('offers Inline and Side action placement', () => {
    const theme = getTabs()[1]?.fields ?? []
    const placement = theme.find((field) => 'name' in field && field.name === 'actionPlacement')

    expect(placement).toMatchObject({
      defaultValue: 'inline',
      required: true,
      options: [
        { label: 'Inline — below the description', value: 'inline' },
        { label: 'Side — right action column', value: 'side' },
      ],
    })
    expect(placement?.admin?.condition?.({}, { variant: 'banner' }, {} as never)).toBe(true)
    expect(placement?.admin?.condition?.({}, { variant: 'split' }, {} as never)).toBe(false)
  })

  it('uses the shared Left, Center, and Right alignment vocabulary', () => {
    const theme = getTabs()[1]?.fields ?? []
    const alignment = theme.find((field) => 'name' in field && field.name === 'contentAlignment')

    expect(alignment).toMatchObject({
      label: 'Section Content Alignment',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    })
  })
})
```

- [ ] **Step 2: Run the schema tests and confirm the intended failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx
```

Expected: FAIL because Key Facts is conditionally visible, Action Placement does not exist, and Right alignment is absent.

- [ ] **Step 3: Hide Key Facts without deleting stored data**

In `src/blocks/PageHeader/config.ts`, replace `keyFactsField.admin.condition` with a hidden legacy contract:

```ts
admin: {
  hidden: true,
  initCollapsed: true,
  description: 'Legacy Page Header data retained for backwards compatibility. Not displayed.',
},
```

Keep the array name, nested fields, and six-row maximum unchanged. On `keyFactsNumberPosition`, replace the Split condition with:

```ts
admin: {
  hidden: true,
  description: 'Legacy Key Facts setting retained for backwards compatibility.',
},
```

- [ ] **Step 4: Add the action and alignment controls**

Add this sibling guard near `isSplitVariant`:

```ts
const isNotLegacySplit = (_data: unknown, siblingData: PageHeaderVariantSiblingData) =>
  siblingData?.variant !== 'split'
```

Change the Split option label to:

```ts
{
  label: 'Legacy Split — content left, actions right',
  value: 'split',
}
```

Replace the Content Alignment field with:

```ts
{
  name: 'contentAlignment',
  label: 'Section Content Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField,
```

Immediately after it, add:

```ts
{
  name: 'actionPlacement',
  label: 'Action Placement',
  type: 'select',
  defaultValue: 'inline',
  options: [
    { label: 'Inline — below the description', value: 'inline' },
    { label: 'Side — right action column', value: 'side' },
  ],
  required: true,
  admin: {
    condition: isNotLegacySplit,
    description:
      'Side moves primary actions to a right column on large screens and stacks them below the description on smaller screens.',
  },
} satisfies SelectField,
```

- [ ] **Step 5: Regenerate types and run schema verification**

Run:

```bash
pnpm run generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx
```

Expected: PASS. Confirm `src/payload-types.ts` contains:

```ts
actionPlacement: 'inline' | 'side'
contentAlignment: 'left' | 'center' | 'right'
```

- [ ] **Step 6: Commit only if the user authorizes it**

Do not stage or commit during the current work. If authorization is later given, include this task with the final feature commit rather than creating an intermediate commit that omits the renderer.

---

### Task 2: Replace the rail with responsive action placement

**Files:**

- Modify: `tests/int/page-header-actions.int.spec.tsx`
- Delete: `tests/int/page-header-key-facts.int.spec.tsx`
- Modify: `src/blocks/PageHeader/Component.tsx`
- Modify: `tests/int/section-eyebrow.int.spec.tsx`

**Interfaces:**

- Consumes: `actionPlacement?: 'inline' | 'side' | null` and `contentAlignment?: 'left' | 'center' | 'right' | null`.
- Produces: `data-page-header-action-placement="inline|side"` and `data-page-header-actions="inline|side"` markers.
- Removes: all `data-page-header-key-facts*` markup and Key Facts rendering imports/types.

- [ ] **Step 1: Add failing renderer coverage**

Extend `tests/int/page-header-actions.int.spec.tsx` with:

```tsx
import type { ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { PageHeaderBlockComponent } from '@/blocks/PageHeader/Component'

type PageHeaderProps = ComponentProps<typeof PageHeaderBlockComponent>

const actions = [
  {
    label: 'Explore Admissions',
    linkType: 'custom' as const,
    mode: 'button' as const,
    showArrow: true,
    url: '/admissions',
    variant: 'default' as const,
  },
  {
    label: 'Download Brochure',
    linkType: 'custom' as const,
    mode: 'button' as const,
    showArrow: true,
    url: '/brochure.pdf',
    variant: 'outline' as const,
  },
]

const renderHeader = (overrides: Partial<PageHeaderProps> = {}) =>
  renderToStaticMarkup(
    <PageHeaderBlockComponent
      actions={actions}
      appearance={{ background: 'none', border: 'none' }}
      subtitle="Discover an academic environment built around clinical experience."
      title="Your journey in medicine starts here."
      variant="minimal"
      {...overrides}
    />,
  )
```

Add these tests:

```tsx
it('renders Inline actions immediately after the description', () => {
  const html = renderHeader({ actionPlacement: 'inline' })

  expect(html).toContain('data-page-header-action-placement="inline"')
  expect(html).toContain('data-page-header-actions="inline"')
  expect(html.indexOf('data-page-header-description="true"')).toBeLessThan(
    html.indexOf('data-page-header-actions="inline"'),
  )
  expect(html).not.toContain('data-page-header-actions="side"')
})

it('renders Side actions after copy in DOM order and stacks them in a desktop rail', () => {
  const html = renderHeader({ actionPlacement: 'side' })

  expect(html).toContain('data-page-header-action-placement="side"')
  expect(html).toContain('data-page-header-actions="side"')
  expect(html).toContain('lg:flex-row')
  expect(html).toContain('lg:min-w-64')
  expect(html).toContain('flex-col gap-3 sm:flex-col [&amp;>*]:w-full')
  expect(html.indexOf('data-page-header-copy="true"')).toBeLessThan(
    html.indexOf('data-page-header-actions="side"'),
  )
})

it('maps legacy Split to Side and never renders Key Facts', () => {
  const html = renderHeader({
    actionPlacement: 'inline',
    keyFacts: [{ label: 'Legacy', value: 'Must not render' }],
    variant: 'split',
  } as Partial<PageHeaderProps>)

  expect(html).toContain('data-page-header-action-placement="side"')
  expect(html).not.toContain('data-page-header-key-facts')
  expect(html).not.toContain('Must not render')
})

it.each([
  ['left', 'items-start text-left'],
  ['center', 'items-center text-center'],
  ['right', 'items-end text-right'],
] as const)('applies %s section content alignment', (alignment, classes) => {
  const html = renderHeader({ contentAlignment: alignment })

  expect(html).toContain(`data-page-header-content-alignment="${alignment}"`)
  expect(html).toContain(classes)
})

it('supports Side placement in the image-backed Banner variant', () => {
  const html = renderHeader({ actionPlacement: 'side', variant: 'banner' })

  expect(html).toContain('data-page-header-variant="banner"')
  expect(html).toContain('data-page-header-actions="side"')
})

it('keeps footer actions after the primary action layout', () => {
  const html = renderHeader({
    actionPlacement: 'side',
    footerActions: [
      {
        label: 'View policies',
        linkType: 'custom',
        mode: 'link',
        url: '/policies',
      },
    ],
  })

  expect(html.indexOf('data-page-header-actions="side"')).toBeLessThan(
    html.indexOf('View policies'),
  )
})
```

Delete `tests/int/page-header-key-facts.int.spec.tsx` because its visible-rail assertions describe retired behavior. Move its still-valid field-order assertion into the new file.

- [ ] **Step 2: Run the renderer tests and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: FAIL because the component has no Action Placement contract, Right alignment, or side rail and still renders Key Facts.

- [ ] **Step 3: Add shared alignment and placement resolution**

In `src/blocks/PageHeader/Component.tsx`, remove `sectionEyebrowClasses`, `KeyFact`, `keyFacts`, and `keyFactsNumberPosition`. Import `ReactNode` and `ResolvedCmsAction`, then add:

```ts
type PageHeaderActionPlacement = 'inline' | 'side'
type PageHeaderContentAlignment = 'left' | 'center' | 'right'

type PageHeaderActionLayoutProps = {
  actions: ResolvedCmsAction[]
  alignment: PageHeaderContentAlignment
  children: ReactNode
  placement: PageHeaderActionPlacement
}

const contentAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

const contentPositionClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const sideActionPositionClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

function PageHeaderActionLayout({
  actions,
  alignment,
  children,
  placement,
}: PageHeaderActionLayoutProps) {
  const usesSideActions = placement === 'side' && actions.length > 0

  return (
    <div
      className={cn(
        'flex flex-col gap-8',
        usesSideActions && 'lg:flex-row lg:items-center lg:justify-between lg:gap-16',
      )}
      data-page-header-action-placement={placement}
    >
      <div
        className={cn(
          'flex min-w-0 w-full max-w-3xl flex-col',
          contentAlignmentClasses[alignment],
          !usesSideActions && contentPositionClasses[alignment],
        )}
        data-page-header-content-alignment={alignment}
        data-page-header-copy="true"
      >
        {children}
        {!usesSideActions && actions.length > 0 ? (
          <div className="mt-6" data-page-header-actions="inline">
            <ContentActions actions={actions} alignment={alignment} />
          </div>
        ) : null}
      </div>

      {usesSideActions ? (
        <div
          className={cn(
            'flex w-full lg:w-auto lg:min-w-64 lg:justify-end',
            sideActionPositionClasses[alignment],
          )}
          data-page-header-actions="side"
        >
          <ContentActions
            actions={actions}
            alignment={alignment}
            className="flex-col gap-3 sm:flex-col [&>*]:w-full"
          />
        </div>
      ) : null}
    </div>
  )
}
```

Update `PageHeaderBlockLike`:

```ts
actionPlacement?: PageHeaderActionPlacement | null
contentAlignment?: PageHeaderContentAlignment | null
```

Resolve values once after actions:

```ts
const resolvedAlignment = contentAlignment ?? 'left'
const resolvedActionPlacement: PageHeaderActionPlacement =
  variant === 'split' ? 'side' : (actionPlacement ?? 'inline')
```

- [ ] **Step 4: Recompose Banner actions**

Add `data-page-header-variant="banner"` to the Banner section. Replace the Banner container's direct breadcrumb/copy/action children with this complete layout:

```tsx
<PageHeaderActionLayout
  actions={resolvedActions}
  alignment={resolvedAlignment}
  placement={resolvedActionPlacement}
>
  <Breadcrumbs items={resolvedBreadcrumbs} />
  {eyebrow?.trim() ? (
    <SectionEyebrow className="mb-2 text-white/70" surface="darkOverlay">
      {eyebrow.trim()}
    </SectionEyebrow>
  ) : null}
  <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl xl:text-6xl">
    {resolvedAccentTitle ? (
      <>
        <span className="block">{resolvedTitle}</span>
        <em className="block">{resolvedAccentTitle}</em>
      </>
    ) : (
      resolvedTitle
    )}
  </h1>
  {subtitle?.trim() ? (
    <p
      className="mt-4 max-w-2xl text-lg text-white/80"
      data-page-header-description="true"
    >
      {subtitle.trim()}
    </p>
  ) : null}
</PageHeaderActionLayout>
<BlockFooterActions actions={footerActions} />
```

Keep this layout inside the existing `relative mx-auto w-full max-w-screen-2xl px-4 py-10 md:py-14` container. Keep the existing image, overlay, height classes, theme surface marker, and media sizing unchanged.

- [ ] **Step 5: Replace Split and Minimal branches with one appearance-based branch**

Delete the entire current `if (variant === 'split')` Key Facts branch. Let both Minimal and legacy Split reach the final appearance-based section. Add `data-page-header-variant={variant ?? 'minimal'}` to that section, then render this inside the existing `mx-auto w-full max-w-screen-2xl px-4` container:

```tsx
<PageHeaderActionLayout
  actions={resolvedActions}
  alignment={resolvedAlignment}
  placement={resolvedActionPlacement}
>
  <Breadcrumbs items={resolvedBreadcrumbs} />
  {eyebrow?.trim() ? (
    <SectionEyebrow
      className={cn(
        'mb-2',
        resolvedAlignment === 'center' && 'text-center',
        resolvedAlignment === 'right' && 'text-right',
      )}
      surface={appearance?.background ?? 'none'}
    >
      {eyebrow.trim()}
    </SectionEyebrow>
  ) : null}
  <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
    {resolvedAccentTitle ? (
      <>
        <span className="block">{resolvedTitle}</span>
        <em className="block">{resolvedAccentTitle}</em>
      </>
    ) : (
      resolvedTitle
    )}
  </h1>
  {subtitle?.trim() ? (
    <p
      className="mt-3 max-w-2xl text-lg text-current/70"
      data-page-header-description="true"
    >
      {subtitle.trim()}
    </p>
  ) : null}
</PageHeaderActionLayout>
<BlockFooterActions actions={footerActions} />
```

Keep the existing Minimal section padding, appearance classes, and no-image behavior. Legacy Split automatically receives `resolvedActionPlacement === 'side'`; it does not render `backgroundImage`.

- [ ] **Step 6: Remove stale eyebrow-source assertions**

In `tests/int/section-eyebrow.int.spec.tsx`, replace the Page Header-specific lines in `does not convert metadata labels into section eyebrows` with:

```ts
const pageHeader = read('src/blocks/PageHeader/Component.tsx')
expect(pageHeader).toContain('SectionEyebrow')
expect(pageHeader).not.toContain('sectionEyebrowClasses')
expect(pageHeader).not.toContain('data-page-header-key-facts')
```

Keep every other assertion in that test unchanged.

- [ ] **Step 7: Run focused tests, types, lint, and formatting**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/PageHeader/Component.tsx src/blocks/PageHeader/config.ts tests/int/page-header-actions.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
pnpm exec prettier --check src/blocks/PageHeader/Component.tsx src/blocks/PageHeader/config.ts tests/int/page-header-actions.int.spec.tsx
git diff --check
```

Expected: all commands pass with no new warning or formatting error.

- [ ] **Step 8: Commit only if the user authorizes it**

Do not stage or commit during the current work. If authorized later, include Task 2 with the same final feature commit as Tasks 1 and 3.

---

### Task 3: Refresh fixtures, documentation, and whole-project verification

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `public/block-thumbnails/page-header.jpg`
- Modify: `docs/superpowers/specs/2026-08-14-page-header-key-facts-rail-design.md`
- Verify: `docs/superpowers/specs/2026-08-14-page-header-action-layout-design.md`

**Interfaces:**

- Consumes: `PageHeaderBlockComponent` with `actionPlacement="side"`.
- Produces: the canonical Page Header admin thumbnail showing Banner copy and a right-side action rail.

- [ ] **Step 1: Replace the thumbnail fixture**

In `src/block-thumbnails/fixtures.tsx`, remove `keyFacts` and `keyFactsNumberPosition` from the Page Header fixture. Configure:

```tsx
<PageHeaderBlockComponent
  actionPlacement="side"
  actions={[
    {
      label: 'Explore Admissions',
      linkType: 'custom',
      mode: 'button',
      showArrow: true,
      url: '/admissions',
      variant: 'default',
    },
    {
      label: 'Download Brochure',
      linkType: 'custom',
      mode: 'button',
      showArrow: true,
      url: '/brochure.pdf',
      variant: 'outline',
    },
  ]}
  appearance={{ background: 'brand', border: 'none' }}
  backgroundImage={fakeMedia(editorialLandscape, 'Medical learning environment', 1600, 900)}
  breadcrumbMode="hidden"
  contentAlignment="left"
  eyebrow="Admissions"
  height="default"
  overlayStyle="dark"
  subtitle="Discover an academic environment built around knowledge, clinical experience, and compassionate care."
  title="Your journey in medicine starts here."
  variant="banner"
/>
```

- [ ] **Step 2: Mark the retired rail specification as superseded**

Add this immediately below the title in `docs/superpowers/specs/2026-08-14-page-header-key-facts-rail-design.md`:

```md
> Superseded by [Page Header Action Layout](./2026-08-14-page-header-action-layout-design.md). Key Facts data remains stored for compatibility but its rail and controls are retired.
```

- [ ] **Step 3: Run fixture and rendering regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: PASS, including one production-component fixture for every thumbnail definition.

- [ ] **Step 4: Regenerate and inspect the Page Header thumbnail**

With the existing local development server available, run:

```bash
BLOCK_THUMBNAIL_BASE_URL=http://localhost:3000 \
BLOCK_THUMBNAIL_SLUG=pageHeader \
pnpm run generate:block-thumbnails
```

Expected: `public/block-thumbnails/page-header.jpg` is a 1600×900 JPEG showing image-backed Banner copy on the left and two stacked actions on the right.

- [ ] **Step 5: Verify responsive layout in a real browser**

At 375px, 768px, and 1440px, inspect the Page Header preview and record:

```ts
{
  documentOverflows: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  placement: document
    .querySelector('[data-page-header-action-placement]')
    ?.getAttribute('data-page-header-action-placement'),
  actionsDisplay: getComputedStyle(
    document.querySelector('[data-page-header-actions]') as HTMLElement,
  ).display,
}
```

Expected:

- No viewport horizontally overflows.
- Side actions follow the copy in DOM order at every width.
- At 375px and 768px, actions sit below the description.
- At 1440px, the layout resolves to two columns and actions remain stacked on the right.
- Inline placement keeps actions directly under the description.

- [ ] **Step 6: Run the complete verification suite**

Run:

```bash
pnpm run test:int
pnpm exec tsc --noEmit
git diff --check
git status --short
```

Expected: all integration tests and TypeScript pass. `git status --short` shows the feature edits only in the unstaged column or as untracked files; no new path is added to the Git index.

- [ ] **Step 7: Commit only if the user authorizes it**

When and only when authorized:

```bash
git add docs/superpowers/plans/2026-08-14-page-header-action-layout.md \
  docs/superpowers/specs/2026-08-14-page-header-action-layout-design.md \
  docs/superpowers/specs/2026-08-14-page-header-key-facts-rail-design.md \
  public/block-thumbnails/page-header.jpg \
  src/block-thumbnails/fixtures.tsx \
  src/blocks/PageHeader/Component.tsx \
  src/blocks/PageHeader/config.ts \
  src/payload-types.ts \
  tests/int/page-header-actions.int.spec.tsx \
  tests/int/page-header-key-facts.int.spec.tsx \
  tests/int/section-eyebrow.int.spec.tsx
git commit -m "feat: refine page header actions"
```

Before staging, verify that including the deleted Key Facts test path records its deletion and does not disturb unrelated staged work.
