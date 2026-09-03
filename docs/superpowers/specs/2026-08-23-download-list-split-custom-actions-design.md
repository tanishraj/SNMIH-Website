# Download List Split Layout and Card Actions Design

## Goal

Extend the existing Download List block without creating a replacement block. Editors should be able to present the section introduction beside the document collection and give each document an optional custom call to action in addition to the block's automatic View and Download actions.

The change must preserve the current stacked layout, display variants, responsive column settings, theme behavior, uploaded-file behavior, and saved legacy manual actions.

## Scope

This change adds:

- a section-level Stacked or Split layout;
- split-side and vertical-alignment controls for the section introduction;
- one optional custom action per document;
- Link or Button presentation for the custom action;
- the existing shared button variants for a button-style custom action;
- deterministic View, Download, Custom action ordering;
- backward-compatible rendering for documents containing the previous manual-actions data.

This change does not add a new block, migrate content, delete legacy action data, change the four document display modes, or alter the block's 1–8 column choices.

## Editor Configuration

### Section layout

Add the following settings using the established Program Matrix split-section pattern:

- **Section Layout**: `Stacked` or `Split`; default `Stacked`.
- **Introduction Position**: `Left` or `Right`; visible only for `Split`; default `Left`.
- **Introduction Vertical Alignment**: `Top`, `Center`, or `Bottom`; visible only for `Split`; default `Top`.

In a split section, the introduction occupies approximately 40% and the document collection approximately 60%. The document collection remains the wider side because it carries the denser information. The existing column selection applies inside that document side.

If the eyebrow, title, and description are all empty, no empty introduction column is reserved; the document collection uses the full container width.

### Document actions

Each document gains a **Custom Action** field with a maximum of one item. It reuses the project's shared content-action fields:

- editable label;
- internal page or custom URL destination;
- open-in-new-tab option;
- `Link` or `Button` display mode;
- existing button variants: Default, Primary, Secondary, Outline, White Filled, and White Outline;
- optional arrow for button presentation.

The block-level **Show View Action** and **Show Download Action** controls remain responsible for automatic actions. The new custom action supplements those actions; it does not replace them.

The former per-document manual-actions field remains registered but hidden in the admin interface so existing stored data is not dropped from the schema.

## Rendering and Data Flow

### Section composition

Stacked mode preserves the current visual hierarchy: introduction first, document collection second, and optional footer actions last.

Split mode uses a responsive two-column grid at desktop widths. Introduction placement follows the Left or Right setting, and its content aligns to the selected Top, Center, or Bottom position. At smaller breakpoints the layout becomes one column and always places the introduction before the document collection, regardless of its desktop side. Footer actions remain below the full section rather than belonging to either split column.

### Action resolution

Each document resolves its actions independently in this order:

1. **View** — included only when enabled and a viewable file or external URL exists.
2. **Download** — included only when enabled and an uploaded file exists.
3. **Custom** — included only when its label and destination resolve successfully.

An unavailable action is skipped without suppressing valid actions. A document with no uploaded file can still render when its external URL or custom action provides a valid destination.

Resolved action data identifies the action purpose (`view`, `download`, or `custom`) and carries the shared presentation metadata needed by the renderer: display mode, button variant, arrow choice, target behavior, label, and URL.

### Legacy compatibility

For a document that has no new Custom Action but contains valid data in the old manual-actions field, the resolver keeps the current legacy replacement behavior. This prevents an existing page from unexpectedly gaining or reordering actions after regeneration.

As soon as a new Custom Action is configured, the modern additive model applies: View, Download, then Custom. No automated data migration is included.

### Display modes

For labelled card-grid modes:

- View keeps its familiar text-link treatment.
- Download keeps its familiar button treatment.
- Custom respects its configured Link or Button mode and button variant.

For compact icon-action modes, including the inline list, all actions remain compact and accessible. View uses the eye icon, Download uses the download icon, and Custom uses a generic destination arrow. Every icon-only control retains an accessible name and title derived from its configured label.

The existing surface-aware color utilities remain the source of action contrast on light, muted, brand, and other configured section backgrounds.

## Responsive and Accessibility Requirements

- The split layout collapses before either column becomes cramped.
- The introduction is always read before the document list on mobile.
- Existing 1–8 column behavior remains responsive within the available document-side width.
- Action groups wrap cleanly and do not overflow narrow cards.
- Link and button semantics match the editor's selected display mode where labels are shown.
- New-tab behavior includes the project's established safe target handling.
- Icon-only controls have accessible names; decorative icons remain hidden from assistive technology.
- Focus-visible treatments and color contrast continue to use the shared theme-aware action system.

## Validation and Failure Handling

- The existing rule requiring at least one automatic action toggle remains in place.
- A custom action with an unresolved or missing destination is omitted rather than rendering a broken control.
- Missing View or Download destinations affect only those individual actions.
- A document is omitted only when none of its modern actions, legacy actions, file destination, or external URL can resolve into a usable interaction.
- Empty section introduction content does not produce an empty split column.

## Implementation Boundaries

Changes are expected in the Download List Payload configuration, runtime types, action resolver, presentation/component composition, generated Payload types, focused integration tests, and relevant block documentation. Shared action helpers should be reused instead of copied.

No unrelated refactor, content migration, block deletion, dependency addition, or commit is part of this work.

## Verification

Focused tests should cover:

- stacked mode retaining current composition;
- split introduction on the left and right;
- top, center, and bottom split alignment;
- full-width document rendering when introduction content is absent;
- responsive ordering contracts;
- automatic View and Download plus one Custom Action in the required order;
- Link and Button custom modes, including button variants and optional arrow;
- independent omission of unavailable actions;
- custom-only usability when no file destination exists;
- legacy manual-action compatibility;
- accessible icon labels for compact layouts;
- unchanged display-mode and column behavior.

After implementation, run the focused Download List integration tests, Payload type generation, TypeScript checking, linting, formatting checks, the repository detector, diff review, and the project-context update/check loop. Existing unrelated working-tree changes must remain untouched, and no changes will be committed.
