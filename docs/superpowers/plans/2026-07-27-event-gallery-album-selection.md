# Event Gallery Album Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors select or create the Gallery Albums shown by each Event Gallery block and choose manual order or automatic Event Date order.

**Architecture:** The Payload block stores a sortable multi-relationship and an ordering mode. Shared client-safe helpers extract selected IDs and apply deterministic ordering, while the server-only loader queries only those IDs. Public rendering resolves published selections; authenticated live preview loads the union of selected draft-aware albums once and lets each block filter and order that shared snapshot independently.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, React 19, TypeScript, Vitest, PhotoSwipe

## Global Constraints

- `galleryAlbums` is a required `hasMany` relationship to `gallery-albums`.
- Editors with collection create access can create Gallery Albums from the relationship drawer.
- Selected relationship values are sortable for manual ordering.
- `displayOrder` supports `latestEventDate` and `manual`; its default is `latestEventDate`.
- Latest Event Date mode sorts dated albums first by `eventDate` descending, then by `createdAt` descending.
- Albums without a valid Event Date sort after dated albums, by `createdAt` descending.
- Final ordering ties preserve the stored relationship order.
- Public rendering includes only selected published albums.
- Draft live preview includes only selected draft-aware albums.
- Empty selections render nothing and never fall back to all albums.
- Existing album cards and the PhotoSwipe viewer do not change.
- Use the existing `manage_media` access model for creating Gallery Albums.

---

## File Structure

- `src/blocks/EventGallery/config.ts` — owns the Payload relationship and ordering fields.
- `src/lib/eventGalleryShared.ts` — owns client-safe relationship extraction, block-union extraction, filtering, and deterministic ordering.
- `src/lib/eventGallery.ts` — owns selected-ID Payload queries for published and draft contexts.
- `src/blocks/EventGallery/Presentation.tsx` — defines the block-shaped input shared by public and preview components.
- `src/blocks/EventGallery/Component.tsx` — resolves selected published albums for public pages.
- `src/blocks/EventGallery/PreviewComponent.tsx` — filters and orders one block from the shared draft snapshot.
- `src/app/(frontend)/preview/page/[id]/page.tsx` — collects selected IDs across Event Gallery blocks and loads one draft snapshot.
- `tests/int/page-blocks.int.spec.ts` — verifies the Payload field contract.
- `tests/int/event-gallery-data.int.spec.ts` — verifies extraction, ordering, and selected-ID loader behavior.
- `tests/int/event-gallery-selection.int.spec.tsx` — verifies public block selection and ordering.
- `tests/int/live-preview-renderer.int.spec.tsx` — verifies independent selection and ordering for preview blocks.
- `src/payload-types.ts` — regenerated Payload types.

---

### Task 1: Add the Payload selection fields

**Files:**
- Modify: `src/blocks/EventGallery/config.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**
- Produces: `galleryAlbums: (string | GalleryAlbum)[]`
- Produces: `displayOrder: 'latestEventDate' | 'manual'`
- Consumes: existing `gallery-albums` collection

- [ ] **Step 1: Extend the schema test with the required relationship contract**

In the existing `defines the eventGallery schema without a per-page album selector` test, rename the test to `defines the eventGallery album selection and ordering fields` and replace its content-field assertions with:

```ts
const galleryAlbums = getNamedField<{
  admin?: {
    allowCreate?: boolean
    isSortable?: boolean
  }
  hasMany?: boolean
  relationTo?: string
  required?: boolean
  type?: string
}>(contentTab?.fields ?? [], 'galleryAlbums')
const displayOrder = getNamedField<{
  defaultValue?: string
  options?: Array<{ value: string }>
  required?: boolean
  type?: string
}>(contentTab?.fields ?? [], 'displayOrder')

expect(
  contentTab?.fields.map((field) =>
    typeof field === 'object' && field !== null && 'name' in field
      ? field.name
      : undefined,
  ),
).toEqual(['eyebrow', 'title', 'description', 'galleryAlbums', 'displayOrder'])
expect(galleryAlbums).toMatchObject({
  admin: {
    allowCreate: true,
    isSortable: true,
  },
  hasMany: true,
  relationTo: 'gallery-albums',
  required: true,
  type: 'relationship',
})
expect(displayOrder).toMatchObject({
  defaultValue: 'latestEventDate',
  required: true,
  type: 'select',
})
expect(displayOrder?.options?.map((option) => option.value)).toEqual([
  'latestEventDate',
  'manual',
])
```

Keep the existing `contentAlignment` and `size` assertions after these assertions.

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
```

