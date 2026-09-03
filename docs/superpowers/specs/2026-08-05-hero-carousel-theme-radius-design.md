# Hero Carousel Theme Radius Design

## Goal

Make every Hero Carousel control follow the active website theme's corner radius and slightly strengthen the slide title weight.

## Design

The shared shadcn `Button` component already uses `rounded-md`, which resolves through the theme-backed `--radius-md` token. Hero Carousel must not override that contract with `rounded-full`.

- Slide CTA buttons inherit the shared `Button` radius.
- Previous and next icon buttons inherit the shared `Button` radius.
- Pagination controls use `rounded-md` so their shape follows the same active theme token.
- Slide titles use `font-semibold`.
- Button variants, sizes, colors, carousel behavior, content alignment, and CMS fields remain unchanged.

No new Payload field or migration is required because radius remains a global theme concern.

## Data Flow

The frontend layout continues to apply the selected website theme to the document root. Theme CSS defines `--radius`, Tailwind derives `--radius-md`, and Hero Carousel controls consume that shared radius through `rounded-md`.

## Error Handling and Compatibility

Existing documents need no fallback or data transformation. If a theme does not provide a custom radius, the existing default theme radius applies. Pagination controls remain fully accessible buttons with their current labels and selected-state behavior.

## Verification

- Render the Hero Carousel and verify CTA, arrow, and pagination controls do not force `rounded-full`.
- Verify pagination controls use `rounded-md`.
- Verify slide titles include `font-semibold`.
- Run the focused Hero Carousel integration tests, TypeScript, ESLint for the touched component, and `git diff --check`.
