# Hierarchical Search Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Return canonical hierarchical Page URLs from both public search surfaces.

**Architecture:** Add a server-only resolver that delegates to the canonical Page path helper and caches parent promises per request. Both search implementations consume its ID-to-href map and omit unresolved Pages.

**Tech Stack:** Payload CMS 3, Next.js 15, TypeScript, Vitest

## Global Constraints

- Do not stage or commit changes.
- Preserve search matching, limits, labels, styling, throttling, and non-Page URLs.
- Omit a Page when any parent cannot be resolved.
- Use one resolver for both search surfaces.

---

### Task 1: Build The Shared Resolver

**Files:**
- Create: `src/lib/searchPagePaths.ts`
- Create: `tests/int/search-page-paths.int.spec.ts`

- [ ] Write failing tests for root, multi-level, sibling deduplication, missing-parent, and rejected-parent cases.
- [ ] Implement:

```ts
export async function resolveSearchPageHrefs(
  pages: Array<Pick<Page, 'id' | 'parent' | 'slug'>>,
  payload: Pick<Payload, 'findByID'>,
): Promise<Map<string, string>>
```

- [ ] Cache each `findByID` promise by parent ID before awaiting it. Read Pages with `depth: 0`
and `select: { parent: true, slug: true }`. Normalize lookup rejection to `null`.
- [ ] Resolve Pages concurrently with `getPageHrefFromSourceWithResolver` and add only non-null
hrefs to the map.
- [ ] Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/search-page-paths.int.spec.ts
```

### Task 2: Wire Both Search Surfaces

**Files:**
- Modify: `src/app/(frontend)/search/page.tsx`
- Modify: `src/app/api/search/route.ts`
- Create: `tests/int/search-hierarchical-routes.int.spec.tsx`

- [ ] Add failing tests that mock Payload with a child Page and parent, then assert both rendered
`/search` HTML and API JSON contain `/parent/child`, not `/child`.
- [ ] After a fulfilled Page query, call:

```ts
const pageHrefs = await resolveSearchPageHrefs(pagesResult.value.docs, payload)
```

- [ ] In each Page loop, retrieve `pageHrefs.get(String(page.id))`; continue when absent and use
the resolved value as `href`.
- [ ] Verify Article and News & Events href assertions remain unchanged.
- [ ] Run the resolver and route tests together.

### Task 3: Document And Verify

**Files:**
- Modify: `docs/guides/search.md`
- Modify: `docs/architecture/feature-inventory.md`

- [ ] State that Page results use their complete parent path and unresolved hierarchies are omitted.
- [ ] Remove only the hierarchical-search limitation from the feature inventory.
- [ ] Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/search-page-paths.int.spec.ts \
  tests/int/search-hierarchical-routes.int.spec.tsx \
  tests/int/dashboard-capability-filtering.int.spec.tsx \
  tests/int/news-events-metadata.int.spec.ts
pnpm exec eslint src/lib/searchPagePaths.ts \
  'src/app/(frontend)/search/page.tsx' src/app/api/search/route.ts \
  tests/int/search-page-paths.int.spec.ts tests/int/search-hierarchical-routes.int.spec.tsx
pnpm exec tsc --noEmit --pretty false
git diff --check
```

Expected: all checks pass and all changes remain uncommitted.
