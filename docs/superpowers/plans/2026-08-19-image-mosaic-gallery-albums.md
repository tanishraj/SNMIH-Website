# Image Mosaic Gallery Albums Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual/gallery-album content modes to Image Mosaic and a shared, configurable album slideshow behavior to Image Mosaic and Event Gallery without changing their approved layouts.

**Architecture:** Keep Gallery Albums as the only album data model and extract the existing Event Gallery viewer and album-overlay content into client-safe shared components. Production adapters load selected published albums on the server; live-preview adapters filter server-supplied draft snapshots. Image Mosaic retains its server-rendered manual path and uses a focused client island only for album-backed interactive tiles.

**Tech Stack:** Payload CMS 3 block fields and relationships, Next.js App Router server/client components, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, generated Payload types.

## Global Constraints

- Image Mosaic defaults to `manualImages`; legacy documents without `contentSource` preserve current output.
- Manual Image Mosaic items remain one-to-eight editor-authored images and never open an album slideshow.
- Gallery Albums mode requires explicit album selection, renders at most eight covers, and supports Latest Event Date and Manual order.
- `enableAlbumSlideshow` defaults to `true` for album-backed Image Mosaic and Event Gallery, including legacy Event Gallery documents where the field is absent.
- Disabling the slideshow produces static, non-focusable tiles without removing images or overlays.
- Overlay visibility and slideshow interaction remain independent.
- Manual image actions retain their navigation behavior and never trigger or sit inside a slideshow opener.
- Reuse Gallery Album normalization, ordering, overlay semantics, and viewer behavior; never query Payload in the browser.
- Preserve Event Gallery layout and Image Mosaic grid geometry, responsive behavior, section configuration, and block slugs.
- Do not change the `gallery-albums` collection schema or add automatic unselected-album discovery.
- Do not stage or commit unless the user explicitly requests it later.
- Run the project-context update/check loop after implementation.

---

## File Map

**Create:**

- `src/components/gallery-album-overlay-content.tsx` — shared count/date/title overlay stack.
- `src/components/gallery-slideshow-viewer.tsx` — shared client-safe viewer extracted from Event Gallery.
- `src/components/image-mosaic-album-grid.tsx` — focused client island for album tiles and viewer state.
- `src/components/image-mosaic-presentation.ts` — pure source and layout normalization.
- `src/blocks/ImageMosaic/Presentation.tsx` — source-agnostic presentation adapter.
- `src/blocks/ImageMosaic/PreviewComponent.tsx` — draft-snapshot preview adapter.

**Modify:**

- `src/components/event-gallery-viewer.tsx`
- `src/components/event-gallery-client.tsx`
- `src/components/event-gallery.tsx`
- `src/components/event-gallery-presentation.ts`
- `src/components/image-mosaic.tsx`
- `src/blocks/EventGallery/config.ts`
- `src/blocks/EventGallery/Presentation.tsx`
- `src/blocks/ImageMosaic/config.ts`
- `src/blocks/ImageMosaic/Component.tsx`
- `src/lib/eventGalleryShared.ts`
- `src/blocks/renderLivePreviewPageBlocks.tsx`
- `src/app/(frontend)/preview/page/[id]/page.tsx`
- `src/app/(frontend)/news-events/[slug]/page.tsx`
- `src/payload-types.ts`
- `src/block-thumbnails/fixtures.tsx` if the generated types require the default source explicitly
- `docs/guides/blocks.md`
- `.agents/skills/project-context/references/block-system.md`
- `.agents/skills/project-context/references/project-inventory.json`

**Focused tests:**

- `tests/int/image-mosaic.int.spec.tsx`
- `tests/int/event-gallery-data.int.spec.ts`
- `tests/int/event-gallery-presentation.int.spec.ts`
- `tests/int/event-gallery-selection.int.spec.tsx`
- `tests/int/event-gallery-render.int.spec.tsx`
- `tests/int/event-gallery-viewer.int.spec.tsx`
- `tests/int/live-preview-renderer.int.spec.tsx`
- `tests/int/live-preview-import-boundary.int.spec.ts`
- `tests/int/news-events-detail-template.int.spec.tsx`
- `tests/int/news-events-metadata-routes.int.spec.ts`

---

### Task 1: Shared Album Overlay And Slideshow Primitives

