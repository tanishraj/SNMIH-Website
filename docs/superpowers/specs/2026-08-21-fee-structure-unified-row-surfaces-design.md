# Fee Structure Unified Row Surfaces Design

## Goal

Make every desktop fee-table body row read as one continuous surface. The sticky fee-name cell and all value cells must share the same normal and hover backgrounds, including the emphasized Total row.

## Scope

- Change only the desktop fee-table body rows in `FeeStructureClient`.
- Keep the top `Fee Head` column header unchanged.
- Keep the fee-name column sticky during horizontal scrolling.
- Keep mobile period cards unchanged.
- Do not change the Payload schema, fee values, normalization, calculations, downloads, tabs, or section layout.

## Presentation Contract

### Standard fee rows

- Every cell in a standard row uses one shared base surface.
- Hovering anywhere on the row applies one shared hover surface to every cell, including the sticky fee-name cell.
- Regular fee-name cells such as `Tuition Fee` use normal font weight.

### Total rows

- The sticky `Total` cell and every value cell use the same emphasized base surface.
- Hovering anywhere on the Total row applies the same stronger hover surface to every cell.
- The Total label and values remain bold.

### Themes

- Light surfaces use semantic Card and Accent mixtures so hover follows the active theme instead of
  shifting toward a neutral Muted gray. Standard rows use Card at rest and a 40% Accent mixture on
  hover. Total rows use a 55% Accent mixture at rest and a 75% Accent mixture on hover.
- Brand and Gradient Brand surfaces use semantic Primary and Primary Foreground mixtures. Standard
  rows use 6% foreground at rest and 12% on hover; Total rows use 10% at rest and 18% on hover.
- Cell backgrounds must be opaque enough for the sticky fee-name cell to prevent horizontally scrolled content from showing through.

## Implementation Direction

The body `TableRow` owns the surface state and applies its resolved base and hover background to every direct `th` and `td`. The sticky `TableHead` stops declaring a conflicting background. Static class branches cover light/brand and standard/total combinations so Tailwind can generate them deterministically.

## Verification

- Add render-contract assertions for normal standard labels and bold Total labels/values.
- Assert each standard and Total row applies its background and hover state to all direct cells.
- Assert the sticky body header no longer declares an independent conflicting background.
- Run the focused Fee Structure tests, TypeScript, lint, diff checks, layout detector, and the required project-context update/check loop.
- Regenerate the Fee Structure thumbnail only if the corrected table surfaces materially change its preview.

## Working-Tree Constraint

Do not stage, unstage, or commit any file. Preserve the existing shared index exactly as it is.
