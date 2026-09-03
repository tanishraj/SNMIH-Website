# Page Header and Banner CTA Parity Design

## Goal

Make Page Header use the same editor vocabulary and responsive presentation controls as Banner CTA while retaining Page Header semantics, automatic/custom breadcrumbs, and its Minimal and Banner variants.

## Scope

This change affects the Page Header Payload schema, its production and live-preview rendering, generated Payload types, block fixtures, thumbnails, and integration coverage. Banner CTA remains visually and behaviorally unchanged.

## Variants and compatibility

New Page Header entries expose two variants:

- **Minimal** — a theme-surface page introduction without a full-bleed media layer.
- **Banner** — an optional full-bleed background image with the Banner CTA overlay system.

The legacy `split` value is removed from the visible selector but remains accepted by the renderer and generated-data boundary. Existing `split` content maps to the Minimal layout with side actions. This preserves published content without encouraging further use of the old variant.

## Content model

The Content tab contains:

1. Background Image
2. Top Content
3. The field belonging to the selected Top Content source
4. Title
5. Accent Title
6. Description
7. Actions
8. Footer Actions

### Top Content

`topContent` is a required select with two options:

- **Breadcrumb** — shows the existing automatic/custom breadcrumb controls and renders a semantic breadcrumb trail.
- **Eyebrow** — shows the eyebrow text field and renders the shared `SectionEyebrow` treatment.

Only one source renders. Both occupy the same position and use the same spacing relationship to the title. The breadcrumb keeps its normal link hierarchy, navigation semantics, theme-aware color, and separators; it is not converted into uppercase eyebrow typography.

New entries default to Breadcrumb. For existing content without `topContent`, a populated eyebrow takes precedence; otherwise the breadcrumb renders. This prevents older eyebrow-led headers from losing their label while eliminating the previous double-rendered eyebrow-and-breadcrumb stack.

The Breadcrumb Display mode remains in Theme Settings and is visible only when Top Content is Breadcrumb. Custom breadcrumb rows remain in Content and follow the same condition.

### Actions

Page Header uses the same shared action rows as Banner CTA:

- maximum three primary actions;
- per-action Link or Button display mode;
- Primary, Secondary, and Outline button variants;
- optional trailing arrow for buttons;
- Page or Custom URL destination;
- optional new-tab behavior.

Footer Actions remain a separate optional group with a maximum of two rows.

## Theme and layout controls

Page Header exposes the complete Banner CTA control set:

- Appearance
- Action Placement: Side column or Below the copy
- Section Content Alignment: Left, Center, or Right
- Content Width: Narrow, Default, or Wide
- Overlay Tone: Auto, Light, or Dark
- Overlay Strength: Light, Dark, or Darker
- Overlay Direction: Vertical, Left to Right, or Right to Left
- Minimum Height: Compact, Default, or Immersive
- Section Padding: None, Compact, Default, or Comfortable

The fields use the same labels, defaults, option values, and help text as Banner CTA wherever the meaning is identical.

Every field changes Page Header output. Controls that only affect an image overlay are conditionally shown for the Banner variant. The Minimal variant still respects Appearance, action placement, content alignment, content width, height, and section padding.

### Legacy values

- Existing `actionPlacement: inline` maps to `below`.
- Existing `actionPlacement: side` remains `side`.
- Missing action placement uses the Banner CTA default, `side`.
- Existing Page Header overlay values remain valid.
- Missing new settings resolve to the equivalent Banner CTA defaults.

## Rendering architecture

Shared constants or small helpers will own field options and presentation mappings that must remain identical between Banner CTA and Page Header. The Page Header component remains independent because it renders an `h1`, page breadcrumbs, and Page Header-specific structured context, while Banner CTA renders an `h2` content section.

The Page Header renderer will use:

- the shared block appearance resolver;
- regular block container and padding tokens;
- the Banner CTA overlay tone, strength, and direction mappings;
- shared content-action resolution and rendering;
- the existing `BreadcrumbTrail` and `SectionEyebrow` components.

Banner and Minimal share one internal content layout so action placement, width, alignment, and responsive behavior cannot diverge. Side actions stack beneath the copy on smaller screens and become a right-side rail at the existing large breakpoint.

## Visual behavior

- Page Header remains simpler than Banner CTA and keeps `h1` semantics.
- Top Content has one consistent slot above the title.
- Copy width uses Banner CTA's Narrow, Default, and Wide measures.
- Overlay tone and direction match Banner CTA exactly in Banner mode.
- Theme-aware foreground, eyebrow, breadcrumb, buttons, and focus states remain readable on light, brand, and dark surfaces.
- No new hard-coded brand colors, arbitrary spacing system, card surface, or decorative treatment is introduced.

## Responsive and accessibility behavior

- Content and side actions stack on mobile.
- Long breadcrumb labels and titles wrap without horizontal overflow.
- Breadcrumb uses `nav`, an ordered list, decorative hidden separators, and `aria-current="page"` on the current item.
- Eyebrow remains non-interactive text.
- Heading order remains correct because Page Header continues to render one `h1`.
- All links and buttons retain visible keyboard focus.
- Background imagery remains decorative when the heading provides the page identity; existing media alt handling is preserved.

## Verification

Integration tests will verify:

- the selector exposes only Minimal and Banner;
- legacy `split` content still renders safely;
- every Banner CTA-equivalent field exists with matching options and defaults;
- primary actions permit three rows and preserve per-action settings;
- Top Content conditions show only the selected field group;
- missing `topContent` follows the compatibility rule;
- Breadcrumb and Eyebrow are mutually exclusive in rendered output;
- Minimal and Banner honor action placement, alignment, width, height, and padding;
- Banner honors overlay tone, strength, and direction;
- production and live preview receive the same resolved automatic breadcrumbs;
- theme, accessibility, and responsive contracts remain intact.

The block thumbnail will be regenerated after visual verification. TypeScript, focused integration tests, the complete integration suite, and the production build will be run before handoff.

## Out of scope

- Changing Banner CTA's current visual design.
- Adding a mode that renders Breadcrumb and Eyebrow together.
- Removing legacy `split` data from the database.
- Adding per-separator or per-breadcrumb color controls.
- Changing global breadcrumb structured-data behavior.
