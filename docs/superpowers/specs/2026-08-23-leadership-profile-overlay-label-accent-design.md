# Leadership Profile Overlay Label Accent Design

## Goal

Make the Leadership Label in the Leadership Profiles Image Overlay layout read as a highlighted institutional category, matching the supplied reference while preserving accessible contrast.

## Approved Design

- Keep the label as plain uppercase text with its existing monospace typography, size, weight, tracking, and placement.
- Use the SNMIH semantic green system rather than a fixed color:
  - Light overlay tone: use the deeper `success` green.
  - Dark and Brand overlay tones: use the lighter `ring` green.
- Do not add a pill, background, border, icon, or interaction.
- Do not change the Standard card layout or its existing surface-aware label treatment.

## Implementation

The Image Overlay branch derives one label color class from the resolved overlay tone and applies it only to the Leadership Label. The name and designation continue using the shared overlay text colors.

No Payload fields, generated types, data migration, or content changes are required.

## Verification

- Extend the focused Leadership Profiles render contract to verify the adaptive label colors for Light, Dark, and Brand overlay tones.
- Run the focused integration test, TypeScript, lint, the UI detector, and the required project-context update/check loop.
- Preserve all existing user changes and do not stage or commit files.
