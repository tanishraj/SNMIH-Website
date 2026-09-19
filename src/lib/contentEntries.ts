import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Metadata } from 'next'
import { getMediaAbsoluteUrl } from '@/lib/media'
import { resolveCanonicalURL, resolveRobotsMode } from '@/lib/seo'
import { getTaxonomyRelationshipIDs, getTaxonomyTerm } from '@/lib/taxonomy'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'
import type { Article, Review, SeoSetting, User } from '@/payload-types'

type TaxonomyArchiveTerm = {
  canonicalURL?: string | null
  description?: string | null
  id: number | string
  includeInSitemap?: string | null
  metaDescription?: string | null
  metaTitle?: string | null
  ogDescription?: string | null
  ogImage?: Article['ogImage']
  ogTitle?: string | null
  robotsMode?: string | null
  slug: string
  title: string
}

type ManagedEntryMetadataSource = {
  canonicalURL?: string | null
  fallbackDescription?: string | null
  fallbackTitle?: string | null
  metaDescription?: string | null
  metaTitle?: string | null
  ogDescription?: string | null
  ogImage?: Article['ogImage']
  ogTitle?: string | null
  robotsMode?: string | null
}

const getSeoSettings = cache(async (): Promise<SeoSetting> => {
  const payload = await getPayload({
    config: configPromise,
  })

  return payload.findGlobal({
    slug: 'seo-settings',
    depth: 1,
  })
})

const toTaxonomyArchiveTerm = (value: unknown): TaxonomyArchiveTerm | null => {
  const term = getTaxonomyTerm(value as never)

  if (!term || !value || typeof value !== 'object') {
    return term
  }

  return {
    ...term,
    canonicalURL: 'canonicalURL' in value && typeof value.canonicalURL === 'string' ? value.canonicalURL : null,
    includeInSitemap:
      'includeInSitemap' in value && typeof value.includeInSitemap === 'string'
        ? value.includeInSitemap
        : null,
    metaDescription:
      'metaDescription' in value && typeof value.metaDescription === 'string'
        ? value.metaDescription
        : null,
    metaTitle: 'metaTitle' in value && typeof value.metaTitle === 'string' ? value.metaTitle : null,
    ogDescription:
      'ogDescription' in value && typeof value.ogDescription === 'string' ? value.ogDescription : null,
    ogImage: 'ogImage' in value ? ((value.ogImage as Article['ogImage']) ?? null) : null,
    ogTitle: 'ogTitle' in value && typeof value.ogTitle === 'string' ? value.ogTitle : null,
    robotsMode: 'robotsMode' in value && typeof value.robotsMode === 'string' ? value.robotsMode : null,
  }
}

const toManagedEntryMetadata = async ({
  entry,
  resolvedCanonicalPath,
}: {
  entry: ManagedEntryMetadataSource
  resolvedCanonicalPath: string
}): Promise<Metadata> => {
  const seoSettings = await getSeoSettings()
  const resolvedCanonical = resolveCanonicalURL({
    canonicalURL: entry.canonicalURL,
    resolvedPath: resolvedCanonicalPath,
  })
  const canonicalUrl = resolvedCanonical ? toAbsoluteSiteUrl(resolvedCanonical) : undefined
  const defaultImageUrl = getMediaAbsoluteUrl(seoSettings.defaultImage)
  const entryImageUrl = getMediaAbsoluteUrl(entry.ogImage) ?? defaultImageUrl
  const resolvedTitle = entry.metaTitle || entry.fallbackTitle || seoSettings.defaultTitle || undefined
  const resolvedDescription =
    entry.metaDescription ||
    entry.fallbackDescription ||
    seoSettings.defaultDescription ||
    undefined
  const openGraphTitle = entry.ogTitle || resolvedTitle
  const openGraphDescription =
    entry.ogDescription || resolvedDescription

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonicalUrl,
      type: 'article',
      images: entryImageUrl
        ? [
            {
              url: entryImageUrl,
            },
          ]
        : undefined,
    },
    robots: resolveRobotsMode({
      inheritedRobots: seoSettings.robots,
      robotsMode:
        typeof entry.robotsMode === 'string'
          ? (entry.robotsMode as 'default' | 'index' | 'noindex')
          : null,
    }),
    twitter: {
      card: entryImageUrl ? 'summary_large_image' : 'summary',
      title: openGraphTitle,
      description: openGraphDescription,
      images: entryImageUrl ? [entryImageUrl] : undefined,
    },
  }
}

