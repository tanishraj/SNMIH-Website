# Event Gallery Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a newest-first Event Gallery block backed by ordered Gallery Albums, using the Projects 5 card treatment and a full-screen PhotoSwipe viewer with thumbnails.

**Architecture:** A dedicated Payload collection owns album metadata and ordered Media relationships. Server-only loaders normalize published or draft albums into client-safe view models; public and live-preview block components share one presentation layer, while focused client components own album selection and PhotoSwipe lifecycle.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript, Tailwind CSS 4, shadcn/ui radix-luma, Framer Motion 12, PhotoSwipe, Vitest, Testing Library, Playwright

## Global Constraints

- The collection slug is `gallery-albums`; the page-block slug is `eventGallery`.
- Gallery Albums are separate from the existing editorial Tags collection.
- Every published album is displayed automatically; there is no per-page album selector.
- Albums are sorted by `createdAt` descending; `eventDate` never controls ordering.
- The first valid ordered image is the album cover.
- Album cards adapt `@shadcnblocks/projects5`; the full-screen viewer adapts `@shadcnblocks/product-gallery2`.
- Existing Media assets can be reused across albums and cannot be deleted while referenced.
- The block uses shared appearance, alignment, size, container, typography, and spacing patterns.
- The viewer includes previous, next, close, counter, thumbnails, keyboard navigation, focus restoration, touch gestures, and zoom.
- A single-image album hides previous, next, and thumbnail controls.
- Public pages show published albums only; authenticated page preview can show draft albums.
- No changes to Gallery Showcase, Image Mosaic, editorial Tags, or frontend uploads.

---

## File map

**Create**

- `src/collections/GalleryAlbums.ts` — Payload schema and access rules.
- `src/lib/eventGalleryShared.ts` — serializable album types and normalization.
- `src/lib/eventGallery.ts` — server-only published/draft album loader.
- `src/blocks/EventGallery/config.ts` — Payload page-block schema.
- `src/blocks/EventGallery/Presentation.tsx` — shared public/preview presentation.
- `src/blocks/EventGallery/Component.tsx` — published-data server component.
- `src/blocks/EventGallery/PreviewComponent.tsx` — draft-snapshot preview adapter.
- `src/components/event-gallery.tsx` — aligned heading and album-grid shell.
- `src/components/event-gallery-client.tsx` — Projects 5 card grid and selection state.
- `src/components/event-gallery-viewer.tsx` — PhotoSwipe lifecycle and thumbnail UI.
- `tests/int/gallery-albums.int.spec.ts` — collection and loader contract.
- `tests/int/event-gallery-render.int.spec.tsx` — presentation and grid behavior.
- `tests/int/event-gallery-viewer.int.spec.tsx` — viewer interaction contract.
- `public/block-thumbnails/event-gallery.jpg` — generated 1600×900 preview.

**Modify**

- `package.json` and `pnpm-lock.yaml` — PhotoSwipe and registry dependencies.
- `src/payload.config.ts` — collection registration.
- `src/collections/Pages.ts` — Event Gallery block registration.
- `src/lib/mediaUsage.ts` — Gallery Album image references.
- `src/blocks/renderPageBlocks.tsx` — public render case.
- `src/blocks/renderLivePreviewPageBlocks.tsx` — preview render case and snapshot parameter.
- `src/app/(frontend)/preview/page/[id]/page.tsx` — draft-album snapshot loading.
- `src/components/live-preview/PageLivePreview.tsx` — client-safe album snapshot prop.
- `src/block-thumbnails/definitions.ts` — Event Gallery thumbnail metadata.
- `src/block-thumbnails/fixtures.tsx` — deterministic Event Gallery fixture.
- `src/payload-types.ts` — generated schema types.
- `tests/int/media-governance.int.spec.ts` — deletion protection coverage.
- `tests/int/page-blocks.int.spec.ts` — block registration.
- `tests/int/live-preview-renderer.int.spec.tsx` — draft snapshot rendering.
- `tests/int/live-preview-import-boundary.int.spec.ts` — server-loader boundary.
- `tests/int/block-thumbnails.int.spec.ts` — metadata and dimensions.

### Task 1: Acquire and review the registry foundations

