# Q&A Accordion Section Content Split

## Goal

Make the Q&A Accordion split layouts place the section content in one column and the accordion in the opposite column, with an editor-controlled Q&A side.

## Current Problem

The existing 50/50 and One-Third modes do not split section content from Q&A. The title, description, section actions, and accordion are bundled together, while the opposite column is reserved for the optional Profile and Contact Prompt. Split mode also collapses to Full Width when that optional side content is empty.

## Admin Contract

Preserve the existing saved fields and values:

- `layoutMode`: `fiftyFifty`, `oneThird`, or `fullWidth`;
- `accordionPlacement`: `left` or `right`;
- `sideColumn.profile` and `sideColumn.contact`;
- all content, appearance, alignment, size, and open-state fields.

Clarify labels without changing stored values:

- `Accordion Placement` becomes `Q&A Placement`;
- `One-Third Side Column` becomes `One-Third Content / Two-Thirds Q&A`.

Profile and Contact Prompt remain available only for split layouts.

## Split Composition

For `fiftyFifty` and `oneThird`, render two responsibilities:

1. Section content column:
   - title and optional accent title;
   - description;
   - section actions;
   - optional Profile;
   - optional Contact Prompt and its actions.
2. Q&A column:
   - accordion items only.

The split is controlled by `layoutMode`, not by whether Profile or Contact Prompt contains data. An empty optional side column therefore never collapses an authored split layout.

`accordionPlacement` controls desktop order:

- `right`: section content left, Q&A right;
- `left`: Q&A left, section content right.

The DOM order remains section content first and Q&A second. On mobile and tablet, both stack in that logical order regardless of desktop placement. Q&A rows remain left-aligned; `contentAlignment` applies only to the section content column.

## Widths

- `fiftyFifty`: two equal desktop columns.
- `oneThird`: a three-track desktop grid; section content occupies one track and Q&A occupies two tracks.
- `fullWidth`: section content appears above the accordion in one column.

For Full Width, Profile and Contact Prompt remain hidden, matching the current Admin condition and runtime behavior.

## Footer Actions

Block Footer Actions remain after the complete content/Q&A composition and span the section container.

## Compatibility

No stored field name or option value changes. Existing documents keep their selected layout and Q&A side. Existing Profile and Contact Prompt data moves beneath the section introduction in split modes without migration. Generated Payload types should remain structurally unchanged.

Existing diagnostic attributes remain available. `data-qa-accordion-main` identifies the Q&A column, while a new `data-qa-accordion-section-content="true"` attribute identifies the section content column. `data-qa-accordion-layout` reports the authored normalized layout rather than falling back based on optional side content.

## Verification

- Config tests preserve field names, values, defaults, and conditional visibility while asserting the clearer labels.
- A 50/50 split with no Profile or Contact Prompt still renders two columns.
- Both Q&A placements render the correct desktop order while section content remains first in the markup.
- One-Third gives Q&A two tracks and section content one track on either side.
- Profile and Contact Prompt render beneath section content in split modes.
- Full Width remains stacked and ignores saved optional side content.
- Focused block tests, generated types, TypeScript, lint, and the project-context update/check loop pass.
