# Featured Profile Department Eyebrow Design

## Goal

Render the Department metadata on Profile Carousel Image Overlay cards using the existing semantic eyebrow accent color. In the SNMIH theme this produces the established green accent while preserving readable colors across light mode, dark mode, and selectable overlay tones.

## Design

- Keep Department above the profile name with its existing compact uppercase mono typography.
- Add the shared `data-section-eyebrow-surface` contract to the Department element.
- Derive the eyebrow surface from the already-resolved media overlay rather than hardcoding a green utility class.
- Preserve the current Name and Role / Designation colors, card layout, carousel behavior, editor settings, and Text Below Image presentation.

## Theme and Accessibility Contract

- Dark overlays use the theme's soft eyebrow accent; SNMIH renders this as green.
- Light overlays use the darker semantic eyebrow accent needed for contrast.
- Brand overlays and dark-mode inversions follow the existing global eyebrow surface rules.
- Other client themes continue to inherit their established foreground unless they define their own semantic eyebrow treatment.

## Verification

- Extend the Profile Carousel rendering contract to assert that overlay Department metadata exposes the resolved eyebrow surface.
- Verify focused Profile Carousel and Department Profiles tests.
- Run TypeScript, formatting, the UI detector, and the required project-context update/check loop.
