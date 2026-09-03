# SEO Operations Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn SEO into a shared operating contract across pages, system pages, articles, reviews, and routed taxonomy archives, with route-aware sitemap behavior and balanced publish-time validation.

**Architecture:** Introduce a shared SEO field builder and resolver layer instead of continuing to duplicate field shapes and metadata logic across `pageData`, `contentEntries`, and sitemap routes. Apply that contract to every public surface, then enforce structural validation through a small hook so publishing blocks only on contradictory or invalid SEO states.

**Tech Stack:** Payload CMS, Next.js App Router, TypeScript, React, Vitest

## Global Constraints

- standardize SEO behavior across `pages`, homepage, `system-pages`, `articles`, `reviews`, and routed taxonomy archives
- add optional SEO overrides to `categories` and `tags`
- add consistent canonical, robots, and sitemap controls
- expand sitemap generation to all eligible public routes
- add balanced SEO validation and publish-time guardrails
- block only structural SEO contradictions, not missing optional copy
- review tag archive routing is out of scope
- keyword scoring, analytics integrations, and manual sitemap curation are out of scope

---

### Task 1: Build Shared SEO Contract Primitives

**Files:**
- Create: `src/fields/buildSEOFields.ts`
- Create: `src/hooks/validateSEOContract.ts`
- Modify: `src/lib/seo.ts`
- Test: `tests/int/seo-contract.int.spec.ts`

**Interfaces:**
- Consumes:
  - `robotsFieldOptions` in `src/lib/seo.ts`
  - Payload field definitions and beforeChange hooks
- Produces:
  - `buildSEOFields(options?: { allowOpenGraph?: boolean; allowSitemap?: boolean }): Field[]`
  - `resolveCanonicalURL(input: { canonicalURL?: string | null; resolvedPath: string }): string | null`
  - `resolveRobotsMode(input: { robotsMode?: 'default' | 'index' | 'noindex' | null; inheritedRobots?: RobotsFieldValue | null }): Metadata['robots']`
  - `resolveSitemapInclusion(input: { includeInSitemap?: 'default' | 'include' | 'exclude' | null; isIndexable: boolean; isPublicRoute: boolean; isPublished: boolean }): boolean`
  - `validateSEOContract: CollectionBeforeChangeHook`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

import { buildSEOFields } from '@/fields/buildSEOFields'
import { resolveCanonicalURL, resolveSitemapInclusion } from '@/lib/seo'

