# Articles And Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class `articles` and `reviews` CMS infrastructure with routed frontend rendering, explicit non-admin capability checkboxes, one reusable review layout block, and a dedicated moderated public review submission flow.

**Architecture:** This plan adds two Payload collections instead of a generic entry abstraction. `Articles` stay writing-first with one primary Lexical body and dedicated article rendering, while `Reviews` combine structured review fields, editorial workflow metadata, and a small block-based supplemental layout surface using one shared `ContentSpotlight` block. Public review intake writes directly into the `reviews` collection through a dedicated Next.js route that reuses the existing spam-protection utilities and saves new entries into `in_review` plus draft state.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, Payload Lexical rich text, Vitest

## Global Constraints

- Use two first-class collections: `articles` and `reviews`.
- `Articles` are full routed content entries with slug, SEO, preview, workflow, and a Lexical article body.
- `Articles` should not start with block-based body composition by default.
- `Reviews` are full routed content entries with slug, SEO, preview, workflow, and structured review fields.
- `Reviews` should render page layouts using a shared sample block component.
- Reviews should not be forced through the generic `forms` collection.
- Create the dedicated public route `src/app/api/reviews/submit/route.ts`.
- A valid public review submission should create a `reviews` document directly.
- Recommended initial state: workflow state `in_review`.
- Recommended initial state: Payload `_status` `draft`.
- Start with one shared sample block component: `ContentSpotlight`.
- Add these capabilities: `manage_articles`, `publish_articles`, `manage_reviews`, `publish_reviews`.
- `admin` continues to receive full automatic access to all capabilities, including the new ones.
- `publisher` receives both publish capabilities.
- `editor` does not receive article or review capabilities by default in this pass.
- No generic feature-flag framework is required for this pass.
- This pass should not include listing routes.
- This pass should not include a taxonomy system.
- This pass should not include multiple sample blocks.
- This pass should not include a second submission shadow collection.

---

## Scope Check

This spec is one cohesive sub-project inside the broader CMS roadmap, so it stays in one implementation plan. The plan intentionally stops at collection infrastructure, routed rendering, capability wiring, and moderated intake. It does not expand into listing pages, taxonomies, or a broader block library.

## File Structure

- Create: `src/collections/Articles.ts`
  Responsibility: define the writing-first article schema, access rules, workflow hooks, SEO fields, and preview URL support.
- Create: `src/collections/Reviews.ts`
  Responsibility: define the moderated review schema, structured review fields, supplemental `layout` blocks, access rules, and workflow hooks.
- Create: `src/blocks/ContentSpotlight/config.ts`
  Responsibility: declare the single reusable review layout block with heading, copy, optional image, and optional CTA link fields.
- Create: `src/blocks/ContentSpotlight/Component.tsx`
  Responsibility: map `ContentSpotlight` CMS data into a frontend section component.
- Create: `src/components/articles/ArticlePage.tsx`
  Responsibility: render article hero metadata and Lexical body in an editorial layout.
- Create: `src/components/reviews/ReviewPage.tsx`
  Responsibility: render structured review content first, then optional supplemental blocks.
- Create: `src/lib/contentEntries.ts`
  Responsibility: keep article and review lookup plus metadata helpers separate from `src/app/(frontend)/pageData.ts`.
- Create: `src/lib/reviews.ts`
  Responsibility: own review-specific display-name formatting, payload normalization, and public submission validation.
- Create: `src/app/(frontend)/articles/[slug]/page.tsx`
  Responsibility: resolve published article entries by slug and render the article page component.
- Create: `src/app/(frontend)/reviews/[slug]/page.tsx`
  Responsibility: resolve published review entries by slug and render the review page component.
- Create: `src/app/api/reviews/submit/route.ts`
  Responsibility: validate public review submissions, apply spam protection, and create draft moderation records in `reviews`.
- Modify: `src/access/adminCapabilities.ts`
  Responsibility: add article/review capabilities, expose capability checkboxes, and export publish helpers for new workflow hooks.
- Modify: `src/access/editorialRoles.ts`
  Responsibility: add safe role defaults for article and review capabilities.
- Modify: `src/hooks/enforceEditorialWorkflow.ts`
  Responsibility: extend workflow enforcement to support `publish_articles` and `publish_reviews`.
- Modify: `src/blocks/renderBlocks.tsx`
  Responsibility: render the new `contentSpotlight` block and accept `Review` layout blocks.
- Modify: `src/payload.config.ts`
  Responsibility: register `Articles` and `Reviews` collections.
- Modify: `src/payload-types.ts`
  Responsibility: regenerate generated types after collection and block changes.
- Modify: `tests/int/adminCapabilities.int.spec.ts`
  Responsibility: cover new capability defaults and admin-always-visible behavior.
- Create: `tests/int/articles.int.spec.ts`
  Responsibility: cover article collection shape and published-article lookup behavior.
