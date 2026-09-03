# System Page Block Architecture Design

## Goal

Refactor the system page rendering layer so `404`, `maintenance`, and `coming soon` are modeled as separate rendering units, while preserving sensible field reuse in Payload. The result should be easier to extend, easier to test, and less likely to turn into a shared "god component" as these blocks evolve.

## Problem Statement

The current implementation has a mismatch in boundaries:

- Payload schemas are already separate blocks:
  - `system404`
  - `systemMaintenance`
  - `systemComingSoon`
- Frontend rendering is partly centralized in a shared component with `variant` branching.

That structure was acceptable for a quick implementation, but it creates pressure toward a single component owning too many layout decisions. As soon as `404`, `maintenance`, and `coming soon` diverge in layout, behavior, or fields, the shared variant layer becomes harder to reason about and harder to test.

## Design Decision

Use separate ownership for both schema and rendering.

- Keep each system page block as a first-class Payload block.
- Give each system page block its own dedicated view component.
- Extract only genuinely reusable visual primitives.
- Remove smart variant branching from the shared rendering layer.

This keeps reuse at the primitive level instead of the page-layout level.

## Scope

This design covers:

- block rendering boundaries
- shared primitive boundaries
- fallback page rendering alignment
- field factory evolution
- test ownership

This design does not change:

- the content model for ordinary frontend blocks
- the route-level system mode logic
- the existing operator-facing content intent for these pages

## Architecture

### 1. Payload block layer

Each system page remains a separate Payload block:

- `src/blocks/System404/config.ts`
- `src/blocks/SystemMaintenance/config.ts`
- `src/blocks/SystemComingSoon/config.ts`

Each block keeps its own defaults and labels. These files stay small and declarative.

### 2. Adapter layer

Each Payload block component becomes a thin adapter:

- `src/blocks/System404/Component.tsx`
- `src/blocks/SystemMaintenance/Component.tsx`
- `src/blocks/SystemComingSoon/Component.tsx`

Responsibilities:

- receive Payload block data
- resolve CMS link fields into renderable links
- normalize optional values
- pass a clean view model into a dedicated view component

Non-responsibilities:

- own layout branching for other system page types
- share unrelated visual decisions
- contain large amounts of styling logic

### 3. View layer

Create dedicated system-page view components:

- `src/components/system-pages/System404View.tsx`
- `src/components/system-pages/SystemMaintenanceView.tsx`
- `src/components/system-pages/SystemComingSoonView.tsx`

Responsibilities:

- own layout structure
- own spacing and text alignment
- own page-specific visual treatment
- compose shared primitives

Each view should be understandable in isolation. A developer should be able to update the `404` experience without reading maintenance or coming-soon code.

### 4. Primitive layer

Create small, dumb primitives under:

- `src/components/system-pages/primitives/SystemPageShell.tsx`
- `src/components/system-pages/primitives/SystemPageActions.tsx`
- `src/components/system-pages/primitives/SystemPageStatus.tsx`
- optional: `src/components/system-pages/primitives/SystemPageCopy.tsx`

Responsibilities:

- render one concern well
- accept plain props
- remain agnostic about whether the caller is `404`, `maintenance`, or `coming soon`

Non-responsibilities:

- choose page-level layout variants
- infer system page type
- coordinate unrelated behaviors

### 5. Fallback page alignment

Built-in fallback pages must render through the same dedicated views used by CMS-configured system page blocks:

- `DefaultNotFoundPage` uses `System404View`
- maintenance fallback uses `SystemMaintenanceView`
- coming-soon fallback uses `SystemComingSoonView`

This prevents visual drift between configured and fallback experiences.

## Data Flow

1. Payload block schema defines fields and defaults.
2. Block adapter receives Payload data.
3. Adapter resolves links and normalizes the data shape.
4. Adapter renders the dedicated system-page view.
5. View composes shared primitives and outputs final UI.

This produces one clean direction of ownership:

- schema defines content
- adapter maps content to props
- view owns layout
- primitives render repeatable pieces

## Schema Strategy

Keep field reuse, but separate field reuse from block assembly.

Recommended evolution:

