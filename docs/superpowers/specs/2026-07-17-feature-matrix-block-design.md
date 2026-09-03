# Feature Matrix Block Design

## Goal

Add the `@shadcnblocks/feature166` four-panel feature matrix as a reusable Payload page block while preserving its recognizable asymmetric layout and aligning its content, actions, themes, typography, sizing, responsiveness, and thumbnail with the existing website blocks.

## Source Layout

The implementation starts from the registry block installed with `pnpm dlx shadcn@latest add @shadcnblocks/feature166`. It preserves the defining structure:

- one introductory content area above the matrix;
- exactly four feature panels;
- a desktop first row with `3/5 + 2/5` widths;
- a desktop second row with `2/5 + 3/5` widths;
- bordered panel divisions and an image in every panel;
- a stacked responsive layout below the desktop breakpoint.

The generated registry component is reviewed after installation and adapted into the project's block structure rather than exposed as an independent demo component.

## Payload Schema

Create a page block with slug `featureMatrix`, interface name `FeatureMatrixBlock`, and the standard Content and Layout & Theme tabs.

### Content

- `eyebrow`: optional text.
- `title`: required text.
- `description`: optional textarea.
- `actions`: the shared content-actions field, allowing zero, one, or two actions.
- `features`: an array with both `minRows: 4` and `maxRows: 4`. Each row contains:
  - `title`: required text;
  - `description`: optional textarea;
  - `image`: required upload related to `media`;
  - `imagePosition`: required Background Position select with Center, Top, Bottom, Left, and Right options, defaulting to Center.

The media document supplies image alternative text through the existing media helper. The feature title is the fallback alternative text when needed.

### Layout & Theme

- standard block appearance fields for semantic background, text, and border behavior;
- `actionMode`: shared Link or Button selector, defaulting to Link;
- `contentAlignment`: Left, Center, or Right, defaulting to Center;
- `size`: Compact, Default, or Comfortable, defaulting to Default.
- `showOuterBorder`: checkbox controlling only the matrix frame, defaulting to enabled.
- `borderAnimationEnabled`: checkbox controlling the internal-divider animation, defaulting to enabled.

Button actions retain the existing shared Primary, Secondary, and Outline variants. Link actions use the existing website content-link treatment.

## Rendering and Styling

The section uses `resolveBlockAppearanceClasses`, `resolveCmsActions`, `ContentActions`, `getMediaImageProps`, and `cn` so its behavior stays consistent with Feature Spotlight, FAQ, and the other content blocks.

The outer content is constrained with `mx-auto max-w-screen-2xl px-4`. The introductory stack includes the eyebrow, regular content-block heading, description, and shared actions. Alignment affects this entire introductory stack and its actions.

The matrix remains full width inside the website container. On desktop it renders the asymmetric `3/5 + 2/5` and `2/5 + 3/5` rows. Below desktop, each panel stacks into a single column. Semantic `border-border`, `text-foreground`, `text-muted-foreground`, and inherited surface colors replace non-project registry tokens such as `border-muted2`.

The matrix parent always owns `rounded-md` and `overflow-hidden`. When `showOuterBorder` is enabled, it also owns the complete outer `border border-border`; when disabled, those two border utilities are omitted. Panels render internal dividers independently in both modes: panel one has desktop right and all-breakpoint bottom dividers; panel two has a bottom divider; panel three has a mobile bottom divider that becomes a desktop right divider; panel four has no divider. Keeping any enabled outer border on one element prevents the bottom-right radius from appearing clipped. The rendered section exposes `data-feature-matrix-outer-border="shown"` or `"hidden"` for verification.

When `borderAnimationEnabled` is enabled, the same internal divider edges receive short semantic-primary gradient beams that travel continuously along the divider. Horizontal and vertical dividers use direction-specific CSS keyframes. Fixed unequal durations, negative delays, and alternating directions create an organic, random-looking rhythm without runtime randomness, timers, hydration, or layout movement. The beams are decorative, ignore pointer events, and are hidden under `prefers-reduced-motion: reduce`. They never trace or animate the optional outer frame. Disabling the setting renders no beam elements while leaving the static internal dividers unchanged. The section exposes `data-feature-matrix-border-animation="enabled"` or `"disabled"`, and each decorative beam exposes its horizontal or vertical orientation for verification.

The configured `@shadcn` registry has no border-beam primitive. `@shadcnblocks` provides `MovingBorderButton` examples, but those are client-side, Radix-backed button components that trace a control's outer perimeter. Installing that component would introduce incorrect button semantics and animate the wrong edges. The implementation therefore adapts the registry's semantic gradient-beam treatment into a focused CSS-only internal-divider primitive rather than adding the unrelated button dependency.

