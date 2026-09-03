# Icon Grid Ruled Columns Design

**Date:** 2026-08-17

**Status:** Approved

## Goal

Extend Icon Grid with a seamless `Ruled Columns` presentation for icon-led responsibilities, principles, services, and similar content. The presentation must reproduce an open grid with a centered section introduction, continuous top and bottom rules, responsive internal dividers, and left-aligned icon-led items without introducing another block.

## Architecture

Add `Ruled Columns` with stored value `ruled` to the existing Icon Grid `variant` select. Extend the generated `variant` union without changing existing stored values or defaults.

Keep the implementation within Icon Grid:

- `IconGridBlockComponent` continues to own section appearance, the header, actions, columns, item filtering, and footer actions.
- A dedicated `RuledItem` renderer owns the item typography, icon placement, description, link/action presentation, and semantic theme colors.
- Variant-specific grid classes own the continuous rules and responsive divider geometry.

No content field, collection registration, renderer registration, migration, or dependency is added. Existing Card, Contact Cards, Minimal, and Icon Top output remains unchanged.

## Payload Editor Contract

The `Card Style` options become:

- Card (bordered box): `card`.
- Contact Cards: `contactCards`.
- Minimal (icon + text, no box): `minimal`.
- Icon Top (centered icon above title): `iconTop`.
- Ruled Columns: `ruled`.

Ruled Columns reuses all existing Icon Grid controls:

- Columns: 2, 3, or 4.
- Icon Style: Square, Circle, Outline, or Plain.
- Section Content Alignment.
- Section Appearance and Padding.
- Item icon, title, description, destination, new-tab behavior, and shared action settings.

Per-item Background values remain stored and available when editors switch presentations. Update the field description to state that backgrounds apply only to Card and Contact Cards; Ruled Columns, Minimal, and Icon Top inherit the section surface.

## Visual Treatment

The existing Icon Grid header renders above the grid. Editors can reproduce the reference with a centered eyebrow, heading, and description.

Ruled Columns uses these item rules:

- No grid gap, rounded card shell, individual outer border, shadow, or hover lift.
- One continuous top and bottom rule around the item grid.
- Subtle internal horizontal and vertical dividers using the active section foreground at low opacity.
- Generous responsive item padding with equal-height grid tracks.
- Icon above left-aligned item content.
- Existing Icon Style controls the icon container; Outline is the reference choice.
- Item title uses the project display font at the larger Contact Cards scale.
- Description uses readable body sizing and the semantic secondary foreground.
- Visible link or button actions sit beneath the description and use the inherited section surface colors.

Resolve semantic icon, secondary text, divider, link, button, and focus colors from the section background. Do not apply an item's `cardBackground` or emit a per-item card-background contract in Ruled Columns.

## Responsive Divider Geometry

Preserve the existing Icon Grid column breakpoints:

- 2 Columns: one column on mobile, two from `sm`.
- 3 Columns: one column on mobile, two from `sm`, three from `lg`.
- 4 Columns: one column on mobile, two from `sm`, four from `lg`.

At each active breakpoint:

- Items in the same row receive only the internal vertical dividers required between columns.
- Rows receive horizontal separators without doubling the continuous outer rules.
- The final row ends against one continuous bottom rule.
- Incomplete final rows remain open in unused grid cells while preserving clean item borders and the full-width bottom rule.

## Links and Actions

Preserve existing Icon Grid link behavior:

- Page and custom URL destinations remain supported.
- New-tab destinations retain safe `rel` attributes.
- Link mode makes the full ruled item one anchor and presents the existing non-anchor link-action label inside it, matching the current Card and Minimal contract.
- Button mode renders a semantic article containing one linked shared button with the configured variant.
- Unlinked items render as semantic articles.

Never render nested anchors.

## Normalization and Failure Behavior

- Items with blank titles remain omitted.
- A block with no usable items renders nothing.
- A missing icon renders no icon markup.
- A non-empty stale icon name continues to fall back to `Star`.
- Missing columns, icon style, action settings, and presentation values retain their current defaults.
- A stale presentation value continues through the existing Card fallback path.
- Per-item background values are ignored only while Ruled Columns is selected and work again after switching to Card or Contact Cards.

## Integration Points

Implementation changes:

- `src/blocks/IconGrid/config.ts` for the new option and background-field description.
- `src/blocks/IconGrid/Component.tsx` for the type union, ruled renderer, section-surface resolution, and divider class maps.
- `src/payload-types.ts` through Payload type generation.
- A focused Icon Grid ruled-columns integration test plus existing shared card/theme contracts.
- `src/block-thumbnails/fixtures.tsx` and `public/block-thumbnails/icon-grid.jpg` so the Admin picker demonstrates Ruled Columns.
- `docs/guides/blocks.md` to document the new presentation.
- `.agents/skills/project-context/references/project-inventory.json` through the project-context update command.

The block count, registries, production renderer, live-preview renderer, feature inventory, and project-context narrative references remain unchanged because Icon Grid is already registered and its ownership/topology does not change.

## Verification

Tests and checks must verify:

- Payload exposes `ruled` without changing the existing default or option values.
- Generated Payload types include `ruled`.
- Ruled items inherit the section surface and ignore per-item backgrounds.
- The grid has continuous outer rules, no gaps or rounded card shells, and correct responsive divider classes for 2, 3, and 4 columns.
- Item icons, display titles, descriptions, equal-height layout, and Outline styling match the approved treatment.
- Page/custom links, new-tab behavior, Link actions, Button actions, and focus behavior remain valid without nested anchors.
- Blank titles, missing icons, stale icons, stale presentation values, and empty item arrays preserve their safe behavior.
- Card, Contact Cards, Minimal, and Icon Top retain their existing contracts.
- Page registration, live preview, thumbnail definition/fixture/JPEG, semantic theme behavior, TypeScript, ESLint, formatting, and project-context checks pass.

The active SNMIH theme file is outside scope.
