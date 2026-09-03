# Department Profiles Hidden Tab Scrollbar Design

## Goal

Hide the visual horizontal scrollbar inside the Department Profiles tab frame while preserving every scrolling and tab interaction method.

## Scope

- Apply the change only to the Department Profiles Tabs presentation.
- Keep the stationary themed frame and nested horizontal scroll viewport introduced by the contained-tab overflow refinement.
- Do not change shared tab rails or other blocks.

## Presentation and Interaction

- Apply the project's existing `no-scrollbar` utility to the nested tab scroll viewport.
- Keep `overflow-x-auto` so tabs remain horizontally scrollable with touch, trackpad, mouse wheel, and browser-supported keyboard interaction.
- Preserve the rounded frame, semantic `tablist` and `tab` roles, focus behavior, arrow-key tab navigation, active state, filtering, and all configured tab widths.
- Introduce no new colors, spacing, radii, or theme-specific styles.

## Verification

- Extend the focused Department Profiles integration contract to require `no-scrollbar` on the nested viewport while keeping horizontal overflow enabled.
- Confirm the stationary outer frame does not become the scroll container.
- Run the focused Department Profiles and shared tab tests, TypeScript, ESLint, Prettier, the layout detector, and the required project-context update/check loop.