The adapted layout is intentionally more compact than the registry source:

| Size        | Section padding | Panel padding |
| ----------- | --------------- | ------------- |
| Compact     | `py-10`         | `p-5 md:p-6`  |
| Default     | `py-12`         | `p-6 md:p-8`  |
| Comfortable | `py-16`         | `p-8 md:p-10` |

The introductory area uses a substantially smaller gap below it than the source block's `mb-24`. Panel titles are supporting labels rather than document headings, so they render as `<p>` elements with `text-base font-semibold leading-tight`. Panel descriptions render at the quieter `text-sm leading-6` scale. Title and description share a nested `flex flex-col gap-1` text group so their relationship is tighter without pulling the image upward. The section title remains the block's semantic heading.

All four feature images have an identical responsive height for the selected block size. This replaces the source layout's unequal wide/narrow aspect ratios, which produce visibly different heights inside the asymmetric columns:

| Size        | Image height           |
| ----------- | ---------------------- |
| Compact     | `h-40 md:h-44 lg:h-48` |
| Default     | `h-44 md:h-48 lg:h-52` |
| Comfortable | `h-48 md:h-52 lg:h-56` |

Images remain full width and use `object-cover`, so their frames stay equal while their crops adapt to the different panel widths. Image frames use the project's `rounded-md` radius utility, matching the matrix frame.

Each feature resolves its own `imagePosition` independently. The implementation uses the same mappings as Feature Spotlight: Center is `object-[center_center]`, Top is `object-[center_top]`, Bottom is `object-[center_bottom]`, Left is `object-[left_center]`, and Right is `object-[right_center]`. Missing or null values resolve to Center. The selected position applies at every breakpoint so the configured focal point remains stable while the panel width changes.

## Custom Stylesheet Boundary

New project-owned CSS introduced for Feature Matrix must not remain embedded in the replaceable shadcn `src/styles/globals.css` body. Create `src/styles/custom.css`, move the complete Feature Matrix internal-divider animation rules and keyframes into it, and import it from the current `globals.css` with `@import './custom.css';`. Future project-specific CSS belongs in `custom.css`; migrating older project rules is outside this change. If `globals.css` is replaced later, restoring that one import is an explicit manual step. The Feature Matrix component must not duplicate the animation in inline styles or a client-side script.

## Registration

Register the block in:

- the Pages layout block list;
- the page-block renderer;
- generated Payload types;
- block-thumbnail definitions and fixtures.

The thumbnail fixture uses exactly four local images or reusable local fixture media and renders the production component through the existing deterministic thumbnail pipeline. Regenerating thumbnails must update the Feature Matrix JPEG without requiring a Payload database or remote asset.

## Testing

Add focused tests that verify:

- the block is registered only as a page block;
- Content and Layout & Theme tabs expose the agreed fields and defaults;
- `showOuterBorder` defaults to enabled and toggles only the matrix frame;
- `borderAnimationEnabled` defaults to enabled and toggles only decorative internal-divider beams;
- the feature array enforces exactly four rows;
- each feature row exposes a required `imagePosition` select with the Feature Spotlight option order and Center default;
- the production component renders all four feature panels, the asymmetric layout metadata, semantic appearance classes, alignment, size, shared actions, paragraph-based panel titles, smaller descriptions, the `gap-1` panel text group, one consistent size-aware image-height class for every panel, the configurable rounded parent border, and internal-only panel dividers that remain visible in both border modes;
- enabled animation renders the expected horizontal and vertical internal-divider beams, disabled animation renders none, the outer frame is never animated, and reduced-motion CSS suppresses the decorative beams;
- every image independently receives the selected Feature Spotlight object-position class, while omitted or null values resolve to Center;
- Feature Matrix animation CSS exists in `src/styles/custom.css`, is absent from the `globals.css` body, and `globals.css` imports the custom stylesheet;
- the renderer handles `featureMatrix`;
- thumbnail metadata and fixture coverage include the new block;
- generated media URLs in the thumbnail fixture remain local.

Run focused Vitest tests, ESLint, Prettier, Payload type generation, the thumbnail generator, and `git diff --check`. Existing unrelated repository-wide type and stale test failures remain outside this block's scope.

## Non-Goals

- A variable feature count.
- Per-panel actions.
- Per-panel action modes or appearance controls.
- Custom raw colors, fonts, radii, or hover behavior.
- Per-breakpoint image-position controls.
- Runtime-random animation, JavaScript timers, or a client component for decorative beams.
- Animation of the optional outer matrix frame.
- A new reusable action system separate from `ContentActions`.
