# Headers Collection With Active Global Design

## Goal

Add reusable site headers to Payload by introducing a `headers` collection and a `header-settings` global that selects the active header site-wide.

Each header document should support multiple header variants through a single-row `blocks` field. The first supported variant will be based on `@shadcnblocks/navbar12`, and its imported styling should remain intact.

## Scope

In scope:

- Add a `headers` collection for reusable header presets
- Add a `header-settings` global in the default `Globals` section
- Add a single-row `layout` blocks field to each header document
- Add the first block variant for `navbar12`
- Fetch and render the active header in the frontend layout
- Preserve shadcnblocks styling and structure as much as possible
- Support navigation items, nested dropdown items, CTA, and logo selection inside the block
- Keep the site stable when no active header has been configured

Out of scope:

- Per-page header overrides
- Multiple simultaneously active headers
- Header activation through booleans on collection documents
- Redesigning `navbar12`
- Additional header variants beyond the first block scaffold

## Recommended Approach

Use a `headers` collection for reusable header presets and a small `header-settings` global with a required relationship to the active header.

Each header document should model its chosen header implementation through a `layout` blocks field with exactly one row.

Why this approach:

- It separates reusable content from site-wide activation cleanly
- It gives editors multiple saved header presets without adding page-level complexity
- It matches the existing block-driven modeling pattern already used in `Pages`
- It keeps future header variants extensible without bloating one giant conditional schema

## Architecture

### Headers Collection

Create a `headers` collection that stores reusable header presets.

Each document represents one complete header configuration.

Recommended shape:

- `title`
- optional slug via `slugField()` if stable human-readable IDs are useful
- `layout`
  - `type: 'blocks'`
  - `minRows: 1`
  - `maxRows: 1`
  - `blocks: [HeaderNavbar12Block]`

Recommended collection options:

- `admin.useAsTitle = 'title'`
- `admin.defaultColumns = ['title', 'updatedAt']`
- `versions: { drafts: true }`

Why drafts:

- Headers are editorial content and should support safe staging before becoming active

### Header Settings Global

Create a `header-settings` global under the default `Globals` section.

Purpose:

- define which header document is currently active site-wide

Fields:

- `activeHeader`
  - `type: 'relationship'`
  - `relationTo: 'headers'`
  - `required: true`

This global should stay intentionally small. It answers one question only: which reusable header is active.

### Header Navbar12 Block

Create the first header block variant for the imported `navbar12` component.

Recommended block identity:

- `slug: 'headerNavbar12'`
- `interfaceName: 'HeaderNavbar12Block'`

Fields:

- `logoMode`
  - `type: 'radio'`
  - options:
    - `siteSettingsLogo`
    - `customLogo`
  - default: `siteSettingsLogo`
- `customLogo`
  - `type: 'upload'`
  - `relationTo: 'media'`
  - conditional on `logoMode = customLogo`
- `navigationItems`
  - `type: 'array'`
  - fields per item:
    - `label`
    - `linkType: page | custom`
    - `page`
    - `url`
    - `openInNewTab`
    - `children` array with the same simplified link structure
- `cta`
  - `type: 'group'`
  - fields:
    - `enabled`
    - `label`
    - `linkType`
    - `page`
    - `url`
    - `openInNewTab`

Do not add extra style toggles yet. Keep the first block functional and close to the imported component’s original assumptions.

## Frontend Rendering

### Fetching

The frontend layout should fetch:

- `site-settings`
- `theme-settings`
- `seo-settings`
- `header-settings`

Then resolve:

- `header-settings.activeHeader`
- `activeHeader.layout[0]`

The fetch path should be resilient:

- if `header-settings` is missing, render no header
- if `activeHeader` is missing, render no header
- if `layout` is empty, render no header

The site must not crash because header content is absent or incomplete.

### Rendering Dispatcher

Add a small header renderer similar to the existing page block renderer:

- inspect `activeHeader.layout?.[0]`
- switch on `blockType`
- render the matching header component

Initial mapping:

- `headerNavbar12` -> `Navbar12`

This dispatcher becomes the extension point for future header variants.

### Component Boundary

Treat `navbar12` as a presentational render target.

Do not redesign it. Keep its visual styling, class names, and overall DOM structure intact unless a minimal structural change is necessary to replace hardcoded demo content with real props.

Instead:

- create a thin adapter layer that maps Payload block data to component props
- resolve page relationships into hrefs there
- choose `customLogo` or `SiteSettings.logo` there
- normalize nested menu items and CTA there

This keeps the imported component visually stable while separating CMS data concerns from UI rendering.

## Data Flow

1. Editor creates one or more documents in `headers`
2. Each header document selects exactly one header block in `layout`
3. Editor sets `header-settings.activeHeader`
4. Frontend layout fetches `header-settings` and resolves the active header
5. Renderer inspects the active header block
6. Adapter maps Payload data into the presentational navbar props
7. The selected header renders site-wide

## Error Handling

- Missing `header-settings`: render no header
- Missing `activeHeader`: render no header
- Empty `layout`: render no header
- Broken page relationship on a nav item: skip that item
- `logoMode = customLogo` with no uploaded file: fall back to `SiteSettings.logo`
- No custom logo and no site logo: render without a logo, but do not crash

## File Plan

Expected additions and changes:

- `src/collections/Headers.ts`
- `src/globals/HeaderSettings.ts`
- `src/blocks/HeaderNavbar12/config.ts` or `src/header-blocks/HeaderNavbar12/config.ts`
- optional adapter/render helper for header blocks
- `src/payload.config.ts`
- frontend global loader or layout fetch logic
- `src/app/(frontend)/layout.tsx`
- integration wrapper around `src/components/navbar12.tsx`

## Rollout Plan

1. Add the `headers` collection
2. Add the `header-settings` global
3. Add the `headerNavbar12` block config
4. Register the new collection and global in `payload.config.ts`
5. Regenerate types
6. Fetch `header-settings` in the frontend layout
7. Resolve and render `activeHeader.layout[0]`
8. Adapt `navbar12` to accept normalized props without changing its style system
9. Create at least one header document and select it in `header-settings`

## Testing

Minimum verification:

- Type generation succeeds after schema changes
- TypeScript passes after frontend wiring
- Manual admin test:
  - `Headers` collection exists
  - `Header Settings` appears in `Globals`
  - editor can create multiple header presets
  - editor can choose exactly one block inside a header document
  - editor can switch the active header through `header-settings`
- Manual frontend test:
  - active header renders on all pages
  - switching `activeHeader` changes the frontend header
  - nested page links resolve correctly
  - custom URLs work
  - dropdown items render
  - logo fallback works
  - missing config does not crash the site

## Non-Goals and Future Extension

Not part of this implementation:

- page-level header overrides
- collection-level `isActive` boolean enforcement
- style/theme controls for `navbar12`
- mega menu content blocks

Future extension path:

- add new header block variants to the single-row `layout` field
- add optional preview helpers for header presets
- add page-level override later only if a real use case appears

The `headers` collection plus `header-settings` global remains stable as the number of header variants grows.
