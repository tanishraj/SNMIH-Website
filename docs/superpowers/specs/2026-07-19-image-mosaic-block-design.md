# Image Mosaic Block Design

## Summary

Add a Payload page block named **Image Mosaic**, adapted from `@shadcnblocks/gallery31`. The block presents one to eight images in a responsive asymmetric mosaic. Desktop pointer devices use a simple synchronized image zoom and gradient fade. Touch devices show item overlays continuously so titles and actions remain discoverable.

The implementation must use the project's shared typography, spacing, appearance, link, button, media, and thumbnail conventions. It must not alter or stage unrelated work.

## Goals

- Preserve Gallery31's recognizable asymmetric mosaic with a simpler CSS-only hover treatment.
- Support one to eight independently configured images.
- Keep titles and explicit actions readable and usable on touch devices.
- Match the existing Payload block editor structure and website design system.
- Keep the complete block server-rendered without a client-side hover boundary.
- Generate a real-render thumbnail for the Payload block selector.

## Non-goals

- The block is not a carousel or lightbox.
- Clicking the image surface does not navigate; only the visible item action is interactive.
- Items do not include descriptions or product-specific prices.
- The block does not fetch remote catalogue data.
- The first version does not expose per-item overlay visibility or animation controls.

## Payload schema

The block uses:

- Slug: `imageMosaic`
- Interface: `ImageMosaicBlock`
- Singular label: `Image Mosaic`
- Plural label: `Image Mosaics`

### Content tab

- `eyebrow`: optional text.
- `title`: required text.
- `description`: optional textarea.
- `actions`: zero to two shared content actions.
- `items`: required array with a minimum of one row and maximum of eight rows.

Each item contains:

- `image`: required upload related to `media`.
- `imagePosition`: required select with `center`, `top`, `bottom`, `left`, and `right`; defaults to `center`.
- `title`: optional text displayed in the overlay.
- `action`: optional array limited to one row. Not adding a row means the image has no action.

The optional image action reuses the same nested Content and Layout & Theme editor pattern as other block actions:

- Content: required label, page/custom URL destination, and open-in-new-tab control.
- Layout & Theme: required display mode (`link` or `button`) and button variant (`default`, `secondary`, or `outline`).

The shared action-field factory gains an opt-in per-action display-mode field. Existing blocks do not enable that option and remain unchanged. An incomplete image action does not render. The previous required `Image Link` selector and its `No Link` value are removed without a compatibility adapter.

### Layout & Theme tab

- Shared block appearance controls for background and border. Text color remains derived from the selected surface.
- Shared `actionMode`: `link` or `button`, defaulting to `link`.
- `contentAlignment`: `left`, `center`, or `right`, defaulting to `center`.
- `size`: `compact`, `default`, or `comfortable`, defaulting to `default`.
- `showImageOverlays`: checkbox, defaulting to `true`.

`showImageOverlays` controls all mosaic items together. When disabled, item titles and actions are not rendered and the item hover treatment is disabled. Section-level actions are unaffected.

## Component architecture

### Payload adapter

`src/blocks/ImageMosaic/Component.tsx` remains server-rendered. It:

1. Trims optional text content.
2. Resolves each Payload media relationship through the existing media helper.
3. Resolves each optional item action through the existing CMS-action conventions.
4. Omits items with unresolved images.
5. Passes only serializable image, title, resolved action, position, and layout values to presentation components.
6. Returns `null` when the required title is empty or no valid images remain.

Section actions use the existing `ContentActions` component and are limited to two.

### Presentation component

The server-compatible Image Mosaic presentation component owns:

- The semantic section and standard container.
- Shared block appearance classes.
- Eyebrow, heading, description, and section actions.
- Responsive grid structure and deterministic item layout markers.
- Size, alignment, background, overlay visibility, and item-count data attributes used by tests and styling.

### Mosaic tile

The server-compatible presentation component owns the complete tile markup. It must:

- Use meaningful image alternative text.
- Avoid index-only React keys.
- Use project utilities and aliases.
- Use semantic theme tokens rather than product-specific hardcoded surfaces.
- Render the image at its normal scale so it completely fills the tile before interaction.
- Apply only CSS-based zoom and overlay opacity transitions; no pointer-direction calculation, React state, browser branch, or Framer Motion client component is required.
- Disable zoom and overlay transitions when overlays are globally hidden or reduced motion is requested.

## Visual design

### Section content

The introductory content follows the existing regular-block conventions:

- Standard website container width.
- Shared compact/default/comfortable vertical padding.
- Optional mono uppercase eyebrow.
- Regular block heading scale, not hero scale.
- Standard description size and line height.
- Shared content action styles and behavior.
- Left, center, or right alignment applied consistently to the intro and actions.

### Mosaic layout

- Phone: one column.
- Tablet: two columns.
- Desktop: four columns with selected tiles spanning columns or rows to retain Gallery31's asymmetric composition.
- Dense grid placement prevents avoidable holes when the configured item count changes.
- Item heights increase consistently across compact, default, and comfortable sizes.
- Additional items through the eighth row continue the deterministic mosaic pattern without horizontal overflow.
- Each image uses `object-fit: cover` and its configured object position.
- Tiles use the site's standard radius and border treatment.

### Overlay behavior

When overlays are enabled:

- Desktop devices with hover support and a fine pointer zoom the image from `1` to `1.05` while fading in the gradient overlay.
- Neither the image nor the gradient translates or slides in any direction.
- Screens below the `lg` breakpoint render the complete gradient overlay, title, and action continuously.
- Touch/coarse-pointer devices render the overlay continuously at every viewport width.
- Only `lg` and wider devices with both hover support and a fine pointer hide the overlay until hover or keyboard focus.
- Image zoom and gradient-overlay opacity use the same `200ms ease-out` timing so they start and finish together.
- The overlay uses semantic background and foreground tokens to adapt to the active theme.
- The optional title appears first.
- A separately styled action appears below the title when its label and destination resolve.
- Link mode uses the shared website content-link behavior.
- Button mode uses the shared shadcn button component, selected standard variant, and website hover behavior.
- Only the visible link or button is clickable; the image and tile surface are not links.

When overlays are disabled, none of the item overlay content or item actions is rendered.

Block-specific pointer and responsive rules belong in the project's separate block stylesheet rather than `globals.css`.

## Accessibility

- Images use media alternative text, falling back to the item title when appropriate.
- Links and buttons have visible labels and native keyboard behavior.
- Focus styles come from the shared link and button implementations.
- The image surface is not presented as interactive.
- Touch users never depend on hover to discover content.
- Motion must honor the project's reduced-motion behavior; the tile remains usable without animation.
- Heading hierarchy uses one section `h2`; item titles are regular text, not heading elements.

## Data and failure behavior

- Payload enforces one to eight configured item rows.
- Draft or malformed data may still contain unresolved media; those rows are omitted at render time.
- A block with no valid images or an empty required title renders nothing.
- Missing item titles are allowed.
- A missing action row produces no action UI.
- Missing or incomplete item action data produces no link, button, or broken anchor.
- Section actions resolve through the established link helper and inherit its failure behavior.

## Registration and generated artifacts

Implementation includes:

- Page collection block registration.
- Page block renderer registration.
- Payload-generated TypeScript types.
- Block thumbnail definition and real-render fixture.
- A generated `public/block-thumbnails/image-mosaic.jpg` preview.
- Relevant block-registration and thumbnail tests.

## Verification

Focused automated coverage must verify:

- Slug, interface name, labels, Content/Layout & Theme tabs, defaults, and item row limits.
- Optional single-row item action schema, opt-in per-action mode, and overlay visibility control.
- Rendering from one through eight valid items without horizontal overflow markers.
- Invalid images being omitted and zero valid images returning `null`.
- Section content, alignment, size, appearance, and action modes.
- Per-item image position mapping.
- Titles and actions rendering only when overlays are enabled.
- Link and button item-action modes using shared website behavior.
- Missing and incomplete actions not rendering.
- CSS-only hover zoom using scale `1.05` without directional transforms or a client-side motion component.
- Overlay visibility remaining permanent below `lg` and on coarse-pointer devices.
- Image zoom and overlay fade both using `200ms ease-out` on hover-capable desktop devices.
- Touch-visible overlay and responsive grid styling through stable classes or data attributes.
- Page renderer, Pages collection, thumbnail definitions, fixtures, and generated types include Image Mosaic.

Run focused tests, Payload type generation, formatting, linting, and a scoped TypeScript check. Browser verification should cover desktop hover behavior and narrow mobile layout when the local browser surface is available.

## Implementation constraints

- Use `npx shadcn@latest add @shadcnblocks/gallery31` after the approved implementation plan.
- Do not overwrite existing shadcn files without explicit approval.
- Image Mosaic must not import or require Framer Motion for its hover treatment.
- Preserve unrelated user changes.
- Do not stage or commit implementation changes.
