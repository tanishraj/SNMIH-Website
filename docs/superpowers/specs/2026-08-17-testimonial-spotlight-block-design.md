# Testimonial Spotlight Block Design

## Goal

Add a reusable `Testimonial Spotlight` Payload block for a single person and message. The block pairs a portrait or contextual image with editorial content inspired by the supplied leadership reference while preserving this project's established section controls, typography, media handling, and responsive behavior.

The image can appear on either side on desktop. The content order is eyebrow, title, testimonial, description, person name, and designation. The reference's Founder and Principal buttons are deliberately omitted.

## Canonical Identity

- Label: `Testimonial Spotlight`
- Payload slug: `testimonialSpotlight`
- Interface: `TestimonialSpotlightBlock`
- Frontend component: `TestimonialSpotlightBlockComponent`
- Content model: exactly one person per block, with an optional featured message

Additional people are represented by additional blocks. The block does not store a collection of testimonials and does not include tabs, a carousel, pagination, or switching controls.

## Content Schema

The block uses the project's standard `Content` and `Theme Settings` tabs.

### Content tab

Fields appear in the same order as the rendered content:

1. `image`: required upload relationship to `media`.
2. `eyebrow`: optional text.
3. `title`: required text.
4. `testimonial`: optional textarea for the featured statement.
5. `description`: optional textarea for supporting context.
6. `personName`: required text.
7. `designation`: optional text.

The block does not expose `actions` or `footerActions`. Buttons cannot be authored or rendered.

The uploaded Media document remains the source of image alt text. The block does not add a competing block-level alt field.

### Theme Settings tab

The block reuses the meaningful section and split-media controls already established by `Feature Spotlight`:

- shared `appearance` group from `createBlockAppearanceFields()`:
  - background: none, subtle, brand, gradient subtle, or gradient brand;
  - border: none, top, bottom, or top and bottom;
- `mediaPosition`: image left or image right, defaulting to left;
- `imagePosition`: center, top, bottom, left, or right, defaulting to center;
- `mediaFillMode`: contained, contained fill, or edge to edge, defaulting to contained;
- `size`: none, compact, default, or comfortable, defaulting to default;
- `contentVerticalAlignment`: top, center, or bottom, defaulting to center.

It also exposes two block-container controls that apply only to the complete image-and-content composition inside the section:

- `containerBackground`: Match Section, Primary, Secondary, Muted, or Accent, defaulting to Match Section;
- `containerOutline`: None or Outline, defaulting to Outline for newly authored blocks.

`containerBackground` reuses the shared card-surface palette and resolver. It does not duplicate the section appearance palette or allow arbitrary colors. `containerOutline` is a single semantic one-pixel border treatment rather than a width, color, or side picker.

The CMS defaults newly authored blocks to Outline so the initial result matches the supplied framed reference. At render time, an absent `containerOutline` value falls back to None so documents stored before these fields were introduced do not acquire an unexpected outline. An absent `containerBackground` value falls back to Match Section.

Every select has a deterministic default and required validation consistent with comparable block schemas.

The block is always a split composition. It therefore omits Feature Spotlight's `layoutMode` and content-only `contentAlignment` fields rather than exposing settings that cannot affect this layout.

## Presentation

### Desktop composition

At the desktop breakpoint, the section uses an approximately 40/60 media-to-content split. The image column occupies the smaller share and the content column receives the larger share, matching the editorial balance of the reference. `mediaPosition` mirrors these columns without changing the authored content sequence.

The section has no arbitrary fixed height. Its content determines the minimum height, and the media column stretches to match. This prevents long testimonials, translated content, or larger accessibility text settings from clipping.

The selected media fill mode follows the same contracts as Feature Spotlight:

- `contained`: the media sits within the normal section container without forced edge cropping;
- `containedFill`: the media fills its contained column and may crop according to `imagePosition`;
- `edgeToEdge`: the media reaches the relevant section and viewport edge using the project's existing full-bleed convention.

Image Right mirrors the desktop geometry. It does not change the reading order exposed to assistive technology.

### Content hierarchy