**Files:**
- Create temporarily: `src/components/projects5.tsx`
- Create temporarily: `src/components/product-gallery2.tsx`
- Create if missing: `src/components/ui/aspect-ratio.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: configured `@shadcnblocks` registry, `@/lib/utils`, existing Button, Badge, and Carousel primitives.
- Produces: local Projects 5 and Product Gallery 2 source references plus the `photoswipe` dependency.

- [ ] **Step 1: Inspect docs and preview the installation**

```bash
pnpm dlx shadcn@latest docs aspect-ratio badge button carousel
pnpm dlx shadcn@latest add @shadcnblocks/projects5 @shadcnblocks/product-gallery2 --dry-run
```

Expected: the CLI reports Projects 5, Product Gallery 2, `aspect-ratio`, and `photoswipe`; it does not request overwriting locally modified UI primitives.

- [ ] **Step 2: Install both registry sources**

```bash
pnpm dlx shadcn@latest add @shadcnblocks/projects5 @shadcnblocks/product-gallery2
```

Expected: Projects 5 and Product Gallery 2 source files are added, existing UI primitives remain intact, and `photoswipe` is recorded in `package.json` and `pnpm-lock.yaml`.

- [ ] **Step 3: Verify the injected source before adaptation**

```bash
rg -n "projects5prop|PhotoSwipeLightbox|from \"@/lib/utils\"|from \"@/components/ui" src/components
pnpm exec tsc --noEmit
```

Expected: both registry implementations and alias-correct imports are present; TypeScript exits `0`.

- [ ] **Step 4: Commit the reviewed registry baseline**

```bash
git add package.json pnpm-lock.yaml src/components/projects5.tsx src/components/product-gallery2.tsx src/components/ui/aspect-ratio.tsx
git commit -m "chore: add gallery registry sources"
```

Expected: one baseline commit containing only registry output and dependency changes.

### Task 2: Add the Gallery Albums collection

**Files:**
- Create: `src/collections/GalleryAlbums.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/payload-types.ts`
- Create: `tests/int/gallery-albums.int.spec.ts`

**Interfaces:**
- Consumes: `slugField`, `allowPublicReadOrCapability`, `hideFromUsersWithoutCapability`, `requireCapability`, and Media uploads.
- Produces: collection slug `gallery-albums` with generated type `GalleryAlbum`.

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from 'vitest'

import { GalleryAlbums } from '@/collections/GalleryAlbums'
import config from '@/payload.config'

describe('gallery albums collection', () => {
  it('defines ordered published albums managed through Media capability', async () => {
    const resolvedConfig = await config
    const tabs = GalleryAlbums.fields[0] as {
      tabs: Array<{ fields: Array<Record<string, unknown>>; label: string }>
      type: string
    }
    const content = tabs.tabs.find((tab) => tab.label === 'Content')
    const images = content?.fields.find((field) => field.name === 'images') as {
      fields?: Array<Record<string, unknown>>
      minRows?: number
      required?: boolean
      type?: string
    }

    expect(GalleryAlbums.slug).toBe('gallery-albums')
    expect(GalleryAlbums.versions).toEqual({ drafts: true })
    expect(GalleryAlbums.admin).toMatchObject({
      group: 'Website Content',
      useAsTitle: 'title',
    })
    expect(images).toMatchObject({ minRows: 1, required: true, type: 'array' })
    expect(images.fields?.map((field) => field.name)).toEqual(['image', 'caption'])
    expect(images.fields?.[0]).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    expect(
      resolvedConfig.collections?.some((collection) => collection.slug === 'gallery-albums'),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-albums.int.spec.ts
```

Expected: FAIL because `@/collections/GalleryAlbums` does not exist.

- [ ] **Step 3: Create the collection**

```ts
import { slugField, type CollectionConfig } from 'payload'

import {
  allowPublicReadOrCapability,
  hideFromUsersWithoutCapability,
  requireCapability,
} from '@/access/adminCapabilities'

export const GalleryAlbums: CollectionConfig = {
  slug: 'gallery-albums',
  labels: { singular: 'Gallery Album', plural: 'Gallery Albums' },
  admin: {
    group: 'Website Content',
    hidden: hideFromUsersWithoutCapability('manage_media'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventDate', 'createdAt', 'updatedAt'],
    description: 'Ordered image albums displayed by the Event Gallery block.',
  },
  access: {
    create: requireCapability('manage_media'),
    delete: requireCapability('manage_media'),
    read: allowPublicReadOrCapability('manage_media'),
    readVersions: requireCapability('manage_media'),
    update: requireCapability('manage_media'),
  },
  versions: { drafts: true },
  timestamps: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true },
            slugField({ useAsSlug: 'title' }),
            { name: 'description', type: 'textarea' },
            { name: 'eventDate', label: 'Event Date', type: 'date' },
            {
              name: 'images',
              type: 'array',
              required: true,
              minRows: 1,
              admin: {
                description: 'The first image is used as the album cover. Drag rows to reorder.',
                initCollapsed: true,
              },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'textarea' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
```

