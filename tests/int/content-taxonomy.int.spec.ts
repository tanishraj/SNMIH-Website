import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  findGlobal: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()

  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      find: payloadMocks.find,
      findGlobal: payloadMocks.findGlobal,
    })),
  }
})

vi.mock('@payload-config', () => ({
  default: {},
}))

const loadContentEntries = async () => {
  vi.resetModules()
  return import('@/lib/contentEntries')
}

const categoryDocs = [
  {
    canonicalURL: '/library/guides',
    description: 'Editorial guides and explainers.',
    id: 1,
    metaDescription: 'Custom guides archive description.',
    metaTitle: 'Guides Archive',
    robotsMode: 'noindex',
    slug: 'guides',
    title: 'Guides',
  },
  { description: 'Customer stories and testimonials.', id: 2, slug: 'stories', title: 'Stories' },
]

const tagDocs = [
  {
    canonicalURL: '/topics/featured',
    description: 'Featured content.',
    id: 10,
    metaDescription: 'Featured content archive.',
    metaTitle: 'Featured Archive',
    robotsMode: 'index',
    slug: 'featured',
    title: 'Featured',
  },
  { description: 'Launch updates.', id: 11, slug: 'launch', title: 'Launch' },
]

type PayloadFindArgs = {
  collection: string
  where?: {
    slug?: {
      equals?: string
    }
  }
}

const articleDocs = [
  {
    _status: 'published',
    categories: [1],
    excerpt: 'Primary category match and shared tag.',
    id: 101,
    primaryCategory: categoryDocs[0],
    slug: 'starter-guide',
    tags: [tagDocs[0]],
    title: 'Starter Guide',
  },
  {
    _status: 'published',
    categories: [1],
    excerpt: 'Same primary category only.',
    id: 102,
    primaryCategory: categoryDocs[0],
    slug: 'campaign-playbook',
    tags: [tagDocs[1]],
    title: 'Campaign Playbook',
  },
  {
    _status: 'published',
    categories: [2],
    excerpt: 'Shared tag but different category.',
    id: 103,
    primaryCategory: categoryDocs[1],
    slug: 'launch-story',
    tags: [tagDocs[0]],
    title: 'Launch Story',
  },
  {
    _status: 'published',
    categories: [1],
    excerpt: 'Same primary category and shared tag.',
    id: 104,
    primaryCategory: categoryDocs[0],
    slug: 'customer-proof',
    tags: [tagDocs[0]],
    title: 'Customer Proof',
  },
]

const reviewDocs = [
  {
    _status: 'published',
    categories: [1],
    id: 201,
    primaryCategory: categoryDocs[0],
    rating: '5',
    reviewBody: 'Detailed positive review.',
    reviewTitle: 'Excellent support',
    slug: 'excellent-support',
    tags: [tagDocs[0]],
  },
  {
    _status: 'published',
    categories: [1],
    id: 202,
    primaryCategory: categoryDocs[0],
    rating: '4',
    reviewBody: 'Same category review.',
    reviewTitle: 'Helpful onboarding',
    slug: 'helpful-onboarding',
    tags: [tagDocs[1]],
  },
  {
    _status: 'published',
    categories: [2],
    id: 203,
    primaryCategory: categoryDocs[1],
    rating: '5',
    reviewBody: 'Shared tag review.',
    reviewTitle: 'Launch week feedback',
    slug: 'launch-week-feedback',
    tags: [tagDocs[0]],
  },
]

describe('content taxonomy helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    payloadMocks.findGlobal.mockResolvedValue({
      defaultDescription: 'Global SEO description',
      defaultImage: null,
      defaultTitle: 'Global SEO title',
      robots: 'index,follow',
    })

    payloadMocks.find.mockImplementation(async ({ collection, where }: PayloadFindArgs) => {
      const slug = where?.slug?.equals

      if (collection === 'categories') {
        return {
          docs: categoryDocs.filter((category) => category.slug === slug),
        }
      }

      if (collection === 'tags') {
        return {
          docs: tagDocs.filter((tag) => tag.slug === slug),
        }
      }

      if (collection === 'articles') {
        return {
          docs: articleDocs,
        }
      }

      if (collection === 'reviews') {
        return {
          docs: reviewDocs,
        }
      }

      return {
        docs: [],
      }
    })
  })

  it('builds article category archives from the primary category', async () => {
    const { getArticleCategoryArchiveBySlug } = await loadContentEntries()
    const result = await getArticleCategoryArchiveBySlug('guides')

    expect(result.category?.title).toBe('Guides')
    expect(result.articles.map((article) => article.slug)).toEqual([
      'starter-guide',
      'campaign-playbook',
      'customer-proof',
    ])
  })

  it('builds article tag archives from shared tags', async () => {
    const { getArticleTagArchiveBySlug } = await loadContentEntries()
    const result = await getArticleTagArchiveBySlug('featured')

    expect(result.tag?.title).toBe('Featured')
    expect(result.articles.map((article) => article.slug)).toEqual([
      'starter-guide',
      'launch-story',
      'customer-proof',
    ])
  })

  it('resolves taxonomy archive metadata from term seo overrides first', async () => {
    const { getArticleTagArchiveMetadataBySlug, getReviewCategoryArchiveMetadataBySlug } =
      await loadContentEntries()
    const articleTagMetadata = await getArticleTagArchiveMetadataBySlug('featured')
    const reviewCategoryMetadata = await getReviewCategoryArchiveMetadataBySlug('guides')

    expect(articleTagMetadata.title).toBe('Featured Archive')
    expect(articleTagMetadata.description).toBe('Featured content archive.')
    expect(articleTagMetadata.alternates?.canonical).toBe('http://localhost:3000/topics/featured')
    expect(reviewCategoryMetadata.title).toBe('Guides Archive')
    expect(reviewCategoryMetadata.robots).toEqual({
      follow: true,
      index: false,
    })
  })

  it('prioritizes same-category articles before shared-tag matches', async () => {
    const { getRelatedArticles } = await loadContentEntries()
    const relatedArticles = await getRelatedArticles(articleDocs[0] as never)

    expect(relatedArticles.map((article) => article.slug)).toEqual([
      'campaign-playbook',
      'customer-proof',
      'launch-story',
    ])
  })

  it('builds review category archives and related review lists', async () => {
    const { getRelatedReviews, getReviewCategoryArchiveBySlug } = await loadContentEntries()
    const archive = await getReviewCategoryArchiveBySlug('guides')
    const relatedReviews = await getRelatedReviews(reviewDocs[0] as never)

    expect(archive.category?.title).toBe('Guides')
    expect(archive.reviews.map((review) => review.slug)).toEqual([
      'excellent-support',
      'helpful-onboarding',
    ])
    expect(relatedReviews.map((review) => review.slug)).toEqual([
      'helpful-onboarding',
      'launch-week-feedback',
    ])
  })
})
