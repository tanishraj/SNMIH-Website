# Content Highlights Configuration Cleanup

## Goal

Replace the overlapping Content Highlights layout, treatment, and divider controls with a small set of independent presentation settings. Every card must support a configurable eyebrow, generic metadata, title, description, action, and semantic background while preserving existing published content through runtime normalization.

## Design Direction

The block remains a quiet academic index. Typography, color, spacing, section appearance, shared actions, and semantic card surfaces continue using the incumbent design system. The cleanup changes information structure and control naming; it does not introduce new colors, shadows, icons, or decorative effects.

Card hierarchy is consistent in every presentation:

1. card eyebrow;
2. metadata;
3. title;
4. description;
5. action footer.

Empty optional fields render no element and reserve no space.

## Card Content Model

Each item retains the shared Content and Theme Settings tabs.

The Content tab contains:

- `markerMode`, relabeled **Card Eyebrow**, with Numbered, Custom Text, and Hidden choices;
- `markerLabel`, relabeled **Custom Eyebrow**, shown only for Custom Text;
- `metadata`, an optional generic single-line text field;
- `title`, required;
- `description`, optional;
- `cardAction`, the existing shared action control with at most one action.

The existing `markerMode` and `markerLabel` storage keys remain unchanged so saved numbered and custom eyebrow content requires no migration. Numbered eyebrows continue using the rendered item position after unusable rows are removed. Metadata is plain text rather than a date field, allowing dates, categories, durations, sources, or other short contextual labels.

The Theme Settings tab retains `cardBackground`. The card action retains shared destination, link/button mode, variant, arrow, new-tab, focus, and surface-contrast behavior.

## Visible Block Controls

Theme Settings presents these controls after shared section appearance:

1. `cardLayout`, labeled **Card Layout**:
   - Grid, default;
   - List.
2. `cardStyle`, labeled **Card Style**:
   - Open, default;
   - Left Rule;
   - Boxed;
   - Divided.
3. `gridColumns`, labeled **Grid Columns**, shown only for Grid:
   - 2 Columns;
   - 3 Columns, default.
4. `eyebrowPlacement`, labeled **Eyebrow Placement**:
   - Stacked, default;
   - Inline.
5. existing Header Layout, alignment, and section-size controls.

The current editor-facing `layout`, `itemTreatment`, and `ruledDividers` controls are removed from the visible admin interface because their combinations overlap. Their stored values remain accepted as hidden legacy inputs until content has been migrated.

Presentation settings are block-wide. Individual cards control content and background only; they cannot choose their own layout, style, or eyebrow placement.

## Layout Behavior

### Grid

- One column on mobile.
- Two or three equal columns from supported responsive breakpoints according to Grid Columns.
- Split header composition limits the item area to two columns even when 3 Columns is selected.
- Equal-height rows come from grid stretching and card flex layout, never fixed heights.

### List

- One full-width item per row at every breakpoint.
- Inline eyebrow placement uses a stable left rail and a flexible content column.
- Stacked placement keeps the eyebrow within the content column above metadata.

## Card Style Behavior

### Open

No default border, enclosing background, or shadow. Explicit card backgrounds remain padded and use semantic foreground colors.

### Left Rule

Every card owns one `2px` left border. Cards retain normal layout gaps. No centered or shared vertical divider is rendered.

### Boxed

Every card owns a fine four-sided semantic border with the established radius and padding. No shadow is introduced.

### Divided

- List uses continuous horizontal separators between rows, including the outer top and bottom rules.
- Grid uses coordinated horizontal row rules and responsive column rules.
- Rules belong to the coordinated collection geometry rather than appearing as disconnected card fragments.

## Eyebrow Placement

### Stacked

The eyebrow sits above metadata and title. Metadata follows the eyebrow, then title and description.

### Inline

The eyebrow occupies a stable left rail. Metadata, title, description, and action occupy the flexible right content column. When the eyebrow is Hidden, no empty rail is reserved and the content expands to the full card width.

The action footer aligns with the text content column in Inline mode. Its existing subtle top separator remains because the user previously established action separation as part of this component.

## Legacy Compatibility

New presentation fields take precedence when present. When they are absent, the renderer maps saved legacy values as follows:

- `editorialRow` maps to List;
- `highlightsGrid` maps to Grid with 3 Columns;
- `simpleGrid` maps to Grid with 2 Columns and Inline eyebrow placement;
- `numberedSteps` maps to Grid + Boxed with 3 Columns;
- Open maps to Open;
- Boxed maps to Boxed;
- Ruled plus Individual Items maps to Left Rule;
- Ruled plus Rows Only or Full Grid maps to Divided;
- Automatic Editorial List maps to List + Divided;
- Automatic Calm Grid maps to Grid + Boxed;
- Automatic Simple Grid maps to Grid + Open + 2 Columns + Inline eyebrow placement.

Unknown values use Grid, Open, 3 Columns, and Stacked. Existing hidden legacy fields remain in the Payload schema temporarily so old documents can open and resave without losing their presentation. No database migration is required in this task.

## Rendering Boundaries

The renderer resolves content once, resolves presentation once, then renders reusable card content in Grid or List geometry. It must avoid duplicating complete card markup per variant. Static class maps and small presentation helpers remain module-level; no client component, effect, state, or runtime measurement is introduced.

Section actions, footer actions, split/stacked section header behavior, appearance, semantic surfaces, size, and invalid-content guards remain unchanged.

## Accessibility And Responsiveness

- Section and card heading order remains semantic.
- Eyebrow and metadata remain text, not interactive badges.
- Hidden eyebrow mode removes both content and layout reservation.
- Long metadata, titles, descriptions, and actions wrap without overflow.
- DOM, reading, and keyboard order match visual order.
- Shared actions retain visible focus and new-tab safety.
- The 2px left rule and all divided/boxed rules use semantic surface-aware border colors.
- Mobile layouts collapse to one column with no orphaned divider geometry.

## Verification

Tests must cover:

- exact visible Content and Theme Settings field order;
- Card Eyebrow and Custom Eyebrow labels and condition;
- generic metadata schema and rendering;
- card action and card background retention;
- Grid/List, Open/Left Rule/Boxed/Divided, 2/3 columns, and Stacked/Inline eyebrow placement;
- hidden eyebrow removing the inline rail;
- action alignment and footer rule in Inline mode;
- divided List and responsive divided Grid geometry;
- legacy layout, automatic treatment, ruled divider, numbered-steps, and split-layout normalization;
- generated Payload types;
- public/live-preview renderer registration and blank-content guards.

Verification includes focused Vitest suites, Payload type generation, targeted ESLint, TypeScript, `git diff --check`, the layout detector, and a bounded desktop/mobile visual inspection when a browser surface is available.

## Scope

This task does not add card images or icons, per-card presentation settings, whole-card links, animation, new theme colors, a database migration, or changes to shared action behavior outside Content Highlights.
