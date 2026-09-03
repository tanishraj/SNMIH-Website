# Academic Programmes Consolidation Design

## Purpose

Consolidate the overlapping Program Grid and Academic Programmes blocks into one canonical Academic Programmes block.

Academic Programmes remains the visual and architectural base because it already uses the project's current shared container, spacing, typography, surface, media, action, and responsive primitives. The useful Program Grid capabilities move into Academic Programmes without carrying over Program Grid's older styling or redundant global action settings.

The user will manually remove every saved Program Grid instance from Pages and Reusable Sections before the updated schema is deployed or those documents are edited. This change therefore includes no data migration, legacy renderer, or compatibility adapter.

## Consolidated Content Model

Keep the existing Academic Programmes block slug and existing field names so current Academic Programmes entries remain compatible.

Extend Theme Settings with:

- `viewMode`, required select, default `grid`, with `Grid` and `List` options;
- `showFilter`, checkbox, default `false`;
- the existing `columns` field, shown only when `viewMode` is `grid`.

Extend each programme with optional:

- `badge`, a short supplementary label;
- `duration`, editor-authored duration text;
- `intake`, editor-authored intake text.

Retain the existing programme fields:

- `image`, changed from required to optional;
- `eyebrow`, still labelled `Study Level / Category` and used both as the visible card eyebrow and the filter category;
- required `title`;
- optional `description`;
- per-card `ctaLabel`;
- link type, Page or custom URL destination, and new-tab setting;
- card background settings.

Increase the programme array maximum from 6 to 24 while retaining a required array with at least one row. Programme order remains editor-controlled.

Do not add Program Grid's separate category field, global CTA label, global action mode, or action variant. The existing Academic Programmes per-card link label and full-card link treatment are clearer, avoid repeated settings, and already follow current project conventions.

## Runtime Normalization

The server component continues to trim and validate author-entered values before rendering.

- A programme requires only a non-empty title to render.
- An invalid or missing image produces a text-led programme card instead of removing the programme.
- Badge, category/eyebrow, description, duration, intake, and CTA label are trimmed and omitted when empty.
- The existing `Explore programme` CTA-label fallback remains.
- Link resolution continues through `resolveCmsLink`; an invalid or incomplete destination produces a non-linked card.
- Columns accept only `2`, `3`, or `4`, falling back to `3`.
- View mode accepts only `grid` or `list`, falling back to `grid`.
- Existing content alignment, header layout, description placement, side alignment, section size, block appearance, card surface, section actions, and footer actions keep their current defensive fallbacks.

Filter categories come from non-empty normalized `eyebrow` values in programme order. Duplicate values are collapsed using trimmed, case-insensitive comparison while the first authored spelling is preserved for display. Programmes without a category remain visible under `All` but do not create a blank filter.

If filtering is disabled or fewer than two distinct non-empty categories exist, no filter control is rendered. This avoids a redundant `All`-only or one-category control.

## Rendering Architecture

Keep `AcademicProgrammesBlockComponent` as a server component responsible for:

- resolving the section appearance and shared header/footer actions;
- normalizing programme text;
- resolving optional Media through `getMediaImageProps`;
- resolving links through `resolveCmsLink`;
- rendering the existing split or stacked section header;
- passing client-safe normalized programme data and display settings to a focused client presentation component;
- rendering footer actions after the programme presentation.

Add an Academic Programmes-owned client presentation component responsible only for:

- active filter state;
- accessible filter controls;
- deriving the visible programme subset;
- selecting the grid or list presentation.

Keep card/presentation helpers inside the Academic Programmes module. They use normalized client-safe data and shared styling utilities, not Payload documents. This boundary keeps CMS and link/media resolution on the server while limiting client JavaScript to the interactive filtering region.

## Section Header and Spacing

The current Academic Programmes header remains the visual authority.

- Use `regularBlockContainerClasses` and `regularBlockMobilePaddingClasses`.
- Use the existing shared content heading, description, item-title, and item-description styles.
- Preserve the current split-header grid and its description/action placement controls.
- Preserve the corrected stacked-header behaviour: a full-width `max-w-3xl` intro whose outer position follows left, centre, or right alignment and whose contents use the same alignment.
- Continue deriving the section-to-content gap from the selected section size.

Filters, programme layouts, and footer actions fit inside this existing rhythm. Program Grid's custom `max-w-screen-2xl`, bespoke intro type scale, rounded-pill spacing, and independent gaps are not copied.

## Filter Controls

When enabled and useful, render an `All` control followed by the derived categories between the section header and programme content.

- The control group follows the section content alignment.
- Controls reuse `getContentTabRailClasses` and `getContentTabClasses` from the shared content-tab rail with the `pill` variant, matching the established Program Grid filter shape through the current shared implementation rather than copying its CSS.
- The active control uses the primary surface with sufficient foreground contrast.
- Inactive and hover states remain legible on page, subtle, brand, and gradient-brand section backgrounds.
- Narrow viewports use contained horizontal overflow so controls remain on one readable line without widening the page.
- Controls use tab semantics with an accessible group label, selected state, roving tab index, Arrow Left/Right and Home/End navigation, visible keyboard focus, and a labelled tab panel.
- Changing a filter updates the visible cards in place without navigation.

