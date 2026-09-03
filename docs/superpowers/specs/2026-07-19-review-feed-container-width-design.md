# Review Feed Container Width Design

## Goal

Make the Review Feed use the complete shared website container width.

## Design

- Keep `regularBlockContainerClasses` as the outer layout constraint. This preserves the website-wide `max-w-screen-2xl` width, centered positioning, and standard horizontal padding.
- Remove the Review Feed's nested `max-w-3xl` constraint.
- Keep the existing content hierarchy, typography, spacing, theme behavior, review data, and pagination unchanged.
- Do not use viewport-width or edge-to-edge positioning; the block must remain aligned with the shared website container.

## Verification

- Confirm the Review Feed content width matches the shared website container on desktop.
- Confirm the block retains standard horizontal padding and has no overflow on mobile.
- Run the focused Review Feed component tests, lint, formatting, and diff checks.
