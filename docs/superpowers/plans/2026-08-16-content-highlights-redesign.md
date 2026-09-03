# Content Highlights Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Content Highlights as a calm three-presentation section with per-card marker modes, explicit shared card actions, and current section configuration conventions.

**Architecture:** The Payload schema defines editor-facing marker, action, presentation, and header-layout choices. `ContentHighlightsBlockComponent` normalizes legacy CMS data into a strict presentation model, while `ContentHighlights` renders semantic section composition and delegates each equal-height item to a focused card renderer. `ContentActions` gains optional surface-class inputs so card buttons and links remain theme-aware without duplicating shared action markup.

**Tech Stack:** Payload CMS 3.85, Next.js 16.2, React 19, Tailwind CSS 4, TypeScript, Vitest

## Global Constraints

- The visual direction is a quiet academic index using existing theme tokens only.
- Card markers are configured per card as Numbered, Custom label, or Hidden; Numbered is the default.
- `metadata` and the old item `linkType`, `page`, `url`, and `openInNewTab` fields are removed and ignored without migration.
- Card titles remain plain text; cards are never wrapped in anchors.
- Each card supports at most one shared `cardAction` with link/button mode, shared variants, optional arrow, and new-tab behavior.
- Every valid card action has a conditional top-rule footer anchored to the card bottom; invalid or absent actions create no border or empty space.
- Layout choices are Editorial List (`editorialRow`), Calm Grid (`highlightsGrid`), and Simple Grid (`simpleGrid`); Calm Grid is the default.
- Legacy `numberedSteps` renders as Calm Grid but is absent from the current schema.
- Header Layout choices are Stacked and Split; legacy `enableSplitLayout: true` remains a runtime fallback only.
- Split uses at most two item columns and collapses to intro, actions, then items on mobile.
- Shared appearance, spacing, typography, card surfaces, actions, and footer actions remain the source of truth.
- No images, icons, client state, animation, whole-card links, or new palette are introduced.

---

## File Structure

- Modify `tests/int/content-highlights.int.spec.tsx`: schema, normalization, presentation, fallback, and card-action contracts.
- Modify `tests/int/content-action-presentation.int.spec.tsx`: optional surface-class behavior for shared actions.
- Modify `src/blocks/ContentHighlights/config.ts`: current Content and Theme Settings fields and conditions.
- Modify `src/blocks/ContentHighlights/Component.tsx`: legacy input normalization and action resolution.
- Modify `src/components/ContentActions.tsx`: optional per-variant button and link surface classes.
- Modify `src/components/content-highlights.tsx`: three presentations, marker rendering, card surfaces, and action footers.
- Regenerate `src/payload-types.ts`: current schema types without removed fields.
- Modify `src/block-thumbnails/fixtures.tsx`: representative mixed-marker Calm Grid fixture with card actions.
- Regenerate `public/block-thumbnails/content-highlights.jpg`: current admin picker preview.

### Task 1: Lock the current Payload and normalization contract

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Test: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Consumes: `ContentHighlightsBlock`, `ContentHighlightsBlockComponent`, `ContentHighlights`, and existing test field helpers.
- Produces: failing tests for the exact current schema, removed fields, marker normalization, explicit card actions, and legacy fallbacks.

- [ ] **Step 1: Replace the schema assertions with the current field contract**

Keep the existing block identity assertions, then assert:

```tsx
expect(content?.fields.map(({ name }) => name)).toEqual([
  'eyebrow',
  'title',
  'accentTitle',
  'description',
  'actions',
  'footerActions',
  'items',
])
expect(getField(content?.fields ?? [], 'title')).toMatchObject({ required: true, type: 'text' })

const itemsTabsField = items?.fields?.[0] as TestField | undefined
const itemsContentTab = itemsTabsField?.tabs?.find(({ label }) => label === 'Content')
const itemsThemeTab = itemsTabsField?.tabs?.find(({ label }) => label === 'Theme Settings')

expect(itemsContentTab?.fields?.map(({ name }) => name)).toEqual([
  'markerMode',
  'markerLabel',
  'title',
  'description',
  'cardAction',
])
expect(getField(itemsContentTab?.fields ?? [], 'markerMode')).toMatchObject({
  defaultValue: 'numbered',
  required: true,
  type: 'select',
})
expect(
  getField(itemsContentTab?.fields ?? [], 'markerMode')?.options?.map(({ value }) => value),
).toEqual(['numbered', 'custom', 'hidden'])
expect(getField(itemsContentTab?.fields ?? [], 'markerLabel')?.admin?.condition).toBeTypeOf(
  'function',
)
expect(
  getField(itemsContentTab?.fields ?? [], 'markerLabel')?.admin?.condition?.(
    {},
    { markerMode: 'custom' },
  ),
).toBe(true)
expect(getField(itemsContentTab?.fields ?? [], 'title')).toMatchObject({
  required: true,
  type: 'text',
})
expect(getField(itemsContentTab?.fields ?? [], 'cardAction')).toMatchObject({
  maxRows: 1,
  type: 'array',
})
expect(itemsThemeTab?.fields?.map(({ name }) => name)).toEqual(['cardBackground'])

for (const removedField of ['metadata', 'linkType', 'page', 'url', 'openInNewTab']) {
  expect(getField(itemsContentTab?.fields ?? [], removedField)).toBeUndefined()
}
```

- [ ] **Step 2: Assert the aligned Theme Settings controls**

Add:

```tsx
expect(layout?.fields.map(({ name }) => name)).toEqual([
  'appearance',
  'layout',
  'headerLayout',
  'contentAlignment',
  'splitContentAlignment',
  'size',
])
expect(getField(layout?.fields ?? [], 'layout')?.options).toEqual([
  { label: 'Editorial List', value: 'editorialRow' },
  { label: 'Calm Grid', value: 'highlightsGrid' },
  { label: 'Simple Grid', value: 'simpleGrid' },
])
expect(getField(layout?.fields ?? [], 'headerLayout')).toMatchObject({
  defaultValue: 'stacked',
  required: true,
  type: 'select',
})
expect(getField(layout?.fields ?? [], 'headerLayout')?.options?.map(({ value }) => value)).toEqual([
  'stacked',
  'split',
])
expect(getField(layout?.fields ?? [], 'enableSplitLayout')).toBeUndefined()

const horizontal = getField(layout?.fields ?? [], 'contentAlignment')
const vertical = getField(layout?.fields ?? [], 'splitContentAlignment')
expect(horizontal?.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(true)
expect(horizontal?.admin?.condition?.({}, { headerLayout: 'split' })).toBe(false)
expect(vertical?.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(false)
expect(vertical?.admin?.condition?.({}, { headerLayout: 'split' })).toBe(true)
```

- [ ] **Step 3: Add marker and filtered-numbering tests**

Add:

```tsx
it('normalizes per-card markers after unusable rows are removed', () => {
  const html = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      items={[
        { markerMode: 'numbered', title: 'First usable card' },
        { markerMode: 'numbered', title: '   ' },
        { markerLabel: 'Clinical', markerMode: 'custom', title: 'Custom marker' },
        { markerMode: 'hidden', title: 'No marker' },
        { markerLabel: '   ', markerMode: 'custom', title: 'Blank custom marker' },
        { markerMode: 'stale' as never, title: 'Safe default' },
      ]}
      title="Highlights"
    />,
  )

  expect(html).toContain('data-content-highlight-marker="01"')
  expect(html).toContain('data-content-highlight-marker="Clinical"')
  expect(html).toContain('data-content-highlight-marker="05"')
  expect(html).not.toContain('data-content-highlight-marker="02"')
  expect(html).not.toContain('data-content-highlight-marker="03"')
  expect(html).not.toContain('data-content-highlight-marker=""')
  expect(html).not.toContain('data-content-highlight-metadata')
})
```

The fifth usable card receives `05`; Hidden and blank Custom cards still occupy their real content position even though they render no marker.

- [ ] **Step 4: Add card-action and discarded-field tests**

Add:

```tsx
it('renders one explicit card action and ignores legacy title-link fields', () => {
  const html = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      items={[
        {
          cardAction: [
            {
              label: 'Explore programme',
              linkType: 'custom',
              mode: 'button',
              openInNewTab: true,
              showArrow: true,
              url: '/programmes',
              variant: 'default',
            },
          ],
          cardBackground: 'primary',
          linkType: 'custom' as never,
          metadata: 'Discard me' as never,
          title: 'Clinical learning',
          url: '/legacy-title-link' as never,
        },
        {
          cardAction: [{ label: 'Broken action', linkType: 'custom', url: '' }],
          title: 'No empty footer',
        },
      ]}
      title="Highlights"
    />,
  )

  expect(html).toContain('data-content-highlight-action-footer="true"')
  expect(html).toContain('border-t')
  expect(html).toContain('mt-auto')
  expect(html).toContain('href="/programmes"')
  expect(html).toContain('target="_blank"')
  expect(html).toContain('rel="noreferrer"')
  expect(html).toContain('data-action-arrow="true"')
  expect(html).toContain('bg-primary-foreground text-primary')
  expect(html).not.toContain('/legacy-title-link')
  expect(html).not.toContain('Discard me')
  expect(html.match(/data-content-highlight-action-footer="true"/g)).toHaveLength(1)
})
```

- [ ] **Step 5: Add current and legacy layout normalization tests**

Add:

```tsx
it.each([
  ['editorialRow', 'editorialRow'],
  ['highlightsGrid', 'highlightsGrid'],
  ['simpleGrid', 'simpleGrid'],
  ['numberedSteps', 'highlightsGrid'],
  ['stale', 'highlightsGrid'],
] as const)('normalizes %s to %s', (layout, expected) => {
  const html = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      items={[{ title: 'Item' }]}
      layout={layout as never}
      title="Highlights"
    />,
  )
  expect(html).toContain(`data-content-highlights-layout="${expected}"`)
})

it('uses legacy split data only when Header Layout is absent', () => {
  const legacy = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      enableSplitLayout
      items={[{ title: 'Item' }]}
      title="Legacy split"
    />,
  )
  const explicit = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      enableSplitLayout
      headerLayout="stacked"
      items={[{ title: 'Item' }]}
      title="Explicit stacked"
    />,
  )
  expect(legacy).toContain('data-content-highlights-header-layout="split"')
  expect(explicit).toContain('data-content-highlights-header-layout="stacked"')
})
```

- [ ] **Step 6: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because the schema still exposes metadata, title links, four layouts, and the split checkbox; the renderer lacks marker modes and card actions.

- [ ] **Step 7: Commit the failing contract**

```bash
git add tests/int/content-highlights.int.spec.tsx
git commit -m "test(content-highlights): define redesign contract"
```

### Task 2: Align the Payload schema and normalize CMS values

**Files:**

- Modify: `src/blocks/ContentHighlights/config.ts`
- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Test: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Consumes: `createCardTabs`, `createContentActionsField`, `resolveCmsActions`, shared appearance fields, and current CMS values.
- Produces: `ContentHighlightsBlock` with `markerMode`, `markerLabel`, `cardAction`, `headerLayout`; normalized `ContentHighlightItem[]` with at most one resolved action.

- [ ] **Step 1: Replace item-link conditions with marker and header conditions**

At the top of `src/blocks/ContentHighlights/config.ts`, use:

```ts
import type { ArrayField, Block, SelectField, TabsField } from 'payload'

type MarkerSiblingData = {
  markerMode?: 'custom' | 'hidden' | 'numbered' | null
}

type HeaderLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

const isCustomMarker = (_data: unknown, siblingData: MarkerSiblingData) =>
  siblingData?.markerMode === 'custom'

const isStackedHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout !== 'split'

const isSplitHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout === 'split'
```

Delete `ItemLinkSiblingData`, `ContentHighlightsLayoutSiblingData`, and all five legacy link/split condition functions.

- [ ] **Step 2: Replace the item Content fields**

Use this `createCardTabs` declaration inside `itemsField`:

```ts
createCardTabs({
  contentFields: [
    {
      name: 'markerMode',
      label: 'Marker',
      type: 'select',
      defaultValue: 'numbered',
      options: [
        { label: 'Numbered', value: 'numbered' },
        { label: 'Custom Label', value: 'custom' },
        { label: 'Hidden', value: 'hidden' },
      ],
      required: true,
      admin: {
        description: 'Choose how this card is identified before its title.',
      },
    } satisfies SelectField,
    {
      name: 'markerLabel',
      label: 'Custom Label',
      type: 'text',
      admin: {
        condition: isCustomMarker,
        description: 'Short text such as Clinical, Year 1, or Research.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    createContentActionsField({ name: 'cardAction', label: 'Card Action', maxRows: 1 }),
  ],
}),
```