Import `GalleryAlbums` in `src/payload.config.ts` and add it immediately after `Media` in `collections`.

- [ ] **Step 4: Generate the collection type**

```bash
pnpm generate:types
rg -n "export interface GalleryAlbum|gallery-albums" src/payload-types.ts
```

Expected: generation succeeds and both the `GalleryAlbum` interface and `gallery-albums` collection key are present.

- [ ] **Step 5: Run the schema test**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-albums.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the collection**

```bash
git add src/collections/GalleryAlbums.ts src/payload.config.ts src/payload-types.ts tests/int/gallery-albums.int.spec.ts
git commit -m "feat: add gallery albums collection"
```

### Task 3: Normalize and load albums newest-first

**Files:**
- Create: `src/lib/eventGalleryShared.ts`
- Create: `src/lib/eventGallery.ts`
- Modify: `tests/int/gallery-albums.int.spec.ts`

**Interfaces:**
- Consumes: generated `GalleryAlbum` and `Media` documents plus `getMediaImageProps`.
- Produces:
  - `EventGalleryImage`
  - `EventGalleryAlbum`
  - `normalizeEventGalleryAlbums(value: unknown): EventGalleryAlbum[]`
  - `getPublishedEventGalleryAlbums(): Promise<EventGalleryAlbum[]>`
  - `getDraftEventGalleryAlbums(): Promise<EventGalleryAlbum[]>`

- [ ] **Step 1: Add failing normalization and query tests**

```ts
const find = vi.fn()
vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ find })) }))

it('normalizes valid images, uses the first as cover, and sorts newest first', async () => {
  const albums = normalizeEventGalleryAlbums([
    {
      id: 1,
      title: 'Yoga Day',
      createdAt: '2026-06-21T00:00:00.000Z',
      images: [
        {
          id: 'row-1',
          image: { id: 10, alt: 'Yoga session', url: '/media/yoga.jpg', width: 1600, height: 900 },
          caption: 'Morning session',
        },
      ],
    },
    {
      id: 2,
      title: 'New Batch Day',
      createdAt: '2026-07-25T00:00:00.000Z',
      images: [
        {
          id: 'row-2',
          image: { id: 11, alt: 'New students', url: '/media/batch.jpg', width: 1600, height: 900 },
        },
        { id: 'broken', image: 999 },
      ],
    },
  ])

  expect(albums.map((album) => album.title)).toEqual(['New Batch Day', 'Yoga Day'])
  expect(albums[0]).toMatchObject({
    cover: { src: '/media/batch.jpg' },
    imageCount: 1,
  })
  expect(albums[1].images[0].caption).toBe('Morning session')
})

it('queries published and draft albums newest first without pagination', async () => {
  find.mockResolvedValue({ docs: [] })

  await getPublishedEventGalleryAlbums()
  await getDraftEventGalleryAlbums()

  expect(find).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      collection: 'gallery-albums',
      depth: 1,
      draft: false,
      pagination: false,
      sort: '-createdAt',
      where: { _status: { equals: 'published' } },
    }),
  )
  expect(find).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      collection: 'gallery-albums',
      depth: 1,
      draft: true,
      pagination: false,
      sort: '-createdAt',
    }),
  )
})
```

- [ ] **Step 2: Run the focused test and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-albums.int.spec.ts
```

Expected: FAIL because the shared normalizer and server loader do not exist.

- [ ] **Step 3: Implement the shared view models and normalizer**

```ts
import { getMediaImageProps, isMediaDoc } from '@/lib/media'
import type { GalleryAlbum, Media } from '@/payload-types'

export type EventGalleryImage = {
  alt: string
  caption?: string
  height: number
  id: number | string
  src: string
  width: number
}

export type EventGalleryAlbum = {
  cover: EventGalleryImage
  createdAt: string
  description?: string
  eventDate?: string
  id: number | string
  imageCount: number
  images: EventGalleryImage[]
  title: string
}

