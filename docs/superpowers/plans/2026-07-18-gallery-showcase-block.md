# Gallery Showcase Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a theme-aware Payload page block named Gallery Showcase that adapts `@shadcnblocks/gallery20` into an exactly-five-image, responsive, draggable fan with normalized website content and one optional shared action.

**Architecture:** A Payload block config defines the editor contract and a thin server adapter resolves media and actions. A server presentation component owns appearance, spacing, typography, and content; a focused Client Component owns only Framer Motion interaction and receives five serializable image objects. Existing shared appearance, spacing, media, action, thumbnail, and page-rendering infrastructure remains canonical.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10 App Router/RSC, React 19.2.7, TypeScript 5.7.3, Tailwind CSS 4, shadcn/ui radix-luma, Framer Motion, Vitest, Playwright, Sharp, pnpm.

## Global Constraints

- Canonical slug is `galleryShowcase`; interface is `GalleryShowcaseBlock`; labels are `Gallery Showcase` and `Gallery Showcases`.
- Editors configure exactly five images and zero or one shared action.
- Image rows expose only required Media and required Background Position fields; positions are Center, Top, Bottom, Left, Right.
- Content order is gallery, eyebrow, title, description, action.
- Gallery geometry is fixed, percentage-based, responsive, and horizontally clipped.
- Only the image fan is a Client Component; the adapter, section, copy, appearance, and actions stay server-rendered.
- Use semantic theme tokens and shared utilities; do not add raw colors, manual dark-mode overrides, custom radii, autoplay, transform controls, per-image copy, per-image links, or a lightbox.
- Respect reduced motion and disable native image dragging without preventing normal vertical page scrolling outside card surfaces.
- Use repository-local assets for the deterministic real-render thumbnail.
- Remove the generated `src/components/gallery20.tsx` registry demo after adaptation.
- Keep every change unstaged and uncommitted.

## File Structure

- Create `src/blocks/GalleryShowcase/config.ts`: Payload schema and editor defaults.
- Create `src/blocks/GalleryShowcase/Component.tsx`: server adapter from generated Payload values to presentation props.
- Create `src/components/gallery-showcase.tsx`: server-rendered section, appearance, spacing, copy, and action placement.
- Create `src/components/gallery-showcase-fan.tsx`: isolated Framer Motion client boundary and image fan geometry.
- Create `tests/int/gallery-showcase.int.spec.ts`: schema, rendering, media, motion-contract, and pipeline coverage.
- Modify `src/collections/Pages.ts`: register the block after Profile Carousel.
- Modify `src/blocks/renderPageBlocks.tsx`: render the block by canonical discriminant.
- Modify `src/payload-types.ts`: generated output from `pnpm generate:types`.
- Modify `src/block-thumbnails/definitions.ts`: add Gallery Showcase metadata.
- Modify `src/block-thumbnails/fixtures.tsx`: add a production-component fixture using local assets.
- Create `public/block-thumbnails/gallery-showcase.jpg`: generated 1600×900 deterministic preview.
- Modify `tests/int/page-blocks.int.spec.ts`, `tests/int/system-page-blocks.int.spec.ts`, and `tests/int/block-thumbnails.int.spec.ts`: update exact registry manifests.
- Modify `package.json` and `pnpm-lock.yaml`: install the Framer Motion version selected by the registry CLI.

---

### Task 1: Lock the Payload editor contract

**Files:**

- Create: `src/blocks/GalleryShowcase/config.ts`
- Create: `tests/int/gallery-showcase.int.spec.ts`
- Modify: `src/block-thumbnails/definitions.ts`

**Interfaces:**

- Consumes: `getBlockThumbnailAdmin(slug)`, `createBlockAppearanceFields({ includeTextOverride: false })`, `createContentActionModeField()`, and `createContentActionsField({ label: 'Action', maxRows: 1 })`.
- Produces: `GalleryShowcaseBlock: Block` with slug `galleryShowcase` and generated interface `GalleryShowcaseBlock`.

- [ ] **Step 1: Write the failing schema test**

Create the test helpers and first test in `tests/int/gallery-showcase.int.spec.ts`:

```ts
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { GalleryShowcaseBlock } from '@/blocks/GalleryShowcase/config'

type TestField = {
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

describe('Gallery Showcase', () => {
  it('defines the canonical five-image schema', () => {
    expect(GalleryShowcaseBlock.slug).toBe('galleryShowcase')
    expect(GalleryShowcaseBlock.interfaceName).toBe('GalleryShowcaseBlock')
    expect(GalleryShowcaseBlock.labels).toEqual({
      plural: 'Gallery Showcases',
      singular: 'Gallery Showcase',
    })

    const tabsField = GalleryShowcaseBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Layout & Theme')
    const imagesField = getField(contentTab?.fields ?? [], 'images')
    const imageField = getField(imagesField?.fields ?? [], 'image')
    const imagePositionField = getField(imagesField?.fields ?? [], 'imagePosition')

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs.map(({ label }) => label)).toEqual(['Content', 'Layout & Theme'])
    expect(getField(contentTab?.fields ?? [], 'eyebrow')?.type).toBe('text')
    expect(getField(contentTab?.fields ?? [], 'title')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(getField(contentTab?.fields ?? [], 'description')?.type).toBe('textarea')
    expect(getField(contentTab?.fields ?? [], 'actions')?.maxRows).toBe(1)
    expect(imagesField).toMatchObject({ minRows: 5, maxRows: 5, type: 'array' })
    expect(imageField).toMatchObject({ relationTo: 'media', required: true, type: 'upload' })
    expect(imagePositionField).toMatchObject({
      defaultValue: 'center',
      label: 'Background Position',
      required: true,
      type: 'select',
    })
    expect(imagePositionField?.options?.map(({ value }) => value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(getField(layoutTab?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(getField(layoutTab?.fields ?? [], 'actionMode')?.defaultValue).toBe('link')
    expect(getField(layoutTab?.fields ?? [], 'contentAlignment')).toMatchObject({
      defaultValue: 'center',
      required: true,
    })
    expect(getField(layoutTab?.fields ?? [], 'size')).toMatchObject({
      defaultValue: 'default',
      required: true,
    })
  })
})
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts
```

Expected: FAIL because `@/blocks/GalleryShowcase/config` does not exist.

- [ ] **Step 3: Register the canonical thumbnail slug needed by the config**

Insert this definition immediately after Profile Carousel in `src/block-thumbnails/definitions.ts` so `getBlockThumbnailAdmin('galleryShowcase')` resolves at module initialization:

```ts
defineThumbnail({
  alt: 'Gallery Showcase block preview',
  filename: 'gallery-showcase.jpg',
  label: 'Gallery Showcase',
  slug: 'galleryShowcase',
  stageAlignment: 'top',
}),
```

- [ ] **Step 4: Implement the exact config**

Create `src/blocks/GalleryShowcase/config.ts`:

```ts
import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  createContentActionModeField,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

const imagePositionOptions = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
]

const imagesField = {
  name: 'images',
  label: 'Images',
  type: 'array',
  minRows: 5,
  maxRows: 5,
  admin: { initCollapsed: true },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'imagePosition',
      label: 'Background Position',
      type: 'select',
      defaultValue: 'center',
      options: imagePositionOptions,
      required: true,
    } satisfies SelectField,
  ],
} satisfies ArrayField

export const GalleryShowcaseBlock: Block = {
  slug: 'galleryShowcase',
  interfaceName: 'GalleryShowcaseBlock',
  admin: getBlockThumbnailAdmin('galleryShowcase'),
  labels: {
    singular: 'Gallery Showcase',
    plural: 'Gallery Showcases',
  },
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
            createContentActionsField({ label: 'Action', maxRows: 1 }),
            imagesField,
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
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

The thumbnail definition from Step 3 makes `galleryShowcase` part of `BlockThumbnailSlug`, so no cast or temporary admin omission is allowed.

- [ ] **Step 5: Run the schema test**

Run the same focused command. Expected: the schema assertions pass; any remaining TypeScript diagnostic is only the deliberately missing thumbnail slug resolved in Task 4.

- [ ] **Step 6: Inspect the unstaged task diff**

Run:

```bash
git diff -- src/blocks/GalleryShowcase/config.ts src/block-thumbnails/definitions.ts tests/int/gallery-showcase.int.spec.ts
git status --short
```

Expected: only the new config, test, thumbnail-manifest entry, approved spec, and plan are present; nothing is staged.

---

### Task 2: Install and adapt Gallery 20 into a server section plus client fan

**Files:**

- Create then remove: `src/components/gallery20.tsx`
- Create: `src/components/gallery-showcase.tsx`
- Create: `src/components/gallery-showcase-fan.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tests/int/gallery-showcase.int.spec.ts`

**Interfaces:**

- Consumes: `regularBlockContainerClasses`, `regularBlockMobilePaddingClasses`, `resolveBlockAppearanceClasses`, `ContentActions`, `cn`, and Framer Motion `motion`/`useReducedMotion`.
- Produces: `GalleryShowcase`, `GalleryShowcaseFan`, `GalleryShowcaseImage`, `GalleryShowcaseImagePosition`, `GalleryShowcaseAlignment`, `GalleryShowcaseSize`, and immutable `galleryShowcaseTransforms`.

- [ ] **Step 1: Install the explicit registry item with the project package runner**

Run:

```bash
pnpm dlx shadcn@latest add @shadcnblocks/gallery20 -y
```

Expected: Framer Motion is added, `src/components/gallery20.tsx` is created, existing `src/components/ui/button.tsx` is not overwritten, and aliases remain `@/components/ui` and `@/lib`.

- [ ] **Step 2: Audit registry writes before adapting**

Run:

```bash
git status --short
git diff -- package.json pnpm-lock.yaml src/components/ui/button.tsx
sed -n '1,240p' src/components/gallery20.tsx
```

Expected: dependency changes plus the generated demo; the shared Button diff is empty. Stop and preserve the local Button if the CLI changed it.

- [ ] **Step 3: Extend the focused test with the presentation contract**

Add fixtures and tests to `tests/int/gallery-showcase.int.spec.ts`:

```ts
import { GalleryShowcase, type GalleryShowcaseImage } from '@/components/gallery-showcase'
import { galleryShowcaseTransforms } from '@/components/gallery-showcase-fan'

const galleryImages: GalleryShowcaseImage[] = [
  ['one', 'center'],
  ['two', 'top'],
  ['three', 'bottom'],
  ['four', 'left'],
  ['five', 'right'],
].map(([name, imagePosition], index) => ({
  alt: `${name} image`,
  height: 900,
  id: index + 1,
  imagePosition: imagePosition as GalleryShowcaseImage['imagePosition'],
  src: `/media/${name}.jpg`,
  width: 1200,
}))

it('renders normalized content, theme appearance, and responsive fan sizing', () => {
  const html = renderToStaticMarkup(
    GalleryShowcase({
      actions: 'Explore the gallery',
      alignment: 'right',
      appearance: { background: 'muted', border: 'topAndBottom' },
      description: 'Five perspectives from across the community.',
      eyebrow: 'Gallery',
      images: galleryImages,
      size: 'compact',
      title: 'See the experience',
    }),
  )

  expect(html).toContain('data-gallery-showcase="true"')
  expect(html).toContain('data-gallery-showcase-alignment="right"')
  expect(html).toContain('data-gallery-showcase-size="compact"')
  expect(html).toContain('bg-muted')
  expect(html).toContain('border-y border-border')
  expect(html).toContain('py-10')
  expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
  expect(html).toContain('h-40 sm:h-48 lg:h-52')
  expect(html).toContain('size-28 sm:size-36 lg:size-40')
  expect(html).toContain('overflow-x-clip')
  expect(html).toContain(
    'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
  )
  expect(html).toContain('text-base leading-7 text-balance text-current/70')
  expect(html).toContain('ml-auto items-end text-right')
  expect(html).toContain('Explore the gallery')
  expect(html.match(/draggable="false"/g)).toHaveLength(5)
})

