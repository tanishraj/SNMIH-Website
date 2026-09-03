# Department Profiles Filter Presentation Design

## Goal

Allow editors to present the Department Profiles department filter as either the existing tab rail or a dropdown/select input at every breakpoint.

## Payload Configuration

- Retain the stored `showDepartmentTabs` checkbox for saved-content compatibility, but relabel it **Show Department Filter**.
- Add a required `departmentFilterPresentation` select with `tabs` and `dropdown` options. Its default is `tabs`.
- Missing or invalid `departmentFilterPresentation` values resolve to `tabs`, preserving every existing page without a migration.
- Relabel the existing stored `allTabLabel` field **All Departments Label**. Its default and runtime fallback remain `All`.
- Show Department Filter Presentation and All Departments Label only when the department filter is enabled.
- Show Department Tab Style and Department Tab Width only when the filter is enabled and its presentation is Tabs.
- Do not delete or rewrite hidden saved tab settings when Dropdown is selected.

## Frontend Behavior

- Tabs preserve the current tablist semantics, keyboard navigation, styling variants, width modes, overflow behavior, and filtering logic.
- Dropdown renders the existing shadcn Select primitive with an accessible name of **Filter profiles by department**.
- Dropdown options contain All followed by departments that have at least one profile, preserving configured department order.
- Selecting a dropdown option uses the existing department selection path: it updates the active department, resets the visible profile count, filters Featured Profiles, and filters the directory.
- Search remains independently optional and continues filtering within the active department.
- When no department contains profiles, the department filter is omitted in either presentation.

## Layout and Theme

- The dropdown uses the same 44px height, semantic background, foreground, border, focus ring, and disabled behavior as the existing Search control and shared shadcn inputs.
- It is full width on compact screens and a compact fixed width on desktop.
- Search and Dropdown stack on compact screens and share the existing toolbar row on desktop.
- Light mode, dark mode, and client themes inherit existing semantic Select tokens; no block-specific hardcoded colors are introduced.

## Compatibility Boundaries

- Keep the `showDepartmentTabs`, `allTabLabel`, `tabVariant`, and `tabWidth` stored field names.
- The new setting changes presentation only; it does not alter profile data, department IDs, search, Load More, card layout, Featured Profile selection, or footer actions.
- No migration or compatibility renderer is required.

## Verification

- Test Payload field defaults, labels, options, and conditional visibility.
- Test legacy/missing values resolving to Tabs.
- Test Dropdown rendering, accessible naming, ordered options, department selection, Load More reset, Featured Profile filtering, and Search interoperability.
- Preserve existing tab keyboard and width tests.
- Regenerate Payload types and run focused Department Profiles tests, TypeScript, lint, formatting, UI detection, and the required project-context update/check loop.
