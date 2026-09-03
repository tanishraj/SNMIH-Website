# Gallery Album Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable Gallery Album Tabs Page block whose fixed first All tab and album-derived tabs reveal selected Gallery Album images in batches, render them in the existing rectangular quilt language, and open the complete active-tab set in the shared slideshow.

**Architecture:** Keep Payload loading on the server and interaction in a focused client component. Reuse the existing Gallery Album relationship loader, album selection/order resolver, quilt geometry, block appearance system, and Gallery Slideshow Viewer; add pure tab/grouping helpers so production and live preview share the same behavior without importing server-only code into client graphs.

**Tech Stack:** Payload CMS 3, Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Next Image, Framer Motion, Vitest, Testing Library.

## Global Constraints

- The block slug is `galleryAlbumTabs`; its Admin label is `Gallery Album Tabs`.
- Editors explicitly select sortable Gallery Albums; do not query every published album.
- `All` is always first and initially active; only its label is configurable.
- Album tab labels always use current Gallery Album titles.
- All-tab images preserve resolved album/image order and de-duplicate repeated Media documents by stable Media ID, retaining the first occurrence.
- Images Per Load supports exactly `6`, `9`, and `12`, defaulting to `9`.
- Tab variants are `contained`, `pill`, and `underline`; `underline` is the default and invalid-value fallback.
- Tiles are image-only; captions appear only in the slideshow.
- The slideshow always contains the complete active-tab set and starts at the selected image.
- Load More is a local reveal; do not add a public pagination API.
- Production loads only selected published albums; authenticated live preview uses server-loaded draft album snapshots.
- Preserve Event Gallery and Image Mosaic behavior.
- Use semantic theme tokens; do not hardcode SNMIH colors.
- Do not add dependencies or a database migration.
- Do not stage or commit files; the user's no-commit preference overrides generic commit steps.

---

## File Map

**Create**

- `src/blocks/GalleryAlbumTabs/config.ts` — Payload field schema and block picker metadata.
- `src/blocks/GalleryAlbumTabs/galleryAlbumTabsShared.ts` — client-safe normalization, tab grouping, de-duplication, and style contracts.
- `src/blocks/GalleryAlbumTabs/Component.tsx` — production server loader adapter.
- `src/blocks/GalleryAlbumTabs/PreviewComponent.tsx` — live-preview snapshot adapter.
- `src/blocks/GalleryAlbumTabs/Presentation.tsx` — section/header/footer composition.
- `src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx` — accessible tabs, reveal state, quilt tiles, and slideshow state.
- `tests/int/gallery-album-tabs.int.spec.tsx` — schema, pure behavior, presentation, interaction, and slideshow coverage.
- `public/block-thumbnails/gallery-album-tabs.jpg` — generated 1600×900 picker thumbnail.

**Modify**

- `src/lib/eventGalleryShared.ts` — expose stable `mediaID` and discover the new block's album relationships.
- `src/collections/Pages.ts` — register the block beside gallery blocks.
- `src/collections/ReusableSections.ts` — preserve registration parity.
- `src/globals/NewsEventsDetailTemplate.ts` — preserve the exact Page-compatible block order before the dynamic detail block.
- `src/blocks/renderPageBlocks.tsx` — add production rendering with `BlockErrorBoundary`.
- `src/blocks/renderLivePreviewPageBlocks.tsx` — add client-safe preview rendering from the existing album snapshot.
- `src/block-thumbnails/definitions.ts` — register picker metadata.
- `src/block-thumbnails/fixtures.tsx` — add a deterministic production-component fixture.
- `tests/int/event-gallery-data.int.spec.ts` — verify stable Media identity and relationship discovery.
- `tests/int/page-blocks.int.spec.ts` — verify schema/registration parity.
- `tests/int/live-preview-renderer.int.spec.tsx` — verify draft snapshot filtering and rendering.
- `tests/int/block-thumbnails.int.spec.ts` — verify thumbnail definition and file.
- `src/payload-types.ts` — regenerate; never edit manually.
- `docs/guides/blocks.md` — add operator guidance.
- `.agents/skills/project-context/references/block-system.md` — record the runtime/operator contract.
- `.agents/skills/project-context/references/project-inventory.json` — refresh through the project-context command.

---

### Task 1: Define the client-safe model, grouping rules, and Payload schema

**Files:**

