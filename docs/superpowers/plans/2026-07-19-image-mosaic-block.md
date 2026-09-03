# Image Mosaic Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a theme-aware, responsive Payload block named Image Mosaic, adapted from `@shadcnblocks/gallery31`, with one to eight images, direction-aware desktop overlays, touch-visible titles, explicit item links, and standard section actions.

**Architecture:** A Payload config and server adapter normalize CMS media and links. A server-compatible presentation component owns section typography and the responsive mosaic, while the installed direction-aware hover primitive is reduced to a focused client boundary using the project's existing `framer-motion` dependency. Pointer and reduced-motion behavior are expressed without server/client render branches, and block-specific media queries live in `src/styles/custom.css`.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router/RSC, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, shadcnblocks Gallery31, Framer Motion, Vitest, Playwright, Sharp.

## Global Constraints

- Use block name **Image Mosaic**, slug `imageMosaic`, and interface `ImageMosaicBlock`.
- Support one to eight image items.
- Each item supports an optional title and a separately labelled optional link; items do not support descriptions or prices.
- Only the explicit item link text is clickable; the image surface is never a link.
- One block-level `showImageOverlays` control hides all item titles and links together and disables the item hover treatment.
- Touch/coarse-pointer devices show enabled overlays continuously; hover-capable desktop devices use direction-aware motion.
- Use the shared regular-block typography, spacing, appearance, action, media, and link conventions.
- Put Image Mosaic-specific CSS in `src/styles/custom.css`, not `src/styles/globals.css`.
- Use `npx shadcn@latest add @shadcnblocks/gallery31`; do not overwrite existing shadcn files.
- Preserve unrelated changes. Do not stage or commit any files.

---

## File structure

### Create

- `src/blocks/ImageMosaic/config.ts` — Payload Content and Layout & Theme schema.
- `src/blocks/ImageMosaic/Component.tsx` — server adapter from generated Payload values to presentation props.
- `src/components/image-mosaic.tsx` — server-compatible section, intro, grid, static tiles, and overlay content.
- `src/components/ui/direction-aware-hover.tsx` — client-only direction-aware image-motion primitive installed from Gallery31 and adapted to project conventions.
- `tests/int/image-mosaic.int.spec.tsx` — schema, rendering, interaction-boundary, mapping, and pipeline tests.
- `public/block-thumbnails/image-mosaic.jpg` — generated 1600×900 real-render thumbnail.

### Modify

- `package.json` and `pnpm-lock.yaml` — only if the shadcn command changes dependencies; remove the redundant `motion` package after adapting to installed `framer-motion`.
- `src/styles/custom.css` — touch-visible overlays, direction origins, focus behavior, and reduced-motion fallback.
- `src/collections/Pages.ts` — register Image Mosaic in the page layout field.
- `src/blocks/renderPageBlocks.tsx` — render generated `imageMosaic` values.
- `src/payload-types.ts` — regenerate after schema registration.
- `src/block-thumbnails/definitions.ts` — add the Image Mosaic thumbnail metadata.
- `src/block-thumbnails/fixtures.tsx` — add a real Image Mosaic fixture.
- `scripts/generate-block-thumbnails.ts` — allow targeting one slug so unrelated thumbnails are not rewritten.
- `tests/int/page-blocks.int.spec.ts` — add `imageMosaic` to the canonical page block list.
- `tests/int/system-page-blocks.int.spec.ts` — assert collection scoping with the new page block.
- `tests/int/block-thumbnails.int.spec.ts` — assert Image Mosaic definition, fixture, and JPEG artifact.

---

### Task 1: Define the Payload editor schema

**Files:**

- Create: `src/blocks/ImageMosaic/config.ts`
- Create: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Produces: `ImageMosaicBlock: Block` with slug `imageMosaic`.
- Produces fields consumed later by `ImageMosaicBlockComponent`: `eyebrow`, `title`, `description`, `actions`, `items`, `appearance`, `actionMode`, `contentAlignment`, `size`, and `showImageOverlays`.

- [ ] **Step 1: Write the failing schema test**

Create `tests/int/image-mosaic.int.spec.tsx` with the schema test and reusable test helpers:

```tsx
import { describe, expect, it } from 'vitest'

import { ImageMosaicBlock } from '@/blocks/ImageMosaic/config'

type TestField = {
  admin?: { condition?: unknown }
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  type?: string
}

type TestTab = { fields: TestField[]; label: string }

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

describe('Image Mosaic', () => {
  it('defines the approved one-to-eight-item Payload schema', () => {
    expect(ImageMosaicBlock).toMatchObject({
      interfaceName: 'ImageMosaicBlock',
      labels: { plural: 'Image Mosaics', singular: 'Image Mosaic' },
      slug: 'imageMosaic',
    })

    const tabsField = ImageMosaicBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Layout & Theme')
    const itemsField = getField(contentTab?.fields ?? [], 'items')

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs.map(({ label }) => label)).toEqual(['Content', 'Layout & Theme'])
    expect(getField(contentTab?.fields ?? [], 'title')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(getField(contentTab?.fields ?? [], 'actions')?.maxRows).toBe(2)
    expect(itemsField).toMatchObject({ minRows: 1, maxRows: 8, required: true, type: 'array' })
    expect(getField(itemsField?.fields ?? [], 'image')).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    expect(getField(itemsField?.fields ?? [], 'imagePosition')).toMatchObject({
      defaultValue: 'center',
      required: true,
      type: 'select',
    })
    expect(
      getField(itemsField?.fields ?? [], 'imagePosition')?.options?.map(({ value }) => value),
    ).toEqual(['center', 'top', 'bottom', 'left', 'right'])
    expect(getField(itemsField?.fields ?? [], 'linkType')).toMatchObject({
      defaultValue: 'none',
      required: true,
      type: 'select',
    })
    expect(getField(itemsField?.fields ?? [], 'linkLabel')?.admin?.condition).toBeTypeOf('function')
    expect(getField(itemsField?.fields ?? [], 'page')?.admin?.condition).toBeTypeOf('function')
    expect(getField(itemsField?.fields ?? [], 'url')?.admin?.condition).toBeTypeOf('function')
    expect(getField(layoutTab?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(getField(layoutTab?.fields ?? [], 'actionMode')?.defaultValue).toBe('link')
    expect(getField(layoutTab?.fields ?? [], 'contentAlignment')?.defaultValue).toBe('center')
    expect(getField(layoutTab?.fields ?? [], 'size')?.defaultValue).toBe('default')
    expect(getField(layoutTab?.fields ?? [], 'showImageOverlays')).toMatchObject({
      defaultValue: true,
      type: 'checkbox',
    })
  })
})
```

- [ ] **Step 2: Run the schema test and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `@/blocks/ImageMosaic/config` and the planned components do not exist.

- [ ] **Step 3: Implement the Payload schema**

Create `src/blocks/ImageMosaic/config.ts`:

```ts
import type { ArrayField, Block, CheckboxField, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  createContentActionModeField,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

type ItemLinkSiblingData = {
  linkType?: 'custom' | 'none' | 'page' | null
}

const isPageLink = (_data: unknown, siblingData: ItemLinkSiblingData) =>
  siblingData?.linkType === 'page'
const isCustomLink = (_data: unknown, siblingData: ItemLinkSiblingData) =>
  siblingData?.linkType === 'custom'
const hasItemLink = (_data: unknown, siblingData: ItemLinkSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const itemsField = {
  name: 'items',
  label: 'Images',
  type: 'array',
  minRows: 1,
  maxRows: 8,
  required: true,
  admin: { initCollapsed: true },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'imagePosition',
      label: 'Background Position',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Center', value: 'center' },
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      required: true,
    } satisfies SelectField,
    { name: 'title', type: 'text' },
    {
      name: 'linkType',
      label: 'Image Link',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'No Link', value: 'none' },
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'linkLabel',
      label: 'Link Text',
      type: 'text',
      admin: { condition: hasItemLink },
    },
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
      admin: { condition: hasItemLink },
    } satisfies CheckboxField,
  ],
} satisfies ArrayField

export const ImageMosaicBlock: Block = {
  slug: 'imageMosaic',
  interfaceName: 'ImageMosaicBlock',
  labels: { singular: 'Image Mosaic', plural: 'Image Mosaics' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            createContentActionsField(),
            itemsField,
          ],
        },
        {
          label: 'Layout & Theme',
          fields: [
            createBlockAppearanceFields({ includeTextOverride: false }),
            createContentActionModeField(),
            {
              name: 'contentAlignment',
              label: 'Content Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Size',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'showImageOverlays',
              label: 'Show Image Titles and Links',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

The thumbnail admin metadata is intentionally added with the thumbnail definition in Task 5, keeping this schema task independently type-safe.

- [ ] **Step 4: Review the task diff without staging**

Run:

```bash
git diff -- src/blocks/ImageMosaic/config.ts tests/int/image-mosaic.int.spec.tsx
git diff --cached --quiet
```

Expected: the new schema and its passing test are visible; the cached diff command exits 0.

---

### Task 2: Adapt Gallery31 into responsive presentation components

**Files:**

- Create: `src/components/ui/direction-aware-hover.tsx`
- Create: `src/components/image-mosaic.tsx`
- Modify: `src/styles/custom.css`
- Modify temporarily/finally as needed: `package.json`, `pnpm-lock.yaml`
- Modify: `tests/int/image-mosaic.int.spec.tsx`
- Delete after adaptation: `src/components/gallery31.tsx`

**Interfaces:**

- Produces: `DirectionAwareHover` with serializable image props and React overlay children.
- Produces: `ImageMosaic(props)`, `ImageMosaicItem`, `ImageMosaicAlignment`, `ImageMosaicImagePosition`, and `ImageMosaicSize`.
- Consumes: shared `BlockAppearance`, `ContentLink`, regular block spacing, and `cn()`.

- [ ] **Step 1: Add failing presentation and client-boundary tests**

Add these imports and the shared item fixture above the existing `describe`:

```tsx
import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'

import { ImageMosaic, type ImageMosaicItem } from '@/components/image-mosaic'

