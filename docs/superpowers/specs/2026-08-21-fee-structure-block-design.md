# Fee Structure Block Design

## Goal

Create a reusable Page block that presents one programme's fee structure for one academic session. Editors can configure fee categories, academic-period columns, fee rows, totals, notes, and an optional official file download without exposing bank-account details.

## Source Boundary

The supplied `FEE STRUCTURE 2026-27.pdf` is source material, not an instruction set. It contains an MBBS fee schedule for session 2026-27 with General and NRI tables, five academic-year columns, one-time charges, accommodation and food charges, a General total row, a 4.5-year package note, payment guidance, and bank details.

Only fee-related information belongs in the webpage model. The block must not provide fields for bank name, branch, account number, IFSC, or other payment-account details. The original PDF may still be uploaded and offered as the official download.

The implementation must not infer missing figures. In particular, the source does not show an NRI total row, so one must not be invented.

## Existing Capability Assessment

No current Page block represents this information faithfully:

- Rich Text does not enable Lexical table authoring.
- Tabs Content supports prose, media, and curriculum lists rather than matrix data.
- Awards List has a table presentation with award-specific columns and semantics.
- Download List can publish the PDF but cannot render the fee matrix.

A dedicated `Fee Structure` block is therefore preferred over extending an unrelated block. The official `@shadcn/table` and `@shadcn/tabs` primitives may be added through the shadcn CLI; the project already has Card and Button primitives for the mobile and download presentations.

## Scope

One Fee Structure block represents exactly one programme and one academic session. A page that needs MBBS, Nursing, and Allied Health fee schedules uses separate block instances. Fee categories such as General and NRI live within that programme block.

The block is registered for Pages and Reusable Sections and receives the same production renderer, live-preview renderer, thumbnail, generated types, tests, documentation, block error boundary, appearance controls, and spacing contracts as neighboring visual blocks.

## Payload Authoring Model

The block uses the standard top-level `Content` and `Theme Settings` tabs.

### Content

The section-level fields follow existing block conventions:

- `eyebrow`
- `title`
- `accentTitle`
- `description`
- shared `actions`, up to two
- `programmeName`, required
- `academicSession`, required
- `feeCategories`, required, one to four rows
- `feeDocument`, optional Media upload
- `downloadLabel`, default `Download Fee Structure`
- shared `footerActions`, up to two

Each fee category contains:

- `label`, required, such as `General` or `NRI`
- `caption`, optional accessible table description
- `columns`, required, one to six ordered academic-period labels
- `rows`, required, one to thirty ordered fee rows
- `notes`, optional, up to eight fee-related summary rows

Each fee row contains:

- `label`, required, such as `Tuition Fee`
- `note`, optional, such as `One time`
- `emphasis`, required, `standard` or `total`, default `standard`
- `cells`, an ordered value list aligned by index to the category's columns

Each cell stores one editor-authored display value. Values remain text so the same table can faithfully represent Indian rupees, US dollars, unavailable values, and official wording without currency conversion or invented calculations.

The rows field validates that every row has the same number of cells as its category has columns. Admin descriptions explain that cell order follows column order. Runtime normalization remains defensive: missing cells render an em dash and extra cells are ignored if malformed legacy data bypasses validation.

Each category note contains required text and an optional emphasis flag. Notes are for fee-related statements such as an official total package and render only with their owning category; they are not intended for account credentials.

The uploaded document is independent from shared section/footer actions. When a valid Media file resolves, the block renders one download action using the configured label. No empty action renders when the upload is absent or invalid.

### Theme Settings

The block reuses:

- `createBlockAppearanceFields()`
- `contentAlignment`: Left or Center, default Left
- `tabStyle`: Underline, Pills, or Boxed, visible only when relevant to category presentation
- `size`: None, Compact, Default, or Comfortable

There is no Split section layout. The matrix retains the full regular block container width at every desktop breakpoint.

## Frontend Presentation

The outer section reuses the existing regular container and responsive padding helpers, appearance resolver, `SectionEyebrow`, shared section typography, `ContentActions`, and `BlockFooterActions`.

Programme name and academic session appear as concise context above the fee-category control, without creating another page-level heading.

Category behavior:

- One valid category renders directly without a tab control.
- Two or more valid categories render through accessible tabs.
- The first valid category is active by default.
- Keyboard navigation, focus state, tab/panel relationships, and horizontal tab-rail overflow follow the shadcn Tabs accessibility contract.