- Create: `tests/int/reviews.int.spec.ts`
  Responsibility: cover review collection shape, block availability, and review routing helpers.
- Create: `tests/int/review-submission.int.spec.ts`
  Responsibility: cover review submission validation, spam protection seams, and draft moderation persistence.

### Task 1: Extend Capabilities And Workflow Enforcement

**Files:**
- Modify: `src/access/adminCapabilities.ts`
- Modify: `src/access/editorialRoles.ts`
- Modify: `src/hooks/enforceEditorialWorkflow.ts`
- Modify: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes: `hasAdminCapability(user, capability)`, `toAdminCapabilitiesMap(value)`, `getCapabilitiesForRole(role)`
- Produces:
  - `type AdminCapability = ... | 'manage_articles' | 'publish_articles' | 'manage_reviews' | 'publish_reviews'`
  - `canPublishArticles(user: AdminUserLike | null | undefined): boolean`
  - `canPublishReviews(user: AdminUserLike | null | undefined): boolean`
  - `type PublishCapability = 'publish_pages' | 'publish_system_pages' | 'publish_articles' | 'publish_reviews'`

- [ ] **Step 1: Write the failing capability test**

Replace `tests/int/adminCapabilities.int.spec.ts` expectations with:

```ts
it('assigns safe defaults to editors and publishers for articles and reviews', () => {
  expect(getDefaultCapabilitiesForRole('editor')).toEqual(
    expect.objectContaining({
      manage_articles: false,
      publish_articles: false,
      manage_reviews: false,
      publish_reviews: false,
    }),
  )

  expect(getDefaultCapabilitiesForRole('publisher')).toEqual(
    expect.objectContaining({
      publish_articles: true,
      publish_reviews: true,
      manage_articles: false,
      manage_reviews: false,
    }),
  )
})

it('gives admins unconditional access to the new article and review capabilities', () => {
  expect(requireCapability('manage_articles')({ req: { user: { role: 'admin' } } } as never)).toBe(
    true,
  )
  expect(requireCapability('manage_reviews')({ req: { user: { role: 'admin' } } } as never)).toBe(
    true,
  )
})

it('exposes article and review publish helpers separately', () => {
  const publisher = {
    role: 'publisher',
    capabilities: {
      publish_articles: true,
      publish_reviews: true,
    },
  }

  expect(canPublishArticles(publisher)).toBe(true)
  expect(canPublishReviews(publisher)).toBe(true)
})
```

- [ ] **Step 2: Run the targeted capability test and verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts`

Expected: FAIL with missing capability keys and missing `canPublishArticles` / `canPublishReviews` exports.

- [ ] **Step 3: Implement the new capabilities and workflow switch**

Update `src/access/adminCapabilities.ts`:

```ts
export const adminCapabilityFieldOptions = [
  // existing options
  {
    label: 'Articles',
    value: 'manage_articles',
  },
  {
    label: 'Publish Articles',
    value: 'publish_articles',
  },
  {
    label: 'Reviews',
    value: 'manage_reviews',
  },
  {
    label: 'Publish Reviews',
    value: 'publish_reviews',
  },
] as const

export const canPublishArticles = (user: AdminUserLike | null | undefined): boolean => {
  return hasAdminCapability(user, 'publish_articles')
}

export const canPublishReviews = (user: AdminUserLike | null | undefined): boolean => {
  return hasAdminCapability(user, 'publish_reviews')
}
```

Update `src/access/editorialRoles.ts`:

```ts
const withCapabilities = (enabled: Array<keyof AdminCapabilitiesMap>): AdminCapabilitiesMap => {
  const capabilities: AdminCapabilitiesMap = {
    manage_articles: false,
    manage_footers: false,
    manage_form_submissions: false,
    manage_forms: false,
    manage_headers: false,
    manage_media: false,
    manage_navigation: false,
    manage_page_settings: false,
    manage_pages: false,
    manage_redirects: false,
    manage_reviews: false,
    manage_seo_settings: false,
    manage_site_settings: false,
    manage_system_modes: false,
    manage_system_pages: false,
    manage_theme_settings: false,
    publish_articles: false,
    publish_pages: false,
    publish_reviews: false,
    publish_system_pages: false,
    view_operational_audit: false,
  }

  for (const capability of enabled) {
    capabilities[capability] = true
  }

  return capabilities
}

const publisherDefaults = withCapabilities([
  'manage_footers',
  'manage_headers',
  'manage_media',
  'manage_navigation',
  'manage_pages',
  'manage_redirects',
  'manage_system_pages',
  'publish_articles',
  'publish_pages',
  'publish_reviews',
  'publish_system_pages',
  'view_operational_audit',
])
```

Update `src/hooks/enforceEditorialWorkflow.ts`:

```ts
import {
  canPublishArticles,
  canPublishPages,
  canPublishReviews,
  canPublishSystemPages,
} from '@/access/adminCapabilities'