- rename field creation toward `createBaseSystemPageFields(defaults)`
- keep a thin `createSystemPageBlock({ slug, labels, fields })`

This gives two explicit responsibilities:

- shared field factory
- block definition assembly

### Shared fields now

- `badge`
- `heading`
- `description`
- `supportingNote`
- `primaryAction`
- `secondaryAction`

### Extensibility later

The structure should make it easy to let blocks diverge later without refactoring the entire system:

- `404` may gain utility-link or return-navigation options
- `maintenance` may gain expected-return or support-channel fields
- `coming soon` may gain signup or launch-note fields

The key rule is: shared today does not imply permanently shared.

## Why This Is Better

### Extensibility

Adding a future system page type becomes straightforward:

- add config
- add adapter
- add view
- optionally reuse existing primitives

No central variant switch needs to keep growing.

### Maintainability

Layout logic stays local to the page type it belongs to. This reduces accidental coupling and makes the codebase easier to navigate.

### Testability

Adapters and views can be tested separately:

- adapter tests verify mapping and link resolution
- view tests verify rendered structure and page-specific behavior

### Alignment with Payload

Payload already exposes separate system page blocks. Matching that same boundary in the frontend reduces conceptual mismatch.

## Alternatives Considered

### Option 1. Keep one shared `SystemPageHero` with more variants

Pros:

- fastest short-term path
- lowest immediate file count

Cons:

- central component keeps growing
- unrelated layouts become coupled
- harder to test and reason about over time

Rejected because it optimizes for short-term convenience over long-term clarity.

### Option 2. Separate views with shared primitives

Pros:

- strong ownership boundaries
- controlled reuse
- good scalability
- easier testing

Cons:

- slightly more files
- requires a small refactor now

Selected because it is the best balance for this project.

### Option 3. Fully separate schemas, rendering, and fields

Pros:

- maximum isolation

Cons:

- too much duplication
- weakens consistency
- unnecessary for current scope

Rejected because it is heavier than this project needs.

## Testing Strategy

### 1. Schema tests

Keep existing schema tests that verify:

- shared field presence
- default values
- minimal block contract

### 2. Adapter tests

For each block adapter, verify:

- link resolution
- optional field normalization
- correct handoff into the dedicated view

### 3. View rendering tests

For each view, verify:

- expected structure
- expected text presence
- page-specific layout markers
- CTA rendering behavior

### 4. Fallback tests

Verify built-in fallbacks render through the same views as the block-based versions.

## Refactor Plan

1. Create dedicated system page view components.
2. Create small shared primitives for shell, status, actions, and optional copy.
3. Move `404` rendering into `System404View`.
4. Move maintenance rendering into `SystemMaintenanceView`.
5. Move coming-soon rendering into `SystemComingSoonView`.
6. Update block adapters to render the new views.
7. Update fallback pages to reuse those views.
8. Remove `variant` branching from the current shared rendering component.
9. Delete the old smart shared component if nothing meaningful remains, or reduce it to a primitive if one real responsibility is left.
10. Update tests to align with the new ownership boundaries.

## Naming Convention

Use these ownership rules consistently:

- `Component` = Payload block adapter
- `View` = page-specific visual component
- `primitives` = low-level reusable visual pieces

This keeps the mental model obvious when navigating the codebase.

## Error Handling and Operational Considerations

- Adapters should tolerate missing optional links and omit actions cleanly.
- Views should not assume both primary and secondary actions exist.
- Fallback pages must remain available even when no CMS-configured system page exists.
- Shared primitives should stay server-safe and avoid unnecessary client boundaries.

## Performance Considerations

- Keep these views as server-renderable components unless interaction strictly requires client code.
- Avoid a large all-in-one shared component that serializes unnecessary props across unrelated variants.
- Prefer static imports and small component boundaries to keep bundle shape predictable.
- Keep animation limited to transform and opacity where used.

## Success Criteria

This design is successful if:

- each system page type has its own dedicated view component
- there is no variant-based shared page-layout owner
- fallback pages reuse the same dedicated views
- shared code exists only at the primitive level
- tests clearly separate schema, adapter, and view concerns
- adding a new system page type later does not require expanding a central variant switch
