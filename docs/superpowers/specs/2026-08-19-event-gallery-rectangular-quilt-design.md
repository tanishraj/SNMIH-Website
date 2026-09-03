# Event Gallery Rectangular Quilt Design

## Goal

Replace the Event Gallery's ragged CSS-column masonry with a responsive quilted grid whose outer boundary is always rectangular. Preserve the gallery's mosaic character, restrained card sizing, existing album data flow, overlay controls, and full-album viewer.

## Layout Model

The gallery uses CSS Grid with one column on phones, two columns on tablets, three columns on laptops, and four columns on wide desktops. Every breakpoint derives a small set of leading vertical spans from the number of rendered albums:

- When the album count fills the active column count evenly, every card occupies one grid cell.
- When cells would otherwise remain empty, the first one, two, or three cards span two rows to consume the exact remainder.
- The remaining cards occupy single cells in source order.

This produces a complete rectangle for every positive album count without promoting any card across multiple columns or creating an oversized lead tile. Grid rows use bounded responsive heights so a two-row tile remains editorial rather than dominant.

## Responsive Behavior

- Phone: one full-width card per row with the current compact landscape proportion.
- Tablet: two-column rectangular quilt.
- Laptop: three-column rectangular quilt.
- Wide desktop: four-column rectangular quilt.

The span calculation is deterministic and depends only on album count and item index. Adding, removing, publishing, or unpublishing an album may rebalance the leading tile heights, but it will not change album order.

## Content and Interaction

Each selected, published Gallery Album continues to contribute its first valid image as its cover. Activating a tile opens the existing viewer with every valid image in that album. Manual and Latest Event Date ordering remain unchanged.

Existing controls remain unchanged:

- Show Album Details Overlay
- Show Event Date
- Show Image Count
- Overlay Content Position
- Overlay Tone, Strength, Direction, and Coverage

The date and image count remain split above the clamped album title. The whole tile remains the interactive control, with the current keyboard focus, descriptive accessible name, focus restoration, reduced-motion behavior, and image hover treatment.

## Reading and Focus Order

CSS Grid preserves row-major visual placement and DOM order. Keyboard and assistive-technology navigation therefore follow the same order as the visible tiles. No dense backfilling or JavaScript layout measurement is used.

## Testing

Focused tests will verify:

- Rectangular span rules for representative album counts at two, three, and four columns.
- No horizontal multi-column spans or oversized lead-card behavior.
- Source order and one tile per resolved album.
- Existing overlay, viewer, image-only, live-preview, and reduced-motion contracts.
- TypeScript, lint, formatting, layout detector, and project-context checks.

## Non-Goals

- Natural-height masonry with a ragged edge.
- Editor-configurable column counts or card ratios.
- Reordering albums to optimize packing.
- Rendering every album image as an outer mosaic tile.
