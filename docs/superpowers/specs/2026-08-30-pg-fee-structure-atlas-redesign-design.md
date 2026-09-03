# PG Fee Structure Split Atlas Redesign

## Purpose

Replace the new PG Fee Structure block's traditional desktop table and mobile department cards with
the established Fee Structure Programme Cost Atlas visual language. The redesign must accommodate
department-varying tuition and category-shared charges without inventing totals, changing the current
editor model, or requiring content migration.

## Goals

- Present PG fees as a premium two-panel institutional statement rather than tabular data.
- Keep every department's complete fee statement visible and directly comparable.
- Preserve General, NRI, and future category switching through the existing accessible tabs.
- Summarize shared category facts and charges in the brand panel.
- Retain exact authored currencies and amounts without parsing, formatting, totaling, or conversion.
- Preserve section themes, dark mode, responsive behavior, actions, download settings, and live preview.

## Non-goals

- Do not add Programme Cost Atlas as an editor-selectable layout.
- Do not retain the PG table as an alternate presentation.
- Do not add manually authored complete-programme totals.
- Do not calculate totals or derive fees from other values.
- Do not add a department selector, department tabs, search, filtering, sorting, or pagination.
- Do not change the existing Fee Structure block.
- Do not add or migrate Payload fields.

## Existing Data Contract

The current PG Fee Structure schema remains authoritative:

- one programme and one academic session per block;
- one to four fee categories;
- one to six ordered fee columns per category;
- each column uses `department` or `shared` value mode;
- one to thirty ordered departments per category;
- department values correspond only to `department` columns, in their configured order;
- shared values are authored once on their column;
- optional department notes, category notes, official Media file, section actions, footer actions,
  appearance, alignment, padding, and category-tab controls.

Normalization continues to expand shared and department-specific values into one ordered cell array
per department. It trims text and uses an em dash only for a missing draft value. It never changes
the meaning or formatting of authored amounts.

## Layout Architecture

### Category tabs

When more than one fee category exists, the existing Underline, Pills, or Boxed tab rail remains
above the complete split frame. Switching category replaces both the summary panel and the statement
panel. One category renders directly without a tab list. Existing Content Width, Centered Auto Width,
and Equal Full Width behavior remains unchanged.

### Split frame

The active category renders inside one rounded semantic frame with two equal large-screen columns:

1. a Primary summary panel;
2. a Card statement panel.

The frame uses the active theme's semantic radius and border. It stacks into one column below the
large breakpoint. DOM order always matches visual and reading order: summary first, statement second.

### Primary summary panel

The brand panel contains:

- Programme;
- Academic Session;
- Admission Category;
- Department count;
- a Shared Charges section derived only from columns whose value mode is `shared`;
- category notes;
- the existing official fee-document panel anchored at the bottom when a file resolves.

Shared Charges uses the configured column labels and exact shared values. It is omitted when the
active category has no shared columns. Category notes are omitted when empty. The download remains
inside the brand panel and reuses the canonical fee-document presenter with brand-surface contrast.

The summary panel remains sticky on large screens using the same bounded viewport behavior as the
existing Programme Cost Atlas. On compact screens it returns to normal document flow.

### Statement panel

The Card panel begins with:

- mono eyebrow `Statement breakdown`;
- derived heading `<Category> category department fees`;
- optional category caption.

Every department becomes one ordered statement chapter. Each chapter contains:

- department name;
- optional department note;
- an ordered fee grid containing every configured column and the department's normalized value.

Shared values intentionally repeat in every department chapter. This duplication makes each chapter
a complete standalone statement while the left panel explains which charges are category-wide.
Department chapters use subtle hover feedback on pointer-capable devices without becoming clickable.

## Responsive Behavior

- Large screens use the 50/50 split composition.
- The Primary panel is sticky only at the large breakpoint.
- Compact screens stack Primary then Card in DOM order.
- Fee grids use a container-aware layout: they begin at two columns where space permits and expand
  toward the configured one-to-six column count only while cells remain readable.
- A single fee column uses the complete available chapter width.
- Odd final cells span naturally without artificial empty cells or misleading dividers.
- Long department names, notes, fee labels, and values wrap within their regions.
- The page itself must not horizontally overflow; no visitor-facing horizontal table scroller remains.

## Visual and Theme Contract

- The Primary panel uses semantic `primary` and `primary-foreground` tokens.
- The statement panel uses semantic `card`, `card-foreground`, `muted-foreground`, `accent`, and
  `border` tokens.
- Display typography remains restricted to the outer section-level title. Atlas titles, department
  names, fee labels, controls, and metadata use the established sans and mono families.
- The outer frame uses `rounded-card`; controls retain their own semantic control or pill radius.
- Both SNMIH-Blue and SNMIH-Green must remain readable in light and dark modes.
- Dividers use low-opacity semantic foreground or border colors rather than hard-coded palette values.

## Accessibility

- The category switcher remains a Radix tab interface with keyboard and focus behavior.
- Department chapters use semantic section/article structure and headings.
- Fee label/value pairs use description-list semantics.
- The summary facts and Shared Charges also use description lists.
- Information never depends on color alone.
- Non-interactive chapters do not receive pointer cursors, buttons, or tab stops.
- DOM, visual, keyboard, and assistive-technology reading order remain aligned.

## Edge Cases

- Invalid or empty categories remain omitted by normalization.
- A category with no valid departments cannot render the block.
- No shared columns omits Shared Charges without reserving space.
- No category notes omits the notes region.
- No official file omits the download panel and allows the summary to close naturally.
- Missing draft values render an em dash without being treated as numeric.
- One department still uses the full split frame and one statement chapter.
- Up to thirty departments extend the statement vertically; no pagination or disclosure hides them.
- Up to six configured fee columns reflow within each responsive chapter grid without forcing narrow
  cells or page-level overflow.

## Implementation Boundaries

- Replace the table/card presenter in `PGFeeStructureClient.tsx` with a dedicated PG split-atlas
  presentation component.
- Extend normalized column data only if the presentation needs the resolved shared value explicitly;
  do not change the authored Payload schema.
- Reuse the existing category-tab mapping and shared fee-document component.
- Keep the production and live-preview renderer registrations unchanged.
- Regenerate the PG block thumbnail because the picker preview changes.
- Regenerate Payload types only if source schema changes unexpectedly; the approved design requires no
  schema change.

## Verification

Focused tests must cover:

- Primary/Card split frame and responsive stacking classes;
- summary facts, department count, shared charges, notes, and bottom download;
- one statement chapter per department;
- every configured fee label/value inside every chapter;
- General/NRI category switching across both panels;
- one-category direct rendering;
- no Shared Charges region when none exist;
- exact mixed INR/USD text preservation and no calculated totals;
- missing-value em-dash fallback;
- one-to-six fee-column responsive grids;
- light/brand/dark semantic class contracts;
- accessible tabs, headings, and description lists;
- updated 1600×900 thumbnail and unchanged catalog/renderer coverage;
- unchanged existing Fee Structure regression suite.

The maintained block operator guide, feature inventory, block-system reference, and generated project
inventory must describe the split-atlas presentation instead of a table and mobile cards.