it('uses the approved immutable percentage geometry and image positions', () => {
  expect(galleryShowcaseTransforms).toEqual([
    { rotate: -19, x: '-120%', y: '0%', zIndex: 1 },
    { rotate: -19, x: '-62%', y: '2%', zIndex: 2 },
    { rotate: 0, x: '0%', y: '-19%', zIndex: 3 },
    { rotate: 12, x: '62%', y: '2%', zIndex: 2 },
    { rotate: 12, x: '120%', y: '0%', zIndex: 1 },
  ])

  const html = renderToStaticMarkup(GalleryShowcase({ images: galleryImages, title: 'Gallery' }))
  for (const position of [
    'center_center',
    'center_top',
    'center_bottom',
    'left_center',
    'right_center',
  ]) {
    expect(html).toContain(`object-[${position}]`)
  }
  expect(html.match(/rounded-md/g)?.length).toBeGreaterThanOrEqual(5)
  expect(html.match(/object-cover/g)).toHaveLength(5)
})

it.each([
  ['compact', 'h-40 sm:h-48 lg:h-52', 'size-28 sm:size-36 lg:size-40'],
  ['default', 'h-44 sm:h-52 lg:h-60', 'size-32 sm:size-40 lg:size-44'],
  ['comfortable', 'h-48 sm:h-60 lg:h-64', 'size-36 sm:size-44 lg:size-48'],
] as const)('applies %s fan and card sizing', (size, fanClasses, cardClasses) => {
  const html = renderToStaticMarkup(
    GalleryShowcase({ images: galleryImages, size, title: 'Gallery' }),
  )
  expect(html).toContain(fanClasses)
  expect(html.split(cardClasses)).toHaveLength(6)
})

it('keeps the Framer Motion boundary client-only and reduced-motion-aware', () => {
  const serverSource = readFileSync('src/components/gallery-showcase.tsx', 'utf8')
  const clientSource = readFileSync('src/components/gallery-showcase-fan.tsx', 'utf8')
  expect(serverSource).not.toContain("from 'framer-motion'")
  expect(serverSource).not.toContain("'use client'")
  expect(clientSource.startsWith("'use client'")).toBe(true)
  expect(clientSource).toContain('useReducedMotion')
  expect(clientSource).toContain('useSyncExternalStore')
  expect(clientSource).toContain('isHydrated && Boolean(prefersReducedMotion)')
  expect(clientSource).toContain('shouldReduceMotion ? false')
  expect(clientSource).toContain('shouldReduceMotion ? undefined')
  expect(clientSource).toContain('dragSnapToOrigin')
})
```

- [ ] **Step 4: Run the test to verify presentation imports fail**

Run the focused Vitest command. Expected: FAIL because the two canonical presentation files do not exist.

- [ ] **Step 5: Implement the focused Client Component**

Create `src/components/gallery-showcase-fan.tsx` with these exported contracts and module-level maps:

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

export type GalleryShowcaseImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type GalleryShowcaseSize = 'comfortable' | 'compact' | 'default'

export type GalleryShowcaseImage = {
  alt: string
  height?: number
  id: number | string
  imagePosition?: GalleryShowcaseImagePosition | null
  src: string
  width?: number
}

export const galleryShowcaseTransforms = [
  { rotate: -19, x: '-120%', y: '0%', zIndex: 1 },
  { rotate: -19, x: '-62%', y: '2%', zIndex: 2 },
  { rotate: 0, x: '0%', y: '-19%', zIndex: 3 },
  { rotate: 12, x: '62%', y: '2%', zIndex: 2 },
  { rotate: 12, x: '120%', y: '0%', zIndex: 1 },
] as const

const fanHeightClasses = {
  compact: 'h-40 sm:h-48 lg:h-52',
  default: 'h-44 sm:h-52 lg:h-60',
  comfortable: 'h-48 sm:h-60 lg:h-64',
} as const

const cardSizeClasses = {
  compact: 'size-28 sm:size-36 lg:size-40',
  default: 'size-32 sm:size-40 lg:size-44',
  comfortable: 'size-36 sm:size-44 lg:size-48',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

const subscribeToHydration = () => () => undefined
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export function GalleryShowcaseFan({
  images,
  size = 'default',
}: {
  images: GalleryShowcaseImage[]
  size?: GalleryShowcaseSize
}) {
  const prefersReducedMotion = useReducedMotion()
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const shouldReduceMotion = isHydrated && Boolean(prefersReducedMotion)

  if (images.length !== 5) return null

  return (
    <div className="w-full overflow-x-clip" data-gallery-showcase-fan="true">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative flex items-center justify-center', fanHeightClasses[size])}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 100 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { bounce: 0.3, duration: 0.7, type: 'spring' }
        }
      >
        {images.map((image, index) => {
          const transform = galleryShowcaseTransforms[index]
          const position = image.imagePosition ?? 'center'

          return (
            <motion.div
              animate={transform}
              className={cn(
                'absolute cursor-grab overflow-hidden rounded-md shadow-xl active:cursor-grabbing',
                cardSizeClasses[size],
              )}
              drag
              dragSnapToOrigin
              initial={
                shouldReduceMotion
                  ? false
                  : { rotate: transform.rotate, x: '0%', y: transform.y, zIndex: transform.zIndex }
              }
              key={`${image.id}-${image.src}`}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      bounce: 0.3,
                      delay: 0.5,
                      duration: 0.7,
                      rotate: { duration: 0.2 },
                      scale: { duration: 0.2 },
                      type: 'spring',
                      y: { duration: 0.2 },
                      zIndex: { duration: 0.2 },
                    }
              }
              whileHover={
                shouldReduceMotion ? undefined : { rotate: 0, scale: 1.1, y: '-12%', zIndex: 20 }
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={image.alt}
                className={cn(
                  'pointer-events-none block size-full object-cover select-none',
                  objectPositionClasses[position],
                )}
                data-gallery-showcase-image-position={position}
                draggable={false}
                height={image.height}
                src={image.src}
                width={image.width}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
```