The block must compose existing project primitives and semantic theme tokens rather than introduce one-off font families, hard-coded brand colors, or unrelated type scales.

- Eyebrow uses the shared section-eyebrow treatment and surface-aware color behavior.
- Title uses the existing section-heading display family and responsive scale.
- When present, the testimonial renders as a semantic `blockquote` using the established sans-serif family (`Inter` in the default and SNMIH themes). It uses a restrained responsive scale of `text-lg` (18px) by default and `text-xl` (20px) from the small breakpoint upward, with relaxed leading and no display/Playfair or mono family.
- Description uses the standard section-description/body treatment and readable line length.
- Person name uses the sans-serif body family at `text-base` (16px) with semibold weight.
- Designation uses the sans-serif body family at `text-xs` (12px) with the selected container surface's secondary color.

When a testimonial is present, its rendered value is always enclosed by typographic curly double quotation marks (`“` and `”`) as real text content inside the `blockquote`, preserving quotation semantics for accessibility, selection, and copying. Before rendering, the component removes at most one matching outer pair of straight (`"..."`) or curly (`“...”`) double quotation marks from the trimmed authored value, then adds the canonical curly pair. Internal quotation marks and unmatched leading or trailing marks remain unchanged. This prevents editors who include their own surrounding quotes from producing doubled punctuation.

The component does not add a quote icon, star rating, card badge, button row, or decorative controls. Only the canonical outer double quotation marks are supplied by presentation; all internal punctuation remains authored content.

When the testimonial is present, the testimonial group uses a `figure`: the quoted statement is a `blockquote`, the supporting description remains separate from the quoted words, and the person attribution is a `figcaption` after the description. When the testimonial is absent or whitespace-only, the block remains visible and renders its other valid content, but emits no quotation marks, `blockquote`, `figure`, or `figcaption`; the optional description and required attribution use regular content wrappers instead. The name and designation remain adjacent in either state, with punctuation or separators handled by layout rather than baked into stored content.

### Spacing and surfaces

Section padding is resolved through the existing regular-block spacing helper. The content column uses responsive internal spacing consistent with Feature Spotlight and other editorial sections. Text measure is constrained so the larger testimonial remains readable on wide screens.

The outer section background and section-edge borders continue to be resolved exclusively through the shared block appearance utility. The inner image-and-content composition independently resolves `containerBackground` through the shared card-surface utility. These class sets must not leak between wrappers: changing the container surface never changes section padding, section background, or section-edge borders.

The selected container surface wraps both columns as one visual unit. It supplies the inner wrapper's semantic background and foreground colors. Supporting description and designation text use that surface's secondary color. The eyebrow resolves against the inner container surface rather than the outer section whenever an explicit container background is selected. Match Section preserves the outer appearance's established eyebrow behavior.

When `containerOutline` is Outline, the inner wrapper receives a one-pixel border using the selected card surface's semantic divider color. None emits no border. The inner wrapper uses the shared radius token and clips its contents so image and background meet the same edge; themes such as SNMIH that define a zero radius remain square without block-specific CSS.

Contained, contained-fill, and edge-to-edge media behavior remains intact. In edge-to-edge mode, the surfaced composition may still occupy the full-width layout while the outer section remains an independent layer. All text, divider, and surface colors use semantic theme tokens so the block remains legible across project themes.

## Responsive Behavior

- Desktop: approximately 40/60 split with the configured image side.
- Tablet: retains a two-column composition where space permits, with reduced gap, padding, and fluid type.
- Mobile: stacks into one column with media first and content second regardless of desktop `mediaPosition`.
- The mobile media wrapper uses a controlled aspect ratio so portrait uploads do not produce an excessively tall section.
- Media remains cropped according to `imagePosition` when the chosen fill mode uses cover behavior.
- Optional-field omission must collapse cleanly without empty wrappers or artificial vertical gaps.
- The section must not introduce horizontal page overflow in contained or edge-to-edge modes.

The responsive order is a presentation concern only. The source order remains stable and understandable for keyboard and assistive-technology users.

## Rendering Architecture

