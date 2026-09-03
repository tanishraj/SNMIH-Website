# Stats Strip Block Design

## Goal

Add one reusable page-level block that renders institutional metrics as a clean inline stats strip. The block should support any number of items, wrap automatically into multiple rows, cap each row at four items, and animate the numeric values when the section enters the viewport.

The block is intended for metrics like:

- `112` years of training physicians
- `9:1` student-to-faculty ratio
- `$186M` annual research funding
- `96%` residency match rate

## Approved Direction

- One reusable `StatsStrip` page block
- Unlimited stats items
- Maximum four items per row
- Items split remaining space equally within each row
- Mobile defaults to two items per row
- Count-up animation runs on viewport entry
- Theme-token-driven colors, borders, spacing, and radius

## Design Principles

- Match the existing page block system already used by Announcement, HeroInstitutional, and FeatureSpotlight
- Keep the editorial tone restrained, institutional, and easy to scan
- Use layout-first design; animation supports the content but does not dominate it
- Avoid decorative settings that add admin complexity without improving outcomes
- Keep the content model flexible enough to handle prefixes and suffixes without inventing multiple metric types

## Block Identity

- Recommended block slug: `statsStrip`
- Scope: page layout block
- Rendering model: responsive grid of metrics with row-aware equal-width distribution
- Admin picker: custom thumbnail in the block folder, matching the current block pattern

## Content Model

### Required fields

- `items`
  - type: array
  - minimum rows: 1
  - unlimited rows

Each `items` row contains:

- `value`
  - type: number
  - required

- `label`
  - type: text
  - required

### Optional fields

- `prefix`
  - type: text
  - example: `$`

- `suffix`
  - type: text
  - examples: `%`, `M`, `:1`

### Display fields

- `backgroundStyle`
  - type: select
  - values:
    - `default`
    - `muted`
    - `accent`

### Animation fields

- `animationEnabled`
  - type: checkbox
  - default: enabled

- `animationDuration`
  - type: number
  - stored in milliseconds
  - default: `1200`

- `triggerOnce`
  - type: checkbox
  - default: enabled

## Layout Rules

- Desktop supports up to four columns per row
- If more than four items are provided, the block wraps into additional rows
- Each row distributes its items evenly across the available width
- A row with one, two, or three items still expands those items equally across that row
- Mobile renders two items per row
- If the total count is odd on mobile, the final item spans both mobile columns so the last row still fills the available width

This keeps the block useful for small stat groups and larger multi-row metric sections without adding manual row configuration.

## Metric Formatting

The block uses one metric model for all item types:

- `prefix` remains static before the number
- `value` is the animated numeric portion
- `suffix` remains static after the number

Examples:

- `value = 112` renders `112`
- `prefix = $`, `value = 186`, `suffix = M` renders `$186M`
- `value = 96`, `suffix = %` renders `96%`
- `value = 9`, `suffix = :1` renders `9:1`

This avoids introducing separate field sets for percentages, currency, or ratios.

## Rendering Behavior

### Section shell

- Use the same outer page-width and horizontal padding conventions as existing page blocks
- Keep the section self-contained and reusable across light and dark themes

### Grid behavior

- Use a responsive grid rather than a carousel, marquee, or ticker
- Desktop grid allows up to four columns
- Tablet behavior may resolve to two, three, or four columns depending on row fill
- Mobile resolves to two columns

### Item composition

Each item renders:

1. metric line
2. supporting label

Visual hierarchy:

- metric is dominant
- label is smaller and secondary
- label should use a compact utility treatment that remains readable and theme-consistent

### Separators

- Larger screens show vertical separators between sibling items within the same row
- Separators should remain row-scoped and must not visually bleed across wrapped rows
- Mobile removes the vertical separator treatment in favor of spacing and clean alignment

## Animation Behavior

- Count-up starts when the block enters the viewport
- Default behavior triggers once
- If reduced motion is enabled, skip the animation and render final values immediately
- Animation applies only to the numeric `value`
- Prefixes and suffixes do not animate independently
- Motion should feel restrained and institutional, not playful or gamified

The block should use lightweight local logic for viewport detection and interpolation rather than introducing a heavy external counter dependency.

## Theme Behavior

Use semantic tokens only.

Background mapping:

- `default` → `bg-background text-foreground`
- `muted` → `bg-muted text-foreground`
- `accent` → `bg-accent text-accent-foreground`

Additional rules:

- borders and dividers use theme border tokens
- radius follows existing theme-driven radius behavior
- no hardcoded light or dark values
- no manual `dark:` color overrides unless required by an existing project pattern

## Admin Experience

- The block should be simple to author and preview
- Editors add one stat per item
- The schema should not ask editors to manage rows manually
- Prefix and suffix fields give enough control for common institutional metrics without creating multiple specialized block variants

## Future Extension Boundary

The initial design does not include:

- icons
- per-item descriptions
- highlighted featured stat
- staggered animation timing
- manual row controls

The schema and renderer should remain simple but should not block those additions later.

## Testing Expectations

- Validate rendering for 1, 2, 3, 4, 5, and 8 items
- Validate equal-width distribution across incomplete final rows
- Validate mobile two-column behavior
- Validate count-up rendering with prefixes and suffixes
- Validate reduced-motion fallback to final values
- Validate theme-driven background variants and row separators
