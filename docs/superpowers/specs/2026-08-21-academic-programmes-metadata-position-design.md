# Academic Programmes Metadata Position Design

## Purpose

Make the two programme metadata items fully editor-authored and add a block-level option that can align the metadata and programme action consistently at the bottom of equal-height Academic Programmes cards.

This refinement applies to both grid and list presentations and preserves the current Academic Programmes content model, card design, responsive behaviour, and existing saved content.

## Content Model

Each programme keeps exactly two optional metadata items. Extend the existing fields as follows:

- `durationLabel`: optional text, defaulting to `Duration` in the editor;
- `duration`: the existing optional value, such as `3 years`;
- `intakeLabel`: optional text, defaulting to `Intake` in the editor;
- `intake`: the existing optional value, such as `Subject to approval`.

The labels and values are authored independently per programme. The two-item structure remains intentionally bounded; do not replace it with a generic metadata array.

Add `metadataPosition` to Academic Programmes Theme Settings:

- `flow`: render metadata directly after the description;
- `bottom`: align the metadata-and-action group to the bottom of the card.

Use `flow` as the schema and runtime fallback so existing Academic Programmes blocks retain their current layout until an editor explicitly selects the new bottom alignment.

## Rendering Behaviour

Normalize all four metadata strings on the server before passing them to the client presentation.

- A metadata item renders only when its value is non-empty.
- When a value renders and its label is empty, use the corresponding fallback label, `Duration` or `Intake`.
- A label without a value does not render an empty metadata item.
- When neither value is present, omit the metadata container and all associated spacing and dividers.

In `flow` mode, preserve the current order:

1. badge and category;
2. title;
3. description;
4. metadata;
5. action.

In `bottom` mode, retain the same document order but place flexible space before a bottom group containing:

1. metadata, when present;
2. action, when a valid programme link exists.

The metadata sits immediately above the action. If only metadata or only an action exists, the available element still aligns at the bottom. This keeps the lower content edge consistent across equal-height cards without introducing absolute positioning or changing keyboard reading order.

## Layout and Responsive Behaviour

- Preserve the existing two-column metadata layout where space allows.
- Preserve current wrapping and responsive card behaviour on narrow viewports.
- Keep metadata labels and values left aligned using the existing shared typography and semantic colours.
- Preserve the existing borders, spacing rhythm, card surfaces, full-card link behaviour, focus treatment, and action treatment.
- Apply the bottom alignment consistently to grid and list cards, while allowing naturally sized list rows to remain content-driven.
- Do not reserve empty space when metadata or an action is absent.

## Compatibility

Existing `duration` and `intake` values continue to render. Newly added labels have schema defaults and runtime fallbacks, so no content migration is required.

Unknown or missing `metadataPosition` values resolve to `flow`. No Program Grid compatibility or content migration is included.

## Verification

Add or update focused tests covering:

- the new label fields and their editor defaults;
- the `metadataPosition` options and `flow` default;
- custom labels and values reaching the presentation component;
- fallback labels when saved labels are absent or blank;
- omission of metadata items whose values are blank;
- flow and bottom card composition;
- bottom alignment when metadata and action are both present, and when either is absent;
- consistent behaviour in grid and list presentations;
- existing responsive, theming, full-card link, and accessibility behaviour.

Regenerate Payload types, run focused Academic Programmes tests, run TypeScript and relevant integration checks, and complete the required `project-context:update` and `project-context:check` loop.

Do not stage, unstage, or commit files.
