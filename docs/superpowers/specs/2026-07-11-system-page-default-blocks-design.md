# System Page Default Blocks Design

## Objective

Replace the current system page presentation with a minimal full-page pattern for:

- `404`
- `Maintenance`
- `Coming Soon`

The result should feel:

- simple
- responsive
- centered
- theme-aware
- operationally safe

These pages should read as complete public-site states, not as ordinary content sections dropped into a normal page layout.

## Current Problem

The CMS already supports typed `System Pages`, but the desired presentation is now much simpler than the richer direction originally explored.

The system pages should no longer behave like mini landing pages with:

- card shells
- split layouts
- side panels
- multiple content regions
- optional decorative media zones

Instead, the desired outcome is a very clear status screen:

- full-page section
- centered stack
- centered actions
- minimal copy

This better matches the job of these pages:

- `404` should explain the missing page clearly
- `Maintenance` should communicate temporary interruption clearly
- `Coming Soon` should communicate pre-launch state clearly

## Design Goals

1. Keep all three system pages visually minimal.
2. Use one consistent full-page structural pattern across all three types.
3. Keep content editing simple inside Payload.
4. Preserve theme support through the existing Payload theme system.
5. Hide the normal site chrome when a system page is shown.
6. Keep the implementation dependable and low-complexity.

## Recommended Approach

Keep the existing `System Pages` collection and type enforcement, but simplify both the schema and the renderer.

The system should move to:

- one shared minimal full-page visual structure
- three typed block entries that differ mostly by purpose and copy
- no card layout
- no split columns
- no decorative support regions

This is preferred over:

- distinct layout compositions per type, which adds unnecessary complexity
- richer content models, which make system pages harder to operate under pressure

## Layout Direction

All three system pages should use the same structural rhythm:

- a section that fills the visible page area
- centered horizontal alignment
- centered vertical emphasis
- one compact content stack
- centered action row beneath the copy

The page should feel like a dedicated state screen, not a standard CMS block inside a longer page.

### 404

Default content:

- badge or status line: `404`
- heading: `The page you requested could not be found.`
- description: `The link may be outdated, the page may have moved, or the URL may be incorrect.`

Purpose:

- explain the error
- offer a clean recovery path

### Maintenance

Purpose:

- explain that the site is temporarily unavailable
- reassure the visitor that the interruption is intentional

The structure remains the same:

- status
- heading
- description
- centered action row

### Coming Soon

Purpose:

- explain that the site or experience is not yet publicly available
- keep the tone calm and polished

The structure remains the same:

- status
- heading
- description
- centered action row

## Shared Visual Rules

All three screens should:

- use existing semantic theme tokens such as `background`, `foreground`, `muted`, `border`, and `primary`
- respect the current `Theme Settings` presets: `default`, `blue`, and `sera`
- respect current color-scheme behavior: `system`, `light`, and `dark`
- use shadcn primitives only where they support the minimal structure naturally
- avoid hardcoded page-type palettes
- avoid card shells
- avoid side panels
- avoid image-driven composition

Typography should stay restrained:

- centered heading
- centered description
- compact vertical rhythm
- no decorative overdesign

## Content Model

The CMS should stay very small for these pages.

### Shared Fields

All three block types should use the same small field set:

- `badge`
- `heading`
- `description`
- `primaryAction`
- `secondaryAction`
- optional `supportingNote`

### Fields To Remove From This Direction

This simplified design should not include:

- `helpLinks`
- `serviceMessage`
- `expectedBackAt`
- `eyebrow`
- `signupNote`
- `image`

Reasoning:

- these fields support richer layouts that are no longer desired
- they add editorial complexity without helping the minimal design
- system pages should be fast to edit and hard to misconfigure

## Rendering Architecture

The frontend should use one shared minimal renderer for all three types.

Recommended structure:

- one minimal full-page system-page component
- type-aware defaults for status copy and subtle status treatment
- one shared action-row pattern

The important behavior is not visual variation by layout. It is consistency:

- all three types should feel like part of one clear system
- content changes should be enough to distinguish them

## Header And Footer Behavior

When a system page or system-mode fallback is rendered, the normal public-site header and footer should not render.

Reasoning:

- these pages should own the whole page
- the system state should feel complete and intentional
- normal site chrome makes the state feel like a partial content block instead of a real page state

This applies to:

- custom managed `System Pages`
- built-in fallback screens

## Responsive Behavior

All three pages must be mobile-first.

Expected behavior:

- centered content remains centered on narrow screens
- text stays readable without growing too wide on desktop
- action buttons stay centered and stack naturally when needed
- spacing should feel calm and intentional on both mobile and desktop

## Fallback Behavior

Current fallback behavior should remain intact:

- if `Website Modes` references a published custom `System Page`, that page renders
- if no custom system page is selected, the built-in fallback screen still renders

The built-in fallback screens should use the same simplified full-page renderer so the experience remains consistent whether a custom page exists or not.

## shadcn Usage Strategy

Use shadcn only where it supports the minimal structure naturally.

Priority:

- `Button` for actions
- optionally `Badge` for the status marker

Do not introduce additional primitives just to create more visual structure than the design needs.

This pass should not depend on:

- `Card`
- complex framing components
- shadcnblocks landing-page patterns

## Non-Goals

This pass should not include:

- multiple layout presets per system page type
- rich supporting content zones
- help panels
- side-column recovery links
- media-heavy layouts
- custom per-type theming systems
- animation-heavy presentation

## Testing Strategy

### Automated

- verify the system page block schemas use the simplified shared field set
- verify removed rich-layout fields no longer appear
- verify the minimal renderer works for `404`, `Maintenance`, and `Coming Soon`
- verify built-in fallback screens use the same rendering pattern
- verify routing and system-mode behavior still works

### Manual

- create one system page for each type
- preview them on desktop and mobile
- confirm the content is centered
- confirm actions are centered
- confirm header and footer are hidden
- confirm theme presets still affect the page correctly

## Recommended Outcome

After this pass, the starter should ship with:

- one clean full-page status pattern
- very low CMS complexity for system pages
- consistent fallback behavior
- system pages that feel intentional, centered, and easy to operate
