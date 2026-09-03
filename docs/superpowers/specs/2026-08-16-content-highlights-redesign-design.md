# Content Highlights Redesign

## Goal

Rework Content Highlights into a calm, flexible editorial section whose per-card markers and actions match the content rather than being dictated by the selected presentation. Remove the ambiguous metadata and linked-title configuration, consolidate redundant layouts, and align the block's Payload controls with current section conventions.

## Design Direction

The visual direction is a **quiet academic index**: measured typography, generous space, subtle semantic rules, and no ornamental card effects. The section should feel like a carefully edited institutional guide rather than a generic feature-card grid.

The implementation uses the existing theme tokens rather than introducing fixed component colors. In the SNMIH theme those tokens correspond to Navy `#06285D`, Ink `#0B1D38`, Ice `#F2F7FB`, Line `#DFE7EF`, Success green `#2F8F45`, and White `#FFFFFF`.

Typography retains the established roles:

- Playfair Display through `--font-display` for the section heading;
- Inter through `--font-sans` for card titles, descriptions, and actions;
- IBM Plex Mono through `--font-mono` for card numbers and custom labels.

The signature element is a quiet marker line above or beside the card content. Markers are typographic information, never pills, badges, circles, or decorative ornaments.

## Payload Content Model

The block keeps two top-level tabs: **Content** and **Theme Settings**.

### Content

Fields appear in this order:

1. `eyebrow`: optional text;
2. `title`: required text;
3. `accentTitle`: optional text for the italic heading line;
4. `description`: optional textarea;
5. `actions`: up to two shared Section Actions;
6. `footerActions`: up to two shared Footer Actions;
7. `items`: required array with one to six rows.

Each item uses the shared Content and Theme Settings card tabs.

The item Content tab contains:

- `markerMode`: required select with `numbered`, `custom`, and `hidden`; default `numbered`;
- `markerLabel`: optional text shown in the admin only when `markerMode` is `custom`;
- `title`: required text;
- `description`: optional textarea;
- `cardAction`: optional shared action array with a maximum of one row.

`cardAction` uses the complete shared action contract:

- Page or Custom URL destination;
- Link or Button display mode;
- shared button variants;
- optional arrow;
- optional new-tab behavior.

The item Theme Settings tab retains `cardBackground` through the shared card-theme field.

The following item fields are removed:

- `metadata`;
- `linkType`;
- `page`;
- `url`;
- `openInNewTab`.

Existing metadata and title-link values are intentionally discarded. They are not copied into markers or card actions. Stale stored keys are ignored by rendering and disappear when Payload next saves the item under the current schema.

## Theme Settings Model

Fields appear in this order:

1. shared `appearance` controls;
2. `layout`;
3. `headerLayout`;
4. `contentAlignment`;
5. `splitContentAlignment`;
6. shared `size` section padding.

### Layout

The layout select uses three editor-facing choices while retaining compatible stored values:

- `editorialRow`, labeled **Editorial List**;
- `highlightsGrid`, labeled **Calm Grid**;
- `simpleGrid`, labeled **Simple Grid**.

`highlightsGrid` remains the default. The obsolete `numberedSteps` option is removed because marker behavior now belongs to each card.

### Header Layout

`headerLayout` is a required select with:

- `stacked`, labeled **Stacked**, default;
- `split`, labeled **Split**.

`contentAlignment` is shown only for Stacked and offers Left, Center, and Right. It aligns the complete introduction group, including section actions, while item text remains left aligned.

`splitContentAlignment` is shown only for Split and offers Top, Center, and Bottom. It vertically aligns the introduction against the card area on large screens.

The old `enableSplitLayout` checkbox is removed from the schema. The renderer continues to accept it as a legacy input: when `headerLayout` is absent, `enableSplitLayout: true` resolves to Split. This avoids breaking published Pages or Reusable Sections before they are resaved.

## Marker Behavior

Marker behavior is resolved independently for every usable card:

- **Numbered:** generate a two-digit marker such as `01`, `02`, or `03` from the card's rendered position;
- **Custom label:** render the trimmed `markerLabel` exactly as authored;
- **Hidden:** render no marker element and reserve no marker space.

Missing or stale marker modes resolve to Numbered. A blank custom label renders no marker. Automatic numbering occurs after rows without a usable title are filtered, so the visible sequence never contains gaps.

## Card Action Behavior

Card titles are always plain text. The entire card is never wrapped in an anchor.

A valid `cardAction` renders in a dedicated footer at the bottom of the card. The footer:

- has a subtle semantic top rule using the resolved card foreground at low opacity;
- uses deliberate space above and below the rule;
- remains anchored to the card bottom in equal-height grid rows;
- renders a shared Content Link or Button according to the action's mode;
- applies the resolved card-surface button override so Default buttons remain legible on primary, brand, and dark surfaces.