- Create: `src/blocks/GalleryAlbumTabs/galleryAlbumTabsShared.ts`
- Create: `src/blocks/GalleryAlbumTabs/config.ts`
- Modify: `src/lib/eventGalleryShared.ts`
- Test: `tests/int/gallery-album-tabs.int.spec.tsx`
- Test: `tests/int/event-gallery-data.int.spec.ts`

**Interfaces:**

- Consumes: `EventGalleryAlbum`, `EventGalleryImage`, `EventGalleryDisplayOrder`, `selectAndOrderEventGalleryAlbums`, shared appearance/action fields.
- Produces:

```ts
export type GalleryAlbumTabsVariant = 'contained' | 'pill' | 'underline'
export type GalleryAlbumTabsImagesPerLoad = 6 | 9 | 12
export type GalleryAlbumTabsResolvedTab = {
  id: string
  images: EventGalleryImage[]
  label: string
}
export function normalizeGalleryAlbumTabsVariant(value?: unknown): GalleryAlbumTabsVariant
export function normalizeGalleryAlbumTabsImagesPerLoad(
  value?: unknown,
): GalleryAlbumTabsImagesPerLoad
export function resolveGalleryAlbumTabs(
  albums: EventGalleryAlbum[],
  allTabLabel?: string | null,
): GalleryAlbumTabsResolvedTab[]
export function getGalleryAlbumTabsTabListClasses(variant: GalleryAlbumTabsVariant): string
export function getGalleryAlbumTabsTabClasses(
  variant: GalleryAlbumTabsVariant,
  active: boolean,
): string
```

- Extends `EventGalleryImage` with `mediaID?: string` without forcing existing fixtures/consumers to change.

- [ ] **Step 1: Write failing pure-model and schema tests**

Add a new suite with explicit expectations:

```tsx
import { describe, expect, it } from 'vitest'

import { GalleryAlbumTabsBlock } from '@/blocks/GalleryAlbumTabs/config'
import {
  normalizeGalleryAlbumTabsImagesPerLoad,
  normalizeGalleryAlbumTabsVariant,
  resolveGalleryAlbumTabs,
} from '@/blocks/GalleryAlbumTabs/galleryAlbumTabsShared'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const albums: EventGalleryAlbum[] = [
  {
    id: 'album-a',
    title: 'Campus Life',
    createdAt: '2026-08-18T00:00:00.000Z',
    cover: {
      id: 'row-a1',
      mediaID: 'media-1',
      alt: 'Shared',
      src: '/shared.jpg',
      width: 1600,
      height: 900,
    },
    imageCount: 2,
    images: [
      {
        id: 'row-a1',
        mediaID: 'media-1',
        alt: 'Shared',
        src: '/shared.jpg',
        width: 1600,
        height: 900,
      },
      {
        id: 'row-a2',
        mediaID: 'media-2',
        alt: 'Lecture',
        src: '/lecture.jpg',
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    id: 'album-b',
    title: 'Yoga Day',
    createdAt: '2026-08-17T00:00:00.000Z',
    cover: {
      id: 'row-b1',
      mediaID: 'media-1',
      alt: 'Shared again',
      src: '/shared.jpg',
      width: 1600,
      height: 900,
    },
    imageCount: 2,
    images: [
      {
        id: 'row-b1',
        mediaID: 'media-1',
        alt: 'Shared again',
        src: '/shared.jpg',
        width: 1600,
        height: 900,
      },
      { id: 'row-b2', mediaID: 'media-3', alt: 'Yoga', src: '/yoga.jpg', width: 1600, height: 900 },
    ],
  },
]

it('keeps All first, derives album labels, and de-duplicates All by Media ID', () => {
  const tabs = resolveGalleryAlbumTabs(albums, 'Everything')
  expect(tabs.map(({ id, label }) => ({ id, label }))).toEqual([
    { id: 'all', label: 'Everything' },
    { id: 'album-a', label: 'Campus Life' },
    { id: 'album-b', label: 'Yoga Day' },
  ])
  expect(tabs[0]?.images.map(({ mediaID }) => mediaID)).toEqual(['media-1', 'media-2', 'media-3'])
  expect(tabs[1]?.images).toHaveLength(2)
  expect(tabs[2]?.images).toHaveLength(2)
})

it('normalizes legacy and invalid presentation values', () => {
  expect(normalizeGalleryAlbumTabsVariant(undefined)).toBe('underline')
  expect(normalizeGalleryAlbumTabsVariant('pill')).toBe('pill')
  expect(normalizeGalleryAlbumTabsVariant('invalid')).toBe('underline')
  expect(normalizeGalleryAlbumTabsImagesPerLoad(undefined)).toBe(9)
  expect(normalizeGalleryAlbumTabsImagesPerLoad('6')).toBe(6)
  expect(normalizeGalleryAlbumTabsImagesPerLoad(12)).toBe(12)
  expect(normalizeGalleryAlbumTabsImagesPerLoad('4')).toBe(9)
})

it('defines selected albums, batch size, labels, and three tab variants', () => {
  expect(GalleryAlbumTabsBlock).toMatchObject({
    slug: 'galleryAlbumTabs',
    interfaceName: 'GalleryAlbumTabsBlock',
  })
  const serialized = JSON.stringify(GalleryAlbumTabsBlock.fields)
  expect(serialized).toContain('galleryAlbums')
  expect(serialized).toContain('imagesPerLoad')
  expect(serialized).toContain('contained')
  expect(serialized).toContain('pill')
  expect(serialized).toContain('underline')
})
```

