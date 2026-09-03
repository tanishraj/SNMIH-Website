# Icon Card Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` when available. In this environment those sub-skills are unavailable, so execute the checked tasks inline with review checkpoints.

**Goal:** Add a reusable Payload block that renders equal-sized, configurable Lucide icon cards over an optional full-width background image.

**Architecture:** Create an isolated `IconCardShowcase` Payload schema and server renderer that reuse the project’s appearance, media-overlay, card-surface, section-header, action, spacing, media, and link helpers. Register the block in both authoring collections and both page renderers, then add generated types and thumbnail coverage.

**Tech Stack:** Payload CMS 3, React Server Components, Next.js 16, TypeScript, Tailwind CSS 4, Lucide React, Vitest

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-16-icon-card-showcase-design.md` exactly.
- Do not modify Icon Grid or another existing block to implement this feature.
- Do not add dependencies.
- Do not stage or commit files.
- Preserve unrelated working-tree changes.
- Use `apply_patch` for authored file changes.
- Use shared section, overlay, card-surface, content-style, action, link, and media helpers.
- The background image is optional and decorative.
- Card width, height, and icon size are global controls.
- The default card background is Primary; each card may inherit or override it.

---

### Task 1: Define the Payload schema

**Files:**

- Create: `src/blocks/IconCardShowcase/config.ts`
- Create: `tests/int/icon-card-showcase.int.spec.tsx`
- Modify: `src/block-thumbnails/definitions.ts`

**Interfaces:**

- Produces: `IconCardShowcaseBlock` with slug `iconCardShowcase` and generated interface `IconCardShowcaseBlock`.
- Produces card values `inherit | default | primary | secondary | muted | accent`.
- Uses shared section actions, footer actions, icon field, Appearance, and media-overlay field factories.

- [ ] **Step 1: Write the failing schema contract test**

Create `tests/int/icon-card-showcase.int.spec.tsx` with helpers that find fields through nested tabs, then assert this contract:

```tsx
import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { IconCardShowcaseBlockComponent } from '@/blocks/IconCardShowcase/Component'
import { IconCardShowcaseBlock } from '@/blocks/IconCardShowcase/config'

const findField = (fields: unknown[], name: string): Record<string, unknown> | undefined => {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    if ('name' in field && field.name === name) return field as Record<string, unknown>
    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findField(field.fields, name)
      if (nested) return nested
    }
    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)) {
          const nested = findField(tab.fields, name)
          if (nested) return nested
        }
      }
    }
  }
  return undefined
}

const optionValues = (field: Record<string, unknown> | undefined) =>
  ((field?.options ?? []) as Array<{ value: string }>).map(({ value }) => value)

describe('Icon Card Showcase', () => {
  it('defines the complete Payload schema and defaults', () => {
    expect(IconCardShowcaseBlock).toMatchObject({
      interfaceName: 'IconCardShowcaseBlock',
      slug: 'iconCardShowcase',
    })

    expect(findField(IconCardShowcaseBlock.fields, 'backgroundImage')).toMatchObject({
      relationTo: 'media',
      required: false,
      type: 'upload',
    })
    expect(findField(IconCardShowcaseBlock.fields, 'cards')).toMatchObject({
      maxRows: 12,
      minRows: 1,
      required: true,
      type: 'array',
    })
    expect(findField(IconCardShowcaseBlock.fields, 'headerLayout')).toMatchObject({
      defaultValue: 'stacked',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'headerLayout'))).toEqual([
      'stacked',
      'split',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'center',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'contentAlignment'))).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'cardWidth')).toMatchObject({
      defaultValue: 'standard',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'cardWidth'))).toEqual([
      'compact',
      'standard',
      'wide',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'cardHeight')).toMatchObject({
      defaultValue: 'standard',
      required: true,
    })
    expect(findField(IconCardShowcaseBlock.fields, 'iconSize')).toMatchObject({
      defaultValue: 'standard',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'iconSize'))).toEqual([
      'small',
      'standard',
      'large',
      'extraLarge',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'defaultCardBackground')).toMatchObject({
      defaultValue: 'primary',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'defaultCardBackground'))).toEqual([
      'default',
      'primary',
      'secondary',
      'muted',
      'accent',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'cardBackground')).toMatchObject({
      defaultValue: 'inherit',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'cardBackground'))).toEqual([
      'inherit',
      'default',
      'primary',
      'secondary',
      'muted',
      'accent',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'size')).toMatchObject({
      defaultValue: 'default',
      required: true,
    })

    for (const name of ['themeMode', 'overlayStyle', 'overlayDirection', 'overlayCoverage']) {
      expect(findField(IconCardShowcaseBlock.fields, name)?.admin).toMatchObject({
        condition: expect.any(Function),
      })
    }
  })
})
```

- [ ] **Step 2: Run the new test and verify module resolution fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx
```

