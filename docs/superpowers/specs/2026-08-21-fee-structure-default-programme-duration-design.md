# Fee Structure Default Programme Duration Design

## Purpose

Ensure newly created Fee Structure blocks begin with a visible, editable Programme Cost Atlas detail for the MBBS programme duration while preserving the existing configurable Additional Programme Details model.

## Decision

Add this static default value to the existing top-level `programmeDetails` array:

```ts
;[
  {
    label: 'Programme Duration',
    value: '4.5 Years',
  },
]
```

The existing field remains named `Additional Programme Details`, remains limited to four rows, and remains visible only when `layout` is `programmeCostAtlas`. Both default strings remain ordinary required text inputs inside the row. Editors can change the label, change the value, reorder the row, add up to three other facts, or remove the row.

## Data and Runtime Behaviour

The default initializes new Fee Structure block authoring only. It does not add a dedicated duration property, make the row required, hard-code the value in React, or create a runtime fallback.

Existing saved blocks are not migrated or silently changed. An existing block without the row continues to omit Programme Duration until an editor adds and saves it. Runtime normalization remains authoritative: it trims both strings and omits incomplete rows exactly as it does today.

The Atlas renderer, table/mobile-card layout, tabs, fee categories, complete programme expense, download, and all current presentation classes remain unchanged. In particular, the user’s current in-progress changes in `ProgrammeCostAtlasPresentation.tsx` must be preserved byte-for-byte by this implementation.

## Verification

Extend the Fee Structure schema integration test to assert the exact `programmeDetails.defaultValue` alongside its existing array type and four-row maximum. Regenerate Payload types after the config change; the structural TypeScript shape is expected to remain the same because a default does not make the optional array required.

Run the focused Fee Structure suite, generated-type check, TypeScript, focused lint/format checks, and the required project-context update/check loop. Update the maintained Fee Structure operator/reference text to state that new blocks begin with an editable Programme Duration example. Do not regenerate the block thumbnail because its deterministic fixture already authors the same row and the frontend output does not change.

Do not stage, unstage, commit, or overwrite any of the user’s existing changes.