type PublishCapability =
  | 'publish_pages'
  | 'publish_system_pages'
  | 'publish_articles'
  | 'publish_reviews'

const canPublish = (capability: PublishCapability, user: unknown) => {
  switch (capability) {
    case 'publish_articles':
      return canPublishArticles(user as never)
    case 'publish_reviews':
      return canPublishReviews(user as never)
    case 'publish_system_pages':
      return canPublishSystemPages(user as never)
    case 'publish_pages':
    default:
      return canPublishPages(user as never)
  }
}
```

- [ ] **Step 4: Run the targeted capability test and verify it passes**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts`

Expected: PASS with new article/review capability defaults and publish helpers covered.

- [ ] **Step 5: Commit the capability groundwork**

```bash
git add src/access/adminCapabilities.ts src/access/editorialRoles.ts src/hooks/enforceEditorialWorkflow.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(auth): add article review capabilities"
```

### Task 2: Add The Articles Collection And Routed Article Rendering

**Files:**
- Create: `src/collections/Articles.ts`
- Create: `src/components/articles/ArticlePage.tsx`
- Create: `src/lib/contentEntries.ts`
- Create: `src/app/(frontend)/articles/[slug]/page.tsx`
- Modify: `src/payload.config.ts`
- Modify: `src/payload-types.ts`
- Test: `tests/int/articles.int.spec.ts`

**Interfaces:**
- Consumes: `allowPublicReadOrCapability`, `requireCapability`, `enforceEditorialWorkflow`, `editorialWorkflowStateOptions`, `robotsFieldOptions`
- Produces:
  - `export const Articles: CollectionConfig`
  - `getArticleBySlug(slug: string): Promise<Article | null>`
  - `getArticleMetadataBySlug(slug: string): Promise<Metadata>`
  - `ArticlePage({ article }: { article: Article }): JSX.Element`

- [ ] **Step 1: Write the failing article integration test**

Create `tests/int/articles.int.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Articles } from '@/collections/Articles'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: payloadMocks.find,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

const loadContentEntries = async () => {
  vi.resetModules()
  return import('@/lib/contentEntries')
}

describe('articles collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defines a writing-first body field and article workflow controls', () => {
    const tabsField = Articles.fields.find((field) => field.type === 'tabs')

    expect(tabsField).toBeDefined()
    expect(JSON.stringify(tabsField)).toContain('"name":"body"')
    expect(JSON.stringify(tabsField)).toContain('"type":"richText"')
    expect(JSON.stringify(tabsField)).toContain('"name":"metaTitle"')
    expect(JSON.stringify(tabsField)).toContain('"name":"workflowState"')
  })

  it('queries only published articles by slug', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [{ id: 7, slug: 'launch-notes', title: 'Launch Notes' }],
    })

    const { getArticleBySlug } = await loadContentEntries()
    const article = await getArticleBySlug('launch-notes')

    expect(article?.slug).toBe('launch-notes')
    expect(payloadMocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'articles',
        where: expect.objectContaining({
          and: expect.arrayContaining([
            { slug: { equals: 'launch-notes' } },
            { _status: { equals: 'published' } },
          ]),
        }),
      }),
    )
  })
})
```

- [ ] **Step 2: Run the article test and verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/articles.int.spec.ts`

Expected: FAIL because `Articles` and `getArticleBySlug` do not exist yet.

- [ ] **Step 3: Implement the article schema, helper, and route**

Create `src/collections/Articles.ts`:

```ts
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { slugField, type CollectionConfig } from 'payload'

