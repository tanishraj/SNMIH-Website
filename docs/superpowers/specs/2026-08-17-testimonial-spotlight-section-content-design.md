# Testimonial Spotlight Section Content Design

## Goal

Extend `Testimonial Spotlight` with the same optional section-level introduction and action controls used by established content blocks while preserving the existing image-and-message container exactly as the primary visual composition.

The rendered order is:

1. optional section header;
2. existing testimonial image-and-message container;
3. optional footer actions.

Existing stored blocks with none of the new fields must retain their current markup, spacing, styling, validation, and responsive layout.

## Additive Content Schema

The existing testimonial-container fields retain their names and behavior:

- `image`;
- `eyebrow`;
- `title`;
- `testimonial`;
- `description`;
- `personName`;
- `designation`.

The Content tab adds these optional section-level fields:

1. `sectionEyebrow`: text with an Admin description identifying it as the label above the section title.
2. `sectionTitle`: text for the outer section heading.
3. `sectionDescription`: textarea for supporting copy beneath the outer heading.
4. `actions`: shared content-actions array labeled `Section Actions`, with at most two rows.
5. `footerActions`: shared content-actions array labeled `Footer Actions`, with at most two rows.

The Admin order groups authoring by rendered location:

1. section eyebrow, title, description, and actions;
2. the existing image-and-message fields in their current relative order;
3. footer actions.

Both action arrays use `createContentActionsField()` and therefore preserve the project-wide page/custom URL model, per-action link or button display mode, button variants, optional arrow, and new-tab behavior. No Testimonial Spotlight-specific action schema is introduced.

## Theme Settings

Add `sectionContentAlignment` to the existing Theme Settings tab:

- label: `Section Content Alignment`;
- values: `left` and `center`;
- default: `center`;
- required for newly authored blocks;
- renderer fallback: `center` when the value is absent from an older document.

The setting controls only the optional outer section eyebrow, title, description, and section actions. It must not change the alignment inside the existing testimonial container or the image placement. Footer actions remain centered through the standard `BlockFooterActions` behavior.

All existing appearance, container surface, outline, media placement, focal position, fill, section padding, and inner vertical-alignment controls remain unchanged.

## Presentation

### Section header

The outer header renders only when at least one of `sectionEyebrow`, `sectionTitle`, `sectionDescription`, or a valid resolved section action is present. An absent header emits no header wrapper and creates no additional spacing.

The header composes existing primitives and shared classes:

- `SectionEyebrow` using the outer section background from `resolveBlockAppearanceClasses()`;
- `contentSectionHeadingClasses` for the optional section title;
- `contentSectionDescriptionClasses` for the optional section description;
- `ContentActions` for resolved section actions.

Its internal layout follows the standard block header rhythm: a vertical `gap-4`, a maximum readable width of `max-w-3xl`, and consistent Left or Center alignment. Center alignment uses centered margins, centered text, and centered action layout; Left alignment uses start alignment and left-aligned actions. Section actions receive the standard small separation beneath the descriptive copy.

The header and existing testimonial container use the established generous block-level separation equivalent to the common `mb-12`/`gap-12` header-to-content rhythm. Spacing must be applied once at the appropriate wrapper for each media fill mode; it must not double the existing section padding.

### Existing testimonial container

The current image-and-message composition remains visually unchanged:

- the configured image remains on the selected side at desktop and first on mobile;
- the existing inner eyebrow, message title, testimonial, description, name, and designation keep their current styles and order;
- the inner container continues to resolve its own semantic background, foreground, secondary text, outline, radius, and clipping independently from the outer section;
- contained, contained-fill, and edge-to-edge media behavior remain intact.

The outer section header always resolves contrast against the outer section appearance. The existing inner eyebrow continues to resolve against the testimonial container surface. These two surface contexts must remain independent.

### Footer actions

`BlockFooterActions` renders after the complete testimonial container. It remains centered and uses the shared default top spacing. In edge-to-edge mode, footer actions still use the regular section container so they do not touch the viewport edge.

