# Feature Spotlight Block Design

## Goal

Add one reusable page-level block that can be placed multiple times in the page layout to create editorial split sections like the supplied references. Each block instance should render one image plus one content column, with enough configuration to produce:

- image left + text right + text link CTA
- text left + image right + text link CTA
- image left + text right + button CTAs
- full-width centered text content with no image

The block should stay restrained, theme-driven, and simple to author. It should not become a nested multi-row section builder.

## Approved Direction

- One block per section instance, not one block containing multiple rows
- Image is optional at the block level
- Image/content side is configured manually per block instance
- CTA mode supports either:
  - a text link
  - up to two buttons
- Background style supports:
  - plain
  - muted
- Layout mode supports:
  - `split`
  - `contentOnly`

## Design Principles

- Keep the pattern editorial and modular: one idea per block instance.
- Favor clear content structure over decorative configuration.
- Match the existing block system already used by Announcement and HeroInstitutional.
- Use theme tokens and shadcn button primitives so the block inherits theme changes cleanly.
- Avoid freeform visual controls that make the admin harder to use without improving outcomes.

## Block Identity

- Recommended block slug: `featureSpotlight`
- Scope: page layout block
- Rendering model: image/content split section or full-width content-only section
- Admin picker: custom thumbnail in the block folder, matching the current block pattern

## Content Model

### Required fields

- `title`
  - type: text
  - required

### Optional fields

- `image`
  - type: upload
  - relation: `media`

- `eyebrow`
  - type: text

- `description`
  - type: textarea

### Layout fields

- `layoutMode`
  - type: select
  - values:
    - `split`
    - `contentOnly`

- `mediaPosition`
  - type: select
  - values:
    - `left`
    - `right`

- `backgroundStyle`
  - type: select
  - values:
    - `plain`
    - `muted`

`mediaPosition` is manual instead of automatic alternation. This gives editorial control and matches the user's stated intent.
`layoutMode` controls whether the block renders as a 50/50 media-content split or as a full-width centered content section.

### CTA mode field

- `ctaMode`
  - type: select
  - values:
    - `link`
    - `buttons`

### Link CTA fields

Visible when `ctaMode = link`.

- `linkLabel`
  - type: text

- `linkType`
  - type: radio
  - values:
    - `page`
    - `custom`

- `page`
  - relationship to `pages`

- `url`
  - text

- `openInNewTab`
  - checkbox

### Button CTA fields

Visible when `ctaMode = buttons`.

- `buttons`
  - type: array
  - max rows: 2
  - each row contains:
    - `label`
    - `linkType`
    - `page`
    - `url`
    - `openInNewTab`
    - `variant`

Button link fields should reuse the same page/custom URL pattern already used by existing blocks.

## Structure

Each instance renders:

1. section shell
2. constrained inner container
3. two-column layout on desktop
4. stacked layout on mobile

Desktop composition:

- media column
- content column

Mobile composition:

- image first
- content second

This keeps the block predictable and removes the need for device-specific content ordering controls.

## Media Behavior

- Image fills its media frame with `object-cover`
- Use a fixed, composed ratio rather than freeform image heights
- Rounded corners are acceptable if they follow the project’s current radius token behavior
- The image should feel like a deliberate panel, not a full-bleed hero

## Content Behavior

- Eyebrow is small, restrained, uppercase or utility-styled
- Title is the dominant element
- Description is optional and should collapse cleanly when absent
- In both layout modes, the text column should preserve an editorial reading measure rather than stretching edge-to-edge

## CTA Behavior

### Link mode

For the first two reference sections:

- render one inline CTA that behaves like a link, not a filled button
- style it with button-like intent while preserving link semantics
- include an arrow treatment with motion:
  - arrow A is visible at rest and slightly tilted
  - on hover, arrow A shifts out
  - arrow B slides in and resolves the motion
- implement the motion with transform and opacity only

### Buttons mode

For the third reference section:

- support one or two buttons
- use existing shadcn button primitives
- button variants remain theme-driven

If `ctaMode = link`, button fields should not render in the admin.
If `ctaMode = buttons`, text-link fields should not render in the admin.

## Background Behavior

- `plain`: transparent or standard page background
- `muted`: subtle theme surface shift to break the page rhythm without introducing a new visual system

The background style applies at the outer section shell level and must remain visible regardless of whether the block is in `split` or `contentOnly` mode.
This is intentionally limited. The block should not expose arbitrary background colors, gradients, or image overlays.

## Layout Behavior

### `split` mode

- Desktop uses a 50/50 two-column grid: half image, half content
- `mediaPosition` determines whether the image is on the left or right
- Mobile collapses to a single column
- The image remains visually dominant but contained
- The section keeps the existing page container width and horizontal padding

### `contentOnly` mode

- No media column is rendered
- Content is centered within the section
- The text column remains restrained and editorial rather than spanning the full viewport width
- This mode is intended for narrative or CTA sections that do not need supporting media

### Mobile behavior

- Collapse to one column below the desktop breakpoint
- Preserve generous vertical spacing
- In `buttons` mode, stack buttons vertically on smaller screens and keep them width-auto unless the existing button component naturally expands

## Visual Tone

Subject: institutional academic/medical marketing pages.

Audience: prospective students, families, and academic stakeholders.

Page job: explain one focused value proposition at a time in a calm, premium, credible way.

Design choices:

- restrained asymmetry through left/right alternation across instances
- strong serif or display heading already established by the site theme
- compact utility eyebrow
- minimal chrome around the content

The memorable aspect is the calm zig-zag rhythm created by repeating the same block with different side placements and CTA modes.

## Accessibility

- Preserve readable text contrast in both plain and muted background modes
- Image alt text should follow existing media conventions
- CTA links and buttons must remain keyboard reachable and visibly focusable
- Avoid any hover-only critical interaction
- The animated link CTA must remain readable and understandable without hover

## Files to Add

- `src/blocks/FeatureSpotlight/config.ts`
- `src/blocks/FeatureSpotlight/Component.tsx`
- `src/blocks/FeatureSpotlight/thumbnail.ts`

## Files to Update

- `src/collections/Pages.ts`
- `src/blocks/renderPageBlocks.tsx`
- `src/payload-types.ts`
- integration tests covering block schema and render behavior

## Testing and Verification

### Schema checks

- block is registered in Pages layout
- admin conditional fields switch correctly based on `ctaMode` and `layoutMode`
- title remains required
- image is optional overall, but required in authoring intent for `split` mode

### Render checks

- renders image-left layout
- renders image-right layout
- renders `contentOnly` layout without a media column
- renders link CTA mode
- renders button CTA mode with one and two buttons
- renders animated link CTA structure
- collapses optional eyebrow and description cleanly
- renders muted background mode

### Responsive checks

- no horizontal overflow on mobile
- image and content stack cleanly
- CTA controls remain usable on small screens

## Non-Goals for v1

- building all three sections inside one block instance
- automatic row alternation across page blocks
- rich text body
- icon lists, stats, badges, or nested cards inside the block
- video media
- per-instance custom colors
- freeform spacing sliders
- exposing multiple link animation styles in v1

## Implementation Notes

- Follow the same folder-level block pattern already used by Announcement, HeroInstitutional, and HeaderNavbar12
- Reuse existing CMS link resolution helpers rather than inventing a second link model
- Keep the component server-renderable unless interactivity becomes necessary
- Use semantic tokens and existing shadcn button variants instead of hardcoded visual overrides
