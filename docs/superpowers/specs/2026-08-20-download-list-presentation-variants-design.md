# Download List Presentation Variants Design

## Goal

Evolve Download List into a flexible, intuitive document-library block with four intentionally
different presentations: Boxed Card Grid, Open Grid, Framed Grid, and Inline List. Documents expose
clear editor-authored Link and Download actions, with automatic View and Download actions retained as
a compatibility fallback, instead of making an entire row or card behave like an unexplained link.

## Scope

This work changes the existing `downloadList` block in place. It does not add a second document
block, change Media ownership, introduce a PDF viewer, or add server-side search and pagination.
Category filtering remains local to the rendered block.

## Presentation Variants

The `displayMode` field exposes four selectable values while retaining legacy `compact` runtime
compatibility:

| Saved value  | Admin label     | Contract                                                                                                                            |
| ------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `cards`      | Boxed Card Grid | Individually bordered cards separated by gaps; supports independent semantic item backgrounds.                                      |
| `openGrid`   | Open Grid       | Ruled grid with top/bottom outer rules and internal dividers, but no left/right outer borders.                                      |
| `framedGrid` | Framed Grid     | Ruled grid with one complete square outer border and internal dividers.                                                             |
| `list`       | Inline List     | Responsive horizontal document rows with explicit actions. Existing `list` documents use the redesigned presentation automatically. |

No content migration is required. Unknown, missing, and legacy `compact` values fall back to Inline
List.

### Boxed Card Grid

Boxed Card Grid remains the expressive option. Each item is an `article` with its own radius, border,
and semantic Default, Primary, Secondary, Muted, or Accent background. The file-type badge stays at
the top right. The configurable-size file icon follows the shared grid icon-position setting, while
the sans-serif title, supporting text, and up to two explicit actions complete the card. Cards are
not wrapped in links.

### Open Grid

Open Grid follows the ruled Editorial Reasons visual principle: it has no gaps or individual card
chrome. Top and bottom outer rules remain visible, while the left and right edges stay open.
Low-emphasis horizontal and vertical dividers separate items. Every item inherits the section
surface; per-item card backgrounds do not apply. The file-type badge remains at the top right.

### Framed Grid

Framed Grid uses the same item anatomy and gapless geometry as Open Grid, but wraps the complete grid
in one semantic square-cornered border. Internal dividers remain low emphasis. Items inherit the
section surface and never look like separate cards inside another card. The file-type badge remains
at the top right.

### Inline List

Inline List uses one horizontal row per document. At wider breakpoints, the file icon, title and
supporting text, category, and actions align on one row. On smaller screens, metadata and actions wrap
beneath the title without horizontal overflow. Rows use restrained separators rather than rounded
card containers. A conditional `showInlineFileType` checkbox controls whether the file-type badge is
shown above the title in this presentation and defaults to `false`.

## Responsive Grid Columns

Boxed Card Grid, Open Grid, and Framed Grid expose `columns`, a required select with string values `1`
through `8` and a default of `3`.

The selected value is the maximum column count, not a fixed count at every viewport:

- Phone: one column
- Tablet: up to two columns
- Laptop: up to four columns
- Wide desktop (`2xl`): up to the selected one-to-eight columns

Selecting fewer columns caps every larger breakpoint at that number. Static class maps provide every
supported Tailwind class so builds do not depend on dynamically constructed class names. Inline List
hides the column control without deleting its stored value.

## Document Content Model

Each document row retains its existing field names for compatibility:

- `title`: relabelled Document Title and made required
- `description`: relabelled Metadata / Supporting Text
- `category`: optional category used by filtering and presentation metadata
- `file`: uploaded Media document and the source for a reliable Download action
- `externalUrl`: relabelled View URL and used for an external viewer or destination
- `fileType`: optional display override; otherwise detected from uploaded Media
- `cardBackground`: applies only to Boxed Card Grid
- `actions`: optional manual action array with at most two rows

The block adds `documentIconSize`, a block-level Small, Medium, or Large select. Medium is the default
and preserves the current main document-icon size. This setting controls the main file icon only; it
does not resize the smaller optional action icons.

The three grid presentations also expose `gridIconPosition`, with Above Content and Inline with
Content options. Above Content is the default. Above Content places the icon in the upper-left area
opposite the fixed top-right file-type badge, with title and description below. Inline with Content
places the icon to the left of a title/description stack while the badge remains fixed at the top
right. Inline List keeps its naturally inline icon and ignores this setting.

Admin descriptions explain destination precedence, manual-action fallback, and where each
presentation setting applies.

