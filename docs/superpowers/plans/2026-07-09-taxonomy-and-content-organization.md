# Taxonomy And Content Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable taxonomy, archive routes, and related-content behavior for `articles` and `reviews` so the starter operates like a stronger website CMS.

**Architecture:** Add first-class `categories` and `tags` collections, then attach them to `articles` and `reviews` with a required `primaryCategory`. Extend the existing published-content retrieval layer in `src/lib/contentEntries.ts` for taxonomy archives and related entries, and wire public routes/components on top of those helpers rather than scattering Payload queries across pages.

**Tech Stack:** Payload CMS, Next.js App Router, TypeScript, React, Vitest

## Global Constraints

- introduce reusable `categories` and `tags` collections
- connect taxonomy to `articles`
- connect taxonomy to `reviews`
- add category and tag-driven archive behavior for article content
- add category-driven archive behavior for review content
- add simple related-content behavior for article and review entry pages
- improve admin organization and list-view visibility for taxonomy-aware content
- add tests around taxonomy-driven published-content behavior
- taxonomy support for `pages` is out of scope
- full-text search is out of scope
- review tag routes are out of scope for this phase
- related-content rules must stay deterministic and published-only

---

### Task 1: Add Reusable Taxonomy Collections

**Files:**
- Create: `src/collections/Categories.ts`
- Create: `src/collections/Tags.ts`
- Modify: `src/payload.config.ts`
- Modify: `tests/int/adminCapabilities.int.spec.ts`
- Test: `tests/int/taxonomy.int.spec.ts`

**Interfaces:**
- Consumes: `hideFromUsersWithoutCapability`, `requireCapability`, `allowPublicReadOrCapability`
- Produces:
  - `Categories: CollectionConfig`
  - `Tags: CollectionConfig`
  - Payload collections slugs: `'categories' | 'tags'`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'

import { Categories } from '@/collections/Categories'
import { Tags } from '@/collections/Tags'

