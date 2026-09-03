# Gallery Album Tabs Block Design

**Date:** 2026-08-19
**Status:** Approved design
**Scope:** New reusable Page block for browsing selected Gallery Albums through tabs and a paged image quilt.

## Objective

Create a dedicated `Gallery Album Tabs` block that gives editors an explicit, reusable way to present selected Gallery Albums. The first tab is always `All`; each following tab represents one selected album and uses that album's current title. Visitors can reveal images in batches and open the complete active-tab image set in the existing full-screen slideshow.

The block must reuse the project's existing Gallery Album normalization, ordering, media presentation, slideshow, block appearance, section action, live-preview, thumbnail, and rendering contracts. Event Gallery and Image Mosaic remain separate and unchanged.

## Content Model

The block exposes the following fields under the Content tab:

- Optional `eyebrow`.
- Optional `title`.
- Optional `accentTitle`.
- Optional `description`.
- Shared header actions.
- Shared footer actions.
- Required sortable `galleryAlbums` relationship to `gallery-albums`.
- `displayOrder`: `latestEventDate` or `manual`; default `latestEventDate`.
- `allTabLabel`; default `All`. A blank value resolves to `All`.
- `imagesPerLoad`: `6`, `9`, or `12`; default `9`.
- `loadMoreLabel`; default `Load More`.
- `emptyStateMessage`; default `No gallery images available.`

Album tabs are not independently renamed in this block. Their visitor-facing labels always come from the selected Gallery Album titles so the label cannot drift from its source.

## Theme Settings

The block reuses the existing shared section configuration:

- Block appearance.
- Section content alignment.
- Header-action vertical alignment where applicable.
- Section padding.

It adds a required `tabVariant` select with three options:

1. `contained` — a bordered rectangular rail with a filled active tab.
2. `pill` — a rounded bordered rail with a filled active tab.
3. `underline` — a quiet divider rail with an active underline.

`underline` is the default and the legacy fallback.

All variants use semantic theme tokens for surfaces, borders, foregrounds, focus, and primary emphasis. They do not introduce hardcoded SNMIH-specific colors.

## Album Selection and Ordering

Editors explicitly select the albums used by each block instance. The public renderer loads only selected published albums. Authenticated live preview may load selected draft albums through the existing server-side snapshot pattern.

Album order resolves as follows:

- `manual`: preserve the editor's relationship order.
- `latestEventDate`: sort newest valid Event Date first, then newest creation date, then selection order as the stable tie-breaker.

Missing relationships, unpublished albums, albums without a valid title, and albums without valid images are skipped without failing the block.

## Tab and Image Grouping

`All` is always the first and initially selected tab. Each usable selected album contributes one additional tab in resolved album order.

- An album tab contains every valid image belonging to that album, preserving the album's image order.
- `All` flattens images in resolved album order and each album's internal image order.
- If the same Media document appears in more than one album, it remains visible within each relevant album tab but appears only once in `All`.
- All-tab de-duplication uses the normalized media/image identity and retains the first occurrence.

The block does not add separate tab rows in Admin. Tabs are derived from the selected relationships at runtime.

## Progressive Image Reveal

Each tab maintains its own visible-image count. Initially it displays `imagesPerLoad` images. `Load More` reveals the next batch of the same size and disappears when all images for that tab are visible.

All selected album metadata is loaded by the server and supplied to the client component. Load More is therefore a local reveal rather than a public API request. Next Image only requests image assets that are actually mounted. This keeps interaction immediate and allows the slideshow to know the complete active-tab image set without a second request.

Switching tabs preserves each tab's reveal progress for the current mounted block instance.

## Mosaic Presentation

The active tab uses the existing responsive rectangular quilt language:

- One column on phones.
- Two columns on tablets.
- Three columns on laptops.
- Four columns on wide desktops.
- The number of active columns is bounded by the number of currently visible images.

The quilt uses moderate, count-aware row spans so it ends on a straight rectangular boundary without horizontal spans or an oversized lead image. Tiles are image-only; they do not render captions or album metadata overlays. Captions remain available in the slideshow.

## Tab Presentation and Responsiveness

On desktop, tabs share the available rail width evenly when they fit. On constrained widths or when many albums are selected, the tab list remains one row and scrolls horizontally rather than wrapping. The newly active tab is scrolled into view.

The three variants share identical behavior and differ only in presentation:

- Contained: square/semantic-radius outer border, separated active fill.
- Pill: fully rounded outer rail and active tab.
- Underline: bottom divider and active underline, with no surrounding filled container.

Tab labels remain readable, use the project's text family, and do not truncate to an ambiguous label. The rail provides an unobtrusive overflow cue on compact screens.

