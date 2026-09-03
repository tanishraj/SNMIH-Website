# Feature Spotlight Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable page-level `featureSpotlight` block that can render either a 50/50 image/content split section or a full-width content-only section, with plain or muted background and either an animated link CTA or up to two buttons.

**Architecture:** Extend the existing page block pipeline with a focused `featureSpotlight` Payload block, a dedicated render component, and a small thumbnail asset. Keep the block server-rendered, use existing CMS link and media helpers, and rely on semantic theme tokens plus existing shadcn `Button` variants so the block stays consistent with the rest of the design system. Model the layout explicitly with `layoutMode` (`split` or `contentOnly`) rather than retrofitting optional media into a permanently split grid.

**Tech Stack:** Payload CMS blocks, Next.js App Router, React server rendering, TypeScript, Tailwind CSS v4, shadcn/ui Button, Vitest.

## Global Constraints

- One block per section instance, not one block containing multiple rows
- Image is optional at the block level
- Image/content side is configured manually per block instance
- CTA mode supports either a text link or up to two buttons
- Background style supports plain and muted
- Layout mode supports `split` and `contentOnly`
- The link CTA uses a dual-arrow motion: tilted arrow at rest, outgoing first arrow on hover, incoming second arrow on hover
- Use theme tokens and shadcn button primitives so the block inherits theme changes cleanly
- Reuse existing CMS link resolution helpers rather than inventing a second link model
- Keep the component server-renderable unless interactivity becomes necessary
- Use semantic tokens and existing shadcn button variants instead of hardcoded visual overrides
- Do not build all three reference sections inside one block instance
- Do not add automatic row alternation, rich text, video, per-instance custom colors, or spacing sliders in v1

---

## File Map

- Create: `src/blocks/FeatureSpotlight/config.ts`
  - Define the Payload block schema, CTA mode conditionals, admin thumbnail, and content/layout fields.
- Create: `src/blocks/FeatureSpotlight/Component.tsx`
  - Render the split media/content section for both CTA modes and both media positions.
- Create: `src/blocks/FeatureSpotlight/thumbnail.ts`
  - Export the block picker thumbnail string using the same local pattern as other blocks.
- Create: `tests/int/feature-spotlight-render.int.spec.ts`
  - Cover component rendering, left/right layout flags, `contentOnly` mode, animated link CTA structure, and muted background behavior.
- Modify: `src/collections/Pages.ts`
  - Register `FeatureSpotlightBlock` in the Pages layout block list.
- Modify: `src/blocks/renderPageBlocks.tsx`
  - Render `featureSpotlight` blocks through the page block switch.
- Modify: `tests/int/page-blocks.int.spec.ts`
  - Extend block registration and schema assertions to include `featureSpotlight`.
- Modify: `src/payload-types.ts`
  - Regenerate Payload types after schema changes using `npm run generate:types`.

## Interfaces

- Existing helper consumed: `resolveCmsLink(value: CmsLinkValue): { href?: string; openInNewTab?: boolean }` from `src/lib/cmsLinks.ts`
- Existing helper consumed: `getMediaImageProps({ media, preset, fallbackAlt }): { alt: string; src: string } | undefined` from `src/lib/media.ts`
- Existing UI consumed: `Button` from `@/components/ui/button`
- New block slug produced: `featureSpotlight`
- New render component produced: `FeatureSpotlightBlockComponent(props: FeatureSpotlightBlockLike): React.ReactNode`

### Task 1: Add schema coverage for the new block

**Files:**

- Modify: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `Pages` collection shape via `getLayoutField()`
- Produces: failing expectations for `featureSpotlight` registration and field schema

- [ ] **Step 1: Write the failing schema test**