Expected: FAIL because `galleryAlbums` and `displayOrder` are absent.

- [ ] **Step 3: Add the relationship and ordering fields**

In `src/blocks/EventGallery/config.ts`, add these fields after `description`:

```ts
{
  name: 'galleryAlbums',
  label: 'Gallery Albums',
  type: 'relationship',
  relationTo: 'gallery-albums',
  hasMany: true,
  required: true,
  admin: {
    allowCreate: true,
    description:
      'Select the albums displayed by this block. Create an album here or reorder selected albums for Manual display order.',
    isSortable: true,
  },
},
{
  name: 'displayOrder',
  label: 'Display Order',
  type: 'select',
  defaultValue: 'latestEventDate',
  options: [
    {
      label: 'Latest Event Date',
      value: 'latestEventDate',
    },
    {
      label: 'Manual',
      value: 'manual',
    },
  ],
  required: true,
} satisfies SelectField,
```

- [ ] **Step 4: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: `EventGalleryBlock` in `src/payload-types.ts` contains required `galleryAlbums` and `displayOrder` fields.

- [ ] **Step 5: Run the schema test and targeted lint**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts
pnpm exec eslint src/blocks/EventGallery/config.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS with no lint errors.

- [ ] **Step 6: Commit the schema**

```bash
git add src/blocks/EventGallery/config.ts src/payload-types.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat(gallery): add album selection fields"
```

---

### Task 2: Add relationship extraction and deterministic ordering

**Files:**
- Modify: `src/lib/eventGalleryShared.ts`
- Modify: `tests/int/event-gallery-data.int.spec.ts`

**Interfaces:**
- Produces: `EventGalleryDisplayOrder`
- Produces: `getEventGalleryAlbumRelationshipIDs(value: unknown): string[]`
- Produces: `getEventGalleryAlbumIDsFromBlocks(value: unknown): string[]`
- Produces: `selectAndOrderEventGalleryAlbums(args): EventGalleryAlbum[]`
- Consumes: normalized `EventGalleryAlbum[]`

- [ ] **Step 1: Add failing extraction and ordering tests**

Add these imports to `tests/int/event-gallery-data.int.spec.ts`:

```ts
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import {
  getEventGalleryAlbumIDsFromBlocks,
  getEventGalleryAlbumRelationshipIDs,
  normalizeEventGalleryAlbums,
  selectAndOrderEventGalleryAlbums,
} from '@/lib/eventGalleryShared'
```

Replace the existing standalone `normalizeEventGalleryAlbums` import. Add these tests inside the `event gallery data path` suite:

```ts
it('extracts unique IDs from raw and populated relationships', () => {
  expect(
    getEventGalleryAlbumRelationshipIDs([
      'album-2',
      { id: 'album-1', title: 'Yoga Day' },
      null,
      { title: 'Missing ID' },
      'album-2',
    ]),
  ).toEqual(['album-2', 'album-1'])
})

it('collects the selected album union across Event Gallery blocks', () => {
  expect(
    getEventGalleryAlbumIDsFromBlocks([
      {
        blockType: 'eventGallery',
        galleryAlbums: ['album-2', { id: 'album-1' }],
      },
      {
        blockType: 'cta39',
        galleryAlbums: ['ignored'],
      },
      {
        blockType: 'eventGallery',
        galleryAlbums: ['album-3', 'album-2'],
      },
    ]),
  ).toEqual(['album-2', 'album-1', 'album-3'])
})

it('preserves relationship order in manual mode', () => {
  const albums = [
    {
      id: 'album-1',
      title: 'New Batch Day',
      createdAt: '2026-07-25T00:00:00.000Z',
      eventDate: '2026-07-25T00:00:00.000Z',
    },
    {
      id: 'album-2',
      title: 'Yoga Day',
      createdAt: '2026-07-26T00:00:00.000Z',
      eventDate: '2026-06-21T00:00:00.000Z',
    },
  ] as EventGalleryAlbum[]

  expect(
    selectAndOrderEventGalleryAlbums({
      albums,
      displayOrder: 'manual',
      selectedAlbumIDs: ['album-2', 'album-1'],
    }).map((album) => album.id),
  ).toEqual(['album-2', 'album-1'])
})

it('sorts by Event Date with deterministic missing-date and tie behavior', () => {
  const albums = [
    {
      id: 'missing-new',
      title: 'Missing New',
      createdAt: '2026-07-27T00:00:00.000Z',
    },
    {
      id: 'same-older',
      title: 'Same Older',
      createdAt: '2026-07-20T00:00:00.000Z',
      eventDate: '2026-08-15T00:00:00.000Z',
    },
    {
      id: 'latest',
      title: 'Latest',
      createdAt: '2026-07-18T00:00:00.000Z',
      eventDate: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'same-newer',
      title: 'Same Newer',
      createdAt: '2026-07-25T00:00:00.000Z',
      eventDate: '2026-08-15T00:00:00.000Z',
    },
    {
      id: 'missing-old',
      title: 'Missing Old',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ] as EventGalleryAlbum[]

  expect(
    selectAndOrderEventGalleryAlbums({
      albums,
      displayOrder: 'latestEventDate',
      selectedAlbumIDs: [
        'missing-old',
        'same-older',
        'latest',
        'same-newer',
        'missing-new',
      ],
    }).map((album) => album.id),
  ).toEqual(['latest', 'same-newer', 'same-older', 'missing-new', 'missing-old'])
})
```

