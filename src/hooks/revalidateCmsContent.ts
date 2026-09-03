import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

/**
 * Cache tag constants.
 * These match the tags used in unstable_cache wrappers in pageData.ts and layout.tsx.
 */
export const CMS_CACHE_TAGS = {
  pages: 'cms-pages',
  globals: 'cms-globals',
  articles: 'cms-articles',
  reviews: 'cms-reviews',
  newsEvents: 'cms-news-events',
  newsEventClassifications: 'cms-news-event-classifications',
  calendar: 'cms-calendar',
  siteSettings: 'cms-site-settings',
  sitemap: 'cms-sitemap',
  redirects: 'cms-redirects',
} as const

// In Next.js 16+, revalidateTag requires a second `profile` argument.
// Passing 'max' instructs Next.js to revalidate cache entries of any lifetime.
const REVALIDATE_PROFILE = 'max'

export const SKIP_CACHE_REVALIDATION_CONTEXT = 'skipCacheRevalidation' as const

type PublishableDocument = {
  _status?: string | null
}

const isOrWasPublished = (
  doc: PublishableDocument,
  previousDoc?: PublishableDocument | null,
): boolean => doc._status === 'published' || previousDoc?._status === 'published'

const revalidateTags = (...tags: Array<(typeof CMS_CACHE_TAGS)[keyof typeof CMS_CACHE_TAGS]>) => {
  for (const tag of tags) {
    revalidateTag(tag, REVALIDATE_PROFILE)
  }
}

/**
 * Revalidates the pages cache when a page is created, updated, or deleted.
 * Also busts the sitemap so the next request regenerates it.
 */
export const revalidatePagesCache: CollectionAfterChangeHook = ({ context, doc, previousDoc }) => {
  if (context?.[SKIP_CACHE_REVALIDATION_CONTEXT] === true) return doc

  if (isOrWasPublished(doc, previousDoc)) {
    revalidateTags(CMS_CACHE_TAGS.pages, CMS_CACHE_TAGS.sitemap)
  }

  return doc
}

/**
 * Revalidates the articles cache when an article changes.
 */
export const revalidateArticlesCache: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (isOrWasPublished(doc, previousDoc)) {
    revalidateTags(CMS_CACHE_TAGS.articles, CMS_CACHE_TAGS.sitemap)
  }

  return doc
}

/**
 * Revalidates the reviews cache when a review changes.
 */
export const revalidateReviewsCache: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (isOrWasPublished(doc, previousDoc)) {
    revalidateTags(CMS_CACHE_TAGS.reviews, CMS_CACHE_TAGS.sitemap)
  }

  return doc
}

/**
 * Revalidates the news-events cache when a news/event entry changes.
 */
export const revalidateNewsEventsCache: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  const isPublished = doc._status === 'published'
  const wasPublished = previousDoc?._status === 'published'

  if (isPublished || wasPublished) {
    revalidateTags(CMS_CACHE_TAGS.newsEvents, CMS_CACHE_TAGS.calendar, CMS_CACHE_TAGS.sitemap)
  }

  return doc
}

const revalidateNewsEventClassificationTags = () => {
  revalidateTags(
    CMS_CACHE_TAGS.newsEvents,
    CMS_CACHE_TAGS.newsEventClassifications,
    CMS_CACHE_TAGS.calendar,
    CMS_CACHE_TAGS.pages,
  )
}

/**
 * Revalidates every public surface whose labels or filters depend on classifications.
 */
export const revalidateNewsEventClassificationsCache: CollectionAfterChangeHook = ({ doc }) => {
  revalidateNewsEventClassificationTags()
  return doc
}

/**
 * Revalidates classification-backed public surfaces after an unused classification is deleted.
 */
export const revalidateDeletedNewsEventClassificationCache: CollectionAfterDeleteHook = ({
  doc,
}) => {
  revalidateNewsEventClassificationTags()
  return doc
}

/**
 * Revalidates the globals cache (header, footer, theme, settings).
 * Busts pages too since header/footer/theme changes affect all pages.
 * Used by both collections (Headers, Footers, ReusableSections) and globals.
 */
export const revalidateGlobalsCache: CollectionAfterChangeHook = ({ doc }) => {
  revalidateTags(CMS_CACHE_TAGS.globals, CMS_CACHE_TAGS.pages)
  return doc
}

/**
 * Same as revalidateGlobalsCache but typed for Payload global afterChange hooks.
 */
export const revalidateGlobalsCacheForGlobal: GlobalAfterChangeHook = ({ doc }) => {
  revalidateTags(CMS_CACHE_TAGS.globals, CMS_CACHE_TAGS.pages)
  return doc
}

export const revalidateSiteSettingsCache: GlobalAfterChangeHook = ({ doc }) => {
  revalidateTags(
    CMS_CACHE_TAGS.globals,
    CMS_CACHE_TAGS.pages,
    CMS_CACHE_TAGS.siteSettings,
    CMS_CACHE_TAGS.calendar,
  )
  return doc
}

/**
 * Revalidates the redirects API cache when a redirect is created, updated, or deleted.
 */
export const revalidateRedirectsCache: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (isOrWasPublished(doc, previousDoc)) {
    revalidateTags(CMS_CACHE_TAGS.redirects)
  }
  return doc
}

export const revalidateDeletedPageCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') {
    revalidateTags(CMS_CACHE_TAGS.pages, CMS_CACHE_TAGS.sitemap)
  }
  return doc
}

export const revalidateDeletedArticleCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') {
    revalidateTags(CMS_CACHE_TAGS.articles, CMS_CACHE_TAGS.sitemap)
  }
  return doc
}

export const revalidateDeletedReviewCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') {
    revalidateTags(CMS_CACHE_TAGS.reviews, CMS_CACHE_TAGS.sitemap)
  }
  return doc
}

export const revalidateDeletedNewsEventCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') {
    revalidateTags(CMS_CACHE_TAGS.newsEvents, CMS_CACHE_TAGS.calendar, CMS_CACHE_TAGS.sitemap)
  }
  return doc
}

export const revalidateDeletedRedirectCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') {
    revalidateTags(CMS_CACHE_TAGS.redirects)
  }
  return doc
}
