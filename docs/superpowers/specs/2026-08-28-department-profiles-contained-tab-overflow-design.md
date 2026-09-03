# Department Profiles Contained Tab Overflow Design

## Goal

Keep the Department Profiles tab rail's rounded frame visible at both horizontal edges while overflowing department tabs scroll inside that frame.

## Scope

- Apply the behavior only to the Department Profiles block when its filter presentation is Tabs.
- Preserve the existing tab variants, width settings, filtering state, keyboard navigation, and responsive toolbar layout.
- Do not change the shared tab-rail behavior used by other blocks.

## Layout

- Use a stationary outer frame that owns the tab variant's border, background, radius, and clipping.
- Place a horizontally scrollable viewport inside the frame.
- Place the semantic `tablist` and tab buttons inside that viewport.
- Keep the left and right frame edges and their inset visible while the tab content moves beneath the viewport.
- Preserve the existing 44px minimum tab height and avoid adding vertical space to the toolbar.

For the Pill variant, the outer frame remains fully rounded. Contained and Underline variants retain their current visual treatment while using the same frame/viewport separation where overflow is possible.

## Interaction and Accessibility

- Horizontal pointer, touch, and trackpad scrolling occurs only inside the tab viewport.
- The outer frame does not move.
- Arrow-key navigation, focus management, `tablist`/`tab` roles, active selection, and filtering remain unchanged.
- Focus rings remain visible within the clipped frame.

## Theme

- Reuse the existing semantic light/brand tab surfaces and theme tokens.
- Introduce no hardcoded colors, radii, or shadows.
- Preserve light mode, dark mode, and client-theme behavior.

## Verification

- Add a focused integration assertion for the stationary frame and nested horizontal scroll viewport.
- Preserve existing Department Profiles filter, keyboard, width, search, featured-profile, and Load More tests.
- Run focused Department Profiles tests, TypeScript, lint, formatting, UI layout detection, and the required project-context update/check loop.