import {
  allowPublicReadOrCapability,
  hideFromUsersWithoutCapability,
  requireCapability,
} from '@/access/adminCapabilities'
import { enforceEditorialWorkflow } from '@/hooks/enforceEditorialWorkflow'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { editorialWorkflowStateOptions } from '@/lib/editorialWorkflow'
import { robotsFieldOptions } from '@/lib/seo'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  admin: {
    group: 'Content',
    hidden: hideFromUsersWithoutCapability('manage_articles'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'workflowState', 'updatedAt'],
    listSearchableFields: ['title', 'slug', 'authorName'],
    preview: (data) => (data?.slug ? `/articles/${data.slug}` : null),
  },
  access: {
    create: requireCapability('manage_articles'),
    delete: requireCapability('manage_articles'),
    read: allowPublicReadOrCapability('manage_articles'),
    readVersions: requireCapability('manage_articles'),
    update: requireCapability('manage_articles'),
  },
  hooks: {
    afterChange: [
      createCollectionAuditHook({
        entityType: 'article',
        getSummary: ({ doc, previousDoc }) =>
          `Workflow moved from ${previousDoc?.workflowState ?? 'draft'} to ${doc.workflowState}.`,
        titleField: 'title',
      }),
    ],
    beforeChange: [enforceEditorialWorkflow('publish_articles')],
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      useAsSlug: 'title',
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'excerpt', type: 'textarea', required: true },
            { name: 'featuredImage', type: 'upload', relationTo: 'media' },
            { name: 'authorName', type: 'text', required: true },
            { name: 'publishedAtOverride', type: 'date' },
            {
              name: 'body',
              type: 'richText',
              editor: lexicalEditor(),
              required: true,
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text', required: true },
            { name: 'metaDescription', type: 'textarea', required: true },
            { name: 'canonicalURL', type: 'text' },
            { name: 'robots', type: 'select', options: [...robotsFieldOptions] },
            { name: 'ogTitle', type: 'text' },
            { name: 'ogDescription', type: 'textarea' },
            { name: 'ogImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Workflow',
          fields: [
            {
              name: 'workflowState',
              type: 'select',
              defaultValue: 'draft',
              options: [...editorialWorkflowStateOptions],
              required: true,
            },
            { name: 'scheduledPublishAt', type: 'date' },
            { name: 'changeSummary', type: 'textarea' },
            { name: 'lastReviewedAt', type: 'date', admin: { readOnly: true } },
            { name: 'lastReviewedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
            { name: 'publishedAt', type: 'date', admin: { readOnly: true } },
            { name: 'publishedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
          ],
        },
      ],
    },
  ],
}
```

Create `src/lib/contentEntries.ts`:

```ts
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Metadata } from 'next'
import type { Article } from '@/payload-types'

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'articles',
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })

  return result.docs[0] ?? null
})

export async function getArticleMetadataBySlug(slug: string): Promise<Metadata> {
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {}
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
  }
}
```

Create `src/components/articles/ArticlePage.tsx`:

```tsx
import { RichText } from '@payloadcms/richtext-lexical/react'

import { getMediaImageProps } from '@/lib/media'
import type { Article } from '@/payload-types'

export function ArticlePage({ article }: { article: Article }) {
  const featuredImage = getMediaImageProps({
    media: article.featuredImage,
    preset: 'hero',
    fallbackAlt: article.title,
  })
  const publishedAt = article.publishedAtOverride ?? article.publishedAt

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{article.authorName}</p>
        <h1 className="text-4xl font-semibold">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        {publishedAt ? <time dateTime={publishedAt}>{new Date(publishedAt).toLocaleDateString()}</time> : null}
        {featuredImage ? <img alt={featuredImage.alt} src={featuredImage.src} /> : null}
      </header>
      <RichText data={article.body} />
    </article>
  )
}
```

Create `src/app/(frontend)/articles/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticlePage } from '@/components/articles/ArticlePage'
import { getArticleBySlug, getArticleMetadataBySlug } from '@/lib/contentEntries'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return getArticleMetadataBySlug(slug)
}

export default async function ArticleEntryPage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return <ArticlePage article={article} />
}
```

Modify `src/payload.config.ts`:

```ts
import { Articles } from './collections/Articles'

collections: [
  Pages,
  Articles,
  NavigationLinks,
  Redirects,
  Headers,
  Footers,
  SystemPages,
  Forms,
  FormSubmissions,
  Media,
  OperationalAuditEvents,
  Users,
],
```

- [ ] **Step 4: Regenerate types and run the article test**

Run: `CI=true pnpm run generate:types`

Expected: PASS and `src/payload-types.ts` includes `Article`.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/articles.int.spec.ts`

Expected: PASS with article field shape and published lookup behavior covered.

- [ ] **Step 5: Commit the article feature slice**

```bash
git add src/collections/Articles.ts src/components/articles/ArticlePage.tsx src/lib/contentEntries.ts src/app/'(frontend)'/articles/[slug]/page.tsx src/payload.config.ts src/payload-types.ts tests/int/articles.int.spec.ts
git commit -m "feat(articles): add routed article content"
```

### Task 3: Add Review Layout Blocks, Review Collection, And Routed Review Rendering

**Files:**
- Create: `src/blocks/ContentSpotlight/config.ts`
- Create: `src/blocks/ContentSpotlight/Component.tsx`
- Create: `src/collections/Reviews.ts`
- Create: `src/components/reviews/ReviewPage.tsx`
- Create: `src/lib/reviews.ts`
- Create: `src/app/(frontend)/reviews/[slug]/page.tsx`
- Modify: `src/lib/contentEntries.ts`
- Modify: `src/blocks/renderBlocks.tsx`
- Modify: `src/payload.config.ts`
- Modify: `src/payload-types.ts`
- Test: `tests/int/reviews.int.spec.ts`

**Interfaces:**
- Consumes: `createCmsLinkFields()`, `resolveCmsLink()`, `getMediaImageProps()`, `RenderBlocks()`, `enforceEditorialWorkflow('publish_reviews')`
- Produces:
  - `export const ContentSpotlightBlock: Block`
  - `export const Reviews: CollectionConfig`
  - `getReviewBySlug(slug: string): Promise<Review | null>`
  - `getReviewMetadataBySlug(slug: string): Promise<Metadata>`
  - `getReviewDisplayName(review: Pick<Review, 'displayName' | 'reviewerName'>): string`

