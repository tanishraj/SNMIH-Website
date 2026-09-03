# Editorial Reasons Block Design

## Goal

Add an independent **Editorial Reasons** page block based on the `WHY SNMIH` prototype section. The
block pairs an editorial introduction with a numbered, ruled list of reasons while remaining
reusable across sites, themes, and content domains.

This is a new block rather than a Content Highlights variant. Its editorial introduction,
surface-aware numbered grid, and restrained ruled composition are the defining characteristics.

## Block identity and availability

- Admin label: **Editorial Reasons**
- Payload slug: `editorialReasons`
- Generated interface: `EditorialReasonsBlock`
- Available in Pages and Reusable Sections
- Supported by production rendering and page live preview
- Included in the thumbnail definition and fixture catalogs
- Documented in the block guide and feature inventory

This is an additive schema change and requires no content migration.

## CMS schema

The block follows the project's standard **Content** and **Theme Settings** tabs.

### Content

Section fields:

- `eyebrow`: optional short label
- `title`: required primary heading text
- `accentTitle`: optional second heading line rendered with restrained emphasis
- `description`: optional supporting textarea
- `actions`: up to two optional section actions using the shared action field

`reasons` is a required array with one to eight rows. Each row contains:

- `title`: required reason title
- `description`: optional supporting textarea
- `linkType`: None, Page, or Custom URL
- `page`: conditionally shown Page relationship
- `url`: conditionally shown custom URL
- `openInNewTab`: conditionally shown checkbox

Reason numbers are generated from array order as `01`, `02`, and so on. Editors cannot enter a
separate number because reordering must keep the visible sequence accurate. Rows without a
non-empty title are omitted defensively at render time.

### Theme Settings

- Shared block appearance controls
- Shared action mode: Link Text or Button
- `contentAlignment`: Left, Center, or Right; defaults to Left and aligns the eyebrow, heading,
  description, and actions as one introduction group
- `layoutProportion`: List Focus (40% introduction / 60% list), Balanced (50% / 50%),
  Introduction Focus (60% / 40%), or Full Width; defaults to List Focus
- `listColumns`: 1, 2, 3, or 4; defaults to 2 and selects the desktop column count
- `listBorderStyle`: Open, Ruled, or Framed; defaults to Ruled
- `listPosition`: Right or Left; defaults to Right and is shown only for split layouts
- `introVerticalAlignment`: Top, Center, or Bottom; defaults to Top
- `stickyIntro`: checkbox; defaults to enabled and only affects large screens
- Shared section padding: None, Compact, Default, or Comfortable

`introVerticalAlignment` and `stickyIntro` are shown only for the three split layouts. Full Width
places the introduction above the list, so vertical alignment and sticky positioning do not apply.

The reasons themselves do not expose card backgrounds, icons, badges, or connector controls.
These would weaken the block's editorial list identity and duplicate other blocks.

## Visual design

The desktop composition uses the shared regular-block container. Split layouts place the editorial
introduction beside a responsive reasons grid:

```text
┌────────────────────────────┬────────────────────┬────────────────────┐
│ EYEBROW                    │ 01                 │ 02                 │
│ Primary heading            │ Reason title       │ Reason title       │
│ Emphasized heading line    │ Description        │ Description        │
│ Supporting description     ├────────────────────┼────────────────────┤
│ Optional actions           │ 03                 │ 04                 │
│                            │ Reason title       │ Reason title       │
│                            │ Description        │ Description        │
└────────────────────────────┴────────────────────┴────────────────────┘
```

- List Focus uses a 40% introduction / 60% list ratio.
- Balanced uses a 50% / 50% ratio.
- Introduction Focus uses a 60% introduction / 40% list ratio.
- List Position places the numbered grid on the right or left without changing the semantic reading
  order: the section heading, description, and actions remain before the reasons in the document.
- Full Width places the introduction above a list that spans the entire regular container.
- All layouts use the established Content Highlights spacing rhythm rather than introducing a new
  container or section-gap scale.
- The introduction is constrained to a readable measure and follows Section Content Alignment.
- When enabled, the introduction becomes sticky below the site header on large screens.
- `introVerticalAlignment` controls its initial position relative to the list without changing the
  sticky offset.
- The optional accent title is a separate semantic line inside the same `h2`; it inherits the
  shared section-heading display family, size, weight, and `currentColor`, adding only italic
  emphasis. The shared contract declares `var(--font-display)` explicitly so global selector order
  cannot change the result.
- The reasons form a responsive one-to-four-column grid with a subtle outer top rule, horizontal row
  rules, and semantic column dividers.
- Open removes the outer top and bottom rules while retaining internal dividers. Ruled adds the
  outer top and bottom rules. Framed adds a theme-radius border on every side.
- One Column places each generated number in a dedicated rail beside its title and description.
- Two, Three, and Four Columns place each generated number above its title, matching the supplied
  multi-column reference.
