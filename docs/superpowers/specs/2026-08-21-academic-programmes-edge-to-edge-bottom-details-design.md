# Academic Programmes Edge-to-Edge Bottom Details Design

## Purpose

Refine the Academic Programmes `Bottom of Card` metadata position so the Duration and Intake cells form a true edge-to-edge card footer. The details must touch the card's bottom edge and rely on the outer card border instead of drawing a second bottom rule.

The existing `After Description` presentation remains unchanged.

## Bottom Variant Composition

In `Bottom of Card` mode, preserve the card's semantic document order while changing the visual lower-content order to:

1. optional programme action;
2. optional Duration and Intake details.

The programme action therefore remains visible but moves above the details. The metadata row is the final visual element whenever at least one metadata value exists.

The lower region remains bottom-aligned with flex layout. Do not use absolute positioning.

## Edge-to-Edge Details

When bottom-positioned metadata renders:

- remove the content container's bottom padding beneath the metadata;
- extend the metadata row through the content container's horizontal padding to both card edges;
- retain only the metadata row's top border;
- remove its bottom border so the outer card supplies the final bottom rule;
- retain the vertical divider when both values render;
- retain the existing internal cell padding, metadata typography, semantic colours, and wrapping behaviour.

The horizontal extension must mirror the existing responsive card padding: `1.75rem` at the base size and `2rem` from the small breakpoint.

When bottom mode has an action but no metadata, retain normal horizontal and bottom card padding. When it has metadata but no action, the metadata alone remains bottom-aligned and edge-to-edge. When neither exists, retain the standard card padding and do not render an empty bottom region.

## Flow Variant

`After Description` keeps its current order and geometry:

1. metadata after the description;
2. programme action at the card bottom when present;
3. metadata with its existing top and bottom borders inside the normal content padding.

No flow-mode spacing, borders, or responsive behaviour changes.

## Theming, Interaction, and Accessibility

- Continue using resolved card-surface divider and secondary-text classes.
- Preserve the full-card anchor, focus treatment, hover treatment, and action label.
- Keep `dl`, `dt`, and `dd` semantics for programme details.
- Preserve the existing two-column details layout on narrow and wide viewports.
- Do not introduce new CMS fields or generated Payload type changes.

## Verification

Update focused Academic Programmes tests to cover:

- CTA-before-metadata order in bottom mode;
- edge-to-edge negative margins matching responsive card padding;
- top-only metadata border in bottom mode;
- outer-card bottom edge with no nested metadata bottom border;
- standard padding when bottom mode has an action but no metadata;
- metadata-only bottom mode;
- unchanged flow-mode order, padding, and two-sided metadata border;
- semantic surfaces and responsive list/grid composition.

Run focused Academic Programmes tests, TypeScript, lint, the Impeccable layout detector, and the required project-context update/check loop. Do not stage, unstage, or commit files.