- [ ] **Step 2: Run the data test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-data.int.spec.ts
```

Expected: FAIL because the extraction and ordering helpers are not exported.

- [ ] **Step 3: Implement the shared helpers**

Add the following to `src/lib/eventGalleryShared.ts` after the view-model types:

```ts
export type EventGalleryDisplayOrder = 'latestEventDate' | 'manual'

const getRelationshipID = (value: unknown): string | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value).trim()

    return id || undefined
  }

  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return undefined
  }

  const id = value.id

  if (typeof id !== 'string' && typeof id !== 'number') {
    return undefined
  }

  const normalizedID = String(id).trim()

  return normalizedID || undefined
}

export const getEventGalleryAlbumRelationshipIDs = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()

  return value.flatMap((entry): string[] => {
    const id = getRelationshipID(entry)

    if (!id || seen.has(id)) {
      return []
    }

    seen.add(id)
    return [id]
  })
}

export const getEventGalleryAlbumIDsFromBlocks = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const relationships = value.flatMap((block): unknown[] => {
    if (
      typeof block !== 'object' ||
      block === null ||
      !('blockType' in block) ||
      block.blockType !== 'eventGallery' ||
      !('galleryAlbums' in block) ||
      !Array.isArray(block.galleryAlbums)
    ) {
      return []
    }

    return block.galleryAlbums
  })

  return getEventGalleryAlbumRelationshipIDs(relationships)
}

const parseOptionalTimestamp = (value: string | undefined): number | null => {
  if (!value) {
    return null
  }

  const timestamp = Date.parse(value)

  return Number.isNaN(timestamp) ? null : timestamp
}

export const selectAndOrderEventGalleryAlbums = ({
  albums,
  displayOrder,
  selectedAlbumIDs,
}: {
  albums: EventGalleryAlbum[]
  displayOrder: EventGalleryDisplayOrder
  selectedAlbumIDs: string[]
}): EventGalleryAlbum[] => {
  const albumByID = new Map(albums.map((album) => [album.id, album]))
  const selectedAlbums = getEventGalleryAlbumRelationshipIDs(selectedAlbumIDs).flatMap(
    (id, selectionIndex) => {
      const album = albumByID.get(id)

      return album ? [{ album, selectionIndex }] : []
    },
  )

  if (displayOrder === 'manual') {
    return selectedAlbums.map(({ album }) => album)
  }

  return selectedAlbums
    .sort((first, second) => {
      const firstEventDate = parseOptionalTimestamp(first.album.eventDate)
      const secondEventDate = parseOptionalTimestamp(second.album.eventDate)

      if (firstEventDate !== null && secondEventDate === null) {
        return -1
      }

      if (firstEventDate === null && secondEventDate !== null) {
        return 1
      }

      if (
        firstEventDate !== null &&
        secondEventDate !== null &&
        firstEventDate !== secondEventDate
      ) {
        return secondEventDate - firstEventDate
      }

      const createdAtDifference =
        (parseOptionalTimestamp(second.album.createdAt) ?? 0) -
        (parseOptionalTimestamp(first.album.createdAt) ?? 0)

      return createdAtDifference || first.selectionIndex - second.selectionIndex
    })
    .map(({ album }) => album)
}
```

Keep the existing `normalizeEventGalleryAlbums` implementation unchanged.

- [ ] **Step 4: Run the data test and targeted lint**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-data.int.spec.ts
pnpm exec eslint src/lib/eventGalleryShared.ts tests/int/event-gallery-data.int.spec.ts
```