- [ ] **Step 1: Write the failing review integration test**

Create `tests/int/reviews.int.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Reviews } from '@/collections/Reviews'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: payloadMocks.find,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

const loadContentEntries = async () => {
  vi.resetModules()
  return import('@/lib/contentEntries')
}

describe('reviews collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes the shared content spotlight block and structured rating fields', () => {
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"rating"')
    expect(JSON.stringify(Reviews.fields)).toContain('"value":"5"')
    expect(JSON.stringify(Reviews.fields)).toContain('"slug":"contentSpotlight"')
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"metaTitle"')
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"workflowState"')
  })

  it('queries only published reviews by slug', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [{ id: 8, slug: 'great-service', title: 'Great Service' }],
    })

    const { getReviewBySlug } = await loadContentEntries()
    const review = await getReviewBySlug('great-service')

    expect(review?.slug).toBe('great-service')
    expect(payloadMocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'reviews',
        where: expect.objectContaining({
          and: expect.arrayContaining([
            { slug: { equals: 'great-service' } },
            { _status: { equals: 'published' } },
          ]),
        }),
      }),
    )
  })
})
```

- [ ] **Step 2: Run the review test and verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/reviews.int.spec.ts`

Expected: FAIL because `Reviews`, `ContentSpotlight`, and review lookup helpers do not exist yet.

- [ ] **Step 3: Implement the review block, review schema, and routed frontend**

Create `src/blocks/ContentSpotlight/config.ts`:

```ts
import type { Block } from 'payload'

import { createCmsLinkFields } from '@/fields/cmsLinkFields'

export const ContentSpotlightBlock: Block = {
  slug: 'contentSpotlight',
  interfaceName: 'ContentSpotlightBlock',
  labels: {
    singular: 'Content Spotlight',
    plural: 'Content Spotlights',
  },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    ...createCmsLinkFields(),
  ],
}
```

Create `src/blocks/ContentSpotlight/Component.tsx`:

```tsx
import { resolveCmsLink } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { ContentSpotlightBlock as ContentSpotlightBlockData } from '@/payload-types'

export function ContentSpotlightBlockComponent(props: ContentSpotlightBlockData) {
  const image = getMediaImageProps({
    media: props.image,
    preset: 'generic',
    fallbackAlt: props.heading,
  })
  const { href, openInNewTab } = resolveCmsLink(props)

  return (
    <section className="grid gap-6 rounded-3xl border p-6 md:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-3">
        {props.eyebrow ? <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{props.eyebrow}</p> : null}
        <h2 className="text-2xl font-semibold">{props.heading}</h2>
        {props.description ? <p className="text-muted-foreground">{props.description}</p> : null}
        {href ? (
          <a href={href} target={openInNewTab ? '_blank' : undefined} rel={openInNewTab ? 'noreferrer' : undefined}>
            Learn more
          </a>
        ) : null}
      </div>
      {image ? <img alt={image.alt} src={image.src} /> : null}
    </section>
  )
}
```

Create `src/lib/reviews.ts`:

```ts
import type { Review } from '@/payload-types'

export const reviewRatingOptions = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
] as const

export const getReviewDisplayName = (
  review: Pick<Review, 'displayName' | 'reviewerName'>,
): string => {
  const explicitName = review.displayName?.trim()

  if (explicitName) {
    return explicitName
  }

  const [firstName = 'Anonymous', lastName = ''] = review.reviewerName.trim().split(/\s+/)

  return lastName ? `${firstName} ${lastName[0]}.` : firstName
}
```

Create `src/collections/Reviews.ts`:

```ts
import { slugField, type CollectionConfig } from 'payload'