Extend `event-gallery-data.int.spec.ts` so normalized images expose stable Media identity and the block traversal recognizes `galleryAlbumTabs`, including inside a populated Reusable Section:

```ts
expect(normalizeEventGalleryAlbums(rawAlbums)[0]?.images[0]).toMatchObject({
  id: 'row-1',
  mediaID: 'media-1',
})

expect(
  getGalleryAlbumIDsFromBlocks([
    { blockType: 'galleryAlbumTabs', galleryAlbums: ['album-2', { id: 'album-1' }] },
  ]),
).toEqual(['album-2', 'album-1'])
```

- [ ] **Step 2: Run the new tests and verify the intended failures**

Run:

```bash
pnpm exec vitest run tests/int/gallery-album-tabs.int.spec.tsx tests/int/event-gallery-data.int.spec.ts
```

Expected: FAIL because `GalleryAlbumTabs` files do not exist and `mediaID`/relationship discovery are absent.

- [ ] **Step 3: Implement the pure helpers**

Create `galleryAlbumTabsShared.ts` with these exact rules:

```ts
import type { EventGalleryAlbum, EventGalleryImage } from '@/lib/eventGalleryShared'

export const GALLERY_ALBUM_TABS_VARIANTS = ['contained', 'pill', 'underline'] as const
export type GalleryAlbumTabsVariant = (typeof GALLERY_ALBUM_TABS_VARIANTS)[number]
export type GalleryAlbumTabsImagesPerLoad = 6 | 9 | 12
export type GalleryAlbumTabsResolvedTab = { id: string; images: EventGalleryImage[]; label: string }

export const normalizeGalleryAlbumTabsVariant = (value?: unknown): GalleryAlbumTabsVariant =>
  value === 'contained' || value === 'pill' ? value : 'underline'

export const normalizeGalleryAlbumTabsImagesPerLoad = (
  value?: unknown,
): GalleryAlbumTabsImagesPerLoad => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value
  return parsed === 6 || parsed === 12 ? parsed : 9
}

const getImageIdentity = (image: EventGalleryImage) => image.mediaID ?? image.src

export function resolveGalleryAlbumTabs(
  albums: EventGalleryAlbum[],
  allTabLabel?: string | null,
): GalleryAlbumTabsResolvedTab[] {
  const seen = new Set<string>()
  const allImages = albums.flatMap(({ images }) =>
    images.filter((image) => {
      const identity = getImageIdentity(image)
      if (seen.has(identity)) return false
      seen.add(identity)
      return true
    }),
  )
  return [
    { id: 'all', label: allTabLabel?.trim() || 'All', images: allImages },
    ...albums.map(({ id, images, title }) => ({ id, images, label: title })),
  ]
}
```

Add exported class resolvers using `cn` or static records. The records must implement semantic-token variants:

```ts
const tabListClasses = {
  contained: 'border border-border bg-background p-1',
  pill: 'rounded-full border border-border bg-background p-1',
  underline: 'border-b border-border',
} satisfies Record<GalleryAlbumTabsVariant, string>
```

Use active `bg-primary text-primary-foreground` for Contained/Pill and an active bottom border/pseudo-element plus `text-foreground` for Underline. Inactive tabs use `text-muted-foreground hover:text-foreground`.

- [ ] **Step 4: Add stable Media identity and block relationship discovery**

In `eventGalleryShared.ts`:

```ts
export type EventGalleryImage = {
  alt: string
  caption?: string
  height: number
  id: string
  mediaID?: string
  src: string
  width: number
}
```

When normalizing a populated Media relationship, set `mediaID: String(media.id)`. Extend `getGalleryAlbumIDsFromBlocks` with:

```ts
if (
  block.blockType === 'galleryAlbumTabs' &&
  'galleryAlbums' in block &&
  Array.isArray(block.galleryAlbums)
) {
  addRelationships(block.galleryAlbums)
}
```

Keep the existing de-duplication, depth-10 limit, WeakSet cycle protection, Event Gallery case, and Image Mosaic case unchanged.

- [ ] **Step 5: Create the Payload block config**

Create `config.ts` following News Events Tabs field composition:

```ts
export const GalleryAlbumTabsBlock: Block = {
  admin: getBlockThumbnailAdmin('galleryAlbumTabs'),
  slug: 'galleryAlbumTabs',
  interfaceName: 'GalleryAlbumTabsBlock',
  labels: { singular: 'Gallery Album Tabs', plural: 'Gallery Album Tabs' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            eyebrowField,
            titleField,
            accentTitleField,
            descriptionField,
            createContentActionsField({ label: 'Header Actions', maxRows: 2 }),
            galleryAlbumsRelationship,
            displayOrderSelect,
            allTabLabelField,
            imagesPerLoadSelect,
            loadMoreLabelField,
            emptyStateMessageField,
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
            tabVariantSelect,
            contentAlignmentSelect,
            headerActionAlignmentRadio,
            sizeSelect,
          ],
        },
      ],
    },
  ],
}
```

Use the exact Content defaults from the spec and the same `contentAlignment`, conditional `headerActionAlignment`, and `size` options as `NewsEventsTabsBlock`. The album relationship is required, `hasMany`, sortable, and allows album creation. `imagesPerLoad` stores string values `6`, `9`, and `12` for Payload select compatibility.

- [ ] **Step 6: Run focused tests**

Run the Task 1 command again. Expected: PASS.

- [ ] **Step 7: Review the Task 1 diff without staging**

Run:

```bash
git diff --check -- src/blocks/GalleryAlbumTabs src/lib/eventGalleryShared.ts tests/int/gallery-album-tabs.int.spec.tsx tests/int/event-gallery-data.int.spec.ts
```

Expected: no output and exit 0. Do not stage or commit.

---

### Task 2: Build the section presentation, accessible tabs, quilt, and slideshow

**Files:**

- Create: `src/blocks/GalleryAlbumTabs/Presentation.tsx`
- Create: `src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx`
- Create: `src/blocks/GalleryAlbumTabs/Component.tsx`
- Modify: `tests/int/gallery-album-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: Task 1 normalizers/resolved tabs, `getPublishedEventGalleryAlbums`, `selectAndOrderEventGalleryAlbums`, Event Gallery quilt helpers, `GallerySlideshowViewer`, shared section/action primitives.
- Produces:

```ts
export type GalleryAlbumTabsBlockLike = { /* generated-schema-compatible optional fields */ }
export function GalleryAlbumTabsBlockPresentation(
  props: GalleryAlbumTabsBlockLike & { albums: EventGalleryAlbum[] },
): React.ReactNode
export async function GalleryAlbumTabsBlockComponent(
  props: GalleryAlbumTabsBlockLike,
): Promise<React.ReactNode>
export function GalleryAlbumTabsClient(props: {
  imagesPerLoad: GalleryAlbumTabsImagesPerLoad
  loadMoreLabel: string
  tabs: GalleryAlbumTabsResolvedTab[]
  variant: GalleryAlbumTabsVariant
}): React.ReactNode
```

- [ ] **Step 1: Add failing presentation and interaction tests**

Use Testing Library with at least two albums and 10 unique images. Cover:

```tsx
it('renders All first, album-derived tabs, and only the configured initial batch', () => {
  render(
    <GalleryAlbumTabsBlockPresentation albums={albums} imagesPerLoad="6" tabVariant="underline" />,
  )
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map((tab) => tab.textContent)).toEqual(['All', 'Campus Life', 'Yoga Day'])
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  expect(document.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(6)
  expect(screen.getByRole('button', { name: 'Load More' })).toBeVisible()
})

