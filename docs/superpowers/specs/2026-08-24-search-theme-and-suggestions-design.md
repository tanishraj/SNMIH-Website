# Search Theme and Suggestions Design

## Goal

Make the full Search page feel native to each one-client deployment by removing unrelated result
colors and reducing the suggested-search decision load from twelve terms to six.

## Scope

This change covers the full `/search` page and the `Search Settings` Payload global. The command
palette Search Dialog keeps its current grouped, semantic-token presentation. Search queries,
published-content filtering, result limits, hierarchical Page URL resolution, and API behavior do
not change.

## Result Presentation

Every full-page result badge uses the active deployment theme instead of a content-type-specific
violet, sky, emerald, or rose palette. The badge uses a subtle Primary background, Primary text and
border, and the existing compact label shape.

Content types remain recognizable through a small Lucide icon and their existing text label:

- Page uses a document icon.
- Article uses a newspaper icon.
- News/Event uses a calendar icon.
- Review uses a star icon.

News/Event entries retain their resolved classification label, such as `Campus`, rather than being
flattened to a generic label. Group headings remain the primary large-scale categorization, while the
icon and label support scanning an individual result card. No new color tokens or per-client
configuration fields are introduced.

## Suggested Search Contract

`Search Settings > Suggested Searches` accepts at most six rows. Its Admin description explains that
the terms appear as ordered chips on the full Search page.

Suggestions are normalized for public rendering by trimming whitespace, removing empty values,
de-duplicating terms case-insensitively while preserving the first authored spelling and order, and
taking the first six terms. This defensive normalization protects the public page from legacy global
documents that already contain more than six rows or duplicate terms.

Admin validation rejects case-insensitive duplicates with a specific message. Existing documents are
not rewritten automatically. A legacy document with more than six rows continues to render only its
first six unique non-empty terms and must be trimmed to six rows the next time an editor saves it.

## Architecture

The Search page owns one small normalization helper for suggested terms and one typed mapping from
result type to Lucide icon. `SearchItem` no longer stores arbitrary Tailwind class strings. Result
badges render a static semantic class list so Tailwind compilation and theme behavior stay
predictable.

`SearchSettings.ts` changes `maxRows` from twelve to six and adds array-level duplicate validation.
The global retains its existing capability access, draft versions, and public read behavior. Because
the field shape remains the same, generated TypeScript interfaces should not structurally change,
but `pnpm generate:types` remains required after the schema edit.

## Accessibility and Responsive Behavior

- Icons are decorative because the adjacent label communicates the same meaning.
- Badge labels remain visible text; category recognition never depends on color or icon alone.
- The semantic Primary badge must remain legible across every registered light and dark theme.
- Long classification labels may wrap naturally rather than forcing the result title below an
  unusably narrow width.
- Suggested-search chips retain keyboard focus visibility and their current active-query treatment.
- Six suggestions remain a manageable wrapped group on narrow screens without progressive
  disclosure or client-side state.

## Error and Edge-Case Behavior

- Empty and whitespace-only suggestion rows are omitted publicly.
- `Admissions`, `admissions`, and ` Admissions ` are treated as one suggestion; the first valid row
  supplies the visible spelling.
- Missing or unknown result-type metadata falls back to the document icon without breaking the
  result.
- Existing partial-search failure handling remains unchanged and is outside this design's scope.

## Verification

Add focused contracts that verify:

1. Search Settings permits at most six rows;
2. duplicate terms are rejected case-insensitively with actionable validation copy;
3. legacy suggestion arrays are trimmed, de-duplicated, and capped at six during rendering;
4. the full Search page contains no violet, sky, emerald, or rose result classes;
5. every result badge uses semantic Primary classes, a decorative type icon, and a visible label;
6. News/Event classification labels and hierarchical Page URLs remain intact;
7. the Search Dialog remains unchanged; and
8. generated Payload types, TypeScript, lint, focused integration tests, and the production build
   remain green in proportion to the final diff.

## Documentation

Update the Search operator guide and feature inventory from twelve to six suggestions and describe
the themed result-label behavior. Refresh the generated project inventory and update the maintained
Payload/architecture reference only where the source-owned authoring or rendering contract changed.
