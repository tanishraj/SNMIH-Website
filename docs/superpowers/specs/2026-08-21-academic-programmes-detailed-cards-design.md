# Academic Programmes Detailed Cards Design

## Purpose

Remove the overlapping Study Pathways block and add the approved reference layout as a third presentation of the canonical Academic Programmes block.

The new presentation is named `Detailed Cards`. It keeps Academic Programmes as the single authoring model for programme directories while adding an icon-led, fact-rich card composition. It must follow the project's existing section container, spacing, header, typography, semantic surfaces, actions, filters, responsive behaviour, and accessibility conventions rather than reproducing the reference image's literal colours or measurements.

The user will manually remove saved Study Pathways instances before the updated schema is deployed or affected documents are edited. This change includes no migration, alias, legacy renderer, or compatibility adapter.

## Academic Programmes Schema

Keep the existing `academicProgrammes` block slug and all existing fields so current Academic Programmes records remain compatible.

Extend the `viewMode` select with:

- `Detailed Cards`, stored as `detailedCards`.

Keep `grid` as the schema default and runtime fallback. Existing records therefore retain their current presentation.

The existing `columns` control applies to both `grid` and `detailedCards`. It remains hidden for `list`. The existing two-, three-, and four-column settings and responsive caps remain available; the new presentation does not introduce a duplicate column control.

The existing `metadataPosition` control applies only to `grid` and `list`. Detailed Cards has a fixed information hierarchy and ignores this setting without deleting its saved value.

Extend each programme with:

- optional `icon`, authored through the shared Lucide icon field and used only by Detailed Cards;
- optional `facts` array with zero to four rows;
- each fact contains an optional Lucide `icon`, required `label`, and required `value`.

Retain and reuse these existing programme fields:

- `eyebrow` remains Study Level / Category and remains the filter source;
- `duration` becomes the optional top-right duration pill in Detailed Cards;
- `title` remains required;
- `description` remains optional;
- `ctaLabel`, link type, Page/custom destination, and new-tab setting remain the single per-card action configuration;
- `cardBackground` remains the per-card semantic surface selector.

The existing `image`, `badge`, `durationLabel`, `intakeLabel`, and `intake` fields remain supported by Grid and List. Detailed Cards does not render them, except for `duration` as its pill. This preserves existing data without adding ambiguous fallback mappings between older metadata and the new fact rows.

Admin descriptions must state which fields are presentation-specific. The authoring model must not infer Seats, Eligibility, Fee, icons, or labels from field order or wording.

## Runtime Normalization

The Academic Programmes server component remains responsible for normalizing CMS values into client-safe programme data.

- A non-empty title remains the only requirement for a programme to render.
- `viewMode` accepts `grid`, `list`, or `detailedCards`; unknown values fall back to `grid`.
- Programme and fact icons are trimmed and resolved against the project's Lucide naming contract. Because the cards live in an interactive client presentation, use Lucide's dynamic icon loader rather than eagerly bundling the complete icon catalogue. Invalid or empty icon names omit only the icon.
- Duration, description, category, fact labels, fact values, and action labels are trimmed.
- A fact renders only when both its label and value are non-empty.
- Valid facts retain authored order and are capped defensively at four.
- The component never infers, calculates, formats, translates, or validates programme facts as domain data.
- Link resolution continues through `resolveCmsLink`; an incomplete destination produces a non-linked informational card.
- Existing section, surface, alignment, filter, spacing, media, and action fallbacks remain unchanged.

The normalized client model carries icon names rather than React components so the server-to-client boundary remains serializable. Client-side icon resolution must normalize the same PascalCase, spaced, and kebab-case names accepted by existing icon fields, validate them before invoking Lucide's dynamic loader, and reserve the icon container's dimensions while the decorative SVG loads.

## Detailed Cards Presentation

Detailed Cards renders one semantic card per programme using the same card-surface resolver and full-card link contract as Grid and List.

Within each card, render in this order:

1. a top utility row with the optional programme icon at the left and optional duration pill at the right;
2. programme title;
3. optional description;
4. optional fact collection;
5. optional action at the bottom.

When only one utility-row item exists, it retains its natural side. When neither exists, the title closes the unused space without an empty row.

### Programme Icon

- Render the resolved Lucide icon inside a compact rounded-square semantic accent surface.
- Use the current card surface's icon and foreground language rather than hardcoded teal or green.
- The icon is decorative because the programme title supplies the accessible name; hide it from assistive technology.
- Do not substitute a default icon when the field is empty or invalid.

### Duration Pill

- Render the existing `duration` value as a compact top-right pill.
- Use semantic current-colour borders/backgrounds that retain contrast on Default, Primary, Secondary, Muted, and Accent cards nested in every supported section background.
- Omit the pill and its spacing when duration is empty.
- Do not display `durationLabel` in this presentation.

### Title and Description

- Reuse the shared sans-serif item-title and item-description classes.
- Preserve the established compact card scale instead of copying the reference image's serif title.
- Keep card text left-aligned regardless of section-header alignment because facts and action labels scan best from a consistent edge.

### Facts