Keep `minRows: 1`, `maxRows: 6`, `required: true`, and collapsed rows. Remove the Numbered Steps-only card-background description so the standard shared description applies.

- [ ] **Step 3: Replace Theme Settings layout controls**

Make the block title required. Replace the layout and split fields with:

```ts
{
  name: 'layout',
  label: 'Layout',
  type: 'select',
  defaultValue: 'highlightsGrid',
  options: [
    { label: 'Editorial List', value: 'editorialRow' },
    { label: 'Calm Grid', value: 'highlightsGrid' },
    { label: 'Simple Grid', value: 'simpleGrid' },
  ],
  required: true,
} satisfies SelectField,
{
  name: 'headerLayout',
  label: 'Header Layout',
  type: 'select',
  defaultValue: 'stacked',
  options: [
    { label: 'Stacked', value: 'stacked' },
    { label: 'Split', value: 'split' },
  ],
  required: true,
} satisfies SelectField,
```

Set `contentAlignment.admin.condition` to `isStackedHeader`, default it to `left`, and set `splitContentAlignment.admin.condition` to `isSplitHeader`. Keep size options unchanged. The final Theme Settings order is appearance, layout, headerLayout, contentAlignment, splitContentAlignment, size.

- [ ] **Step 4: Define the normalized block adapter types**

In `src/blocks/ContentHighlights/Component.tsx`, replace the item and block types with:

```ts
type ContentHighlightItemValue = {
  cardAction?: CmsActionValue[] | null
  cardBackground?: string | null
  description?: string | null
  markerLabel?: string | null
  markerMode?: 'custom' | 'hidden' | 'numbered' | null
  title?: string | null
}

type ContentHighlightsBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: ContentHighlightsAlignment | null
  description?: string | null
  enableSplitLayout?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: ContentHighlightsHeaderLayout | null
  items?: ContentHighlightItemValue[] | null
  layout?: ContentHighlightsLayout | 'numberedSteps' | null
  size?: ContentHighlightsSize | null
  splitContentAlignment?: ContentHighlightsSplitAlignment | null
  title?: string | null
}
```

Remove `resolveCmsLink`, `CmsLinkValue`, and all legacy item-link fields from this file.

- [ ] **Step 5: Normalize marker modes, card actions, layout, and header layout**

Build resolved items with their filtered index:

```ts
const resolvedItems = (items ?? []).flatMap((item): ContentHighlightItem[] => {
  const itemTitle = item.title?.trim()
  if (!itemTitle) return []

  const markerMode =
    item.markerMode === 'custom' || item.markerMode === 'hidden'
      ? item.markerMode
      : 'numbered'

  return [
    {
      cardAction: resolveCmsActions(item.cardAction)[0],
      cardBackground: item.cardBackground,
      description: item.description?.trim() || undefined,
      markerLabel: markerMode === 'custom' ? item.markerLabel?.trim() || undefined : undefined,
      markerMode,
      title: itemTitle,
    },
  ]
})
```

Normalize the layout and header:

```ts
const resolvedLayout: ContentHighlightsLayout =
  layout === 'editorialRow' || layout === 'simpleGrid' ? layout : 'highlightsGrid'
const resolvedHeaderLayout: ContentHighlightsHeaderLayout =
  headerLayout === 'split' || headerLayout === 'stacked'
    ? headerLayout
    : enableSplitLayout === true
      ? 'split'
      : 'stacked'
```

Pass `headerLayout={resolvedHeaderLayout}` and remove `enableSplitLayout` from the presentation call. Pass `alignment={resolvedHeaderLayout === 'split' ? 'left' : resolvedAlignment}` to section actions and `BlockFooterActions`.

- [ ] **Step 6: Run the schema and adapter tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: schema and normalization assertions pass; presentation-specific marker, surface, and footer assertions remain red until Tasks 3 and 4.

- [ ] **Step 7: Commit the schema and adapter**

```bash
git add src/blocks/ContentHighlights/config.ts src/blocks/ContentHighlights/Component.tsx
git commit -m "refactor(content-highlights): align schema"
```

