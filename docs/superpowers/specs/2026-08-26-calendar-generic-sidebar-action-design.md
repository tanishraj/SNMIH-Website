# Calendar Generic Sidebar Action Design

**Date:** 2026-08-26

## Goal

Replace the Calendar and Annual Calendar sidebar panel's restricted PDF Download Button configuration with the same complete shared action configuration used elsewhere. Preserve the existing panel shell, PDF document title, icon, responsive placement, and legacy PDF compatibility.

## Scope

This change affects only the single action inside the existing Calendar download panel. It does not rename or redesign the panel, change Calendar event data, alter Upcoming behavior, add multiple actions, or migrate stored content.

## Admin Configuration

Both Calendar blocks continue to register one shared field composer. The existing `calendarPdfTitle` field, **Download Panel** collapsible, hidden `calendarPdf`, and hidden `calendarPdfLabel` fields remain unchanged.

`calendarPdfAction` remains an array with `maxRows: 1`, but it uses the canonical `createContentActionsField` defaults rather than Calendar-specific restrictions. Its editor matches normal actions elsewhere:

- **Content:** Label; Link Type; Page, Custom URL, or File destination; navigation new-tab preference; File View or Download behavior; File View new-tab preference.
- **Theme Settings:** Display As Button or Link; Button Variant; navigation arrow; Download icon visibility; Download icon position.

The action label in the collapsible is **Action**. No PDF-only upload filter, fixed File destination, fixed Download behavior, fixed Button mode, or hidden destination controls remain on the new action.

## Runtime Resolution

The Calendar-specific resolver continues to produce one `ResolvedCalendarDownloadPanel` containing the unchanged panel title and one canonical `ResolvedCmsAction`.

When `calendarPdfAction` contains a row, the resolver passes it through `resolveCmsActions` without coercing its destination, File behavior, display mode, variant, new-tab preference, arrow, or download-icon settings. The action row is authoritative:

- A valid Page, Custom URL, or populated File relationship renders normally.
- File View produces a normal link without a `download` attribute.
- File Download produces download semantics and the configured download indicator.
- Button and Link modes render through the existing shared presentation system.
- If the non-empty row cannot resolve a label or destination, the panel is omitted. It does not silently fall back to legacy PDF data.

Explicit Button or Link modes are always respected. Rows saved by the preceding restricted Calendar schema do not contain a `mode`; those rows use Button as the compatibility fallback so an existing PDF Download Button does not unexpectedly become an editorial Link.

When `calendarPdfAction` is empty, the hidden legacy PDF and label fields retain their current no-migration fallback. A populated legacy PDF resolves to the existing full-width outline Download Button with a left download icon. Unpopulated or invalid legacy Media produces no panel.

## Presentation

The existing Calendar sidebar panel remains visually and structurally unchanged:

- `calendarPdfTitle` remains the public panel heading.
- The FileText heading icon remains.
- The panel remains below Upcoming and uses `lg:mt-auto` at the bottom of the full-height desktop sidebar.
- Compact layouts retain natural source order.
- Button actions remain full width in the narrow sidebar.
- Link actions retain the canonical editorial link treatment and natural content width.
- Brand and light surfaces continue to use the section's `data-block-surface` theme contract.

`CalendarPdfDownload` continues to render the action through `ContentActions`; no new action renderer is introduced.

## Compatibility and Data Ownership

The stored field name remains `calendarPdfAction`, avoiding another schema key and preserving content already authored with the current action. Existing rows saved under the restricted configuration remain valid generic File Download Button rows.

The hidden legacy fields remain readable only for empty-new-action fallback. No migration or destructive cleanup is included.

## Error Handling

- New non-empty but unresolved actions fail closed by omitting the panel.
- Relationship IDs that are not populated cannot render and do not trigger legacy fallback.
- File downloads continue to use the Media filename when available and the boolean download attribute otherwise.
- Page and Custom URL actions use the existing shared resolver's URL and new-tab safeguards.

## Verification

Tests will verify:

1. Calendar and Annual Calendar expose the same normal one-row action schema as other blocks.
2. Page, Custom URL, File View, and File Download destinations resolve without Calendar coercion.
3. Button and editorial Link modes render with their canonical markup.
4. Button width and existing panel/sidebar placement remain unchanged.
5. A non-empty invalid action does not use legacy fallback.
6. An empty action continues to use valid legacy PDF data.
7. Generated Payload types include the complete shared action row for both Calendar blocks.
8. Shared action, Calendar, Annual Calendar, theme, TypeScript, lint, and project-context contracts remain green.
