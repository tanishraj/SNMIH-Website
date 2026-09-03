# PG Fee Atlas Department Scroll Design

## Purpose

Keep large PG Fee Structure datasets compact without hiding departments or making the complete Page
excessively long.

## Trigger

- Four or fewer departments preserve the current natural-height atlas.
- Five or more departments activate the bounded desktop treatment.
- The trigger depends only on the active category's normalized department count.

## Desktop Layout

At the `lg` breakpoint and above, an active category with five or more departments uses one fixed
`676px`-high atlas frame.

- The Primary summary occupies the complete left side and does not move with the department list.
- The statement header remains visible at the top of the right side.
- Only the department chapter list uses `overflow-y: auto`.
- The scrollbar remains visible and uses the browser/theme-native appearance.
- Scroll chaining is contained inside the chapter list while the pointer is over it.
- The chapter scroller receives an accessible label and visible inset focus treatment.
- If unusually long shared charges or notes exceed the left column's available height, the summary
  may scroll independently rather than clipping content. It still remains independent from the
  department list.

## Compact Layout

Below `lg`, the fixed height and nested scrolling are removed. The summary, statement header, and all
department chapters remain in normal document flow, preserving the current mobile reading order.

## Category Switching

The threshold is evaluated for each active category. Switching tabs can therefore move between a
natural-height category and a 676px bounded category without changing saved content or tab behavior.

## Accessibility and Edge Cases

- No department is omitted, collapsed, paginated, or truncated.
- Department notes and wrapped fee labels remain part of each chapter's measured content.
- The statement header stays outside the scroll viewport, so category context is always visible.
- Keyboard focus, wheel, trackpad, touchpad, and pointer scrolling work within the chapter list.
- At zoom levels that collapse the layout below `lg`, the block returns to natural page flow.
- The Payload schema, normalized data, category limit, authored amounts, and Fee Structure block remain
  unchanged.

## Verification

Focused tests must cover:

- four departments without a bounded-scroll contract;
- five departments with the 676px desktop frame;
- the fixed statement header and scrollable chapter-list separation;
- accessible scroller labeling and focus classes;
- mobile natural-flow classes;
- category tabs switching between natural and bounded categories;
- unchanged department content, amounts, notes, and shared charges.

The maintained block guide and project context must describe the five-department threshold and the
desktop-only 676px behavior.