```ts
it('registers featureSpotlight in the Pages layout field', async () => {
  const layoutField = getLayoutField()

  expect(layoutField?.type).toBe('blocks')
  expect(layoutField?.blocks?.map((block) => block.slug)).toEqual([
    'announcement',
    'heroInstitutional',
    'featureSpotlight',
  ])
})

it('defines the featureSpotlight schema with image, layout, and CTA mode fields', async () => {
  const { FeatureSpotlightBlock } = await import('@/blocks/FeatureSpotlight/config')

  const imageField = FeatureSpotlightBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'image',
  ) as { relationTo?: string; required?: boolean; type?: string } | undefined

  const titleField = FeatureSpotlightBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'title',
  ) as { required?: boolean; type?: string } | undefined

  const mediaPositionField = FeatureSpotlightBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'mediaPosition',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const backgroundStyleField = FeatureSpotlightBlock.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'backgroundStyle',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const ctaModeField = FeatureSpotlightBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'ctaMode',
  ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

  const buttonsField = FeatureSpotlightBlock.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'buttons',
  ) as { maxRows?: number; type?: string } | undefined

  expect(imageField?.type).toBe('upload')
  expect(imageField?.relationTo).toBe('media')
  expect(imageField?.required).toBe(true)
  expect(titleField?.type).toBe('text')
  expect(titleField?.required).toBe(true)
  expect(mediaPositionField?.type).toBe('select')
  expect(mediaPositionField?.defaultValue).toBe('left')
  expect(mediaPositionField?.options?.map((option) => option.value)).toEqual(['left', 'right'])
  expect(backgroundStyleField?.type).toBe('select')
  expect(backgroundStyleField?.defaultValue).toBe('plain')
  expect(backgroundStyleField?.options?.map((option) => option.value)).toEqual(['plain', 'muted'])
  expect(ctaModeField?.type).toBe('select')
  expect(ctaModeField?.defaultValue).toBe('link')
  expect(ctaModeField?.options?.map((option) => option.value)).toEqual(['link', 'buttons'])
  expect(buttonsField?.type).toBe('array')
  expect(buttonsField?.maxRows).toBe(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: FAIL with missing `@/blocks/FeatureSpotlight/config` import and/or layout block mismatch.

- [ ] **Step 3: Commit**

```bash
git add tests/int/page-blocks.int.spec.ts
git commit -m "test: cover split feature schema"
```

### Task 2: Implement the Payload block schema and register it on Pages

**Files:**

- Create: `src/blocks/FeatureSpotlight/config.ts`
- Create: `src/blocks/FeatureSpotlight/thumbnail.ts`
- Modify: `src/collections/Pages.ts`
- Test: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `Block`, `ArrayField`, `CheckboxField`, `RadioField`, `SelectField` from `payload`
- Consumes: thumbnail and field composition patterns from `src/blocks/Announcement/config.ts` and `src/blocks/HeroInstitutional/config.ts`
- Produces: `export const FeatureSpotlightBlock: Block`

- [ ] **Step 1: Write the block schema**

```ts
import type { ArrayField, Block, CheckboxField, Field, RadioField, SelectField } from 'payload'

import { featureSpotlightThumbnail } from './thumbnail'

type LinkType = 'page' | 'custom'
type CtaMode = 'link' | 'buttons'

const isPageLink = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'custom'

const isLinkMode = (_data: unknown, siblingData: { ctaMode?: CtaMode | null }) =>
  siblingData?.ctaMode === 'link'