export async function getArticlePreviewBySlug(slug: string, user: User): Promise<Article | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    overrideAccess: false,
    collection: 'articles',
    depth: 2,
    draft: true,
    limit: 1,
    user,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
}

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    overrideAccess: false,
    collection: 'articles',
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
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

  return toManagedEntryMetadata({
    entry: {
      ...article,
      fallbackDescription: article.excerpt,
      fallbackTitle: article.title,
    },
    resolvedCanonicalPath: `/articles/${article.slug}`,
  })
}

export function getArticleStructuredData(article: Article) {
  const url = toAbsoluteSiteUrl(`/articles/${article.slug}`)
  const image = getMediaAbsoluteUrl(article.featuredImage) || undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    author: { '@type': 'Person', name: article.authorName },
    dateModified: article.updatedAt,
    datePublished: article.publishedAt || article.createdAt,
    description: article.excerpt,
    headline: article.title,
    image,
    mainEntityOfPage: url,
    url,
  }
}

const getCategoryBySlug = cache(async (slug: string): Promise<TaxonomyArchiveTerm | null> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    overrideAccess: false,
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 1,
    limit: 1,
  })

  return toTaxonomyArchiveTerm(result.docs[0] ?? null)
})

const getTagBySlug = cache(async (slug: string): Promise<TaxonomyArchiveTerm | null> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    overrideAccess: false,
    collection: 'tags',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 0,
    limit: 1,
  })

  return toTaxonomyArchiveTerm(result.docs[0] ?? null)
})

const toTaxonomyArchiveMetadata = async ({
  collectionLabel,
  fallbackTitle,
  path,
  term,
}: {
  collectionLabel: string
  fallbackTitle: string
  path: string
  term: TaxonomyArchiveTerm | null
}): Promise<Metadata> => {
  const seoSettings = await getSeoSettings()
  const resolvedCanonical = resolveCanonicalURL({
    canonicalURL: term?.canonicalURL,
    resolvedPath: path,
  })
  const canonicalUrl = resolvedCanonical ? toAbsoluteSiteUrl(resolvedCanonical) : undefined
  const title = term?.metaTitle || (term ? `${term.title} ${collectionLabel}` : fallbackTitle)
  const description =
    term?.metaDescription?.trim() ||
    term?.description?.trim() ||
    `Browse published ${collectionLabel.toLowerCase()} content for ${term?.title ?? fallbackTitle}.`
  const defaultImageUrl = getMediaAbsoluteUrl(seoSettings.defaultImage)
  const archiveImageUrl = getMediaAbsoluteUrl(term?.ogImage) ?? defaultImageUrl
  const openGraphTitle = term?.ogTitle || title
  const openGraphDescription = term?.ogDescription || description

  return {
    title,
    description,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonicalUrl,
      type: 'website',
      images: archiveImageUrl
        ? [
            {
              url: archiveImageUrl,
            },
          ]
        : undefined,
    },
    robots: resolveRobotsMode({
      inheritedRobots: seoSettings.robots,
      robotsMode:
        typeof term?.robotsMode === 'string' ? (term.robotsMode as 'default' | 'index' | 'noindex') : null,
    }),
    twitter: {
      card: archiveImageUrl ? 'summary_large_image' : 'summary',
      title: openGraphTitle,
      description: openGraphDescription,
      images: archiveImageUrl ? [archiveImageUrl] : undefined,
    },
  }
}

const getPublishedArticles = cache(async (): Promise<Article[]> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    overrideAccess: false,
    collection: 'articles',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 2,
    limit: 100,
  })

  return result.docs
})

const getPublishedReviews = cache(async (): Promise<Review[]> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    overrideAccess: false,
    collection: 'reviews',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 2,
    limit: 100,
  })

  return result.docs
})

const toUniqueEntries = <T extends { id: number | string }>(entries: T[]): T[] => {
  const seenIDs = new Set<number | string>()

  return entries.filter((entry) => {
    if (seenIDs.has(entry.id)) {
      return false
    }

    seenIDs.add(entry.id)
    return true
  })
}

export const getArticleCategoryArchiveBySlug = cache(
  async (
    slug: string,
  ): Promise<{
    articles: Article[]
    category: TaxonomyArchiveTerm | null
  }> => {
    const [articles, category] = await Promise.all([getPublishedArticles(), getCategoryBySlug(slug)])
    const categoryID = category?.id

    return {
      articles:
        categoryID == null
          ? []
          : articles.filter((article) => getTaxonomyTerm(article.primaryCategory)?.id === categoryID),
      category,
    }
  },
)

