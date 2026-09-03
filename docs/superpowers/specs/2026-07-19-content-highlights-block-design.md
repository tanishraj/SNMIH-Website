# Content Highlights Block Design

## Goal

Create a reusable Payload page block named **Content Highlights** with three layouts for editorial announcements, informational grids, and split intro/list sections. The block must follow the existing website container, typography, spacing, action, appearance, theme, thumbnail, and responsive conventions.

## Architecture

Use one block with a normalized content schema and a layout selector. Editors can switch layouts without replacing or losing item data. The block renders as a server component and requires no client state, effects, or browser JavaScript.

The block slug is `contentHighlights` and its generated interface name is `ContentHighlightsBlock`.

## Payload Schema

The block uses the standard `Content` and `Layout & Theme` tabs.

### Content

- `eyebrow`: optional text
- `title`: required text
- `description`: optional textarea
- `actions`: optional shared content actions, maximum 2
- `items`: array with 1–6 rows
  - `metadata`: optional text, such as `Research · Jul 08, 2026`
  - `title`: required text
  - `description`: optional textarea
  - `linkType`: optional destination type with Page and Custom URL choices
  - `page`: optional Pages relationship shown for Page destinations
  - `url`: optional text shown for Custom URL destinations
  - `openInNewTab`: optional checkbox

An item without a resolved destination renders as static content. An item with a resolved destination renders its title as the link and does not add a separate item button.

### Layout & Theme

- Shared block appearance group with semantic background and section-border controls; no manual text-color override
- Shared action mode with Link and Button options
- `layout`: required select with:
  - `editorialRow`: Editorial Row
  - `highlightsGrid`: Highlights Grid
  - `splitHighlights`: Split Highlights
- `size`: required select with Compact, Default, and Comfortable options

The default layout is `highlightsGrid`. Content remains left-aligned in every layout to preserve the supplied designs.

## Presentation

All layouts use the shared `max-w-screen-2xl` website container, standard horizontal padding, regular block vertical-spacing presets, normalized eyebrow/title/description typography, semantic theme colors, and semantic borders.

### Editorial Row

- Desktop intro and section actions share the top row.
- Items render in three columns with strong semantic top dividers.
- Metadata uses the established compact uppercase eyebrow treatment.
- Titles are visually prominent; descriptions remain optional.

### Highlights Grid

- Intro and section actions render above the items.
- Items render in a three-column grid and may form a second row.
- Every item has a semantic top divider.

### Split Highlights

- Desktop intro occupies the left third.
- Items occupy the right two-thirds in a two-column grid.
- Every item has a semantic top divider.

## Actions and Links

Section actions reuse `ContentActions`, `createContentActionsField`, and `createContentActionModeField`. Editors may add zero, one, or two section actions and choose whether the actions render as shared links or Button variants.

Item destinations reuse the existing `CmsLinkValue`/`resolveCmsLink` data contract. Item-title links retain the item-title typography and provide visible hover and focus behavior using semantic theme tokens.

## Responsive Behavior

- Editorial Row and Highlights Grid use three columns on large screens, two columns where space permits, and one column on mobile.
- Split Highlights uses a one-third/two-thirds desktop split with a two-column item grid.
- Every layout becomes one vertical stack on mobile: intro, section actions, then items.
- No layout may cause horizontal overflow at the 390px mobile breakpoint.

## Data Resilience

- Trim title, metadata, and description values before rendering.
- Ignore item rows without a non-empty title.
- Resolve optional destinations through `resolveCmsLink`; invalid or incomplete destinations fall back to static item titles.
- Payload enforces the required block title and 1–6 item rows, while the renderer remains defensive for previews or legacy data.

## Registration and Thumbnail

- Register Content Highlights in the Pages layout block catalog and `renderPageBlocks` switch.
- Add `content-highlights.jpg` to the block-thumbnail definitions.
- Add a deterministic Highlights Grid fixture with representative content and section action.
- Generate the real-render thumbnail through the existing `generate:block-thumbnails` script.
- Regenerate `src/payload-types.ts` after schema registration.

## Verification

- Payload schema test for tabs, shared appearance/actions, layout options, size options, and item constraints.
- Presentation tests for Editorial Row, Highlights Grid, and Split Highlights markup.
- Tests for optional description, metadata, section actions, static items, linked item titles, and invalid destinations.
- Registration tests for Pages and `renderPageBlocks`.
- Thumbnail metadata and fixture coverage.
- Responsive contract checks for desktop and mobile grid classes, shared container width, and absence of horizontal-overflow classes.
- Run focused Vitest, ESLint, Prettier, Payload type generation, and diff checks.
- Keep every file unstaged.
