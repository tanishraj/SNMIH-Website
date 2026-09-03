# Hero Institutional Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable page-level `heroInstitutional` block with a background image, overlay presets, configurable content alignment, optional eyebrow and description, and up to two CTA buttons.

**Architecture:** Extend the existing page-block pipeline by registering a new Payload block in `Pages`, rendering it through `renderPageBlocks`, and keeping the rendering logic inside a focused block component that reuses existing media and CMS link helpers. Use semantic token-driven overlay classes and existing shadcn `Button` primitives so the block remains theme-aware without global CSS changes.

**Tech Stack:** Payload CMS blocks, Next.js App Router, React server rendering, TypeScript, Tailwind CSS v4, shadcn/ui Button, Vitest.

## Global Constraints

- Height model: balanced hero (`min-h-[60dvh]`)
- Buttons: up to 2
- Overlay control: preset styles, not freeform color
- Content alignment: configurable horizontal and vertical placement
- Visual tone: editorial institutional, image-led, restrained, trust-first
- Reuse the same page/custom URL field pattern already used by `HeaderNavbar12` so navigation behavior stays consistent across blocks.
- No freeform overlay color picker and no opacity slider in v1.
- Use `min-h-[60dvh]`
- Avoid `h-screen`
- Background image is decorative unless a meaningful media alt strategy already exists in project conventions
- Follow the existing block folder pattern used by `Announcement` and `HeaderNavbar12`
- Reuse the existing Payload link-field pattern rather than introducing a second navigation schema
- Keep styling local to the block component unless a shared primitive is clearly justified
- Use semantic theme tokens instead of hand-authored light/dark classes where possible

---

## File Map

- Create: `src/blocks/HeroInstitutional/config.ts`
  - Define the Payload block schema, admin thumbnail, overlay/alignment selects, and CTA array fields.
- Create: `src/blocks/HeroInstitutional/Component.tsx`
  - Render the balanced-height hero with image, overlay, content alignment, and CTA buttons.
- Create: `src/blocks/HeroInstitutional/thumbnail.ts`
  - Export the block picker thumbnail data URL / asset string using the same local pattern as other blocks.
- Create: `tests/int/hero-institutional-render.int.spec.ts`
  - Cover component rendering, overlay preset mapping, CTA behavior, and content alignment behavior.
- Modify: `src/collections/Pages.ts`
  - Add `HeroInstitutionalBlock` to the `layout` block list in the Content tab.
- Modify: `src/blocks/renderPageBlocks.tsx`
  - Import the new block component and render it in the page block switch.
- Modify: `tests/int/page-blocks.int.spec.ts`
  - Extend schema assertions so the Pages layout block list and block config checks include `heroInstitutional`.

## Interfaces

- Existing helper consumed: `resolveCmsLink(value: CmsLinkValue): { href?: string; openInNewTab?: boolean }` from `src/lib/cmsLinks.ts`
- Existing helper consumed: `getMediaImageProps({ media, preset, fallbackAlt }): { alt: string; src: string } | undefined` from `src/lib/media.ts`
- Existing UI consumed: `Button` from `@/components/ui/button`
- New block slug produced: `heroInstitutional`
- New render component produced: `HeroInstitutionalBlockComponent(props: HeroInstitutionalBlockLike): React.ReactNode`

### Task 1: Register the Payload block schema

**Files:**

- Create: `src/blocks/HeroInstitutional/config.ts`
- Create: `src/blocks/HeroInstitutional/thumbnail.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `Block`, `ArrayField`, `CheckboxField`, `Field`, `RadioField`, `SelectField` from `payload`
- Consumes: block thumbnail pattern from `src/blocks/Announcement/config.ts` and `src/blocks/HeaderNavbar12/config.ts`
- Produces: `export const HeroInstitutionalBlock: Block`

- [ ] **Step 1: Write the failing schema test**

```ts
it('registers heroInstitutional alongside announcement in the Pages layout field', () => {
  const layoutField = getLayoutField()

  expect(layoutField?.type).toBe('blocks')
  expect(layoutField?.blocks?.map((block) => block.slug)).toEqual([
    'announcement',
    'heroInstitutional',
  ])
})

