# SNMIH Surface-Aware Eyebrow Color

## Goal

Give section eyebrows a restrained green accent in the SNMIH theme while preserving every other theme and avoiding additional color tokens or CMS controls.

## Design

Introduce one shared eyebrow presentation primitive for section-level eyebrow text. It will retain the existing monospace typography, uppercase treatment, weight, size, and tracking while resolving color from the active theme and rendered surface:

- SNMIH on a light surface uses `#2b833f`.
- SNMIH on a dark surface uses `#9dd4a6`.
- Other themes retain the current inherited, subdued foreground treatment.

Surface selection is based on the background rendered behind the eyebrow rather than only the site's light/dark mode. This covers regular section backgrounds, explicit primary sections, and image-overlay hero treatments.

SNMIH's primary color is light in dark mode. Because neither requested green has sufficient contrast against that inverted primary surface, eyebrows on that combination will retain the section's semantic foreground color instead of forcing green.

The colors will be encoded only in the shared eyebrow primitive. They will not become CSS custom properties, Tailwind theme tokens, Payload fields, or editor-facing settings.

## Scope

Update section-level eyebrows across blocks and their shared presentation components. Eyebrow-like labels that communicate a different semantic role, such as card metadata, form labels, navigation, status text, or timeline step labels, remain unchanged.

## Verification

- Confirm SNMIH light surfaces render the dark green eyebrow.
- Confirm SNMIH dark and image-overlay surfaces render the pale green eyebrow.
- Confirm SNMIH's inverted primary surface in dark mode preserves readable semantic foreground color.
- Confirm all non-SNMIH themes retain their current eyebrow color.
- Confirm typography and spacing do not change.
- Run focused component tests, TypeScript validation, and visual checks on representative light, dark, primary, and image-overlay sections.
