# Download List File Types and Category Removal Design

## Goal

Simplify Download List authoring by replacing the free-text file-type override with a controlled
preset list and removing the unused document-category filtering feature.

## Payload schema

`downloads.fileType` remains optional but changes from a text field to a select field labelled
**File Type Label**. Its options are:

- PDF
- DOC
- DOCX
- XLS
- XLSX
- CSV
- PPT
- PPTX
- ZIP

An empty value means **Auto detect from uploaded file**. The Admin description must make that fallback
clear. The select must not be required and must not save a synthetic `auto` value.

Remove `downloads.category` and the block-level `showFilter` field. No replacement grouping or filter
configuration is introduced.

## Runtime behavior

When `fileType` contains a non-empty string, the server continues to normalize it to uppercase and
uses it as the badge and document-icon type. This preserves reasonable rendering compatibility for
historical values even though new Admin authoring is restricted to the preset list.

When `fileType` is empty, detect the type from the uploaded Media MIME type. Detection must cover the
new presets where Payload supplies a recognizable MIME type:

- PDF
- DOC and DOCX
- XLS and XLSX
- CSV
- PPT and PPTX
- ZIP
- existing image formats used by the document icon renderer

Unknown MIME types may continue to render without a file-type badge and use the generic document icon.

Remove category from the resolved document contract and from both grid and Inline presentation
markup. Remove category collection, active-filter state, filter controls, and filtered-document logic
from the client component. The client should render the supplied documents directly.

## Compatibility

No content migration is required. Historical category and `showFilter` values may remain in stored
documents but are ignored after the fields leave the active schema. Historical non-preset `fileType`
strings remain readable by the runtime and render in uppercase when encountered.

Missing or empty `fileType` values retain automatic detection. Existing display modes, actions,
columns, icons, badges, destinations, and action-display behavior do not change.

## Verification and maintained artifacts

Update Download List schema and rendering tests to verify:

- `fileType` is the optional preset select with the exact approved values.
- Category and Show Category Filter are absent from the schema.
- MIME detection covers representative Office, CSV, PDF, ZIP, and image values.
- Historical explicit file-type values still render safely.
- No category or filter UI remains in the client or presentations.
- Existing Download List layouts and action treatments remain unchanged.

Regenerate Payload types and only the Download List thumbnail. Remove category values from its fixture
while preserving the current labelled Framed Grid composition. Update the block operator guide,
feature inventory, block-system reference, and generated project inventory. Run focused Download List,
renderer, thumbnail, theme, TypeScript, lint, formatting, project-context, and diff-integrity checks.

Do not stage or commit any changes.