Expected: PASS with no lint errors.

- [ ] **Step 5: Commit the shared selection logic**

```bash
git add src/lib/eventGalleryShared.ts tests/int/event-gallery-data.int.spec.ts
git commit -m "feat(gallery): order selected albums"
```

---

### Task 3: Restrict Payload queries to selected albums

**Files:**
- Modify: `src/lib/eventGallery.ts`
- Modify: `tests/int/event-gallery-data.int.spec.ts`

**Interfaces:**
- Changes: `getPublishedEventGalleryAlbums(selectedAlbumIDs: string[])`
- Changes: `getDraftEventGalleryAlbums(selectedAlbumIDs: string[])`
- Consumes: normalized album view models from `normalizeEventGalleryAlbums`

- [ ] **Step 1: Replace the loader query test**

Replace `queries published and draft albums newest first without pagination` with:

```ts
it('queries only selected published and draft albums without pagination', async () => {
  await getPublishedEventGalleryAlbums(['album-2', 'album-1'])
  await getDraftEventGalleryAlbums(['album-3'])

  expect(mocks.find).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      collection: 'gallery-albums',
      depth: 1,
      draft: false,
      pagination: false,
      sort: '-createdAt',
      where: {
        and: [
          { id: { in: ['album-2', 'album-1'] } },
          { _status: { equals: 'published' } },
        ],
      },
    }),
  )
  expect(mocks.find).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      collection: 'gallery-albums',
      depth: 1,
      draft: true,
      pagination: false,
      sort: '-createdAt',
      where: { id: { in: ['album-3'] } },
    }),
  )
})

it('returns an empty result without querying Payload when nothing is selected', async () => {
  await expect(getPublishedEventGalleryAlbums([])).resolves.toEqual([])
  await expect(getDraftEventGalleryAlbums([])).resolves.toEqual([])

  expect(mocks.getPayload).not.toHaveBeenCalled()
  expect(mocks.find).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the data test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-data.int.spec.ts
```

Expected: FAIL because both loaders still accept no IDs and query all albums.

- [ ] **Step 3: Update the cached server loader**

Replace `src/lib/eventGallery.ts` after its imports with:

```ts
const loadEventGalleryAlbums = cache(
  async (draft: boolean, ...selectedAlbumIDs: string[]): Promise<EventGalleryAlbum[]> => {
    if (!selectedAlbumIDs.length) {
      return []
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'gallery-albums',
      depth: 1,
      draft,
      pagination: false,
      sort: '-createdAt',
      where: draft
        ? {
            id: {
              in: selectedAlbumIDs,
            },
          }
        : {
            and: [
              {
                id: {
                  in: selectedAlbumIDs,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          },
    })

    return normalizeEventGalleryAlbums(result.docs)
  },
)

export const getPublishedEventGalleryAlbums = (selectedAlbumIDs: string[]) =>
  loadEventGalleryAlbums(false, ...selectedAlbumIDs)

export const getDraftEventGalleryAlbums = (selectedAlbumIDs: string[]) =>
  loadEventGalleryAlbums(true, ...selectedAlbumIDs)
```

The variadic string arguments keep React cache keys stable by primitive value.

- [ ] **Step 4: Run the data test and targeted lint**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-data.int.spec.ts
pnpm exec eslint src/lib/eventGallery.ts tests/int/event-gallery-data.int.spec.ts
```

Expected: PASS with no lint errors.

- [ ] **Step 5: Commit the selected-ID loaders**

```bash
git add src/lib/eventGallery.ts tests/int/event-gallery-data.int.spec.ts
git commit -m "feat(gallery): query selected albums"
```

---

### Task 4: Resolve selected albums on public pages

**Files:**
- Modify: `src/blocks/EventGallery/Presentation.tsx`
- Modify: `src/blocks/EventGallery/Component.tsx`
- Create: `tests/int/event-gallery-selection.int.spec.tsx`

**Interfaces:**
- Consumes: `getEventGalleryAlbumRelationshipIDs`
- Consumes: `selectAndOrderEventGalleryAlbums`
- Consumes: `getPublishedEventGalleryAlbums(selectedAlbumIDs)`
- Produces: public Event Gallery output containing only selected albums

- [ ] **Step 1: Add failing public-component tests**

Create `tests/int/event-gallery-selection.int.spec.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublishedEventGalleryAlbums: vi.fn(),
}))

