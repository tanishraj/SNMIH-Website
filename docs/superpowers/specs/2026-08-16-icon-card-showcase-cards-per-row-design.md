# Icon Card Showcase Cards per Row Design

**Date:** 2026-08-16

**Status:** Approved

## Goal

Make the Icon Card Showcase grid control explicit for editors by offering 2, 3, or 4 cards per row without changing existing saved content or the established responsive layout.

## Current Behavior

The block already stores a global `cardWidth` value and maps it to responsive grid columns:

- `wide` renders 2 columns.
- `standard` renders 3 columns.
- `compact` renders 4 columns.

The editor currently sees these choices as card widths, so the resulting number of cards per row is not obvious.

## CMS Configuration

Keep the internal `cardWidth` field and its existing stored values for backward compatibility. Change only its editor-facing vocabulary:

| Editor option | Stored value | Desktop result |
| ------------- | ------------ | -------------- |
| 2 Cards       | `wide`       | 2 columns      |
| 3 Cards       | `standard`   | 3 columns      |
| 4 Cards       | `compact`    | 4 columns      |

The field label becomes `Cards per Row`. The default remains `standard`, presented to editors as `3 Cards`.

The options should appear in ascending numeric order. Existing documents retain their stored values and require no migration.

## Responsive Behavior

Preserve the current renderer mappings:

- `wide`: `grid-cols-1 md:grid-cols-2`.
- `standard`: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- `compact`: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.

This produces one card per row on mobile, two on tablet, and the configured count at the breakpoint where that count remains readable. Four columns wait until extra-large screens to avoid cramped card content.

Equal-height cards, gaps, internal padding, wrapping, alignment, backgrounds, actions, and all other block behavior remain unchanged.

## Compatibility and Failure Behavior

- No data migration is required.
- Existing `wide`, `standard`, and `compact` values preserve their current rendering.
- A missing or stale `cardWidth` value continues to normalize to `standard`, which editors understand as 3 cards per row.
- The generated Payload union keeps the same three members. Because Payload follows option order, its textual order may become `'wide' | 'standard' | 'compact'`; that generated reorder is expected and does not change accepted data.

## Scope

Implementation is limited to:

- The Icon Card Showcase Payload field label and option labels/order.
- Focused schema assertions for the editor contract.
- Maintained block documentation describing the control.
- Generated Payload types when their textual union order follows the reordered options.
- Generated project context if the repository inventory changes.

The renderer mapping does not need to change. The active SNMIH theme and unrelated blocks are outside scope.

## Verification

Tests and checks must verify:

- The field is still named `cardWidth` and defaults to `standard`.
- The editor label is `Cards per Row`.
- Options are presented as 2, 3, and 4 cards while retaining the stored values `wide`, `standard`, and `compact`.
- All three existing responsive class mappings still render correctly.
- Stale values still fall back to the 3-card layout.
- Payload type generation, TypeScript, focused block tests, and related block contracts pass.
- `pnpm project-context:update` and `pnpm project-context:check` complete successfully.
