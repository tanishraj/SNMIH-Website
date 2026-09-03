# Download List Per-Item Actions Design

## Goal

Replace the Download List's new-authoring action flow with an ordered, per-document action list. Each download item can independently expose as many as two actions, allowing one item to offer Download while another offers View or a custom destination.

The editor experience must clearly reveal only fields relevant to the selected action type. Frontend rendering must distinguish links from buttons: links remain textual links, while buttons carry icons and adapt between labelled and compact presentations.

## Scope

This change adds one new `documentActions` array to every Download List item and hides the current block-level automatic controls plus both earlier per-document action schemas. Existing saved data remains registered and renderable through a compatibility path. No migration or data deletion is included.

The approved section-level Stacked/Split configuration and all four Download List presentations remain unchanged.

## Editor Model

### Document Actions

Each document exposes an ordered **Document Actions** array with zero to two rows. It is optional so existing documents without the new field remain valid.

Every row begins with **Action Type**:

- **Download**
  - Uses the document's uploaded Media file.
  - Uses the fixed `Download` icon.
  - Accepts an optional editable label; runtime default is `Download`.
  - Always uses button presentation.
- **View**
  - Uses the document's View URL when available, then falls back to its uploaded Media file.
  - Uses the fixed `Eye` icon.
  - Accepts an optional editable label; runtime default is `View`.
  - Always uses button presentation.
  - Exposes **Open in New Tab**, defaulting to enabled.
- **Custom**
  - Requires an editable label.
  - Uses the established internal Page or Custom URL destination fields.
  - Exposes **Open in New Tab**.
  - Exposes **Display As** with `Link` or `Button`.
  - Link hides icon and button-appearance fields.
  - Button reveals the existing Default, Primary, Secondary, Outline, White Filled, and White Outline variants.
  - Button requires a configurable Lucide icon name through the existing shared icon field.

The array preserves editor order. Duplicate Download or View actions are rejected because they would repeat the same document-owned destination. Two Custom actions are allowed when their destinations differ.

### Conditional field behavior

Payload `admin.condition` callbacks keep the row concise:

- Download reveals only its label.
- View reveals its label and new-tab toggle.
- Custom reveals label, destination type, the matching destination field, new-tab behavior, and display mode.
- Custom Button additionally reveals button variant and icon.
- Custom Link never exposes an icon control.

Descriptions explain that Download requires File Upload and View requires either View URL or File Upload.

## Compatibility Model

The following fields remain registered but become hidden in Admin:

- block-level `showViewAction`, `openViewInNewTab`, and `showDownloadAction`;
- the recently added per-document `customAction`;
- the older per-document `actions` array.

The hidden automatic checkbox validators are removed so editors cannot be blocked by fields they cannot access.

Runtime precedence is explicit:

1. If `documentActions` contains at least one authored row, resolve only those rows. Invalid rows are omitted independently. If no row resolves, omit that document instead of revealing a hidden legacy action.
2. If no new row is authored and `customAction` resolves, retain the current additive View, Download, Custom behavior.
3. Otherwise, if an older manual `actions` row resolves, retain its current replacement behavior.
4. Otherwise, retain the block-level automatic fallback for historical documents.

This isolates new authoring from legacy settings without changing existing page output or mutating stored documents.

## Runtime Action Contract

Each resolved action carries:

- purpose: `view`, `download`, or `custom`;
- semantic display mode: `button` or `link`;
- label and resolved destination;
- new-tab behavior;
- button variant;
- resolved Lucide icon component for button actions.

Download and View always resolve as buttons with their fixed icons. Custom Link resolves without an icon. Custom Button resolves its configured icon through the shared safe Lucide resolver; missing or historical invalid values fall back to `ArrowUpRight` so the control remains understandable.

The document row is usable only when at least one action resolves successfully.

## Presentation Behavior

### Labelled grid presentation

In Boxed Card, Open Grid, and Framed Grid with **Grid Action Display: Labelled**:

- Download and View render as compact labelled buttons with trailing Download and Eye icons.
- Custom Button renders as a compact labelled button with its configured trailing icon.
- Custom Link renders as the established underlined text link with no icon.
- Actions preserve editor order, wrap as one group, and remain aligned to the card bottom.

### Compact presentation

In Inline List or a boxed-family grid with **Grid Action Display: Icon only**:

- Download, View, and Custom Button become square icon-only controls.
- Their authored or default label remains the accessible name and tooltip.
- Custom Link remains an underlined text link with its visible label. It never receives a substitute icon because only buttons use icons.

The maximum of two actions prevents the mixed compact group from overwhelming narrow rows. Existing responsive grids and the permanent Inline divider remain unchanged.

### Theme behavior

Buttons use the existing shared button variants and card-surface overrides. Links use the existing surface-aware link classes. Focus-visible states, current-color dividers, brand surfaces, and light/dark contrast follow the established Download List and shared theme contracts.

## Validation and Failure Handling

- `documentActions` accepts no more than two rows.
- A document cannot contain duplicate Download or duplicate View rows.
- Download requires the parent document's uploaded file.
- View requires the parent document's View URL or uploaded file.
- Custom requires a label and a resolvable Page or Custom URL destination.
- Custom Button requires a non-empty Lucide icon name.
- Invalid runtime destinations are omitted independently.
- An authored but entirely invalid new action list suppresses hidden legacy fallbacks and causes that document to be omitted.
- Documents without the new list continue through the compatibility chain.

## Implementation Boundaries

Expected changes are limited to the Download List Payload configuration, normalized action types and resolver, server normalization, presentation, generated Payload types, focused integration tests, and current Download List documentation.

Reuse `createIconField`, `resolveLucideIcon`, existing button variants, card-surface classes, and the current Media/link resolution helpers. Do not add dependencies, create a new block, modify the approved section split, migrate content, stage files, or create a commit.

## Verification

Focused tests must cover:

- the two-row maximum and conditional Admin fields;
- duplicate Download/View validation;
- required document-owned and custom destinations;
- independent action choices on different documents;
- editor-defined action order;
- editable labels and built-in defaults;
- Download and View fixed icons;
- Custom Button configured icons and safe fallback;
- Custom Link never receiving an icon;
- labelled grid, grid icon-only, and Inline mixed-action rendering;
- accessible icon-button names and tooltips;
- light, dark, and brand-surface action classes;
- new-list precedence and every legacy compatibility branch;
- unchanged section split and document layout behavior.

After implementation, regenerate Payload types and run the focused Download List suite, neighboring action/theme contracts, TypeScript, targeted ESLint, Prettier, the design detector, diff checks, and the project-context update/check loop. Existing unrelated working-tree changes must remain untouched.