## Manual And Automatic Actions

Cards and rows are structural containers, never complete anchors. A shared `DocumentActions`
presentation renders consistent actions in every variant.

Each document exposes an optional `actions` array with a maximum of two rows. Each row contains:

- `actionType`: required Link or Download selection;
- `label`: required visible label or Icon-only accessible name;
- a Link destination using the project's internal/external link authoring pattern when the type is
  Link;
- an uploaded Media file when the type is Download;
- Link-only new-tab behavior;
- `iconMode`: Default, None, or Custom;
- `actionAppearance`: Link, Button, or Icon-only;
- a custom Lucide icon name shown only when Custom is selected.

Destination fields are conditional on `actionType`. Validation requires a valid Link destination for
Link and an uploaded Media file for Download. Invalid manual rows are omitted defensively at runtime.
An item may contain two links, two downloads, or one of each.

Action icon resolution is deterministic:

| Action type | Default              | None    | Custom               |
| ----------- | -------------------- | ------- | -------------------- |
| Link        | No icon              | No icon | Resolved Lucide icon |
| Download    | Trailing `ArrowDown` | No icon | Resolved Lucide icon |

Every resolved icon appears after the visible label, at the end of the action. An unknown custom
Lucide name falls back to the action-type default without breaking the document row.

The default Download `ArrowDown` shifts subtly downward on action hover and keyboard focus, mirroring
the shared link arrow's directional motion without moving the button itself. Custom Lucide icons stay
static.

Manual actions with a saved appearance use the shared underlined Link, semantic Button, or compact
Icon-only treatment. Existing manual actions without `actionAppearance` retain their earlier
behavior: Link actions render as links and Download actions render as buttons.

When at least one valid manual action exists, those actions replace all automatic actions for that
document. When the manual array is empty or contains no valid actions, the existing automatic action
fields remain the compatibility fallback. Dedicated View settings are:

- `showViewAction`: checkbox, default `false`;
- `viewActionAppearance`: Link, Button, or Icon-only; default Link;
- `viewActionLabel`: text and accessible name, default `View Document`;
- `viewActionIconMode`: Default, None, or Custom; Default resolves to `ArrowUpRight`;
- `viewActionIcon`: conditional custom Lucide name;
- `openViewInNewTab`: checkbox, default `true`.

Dedicated Download settings are:

- `showDownloadAction`: checkbox, default `true`;
- `downloadActionAppearance`: Link, Button, or Icon-only; default Icon-only;
- `downloadActionLabel`: text and accessible name, default `Download`;
- `downloadActionIconMode`: Default, None, or Custom; Default resolves to the animated `ArrowDown`;
- `downloadActionIcon`: conditional custom Lucide name.

New blocks therefore expose only an icon-only Download action by default. Editors may independently
enable or disable View and Download, change either to Link/Button/Icon-only, and configure its icon.
At least one automatic action must remain enabled. Icon-only actions must resolve an icon: None or an
invalid custom name falls back to that action's default icon at runtime.

Empty automatic labels fall back to their defaults at runtime.

Destination resolution is deterministic:

| Available data             | View action             | Download action                                              |
| -------------------------- | ----------------------- | ------------------------------------------------------------ |
| Uploaded file only         | Opens the uploaded file | Downloads the uploaded file                                  |
| View URL only              | Opens the View URL      | Omitted because cross-origin download behavior is unreliable |
| Uploaded file and View URL | Opens the View URL      | Downloads the uploaded file                                  |
| Neither                    | Item is omitted         |

View and manual Link actions honor their new-tab setting and supply safe `rel` attributes. Download
actions use the HTML `download` attribute for uploaded files. Automatic Download retains its
uploaded-file-only behavior. Labelled actions keep icons at the trailing edge. Icon-only actions hide
the visible label but retain `aria-label`, a native title, a minimum touch target, and shared visible
focus styles.

## Filtering

The existing category filter remains available to all variants. Categories are de-duplicated in
first-appearance order with All fixed first. Filter controls retain visible selected and keyboard
focus states. Switching filters updates only the local block and does not reset or navigate the page.

## Component Boundaries

The server `Component.tsx` continues to:

- trim and validate document content;
- detect file type;
- resolve uploaded Media into absolute file URLs;
- resolve and validate up to two manual actions per document;
- fall back to automatic View and Download destinations only when no valid manual action exists;
- safely resolve optional Lucide action icons;
- resolve section headings and shared actions;
- pass serializable document data to the client boundary.

