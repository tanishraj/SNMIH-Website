# Shared File Actions Design

**Date:** 2026-08-26

## Goal

Extend the existing shared content-action system so every block that uses it can send visitors to a Page, a Custom URL, or a Media file. File actions can either open the asset for viewing or download it, while preserving the existing label, button/link display mode, variant, arrow, alignment, and theme behavior.

This is an extension of the shared action contract, not a separate file-button component and not a replacement for specialized document panels such as Download List, Fee Structure, or Calendar PDF downloads.

## Editor Experience

Each shared action keeps its two existing tabs.

### Content

The destination selector gains a third option:

- **Page** — select an internal Page. Existing behavior remains unchanged.
- **Custom URL** — enter a URL. Existing behavior remains unchanged.
- **File** — select any asset from the Media collection.

Selecting File reveals:

- **File** — a required-in-context upload relationship to Media.
- **File Behavior** — `View` or `Download`, defaulting to `View`.
- **Open View in New Tab** — shown only for View and defaulting to enabled.

The existing **Open in New Tab** field remains available only for Page and Custom URL actions and keeps its current default of disabled. Download actions do not expose a new-tab setting because the browser download behavior is the intended outcome.

Any Media asset is allowed. This keeps the shared action useful for PDFs, office documents, archives, images, and other client-provided files. Specialized blocks may continue to impose narrower media requirements where appropriate.

### Theme Settings

Existing controls remain:

- Display as Link or Button
- Button variant
- Optional arrow

File Download actions additionally expose:

- **Show Download Icon** — defaults to enabled.
- **Download Icon Position** — Left or Right, defaults to Left, and appears only when the download icon is enabled.

The download icon is the Lucide `ArrowDown`. It replaces the optional navigation arrow rather than rendering beside it. Page, Custom URL, and File View actions retain the existing `Show arrow` behavior; File Download hides that control to prevent two competing indicators.

File behavior is deliberately independent from visual presentation. A View or Download action can therefore be styled as either the site's shared Button or its editorial Link.

## Data Contract

The shared CMS action value gains:

- `linkType: 'file'`
- `file`: Media relationship
- `fileBehavior: 'view' | 'download'`
- `openFileInNewTab`: boolean
- `showFileIcon`: boolean
- `fileIconPosition: 'left' | 'right'`

The resolved action gains optional download metadata. Page, custom URL, and reusable navigation-link resolution remain unchanged.

Resolution rules:

1. Page resolves through the existing Page path helper.
2. Custom URL uses the authored URL.
3. File resolves through the existing Media URL helper.
4. File + View returns the Media URL and the file-specific new-tab preference.
5. File + Download returns the Media URL, disables new-tab behavior, and exposes a download filename when available.
6. File + Download resolves a Download indicator unless `showFileIcon` is explicitly false, using Left when no saved position exists.
7. Incomplete actions—missing label, destination, or populated Media URL—are omitted rather than rendering broken controls.

The original Media filename is preferred for the `download` attribute. If it is unavailable, the renderer uses the browser-supported boolean download behavior.

## Rendering

`ContentActions` remains the canonical renderer for shared action rows. Both its Button and Link branches will forward the resolved download metadata to the underlying anchor.

One shared action-indicator primitive owns visual affordances:

- Navigation uses the existing animated right arrow.
- Download uses two stacked Lucide `ArrowDown` icons with the same duration, easing, reduced-motion behavior, hover trigger, and focus-visible trigger as the existing arrow. The outgoing arrow moves downward and fades while the incoming arrow enters from above.
- Left position renders the icon before the label; Right renders it after the label.
- The text-link underline remains limited to the label and never decorates the icon.

Several visual components currently render a resolved shared action directly to preserve specialized layouts. Those consumers will use the same central anchor-semantics helper so they honor:

- `href`
- `target`
- `rel`
- `download`

This avoids duplicating View/Download decisions while allowing specialized card and hero layouts to remain visually unchanged.

The implementation will not replace specialized action UIs with one universal visual component. “Shared everywhere” refers to the authoring schema, destination resolution, interaction semantics, and base Button/Link primitives; blocks may retain intentional composition-specific layout.

## Backward Compatibility

- Existing Page and Custom URL rows retain their values and behavior.
- Missing `fileBehavior` is treated as View only when the destination is File.
- Missing `showFileIcon` is treated as enabled for File Download, and missing `fileIconPosition` resolves to Left.
- Existing reusable Navigation Link support remains intact.
- Existing blocks require no schema-by-schema edits because they already use `createContentActionsField`.
- No content migration script is required.
- Generated Payload types will be refreshed after the schema change.

## Accessibility and Security

- View actions opened in a new tab continue to use `rel="noreferrer"`.
- Download actions do not open a second browsing context.
- Button and Link modes retain their current focus, keyboard, contrast, sizing, and theme behavior.
- Download indicators are decorative and remain hidden from assistive technology because the authored label supplies the accessible name.
- Reduced-motion visitors see the icon without its transition.
- The authored label remains the accessible name; the system does not infer ambiguous labels from filenames.
- File URLs are resolved from populated Media documents through the existing media helper rather than manually constructing storage URLs.

## Verification

Automated coverage will verify:

1. The shared field exposes Page, Custom URL, and File destinations with correct conditional controls and defaults.
2. Existing Page and Custom URL actions resolve exactly as before.
3. File View resolves the Media URL and respects its new-tab setting.
4. File Download resolves the Media URL, suppresses new-tab behavior, and exposes download metadata.
5. Missing or unresolved Media relationships do not render broken actions.
6. Button-mode and Link-mode file downloads both render a `download` attribute.
7. File Download defaults to a Left-positioned animated `ArrowDown`, honors Right positioning, and can hide the icon.
8. File View and non-file actions retain the existing right-arrow behavior without gaining a download indicator.
9. Direct resolved-action consumers forward the shared anchor and indicator semantics.
10. Payload types, TypeScript, targeted integration tests, lint, and the maintained project-context check pass.

## Out of Scope

- Migrating existing specialized document-action schemas into shared actions
- Generating protected or expiring download URLs
- Per-file analytics or download counting
- Media-type-specific previewers
- Changing Button visual styles, variants, spacing, or icon choice beyond the download-specific `ArrowDown`
- Committing the implementation
