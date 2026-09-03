# PG Fee Structure Block Design

**Date:** 2026-08-30

## Goal

Add a dedicated PG Fee Structure block for department-based postgraduate fees. The block must retain the existing Fee Structure block's established section, tabs, theme, document-download, and action patterns while replacing its academic-period matrix with a department-first fee model.

The existing Fee Structure block and all saved Fee Structure content remain unchanged.

## Block Identity and Registration

- Directory: `src/blocks/PGFeeStructure/`
- Payload slug: `pgFeeStructure`
- Generated interface: `PGFeeStructureBlock`
- Admin label: `PG Fee Structure`
- Picker group: Advanced Library, immediately after Fee Structure
- Register on Pages, Reusable Sections, and News & Events detail templates through the canonical block catalog.
- Add explicit production and live-preview renderer cases.
- Add a thumbnail definition, production fixture, and generated 1600×900 JPEG.

Adding the block increases the Page catalog from 55 to 56 blocks and the non-recursive Reusable Section catalog from 54 to 55 blocks.

## Payload Authoring Model

The block keeps the existing Fee Structure field organization: top-level Content and Theme Settings tabs.

### Content fields

- Optional eyebrow, title, italic accent title, description, and up to two shared section actions.
- Required Programme Name, intended for values such as `Postgraduate Courses` or `MD/MS`.
- Required Academic Session, stored as authored text.
- One to four Fee Categories, such as General and NRI.
- Optional official fee-structure Media document with the existing label, Link/Button display choice, Button variant, and download-container appearance.
- Up to two shared footer actions.

Each Fee Category owns:

- Required category label.
- Optional accessible table caption.
- One to six ordered Fee Columns.
- One to thirty ordered Departments.
- Up to eight category notes with optional emphasis.

Each Fee Column owns:

- Required label, such as `Tuition (Per Annum)`, `Hostel (Per Annum)`, or `Security (One Time)`.
- Required value mode:
  - `department`: Varies by Department.
  - `shared`: Same for All Departments.
- Required Shared Value only when the mode is `shared`.

Each Department owns:

- Required department name.
- Optional row note.
- An ordered Variable Fee Values array containing exactly one authored text value for every `department` fee column, following the variable columns' displayed order. Shared columns do not consume a department value.

Admin descriptions must explain the positional contract and name the distinction between shared and variable columns. Arrays use Payload's native collapsed-row presentation; this scope adds no custom Admin field.

### Theme Settings fields

- Shared block appearance.
- Section content alignment: Left or Center.
- Category tab style: Underline, Pills, or Boxed/Contained; visible only with multiple categories.
- Category tab width: Content Width, Centered Auto Width, or Equal Full Width; visible only with multiple categories.
- Existing download display and appearance controls, conditional on an uploaded document.
- Shared section padding: None, Compact, Default, or Comfortable.

The PG block intentionally has no Programme Cost Atlas layout field.

## Validation Contract

Validation rejects:

- Duplicate non-empty category labels after trimming and case normalization.
- Duplicate non-empty fee-column labels within one category.
- Duplicate non-empty department names within one category.
- Shared fee columns without a non-empty shared value.
- Department rows whose Variable Fee Values count differs from the number of variable fee columns.

Validation errors identify the affected category or department and the expected value count. The schema permits draft authoring through the repository's normal Page draft behavior but must prevent invalid published content through the block field validations.

## Runtime Normalization

The normalizer is PG-specific and has no dependency on the existing academic-period normalizer.

For each valid category it:

1. Trims authored labels, notes, and values.
2. Preserves every currency and amount as display text; it performs no numeric parsing, calculation, currency conversion, or total inference.
3. Builds the ordered visible columns from valid fee columns.
4. Walks each department's variable values only when it encounters a `department` column.
5. Uses the column's shared value whenever it encounters a `shared` column.
6. Produces one complete ordered cell array per department.
7. Uses an em dash for an unavailable draft-time value instead of inventing an amount.
8. Omits categories without a label, a usable column, or a usable department, and omits department rows without a name.

General and NRI remain independent categories. They may own different department lists, fee columns, currencies, and notes.

## Visitor Presentation

### Section shell

The server component mirrors the existing Fee Structure composition:

- Optional shared section introduction and actions.
- Programme/Academic Session context band.
- Category presentation.
- Optional official fee-structure download panel.
- Shared footer actions.

