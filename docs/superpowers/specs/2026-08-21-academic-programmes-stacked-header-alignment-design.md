# Academic Programmes Stacked Header Alignment Design

## Problem

The Academic Programmes stacked header applies `max-w-3xl` without positioning that constrained
header within the full section container. A centered intro is therefore centered only inside a
left-anchored header grid rather than across the complete block width.

## Approved Design

- Keep the stacked header constrained to the established readable `max-w-3xl` measure.
- Give the stacked header `w-full` so its internal content uses that complete measure.
- Position the complete stacked header from the existing Section Content Alignment value:
  - Left uses `mr-auto`.
  - Center uses `mx-auto`.
  - Right uses `ml-auto`.
- Reuse the established Student Experience alignment pattern rather than introducing new layout
  semantics.
- Leave the split header grid, programme cards, content typography, actions, and saved CMS values
  unchanged.

## Scope

Change only the Academic Programmes presentation and its focused rendering tests. No Payload field,
generated type, data migration, or operator-documentation change is required because the existing
Section Content Alignment setting already expresses the intended behavior.

## Verification

- Assert that stacked Left, Center, and Right headers receive `w-full max-w-3xl` plus `mr-auto`,
  `mx-auto`, and `ml-auto`, respectively.
- Assert that the centered intro retains `items-center text-center`.
- Assert that the split header keeps its existing large-screen two-column layout and does not receive
  the stacked-only width or outer-positioning contract.
- Run the focused Academic Programmes tests, neighboring block contracts, TypeScript, targeted lint,
  the layout detector, thumbnail generation/inspection, project-context update/check, and final Git
  boundary checks without staging or committing.