Expected: FAIL because `@/blocks/IconCardShowcase/config` and `Component` do not exist.

- [ ] **Step 3: Add the thumbnail manifest entry required by the block config**

Add this definition beside Icon Grid in `src/block-thumbnails/definitions.ts` so
`getBlockThumbnailAdmin('iconCardShowcase')` is type-safe and resolvable:

```ts
defineThumbnail({
  alt: 'Icon Card Showcase block preview',
  filename: 'icon-card-showcase.jpg',
  label: 'Icon Card Showcase',
  slug: 'iconCardShowcase',
  stageAlignment: 'top',
}),
```

- [ ] **Step 4: Add the schema**

Create `src/blocks/IconCardShowcase/config.ts` with:

```ts
import type { ArrayField, Block, CheckboxField, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type BlockSiblingData = { backgroundImage?: unknown }
type CardSiblingData = { linkType?: 'custom' | 'none' | 'page' | null }

const hasBackgroundImage = (_data: unknown, siblingData: BlockSiblingData) =>
  Boolean(siblingData?.backgroundImage)
const isPageLink = (_data: unknown, siblingData: CardSiblingData) =>
  siblingData?.linkType === 'page'
const isCustomLink = (_data: unknown, siblingData: CardSiblingData) =>
  siblingData?.linkType === 'custom'
const hasLink = (_data: unknown, siblingData: CardSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const cardBackgroundOptions = [
  { label: 'Match Section', value: 'default' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Muted', value: 'muted' },
  { label: 'Accent', value: 'accent' },
] as const

const cardBackgroundField = {
  name: 'cardBackground',
  label: 'Background Override',
  type: 'select',
  defaultValue: 'inherit',
  required: true,
  options: [{ label: 'Use Showcase Default', value: 'inherit' }, ...cardBackgroundOptions],
} satisfies SelectField

const cardsField = {
  name: 'cards',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 12,
  admin: { initCollapsed: true },
  fields: [
    createCardTabs({
      includeBackground: false,
      contentFields: [
        createIconField({ required: true }),
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        {
          name: 'linkType',
          label: 'Card Link',
          type: 'radio',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Page', value: 'page' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { layout: 'horizontal' },
        } satisfies RadioField,
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          admin: { condition: isPageLink },
        },
        {
          name: 'url',
          label: 'Custom URL',
          type: 'text',
          admin: { condition: isCustomLink },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
          admin: { condition: hasLink },
        } satisfies CheckboxField,
      ],
      themeFields: [cardBackgroundField],
    }),
  ],
} satisfies ArrayField

const select = (
  name: string,
  label: string,
  defaultValue: string,
  options: Array<{ label: string; value: string }>,
): SelectField => ({ name, label, type: 'select', defaultValue, options, required: true })

export const IconCardShowcaseBlock: Block = {
  admin: getBlockThumbnailAdmin('iconCardShowcase'),
  slug: 'iconCardShowcase',
  interfaceName: 'IconCardShowcaseBlock',
  labels: { singular: 'Icon Card Showcase', plural: 'Icon Card Showcases' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'backgroundImage', type: 'upload', relationTo: 'media', required: false },
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            cardsField,
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            createMediaOverlayToneField({
              condition: hasBackgroundImage,
              defaultValue: 'light',
              required: false,
            }),
            createMediaOverlayStrengthField({
              condition: hasBackgroundImage,
              defaultValue: 'light',
              required: false,
            }),
            createMediaOverlayDirectionField({
              condition: hasBackgroundImage,
              defaultValue: 'vertical',
              required: false,
            }),
            createMediaOverlayCoverageField({ condition: hasBackgroundImage, required: false }),
            select('headerLayout', 'Header Layout', 'stacked', [
              { label: 'Stacked', value: 'stacked' },
              { label: 'Split', value: 'split' },
            ]),
            select('contentAlignment', 'Section Content Alignment', 'center', [
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
            ]),
            select('cardWidth', 'Card Width', 'standard', [
              { label: 'Compact', value: 'compact' },
              { label: 'Standard', value: 'standard' },
              { label: 'Wide', value: 'wide' },
            ]),
            select('cardHeight', 'Card Height', 'standard', [
              { label: 'Compact', value: 'compact' },
              { label: 'Standard', value: 'standard' },
              { label: 'Tall', value: 'tall' },
            ]),
            select('iconSize', 'Icon Size', 'standard', [
              { label: 'Small', value: 'small' },
              { label: 'Standard', value: 'standard' },
              { label: 'Large', value: 'large' },
              { label: 'Extra Large', value: 'extraLarge' },
            ]),
            {
              name: 'defaultCardBackground',
              label: 'Default Card Background',
              type: 'select',
              defaultValue: 'primary',
              required: true,
              options: [...cardBackgroundOptions],
            } satisfies SelectField,
            select('size', 'Section Padding', 'default', [
              { label: 'None', value: 'none' },
              { label: 'Compact', value: 'compact' },
              { label: 'Default', value: 'default' },
              { label: 'Comfortable', value: 'comfortable' },
            ]),
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

- [ ] **Step 5: Add a temporary component export so the schema test imports**

Create `src/blocks/IconCardShowcase/Component.tsx` with:

```tsx
export function IconCardShowcaseBlockComponent() {
  return null
}
```

- [ ] **Step 6: Run the schema test**

Run the focused Vitest command from Step 2.

Expected: the schema test passes.

---

### Task 2: Implement the renderer with responsive and theme behavior

**Files:**

- Modify: `src/blocks/IconCardShowcase/Component.tsx`
- Modify: `tests/int/icon-card-showcase.int.spec.tsx`

**Interfaces:**

- Consumes: `resolveBlockAppearanceClasses`, `resolveMediaOverlay`, `resolveCardSurface`, `getMediaImageProps`, `resolveCmsActions`, `resolveCmsLink`, shared content styles, `SectionEyebrow`, `ContentActions`, and `BlockFooterActions`.
- Produces: `IconCardShowcaseBlockComponent(props)` with stable data attributes for layout and contract tests.

- [ ] **Step 1: Add failing renderer tests**

Append tests covering the exact presentation contract:

```tsx
const cards = [
  { icon: 'Handshake', title: 'Integrity' },
  { icon: 'Scale', title: 'Compassion' },
  { icon: 'Gem', title: 'Excellence' },
]