import {
  allowPublicReadOrCapability,
  hideFromUsersWithoutCapability,
  requireCapability,
} from '@/access/adminCapabilities'
import { ContentSpotlightBlock } from '@/blocks/ContentSpotlight/config'
import { enforceEditorialWorkflow } from '@/hooks/enforceEditorialWorkflow'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { editorialWorkflowStateOptions } from '@/lib/editorialWorkflow'
import { reviewRatingOptions } from '@/lib/reviews'
import { robotsFieldOptions } from '@/lib/seo'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: {
    singular: 'Review',
    plural: 'Reviews',
  },
  admin: {
    group: 'Content',
    hidden: hideFromUsersWithoutCapability('manage_reviews'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'rating', 'workflowState', 'updatedAt'],
    listSearchableFields: ['title', 'reviewTitle', 'reviewerName', 'subjectLabel'],
    preview: (data) => (data?.slug ? `/reviews/${data.slug}` : null),
  },
  access: {
    create: requireCapability('manage_reviews'),
    delete: requireCapability('manage_reviews'),
    read: allowPublicReadOrCapability('manage_reviews'),
    readVersions: requireCapability('manage_reviews'),
    update: requireCapability('manage_reviews'),
  },
  hooks: {
    afterChange: [
      createCollectionAuditHook({
        entityType: 'review',
        getSummary: ({ doc, previousDoc }) =>
          `Workflow moved from ${previousDoc?.workflowState ?? 'draft'} to ${doc.workflowState}.`,
        titleField: 'title',
      }),
    ],
    beforeChange: [enforceEditorialWorkflow('publish_reviews')],
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'rating', type: 'select', options: [...reviewRatingOptions], required: true },
            { name: 'reviewTitle', type: 'text', required: true },
            { name: 'reviewBody', type: 'textarea', required: true },
            { name: 'reviewerName', type: 'text', required: true },
            { name: 'reviewerEmail', type: 'email', required: true },
            { name: 'isGenuineExperience', type: 'checkbox', required: true },
            { name: 'displayName', type: 'text' },
            { name: 'subjectLabel', type: 'text' },
            { name: 'featuredImage', type: 'upload', relationTo: 'media' },
            { name: 'internalModerationNotes', type: 'textarea' },
            {
              name: 'layout',
              type: 'blocks',
              blocks: [ContentSpotlightBlock],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text', required: true },
            { name: 'metaDescription', type: 'textarea', required: true },
            { name: 'canonicalURL', type: 'text' },
            { name: 'robots', type: 'select', options: [...robotsFieldOptions] },
            { name: 'ogTitle', type: 'text' },
            { name: 'ogDescription', type: 'textarea' },
            { name: 'ogImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Workflow',
          fields: [
            {
              name: 'workflowState',
              type: 'select',
              defaultValue: 'draft',
              options: [...editorialWorkflowStateOptions],
              required: true,
            },
            { name: 'scheduledPublishAt', type: 'date' },
            { name: 'changeSummary', type: 'textarea' },
            { name: 'lastReviewedAt', type: 'date', admin: { readOnly: true } },
            { name: 'lastReviewedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
            { name: 'publishedAt', type: 'date', admin: { readOnly: true } },
            { name: 'publishedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
          ],
        },
      ],
    },
  ],
}
```

Modify `src/lib/contentEntries.ts`:

```ts
import type { Article, Review } from '@/payload-types'

export const getReviewBySlug = cache(async (slug: string): Promise<Review | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'reviews',
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
  })

  return result.docs[0] ?? null
})

export async function getReviewMetadataBySlug(slug: string): Promise<Metadata> {
  const review = await getReviewBySlug(slug)

  if (!review) {
    return {}
  }

  return {
    title: review.metaTitle,
    description: review.metaDescription,
  }
}
```

Modify `src/blocks/renderBlocks.tsx`:

```tsx
import type { Page, Review, SystemPage } from '@/payload-types'

import { ContentSpotlightBlockComponent } from './ContentSpotlight/Component'

type RenderableBlock =
  | NonNullable<Page['layout']>[number]
  | NonNullable<Review['layout']>[number]
  | NonNullable<SystemPage['layout']>[number]

export function RenderBlocks({ blocks }: { blocks?: RenderableBlock[] | null }) {
  // existing cases
  switch (block.blockType) {
    case 'contentSpotlight':
      return (
        <ContentSpotlightBlockComponent
          key={block.id ?? `${block.blockType}-${index}`}
          {...block}
        />
      )
  }
}
```

Create `src/components/reviews/ReviewPage.tsx`:

```tsx
import { RenderBlocks } from '@/blocks/renderBlocks'
import { getMediaImageProps } from '@/lib/media'
import { getReviewDisplayName } from '@/lib/reviews'
import type { Review } from '@/payload-types'

export function ReviewPage({ review }: { review: Review }) {
  const featuredImage = getMediaImageProps({
    media: review.featuredImage,
    preset: 'generic',
    fallbackAlt: review.reviewTitle,
  })

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-4">
        {review.subjectLabel ? <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{review.subjectLabel}</p> : null}
        <p className="text-lg font-medium">{review.rating}/5</p>
        <h1 className="text-4xl font-semibold">{review.reviewTitle}</h1>
        <p className="text-muted-foreground">Reviewed by {getReviewDisplayName(review)}</p>
        {featuredImage ? <img alt={featuredImage.alt} src={featuredImage.src} /> : null}
      </header>
      <div className="prose max-w-none">
        <p>{review.reviewBody}</p>
      </div>
      <RenderBlocks blocks={review.layout ?? null} />
    </article>
  )
}
```

Create `src/app/(frontend)/reviews/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ReviewPage } from '@/components/reviews/ReviewPage'
import { getReviewBySlug, getReviewMetadataBySlug } from '@/lib/contentEntries'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return getReviewMetadataBySlug(slug)
}

