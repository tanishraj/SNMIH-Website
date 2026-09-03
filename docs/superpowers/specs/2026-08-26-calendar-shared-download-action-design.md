# Calendar Shared Download Action Design

## Goal

Replace the bespoke Calendar and Annual Calendar PDF button configuration and rendering with the shared action-button system while preserving the existing download-panel layout and PDF document title.

This change applies equally to Calendar and Annual Calendar. It does not change event queries, calendar caching, sidebar dimensions, Upcoming content, or PDF generation.

## Editor Experience

Both blocks keep the download configuration in the Content tab but present it inside a dedicated **Download Panel** collapsible section.

The section contains:

- **PDF Document Label** — the existing `calendarPdfTitle` field and default value remain unchanged.
- **Download Button** — one optional restricted shared action.

The restricted shared action exposes only the settings relevant to this panel:

### Content

- Button Label
- PDF File

### Theme Settings

- Button Variant
- Show Download Icon
- Download Icon Position: Left or Right

The destination is fixed to File, the file behavior is fixed to Download, and presentation is fixed to Button. Page, Custom URL, File View, new-tab, Link presentation, and navigation-arrow controls are not shown. The upload relationship accepts only `application/pdf` Media.

The action is optional and limited to one row. An empty action means no public download panel.

## Shared Field Architecture

The existing shared action field factory remains the source of truth for action structure and theme controls. It will gain narrowly scoped options that allow a consumer to:

- restrict available destination types;
- lock File behavior to Download;
- restrict the File relationship to PDFs;
- hide display-mode selection and provide Button as the runtime fallback;
- customize the action field label and maximum row count;
- select an appropriate default button variant for the Calendar panel.

Default shared-action behavior for all existing blocks remains unchanged. Calendar-specific restrictions are supplied only by the Calendar download-panel field factory.

A small shared `createCalendarDownloadPanelFields` helper will compose the unchanged document-title field, restricted shared action, and hidden compatibility fields. Calendar and Annual Calendar will consume the same helper so their Admin contracts cannot drift.

## Stored Data and Compatibility

New content stores the button as `calendarPdfAction`, using the shared action row shape. It contains the label, populated Media relationship, fixed File/Download semantics, button variant, and download-icon settings.

The existing fields remain available for compatibility:

- `calendarPdf`
- `calendarPdfLabel`
- `calendarPdfTitle`

`calendarPdfTitle` remains visible and authoritative for the panel heading. The old `calendarPdf` and `calendarPdfLabel` fields become hidden Admin fields and are not rewritten.

At runtime:

1. A valid new `calendarPdfAction` is authoritative.
2. If the new action is empty, a valid legacy `calendarPdf` is converted into the equivalent resolved shared download action.
3. If neither source resolves to a populated PDF URL, the panel is omitted.

No migration script is required. A non-empty new action does not silently fall back to legacy data when its row is invalid; editors must fix or remove the new row.

## Rendering

The download panel retains its current position and information hierarchy:

- document icon and `calendarPdfTitle` at the top;
- shared action button below;
- panel pinned to the bottom of the full-height sidebar on desktop;
- natural source order on compact layouts.

The bespoke Calendar button markup is removed. The panel renders the resolved action through the shared `ContentActions` and `ActionButtonContent` contract, including:

- semantic anchor `download` behavior;
- shared Button variants and theme handling;
- animated Lucide download indicator;
- configurable icon visibility and left/right placement;
- keyboard focus behavior;
- static reduced-motion treatment.

The panel remains surface-aware in light, dark, and brand contexts. The default visual treatment remains an outline-style button so existing Calendar hierarchy is preserved, while editors may choose another supported shared Button variant.

## Error and Empty States

- An unresolved Media relationship does not create a broken anchor.
- A non-PDF Media value fails validation and is ignored defensively at runtime.
- Blank legacy button labels use the existing Calendar download fallback; new shared-action labels remain required.
- Blank document titles use the existing `Academic calendar PDF` fallback.
- The complete panel is omitted when no usable action resolves; the sidebar and Upcoming section continue rendering normally.

## Testing

Focused tests will verify:

1. Calendar and Annual Calendar register the same Download Panel fields.
2. The new action exposes only Button Label, PDF File, Button Variant, and download-icon controls.
3. Page, Custom URL, File View, new-tab, Link mode, and normal navigation-arrow controls are absent.
4. The upload relationship is restricted to PDFs.
5. New action data resolves through the shared action contract.
6. Existing PDF fields remain a no-migration fallback only when the new action is empty.
7. Invalid or unresolved PDFs omit the panel.
8. Both Calendar presentations render the shared download indicator and anchor semantics.
9. The panel remains at the bottom of the desktop sidebar and in normal compact-layout order.
10. Light, dark, and brand surfaces retain semantic contrast.
11. Generated Payload types, focused tests, TypeScript, lint, full integration tests, and project-context checks pass.

## Out of Scope

- Migrating existing Calendar content
- Generating the PDF
- Multiple Calendar downloads
- Protected or expiring file URLs
- Changing the general Header or Footer action systems
- Changing Calendar or Annual Calendar event data and caching