`TestimonialSpotlightBlockComponent` remains a Server Component. It normalizes authored strings, resolves the uploaded image with the project's Payload media helpers, resolves appearance and spacing through shared utilities, and returns deterministic markup. No client component, state, effect, timer, or browser-only dependency is required.

If required content is unavailable at render time, the component fails safely rather than emitting a broken split shell. Optional eyebrow, description, and designation values are trimmed and omitted when empty.

The root exposes a block-specific data attribute for stable test and preview diagnostics. Important configured states such as media side and fill mode may also be represented through data attributes when this is consistent with the existing block conventions.

Container background and outline diagnostics belong on the inner split wrapper, not the outer section, so tests and previews can verify that section-level and block-container styling remain independent.

## Accessibility

- The title participates in the page heading hierarchy using the same heading level convention as comparable page blocks.
- Present testimonial content uses `blockquote` rather than a generic paragraph styled as a quote.
- When a quote exists, quote, supporting description, and attribution are grouped in a `figure`, with the attribution represented by `figcaption`; when no quote exists, no empty quotation semantics are emitted.
- The image uses the alt text from the related Media record.
- Pure layout reversal does not create a confusing DOM or focus order.
- No interactive elements are introduced, so the block requires no custom keyboard behavior or ARIA controls.
- Typography and colors continue to inherit the project's accessible theme tokens and responsive scaling.

## Project Integration

The block is integrated everywhere first-class page blocks are expected:

- block config and component under `src/blocks/TestimonialSpotlight/`;
- `Pages` layout block registration;
- `ReusableSections` layout block registration;
- standard page renderer;
- live-preview page renderer;
- block-thumbnail definition and representative thumbnail fixture;
- generated Payload types;
- project-context block-system reference and generated project inventory.

Because this is a new slug, existing blocks and stored documents are unaffected. No data migration or compatibility alias is required.

## Testing and Verification

Focused tests cover:

- canonical slug, interface, labels, Content and Theme Settings tabs;
- required image, title, and person fields; optional testimonial; and absence of action fields;
- appearance, media position, image position, media fill, size, and vertical-alignment defaults/options;
- container-background and container-outline labels, options, and authoring defaults;
- registration in Pages and Reusable Sections;
- registration in the standard and live-preview renderers;
- thumbnail definition and fixture;
- safe empty/invalid-content behavior;
- exact content hierarchy, continued rendering without a testimonial, and omission of absent optional fields and empty quotation semantics;
- responsive 18–20px Inter/sans-serif testimonial typography, 16px semibold name, and 12px secondary designation hierarchy;
- canonical curly double-quote wrapping for unquoted, straight-quoted, and already curly-quoted testimonial values without changing internal quotation marks;
- conditional semantic `figure`, `blockquote`, and `figcaption` markup when a testimonial is present;
- left- and right-image desktop states;
- media fill, focal position, spacing, appearance, and vertical-alignment states;
- Match Section and each explicit semantic container surface, including foreground and secondary-text behavior;
- outlined and non-outlined inner wrappers using the selected surface's divider color;
- legacy/missing-field fallbacks of Match Section and no outline;
- container surface and outline classes remaining on the complete inner split wrapper rather than the outer section;
- eyebrow contrast following the inner surface while preserving Match Section behavior;
- mobile media-first stacking contract;
- absence of buttons and client-side interaction code;
- surface-aware semantic classes and no block-level horizontal overflow contract.

Verification includes focused integration tests, Payload type generation, TypeScript checking, ESLint on touched files, formatting, and `git diff --check`. Full-suite failures that are demonstrably unrelated are reported separately instead of expanding this feature's scope.

## Non-Goals

- Extending or changing the existing Feature Spotlight, Quote, Testimonial Grid, or Profile Carousel blocks.
- Supporting multiple people inside one block.
- Adding tabs, buttons, a carousel, autoplay, pagination, or other switching behavior.
- Adding star ratings, social links, biographies, credentials arrays, or profile relationships.
- Adding arbitrary colors, font selectors, width sliders, aspect-ratio controls, or custom CSS fields.
- Adding a content-only layout or hiding the image.
- Migrating existing page content into the new block.
