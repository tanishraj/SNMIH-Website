# Contact Form Label Design

## Objective

Rename the user-facing **Contact 33** block label to **Contact Form** so editors can identify the block by its purpose instead of its registry number.

## Naming and compatibility

| Concern | Value |
| --- | --- |
| Payload singular label | Contact Form |
| Payload plural label | Contact Forms |
| Thumbnail label | Contact Form |
| Thumbnail alternate text | Contact Form block preview |
| Internal block slug | `contact33` (unchanged) |
| Type, component, directory, and file identifiers | Unchanged |

Keeping the internal identity stable preserves all existing page data and requires no database migration.

## Implementation

- Update the Payload block labels in `src/blocks/Contact33/config.ts`.
- Update the Contact 33 thumbnail label and alternate text in `src/block-thumbnails/definitions.ts`.
- Regenerate Payload types only if the label update changes generated output.
- Update focused schema and thumbnail assertions to protect the new editor-facing name.

## Verification

- Focused Contact 33 and block-thumbnail tests pass.
- ESLint passes for changed TypeScript files.
- `git diff --check` passes.
- The Payload admin and thumbnail preview render **Contact Form**.
- Existing content continues to use the `contact33` block slug.

## Out of scope

- Visual, layout, form-submission, or field changes.
- Renaming the internal slug, source files, exports, React components, or DOM attributes.
- Database migration or content rewrites.