it('renders the reference defaults on the Appearance fallback', () => {
  const html = renderToStaticMarkup(<IconCardShowcaseBlockComponent cards={cards} />)

  expect(html).toContain('data-icon-card-showcase="true"')
  expect(html).toContain('data-icon-card-showcase-width="standard"')
  expect(html).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')
  expect(html.match(/data-icon-card-showcase-card="true"/g)).toHaveLength(3)
  expect(html.match(/min-h-72/g)).toHaveLength(3)
  expect(html.match(/size-12/g)).toHaveLength(3)
  expect(html.match(/bg-primary text-primary-foreground/g)).toHaveLength(3)
  expect(html).not.toContain('data-icon-card-showcase-image')
})

it.each([
  ['compact', 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'],
  ['standard', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'],
  ['wide', 'grid-cols-1 md:grid-cols-2'],
] as const)('renders %s card width', (cardWidth, classes) => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent cardWidth={cardWidth} cards={cards} />,
  )
  expect(html).toContain(classes)
})

it.each([
  ['compact', 'min-h-52'],
  ['standard', 'min-h-72'],
  ['tall', 'min-h-[22rem]'],
] as const)('renders %s card height', (cardHeight, classes) => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent cardHeight={cardHeight} cards={[cards[0]]} />,
  )
  expect(html).toContain(classes)
})