An empty or invalid card action renders no footer, border, or reserved space.

## Presentations

All presentations use the shared regular-block container, section spacing, appearance, typography, and semantic card surfaces.

### Editorial List

Editorial List is an open, rule-led presentation for stories, services, and descriptive highlights.

- One column on mobile, two at medium widths, and three at large widths.
- Default cards use a subtle top rule and no enclosing background.
- Marker, title, and description form a compact vertical content group.
- The action footer adds its own distinct top rule only when an action exists.
- An explicit non-default `cardBackground` is honored with semantic background, foreground, padding, and boundary treatment.

### Calm Grid

Calm Grid is the primary surfaced presentation for steps, labeled pathways, and stronger calls to action.

- One column on mobile, two at medium widths, and three at large widths.
- Cards use equal-height flex columns, generous shared-scale padding, a fine semantic border, and no shadow.
- The default card surface inherits the section colors while retaining a quiet boundary.
- Explicit card backgrounds use the shared semantic card-surface resolver.
- Card action footers align at the bottom across each grid row.

### Simple Grid

Simple Grid is an open typographic presentation for concise facts or requirements.

- One column on mobile and two columns from the medium breakpoint.
- The marker and text create a compact reading unit without a default enclosing surface.
- Custom labels and numbers use a stable marker measure so neighboring content aligns.
- An explicit non-default `cardBackground` is honored with semantic background, foreground, padding, and boundary treatment.
- The action footer remains visually separated by its top rule.

## Section Composition

### Stacked

The introduction appears above the card area. Eyebrow, title, accent title, description, and section actions form one aligned group. Cards follow after a deliberate section gap derived from the selected size.

### Split

On large screens, the introduction occupies the left column and the cards occupy the wider right column. The selected vertical alignment applies to the introduction. On smaller screens, the DOM and visual order is introduction, section actions, then cards.

Split item areas use no more than two columns because they occupy the narrower content region.

Footer actions remain outside the main composition and use the shared footer-action renderer with the resolved section alignment.

## Normalization And Compatibility

- A missing or unknown layout resolves to Calm Grid.
- Legacy `numberedSteps` resolves to Calm Grid at runtime.
- Existing `editorialRow`, `highlightsGrid`, and `simpleGrid` values retain their stored values and receive the new editor-facing labels and presentation.
- A missing `headerLayout` uses legacy `enableSplitLayout` when present, otherwise Stacked.
- Unknown header, content-alignment, split-alignment, size, marker, card-background, and action values resolve through documented defaults or existing shared resolvers.
- A missing or blank section title renders no block.
- Item rows without a non-empty title are filtered.
- A block with no usable items renders nothing.
- Invalid card and section actions render nothing interactive and create no empty layout slot.
- Existing metadata and title-link values are ignored with no migration or fallback presentation.

## Accessibility And Responsiveness

- Heading order remains section heading followed by card headings.
- Card actions retain visible keyboard focus from shared Button and Content Link primitives.
- New-tab links use `rel="noreferrer"`.
- DOM order matches visual and keyboard order at every breakpoint.
- Long labels, titles, descriptions, and translated action text wrap without horizontal overflow.
- Cards do not rely on fixed heights; equal-height rows come from grid stretching and internal flex layout.
- Touch targets retain shared button sizing.
- No client JavaScript, animation, or motion is introduced.

## Verification

Focused integration tests must cover:

- exact Content and Theme Settings field order;
- required section and item titles;
- removal of metadata, old item destination fields, `numberedSteps`, and `enableSplitLayout` from the current schema and generated types;
- conditional `markerLabel`, `contentAlignment`, and `splitContentAlignment` controls;
- Numbered, Custom label, Hidden, blank-custom, and stale marker behavior;
- automatic numbering after invalid rows are filtered;
- Editorial List, Calm Grid, and Simple Grid in Stacked and Split compositions;
- legacy `numberedSteps` and `enableSplitLayout` runtime fallbacks;
- semantic card backgrounds in every presentation and dark/brand compatibility;
- card action links and buttons, variants, arrows, new-tab behavior, and surface-aware button contrast;
- conditional action footer borders and bottom alignment;
- section actions and footer actions;
- defensive blank-title, empty-item, invalid-action, stale-layout, alignment, and size behavior;
- public and live-preview renderer registration;
- refreshed generated Payload types and Content Highlights admin thumbnail.

Verification must include focused Vitest runs, Payload type generation, TypeScript, lint, the complete integration suite, the layout detector, and one bounded desktop/mobile visual inspection.

## Scope

This redesign does not add images, icons, animation, per-card layout selection, drag-order overrides, whole-card links, or a new palette. It does not change shared action behavior for other blocks.
