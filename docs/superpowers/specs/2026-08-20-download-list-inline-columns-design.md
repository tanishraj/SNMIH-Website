# Download List Inline Columns Design

## Goal

Allow the Download List's Inline List presentation to use one to eight responsive columns without
turning its items into boxed cards or changing existing Inline List layouts.

## Authoring Model

Add `inlineColumns`, a required select shown only when `displayMode` is `list`. It offers string
values `1` through `8` and defaults to `1`. The existing `columns` field remains grid-only, keeps its
Grid Columns label, and retains its default of `3`.

A separate field is intentional. Reusing the existing grid field could make previously saved Inline
Lists render as three columns because that field already defaults to three. Existing Inline Lists
without `inlineColumns` therefore resolve to one column at runtime and preserve their current
appearance without a migration.

## Presentation

Inline List remains an unboxed ruled presentation. Its outer list becomes a responsive grid using
the same static one-to-eight column class map and viewport caps as the three grid presentations:

- Phone: one column
- Tablet: up to two columns
- Laptop: up to four columns
- Wide desktop: up to the selected one-to-eight columns

Every document retains the current inline anatomy: main icon, title and supporting text, optional
file-type badge, category, and explicit actions. Multi-column items use subtle horizontal and
vertical dividers. The list keeps its top and bottom outer rules and does not add rounded boxes,
gaps, or independent card backgrounds.

The responsive item layout must adapt within a narrower column. At wide single-column widths it may
use the existing horizontal tracks. In multi-column contexts, content and actions may wrap within
the item while maintaining readable minimum widths and avoiding horizontal overflow.

## Compatibility

- Missing or invalid `inlineColumns` values resolve to `1`.
- Existing `columns` values continue to affect only Boxed Card, Open Grid, and Framed Grid.
- Existing `list` and legacy `compact` values remain Inline List; both use one column unless a valid
  `inlineColumns` value is saved.
- No data migration is required.

## Accessibility And Theme Contract

- Dividers use the existing low-emphasis semantic border color.
- Item actions keep their current accessible Link, Button, and Icon-only behavior.
- Focus order follows document order regardless of the visual column count.
- No content is clipped or made horizontally scrollable.

## Verification

Tests cover schema visibility/defaults, one-to-eight options, runtime normalization, responsive class
selection, one-column compatibility, multi-column divider behavior, legacy `compact`, and unchanged
grid-column behavior. Regenerate Payload types and the Download List thumbnail only if the fixture is
updated to demonstrate Inline List columns.