vi.mock('@/lib/eventGallery', () => ({
  getPublishedEventGalleryAlbums: mocks.getPublishedEventGalleryAlbums,
}))

import { EventGalleryBlockComponent } from '@/blocks/EventGallery/Component'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const createAlbum = ({
  createdAt,
  eventDate,
  id,
  title,
}: {
  createdAt: string
  eventDate: string
  id: string
  title: string
}): EventGalleryAlbum => ({
  cover: {
    alt: title,
    height: 900,
    id: `${id}-image`,
    src: `/media/${id}.jpg`,
    width: 1600,
  },
  createdAt,
  eventDate,
  id,
  imageCount: 1,
  images: [
    {
      alt: title,
      height: 900,
      id: `${id}-image`,
      src: `/media/${id}.jpg`,
      width: 1600,
    },
  ],
  title,
})

const yogaDay = createAlbum({
  createdAt: '2026-07-26T00:00:00.000Z',
  eventDate: '2026-06-21T00:00:00.000Z',
  id: 'yoga-day',
  title: 'Yoga Day',
})
const independenceDay = createAlbum({
  createdAt: '2026-07-20T00:00:00.000Z',
  eventDate: '2026-08-15T00:00:00.000Z',
  id: 'independence-day',
  title: 'Independence Day',
})

beforeEach(() => {
  mocks.getPublishedEventGalleryAlbums.mockReset()
  mocks.getPublishedEventGalleryAlbums.mockResolvedValue([
    independenceDay,
    yogaDay,
  ])
})

describe('Event Gallery public selection', () => {
  it('loads only selected IDs and preserves manual relationship order', async () => {
    const element = await EventGalleryBlockComponent({
      displayOrder: 'manual',
      galleryAlbums: [{ id: 'yoga-day' }, 'independence-day'],
      title: 'Events',
    })
    const html = renderToStaticMarkup(element)

    expect(mocks.getPublishedEventGalleryAlbums).toHaveBeenCalledWith([
      'yoga-day',
      'independence-day',
    ])
    expect(html.indexOf('Yoga Day')).toBeLessThan(html.indexOf('Independence Day'))
  })

  it('orders selected albums by latest Event Date', async () => {
    const element = await EventGalleryBlockComponent({
      displayOrder: 'latestEventDate',
      galleryAlbums: ['yoga-day', 'independence-day'],
      title: 'Events',
    })
    const html = renderToStaticMarkup(element)

    expect(html.indexOf('Independence Day')).toBeLessThan(html.indexOf('Yoga Day'))
  })

  it('renders nothing and skips the loader without a selection', async () => {
    await expect(
      EventGalleryBlockComponent({
        displayOrder: 'latestEventDate',
        galleryAlbums: [],
        title: 'Events',
      }),
    ).resolves.toBeNull()
    expect(mocks.getPublishedEventGalleryAlbums).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the public selection test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-selection.int.spec.tsx
```

Expected: FAIL because `EventGalleryBlockComponent` still loads every album and does not order a selection.

- [ ] **Step 3: Extend the block-shaped input type**

In `src/blocks/EventGallery/Presentation.tsx`, import the ordering type:

```ts
import type {
  EventGalleryAlbum,
  EventGalleryDisplayOrder,
} from '@/lib/eventGalleryShared'
```

Replace the existing separate `EventGalleryAlbum` import and add these fields to `EventGalleryBlockLike`:

```ts
displayOrder?: EventGalleryDisplayOrder | null
galleryAlbums?: unknown
```

The presentation component continues to ignore these data-selection fields.

- [ ] **Step 4: Resolve the public selection**

Replace `src/blocks/EventGallery/Component.tsx` with:

```tsx
import {
  EventGalleryBlockPresentation,
  type EventGalleryBlockLike,
} from '@/blocks/EventGallery/Presentation'
import { getPublishedEventGalleryAlbums } from '@/lib/eventGallery'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
} from '@/lib/eventGalleryShared'

export async function EventGalleryBlockComponent({
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: EventGalleryBlockLike) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)

  if (!selectedAlbumIDs.length) {
    return null
  }

  const albums = await getPublishedEventGalleryAlbums(selectedAlbumIDs)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })

  return <EventGalleryBlockPresentation {...props} albums={selectedAlbums} />
}
```

- [ ] **Step 5: Run public selection tests and targeted lint**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-selection.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
pnpm exec eslint src/blocks/EventGallery/Component.tsx src/blocks/EventGallery/Presentation.tsx tests/int/event-gallery-selection.int.spec.tsx
```

