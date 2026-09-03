# Icon Card Showcase Block Design

## Goal

Create a reusable Payload block that presents equal-sized icon cards over an optional full-width background image. The block should reproduce the supplied three-card reference while remaining useful for values, services, principles, benefits, and departments.

## Block Identity

- Admin label: `Icon Card Showcase`
- Slug: `iconCardShowcase`
- Generated interface: `IconCardShowcaseBlock`
- The block is available in Pages and Reusable Sections, including regular rendering and live preview.

## Content Model

### Section content

- `backgroundImage`: optional Media upload used as a decorative full-bleed background.
- `eyebrow`: optional section eyebrow.
- `title`: optional section heading.
- `accentTitle`: optional italic heading line.
- `description`: optional supporting paragraph.
- `actions`: up to two shared section actions.
- `cards`: required array with 1–12 rows.
- `footerActions`: up to two shared footer actions.

The section header is optional. When present, it renders over the same background image and overlay as the cards.

### Card content

Each card contains:

- `icon`: optional Lucide icon name using the shared icon field.
- `eyebrow`: optional short label using the shared card-eyebrow typography and surface-aware color.
- `title`: required text.
- `description`: optional short supporting text.
- `actionLabel`: optional visible action label.
- `linkType`: None, Page, or Custom URL for the card action destination.
- `page`: conditionally visible Page relationship.
- `url`: conditionally visible custom URL.
- `openInNewTab`: conditionally visible checkbox.
- `actionMode`: Link or Button, shown when an action label is present.
- `actionVariant`: shared button variant, shown for Button mode.
- `showArrow`: optional trailing arrow, shown for Button mode.
- `cardBackground`: required select whose `inherit` value uses the section-level default card background. Other values are Match Section, Subtle, Brand, Gradient Subtle, and Gradient Brand.

A visible action renders only when both `actionLabel` and a valid destination exist. New cards therefore expose a clear link or button rather than making the whole surface interactive. For backward compatibility, saved cards that have a valid destination but no action label remain accessible whole-card links. The renderer never nests an action link inside a linked card. Invalid or incomplete destinations leave the card non-interactive.

## Theme and Layout Configuration

The Theme Settings tab contains:

- Shared Appearance background and border controls.
- Shared media overlay tone, strength, direction, and coverage controls, shown only when a background image is selected.
- Header Layout: Stacked or Split.
- Content Vertical Alignment: Top, Center, or Bottom, shown for Split headers.
- Section Content Alignment: Left, Center, or Right.
- Card Content Alignment: Left, Center, or Right.
- Card Width: Compact, Standard, or Wide.
- Card Height: Compact, Standard, or Tall.
- Icon Size: Small, Standard, Large, or Extra Large.
- Default Card Background: Match Section, Subtle, Brand, Gradient Subtle, or Gradient Brand.
- Section Padding: None, Compact, Default, or Comfortable.

The optional background image does not replace Appearance. Appearance provides the fallback section surface when no image is selected and retains the section-border contract in every mode.

Defaults reproduce the supplied reference without preventing other compositions:

- Header Layout: Stacked.
- Section Content Alignment: Center.
- Split Content Vertical Alignment: Top.
- Card Content Alignment: Center.
- Card Width: Standard.
- Card Height: Standard.
- Icon Size: Standard.
- Default Card Background: Brand.
- Section Padding: Default.
- Overlay Tone: Light.
- Overlay Strength: Light.
- Overlay Direction: Even / Vertical.
- Overlay Coverage: Full.

## Responsive Layout

Card width is a global setting, so all cards remain equal within the grid:

- Compact: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
- Standard: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Wide: `grid-cols-1 md:grid-cols-2`.

Card height is also global:

- Compact: `min-h-52` (208px).
- Standard: `min-h-72` (288px).
- Tall: `min-h-[22rem]` (352px).

Icon sizes are:

- Small: `size-8` (32px).
- Standard: `size-12` (48px).
- Large: `size-16` (64px).
- Extra Large: `size-20` (80px).

Cards use responsive internal padding while preserving their configured minimum height. Long titles and descriptions wrap without overflow, and cards in a row share equal height.

## Visual Treatment

