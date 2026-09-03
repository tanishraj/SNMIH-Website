# Block Components Theme Normalization Design

## Goal

Normalize all block components so they consistently use the existing shadcn-compatible design tokens and visually respond correctly across:

- multiple project themes
- light mode
- dark mode

The pass should also pull visually drifted blocks back toward the spacing, surface, border, and typography conventions expected by shadcn and shadcnblocks.

## Approved Direction

- cover all block components, including system page blocks
- use semantic design tokens already present in the project
- normalize both token usage and visual rhythm
- keep Payload schemas and data contracts stable unless a styling issue cannot be solved without schema change
- do not use `extract-design-system`; this is a repo-local normalization pass, not a public-site extraction task

## In Scope

### Reusable block components

- `Announcement`
- `HeaderNavbar12`
- `HeroInstitutional`
- `FeatureSpotlight`
- `StatsStrip`
- `Footer56`

### System page blocks

- `System404`
- `SystemMaintenance`
- `SystemComingSoon`

### Related render shells only when necessary for token correctness

- page/footer/header block render shells may be touched only if a wrapper is preventing blocks from inheriting the correct theme surfaces

## Out of Scope

- redesigning block schemas for editorial convenience
- adding new themes
- changing theme token definitions unless a missing token makes normalization impossible
- design-system extraction from a public site
- pixel-perfect reproduction of third-party references

## Core Principles

### 1. Semantic token usage first

Blocks must prefer project tokens such as:

- `bg-background`, `text-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-accent`, `text-accent-foreground`
- `bg-primary`, `text-primary-foreground`
- `border-border`
- `bg-card`, `text-card-foreground`
- `bg-sidebar`, `text-sidebar-foreground`
- `text-sidebar-primary`, `text-sidebar-primary-foreground`

No block should rely on hardcoded visual assumptions like “dark means black background and white text” when an existing semantic token can express the same intent.

### 2. Visual normalization, not just token swap

The pass should also normalize drift in:

- section padding
- internal spacing
- border usage
- grid rhythm
- surface hierarchy
- typography hierarchy
- CTA treatment where shadcn primitives already define the intended behavior

### 3. Preserve behavior

The pass must keep existing content behavior intact:

- same block field contracts
- same global/site-settings ownership rules
- same page rendering behavior
- same interactions unless the current interaction breaks theme consistency

## Block-by-Block Expectations

### Announcement

- use only semantic surface/foreground tokens for the bar shell
- keep announcement text/link behavior intact
- ensure mobile/desktop modes inherit tokens consistently
- avoid styling that looks correct only in one theme preset

### HeaderNavbar12

- keep sticky/header behavior intact
- ensure surfaces, borders, dropdowns, mobile sheet states, and CTA styling are fully token-driven
- remove any residual one-off visual styling that ignores theme radius, foreground, or hover surfaces

### HeroInstitutional

- keep image overlay structure
- normalize text, CTA surfaces, and supporting text to theme-aware semantic tokens
- allow the image veil/overlay opacity treatment to remain custom where no semantic token equivalent exists
- ensure foreground contrast remains stable across theme and color preset changes

### FeatureSpotlight

- normalize section surfaces and media containers to semantic tokens
- ensure feature links and buttons adapt through token-driven color changes
- keep existing layout options and optional-image behavior intact

### StatsStrip

- normalize row dividers and section borders so they stay legible across light/dark and all themes
- keep animated metrics behavior intact
- ensure muted/accent/default variants derive appearance from existing semantic tokens

### Footer56

- keep current Payload-driven logo/contact/social/legal behavior
- keep the restored shadcnblocks layout rhythm
- ensure all colors, borders, utility links, icon treatments, and text hierarchies are theme-token-driven
- preserve the intentional custom typography choice for link-list titles

### System404 / SystemMaintenance / SystemComingSoon

- ensure shells, cards/surfaces, text, and actions all use semantic theme tokens
- avoid isolated styling that only looks correct in one theme or one color scheme
- preserve current messaging and functional behavior

## Special Rule: Overlays and Media-Backed Sections

Some blocks use background images and overlays. These require a narrower exception:

- image veil layers may continue using opacity-based overlay classes
- text and CTA surfaces layered over the image should still use semantic foreground/surface tokens wherever possible
- do not use manual `dark:` overrides unless there is no token-based path

This applies primarily to `HeroInstitutional`.

## Shadcn Alignment Rules

The implementation should follow the project’s shadcn guidance:

- prefer existing variants and semantic classes over custom color classes
- do not introduce manual dark mode color overrides when tokens already exist
- keep spacing expressed through `flex`/`grid` with `gap-*`
- avoid unnecessary custom z-index or bespoke surface systems
- keep component visuals aligned with shadcn/shadcnblocks defaults where the project has drifted without a deliberate reason

## Testing Expectations

The normalization pass must verify:

- block-focused integration tests still pass for affected blocks
- lint passes on touched block files
- blocks still render correctly through existing render pipelines
- theme-token usage does not regress current global/site-settings driven behavior

At minimum, verification should cover the currently implemented block test surface and any touched block renderer paths.

## Success Criteria

The pass is complete when:

- all in-scope block components use semantic tokens consistently
- blocks respond correctly to theme preset changes
- blocks respond correctly to both light and dark mode
- visually drifted blocks are brought back in line with shadcn/shadcnblocks conventions without breaking Payload-driven behavior
- no new schema churn is introduced unless required

## Risks and Constraints

### Risk: visual regressions while normalizing

Mitigation:

- keep changes block-scoped
- preserve block APIs
- verify each touched block through focused tests and manual review

### Risk: overlay sections cannot become fully token-native

Mitigation:

- allow overlay veil exceptions
- still normalize all text/surface layers around them

### Risk: current tests do not assert theme behavior directly

Mitigation:

- use the existing tests as safety rails
- keep the pass conservative around structure and behavior
- focus changes on token choice and visual rhythm rather than logic churn
