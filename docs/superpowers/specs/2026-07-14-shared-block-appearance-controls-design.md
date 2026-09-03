# Shared Block Appearance Controls Design

## Goal

Add one shared appearance model that all block components can reuse for:

- background color
- default text color behavior
- block border placement

The model must stay theme-driven, work across all current light/dark themes, and avoid turning each block into manually styled one-off UI.

## Approved Direction

- all blocks get the same appearance controls
- background options are:
  - `none` default
  - `primary`
  - `secondary`
  - `muted`
  - `accent`
- text color is non-editable by default through `auto`, but there is a manual override control
- border options are:
  - `none` default
  - `top`
  - `bottom`
  - `topAndBottom`
- implementation should use shared Payload field helpers and shared runtime class mapping
- implementation should remain aligned with the project’s shadcn token usage rules
- `extract-design-system` is out of scope because this is not a public-site extraction task

## Scope

### In scope

- shared Payload field factory for appearance controls
- shared runtime helper for block appearance classes
- rollout to current block components:
  - `Announcement`
  - `HeaderNavbar12`
  - `HeroInstitutional`
  - `FeatureSpotlight`
  - `StatsStrip`
  - `Footer56`
  - `System404`
  - `SystemComingSoon`
  - `SystemMaintenance`
- focused tests covering schema and class mapping behavior

### Out of scope

- adding new theme tokens
- arbitrary editor-controlled text colors
- per-element color editing inside blocks
- redesigning existing block layouts

## Shared Field Contract

Each block will receive one reusable appearance group.

### Payload shape

```ts
appearance?: {
  background?: 'none' | 'primary' | 'secondary' | 'muted' | 'accent' | null
  textColor?: 'auto' | 'default' | 'inverse' | null
  border?: 'none' | 'top' | 'bottom' | 'topAndBottom' | null
}
```

### Editor defaults

- `background: 'none'`
- `textColor: 'auto'`
- `border: 'none'`

### Rationale

This keeps the contract small and stable:

- editors can choose the block surface
- the system computes the safe text color by default
- the override exists only for the narrow cases where a different foreground treatment is needed

## Runtime Mapping

One shared helper should convert the appearance values into semantic classes for the block root.

### Background classes

- `none` → no background class
- `primary` → `bg-primary`
- `secondary` → `bg-secondary`
- `muted` → `bg-muted`
- `accent` → `bg-accent`

### Auto text-color mapping

- `none` → `text-foreground`
- `primary` → `text-primary-foreground`
- `secondary` → `text-secondary-foreground`
- `muted` → `text-foreground`
- `accent` → `text-accent-foreground`

### Manual text-color override

- `default` → `text-foreground`
- `inverse` → high-contrast surface-aware foreground:
  - `primary` → `text-primary-foreground`
  - `secondary` → `text-secondary-foreground`
  - `accent` → `text-accent-foreground`
  - `muted` → `text-foreground`
  - `none` → `text-foreground`

### Border mapping

- `none` → no border
- `top` → `border-t border-border`
- `bottom` → `border-b border-border`
- `topAndBottom` → `border-y border-border`

## Architectural Boundaries

### 1. Shared Payload helper

Add one reusable field factory in a shared block-support area.

Responsibility:

- define the appearance fields once
- keep labels/options/defaults consistent across all blocks

### 2. Shared runtime helper

Add one shared appearance-class helper.

Responsibility:

- resolve safe root-level classes from appearance values
- avoid duplicating mapping logic across blocks

### 3. Block-level adoption

Each block should opt into the shared appearance helper and apply the returned classes at the block root section/container.

Responsibility:

- consume the shared `appearance` object
- merge the appearance classes with the block’s existing structural classes
- keep block-specific internal styling where it is still semantically required

## Important Behavior Rule

The shared appearance settings affect:

- the block root surface
- the block root text color baseline
- the block root border placement

They do not force every nested element to lose its intentional semantic styling.

Examples:

- CTA buttons should still use their own shadcn variants
- Hero overlays can keep custom veil layers
- Stats values can preserve intentional hierarchy
- Announcement icon emphasis can remain contextual

This prevents the appearance system from flattening component design into one global text color.

## Block-by-Block Adoption Notes

### Announcement

- root bar adopts shared appearance controls
- current special-case shell colors should be replaced by the shared appearance system
- rotating/marquee content continues to inherit the root foreground baseline unless a stronger semantic token is necessary

### HeaderNavbar12

- root header shell adopts shared appearance controls
- dropdowns and sheet internals remain token-driven through existing shadcn primitives
- appearance settings affect the main sticky header bar, not every overlay child surface

### HeroInstitutional

- root section adopts shared appearance controls
- overlay veil remains custom
- title/description wrapper should respect the resolved root foreground baseline where possible without reducing contrast on media-backed layouts

### FeatureSpotlight

- root section adopts shared appearance controls
- image shell and CTA elements keep their own semantic treatment where needed

### StatsStrip

- root strip adopts shared appearance controls
- row dividers continue using `border-border`
- numeric hierarchy remains intact

### Footer56

- shared appearance system should replace the current footer-specific background selector
- link, legal, and social treatments continue using semantic descendants where necessary

### System Page Blocks

- root shell adopts shared appearance controls
- status/copy/actions remain structurally the same

## Testing Expectations

Implementation should verify:

- block schemas expose the shared appearance group
- default values are correct
- root block rendering applies the expected semantic classes
- existing block rendering behavior does not regress
- current theme switching still works because only semantic tokens are used

At minimum, tests should cover:

- schema assertions for at least one reusable block and one system block
- focused rendering assertions for the updated root class mapping
- regression coverage for existing block test suites already in the repository

## Risks

### Risk: conflicting legacy fields

Some blocks already have bespoke background selectors.

Mitigation:

- replace or migrate those block-specific fields to the shared appearance model rather than layering two parallel systems

### Risk: text override becomes a contrast footgun

Mitigation:

- keep override options restricted to `default` and `inverse`
- do not expose arbitrary semantic text colors to editors

### Risk: root-level text classes interfere with nested semantic descendants

Mitigation:

- treat the root text color as a baseline only
- preserve nested semantic classes for intentional child emphasis

## Success Criteria

This design is complete when:

- every block uses the same appearance contract
- background, text, and border controls are editor-configurable through one shared model
- all rendering remains theme-token-driven
- no block requires raw colors or manual dark-mode overrides
- existing block-specific interactions and layouts remain intact
