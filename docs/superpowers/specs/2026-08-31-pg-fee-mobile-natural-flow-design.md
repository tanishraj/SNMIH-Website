# PG Fee Structure Mobile Natural Flow Design

## Goal

Ensure that a PG Fee Structure category with many department statements remains fully visible in the normal page flow on mobile and tablet viewports. Visitors should scroll the page itself rather than a nested department panel.

## Scope

This change applies only to the vertical list of department fee statements inside the selected PG Fee Structure category. It does not change the General/NRI-style fee-category tab rail or any authored CMS data.

## Responsive behavior

- Below the `lg` breakpoint, the atlas and department list use natural height. The department list has no internal vertical overflow, height cap, or overscroll containment.
- At the `lg` breakpoint and above, categories with more than four departments keep the existing 676px bounded atlas. The summary and department statement areas may scroll internally.
- Categories with four or fewer departments keep natural height at every breakpoint.
- Every department statement, fee value, and note remains rendered in source order at every viewport size.

## Implementation

Keep the existing `PGFeeStructureAtlasPresentation` component and its desktop breakpoint styling. Make the mobile-first contract explicit in its classes so visual scroll-region behavior is applied only when the desktop bounded layout is active. Avoid viewport-detection JavaScript and preserve server/client rendering behavior.

Because HTML attributes cannot be toggled at a CSS media query, the department list will retain its stable region role, descriptive label, and keyboard focusability. These attributes do not constrain height or intercept page scrolling; only the `lg` layout creates a nested scroll area.

## Accessibility

- Mobile visitors encounter all statements in normal document flow and use normal page scrolling without a scroll trap.
- Desktop visitors can keyboard-focus the bounded scroll region when it exists.
- Department headings continue to label their corresponding statement articles.
- Tabs retain their existing Radix keyboard and ARIA behavior.

## Verification

- Extend the PG Fee Structure integration test to assert mobile-first natural-flow classes and desktop-only height/overflow classes.
- Confirm five or more department statements remain present in the DOM, including the final statement and note.
- Browser-check a compact viewport to confirm the page grows with the complete department list and no nested vertical scroll area is active.
- Browser-check a desktop viewport to confirm the bounded internal scroll remains available.
- Run the focused PG Fee Structure tests, TypeScript, lint, and the project-context update/check loop.

## Non-goals

- Changing fee-category tabs, tab styling, or horizontal tab behavior.
- Changing PG Fee Structure schema, normalization, or stored data.
- Removing the bounded desktop presentation.
