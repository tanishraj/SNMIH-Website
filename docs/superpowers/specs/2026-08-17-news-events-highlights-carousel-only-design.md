# News & Events Highlights Carousel-Only Design

## Goal

Make News & Events Highlights a collection-driven featured carousel with no Cards variant or manual entry curation. When a carousel entry has no usable featured image, render the supplied SNMIH default image.

## Admin contract

The Content tab keeps the optional section eyebrow, title, description, primary action, and footer actions. The Theme Settings tab contains Number of Items, Autoplay, Empty State Message, appearance, content alignment, and section padding.

Remove Layout and Featured Entries from the block schema. Existing documents may retain those historical keys in stored revisions, but rendering does not branch on them and the Admin no longer exposes them.

## Data flow

The server component normalizes Number of Items and loads entries with `getNewsEventsHighlights`. That existing collection query reads only fully published News & Events records, sorts non-event classifications by newest publication, sorts current or upcoming events by start date, and interleaves both groups without duplicates.

The block has no editor-authored record selector. Query failures continue to resolve to an empty item list so the configured empty state can render without breaking the Page.

## Presentation

News & Events Highlights always renders `NewsEventsFeaturedCarousel`. Its optional section header, actions, appearance, alignment, spacing, empty state, responsive horizontal/vertical rails, controls, autoplay pausing, and reduced-motion behavior remain unchanged.

The attached `SNMIH-Preview-image.png` becomes `/images/snmih-news-events-default.png`. The featured panel uses it when the current record has no normalized image. The fallback is decorative because the adjacent title already names the destination, so it uses empty alternative text. The normal dark overlay remains present over both authored and fallback images to preserve text contrast.

This fallback is scoped to the featured carousel. News Grid, News & Events Tabs, and detail pages are unchanged.

## Removal scope

- Remove the `cards`/`featuredCarousel` Layout field and layout branching.
- Remove the Featured Entries relationship array and manual-selection parsing/query helpers.
- Remove the cards-only `NewsEventsHighlights` component if it has no remaining consumers.
- Remove cards/manual-selection tests and update fixtures and maintained documentation.
- Preserve shared News & Events card types and automatic query helpers used by other blocks.

## Verification

- Schema tests prove the Content and Theme Settings field placement and absence of Layout/Featured Entries.
- Rendering tests prove the carousel is unconditional and works without a section heading.
- Client tests prove an authored image is used when present and the SNMIH default is used when absent.
- Data tests preserve the automatic mixed published-entry query and remove manual-selection coverage.
- Regenerate Payload types and run focused block/data, preview, thumbnail, theme, TypeScript, lint, and project-context checks.

## Constraints

- Do not modify News Grid or News & Events Tabs behavior.
- Do not add a database migration for obsolete block keys.
- Do not commit or stage changes.