const mosaicItems: ImageMosaicItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  image: {
    alt: `Mosaic image ${index + 1}`,
    height: 900,
    src: `/media/mosaic-${index + 1}.jpg`,
    width: 1200,
  },
  imagePosition: ['center', 'top', 'bottom', 'left', 'right'][index % 5] as
    'bottom' | 'center' | 'left' | 'right' | 'top',
  link: {
    href: `/stories/${index + 1}`,
    label: 'Explore',
  },
  title: `Story ${index + 1}`,
}))
```

Append these tests inside the existing `describe('Image Mosaic', ...)`:

```tsx
it.each([1, 2, 3, 4, 5, 6, 7, 8])('renders %i items without horizontal overflow', (count) => {
  const html = renderToStaticMarkup(
    <ImageMosaic items={mosaicItems.slice(0, count)} title="Campus perspectives" />,
  )

  expect(html).toContain(`data-image-mosaic-count="${count}"`)
  expect(html).toContain('grid-flow-dense')
  expect(html).toContain('grid-cols-1')
  expect(html).toContain('md:grid-cols-2')
  expect(html).toContain('overflow-hidden')
  expect(html.match(/data-image-mosaic-item=/g)).toHaveLength(count)
})

it('uses shared typography, spacing, appearance, sizing, and alignment', () => {
  const html = renderToStaticMarkup(
    <ImageMosaic
      actions="Explore the collection"
      alignment="right"
      appearance={{ background: 'muted', border: 'topAndBottom' }}
      description="A closer look at the people and places in our community."
      eyebrow="Gallery"
      items={mosaicItems.slice(0, 5)}
      size="compact"
      title="Campus perspectives"
    />,
  )

  expect(html).toContain('data-image-mosaic-alignment="right"')
  expect(html).toContain('data-image-mosaic-size="compact"')
  expect(html).toContain('bg-muted')
  expect(html).toContain('border-y border-border')
  expect(html).toContain('py-10')
  expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
  expect(html).toContain(
    'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
  )
  expect(html).toContain('text-base leading-7 text-balance text-current/70')
  expect(html).toContain('ml-auto items-end text-right')
  expect(html).toContain('Explore the collection')
})

it('renders explicit text links only while overlays are enabled', () => {
  const enabledHtml = renderToStaticMarkup(
    <ImageMosaic items={mosaicItems.slice(0, 1)} showImageOverlays title="Gallery" />,
  )
  const disabledHtml = renderToStaticMarkup(
    <ImageMosaic items={mosaicItems.slice(0, 1)} showImageOverlays={false} title="Gallery" />,
  )

  expect(enabledHtml).toContain('data-image-mosaic-overlay="true"')
  expect(enabledHtml).toContain('href="/stories/1"')
  expect(enabledHtml).toContain('Story 1')
  expect(disabledHtml).toContain('data-image-mosaic-overlays="hidden"')
  expect(disabledHtml).not.toContain('data-image-mosaic-overlay="true"')
  expect(disabledHtml).not.toContain('href="/stories/1"')
  expect(disabledHtml).not.toContain('Story 1')
})

