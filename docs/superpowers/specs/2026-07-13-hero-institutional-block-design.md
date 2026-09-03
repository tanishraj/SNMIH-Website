# Hero Institutional Block Design

## Goal

Add a reusable page-level hero block for institutional marketing pages. The block should support a full-width background image, a readable overlay, optional eyebrow text, a strong title, optional description text, and up to two CTA buttons. The content position must be configurable horizontally and vertically without requiring custom CSS per page.

This block is intended for home, admissions, academics, and department landing pages in a medical/education context. It should feel composed and credible rather than flashy.

## Approved Direction

- Height model: balanced hero (`min-h-[60dvh]`)
- Buttons: up to 2
- Overlay control: preset styles, not freeform color
- Content alignment: configurable horizontal and vertical placement
- Visual tone: editorial institutional, image-led, restrained, trust-first

## Design Principles

- Use a full-bleed image as atmosphere, not as a busy collage.
- Keep content inside the standard page container width with the existing site-side padding.
- Make readability deterministic through overlay presets rather than page-specific text-shadow or arbitrary tint controls.
- Preserve theme behavior through semantic tokens where possible.
- Keep the structure general enough for future hero variants without overbuilding v1.

## Block Identity

- Block slug: `heroInstitutional`
- Scope: page layout block
- Admin picker: custom thumbnail, same pattern as existing Announcement and Header blocks

## Content Model

### Required fields

- `backgroundImage`
  - type: upload
  - relation: `media`
  - required

- `title`
  - type: text
  - required

### Optional fields

- `eyebrow`
  - type: text

- `description`
  - type: textarea

### CTA fields

- `buttons`
  - type: array
  - max rows: 2
  - each row contains:
    - `label`
    - `linkType` (`page` or `custom`)
    - `page` relationship to `pages`
    - `url`
    - `openInNewTab`
    - `variant` (`default`, `outline`, `link`)

This should reuse the same page/custom URL field pattern already used by `HeaderNavbar12` so navigation behavior stays consistent across blocks.

### Layout fields

- `horizontalAlignment`
  - select
  - values: `left`, `center`, `right`

- `verticalAlignment`
  - select
  - values: `top`, `center`, `bottom`

- `contentWidth`
  - select
  - values: `narrow`, `default`, `wide`

- `height`
  - select
  - values: `balanced`

The `height` field is intentionally narrow in v1. The shape should allow `compact` and `immersive` later without schema churn.

### Overlay fields

- `overlayStyle`
  - select
  - values:
    - `ink`
    - `brand`
    - `soft`

No freeform overlay color picker and no opacity slider in v1.

## Rendering Behavior

### Structure

The component should render as:

1. outer section
2. background image layer
3. overlay layer
4. constrained content layer

The image and overlay fill the full hero region. Content sits above them and remains inside the project container width.

### Height

- Use `min-h-[60dvh]`
- Avoid `h-screen`
- Preserve enough vertical padding that top and bottom alignment do not feel cramped

### Content alignment

#### Horizontal

- `left`: content column anchored to the left, text left-aligned
- `center`: content centered, text centered
- `right`: content column pushed right, text right-aligned

#### Vertical

- `top`: content sits in the upper band with generous top padding
- `center`: content sits in the visual midpoint
- `bottom`: content sits low while preserving breathing room from the lower edge

### Width behavior

- `narrow`: tighter reading measure for stronger editorial feel
- `default`: standard hero copy width
- `wide`: slightly broader for shorter headlines and more expansive layouts

### Overlay behavior

- `ink`: strongest readability preset, dark neutral film, best match to the shared reference
- `brand`: theme-aware primary wash for more assertive landing pages
- `soft`: muted surface-oriented veil for lighter imagery

These are implemented in the component as fixed class maps, not author-entered class strings.

### Content collapse rules

- If `eyebrow` is absent, the title shifts up naturally.
- If `description` is absent, spacing closes without leaving a visual gap.
- If there is one button, the button row should not reserve space for a second CTA.
- If there are zero buttons, the text stack still reads cleanly.

## Typography and Interaction

- Eyebrow: utility/mono style, uppercase, tighter tracking
- Title: display-driven, large, high-contrast, multi-line safe
- Description: restrained width, readable leading
- Buttons: reuse project shadcn `Button`
- On mobile, CTAs stack vertically
- On desktop, CTAs sit inline with consistent gap

## Responsive Rules

- Collapse to a single clear text column on mobile
- Preserve image-first atmosphere without relying on side-by-side composition
- Avoid horizontal overflow
- Keep tap targets at usable size
- Prevent overly long centered lines on small screens

## Accessibility

- Background image is decorative unless a meaningful media alt strategy already exists in project conventions
- Preserve sufficient contrast through overlay presets
- Keep heading structure simple and predictable
- Buttons and links must remain keyboard reachable and visibly focusable through existing theme primitives

## Files to Add

- `src/blocks/HeroInstitutional/config.ts`
- `src/blocks/HeroInstitutional/Component.tsx`
- `src/blocks/HeroInstitutional/thumbnail.ts`

## Files to Update

- `src/blocks/renderPageBlocks.tsx`
- any page block registration surface if separate from the renderer

## Testing and Verification

### Type and render checks

- typecheck passes
- page block renderer recognizes `heroInstitutional`
- optional fields collapse correctly
- alignment options map to expected layout classes
- overlay presets map to expected style classes

### Visual checks

- left / center / right content placement
- top / center / bottom placement
- single button vs two buttons
- no description state
- mobile stacked CTA layout

## Non-Goals for v1

- inline rich text title editing
- video backgrounds
- arbitrary per-page overlay colors
- parallax effects
- statistics strips or feature cards inside the hero
- more than 2 CTAs

## Implementation Notes

- Follow the existing block folder pattern used by `Announcement` and `HeaderNavbar12`
- Reuse the existing Payload link-field pattern rather than introducing a second navigation schema
- Keep styling local to the block component unless a shared primitive is clearly justified
- Use semantic theme tokens instead of hand-authored light/dark classes where possible