export function normalizeEventGalleryAlbums(value: unknown): EventGalleryAlbum[] {
  const albums = Array.isArray(value) ? (value as GalleryAlbum[]) : []

  return albums
    .flatMap((album): EventGalleryAlbum[] => {
      const title = album.title?.trim()
      const images = (album.images ?? []).flatMap((row): EventGalleryImage[] => {
        const media = row.image as Media | number | string | null
        const image = getMediaImageProps({ media, preset: 'generic' })
        if (!image || !isMediaDoc(media)) return []

        return [{
          alt: image.alt,
          caption: row.caption?.trim() || undefined,
          height: image.height ?? 900,
          id: row.id ?? media.id,
          src: image.src,
          width: image.width ?? 1600,
        }]
      })

      if (!title || !images.length) return []

      return [{
        cover: images[0],
        createdAt: album.createdAt,
        description: album.description?.trim() || undefined,
        eventDate: album.eventDate || undefined,
        id: album.id,
        imageCount: images.length,
        images,
        title,
      }]
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}
```

- [ ] **Step 4: Implement the server-only loader**

```ts
import 'server-only'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { normalizeEventGalleryAlbums } from '@/lib/eventGalleryShared'

const loadEventGalleryAlbums = cache(async (draft: boolean) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'gallery-albums',
    depth: 1,
    draft,
    pagination: false,
    sort: '-createdAt',
    ...(draft ? {} : { where: { _status: { equals: 'published' } } }),
  })

  return normalizeEventGalleryAlbums(result.docs)
})

export const getPublishedEventGalleryAlbums = () => loadEventGalleryAlbums(false)
export const getDraftEventGalleryAlbums = () => loadEventGalleryAlbums(true)
```

- [ ] **Step 5: Run the focused test and commit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-albums.int.spec.ts
git add src/lib/eventGalleryShared.ts src/lib/eventGallery.ts tests/int/gallery-albums.int.spec.ts
git commit -m "feat: load event gallery albums"
```

Expected: PASS, followed by one focused commit.

### Task 4: Protect album images through media governance

**Files:**
- Modify: `src/lib/mediaUsage.ts`
- Modify: `tests/int/media-governance.int.spec.ts`

**Interfaces:**
- Consumes: `gallery-albums[].images[].image`.
- Produces: usage references such as `Gallery Albums > Yoga Day > images[0].image`.

- [ ] **Step 1: Extend the failing governance fixture**

Add this `find` branch:

```ts
case 'gallery-albums':
  return {
    docs: [{
      id: 70,
      title: 'Yoga Day',
      images: [{ image: 7 }, { image: { id: 8 } }],
    }],
  }
```

Add this expected reference:

```ts
expect.objectContaining({
  documentID: 70,
  documentLabel: 'Yoga Day',
  fieldPath: 'images[0].image',
  locationLabel: 'Gallery Albums > Yoga Day > images[0].image',
  sourceSlug: 'gallery-albums',
  sourceType: 'collection',
})
```

Increase the expected reference count from `12` to `13`, while the entry count increases from `9` to `10`.

- [ ] **Step 2: Verify the governance test fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-governance.int.spec.ts
```

Expected: FAIL because `gallery-albums` is not scanned.

- [ ] **Step 3: Add the Gallery Albums resolver**

Add `'gallery-albums': 'Gallery Albums'` to `mediaUsageSourceLabelByCollection`, then add:

```ts
{
  slug: 'gallery-albums',
  sourceLabel: 'Gallery Albums',
  getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Gallery Album'),
  resolve: (doc, mediaID) => {
    const documentLabel = getTextValue(doc.title, 'Untitled Gallery Album')
    const references: MediaUsageReference[] = []
    const images = Array.isArray(doc.images) ? doc.images : []

    images.forEach((row, index) => {
      if (!row || typeof row !== 'object') return
      pushIfMatched({
        mediaID,
        reference: createCollectionReference({
          doc,
          documentLabel,
          fieldPath: `images[${index}].image`,
          slug: 'gallery-albums',
        }),
        references,
        value: row.image as RelationshipValue,
      })
    })

    return references
  },
},
```

- [ ] **Step 4: Run and commit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-governance.int.spec.ts
git add src/lib/mediaUsage.ts tests/int/media-governance.int.spec.ts
git commit -m "feat: protect gallery album media"
```

Expected: PASS.

### Task 5: Add and register the Event Gallery block contract

**Files:**
- Create: `src/blocks/EventGallery/config.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Create: `tests/int/event-gallery-render.int.spec.tsx`

**Interfaces:**
- Consumes: shared appearance fields and thumbnail manifest.
- Produces: Payload block slug `eventGallery` and type `EventGalleryBlock`.

- [ ] **Step 1: Write failing schema and registration assertions**

```ts
it('defines and registers the Event Gallery block', async () => {
  const { EventGalleryBlock } = await import('@/blocks/EventGallery/config')
  const tabs = EventGalleryBlock.fields[0] as {
    tabs: Array<{ fields: Array<Record<string, unknown>>; label: string }>
  }
  const content = tabs.tabs.find((tab) => tab.label === 'Content')
  const layout = tabs.tabs.find((tab) => tab.label === 'Layout & Theme')

  expect(EventGalleryBlock).toMatchObject({
    slug: 'eventGallery',
    interfaceName: 'EventGalleryBlock',
    labels: { singular: 'Event Gallery', plural: 'Event Galleries' },
  })
  expect(content?.fields.map((field) => field.name)).toEqual(['eyebrow', 'title', 'description'])
  expect(content?.fields.find((field) => field.name === 'title')).toMatchObject({ required: true })
  expect(layout?.fields.map((field) => field.name)).toEqual([
    'appearance',
    'contentAlignment',
    'size',
  ])
})
```

Also insert `'eventGallery'` after `'galleryShowcase'` in the exact Pages block-slug expectation.

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx tests/int/page-blocks.int.spec.ts
```