it.each([
  ['small', 'size-8'],
  ['standard', 'size-12'],
  ['large', 'size-16'],
  ['extraLarge', 'size-20'],
] as const)('renders %s icons', (iconSize, classes) => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent cards={[cards[0]]} iconSize={iconSize} />,
  )
  expect(html).toContain(classes)
})

it('renders a decorative image, overlay, Split header, overrides, and whole-card links', () => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      backgroundImage={{
        alt: 'Campus',
        height: 900,
        id: 'media-1',
        url: '/campus.jpg',
        width: 1600,
      }}
      cards={[
        {
          cardBackground: 'secondary',
          icon: 'Handshake',
          linkType: 'custom',
          openInNewTab: true,
          title: 'Integrity',
          url: '/values/integrity',
        },
      ]}
      description="The principles behind our work."
      headerLayout="split"
      title="Our values"
    />,
  )

  expect(html).toContain('data-icon-card-showcase-image="true"')
  expect(html).toContain('alt=""')
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain('data-icon-card-showcase-header="split"')
  expect(html).toContain('lg:grid-cols-2')
  expect(html).toContain('bg-secondary text-secondary-foreground')
  expect(html).toContain('href="/values/integrity"')
  expect(html).toContain('target="_blank"')
  expect(html).toContain('rel="noreferrer"')
})

it('normalizes stale controls, invalid links, blank cards, and stale icons', () => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cardHeight={'legacy' as never}
      cardWidth={'legacy' as never}
      cards={[
        { icon: 'UnknownIcon', title: 'Fallback icon' },
        { icon: 'Gem', title: '   ' },
        { icon: 'Gem', linkType: 'custom', title: 'No broken link', url: '   ' },
      ]}
      defaultCardBackground={'legacy' as never}
      iconSize={'legacy' as never}
    />,
  )

  expect(html.match(/data-icon-card-showcase-card="true"/g)).toHaveLength(2)
  expect(html).toContain('data-icon-card-showcase-width="standard"')
  expect(html).toContain('data-icon-card-showcase-height="standard"')
  expect(html).toContain('data-icon-card-showcase-icon-size="standard"')
  expect(html).toContain('data-icon-card-showcase-icon="Sparkles"')
  expect(html).not.toContain('href=""')
})

it('renders nothing without usable cards', () => {
  expect(IconCardShowcaseBlockComponent({ cards: [{ icon: 'Gem', title: '   ' }] })).toBeNull()
})
```

- [ ] **Step 2: Run the focused test and verify renderer assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx
```

Expected: schema passes and renderer assertions fail against the temporary null component.

- [ ] **Step 3: Implement the renderer**

Replace the temporary component with a server component that defines these exact normalized types and class maps:

```tsx
type ShowcaseCardBackground = CardSurfaceValue | 'inherit'
type CardWidth = 'compact' | 'standard' | 'wide'
type CardHeight = 'compact' | 'standard' | 'tall'
type IconSize = 'extraLarge' | 'large' | 'small' | 'standard'
type HeaderLayout = 'split' | 'stacked'
type ContentAlignment = 'center' | 'left' | 'right'

type ShowcaseCardValue = Omit<CmsLinkValue, 'linkType'> & {
  cardBackground?: ShowcaseCardBackground | null
  description?: string | null
  icon?: string | null
  id?: string | null
  linkType?: 'custom' | 'none' | 'page' | null
  title?: string | null
}

type IconCardShowcaseBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  backgroundImage?: unknown
  cardHeight?: CardHeight | null
  cards?: ShowcaseCardValue[] | null
  cardWidth?: CardWidth | null
  contentAlignment?: ContentAlignment | null
  defaultCardBackground?: CardSurfaceValue | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: HeaderLayout | null
  iconSize?: IconSize | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  size?: RegularBlockSize | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

type ResolvedShowcaseCard = {
  background: CardSurfaceValue
  description?: string
  href?: string
  icon: LucideIcon
  iconName: string
  id: string
  openInNewTab: boolean
  title: string
}

const widthClasses = {
  compact: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  standard: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  wide: 'grid-cols-1 md:grid-cols-2',
} as const satisfies Record<CardWidth, string>

const heightClasses = {
  compact: 'min-h-52',
  standard: 'min-h-72',
  tall: 'min-h-[22rem]',
} as const satisfies Record<CardHeight, string>

const iconSizeClasses = {
  small: 'size-8',
  standard: 'size-12',
  large: 'size-16',
  extraLarge: 'size-20',
} as const satisfies Record<IconSize, string>

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const satisfies Record<ContentAlignment, string>
```