If Programme Name, Academic Session, or every category is unusable, the block returns `null`.

### Category navigation

- One category renders directly with its category heading.
- Multiple categories use the existing accessible Radix category tabs.
- Tabs reuse `contentTabRail.ts`, including semantic Contained radius, unchanged Pill geometry, Underline behavior, light/brand surfaces, width modes, horizontal overflow, keyboard navigation, and visible focus states.
- Tab state is client-owned and starts at the first valid category.

### Desktop table

From the medium breakpoint:

- Render one semantic table per active category.
- Use `Department` as the sticky first-column heading.
- Render each configured fee column as an ordered column header.
- Render department names as row headers and optional department notes as supporting row metadata.
- Right-align fee values and apply tabular numerals only to values containing digits, without parsing them.
- Keep horizontal overflow inside the table wrapper.
- Reuse the existing Card/Primary table surfaces, continuous sticky-column backgrounds, borders, hover states, semantic `rounded-card` frame, and light/brand contrast behavior.
- Render the optional category caption through a proper table caption.

Shared and department-specific values have identical visitor styling.

### Mobile cards

Below the medium breakpoint:

- Render one semantic Card per department, not one card per fee column.
- Use the department name as the card heading and its optional note as supporting text.
- Render every fee column as a label/value row in configured order.
- Preserve exact authored amount strings and right-align values.
- Reuse semantic Card/Primary surfaces, borders, dividers, and `rounded-card` behavior.

### Notes and downloads

- Category notes appear below the active desktop table or mobile cards.
- The official document panel retains the existing `Official fee structure` title and visitor Link/Button behavior.
- Extract the existing fee-document panel and Button-variant normalizer into a shared fee-document presentation module. Update the existing Fee Structure import without changing its DOM, styling, behavior, schema, or saved values. Both blocks then render one canonical download contract without a PG-to-FeeStructure feature dependency.

## Accessibility

- Category tabs expose the existing labels, roles, keyboard navigation, selected state, focus treatment, and tab panels.
- Desktop output uses `table`, `caption`, column headers, and scoped department row headers.
- Mobile cards preserve Department → fee-label → amount reading order.
- Supporting notes retain readable theme-aware foreground colors in light and brand sections.
- No color alone communicates whether a value is shared or department-specific because that distinction is authoring-only.

## Compatibility and Migration

- Do not modify the existing Fee Structure Payload schema or saved values.
- Do not migrate existing Fee Structure content into PG Fee Structure.
- PG Fee Structure is opt-in and begins with no saved documents.
- Generated Payload types must be refreshed because the schema and block registry change. No Admin import-map generation is required because the design adds no custom Admin component.
- No database migration script is required for the document-oriented Payload/MongoDB block addition.

## Verification

Add focused coverage for:

- Block identity, Content/Theme Settings structure, limits, defaults, and conditional fields.
- Category, column, shared-value, department, and variable-value validation.
- Normalization of mixed currencies, shared values, variable values, trimming, invalid draft data, and em-dash fallback.
- One-category direct rendering and multi-category accessible tab switching.
- Department-first desktop table semantics and department-first mobile cards.
- Light and brand table/card surface behavior, numeric alignment, semantic radii, and category notes.
- Document Link/Button rendering plus header and footer actions.
- Production and live-preview renderer parity.
- Page, Reusable Section, and News & Events detail catalog registration.
- Thumbnail definition and production fixture coverage.
- Generated Payload type coverage.

Required checks include focused integration tests, `pnpm generate:types`, TypeScript, lint, project-context update/check, and the relevant registration, renderer, preview, thumbnail, documentation, and semantic-theme contracts.

## Documentation Impact

Update:

- `.agents/skills/project-context/references/block-system.md`
- `.agents/skills/project-context/references/project-inventory.json` through the updater
- `docs/architecture/feature-inventory.md`
- `docs/guides/blocks.md`
- Any exact block-count assertions or operator text affected by the 56/55 catalogs

## Non-goals

- No change to the existing Fee Structure behavior or Programme Cost Atlas.
- No fee calculation, summation, installment logic, currency formatting, or currency conversion.
- No bank-account or payment-account fields.
- No department collection or relationship; department names are category-local authored rows.
- No database migration or automatic PG content creation.
- No public filtering, search, pagination, sorting, or comparison controls.
