# Event Gallery Album Selection Design

## Objective

Allow editors to configure which Gallery Albums appear in each Event Gallery
page block. Editors can select existing albums or create a Gallery Album from
the relationship field. Each block supports manual ordering or automatic
ordering by the album's Event Date.

This document updates the Event Gallery behavior defined in
`2026-07-27-event-gallery-block-design.md`. The original automatic
all-published-albums feed is replaced by explicit per-block selection.

## Editorial model

Add these fields to the Event Gallery block's **Content** tab:

- `galleryAlbums`: a required, multi-value relationship to `gallery-albums`.
  The Payload relationship UI allows editors to search for existing albums and
  create an album from the relationship drawer. Its admin configuration
  explicitly enables creation and sortable selected values so manual order can
  be changed without removing and re-adding albums.
- `displayOrder`: a required select field with:
  - `latestEventDate`: default; sort selected albums by Event Date.
  - `manual`: preserve the order stored by the relationship field.

The relationship field is the source of truth for inclusion. An album appears
in a block only when that album is selected in that block.

Existing Event Gallery blocks have no relationship value after this schema
change. They render nothing until an editor selects one or more albums. This
prevents an existing block from unexpectedly continuing to expose every
published album.

## Ordering

### Latest Event Date

Sort selected albums using these rules:

1. Albums with an Event Date appear before albums without one.
2. Dated albums sort by `eventDate` descending.
3. Equal Event Dates sort by `createdAt` descending.
4. Albums without an Event Date sort by `createdAt` descending.

### Manual

Preserve the order of the IDs stored in `galleryAlbums`. The loader must not
rely on database result order because an `in` query does not guarantee the
relationship order.

## Public data flow

1. The page block supplies the selected Gallery Album relationships and
   `displayOrder`.
2. The server component extracts stable album IDs from either populated
   relationships or raw IDs.
3. If no valid IDs remain, the block renders nothing and does not query every
   album.
4. The published loader queries only the selected IDs and published album
   versions.
5. Album documents are normalized through the existing Event Gallery media
   normalization layer.
6. The ordering function applies manual or Latest Event Date ordering.
7. The existing album grid and full-screen viewer render the result without
   visual or interaction changes.

Unselected, unpublished, deleted, unresolved, or image-less albums do not
render. If filtering removes every selection, the block renders nothing.

## Draft live preview

The authenticated page-preview route detects Event Gallery blocks and gathers
the union of their selected album IDs. It loads only those draft-aware albums
once, then passes the normalized snapshot to the client-safe preview renderer.

Each Event Gallery preview block filters the shared snapshot back to its own
selection and applies its own `displayOrder`. This supports multiple Event
Gallery blocks on one page without importing server-only Payload modules into
the live-preview client graph.

Creating or editing a Gallery Album through Payload remains covered by the
existing route refresh behavior. After the related document is saved and
selected, preview shows its current draft-aware content.

## Component boundaries

- `EventGalleryBlock` owns the Payload relationship and ordering fields.
- The Event Gallery server loader accepts selected IDs and returns normalized
  published or draft-aware albums.
- A shared selection-and-ordering helper extracts IDs, filters normalized
  albums, and applies deterministic ordering.
- `EventGalleryBlockComponent` resolves the public selection.
- `EventGalleryPreviewBlockComponent` resolves one block from the shared draft
  snapshot.
- Existing presentation, card-grid, and PhotoSwipe viewer components remain
  unchanged.

## Error and empty-state behavior

- Missing or empty `galleryAlbums`: render nothing.
- Invalid relationship values: ignore them.
- Selected draft or unpublished album on a public page: omit it.
- Selected album without a resolvable image: omit it.
- Missing or invalid Event Date in Latest Event Date mode: place the album
  after dated albums.
- Equal dates: resolve deterministically using `createdAt`, then the stored
  relationship order.

No public error message is shown for filtered or missing albums. Editors can
see the underlying relationship state in Payload.

## Testing

Tests cover:

- The required `galleryAlbums` multi-relationship, its `gallery-albums`
  relation, and creation-enabled, sortable admin behavior.
- The `displayOrder` options and `latestEventDate` default.
- ID extraction from raw and populated relationships.
- Published queries restricted to selected IDs.
- Draft-aware queries restricted to selected IDs.
- Manual relationship order.
- Event Date descending order, missing dates, equal-date tie-breaking, and
  stable fallback order.
- Empty selections without an all-albums fallback.
- Exclusion of unpublished, unresolved, or unusable selections.
- Multiple Event Gallery blocks sharing one preview snapshot while retaining
  independent selections and ordering.
- The live-preview client import boundary.
- Payload type generation and focused schema, renderer, and data tests.

The existing album card and PhotoSwipe viewer tests continue to verify visual
and interaction behavior because this change does not modify those components.

## Out of scope

- Selecting individual images instead of albums.
- Overriding album metadata from the page block.
- Different viewer behavior per block.
- Automatically adding newly created albums to existing blocks.
- Reordering images inside an album from the page block.