export default async function ReviewEntryPage({ params }: PageProps) {
  const { slug } = await params
  const review = await getReviewBySlug(slug)

  if (!review) {
    notFound()
  }

  return <ReviewPage review={review} />
}
```

Modify `src/payload.config.ts`:

```ts
import { Reviews } from './collections/Reviews'

collections: [
  Pages,
  Articles,
  Reviews,
  NavigationLinks,
  Redirects,
  Headers,
  Footers,
  SystemPages,
  Forms,
  FormSubmissions,
  Media,
  OperationalAuditEvents,
  Users,
],
```

- [ ] **Step 4: Regenerate types and run the review test**

Run: `CI=true pnpm run generate:types`

Expected: PASS and `src/payload-types.ts` includes `Review` and `ContentSpotlightBlock`.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/reviews.int.spec.ts`

Expected: PASS with review schema, shared block availability, and review lookup behavior covered.

- [ ] **Step 5: Commit the review rendering slice**

```bash
git add src/blocks/ContentSpotlight/config.ts src/blocks/ContentSpotlight/Component.tsx src/collections/Reviews.ts src/components/reviews/ReviewPage.tsx src/lib/reviews.ts src/lib/contentEntries.ts src/blocks/renderBlocks.tsx src/app/'(frontend)'/reviews/[slug]/page.tsx src/payload.config.ts src/payload-types.ts tests/int/reviews.int.spec.ts
git commit -m "feat(reviews): add routed review content"
```

### Task 4: Add The Dedicated Public Review Submission Flow

**Files:**
- Create: `src/app/api/reviews/submit/route.ts`
- Modify: `src/lib/reviews.ts`
- Create: `tests/int/review-submission.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**
- Consumes: `getClientIPAddress(request)`, `isSpamHoneypotTriggered(values)`, `isRateLimited({ formSlug, ipAddress })`, `recordSubmissionAttempt({ formSlug, ipAddress })`
- Produces:
  - `type ReviewSubmissionValues`
  - `validateReviewSubmission(values: ReviewSubmissionValues): { errors: Record<string, string>; normalizedData: RequiredReviewSubmissionValues }`
  - `POST(request: Request): Promise<NextResponse>`

- [ ] **Step 1: Write the failing review-submission test**

Create `tests/int/review-submission.int.spec.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  create: vi.fn(),
  loggerError: vi.fn(),
}))

const spamProtectionMocks = vi.hoisted(() => ({
  getClientIPAddress: vi.fn(),
  isRateLimited: vi.fn(),
  isSpamHoneypotTriggered: vi.fn(),
  recordSubmissionAttempt: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    create: payloadMocks.create,
    logger: {
      error: payloadMocks.loggerError,
    },
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/lib/formSpamProtection', () => ({
  getClientIPAddress: spamProtectionMocks.getClientIPAddress,
  isRateLimited: spamProtectionMocks.isRateLimited,
  isSpamHoneypotTriggered: spamProtectionMocks.isSpamHoneypotTriggered,
  recordSubmissionAttempt: spamProtectionMocks.recordSubmissionAttempt,
}))

const loadRouteModule = async () => {
  vi.resetModules()
  return import('@/app/api/reviews/submit/route')
}

describe('review submission route', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    spamProtectionMocks.getClientIPAddress.mockReturnValue('127.0.0.1')
    spamProtectionMocks.isRateLimited.mockReturnValue(false)
    spamProtectionMocks.isSpamHoneypotTriggered.mockReturnValue(false)
  })

  it('rejects incomplete review payloads', async () => {
    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/reviews/submit', {
        body: JSON.stringify({
          values: {
            reviewTitle: '',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        errors: expect.objectContaining({
          rating: expect.any(String),
          reviewBody: expect.any(String),
          reviewerEmail: expect.any(String),
        }),
      }),
    )
  })

  it('creates a draft in-review document for valid review submissions', async () => {
    payloadMocks.create.mockResolvedValue({
      id: 33,
    })

    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/reviews/submit', {
        body: JSON.stringify({
          values: {
            rating: '5',
            reviewTitle: 'Fast, clear, and reliable',
            reviewBody: 'Everything worked exactly as expected.',
            reviewerName: 'Taylor Lead',
            reviewerEmail: 'taylor@example.com',
            isGenuineExperience: true,
            website: '',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(200)
    expect(spamProtectionMocks.recordSubmissionAttempt).toHaveBeenCalledWith({
      formSlug: 'reviews',
      ipAddress: '127.0.0.1',
    })
    expect(payloadMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'reviews',
        data: expect.objectContaining({
          _status: 'draft',
          workflowState: 'in_review',
          title: 'Fast, clear, and reliable',
          reviewTitle: 'Fast, clear, and reliable',
          reviewerEmail: 'taylor@example.com',
        }),
        overrideAccess: true,
      }),
    )
  })
})
```

- [ ] **Step 2: Run the review-submission test and verify it fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/review-submission.int.spec.ts`

