# PG Fee Category Heading Simplification

## Goal

Display each authored PG Fee Structure category label as the complete statement heading instead of appending the code-owned words `category department fees`.

## Design

- Keep the existing `Statement breakdown` eyebrow.
- Render `category.label` directly as the statement heading; for example, `General Students` remains `General Students`.
- Continue using the same normalized category label for tabs, summary facts, data attributes, and the bounded-list accessibility label.
- Leave category captions, department chapters, fee values, layout, scrolling, styling, and all Payload Admin fields unchanged.

## Existing Content

No schema change or migration is required. The suffix exists only in JSX and is not stored in Payload.

## Verification

- Update the focused PG Fee Structure integration assertion to expect the category label alone.
- Assert that the former generated phrase is absent.
- Run the focused integration suite, ESLint, TypeScript, project-context update/check, and whitespace checks.