## Slideshow Interaction

Every visible image tile is a button that opens the existing full-screen Gallery Slideshow Viewer.

- From an album tab, the slideshow contains the complete image set for that album.
- From `All`, the slideshow contains the complete de-duplicated All image set.
- The selected image is the initially active slide, including images revealed through Load More.
- The slideshow uses the full active-tab set, not only the currently visible batch.
- Image captions appear in the slideshow through the existing normalized image model.

The block does not add a slideshow-disable option. Opening the image viewer is the block's defined primary interaction.

## Section and Empty States

The section header is optional and follows the same shared composition used by News & Events Tabs. If header content is absent, no empty header wrapper or artificial header gap is rendered.

When the resolved block has no usable images, the configured empty-state message is rendered inside the section. A configured header and footer actions remain visible around that state. The entire block is not silently removed merely because selected albums are unavailable publicly.

Load More cannot enter a network error state because it reveals already normalized client data. Invalid image records are removed before presentation.

## Accessibility and Motion

The client component follows the WAI-ARIA tabs pattern:

- The rail uses `role="tablist"` with an accessible label.
- Controls use `role="tab"`, `aria-selected`, `aria-controls`, stable IDs, and roving `tabIndex`.
- Panels use `role="tabpanel"` and `aria-labelledby`.
- Arrow Left/Right, Home, and End move and activate tabs, wrapping at the ends.
- Mouse selection and keyboard selection produce the same state.

Image buttons expose descriptive labels containing the image position and active tab or album name. Focus returns to the opener after the slideshow closes. Visible focus indicators use theme tokens. Scroll and tile transitions respect `prefers-reduced-motion`; content is never hidden by default while hydration completes.

## Architecture and Reuse

Create an isolated block rather than extending Event Gallery:

- A Payload block config owns editor fields and labels.
- Shared pure presentation helpers normalize tab variant, batch size, labels, album order, All grouping, and quilt geometry.
- A server component loads selected published Gallery Albums with the existing loader and selection utilities.
- A presentation component owns section appearance and header/footer composition.
- A focused client component owns tab state, reveal counts, keyboard navigation, compact-screen tab scrolling, and slideshow state.
- Existing normalized `EventGalleryAlbum` and image types remain the media boundary unless implementation exposes a smaller shared name without changing their shape.
- Existing Gallery Slideshow Viewer is reused and extended only if it needs an explicit initial image index.

The block is registered independently in Pages, Reusable Sections, production rendering, and client-safe live preview. Existing explicit registries remain explicit; no cross-environment global block registry is introduced.

## Live Preview

Authenticated Page and News/Event-detail live preview discover selected Gallery Album relationship IDs from the new block, including supported populated Reusable Sections. The route/server layer loads draft album snapshots and passes serializable data to the client-safe preview renderer.

The live-preview client must not import Payload-backed loaders or production server-only block graphs. Preview and production share pure normalization and presentation wherever environment boundaries permit.

## Thumbnail and Documentation

The block receives:

- A deterministic thumbnail fixture showing `All` plus album-derived tabs and an image quilt.
- A generated 1600×900 picker thumbnail.
- Registration and thumbnail contract coverage.
- Generated Payload types.
- Operator documentation describing selection, ordering, batch reveal, variants, slideshow scope, and public/draft behavior.
- Project-context inventory and block-system documentation updates.

## Test Contract

Focused tests cover:

- Block schema, defaults, conditions, and registration parity.
- Published-only production loading and draft-aware preview snapshots.
- Manual/latest album ordering and invalid relationship handling.
- Album-derived labels and fixed first/default All tab.
- Stable All flattening and cross-album de-duplication.
- Per-tab initial counts, independent Load More progress, and button disappearance.
- Contained, Pill, and Underline variant output and fallback behavior.
- Responsive quilt contracts and count-aware rectangular completion.
- Accessible tabs semantics and Arrow/Home/End behavior.
- Horizontal overflow behavior and active-tab visibility hook.
- Slideshow active set, initial selected image, captions, close, and focus restoration.
- Empty-state behavior with and without section header content.
- Production Page rendering, Reusable Sections, client-safe live preview, thumbnails, and generated-type contracts.

Required verification includes focused tests, Page/Reusable/live-preview/thumbnail contracts, Payload type generation, TypeScript, targeted lint/format checks, project-context update/check, and final change-impact review.

## Explicit Non-Goals

- No automatic inclusion of every published Gallery Album.
- No editor-authored per-tab labels other than the All label.
- No per-image overlay configuration in this block.
- No public batch-fetch API.
- No changes to Event Gallery or Image Mosaic behavior.
- No collection schema migration.
