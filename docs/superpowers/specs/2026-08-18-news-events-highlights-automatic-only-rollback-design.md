# News & Events Highlights Automatic-Only Rollback Design

## Summary

Restore the existing `newsEventsHighlights` block to an automatic, collection-driven News & Events
carousel. Remove the recently introduced Manual Entries source and every manual-only schema, runtime,
preview, adapter, test, and documentation contract. Preserve the current carousel layout, default
image fallback, image-position override, media-overlay controls, section configuration, and theme
behavior.

The internal block slug and interface remain unchanged. The Payload Admin label returns to
`News & Events Highlights` because the block is again exclusively owned by the News & Events
collection.

## Payload Admin Contract

The Content tab keeps:

- Eyebrow
- Title
- Description
- Header action
- Footer actions

Remove `contentSource`, `manualSlides`, all manual slide fields, manual validation, and source-based
Admin conditions.

The Theme Settings tab keeps:

- Number of Items, always visible, with the existing one-to-six range and default of three
- Autoplay
- Empty State Message
- Image Position Override
- Overlay Tone
- Overlay Strength
- Overlay Direction
- Overlay Coverage
- Section appearance
- Section content alignment
- Section padding

The overlay defaults remain Dark tone, Darker strength, Bottom to Top direction, and Full coverage.
Image Position Override continues to support Use Item Setting, Center, Top, Bottom, Left, and Right.

## Runtime And Preview Data Flow

The production block always:

1. Normalizes Number of Items.
2. Loads the current published News & Events highlights.
3. Adapts the records to the carousel presentation model.
4. Renders the shared carousel.

There is no content-source branch and no manual-data fallback. A failed collection query produces an
empty item list and follows the existing Empty State Message behavior.

Live preview always requests and reads the collection-backed snapshot for the configured item count.
Preview-count collection no longer checks a content source.

## Presentation Boundaries

Keep the generic client-safe carousel item model because it cleanly separates collection records from
the interactive client component and supports the current optional rendering behavior. Remove only
manual-specific types, content-source normalization, action/media resolution, and manual adapters.
The automatic adapter remains and may be renamed to reflect that it is the sole adapter.

Preserve without visual changes:

- Large featured image panel and synchronized supporting rail
- Three equal supporting cards at tablet and desktop widths
- Horizontal supporting rail on phones
- Existing title and description typography and clamps
- Autoplay, hover/focus pausing, reduced-motion behavior, and navigation controls
- Classification badges, News/Event date formatting, and `Read more` actions
- Bundled SNMIH fallback image for missing or failed media
- Per-entry image position unless overridden at block level
- Configurable overlay tone, strength, direction, and coverage

## Cleanup And Compatibility

- Restore the Admin and thumbnail label to `News & Events Highlights`.
- Remove manual-only tests and replace source-selection assertions with automatic-only contracts.
- Regenerate Payload types so `contentSource` and `manualSlides` disappear while overlay and image
  controls remain.
- Update current operator and architecture documentation to describe automatic-only behavior.
- Keep historical specifications and plans as historical records; do not rewrite them.
- Existing blocks containing stale manual fields will ignore those unknown values after the schema
  rollback and load automatic News & Events records.
- Do not change News Grid or News & Events Tabs.

## Verification

Verify the Payload schema, automatic production loading, automatic live-preview snapshots, adapter
output, empty state, fallback image, position override, overlay settings, responsive carousel layout,
thumbnail definition and fixture, renderer registration, generated Payload types, TypeScript, lint,
and project-context contracts.

## Commit Policy

Keep the specification, implementation plan, and code changes uncommitted unless the user explicitly
requests a commit later.
