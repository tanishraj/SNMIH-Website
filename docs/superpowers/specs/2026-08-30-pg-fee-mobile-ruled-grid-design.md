# PG Fee Structure Mobile Ruled Grid Design

## Purpose

Align the PG Fee Structure department breakdown with the established Fee Structure Atlas mobile
reading pattern without changing PG fee content, desktop behavior, or editor configuration.

## Scope

The change applies only to the fee-value grid inside every PG department chapter. The Primary
summary, department heading and note, category tabs, desktop 676px threshold behavior, document
action, and section appearance remain unchanged.

## Compact Ruled Grid

Below the `lg` breakpoint, each department uses the Fee Structure Atlas ruled-grid pattern:

- Values render in two equal columns.
- The second item in each pair receives a vertical divider.
- Items from the second row onward receive a horizontal divider.
- When the column count is odd, the final value spans both columns.
- An odd final value retains the visual center divider used by Fee Structure, so the incomplete pair
  still reads as part of the same two-column system.
- One value spans the complete width without a decorative center divider.
- Labels remain left-aligned mono metadata; authored values remain left-aligned sans-serif text with
  tabular numerals when detected as numeric.

The compact rules use semantic `border-border`, `text-muted-foreground`, and Card foreground tokens,
so light and dark modes remain aligned with the active SNMIH theme.

## Desktop Preservation

At `lg` and above, the existing PG department grid remains adaptive. It continues using
`auto-fit/minmax` columns so one to six authored fee columns can use the available statement width.
Compact horizontal dividers and odd-item spanning are removed at `lg`; desktop items retain their
existing vertical separators.

## Architecture

Keep the implementation local to `PGFeeStructureAtlasPresentation.tsx`. Derive the current column
index, whether it is the final odd item, and whether the compact center divider is required while
mapping `category.columns`. This mirrors the proven Fee Structure `PeriodBreakdown` behavior without
refactoring or coupling the two blocks' distinct normalized data types.

No Payload field, generated type, normalizer, migration, saved-content contract, or block
registration changes.

## Accessibility and Content Integrity

- Reading order remains DOM order and matches the configured column order.
- Dividers are decorative CSS borders and pseudo-elements; they add no screen-reader noise.
- Long labels and values continue wrapping instead of forcing page-level horizontal scrolling.
- Missing values remain the existing em dash fallback.
- Department names and notes remain semantic headings and supporting text.
- No hover or pointer interaction is introduced.

## Verification

Focused PG Fee Structure tests must verify:

- two compact columns and the paired vertical rule;
- horizontal rules on values from the second row onward;
- an odd final value spanning both columns with the compact center divider;
- a single value spanning the full width without the center divider;
- `lg` removal of compact row rules and odd-item spanning;
- unchanged authored labels, values, notes, summary, and five-department desktop scrolling contract.

The block guide and maintained project context must describe the shared compact ruled-grid behavior.