export async function getArticleCategoryArchiveMetadataBySlug(slug: string): Promise<Metadata> {
  const category = await getCategoryBySlug(slug)

  return toTaxonomyArchiveMetadata({
    collectionLabel: 'Articles',
    fallbackTitle: 'Article Archive',
    path: `/articles/category/${slug}`,
    term: category,
  })
}

export const getArticleTagArchiveBySlug = cache(
  async (
    slug: string,
  ): Promise<{
    articles: Article[]
    tag: TaxonomyArchiveTerm | null
  }> => {
    const [articles, tag] = await Promise.all([getPublishedArticles(), getTagBySlug(slug)])
    const tagID = tag?.id

    return {
      articles:
        tagID == null
          ? []
          : articles.filter((article) => getTaxonomyRelationshipIDs(article.tags).includes(tagID)),
      tag,
    }
  },
)

export async function getArticleTagArchiveMetadataBySlug(slug: string): Promise<Metadata> {
  const tag = await getTagBySlug(slug)

  return toTaxonomyArchiveMetadata({
    collectionLabel: 'Articles',
    fallbackTitle: 'Tagged Articles',
    path: `/articles/tag/${slug}`,
    term: tag,
  })
}

export const getRelatedArticles = cache(
  async (article: Article, limit = 3): Promise<Article[]> => {
    const publishedArticles = await getPublishedArticles()
    const primaryCategoryID = getTaxonomyTerm(article.primaryCategory)?.id
    const tagIDs = new Set(getTaxonomyRelationshipIDs(article.tags))

    const samePrimaryCategory = publishedArticles.filter(
      (candidate) =>
        candidate.id !== article.id &&
        primaryCategoryID != null &&
        getTaxonomyTerm(candidate.primaryCategory)?.id === primaryCategoryID,
    )

    const sharedTags = publishedArticles.filter((candidate) => {
      if (candidate.id === article.id || !tagIDs.size) {
        return false
      }

      return getTaxonomyRelationshipIDs(candidate.tags).some((candidateTagID) =>
        tagIDs.has(candidateTagID),
      )
    })

    return toUniqueEntries([...samePrimaryCategory, ...sharedTags]).slice(0, limit)
  },
)

export const getReviewBySlug = cache(async (slug: string): Promise<Review | null> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    overrideAccess: false,
    collection: 'reviews',
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
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

  return toManagedEntryMetadata({
    entry: {
      ...review,
      fallbackDescription: review.reviewBody,
      fallbackTitle: review.reviewTitle || review.title,
    },
    resolvedCanonicalPath: `/reviews/${review.slug}`,
  })
}

export const getReviewCategoryArchiveBySlug = cache(
  async (
    slug: string,
  ): Promise<{
    category: TaxonomyArchiveTerm | null
    reviews: Review[]
  }> => {
    const [reviews, category] = await Promise.all([getPublishedReviews(), getCategoryBySlug(slug)])
    const categoryID = category?.id

    return {
      category,
      reviews:
        categoryID == null
          ? []
          : reviews.filter((review) => getTaxonomyTerm(review.primaryCategory)?.id === categoryID),
    }
  },
)

export async function getReviewCategoryArchiveMetadataBySlug(slug: string): Promise<Metadata> {
  const category = await getCategoryBySlug(slug)

  return toTaxonomyArchiveMetadata({
    collectionLabel: 'Reviews',
    fallbackTitle: 'Review Archive',
    path: `/reviews/category/${slug}`,
    term: category,
  })
}

export const getRelatedReviews = cache(
  async (review: Review, limit = 3): Promise<Review[]> => {
    const publishedReviews = await getPublishedReviews()
    const primaryCategoryID = getTaxonomyTerm(review.primaryCategory)?.id
    const tagIDs = new Set(getTaxonomyRelationshipIDs(review.tags))

    const samePrimaryCategory = publishedReviews.filter(
      (candidate) =>
        candidate.id !== review.id &&
        primaryCategoryID != null &&
        getTaxonomyTerm(candidate.primaryCategory)?.id === primaryCategoryID,
    )

    const sharedTags = publishedReviews.filter((candidate) => {
      if (candidate.id === review.id || !tagIDs.size) {
        return false
      }

      return getTaxonomyRelationshipIDs(candidate.tags).some((candidateTagID) =>
        tagIDs.has(candidateTagID),
      )
    })

    return toUniqueEntries([...samePrimaryCategory, ...sharedTags]).slice(0, limit)
  },
)