**Files:**

- Create: `src/components/gallery-album-overlay-content.tsx`
- Create: `src/components/gallery-slideshow-viewer.tsx`
- Modify: `src/components/event-gallery-viewer.tsx`
- Modify: `src/components/event-gallery-presentation.ts`
- Modify: `src/components/event-gallery-client.tsx`
- Test: `tests/int/event-gallery-presentation.int.spec.ts`
- Test: `tests/int/event-gallery-render.int.spec.tsx`
- Test: `tests/int/event-gallery-viewer.int.spec.tsx`

**Interfaces:**

- Produces `GalleryAlbumContentPosition = 'split' | 'center' | 'middleCenter'`.
- Produces `normalizeGalleryAlbumContentPosition(value): GalleryAlbumContentPosition`.
- Produces `GalleryAlbumOverlayContent` and `GallerySlideshowViewer`.
- Preserves `EventGalleryViewer` as a compatibility re-export.

- [ ] **Step 1: Write failing shared-presentation tests**

```tsx
expect(normalizeGalleryAlbumContentPosition('split')).toBe('split')
expect(normalizeGalleryAlbumContentPosition('center')).toBe('center')
expect(normalizeGalleryAlbumContentPosition('middleCenter')).toBe('middleCenter')
expect(normalizeGalleryAlbumContentPosition('bad-value')).toBe('split')

const html = renderToStaticMarkup(
  <GalleryAlbumOverlayContent
    album={albums[0]}
    formattedEventDate="21 Jun 2026"
    overlay={resolvedOverlay}
    position="middleCenter"
    showEventDate
    showImageCount
  />,
)
expect(html.indexOf('data-gallery-album-image-count')).toBeLessThan(html.indexOf('21 Jun 2026'))
expect(html.indexOf('21 Jun 2026')).toBeLessThan(html.indexOf(albums[0].title))
expect(html).toContain('font-[family-name:var(--font-text)]')
```

- [ ] **Step 2: Run tests and confirm the imports fail**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: FAIL because the shared modules do not exist.

- [ ] **Step 3: Implement the shared position and overlay contract**

```tsx
export type GalleryAlbumContentPosition = 'center' | 'middleCenter' | 'split'

export const normalizeGalleryAlbumContentPosition = (
  value: unknown,
): GalleryAlbumContentPosition =>
  value === 'center' || value === 'middleCenter' || value === 'split' ? value : 'split'

export type GalleryAlbumOverlayContentProps = {
  album: EventGalleryAlbum
  formattedEventDate?: string
  overlay: EventGalleryResolvedOverlay
  position: GalleryAlbumContentPosition
  showEventDate: boolean
  showImageCount: boolean
}
```

Render numeric-only count, date, and title in that order. Keep metadata `font-mono text-xs font-normal`
and title `font-[family-name:var(--font-text)] text-lg font-semibold sm:text-xl`.

- [ ] **Step 4: Extract the viewer without behavior changes**

Copy the complete current `event-gallery-viewer.tsx` implementation to
`gallery-slideshow-viewer.tsx`. Rename its props type to `GallerySlideshowViewerProps` and its exported
component to `GallerySlideshowViewer`; retain the full copied function body, helpers, keyboard logic,
autoplay logic, captions, focus logic, and markup unchanged.

Replace `event-gallery-viewer.tsx` with this compatibility surface:

```tsx
export {
  GallerySlideshowViewer as EventGalleryViewer,
  getEventGalleryAutoplayAction,
  getEventGalleryCaption,
} from '@/components/gallery-slideshow-viewer'
```

- [ ] **Step 5: Migrate Event Gallery to the shared components**

Remove its local overlay stack, use `GalleryAlbumOverlayContent`, import `GallerySlideshowViewer`, and
re-export shared position contracts from `event-gallery-presentation.ts`. Keep every quilt helper.

- [ ] **Step 6: Re-run Step 2**

Expected: PASS with viewer and quilt behavior unchanged.

- [ ] **Step 7: Run `git diff --check` and review the extraction; do not stage or commit**

---

### Task 2: Payload Schema For Sources, Albums, Overlays, And Slideshow Switches

**Files:**

- Modify: `src/blocks/ImageMosaic/config.ts`
- Modify: `src/blocks/EventGallery/config.ts`
- Test: `tests/int/image-mosaic.int.spec.tsx`
- Test: `tests/int/event-gallery-render.int.spec.tsx`

**Interfaces:**

- Produces Image Mosaic fields `contentSource`, `galleryAlbums`, `displayOrder`,
  `enableAlbumSlideshow`, `showEventDate`, `showImageCount`, and `cardTextLayout`.
- Produces Event Gallery field `enableAlbumSlideshow`.

- [ ] **Step 1: Write failing exact-schema tests**

```tsx
expect(getField(contentFields, 'contentSource')).toMatchObject({
  defaultValue: 'manualImages',
  options: [{ value: 'manualImages' }, { value: 'galleryAlbums' }],
  required: true,
  type: 'select',
})
expect(getField(contentFields, 'galleryAlbums')).toMatchObject({
  hasMany: true,
  maxRows: 8,
  relationTo: 'gallery-albums',
  type: 'relationship',
})
expect(getField(contentFields, 'displayOrder')?.defaultValue).toBe('latestEventDate')
expect(getField(contentFields, 'enableAlbumSlideshow')?.defaultValue).toBe(true)
expect(getField(themeFields, 'cardTextLayout')?.options?.map(({ value }) => value)).toEqual([
  'split',
  'center',
  'middleCenter',
])
expect(getField(eventGalleryContentFields, 'enableAlbumSlideshow')?.defaultValue).toBe(true)
```

Test every Admin condition for both sources and enabled/disabled overlays.

- [ ] **Step 2: Run the schema tests and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/image-mosaic.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx
```

Expected: FAIL because the fields are absent.

- [ ] **Step 3: Add source-aware Image Mosaic fields**

```ts
const isGalleryAlbumSource: Condition = (_data, siblingData) =>
  siblingData?.contentSource === 'galleryAlbums'
const isManualImageSource: Condition = (_data, siblingData) =>
  siblingData?.contentSource !== 'galleryAlbums'
const showsAlbumOverlayControls: Condition = (_data, siblingData) =>
  siblingData?.contentSource === 'galleryAlbums' && siblingData?.showImageOverlays !== false
```

Add the source select before source-specific fields. Keep manual `items` one-to-eight and conditional.
Because an Admin condition does not disable server validation, make both source collections
schema-optional and apply source-aware validators:

```ts
const validateManualItems: ArrayField['validate'] = (value, { siblingData }) =>
  siblingData?.contentSource === 'galleryAlbums' || (Array.isArray(value) && value.length > 0)
    ? true
    : 'Add at least one image.'

const validateGalleryAlbums: RelationshipField['validate'] = (value, { siblingData }) =>
  siblingData?.contentSource !== 'galleryAlbums' || (Array.isArray(value) && value.length > 0)
    ? true
    : 'Select at least one Gallery Album.'
```

Add a sortable `galleryAlbums` relationship capped at eight, Display Order, and Enable Album
Slideshow. Add metadata toggles and the three position values under Theme Settings. Retain the shared
media-overlay factories. Update schema tests to invoke both validators for both sources.

- [ ] **Step 4: Add Event Gallery's Content-tab slideshow checkbox**

```ts
{
  name: 'enableAlbumSlideshow',
  label: 'Enable Album Slideshow',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    description: 'Open the selected album in the full-screen slideshow when a gallery tile is selected.',
  },
} satisfies CheckboxField
```

- [ ] **Step 5: Re-run Step 2**

Expected: PASS.

- [ ] **Step 6: Run `git diff --check`; confirm no collection schema changed; do not stage or commit**

---

### Task 3: Shared Album Dependency Discovery

**Files:**

- Modify: `src/lib/eventGalleryShared.ts`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Test: `tests/int/event-gallery-data.int.spec.ts`
- Test: `tests/int/news-events-metadata-routes.int.spec.ts`

**Interfaces:**

- Produces `getGalleryAlbumIDsFromBlocks(value: unknown): string[]`.
- Preserves the old collector as an alias until all call sites migrate.

- [ ] **Step 1: Write a failing recursive dependency test**

```ts
expect(
  getGalleryAlbumIDsFromBlocks([
    { blockType: 'eventGallery', galleryAlbums: ['event-1'] },
    {
      blockType: 'imageMosaic',
      contentSource: 'galleryAlbums',
      galleryAlbums: ['mosaic-1', 'event-1'],
    },
    {
      blockType: 'imageMosaic',
      contentSource: 'manualImages',
      galleryAlbums: ['ignored'],
    },
    {
      blockType: 'reusableSection',
      section: {
        id: 'shared-gallery',
        layout: [
          {
            blockType: 'imageMosaic',
            contentSource: 'galleryAlbums',
            galleryAlbums: ['nested-1'],
          },
        ],
      },
    },
  ]),
).toEqual(['event-1', 'mosaic-1', 'nested-1'])
```

Also test malformed and cyclic objects with a ten-level depth guard.

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-data.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts
```

- [ ] **Step 3: Implement the recursive collector**

```ts
const isAlbumBackedBlock = (block: Record<string, unknown>) =>
  block.blockType === 'eventGallery' ||
  (block.blockType === 'imageMosaic' && block.contentSource === 'galleryAlbums')

export const getGalleryAlbumIDsFromBlocks = (value: unknown): string[] => {
  const relationships: unknown[] = []
  const visited = new WeakSet<object>()
  const visit = (blocks: unknown, depth = 0): void => {
    if (!Array.isArray(blocks) || depth > 10 || visited.has(blocks)) return
    visited.add(blocks)
    for (const entry of blocks) {
      if (!entry || typeof entry !== 'object') continue
      const block = entry as Record<string, unknown>
      if (isAlbumBackedBlock(block) && Array.isArray(block.galleryAlbums)) {
        relationships.push(...block.galleryAlbums)
      }
      if (block.blockType === 'reusableSection') {
        const section = block.section
        if (section && typeof section === 'object' && 'layout' in section) {
          visit((section as { layout?: unknown }).layout, depth + 1)
        }
      }
    }
  }
  visit(value)
  return getEventGalleryAlbumRelationshipIDs(relationships)
}
```

- [ ] **Step 4: Migrate both authenticated preview routes**

Replace the Event-Gallery-only collector with `getGalleryAlbumIDsFromBlocks`. Preserve the current
server-only draft load, Promise ordering, auth, metadata, and not-found behavior.

- [ ] **Step 5: Re-run Step 2**

Expected: PASS with combined, de-duplicated IDs in stable first-seen order.

- [ ] **Step 6: Run `git diff --check`; do not stage or commit**

---

### Task 4: Image Mosaic Album Presentation And Production Loading

**Files:**

- Create: `src/components/image-mosaic-presentation.ts`
- Create: `src/components/image-mosaic-album-grid.tsx`
- Create: `src/blocks/ImageMosaic/Presentation.tsx`
- Modify: `src/components/image-mosaic.tsx`
- Modify: `src/blocks/ImageMosaic/Component.tsx`
- Test: `tests/int/image-mosaic.int.spec.tsx`
- Test: `tests/int/event-gallery-selection.int.spec.tsx`

**Interfaces:**

- Produces `ImageMosaicContentSource`, `normalizeImageMosaicContentSource`, and pure grid helpers.
- Produces `ImageMosaicBlockLike` and `ImageMosaicBlockPresentation`.
- Produces `ImageMosaicAlbumGrid` as the only new Image Mosaic client island.

- [ ] **Step 1: Write failing source and album rendering tests**

```tsx
expect(normalizeImageMosaicContentSource(undefined)).toBe('manualImages')
expect(normalizeImageMosaicContentSource('galleryAlbums')).toBe('galleryAlbums')
expect(normalizeImageMosaicContentSource('invalid')).toBe('manualImages')

const enabled = renderToStaticMarkup(
  <ImageMosaicBlockPresentation
    albums={albumFixtures}
    cardTextLayout="middleCenter"
    contentSource="galleryAlbums"
    enableAlbumSlideshow
    galleryAlbums={['album-2', 'album-1']}
    showEventDate
    showImageCount
    title="Campus albums"
  />,
)
expect(enabled).toContain('data-image-mosaic-source="galleryAlbums"')
expect(enabled).toContain('data-gallery-album-image-count="true"')
expect(enabled).toContain('data-image-mosaic-album-interaction="slideshow"')

const disabled = renderToStaticMarkup(
  <ImageMosaicBlockPresentation
    albums={albumFixtures}
    contentSource="galleryAlbums"
    enableAlbumSlideshow={false}
    galleryAlbums={['album-1']}
    title="Static albums"
  />,
)
expect(disabled).toContain('data-image-mosaic-album-interaction="static"')
expect(disabled).not.toContain('<button')
```

Keep the existing manual tests and assert a legacy source does not call the album loader.

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/image-mosaic.int.spec.tsx tests/int/event-gallery-selection.int.spec.tsx
```

- [ ] **Step 3: Extract pure Image Mosaic normalization and grid helpers**

```ts
export type ImageMosaicContentSource = 'galleryAlbums' | 'manualImages'
export const normalizeImageMosaicContentSource = (value: unknown): ImageMosaicContentSource =>
  value === 'galleryAlbums' ? 'galleryAlbums' : 'manualImages'
export const getImageMosaicGridCount = (count: number) =>
  Math.max(1, Math.min(8, count)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export const getImageMosaicSpanClassName = (count: number, index: number) =>
  count >= 5 ? (mosaicSpanClasses[index] ?? '') : ''
```

Move only the class data needed by both paths; class strings must remain identical.

- [ ] **Step 4: Build the album client island**

```tsx
'use client'

export type ImageMosaicAlbumGridProps = {
  albums: EventGalleryAlbum[]
  cardTextLayout: GalleryAlbumContentPosition
  enableAlbumSlideshow: boolean
  overlay: EventGalleryResolvedOverlay
  showEventDate: boolean
  showImageCount: boolean
  showImageOverlays: boolean
  size: ImageMosaicSize
}
```

Use the current Image Mosaic count/span/height classes. Enabled tiles are semantic buttons that store
the opener ref and open `GallerySlideshowViewer`; disabled tiles use identical non-interactive `div`
surfaces. Use `GalleryAlbumOverlayContent` and Event Gallery's UTC date formatting behavior.

- [ ] **Step 5: Create the source-agnostic presentation adapter**

```ts
const source = normalizeImageMosaicContentSource(contentSource)
const slideshowEnabled = enableAlbumSlideshow ?? true
const position = normalizeGalleryAlbumContentPosition(cardTextLayout)

if (source === 'galleryAlbums') {
  const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums).slice(0, 8)
  const selectedAlbums = selectAndOrderEventGalleryAlbums({
    albums: albums ?? [],
    displayOrder: displayOrder ?? 'latestEventDate',
    selectedAlbumIDs,
  }).slice(0, 8)
  return selectedAlbums
}
return resolveManualImageMosaicItems(items).slice(0, 8)
```

Extract the current manual item mapping as `resolveManualImageMosaicItems`; its image, background
position, action resolution/display mode, title, ID, and invalid-media filtering must remain
identical. Feed the returned source items into the shared section wrapper and return nothing without
a trimmed section title or usable source items.

- [ ] **Step 6: Make the production adapter source-aware**

Make `ImageMosaicBlockComponent` async. Manual mode immediately uses the presentation without calling
the server album loader. Album mode normalizes at most eight IDs, returns null before querying when
empty, fetches published albums once, and passes them to the presentation.

- [ ] **Step 7: Add all three positions to manual overlays**

Keep title and `ContentActions` behavior, avoid nested controls, and add source/position data
attributes. Do not change grid geometry or CSS overlay animation contracts.

- [ ] **Step 8: Re-run Step 2**

Expected: PASS; manual output is preserved, album output is ordered/capped, and manual mode makes no
album query.

- [ ] **Step 9: Run `git diff --check`; confirm only the album grid owns new state; do not stage or commit**

---

### Task 5: Configurable Static Event Gallery Cards

**Files:**

- Modify: `src/blocks/EventGallery/Presentation.tsx`
- Modify: `src/components/event-gallery.tsx`
- Modify: `src/components/event-gallery-client.tsx`
- Test: `tests/int/event-gallery-render.int.spec.tsx`

**Interfaces:**

- Consumes `enableAlbumSlideshow?: boolean | null` and resolves missing values to `true`.

- [ ] **Step 1: Write failing enabled, disabled, and legacy tests**

```tsx
const enabled = renderToStaticMarkup(
  <EventGallery albums={albums} enableAlbumSlideshow title="Event gallery" />,
)
expect(enabled).toContain('data-event-gallery-interaction="slideshow"')
expect(enabled).toContain('<button')

const disabled = renderToStaticMarkup(
  <EventGallery albums={albums} enableAlbumSlideshow={false} title="Static gallery" />,
)
expect(disabled).toContain('data-event-gallery-interaction="static"')
expect(disabled).not.toContain('<button')
expect(disabled).toContain(albums[0].title)

const legacy = renderToStaticMarkup(<EventGallery albums={albums} title="Legacy gallery" />)
expect(legacy).toContain('data-event-gallery-interaction="slideshow"')
```

Testing Library must also prove enabled click opens the viewer and disabled output has no button role.

- [ ] **Step 2: Run the test and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/event-gallery-render.int.spec.tsx
```

- [ ] **Step 3: Forward the normalized setting through both presentation layers**

Add the property to `EventGalleryBlockLike`, `EventGalleryProps`, and `EventGalleryClientProps`; always
resolve with `enableAlbumSlideshow ?? true`.

- [ ] **Step 4: Render one visual card with semantic enabled/static wrappers**

Keep the existing image/overlay surface as the `children` passed to this local wrapper:

```tsx
type EventGalleryCardInteractionProps = {
  album: EventGalleryAlbum
  children: React.ReactNode
  enabled: boolean
  onOpen: (button: HTMLButtonElement, album: EventGalleryAlbum) => void
}

function EventGalleryCardInteraction({
  album,
  children,
  enabled,
  onOpen,
}: EventGalleryCardInteractionProps) {
  if (!enabled) {
    return (
      <div
        className="block h-full w-full overflow-hidden rounded-md border border-border text-left"
        data-event-gallery-interaction="static"
      >
        {children}
      </div>
    )
  }

  return (
    <button
      aria-label={`Open ${album.title} gallery with ${album.imageCount} ${album.imageCount === 1 ? 'image' : 'images'}`}
      className="block h-full w-full cursor-pointer overflow-hidden rounded-md border border-border text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
      data-event-gallery-interaction="slideshow"
      onClick={(event) => onOpen(event.currentTarget, album)}
      type="button"
    >
      {children}
    </button>
  )
}
```

Mount the viewer only after an enabled card has set `activeAlbum`; static cards must not update the
opener ref or active state.

- [ ] **Step 5: Re-run Step 2**

Expected: PASS, with identical card geometry and overlays in both modes.

- [ ] **Step 6: Run `git diff --check`; verify static cards expose no control semantics; do not stage or commit**

---

### Task 6: Authenticated Live Preview For Album-Backed Image Mosaic

**Files:**

- Create: `src/blocks/ImageMosaic/PreviewComponent.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Test: `tests/int/live-preview-renderer.int.spec.tsx`
- Test: `tests/int/live-preview-import-boundary.int.spec.ts`
- Test: `tests/int/news-events-detail-template.int.spec.tsx`
- Test: `tests/int/news-events-metadata-routes.int.spec.ts`

**Interfaces:**

- Produces `ImageMosaicPreviewBlockComponent({ albums, ...block })`.
- Consumes the existing server-provided `EventGalleryAlbum[]` preview snapshot.

- [ ] **Step 1: Write failing snapshot-selection and import-boundary tests**

```tsx
const layout = [
  {
    blockType: 'imageMosaic',
    contentSource: 'galleryAlbums',
    displayOrder: 'manual',
    enableAlbumSlideshow: false,
    galleryAlbums: ['draft-mosaic-album'],
    title: 'Draft mosaic albums',
  },
  {
    blockType: 'eventGallery',
    galleryAlbums: ['draft-event-album'],
    title: 'Draft event gallery',
  },
] as unknown as NonNullable<Page['layout']>

expect(html).toContain('Draft mosaic albums')
expect(html).toContain('data-image-mosaic-source="galleryAlbums"')
expect(html).toContain('Draft event gallery')
const mosaicStart = html.indexOf('Draft mosaic albums')
const eventStart = html.indexOf('Draft event gallery')
const mosaicSection = html.slice(mosaicStart, eventStart)
expect(mosaicSection).not.toContain('Unselected album')
```

Extend import traversal so the Image Mosaic preview adapter is reachable while
`src/lib/eventGallery.ts`, `@payload-config`, and `server-only` remain unreachable from both live
preview client entries.

- [ ] **Step 2: Run the focused preview tests and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx tests/int/news-events-metadata-routes.int.spec.ts
```

- [ ] **Step 3: Create the query-free preview adapter**

```tsx
export function ImageMosaicPreviewBlockComponent({
  albums,
  ...block
}: ImageMosaicBlockLike & { albums: EventGalleryAlbum[] }) {
  return <ImageMosaicBlockPresentation {...block} albums={albums} />
}
```

- [ ] **Step 4: Replace the live-preview switch case**

```tsx
case 'imageMosaic':
  return <ImageMosaicPreviewBlockComponent albums={eventGalleryAlbums} key={key} {...block} />
```

Do not import the production server loader into the client-safe live-preview renderer.

- [ ] **Step 5: Verify Page and News Event detail preview propagation**

Keep `renderLivePreviewNewsEventDetailBlocks.tsx` forwarding the same serializable album snapshot to
`renderLivePreviewPageBlockNode`; no second prop family or query is needed.

- [ ] **Step 6: Re-run Step 2**

Expected: PASS, including import-boundary traversal.

- [ ] **Step 7: Run `git diff --check` and `pnpm exec tsc --noEmit --pretty false`**

Expected: only generated Payload type mismatches may remain before Task 7; no server-only boundary
failure. Do not stage or commit.

---

### Task 7: Generated Types, Documentation, Context, And Full Verification

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx` if generated types require it
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Produces current generated Payload types, block documentation, and project-context inventory.

- [ ] **Step 1: Regenerate Payload types**

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains both new block contracts with no generation error.

- [ ] **Step 2: Keep thumbnail fixtures explicitly manual if required**

Add only `contentSource: 'manualImages'` to the existing `blockType: 'imageMosaic'` fixture object.
Leave every existing item, title, alignment, appearance, and overlay value unchanged. Do not convert
the thumbnail to album data or regenerate images unless its rendered output changes.

- [ ] **Step 3: Update the two block guides**

Document both Image Mosaic sources, the eight-album limit, explicit selection/order, all three overlay
positions, both slideshow switches, legacy defaults, and server-loaded preview snapshots.

- [ ] **Step 4: Run all affected integration tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/image-mosaic.int.spec.tsx tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-selection.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-viewer.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx tests/int/news-events-metadata-routes.int.spec.ts
```

Expected: PASS with no skipped or flaky tests.

- [ ] **Step 5: Run type, lint, format, and diff validation**

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/ImageMosaic src/blocks/EventGallery src/components/image-mosaic.tsx src/components/image-mosaic-album-grid.tsx src/components/image-mosaic-presentation.ts src/components/event-gallery.tsx src/components/event-gallery-client.tsx src/components/event-gallery-presentation.ts src/components/event-gallery-viewer.tsx src/components/gallery-album-overlay-content.tsx src/components/gallery-slideshow-viewer.tsx src/lib/eventGalleryShared.ts src/blocks/renderLivePreviewPageBlocks.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' 'src/app/(frontend)/news-events/[slug]/page.tsx' tests/int/image-mosaic.int.spec.tsx tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx
pnpm exec prettier --check src/blocks/ImageMosaic src/blocks/EventGallery src/components/image-mosaic.tsx src/components/image-mosaic-album-grid.tsx src/components/image-mosaic-presentation.ts src/components/event-gallery.tsx src/components/event-gallery-client.tsx src/components/event-gallery-presentation.ts src/components/event-gallery-viewer.tsx src/components/gallery-album-overlay-content.tsx src/components/gallery-slideshow-viewer.tsx src/lib/eventGalleryShared.ts src/blocks/renderLivePreviewPageBlocks.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' 'src/app/(frontend)/news-events/[slug]/page.tsx' tests/int/image-mosaic.int.spec.tsx tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: every command exits successfully.

- [ ] **Step 6: Run the required project-context update/check loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The existing stale knowledge-graph warning may remain only if
unchanged.

- [ ] **Step 7: Final scope and worktree review**

```bash
git status --short
git diff --stat
git diff --check
```

Confirm unrelated dirty-worktree changes remain untouched and nothing is staged or committed. Report
changed files, focused test totals, type/lint/format results, and project-context files updated.