Expected: FAIL because the block does not exist or is not registered.

- [ ] **Step 3: Add the thumbnail identity required by the block config**

Add this manifest entry beside the other gallery definitions:

```ts
defineThumbnail({
  alt: 'Event Gallery block preview',
  filename: 'event-gallery.jpg',
  label: 'Event Gallery',
  slug: 'eventGallery',
  stageAlignment: 'top',
})
```

- [ ] **Step 4: Create the block config**

```ts
import type { Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

const contentAlignmentField = {
  name: 'contentAlignment',
  label: 'Content Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField

const sizeField = {
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
} satisfies SelectField

export const EventGalleryBlock: Block = {
  slug: 'eventGallery',
  interfaceName: 'EventGalleryBlock',
  admin: getBlockThumbnailAdmin('eventGallery'),
  labels: { singular: 'Event Gallery', plural: 'Event Galleries' },
  fields: [{
    type: 'tabs',
    tabs: [
      {
        label: 'Content',
        fields: [
          { name: 'eyebrow', type: 'text' },
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'textarea' },
        ],
      },
      {
        label: 'Layout & Theme',
        fields: [
          createBlockAppearanceFields({ includeTextOverride: false }),
          contentAlignmentField,
          sizeField,
        ],
      },
    ],
  } satisfies TabsField],
}
```

- [ ] **Step 5: Register the block in Pages**

Import `EventGalleryBlock` and place it immediately after `GalleryShowcaseBlock` in the Pages `layout.blocks` array.

- [ ] **Step 6: Run tests and commit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx tests/int/page-blocks.int.spec.ts
git add src/blocks/EventGallery/config.ts src/collections/Pages.ts src/block-thumbnails/definitions.ts tests/int/event-gallery-render.int.spec.tsx tests/int/page-blocks.int.spec.ts
git commit -m "feat: register event gallery block"
```

Expected: PASS.

### Task 6: Adapt Projects 5 into the aligned album grid

**Files:**
- Create: `src/components/event-gallery.tsx`
- Create: `src/components/event-gallery-client.tsx`
- Delete after adaptation: `src/components/projects5.tsx`
- Create: `src/blocks/EventGallery/Presentation.tsx`
- Modify: `tests/int/event-gallery-render.int.spec.tsx`

**Interfaces:**
- Consumes: `EventGalleryAlbum[]`, `BlockAppearance`, alignment, and size.
- Produces:
  - `EventGallery`
  - `EventGalleryClient`
  - `EventGalleryBlockPresentation`

- [ ] **Step 1: Add failing presentation assertions**

```ts
const albums: EventGalleryAlbum[] = [
  {
    id: 'new-batch',
    title: 'New Batch Day',
    createdAt: '2026-07-25T00:00:00.000Z',
    eventDate: '2026-07-24T00:00:00.000Z',
    imageCount: 2,
    cover: { id: 1, src: '/batch.jpg', alt: 'New batch', width: 1600, height: 900 },
    images: [
      { id: 1, src: '/batch.jpg', alt: 'New batch', width: 1600, height: 900 },
      { id: 2, src: '/class.jpg', alt: 'Classroom', width: 1600, height: 900 },
    ],
  },
]

it('renders the aligned Projects 5 album grid', () => {
  const html = renderToStaticMarkup(
    <EventGalleryBlockPresentation
      albums={albums}
      contentAlignment="center"
      eyebrow="Campus moments"
      size="compact"
      title="Event gallery"
    />,
  )

  expect(html).toContain('data-event-gallery="true"')
  expect(html).toContain('data-event-gallery-size="compact"')
  expect(html).toContain('data-event-gallery-album-count="1"')
  expect(html).toContain('New Batch Day')
  expect(html).toContain('2 images')
  expect(html).toContain('max-w-screen-2xl')
  expect(html).toContain('text-3xl')
})