Expected: FAIL because the review route and review validation helper do not exist yet.

- [ ] **Step 3: Implement validation and the dedicated review intake route**

Extend `src/lib/reviews.ts`:

```ts
export type ReviewSubmissionValues = Record<string, unknown>

export type RequiredReviewSubmissionValues = {
  isGenuineExperience: true
  rating: '1' | '2' | '3' | '4' | '5'
  reviewBody: string
  reviewerEmail: string
  reviewerName: string
  reviewTitle: string
}

const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/

export const validateReviewSubmission = (
  values: ReviewSubmissionValues,
): {
  errors: Record<string, string>
  normalizedData: Partial<RequiredReviewSubmissionValues>
} => {
  const normalizedData = {
    rating: String(values.rating ?? '').trim() as RequiredReviewSubmissionValues['rating'],
    reviewTitle: String(values.reviewTitle ?? '').trim(),
    reviewBody: String(values.reviewBody ?? '').trim(),
    reviewerName: String(values.reviewerName ?? '').trim(),
    reviewerEmail: String(values.reviewerEmail ?? '').trim().toLowerCase(),
    isGenuineExperience: values.isGenuineExperience === true,
  }
  const errors: Record<string, string> = {}

  if (!reviewRatingOptions.some((option) => option.value === normalizedData.rating)) {
    errors.rating = 'Select a rating.'
  }
  if (!normalizedData.reviewTitle) {
    errors.reviewTitle = 'Enter a review title.'
  }
  if (!normalizedData.reviewBody) {
    errors.reviewBody = 'Enter your review.'
  }
  if (!normalizedData.reviewerName) {
    errors.reviewerName = 'Enter your name.'
  }
  if (!emailPattern.test(normalizedData.reviewerEmail)) {
    errors.reviewerEmail = 'Enter a valid email.'
  }
  if (!normalizedData.isGenuineExperience) {
    errors.isGenuineExperience = 'Confirm this review is based on your own experience.'
  }

  return {
    errors,
    normalizedData,
  }
}
```

Create `src/app/api/reviews/submit/route.ts`:

```ts
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  getClientIPAddress,
  isRateLimited,
  isSpamHoneypotTriggered,
  recordSubmissionAttempt,
} from '@/lib/formSpamProtection'
import { validateReviewSubmission, type ReviewSubmissionValues } from '@/lib/reviews'

export async function POST(request: Request) {
  const payload = await getPayload({
    config: configPromise,
  })

  let payloadBody: { values?: ReviewSubmissionValues } | null = null

  try {
    payloadBody = (await request.json()) as { values?: ReviewSubmissionValues }
  } catch {
    return NextResponse.json(
      {
        message: 'Invalid review submission payload.',
      },
      { status: 400 },
    )
  }

  const submissionValues =
    payloadBody?.values && typeof payloadBody.values === 'object' ? payloadBody.values : {}

  if (isSpamHoneypotTriggered(submissionValues)) {
    return NextResponse.json({
      message: 'Thanks for your review.',
    })
  }

  const ipAddress = getClientIPAddress(request)

  if (isRateLimited({ formSlug: 'reviews', ipAddress })) {
    return NextResponse.json(
      {
        message: 'Too many submissions from this device. Please wait a few minutes and try again.',
      },
      { status: 429 },
    )
  }

  recordSubmissionAttempt({
    formSlug: 'reviews',
    ipAddress,
  })

  const { errors, normalizedData } = validateReviewSubmission(submissionValues)

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        errors,
        message: 'Please correct the highlighted fields and try again.',
      },
      { status: 400 },
    )
  }

  await payload.create({
    collection: 'reviews',
    data: {
      _status: 'draft',
      isGenuineExperience: true,
      rating: normalizedData.rating,
      reviewBody: normalizedData.reviewBody,
      reviewerEmail: normalizedData.reviewerEmail,
      reviewerName: normalizedData.reviewerName,
      reviewTitle: normalizedData.reviewTitle,
      title: normalizedData.reviewTitle,
      workflowState: 'in_review',
    },
    overrideAccess: true,
  })

  return NextResponse.json({
    message: 'Thanks for your review.',
  })
}
```

- [ ] **Step 4: Run the review-submission test, regenerate types, and run the full CMS integration set**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/review-submission.int.spec.ts`

Expected: PASS with validation errors and moderation-state persistence covered.

Run: `CI=true pnpm run generate:types`

Expected: PASS and `src/payload-types.ts` includes `Article`, `Review`, and `ContentSpotlightBlock`.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts tests/int/review-submission.int.spec.ts`

Expected: PASS for the article, review, submission, and capability coverage introduced in this plan.

- [ ] **Step 5: Commit the public review intake slice**

```bash
git add src/app/api/reviews/submit/route.ts src/lib/reviews.ts src/payload-types.ts tests/int/review-submission.int.spec.ts
git commit -m "feat(reviews): add public review intake"
```
