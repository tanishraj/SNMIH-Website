# SNMIH Theme Refinement and Key Migration Design

**Date:** 2026-08-29

## Summary

Refine SNMIH-Green into a cohesive institutional green theme, introduce a restrained radius system, and rename both theme files and stored Payload values so their technical identifiers match their editor-facing names.

SNMIH-Blue becomes the default website theme for new, missing, or invalid selections. Existing saved appearances remain stable through an exact, reversible data migration:

- legacy `default` becomes `snmih-green`
- legacy `snmih` becomes `snmih-blue`

The work is token-led. Shared semantic primitives remain the source of truth; isolated component overrides are added only where a shared primitive currently bypasses those semantics.

## Goals

- Make primary buttons, action links, selected tabs, and focus states visibly green in SNMIH-Green.
- Base the green palette on the institutional green already used as an accent in SNMIH-Blue.
- Apply consistent, restrained radii without rounding structural elements that should remain square.
- Preserve strong contrast in light and dark modes.
- Rename CSS files, theme values, selectors, tests, and documentation to explicit SNMIH names.
- Make SNMIH-Blue the default for new sites and runtime fallback behavior.
- Preserve existing saved theme choices through a reversible Payload migration.
- Keep SNMIH-Blue's current visual design unchanged apart from its technical identifier and filename.

## Non-goals

- Redesigning individual blocks or changing their information architecture.
- Recoloring destructive actions, white-on-media controls, or paired foreground colors on brand surfaces.
- Applying a blanket border radius to every element.
- Migrating content beyond the theme-setting values and their version history.
- Executing the database migration against the configured database as part of implementation.

## Theme identity contract

| Editor label | CSS file                | Stored value  | Role                                |
| ------------ | ----------------------- | ------------- | ----------------------------------- |
| SNMIH-Green  | `theme-snmih-green.css` | `snmih-green` | Alternate institutional green theme |
| SNMIH-Blue   | `theme-snmih-blue.css`  | `snmih-blue`  | Default website theme               |

`defaultWebsiteTheme` is `snmih-blue`.

The runtime theme normalizer accepts both new and legacy identifiers:

- `snmih-green` → `snmih-green`
- legacy `default` → `snmih-green`
- `snmih-blue` → `snmih-blue`
- legacy `snmih` → `snmih-blue`
- missing, malformed, retired, or unknown values → `snmih-blue`

Only `snmih-green` and `snmih-blue` are exposed as valid Payload options and generated types. Legacy aliases remain an internal compatibility boundary and are never shown to editors.

The no-attribute CSS fallback also renders SNMIH-Blue. Consequently:

- SNMIH-Green tokens apply only to `data-theme-color='snmih-green'`.
- SNMIH-Blue tokens apply to `data-theme-color='snmih-blue'` and to a root with no theme attribute.

## SNMIH-Green visual direction

### Color

The primary family derives from the green accent already established in SNMIH-Blue:

- Light mode uses the deep institutional green family represented by `#2f8f45` for primary actions, links, selected controls, and active indicators.
- Dark mode uses the lighter soft-green family represented by `#8fd19a` where additional luminance is needed for legibility and focus visibility.
- Secondary and hover surfaces use pale sage tints, not unrelated gray or blue tints.
- Neutral canvas, surface, border, and body-text colors remain quiet so green communicates action and state instead of tinting the entire interface.
- Focus rings use a green-family token with sufficient separation from both light and dark surfaces.

Semantic exceptions remain unchanged:

- Destructive actions stay red.
- White and white-outline variants used over images remain white.
- Buttons, tabs, and links on primary or brand surfaces use their paired foreground token rather than forcing green text.
- Disabled controls remain visibly disabled and are not mistaken for an active green state.

Exact OKLCH values may be calibrated during implementation, but they must preserve these families and pass the repository's semantic contrast contracts.

### Radius

The radius system is restrained and institutional:

- Cards and primary panels: approximately 12px.
- Standard controls such as buttons, selects, inputs, and framed tabs: approximately 8–9px.
- Compact nested controls: approximately 6px.
- Intentional pills, badges, and circular icon buttons remain fully rounded.

The theme base radius should be set so the existing global radius multipliers naturally produce this scale. Radius changes must flow through semantic tokens rather than component-specific arbitrary values.

The following remain square where structure requires it:

- Underline tab rails.
- Dividers and table rows.
- Joined control edges.
- Timeline connectors.
- Card header/footer interiors whose outer container already owns the radius.
- Map popups and other explicit geometry where rounding would break layout.

## Shared component behavior

### Buttons and links

The shared button primitive remains authoritative:

- Primary/default buttons use `primary` and `primary-foreground`.
- Outline and link variants use the green primary token on neutral surfaces.
- Secondary and ghost variants use their semantic surface tokens with green introduced only for active or interactive emphasis.
- Destructive, white, and white-outline variants retain their specialized contracts.

Existing shared action buttons, download actions, footer actions, CTA actions, and block actions inherit the theme through the primitive. There must be no global CSS rule that recolors every raw `button` or `a` element.

Text links that already use the semantic primary token become green automatically. Links deliberately styled for muted navigation, media overlays, or brand surfaces retain their context-specific foreground.

### Tabs

Shared tab systems follow one semantic state model:

- Framed/contained tabs use green primary background and paired foreground for the selected item.
- Underline tabs use green selected text and a green underline.
- Hover and focus states use green or sage semantic tokens without introducing layout shift.
- Brand-surface tabs preserve paired foreground/inverted behavior instead of applying green-on-green.
- Overflow behavior, hidden scrollbars, centered auto-width rails, and full-width rails remain unchanged.

The generic shadcn-style Tabs primitive currently using a neutral active state should be corrected at the shared primitive level. Existing specialized content-tab and Calendar contracts should continue to rely on semantic theme tokens rather than receive duplicate overrides.

### Form controls and other surfaces

Inputs, selects, checkboxes, radios, pagination, and keyboard focus affordances use the radius and focus-ring tokens. Selected and checked states may use primary green when already semantically wired to `primary`; unselected controls remain neutral.

Cards and block surfaces inherit the radius scale only where they already opt into semantic rounded utilities. Structural `rounded-none` decisions are preserved after reviewing their layout purpose.

## Payload configuration and migration

The theme field exposes only:

- `snmih-green` / SNMIH-Green
- `snmih-blue` / SNMIH-Blue

Its default value is `snmih-blue`.

A new reversible MongoDB Payload migration updates exact legacy values in both current global state and global version history:

### Up

- In `globals`, documents with `globalType: 'theme-settings'`:
  - `themeColor: 'default'` → `themeColor: 'snmih-green'`
  - `themeColor: 'snmih'` → `themeColor: 'snmih-blue'`
- In `_theme-settings_versions`:
  - `version.themeColor: 'default'` → `version.themeColor: 'snmih-green'`
  - `version.themeColor: 'snmih'` → `version.themeColor: 'snmih-blue'`

### Down

- Reverse only the exact new values:
  - `snmih-green` → `default`
  - `snmih-blue` → `snmih`

All migration writes use the migration session supplied by Payload. Exact-match updates make each direction deterministic and idempotent. Missing or invalid values are not rewritten; runtime normalization and the field default resolve them to SNMIH-Blue.

The implementation creates and tests the migration but does not run it against the configured database without separate approval.

## Rename impact

The implementation updates all references, including:

- Theme stylesheet filenames and global imports.
- Theme registry values, labels, type guards, normalizers, and default.
- Root layout/theme-provider data attributes.
- Hardcoded `data-theme-color` selectors, especially SNMIH-Blue-specific eyebrow and brand accents in `custom.css`.
- Payload field options and generated Payload types.
- Integration tests, browser fixtures, screenshots, documentation, and maintained project context.

No legacy filename or editor option remains. Compatibility is provided by the normalizer and migration, not by duplicate stylesheets.

## Accessibility and edge cases

Verification must cover:

- Primary text/background contrast in both modes.
- Link contrast on neutral, muted, primary, and media-overlay surfaces.
- Selected, hover, focus-visible, pressed, and disabled button states.
- Selected, hover, focus-visible, and overflow states for framed and underline tabs.
- Form-control focus rings against light, dark, muted, and brand surfaces.
- Nested radius ownership so parent and child corners do not visibly conflict.
- Joined controls and tables so the new radius does not create gaps or double-rounded seams.
- Desktop and mobile behavior, including tab overflow with hidden scrollbars.
- No-theme-attribute rendering and invalid stored values resolving to SNMIH-Blue.
- Legacy `default` and `snmih` runtime aliases preserving their original visual themes before migration runs.
- Current globals and version history migrating in both directions without changing unrelated values.

## Verification strategy

Implementation verification includes:

1. Focused integration contracts for theme normalization, registry values, CSS selectors, and default behavior.
2. Migration tests using mocked database collections or another isolated database boundary; never the configured project database.
3. Existing semantic contrast, button, tab, Calendar, and theme-contract suites.
4. Payload type generation followed by TypeScript and lint checks.
5. Production build verification.
6. Browser validation of representative pages in both themes and both color modes at desktop and mobile widths, including buttons, links, tabs, forms, cards, brand surfaces, overflow rails, and disabled states.
7. Project-context refresh and check after implementation.

## Acceptance criteria

- SNMIH-Blue is the default for new, missing, invalid, and no-attribute states.
- Existing legacy theme selections retain their visual identity through aliases and migration.
- Editors see only SNMIH-Green and SNMIH-Blue values.
- SNMIH-Green uses a coherent institutional green action language in light and dark modes.
- Radius is consistent across semantic controls and surfaces without damaging structural layouts.
- Shared buttons and tabs render correct semantic states without block-level duplication.
- SNMIH-Blue has no unintended visual regression.
- Migration is reversible, session-aware, idempotent, covered by tests, and not automatically executed.
- All focused tests, static checks, build checks, and project-context checks pass.