The section is a relative, isolated surface. When a background image exists, it fills the section with `object-cover`, renders with empty alternative text and `aria-hidden`, and sits beneath the configured media overlay. All section content remains inside `regularBlockContainerClasses`.

Cards center their content vertically. The Card Content Alignment control independently places the icon, eyebrow, title, description, and visible action to the left, center, or right. Omitting the optional icon removes its markup and spacing rather than inserting a decorative fallback.

Card backgrounds use the same semantic vocabulary as section Appearance: Match Section, Subtle, Brand, Gradient Subtle, and Gradient Brand. The renderer resolves the matching foreground, secondary text, icon, eyebrow, divider, link, button, and focus colors from the active theme. The established theme radius and a restrained border define each card; no default shadow is added.

Legacy whole-card links receive a subtle motion-safe lift and a visible keyboard focus outline. Cards with explicit actions and non-linked cards use semantic `article` markup. Visible card actions use the shared link/button presentation and button variants. Card descriptions use a `max-w-[40ch]` readable measure.

The global card background establishes consistency. A card-level override may select another supported surface without changing the layout.

## Header Composition

The header reuses the shared section typography, eyebrow, actions, and spacing conventions.

- Stacked places the intro above the card grid and honors Left, Center, or Right alignment for both the text and the bounded intro container. Center positions the entire intro in the section; Right anchors it to the section's right edge. The title and description share the full established `max-w-3xl` intro width, matching Icon Grid; Stacked mode does not apply an additional character-based description limit.
- Split uses the established 3:2 section-header columns on large screens, stacking them on smaller screens. Its supporting description/actions honor Top, Center, or Bottom vertical alignment.
- Heading lines use an explicit font-family inheritance utility so the global inline-element typography rule cannot reset titles to the body font. A generic `font-[inherit]` utility is not sufficient because Tailwind can resolve it as font weight rather than font family.
- Header text uses the resolved media-overlay text contract when a background image is present and the Appearance surface contract otherwise.

Footer actions render after the grid through `BlockFooterActions`.

## Normalization and Failure Behavior

- Cards with blank titles are omitted.
- A missing icon renders no icon markup.
- A supplied but stale icon name falls back to a neutral Lucide `Sparkles` icon.
- Stale width values fall back to Standard.
- Stale height values fall back to Standard.
- Stale icon-size values fall back to Standard.
- Stale header-layout and alignment values use existing safe block defaults.
- Current legacy background values normalize without breaking saved content: Primary becomes Brand; Secondary, Muted, and Accent become Subtle.
- A stale section default card background falls back to Brand.
- A stale per-card background falls back to `inherit` and uses the section default.
- A missing or stale Card Content Alignment value falls back to Center.
- An action with a missing label or invalid destination is omitted. A valid legacy destination without an action label retains whole-card linking.
- A block with no usable cards renders nothing.
- A missing background image falls back to Appearance without reserving media markup.

## Integration Points

Implementation includes:

- `src/blocks/IconCardShowcase/config.ts`
- `src/blocks/IconCardShowcase/Component.tsx`
- Pages block registration.
- Reusable Sections block registration.
- Standard page renderer registration.
- Live-preview renderer registration.
- Block-thumbnail definition and fixture.
- Generated Payload types.

## Verification

Integration tests will verify:

- The complete Payload field schema, labels, defaults, conditional fields, and row limits.
- Page and Reusable Section registration.
- Standard and live-preview renderer registration.
- Optional background image and Appearance fallback.
- Media-overlay configuration and semantic text treatment.
- Stacked and Split header layouts.
- Left, Center, and Right header and card-content alignment.
- Compact, Standard, and Wide responsive grid classes.
- Compact, Standard, and Tall card-height classes.
- All four icon-size classes.
- Shared section-style card backgrounds, Match Section behavior, legacy-value normalization, and per-card overrides.
- Optional icons, card eyebrows, visible link/button actions, shared button variants, and new-tab behavior.
- Backward-compatible whole-card Page and Custom URL links when saved cards lack an action label.
- Graceful handling of blank titles, missing and stale icons, stale controls, and invalid actions.
- Thumbnail definition and fixture coverage.
- Generated type coverage.

Final checks include focused integration tests, related block/theme/thumbnail contracts, Payload type generation, TypeScript, targeted ESLint, the Impeccable detector, `git diff --check`, and the full integration suite.