During implementation, preserve the exact public contracts and classes above. If the installed Framer Motion TypeScript definitions reject percentage strings in `animate`, use `translateX`/`translateY` with the same strings consistently in `initial`, `animate`, and tests; do not fall back to pixel offsets.

- [ ] **Step 6: Implement the server presentation**

Create `src/components/gallery-showcase.tsx`:

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
import {
  GalleryShowcaseFan,
  type GalleryShowcaseImage,
  type GalleryShowcaseImagePosition,
  type GalleryShowcaseSize,
} from '@/components/gallery-showcase-fan'
import { cn } from '@/lib/utils'

export type GalleryShowcaseAlignment = 'center' | 'left' | 'right'
export type { GalleryShowcaseImage, GalleryShowcaseImagePosition, GalleryShowcaseSize }

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const contentMarginClasses = {
  compact: 'mt-10 sm:mt-12 lg:mt-20',
  default: 'mt-12 sm:mt-16 lg:mt-24',
  comfortable: 'mt-14 sm:mt-20 lg:mt-28',
} as const

export function GalleryShowcase({
  actions,
  alignment = 'center',
  appearance,
  className,
  description,
  eyebrow,
  images,
  size = 'default',
  title,
}: {
  actions?: ReactNode
  alignment?: GalleryShowcaseAlignment
  appearance?: BlockAppearance | null
  className?: string
  description?: string | null
  eyebrow?: string | null
  images: GalleryShowcaseImage[]
  size?: GalleryShowcaseSize
  title: string
}) {
  if (images.length !== 5) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
      data-gallery-showcase="true"
      data-gallery-showcase-alignment={alignment}
      data-gallery-showcase-background={appearance?.background ?? 'none'}
      data-gallery-showcase-size={size}
    >
      <div className={regularBlockContainerClasses}>
        <GalleryShowcaseFan images={images} size={size} />
        <div
          className={cn(
            'flex max-w-3xl flex-col gap-4',
            contentMarginClasses[size],
            alignmentClasses[alignment],
          )}
        >
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
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Remove the generated demo using `apply_patch`**

Delete `src/components/gallery20.tsx` after the canonical components compile. Do not delete `framer-motion` from `package.json` or the lockfile.

- [ ] **Step 8: Run the focused test and format the new files**

Run:

```bash
pnpm exec prettier --write src/components/gallery-showcase.tsx src/components/gallery-showcase-fan.tsx tests/int/gallery-showcase.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts
```

Expected: presentation tests PASS; no external image URLs or generated `gallery20` component remain.

---

### Task 3: Resolve Payload values and register the runtime pipeline

**Files:**

- Create: `src/blocks/GalleryShowcase/Component.tsx`
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/gallery-showcase.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes: `GalleryShowcase`, `ContentActions`, `getMediaImageProps`, `resolveCmsActions`, and generated relationship values.
- Produces: `GalleryShowcaseBlockComponent(props)` and `Page['layout'][number]` discriminant `blockType: 'galleryShowcase'`.

- [ ] **Step 1: Add failing adapter and registration tests**

Extend `tests/int/gallery-showcase.int.spec.ts`:

```ts
import { GalleryShowcaseBlockComponent } from '@/blocks/GalleryShowcase/Component'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { Pages } from '@/collections/Pages'

it('resolves exactly five Payload media rows and one shared action', () => {
  const html = renderToStaticMarkup(
    GalleryShowcaseBlockComponent({
      actionMode: 'button',
      actions: [{ label: 'View gallery', linkType: 'custom', url: '/gallery', variant: 'outline' }],
      appearance: { background: 'accent', border: 'top' },
      contentAlignment: 'left',
      description: 'A closer look at our spaces.',
      eyebrow: 'Inside the campus',
      images: galleryImages.map((image) => ({
        image: {
          alt: image.alt,
          height: image.height,
          id: image.id,
          url: image.src,
          width: image.width,
        },
        imagePosition: image.imagePosition,
      })),
      size: 'comfortable',
      title: 'Explore every angle',
    }),
  )

  expect(html).toContain('data-gallery-showcase="true"')
  expect(html).toContain('data-action-mode="button"')
  expect(html).toContain('data-action-variant="outline"')
  expect(html).toContain('href="/gallery"')
  expect(html).toContain('width="1200"')
  expect(html).toContain('height="900"')
  expect(html.match(/<img/g)).toHaveLength(5)
})

it('renders nothing unless the title and all five media rows resolve', () => {
  expect(
    renderToStaticMarkup(GalleryShowcaseBlockComponent({ images: [], title: 'Gallery' })),
  ).toBe('')
  expect(
    renderToStaticMarkup(
      GalleryShowcaseBlockComponent({
        images: galleryImages.slice(0, 4).map((image) => ({
          image: { alt: image.alt, id: image.id, url: image.src },
        })),
        title: 'Gallery',
      }),
    ),
  ).toBe('')
  expect(
    renderToStaticMarkup(
      GalleryShowcaseBlockComponent({
        images: galleryImages.map((image, index) => ({
          image: index === 4 ? null : { alt: image.alt, id: image.id, url: image.src },
        })),
        title: 'Gallery',
      }),
    ),
  ).toBe('')
})

it('registers and renders through the page block pipeline', () => {
  const tabsField = Pages.fields.find((field) => field.type === 'tabs')
  const contentTab = tabsField?.type === 'tabs' ? tabsField.tabs[0] : undefined
  const layoutField = contentTab?.fields.find((field) => 'name' in field && field.name === 'layout')
  const slugs = layoutField?.type === 'blocks' ? layoutField.blocks.map(({ slug }) => slug) : []
  expect(slugs).toContain('galleryShowcase')

  const html = renderToStaticMarkup(
    renderPageBlocks([
      {
        blockType: 'galleryShowcase',
        images: galleryImages.map((image) => ({
          image: { alt: image.alt, id: image.id, url: image.src },
          imagePosition: image.imagePosition,
        })),
        title: 'Gallery pipeline',
      } as never,
    ]),
  )
  expect(html).toContain('data-gallery-showcase="true"')
  expect(html).toContain('Gallery pipeline')
})
```

Update the exact arrays in `tests/int/page-blocks.int.spec.ts` and `tests/int/system-page-blocks.int.spec.ts` by inserting `'galleryShowcase'` immediately after `'profileCarousel'`.

- [ ] **Step 2: Run focused tests and verify the missing adapter/registration failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
```

Expected: FAIL because the adapter and registration do not exist.

- [ ] **Step 3: Implement the server adapter**

Create `src/blocks/GalleryShowcase/Component.tsx`:

```tsx
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { ContentActions } from '@/components/ContentActions'
import {
  GalleryShowcase,
  type GalleryShowcaseAlignment,
  type GalleryShowcaseImage,
  type GalleryShowcaseImagePosition,
  type GalleryShowcaseSize,
} from '@/components/gallery-showcase'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'

type GalleryShowcaseBlockLike = {
  actionMode?: 'button' | 'link' | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: GalleryShowcaseAlignment | null
  description?: string | null
  eyebrow?: string | null
  images?: Array<{
    image?: unknown
    imagePosition?: GalleryShowcaseImagePosition | null
  }> | null
  size?: GalleryShowcaseSize | null
  title?: string | null
}

export function GalleryShowcaseBlockComponent({
  actionMode = 'link',
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  eyebrow,
  images,
  size = 'default',
  title,
}: GalleryShowcaseBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedImages = (images ?? []).flatMap((item): GalleryShowcaseImage[] => {
    const media = item.image as Media | number | string | null | undefined
    const image = getMediaImageProps({ media, preset: 'generic' })
    if (!image) return []

    const mediaID = isMediaDoc(media) ? media.id : image.src
    return [{ ...image, id: mediaID, imagePosition: item.imagePosition }]
  })

  if (!resolvedTitle || resolvedImages.length !== 5) return null

  const alignment = contentAlignment ?? 'center'

  return (
    <GalleryShowcase
      actions={
        <ContentActions
          actions={resolveCmsActions(actions).slice(0, 1)}
          alignment={alignment}
          data-gallery-showcase-actions="true"
          mode={actionMode ?? 'link'}
        />
      }
      alignment={alignment}
      appearance={appearance}
      description={description?.trim() || undefined}
      eyebrow={eyebrow?.trim() || undefined}
      images={resolvedImages}
      size={size ?? 'default'}
      title={resolvedTitle}
    />
  )
}
```

- [ ] **Step 4: Register the block in Pages and the renderer**

In `src/collections/Pages.ts`, import `GalleryShowcaseBlock` and insert it immediately after `ProfileCarouselBlock` in the layout block list.

In `src/blocks/renderPageBlocks.tsx`, import `GalleryShowcaseBlockComponent` and add:

```tsx
case 'galleryShowcase':
  return (
    <GalleryShowcaseBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      {...block}
    />
  )
```

- [ ] **Step 5: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `GalleryShowcaseBlock`, an exact five-row-capable `images` array, and `blockType: 'galleryShowcase'`.

- [ ] **Step 6: Run adapter and registry tests**

Run the three-test command from Step 2. Expected: PASS.

---

### Task 4: Add deterministic block-thumbnail coverage

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Verify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Create: `public/block-thumbnails/gallery-showcase.jpg`

**Interfaces:**

- Consumes: `GalleryShowcaseBlockComponent`, existing repository-local thumbnail assets, and the block-thumbnail generator.
- Produces: `BlockThumbnailSlug` member `galleryShowcase`, metadata URL `/block-thumbnails/gallery-showcase.jpg`, and a deterministic production fixture.

- [ ] **Step 1: Add failing metadata expectations**

In `tests/int/block-thumbnails.int.spec.ts`, add `'galleryShowcase'` to the exact sorted registered slug list and add:

```ts
expect(getBlockThumbnailDefinition('galleryShowcase')).toMatchObject({
  filename: 'gallery-showcase.jpg',
  label: 'Gallery Showcase',
  slug: 'galleryShowcase',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Run thumbnail metadata and fixture tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL because metadata, fixture, and JPEG are missing.

- [ ] **Step 3: Verify the schema-time thumbnail metadata**

Read the Gallery Showcase entry added in Task 1 and confirm it still has exactly this contract:

```ts
defineThumbnail({
  alt: 'Gallery Showcase block preview',
  filename: 'gallery-showcase.jpg',
  label: 'Gallery Showcase',
  slug: 'galleryShowcase',
  stageAlignment: 'top',
}),
```

Do not add a second definition; the manifest must cover every registered block exactly once.

- [ ] **Step 4: Add the real-render fixture**

Import `GalleryShowcaseBlockComponent` in `src/block-thumbnails/fixtures.tsx` and add immediately after `profileCarousel`:

```tsx
galleryShowcase: (
  <GalleryShowcaseBlockComponent
    actionMode="link"
    actions={[{ label: 'Explore the gallery', linkType: 'custom', url: '/gallery' }]}
    appearance={{ background: 'muted', border: 'topAndBottom' }}
    contentAlignment="center"
    description="Five perspectives capture the spaces, people, and shared moments that shape the experience."
    eyebrow="Inside our community"
    images={[
      { image: { alt: 'Editorial landscape', id: 1, url: editorialLandscape } },
      { image: { alt: 'Collaborative environment', id: 2, url: collaboration }, imagePosition: 'top' },
      { image: { alt: 'Community portrait', id: 3, url: portrait }, imagePosition: 'center' },
      { image: { alt: 'Learning environment', id: 4, url: editorialLandscape }, imagePosition: 'right' },
      { image: { alt: 'Shared campus moment', id: 5, url: collaboration }, imagePosition: 'bottom' },
    ]}
    size="compact"
    title="A closer look at life here"
  />
),
```

All five images use the existing `blockThumbnailAssetPaths`; do not add a network URL or random selection.

- [ ] **Step 5: Run metadata and fixture tests before image generation**

Run the Task 4 Step 2 command. Expected: only the exact-JPEG assertion fails because the file has not been generated yet; fixture coverage passes.

- [ ] **Step 6: Generate all thumbnails**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: a success line for every definition, including:

```text
✓ galleryShowcase -> public/block-thumbnails/gallery-showcase.jpg
```

- [ ] **Step 7: Re-run thumbnail tests**

Run the Task 4 Step 2 command. Expected: PASS, and Sharp reports every definition as a 1600×900 JPEG.

---

### Task 5: Complete responsive, reduced-motion, and repository quality gates

**Files:**

- Verify all files listed above.

**Interfaces:**

- Consumes: the complete Gallery Showcase implementation.
- Produces: a formatted, lint-clean, type-generated, tested, unstaged implementation with no registry-demo residue.

- [ ] **Step 1: Verify registry residue and client-boundary constraints**

Run:

```bash
test ! -e src/components/gallery20.tsx
rg -n "Gallery20|gallery20|cloudfront|Math\.random|Date\.now" src tests package.json
rg -n "framer-motion" src
```

Expected: the first command succeeds; no generated component or remote registry images remain; `framer-motion` appears only in `src/components/gallery-showcase-fan.tsx`.

- [ ] **Step 2: Format every touched text file**

Run:

```bash
pnpm exec prettier --write \
  docs/superpowers/specs/2026-07-18-gallery-showcase-block-design.md \
  docs/superpowers/plans/2026-07-18-gallery-showcase-block.md \
  src/blocks/GalleryShowcase/config.ts \
  src/blocks/GalleryShowcase/Component.tsx \
  src/components/gallery-showcase.tsx \
  src/components/gallery-showcase-fan.tsx \
  src/collections/Pages.ts \
  src/blocks/renderPageBlocks.tsx \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  tests/int/gallery-showcase.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  package.json
```

Expected: Prettier exits 0.

- [ ] **Step 3: Run focused integration coverage**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/gallery-showcase.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all selected tests PASS.

- [ ] **Step 4: Run the complete static quality gate**

Run:

```bash
pnpm generate:types
pnpm lint
pnpm exec tsc --noEmit
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 5: Verify the final unstaged scope**

Run:

```bash
git status --short
git diff --stat
git diff -- src/components/ui/button.tsx src/styles/globals.css
```

Expected: Gallery Showcase implementation, tests, generated type/thumbnail, dependency files, spec, and plan are unstaged; the shared Button and global CSS have no Gallery Showcase changes.

- [ ] **Step 6: Review the final behavior in a real browser**

Run `pnpm dev`, open a page containing Gallery Showcase at 390px, 834px, and 1440px widths, and verify:

- exactly five cards remain visible without page-level horizontal scrolling;
- vertical page scrolling works outside the card surface;
- drag snaps back and hover straightens/lifts on pointer-capable devices;
- reduced-motion mode shows all cards directly at rest without entrance or hover transforms;
- Compact, Default, and Comfortable sizes change fan and card dimensions;
- Left, Center, and Right move only the content stack, not the centered fan;
- semantic background, border, action link/button, light mode, and dark mode match neighboring blocks.

Expected: all checks pass without hydration, console, or accessibility errors.