Expected: PASS with no lint errors.

- [ ] **Step 6: Commit public selection**

```bash
git add src/blocks/EventGallery/Component.tsx src/blocks/EventGallery/Presentation.tsx tests/int/event-gallery-selection.int.spec.tsx
git commit -m "feat(gallery): render selected albums"
```

---

### Task 5: Make live preview selection-aware

**Files:**
- Modify: `src/blocks/EventGallery/PreviewComponent.tsx`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: `tests/int/live-preview-import-boundary.int.spec.ts`

**Interfaces:**
- Consumes: `getEventGalleryAlbumIDsFromBlocks(page.layout)`
- Consumes: `getDraftEventGalleryAlbums(selectedAlbumIDs)`
- Consumes: `selectAndOrderEventGalleryAlbums`
- Produces: one shared draft-aware snapshot with per-block filtering and ordering

- [ ] **Step 1: Update the existing preview fixture to carry a selection**

In the existing `renders eventGallery from the server-provided draft album snapshot` test, update the block to:

```ts
{
  blockType: 'eventGallery',
  displayOrder: 'manual',
  galleryAlbums: ['draft-album'],
  title: 'Event gallery',
},
```

Then add this test to the same suite:

```tsx
it('filters a shared album snapshot independently for multiple blocks', () => {
  const sharedAlbums = [
    {
      cover: {
        alt: 'Yoga Day',
        height: 900,
        id: 'yoga-image',
        src: '/media/yoga.jpg',
        width: 1600,
      },
      createdAt: '2026-07-27T00:00:00.000Z',
      eventDate: '2026-06-21T00:00:00.000Z',
      id: 'yoga',
      imageCount: 1,
      images: [
        {
          alt: 'Yoga Day',
          height: 900,
          id: 'yoga-image',
          src: '/media/yoga.jpg',
          width: 1600,
        },
      ],
      title: 'Yoga Day',
    },
    {
      cover: {
        alt: 'Independence Day',
        height: 900,
        id: 'independence-image',
        src: '/media/independence.jpg',
        width: 1600,
      },
      createdAt: '2026-07-20T00:00:00.000Z',
      eventDate: '2026-08-15T00:00:00.000Z',
      id: 'independence',
      imageCount: 1,
      images: [
        {
          alt: 'Independence Day',
          height: 900,
          id: 'independence-image',
          src: '/media/independence.jpg',
          width: 1600,
        },
      ],
      title: 'Independence Day',
    },
  ]
  const layout = [
    {
      blockType: 'eventGallery',
      displayOrder: 'manual',
      galleryAlbums: ['yoga'],
      title: 'Manual gallery',
    },
    {
      blockType: 'eventGallery',
      displayOrder: 'latestEventDate',
      galleryAlbums: ['yoga', 'independence'],
      title: 'Latest gallery',
    },
  ] as unknown as NonNullable<Page['layout']>
  const html = renderToStaticMarkup(
    renderLivePreviewPageBlocks(
      layout,
      {
        feedPagesBySize: {},
        ratingDistribution: {
          average: 0,
          count: 0,
          counts: [0, 0, 0, 0, 0],
        },
      },
      EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
      [],
      sharedAlbums,
    ),
  )
  const firstBlockStart = html.indexOf('Manual gallery')
  const secondBlockStart = html.indexOf('Latest gallery')
  const firstBlockHTML = html.slice(firstBlockStart, secondBlockStart)
  const secondBlockHTML = html.slice(secondBlockStart)

  expect(firstBlockHTML).toContain('Yoga Day')
  expect(firstBlockHTML).not.toContain('Independence Day')
  expect(secondBlockHTML.indexOf('Independence Day')).toBeLessThan(
    secondBlockHTML.indexOf('Yoga Day'),
  )
})
```

