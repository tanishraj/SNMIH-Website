# News & Events Carousel Controls Position

## Goal

Allow editors to place the News & Events Highlights carousel status and previous/next controls above or below the carousel. Existing blocks must retain their current bottom placement.

## Admin Configuration

Add a required `carouselControlsPosition` select field under the block's **Theme Settings** tab.

- **Bottom** (`bottom`) — default and legacy fallback.
- **Top** (`top`).

The setting affects only the row containing the current-item status and previous/next buttons. It does not move the section heading, actions, featured panel, supporting rail, or footer actions.

## Rendering

Pass the setting through `NewsEventsHighlightsBlockPresentation` and `NewsEventsFeaturedCarousel` to `NewsEventsFeaturedCarouselClient`.

Extract the existing status/navigation markup into one internal controls-row unit. Render that unit once:

- before the featured-panel and supporting-rail layout when the setting is `top`;
- after the mobile supporting rail when the setting is `bottom`.

The top and bottom variants retain the same typography, divider, spacing, button behavior, accessibility labels, live status announcement, autoplay interaction, and responsive behavior. Missing or invalid values normalize to `bottom`.

## Compatibility and Preview

- Existing saved blocks without the new field render controls at the bottom.
- Production, live preview, and block thumbnail presentation receive the same field through the existing shared presentation path.
- No News & Events queries, carousel timing, item selection, image treatment, or content schema behavior changes.

## Testing and Generated Artifacts

- Extend the block schema test to verify the field, options, requirement, and bottom default.
- Extend carousel rendering tests to verify one controls row appears in the requested top or bottom position and invalid values fall back to bottom.
- Regenerate Payload types after the schema change.
- Run the focused Highlights/carousel tests, TypeScript, lint, formatting, diff validation, and the required project-context update/check loop.
