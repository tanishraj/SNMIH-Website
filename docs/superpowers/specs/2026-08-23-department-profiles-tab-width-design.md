# Department Profiles Tab Width Design

**Date:** 2026-08-23

## Goal

Give Department Profiles the same three tab-width choices already used by Fee Structure while preserving its existing search toolbar, tab variants, keyboard behavior, filtering, and responsive overflow.

## Authoring Contract

Add a required `tabWidth` select under Theme Settings immediately after Department Tab Style.

- Label: `Department Tab Width`
- Default: `content`
- Options:
  - `Content Width` / `content`
  - `Centered Auto Width` / `centered`
  - `Equal Full Width` / `equal`
- Show the field only when Show Department Tabs is enabled.
- Reuse the Fee Structure help text: Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable when they overflow; Equal Full Width divides the complete available tab rail evenly.

Existing records without `tabWidth`, invalid saved values, and new records using the default resolve to Content Width without migration.

## Presentation Contract

The setting controls only the department tab rail. It does not move or resize Search.

- Content Width: the tab list uses intrinsic tab widths and begins at the inline start of the available rail beside Search.
- Centered Auto Width: the intrinsic tab list is centered inside the available rail when it fits. The existing overflow container remains horizontally scrollable when it does not fit.
- Equal Full Width: the tab list fills the available rail beside Search and divides that width equally among all visible tabs.
- When Search is hidden, the available rail is the full toolbar width.
- On layouts where the toolbar already stacks, the available rail is the full row width.
- Equal tabs use flexible zero-basis columns, keep each trigger min-width safe, and truncate unusually long labels rather than expanding the rail.

The existing Pill, Underline, and Contained tab styles, active states, arrow-key navigation, focus movement, scroll-into-view behavior, filtering, search, result announcements, and Load More behavior remain unchanged.

## Data Flow

1. Payload stores `tabWidth` on the Department Profiles block.
2. The server component normalizes it to `content`, `centered`, or `equal`, falling back to `content`.
3. The normalized serializable value is passed to `DepartmentProfilesClient`.
4. The client applies one rail-width class set and adds equal-width trigger classes only for `equal`.

Add a `DepartmentProfilesTabWidth` union to the block's local types so schema, server normalization, and client props share one contract.

## Accessibility and Responsive Behavior

- Keep the current `tablist`, `tab`, `aria-selected`, `aria-controls`, and tab-panel relationships.
- Width choices must not change tab order or keyboard behavior.
- Preserve the horizontal overflow wrapper and visible focus states.
- Equal width affects visual distribution only; every trigger retains its complete accessible name even when visible text is truncated.

## Compatibility

- No field is removed or renamed.
- No content migration is required.
- Missing and invalid values render as Content Width.
- Search and tabs continue sharing the current desktop toolbar; Equal Full Width fills only the remaining rail beside Search.

## Testing

Update the Department Profiles integration suite to cover:

- schema options, default, and Show Department Tabs condition;
- runtime fallback for missing and invalid values;
- Content Width, Centered Auto Width, and Equal Full Width rail classes;
- equal trigger distribution and truncation classes;
- unchanged keyboard semantics and search/tab coexistence;
- generated Payload type presence.

Run focused Department Profiles tests, neighboring tab/theme contracts, TypeScript, ESLint, Prettier, the UI detector, and repository diff checks.

## Documentation

Update the block operator guide and project-context block-system narrative to describe the three tab-width choices and the Search-adjacent Equal Full Width behavior.
