# Regular Block Responsive Spacing Design

## Goal

Give every regular website content block the same outer top and bottom padding across mobile and desktop, regardless of whether its Payload Size setting is Compact, Default, or Comfortable.

## Shared spacing contract

All regular content blocks use:

- Mobile: `py-12`
- Medium screens and larger: `md:py-16`

The shared `regularBlockMobilePaddingClasses` map remains available to existing components, but all three size keys resolve to the same `py-12 md:py-16` value. This minimizes component churn while making the outer spacing contract explicit and centralized.

Payload Size settings remain available. They may continue controlling internal card dimensions, media heights, panel padding, or gaps, but they must not change a block's outer vertical padding.

## Regular blocks covered

The shared contract applies to:

- Content Highlights
- Feature Matrix
- Gallery Showcase
- Image Mosaic
- News & Events archive
- News & Events Highlights
- Profile Carousel
- Q&A Accordion
- Rating Spotlight
- Review Feed
- Review Submission
- regular Feature Spotlight layouts
- Footer

Any other regular block already consuming `regularBlockMobilePaddingClasses` inherits the same behavior automatically.

## Override removal

Remove responsive outer-padding overrides that currently make these sections taller than other blocks:

- Q&A Accordion: remove `md:py-32`.
- Review Submission: remove its size-dependent `md:py-20`, `md:py-24`, and `md:py-28` outer padding map.
- Footer: remove `md:py-32`.
- Regular Feature Spotlight: stop combining the shared padding map with a second size-dependent desktop padding class.

## Intentional structural exceptions

The following are not regular content blocks and retain their specialized spacing:

- Announcement
- Header navigation
- Hero Banner
- Stats Strip
- full-height system pages

Feature Spotlight `edgeToEdge` and `containedFill` media modes retain zero desktop outer padding so their media remains full-height. Their content column uses `md:py-16` for the same visual inset as regular blocks. On mobile, these modes use the shared `py-12` outer padding.

## Responsive and theme behavior

The normalization changes spacing only. Existing theme appearance, borders, background colors, media placement, content alignment, and responsive layouts remain unchanged.

## Verification

Focused integration tests must verify:

- Compact, Default, and Comfortable resolve to `py-12 md:py-16`.
- Gallery Showcase, Profile Carousel, Content Highlights, Image Mosaic, News & Events Highlights, and Review Feed render the shared padding.
- Q&A Accordion, Review Submission, and Footer no longer render their oversized desktop overrides.
- Regular Feature Spotlight uses the shared padding without duplicate desktop size padding.
- Filled Feature Spotlight modes retain `md:py-0`, while their content column uses `md:py-16`.

Targeted ESLint, TypeScript, focused Vitest coverage, the production build, and `git diff --check` must pass.
