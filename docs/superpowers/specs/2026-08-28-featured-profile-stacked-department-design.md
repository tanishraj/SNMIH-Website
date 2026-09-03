# Featured Profile Stacked Department Design

## Goal

Make Department metadata on Featured Profile Text Below Image cards visually match the regular Department Profiles treatment shown in the approved reference.

## Presentation Contract

- Preserve the stacked card order: Name, Role / Designation, then Department.
- Render Department as compact uppercase mono eyebrow metadata rather than muted body copy.
- Use the shared semantic eyebrow surface contract so the SNMIH theme supplies its green accent without hardcoded color utilities.
- Resolve explicit card surfaces from the selected card background and default cards from the containing section background.
- Preserve the current card image, sizing, spacing, surface, carousel behavior, and editor configuration.
- Keep Image Overlay cards unchanged; their Department remains above Name and already uses the overlay eyebrow surface.

## Theme and Accessibility Contract

- Light SNMIH surfaces use the established deep-green eyebrow accent.
- Dark SNMIH surfaces use the established soft-green eyebrow accent.
- Primary/brand surfaces follow the existing mode-aware eyebrow foreground rules.
- Themes without an eyebrow override inherit the resolved card foreground.
- Department remains textual metadata, so color is not its only distinguishing cue.

## Verification

- Extend the stacked Profile Carousel rendering test to assert Name → Role → Department order, uppercase mono typography, and the resolved semantic eyebrow surface.
- Preserve existing Image Overlay assertions.
- Run the focused Profile Carousel and Department Profiles suites, TypeScript, lint, formatting, UI detection, and the required project-context update/check loop.
