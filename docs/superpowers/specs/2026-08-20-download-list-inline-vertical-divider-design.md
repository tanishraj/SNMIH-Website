# Download List Inline Vertical Divider Design

## Approved correction

Inline Download List items always use one horizontal content row:

`optional file icon | title and description | vertical divider | actions`

The divider remains vertical and the actions remain on the far right at every viewport and item width,
including mobile and narrow multi-column cards. Text may wrap within its flexible content column. Inline
continues to hide the file-type badge and render View/Download as accessible icon-only actions.

## Implementation

Remove the named-container breakpoint and bottom-row fallback from `InlinePresentation`. Use an explicit
three-column grid without the file icon and a four-column grid with it. The divider is a self-stretching
one-pixel left border, and the action group is centered vertically in the final column.

Update focused rendering tests and maintained Download List documentation. No schema, generated Payload
types, action resolution, migration, or thumbnail change is required.

## Verification

- Inline markup contains only the vertical divider classes.
- Both file-icon states retain the correct grid columns.
- Inline actions remain accessible and fixed on the right.
- Focused Download List, card renderer, type, lint, formatting, and project-context checks pass.