- [ ] **Step 2: Run the live-preview tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-renderer.int.spec.tsx
```

Expected: FAIL because the preview component renders the full shared snapshot without applying block selection.

- [ ] **Step 3: Filter and order each preview block**

Replace `src/blocks/EventGallery/PreviewComponent.tsx` with:

```tsx
import {
  EventGalleryBlockPresentation,
  type EventGalleryBlockLike,
} from '@/blocks/EventGallery/Presentation'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
  type EventGalleryAlbum,
} from '@/lib/eventGalleryShared'

export function EventGalleryPreviewBlockComponent({
  albums,
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: EventGalleryBlockLike & { albums: EventGalleryAlbum[] }) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })

  return <EventGalleryBlockPresentation {...props} albums={selectedAlbums} />
}
```

- [ ] **Step 4: Load the union of selected draft albums**

In `src/app/(frontend)/preview/page/[id]/page.tsx`, add:

```ts
import { getEventGalleryAlbumIDsFromBlocks } from '@/lib/eventGalleryShared'
```

Replace the `hasEventGallery` calculation with:

```ts
const selectedEventGalleryAlbumIDs = getEventGalleryAlbumIDsFromBlocks(page.layout)
```

Replace the Event Gallery promise in `Promise.all` with:

```ts
selectedEventGalleryAlbumIDs.length
  ? getDraftEventGalleryAlbums(selectedEventGalleryAlbumIDs)
  : Promise.resolve([]),
```

Keep the existing `eventGalleryAlbums` prop passed to `PageLivePreview`.

- [ ] **Step 5: Strengthen the live-preview server boundary test**

In `tests/int/live-preview-import-boundary.int.spec.ts`, keep
`src/lib/eventGallery.ts` in the forbidden server paths and add:

```ts
expect(reachablePaths.has('src/lib/eventGalleryShared.ts')).toBe(true)
```

This proves the client graph can use selection helpers without reaching the server-only loader.

- [ ] **Step 6: Run live-preview and boundary tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
pnpm exec eslint src/blocks/EventGallery/PreviewComponent.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS with no lint errors.

- [ ] **Step 7: Commit draft preview selection**

```bash
git add src/blocks/EventGallery/PreviewComponent.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
git commit -m "feat(gallery): preview selected albums"
```

---

### Task 6: Regenerate artifacts and validate the completed feature

**Files:**
- Regenerate: `src/payload-types.ts`
- Verify: Event Gallery implementation and test files

**Interfaces:**
- Consumes: all interfaces from Tasks 1–5
- Produces: a type-safe, tested selection-aware Event Gallery feature

- [ ] **Step 1: Regenerate Payload artifacts**

Run:

```bash
pnpm run generate:types
pnpm run generate:importmap
```

Expected:

- `EventGalleryBlock.galleryAlbums` is a required array of Gallery Album IDs or populated documents.
- `EventGalleryBlock.displayOrder` is `'latestEventDate' | 'manual'`.
- Import-map generation reports no new imports or updates the import map successfully.

- [ ] **Step 2: Run all Event Gallery and registry tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/gallery-albums.int.spec.ts \
  tests/int/event-gallery-data.int.spec.ts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-selection.int.spec.tsx \
  tests/int/media-governance.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all listed test files pass.

- [ ] **Step 3: Run targeted lint**

Run:

```bash
pnpm exec eslint \
  src/blocks/EventGallery \
  src/lib/eventGallery.ts \
  src/lib/eventGalleryShared.ts \
  'src/app/(frontend)/preview/page/[id]/page.tsx' \
  tests/int/event-gallery-data.int.spec.ts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-selection.int.spec.tsx \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: no lint errors.

- [ ] **Step 4: Run Payload configuration integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts
```

Expected: all three tests pass. If the sandbox rejects an ephemeral MongoDB port with `listen EPERM`, rerun this exact command with local-port permission.

- [ ] **Step 5: Check generated TypeScript**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
```

Expected: no Event Gallery errors. The current repository baseline may still report the pre-existing Team Showcase nullable-prop errors and homepage seed `contentAlignment` error documented during the original Event Gallery implementation; do not broaden this change to fix them.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors and only the planned selection-related files remain uncommitted.

- [ ] **Step 7: Commit generated artifacts or final integration adjustments**

If Task 6 changed `src/payload-types.ts` or required a small integration correction:

```bash
git add src/payload-types.ts
git commit -m "chore(gallery): refresh selection types"
```

If `src/payload-types.ts` was already committed with its final content in Task 1 and no files remain, skip this commit.
