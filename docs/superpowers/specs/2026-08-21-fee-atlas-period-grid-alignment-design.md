# Fee Atlas Period Grid Alignment Design

## Problem

The Programme Cost Atlas period grid removes left padding from its first period, so that record does
not align with the remaining records. When an odd number of periods wraps into the two-column compact
layout, the final record spans both columns and the empty half of that row has no center divider.

## Approved Design

- Give every period record the same horizontal padding. Remove the first-record and last-record
  padding exceptions.
- Keep the final odd period spanning the complete compact row so its established content width and
  wrapping behavior do not change.
- Draw a decorative center divider through that incomplete compact row when the category has more
  than one period.
- Hide the added divider from the large-screen period grid, where every period occupies its own
  configured column.
- Do not add a divider for a category containing only one period.

## Scope

Change only the shared `PeriodBreakdown` presentation and its focused rendering assertions. Preserve
the approved Programme Cost Atlas structure, typography, colors, spacing outside individual period
cells, content order, download presentation, and data behavior.

## Verification

- Assert that first, middle, and final period cells use the same horizontal padding.
- Assert that an odd final row exposes its compact center divider and hides it at the large breakpoint.
- Assert that a single-period grid does not render the decorative divider.
- Run the focused Fee Structure tests, TypeScript, targeted lint, the layout detector, project-context
  update/check, and a final diff/checksum audit without changing the Git staging state.
