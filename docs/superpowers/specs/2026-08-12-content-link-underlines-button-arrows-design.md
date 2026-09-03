# Content Link Underlines and Configurable Button Arrows

## Goal

Make editorial links easier to recognize and let editors add a consistent arrow to individual CTA buttons without changing existing content by default.

## Scope

- Underline editorial links rendered through the shared `ContentLink` component.
- Keep the existing animated arrow on editorial links.
- Add an optional `Show arrow` checkbox to configurable CTA buttons.
- Support the checkbox in shared content actions and the bespoke Hero Banner, Hero Carousel, Header, and Footer CTA schemas.
- Leave header navigation, dropdown links, footer navigation groups, and footer utility links unchanged.
- Keep all changes uncommitted until the user explicitly asks for a commit.

## Content Model

Add `showArrow`, a boolean checkbox with a default value of `false`, to each CTA's theme/style settings. The control is visible for button actions and ignored for editorial link actions.

Shared content actions receive the field from `createContentActionsField`. Bespoke CTA arrays in Hero Banner, Hero Carousel, Header Navbar, and Footer receive the same field alongside their button variant. Existing records without the value behave as `false`.

Payload-generated types will be regenerated after the schema changes.

## Rendering

Extend `CmsActionValue` and `ResolvedCmsAction` with `showArrow`. `resolveCmsActions` normalizes missing values to `false`.

`ContentActions` renders a shared button-arrow treatment when an action is displayed as a button and `showArrow` is true. The icon is decorative, uses `aria-hidden`, remains aligned with the label, and shifts subtly on hover and keyboard focus without affecting layout width.

Hero Banner, Hero Carousel, Header, and Footer pass their CTA configuration through to the same visual treatment or an equivalent shared primitive. Link-style CTAs continue to render as editorial links and do not use the button-arrow checkbox.

## Editorial Link Styling

`ContentLink` underlines only its text label. The underline is always visible, has deliberate offset and thickness, and becomes slightly stronger on hover and focus. The existing animated arrow remains separate from the underline.

Navigation links are excluded to preserve visual hierarchy and avoid making menus visually noisy.

## Compatibility and Accessibility

- Existing CTA buttons remain unchanged because `showArrow` defaults to `false`.
- Existing content records that predate the field remain valid.
- Arrow icons are decorative and excluded from the accessibility tree.
- Underlines improve non-color link recognition.
- Hover motion is subtle and respects existing reduced-motion conventions where applicable.
- Focus-visible styling remains supplied by the existing button and link primitives.

## Verification

- Schema tests confirm the checkbox exists with the correct default and conditions.
- Resolver tests confirm `showArrow` is retained and defaults to false.
- Rendering tests cover button arrows on/off and editorial underlines.
- Hero Banner, Hero Carousel, Header, and Footer tests cover their bespoke data paths.
- Generate Payload types, run focused tests, TypeScript, changed-file lint, and `git diff --check`.

## Out of Scope

- Configurable icon selection or icon position.
- Global arrow defaults.
- Underlining site navigation, dropdown, or footer menu links.
- New colors or theme tokens.