- Render facts as a semantic description list.
- Each fact shows its optional decorative icon beside the metadata label, followed by its value.
- Labels reuse the shared compact metadata style; values use the shared sans-serif small body scale and medium weight.
- Facts use a responsive auto-fitting grid with a practical minimum item width. One narrow column expands to multiple columns only when the individual card has room.
- Facts wrap within their own cells. Long values must not force horizontal page overflow.
- Empty or invalid facts do not leave blank cells, separators, or gaps.
- The fact collection does not use positional dividers, because its column count can change independently at different card widths.

### Action and Card Interaction

- A valid programme destination keeps the entire card as the single anchor; do not add a nested link.
- Render the existing CTA label and shared animated `ActionArrow` as the visible action affordance.
- Place the action after facts and align it to the card bottom with flexible space so equal-height cards maintain a consistent baseline.
- Use the shared surface link colour and visible full-card focus ring.
- Apply hover treatment to the complete linked card, not individual fact cells.
- Keep all motion behind the project's reduced-motion conventions.

## Grid and Responsive Behaviour

Detailed Cards uses the existing Academic Programmes column setting:

- every setting renders one column on small screens;
- two columns begin at the existing medium breakpoint;
- three columns use two at medium and three at large;
- four columns use two at medium and four at extra-large.

Cards stretch to equal height within each grid row. Their internal fact grids respond to available card width, so selecting three or four outer columns does not force three cramped fact columns.

Use the existing Academic Programmes grid gap and regular block container. Do not introduce Study Pathways' custom bordered inner section, asymmetric splits, fixed card heights, image overlays, or card-span rules.

Category filtering remains available and behaves identically across Grid, List, and Detailed Cards. The category value is not repeated visually inside Detailed Cards; it remains represented by the active filter context when filters are enabled and by the authored programme content otherwise.

## Theming and Accessibility

- Resolve each card with `resolveCardSurface` against the section background.
- Use only semantic theme utilities and the shared surface classes; add no literal design-reference colours.
- Keep Default cards legible on Page, Subtle, Brand, Gradient Subtle, and Gradient Brand sections.
- Keep Primary, Secondary, Muted, and Accent cards legible on every section background.
- Use real headings for programme titles, a description list for facts, and real anchors for valid destinations.
- Preserve target, rel, and new-tab behaviour from resolved CMS links.
- Icons are decorative and must not become the only carrier of meaning.
- Preserve visible keyboard focus, adequate target size, readable wrapping, and reduced-motion behaviour.

## Study Pathways Removal

Remove Study Pathways from every active block-system surface:

- Pages, Reusable Sections, and News & Events Detail Template block registries;
- production and live-preview renderers;
- the `src/blocks/StudyPathways` source module;
- block-thumbnail definitions, fixtures, and generated thumbnail asset;
- Study Pathways-focused tests and registration expectations;
- generated Payload types and block unions;
- maintained block operator and architecture documentation;
- generated project inventory through the required project-context update loop.

Do not rewrite historical files under `docs/superpowers/**` that describe Study Pathways' earlier implementation. This new design and its implementation plan remain the historical record of the removal decision.

No existing Study Pathways field is migrated into Academic Programmes. Removing or replacing saved Study Pathways content is an explicit manual prerequisite.

## Empty and Edge States

- A missing section title continues to suppress the complete Academic Programmes block.
- Programmes with blank titles are omitted; if none remain, suppress the block.
- Missing programme icon, duration, description, facts, or link removes only that element and closes its spacing.
- A Detailed Card with only a title remains a valid compact informational card.
- Invalid icon names do not throw and do not create empty icon containers.
- More than four runtime facts are ignored after the fourth valid authored row.
- Unknown layout values fall back to Grid.
- Existing Academic Programmes records render exactly as before unless `Detailed Cards` is explicitly selected.

## Verification

Update or add focused tests covering:

- the `detailedCards` schema option and Grid fallback;
- column visibility for Grid and Detailed Cards and hiding for List;
- metadata-position visibility for Grid/List and hiding for Detailed Cards;
- programme icon and zero-to-four fact field contracts;
- normalization of whitespace, invalid icons, incomplete facts, and excess runtime facts;
- utility-row combinations: both icon and duration, either one, and neither;
- fact ordering, semantic description-list markup, wrapping classes, and responsive auto-fit behaviour;
- the action's bottom alignment, single-anchor contract, new-tab attributes, arrow placement, hover, and focus behaviour;
- Default and explicit card surfaces inside light and dark section backgrounds;
- unchanged Grid/List rendering and filtering contracts;
- Study Pathways absence from all registries, renderers, thumbnails, fixtures, focused tests, generated types, and maintained documentation.

Regenerate Payload types. Run focused Academic Programmes tests, client interaction tests, page/live-preview/thumbnail/theme/section contracts, TypeScript, targeted lint, the repository layout detector, and the required `project-context:update` and `project-context:check` loop. Regenerate and visually inspect the Academic Programmes thumbnail at desktop and mobile sizes.

Preserve unrelated workspace changes. Do not stage, unstage, or commit any files.
