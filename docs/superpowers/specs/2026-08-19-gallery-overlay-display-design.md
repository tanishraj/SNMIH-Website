# Gallery Overlay Display Design

## Goal

Give Event Gallery and Image Mosaic the same editor-controlled choice between overlays that remain
visible and overlays that reveal on hover, without changing existing saved-block behavior.

## Admin contract

Both blocks receive an **Overlay Display** select under Theme Settings with two values:

- **Always Visible** (`always`)
- **Reveal on Hover** (`hover`)

The field is shown only when the block's existing overlay master switch is enabled. Event Gallery
uses **Always Visible** as its Admin default. Image Mosaic uses **Reveal on Hover** as its Admin
default. Existing documents without a stored value resolve to those same block-specific defaults.

## Runtime behavior

A shared client-safe resolver normalizes the stored value. Both blocks expose the resolved mode in
their rendered markup and use the same presentation classes.

In **Always Visible** mode, overlay tint and content remain visible on every device. In **Reveal on
Hover** mode, the complete overlay remains hidden on desktop devices with a fine hover pointer until
the tile is hovered or receives keyboard focus. On touch/coarse-pointer devices the overlay remains
visible so content is never inaccessible. Reduced-motion preferences remove the transition without
hiding content.

The existing Show Album Details Overlay and Show Image Details Overlay controls remain the master
switches. Turning a master switch off renders no overlay regardless of Overlay Display. Album
slideshow and link interaction remain independent from overlay visibility.

## Compatibility and scope

- Event Gallery legacy fallback: `always`.
- Image Mosaic legacy fallback: `hover`.
- No data migration is required.
- Overlay tone, strength, direction, coverage, content position, metadata, and slideshow behavior
  remain unchanged.
- Production and live preview consume the same stored field through their existing block adapters.

## Verification

Focused schema tests verify field labels, options, conditions, and defaults. Rendering tests verify
the resolved mode for both blocks, both legacy fallbacks, hidden master-switch behavior, keyboard
focus treatment, touch-safe visibility, and reduced-motion CSS. Payload types are regenerated, and
the project-context update/check loop is completed.