Because categories are derived from rendered programmes, selecting an available category cannot produce an empty result under static props.

## Grid Presentation

Grid is the default and preserves the current Academic Programmes editorial-card design.

- One column on small screens.
- Two-column setting: two columns from the medium breakpoint.
- Three-column setting: two columns at medium and three at large.
- Four-column setting: two columns at medium and four at extra-large.
- Retain the current card border, semantic surface, radius, full-height structure, focus ring, image motion, and ruled CTA treatment.
- Image-led cards retain the current responsive media height.
- Text-only cards omit the media region entirely and begin with the card content padding; no placeholder, fixed empty height, or decorative substitute is introduced.
- Mixed image and text-only cards remain independently readable and stretch to the grid row without manufacturing blank media space.

Within card content, render in this order:

1. optional badge;
2. optional Study Level / Category eyebrow;
3. title;
4. description;
5. optional metadata row containing Duration and Intake;
6. existing ruled CTA when a valid link exists.

Badge and eyebrow remain visually distinct: badge is a compact supporting marker, while the eyebrow uses the shared `SectionEyebrow` treatment. Duration and Intake use the shared metadata scale and semantic secondary colour. They remain editor-authored strings; the component performs no parsing, icon inference, pluralization, or calculation.

## List Presentation

List mode renders one programme per row and ignores the column setting.

- At medium and wider viewports, an available image occupies a bounded leading media column and content occupies the remaining width.
- Without an image, content uses the full row width.
- On narrow screens, image and content stack in document order.
- Badge, eyebrow, title, description, metadata, and ruled CTA retain the same hierarchy as grid cards.
- List cards use the same card surface, radius, border, link, focus, typography, and hover language as grid cards.
- The full card remains the single link target when a destination exists; no nested action is introduced.

The list is an alternative composition of the same programme data, not a second card design system.

## Theming, Interaction, and Accessibility

- Resolve every card with `resolveCardSurface` against the outer section background.
- Use semantic tokens and current shared surface helpers; add no raw SNMIH-specific colours.
- Keep hover effects on the complete linked card and image rather than individual internal cells.
- Respect `prefers-reduced-motion` through the project's existing motion-safe conventions.
- Preserve visible keyboard focus around the full linked card.
- Use proper headings for programme titles and real anchors for valid destinations.
- Preserve `target`, `rel`, and new-tab behaviour from resolved CMS links.
- Images use author alt text with the programme title as the existing fallback.
- Text-only cards remain complete and understandable without visual replacement content.
- Filter state is not required to understand or access programmes; `All` is the initial state.

## Program Grid Removal

After Academic Programmes gains the approved capabilities:

- remove `ProgramGridBlock` from Pages and Reusable Sections block arrays;
- remove `programGrid` cases and imports from production and live-preview block renderers;
- remove the `src/blocks/ProgramGrid` module;
- remove the Program Grid block-thumbnail definition, fixture, and generated thumbnail image;
- remove Program Grid-specific registration, fixture, and rendering expectations from tests;
- regenerate Payload types so `ProgramGridBlock` and its block union member disappear.

Do not add a migration, alias, fallback renderer, hidden legacy block, or deployment compatibility layer. Manual content deletion is an explicit prerequisite. Current Academic Programmes records require no migration because all new settings have runtime and schema defaults and newly optional fields are backward compatible.

## Empty and Edge States

- A missing section title continues to suppress the block.
- A programme with a blank title is omitted.
- If no valid titled programmes remain, suppress the block as today.
- A missing image produces a text-only card.
- Missing badge, category, description, duration, or intake removes only that element and its spacing.
- A missing or invalid link removes the CTA and anchor while retaining the informational card.
- Filtering with uncategorized programmes keeps those programmes available through `All`.
- Long programme titles, metadata values, and categories wrap without horizontal page overflow.
- Unknown view-mode and column values use the documented fallbacks.

## Verification

Update or add focused Academic Programmes tests covering:

- schema defaults, conditional column visibility, optional image, new programme fields, and the 24-row limit;
- generated Payload types;
- existing stacked and split header alignment behaviour;
- grid column mappings and invalid-value fallback;
- list structure and its responsive image/text composition;
- image-led, text-only, and mixed programme collections;
- badge, category, duration, and intake rendering;
- filter visibility thresholds, category ordering/deduplication, `All`, and client filtering;
- link resolution, non-linked cards, new-tab attributes, focus treatment, and ruled CTA;
- outer-section and nested-card surface combinations, including dark brand backgrounds;
- footer actions and existing shared spacing/type primitives;
- Program Grid absence from Pages, Reusable Sections, production rendering, live preview, thumbnails, fixtures, tests, and generated types.

Run Payload type generation, focused Academic Programmes tests, neighboring page/live-preview/thumbnail/theme tests, TypeScript, lint, the repository layout detector, and the required `project-context:update` and `project-context:check` loop. Inspect the regenerated Academic Programmes thumbnail at representative desktop and mobile widths.

Do not stage, unstage, or commit any files.
