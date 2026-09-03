# News & Events Highlights Exact Card Rail Design

## Goal

Make the three visible supporting cards fill the complete height of the News & Events Highlights featured carousel while keeping every card visually consistent and preventing variable content length from changing its height. Align News & Events card typography across the Highlights rail and tabbed directory.

## Exact rail geometry

At widths of 768px and above, the existing featured panel and vertical supporting rail continue to share a fixed `36rem` height. The vertical carousel will neutralize the shadcn carousel primitive's implicit vertical offset and item padding, then apply an explicit `1rem` gap between cards.

Each vertical slide will use `calc((100% - 2rem) / 3)` as its basis. Three equal card slots plus the two `1rem` gaps therefore occupy the complete `36rem` rail height without leaving unused space or extending beyond the featured panel.

The slide button and card will fill their complete slot height. Card overflow will be hidden so content cannot alter the fixed geometry. The card outline will use an inset ring so the first and last visible outlines remain inside the carousel viewport instead of being clipped at its overflow boundary.

## Card content contract

Every supporting card uses the same internal spacing:

- `1.25rem` horizontal padding;
- `1.25rem` top padding;
- `0.75rem` between the title area and description; and
- `1.25rem` bottom padding.

The classification and date remain on the metadata row. The title uses the theme-scale `text-xl` token (20px), remains semibold, and is clamped to one line. The description keeps the existing theme-scale `text-base` token (16px), normal weight, and two-line clamp. The metadata, title, and description render as one vertically centered content group inside each fixed-height card. Existing font families, badge variants, date formatting, active outline color, and muted hover treatment remain unchanged.

If an entry has no excerpt, the card keeps the same outer height; no placeholder text is added.

## Responsive behavior

Below 768px, the existing horizontal supporting-card carousel remains below the featured story. It receives the same one-line title, two-line description, consistent padding, and overflow protection, but retains its existing responsive slide widths and natural card height.

No runtime measurement, ResizeObserver synchronization, or viewport-specific JavaScript will be added.

## Tabbed card typography

News & Events Tabs cards use the same theme-scale `text-xl` title token with semibold weight and retain the existing `text-base` normal-weight description. Their existing larger-card content limits remain unchanged: titles clamp to three lines and descriptions clamp to four lines. Their existing layout, minimum height, metadata, footer action, spacing, and theme surfaces remain unchanged; vertical centering applies only to the fixed-height Highlights rail cards.

## Preserved behavior and scope

- Collection-driven entries, ordering, configured item count, autoplay, hover/focus pausing, reduced-motion handling, selection synchronization, and manual controls remain unchanged.
- Authored featured images and the bundled SNMIH fallback image remain unchanged.
- Section appearance, actions, footer actions, and outer block spacing remain unchanged.
- News Grid, Payload schemas, and generated Payload types are outside this change. News & Events Tabs changes are limited to card title and description typography.

## Verification

- Add a rendering contract for the explicit vertical gap, exact three-slot calculation, full-height buttons/cards, inset outlines, vertically centered content, one-line `text-xl` semibold titles, unchanged `text-base` normal descriptions, and consistent padding.
- Add a tabbed-card rendering contract for `text-xl` semibold titles and unchanged `text-base` normal descriptions while preserving the existing three-line and four-line clamps.
- Preserve existing interaction, autoplay, reduced-motion, image-fallback, and classification tests.
- Inspect the production block thumbnail to confirm that three complete supporting cards align with the top and bottom of the featured panel.
- Run focused carousel and Highlights tests, adjacent block contracts, TypeScript, lint, and the project-context update/check loop.

## Constraints

- Do not modify the shared carousel primitive; scope the spacing correction to News & Events Highlights.
- Do not stage or commit changes.
