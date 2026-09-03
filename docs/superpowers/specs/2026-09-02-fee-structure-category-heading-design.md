# Fee Structure Category Heading Design

## Problem

The Programme Cost Atlas presentation appends the fixed words `fee heads` to the authored fee-category label. A category named `General Students` therefore renders as `General Students fee heads`, even though the category label is already meaningful on its own and the adjacent `Statement breakdown` eyebrow establishes the section context.

The default Fee Structure table presentation and category tabs already render the authored category label without this suffix.

## Decision

Render the Programme Cost Atlas statement title from `category.label` only. Keep the existing `Statement breakdown` eyebrow unchanged.

For example:

- Authored category label: `General Students`
- Atlas statement title: `General Students`
- Atlas eyebrow: `Statement breakdown`

## Scope

- Update only the Programme Cost Atlas statement heading.
- Add a focused regression assertion that the heading equals the authored category label and does not contain the legacy suffix.
- Update maintained Fee Structure documentation only where needed to record that the Atlas heading preserves the authored label verbatim.
- Run the required project-context update/check loop after implementation.

## Non-goals

- Do not add a new Payload field or configurable suffix.
- Do not modify saved Fee Structure content, normalization, generated Payload types, category tabs, the default table/mobile-card layout, or individual fee-row names.
- Do not change the `Statement breakdown` eyebrow, Atlas layout, styling, or download behavior.
- Do not migrate existing documents.

## Verification

- The focused Fee Structure integration test verifies the Atlas title text.
- The Fee Structure integration suite, lint for touched source/test files, TypeScript checking, project-context check, and `git diff --check` pass.