Use these exact internal component signatures so header/card responsibilities remain isolated:

```tsx
function ShowcaseHeader({
  accentTitle,
  actions,
  alignment,
  description,
  eyebrow,
  eyebrowSurface,
  layout,
  title,
}: {
  accentTitle?: string
  actions: ResolvedCmsAction[]
  alignment: ContentAlignment
  description?: string
  eyebrow?: string
  eyebrowSurface: SectionEyebrowSurface
  layout: HeaderLayout
  title?: string
})

function ShowcaseCard({
  card,
  cardHeight,
  iconSize,
  sectionBackground,
}: {
  card: ResolvedShowcaseCard
  cardHeight: CardHeight
  iconSize: IconSize
  sectionBackground: BlockBackground
})

export function IconCardShowcaseBlockComponent(props: IconCardShowcaseBlockLike): ReactNode
```

Implement normalization with closed sets and the required fallbacks:

```tsx
const cardSurfaceSet = new Set<CardSurfaceValue>(cardSurfaceValues)

const normalizeDefaultCardBackground = (value?: string | null): CardSurfaceValue =>
  cardSurfaceSet.has(value as CardSurfaceValue) ? (value as CardSurfaceValue) : 'primary'

const normalizeCardBackground = (
  value: string | null | undefined,
  fallback: CardSurfaceValue,
): CardSurfaceValue =>
  value === 'inherit'
    ? fallback
    : cardSurfaceSet.has(value as CardSurfaceValue)
      ? (value as CardSurfaceValue)
      : fallback
```

Resolve cards in one `flatMap`: trim title and description, resolve the Lucide component with `Sparkles` fallback, and call `resolveCmsLink` with Page/Custom values. Return `null` before resolving media when no card survives.

Render the section using this structure:

```tsx
<section
  className={cn(
    'relative isolate overflow-hidden',
    regularBlockMobilePaddingClasses[resolvedSize],
    image ? [appearanceClasses.borderClassName, overlay.text.title] : appearanceClasses.className,
  )}
  data-icon-card-showcase="true"
  data-icon-card-showcase-height={resolvedCardHeight}
  data-icon-card-showcase-icon-size={resolvedIconSize}
  data-icon-card-showcase-width={resolvedCardWidth}
>
  {image ? (
    <>
      <Image
        alt=""
        aria-hidden="true"
        className="object-cover"
        data-icon-card-showcase-image="true"
        fill
        sizes="100vw"
        src={image.src}
      />
      <div
        className={cn(
          'pointer-events-none absolute -z-0',
          overlay.frameClassName,
          overlay.className,
        )}
        data-icon-card-showcase-overlay={overlay.strength}
      />
    </>
  ) : null}

  <div className={cn(regularBlockContainerClasses, 'relative z-10 flex flex-col gap-10')}>
    {hasHeader ? (
      <ShowcaseHeader
        accentTitle={resolvedAccentTitle}
        actions={resolvedActions}
        alignment={resolvedAlignment}
        description={resolvedDescription}
        eyebrow={resolvedEyebrow}
        eyebrowSurface={image ? overlay.eyebrowSurface : appearanceClasses.background}
        layout={resolvedHeaderLayout}
        title={resolvedTitle}
      />
    ) : null}
    <div className={cn('grid gap-5 lg:gap-6', widthClasses[resolvedCardWidth])}>
      {resolvedCards.map((card) => (
        <ShowcaseCard
          card={card}
          cardHeight={resolvedCardHeight}
          iconSize={resolvedIconSize}
          key={card.id}
          sectionBackground={appearanceClasses.background}
        />
      ))}
    </div>
    <BlockFooterActions actions={footerActions} alignment={resolvedAlignment} />
  </div>
</section>
```