describe('taxonomy collections', () => {
  it('defines hierarchical categories and flat tags', () => {
    expect(Categories.slug).toBe('categories')
    expect(Tags.slug).toBe('tags')

    const categoryParent = Categories.fields.find((field) => 'name' in field && field.name === 'parent')
    const tagParent = Tags.fields.find((field) => 'name' in field && field.name === 'parent')

    expect(categoryParent).toBeDefined()
    expect(tagParent).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/taxonomy.int.spec.ts`
Expected: FAIL because `Categories` and `Tags` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'description', type: 'textarea' },
  ],
}

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    { name: 'description', type: 'textarea' },
  ],
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/taxonomy.int.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/collections/Categories.ts src/collections/Tags.ts src/payload.config.ts tests/int/taxonomy.int.spec.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(cms): add taxonomy collections"
```

### Task 2: Attach Taxonomy To Articles And Reviews

**Files:**
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `tests/int/articles.int.spec.ts`
- Modify: `tests/int/reviews.int.spec.ts`
- Test: `tests/int/taxonomy.int.spec.ts`

**Interfaces:**
- Consumes: taxonomy collection slugs `'categories'` and `'tags'`
- Produces:
  - `primaryCategory: relationship -> categories`
  - `categories: relationship[] -> categories`
  - `tags: relationship[] -> tags`

- [ ] **Step 1: Write the failing test**

```ts
it('adds taxonomy relationships to articles and reviews', () => {
  const articleTabs = Articles.fields.find((field) => field.type === 'tabs')
  const reviewTabs = Reviews.fields.find((field) => field.type === 'tabs')

  expect(JSON.stringify(articleTabs)).toContain('primaryCategory')
  expect(JSON.stringify(articleTabs)).toContain('"relationTo":"categories"')
  expect(JSON.stringify(articleTabs)).toContain('"relationTo":"tags"')

  expect(JSON.stringify(reviewTabs)).toContain('primaryCategory')
  expect(JSON.stringify(reviewTabs)).toContain('"relationTo":"categories"')
  expect(JSON.stringify(reviewTabs)).toContain('"relationTo":"tags"')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/taxonomy.int.spec.ts`
Expected: FAIL because the taxonomy fields are missing.

- [ ] **Step 3: Write minimal implementation**

```ts
{
  name: 'primaryCategory',
  type: 'relationship',
  relationTo: 'categories',
  required: true,
}
{
  name: 'categories',
  type: 'relationship',
  relationTo: 'categories',
  hasMany: true,
}
{
  name: 'tags',
  type: 'relationship',
  relationTo: 'tags',
  hasMany: true,
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/taxonomy.int.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/collections/Articles.ts src/collections/Reviews.ts tests/int/taxonomy.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts
git commit -m "feat(content): attach taxonomy to entries"
```

### Task 3: Add Archive And Related-Content Retrieval

**Files:**
- Modify: `src/lib/contentEntries.ts`
- Create: `tests/int/content-taxonomy.int.spec.ts`
- Test: `tests/int/content-taxonomy.int.spec.ts`

**Interfaces:**
- Consumes:
  - `getPayload({ config: configPromise })`
  - published `articles` and `reviews`
  - category/tag slugs
- Produces:
  - `getArticlesByCategorySlug(slug: string): Promise<Article[]>`
  - `getArticlesByTagSlug(slug: string): Promise<Article[]>`
  - `getReviewsByCategorySlug(slug: string): Promise<Review[]>`
  - `getRelatedArticles(article: Article, limit?: number): Promise<Article[]>`
  - `getRelatedReviews(review: Review, limit?: number): Promise<Review[]>`

- [ ] **Step 1: Write the failing test**

```ts
it('returns only published articles for a category archive', async () => {
  payloadMocks.find.mockResolvedValue({ docs: [{ id: 1, slug: 'published-article', _status: 'published' }] })

  const entries = await getArticlesByCategorySlug('guides')

  expect(entries).toHaveLength(1)
  expect(payloadMocks.find).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'articles',
    }),
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:int -- --run tests/int/content-taxonomy.int.spec.ts`
Expected: FAIL because the archive and related-content helpers do not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export const getArticlesByCategorySlug = cache(async (slug: string): Promise<Article[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { 'primaryCategory.slug': { equals: slug } },
      ],
    },
    depth: 2,
    limit: 24,
  })

  return result.docs
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:int -- --run tests/int/content-taxonomy.int.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/contentEntries.ts tests/int/content-taxonomy.int.spec.ts
git commit -m "feat(frontend): add taxonomy content queries"
```

### Task 4: Add Frontend Archive Pages And Related Content UI

**Files:**
- Create: `src/app/(frontend)/articles/category/[slug]/page.tsx`
- Create: `src/app/(frontend)/articles/tag/[slug]/page.tsx`
- Create: `src/app/(frontend)/reviews/category/[slug]/page.tsx`
- Create: `src/components/articles/ArticleArchivePage.tsx`
- Create: `src/components/reviews/ReviewArchivePage.tsx`
- Modify: `src/components/articles/ArticlePage.tsx`
- Modify: `src/components/reviews/ReviewPage.tsx`
- Test: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Consumes:
  - `getArticlesByCategorySlug`
  - `getArticlesByTagSlug`
  - `getReviewsByCategorySlug`
  - `getRelatedArticles`
  - `getRelatedReviews`
- Produces:
  - article category archive route
  - article tag archive route
  - review category archive route
  - related-content sections on entry pages

- [ ] **Step 1: Write the failing test**

```ts
test('can open an article category archive', async ({ page }) => {
  await page.goto('http://localhost:3000/articles/category/guides')
  await expect(page.locator('h1')).toContainText('Guides')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`
Expected: FAIL because the taxonomy archive routes do not exist.

- [ ] **Step 3: Write minimal implementation**

```tsx
export default async function ArticleCategoryArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const articles = await getArticlesByCategorySlug(slug)

  return <ArticleArchivePage archiveLabel={slug} articles={articles} />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:e2e`
Expected: PASS with archive routes and related-content rendering available.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/articles/category/[slug]/page.tsx src/app/(frontend)/articles/tag/[slug]/page.tsx src/app/(frontend)/reviews/category/[slug]/page.tsx src/components/articles/ArticleArchivePage.tsx src/components/reviews/ReviewArchivePage.tsx src/components/articles/ArticlePage.tsx src/components/reviews/ReviewPage.tsx tests/e2e/frontend.e2e.spec.ts
git commit -m "feat(site): add taxonomy archive pages"
```
