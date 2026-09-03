# Scrollable Tab Rail Edge Fades Design

**Date:** 2026-08-31
**Status:** Approved

## Goal

Make horizontal overflow discoverable on every website tab rail. A rail that has hidden tabs must
show a gradient at each edge where more content remains, update that affordance while the visitor
scrolls, and remove it when the edge is reached. The gradient must follow the rail's existing Pill,
Contained, or Underline geometry without changing tab dimensions or interaction.

## Scope

The shared behavior applies to the current horizontally scrollable tab rails in:

- Department Profiles
- News & Events Tabs
- Gallery Album Tabs
- Tabs Content
- Academic Programmes
- Fee Structure
- PG Fee Structure

Future horizontally scrollable content-tab rails should use the same shared primitive. Tabs that do
not overflow render exactly as they do today.

## Interaction Contract

| Rail state          | Start edge | End edge |
| ------------------- | ---------- | -------- |
| Content fits        | No fade    | No fade  |
| At the inline start | No fade    | Fade     |
| Between both ends   | Fade       | Fade     |
| At the inline end   | Fade       | No fade  |

The initial post-layout measurement must show the end-edge fade before visitor input when overflow
exists. Touch, trackpad, mouse-wheel, drag, and browser-driven focus scrolling remain native. The
fades are visual only, ignore pointer events, and expose no additional controls or accessibility
tree entries.

## Shared Component

Add `src/blocks/shared/ScrollableContentTabRail.tsx` as the client-side owner of overflow state. It
will receive the existing content-tab variant and surface plus caller-supplied frame, viewport, and
rail geometry classes. It renders three stable layers:

1. A stationary outer frame that owns the existing variant border, background, and radius.
2. A native horizontal scroll viewport that preserves the hidden-scrollbar and overscroll behavior.
3. The caller's semantic `role="tablist"` rail and tabs.

Moving the shared rail presentation classes to the stationary frame keeps the border and radius in
place while only tab content moves. Pill remains `rounded-full`, Contained retains
`rounded-control`, and Underline remains square with its bottom divider.

The viewport will use a CSS mask selected from its measured overflow state. Masking the moving tab
content reveals the frame's real background underneath, so the fade naturally matches light,
subtle, and brand surfaces without hard-coded colors. The outer frame clips the effect to its own
radius. A shared custom property will define one consistent fade width, narrow enough to preserve
the active tab label while still making hidden content obvious.

## Overflow State

The component keeps two derived booleans: content remains before the current position, and content
remains after it. A one-pixel tolerance prevents fractional browser measurements from leaving a
fade visible at an edge.

State is measured:

- after layout on initial hydration;
- from a passive viewport `scroll` listener;
- when `ResizeObserver` reports a viewport or tab-list size change; and
- from a window-resize fallback when `ResizeObserver` is unavailable.

If JavaScript or observation APIs are unavailable, the rail remains a normal native horizontal
scroller and simply omits the enhancement. Event listeners, observers, and fallback handlers are
removed on unmount.

## Consumer Integration

Each in-scope block will replace its local `overflow-x-auto` wrapper with the shared component while
keeping its existing tablist label, roles, IDs, active-state semantics, keyboard handlers, width
mode, and block-specific data attributes. Content Width, Centered Auto Width, and Equal Full Width
continue to control rail geometry. Equal-width rails that fit produce no fades.

This is a frontend presentation change only. It adds no Payload fields, changes no saved CMS data,
and requires no generated Payload types or migration.

## Accessibility and Motion

- Gradient layers are decorative, `aria-hidden`, and `pointer-events-none`.
- The native scroll viewport remains keyboard- and touch-scrollable.
- Existing roving tab focus, Arrow key, Home, End, and tab-panel relationships remain unchanged.
- The state change is immediate; no required motion or continuous animation is introduced.
- Focus outlines remain above the fade and are not hidden at the viewport edges.

## Verification

Focused tests will cover:

- no fade when `scrollWidth` does not exceed `clientWidth`;
- end-only fade at the initial position;
- both fades in the middle;
- start-only fade at the final position;
- resize/content remeasurement and the no-`ResizeObserver` fallback;
- passive scrolling and observer/listener cleanup;
- preserved semantic tab markup and existing keyboard behavior; and
- integration of all seven current horizontal tab consumers.

Visual verification will check representative Pill, Contained, and Underline rails on desktop and
mobile widths, including light and brand surfaces. The final repository checks are the affected
integration tests, TypeScript, lint, `project-context:update`, and `project-context:check`.

## Documentation Impact

Update the shared tab presentation and Department Profiles tab-rail notes in
`.agents/skills/project-context/references/block-system.md` to describe the adaptive overflow
affordance. No architecture, operator, or CMS authoring contract changes are required.