it('defines the heroInstitutional schema with image, overlay, alignment, and CTA fields', async () => {
  const { HeroInstitutionalBlock } = await import('@/blocks/HeroInstitutional/config')

  const backgroundImageField = HeroInstitutionalBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'backgroundImage',
  ) as { relationTo?: string; required?: boolean; type?: string } | undefined

  const titleField = HeroInstitutionalBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'title',
  ) as { required?: boolean; type?: string } | undefined

  const overlayStyleField = HeroInstitutionalBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'overlayStyle',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const horizontalAlignmentField = HeroInstitutionalBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'horizontalAlignment',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const verticalAlignmentField = HeroInstitutionalBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'verticalAlignment',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const buttonsField = HeroInstitutionalBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'buttons',
  ) as { maxRows?: number; type?: string } | undefined

  expect(backgroundImageField?.type).toBe('upload')
  expect(backgroundImageField?.relationTo).toBe('media')
  expect(backgroundImageField?.required).toBe(true)
  expect(titleField?.type).toBe('text')
  expect(titleField?.required).toBe(true)
  expect(overlayStyleField?.type).toBe('select')
  expect(overlayStyleField?.defaultValue).toBe('ink')
  expect(overlayStyleField?.options?.map((option) => option.value)).toEqual([
    'ink',
    'brand',
    'soft',
  ])
  expect(horizontalAlignmentField?.options?.map((option) => option.value)).toEqual([
    'left',
    'center',
    'right',
  ])
  expect(verticalAlignmentField?.options?.map((option) => option.value)).toEqual([
    'top',
    'center',
    'bottom',
  ])
  expect(buttonsField?.type).toBe('array')
  expect(buttonsField?.maxRows).toBe(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: FAIL with missing `@/blocks/HeroInstitutional/config` import and/or layout block list mismatch.

- [ ] **Step 3: Write the block schema and register it on Pages**

```ts
// src/blocks/HeroInstitutional/config.ts
import type { ArrayField, Block, CheckboxField, Field, RadioField, SelectField } from 'payload'

import { heroInstitutionalThumbnail } from './thumbnail'

type LinkType = 'page' | 'custom'

const pageCondition = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'page'

const customUrlCondition = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'custom'

const createLinkFields = (): Field[] => [
  {
    name: 'label',
    type: 'text',
    required: true,
  },
  {
    name: 'linkType',
    type: 'radio',
    defaultValue: 'page',
    options: [
      { label: 'Page', value: 'page' },
      { label: 'Custom URL', value: 'custom' },
    ],
    admin: {
      layout: 'horizontal',
    },
  } satisfies RadioField,
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      condition: pageCondition,
    },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: {
      condition: customUrlCondition,
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

export const HeroInstitutionalBlock: Block = {
  slug: 'heroInstitutional',
  interfaceName: 'HeroInstitutionalBlock',
  admin: {
    images: {
      thumbnail: {
        alt: 'Hero institutional block preview',
        url: heroInstitutionalThumbnail,
      },
    },
  },
  labels: {
    singular: 'Hero Institutional',
    plural: 'Hero Institutional',
  },
  fields: [
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'eyebrow',
      type: 'text',
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
    {
      name: 'overlayStyle',
      type: 'select',
      defaultValue: 'ink',
      options: [
        { label: 'Ink', value: 'ink' },
        { label: 'Brand', value: 'brand' },
        { label: 'Soft', value: 'soft' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'horizontalAlignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'verticalAlignment',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'contentWidth',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Default', value: 'default' },
        { label: 'Wide', value: 'wide' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'height',
      type: 'select',
      defaultValue: 'balanced',
      options: [{ label: 'Balanced', value: 'balanced' }],
      required: true,
    } satisfies SelectField,
    {
      name: 'buttons',
      type: 'array',
      maxRows: 2,
      fields: [
        ...createLinkFields(),
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Outline', value: 'outline' },
            { label: 'Link', value: 'link' },
          ],
        } satisfies SelectField,
      ],
    } satisfies ArrayField,
  ],
}
```

```ts
// src/collections/Pages.ts
import { HeroInstitutionalBlock } from '@/blocks/HeroInstitutional/config'

// ...
blocks: [AnnouncementBlock, HeroInstitutionalBlock],
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: PASS with updated layout block list and hero schema assertions.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/HeroInstitutional/config.ts src/blocks/HeroInstitutional/thumbnail.ts src/collections/Pages.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: add hero institutional block schema"
```

### Task 2: Implement hero rendering and interaction behavior

**Files:**

- Create: `src/blocks/HeroInstitutional/Component.tsx`
- Create: `tests/int/hero-institutional-render.int.spec.ts`
- Test: `tests/int/hero-institutional-render.int.spec.ts`

**Interfaces:**

- Consumes: `resolveCmsLink` from `src/lib/cmsLinks.ts`
- Consumes: `getMediaImageProps` from `src/lib/media.ts`
- Consumes: `buttonVariants` or `Button` from `src/components/ui/button.tsx`
- Produces: `HeroInstitutionalBlockComponent(props: HeroInstitutionalBlockLike)`

- [ ] **Step 1: Write the failing render tests**

```ts
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { HeroInstitutionalBlockComponent } from '@/blocks/HeroInstitutional/Component'

describe('hero institutional block', () => {
  it('renders image, eyebrow, title, description, and two CTA buttons', () => {
    const html = renderToStaticMarkup(
      <HeroInstitutionalBlockComponent
        backgroundImage={{ alt: 'Campus facade', url: '/media/campus.jpg' } as never}
        buttons={[
          { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
          { label: 'Explore programs', linkType: 'custom', url: '/programs', variant: 'outline' },
        ] as never}
        description="Train across four rigorous years of science, practice, and reflection."
        eyebrow="Est. 1912 · Cambridge Heights"
        horizontalAlignment="left"
        overlayStyle="ink"
        title="Medicine, practiced with rigor and mercy."
        verticalAlignment="center"
      />,
    )

    expect(html).toContain('Campus facade')
    expect(html).toContain('Est. 1912 · Cambridge Heights')
    expect(html).toContain('Medicine, practiced with rigor and mercy.')
    expect(html).toContain('Train across four rigorous years of science, practice, and reflection.')
    expect(html).toContain('href="/apply"')
    expect(html).toContain('href="/programs"')
  })

  it('maps overlay and alignment presets into deterministic class hooks', () => {
    const html = renderToStaticMarkup(
      <HeroInstitutionalBlockComponent
        backgroundImage={{ alt: 'Library exterior', url: '/media/library.jpg' } as never}
        horizontalAlignment="right"
        overlayStyle="brand"
        title="A precise place to begin."
        verticalAlignment="bottom"
      />,
    )

    expect(html).toContain('data-hero-overlay="brand"')
    expect(html).toContain('data-hero-horizontal="right"')
    expect(html).toContain('data-hero-vertical="bottom"')
  })

  it('collapses optional content cleanly when eyebrow, description, and buttons are omitted', () => {
    const html = renderToStaticMarkup(
      <HeroInstitutionalBlockComponent
        backgroundImage={{ alt: 'Clinic hall', url: '/media/clinic.jpg' } as never}
        title="Built for decisive practice."
      />,
    )

    expect(html).toContain('Built for decisive practice.')
    expect(html).not.toContain('data-hero-eyebrow')
    expect(html).not.toContain('data-hero-description')
    expect(html).not.toContain('data-hero-actions')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/hero-institutional-render.int.spec.ts
```

Expected: FAIL with missing `@/blocks/HeroInstitutional/Component`.

- [ ] **Step 3: Write the minimal hero component**

```tsx
import { Button } from '@/components/ui/button'
import { resolveCmsLink } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'

type HeroButton = {
  label?: string | null
  linkType?: 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: unknown
  url?: string | null
  variant?: 'default' | 'outline' | 'link' | null
}

type HeroInstitutionalBlockLike = {
  backgroundImage?: unknown
  buttons?: HeroButton[] | null
  contentWidth?: 'narrow' | 'default' | 'wide' | null
  description?: string | null
  eyebrow?: string | null
  horizontalAlignment?: 'left' | 'center' | 'right' | null
  overlayStyle?: 'ink' | 'brand' | 'soft' | null
  title: string
  verticalAlignment?: 'top' | 'center' | 'bottom' | null
}

const overlayClasses = {
  ink: 'bg-linear-to-b from-background/75 via-background/55 to-background/75',
  brand: 'bg-linear-to-b from-primary/70 via-primary/45 to-primary/70',
  soft: 'bg-linear-to-b from-background/55 via-background/35 to-background/55',
} as const

const horizontalShellClasses = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
} as const

const verticalShellClasses = {
  top: 'items-start py-16 md:py-20',
  center: 'items-center py-16 md:py-20',
  bottom: 'items-end py-16 md:py-20',
} as const

const contentWidthClasses = {
  narrow: 'max-w-2xl',
  default: 'max-w-3xl',
  wide: 'max-w-4xl',
} as const

export function HeroInstitutionalBlockComponent({
  backgroundImage,
  buttons,
  contentWidth = 'default',
  description,
  eyebrow,
  horizontalAlignment = 'left',
  overlayStyle = 'ink',
  title,
  verticalAlignment = 'center',
}: HeroInstitutionalBlockLike) {
  const image = getMediaImageProps({
    media: backgroundImage as never,
    preset: 'hero',
    fallbackAlt: title,
  })

  if (!image) {
    return null
  }

  const actions = (buttons ?? []).flatMap((button) => {
    const label = button.label?.trim()
    const link = resolveCmsLink(button)

    return label && link.href
      ? [
          {
            href: link.href,
            label,
            openInNewTab: link.openInNewTab,
            variant: button.variant ?? 'default',
          },
        ]
      : []
  })

  return (
    <section
      className="relative isolate overflow-hidden border-b border-border"
      data-hero-block="true"
    >
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={image.alt} className="size-full object-cover" src={image.src} />
      </div>
      <div
        className={cn('absolute inset-0', overlayClasses[overlayStyle])}
        data-hero-overlay={overlayStyle}
      />
      <div className="relative mx-auto flex min-h-[60dvh] max-w-screen-2xl px-4">
        <div
          className={cn(
            'flex w-full',
            horizontalShellClasses[horizontalAlignment],
            verticalShellClasses[verticalAlignment],
          )}
          data-hero-horizontal={horizontalAlignment}
          data-hero-vertical={verticalAlignment}
        >
          <div className={cn('flex w-full flex-col gap-6', contentWidthClasses[contentWidth])}>
            {eyebrow ? (
              <p
                className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-primary-foreground/80"
                data-hero-eyebrow="true"
              >
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-[16ch] text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
              {title}
            </h1>
            {description ? (
              <p
                className="max-w-[65ch] text-base leading-7 text-primary-foreground/85"
                data-hero-description="true"
              >
                {description}
              </p>
            ) : null}
            {actions.length > 0 ? (
              <div className="flex flex-col gap-3 sm:flex-row" data-hero-actions="true">
                {actions.map((action) => (
                  <Button asChild key={`${action.label}-${action.href}`} variant={action.variant}>
                    <a
                      href={action.href}
                      rel={action.openInNewTab ? 'noreferrer' : undefined}
                      target={action.openInNewTab ? '_blank' : undefined}
                    >
                      {action.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/hero-institutional-render.int.spec.ts
```

Expected: PASS with all three hero rendering tests green.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/HeroInstitutional/Component.tsx tests/int/hero-institutional-render.int.spec.ts
git commit -m "feat: add hero institutional renderer"
```

### Task 3: Wire the page renderer and verify end-to-end page-block output

**Files:**

- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/hero-institutional-render.int.spec.ts`

**Interfaces:**

- Consumes: `HeroInstitutionalBlockComponent` from `src/blocks/HeroInstitutional/Component.tsx`
- Produces: page block switch support for `blockType === 'heroInstitutional'`

- [ ] **Step 1: Extend the failing page block pipeline test**

```ts
it('renders a heroInstitutional page block through PageContent', () => {
  const result = PageContent({
    page: {
      id: 'page-hero-1',
      layout: [
        {
          blockType: 'heroInstitutional',
          backgroundImage: {
            alt: 'Main hall',
            url: '/media/main-hall.jpg',
          },
          buttons: [{ label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' }],
          description: 'Train for the work that follows.',
          eyebrow: 'Admissions',
          horizontalAlignment: 'left',
          overlayStyle: 'ink',
          title: 'Practice begins before the clinic.',
          verticalAlignment: 'center',
        },
      ],
      slug: 'admissions',
      title: 'Admissions',
    } as never,
  })

  const html = renderToStaticMarkup(result)

  expect(html).toContain('Practice begins before the clinic.')
  expect(html).toContain('Admissions')
  expect(html).toContain('href="/apply"')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: FAIL because `renderPageBlocks` does not yet handle `heroInstitutional`.

- [ ] **Step 3: Wire the renderer**

```tsx
// src/blocks/renderPageBlocks.tsx
import { AnnouncementBlockComponent } from './Announcement/Component'
import { HeroInstitutionalBlockComponent } from './HeroInstitutional/Component'

export function renderPageBlocks(blocks?: PageBlock[] | null) {
  if (!blocks?.length) {
    return null
  }

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case 'announcement':
            return (
              <AnnouncementBlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                {...block}
              />
            )
          case 'heroInstitutional':
            return (
              <HeroInstitutionalBlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                {...block}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
```

- [ ] **Step 4: Run the page block and hero test suite**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/hero-institutional-render.int.spec.ts
./node_modules/.bin/tsc --noEmit
```

Expected:

- Vitest: PASS
- TypeScript: PASS

- [ ] **Step 5: Commit**

```bash
git add src/blocks/renderPageBlocks.tsx tests/int/page-blocks.int.spec.ts
git commit -m "feat: wire hero institutional page block"
```

### Task 4: Polish admin thumbnail and final verification

**Files:**

- Modify: `src/blocks/HeroInstitutional/thumbnail.ts`
- Test: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/hero-institutional-render.int.spec.ts`

**Interfaces:**

- Consumes: existing inline thumbnail pattern from `src/blocks/Announcement/thumbnail.ts`
- Produces: `export const heroInstitutionalThumbnail: string`

- [ ] **Step 1: Write the thumbnail export if it was stubbed during schema work**

```ts
export const heroInstitutionalThumbnail =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200' fill='none'><rect width='320' height='200' rx='18' fill='%23111827'/><rect x='18' y='22' width='284' height='156' rx='14' fill='%231e293b'/><rect x='18' y='22' width='284' height='156' rx='14' fill='url(%23heroOverlay)' opacity='0.72'/><path d='M18 122L86 78L136 106L202 56L302 22V178H18V122Z' fill='%23334155'/><rect x='42' y='52' width='84' height='8' rx='4' fill='%23e5e7eb' opacity='0.72'/><rect x='42' y='74' width='160' height='20' rx='6' fill='%23ffffff' opacity='0.96'/><rect x='42' y='100' width='138' height='20' rx='6' fill='%23ffffff' opacity='0.96'/><rect x='42' y='132' width='118' height='8' rx='4' fill='%23e5e7eb' opacity='0.78'/><rect x='42' y='152' width='72' height='14' rx='7' fill='%23ffffff'/><defs><linearGradient id='heroOverlay' x1='160' y1='22' x2='160' y2='178' gradientUnits='userSpaceOnUse'><stop stop-color='%230f172a'/><stop offset='1' stop-color='%231e3a8a'/></linearGradient></defs></svg>"
```

- [ ] **Step 2: Run final focused verification**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/hero-institutional-render.int.spec.ts
./node_modules/.bin/tsc --noEmit
```

Expected:

- Vitest: PASS
- TypeScript: PASS

- [ ] **Step 3: Commit**

```bash
git add src/blocks/HeroInstitutional/thumbnail.ts
git commit -m "chore: add hero institutional thumbnail"
```

## Self-Review

### Spec coverage

- Background image: covered in Task 1 schema and Task 2 render tests
- Overlay presets (`ink`, `brand`, `soft`): covered in Task 1 schema and Task 2 class mapping test
- Horizontal and vertical alignment: covered in Task 1 schema and Task 2/3 render assertions
- Optional eyebrow and description: covered in Task 2 collapse test
- Up to 2 CTA buttons: covered in Task 1 schema and Task 2 render test
- Page-level registration and rendering: covered in Tasks 1 and 3
- Thumbnail/admin picker support: covered in Tasks 1 and 4

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain
- Each task has exact file paths, commands, and code snippets

### Type consistency

- Block slug is consistently `heroInstitutional`
- Component name is consistently `HeroInstitutionalBlockComponent`
- Overlay preset names are consistently `ink`, `brand`, `soft`
- Alignment values are consistently `left`, `center`, `right` and `top`, `center`, `bottom`
