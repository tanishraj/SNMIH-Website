# Event Gallery Editorial Mosaic Design

## Purpose

Redesign the existing `eventGallery` block as an image-led editorial mosaic while preserving its
Gallery Album source, explicit album selection and ordering, section-level configuration, Admin
preview, authenticated live preview, and full-screen album viewer. The visual direction is a large
photographic card with readable bottom overlay content, adapted into a responsive two-, three-, or
four-column mosaic for multiple albums.

The inspiration image is a presentation reference only. The implementation does not introduce a
category, classification, or eyebrow field on Gallery Albums.

## Content Ownership

The existing `gallery-albums` collection remains unchanged and supplies:

- Album title
- Optional event date
- Ordered images, with the first usable image as the cover
- Image count
- Optional description for the existing viewer context

The Event Gallery block continues to select one or more Gallery Albums through its existing sortable
relationship. Manual order and latest Event Date order continue to work as they do now. Selecting a
card opens the existing full-screen viewer; this redesign does not change viewer navigation, captions,
autoplay, gestures, keyboard handling, focus restoration, or close behavior.

## Payload Admin Contract

The Content tab remains unchanged:

- Section eyebrow
- Section title
- Section description
- Header actions
- Selected Gallery Albums
- Display order
- Footer actions

The Theme Settings tab keeps the existing section appearance, section content alignment, section
padding, and card content-placement behavior. The current saved values remain compatible:

- `split` is presented as Bottom Left and renders the approved editorial placement.
- `center` becomes Bottom Center, preserving the saved value while keeping every title anchored to
  the lower edge.

Add these Event Gallery presentation controls:

- Cards Per Row: 2, 3, or 4; default 3
- Card Ratio: Wide (16:9), Landscape (4:3), or Square (1:1); default Landscape
- Show Card Details Overlay: enabled by default
- Show Event Date: enabled by default
- Show Image Count: enabled by default
- Overlay Tone: Auto, Light, Dark, or Brand
- Overlay Strength: Light, Dark, or Darker
- Overlay Direction: Even/Vertical, Left-to-Right, Right-to-Left, Bottom-to-Top, or Top-to-Bottom
- Overlay Coverage: Full or Split

The overlay defaults are Dark tone, Darker strength, Bottom-to-Top direction, and Full coverage. The
implementation must use the existing shared media-overlay field factories and presentation resolver,
including their normalization and text-contrast behavior. It must not define Event Gallery-specific
overlay semantics. When Show Card Details Overlay is disabled, the placement, metadata, and overlay
controls are hidden in Admin and the public card renders as an image-only gallery opener.

## Editorial Mosaic Layout

Cards use a deterministic CSS Grid mosaic rather than a masonry algorithm. Album order remains the
same in the DOM, visual reading order, keyboard order, and viewer order.

- The configured column count controls desktop density.
- Each mosaic group begins with a lead album.
- At three and four columns, the lead album occupies a two-column by two-row area and regular cards
  fill the remaining cells around it.
- At two columns, the lead album spans the available row width and regular cards follow in two-column
  rows. This avoids an impractically narrow companion column while preserving clear hierarchy.
- The pattern repeats for longer galleries instead of limiting the larger treatment to the first
  album only.
- Incomplete final groups keep natural order and do not render empty decorative cells.
- Tablet layouts reduce their active column count and recalculate the mosaic safely.
- Mobile renders one full-width card per row with no spanning.

The chosen ratio controls the base regular-card geometry. Lead cards fill their assigned mosaic area
with the same cover-image treatment. All images use `object-fit: cover`; no source image is distorted.

## Card Presentation

Every album card remains one semantic button with its existing descriptive accessible name. The card
contains:

1. Cover image.
2. Optional resolved shared media overlay.
3. Optional image count with the existing images icon in the small uppercase metadata row.
4. Optional formatted Event Date in the same metadata row.
5. Album title as the primary overlay heading beneath the metadata.

No category label is added. The metadata row functions as the visual eyebrow above the title. If Event
Date or Image Count is absent or disabled, the remaining metadata closes the gap naturally; if both
are absent, no empty metadata container is rendered.

Bottom Left is the recommended/default editorial placement. Bottom Center remains available through
the legacy `center` value. Both keep the title at the lower edge. Lead-card typography may scale larger
than regular-card typography, but both must use existing project font families, fluid theme-aware
sizes, and line clamps appropriate to two-, three-, and four-column widths. Overlay text color comes
from the shared overlay resolver so Light, Dark, Brand, and Auto modes remain legible.

Cards retain the current restrained cover-image zoom on hover. Focus-visible treatment remains clear,
and reduced-motion preferences remove entrance and hover animation where applicable. The card outline,
corner treatment, spacing, and type scale must use existing project tokens rather than isolated hardcoded
design values.

## Runtime And Preview Boundaries

The production server block continues to fetch only the selected published albums and passes a
serializable normalized album snapshot into the presentation layer.

Admin block thumbnails and authenticated Page live preview must render the same column, ratio,
metadata-visibility, content-placement, and overlay settings without introducing a client-side Payload
query. The Event Gallery interactive client remains client-safe, and server-only gallery loaders must
not enter either preview client graph.

Missing, malformed, or legacy presentation values normalize to the approved defaults. Existing saved
blocks without the new fields therefore render as a three-column Landscape mosaic with Event Date and
Image Count visible and the approved dark bottom details overlay.

## Compatibility And Non-Goals

- Do not change the Gallery Albums collection schema.
- Do not add category or classification metadata.
- Do not change album selection or ordering semantics.
- Do not change the full-screen gallery viewer.
- Do not change unrelated Gallery Showcase, Gallery Coverflow, Image Mosaic, News Grid, or News &
  Events blocks.
- Preserve the existing Event Gallery block slug, generated interface name, renderer registration,
  reusable-section support, preview snapshot flow, and thumbnail definition.

## Verification

Focused tests must cover:

- Payload exposes Cards Per Row, Card Ratio, Event Date visibility, Image Count visibility, and all
  four shared overlay controls with the approved defaults.
- Legacy `split` and `center` placement values remain valid.
- Two-, three-, and four-column values normalize safely, as do all card-ratio values.
- The deterministic mosaic preserves album order and marks the correct lead cards for repeated groups.
- The mobile presentation removes mosaic spans.
- Event Date and Image Count render independently according to their controls.
- Show Card Details Overlay removes both the overlay tint and visible card copy while preserving the
  accessible gallery opener.
- Image Count and Event Date occupy one metadata row above the bottom-anchored title.
- Missing dates do not leave empty metadata markup.
- Overlay frame, tone, strength, direction, coverage, and contrast classes come from the shared
  resolver.
- Card activation still opens the selected album and closing the viewer restores focus.
- Production selection, Admin preview, Page live preview, thumbnails, and client/server import
  boundaries remain valid.
- Generated Payload types, TypeScript, lint, formatting, and project-context update/check all pass.

## Commit Policy

Keep the specification, implementation plan, generated files, and code changes uncommitted unless the
user explicitly requests a commit later.
