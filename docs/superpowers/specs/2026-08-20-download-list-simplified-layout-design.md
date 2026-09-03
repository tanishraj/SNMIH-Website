# Download List Simplified Layout Design

## Goal

Reduce Download List authoring complexity by replacing configurable action appearances and icons
with fixed, layout-specific behavior. Preserve the four existing variants and their distinct visual
roles while using one shared responsive Columns control.

## Simplified Authoring Model

The block exposes one `columns` select for Inline List, Boxed Card Grid, Open Grid, and Framed Grid.
It supports string values `1` through `8` and defaults to `3`. The separate `inlineColumns` field is
removed.

Add `showDocumentIcon`, a block-level checkbox defaulting to `true`. It controls the main file icon
in every variant. Missing saved values resolve to On for compatibility.

Keep `gridIconPosition` for Boxed Card, Open Grid, and Framed Grid only. Preserve its saved values:

- `above`: labelled Above Title;
- `inline`: relabelled Left of Content.

The setting defaults to `above`. Inline List ignores it because its icon position is fixed.

Remove these visual authoring controls:

- `showInlineFileType`;
- `inlineColumns`;
- automatic View and Download appearance fields;
- automatic View and Download label fields;
- automatic View and Download icon-mode and custom-icon fields;
- manual action appearance, icon-mode, and custom-icon fields.

Keep the functional action controls:

- `showViewAction`, default Off;
- `showDownloadAction`, default On;
- `openViewInNewTab`, default On;
- manual action type, required label, destination/file, and Link new-tab behavior.

At least one automatic action remains required. A valid manual action array still replaces the
automatic fallback for that document.

## Shared Columns Behavior

The shared Columns control is always visible and applies to every variant. It remains a responsive
maximum:

- Phone: one column;
- Tablet: up to two columns;
- Laptop: up to four columns;
- Wide desktop: up to the selected one-to-eight columns.

Missing or invalid values resolve to `3`. Legacy `compact` still maps to Inline List and uses the
shared Columns value.

## Inline List Anatomy

Inline List is an unboxed ruled grid. It never shows the PDF/file-type badge.

Each item contains, in order:

1. optional main file icon at the upper-left;
2. required title above the optional description;
3. a divider separating content from actions;
4. right-side explicit actions.

When the item has sufficient width, the separator is vertical and the action group remains at the
far right. When a selected column count makes the item narrow, actions move below the content and the
separator becomes horizontal. The layout never clips or introduces horizontal scrolling.

Inline actions use fixed icon-only controls:

- Link/View uses `Eye`;
- Download uses `ArrowDown`.

The editor-authored or automatic label is hidden visually but retained as `aria-label` and native
title. Controls keep visible focus treatment and a minimum touch target. Link new-tab behavior and
Download's native `download` attribute remain unchanged.

Inline items retain low-emphasis horizontal and vertical rules between separate items. They do not
gain rounded borders, gaps, shadows, or independent card backgrounds.

## Boxed, Open, And Framed Anatomy

Boxed Card, Open Grid, and Framed Grid share one item anatomy:

- optional file icon above the content or left of the title/description according to
  `gridIconPosition`;
- file-type badge fixed at the top-right when a type is available;
- required sans-serif title above optional description;
- optional category metadata;
- labelled action row below the content;
- no divider between the content and its action row.

Action styling is fixed:

- Link/View actions render as labelled underlined text links with no icon;
- Download actions render as labelled compact buttons with a trailing animated `ArrowDown`.

Boxed Card retains independent semantic item surfaces and gaps. Open Grid retains top/bottom outer
rules with internal dividers and open left/right edges. Framed Grid retains one square outer border
and internal dividers. “No divider” applies only between an item's content and actions; it does not
remove the Open/Framed separators between different documents.

## Action Resolution

Automatic labels are fixed at runtime:

- View: `View Document`;
- Download: `Download`.

Destination precedence remains unchanged. View uses the explicit View URL or uploaded file URL.
Download exists only for an uploaded file. Automatic actions respect their show/hide toggles. Manual
Link and Download rows retain their required custom labels and existing destination validation.

Saved action appearance and icon values are ignored after this redesign. Existing manual actions
remain valid because their type, label, destination/file, and new-tab fields are unchanged.

## Compatibility

- No database migration is required.
- Existing `cards`, `openGrid`, `framedGrid`, `list`, and legacy `compact` identities remain valid.
- Existing `gridIconPosition` values retain their meaning.
- Missing `showDocumentIcon` resolves to On.
- Missing or invalid shared `columns` resolves to `3` for every variant.
- Removed saved fields may remain in historical document versions but are no longer authored or
  consumed.
- Existing manual actions without the removed visual fields render using the fixed style for their
  action kind and active layout.

## Accessibility And Theme Contract

- Inline icon-only actions retain an accessible label, native title, focus visibility, and touch
  target.
- Decorative icons use `aria-hidden="true"`.
- Labelled Boxed/Open/Framed actions retain visible text.
- Focus and reading order follow document and action order regardless of visual column count.
- All surfaces, dividers, links, buttons, and supporting text use existing semantic theme tokens.
- No interaction depends only on hover.

## Verification

Tests cover removed schema fields, always-visible Columns, Show File Icon defaults/conditions,
fixed action rendering per layout, hidden Inline badges, adaptive Inline dividers, optional icons,
automatic and manual action resolution, shared columns including legacy Compact, and unchanged
Boxed/Open/Framed border contracts. Regenerate Payload types, update the Download List thumbnail and
operator documentation, and complete the required project-context update/check loop.
