# Calendar Full-Height Sidebar Design

## Goal

Make Upcoming and the optional PDF download feel like one calendar sidebar. On desktop, the rail must match the height of the adjacent Calendar or Annual Calendar content and keep the PDF action at its bottom edge.

## Shared Composition

Calendar and Annual Calendar use one shared sidebar composition with this source and reading order:

1. Upcoming heading and event list.
2. Optional classification legend.
3. Optional PDF document identity and download action.

The sidebar owns one semantic outer border and background. Upcoming and PDF no longer appear as independent bordered cards inside it. A semantic divider separates the PDF region from the content above.

## Desktop Behavior

At the existing large-screen two-column breakpoint:

- the grid stretches the sidebar to the full height of the adjacent month/timeline or year-stream area;
- the sidebar is a full-height flex column;
- Upcoming remains at the top;
- the PDF region uses automatic top margin so it stays at the bottom even when Upcoming contains fewer events;
- Annual Calendar removes its previous sticky rail behavior because a sidebar cannot both match the full year-stream height and remain a shorter sticky element; the approved full-height, bottom-anchored composition takes precedence;
- when no PDF resolves, Upcoming remains at the top and the rail still fills the available height without an empty divider or action region.

## Mobile and Tablet Behavior

Below the large-screen breakpoint, the sidebar returns to natural document height beneath the calendar content. Upcoming is followed directly by the optional PDF region. No artificial empty vertical space or sticky positioning is introduced on compact layouts.

## Theme and Visual Contract

- The outer sidebar uses `resolveCalendarSurfaceClasses(surface).panel`.
- Internal borders and dividers use the existing light/brand semantic border tokens.
- Upcoming retains its current typography, event rows, empty state, and optional classification legend.
- The PDF region retains the file icon, wrapping text-family document label, and full-width semantic Button.
- Nested borders and nested radii are removed so the result reads as one rail rather than stacked cards.
- Light, subtle, gradient, and brand surfaces keep their current foreground and focus treatment.

## Component Boundaries

A shared `CalendarSidebar` component owns the outer semantic panel, full-height flex behavior, responsive placement, and bottom-pinned PDF region. It accepts Upcoming content as children and an optional resolved PDF value.

`CalendarUpcoming` gains an embedded presentation mode that removes only its outer panel border and radius. Its internal header, row, legend, divider, accessibility, and data selectors remain unchanged.

`CalendarPdfDownload` gains an embedded presentation mode that removes only its outer panel border and radius and adds the semantic top divider. Its standalone default remains available for compatibility and focused testing.

Calendar and Annual Calendar replace their local sidebar wrappers with the shared component. Event queries, snapshot data, filtering, caching, and PDF resolution remain unchanged.

## Accessibility and Edge Cases

- The sidebar remains an `aside` landmark with an accessible label derived from the visible Upcoming title.
- Nested `aside` landmarks are avoided when Upcoming is embedded.
- DOM order matches visual and keyboard order on every viewport.
- A missing PDF does not render an empty bottom region or divider.
- Long document labels wrap without moving or shrinking the download button.
- Empty Upcoming content and a present PDF still place the download at the desktop bottom.

## Verification

Focused tests cover:

- one outer sidebar panel with embedded Upcoming and PDF regions;
- desktop stretch and bottom-pinning classes;
- natural compact-layout flow;
- Calendar and Annual Calendar use of the shared sidebar;
- missing-PDF behavior;
- semantic light and brand surfaces;
- preserved Upcoming selectors, legend, event links, and accessible sidebar label.

Verification includes focused Vitest suites, TypeScript, lint, the layout detector, regenerated Calendar thumbnails, bounded visual inspection, and the required project-context update/check loop.