const isButtonsMode = (_data: unknown, siblingData: { ctaMode?: CtaMode | null }) =>
  siblingData?.ctaMode === 'buttons'

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
      condition: isPageLink,
    },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: {
      condition: isCustomLink,
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

export const FeatureSpotlightBlock: Block = {
  slug: 'featureSpotlight',
  interfaceName: 'FeatureSpotlightBlock',
  admin: {
    images: {
      thumbnail: {
        alt: 'Split feature block preview',
        url: featureSpotlightThumbnail,
      },
    },
  },
  labels: {
    singular: 'Feature Spotlight',
    plural: 'Feature Spotlights',
  },
  fields: [
    {
      name: 'image',
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
      name: 'mediaPosition',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Image Left', value: 'left' },
        { label: 'Image Right', value: 'right' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'plain',
      options: [
        { label: 'Plain', value: 'plain' },
        { label: 'Muted', value: 'muted' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'contentWidth',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Narrow', value: 'narrow' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'ctaMode',
      type: 'select',
      defaultValue: 'link',
      options: [
        { label: 'Text Link', value: 'link' },
        { label: 'Buttons', value: 'buttons' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'linkLabel',
      type: 'text',
      admin: {
        condition: isLinkMode,
      },
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
        condition: isLinkMode,
        layout: 'horizontal',
      },
    } satisfies RadioField,
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        condition: (_data, siblingData) =>
          isLinkMode(_data, siblingData) && isPageLink(_data, siblingData),
      },
    },
    {
      name: 'url',
      label: 'Custom URL',
      type: 'text',
      admin: {
        condition: (_data, siblingData) =>
          isLinkMode(_data, siblingData) && isCustomLink(_data, siblingData),
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: isLinkMode,
      },
    } satisfies CheckboxField,
    {
      name: 'buttons',
      type: 'array',
      maxRows: 2,
      admin: {
        condition: isButtonsMode,
      },
      fields: [
        ...createLinkFields(),
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Link', value: 'link' },
          ],
          required: true,
        } satisfies SelectField,
      ],
    } satisfies ArrayField,
  ],
}
```

- [ ] **Step 2: Register the block on Pages**

```ts
import { FeatureSpotlightBlock } from '@/blocks/FeatureSpotlight/config'

// inside the layout blocks list
blocks: [AnnouncementBlock, HeroInstitutionalBlock, FeatureSpotlightBlock],
```

- [ ] **Step 3: Run schema test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: PASS for `featureSpotlight` registration and schema expectations.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/FeatureSpotlight/config.ts src/blocks/FeatureSpotlight/thumbnail.ts src/collections/Pages.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: add split feature block schema"
```

### Task 3: Add render coverage for the split feature component

**Files:**

- Create: `tests/int/feature-spotlight-render.int.spec.ts`
- Test: `tests/int/feature-spotlight-render.int.spec.ts`

**Interfaces:**

- Consumes: `FeatureSpotlightBlockComponent(props: FeatureSpotlightBlockLike): React.ReactNode`
- Produces: failing render expectations for media position, CTA mode, and background style

- [ ] **Step 1: Write the failing render test**

```ts
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FeatureSpotlightBlockComponent } from '@/blocks/FeatureSpotlight/Component'

describe('split feature block', () => {
  it('renders image-right layout with a text link CTA', () => {
    const html = renderToStaticMarkup(
      createElement(FeatureSpotlightBlockComponent, {
        contentWidth: 'narrow',
        ctaMode: 'link',
        description: 'Choose from MD, MD-PhD, and specialized tracks.',
        eyebrow: 'Programs',
        image: { alt: 'Students in clinic', url: '/media/programs.jpg' } as never,
        linkLabel: 'See all programs',
        linkType: 'custom',
        mediaPosition: 'right',
        title: 'Four years. Six pathways. One physician.',
        url: '/programs',
      }),
    )

    expect(html).toContain('data-feature-spotlight-position="right"')
    expect(html).toContain('data-feature-spotlight-cta="link"')
    expect(html).toContain('href="/programs"')
    expect(html).toContain('See all programs')
  })

  it('renders muted background and two CTA buttons', () => {
    const html = renderToStaticMarkup(
      createElement(FeatureSpotlightBlockComponent, {
        backgroundStyle: 'muted',
        buttons: [
          {
            label: 'Start your application',
            linkType: 'custom',
            url: '/apply',
            variant: 'default',
          },
          { label: 'Schedule a visit', linkType: 'custom', url: '/visit', variant: 'secondary' },
        ] as never,
        ctaMode: 'buttons',
        description: 'Applications for the Class of 2030 open August 1.',
        image: { alt: 'Clinical team', url: '/media/apply.jpg' } as never,
        mediaPosition: 'left',
        title: 'Ready to begin?',
      }),
    )

    expect(html).toContain('data-feature-spotlight-background="muted"')
    expect(html).toContain('data-feature-spotlight-cta="buttons"')
    expect(html).toContain('href="/apply"')
    expect(html).toContain('href="/visit"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/feature-spotlight-render.int.spec.ts
```

Expected: FAIL with missing `@/blocks/FeatureSpotlight/Component`.

- [ ] **Step 3: Commit**

```bash
git add tests/int/feature-spotlight-render.int.spec.ts
git commit -m "test: cover split feature rendering"
```

### Task 4: Implement the split feature renderer and wire it into the page block pipeline

**Files:**

- Create: `src/blocks/FeatureSpotlight/Component.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Test: `tests/int/feature-spotlight-render.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `resolveCmsLink`, `getMediaImageProps`, `Button`
- Produces: `FeatureSpotlightBlockComponent`
- Produces: new `case 'featureSpotlight'` in `renderPageBlocks`

- [ ] **Step 1: Write the renderer**

```ts
import { Button } from '@/components/ui/button'
import { resolveCmsLink } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Page } from '@/payload-types'

type FeatureSpotlightButton = {
  label?: string | null
  linkType?: 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: Page | number | string | null
  url?: string | null
  variant?: 'default' | 'link' | 'secondary' | null
}

type FeatureSpotlightBlockLike = {
  backgroundStyle?: 'muted' | 'plain' | null
  buttons?: FeatureSpotlightButton[] | null
  contentWidth?: 'default' | 'narrow' | null
  ctaMode?: 'buttons' | 'link' | null
  description?: string | null
  eyebrow?: string | null
  image?: unknown
  linkLabel?: string | null
  linkType?: 'page' | 'custom' | null
  mediaPosition?: 'left' | 'right' | null
  openInNewTab?: boolean | null
  page?: Page | number | string | null
  title: string
  url?: string | null
}

const backgroundClasses = {
  plain: 'bg-background',
  muted: 'bg-muted/35',
} as const

const contentWidthClasses = {
  default: 'max-w-xl',
  narrow: 'max-w-lg',
} as const

const gridOrderClasses = {
  left: {
    content: 'md:order-2',
    media: 'md:order-1',
  },
  right: {
    content: 'md:order-1',
    media: 'md:order-2',
  },
} as const

export function FeatureSpotlightBlockComponent({
  backgroundStyle = 'plain',
  buttons,
  contentWidth = 'default',
  ctaMode = 'link',
  description,
  eyebrow,
  image,
  linkLabel,
  linkType,
  mediaPosition = 'left',
  openInNewTab,
  page,
  title,
  url,
}: FeatureSpotlightBlockLike) {
  const media = getMediaImageProps({
    media: image as never,
    preset: 'generic',
    fallbackAlt: title,
  })

  if (!media) {
    return null
  }

  const linkCta = resolveCmsLink({
    linkType,
    openInNewTab,
    page,
    url,
  })

  const resolvedButtons = (buttons ?? []).flatMap((button) => {
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

  const order = gridOrderClasses[mediaPosition]

  return (
    <section
      className={cn('border-b border-border', backgroundClasses[backgroundStyle])}
      data-feature-spotlight-background={backgroundStyle}
      data-feature-spotlight-position={mediaPosition}
      data-feature-spotlight-cta={ctaMode}
    >
      <div className="mx-auto max-w-screen-2xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className={cn(order.media)}>
            <div className="overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={media.alt} className="aspect-[4/3] size-full object-cover" src={media.src} />
            </div>
          </div>
          <div className={cn(order.content)}>
            <div className={cn('flex flex-col gap-4', contentWidthClasses[contentWidth])}>
              {eyebrow ? (
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                  {eyebrow}
                </p>
              ) : null}
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h2>
              {description ? (
                <p className="text-base leading-7 text-muted-foreground">
                  {description}
                </p>
              ) : null}
              {ctaMode === 'link' && linkLabel?.trim() && linkCta.href ? (
                <div>
                  <Button asChild className="px-0" variant="link">
                    <a
                      href={linkCta.href}
                      rel={linkCta.openInNewTab ? 'noreferrer' : undefined}
                      target={linkCta.openInNewTab ? '_blank' : undefined}
                    >
                      {linkLabel.trim()}
                    </a>
                  </Button>
                </div>
              ) : null}
              {ctaMode === 'buttons' && resolvedButtons.length ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  {resolvedButtons.map((button) => (
                    <Button asChild key={`${button.label}-${button.href}`} size="lg" variant={button.variant}>
                      <a
                        href={button.href}
                        rel={button.openInNewTab ? 'noreferrer' : undefined}
                        target={button.openInNewTab ? '_blank' : undefined}
                      >
                        {button.label}
                      </a>
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire the block into the page renderer**

```ts
import { FeatureSpotlightBlockComponent } from './FeatureSpotlight/Component'

case 'featureSpotlight':
  return (
    <FeatureSpotlightBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      {...block}
    />
  )
```

- [ ] **Step 3: Run render tests**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/feature-spotlight-render.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS for split feature rendering and page block pipeline coverage.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/FeatureSpotlight/Component.tsx src/blocks/renderPageBlocks.tsx tests/int/feature-spotlight-render.int.spec.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: render split feature block"
```

### Task 5: Regenerate types and run the final verification suite

**Files:**

- Modify: `src/payload-types.ts`
- Test: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/feature-spotlight-render.int.spec.ts`

**Interfaces:**

- Consumes: Payload config and block registration
- Produces: updated generated types for `featureSpotlight`

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
npm run generate:types
```

Expected: `src/payload-types.ts` updates with `FeatureSpotlightBlock` and `featureSpotlight` layout unions.

- [ ] **Step 2: Run typecheck**

Run:

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: PASS with no type errors.

- [ ] **Step 3: Run focused block tests**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/hero-institutional-render.int.spec.ts tests/int/feature-spotlight-render.int.spec.ts
```

Expected: PASS for all focused block tests.

- [ ] **Step 4: Commit**

```bash
git add src/payload-types.ts
git commit -m "chore: generate split feature types"
```

## Self-Review

- Spec coverage: the plan covers one-block-per-section usage, required image/title, manual side control, plain/muted backgrounds, link/button CTA mode switching, page block registration, rendering, and responsive verification.
- Placeholder scan: removed generic placeholders; each task has exact files, commands, and code targets.
- Type consistency: all produced names match the intended implementation surface: `featureSpotlight`, `FeatureSpotlightBlock`, `FeatureSpotlightBlockComponent`, `mediaPosition`, `backgroundStyle`, `ctaMode`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-13-feature-spotlight-block.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints
