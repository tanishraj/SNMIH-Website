# Icon Grid Ruled Typography Alignment Design

**Date:** 2026-08-17

**Status:** Approved

## Goal

Align the Icon Grid `Ruled Columns` item typography with the shared typography used by existing content blocks. Remove the presentation-specific display-font and oversized body treatment without changing the ruled layout's geometry or behavior.

## Architecture

Reuse the shared exports from `src/blocks/shared/contentStyles.ts` directly in `RuledItem`:

- `contentItemTitleClasses` for item titles.
- `contentItemDescriptionClasses` for item descriptions.

Compose `contentItemDescriptionClasses` with the ruled section surface's `secondary` class so light, subtle, gradient, and brand surfaces retain the existing semantic contrast behavior.

Do not create a new typography token, duplicate the shared class strings locally, or modify the shared typography contract.

## Visual Contract

Ruled item titles use the shared content-item treatment:

- Sans-serif family.
- `text-md` on mobile.
- `text-lg` from `sm`.
- Shared tight line height, semibold weight, foreground color, and focus-compatible decoration classes.

Ruled item descriptions use the shared content-item treatment:

- `text-sm`.
- `leading-5`.
- Section-aware secondary foreground supplied by the ruled surface resolver.

The following remain unchanged:

- Section eyebrow, title, and description typography.
- Item padding, gaps, equal-height behavior, top/bottom rules, and responsive dividers.
- Icon sizing and styles.
- Link and button presentation, focus behavior, and semantics.
- Card, Contact Cards, Minimal, and Icon Top presentations.
- Payload fields, generated types, block registries, and theme files.

## Testing and Maintained Artifacts

Update the focused Ruled Columns test to assert the shared title and description class contracts and to reject the former display-font and `text-2xl` item-title treatment.

Regenerate `public/block-thumbnails/icon-grid.jpg` so the Admin picker reflects the aligned typography. Run focused renderer, theme, Page, live-preview, and thumbnail contracts plus TypeScript, ESLint, formatting, layout detection, and the project-context update/check loop.

The deterministic project inventory may change if the maintained source hash changes. Narrative project-context references remain unchanged because architecture, ownership, registration, and operator controls do not change.

## Delivery Constraint

Leave all implementation, test, thumbnail, documentation, and project-context changes uncommitted.