it('preserves per-tab reveal progress and removes Load More at the end', async () => {
  const user = userEvent.setup()
  render(<GalleryAlbumTabsBlockPresentation albums={albums} imagesPerLoad="6" />)
  await user.click(screen.getByRole('button', { name: 'Load More' }))
  expect(document.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(10)
  await user.click(screen.getByRole('tab', { name: 'Campus Life' }))
  await user.click(screen.getByRole('tab', { name: 'All' }))
  expect(document.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(10)
})

it('supports Arrow, Home, and End tab navigation', async () => {
  const user = userEvent.setup()
  render(<GalleryAlbumTabsBlockPresentation albums={albums} />)
  const all = screen.getByRole('tab', { name: 'All' })
  all.focus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Campus Life' })).toHaveFocus()
  await user.keyboard('{End}')
  expect(screen.getByRole('tab', { name: 'Yoga Day' })).toHaveFocus()
  await user.keyboard('{Home}')
  expect(all).toHaveFocus()
})

it('opens the complete active-tab slideshow at the selected image and restores focus', async () => {
  const user = userEvent.setup()
  render(<GalleryAlbumTabsBlockPresentation albums={albums} imagesPerLoad="6" />)
  const opener = screen.getByRole('button', { name: /Open image 2 of 10 in All gallery/i })
  await user.click(opener)
  expect(screen.getByRole('dialog', { name: 'All gallery' })).toBeVisible()
  expect(screen.getByText('02 / 10')).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Close gallery' }))
  expect(opener).toHaveFocus()
})
```

Also render all three variants and assert `data-gallery-album-tabs-variant`, header omission when empty, and the configured empty state when no usable album exists.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm exec vitest run tests/int/gallery-album-tabs.int.spec.tsx
```

Expected: FAIL because the presentation/client/production components do not exist.

- [ ] **Step 3: Implement the production server adapter**

Create `Component.tsx`:

```tsx
export async function GalleryAlbumTabsBlockComponent({
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: GalleryAlbumTabsBlockLike) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)
  const albums = selectedAlbumIDs.length
    ? await getPublishedEventGalleryAlbums(selectedAlbumIDs)
    : []
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })
  return <GalleryAlbumTabsBlockPresentation {...props} albums={selectedAlbums} />
}
```

Unlike Event Gallery, do not return `null` before presentation; the new block must retain configured header/footer/empty-state UI.

- [ ] **Step 4: Implement section presentation**

Mirror the established News Events Tabs header structure and shared classes. Normalize values before the client boundary:

```tsx
const resolvedTabs = resolveGalleryAlbumTabs(albums, allTabLabel)
const hasUsableImages = resolvedTabs[0]?.images.length > 0

<section data-gallery-album-tabs="true" className={...}>
  <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
    {hasHeader ? <SectionHeader ... /> : null}
    {hasUsableImages ? (
      <GalleryAlbumTabsClient
        imagesPerLoad={normalizeGalleryAlbumTabsImagesPerLoad(imagesPerLoad)}
        loadMoreLabel={loadMoreLabel?.trim() || 'Load More'}
        tabs={resolvedTabs}
        variant={normalizeGalleryAlbumTabsVariant(tabVariant)}
      />
    ) : (
      <Empty ...><EmptyHeader><EmptyDescription>{emptyStateMessage?.trim() || 'No gallery images available.'}</EmptyDescription></EmptyHeader></Empty>
    )}
    <BlockFooterActions ... />
  </div>
</section>
```

Keep `GalleryAlbumTabsBlockLike` fields optional and normalize legacy/missing values. Resolve CMS actions with `resolveCmsActions`.

- [ ] **Step 5: Implement client interaction and quilt**

In `GalleryAlbumTabsClient.tsx`:

- Use `useId`, `useRef`, and `useState`.
- Initialize active tab to `all`.
- Initialize `visibleByTab` from each tab ID to `imagesPerLoad`.
- Resolve active tab defensively back to the first tab when props change.
- Implement the same Arrow Left/Right/Home/End roving-focus behavior as News Events Tabs.
- After tab activation, call its button's `scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' })`; use `auto` when reduced motion is requested.
- Slice only the rendered quilt: `activeTab.images.slice(0, visibleByTab[activeTab.id])`.
- Reuse `getEventGalleryQuiltGridClassName`, `getEventGalleryQuiltRowSpans`, and `getEventGalleryQuiltRowSpanClassName` using the visible count.
- Render each tile as a full-size button with Next Image, responsive `sizes`, border/radius tokens, subtle image zoom, and visible focus ring.
- Track `{ tab, index }` for the open viewer and the opener button ref.
- Build a slideshow-compatible virtual album:

```ts
const viewerAlbum: EventGalleryAlbum = {
  id: `gallery-album-tabs-${activeTab.id}`,
  title: activeTab.label,
  createdAt: albumsCreatedAtFallback,
  cover: activeTab.images[0],
  imageCount: activeTab.images.length,
  images: activeTab.images,
}
```

Do not require an extra created-at prop: use a stable constant such as `1970-01-01T00:00:00.000Z`, which is not displayed by the viewer. Pass `initialIndex` to the existing viewer. Restore focus with `requestAnimationFrame` after close.

Use these data hooks:

```tsx
data-gallery-album-tabs-content="true"
data-gallery-album-tabs-variant={variant}
data-gallery-album-tabs-tablist="true"
data-gallery-album-tabs-panel={activeTab.id}
data-gallery-album-tabs-layout="rectangular-quilt"
data-gallery-album-tabs-tile="true"
```

The tab rail wrapper must use `overflow-x-auto`, stable one-line tabs (`flex-nowrap`), a minimum tab width, and the project's thin scrollbar treatment; do not wrap. Add a compact-screen edge fade with a CSS mask so clipped continuation is visibly discoverable, and remove that mask when the rail fits at wider breakpoints. On wide screens, apply `flex-1` to tabs so they divide the rail evenly.

- [ ] **Step 6: Run Task 2 tests**

Run the Task 2 command. Expected: PASS.

- [ ] **Step 7: Run regression tests for reused gallery behavior**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-viewer.int.spec.tsx tests/int/image-mosaic.int.spec.tsx
```

