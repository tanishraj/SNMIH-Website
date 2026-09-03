# Leadership Profile Name Sans Font Design

## Goal

Render Leadership Profiles card names with the project's sans-serif font while preserving the established card hierarchy and spacing.

## Design

- Replace the display-font utility on the profile name heading with `font-sans`.
- Preserve the existing heading level selection, font size, weight, line height, wrapping, and responsive behavior.
- Do not change the section title typography, designation, qualification, expertise, schema, or saved content.

## Verification

- Update the Leadership Profiles rendering contract to require `font-sans` on profile names and reject the display-font utility there.
- Run the focused Leadership Profiles integration test, TypeScript validation, and the required project-context update/check loop.