it('keeps interaction client-only and uses CSS for touch and reduced motion', () => {
  const serverSource = readFileSync('src/components/image-mosaic.tsx', 'utf8')
  const clientSource = readFileSync('src/components/ui/direction-aware-hover.tsx', 'utf8')
  const customCss = readFileSync('src/styles/custom.css', 'utf8')

  expect(serverSource).not.toContain("'use client'")
  expect(serverSource).not.toContain("from 'framer-motion'")
  expect(clientSource.startsWith("'use client'")).toBe(true)
  expect(clientSource).toContain("from 'framer-motion'")
  expect(clientSource).toContain('useReducedMotion')
  expect(clientSource).not.toContain('console.log')
  expect(clientSource).not.toContain('typeof window')
  expect(customCss).toContain('@media (hover: none), (pointer: coarse)')
  expect(customCss).toContain('@media (prefers-reduced-motion: reduce)')
  expect(customCss).toContain('.image-mosaic-overlay')
})
```

- [ ] **Step 2: Run the test and confirm presentation failures**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `ImageMosaic` and the adapted hover primitive do not exist.

- [ ] **Step 3: Install Gallery31 without overwriting existing files**

Run:

```bash
npx shadcn@latest add @shadcnblocks/gallery31 --dry-run
npx shadcn@latest add @shadcnblocks/gallery31
```

Expected: the dry run reports `src/components/ui/direction-aware-hover.tsx` and `src/components/gallery31.tsx` as new, with `src/lib/utils.ts` skipped as identical. The actual command creates only those new files and may add `motion`.

Do not pass `--overwrite`. If the dry run reports any existing non-identical file, stop and request explicit overwrite guidance.

- [ ] **Step 4: Adapt the generated hover primitive**

Replace the generated `src/components/ui/direction-aware-hover.tsx` with a typed version following this interface and behavior:

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useRef, useState, type MouseEvent, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Direction = 'bottom' | 'left' | 'right' | 'top'

type DirectionAwareHoverProps = {
  alt: string
  children: ReactNode
  className?: string
  height?: number
  imageClassName?: string
  imageUrl: string
  width?: number
}

const imageVariants = {
  initial: { x: 0, y: 0 },
  top: { x: 0, y: 20 },
  right: { x: -20, y: 0 },
  bottom: { x: 0, y: -20 },
  left: { x: 20, y: 0 },
} as const

const getDirection = (event: MouseEvent<HTMLDivElement>, element: HTMLElement): Direction => {
  const { width, height, left, top } = element.getBoundingClientRect()
  const x = event.clientX - left - (width / 2) * (width > height ? height / width : 1)
  const y = event.clientY - top - (height / 2) * (height > width ? width / height : 1)
  const direction = Math.round(Math.atan2(y, x) / (Math.PI / 2) + 5) % 4

  return (['top', 'right', 'bottom', 'left'] as const)[direction] ?? 'left'
}

export function DirectionAwareHover({
  alt,
  children,
  className,
  height,
  imageClassName,
  imageUrl,
  width,
}: DirectionAwareHoverProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [direction, setDirection] = useState<Direction>('left')
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate="initial"
      className={cn('group/image-mosaic relative overflow-hidden rounded-md', className)}
      data-image-mosaic-direction={direction}
      initial="initial"
      onMouseEnter={(event) => {
        if (elementRef.current) setDirection(getDirection(event, elementRef.current))
      }}
      ref={elementRef}
      whileHover={shouldReduceMotion ? undefined : direction}
    >
      <motion.img
        alt={alt}
        className={cn('size-full scale-[1.08] object-cover', imageClassName)}
        draggable={false}
        height={height}
        src={imageUrl}
        variants={imageVariants}
        width={width}
      />
      <div className="image-mosaic-overlay absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-5 pt-16 text-foreground">
        {children}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 5: Implement the server-compatible mosaic presentation**

Create `src/components/image-mosaic.tsx` with module-level class maps and these exported interfaces:

```tsx
import type { ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { ContentLink } from '@/components/ContentLink'
import { DirectionAwareHover } from '@/components/ui/direction-aware-hover'
import { cn } from '@/lib/utils'

export type ImageMosaicAlignment = 'center' | 'left' | 'right'
export type ImageMosaicImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type ImageMosaicSize = 'comfortable' | 'compact' | 'default'

export type ImageMosaicItem = {
  id: number | string
  image: { alt: string; height?: number; src: string; width?: number }
  imagePosition?: ImageMosaicImagePosition | null
  link?: { href: string; label: string; openInNewTab?: boolean }
  title?: string | null
}

type ImageMosaicProps = {
  actions?: ReactNode
  alignment?: ImageMosaicAlignment
  appearance?: BlockAppearance | null
  className?: string
  description?: string | null
  eyebrow?: string | null
  items: ImageMosaicItem[]
  showImageOverlays?: boolean
  size?: ImageMosaicSize
  title: string
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const sectionGapClasses = {
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const

const desktopGridClasses = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-4',
  6: 'lg:grid-cols-4',
  7: 'lg:grid-cols-4',
  8: 'lg:grid-cols-4',
} as const

const gridRowClasses = {
  compact: 'lg:auto-rows-[13rem]',
  default: 'lg:auto-rows-[15rem]',
  comfortable: 'lg:auto-rows-[17rem]',
} as const

const mobileTileHeightClasses = {
  compact: 'h-52 md:h-56 lg:h-full',
  default: 'h-60 md:h-64 lg:h-full',
  comfortable: 'h-68 md:h-72 lg:h-full',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

const mosaicSpanClasses = [
  '',
  'lg:col-span-2',
  'lg:row-span-2',
  'lg:col-span-2',
  '',
  'lg:col-span-2',
  '',
  '',
] as const

export function ImageMosaic({
  actions,
  alignment = 'center',
  appearance,
  className,
  description,
  eyebrow,
  items,
  showImageOverlays = true,
  size = 'default',
  title,
}: ImageMosaicProps) {
  const visibleItems = items.slice(0, 8)
  if (!title.trim() || visibleItems.length === 0) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const count = visibleItems.length as keyof typeof desktopGridClasses

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
      data-image-mosaic="true"
      data-image-mosaic-alignment={alignment}
      data-image-mosaic-background={appearance?.background ?? 'none'}
      data-image-mosaic-overlays={showImageOverlays ? 'shown' : 'hidden'}
      data-image-mosaic-size={size}
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col', sectionGapClasses[size])}>
        <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[alignment])}>
          {eyebrow ? (
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="text-base leading-7 text-balance text-current/70">{description}</p>
          ) : null}
          {actions}
        </div>

        <div
          className={cn(
            'grid grid-flow-dense grid-cols-1 gap-2.5 overflow-hidden md:grid-cols-2',
            desktopGridClasses[count],
            gridRowClasses[size],
          )}
          data-image-mosaic-count={count}
        >
          {visibleItems.map((item, index) => {
            const position = item.imagePosition ?? 'center'
            const title = item.title?.trim()
            const hasOverlay = showImageOverlays && Boolean(title || item.link)
            const tileClassName = cn(
              'relative overflow-hidden rounded-md border border-border',
              mobileTileHeightClasses[size],
              count >= 5 ? mosaicSpanClasses[index] : '',
            )
            const imageClassName = cn('size-full object-cover', objectPositionClasses[position])

            if (!hasOverlay) {
              return (
                <div
                  className={tileClassName}
                  data-image-mosaic-item={index + 1}
                  key={`${item.id}-${index}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={item.image.alt}
                    className={imageClassName}
                    draggable={false}
                    height={item.image.height}
                    src={item.image.src}
                    width={item.image.width}
                  />
                </div>
              )
            }

            return (
              <DirectionAwareHover
                alt={item.image.alt}
                className={tileClassName}
                height={item.image.height}
                imageClassName={imageClassName}
                imageUrl={item.image.src}
                key={`${item.id}-${index}`}
                width={item.image.width}
              >
                <div
                  className="flex flex-col items-start gap-2"
                  data-image-mosaic-item={index + 1}
                  data-image-mosaic-overlay="true"
                >
                  {title ? (
                    <p className="text-base leading-tight font-semibold text-current">{title}</p>
                  ) : null}
                  {item.link ? <ContentLink {...item.link} /> : null}
                </div>
              </DirectionAwareHover>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Add touch, focus, direction, and reduced-motion CSS**

Append to `src/styles/custom.css`:

```css
/* Image Mosaic direction-aware overlays */
.image-mosaic-overlay {
  pointer-events: none;
  opacity: 0;
  transform: translate3d(-0.75rem, 0, 0);
  transition:
    opacity 200ms ease-out,
    transform 200ms ease-out;
}

[data-image-mosaic-direction='top'] .image-mosaic-overlay {
  transform: translate3d(0, -0.75rem, 0);
}

[data-image-mosaic-direction='right'] .image-mosaic-overlay {
  transform: translate3d(0.75rem, 0, 0);
}

[data-image-mosaic-direction='bottom'] .image-mosaic-overlay {
  transform: translate3d(0, 0.75rem, 0);
}

[data-image-mosaic-direction='left'] .image-mosaic-overlay {
  transform: translate3d(-0.75rem, 0, 0);
}

.group\/image-mosaic:hover .image-mosaic-overlay,
.group\/image-mosaic:focus-within .image-mosaic-overlay {
  pointer-events: auto;
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

@media (hover: none), (pointer: coarse) {
  .image-mosaic-overlay {
    pointer-events: auto;
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-mosaic-overlay {
    transition: none;
  }
}
```

- [ ] **Step 7: Remove generated demo code and redundant dependency**

Delete the generated `src/components/gallery31.tsx` with `apply_patch`. If the shadcn command added `motion`, change the primitive import to the already installed `framer-motion` as shown above and run:

```bash
pnpm remove motion
```

Expected: `package.json` retains `framer-motion`; no final source imports from `motion/react`; the lockfile contains no direct `motion` dependency added by this task.

- [ ] **Step 8: Run the focused tests**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: presentation tests pass; schema compilation may remain blocked only by the not-yet-added thumbnail slug until Task 5.

- [ ] **Step 9: Review the task diff without staging**

Run:

```bash
git diff -- src/components/image-mosaic.tsx src/components/ui/direction-aware-hover.tsx src/styles/custom.css package.json pnpm-lock.yaml
git diff --cached --quiet
```

Expected: only the adapted UI, custom CSS, and necessary dependency cleanup appear; cached diff exits 0.

---

### Task 3: Resolve Payload media and item links on the server

**Files:**

- Create: `src/blocks/ImageMosaic/Component.tsx`
- Modify: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Consumes: `resolveCmsLink`, `resolveCmsActions`, `getMediaImageProps`, `isMediaDoc`, `ContentActions`, and `ImageMosaic`.
- Produces: `ImageMosaicBlockComponent(props)` that accepts the generated Payload block shape.

- [ ] **Step 1: Add failing adapter tests**

Add the adapter import above `describe`, then append the tests:

```tsx
import { ImageMosaicBlockComponent } from '@/blocks/ImageMosaic/Component'
```

Append:

```tsx
it('resolves Payload media, item links, section actions, and image positions', () => {
  const html = renderToStaticMarkup(
    <ImageMosaicBlockComponent
      actionMode="button"
      actions={[{ label: 'View all', linkType: 'custom', url: '/gallery', variant: 'outline' }]}
      appearance={{ background: 'accent', border: 'top' }}
      contentAlignment="left"
      items={[
        {
          image: {
            alt: 'Learning space',
            height: 900,
            id: 10,
            url: '/media/space.jpg',
            width: 1200,
          },
          imagePosition: 'top',
          linkLabel: 'Explore the space',
          linkType: 'custom',
          title: 'Learning spaces',
          url: '/spaces',
        },
        {
          image: { alt: 'Community', id: 11, url: '/media/community.jpg' },
          linkLabel: 'Incomplete link',
          linkType: 'custom',
          title: 'Community',
        },
      ]}
      size="comfortable"
      title="Inside our community"
    />,
  )

  expect(html).toContain('data-image-mosaic="true"')
  expect(html).toContain('data-action-mode="button"')
  expect(html).toContain('data-action-variant="outline"')
  expect(html).toContain('href="/gallery"')
  expect(html).toContain('href="/spaces"')
  expect(html).not.toContain('Incomplete link</a>')
  expect(html).toContain('object-[center_top]')
  expect(html).toContain('width="1200"')
  expect(html).toContain('height="900"')
})

it('omits invalid images and renders nothing without a title or valid image', () => {
  const oneValid = renderToStaticMarkup(
    <ImageMosaicBlockComponent
      items={[
        { image: null, title: 'Invalid' },
        { image: { alt: 'Valid', id: 1, url: '/media/valid.jpg' }, title: 'Valid' },
      ]}
      title="Gallery"
    />,
  )

  expect(oneValid.match(/data-image-mosaic-item=/g)).toHaveLength(1)
  expect(renderToStaticMarkup(<ImageMosaicBlockComponent items={[]} title="Gallery" />)).toBe('')
  expect(
    renderToStaticMarkup(
      <ImageMosaicBlockComponent items={[{ image: { id: 1, url: '/image.jpg' } }]} title="  " />,
    ),
  ).toBe('')
})
```

- [ ] **Step 2: Run the adapter tests and verify failure**

Run the focused Vitest command from Task 2.

Expected: FAIL because `ImageMosaicBlockComponent` is not implemented.

- [ ] **Step 3: Implement the server adapter**

Create `src/blocks/ImageMosaic/Component.tsx`:

```tsx
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { ContentActions } from '@/components/ContentActions'
import {
  ImageMosaic,
  type ImageMosaicAlignment,
  type ImageMosaicImagePosition,
  type ImageMosaicItem,
  type ImageMosaicSize,
} from '@/components/image-mosaic'
import { resolveCmsActions, resolveCmsLink, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'

type ImageMosaicItemValue = {
  image?: unknown
  imagePosition?: ImageMosaicImagePosition | null
  linkLabel?: string | null
  linkType?: 'custom' | 'none' | 'page' | null
  openInNewTab?: boolean | null
  page?: unknown
  title?: string | null
  url?: string | null
}

type ImageMosaicBlockLike = {
  actionMode?: 'button' | 'link' | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: ImageMosaicAlignment | null
  description?: string | null
  eyebrow?: string | null
  items?: ImageMosaicItemValue[] | null
  showImageOverlays?: boolean | null
  size?: ImageMosaicSize | null
  title?: string | null
}

export function ImageMosaicBlockComponent({
  actionMode = 'link',
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  eyebrow,
  items,
  showImageOverlays = true,
  size = 'default',
  title,
}: ImageMosaicBlockLike) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null

  const resolvedItems = (items ?? [])
    .flatMap((item): ImageMosaicItem[] => {
      const itemTitle = item.title?.trim()
      const media = item.image as Media | number | string | null | undefined
      const image = getMediaImageProps({ fallbackAlt: itemTitle, media, preset: 'generic' })
      if (!image) return []

      const linkLabel = item.linkLabel?.trim()
      const destination = resolveCmsLink({
        linkType: item.linkType === 'none' ? null : item.linkType,
        openInNewTab: item.openInNewTab,
        page: item.page as never,
        url: item.url,
      })

      return [
        {
          id: isMediaDoc(media) ? media.id : image.src,
          image,
          imagePosition: item.imagePosition ?? 'center',
          link:
            linkLabel && destination.href
              ? { href: destination.href, label: linkLabel, openInNewTab: destination.openInNewTab }
              : undefined,
          title: itemTitle,
        },
      ]
    })
    .slice(0, 8)

  if (resolvedItems.length === 0) return null
  const alignment = contentAlignment ?? 'center'

  return (
    <ImageMosaic
      actions={
        <ContentActions
          actions={resolveCmsActions(actions).slice(0, 2)}
          alignment={alignment}
          data-image-mosaic-actions="true"
          mode={actionMode ?? 'link'}
        />
      }
      alignment={alignment}
      appearance={appearance}
      description={description?.trim() || undefined}
      eyebrow={eyebrow?.trim() || undefined}
      items={resolvedItems}
      showImageOverlays={showImageOverlays ?? true}
      size={size ?? 'default'}
      title={resolvedTitle}
    />
  )
}
```

- [ ] **Step 4: Run the adapter tests**

Run the focused Vitest command.

Expected: adapter rendering, incomplete-link, invalid-media, and null-state tests pass.

- [ ] **Step 5: Review the task diff without staging**

Run `git diff -- src/blocks/ImageMosaic/Component.tsx tests/int/image-mosaic.int.spec.tsx` and `git diff --cached --quiet`.

Expected: server-only mapping is visible; cached diff exits 0.

---

### Task 4: Register the block and regenerate Payload types

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/payload-types.ts`
- Modify: `tests/int/image-mosaic.int.spec.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `ImageMosaicBlock` and `ImageMosaicBlockComponent`.
- Produces: `Page['layout']` union member with `blockType: 'imageMosaic'`.

- [ ] **Step 1: Add failing registration assertions**

Add the pipeline imports above `describe`:

```tsx
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { Pages } from '@/collections/Pages'
```

Append to `tests/int/image-mosaic.int.spec.tsx`:

```tsx
it('registers and renders through the page block pipeline', () => {
  const tabsField = Pages.fields.find((field) => field.type === 'tabs')
  const contentTab = tabsField?.type === 'tabs' ? tabsField.tabs[0] : undefined
  const layoutField = contentTab?.fields.find((field) => 'name' in field && field.name === 'layout')
  const slugs = layoutField?.type === 'blocks' ? layoutField.blocks.map(({ slug }) => slug) : []

  expect(slugs).toContain('imageMosaic')

  const html = renderToStaticMarkup(
    renderPageBlocks([
      {
        blockType: 'imageMosaic',
        items: [{ image: { alt: 'Pipeline image', id: 1, url: '/pipeline.jpg' } }],
        title: 'Pipeline mosaic',
      } as never,
    ]),
  )

  expect(html).toContain('data-image-mosaic="true"')
  expect(html).toContain('Pipeline mosaic')
})
```

Update the exact slug arrays in `tests/int/page-blocks.int.spec.ts` and `tests/int/system-page-blocks.int.spec.ts` by inserting `'imageMosaic'` immediately after `'galleryShowcase'`.

- [ ] **Step 2: Run registration tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because Pages and the renderer do not yet include `imageMosaic`.

- [ ] **Step 3: Register the Payload block**

In `src/collections/Pages.ts`:

```ts
import { ImageMosaicBlock } from '@/blocks/ImageMosaic/config'
```

Add it after `GalleryShowcaseBlock` in the `layout` block list:

```ts
GalleryShowcaseBlock,
ImageMosaicBlock,
StatsStripBlock,
```

- [ ] **Step 4: Register the frontend renderer**

In `src/blocks/renderPageBlocks.tsx`, add:

```tsx
import { ImageMosaicBlockComponent } from './ImageMosaic/Component'
```

Add this switch case after `galleryShowcase`:

```tsx
case 'imageMosaic':
  return (
    <ImageMosaicBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      {...block}
    />
  )
```

- [ ] **Step 5: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `ImageMosaicBlock`, its item fields, and `blockType: 'imageMosaic'` in `Page.layout`.

- [ ] **Step 6: Run registration tests**

Run the three-file Vitest command from Step 2.

Expected: all registration and pipeline tests pass.

- [ ] **Step 7: Review the task diff without staging**

Run:

```bash
git diff -- src/collections/Pages.ts src/blocks/renderPageBlocks.tsx src/payload-types.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
git diff --cached --quiet
```

Expected: only Image Mosaic registration and generated type changes appear; cached diff exits 0.

---

### Task 5: Add the real-render Payload thumbnail

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `scripts/generate-block-thumbnails.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Create: `public/block-thumbnails/image-mosaic.jpg`

**Interfaces:**

- Produces: `BlockThumbnailSlug` member `imageMosaic`.
- Produces: `blockThumbnailFixtures.imageMosaic`.
- Produces: optional `BLOCK_THUMBNAIL_SLUG` filtering for the existing generator.

- [ ] **Step 1: Add failing thumbnail assertions**

In `tests/int/block-thumbnails.int.spec.ts`, add `imageMosaic` to the expected definition slugs and add:

```ts
expect(getBlockThumbnailDefinition('imageMosaic')).toMatchObject({
  filename: 'image-mosaic.jpg',
  label: 'Image Mosaic',
  slug: 'imageMosaic',
  stageAlignment: 'top',
})
```

The existing 1600×900 JPEG loop will verify the generated asset.

- [ ] **Step 2: Run the thumbnail test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because the definition, fixture, and JPEG do not exist.

- [ ] **Step 3: Add the thumbnail definition**

Insert after Gallery Showcase in `src/block-thumbnails/definitions.ts`:

```ts
defineThumbnail({
  alt: 'Image Mosaic block preview',
  filename: 'image-mosaic.jpg',
  label: 'Image Mosaic',
  slug: 'imageMosaic',
  stageAlignment: 'top',
}),
```

Then add the thumbnail admin metadata to `src/blocks/ImageMosaic/config.ts`:

```ts
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
```

Add `admin: getBlockThumbnailAdmin('imageMosaic'),` immediately after the existing
`interfaceName: 'ImageMosaicBlock',` property.

- [ ] **Step 4: Add a real-render fixture**

Import `ImageMosaicBlockComponent` in `src/block-thumbnails/fixtures.tsx` and add this fixture after Gallery Showcase:

```tsx
imageMosaic: (
  <ImageMosaicBlockComponent
    actionMode="link"
    actions={[{ label: 'Explore all spaces', linkType: 'custom', url: '/spaces' }]}
    appearance={{ background: 'muted', border: 'topAndBottom' }}
    contentAlignment="center"
    description="Explore the spaces, people, and moments that shape our community."
    eyebrow="Inside our community"
    items={[
      { image: { alt: 'Learning environment', id: 1, url: editorialLandscape }, linkLabel: 'Explore', linkType: 'custom', title: 'Learning spaces', url: '/spaces' },
      { image: { alt: 'Collaborative environment', id: 2, url: collaboration }, imagePosition: 'top', linkLabel: 'Discover', linkType: 'custom', title: 'Collaboration', url: '/community' },
      { image: { alt: 'Community portrait', id: 3, url: portrait }, imagePosition: 'center', linkLabel: 'Meet our people', linkType: 'custom', title: 'Our community', url: '/people' },
      { image: { alt: 'Campus landscape', id: 4, url: editorialLandscape }, imagePosition: 'right', linkLabel: 'Take a look', linkType: 'custom', title: 'Campus life', url: '/campus' },
      { image: { alt: 'Shared learning moment', id: 5, url: collaboration }, imagePosition: 'bottom', linkLabel: 'Learn more', linkType: 'custom', title: 'Shared experiences', url: '/experience' },
    ]}
    size="compact"
    title="A closer look at life here"
  />
),
```

- [ ] **Step 5: Add targeted generation to protect existing thumbnails**

In `scripts/generate-block-thumbnails.ts`, derive a selected definition list once:

```ts
const requestedSlug = process.env.BLOCK_THUMBNAIL_SLUG?.trim()
const selectedDefinitions = requestedSlug
  ? blockThumbnailDefinitions.filter(({ slug }) => slug === requestedSlug)
  : blockThumbnailDefinitions
const firstSelectedDefinition = selectedDefinitions[0]

if (!firstSelectedDefinition) {
  throw new Error(`Unknown block thumbnail slug: ${requestedSlug ?? '(none)'}`)
}
```

Change `hasReadyPreviewServer` to accept a `slug: string` argument and use that slug in its `getPreviewUrl` call. Change `waitForServer` to accept the same argument instead of reading `blockThumbnailDefinitions[0]`. In `generateThumbnails`, pass `firstSelectedDefinition.slug` to both helpers and iterate `selectedDefinitions` in the screenshot loop. Keep the default behavior unchanged when the environment variable is absent.

- [ ] **Step 6: Generate only the Image Mosaic JPEG**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=imageMosaic pnpm generate:block-thumbnails
```

Expected: only `public/block-thumbnails/image-mosaic.jpg` is written, at 1600×900 JPEG dimensions.

- [ ] **Step 7: Run thumbnail tests**

Run the thumbnail Vitest command from Step 2.

Expected: all thumbnail definitions have fixtures and exact JPEG assets; Image Mosaic passes.

- [ ] **Step 8: Review the task diff without staging**

Run:

```bash
git status --short public/block-thumbnails
git diff -- src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx scripts/generate-block-thumbnails.ts tests/int/block-thumbnails.int.spec.ts
git diff --cached --quiet
```

Expected: `image-mosaic.jpg` is the only new or modified thumbnail image; cached diff exits 0.

---

### Task 6: Complete quality and regression verification

**Files:**

- Modify only if checks expose an Image Mosaic defect: files listed in Tasks 1–5.

**Interfaces:**

- Verifies the final page block, generated types, client boundary, styling, and thumbnail as one integrated deliverable.

- [ ] **Step 1: Run focused Image Mosaic and registration tests**

Run:

```bash
pnpm exec vitest run \
  tests/int/image-mosaic.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  --config ./vitest.config.mts
```

Expected: all tests pass.

- [ ] **Step 2: Run adjacent gallery regression tests**

Run:

```bash
pnpm exec vitest run \
  tests/int/gallery-showcase.int.spec.ts \
  tests/int/feature-matrix.int.spec.ts \
  --config ./vitest.config.mts
```

Expected: all existing gallery and feature tests pass.

- [ ] **Step 3: Format and check only touched source files**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/ImageMosaic/config.ts \
  src/blocks/ImageMosaic/Component.tsx \
  src/components/image-mosaic.tsx \
  src/components/ui/direction-aware-hover.tsx \
  src/styles/custom.css \
  src/collections/Pages.ts \
  src/blocks/renderPageBlocks.tsx \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  scripts/generate-block-thumbnails.ts \
  tests/int/image-mosaic.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: formatting completes without errors.

- [ ] **Step 4: Run scoped linting**

Run:

```bash
pnpm exec eslint \
  src/blocks/ImageMosaic/config.ts \
  src/blocks/ImageMosaic/Component.tsx \
  src/components/image-mosaic.tsx \
  src/components/ui/direction-aware-hover.tsx \
  src/collections/Pages.ts \
  src/blocks/renderPageBlocks.tsx \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  scripts/generate-block-thumbnails.ts \
  tests/int/image-mosaic.int.spec.tsx
```

Expected: zero lint errors.

- [ ] **Step 5: Run TypeScript validation**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: zero TypeScript errors. If the existing development server causes resource contention, stop only the check process, report the constraint, and rerun a scoped check without terminating user-owned processes.

- [ ] **Step 6: Verify dependency and hydration safety**

Run:

```bash
rg -n "motion/react|console\.log|typeof window|Math\.random|Date\.now" \
  src/blocks/ImageMosaic \
  src/components/image-mosaic.tsx \
  src/components/ui/direction-aware-hover.tsx
pnpm list motion --depth 0
```

Expected: no risky render-time code or debug logging; `motion` is not a direct dependency introduced by this block. The implementation uses existing `framer-motion` only.

- [ ] **Step 7: Inspect the real-render thumbnail and responsive preview**

Open the generated JPEG and verify:

- The section intro uses regular block typography.
- Five fixture tiles form the expected asymmetric four-column desktop mosaic.
- Titles and explicit link text remain legible over images.
- Borders and radii are not clipped.

When a local browser surface is available, verify a page containing one, five, and eight items at phone, tablet, and desktop widths. Confirm mobile overlays are continuously visible, desktop overlays enter from the pointer direction, keyboard focus reveals linked overlays, and no horizontal overflow occurs.

- [ ] **Step 8: Perform the final unstaged diff audit**

Run:

```bash
git diff --check
git status --short
git diff --cached --quiet
```

Expected: no whitespace errors; only Image Mosaic implementation, approved spec/plan, generated types, targeted generator support, and `image-mosaic.jpg` are changed; cached diff exits 0.
