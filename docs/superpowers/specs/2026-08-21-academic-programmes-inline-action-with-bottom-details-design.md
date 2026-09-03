# Academic Programmes Inline Action with Bottom Details Design

## Purpose

Refine linked Academic Programmes cards that use `Bottom of Card` metadata so the action reads as part of the programme summary rather than as a second footer above the Duration and Intake footer.

Cards without bottom-positioned metadata retain the existing ruled, full-width action treatment.

## Conditional Composition

Use the inline action treatment only when all of the following are true:

- `metadataPosition` resolves to `bottom`;
- at least one metadata value renders;
- the programme has a valid link.

In that state, render card content in this visual and document order:

1. badge and category;
2. title;
3. description, when present;
4. inline programme action;
5. flexible remaining space;
6. edge-to-edge metadata footer.

When the description is absent, the action follows the title and any badge/category content. The action remains above the flexible spacer rather than joining the metadata footer.

## Inline Action Treatment

- Remove the action's top divider.
- Place the action below the preceding prose with the existing content rhythm.
- Render the label and `ActionArrow` in an intrinsic-width `inline-flex` group.
- Keep a compact gap between the label and arrow; do not justify the arrow to the far card edge.
- Preserve the underlined label, semantic surface link colour, arrow animation, and full-card hover/focus relationship.
- Do not add a nested anchor because the full programme card remains the single link target.

## Other Card States

- `After Description` metadata keeps the existing ruled action footer and current ordering.
- `Bottom of Card` with an action but no metadata keeps the existing ruled action footer at the bottom.
- `Bottom of Card` with metadata but no valid link keeps only the edge-to-edge metadata footer.
- Cards with neither metadata nor a valid link remain unchanged.

The existing edge-to-edge metadata geometry, top-only rule, responsive padding compensation, semantic `dl` structure, surfaces, and list/grid behaviour remain unchanged.

## Verification

Update focused Academic Programmes tests to cover:

- inline action immediately after the description when bottom metadata exists;
- inline action after the title when no description exists;
- no action top divider in that state;
- adjacent label and arrow using intrinsic width and a compact gap;
- metadata remaining the final card element;
- ruled full-width action preserved for flow mode;
- ruled full-width action preserved for bottom mode without metadata;
- action omission for invalid or absent links;
- semantic surfaces, full-card linking, and responsive list/grid composition.

Run focused and neighbouring Academic Programmes tests, TypeScript, lint, the Impeccable layout detector, and the required project-context update/check loop. Do not stage, unstage, or commit files.
