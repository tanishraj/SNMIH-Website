# Hierarchical Search Paths Design

## Context

The full search page and search API query Pages at relationship depth zero, then construct each
result URL as `/${page.slug}`. Child Pages therefore link to a root-level leaf slug instead of
their public hierarchical route.

## Goals

- Return the canonical full Page path from both search surfaces.
- Use the existing Page path resolution contract.
- Deduplicate shared parent lookups within one search request.
- Omit results whose complete parent chain cannot be resolved.
- Preserve non-Page search behavior.

## Non-Goals

- Adding a persisted Page path field or data migration.
- Changing result ranking, text matching, limits, labels, styling, or rate limiting.
- Changing Page hierarchy validation or routing.
- Adding Article, Review, or News & Events hierarchy.

## Architecture

A server-only helper will accept searched Page documents and a minimal Payload client exposing
`findByID`. It will call `getPageHrefFromSourceWithResolver` for every result.

The helper will keep a request-scoped map from parent ID to the in-flight or completed
`findByID` promise. Pages sharing an ancestor therefore reuse one lookup even when their paths
resolve concurrently. Parent reads use `depth: 0` and select only `slug` and `parent`.

The helper returns a map from each Page ID to its resolved href. A root Page resolves directly
without a parent query. A Page with any missing or failed parent lookup has no map entry.

Both `/search` and `GET /api/search` will resolve Page hrefs before appending Page results. They
will append only Pages with a mapped href. Article and News & Events mapping remains synchronous
and unchanged.

## Failure Handling

- A failed parent query is normalized to an unresolved parent for that Page path.
- An unresolved Page is omitted rather than linked to a leaf-slug fallback.
- Failures resolving one Page do not remove other Page, Article, or News & Events results.
- Existing top-level collection query failures continue to be isolated through
  `Promise.allSettled`.

## Testing

Focused tests will verify:

- a root Page resolves without parent queries;
- a multi-level Page produces all path segments;
- siblings reuse cached ancestor reads;
- a missing or rejected parent omits only affected Pages;
- full-page search emits the resolved URL;
- API search emits the same resolved URL;
- Article and News & Events URLs are unchanged.

## Documentation

The search guide will state that Page results use complete hierarchical paths. The resolved search
limitation will be removed from the feature inventory.

## Acceptance Criteria

- Neither search surface constructs Page hrefs directly from only `page.slug`.
- Both search surfaces share the same resolver.
- Parent reads are deduplicated per request.
- Broken parent chains never produce known-invalid result links.
- Focused tests, lint, TypeScript, and documentation checks pass.
- All changes remain uncommitted.