### Task 3: Support semantic surface classes in shared actions

**Files:**

- Modify: `tests/int/content-action-presentation.int.spec.tsx`
- Modify: `src/components/ContentActions.tsx`
- Test: `tests/int/content-action-presentation.int.spec.tsx`

**Interfaces:**

- Consumes: `CmsActionVariant`, `ResolvedCmsAction`, `Button`, and `ContentLink`.
- Produces: optional `buttonClassNames?: Partial<Record<CmsActionVariant, string>>` and `linkClassName?: string` props with no behavior change for existing callers.

- [ ] **Step 1: Add the failing surface-class test**

Import `ContentActions` and `renderToStaticMarkup` if not already present, then add:

```tsx
it('applies optional card-surface classes to buttons and links', () => {
  const html = renderToStaticMarkup(
    <ContentActions
      actions={[
        {
          href: '/apply',
          label: 'Apply',
          mode: 'button',
          showArrow: false,
          variant: 'default',
        },
        {
          href: '/details',
          label: 'Details',
          mode: 'link',
          showArrow: false,
          variant: 'default',
        },
      ]}
      buttonClassNames={{ default: 'surface-default-button' }}
      linkClassName="surface-link"
    />,
  )

  expect(html).toContain('surface-default-button')
  expect(html).toContain('surface-link')
})
```

- [ ] **Step 2: Verify the test fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx
```

Expected: FAIL because `ContentActions` does not accept or apply the new optional props.

- [ ] **Step 3: Extend `ContentActions` without changing defaults**

Import `CmsActionVariant` and extend the props:

```ts
import type { CmsActionVariant, ResolvedCmsAction } from '@/lib/cmsLinks'

type ContentActionsProps = Omit<ComponentProps<'div'>, 'children'> & {
  actions: ResolvedCmsAction[]
  alignment?: ContentActionAlignment
  buttonClassNames?: Partial<Record<CmsActionVariant, string>>
  linkClassName?: string
}
```

Destructure `buttonClassNames` and `linkClassName`. Add:

```tsx
className={buttonClassNames?.[action.variant]}
```

to `Button`, and:

```tsx
className={linkClassName}
```

to `ContentLink`. Do not change layout classes, action resolution, or any default variant.

- [ ] **Step 4: Run shared action regressions**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-action-presentation.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx
```

Expected: PASS; optional surface classes render and all existing action variants remain unchanged.

- [ ] **Step 5: Commit the shared extension**

```bash
git add tests/int/content-action-presentation.int.spec.tsx src/components/ContentActions.tsx
git commit -m "feat(actions): support card surface classes"
```

### Task 4: Build the quiet academic index presentations

**Files:**

- Modify: `src/components/content-highlights.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`
- Test: `tests/int/content-highlights.int.spec.tsx`
- Test: `tests/int/content-style-parity.int.spec.ts`

**Interfaces:**

- Consumes: `ContentActions` surface props, `resolveCardSurface`, shared section typography, spacing, appearance, and `ResolvedCmsAction`.
- Produces: `ContentHighlightsHeaderLayout`, strict three-value `ContentHighlightsLayout`, and three responsive presentations with per-card markers and action footers.

- [ ] **Step 1: Replace the public presentation types**

Use:

```ts
import type { ResolvedCmsAction } from '@/lib/cmsLinks'

export type ContentHighlightsHeaderLayout = 'split' | 'stacked'
export type ContentHighlightsLayout = 'editorialRow' | 'highlightsGrid' | 'simpleGrid'

export type ContentHighlightItem = {
  cardAction?: ResolvedCmsAction
  cardBackground?: string | null
  description?: string
  markerLabel?: string
  markerMode: 'custom' | 'hidden' | 'numbered'
  title: string
}
```

Replace `enableSplitLayout?: boolean` in `ContentHighlightsProps` with:

```ts
headerLayout?: ContentHighlightsHeaderLayout
```

Remove metadata and href/open-new-tab fields from `ContentHighlightItem`.

- [ ] **Step 2: Define the three grid and alignment maps**

Use:

```ts
const fullWidthItemGridClasses = {
  editorialRow: 'grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3',
  highlightsGrid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
  simpleGrid: 'grid gap-x-12 gap-y-10 md:grid-cols-2',
} as const satisfies Record<ContentHighlightsLayout, string>

const splitItemGridClasses = {
  editorialRow: 'grid gap-x-8 gap-y-10 md:grid-cols-2',
  highlightsGrid: 'grid gap-6 md:grid-cols-2',
  simpleGrid: 'grid gap-x-8 gap-y-10 md:grid-cols-2',
} as const satisfies Record<ContentHighlightsLayout, string>

const contentHighlightsLayouts = new Set<ContentHighlightsLayout>([
  'editorialRow',
  'highlightsGrid',
  'simpleGrid',
])
```

Keep the current horizontal, split, size-gap, and shared intro maps. Remove every `numberedSteps` entry.

- [ ] **Step 3: Render markers as information rather than decoration**

Add:

```tsx
const markerClasses = cn(
  contentItemMetadataClasses,
  'font-semibold uppercase tracking-[0.18em]',
)

function resolveMarker(item: ContentHighlightItem, index: number) {
  if (item.markerMode === 'hidden') return undefined
  if (item.markerMode === 'custom') return item.markerLabel?.trim() || undefined
  return String(index + 1).padStart(2, '0')
}
```

Inside `ContentHighlightItemComponent`, derive:

```ts
const marker = resolveMarker(item, index)
const surface = resolveCardSurface(item.cardBackground, sectionBackground)
const hasExplicitSurface = surface.value !== 'default'
```

Render marker text only when `marker` exists:

```tsx
{marker ? (
  <p
    className={cn(markerClasses, surface.icon)}
    data-content-highlight-marker={marker}
  >
    {marker}
  </p>
) : null}
```

- [ ] **Step 4: Add the card action footer**

Create this fragment inside the item renderer:

```tsx
const actionFooter = item.cardAction ? (
  <div
    className={cn('mt-auto border-t pt-4', surface.divider)}
    data-content-highlight-action-footer="true"
  >
    <ContentActions
      actions={[item.cardAction]}
      alignment="left"
      buttonClassNames={surface.button}
      className="w-auto"
      linkClassName={surface.link}
    />
  </div>
) : null
```

Place it after the card's title/description group. Give the content group `pb-6` only when `actionFooter` exists so the action rule has clear separation. Do not render a wrapper when no action exists.

- [ ] **Step 5: Implement Editorial List and Calm Grid cards**

Use semantic article classes:

```tsx
const containedCardClasses = cn(
  'rounded-[var(--radius)] border p-6 md:p-7',
  surface.className,
  surface.divider,
)

if (layout === 'editorialRow') {
  return (
    <article
      className={cn(
        'flex min-h-full min-w-0 flex-col text-left',
        hasExplicitSurface
          ? containedCardClasses
          : cn('border-t pt-5', surface.className, surface.divider),
      )}
      data-card-background={surface.value}
      data-content-highlight-item="true"
      data-content-highlight-presentation="editorial"
    >
      <div className={cn('flex flex-col gap-3', actionFooter && 'pb-6')}>
        {markerNode}
        <h3 className={contentItemTitleClasses}>{item.title}</h3>
        {item.description ? (
          <p className={cn(contentItemDescriptionClasses, 'max-w-[65ch] leading-6', surface.secondary)}>
            {item.description}
          </p>
        ) : null}
      </div>
      {actionFooter}
    </article>
  )
}

if (layout === 'highlightsGrid') {
  return (
    <article
      className={cn('flex min-h-full min-w-0 flex-col text-left', containedCardClasses)}
      data-card-background={surface.value}
      data-content-highlight-item="true"
      data-content-highlight-presentation="calm"
    >
      <div className={cn('flex flex-col gap-3', actionFooter && 'pb-6')}>
        {markerNode}
        <h3 className={contentItemTitleClasses}>{item.title}</h3>
        {item.description ? (
          <p className={cn(contentItemDescriptionClasses, 'max-w-[65ch] leading-6', surface.secondary)}>
            {item.description}
          </p>
        ) : null}
      </div>
      {actionFooter}
    </article>
  )
}
```

Define `markerNode` once using the Step 3 markup before these branches.

- [ ] **Step 6: Implement the Simple Grid reading unit**

Use:

```tsx
return (
  <article
    className={cn(
      'flex min-h-full min-w-0 flex-col text-left',
      hasExplicitSurface && containedCardClasses,
      !hasExplicitSurface && surface.className,
    )}
    data-card-background={surface.value}
    data-content-highlight-item="true"
    data-content-highlight-presentation="simple"
  >
    <div
      className={cn(
        'grid min-w-0 gap-4',
        marker ? 'grid-cols-[3.5rem_minmax(0,1fr)]' : 'grid-cols-1',
        actionFooter && 'pb-6',
      )}
    >
      {markerNode}
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className={contentItemTitleClasses}>{item.title}</h3>
        {item.description ? (
          <p className={cn(contentItemDescriptionClasses, 'max-w-[65ch] leading-6', surface.secondary)}>
            {item.description}
          </p>
        ) : null}
      </div>
    </div>
    {actionFooter}
  </article>
)
```

Hidden and blank Custom markers switch to one column, so they reserve no marker space.

- [ ] **Step 7: Replace split-checkbox composition with Header Layout**

Destructure `headerLayout = 'stacked'` and resolve:

```ts
const resolvedHeaderLayout: ContentHighlightsHeaderLayout =
  headerLayout === 'split' ? 'split' : 'stacked'
const isSplit = resolvedHeaderLayout === 'split'
```

Replace `data-content-highlights-split` with:

```tsx
data-content-highlights-header-layout={resolvedHeaderLayout}
```

Keep the large split grid `lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]`, intro-first DOM order, and two-column split maps. In Stacked, render actions inside `ContentHighlightsIntro` for every layout; remove the old Editorial Row far-right action slot so section actions consistently belong to the intro group.

- [ ] **Step 8: Update presentation tests and run focused regressions**

Replace old metadata, numbered-card, split-checkbox, separator, and Editorial action-slot assertions with:

```tsx
expect(editorialHtml).toContain('data-content-highlight-presentation="editorial"')
expect(editorialHtml).toContain('border-t')
expect(calmHtml).toContain('data-content-highlight-presentation="calm"')
expect(calmHtml).toContain('rounded-[var(--radius)] border p-6 md:p-7')
expect(simpleHtml).toContain('data-content-highlight-presentation="simple"')
expect(simpleHtml).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
expect(splitHtml).toContain('data-content-highlights-header-layout="split"')
expect(splitHtml).toContain('lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')
expect(splitHtml).not.toContain('lg:grid-cols-3')
```

In `tests/int/content-style-parity.int.spec.ts`, keep these contracts shared by Content Highlights and Editorial Reasons:

```ts
const sharedContracts = [
  'contentIntroClasses',
  'contentSectionHeadingClasses',
  'contentSectionDescriptionClasses',
  'contentItemTitleClasses',
  'contentItemDescriptionClasses',
  'contentItemMetadataClasses',
]
```

Remove `contentItemLinkClasses` only from `sharedContracts`; keep its standalone definition assertion because Editorial Reasons and other linked-title blocks still use it. This records that Content Highlights titles are intentionally no longer links while markers retain the shared utility typography.

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/content-style-parity.int.spec.ts tests/int/content-action-presentation.int.spec.tsx
```

Expected: PASS with all three presentations, markers, surfaces, actions, split composition, and shared typography contracts green.

- [ ] **Step 9: Commit the presentations**

```bash
git add src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx tests/int/content-style-parity.int.spec.ts
git commit -m "feat(content-highlights): rebuild presentations"
```

### Task 5: Regenerate types, refresh the preview, and verify the redesign

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/content-highlights.jpg`
- Test: `tests/int/content-highlights.int.spec.tsx`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Test: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**

- Consumes: final Content Highlights schema, adapter, presentation, and shared actions.
- Produces: current generated Payload declarations and a verified 1600×900 admin preview.

- [ ] **Step 1: Replace the Content Highlights thumbnail fixture**

Use a Calm Grid fixture with mixed marker modes and explicit actions:

```tsx
<ContentHighlightsBlockComponent
  actions={[
    {
      label: 'Explore student life',
      linkType: 'custom',
      url: '/student-life',
    },
  ]}
  appearance={{ background: 'subtle', border: 'topAndBottom' }}
  description="Resources, communities, and opportunities designed to support every part of the student experience."
  eyebrow="Life here"
  headerLayout="stacked"
  items={[
    {
      cardAction: [
        {
          label: 'Explore housing',
          linkType: 'custom',
          showArrow: true,
          url: '/student-life/housing',
        },
      ],
      description: 'On-campus and supported off-campus options for every stage.',
      markerMode: 'numbered',
      title: 'Housing',
    },
    {
      description: 'Dedicated people and resources for physical and mental wellbeing.',
      markerLabel: 'Support',
      markerMode: 'custom',
      title: 'Wellness',
    },
    {
      cardAction: [
        {
          label: 'Find a community',
          linkType: 'custom',
          mode: 'button',
          url: '/student-life/organizations',
          variant: 'outline',
        },
      ],
      description: 'Student-led groups spanning academic, creative, and community interests.',
      markerMode: 'hidden',
      title: 'Organizations',
    },
  ]}
  layout="highlightsGrid"
  size="compact"
  title="What students say matters"
/>
```

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `ContentHighlightsBlock` contains `markerMode`, `markerLabel`, `cardAction`, and `headerLayout`; it excludes metadata, old item links, `numberedSteps`, and `enableSplitLayout`.

- [ ] **Step 3: Add generated-type assertions and run focused tests**

In `tests/int/content-highlights.int.spec.tsx`, read the Content Highlights interface slice and assert:

```tsx
expect(contentHighlightsType).toContain("markerMode: 'numbered' | 'custom' | 'hidden';")
expect(contentHighlightsType).toContain('markerLabel?: string | null;')
expect(contentHighlightsType).toContain('cardAction?:')
expect(contentHighlightsType).toContain("layout: 'editorialRow' | 'highlightsGrid' | 'simpleGrid';")
expect(contentHighlightsType).toContain("headerLayout: 'stacked' | 'split';")
expect(contentHighlightsType).not.toContain('metadata?:')
expect(contentHighlightsType).not.toContain("linkType: 'none' | 'page' | 'custom';")
expect(contentHighlightsType).not.toContain('enableSplitLayout')
expect(contentHighlightsType).not.toContain('numberedSteps')
```

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 4: Regenerate only the Content Highlights thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_BASE_URL=http://127.0.0.1:1 BLOCK_THUMBNAIL_SLUG=contentHighlights pnpm generate:block-thumbnails
```

If the repository's development server already owns Next's dev lock, omit `BLOCK_THUMBNAIL_BASE_URL` and let the generator reuse `http://localhost:3000` without stopping that server.

Expected: `✓ contentHighlights -> public/block-thumbnails/content-highlights.jpg`.

- [ ] **Step 5: Verify thumbnail infrastructure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: PASS; the fixture renders and the image remains a valid 1600×900 JPEG.

- [ ] **Step 6: Run the bounded visual quality pass**

Inspect the Content Highlights fixture at desktop and mobile widths in one pass. Confirm:

- the intro is the primary group and cards read in DOM order;
- mixed Numbered, Custom, and Hidden markers remain calm and aligned;
- card descriptions wrap without overflow;
- only cards with valid actions show the action rule;
- action footers align at the card bottom on desktop;
- card buttons and links retain contrast on default and explicit surfaces;
- the mobile order is intro, section actions, then one-column cards.

Run the mechanical scan:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/content-highlights.tsx src/blocks/ContentHighlights/Component.tsx
```

Expected: no unexplained layout findings.

- [ ] **Step 7: Run project-level verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
git diff --check
```

Expected: TypeScript reports no errors, ESLint exits successfully, all integration tests pass, and Git reports no whitespace errors. If MongoMemoryServer is blocked by sandbox port permissions, rerun only `pnpm test:int` with local network permission.

- [ ] **Step 8: Review the exact working tree**

Run:

```bash
git status --short
git diff --stat
```

Expected: only Content Highlights tests/config/adapter/presentation, the optional shared action surface extension, generated Payload types, fixture, and thumbnail are changed.

- [ ] **Step 9: Commit generated artifacts and verification updates**

```bash
git add src/payload-types.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/content-highlights.jpg tests/int/content-highlights.int.spec.tsx
git commit -m "chore(content-highlights): refresh artifacts"
```