- Incomplete final rows retain the selected grid rhythm without artificial stretching.
- Generated numbers use the shared metadata typography plus the same surface-aware accent behavior
  as section eyebrows. Under SNMIH this produces the darker green on light surfaces and the lighter
  green on primary/dark surfaces; other themes retain the existing semantic fallback color.
- Reason titles use the regular item-heading scale; descriptions use semantic secondary text.
- Linked titles retain visible keyboard focus, underline on hover, and safe external-link
  attributes.
- Section actions use the shared Content Actions implementation and selected action mode.

No shadows, detached cards, decorative icons, new color tokens, or component-local color values are
introduced. The editorial split and ruled reasons grid are the block's distinctive elements.

## Theme behavior

The block uses only existing semantic systems:

- `resolveBlockAppearanceClasses` for section background, foreground, and configured borders
- shared `contentStyles` contracts for introduction, heading, description, item, metadata, and link
  typography shared with Content Highlights
- the existing section-accent surface hook used by `SectionEyebrow` for both eyebrow and number color
- `border-current/15` for the same surface-aware divider contrast as Stats Strip
- `text-current` and `text-current/70` for titles and supporting text
- shared Content Actions for theme-aware links and buttons

The prototype's blue-to-mint wash is represented through the selected semantic block background,
not embedded into this reusable component. SNMIH and other themes therefore determine the final
surface and dark-mode palette automatically.

## Responsive behavior

- Below the large breakpoint, split layouts stack with the introduction first and behave like Full
  Width.
- Sticky positioning is disabled when stacked.
- One Column remains a single ruled list at every width. Two through Four Columns start as one column,
  expand to two at medium widths, and reach their selected desktop count at the extra-large
  breakpoint.
- Mobile retains the ruled list and generated two-digit numbers above each reason title.
- Responsive divider rules collapse to one clean horizontal sequence on one-column layouts.
- Section padding follows the shared regular-block scale.
- Long headings and descriptions wrap naturally without truncation or fixed heights.
- Actions wrap through the existing shared action layout.

## Rendering and data flow

`EditorialReasonsBlockComponent` is a server component. It:

1. trims and validates the section content;
2. filters unusable reason rows;
3. resolves Page and custom destinations with the existing CMS link helpers;
4. validates the configured alignment, proportion, placement, column count, and list border style
   against safe defaults;
5. resolves shared actions, appearance, and spacing;
6. renders the introduction and numbered grid directly.

The component returns `null` when the primary title is empty or no usable reasons remain. Missing
accent title, description, actions, item description, or item link reserves no empty space.

No client state, animation dependency, browser API, or database migration is required.

## Registration and documentation

Implementation registers Editorial Reasons in:

- `src/collections/Pages.ts`
- `src/collections/ReusableSections.ts`
- `src/blocks/renderPageBlocks.tsx`
- `src/blocks/renderLivePreviewPageBlocks.tsx`
- `src/block-thumbnails/definitions.ts`
- `src/block-thumbnails/fixtures.tsx`

Generated Payload types are refreshed after registration. The block guide and feature inventory are
updated, including the normal Page and Reusable Section block counts.

## Accessibility

- The section has one `h2`; each reason uses an `h3`.
- Generated numbers are decorative ordering cues and are hidden from assistive technology because
  DOM order already conveys the sequence.
- Links and actions retain visible keyboard focus.
- No content or action depends on sticky positioning or hover.
- Reading and tab order follow introduction, section actions, then reasons in array order.

## Testing and verification

Automated coverage verifies:

- the Payload schema, tabs, field requirements, limits, defaults, and link conditions;
- registration in Pages, Reusable Sections, production rendering, and live preview;
- generated two-digit numbering and filtering of invalid rows;
- optional accent title, descriptions, actions, and reason links;
- sticky and non-sticky introduction behavior;
- top, center, and bottom desktop alignment mappings;
- List Focus, Balanced, Introduction Focus, and Full Width layout mappings;
- right and left list placement mappings, including safe defaults for stale or missing values;
- Section Content Alignment for the complete introduction group;
- responsive one-to-four-column behavior and the distinct single-column number rail;
- Open, Ruled, Framed, and stale-value border-style behavior;
- full-width behavior that ignores split-only alignment, position, and sticky settings;
- generalized responsive divider treatment;
- surface-aware number accent behavior on light and primary/dark backgrounds;
- semantic appearance, divider, typography, and spacing hooks;
- safe custom and Page-link resolution;
- thumbnail definition and fixture coverage;
- generated Payload type coverage and documentation counts.

Validation includes focused Vitest coverage, Payload type generation, TypeScript, scoped ESLint,
format/diff checks, and one bounded desktop/mobile visual inspection under light and dark themes.

## Out of scope

- Adding a presentation variant to Content Highlights
- Manually editable reason numbers
- Per-reason icons, images, backgrounds, or buttons
- Scroll-triggered animation
- Hard-coded SNMIH colors or typography