If no valid footer actions resolve, the footer wrapper emits no visible content or spacing.

## Heading Semantics

When `sectionTitle` is present:

- the outer section title is an `h2`;
- the existing inner message title becomes an `h3` while retaining exactly the same visual class list.

When `sectionTitle` is absent, the existing inner message title remains an `h2`. An eyebrow, description, or section action without `sectionTitle` does not demote the inner title because no outer heading was introduced.

This preserves a logical heading outline without altering the established visual hierarchy.

## Responsive Behavior

- The optional section header remains inside the regular maximum-width section container at every viewport.
- Left and Center alignment remain consistent across mobile and desktop.
- Section actions reuse `ContentActions`, stacking buttons on narrow screens and wrapping links/buttons according to the shared action contract.
- The existing testimonial container retains its current mobile-first stacking and desktop split.
- Edge-to-edge media remains edge-to-edge; only section-level header and footer content are constrained to the regular container.
- Long titles, descriptions, translated copy, and multiple actions may wrap without clipping or horizontal overflow.

## Compatibility and Failure Behavior

This is an additive schema change. No existing field is renamed, moved into a nested object, or removed, and no content migration is required.

Older documents without the new fields render through the same legacy branch as before:

- no new wrappers;
- no new spacing;
- no heading-level change;
- no action markup;
- no change to current required-content guards.

Whitespace-only section text is treated as absent. Invalid or incomplete actions are discarded by `resolveCmsActions()`. The block continues to return `null` only when its existing required media, message title, or person name cannot be resolved.

## Accessibility

- Heading levels adapt only when an outer section title exists.
- Section and footer actions reuse the shared accessible link/button rendering, focus styles, target behavior, and visible labels.
- Visual alignment does not change DOM order.
- The DOM order remains section header, testimonial composition, footer actions.
- The existing quotation semantics, image alt source, source order, and mobile stacking behavior remain unchanged.
- Empty optional content produces no empty headings, paragraphs, action containers, or landmark-like wrappers.

## Project Integration

Implementation updates:

- `src/blocks/TestimonialSpotlight/config.ts`;
- `src/blocks/TestimonialSpotlight/Component.tsx`;
- generated `src/payload-types.ts`;
- Testimonial Spotlight config and rendering tests;
- Testimonial Spotlight thumbnail fixture and generated JPEG so the picker demonstrates the section-level capability;
- the project-context block-system narrative and generated inventory;
- maintained block documentation if its field summary requires expansion.

No collection registration, renderer switch, slug, interface name, global theme CSS, or shared action primitive changes are required.

## Testing and Verification

Focused schema tests verify:

- exact Content-tab order and preservation of existing fields;
- optional section eyebrow, title, and description fields;
- shared Section Actions and Footer Actions arrays, maximum row counts, and nested action contracts;
- `sectionContentAlignment` label, Left/Center options, required authoring default, and renderer-compatible fallback.

Focused renderer tests verify:

- section eyebrow, title, description, and actions appear before the existing testimonial container;
- footer actions appear after the container;
- Left and Center header alignment classes and action alignment;
- the section eyebrow follows the outer appearance surface while the existing inner eyebrow follows the container surface;
- the outer title uses `h2` and conditionally demotes the inner message title to visually identical `h3` markup;
- the inner title remains `h2` when no section title exists;
- empty new fields preserve the current legacy wrapper, spacing, and rendered hierarchy;
- invalid actions create no empty action layout;
- contained, contained-fill, and edge-to-edge modes keep their current media and container behavior;
- production and live-preview renderers continue to render the block.

Completion verification includes:

- `pnpm generate:types`;
- focused Testimonial Spotlight config and renderer tests;
- relevant page-block, live-preview, action, spacing, thumbnail, and theme contracts;
- touched-file lint;
- regenerated and visually inspected 1600×900 Testimonial Spotlight thumbnail;
- `pnpm project-context:update` and `pnpm project-context:check`;
- the complete integration suite, with unrelated pre-existing failures reported rather than changed.
