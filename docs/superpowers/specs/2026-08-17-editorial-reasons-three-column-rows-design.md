# Editorial Reasons Three-Column Rows Design

## Goal

Extend the existing **Editorial Reasons** block with an opt-in row presentation that matches the
approved reference layout: an editorial introduction on the left and a ruled list on the right
whose desktop rows place the generated number, title, and description in distinct columns.

This is an additive presentation option. Existing Editorial Reasons content and the current
Stacked and Inline number layouts must render exactly as they do today.

## Architectural decision

Editorial Reasons is the correct owner because it already provides the defining structure:

- a split introduction and numbered list;
- automatic two-digit numbering;
- list-focused, balanced, introduction-focused, and full-width proportions;
- left or right list placement;
- ruled, open, and framed list treatments;
- shared appearance, spacing, actions, links, and sticky-introduction behavior.

Adding a new option to this block avoids duplicating those contracts in a new block. Replacing the
existing Inline presentation is rejected because it would silently change published pages.

## CMS contract

Add one option to the existing `numberLayout` select:

- Label: **Three Columns (number + title + description)**
- Value: `columns`

The complete field remains:

- Stacked (number above title): `stacked`
- Inline (number beside title): `inline`
- Three Columns (number + title + description): `columns`

The default remains `stacked`. No existing field is renamed, removed, or given a new default.
Generated Payload types are refreshed so `numberLayout` includes `columns`.

Because this treatment needs the full list width for its internal title and description columns,
`listColumns` is hidden in the admin when `columns` is selected and is resolved as one column by the
renderer. Its stored value is not deleted, so switching back to Stacked or Inline restores the
editor's previous list-column selection.

## Desktop layout

At the large breakpoint, each row uses three semantic columns:

```text
┌────────┬────────────────────────────┬──────────────────────────────────┐
│ 01     │ Academic Excellence        │ Maintain high standards of ...   │
├────────┼────────────────────────────┼──────────────────────────────────┤
│ 02     │ Student Development        │ Support academic progress ...    │
└────────┴────────────────────────────┴──────────────────────────────────┘
```

- The number occupies a narrow fixed rail.
- The title and description occupy flexible columns with a slightly larger allocation for the
  title, allowing institutional headings to wrap naturally.
- The existing horizontal row dividers and selected outer border treatment remain unchanged.
- The layout introduces no vertical rules between the number, title, and description.
- When a description is absent, the title spans the remaining content width rather than reserving
  an empty description column.

The section-level reference composition is produced through existing settings: List Focus (40/60),
one list column, list on the right, top-aligned introduction, and Ruled borders.

## Responsive behavior

Below the large breakpoint, the row becomes a compact two-column layout:

```text
01   Academic Excellence
     Maintain high standards of teaching and assessment.
```

- The number remains in its own narrow rail.
- The title is placed beside the number.
- The optional description sits below the title and aligns with it, not with the number.
- Missing descriptions reserve no empty space.
- Long titles and descriptions wrap without truncation, fixed heights, or horizontal scrolling.
- The surrounding split section continues to stack the introduction before the list at the
  existing breakpoint.

## Rendering and component boundaries

`EditorialReasonsBlockComponent` continues to own validation, link resolution, appearance, and
section composition. The new row treatment is isolated from the existing Stacked and Inline
branches so its responsive grid classes cannot alter their markup or presentation.

The row keeps the current semantic order:

1. decorative generated number;
2. `h3` title, optionally containing the resolved link;
3. optional description.

The number remains `aria-hidden` because array order already communicates sequence. Linked titles
retain current focus, hover, target, and safe external-link behavior.

The component continues to return `null` for a missing section title or an empty resolved reasons
array. Rows with blank titles remain filtered. A missing description is valid and does not prevent
the row from rendering.

## Typography and theme behavior

The reference controls structure, not a separate visual system. The new presentation reuses:

- `contentItemMetadataClasses` for generated numbers;
- `contentItemTitleClasses` and `contentItemLinkClasses` for titles;
- `contentItemDescriptionClasses` for descriptions;
- the existing surface-aware eyebrow color hook for numbers;
- `border-current/15` and the existing list border-style resolver for dividers.

No theme stylesheet, color token, font token, shadow, radius, or component-local color value is
added. In particular, `src/styles/themes/theme-snmih.css` remains unchanged.

## Compatibility and data flow

This is a schema union expansion only. Existing documents remain valid and need no migration.
Missing, null, or stale `numberLayout` values continue to resolve through the current safe fallback.

The option works with all existing Editorial Reasons controls, including:

- split and full-width proportions;
- left and right list positions;
- open, ruled, and framed borders;
- sticky or non-sticky introductions;
- section, list, and footer actions;
- Page and custom title links;
- every semantic section background.

Stacked and Inline continue to support one-to-four list columns. Three Columns deliberately resolves
the outer reasons grid to one column, preventing narrow or unreadable nested columns.

## Documentation and preview

- Update the block guide to describe the Three Columns number layout and the settings that recreate
  the reference composition.
- Update the Editorial Reasons thumbnail fixture to demonstrate the new presentation.
- Regenerate only the Editorial Reasons thumbnail.
- Refresh generated Payload types and the project-context inventory.
- Update project-context narrative references only if the maintained contract requires it.

## Testing and verification

Focused coverage must verify:

- the new Payload select option and unchanged default;
- conditional `listColumns` visibility and the one-column renderer override;
- generated Payload type inclusion of `columns`;
- the three-column desktop and two-column compact responsive class contracts;
- separate number, title, and description regions in semantic DOM order;
- title expansion when the description is missing;
- Page and custom linked titles, including safe new-tab attributes;
- unchanged Stacked and Inline output;
- compatibility with ruled, open, and framed list treatments;
- thumbnail fixture and block-guide coverage.

Verification includes focused Vitest suites, Payload type generation, TypeScript, scoped ESLint,
Prettier, project-context checks, diff checks, and one bounded desktop/mobile visual review. The final
diff must confirm that the SNMIH theme stylesheet was not changed.

## Out of scope

- A new block or an Icon Grid variant
- Changing the default Editorial Reasons presentation
- Replacing Stacked or Inline behavior
- Manually editable reason numbers
- Per-reason icons, images, backgrounds, badges, or buttons
- New theme tokens or SNMIH-specific component styling
- Animation or client-side state
