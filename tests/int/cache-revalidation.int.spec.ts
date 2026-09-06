import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidateTag: mocks.revalidateTag,
}))

import {
  CMS_CACHE_TAGS,
  SKIP_CACHE_REVALIDATION_CONTEXT,
  revalidateArticlesCache,
  revalidateDeletedArticleCache,
  revalidateDeletedNewsEventCache,
  revalidateDeletedPageCache,
  revalidateDeletedRedirectCache,
  revalidateDeletedReviewCache,
  revalidateGlobalsCache,
  revalidateGlobalsCacheForGlobal,
  revalidateNewsEventsCache,
  revalidatePagesCache,
  revalidateRedirectsCache,
  revalidateReviewsCache,
} from '@/hooks/revalidateCmsContent'
import { Forms } from '@/collections/Forms'
import { GalleryAlbums } from '@/collections/GalleryAlbums'
import { Media } from '@/collections/Media'
import { NavigationLinks } from '@/collections/NavigationLinks'
import { SystemPages } from '@/collections/SystemPages'
import { SearchSettings } from '@/globals/SearchSettings'
import { SystemModeSettings } from '@/globals/SystemModeSettings'

const immediateRevalidationProfile = { expire: 0 }

const afterChange = (
  hook: (...args: never[]) => unknown,
  current: string,
  previous: string,
  context: Record<string, unknown> = {},
) =>
  hook({
    context,
    doc: { _status: current },
    previousDoc: { _status: previous },
  } as never)

describe('CMS cache revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['published update', 'published', 'published', true],
    ['unpublish', 'draft', 'published', true],
    ['first publish', 'published', 'draft', true],
    ['draft-only update', 'draft', 'draft', false],
  ])('handles Page %s', (_label, current, previous, shouldInvalidate) => {
    afterChange(revalidatePagesCache as never, current, previous)

    expect(mocks.revalidateTag).toHaveBeenCalledTimes(shouldInvalidate ? 2 : 0)
    if (shouldInvalidate) {
      expect(mocks.revalidateTag).toHaveBeenCalledWith(
        CMS_CACHE_TAGS.pages,
        immediateRevalidationProfile,
      )
      expect(mocks.revalidateTag).toHaveBeenCalledWith(
        CMS_CACHE_TAGS.sitemap,
        immediateRevalidationProfile,
      )
    }
  })

  it('skips Page cache invalidation for explicitly marked maintenance writes', () => {
    afterChange(revalidatePagesCache as never, 'published', 'draft', {
      [SKIP_CACHE_REVALIDATION_CONTEXT]: true,
    })

    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })

  it.each([
    ['Article', revalidateArticlesCache, CMS_CACHE_TAGS.articles],
    ['Review', revalidateReviewsCache, CMS_CACHE_TAGS.reviews],
    ['News/Event', revalidateNewsEventsCache, CMS_CACHE_TAGS.newsEvents],
  ])('invalidates %s caches when published content is unpublished', (_label, hook, tag) => {
    afterChange(hook as never, 'draft', 'published')

    expect(mocks.revalidateTag).toHaveBeenCalledWith(tag, immediateRevalidationProfile)
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      CMS_CACHE_TAGS.sitemap,
      immediateRevalidationProfile,
    )
  })

  it('does not invalidate editorial caches for draft-only updates', () => {
    for (const hook of [revalidateArticlesCache, revalidateReviewsCache, revalidateNewsEventsCache]) {
      afterChange(hook as never, 'draft', 'draft')
    }

    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })

  it('invalidates Redirect caches when a redirect is unpublished', () => {
    afterChange(revalidateRedirectsCache as never, 'draft', 'published')

    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      CMS_CACHE_TAGS.redirects,
      immediateRevalidationProfile,
    )
  })

  it.each([
    ['Page', revalidateDeletedPageCache, CMS_CACHE_TAGS.pages, true],
    ['Article', revalidateDeletedArticleCache, CMS_CACHE_TAGS.articles, true],
    ['Review', revalidateDeletedReviewCache, CMS_CACHE_TAGS.reviews, true],
    ['News/Event', revalidateDeletedNewsEventCache, CMS_CACHE_TAGS.newsEvents, true],
    ['Redirect', revalidateDeletedRedirectCache, CMS_CACHE_TAGS.redirects, false],
  ])('invalidates published %s deletions', (_label, hook, tag, invalidatesSitemap) => {
    hook({ doc: { _status: 'published' } } as never)

    expect(mocks.revalidateTag).toHaveBeenCalledWith(tag, immediateRevalidationProfile)
    if (invalidatesSitemap) {
      expect(mocks.revalidateTag).toHaveBeenCalledWith(
        CMS_CACHE_TAGS.sitemap,
        immediateRevalidationProfile,
      )
    }
  })

  it('does not invalidate draft-only deletions', () => {
    for (const hook of [
      revalidateDeletedPageCache,
      revalidateDeletedArticleCache,
      revalidateDeletedReviewCache,
      revalidateDeletedNewsEventCache,
      revalidateDeletedRedirectCache,
    ]) {
      hook({ doc: { _status: 'draft' } } as never)
    }

    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })

  it.each([
    ['Form', Forms],
    ['Gallery Album', GalleryAlbums],
    ['Media', Media],
    ['Navigation Link', NavigationLinks],
    ['System Page', SystemPages],
  ])('registers publication revalidation for the %s collection', (_label, collection) => {
    expect(collection.hooks?.afterChange).toContain(revalidateGlobalsCache)
  })

  it.each([
    ['Search Settings', SearchSettings],
    ['Site Modes', SystemModeSettings],
  ])('registers publication revalidation for the %s global', (_label, global) => {
    expect(global.hooks?.afterChange).toContain(revalidateGlobalsCacheForGlobal)
  })

  it.each([
    ['collection', revalidateGlobalsCache],
    ['global', revalidateGlobalsCacheForGlobal],
  ])('invalidates dependent page data immediately after a published %s update', (_label, hook) => {
    afterChange(hook as never, 'published', 'published')

    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      CMS_CACHE_TAGS.globals,
      immediateRevalidationProfile,
    )
    expect(mocks.revalidateTag).toHaveBeenCalledWith(
      CMS_CACHE_TAGS.pages,
      immediateRevalidationProfile,
    )
  })

  it.each([
    ['collection', revalidateGlobalsCache],
    ['global', revalidateGlobalsCacheForGlobal],
  ])('does not invalidate public page data for a draft-only %s update', (_label, hook) => {
    afterChange(hook as never, 'draft', 'draft')

    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })
})
