# Featured Highlights Content Sources Design

## Summary

Extend the existing `newsEventsHighlights` block so editors can choose between automatically loaded
News & Events records and fully custom, editor-ordered slides. Both sources use one presentation
model and retain the block's current featured carousel, supporting rail, responsive behavior,
section configuration, and theme system.

The block keeps its internal slug and renderer registration. Its Payload Admin label changes from
`News & Events Highlights` to `Featured Highlights Carousel` because the block is no longer limited
to editorial records. Existing saved blocks remain automatic and require no data migration.

## Goals

- Preserve the current collection-driven behavior as the default.
- Add a fully manual content source that never queries the News & Events collection.
- Add the established image-position and media-overlay controls at block level.
- Keep the carousel layout and responsive rail identical for both sources.
- Reuse existing appearance, spacing, action, media, overlay, and preview conventions.
- Preserve live-preview and production-renderer parity.

## Non-goals

- Do not add a third mode for manually selecting News & Events relationships.
- Do not create a second carousel block or duplicate the existing presentation.
- Do not change the `newsEventsHighlights` block slug or require a content migration.
- Do not change the carousel dimensions, typography, clamping, rail behavior, or autoplay interval.
- Do not add new classification values to the News & Events collection.

## Payload Admin Model

### Block identity

- Internal slug: `newsEventsHighlights` (unchanged).
- TypeScript interface name: `NewsEventsHighlightsBlock` (unchanged).
- Admin label: `Featured Highlights Carousel`.

### Content tab

Keep the existing section-level fields unchanged:

- Eyebrow
- Title
- Description
- Header action
- Footer actions

Add a required `contentSource` select near the beginning of the Content tab:

- `automatic`: Automatic News & Events
- `manual`: Manual Entries

The default is `automatic`. Missing or invalid legacy values also resolve to `automatic`.

Add a conditional `manualSlides` array visible only when `contentSource` is `manual`. It supports
one to six editor-ordered rows. Validation requires at least one valid slide only when Manual mode
is active, so hidden manual fields never prevent Automatic blocks from saving.

Each manual slide contains:

- `title`: required text.
- `description`: optional textarea.
- `badgeLabel`: optional text.
- `date`: optional date field.
- `image`: optional image upload related to Media.
- `imagePosition`: Center, Top, Bottom, Left, or Right; defaults to Center.
- `action`: optional single action using the existing internal-page/custom-URL field model and a
  customizable label. It renders with the carousel's existing text-link treatment.

The image uses its Media alt text. A missing or failed image uses the bundled SNMIH fallback image
as decorative content, matching the current automatic behavior.

### Theme Settings tab

Keep these shared settings available for both sources:

- Autoplay
- Empty State Message
- Block appearance
- Section content alignment
- Section padding

Keep Number of Items visible only in Automatic mode. It retains the current one-to-six range and
normalization behavior. Manual mode derives its count from the configured slide array.

Add these block-wide feature-image settings:

- `imagePositionOverride`: Use Item Setting, Center, Top, Bottom, Left, or Right. The default is Use
  Item Setting.
- Overlay Tone, using the shared media-overlay field factory.
- Overlay Strength, using the shared media-overlay field factory.
- Overlay Direction, using the shared media-overlay field factory.
- Overlay Coverage, using the shared media-overlay field factory.

Defaults must reproduce the current hardcoded appearance: Dark tone, Darker strength, Bottom to Top
direction, and Full coverage. The block-level image-position override applies to every slide when it
is not Use Item Setting. Otherwise automatic records use `featuredImagePosition`, while manual
slides use their own `imagePosition`.

## Shared Presentation Model

Introduce a generic presentation item owned by the Featured Highlights carousel rather than making
manual content impersonate `PublicNewsEventCard`. The model contains only what the carousel needs:

- Stable ID
- Title
- Optional description
- Optional badge label and badge presentation
- Optional date value and formatted date label
- Optional image and per-item image position
- Optional resolved action

