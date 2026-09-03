# Mobile Block Container Spacing Design

## Goal

Make the inside spacing of Feature Spotlight, FAQ, and Footer visually consistent on mobile while preserving their current desktop layouts.

## Shared mobile contract

- Horizontal content gutter: `16px` (`px-4`).
- Gap between page blocks: `16px` (`gap-4`).
- Regular block vertical padding:
  - Compact: `40px` (`py-10`).
  - Default: `48px` (`py-12`).
  - Comfortable: `64px` (`py-16`).
- Stacked Feature Spotlight media-to-content gap: `32px` (`gap-8`).
- Desktop spacing starts at `md` and remains unchanged.

## Component behavior

### Feature Spotlight

- Contained, contained-fill, edge-to-edge, and content-only layouts use the same size-based mobile outer vertical padding.
- Edge-to-edge media remains full-bleed horizontally, but no longer touches the top or bottom of the block on mobile.
- Contained-fill media remains within the website's `16px` mobile gutter.
- When media and content stack, they use a consistent `32px` gap.
- Existing two-column desktop height, content alignment, and media placement behavior remain unchanged.

### FAQ

- FAQ retains the shared size-based mobile padding and `16px` horizontal gutter.
- Accordion-row padding remains component-specific because it controls interaction density rather than block-container spacing.
- Existing desktop `py-32` spacing remains unchanged.

### Footer

- Footer uses the default `48px` mobile top and bottom padding.
- Existing desktop `py-32` spacing remains unchanged.
- Footer content continues to use the shared `16px` horizontal gutter.

## Implementation boundary

- Reuse shared spacing constants for mobile padding and container gutters.
- Do not change Payload fields or stored content.
- Do not change typography, colors, borders, media crop, or desktop layout.

## Verification

- Render every Feature Spotlight media-fill and media-placement combination at a mobile viewport.
- Assert `48px` default outer padding and `32px` stacked media/content gap.
- Assert FAQ and Footer default mobile padding is `48px`.
- Assert all content gutters resolve to `16px`.
- Confirm desktop computed spacing is unchanged.
