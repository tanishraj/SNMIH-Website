# Fee Structure Programme Cost Atlas Design

## Purpose

Add the approved Programme Cost Atlas as a configurable presentation inside the existing Fee Structure block.

The existing table/mobile-card presentation remains the default and runtime fallback. Saved Fee Structure documents therefore retain their current output unless an editor explicitly selects Programme Cost Atlas.

Both layouts use the same programme, session, category, academic-period, fee-row, note, and official-file data. Programme Cost Atlas presents the active category in a 50/50 desktop layout:

- the left half contains programme details, Annual totals, fee notes, Complete programme expense, and the official fee-document download;
- the right half contains one editorial chapter per fee head, with that fee head written once and its academic-period values displayed beneath it.

General and NRI remain examples rather than fixed categories. The block displays author-entered text exactly and never calculates totals, parses amounts, converts currencies, combines equal values, or infers missing information.

## Layout Selection and Compatibility

Add a required `layout` select to Fee Structure Theme Settings:

- `table`: label `Table & Mobile Cards`; saved default and runtime fallback;
- `programmeCostAtlas`: label `Programme Cost Atlas`.

Missing and unknown values resolve to `table`. No content migration is required.

The existing category tab style, category tab width, section appearance, section spacing, content alignment, download action mode, download button variant, download appearance, header actions, and footer actions remain supported in both layouts.

## Content Model Extensions

### Additional programme details

Add an optional top-level `programmeDetails` array, shown in Admin only when Programme Cost Atlas is selected:

- label: `Additional Programme Details`;
- zero to four rows;
- each row contains required `label` and `value` text fields;
- examples include `Programme Duration` / `4.5 Years`.

Programme, Academic Session, and Admission Category come from existing block/category fields. Additional rows extend those details without hard-coding a medical-programme-specific field.

Runtime normalization trims both strings and omits incomplete rows. It does not deduplicate editor-authored labels.

### Complete programme expense

Add three fields to every fee category and show them in Admin only when Programme Cost Atlas is selected:

- `completeProgrammeExpenseLabel`, text, default `Complete programme expense`;
- `completeProgrammeExpense`, required text;
- `completeProgrammeExpenseNote`, textarea.

Every Atlas category must provide its complete programme expense before the block can be saved. Its label falls back to `Complete programme expense`; its note is optional. Legacy or incomplete runtime data remains defensive and omits the expense group instead of inventing an amount. Expense content remains category-owned, so the block never borrows, calculates, or derives NRI content from General content.

Existing category summary notes remain independent. Runtime must not extract or parse a programme expense from an existing note.

### Annual totals

The first normalized fee row whose `emphasis` is `total` supplies the Atlas Annual totals section. Its optional row note appears beneath the `Annual totals` heading.

Each academic-period label appears above its corresponding authored total value. No arithmetic is performed. If no total row exists, Annual totals is omitted. The total row is not duplicated on the right.

To avoid data loss in legacy or unusual content, additional rows emphasized as `total` remain visible as right-side editorial fee-head chapters in source order with stronger typography.

## Admin Conditions

A shared `usesProgrammeCostAtlas` condition controls the additional programme details and category expense fields. The condition reads Payload's nearest `blockData` context so it also works for fields nested inside category array rows.

Existing multiple-category and download conditions remain unchanged.

## Runtime Normalization

Extend Fee Structure-specific types and normalization rather than creating a second fee model.

Normalization:

- trims the new programme-detail and expense strings;
- omits incomplete additional-detail rows;
- preserves existing invalid-category/column/row omission;
- preserves source-column alignment;
- maps missing cells to an em dash;
- ignores extra cells;
- normalizes unknown emphasis to `standard`;
- never calculates or parses financial values.

Resolved categories always gain the fallback `completeProgrammeExpenseLabel`; the normalized amount and note remain optional so legacy or incomplete runtime data can render defensively. A separate `normalizeProgrammeDetails` helper returns normalized label/value pairs.

## Rendering Architecture

Keep `FeeStructureBlockComponent` responsible for server-safe content resolution: programme/session text, Media URL, CMS actions, block appearance, download settings, and normalization input.

Extend `FeeStructureClient` with the resolved layout, programme/session context, normalized additional details, and client-safe download data. It continues to own category-tab state.

Split presentation responsibilities into focused units:

- retain the existing table/mobile-card category presentation without behavioral changes;
- add `ProgrammeCostAtlasPresentation.tsx` for the 50/50 layout;
- extract the official-file UI into a Fee Structure-owned client-safe component so the table layout can keep its current position after category content while Atlas can place the same configured action at the bottom of the active left panel.

The extraction must preserve link/button modes, download attribute, button variants, media URL handling, semantic appearance backgrounds, icons, labels, and existing download data attributes.

No route, collection, global, relationship, query, registry abstraction, or third-party dependency is added.

## Programme Cost Atlas Layout

### Header and category navigation

The optional shared section intro renders first. Multiple categories keep the current accessible category tabs immediately above the active presentation. One category renders directly without a tablist or a redundant external category heading because its category appears inside the Atlas.

The standalone Programme/Academic Session band renders only for the table layout. Atlas places that context inside Programme details on the left.

### Outer frame

At large breakpoints, Atlas uses two equal `minmax(0, 1fr)` columns inside one clipped, rounded, bordered frame.

- Left: semantic Primary background and Primary Foreground text.
- Right: semantic Card background and Card Foreground text.
- Dividers and secondary text use semantic current-color opacity or shared tokens.

No raw SNMIH-specific color is introduced. The Atlas remains readable when the outer section uses Page, Subtle, Brand, or Gradient Brand backgrounds.

### Left half

The left-panel order is fixed:

1. `Programme details` label.
2. Programme.
3. Academic Session.
4. Admission Category.
5. Zero to four normalized additional programme details in editor order.
6. Annual totals, when a total row exists.
7. Category fee notes in editor order.
8. Flexible vertical space.
9. Complete programme expense, required for Atlas authoring and omitted only for legacy or incomplete runtime data.
10. Official Fee Structure download, when a valid Media URL exists.

The desktop inner panel is sticky and uses a viewport-aware minimum height so Complete programme expense and Download Fee Structure remain bottom-aligned when content is short. If authored details or notes make it taller than the viewport, content remains in normal flow and is never clipped or placed in an internal scroll area.

Annual totals use the approved fee-head editorial treatment: one heading, optional total-row note, and one equal-width period item per academic column. The period label sits above the exact authored amount, with vertical separators between items.

Complete programme expense uses a standard supporting label, a prominent but standard-sized sans-serif amount, and an optional supporting note. The existing configured download container appears directly beneath it.

### Right half

The right begins with `Fee statement`, active category context, and optional category caption. It renders one editorial chapter per normalized row in source order, excluding only the first total row moved left.

Each chapter contains:

- fee-head label once;
- optional row note;
- one period item per academic column, with the period label above the exact authored value.

The right never repeats a fee-head label for every academic year. It never collapses equal values into a range and never displays proportional charts. Additional total-emphasis chapters retain stronger typography.

Category notes are not repeated on the right because they appear on the left.

### Typography, alignment, and theme correction

Atlas uses the shared sans-serif family throughout. The statement title and Annual totals use the standard section-subheading scale, fee-head titles use the standard item-title scale, and supporting labels and values use the existing body and metadata scales. No Atlas heading or amount uses the serif family.

Every academic-period item aligns its label and amount to the left on both halves. Equal period columns, matching internal padding, and consistent vertical dividers keep the five-year values on a shared visual grid. Numeric values retain tabular numerals without introducing right alignment.

Both halves use the same spacing rhythm at matching breakpoints. The left remains Primary / Primary Foreground; the right remains Card / Card Foreground. Metadata, dividers, hover states, and download contrast use only semantic theme tokens or current-color opacity. The configured download background remains supported, while inherited backgrounds remain transparent and readable on the Primary panel.

### Right-side statement density

The right statement follows the project's established data/list rhythm rather than general editorial-card spacing. Its header retains `p-6 sm:p-8`, while each fee-head chapter uses `px-6 py-5 sm:px-8 sm:py-6`. The gap between the fee-head title group and its period grid is 12px. Right-side academic-period cells use 12px vertical padding; left-side Annual totals retain their existing 16px period-cell padding.

Fee-head titles follow the shared item-title scale: `text-md` with `leading-tight`, increasing to `text-lg` at the small breakpoint. Standard fee heads remain medium weight and additional Total fee heads remain bold. Academic-period labels follow the shared metadata scale—monospace, `text-xs`, medium weight, and the established tracking—while values remain `text-sm`, medium weight, left-aligned, and tabular only when they contain digits.

`PeriodBreakdown` accepts an explicit compact-density presentation flag so right-side chapters can use the tighter rhythm without changing Annual totals. This density change does not compress the left summary groups, change the 50/50 split, remove dividers, alter the Accent hover treatment, or change Primary/Card surface ownership.

## Responsive Behaviour

- Below the large breakpoint, left and right stack in document order.
- Sticky positioning and viewport minimum height are removed when stacked.
- Programme details use one or two columns according to available width.
- Annual-total and fee-head period items use a two-column compact grid on narrow screens; an odd final item spans the available row.
- Long labels and values wrap without overlap.
- Every value remains visible without horizontal scrolling, a carousel, accordion, drawer, or year selector.

## Accessibility

- Multiple categories retain Radix Tabs keyboard and focus behavior.
- Programme details and period values use descriptive-list semantics.
- Fee-head chapters use headings in document order beneath the block heading.
- Values remain selectable text rather than chart output.
- Download remains a real anchor with `download`, visible label, keyboard focus, and configured Link/Button presentation.
- Mobile DOM order matches visual order.

## Empty and Legacy States

- Existing `table` documents keep the current context band, semantic desktop table, mobile cards, notes, hover behavior, and external download position.
- Missing programme details leave no empty cells.
- Missing Annual totals, notes, or download remove only their regions. Missing Complete programme expense is tolerated only for legacy or incomplete runtime data; editors cannot save an Atlas category without it.
- A category with no standard rows after moving its first total row still renders the left side and omits the empty right chapter list.
- Invalid Media does not render a download.
- Runtime never substitutes example content.

## Verification and Documentation

Implementation must cover:

- schema defaults, conditions, limits, and generated Payload types;
- layout fallback and backward compatibility;
- normalization of programme details and category expense fields;
- required category-owned Complete programme expense validation for Atlas without any arithmetic fallback;
- first-total-row selection without calculation or additional-total data loss;
- exact 50/50 large-screen Atlas structure and stacked responsive structure;
- Programme details, editorial Annual totals, notes, bottom-aligned Complete programme expense, and download order;
- fee-head labels rendered once with every academic-period value;
- General/NRI category switching and configured tab variants/widths;
- semantic outer-section theming and inner Primary/Card surfaces;
- shared sans-serif typography, standard title scales, left-aligned period labels/values, and matching two-half spacing;
- compact right-side chapter padding, 12px title-to-period rhythm, and existing shared item/metadata type scales;
- missing total, expense, notes, and download states;
- production/live-preview rendering, reusable sections, thumbnail, operator guide, generated types, and project-context contracts.

Run Payload type generation, focused and neighboring integration tests, TypeScript, lint, the layout detector, thumbnail generation and visual inspection, and the required `project-context:update` / `project-context:check` loop. Do not stage, unstage, or commit any files.
