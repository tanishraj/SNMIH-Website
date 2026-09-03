# Shared Calendar PDF Download Design

## Goal

Give both the Calendar and Annual Calendar blocks the same optional, block-level PDF download panel. The panel must remain readable inside the existing 20rem calendar sidebar, follow the selected semantic section surface, and avoid duplicated presentation or media-resolution logic.

## Scope

- Add the existing PDF upload, document-label, and button-label settings to Calendar.
- Share the PDF resolver and download-panel presentation between Calendar and Annual Calendar.
- Render the panel beneath each block's Upcoming panel.
- Keep all event queries, filters, cache keys, preview snapshots, navigation, and Upcoming behavior unchanged.

This work does not introduce a global calendar document, a generated PDF, or content migration.

## Editor Contract

Both calendar blocks expose the following block-level fields:

1. **Calendar PDF** — optional Media upload restricted to `application/pdf`.
2. **PDF Document Label** — optional text shown beside the document icon; defaults to `Academic calendar PDF`.
3. **PDF Button Label** — optional text shown inside the action; defaults to `Download`.

The two label fields appear only after a Calendar PDF is selected. Each block instance owns its own file and labels, so separate calendar presentations may link to different documents.

## Shared Architecture

A shared calendar PDF module owns:

- the default labels;
- the resolved download value (`href`, optional filename, document label, and button label);
- PDF-only Media validation and URL resolution;
- the sidebar download-panel component.

Calendar and Annual Calendar remain responsible only for passing their saved block values into the shared resolver and placing the resolved panel in their sidebar composition. The Annual Calendar-specific PDF modules are removed or reduced to compatibility-free shared imports so there is one presentation contract.

## Visitor Presentation

The download panel follows the existing calendar surface system and appears directly below Upcoming:

- the document icon and document label form the first row;
- the label may wrap without colliding with the action;
- a full-width download button forms the second row;
- the panel stays stacked at all viewport widths because its width is governed by the sidebar container, not the page viewport;
- light, subtle, and brand surfaces use the same semantic border, foreground, focus, and button variants as the surrounding calendar UI;
- the document label uses the established text family, not display typography.

The panel is omitted when the relationship is absent, unresolved, lacks a public URL, or does not resolve to a PDF Media document. The button uses the Media filename when available and otherwise retains native download behavior.

## Responsive and Accessibility Contract

- The document row uses `min-width: 0` behavior so long labels wrap within the sidebar.
- The action spans the available panel width and preserves the shared button height and visible focus treatment.
- The file and download icons are decorative; the visible labels provide the accessible names.
- Source and visual order remain document identity followed by download action on every viewport.

## Rendering and Preview

- Production Calendar and Annual Calendar resolve the same shared PDF value.
- Live preview receives and renders the same block props through the existing presentation components.
- Missing or unresolved PDF values fail closed without affecting the calendar schedule.
- The Calendar thumbnail fixture includes the configured panel so block-picker previews represent the feature.

## Testing and Verification

Focused tests cover:

- matching field definitions and conditional label visibility in both schemas;
- PDF-only relationship filtering;
- default, trimmed custom, unresolved, non-PDF, and missing-URL resolver behavior;
- the shared stacked panel structure, full-width action, semantic surface variant, labels, link, and filename;
- Calendar and Annual Calendar placement beneath Upcoming;
- production and live-preview prop compatibility;
- updated generated Payload types, block thumbnails, documentation, and project-context contracts.

Verification includes focused Vitest suites, Payload type generation, TypeScript, lint, the project-context update/check loop, and a bounded visual inspection when the local browser is available.