Expected: PASS with no behavior change in existing blocks/viewer.

- [ ] **Step 8: Review the Task 2 diff without staging**

Run `git diff --check -- src/blocks/GalleryAlbumTabs tests/int/gallery-album-tabs.int.spec.tsx`. Expected: clean.

---

### Task 3: Register the block in every production schema and renderer

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`
- Modify: `src/payload-types.ts` via generator

**Interfaces:**

- Consumes: `GalleryAlbumTabsBlock`, `GalleryAlbumTabsBlockComponent`.
- Produces: generated `GalleryAlbumTabsBlock` Payload type and Page/detail-template block union membership.

- [ ] **Step 1: Add failing registration tests**

Extend `page-blocks.int.spec.ts` to require `galleryAlbumTabs` exactly once in Pages and Reusable Sections, near `eventGallery`, and assert the schema defaults (`imagesPerLoad: '9'`, `tabVariant: 'underline'`). Extend the detail-template test so its standard block slug order still equals Pages exactly and includes `galleryAlbumTabs` before `newsEventsContent`.

```ts
expect(pageBlockSlugs.filter((slug) => slug === 'galleryAlbumTabs')).toHaveLength(1)
expect(reusableBlockSlugs.filter((slug) => slug === 'galleryAlbumTabs')).toHaveLength(1)
expect(detailStandardSlugs).toEqual(pageBlockSlugs)
```

- [ ] **Step 2: Run registration tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/page-blocks.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: FAIL because the block is not registered.

- [ ] **Step 3: Add explicit schema registrations**

Import `GalleryAlbumTabsBlock` in all three schema owners. Insert it immediately after `EventGalleryBlock` in Pages, Reusable Sections, and the standard portion of News Events Detail Template. Keep `NewsEventsContentBlock` last and unique.

- [ ] **Step 4: Add production rendering**

Import the production component in `renderPageBlocks.tsx` and add:

```tsx
case 'galleryAlbumTabs':
  return wrap(<GalleryAlbumTabsBlockComponent {...block} />)
```

Place the case beside `eventGallery`. Do not alter the `BlockErrorBoundary`, keys, Reusable Section depth guard, or other switch cases.

- [ ] **Step 5: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: success and generated `GalleryAlbumTabsBlock` fields in `src/payload-types.ts`.

- [ ] **Step 6: Run registration tests**

Run the Task 3 test command again. Expected: PASS.

- [ ] **Step 7: Run TypeScript at the schema boundary**

Run `pnpm exec tsc --noEmit --pretty false`. Expected: PASS or only failures from the not-yet-added live-preview switch; resolve no issue by unsafe double-casting.

- [ ] **Step 8: Review the Task 3 diff without staging**

Run `git diff --check` for the Task 3 files. Expected: clean.

---

### Task 4: Add client-safe live preview and nested dependency discovery

**Files:**

- Create: `src/blocks/GalleryAlbumTabs/PreviewComponent.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: `tests/int/event-gallery-data.int.spec.ts`
- Verify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Verify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Verify: `src/blocks/renderLivePreviewNewsEventDetailBlocks.tsx`

**Interfaces:**

- Consumes: existing `eventGalleryAlbums: EventGalleryAlbum[]` server-loaded snapshot and Task 1 relationship discovery.
- Produces:

```ts
export function GalleryAlbumTabsPreviewBlockComponent(
  props: GalleryAlbumTabsBlockLike & { albums: EventGalleryAlbum[] },
): React.ReactNode
```

- [ ] **Step 1: Add failing preview tests**

Add a live-preview test with a selected and unselected draft album:

```tsx
const layout = [
  {
    blockType: 'galleryAlbumTabs',
    galleryAlbums: ['draft-selected'],
    displayOrder: 'manual',
    imagesPerLoad: '6',
    tabVariant: 'pill',
    title: 'Draft album browser',
  },
] as unknown as NonNullable<Page['layout']>

const html = renderToStaticMarkup(
  renderLivePreviewPageBlocks(layout, EMPTY_REVIEW, EMPTY_NEWS, [], draftAlbums),
)

expect(html).toContain('Draft album browser')
expect(html).toContain('Selected draft album')
expect(html).not.toContain('Unselected draft album')
expect(html).toContain('data-gallery-album-tabs-variant="pill"')
```

Extend nested relationship-discovery coverage so a populated Reusable Section containing `galleryAlbumTabs` contributes album IDs once and still honors depth/cycle guards.

- [ ] **Step 2: Run preview tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/live-preview-renderer.int.spec.tsx tests/int/event-gallery-data.int.spec.ts
```

Expected: FAIL because the preview renderer lacks the block case/component.

- [ ] **Step 3: Implement the preview adapter**

Create:

```tsx
export function GalleryAlbumTabsPreviewBlockComponent({
  albums,
  displayOrder = 'latestEventDate',
  galleryAlbums,
  ...props
}: GalleryAlbumTabsBlockLike & { albums: EventGalleryAlbum[] }) {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums,
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  })
  return <GalleryAlbumTabsBlockPresentation {...props} albums={selectedAlbums} />
}
```

Do not import `getPublishedEventGalleryAlbums`, `getDraftEventGalleryAlbums`, Payload config, or any server-only module.

- [ ] **Step 4: Add the client-safe live-preview switch case**

Import the preview component in `renderLivePreviewPageBlocks.tsx` and add beside Event Gallery:

```tsx
case 'galleryAlbumTabs':
  return <GalleryAlbumTabsPreviewBlockComponent albums={eventGalleryAlbums} key={key} {...block} />
```

Do not change the Page preview function signature: the existing generalized `eventGalleryAlbums` snapshot already contains every selected Gallery Album discovered from the layout. News/Event detail preview delegates standard blocks through this same renderer and therefore needs no new client prop.

- [ ] **Step 5: Verify route loading contracts remain sufficient**

Confirm both authenticated routes still call `getGalleryAlbumIDsFromBlocks`, then `getDraftEventGalleryAlbums`, and pass only serializable snapshots into Page/News Event live preview. Add route assertions only if existing tests mock specific dependency arrays; do not add a second album loader.

- [ ] **Step 6: Run preview tests and the import-boundary regression**

Run:

```bash
pnpm exec vitest run tests/int/live-preview-renderer.int.spec.tsx tests/int/event-gallery-data.int.spec.ts tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS with no reachable `server-only` import from PageLivePreview or NewsEventLivePreview.

- [ ] **Step 7: Run TypeScript and review without staging**

Run `pnpm exec tsc --noEmit --pretty false` and `git diff --check`. Expected: PASS/clean.

---

### Task 5: Add the block picker thumbnail and operator documentation

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Create: `public/block-thumbnails/gallery-album-tabs.jpg` via generator
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes: `GalleryAlbumTabsBlockPresentation` and deterministic album fixtures.
- Produces: block picker definition/asset and maintained operator contracts.

- [ ] **Step 1: Add failing thumbnail contract**

Add:

```ts
expect(getBlockThumbnailDefinition('galleryAlbumTabs')).toMatchObject({
  filename: 'gallery-album-tabs.jpg',
  label: 'Gallery Album Tabs',
  slug: 'galleryAlbumTabs',
  stageAlignment: 'top',
})
expect(existsSync(resolve('public/block-thumbnails/gallery-album-tabs.jpg'))).toBe(true)
```

- [ ] **Step 2: Run the thumbnail test and verify failure**

Run `pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts`. Expected: FAIL because definition/fixture/asset are absent.

- [ ] **Step 3: Add definition and deterministic fixture**

Add the definition beside Event Gallery:

```ts
defineThumbnail({
  alt: 'Gallery Album Tabs block preview',
  filename: 'gallery-album-tabs.jpg',
  label: 'Gallery Album Tabs',
  slug: 'galleryAlbumTabs',
  stageAlignment: 'top',
})
```

