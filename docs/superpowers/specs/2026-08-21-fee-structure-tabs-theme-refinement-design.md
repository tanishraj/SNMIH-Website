# Fee Structure Tabs and Theme Refinement

**Date:** 2026-08-21
**Status:** Approved design; awaiting written-spec review

## Goal

Bring Fee Structure into visual alignment with the existing Gallery Album Tabs and News & Events Tabs blocks, while ensuring the fee table, mobile cards, and every fee value remain readable on light and dark section backgrounds.

## Scope

- Reuse the shared content-tab presentation contract for the Fee Structure category rail.
- Preserve existing Fee Structure documents that store `underline`, `pills`, or `boxed` tab-style values.
- Apply section-aware colors to the desktop table and mobile fee cards.
- Right-align every fee-value cell, including missing-value em dashes.
- Add focused regression tests for tab reuse, theme behavior, and alignment.

No fee data model, calculation behavior, document download behavior, or content-authoring limits change.

## Tab Presentation

Fee Structure will use the same shared tab rail and tab classes as Gallery Album Tabs and News & Events Tabs. The visual variants map as follows:

| Stored Fee Structure value | Shared presentation |
| -------------------------- | ------------------- |
| `underline` or missing     | `underline`         |
| `pills`                    | `pill`              |
| `boxed`                    | `contained`         |

This compatibility mapping avoids a content migration and keeps existing Admin values valid. The category interaction will continue using the accessible Radix/shadcn Tabs primitives, while their rail and trigger classes come from the shared content-tab helper.

The tab rail remains a single horizontally scrollable row. Tabs keep visible focus, intrinsic label width, and a minimum 44-pixel interaction height through the shared contract.

## Section-Aware Fee Surfaces

The server component will pass the resolved section background to the Fee Structure client. The client will distinguish the shared light and brand surfaces using the existing block-appearance resolver.

On light surfaces:

- Desktop table and mobile cards use `bg-card`, `text-card-foreground`, `border-border`, and existing muted total-row treatment.
- Sticky fee-head cells use the same opaque card surface so horizontally scrolling values cannot show through them.

On Brand and Gradient Brand surfaces:

- Table and mobile cards inherit the section's `text-primary-foreground` contract.
- Their surfaces use subtle `primary-foreground` overlays instead of light card tokens.
- Borders and dividers use translucent `primary-foreground` colors.
- Header and total rows use progressively stronger translucent overlays.
- Captions, row notes, and category notes retain readable foreground opacity instead of light-theme muted tokens.
- Sticky fee-head cells receive an opaque brand-compatible background matching the section, preventing content bleed while scrolling.

The treatment remains semantic and theme-aware; no SNMIH palette values will be hard-coded.

## Alignment

- Academic-period column headers remain right-aligned.
- Every fee-value cell is always right-aligned, regardless of whether it contains digits, text, or the normalized `—` placeholder.
- Numeric values continue using tabular numerals when they contain digits.
- Fee-head labels and their notes remain left-aligned for scanability.
- Mobile card values retain the same unconditional right alignment.

## Accessibility and Responsive Behavior

- Existing Radix tab semantics and keyboard behavior remain intact.
- Focus styles come from the shared tab presentation contract.
- Tablet and desktop retain the semantic table and horizontal overflow behavior.
- Mobile retains one card per academic period from the same normalized data.
- Contrast-sensitive elements receive explicit brand-surface classes rather than relying on inherited light-theme component defaults.

## Testing

Focused tests will verify:

- Fee Structure imports and uses the shared content-tab presentation helpers.
- Legacy tab-style values map to the correct shared variants.
- Light and brand surfaces produce their intended table/card text, border, sticky-cell, note, and total-row classes.
- All desktop fee-value cells include right alignment, while numeric detection only controls tabular numerals.
- Mobile values remain right-aligned, including `—`.
- Existing normalization, rendering, registration, live-preview, and download contracts remain green.

## Out of Scope

- Changing fee amounts or authored content
- Calculating totals or interpreting currencies
- Changing the Fee Structure Payload schema
- Migrating stored documents
- Redesigning other tabbed blocks