describe('seo contract primitives', () => {
  it('builds reusable seo fields with robots and sitemap controls', () => {
    const fields = buildSEOFields()

    expect(JSON.stringify(fields)).toContain('"name":"canonicalURL"')
    expect(JSON.stringify(fields)).toContain('"name":"robotsMode"')
    expect(JSON.stringify(fields)).toContain('"name":"includeInSitemap"')
  })

  it('rejects noindex routes from sitemap inclusion by default', () => {
    expect(
      resolveSitemapInclusion({
        includeInSitemap: 'default',
        isIndexable: false,
        isPublicRoute: true,
        isPublished: true,
      }),
    ).toBe(false)
  })

  it('keeps valid site-relative canonicals', () => {
    expect(resolveCanonicalURL({ canonicalURL: '/articles/launch-notes', resolvedPath: '/fallback' })).toBe(
      '/articles/launch-notes',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/seo-contract.int.spec.ts`
Expected: FAIL because the SEO builder and resolver helpers do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Field } from 'payload'

export const sitemapFieldOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Include', value: 'include' },
  { label: 'Exclude', value: 'exclude' },
] as const

export const robotsModeOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Index', value: 'index' },
  { label: 'No Index', value: 'noindex' },
] as const

export const buildSEOFields = (): Field[] => [
  { name: 'metaTitle', type: 'text' },
  { name: 'metaDescription', type: 'textarea' },
  { name: 'canonicalURL', type: 'text' },
  { name: 'robotsMode', type: 'select', defaultValue: 'default', options: [...robotsModeOptions] },
  { name: 'includeInSitemap', type: 'select', defaultValue: 'default', options: [...sitemapFieldOptions] },
]

export const resolveSitemapInclusion = ({ includeInSitemap, isIndexable, isPublicRoute, isPublished }) => {
  if (!isPublicRoute || !isPublished || !isIndexable) return false
  if (includeInSitemap === 'exclude') return false
  return true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/seo-contract.int.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/fields/buildSEOFields.ts src/hooks/validateSEOContract.ts src/lib/seo.ts tests/int/seo-contract.int.spec.ts
git commit -m "feat(seo): add shared seo contract primitives"
```

### Task 2: Apply The SEO Contract To Public Content Models

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/SystemPages.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/Categories.ts`
- Modify: `src/collections/Tags.ts`
- Modify: `src/globals/SEOSettings.ts`
- Modify: `tests/int/articles.int.spec.ts`
- Modify: `tests/int/reviews.int.spec.ts`
- Modify: `tests/int/taxonomy.int.spec.ts`
- Test: `tests/int/seo-contract.int.spec.ts`

**Interfaces:**
- Consumes:
  - `buildSEOFields(...)`
  - `validateSEOContract`
- Produces:
  - `robotsMode?: 'default' | 'index' | 'noindex'`
  - `includeInSitemap?: 'default' | 'include' | 'exclude'`
  - consistent SEO tabs/fields on all routable public models
  - optional SEO fields on taxonomy terms

- [ ] **Step 1: Write the failing test**

```ts
it('applies the seo contract to pages, system pages, entries, and taxonomy terms', () => {
  expect(JSON.stringify(Pages.fields)).toContain('"name":"robotsMode"')
  expect(JSON.stringify(SystemPages.fields)).toContain('"name":"includeInSitemap"')
  expect(JSON.stringify(Articles.fields)).toContain('"name":"includeInSitemap"')
  expect(JSON.stringify(Reviews.fields)).toContain('"name":"robotsMode"')
  expect(JSON.stringify(Categories.fields)).toContain('"name":"metaTitle"')
  expect(JSON.stringify(Tags.fields)).toContain('"name":"includeInSitemap"')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/seo-contract.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts tests/int/taxonomy.int.spec.ts`
Expected: FAIL because the current collections still use the older SEO field shape and taxonomy has no SEO fields.

- [ ] **Step 3: Write minimal implementation**

```ts
{
  label: 'SEO',
  fields: [
    ...buildSEOFields(),
  ],
}

hooks: {
  beforeChange: [
    validateSEOContract({
      isPublicRoute: true,
      routeType: 'article',
    }),
    enforceEditorialWorkflow('publish_articles'),
  ],
}
```

```ts
{
  label: 'SEO',
  fields: [
    ...buildSEOFields({ allowOpenGraph: false }),
  ],
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/seo-contract.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts tests/int/taxonomy.int.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/collections/Pages.ts src/collections/SystemPages.ts src/collections/Articles.ts src/collections/Reviews.ts src/collections/Categories.ts src/collections/Tags.ts src/globals/SEOSettings.ts tests/int/seo-contract.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts tests/int/taxonomy.int.spec.ts
git commit -m "feat(seo): apply seo contract to public models"
```

### Task 3: Resolve Metadata And Sitemap From The Shared Contract

**Files:**
- Modify: `src/app/(frontend)/pageData.ts`
- Modify: `src/lib/contentEntries.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Create: `tests/int/sitemap.int.spec.ts`
- Modify: `tests/int/page-routing.int.spec.ts`
- Test: `tests/int/sitemap.int.spec.ts`
- Test: `tests/int/page-routing.int.spec.ts`

**Interfaces:**
- Consumes:
  - `resolveCanonicalURL(...)`
  - `resolveRobotsMode(...)`
  - `resolveSitemapInclusion(...)`
  - published page/article/review/taxonomy route loaders
- Produces:
  - route-aware metadata for pages and content entries
  - sitemap coverage for homepage, pages, public system pages, articles, reviews, article tags, article/review categories
  - `robots.ts` still pointing to `/sitemap.xml`, but aligned with the shared robots resolver contract

- [ ] **Step 1: Write the failing test**

```ts
it('includes published articles and routed taxonomy archives in sitemap output', async () => {
  payloadMocks.find.mockImplementation(async ({ collection }) => {
    if (collection === 'articles') {
      return { docs: [{ id: 9, slug: 'launch-notes', updatedAt: '2026-07-09T00:00:00.000Z', includeInSitemap: 'default', robotsMode: 'index' }], totalPages: 1 }
    }

    return { docs: [], totalPages: 1 }
  })

  const { default: sitemap } = await import('@/app/sitemap')
  const result = await sitemap()

  expect(result.some((entry) => entry.url.endsWith('/articles/launch-notes'))).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/sitemap.int.spec.ts tests/int/page-routing.int.spec.ts`
Expected: FAIL because `sitemap.ts` currently emits published `pages` only.

- [ ] **Step 3: Write minimal implementation**

```ts
const entries = [
  ...(await getPageSitemapEntries()),
  ...(await getSystemPageSitemapEntries()),
  ...(await getArticleSitemapEntries()),
  ...(await getReviewSitemapEntries()),
  ...(await getTaxonomyArchiveSitemapEntries()),
]

return dedupeSitemapEntries(entries)
```

```ts
const robots = resolveRobotsMode({
  robotsMode: page.robotsMode,
  inheritedRobots: seoSettings.robots,
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/sitemap.int.spec.ts tests/int/page-routing.int.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/pageData.ts src/lib/contentEntries.ts src/app/sitemap.ts src/app/robots.ts tests/int/sitemap.int.spec.ts tests/int/page-routing.int.spec.ts
git commit -m "feat(seo): resolve metadata and sitemap from shared contract"
```

### Task 4: Enforce Structural SEO Guardrails And Verify The Full Contract

**Files:**
- Modify: `tests/int/api.int.spec.ts`
- Modify: `tests/int/seo-contract.int.spec.ts`
- Modify: `tests/int/sitemap.int.spec.ts`
- Modify: `src/payload-types.ts`
- Test: `tests/int/api.int.spec.ts`
- Test: `tests/int/seo-contract.int.spec.ts`
- Test: `tests/int/sitemap.int.spec.ts`

**Interfaces:**
- Consumes:
  - `validateSEOContract`
  - generated Payload types
  - final metadata/sitemap route behavior
- Produces:
  - blocked publish for invalid canonical and `noindex + include`
  - generated types containing `robotsMode` and `includeInSitemap`
  - final verified SEO contract

- [ ] **Step 1: Write the failing test**

```ts
it('blocks contradictory seo states before publish', async () => {
  await expect(
    validateSEOContract({
      isPublicRoute: true,
      routeType: 'article',
    })({
      data: {
        canonicalURL: 'not-a-valid-url',
        includeInSitemap: 'include',
        robotsMode: 'noindex',
      },
      req: { user: { role: 'admin' } },
    } as never),
  ).rejects.toThrow()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/seo-contract.int.spec.ts tests/int/sitemap.int.spec.ts tests/int/api.int.spec.ts`
Expected: FAIL because the guardrails are not fully enforced yet and sitemap behavior is not fully verified.

- [ ] **Step 3: Write minimal implementation**

```ts
if (resolvedCanonical === null) {
  throw new APIError('Canonical URL must be a valid site-relative path or absolute URL.', 400)
}

if (data?.robotsMode === 'noindex' && data?.includeInSitemap === 'include') {
  throw new APIError('Noindexed routes cannot be forced into the sitemap.', 400)
}
```

```bash
pnpm generate:types
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/seo-contract.int.spec.ts tests/int/sitemap.int.spec.ts tests/int/api.int.spec.ts`
Expected: PASS

Run: `pnpm test:int`
Expected: PASS with the SEO contract covered alongside the existing CMS suite.

- [ ] **Step 5: Commit**

```bash
git add tests/int/api.int.spec.ts tests/int/seo-contract.int.spec.ts tests/int/sitemap.int.spec.ts src/payload-types.ts
git commit -m "test(seo): verify seo contract and sitemap rules"
```
