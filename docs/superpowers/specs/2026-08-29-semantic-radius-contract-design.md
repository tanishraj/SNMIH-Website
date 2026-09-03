# Semantic Radius Contract Design

**Date:** 2026-08-29
**Status:** Approved design; awaiting implementation-plan approval

## Problem

The public frontend currently mixes theme-derived radii with fixed Tailwind utilities such as `rounded-sm`, `rounded-lg`, `rounded-xl`, and `rounded-4xl`. Parent cards, direct images, headers, footers, controls, and nested panels can therefore render different corner curves in the same composition. The News & Events featured carousel exposed the most visible failure: the outer card and its direct image used different radii, producing a white corner gap.

The website needs one predictable radius system that respects each selected theme, prevents cards from becoming excessively curved, and still permits intentionally pill-shaped controls.

## Scope

The contract applies to the public website and its shared frontend primitives:

- `src/app/(frontend)/**`
- `src/blocks/**`
- public components under `src/components/**`
- shared frontend primitives under `src/components/ui/**`
- public frontend styles and theme contracts

Payload Admin styling, admin-only components, generated Payload types, CMS schemas, email presentation, and third-party package internals are outside scope.

## Semantic Radius Tokens

The existing theme `--radius` remains the editor-selected source of truth. Three semantic roles derive from it:

```css
--radius-card: min(var(--radius, 0.625rem), 0.75rem);
--radius-control: min(var(--radius, 0.625rem), 0.75rem);
--radius-compact: min(calc(var(--radius, 0.625rem) * 0.5), 0.25rem);
```

The `0.75rem` ceiling is 12px at the root font size.

- `rounded-card` is used by cards, panels, dialogs, media frames, tables, framed sections, and other standalone structural surfaces.
- `rounded-control` is used by standard buttons, inputs, selects, default tabs, pagination controls, and other non-pill interactive controls.
- `rounded-compact` is used by tiny square controls and inline elements such as checkboxes, keyboard hints, and inline code labels. Its 4px ceiling prevents these elements from becoming accidental circles.
- `rounded-full` is reserved for explicit pill or circle variants: pill buttons, pill tabs, badges, chips, avatars, and circular icon controls.
- `rounded-none` is used by joined children, edge-sharing cells, or nested elements clipped by an owning surface.

SNMIH Blue continues to resolve both semantic tokens to zero because its theme radius is zero. SNMIH Green resolves them to 12px. Any future theme below 12px retains its smaller authored value; any future theme above 12px stops at the 12px ceiling.

Separate card and control variables intentionally share the same initial formula. Their semantic names prevent components from depending on visual scale utilities and allow a future theme contract to differentiate them without rewriting component markup. The compact role is still derived from the same theme radius but uses half of the authored value with a 4px ceiling.

## Ownership Rules

### Standalone surfaces

Every standalone card-like surface uses `rounded-card`. This includes media cards, informational cards, empty states, download panels, framed split layouts, carousels, tables, and modal panels.

### Controls

Standard controls use `rounded-control`. A control may use `rounded-full` only when its component variant or configuration explicitly describes a pill or circle. Control size alone does not make it a pill.

### Nested content

The outer surface owns corner clipping:

- Direct images do not declare a competing radius when their parent has `overflow-hidden`.
- Card headers and footers do not declare independent radii when the card shell clips them.
- Overlays follow the bounds of their owning media frame.
- An inset child may use `rounded-card` or `rounded-control` only when it is visibly separate from its parent and has its own background, border, or interaction boundary.

### Joined layouts

Tables, matrices, grouped cards, calendars, segmented controls, and similar joined compositions round only their outer boundary. Internal rows, cells, separators, and adjacent children remain square. When edge-specific rounding is unavoidable, it uses the semantic role (`rounded-t-card`, `rounded-b-card`, and equivalent variants), never a fixed size.

## Audit and Migration Rules

Every public frontend `rounded-*` usage will be classified into one of five outcomes:

1. `rounded-card`
2. `rounded-control`
3. `rounded-compact`
4. `rounded-full`
5. `rounded-none`

Fixed curvature utilities such as `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `rounded-4xl` will be removed from the scoped public frontend. Raw `rounded-[var(--radius)]` usage will migrate to the appropriate semantic role.

Pseudo-element, responsive, state, and edge-specific radius utilities must still resolve to one of the five semantic outcomes. Decorative circles that use width and height equality remain `rounded-full`.

The previously implemented contextual `rounded-sm` corrections are superseded and will migrate to `rounded-card`.

## Interaction and Accessibility

- Hover, active, selected, loading, disabled, and expanded states must not change corner geometry.
- Focus rings must follow the same semantic radius as the owning control or surface.
- Clipping must not hide focus indicators; interactive wrappers outside an overflow-clipped card use the matching semantic role.
- Theme and dark-mode changes must not cause layout shifts.
- No semantic color, contrast, typography, spacing, or motion behavior changes are part of this work.

## Edge Cases

- Missing theme radius falls back to `0.625rem` before applying the 12px ceiling.
- A zero theme radius produces square cards and standard controls.
- A radius below 12px is preserved without enlargement.
- A radius above 12px is capped for cards and standard controls.
- Compact elements use half of the theme radius and never exceed 4px.
- Pills and circles remain fully rounded even when the theme radius is zero.
- Nested media relies on parent clipping, preventing double corners and visible background wedges.
- Viewport-attached drawers or sheets may keep square viewport edges while their free-standing edges follow the control/surface contract.

## Verification

### Automated contracts

- Assert the semantic token formulas and 12px ceiling in `globals.css`.
- Assert representative primitives use the correct semantic role.
- Add a scoped source audit that rejects fixed curve utilities and raw theme-radius utilities in public frontend files, with explicit exclusions for admin-only code.
- Preserve focused behavior tests for cards, tabs, buttons, inputs, carousels, tables, calendars, and joined layouts.
- Verify zero, below-ceiling, at-ceiling, and above-ceiling values for card, control, and compact roles.

### Browser verification

Perform one bounded desktop/mobile pass on representative public pages in SNMIH Green and SNMIH Blue, including light and dark mode where available. Inspect:

- media and text cards;
- framed and pill tabs;
- standard and pill buttons;
- inputs and selects;
- carousels and direct images;
- tables, grouped cards, and calendar grids;
- focus, hover, selected, and disabled states.

The pass must confirm consistent outer geometry, no nested white corner gaps, no clipped focus indicators, and no unintended pills.

### Repository verification

- Run focused integration contracts, lint, and the production build.
- Run `pnpm project-context:update` and `pnpm project-context:check`.
- Inspect the final diff against the project change-impact map.

## Non-Goals

- Changing editor-selectable theme values.
- Redesigning component spacing, typography, color, borders, shadows, or motion.
- Adding Payload fields or migrating stored CMS content.
- Restyling Payload Admin.
- Making every element pill-shaped.
- Allowing individual blocks to invent new radius scales.
