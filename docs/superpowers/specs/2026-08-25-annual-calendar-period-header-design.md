# Annual Calendar Period Header Refinement

## Purpose

Refine the Annual Calendar ledger so visitors can immediately understand the displayed period and
the volume of scheduled events. Add an optional editor-configured academic-year range while keeping
the current calendar year as the zero-configuration default.

## Period Modes

The block supports two period modes:

1. **Current calendar year** is the default and compatibility fallback. It resolves January through
   December from the configured site timezone and renders the ledger header as
   `Calendar year 2026`.
2. **Custom academic year** is optional. Editors explicitly choose Start Month, Start Year, End
   Month, and End Year. The inclusive range must contain exactly twelve consecutive months. A valid
   July 2026 through June 2027 range renders the ledger header as `Academic year 2026–2027`.

Existing Annual Calendar blocks have no custom-period values and therefore continue to resolve the
current calendar year without a content migration.

## Payload Authoring Contract

Add a `periodMode` select to the Annual Calendar Content tab:

- `currentYear`, labelled **Current calendar year**, is the default.
- `customAcademicYear`, labelled **Custom academic year**, enables the four range fields.

When custom mode is active, show two horizontal Admin rows:

- Start Month and Start Year
- End Month and End Year

Month fields use January through December select options. Year fields use integer number inputs.
All four fields are required only in custom mode. Validation rejects invalid years, invalid months,
an end before the start, and any inclusive range that is not exactly twelve months. The recovery
message is: `Choose an academic-year range containing exactly 12 consecutive months.`

## Data Contract

Replace the Annual Calendar's year-only period model with a serializable inclusive range:

- `startMonthKey`, such as `2026-07`
- `endMonthKey`, such as `2027-06`
- `months`, always twelve ordered month snapshots
- `periodLabel`, either `Calendar year 2026` or `Academic year 2026–2027`
- `eventCount`, calculated from the normalized events in the twelve-month range

The default range derives from `getZonedToday` in the configured site timezone. Custom values are
normalized from the block configuration. Invalid or incomplete custom configuration does not issue
an unbounded query; the production adapter renders the existing not-configured state and the Admin
validation identifies the correction.

The public and authenticated-draft loaders query `eventStart` between the timezone-correct start of
the first configured month and end of the twelfth month. Events are grouped by their start month.
Coming Next remains independent of the displayed period and continues to show the next four events
from today, including events outside the configured academic-year interval.

Published cache keys include response version, timezone, ordered classification IDs, start month,
and end month so different academic ranges cannot collide.

## Ledger Header

Add one full-width header inside the Annual Calendar ledger, above the month rows:

- left: the resolved period label in the established sans-serif interface typography
- right: the normalized event total, rendered as `1 event` or `12 events`

The header uses the same transparent inherited surface, semantic divider, foreground, and supporting
text contracts as the ledger. It introduces no display typography, hard-coded color, shadow, or new
radius.

## Month Rows

- Remove the green ledger border/spine entirely.
- Render only the month name, such as `January`; do not repeat the year below it.
- For the current site-timezone month, render a compact rectangular `Current` badge above the month
  name. The badge uses the shared radius and semantic foreground/border treatment.
- Preserve the current-month and today semantic surface highlights.
- Event rows keep their complete link target, date, time/location, classification label, and
  classification-tone marker.
- Empty months remain visible. Their message is vertically centered in a row with the same minimum
  visual height as a normal event row, including at desktop widths.

## Responsive and Accessibility Behavior

The ledger remains first in DOM and visual order. Coming Next remains beside it on large screens and
stacks below it on smaller screens. The header label and event count wrap or stack without horizontal
overflow on narrow screens.

The ledger keeps semantic section headings, `<time>` elements, complete event links, visible focus
indicators, non-color classification labels, and theme-aware contrast. Current and today states
remain available through text and data attributes rather than color alone.

## Error and Empty States

- A block with no valid Event classifications keeps the existing not-configured state.
- An incomplete or invalid custom academic range also renders the not-configured state and never
  falls back to a broader period query.
- A valid range with zero events renders all twelve months, a `0 events` header count, and vertically
  centered empty messages.

## Compatibility

- No migration or stored-content rewrite is required.
- Existing Annual Calendar blocks use current-calendar-year mode.
- The interactive Calendar block and its Upcoming legend remain unchanged.
- Annual Calendar production and authenticated live preview continue to share one presentation and
  equivalent snapshot data.

## Verification

Add or update contracts for:

- current-year normalization in the configured timezone
- July 2026 through June 2027 month materialization and timezone bounds
- exact twelve-month validation and fail-closed invalid configuration
- published and authenticated-draft query ranges and cache separation
- ledger header copy and singular/plural event totals
- absence of the green ledger border
- month-only labels and badge-before-month ordering
- vertically centered empty rows
- current month, today, focus, semantic light/brand surfaces, and responsive structure
- Payload-generated types, thumbnail fixture, operator docs, and maintained project context
