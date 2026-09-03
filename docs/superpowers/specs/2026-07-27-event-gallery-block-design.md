# Event Gallery Block Design

## Objective

Add an **Event Gallery** page block that automatically displays published Gallery Albums such as New Batch Day, Yoga Day, Independence Day, and AIDS Day Awareness. Selecting an album opens its images in a full-screen viewer with previous, next, thumbnail, counter, and close controls.

## Editorial model

### Gallery Albums collection

Create a dedicated `gallery-albums` collection in the Website Content admin group. It remains separate from the existing editorial Tags collection.

Each album contains:

- `title`: required editor-facing album name.
- `slug`: generated from the title.
- `description`: optional short album summary.
- `eventDate`: optional event date for card metadata.
- `images`: required ordered array with at least one row.
  - `image`: required upload relationship to the existing Media collection.
  - `caption`: optional public caption for that image.

The first valid image is the album cover. Editors reorder the image rows to control both the cover and full-screen sequence. Existing Media assets can be reused in multiple albums.

Gallery Albums use Payload drafts, timestamps, and the existing `manage_media` capability for administration. Public reads expose only published albums. Media-usage detection includes every album image so an asset cannot be deleted while an album references it.

### Ordering

The Event Gallery loads every published album automatically and sorts by `createdAt` descending. The most recently created album appears first. `eventDate` is display metadata and does not affect ordering.

## Event Gallery page block

Register a new Payload block with:

- Slug: `eventGallery`
- Singular label: `Event Gallery`
- Content fields: eyebrow, required title, and optional description.
- Layout fields: shared appearance controls, content alignment, and compact/default/comfortable size.

The block does not store an album selection. Its public component loads published albums, while the authenticated page-preview route preloads draft-aware album data and passes it to a preview presentation component. This mirrors the existing server/preview separation used by data-backed blocks and avoids client-side Payload queries or preview loaders.

If there are no valid published albums, the public block renders nothing. Albums with no resolvable images are omitted defensively even though the CMS requires at least one image.

## Album grid

Install `@shadcnblocks/projects5` through the project-aware shadcn CLI and adapt it as the album-grid foundation.

Preserve its essential behavior:

- Responsive one-column to two-column album grid.
- Image-led bordered cards.
- Subtle image-scale hover treatment.
- Scroll-entry motion that respects reduced-motion preferences.

Align it with existing blocks:

- Use the shared `max-w-screen-2xl` container and mobile padding.
- Use the established eyebrow, `text-3xl sm:text-4xl` heading, description, alignment, and size patterns instead of the registry block's oversized uppercase heading.
- Use Payload Media image helpers and semantic theme colors.
- Use the project's shared appearance controls and border behavior.
- Display the album title, optional event date, and image count.
- Make the entire card an accessible button that opens the viewer.

The registry's hardcoded project content and outbound project links are removed because albums come from Payload.

## Full-screen viewer

Use `@shadcnblocks/product-gallery2` as the closest registry reference for full-screen viewing and PhotoSwipe behavior, then adapt it for event albums and add the required thumbnail strip.

The viewer provides:

- Full-viewport image presentation using `object-contain`.
- Previous and next controls.
- Close control.
- Current image counter.
- Horizontally scrollable thumbnail strip.
- Active-thumbnail indication.
- Clicking a thumbnail navigates directly to that image.
- Arrow-key navigation, Escape to close, focus restoration, body-scroll locking, touch swiping, and wheel/pinch zoom.
- Optional image caption.
- Accessible control labels and visible focus states.

When an album has one image, previous/next controls and the thumbnail strip are hidden. Closing the viewer returns focus to the album card that opened it.

The viewer uses semantic background/foreground tokens and the project's Button styling rather than copying registry-specific colors or icon sizing.

## Data flow and component boundaries

1. `GalleryAlbums` owns album metadata and ordered Media relationships.
2. A server-only loader queries published or draft-aware albums and normalizes Media documents into serializable album/image view models.
3. `EventGalleryBlockComponent` loads published albums for normal pages.
4. `EventGalleryPreviewBlockComponent` receives the draft-aware snapshot from the authenticated preview route.
5. A server-safe presentation component renders the shared block heading and passes normalized albums to the client grid.
6. A focused client component owns album selection and viewer state.
7. A focused viewer component owns PhotoSwipe lifecycle, navigation, thumbnails, and cleanup.

This keeps Payload access on the server and interactive state in small client-only units.

## Registration and previews

- Register `GalleryAlbums` in `payload.config.ts`.
- Register `EventGalleryBlock` in the Pages layout.
- Add public and live-preview render cases.
- Add a block-thumbnail definition, deterministic fixture, generated JPEG, and preview coverage.
- Regenerate Payload types and the import map after schema and admin registration changes.

## Validation and testing

Tests cover:

- Gallery Album schema, required image rows, drafts, access, and newest-first loader query.
- Album normalization, image order, first-image cover selection, optional captions, and invalid-image filtering.
- Media usage and deletion protection for album images.
- Event Gallery Payload fields and registration.
- Public and live-preview data paths.
- Projects 5-aligned grid semantics, responsive metadata, and empty states.
- Viewer open/close, previous/next, thumbnail selection, single-image controls, keyboard handling, focus restoration, and reduced motion.
- Thumbnail metadata and generated image dimensions.
- Payload type generation, import-map generation, ESLint, and focused integration tests.

## Out of scope

- Reusing the existing editorial Tags collection.
- Assigning gallery albums through free-text Media tags.
- Per-page album selection or manual album ordering.
- Dedicated album detail pages or public album URLs.
- Video, audio, document, download, social-sharing, or upload-from-frontend support.
- Changing existing Gallery Showcase or Image Mosaic blocks.
