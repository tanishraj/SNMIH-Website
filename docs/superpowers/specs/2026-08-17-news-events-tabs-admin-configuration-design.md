# News & Events Tabs Admin Configuration Design

## Goal

Allow editors to configure which classification tabs appear in each `News & Events Tabs` block,
rename their visitor-facing labels, and control their order. Keep `All` mandatory and permanently
first without changing the block's existing cards, section settings, theme styling, or data model.

## Scope

This change extends the existing `newsEventsTabs` block only. It does not alter `News Grid`, the
News & Events collection classifications, entry routes, card presentation, or section-level
appearance controls.

## Admin Configuration

Add the following fields to the block's Content tab:

- `allTabLabel`: an optional text field with the default `All`. A blank value resolves to `All`.
- `tabs`: a reorderable Payload array with a maximum of seven rows and all seven classification
  rows as its default value.

Each `tabs` row contains:

- `classification`: a required select limited to `news`, `event`, `notice`, `holiday`,
  `achievement`, `announcement`, and `other`;
- `label`: a required text field used as the visitor-facing tab label.

The default rows preserve the current order and labels: News, Events, Notice, Holiday,
Achievements, Announcement, and Others. Editors may add, remove, rename, and drag rows to alter the
visible tab set. Array validation rejects repeated classifications. `All` is not available in the
classification select because it is managed separately.

## Runtime Architecture

Keep classification metadata in `src/lib/newsEventClassifications.ts`. Add block-owned types and a
normalization helper in `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`. The helper accepts CMS
values and returns a safe ordered tab list with these rules:

1. Prepend the mandatory `all` tab using the trimmed `allTabLabel`, or `All` when blank.
2. When `tabs` is `undefined` or `null`, append all seven default classification tabs for legacy
   document compatibility.
3. When `tabs` is an explicit empty array, return only `All`.
4. Preserve valid saved row order and trimmed custom labels.
5. Ignore invalid classifications, blank labels, and later duplicates defensively.

The presentation component resolves the tab configuration and passes it to
`NewsEventsTabsClient`. The client renders and navigates this list instead of the current fixed
constant. Its initial active tab remains `all`; click behavior, filtering, focus movement, ARIA
relationships, empty states, card grids, and horizontal overflow continue to work against the
resolved list.

The existing grouped server query may continue loading all classifications. The category set is
small and fixed, and retaining the shared grouped snapshot avoids changing caching and live-preview
data contracts for a presentation-only configuration feature.

## Compatibility and Error Handling

- Existing blocks that lack the new fields render the current eight tabs.
- Newly inserted blocks receive the seven editable default rows and the implicit `All` tab.
- Editors may deliberately remove every array row to show only `All`.
- Payload validation prevents duplicate classifications during normal editing.
- Runtime normalization protects frontend rendering from malformed values written through older
  documents or external APIs.
- No content migration is required because legacy absence has an explicit fallback.

## Testing and Generated Artifacts

Extend the focused News & Events Tabs integration coverage to verify:

- the new Payload fields, defaults, maximum row count, and duplicate validation;
- default and legacy tab resolution;
- custom ordering and labels;
- removed tabs and an explicit All-only configuration;
- defensive handling of invalid and duplicate stored rows;
- dynamic click filtering and Arrow, Home, and End keyboard navigation;
- unchanged card-grid, presentation, preview, and registration contracts.

Regenerate `src/payload-types.ts`, run focused tests and TypeScript validation, then complete the
project-context update/check loop. Update the maintained block documentation because the operator
contract changes from fixed tabs to configurable tabs. Do not regenerate the block thumbnail unless
the rendered visual output changes.

## Acceptance Criteria

- `All` is always the first visible tab and cannot be removed or reordered.
- An editor can add or remove any of the seven supported classification tabs.
- An editor can rename and reorder every classification tab.
- Each classification can appear at most once.
- Saved tab configuration controls frontend labels, visibility, order, filtering, and keyboard
  navigation.
- Existing blocks retain their current tab set without a migration.
- News Grid and existing News & Events card visuals remain unchanged.
