# Program Matrix Column Count Design

## Goal

Let editors choose how many columns the Program Matrix uses on large screens while preserving readable responsive layouts, the current seamless card borders, and compatibility with existing content.

## Approved Authoring Contract

Add a required `columns` select to the Program Matrix Theme Settings tab.

- Label: `Number of Columns`
- Options: `1`, `2`, `3`, and `4`
- Default: `2`
- Runtime fallback for missing or malformed values: `2`
- Availability: both Stacked and Split header layouts

The value is stored as a select value and exposed through generated Payload types. Existing documents without the field continue to render as two columns at desktop widths.

## Responsive Presentation

The configured value determines the desktop matrix width:

| Configured value | Mobile | Tablet (`md`) | Desktop (`lg`) |
| --- | --- | --- | --- |
| 1 | 1 | 1 | 1 |
| 2 | 1 | 2 | 2 |
| 3 | 1 | 2 | 3 |
| 4 | 1 | 2 | 4 |

Mobile always uses one column. Tablet uses no more than two columns. Desktop uses the editor's selected count. This behavior applies identically whether the section introduction is stacked above the matrix or placed beside it in the 40/60 Split layout.

The renderer will use explicit, statically discoverable Tailwind class maps. It will not construct class names dynamically.

## Divider Geometry

The matrix retains its existing rounded outer border and seamless internal rules. Divider decisions must be calculated independently for the active tablet and desktop column counts:

- A card receives a right divider unless it ends its row at that breakpoint.
- A card receives a bottom divider unless it belongs to the final row at that breakpoint.
- Breakpoint overrides must replace the smaller breakpoint's divider state.
- Incomplete final rows must not receive a bottom divider.

The calculation is based on the filtered list of rendered items, not the raw authored array, so omitted items with empty titles cannot corrupt row boundaries.

## Runtime Normalization

The component accepts the generated select values and normalizes them to the supported set. Values other than `1`, `2`, `3`, or `4`, including `null` and missing legacy data, resolve to `2`.

A stable data attribute should expose the resolved column count for contract testing and browser inspection. The DOM order of the introduction, cards, and footer actions remains unchanged.

## Files and Generated Artifacts

The implementation is expected to update:

- `src/blocks/ProgramMatrix/config.ts`
- `src/blocks/ProgramMatrix/Component.tsx`
- `tests/int/program-matrix.int.spec.tsx`
- `src/payload-types.ts`
- `src/block-thumbnails/fixtures.tsx`
- `public/block-thumbnails/program-matrix.jpg`
- `docs/guides/blocks.md`
- `docs/architecture/feature-inventory.md`
- `.agents/skills/project-context/references/block-system.md`
- `.agents/skills/project-context/references/project-inventory.json` when its generated digest changes

No collection registration, block renderer registration, live-preview routing, database migration, or custom Admin component is required.

## Verification

Focused tests will cover:

- the required schema field, options, and default;
- missing and malformed values falling back to two columns;
- explicit responsive grid classes for all four values;
- tablet caps for three- and four-column configurations;
- tablet and desktop divider boundaries for complete and incomplete rows;
- unchanged behavior in both Stacked and Split layouts;
- generated types, thumbnail fixture, and maintained documentation.

After implementation, regenerate Payload types, the import map, and the Program Matrix thumbnail. Run the focused Program Matrix suite, neighboring block contracts, ESLint, TypeScript, and the required project-context update/check loop. Visually inspect the refreshed thumbnail for readable cards, correct column count, and unbroken dividers.

## Out of Scope

- Separate column settings per breakpoint
- More than four columns
- Per-card spans or masonry behavior
- Changing the 40/60 Split layout proportions
- Changing card content, action behavior, or header positioning
