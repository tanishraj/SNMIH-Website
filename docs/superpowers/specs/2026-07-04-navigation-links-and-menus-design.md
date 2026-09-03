# Navigation Links And Menus Design

## Goal

Replace the current rigid page-derived header and footer navigation model with a reusable navigation system that:

- centralizes link ownership
- keeps header and footer layout flexible
- allows page-backed links and custom links to coexist
- updates page URLs in one place
- lets editors map reusable links into different header and footer structures manually

The system should preserve the current architectural boundary that is already working well:

- `Headers` remain reusable header presets
- `Footers` remain reusable footer presets
- `Page Settings` continues selecting the active header and footer

The change is specifically about how navigation content is modeled and consumed.

## Scope

In scope:

- introduce a reusable `navigation-links` collection
- introduce a structural `navigation-menus` collection
- rename the page flag currently called `showInNavigation`
- sync page-backed navigation links from `Pages`
- allow page-backed links to become manual links when sync is disabled
- let header and footer consume menus for primary structure
- let header and footer consume single reusable links for CTA, legal, and utility cases
- remove dependence on direct page-tree-derived navigation rendering

Out of scope:

- localization-aware navigation
- audience/role-specific navigation
- menu scheduling
- automatic menu placement from page hierarchy
- visual redesign of the shadcn header or footer blocks
- implementation of every possible future menu variant

## User Decisions Captured

- `NavigationLinks` should hold all reusable links, not only page-backed links
- page-backed links should auto-create once and then remain editable
- disabling page sync should keep the reusable link as a manual link
- header/footer should use a hybrid consumption model:
  - menus for primary structure
  - direct reusable links for CTA, legal, and utility cases

## Recommended Approach

Use a two-layer navigation model:

1. `navigation-links` for canonical link identity and destination
2. `navigation-menus` for editorial structure such as header dropdowns and footer sections

This is the right middle ground for the current codebase.

Why:

- link destination changes stop being duplicated across headers, footers, and CTAs
- header and footer stay design-driven instead of page-tree-driven
- dropdowns and footer sections become explicit editorial structures instead of inferred behavior
- future header or footer block variants can reuse the same menus and links

## Architecture

### Keep Existing High-Level Boundaries

Keep these existing concepts:

- `Pages`
- `Headers`
- `Footers`
- `Page Settings`
- block-driven header/footer layouts

Do not move active header/footer selection out of `Page Settings`.

Do not collapse header/footer configuration into globals.

### Add `NavigationLinks` Collection

Create a `navigation-links` collection as the canonical reusable link source.

Each document represents one reusable destination that can be used in:

- header primary navigation
- footer section links
- header secondary actions
- CTAs
- legal links
- future menus elsewhere in the site

Recommended fields:

- `title`
  - editor-facing label
- `linkType`
  - `page | custom`
- `page`
  - relationship to `pages`
  - only shown when `linkType = page`
- `url`
  - text
  - only shown when `linkType = custom`
- `openInNewTab`
  - checkbox
- `description`
  - optional helper text for menu entries that support descriptive dropdown items
- `sourceType`
  - `pageSynced | manual`
- `syncPage`
  - relationship to `pages`
  - populated only for page-synced links

Recommended collection config:

- `admin.useAsTitle = 'title'`
- `admin.defaultColumns = ['title', 'linkType', 'sourceType', 'updatedAt']`
- `admin.listSearchableFields = ['title', 'url']`
- `versions: { drafts: true }`

### Add `NavigationMenus` Collection

Create a `navigation-menus` collection for structural composition.

Each document represents a reusable arrangement of navigation links.

This collection should model structure, not link destination ownership.

Recommended fields:

- `title`
- `menuType`
  - `header | footer | generic`
- `layout`
  - single-row `blocks` field
  - one block chosen based on menu structure

Recommended initial blocks:

1. `headerMenu`
   - `items` array
   - each item has:
     - `labelMode`
       - `useLinkTitle | custom`
     - `customLabel`
     - `link`
       - relationship to `navigation-links`
     - `children`
       - array of child entries using the same simplified structure

2. `footerMenu`
   - `sections` array
   - each section has:
     - `title`
     - `links`
       - array of relationships to `navigation-links`

Why blocks:

- this matches the existing project pattern already used in `Pages`, `Headers`, and `Footers`
- it keeps future menu variants extensible without bloating one conditional schema

### Update `Pages`

Rename the current `showInNavigation` field to a name that matches the new requirement.

Recommended new name:

- `syncToNavigationLinks`

Reason:

- it describes actual system behavior
- it does not imply that the page will automatically appear in any given header or footer

Behavior:

- when enabled on a page, ensure a `navigation-links` document exists for that page
- if none exists, create one
- if one exists and is still page-synced, update its page-owned fields
- when disabled, convert the reusable link from `pageSynced` to `manual` and keep it

Recommended page-owned fields during sync:

- destination page relationship
- derived href through page resolution

Recommended editor-owned fields even for synced links:

- `title`
- `description`
- `openInNewTab`

This keeps the “auto-create once, then editable” behavior the user selected.

### Update `Headers`

Keep `Headers` as reusable presets with `layout` blocks.

For the current `headerNavbar12` block:

- remove the current `navigationSource` concept after migration
- replace `navigationItems` with a relationship to a `navigation-menu`
  - filtered to `menuType = header`
