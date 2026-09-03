# Q&A Accordion Split Action Alignment Design

## Goal

In the Q&A Accordion Split layout, place section-level actions such as “See All” at the bottom edge of the section-content column so they align with the end of the adjacent Q&A column.

## Layout Contract

- The behavior applies only to Split layout at the large-screen breakpoint and above.
- The section-content column stretches to the height of the Q&A column.
- Section heading, description, profile, and contact content remain one content group.
- The existing Top, Center, and Bottom control continues to align that content group within the space available above the section action.
- Section-level actions render in a separate action region anchored to the bottom with flexible space.
- The action remains in normal document flow. It must not use absolute positioning or fixed heights, so long content can expand the complete grid row without overlap.
- Stacked layout and compact breakpoints retain their existing natural content order and spacing.
- Contact Prompt actions remain part of the supporting contact content and are not moved to the section-action region.

## Rendering Approach

The component will keep a single semantic section-content column and conditionally separate the existing header `ContentActions` from the introduction in Split layout. On large screens, the column becomes a full-height flex container. The content group receives the selected vertical alignment within a flexible region, and the section-action region follows at the bottom.

For Stacked layout, the section actions remain inside the introduction exactly as they render today. This avoids changing established spacing or reading order outside Split layout.

## Responsive and Accessibility Behavior

- DOM order remains heading, description, supporting content, then section actions, followed by the Q&A column.
- Mobile and tablet preserve the same linear reading and keyboard order.
- No duplicate action links are rendered at any breakpoint.
- Existing action labels, variants, focus behavior, and theme-aware colors remain unchanged.

## Verification

- Add a focused render contract proving Split layout applies the full-height column and bottom action region.
- Prove Split layout renders the header action once and after the supporting content.
- Prove Stacked layout retains its existing action placement and does not receive Split-only alignment classes.
- Run the focused Q&A Accordion tests, TypeScript, ESLint, the layout detector, and the project-context update/check loop.

## Out of Scope

- Payload schema or Admin-control changes.
- Content migrations.
- Changes to footer actions or Contact Prompt actions.
- Fixed heights, absolute positioning, or changes to the Q&A column.