`DownloadListClient.tsx` owns category state and selects the active presentation. Focused
presentation modules own the grid, inline, and shared document-action markup so the client
wrapper does not become a monolithic collection of variant-specific JSX.

No client-side Payload queries are introduced. Production and live preview continue using the same
block renderer and populated block data.

## Visual And Theme Contract

- Every color comes from the existing block appearance, card surface, border, foreground, and action
  tokens.
- Boxed Card Grid alone consumes per-item semantic card backgrounds.
- Open Grid, Framed Grid, and Inline List inherit the section surface.
- Open Grid has top/bottom outer rules and no left/right outer borders.
- Framed Grid has exactly one complete square outer border.
- Inline List uses separators, not nested rounded cards.
- Boxed Card Grid, Open Grid, and Framed Grid always place the file-type badge at the top right.
- Grid icons use the block-level Above Content or Inline with Content position independently of the
  fixed badge.
- Inline List shows the file-type badge above the title only when `showInlineFileType` is enabled;
  the saved and runtime default is Off.
- Document titles use the project's sans-serif text family rather than its display family.
- The main file icon follows the block-level Small, Medium, or Large setting.
- Labelled Link/Button action icons always trail their visible labels; Icon-only actions expose an
  accessible name without visible text.
- Hover treatment uses a subtle semantic surface change without layout movement or heavy shadow.
- Section heading, actions, footer actions, alignment, spacing, and category filtering remain shared
  with the existing block.

## Schema And Compatibility

This is an additive schema change plus a presentation redesign:

- `openGrid` and `framedGrid` are added to `displayMode`.
- `columns`, `documentIconSize`, `gridIconPosition`, the manual per-document `actions` array, and the
  dedicated automatic View/Download configuration fields are added.
- Manual action rows gain optional `actionAppearance`; missing values retain legacy behavior.
- `showInlineFileType` is added with a default of `false` and shown only for Inline List.
- Existing `list`, `cards`, `openGrid`, and `framedGrid` values retain their stored identities.
- Existing `list` renders as Inline List.
- Existing `compact` renders as Inline List and is no longer selectable in Admin.
- Missing automatic action fields use View Off and icon-only Download On runtime defaults.
- Existing saved automatic action settings remain honored. Documents without saved action settings
  use View Off and icon-only Download On.
- Generated Payload types are refreshed.

No database migration is required. Existing rows without titles or destinations continue to be
omitted defensively, while new and edited rows must provide a title.

## Accessibility

- Every document title is a heading or strong row label, not the sole interactive element.
- Every labelled Link and Download action has explicit visible text.
- Icon-only actions retain an accessible label, native title, visible focus state, and minimum touch
  target.
- New-tab Link and automatic View actions use safe relationship attributes.
- Decorative file and action icons use `aria-hidden="true"`.
- Filters use buttons with an exposed selected state.
- No interaction depends only on hover.

## Testing And Delivery

Focused coverage verifies:

- schema options, defaults, conditions, one-to-eight column choices, three document-icon sizes, two
  grid icon positions, automatic action configuration, two-action limits, and destination validation;
- legacy `list`, `cards`, and `compact` compatibility, with `compact` falling back to Inline List;
- unknown display-mode fallback;
- all four selectable presentation structures and their responsive classes;
- Open Grid top/bottom rules without left/right borders and Framed Grid's complete square outline;
- Boxed Card Grid semantic backgrounds and inherited surfaces in all other variants;
- fixed top-right grid badges and Above/Inline grid icon positions;
- manual Link-only, Download-only, two-Link, two-Download, and combined action resolution;
- automatic file-only, URL-only, combined, and missing-destination fallback resolution;
- manual actions replacing automatic actions only when at least one manual row resolves validly;
- independent automatic View/Download enablement, Link/Button/Icon-only appearances, labels,
  accessible names, targets, rel, and download attributes;
- manual action appearance overrides and missing-field legacy behavior;
- Default, None, valid Custom, and unknown Custom Lucide icon behavior and trailing placement;
- default Download `ArrowDown` hover/focus motion and static custom icon behavior;
- Small, Medium, and Large main document-icon presentation;
- top-right badges across all grid layouts and Inline badge default/override;
- category filtering and selected state;
- production/live-preview registration parity;
- generated Payload types, operator documentation, and thumbnail fixture coverage.

Implementation regenerates Payload types and the Download List 1600×900 Admin thumbnail, runs focused
block/theme/action tests, targeted ESLint, TypeScript checking, the UI detector, and the required
project-context update/check loop. The thumbnail should demonstrate the Framed Grid or Open Grid so
editors see the new document-library capability in the block picker.