- keep `secondaryActions` but make each entry reference a `navigation-link`
- keep `cta` but make it reference a single `navigation-link`
- keep existing logo selection behavior

Result:

- header block owns visual placement
- menu owns primary structure
- links own destinations

### Update `Footers`

Keep `Footers` as reusable presets with `layout` blocks.

For the current `footer2` block:

- remove the current `sectionsSource` concept after migration
- replace manual `sections` arrays with a relationship to a `navigation-menu`
  - filtered to `menuType = footer`
- keep `legalLinks` as direct relationships to `navigation-links`
- keep `description` and `copyright`

Result:

- footer block owns visual placement
- menu owns section structure
- links own destinations

## Data Flow

### Page Sync Flow

1. Editor creates or updates a page
2. If `syncToNavigationLinks = true`:
   - locate a reusable link where `syncPage = current page`
   - create one if missing
   - ensure `linkType = page`
   - ensure `page = current page`
   - ensure `sourceType = pageSynced`
3. If `syncToNavigationLinks = false` and a synced reusable link exists:
   - keep the link document
   - clear `syncPage`
   - change `sourceType = manual`

### Header Rendering Flow

1. Frontend layout fetches `Page Settings`
2. Resolve active `Header`
3. Resolve the selected `navigation-menu`
4. Resolve each referenced `navigation-link`
5. Map normalized menu data into the shadcn header component props

### Footer Rendering Flow

1. Frontend layout fetches `Page Settings`
2. Resolve active `Footer`
3. Resolve the selected footer `navigation-menu`
4. Resolve each referenced `navigation-link`
5. Map normalized section data into the shadcn footer component props

## Sync Rules

These rules must be explicit so the system stays predictable.

### Creation

- first time a page is marked `syncToNavigationLinks = true`, create a reusable link if none exists
- do not create duplicates for the same page

### Updates

While a reusable link is still `pageSynced`:

- keep `linkType = page`
- keep `page = syncPage`

Do not force-update editor-facing text fields like `title` after creation. The user selected “auto-create once, then editable,” so title should remain editable without later page changes overwriting it.

### Unsync

When page sync is turned off:

- keep the reusable link document
- convert it to `manual`
- clear `syncPage`

This prevents accidental breakage in headers and footers already using that link.

### Deletion

If a page is deleted and a synced reusable link still references it:

- convert that link to `manual`
- clear the page relationship
- leave the document in place for editorial cleanup

Do not auto-delete reusable links from page deletion hooks.

## Admin Experience

### Pages

Replace the current navigation checkbox label with:

- `Sync to Navigation Links`

Optional help text:

- `Create or maintain a reusable link record for this page.`

### Navigation Links

Editors should be able to:

- create custom reusable links directly
- see whether a link is page-synced or manual
- search links easily by title or URL

### Navigation Menus

Editors should be able to:

- create multiple header menus
- create multiple footer menus
- map reusable links into dropdowns and sections
- reuse one link across many menus without redefining its destination

### Headers And Footers

Editors should be able to:

- choose which menu drives the primary header navigation
- choose which menu drives the footer sections
- choose direct reusable links for CTA, secondary actions, and legal links

## Migration Strategy

This is not a full reset. It should migrate from the current implementation carefully.

1. Add `navigation-links`
2. Add `navigation-menus`
3. Add page sync field rename
4. Add page sync hooks
5. Add menu relationships to current header/footer blocks
6. Keep old manual fields temporarily during migration
7. Backfill reusable links from existing page-linked header/footer entries only if needed
8. Backfill one or more initial menus from currently active header/footer data if worthwhile
9. Switch frontend rendering to the new menu/link resolver
10. Remove the temporary page-derived navigation mode

Important note:

Because this project already has SQLite draft/version tables that were enabled after initial data existed, any new schema fields added to block tables must be reflected in the actual SQLite tables before admin list views rely on them.

## Error Handling

- missing selected menu on a header/footer: render no primary nav for that region
- missing selected reusable link in a menu item: skip that item
- page-backed reusable link with broken page reference: skip or degrade safely to no href
- empty menu structure: render empty nav state without crashing
- stale menu references: skip invalid items, do not break the whole header/footer

## Testing

Minimum verification:

- schema changes generate types successfully
- TypeScript passes
- admin list views load for:
  - `Pages`
  - `Navigation Links`
  - `Navigation Menus`
  - `Headers`
  - `Footers`
- creating a page with `Sync to Navigation Links` enabled creates one reusable link
- disabling sync converts that reusable link to `manual`
- header renders the selected header menu
- footer renders the selected footer menu
- changing a page slug changes the resolved URL of any page-backed reusable link
- CTA and legal links still work through direct reusable-link references

## Risks

1. Draft/version SQLite schema drift
   - any new block fields can break admin list views if DB tables are not aligned

2. Overwriting editor intent
   - page sync rules must not keep resetting labels that editors intentionally changed

3. Partial migration complexity
   - keeping old and new navigation models side by side too long will create confusion

## Recommendation Summary

Build a reusable navigation system with:

- `Pages` as optional link seeders
- `NavigationLinks` as canonical link sources
- `NavigationMenus` as reusable structures
- `Headers` and `Footers` as presentational presets consuming menus and direct links

This fits the current codebase better than page-tree-derived navigation and scales better than making header/footer point only to raw links.
