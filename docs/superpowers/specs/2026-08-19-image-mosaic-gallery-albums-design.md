# Image Mosaic Gallery Albums And Shared Slideshow Design

## Goal

Extend Image Mosaic so an editor can keep its current manually uploaded image composition or render
selected Gallery Albums through the same mosaic. Album-backed mosaics may open the selected album in
a slideshow. Event Gallery receives the same block-wide slideshow switch so editors can choose
between interactive and static album cards without changing either block's visual presentation.

The implementation must reuse shared album, overlay, and slideshow behavior rather than copy the
Event Gallery viewer or introduce a second gallery data model.

## Image Mosaic Content Sources

Add a required `contentSource` select to the Image Mosaic Content tab:

- **Manual Images** (`manualImages`) is the default and preserves the current `items` array.
- **Gallery Albums** (`galleryAlbums`) renders one mosaic tile for each selected Gallery Album.

Existing saved Image Mosaic blocks without `contentSource` normalize to `manualImages`. Their manual
images, image positions, titles, actions, ordering, and current mosaic geometry remain compatible.

### Manual Images

The existing image array remains editor-authored and keeps its current one-to-eight item limit. Each
row continues to contain an image, background position, optional title, and optional action. Manual
images do not open the Gallery Album slideshow because they are not album records and have no album
image sequence.

The `items` field appears only when Manual Images is selected. Runtime validation and normalization
must treat it as required only for this mode; a hidden field from the other mode must not affect the
rendered result.

### Gallery Albums

Gallery Albums mode exposes:

- A sortable, multi-value relationship to `gallery-albums`.
- Display Order: Latest Event Date or Manual, defaulting to Latest Event Date.
- Enable Album Slideshow, enabled by default.

The relationship is manually selected; the block does not automatically include every album. Manual
ordering follows the relationship order. Latest Event Date uses the existing Event Gallery ordering
rules and stable fallbacks.

Each selected album contributes exactly one tile. Its first usable image is the cover, its title is
the tile title, and its optional Event Date and computed usable-image count form the metadata. Invalid,
missing, unpublished, or unselected albums are omitted. The current Image Mosaic eight-tile display
limit remains in effect, and Admin should constrain album selection to the same maximum so saved
content matches the public result.

## Slideshow Interaction

Create a shared, client-safe album slideshow component from the existing Event Gallery viewer
behavior. It accepts a serializable album title and ordered image collection and preserves the
current viewer's captions, navigation, autoplay, keyboard controls, touch behavior, close behavior,
reduced-motion handling, and focus restoration.

Do not synthesize fake Event Gallery blocks and do not duplicate the viewer.

For Image Mosaic in Gallery Albums mode:

- When Enable Album Slideshow is on, the image/title surface is the gallery opener and opens all
  images from that album at the first image.
- When it is off, tiles are static and have no button semantics, interactive cursor, focus ring, or
  slideshow keyboard behavior.

For Event Gallery:

- Add the same block-wide Enable Album Slideshow checkbox, enabled by default.
- Existing saved blocks without the field continue to open the viewer.
- When disabled, every card is static while its image and overlay remain unchanged.

Manual Image Mosaic actions keep their existing link or button behavior. An action follows its own
destination and must never trigger a slideshow. The markup must not nest one interactive control
inside another.

## Overlay Presentation

Image Mosaic gains the same block-wide Overlay Content Position choices used by Event Gallery:

- Bottom Left
- Bottom Center
- Center — Vertical & Horizontal

The setting controls placement and alignment only. It is visible when Image Mosaic overlays are
enabled and applies to every tile in the block.

Manual-image overlays continue to show the optional title and action. Gallery Album overlays use the
approved Event Gallery vertical hierarchy:

1. Image icon and numeric-only image count
2. Event date
3. Sans/text-family album title

The existing Image Mosaic overlay tone, strength, direction, and coverage fields remain and continue
to use the shared media-overlay resolver. Album mode also exposes Show Event Date and Show Image Count
when overlays are enabled. Missing or disabled metadata rows collapse without blank space.

Event Gallery keeps its current overlay fields and approved content hierarchy. Slideshow enablement
is independent of overlay visibility in both blocks: a tile can be interactive without visible copy,
or static with its overlay displayed.

Shared overlay-position types, normalization, and layout primitives should move to a neutral shared
module where practical. Existing Event Gallery stored values `split`, `center`, and `middleCenter`
must remain valid, and Image Mosaic should use the same saved values rather than introduce parallel
names.

## Data And Rendering Boundaries

The existing Gallery Album normalization and selection utilities remain the single data source.
Extend album relationship discovery so it finds selected albums in both Event Gallery blocks and
Image Mosaic blocks whose source is Gallery Albums, including blocks inside populated Reusable
Sections where the existing preview pipeline supports them.

Production rendering fetches only selected published albums. Authenticated live preview fetches the
selected draft albums on the server and passes normalized, serializable snapshots into client-safe
preview renderers. Neither Image Mosaic nor the shared slideshow may query Payload from the browser,
and no `server-only` import may enter a live-preview client graph.

Keep presentation components source-agnostic where possible:

- A server block adapter resolves manual media or selected published albums.
- A preview adapter filters and orders the server-provided album snapshot.
- A presentation component receives already normalized mosaic items.
- The shared slideshow receives only the selected album's serializable image collection.

## Empty, Invalid, And Legacy States

- Image Mosaic still requires a non-empty section title.
- Manual Images mode renders nothing when it has no usable manual images.
- Gallery Albums mode renders nothing when it has no selected, resolvable albums.
- A selected album without a usable cover image is omitted.
- Disabling slideshow never hides a valid tile.
- Disabling overlays never changes slideshow availability.
- Legacy Image Mosaic documents default to Manual Images.
- Legacy Event Gallery documents default to slideshow enabled.
- Invalid content-source, display-order, slideshow, or overlay-position values normalize to the
  documented defaults.

## Accessibility And Responsive Behavior

Interactive album tiles expose a descriptive accessible name containing the album title and usable
image count. Static tiles do not masquerade as controls. Existing focus restoration, visible focus
treatment, Escape handling, and reduced-motion behavior remain intact.

The current Image Mosaic responsive grid and item limit remain unchanged in this feature. Album
covers use the same object-fit behavior as manual images. Overlay copy must remain readable at every
existing breakpoint, with the title clamped and metadata rows allowed to collapse when unavailable.

## Non-Goals

- Do not change the Gallery Albums collection schema.
- Do not add automatic latest-album discovery without explicit album selection.
- Do not enable slideshows for unrelated manual images.
- Do not merge Image Mosaic and Event Gallery into one block.
- Do not change Event Gallery album selection, ordering, mosaic geometry, or viewer behavior beyond
  the new enable/disable switch and shared extraction.
- Do not change Image Mosaic's current grid geometry, item limit, manual content contract, section
  header, actions, footer actions, appearance, or spacing.

## Verification

Focused tests must cover:

- Payload exposes both Image Mosaic content sources with the approved defaults and conditional fields.
- Existing Image Mosaic data without `contentSource` renders as Manual Images.
- Manual images preserve titles, actions, positions, ordering, and non-slideshow behavior.
- Gallery Albums mode resolves one cover tile per selected album in Latest Event Date and Manual order.
- Gallery Albums mode respects the eight-album limit and omits invalid or unpublished albums.
- Image Mosaic album overlays render count, date, and title in the approved order for all positions.
- Manual overlays render their title/action at all approved positions.
- Image Mosaic and Event Gallery default to slideshow enabled for album-backed content.
- Disabling slideshow produces static, non-focusable tiles without removing images or overlays.
- Enabling slideshow opens the correct album, navigates all album images, and restores focus on close.
- Manual action activation does not open a slideshow.
- Overlay visibility and slideshow enablement operate independently.
- Production and authenticated live preview resolve the same selected albums without client queries.
- Album dependency discovery includes album-backed Image Mosaic blocks and supported Reusable Sections.
- Page and News & Events detail-template preview client graphs remain free of server-only imports.
- Existing Event Gallery viewer, Event Gallery layout, and manual Image Mosaic regression suites pass.
- Generated Payload types, TypeScript, lint, formatting, and project-context update/check pass.

## Commit Policy

Keep the specification, implementation plan, generated files, and code changes uncommitted unless the
user explicitly requests a commit later.