Add a `galleryAlbumTabs` fixture using `GalleryAlbumTabsBlockPresentation`, at least three albums, `underline`, `imagesPerLoad="9"`, a concise section heading, and existing local fixture images. The thumbnail must visibly show All first, two album labels, an active underline, and a multi-image quilt.

- [ ] **Step 4: Generate the thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/gallery-album-tabs.jpg` is a 1600×900 JPEG and existing generated thumbnails remain valid.

- [ ] **Step 5: Run thumbnail contracts**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Update operator and architecture documentation**

Document in both maintained references:

- Explicit selected-album scope.
- Manual/latest Event Date ordering.
- Fixed first/default All tab and album-derived labels.
- 6/9/12 local reveal batches.
- Contained/Pill/Underline variants and Underline default.
- Horizontal compact-screen tab scrolling.
- Image-only rectangular quilt.
- Complete active-tab slideshow scope and captions.
- Production published filtering and draft live-preview snapshots.
- Empty-state behavior.

Do not rewrite historical plans/specs.

- [ ] **Step 7: Review Task 5 output without staging**

Run Prettier check on edited source/docs and `git diff --check`. Expected: clean.

---

### Task 6: Complete generated artifacts, regression coverage, visual QA, and project-context maintenance

**Files:**

- Modify: `src/payload-types.ts` via generator if Task 3 output changed after later edits.
- Modify: `.agents/skills/project-context/references/project-inventory.json` via updater.
- Review: all files in the File Map against `.agents/skills/project-context/references/change-impact-map.md`.

**Interfaces:**

- Consumes: Tasks 1–5 complete implementation.
- Produces: verified, documented, type-safe, uncommitted handoff.

- [ ] **Step 1: Regenerate Payload types from final schema**

Run `pnpm generate:types`. Expected: success and no manual edits in `src/payload-types.ts`.

- [ ] **Step 2: Run focused feature and gallery regression suites**

Run:

```bash
pnpm exec vitest run \
  tests/int/gallery-album-tabs.int.spec.tsx \
  tests/int/event-gallery-data.int.spec.ts \
  tests/int/event-gallery-render.int.spec.tsx \
  tests/int/event-gallery-viewer.int.spec.tsx \
  tests/int/image-mosaic.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: all files and tests pass.

- [ ] **Step 3: Run type, lint, format, and diff checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/GalleryAlbumTabs src/lib/eventGalleryShared.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx
pnpm exec prettier --check src/blocks/GalleryAlbumTabs src/lib/eventGalleryShared.ts docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Run bounded visual QA**

Start the existing development server if needed, create/use a local Page containing the block, and inspect one desktop and one mobile viewport in a single pass. Verify:

- Each tab variant matches the approved visual hierarchy.
- Underline is quiet and active state is unmistakable.
- Contained and Pill use theme tokens and do not shift layout.
- Many tabs scroll horizontally without wrapping or clipping focus rings.
- Active tabs scroll into view.
- Quilt ends on a straight boundary for counts 1–12 and has no oversized lead tile.
- Load More does not jump the tab rail.
- Focus, touch, reduced-motion, slideshow initial image, captions, and close restoration work.
- Light/dark and SNMIH theme contrast remain readable.

Batch any material fixes, then confirm desktop/mobile once more. Do not enter an open-ended polish loop.

- [ ] **Step 5: Run the Impeccable mechanical detector once**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/GalleryAlbumTabs
```

Expected: no unresolved mechanical layout/accessibility violations. Fix concrete findings in one batch and rerun only affected tests, not the detector.

- [ ] **Step 6: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

If sandbox policy blocks the inventory write, rerun only `pnpm project-context:update` with the required approval. Expected: `Project context is current`; the known stale knowledge-graph commit warning is non-blocking.

- [ ] **Step 7: Review final scope and status without staging**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git status --short
git diff --stat
git diff --check
```

Confirm:

- Every new block producer has production/live-preview/thumbnail/test/doc consumers.
- No Event Gallery or Image Mosaic behavior changed except the shared optional `mediaID` addition and dependency discovery.
- No public API, migration, dependency, stage, or commit was added.
- Any unrelated pre-existing dirty files remain preserved.

- [ ] **Step 8: Handoff**

Report the Admin configuration, runtime behavior, generated artifacts, tests/visual QA performed, project-context files changed, and any remaining warning. Explicitly state that nothing was staged or committed.