`ShowcaseHeader` must use `SectionEyebrow`, `contentSectionHeadingClasses`, `contentSectionDescriptionClasses`, `ContentActions`, and `alignmentClasses`. Stacked uses `contentIntroClasses`; Split uses `lg:grid-cols-2 lg:items-end lg:gap-16`, keeping heading/eyebrow in the first column and description/actions in the second.

`ShowcaseCard` must resolve the card surface and render this exact shared inner structure as either an anchor or article:

```tsx
const classes = cn(
  'flex h-full min-w-0 flex-col items-center justify-center gap-5 rounded-[var(--radius)] border px-6 py-8 text-center sm:px-8',
  heightClasses[cardHeight],
  surface.className,
  surface.divider,
  card.href &&
    'motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current',
)

const content = (
  <>
    <Icon
      aria-hidden="true"
      className={cn(iconSizeClasses[iconSize], 'shrink-0', surface.icon)}
      data-icon-card-showcase-icon={iconName}
    />
    <div className="flex min-w-0 flex-col items-center gap-2">
      <h3 className="font-sans text-xl leading-tight font-semibold text-balance text-current sm:text-2xl">
        {title}
      </h3>
      {description ? (
        <p className={cn(contentItemDescriptionClasses, 'max-w-[40ch]', surface.secondary)}>
          {description}
        </p>
      ) : null}
    </div>
  </>
)
```

Use `rel="noreferrer"` only for new-tab links, matching current CMS-link contracts.

- [ ] **Step 4: Run the focused test**

Run the command from Step 2.

Expected: all Icon Card Showcase tests pass except generated-type or pipeline checks reserved for later tasks.

---

### Task 3: Register the block and generate Payload types

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/icon-card-showcase.int.spec.tsx`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Consumes: `IconCardShowcaseBlock` and `IconCardShowcaseBlockComponent` from Tasks 1–2.
- Produces: authoring, public rendering, live-preview rendering, reusable-section availability, and generated `IconCardShowcaseBlock` types.

- [ ] **Step 1: Add failing pipeline and type assertions**

In `tests/int/page-blocks.int.spec.ts`, change the registered page block count from `48` to `49` and add:

```ts
expect(registeredSlugs).toContain('iconCardShowcase')
```

Append this generated-type assertion to `tests/int/icon-card-showcase.int.spec.tsx`:

```tsx
it('uses the generated Payload contract', () => {
  const source = readFileSync('src/payload-types.ts', 'utf8')
  const contract = source.slice(
    source.indexOf('export interface IconCardShowcaseBlock {'),
    source.indexOf('export interface IconGridBlock {'),
  )

  expect(contract).toContain("cardWidth: 'compact' | 'standard' | 'wide'")
  expect(contract).toContain("cardHeight: 'compact' | 'standard' | 'tall'")
  expect(contract).toContain("iconSize: 'small' | 'standard' | 'large' | 'extraLarge'")
  expect(contract).toContain(
    "defaultCardBackground: 'default' | 'primary' | 'secondary' | 'muted' | 'accent'",
  )
})
```

- [ ] **Step 2: Run pipeline and focused tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: FAIL because the block is not registered and no generated interface exists.

- [ ] **Step 3: Add imports, arrays, and renderer cases**

Apply the same exact additions in both collections:

```ts
import { IconCardShowcaseBlock } from '@/blocks/IconCardShowcase/config'
```

Add `IconCardShowcaseBlock` adjacent to `IconGridBlock` in the Pages and Reusable Sections `blocks` arrays.

Apply the same exact component import in both renderers:

```tsx
import { IconCardShowcaseBlockComponent } from './IconCardShowcase/Component'
```

Add this switch case adjacent to Icon Grid:

```tsx
case 'iconCardShowcase':
  return wrap(<IconCardShowcaseBlockComponent {...block} />)
