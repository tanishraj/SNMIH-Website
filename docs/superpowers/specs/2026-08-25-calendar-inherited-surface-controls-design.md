# Calendar Inherited Surface and Controls Design

**Date:** 2026-08-25
**Status:** Approved for implementation
**Scope:** Calendar block presentation and one Calendar-owned Payload setting

## Objective

Make the Calendar read as one coherent institutional ledger that belongs to its selected section surface. Remove the separate card-colored toolbar, month grid, Timeline, and Upcoming treatments; align framed Tabs and Select controls; center the month label precisely; reduce the visible navigation-hover footprint; and let editors choose how adjacent-month dates appear.

This is a focused refinement of the existing Calendar block. It does not change Calendar data loading, Event classification scope, month navigation, Upcoming behavior, responsive Timeline fallback, timezone handling, or public/draft access.

## Visual Direction

Use a unified inherited surface:

- The Calendar section appearance remains the only background owner.
- The toolbar, month grid, Timeline, Upcoming sidebar, error state, and empty state use transparent backgrounds and inherit the section foreground.
- Internal regions remain legible through surface-aware borders, supporting text, active controls, and focus rings.
- Light surfaces include None, Subtle, and Gradient Subtle.
- Brand surfaces include Brand and Gradient Brand.
- Classification colors remain accents for event rails, badges, dots, and event tinting; they never replace semantic text colors.

When the section background is None, the complete Calendar inherits the page background. Selecting another section background changes the entire Calendar composition together.

## Surface Contract

The presentation resolves the normalized section background and its light/brand surface once, then passes the background or surface contract to the interactive Calendar presentation.

For light surfaces:

- Primary text uses the inherited section foreground.
- Supporting text uses `text-muted-foreground`.
- Borders use the existing semantic border token.
- Active framed Tabs use Primary with Primary Foreground.
- Hover and focus treatments use Primary or Ring semantics.

For brand surfaces:

- Primary and supporting text use Primary Foreground, with supporting content allowed a controlled opacity.
- Borders use Primary Foreground with restrained opacity.
- Active framed Tabs invert to Primary Foreground with Primary text.
- Hover and focus treatments use Primary Foreground with restrained opacity.

Calendar panels must not force `bg-card`, `text-card-foreground`, `bg-muted`, or another unrelated inner surface merely to create separation. Event tinting may mix a classification color into a transparent or inherited surface as a local accent.

## Toolbar and Controls

### Month navigator

The month navigator uses a three-column grid:

1. Previous-month button
2. Flexible centered month label
3. Next-month button

The month label remains centered independently of surrounding toolbar width or arrow geometry. Each navigation button retains a 44 by 44 pixel accessible target. Its visible hover background is confined to a centered 32 by 32 pixel inner shape, avoiding the current oversized hover slab.

### Framed view Tabs

Calendar and Timeline use the shadcn Tabs primitive with a framed presentation:

- The Tabs list has a visible surface-aware border.
- The active Tab uses a filled semantic state rather than an underline.
- The underline pseudo-element is suppressed for this Calendar presentation only.
- The Tabs list and event-type Select are both exactly 44 pixels high.
- Tab labels use the standard sans-serif UI type and remain horizontally centered.
- Focus-visible styling remains distinct in light and brand surfaces.

The desktop view switch stays hidden on phones because phones remain Timeline-first. The filter Select stays available at every supported width.

### Event-type Select

The existing shadcn Select remains the filter control. Calendar-owned classes make its border, background, foreground, hover, and focus states follow the inherited light or brand surface without changing the global Select primitive.

## Calendar Body and Sidebar

The month grid, Timeline, and Upcoming sidebar share the same transparent inherited background. Borders define their geometry without making any region look like a different card surface.