An automatic adapter converts `PublicNewsEventCard` values into this model. It preserves current
classification labels and variants, formatted News/Event dates, images, and `/news-events/<slug>`
actions labelled `Read more`.

A manual adapter converts valid manual rows into the same model in editor order. Manual badges use a
neutral semantic badge style and are not tied to News & Events classifications. Manual dates use the
project's existing date formatting convention. Missing optional values remain absent rather than
being replaced by empty strings or empty elements.

## Runtime Data Flow

The server block component resolves `contentSource`, defaulting legacy values to Automatic.

Automatic mode:

1. Normalize Number of Items.
2. Load the current published mixed News & Events feed.
3. Adapt the records to generic carousel items.
4. Render the shared presentation.

Manual mode:

1. Do not call the News & Events loader.
2. Normalize and filter the configured manual rows.
3. Resolve their optional actions and media.
4. Render the same shared presentation.

The preview snapshot loader requests collection data only for Automatic Highlights blocks. Manual
blocks render directly from the incoming draft block data. A block with no usable items displays its
configured Empty State Message; without a message, it does not render.

## Presentation Behavior

The visual structure remains unchanged:

- Large featured panel on the left.
- Three synchronized equal-height supporting cards on tablet and desktop.
- Horizontal supporting-card rail on phones.
- Existing title and description clamps, vertically centered rail content, carousel controls,
  autoplay timing, hover/focus pause behavior, and reduced-motion handling.

Optional badge, date, description, and action elements render only when present. Their absence must
not leave blank wrappers or reserved spacing. Automatic badges keep their classification variants;
manual badges use the neutral semantic variant.

The resolved overlay settings are passed through the server presentation into the client carousel
and replace the current hardcoded overlay constant. The overlay and image-position override affect
only the featured image; supporting cards remain text-only.

## Error and Fallback Handling

- A failed Automatic query produces an empty item list and follows the shared empty-state behavior.
- Missing or unusable manual rows are ignored defensively; Payload validation prevents publishing a
  Manual block without at least one valid titled slide.
- Missing, unpopulated, or failed images use `/images/snmih-news-events-default.png`.
- Invalid `contentSource`, image-position, or overlay values fall back to backward-compatible
  defaults.
- An incomplete manual action is omitted instead of producing an unusable link.
- Carousel indexing remains safe when switching source or reducing the number of items in preview.

## Backward Compatibility

- Existing blocks have no `contentSource`; they resolve to Automatic.
- Existing blocks have no overlay fields; they render with Dark, Darker, Bottom to Top, Full—the
  current visual output.
- Existing per-record image positions remain effective because Use Item Setting is the default.
- Existing item count, empty state, actions, appearance, alignment, spacing, and autoplay values are
  retained.
- The unchanged slug avoids data migration and preserves Page and Reusable Section renderer cases.

## Verification

Add or update focused contracts for:

- Admin label, source options, defaults, conditional fields, slide limits, and manual validation.
- Automatic legacy fallback and unchanged query behavior.
- Manual mode avoiding the News & Events query.
- Automatic and manual adapters producing the shared presentation model.
- Optional badge, date, description, image, and action rendering.
- Internal and custom manual action resolution.
- Missing and failed image fallback behavior.
- Per-item positions and block-level image-position overrides.
- Overlay tone, strength, direction, and coverage resolution.
- Empty-state behavior in both modes.
- Preview snapshots excluding Manual blocks from automatic collection loads.
- Production and live-preview renderer parity.
- Existing responsive dimensions, carousel rail behavior, accessibility, and reduced motion.

Regenerate Payload types and the block thumbnail, then run the focused block, preview, registration,
thumbnail, theme, TypeScript, lint, project-context update, and project-context check commands
required by the repository's block change contract.

## Documentation

Update the block operator guide and project-context block-system reference to describe the renamed
Admin label, the two content sources, manual slide fields, source-specific settings, overlay controls,
image override precedence, and backward-compatible defaults.

## Commit Policy

Keep the specification, plan, and implementation uncommitted unless the user explicitly requests a
commit later.