```

For live preview, use:

```tsx
case 'iconCardShowcase':
  return <IconCardShowcaseBlockComponent key={key} {...block} />
```

- [ ] **Step 4: Generate types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `IconCardShowcaseBlock`, includes it in Page and Reusable Section layout unions, and exposes its select type.

- [ ] **Step 5: Run pipeline and focused tests**

Run the command from Step 2, excluding `block-thumbnails.int.spec.ts` until Task 4 adds thumbnail metadata.

Expected: page pipeline and Icon Card Showcase tests pass.

---

### Task 4: Add block-picker thumbnail coverage

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Generate: `public/block-thumbnails/icon-card-showcase.jpg`
- Test: `tests/int/block-thumbnails.int.spec.ts`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Consumes: `IconCardShowcaseBlockComponent`.
- Produces: `iconCardShowcase` thumbnail manifest entry, fixture, and generated JPEG.

- [ ] **Step 1: Add the production-component fixture**

Import the component in `src/block-thumbnails/fixtures.tsx`:

```tsx
import { IconCardShowcaseBlockComponent } from '@/blocks/IconCardShowcase/Component'
```

Add the fixture beside `iconGrid`:

```tsx
iconCardShowcase: (
  <IconCardShowcaseBlockComponent
    appearance={{ background: 'subtle', border: 'topAndBottom' }}
    cardHeight="standard"
    cards={[
      { icon: 'Handshake', title: 'Integrity' },
      { icon: 'Scale', title: 'Compassion' },
      { icon: 'Gem', title: 'Excellence' },
    ]}
    cardWidth="standard"
    defaultCardBackground="primary"
    iconSize="large"
    size="compact"
  />
),
```

- [ ] **Step 2: Generate the JPEG**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/icon-card-showcase.jpg` exists and is non-empty. Existing thumbnail files should remain byte-stable unless the generator intentionally refreshes all fixtures.

- [ ] **Step 3: Run thumbnail contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: both files pass, every registered block has exactly one definition, and every definition has one production fixture and JPEG.

---

### Task 5: Format and verify the complete block

**Files:**

- Verify all files changed in Tasks 1–4.

**Interfaces:**

- Produces: formatted, type-safe, lint-clean, regression-tested block with no staging or commits.

- [ ] **Step 1: Format authored text files**

Run:

```bash
pnpm exec prettier --write src/blocks/IconCardShowcase/config.ts src/blocks/IconCardShowcase/Component.tsx src/collections/Pages.ts src/collections/ReusableSections.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/icon-card-showcase.int.spec.tsx tests/int/page-blocks.int.spec.ts docs/superpowers/specs/2026-08-16-icon-card-showcase-design.md docs/superpowers/plans/2026-08-16-icon-card-showcase.md
```

Expected: Prettier exits successfully. Do not run Prettier on generated `src/payload-types.ts`.

- [ ] **Step 2: Run focused and related integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts tests/int/block-appearance-contract.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all selected tests pass.

- [ ] **Step 3: Run static and design checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconCardShowcase/config.ts src/blocks/IconCardShowcase/Component.tsx src/collections/Pages.ts src/collections/ReusableSections.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/icon-card-showcase.int.spec.tsx tests/int/page-blocks.int.spec.ts
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/IconCardShowcase/Component.tsx
git diff --check
```

Expected: TypeScript and ESLint exit successfully, the detector returns no unexplained findings, and the diff check reports no whitespace errors.

- [ ] **Step 4: Run the full integration suite**

Run:

```bash
pnpm run test:int
```

Expected: all integration tests pass. If MongoMemoryServer receives sandbox `EPERM`, rerun the identical command with approved elevated local-port access.

- [ ] **Step 5: Audit the final working tree without staging**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intended authored/generated files and the thumbnail asset are changed; no file is newly staged by this implementation.
