# Header Navbar Block Design

Date: 2026-07-13

## Goal

Add a reusable, sticky navigation header block that lives in the `Headers` collection, is selected globally from `Website Defaults`, and supports:

- block-level sizing
- block-level nav alignment
- block-level logo behavior
- one-level dropdown navigation
- optional CTA buttons
- light/dark logo handling

This is explicitly a header preset concern, not page content.

## Placement

### Chosen model

- `Headers` becomes the source of reusable header presets
- `Headers` gets a `layout` blocks field
- the first header block is a navbar block
- `Website Defaults` continues to select the active header preset
- frontend layout renders the active header before page content

### Rejected alternatives

- page-level sticky navbar block
  - rejected because the repo already treats header/footer as reusable global structure
- replacing global header selection with direct block config in `Website Defaults`
  - rejected because the existing `Headers` collection is the correct preset boundary

## Existing constraints from the codebase

- `Site Settings` currently provides a single default logo upload and site name
- `navigation-links` is a flat reusable destination collection and does not support nested menus
- `mediaUsage.ts` already anticipates header/footer layout blocks and custom header logo references

These constraints make a self-contained header menu tree the cleanest design.

## Block scope

The navbar block is fully self-contained for structure and alignment.

It owns:

- sticky behavior
- size
- nav alignment
- logo override logic
- menu tree
- CTA buttons

It does not own:

- site-wide brand defaults, which remain in `Site Settings`
- active header selection, which remains in `Website Defaults`

## Data model

### `Headers` collection

Add:

- `layout`
  - `type: blocks`
  - initially supports one navbar block type

### Navbar block

Suggested slug:

- `headerNavbar2`

Fields:

- `sticky`
  - checkbox
  - default `true`

- `size`
  - select
  - values:
    - `compact`
    - `default`
    - `large`

- `navAlignment`
  - select
  - values:
    - `left`
    - `center`
    - `right`

- `logoMode`
  - select
  - values:
    - `siteDefault`
    - `customLogo`

- `customLogoLight`
  - upload to `media`
  - shown only when `logoMode = customLogo`

- `customLogoDark`
  - upload to `media`
  - optional
  - shown only when `logoMode = customLogo`

- `logoHeight`
  - numeric or preset-backed control
  - block-level size for the rendered logo

- `menuItems`
  - array
  - each row contains:
    - `label`
    - `linkType` = `page | custom`
    - `page`
    - `url`
    - `openInNewTab`
    - `children`
      - array
      - same link shape
      - one level only

- `ctaButtons`
  - array
  - max 2
  - each row contains:
    - `label`
    - `linkType`
    - `page`
    - `url`
    - `openInNewTab`
    - `variant` = `link | outline | default`

## Navigation behavior

### Desktop

- logo on the left
- nav area aligned based on `navAlignment`
- CTA group on the right
- menu items with children render a dropdown
- parent items may have both:
  - a direct link target
  - a dropdown trigger indicator

Chosen interaction:

- clickable label navigates
- separate chevron/dropdown indicator opens the submenu

### Mobile

- use a sheet-based mobile menu
- child items expand with accordion/collapsible behavior
- one nesting level only

## Logo behavior

Default behavior:

- use `Site Settings.logo`
- if no logo media exists, fallback to text using `siteName`

Override behavior:

- `customLogoLight` replaces the default logo
- `customLogoDark` is used in dark theme when present
- if no dark override exists, fallback to the light custom logo

The rendered logo logic should be centralized in a reusable `SiteLogo` component so footer blocks can reuse it later with different size settings.

## Rendering architecture

### Server-side wrappers

- `HeaderNavbarBlock`
  - receives block data from the `Headers` collection
  - resolves logo source from `site-settings`
  - normalizes menu items and CTA items
  - passes stable props to presentational components

### Shared component

- `SiteLogo`
  - handles:
    - site default logo
    - custom light logo
    - custom dark logo
    - text fallback
    - block-level size controls

### Presentational components

- `HeaderNavbar`
  - main layout shell
- `HeaderNavMenu`
  - desktop navigation row
- `HeaderMobileMenu`
  - mobile sheet + expandable children

## Shadcn component strategy

Use shadcn primitives and patterns for the implementation:

- `NavigationMenu`
- `Sheet`
- `Accordion` or `Collapsible`
- `Button`

The requested `@shadcnblocks/navbar2` should be treated as a starting visual pattern, not as the final data model. The block’s schema and rendering must conform to this project’s Payload and theme structure.

## Sticky stacking behavior

The header must stack correctly with:

- admin session bar
- global announcement bar

Resulting order:

1. admin session bar
2. global announcement
3. sticky header
4. page content

The header should manage its own sticky offset in the global shell rather than being embedded into page content.

## Testing plan

### Schema/config tests

- `Headers` exposes a `layout` blocks field
- navbar block fields exist with the correct defaults and conditional admin visibility
- CTA max limit and one-level child shape are enforced

### Rendering tests

- renders with site default logo
- renders with custom logo override
- renders dark-logo fallback correctly
- renders menu items and child items
- renders CTA buttons
- renders text fallback when no logo media exists

### Global shell wiring tests

- frontend layout resolves active header
- header renders before main content
- sticky behavior coexists with admin bar and announcement bar

### Validation/type checks

- regenerate Payload types after schema changes
- run `tsc --noEmit`

## Scope limits

This design does not include:

- a footer block implementation
- a reusable hierarchical navigation collection
- multiple nesting levels
- per-page header overrides

Those can be added later without changing the core preset boundary.
