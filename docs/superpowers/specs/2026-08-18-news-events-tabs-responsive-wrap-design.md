# News & Events Tabs Responsive Wrap Design

## Goal

Keep every configured News & Events tab visible on narrow screens by allowing the tab pills to wrap onto additional rows instead of requiring horizontal scrolling.

## Layout behavior

The tab list will use content-driven flex wrapping at every viewport width. When all pills fit, they remain on one row. When the available width is insufficient, complete pills move to the next row in their configured order with the existing gap between them.

The outer tab-list wrapper will no longer create a horizontal scrolling region, and the inner tab list will no longer force a minimum width equal to the combined pill widths. Individual pills remain intact; this change wraps the list of pills rather than breaking ordinary labels across lines.

## Preserved behavior

- All remains the first tab.
- Editor-defined tab labels and ordering remain unchanged.
- Active, inactive, hover, and focus styles remain unchanged.
- Arrow, Home, and End keyboard navigation continues to follow DOM order across wrapped rows.
- Tab selection, panels, empty states, card layout, typography, section configuration, and data loading remain unchanged.

## Accessibility

The existing `tablist`, `tab`, and `tabpanel` roles and ARIA relationships remain unchanged. Wrapping is visual only and does not create separate tab groups or alter focus order.

## Verification

- Add a rendering contract requiring `flex-wrap` on the tab list.
- Assert that the wrapper no longer uses horizontal overflow and the tab list no longer uses `min-w-max`.
- Preserve the existing configured-order, selection, and keyboard-navigation tests.
- Regenerate and inspect the News & Events Tabs block thumbnail.
- Run focused tab tests, adjacent block contracts, TypeScript, lint, and the project-context update/check loop.

## Constraints

- Do not add JavaScript viewport measurement or breakpoint-specific tab logic.
- Do not change the Payload schema, tab configuration, or card components.
- Do not stage or commit changes.
