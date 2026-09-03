# Shared Content Tab Rail Design

## Goal

Unify the Gallery Album Tabs and News & Events Tabs controls so both blocks expose the same three visual variants and render the same responsive tab rail. Individual tabs must size themselves from their labels while the outer rail spans the full block container.

## Admin configuration

Both blocks expose `Tab Variant` under `Theme Settings` with these values:

- `contained`
- `pill`
- `underline`

The saved default and runtime fallback are `underline`. Existing News & Events Tabs records without this field therefore adopt the same default as Gallery Album Tabs.

## Shared presentation contract

A shared tab-presentation module owns:

- the variant values and TypeScript type;
- runtime normalization;
- tab-list classes;
- active and inactive tab classes.

Gallery Album Tabs retains compatibility exports from its existing shared module where useful, while both blocks consume the same underlying presentation contract.

For every variant:

- the tab list has `min-width: 100%` and expands beyond the container only when its intrinsic content requires it;
- each tab has intrinsic width, never `flex: 1`, and uses consistent horizontal padding;
- labels remain on one line;
- narrow and zoomed layouts keep one row and allow horizontal scrolling instead of wrapping or compressing labels;
- focus navigation scrolls the newly focused tab into view.

Variant treatment:

- **Contained:** a full-width bordered rectangular rail with the active tab filled using the primary color.
- **Pill:** a full-width pill-shaped bordered rail with pill-shaped active state.
- **Underline:** a full-width bottom rule with an active underline beneath the selected label.

The full-width border/rule belongs to the rail, not to individual inactive tabs.

## News & Events integration

News & Events Tabs receives the same `tabVariant` field as Gallery Album Tabs. Its presentation normalizes the value and passes it to the client component. The current independently styled wrapping buttons are replaced by the shared rail and tab classes.

The change does not affect:

- configured classification labels or order;
- the mandatory first `All` tab;
- card-grid and editorial-list result variants;
- per-tab pagination and Load More behavior;
- entry fetching or classification filtering.

## Interaction and accessibility

Both blocks keep the ARIA tab pattern:

- `role="tablist"`, `role="tab"`, and `role="tabpanel"`;
- `aria-selected`, `aria-controls`, and `aria-labelledby` relationships;
- roving `tabIndex`;
- Arrow Left/Right, Home, and End keyboard controls.

Selecting by keyboard moves focus and scrolls the active tab into view. Pointer selection updates the active panel without changing data behavior.

## Responsive behavior

The outer viewport remains the block container width. When the intrinsic tabs fit, the rail still fills that width and unused space remains after the last tab. When the labels exceed it, the viewport scrolls horizontally. Tabs never divide the available width equally and never wrap into a second row.

## Verification

Tests will verify:

- both blocks expose the same three admin options and underline default;
- invalid or missing values normalize to underline;
- tab widths are intrinsic and the rail is full width;
- all variants render the same shared structure;
- News & Events retains tab switching, keyboard navigation, pagination, card-grid, and editorial-list behavior;
- Gallery Album Tabs retains album switching, Load More, and slideshow behavior;
- generated Payload types include the News & Events `tabVariant` field;
- focused tests, TypeScript, lint, formatting, and the project-context update/check loop pass.
