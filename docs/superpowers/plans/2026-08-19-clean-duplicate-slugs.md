# Clean Duplicate Slugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate normalized, readable, sequential slugs for new and duplicated CMS records across every collection that uses generated slugs.

**Architecture:** Add one `projectSlugField` wrapper around Payload's experimental `slugField`. The wrapper owns separator normalization and a transaction-aware `beforeDuplicate` lookup, while collections retain their existing field placement and `useAsSlug: 'title'` configuration.

**Tech Stack:** TypeScript, Payload CMS 3, Vitest, pnpm

## Global Constraints

- Existing stored slugs and published URLs must remain unchanged.
- Generated slugs use lowercase ASCII words separated by one hyphen.
- Duplicate slugs use `base-copy`, `base-copy-2`, `base-copy-3`, and the first available later suffix.
- Duplicate lookup must include drafts, respect access control, and reuse the current Payload request/transaction.
- Do not patch Payload internals or add a transliteration dependency.
- The database unique constraint remains the final concurrency safeguard.

---

## File Structure

- Create `src/fields/projectSlugField.ts`: normalization, legacy copy-base recovery, available-suffix lookup, and the shared Payload slug-field wrapper.
- Create `tests/int/project-slug-field.int.spec.ts`: focused normalization, duplicate lookup, failure-bound, and collection-adoption coverage.
- Modify the eleven collection configs currently importing Payload's `slugField` so they import and call `projectSlugField` instead.
- Update `.agents/skills/project-context/references/project-inventory.json` through the repository's generated context command after implementation.

### Task 1: Shared project slug field

**Files:**

- Create: `src/fields/projectSlugField.ts`
- Create: `tests/int/project-slug-field.int.spec.ts`

**Interfaces:**

- Produces: `normalizeProjectSlug(value: unknown): string | undefined`
- Produces: `projectSlugField(args?: ProjectSlugFieldArgs): RowField`
- Produces: a slug text-field `beforeDuplicate` hook that returns the first available clean copy slug.

- [ ] **Step 1: Write failing normalization and hook tests**

Add focused cases that assert:

```ts
expect(normalizeProjectSlug('  Campus --- News  ')).toBe('campus-news')
expect(normalizeProjectSlug('Campus - Copy')).toBe('campus-copy')
expect(normalizeProjectSlug('---')).toBeUndefined()
```

Extract the nested `slug` text field from `projectSlugField({ useAsSlug: 'title' })`, call its only `beforeDuplicate` hook with a mocked `req.payload.find`, and assert:

```ts
expect(await duplicate({ value: 'campus', ...hookArgs })).toBe('campus-copy')
expect(await duplicate({ value: 'campus', ...hookArgsWithOccupiedCopies })).toBe('campus-copy-3')
expect(await duplicate({ value: 'campus---copy---copy', ...hookArgs })).toBe('campus-copy-3')
```

Also assert every lookup receives:

```ts
expect.objectContaining({
  collection: 'gallery-albums',
  depth: 0,
  draft: true,
  limit: 1,
  overrideAccess: false,
  pagination: false,
  req,
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/project-slug-field.int.spec.ts
```

Expected: FAIL because `@/fields/projectSlugField` does not exist.

- [ ] **Step 3: Implement the normalizer and duplicate hook**

Create the helper with these core rules:

```ts
const DUPLICATE_SUFFIX = /(?:-copy(?:-\d+)?)+$/
const MAX_DUPLICATE_ATTEMPTS = 1_000

export const normalizeProjectSlug = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || undefined
}
```

The `beforeDuplicate` hook must normalize the incoming value, remove `DUPLICATE_SUFFIX` to recover the base, and query candidates in this order:

```ts
base - copy
base - copy - 2
base - copy - 3
```

Each local API query must use `draft: true`, `overrideAccess: false`, `req`, `depth: 0`, `limit: 1`, and `pagination: false`. Return `undefined` when the source has no usable slug. Throw a Payload `APIError` with status 409 if all 1,000 candidates are occupied.

- [ ] **Step 4: Wrap Payload's slug field without changing its UI contract**

Implement `projectSlugField` by calling Payload's `slugField` with:

```ts
slugify: ({ valueToSlugify }) => normalizeProjectSlug(valueToSlugify)
```

Run any caller-supplied `overrides` first, then find the nested slug text field by `args.name ?? 'slug'` and install the custom hook as its sole `hooks.beforeDuplicate` entry. Preserve all other generated field properties and hooks.

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
pnpm exec vitest run tests/int/project-slug-field.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: the focused suite and type checking PASS.