it('renders nothing without a title or valid albums', () => {
  expect(renderToStaticMarkup(<EventGalleryBlockPresentation albums={[]} title="Gallery" />)).toBe('')
})
```

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx
```

Expected: FAIL because presentation components do not exist.

- [ ] **Step 3: Implement the aligned shell**

`event-gallery.tsx` must use:

```ts
regularBlockContainerClasses
regularBlockMobilePaddingClasses[size]
resolveBlockAppearanceClasses(appearance)
```

Render the established eyebrow, `text-3xl font-semibold tracking-tight sm:text-4xl` title, `text-base leading-7 text-current/70` description, and pass albums to `EventGalleryClient`. Return `null` when the trimmed title or albums are empty.

- [ ] **Step 4: Adapt the Projects 5 cards**

Move the registry behavior into `event-gallery-client.tsx`:

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'

import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const formatEventDate = (value?: string) => {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? undefined
    : new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date)
}

export function EventGalleryClient({ albums }: { albums: EventGalleryAlbum[] }) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
      data-event-gallery-album-count={albums.length}
    >
      {albums.map((album, index) => {
        const eventDate = formatEventDate(album.eventDate)
        const countLabel = `${album.imageCount} ${album.imageCount === 1 ? 'image' : 'images'}`

        return (
          <motion.article
            className="group overflow-hidden rounded-lg border border-border"
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            key={album.id}
            transition={{ delay: Math.min(index, 5) * 0.08, duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                alt={album.cover.alt}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                src={album.cover.src}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight">{album.title}</h3>
                {eventDate ? (
                  <p className="mt-1 text-sm text-muted-foreground">{eventDate}</p>
                ) : null}
              </div>
              <span
                className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold"
                data-event-gallery-image-count
              >
                {countLabel}
              </span>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
```

This task intentionally finishes the visual Projects 5 adaptation before interaction is added. In Task 7, replace the card's cover and metadata wrapper with:

```tsx
<button
  aria-label={`Open ${album.title} gallery`}
  className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  onClick={(event) => {
    triggerRef.current = event.currentTarget
    setActiveAlbum(album)
  }}
  type="button"
>
  <div className="relative aspect-[16/10] overflow-hidden">
    <Image
      alt={album.cover.alt}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      fill
      sizes="(min-width: 768px) 50vw, 100vw"
      src={album.cover.src}
    />
  </div>
  <div className="flex items-center justify-between gap-4 p-5">
    <div className="min-w-0">
      <h3 className="text-lg font-semibold tracking-tight">{album.title}</h3>
      {eventDate ? <p className="mt-1 text-sm text-muted-foreground">{eventDate}</p> : null}
    </div>
    <span
      className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold"
      data-event-gallery-image-count
    >
      {countLabel}
    </span>
  </div>
</button>
```

Then render:

```tsx
<EventGalleryViewer
  album={activeAlbum}
  onClose={() => {
    setActiveAlbum(null)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }}
/>
```

Remove `projects5.tsx` after its scroll-motion, image-hover, bordered-card, and two-column behavior is represented in the new component.

- [ ] **Step 5: Implement the block presentation adapter**

`EventGalleryBlockPresentation` trims content, defaults alignment to `left` and size to `default`, and passes `albums` unchanged into `EventGallery`.

- [ ] **Step 6: Run and commit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx
git add src/components/event-gallery.tsx src/components/event-gallery-client.tsx src/blocks/EventGallery/Presentation.tsx tests/int/event-gallery-render.int.spec.tsx
git add -u src/components/projects5.tsx
git commit -m "feat: add event gallery album grid"
```

Expected: PASS.

### Task 7: Adapt Product Gallery 2 into the full-screen viewer

**Files:**
- Create: `src/components/event-gallery-viewer.tsx`
- Modify: `src/components/event-gallery-client.tsx`
- Delete after adaptation: `src/components/product-gallery2.tsx`
- Create: `tests/int/event-gallery-viewer.int.spec.tsx`

**Interfaces:**
- Consumes: `album: EventGalleryAlbum | null` and `onClose(): void`.
- Produces: `EventGalleryViewer`, which opens PhotoSwipe at index zero and registers the thumbnail UI.

- [ ] **Step 1: Write the failing viewer interaction test**

Mock `photoswipe/lightbox` with captured `on`, `init`, `loadAndOpen`, and `destroy` methods. Render `EventGalleryClient`, click `Open Yoga Day gallery`, and assert:

```ts
expect(lightbox.loadAndOpen).toHaveBeenCalledWith(0)
expect(lightbox.options.dataSource).toHaveLength(2)
expect(lightbox.options.dataSource[0]).toMatchObject({
  alt: 'Yoga session',
  height: 900,
  src: '/yoga.jpg',
  width: 1600,
})
```

Invoke the captured `uiRegister` handler with a fake PhotoSwipe UI, assert that it registers `event-gallery-thumbnails`, invoke its `onInit`, click the second generated thumbnail, and expect `pswp.goTo(1)`.

Invoke the captured `destroy` handler and expect focus to return to the album button.

Add a one-image case and assert the thumbnail registration is skipped.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: FAIL because `EventGalleryViewer` does not exist.

- [ ] **Step 3: Implement the PhotoSwipe adapter**

Update `event-gallery-client.tsx` with:

```ts
import { useRef, useState } from 'react'

import { EventGalleryViewer } from '@/components/event-gallery-viewer'

const [activeAlbum, setActiveAlbum] = useState<EventGalleryAlbum | null>(null)
const triggerRef = useRef<HTMLButtonElement | null>(null)
```

Use the exact interactive button and `EventGalleryViewer` JSX defined at the end of Task 6.

Create a client viewer component that:

```ts
const lightbox = new PhotoSwipeLightbox({
  dataSource: album.images.map((image) => ({
    alt: image.alt,
    height: image.height,
    src: image.src,
    width: image.width,
  })),
  bgOpacity: 1,
  mainClass: 'event-gallery-lightbox',
  pswpModule: () => import('photoswipe'),
  wheelToZoom: true,
})
```

Register a bottom thumbnail container only when `album.images.length > 1`. Build thumbnail buttons with `document.createElement`, set `aria-label`, append safe `HTMLImageElement` nodes, call `pswp.goTo(index)` on click, and update `aria-current` plus ring classes on PhotoSwipe `change`.

Use PhotoSwipe's built-in previous, next, counter, zoom, keyboard, touch, focus trap, and close behavior. Register an optional caption element whose `textContent` is updated from `album.images[pswp.currIndex]?.caption`, avoiding HTML injection. Subscribe to `destroy` and call `onClose` exactly once. Call `init()` followed by `loadAndOpen(0)`, and destroy the instance during effect cleanup.

Import `photoswipe/style.css`.

- [ ] **Step 4: Remove the registry reference component**

Delete `src/components/product-gallery2.tsx` after its PhotoSwipe setup and shadcn styling have been represented in `event-gallery-viewer.tsx`.

- [ ] **Step 5: Run and commit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
git add src/components/event-gallery-viewer.tsx src/components/event-gallery-client.tsx tests/int/event-gallery-viewer.int.spec.tsx
git add -u src/components/product-gallery2.tsx
git commit -m "feat: add fullscreen gallery viewer"
```

Expected: viewer and grid tests pass.

### Task 8: Connect public rendering and draft-aware live preview

**Files:**
- Create: `src/blocks/EventGallery/Component.tsx`
- Create: `src/blocks/EventGallery/PreviewComponent.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Modify: `src/components/live-preview/PageLivePreview.tsx`
- Modify: `tests/int/event-gallery-render.int.spec.tsx`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: `tests/int/live-preview-import-boundary.int.spec.ts`

**Interfaces:**
- Consumes: published and draft album loaders.
- Produces: public render case and client-safe `eventGalleryAlbums: EventGalleryAlbum[]` preview snapshot.

- [ ] **Step 1: Add failing public and preview assertions**

Mock `getPublishedEventGalleryAlbums` and assert `EventGalleryBlockComponent` renders its returned album. Extend `renderLivePreviewPageBlocks` tests with an `eventGallery` layout block and a draft album snapshot, asserting the draft album title appears.

Add `src/lib/eventGallery.ts` to the server-only paths that must not enter the `PageLivePreview` client graph.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: FAIL because public/preview adapters and snapshot plumbing are missing.

- [ ] **Step 3: Add public and preview adapters**

```tsx
export async function EventGalleryBlockComponent(props: EventGalleryBlockLike) {
  const albums = await getPublishedEventGalleryAlbums()
  return <EventGalleryBlockPresentation {...props} albums={albums} />
}

export function EventGalleryPreviewBlockComponent(
  props: EventGalleryBlockLike & { albums: EventGalleryAlbum[] },
) {
  return <EventGalleryBlockPresentation {...props} albums={props.albums} />
}
```

- [ ] **Step 4: Add renderer cases and snapshot plumbing**

Add `eventGallery` cases to both renderers. Extend `renderLivePreviewPageBlocks`, `PageLivePreview` props, and its call with `eventGalleryAlbums`.

In the authenticated preview page:

```ts
const hasEventGallery =
  page.layout?.some((block) => block.blockType === 'eventGallery') ?? false

const [reviewSnapshot, newsEventsSnapshot, officeLocations, eventGalleryAlbums] =
  await Promise.all([
    loadReviewPreviewSnapshot(page.layout),
    loadNewsEventsPreviewSnapshot(page.layout),
    hasContact24 ? getDraftSiteOfficeLocations() : Promise.resolve([]),
    hasEventGallery ? getDraftEventGalleryAlbums() : Promise.resolve([]),
  ])
```

Pass `eventGalleryAlbums` into `PageLivePreview`.

- [ ] **Step 5: Run and commit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
git add src/blocks/EventGallery src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' src/components/live-preview/PageLivePreview.tsx tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
git commit -m "feat: render event gallery data"
```

Expected: all three focused files pass.

### Task 9: Add thumbnail metadata, fixture, generated types, and final verification

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `src/payload-types.ts`
- Modify if generated: `src/app/(payload)/admin/importMap.js`
- Create: `public/block-thumbnails/event-gallery.jpg`

**Interfaces:**
- Consumes: Event Gallery presentation with deterministic local albums.
- Produces: thumbnail slug `eventGallery`, generated JPEG, and current Payload types.

- [ ] **Step 1: Add failing thumbnail assertions**

```ts
expect(getBlockThumbnailDefinition('eventGallery')).toMatchObject({
  alt: 'Event Gallery block preview',
  filename: 'event-gallery.jpg',
  label: 'Event Gallery',
  slug: 'eventGallery',
  stageAlignment: 'top',
})
```

Add `eventGallery` to registered-slug expectations. The existing fixture-coverage test must also fail until a fixture is added.

- [ ] **Step 2: Run and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL for missing definition and fixture.

- [ ] **Step 3: Add the deterministic fixture**

Add an `eventGallery` fixture with two complete `EventGalleryAlbum` objects and repository-local `editorialLandscape`, `collaboration`, and `portrait` assets. Each image object includes `id`, `src`, `alt`, `width: 1600`, and `height: 900`. Use `EventGalleryBlockPresentation` directly with `eyebrow="Campus moments"`, `title="Event gallery"`, `size="compact"`, and `appearance={{ background: 'muted', border: 'topAndBottom' }}` so fixture generation never queries Payload.

- [ ] **Step 4: Generate schema artifacts**

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: `GalleryAlbum`, `EventGalleryBlock`, and `gallery-albums` select types appear in `src/payload-types.ts`; import-map generation succeeds.

- [ ] **Step 5: Generate the Event Gallery thumbnail**

With the development server available on port 3000:

```bash
BLOCK_THUMBNAIL_BASE_URL=http://localhost:3000 BLOCK_THUMBNAIL_SLUG=eventGallery pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/event-gallery.jpg` is created at exactly 1600×900.

- [ ] **Step 6: Run focused and full validation**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/gallery-albums.int.spec.ts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-viewer.int.spec.tsx \
  tests/int/media-governance.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec eslint \
  src/collections/GalleryAlbums.ts \
  src/lib/eventGallery.ts \
  src/lib/eventGalleryShared.ts \
  src/blocks/EventGallery \
  src/components/event-gallery.tsx \
  src/components/event-gallery-client.tsx \
  src/components/event-gallery-viewer.tsx \
  src/lib/mediaUsage.ts \
  src/collections/Pages.ts \
  src/blocks/renderPageBlocks.tsx \
  src/blocks/renderLivePreviewPageBlocks.tsx \
  src/components/live-preview/PageLivePreview.tsx \
  tests/int/gallery-albums.int.spec.ts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-viewer.int.spec.tsx
git diff --check
```

Expected: all focused tests, ESLint, and diff checks exit `0`.

- [ ] **Step 7: Verify live routes and interactions**

```bash
curl --noproxy '*' -sS -o /tmp/event-gallery-admin.html -w '%{http_code}\n' http://localhost:3000/admin
curl --noproxy '*' -sS http://localhost:3000/block-thumbnail-previews/eventGallery | rg 'Event Gallery'
```

Expected: admin returns `200`; preview returns `200` and contains Event Gallery. In the browser, create two published albums, confirm the newest-created album appears first, open an album, navigate with buttons and thumbnails, close with Escape, and confirm focus returns to the originating card.

- [ ] **Step 8: Commit the completed feature**

```bash
git add src/block-thumbnails/fixtures.tsx src/payload-types.ts 'src/app/(payload)/admin/importMap.js' tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts public/block-thumbnails/event-gallery.jpg
git commit -m "feat: add event gallery block"
```

Expected: one final integration commit, followed by an empty `git status --short`.
