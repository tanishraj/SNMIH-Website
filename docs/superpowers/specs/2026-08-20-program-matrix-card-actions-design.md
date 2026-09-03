# Program Matrix Card Actions Design

## Goal

Ensure every Program Matrix item with a valid saved destination renders a visible action inside its
card. The action must honor the block-level Programme Action Style and Programme Button Variant
controls already exposed by Payload.

## Scope

This is a focused repair of the existing schema-to-render contract. It does not make the whole card
clickable, introduce per-item presentation settings, or change section and footer actions.

## Rendering Contract

- `linkType: 'page'` resolves through the existing hierarchical Page URL helper.
- `linkType: 'custom'` uses the trimmed custom URL.
- `linkType: 'none'`, an unset link type, or an unresolved destination renders no item action.
- `actionMode: 'button'` renders the existing shared Button-based programme action.
- `actionMode: 'link'` renders the existing shared ContentLink-based programme action.
- Missing or invalid legacy `actionMode` values fall back to `link`.
- The block-level `itemActionLabel` remains the visible label and falls back to `Learn More`.
- `openInNewTab` continues to control `target` and safe `rel` attributes.
- Actions remain inside the card content; the article itself is not wrapped in a link.

The component will accept and normalize `actionMode`, then pass the resolved mode to
`ProgrammeAction`. Existing semantic card-surface classes continue to provide link and button
contrast without new hard-coded colors.

## Payload Contract

The existing `actionMode`, `actionVariant`, item destination, label, and new-tab fields remain
unchanged. No migration or generated type change is required. Invalid or incomplete destinations
continue to fail closed by omitting the frontend action; stricter Admin validation is outside this
focused repair.

## Preview And Documentation

The Program Matrix thumbnail fixture will include at least one linked programme so the visible item
action is represented in the Admin picker. Its JPEG will be regenerated. The maintained block guide
already describes Button and Link Text actions, so no wording change is required once runtime
behavior matches it.

## Testing

Focused integration coverage will verify:

- Link is the default for legacy or unset mode values.
- Explicit Link mode renders ContentLink presentation.
- Explicit Button mode renders the selected shared button variant.
- Page and custom destinations render the expected URL.
- New-tab actions retain safe target and relationship attributes.
- None and unresolved destinations render no action.
- Actions remain separate controls inside the article rather than wrapping the full card.
- Link and button presentation remains readable on semantic card surfaces.

After implementation, run focused Program Matrix and shared card/button tests, targeted ESLint,
TypeScript checking, the thumbnail generator for `programMatrix`, and the required project-context
update/check loop.