### Task 2: Adopt the helper across all slug collections

**Files:**

- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Categories.ts`
- Modify: `src/collections/Forms.ts`
- Modify: `src/collections/Footers.ts`
- Modify: `src/collections/GalleryAlbums.ts`
- Modify: `src/collections/Headers.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/SystemPages.ts`
- Modify: `src/collections/Tags.ts`
- Test: `tests/int/project-slug-field.int.spec.ts`

**Interfaces:**

- Consumes: `projectSlugField({ useAsSlug: 'title' })`
- Produces: the unchanged collection schemas with the shared normalization and duplication contract installed.

- [ ] **Step 1: Add a failing collection-adoption contract test**

Import all eleven collection configs, recursively inspect their `fields` and tab fields, and assert each schema contains exactly one nested text field named `slug` with:

```ts
expect(slugField.unique).toBe(true)
expect(slugField.index).toBe(true)
expect(slugField.hooks?.beforeDuplicate).toHaveLength(1)
expect(await slugField.custom?.slugify({ data: {}, req, valueToSlugify: 'Campus --- News' })).toBe(
  'campus-news',
)
```

The test should validate behavior through the configured functions rather than source-text matching.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/project-slug-field.int.spec.ts
```

Expected: FAIL because existing collection fields still use Payload's default duplicate hook.

- [ ] **Step 3: Replace collection imports and calls**

For every listed collection:

```ts
// Remove slugField from the payload import.
import { type CollectionConfig } from 'payload'

// Add the project helper.
import { projectSlugField } from '@/fields/projectSlugField'
```

Replace only:

```ts
slugField({ useAsSlug: 'title' })
```

with:

```ts
projectSlugField({ useAsSlug: 'title' })
```

Do not change collection labels, access, versions, hooks, fields, routes, or admin layout.

- [ ] **Step 4: Run focused and affected collection tests**

Run:

```bash
pnpm exec vitest run \
  tests/int/project-slug-field.int.spec.ts \
  tests/int/gallery-albums.int.spec.ts \
  tests/int/news-events-collection.int.spec.ts \
  tests/int/articles.int.spec.ts \
  tests/int/reviews.int.spec.ts \
  tests/int/taxonomy.int.spec.ts \
  tests/int/page-routing.int.spec.ts
```

Expected: all selected suites PASS.

### Task 3: Repository verification and project knowledge

**Files:**

- Modify (generated): `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: completed shared helper and collection adoption.
- Produces: verified repository state and current generated project inventory.

- [ ] **Step 1: Format and lint changed code**

Run:

```bash
pnpm exec prettier --write \
  src/fields/projectSlugField.ts \
  tests/int/project-slug-field.int.spec.ts \
  src/collections/Articles.ts \
  src/collections/Categories.ts \
  src/collections/Forms.ts \
  src/collections/Footers.ts \
  src/collections/GalleryAlbums.ts \
  src/collections/Headers.ts \
  src/collections/NewsEvents.ts \
  src/collections/Pages.ts \
  src/collections/Reviews.ts \
  src/collections/SystemPages.ts \
  src/collections/Tags.ts
pnpm exec eslint \
  src/fields/projectSlugField.ts \
  tests/int/project-slug-field.int.spec.ts \
  src/collections/Articles.ts \
  src/collections/Categories.ts \
  src/collections/Forms.ts \
  src/collections/Footers.ts \
  src/collections/GalleryAlbums.ts \
  src/collections/Headers.ts \
  src/collections/NewsEvents.ts \
  src/collections/Pages.ts \
  src/collections/Reviews.ts \
  src/collections/SystemPages.ts \
  src/collections/Tags.ts
```

Expected: both commands PASS.

- [ ] **Step 2: Run final tests and type checking**

Run:

```bash
pnpm exec vitest run tests/int/project-slug-field.int.spec.ts
pnpm exec tsc --noEmit
git diff --check
```

Expected: all commands PASS.

- [ ] **Step 3: Refresh and verify project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: generated inventory is current. The existing knowledge-graph freshness warning is acceptable if it is the only warning.

- [ ] **Step 4: Review final scope**

Run:

```bash
git status --short
git diff --stat
git diff -- src/fields/projectSlugField.ts tests/int/project-slug-field.int.spec.ts src/collections
```

Expected: only the approved slug implementation, tests, plan/spec documentation, and generated project inventory are changed.
