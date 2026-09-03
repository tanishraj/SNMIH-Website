# Fee Structure Centered Auto Tabs Design

## Purpose

Add a third configurable category-tab width mode to Fee Structure so an intrinsic-width tab group can sit in the horizontal center when it fits while remaining safely accessible through horizontal scrolling when it does not.

This addition must preserve the current Content Width and Equal Full Width modes, every category-tab visual style, Radix accessibility behavior, the table and Programme Cost Atlas layouts, and all current user-authored Fee Structure presentation changes.

## Editor Contract

Extend the existing required **Category Tab Width** select with:

- `content`: **Content Width**; existing saved default and runtime fallback;
- `centered`: **Centered Auto Width**; new option;
- `equal`: **Equal Full Width**; existing option.

The control remains visible only when the block has multiple fee categories. Missing, invalid, and historical values continue to resolve to `content`, so no content migration is required.

Update the field description to explain that Centered Auto Width keeps intrinsic tab widths and centers the group when space allows, while Equal Full Width divides the complete rail evenly.

## Rendering Contract

Keep the implementation local to `FeeStructureClient`; do not alter the shared content-tab variants or the tab behavior of Gallery Album Tabs and News & Events Tabs.

Resolve `tabWidth` to the three-value `FeeStructureTabWidth` union. Apply these list geometries:

- Content Width: `w-max min-w-full`; preserves the current full rail with content-sized triggers aligned from the inline start.
- Centered Auto Width: `mx-auto w-max`; shrink-wraps the visual rail around its content and centers it when it fits.
- Equal Full Width: `w-full min-w-0`; preserves the current full-width equal distribution.

Only Equal Full Width applies `w-0 min-w-0 flex-1 shrink overflow-hidden px-2 text-ellipsis` to triggers. Content Width and Centered Auto Width keep the shared intrinsic trigger geometry, including `shrink-0`, `min-h-11`, and whitespace protection.

Keep the existing `overflow-x-auto pb-1` wrapper. When a centered intrinsic rail is wider than its container, CSS auto margins resolve without reserving centering space, so the group begins at the inline start and the wrapper provides horizontal scrolling. No tab is clipped, wrapped onto a second line, squeezed, or converted to equal width.

The list continues to expose `data-fee-tab-width` with the resolved value for tests and diagnostics.

## Responsive and Accessibility Behaviour

The same contract applies to the table and Programme Cost Atlas layouts at every viewport:

- Mobile: when short labels fit, the group remains centered; long or numerous labels start at the inline edge and scroll horizontally.
- Tablet: the group re-centers automatically as soon as available width can contain its intrinsic width.
- Desktop and wider: the group remains shrink-wrapped and centered without stretching the outer rail.
- Text zoom and browser zoom: triggers retain the shared 44px minimum target height, labels remain on one line, and overflow becomes scrollable instead of clipped.
- Long localized category names: each trigger retains its authored label and intrinsic width; no ellipsis is introduced in Centered Auto Width.
- Keyboard and assistive technology: DOM order, Radix arrow-key navigation, focus visibility, tab/tabpanel relationships, active-state styling, and accessible labels remain unchanged.
- Single-category blocks: no tablist is rendered, so the option has no visual effect.

Contained, Pill, and Underline variants all use the same centered geometry. Their semantic borders, backgrounds, active colors, hover states, and focus rings remain unchanged.

## Compatibility and Preservation

Do not couple the new option to Section Content Alignment. It is a self-contained Category Tab Width choice and does not move the section heading, fee content, Atlas halves, programme details, totals, expense, or download.

Do not modify `ProgrammeCostAtlasPresentation.tsx`. Preserve the user’s current staged version byte-for-byte. Do not overwrite, unstage, or commit any existing user changes.

The separately approved Additional Programme Details default remains independent: new blocks initialize an editable `Programme Duration` / `4.5 Years` row, while existing saved blocks are not backfilled and runtime does not invent a value.

## Verification

Cover the following in the focused Fee Structure integration suite:

- schema options contain Content Width, Centered Auto Width, and Equal Full Width in that order;
- generated types accept `centered`;
- missing and unknown runtime values still resolve to `content`;
- Centered Auto Width exposes `data-fee-tab-width="centered"`, applies `mx-auto w-max`, and omits `min-w-full`, `w-full`, and equal-trigger classes;
- Equal Full Width retains its current full-width and equal-trigger behavior;
- every category label remains present and Radix category switching still works;
- the overflow wrapper retains `overflow-x-auto` and `pb-1`.

Perform one bounded responsive browser pass using representative short and long category labels at approximately 375px, 768px, and 1440px, plus 200% zoom. Confirm centered fit, inline-start overflow, horizontal scrolling, visible focus, unchanged active styling, and no clipping or wrapping. Run Payload type generation, focused and neighboring block tests, TypeScript, lint, the layout detector, and the required project-context update/check loop.

Do not regenerate the Fee Structure thumbnail unless the deterministic fixture is intentionally changed to exercise Centered Auto Width. The implementation does not require changing that fixture.