- Weekday headers inherit the surface and use a subtle surface-aware separator/tint only when it does not create a distinct panel color.
- Month cells inherit the section background.
- Timeline date headings and event rows inherit the same background.
- Upcoming header, event rows, and legend inherit the same background.
- Empty and error states use the same surface contract.
- All internal non-section headings remain in the standard sans-serif family. Only the Calendar section-level title may use the display family.

## Adjacent-Month Date Setting

Add a required Calendar Theme Settings select named `adjacentMonthDates` with these options:

- `muted`: **Muted / Disabled**
- `hidden`: **Hidden**

The stored default is `muted`. Runtime also normalizes missing or unknown legacy values to `muted`, so no content migration is required.

### Muted / Disabled

- Show the adjacent-month date number with intentionally low emphasis.
- Do not show events in adjacent-month cells.
- Do not apply the current-day treatment.
- Do not add interactive behavior.
- Preserve the cell and six-week grid geometry.

### Hidden

- Keep the adjacent-month cell and borders so the six-week grid remains stable.
- Hide the visual date number and all event content.
- Exclude hidden content from the accessibility tree.

The setting affects only the desktop month grid. Timeline output already lists only events returned for the selected month and needs no adjacent-date presentation.

## Component Boundaries

- `config.ts` owns the new Payload select field.
- `Presentation.tsx` normalizes the setting and resolves the section surface.
- `CalendarClient.tsx` owns the unified toolbar composition and passes the adjacent-date setting to the month view.
- `CalendarMonthView.tsx` owns muted and hidden adjacent-cell rendering.
- `CalendarTimelineView.tsx` and `CalendarUpcoming.tsx` consume the inherited surface presentation.
- `calendarStyles.ts` owns Calendar-local surface-aware class resolvers for the toolbar, panels, Tabs, Select, navigation, and supporting text.

Shared shadcn primitives remain generic. Calendar-specific overrides must not alter Tabs, Select, Button, Badge, Empty, or Alert behavior elsewhere.

## Accessibility

- Month navigation keeps 44 by 44 pixel hit targets and explicit next/previous labels.
- Framed Tabs retain the Radix tablist/tab keyboard contract and selected-state semantics.
- Select retains its existing accessible name and keyboard behavior.
- Muted adjacent dates remain readable but non-interactive.
- Hidden adjacent dates are absent from the accessibility tree.
- Surface-aware focus states meet the existing light/dark theme contract.
- Reduced motion behavior is unchanged.

## Error and Loading Behavior

Month-loading, cache, retry, announcements, and focus-transfer behavior remain unchanged. The recoverable Alert inherits the Calendar surface while preserving destructive semantics and a visible Retry action. Pending navigation continues to disable both month buttons.

## Compatibility and Data

- Existing Calendar documents require no migration.
- Missing or invalid `adjacentMonthDates` values render as `muted`.
- Payload types are regenerated after the schema change.
- Production and live-preview rendering continue to share `CalendarBlockPresentation` and `CalendarClient`.
- Calendar API requests and snapshots do not change.

## Verification

Implementation is complete when:

1. Calendar schema tests cover the field options and `muted` default.
2. Runtime tests cover missing-value fallback, muted rendering, hidden rendering, no adjacent events, and no adjacent current-day treatment.
3. UI contracts cover framed Tabs, equal 44-pixel Tabs/Select height, compact arrow hover geometry, centered month layout, inherited surfaces, and the absence of Calendar-local underline styling.
4. Theme contracts cover light, subtle, brand, and gradient surface classes without hard-coded theme colors.
5. Browser checks confirm desktop and phone layouts in SNMIH light and dark modes.
6. The Calendar thumbnail is regenerated and inspected.
7. `pnpm generate:types`, affected Vitest tests, TypeScript, lint, project-context update, and project-context check pass.

## Out of Scope

- Changes to Calendar data queries, caching, timezone, classifications, Upcoming selection, or API behavior
- A new card-surface selector
- A separate Calendar background setting
- Changes to global shadcn component styling
- Content migration
- Commit or staging actions
