# Global Content and Theme Settings Design

## Goal

Standardize block and card authoring around two clearly named Payload tabs—**Content** and
**Theme Settings**—and make card surfaces respond consistently to every installed color theme and
dark mode. At the same time, update only the SNMIH color preset so its Primary semantic color is
the approved brand navy `#031d44` in light mode, with an accessible same-family treatment in dark
mode.

The result must improve authoring clarity without renaming stored fields, flattening existing data,
or adding one-off color logic to individual components.

## Scope and Delivery Phases

This work spans three related but independently verifiable systems:

1. **SNMIH semantic palette and shared surface resolution**
2. **Top-level block tab normalization**
3. **Nested visual-card tabs and per-card surfaces**

Implementation should follow that order. The palette and shared helpers establish the contract
used by the schema and renderers; block-level normalization can then be verified separately from
the larger card-by-card rollout.

Other theme presets remain unchanged.

## Design Principles

- Editors choose semantic intent, never a raw color value.
- Theme names describe purpose: Primary, Secondary, Muted, and Accent.
- Foreground, icon, border, link, and action contrast are derived automatically from the chosen
  surface.
- Light and dark modes are authored once through tokens rather than component-specific overrides.
- Payload tab changes preserve existing field paths and therefore do not require a content
  migration.
- Tabs are added only when they contain meaningful controls. Utility rows do not receive empty
  Theme Settings tabs.

## SNMIH Theme Palette

### Light mode

| Semantic token | Color | Purpose |
| --- | --- | --- |
| Background | `#ffffff` | Main page canvas |
| Foreground | `#101827` | Primary page copy |
| Card | `#ffffff` | Default card surface |
| Card foreground | `#101827` | Default card copy |
| Primary | `#031d44` | SNMIH brand navy for buttons, links, tabs, icons, and selected surfaces |
| Primary foreground | `#f8fafc` | Copy and icons on Primary |
| Secondary | `#e8eef7` | Quiet cool-blue surface |
| Secondary foreground | `#172033` | Copy on Secondary |
| Muted | `#f3f6fa` | Low-emphasis section or card surface |
| Muted foreground | `#5f6b7c` | Supporting copy |
| Accent | `#dbe8f7` | Highlight surface distinct from Secondary |
| Accent foreground | `#102846` | Copy on Accent |
| Border / Input | `#d7dee8` | Structural outlines and input borders |
| Ring | `#496d9f` | Visible focus indication |

`#031d44` replaces the existing SNMIH Primary value. It is not introduced as an additional
free-form background option. Links continue to inherit Primary, so link and button color remain
consistent without a separate `--link` token.

### Dark mode

| Semantic token | Color | Purpose |
| --- | --- | --- |
| Background | `#08111f` | Main dark canvas |
| Foreground | `#f3f7fc` | Primary page copy |
| Card | `#0d1a2c` | Default elevated surface |
| Card foreground | `#f3f7fc` | Default card copy |
| Primary | `#8fb7ea` | Accessible light brand tint for controls and links |
| Primary foreground | `#031d44` | High-contrast copy and icons on Primary |
| Secondary | `#17283f` | Quiet cool-blue surface |
| Secondary foreground | `#edf4fc` | Copy on Secondary |
| Muted | `#142238` | Low-emphasis surface |
| Muted foreground | `#a9b7c9` | Supporting copy |
| Accent | `#1d3554` | Highlight surface |
| Accent foreground | `#f3f7fc` | Copy on Accent |
| Border / Input | `#2b3c52` | Structural outlines and input borders |
| Ring | `#8fb7ea` | Visible focus indication |

The exact brand navy is too close to the dark canvas to function as an interactive Primary color.
Dark mode therefore uses a lighter tint from the same blue family for links, controls, focus, and
selected states, while retaining `#031d44` as the Primary foreground. This preserves brand identity
and usable contrast instead of mechanically repeating the light-mode hex value.

Destructive, chart, sidebar, popover, and other supporting SNMIH tokens must be reconciled with
these foundations. Sidebar Primary follows the same Primary contract rather than maintaining an
unrelated blue.

## Top-Level Block Authoring Contract

Every configurable visual block uses two top-level tabs:

### Content

Contains data that determines what the block communicates:

- eyebrow, title, description, and rich text
- media and relationships
- item, card, slide, profile, stat, or programme collections
- destinations and visible action labels
- content-specific display decisions such as item count or source selection when those decisions
  describe content rather than presentation

### Theme Settings

Contains presentation and semantic appearance controls:

- shared block appearance group
- background and border choices
- spacing / size
- width and content alignment
- grid columns, media placement, aspect treatment, and layout variants
- action presentation such as Button versus Link Text and button variant
- block-specific visual behavior such as dividers when it changes presentation rather than data

Existing tabs named **Layout**, **Layout & Theme**, **Style**, or another presentation label are
normalized to **Theme Settings**. Existing content-oriented labels such as **Slides** may become
Content where this can be done without changing the mental model or stored field paths.

Payload tabs remain unnamed containers. Moving existing fields between unnamed tabs changes only
admin organization; it does not introduce a nested data key and therefore does not require a data
migration.

## Nested Visual-Card Contract

A row receives nested **Content** and **Theme Settings** tabs when the row renders as an independent
visual unit with its own surface. This includes tiles, cards, programme cells, profile cards,
testimonial cards, service cards, highlight cards, bento items, and comparable units.

### Card Content tab

Contains the card's:

- icon or media
- title, metadata, description, and supporting copy
- relationship or custom destination
- visible action label
- content-specific badges or attribution

### Card Theme Settings tab

Contains semantic presentation controls that apply only to that card. The initial shared control
is **Background**, with these values:

- Default Card
- Primary
- Secondary
- Muted
- Accent

Additional existing card-specific visual fields—such as image position, span, emphasis, or action
variant—belong in this tab when they are genuinely per-card settings.

The tabs are unnamed Payload tabs inside the array row, preserving the current item field paths.
Existing documents continue to resolve to Default Card when the new background value is absent.

## Applicability Audit

The implementation must classify every block array by rendered meaning rather than adding tabs
mechanically.

### Visual card or tile collections

These are expected to adopt nested Content / Theme Settings tabs and a semantic card background
where their renderer has an independent surface:

- Program Matrix and Program Grid
- Icon Grid, Bento Grid, Feature Matrix, and Content Highlights
- Services, Profiles, Team, Testimonials, Awards, and Downloads
- media cards or slides in Media Carousel where a card surface exists
- Page Header key facts and About Section value/stat cards where those elements render as cards
- Numbered Steps or comparable step cards when the variant has a discrete surface

Each renderer must be inspected before conversion. If a listed collection is intentionally
borderless or only a typographic row, it keeps the nested tab organization only when there are
real per-item visual settings; it must not gain an artificial card shell merely to expose a
background picker.

### Structured visual items that are not cards

Timeline nodes, tab panels, stats strips, and similar structures should receive per-item semantic
surfaces only if their current design already treats each item as a bounded visual unit. This work
must not turn connected timelines, seamless matrices, or editorial lists into detached cards.

### Utility collections excluded from nested theme tabs

The following are content/behavior rows rather than visual cards and must not receive empty Theme
Settings tabs:

- navigation menu items and submenu children
- header, footer, and section CTA button arrays
- breadcrumbs
- announcement messages
- footer link groups and individual links
- Q&A entries unless a future design exposes a meaningful per-entry surface
- raw gallery/image collections
- logo entries

Their parent block still follows the top-level Content / Theme Settings contract.

## Shared Schema Helpers

Introduce small shared Payload field factories instead of copying tab and surface definitions:

- a semantic surface select factory with one source of truth for labels, values, and defaults;
- a nested card-tab factory that accepts content fields and optional theme fields;
- a top-level block-tab helper only if it can accommodate existing block-specific fields without
  obscuring their schemas.

The helper output uses Payload `Field`, `ArrayField`, `TabsField`, and related types explicitly.
Helpers must return fresh field objects so one block cannot mutate another block's schema.

`createBlockAppearanceFields()` remains the shared parent-block appearance entry point. Card
surfaces reuse the same semantic vocabulary but retain **Default Card** rather than the parent
block's **None**, because the two choices have different rendering meaning.

## Shared Rendering Contract

Add or extend one shared surface resolver that returns the complete semantic class contract for a
selected surface:

- background
- primary foreground
- secondary/supporting foreground
- icon color
- border and divider color
- Link Text color and hover color
- button treatment when a button variant would otherwise disappear into the surface

The resolver must support both block and card contexts without hard-coded SNMIH colors. Components
consume semantic Tailwind classes backed by CSS variables, so all installed themes and dark mode
continue to work.

Default Card resolves to `card` / `card-foreground`. Primary, Secondary, Muted, and Accent resolve
to their matching semantic tokens and appropriate foreground tokens. Interactive elements on a
colored surface must not use the same fill as their container unless the resolver supplies an
inverse or outline treatment with sufficient separation.

## Layout and Visual Behavior

- Adding a background option must not alter a block's grid, spacing, radius, or card dimensions.
- Existing connected layouts, internal dividers, and image crops remain intact.
- Radius always comes from the active theme's shared radius tokens; the new schema does not add a
  per-card radius picker.
- Text styles and spacing continue to use each block's established shared scale.
- Foreground and icon colors switch automatically with the selected surface.
- Hover and focus states remain visible in light and dark modes.
- Cards with no configured surface retain their current Default Card appearance.

## Backward Compatibility and Migration

No database migration is required:

- top-level and nested tabs are unnamed organization containers;
- existing field names are preserved;
- newly added card background selects default to Default Card;
- renderers treat `undefined`, `null`, and unknown legacy values as Default Card;
- other theme preset CSS files are not modified.

Generated Payload types must be refreshed after schema changes. Type changes should be additive
apart from admin-label normalization.

## Accessibility and Theme Verification

- Verify Primary foreground contrast for text and icons in SNMIH light mode.
- Verify the lighter dark-mode Primary against the dark canvas and `#031d44` Primary foreground.
- Verify supporting copy, borders, and dividers on every surface in both modes.
- Verify keyboard focus rings are visible on every surface.
- Verify links remain identifiable without relying only on color where the component convention
  includes an underline, arrow, or button treatment.
- Verify disabled, hover, selected, and active states do not collapse into their surface.
- Do not use raw `white`, `black`, or SNMIH-specific hex values in block components.

## Testing Strategy

### Schema tests

- every eligible top-level block exposes Content and Theme Settings in that order;
- former Layout / Layout & Theme tabs no longer remain on normalized blocks;
- eligible visual-card rows expose nested Content and Theme Settings tabs;
- excluded utility arrays do not receive meaningless Theme Settings tabs;
- semantic card background options and Default Card behavior are consistent;
- existing field names and field paths are unchanged.

### Renderer tests

- each surface resolves the expected semantic background and foreground contract;
- missing or invalid surface values fall back to Default Card;
- icons, supporting copy, dividers, Link Text, and buttons adapt to the chosen surface;
- connected layouts retain their established divider and radius behavior;
- production and live-preview renderers remain in parity.

### Theme tests

- SNMIH light Primary resolves to `#031d44`;
- SNMIH dark mode uses the approved accessible tint and matching foreground;
- link, button, tab, focus, and sidebar Primary behavior follows the shared Primary token;
- other theme files remain unchanged.

### Regression verification

- regenerate Payload types;
- run focused schema and component tests for each rollout phase;
- run the complete integration test set, TypeScript, ESLint, and production build;
- inspect representative card-heavy, connected-layout, form, navigation, and dark-mode pages at
  mobile and desktop widths.

## Documentation

Update the block authoring guide to explain:

- the Content / Theme Settings convention;
- which item collections receive per-card theme controls;
- how semantic backgrounds adapt across themes and dark mode;
- why Default Card should be preferred unless a card needs visual emphasis;
- that SNMIH Primary is the global source for buttons, links, tabs, icons, and selected states.

Update the feature inventory only where the standardized authoring and surface capabilities change
documented block behavior.

## Out of Scope

- changing Default, Blue, Kodama, or Sunset theme palettes;
- adding raw hex, RGB, or OKLCH inputs to Payload;
- adding a separate link color token;
- introducing per-card radius, typography, or arbitrary CSS controls;
- turning borderless rows, galleries, navigation items, or connected timelines into cards;
- changing content wording or replacing existing media;
- committing or deploying the work.
