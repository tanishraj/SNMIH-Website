# News & Events Tabs Editorial List Variant

## Goal

Extend the existing News & Events Tabs block with an editorial list presentation while preserving its current card grid, automatic collection data, configurable tabs, and incremental Load More behavior.

## Admin Configuration

Add a required `layoutStyle` select under **Theme Settings**:

- **Card Grid** (`cardGrid`) — default and legacy fallback.
- **Editorial List** (`editorialList`).

Move the existing `cardsPerRow` field from **Content** to **Theme Settings** without renaming it or changing its stored values. Show Cards Per Row only when Card Grid is selected. Existing documents therefore retain their saved column count.

No other Content or Theme Settings fields change ownership or behavior.

## Shared Data and Interaction Model

Both layouts use the existing `NewsEventsTabsClient` state and data flow:

- All remains the mandatory first tab.
- Editors retain control over classification tabs, labels, and order.
- The server renders the first page for every configured classification.
- Load More requests the next page from `/api/news-events-tabs` and appends unique records.
- Loading, retry, empty-state, active-tab, keyboard-navigation, and per-tab progress behavior remain unchanged.

The layout choice changes only how `activeItems` render. Card Grid continues to use `NewsEventsTabsCard`. Editorial List uses a dedicated `NewsEventsTabsRow` component.

## Editorial List Layout

Each item is one semantic anchor linking to the existing detail-page URL. The full row is clickable and keyboard-focusable. The arrow is decorative and uses the existing `ActionArrow` plus `group/button` interaction contract, matching the swap/slide motion used by Content Link.

At large screen sizes, each row uses four columns:

1. **Date:** calendar icon and formatted date only.
2. **Classification and title:** classification badge stacked above a semibold, theme-scale `text-xl` title with compact line height.
3. **Description:** normal-weight, theme-scale `text-base`, muted foreground.
4. **Arrow:** vertically centered at the trailing edge.

The badge/title group and description align to the top of the row. The date and arrow are vertically centered. Desktop uses one explicit, equal horizontal gutter between every column. The title and description tracks use equal `minmax(0, 1fr)` widths. The date retains its compact `minmax(9rem, 0.8fr)` track, while the right-aligned arrow receives a wider `minmax(6rem, 0.35fr)` trailing track. Mobile vertical spacing remains a separate value. Rows use semantic theme tokens, divider borders, no card shadow, and no independent card surface. Hover and focus use a restrained token-based surface treatment. The visible ordering and DOM ordering remain identical.

Event rows use the existing formatted event date range. Non-event rows use their existing display date. Titles and descriptions use bounded line clamps for scanability while rows retain natural height.

## Responsive Layout

Below the large-screen breakpoint, each row stacks in this order:

1. Date metadata.
2. Classification badge and title.
3. Description, when present.
4. Arrow aligned to the bottom-right.

The stacked row remains one link with a usable touch target. No horizontal scrolling is introduced. The existing classification tab pills continue wrapping at narrow widths.

## Compatibility and Edge Cases

- Missing or invalid `layoutStyle` values render Card Grid.
- Cards Per Row has no visual effect in Editorial List but its saved value is preserved.
- Missing descriptions omit the description element without placeholder text.
- Missing dates omit the date element without affecting the classification badge/title column.
- The row arrow is hidden from assistive technology because the linked row’s visible text supplies its accessible name.
- Existing action-label fields remain available for Card Grid and have no visual effect in Editorial List.
- Existing section content, appearance, spacing, header actions, footer actions, empty state, and Load More label apply to both variants.

## Preview and Block Contracts

Production rendering, live preview, and thumbnail fixtures pass `layoutStyle` through the existing shared presentation path. The block remains registered under the existing `newsEventsTabs` slug in Pages and Reusable Sections. No new block, API route, query, collection field, or dependency is introduced.

## Testing and Generated Artifacts

Tests must cover:

- Layout field options, required Card Grid default, and Cards Per Row admin condition.
- Layout normalization and invalid/missing fallback.
- Existing Card Grid markup and column behavior.
- Editorial List desktop grid, equal title/description tracks, wider arrow track, one equal horizontal gutter, vertically centered date/arrow, top-aligned badge-title/description content, stacked responsive order, line clamps, full-row URL, accessible arrow treatment, and ActionArrow interaction classes.
- Event date-range formatting and missing optional content.
- Load More appending Editorial List rows without changing request or retry behavior.
- Shared production/live-preview presentation propagation.
- Page/Reusable registration, thumbnail fixture, theme-tab, generated Payload type, and project-context contracts.

After implementation, regenerate Payload types and run the affected tests, TypeScript, lint, formatting, diff validation, and the required project-context update/check loop.