Desktop and tablet presentation:

- Render a semantic table with a caption when supplied.
- Fee Head is the first column.
- Academic-period labels form the remaining column headers.
- Numeric-looking values use tabular numerals and right alignment.
- The Fee Head column remains visible when a wide matrix scrolls horizontally.
- Total rows use stronger type and a subtle semantic background.
- Table overflow has a visible affordance and never clips content.

Mobile presentation:

- Replace the wide table with one Card per academic-period column.
- Each card lists every fee head, optional row note, and that period's value.
- Total rows remain visually emphasized.
- Category tabs stay above the cards and may scroll horizontally if needed.

The two responsive representations use the same normalized data and preserve the same row and column order. The mobile cards are a presentation change, not duplicated CMS content.

The active category's notes appear beneath its table or cards. The optional document download follows the category presentation in a restrained file panel containing the configured label and the shared Button treatment. Shared footer actions remain last in document order.

## Normalization And Failure Behavior

- Trim all labels, notes, and values.
- Omit categories without a valid label, at least one valid column, and at least one valid row.
- Omit rows without a valid label.
- Normalize unknown row emphasis to `standard`.
- Render an em dash for an empty or missing cell.
- Ignore cells beyond the number of valid columns.
- Render no block when programme name, academic session, or every category is invalid.
- Render no category tabs when fewer than two valid categories remain.
- Never calculate totals, convert currencies, or infer missing values.
- Render no document action when the Media relationship does not resolve to a usable file URL.

These rules keep incomplete drafts safe in live preview while publish-time field requirements prevent new incomplete records.

## Example Mapping From The Supplied Schedule

The MBBS 2026-27 source can be represented without reinterpretation:

- Programme: `MBBS`
- Session: `2026-27`
- Categories: `General` and `NRI`
- Columns: `1st Year` through `5th Year`
- General rows: Tuition Fee, Admission Fee, Security Money, Accommodation and Fooding etc., and Total
- NRI rows: Tuition Fee, Admission Fee, Security Money, and Accommodation and Fooding etc.
- General summary note: total package for 4.5 years is Rs. 71.75 lakhs per student for the entire course
- Official document: the supplied PDF

The NRI tuition row explicitly uses USD values, while the other NRI charges are printed as unprefixed numeric values. Text cells preserve this source wording without assigning an unstated currency.

## Components And Ownership

Expected implementation units:

- `src/blocks/FeeStructure/config.ts`: Payload schema and validation
- `src/blocks/FeeStructure/Component.tsx`: server-safe normalization and section composition
- `src/blocks/FeeStructure/FeeStructureClient.tsx`: category-tab state and responsive presentation
- `src/blocks/FeeStructure/types.ts`: client-safe authored and normalized contracts
- `src/components/ui/table.tsx`: official shadcn Table primitive if not already installed
- `src/components/ui/tabs.tsx`: official shadcn Tabs primitive if not already installed

Registration, renderers, thumbnail fixtures, generated types, architecture references, and operator documentation follow the repository's complete block-change contract. No collection, route, API, database migration, or custom Payload Admin component is required.

## Verification

Focused contracts cover:

- block identity, Content/Theme Settings tabs, required limits, defaults, and shared fields;
- category/column/row/cell validation;
- one category without tabs and multiple categories with accessible tabs;
- desktop semantic table markup and mobile card markup;
- mixed INR/USD display values;
- standard and total row presentation;
- missing, empty, and excess-cell normalization;
- invalid category and invalid-block fallbacks;
- valid and invalid Media download behavior;
- section actions, footer actions, appearance, alignment, and spacing;
- Page/Reusable registration and production/live-preview parity;
- shadcn import-map changes, generated Payload types, thumbnail, documentation, and project context.

After implementation, run Payload type and import-map generation, refresh the Fee Structure thumbnail, visually inspect desktop/tablet/mobile behavior, run the focused and neighboring block contracts, ESLint, TypeScript, and the required project-context update/check loop.

## Out Of Scope

- Bank or payment-account details
- Online fee payment
- Automatic calculations or currency conversion
- Comparison across multiple programmes in one block
- Sorting, filtering, pagination, or spreadsheet import
- Per-cell links, tooltips, or editorial rich text
- Separate mobile content authoring
