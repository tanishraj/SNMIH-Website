# Footer56 Footer Preset Design

## Goal

Add a reusable footer preset system powered by footer layout blocks, using one new `footer56` block as the first footer variant. The block should render site-wide through the existing `Footers` collection and `PageSettings.activeFooter`, following the same architectural pattern already used by global headers.

The footer should be restrained, institutional, and theme-driven. It should close the page structurally rather than behaving like a second hero or marketing banner.

## Approved Direction

- Extend the existing `Footers` collection with a `layout` blocks field
- Add one footer block variant:
  - `footer56`
- Render the active footer site-wide from the current footer preset selection
- Follow the same development pattern as existing block components
- Adapt the `@shadcnblocks/footer56` layout concept to the project, rather than importing it unchanged

## Design Principles

- Match the existing preset architecture already used by headers
- Keep the footer editorial and institutional rather than CTA-heavy
- Use theme tokens only for color, borders, radius, and spacing behavior
- Reuse the existing site logo behavior and existing CMS link model
- Keep the first footer variant structured and maintainable, not overloaded with optional marketing modules

## Architecture

### Preset source

- Use the existing `Footers` collection as the source of reusable footer presets
- Add a `layout` blocks field to the collection
- Register `footer56` as the first footer block inside that field

### Rendering path

- Create a dedicated footer block renderer, parallel to the header renderer
- Create a `GlobalFooter` component, parallel to `GlobalHeader`
- Render the selected footer preset site-wide from `PageSettings.activeFooter`
- Do not treat this as a page-level layout block

### File pattern

The implementation should follow the existing block structure already used in the codebase:

- `src/blocks/Footer56/config.ts`
- `src/blocks/Footer56/Component.tsx`
- `src/blocks/Footer56/thumbnail.ts`
- `src/blocks/renderFooterBlocks.tsx`
- `src/components/global/GlobalFooter.tsx`

This keeps footer variants extensible in the same way header and page blocks are extensible.

## Block Identity

- Recommended block slug: `footer56`
- Scope: footer preset layout block
- Rendering model: one structured site-wide footer with top, middle, and bottom bands
- Admin picker: custom thumbnail in the block folder, matching the current block pattern

## Content Model

### Branding fields

- `logoMode`
  - type: select
  - values:
    - `siteDefault`
    - `customLogo`

- `customLogoLight`
  - type: upload
  - relation: `media`
  - visible only when `logoMode = customLogo`

- `customLogoDark`
  - type: upload
  - relation: `media`
  - visible only when `logoMode = customLogo`

- `description`
  - type: textarea
  - short institutional supporting copy under the logo

### Link group fields

- `linkGroups`
  - type: array
  - minimum rows: 1
  - maximum rows: 4

Each group contains:

- `title`
  - type: text
  - required

- `links`
  - type: array
  - minimum rows: 1

Each link uses the same link model already established elsewhere in the project:

- `label`
- `linkType`
  - `page`
  - `custom`
- `page`
- `url`
- `openInNewTab`

### CTA fields

- `ctaButtons`
  - type: array
  - maximum rows: 2
  - optional

Each CTA uses the same core link model and a constrained variant field:

- `label`
- `linkType`
- `page`
- `url`
- `openInNewTab`
- `variant`
  - restricted to theme-aware button variants

CTA buttons are intentionally secondary. They may exist, but they should not dominate the footer.

### Bottom utility fields

- `bottomLinks`
  - type: array
  - optional
  - same link model as above

- `copyrightText`
  - type: text
  - optional

- `socialLinks`
  - type: array
  - optional

Each social item contains:

- `platform`
  - controlled select, not freeform icon names
- `url`
  - type: text
  - required

### Display field

- `backgroundStyle`
  - type: select
  - values:
    - `default`
    - `muted`
    - `accent`
    - `inverse`

`inverse` is appropriate for a footer because it may need to feel like a clear structural ending to the page. It must still remain token-driven, not hardcoded.

## Layout Structure

The footer should render as three bands:

### Top band

- logo
- description
- optional restrained CTA buttons

This band establishes identity and context, but must remain visually calm.

### Middle band

- 2 to 4 link columns depending on authored content
- all columns left-aligned
- group titles above grouped links

This band is the main navigational surface of the footer.

### Bottom band

- copyright text
- utility links such as privacy or terms
- optional social links

This band acts as the closing utility row of the footer.

## Visual Direction

Subject: institutional academic and medical websites.

Audience: prospective students, families, faculty, and broader public visitors.

Page job: provide navigation, context, and institutional credibility at the end of the page without competing with the primary page content.

### Tone

- restrained
- institutional
- structured
- theme-driven

### Visual behavior

- no inner card panels
- no oversized promotional content
- no aggressive newsletter or marketing treatment
- structure comes from spacing and dividers, not decorative containers

### Divider system

- use disciplined divider rhythm between top, middle, and bottom bands
- use border tokens only
- bands should feel related, not isolated

### Typography

- group titles use compact utility styling
- description uses muted support text
- links remain plain and readable
- utility row is smaller and quieter than the main middle band

## Footer56 Adaptation Rules

Do not import `@shadcnblocks/footer56` verbatim.

Adapt it as follows:

- keep the broad composition idea
- remove high-marketing emphasis
- reduce visual noise
- tighten spacing where needed
- preserve responsiveness
- map all visual styling to theme tokens
- replace any raw registry link model with the project’s existing page/custom URL model
- reuse the project’s site logo behavior with light/dark support

## Theme Behavior

Use semantic tokens only.

Background mapping:

- `default` → `bg-background text-foreground`
- `muted` → `bg-muted text-foreground`
- `accent` → `bg-accent text-accent-foreground`
- `inverse` → `bg-sidebar text-sidebar-foreground`

Additional rules:

- no hardcoded color values
- no manual `dark:` palette overrides unless required by an existing project pattern
- radius and shadows must remain theme-driven
- if a theme has minimal shadow language, the footer should respect that

## Admin Experience

- editors create named reusable footer presets in the `Footers` collection
- footer content is authored through footer layout blocks, matching the header model
- link groups should be straightforward to author
- fields should not expose low-value presentation controls
- the block picker should preview the structural footer thumbnail clearly

## Future Extension Boundary

The initial footer preset design does not include:

- newsletter signup form
- freeform icon sets
- badges or trust mark clouds
- multiple CTA zones
- arbitrary background images
- per-breakpoint layout controls

The system must remain extensible for future footer variants without complicating the first one.

## Testing Expectations

- validate `Footers` collection registers a `layout` blocks field
- validate `footer56` block schema fields
- validate site-wide rendering through the active footer preset
- validate link resolution for page and custom URL items
- validate theme-driven background variants
- validate responsive structural rendering for top, middle, and bottom bands
