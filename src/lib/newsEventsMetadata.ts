import type { Metadata } from 'next'

import { resolveCanonicalURL, resolveRobotsMode, type RobotsFieldValue } from '@/lib/seo'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'

const absoluteCanonical = (canonicalURL: string | null): string | undefined =>
  canonicalURL ? toAbsoluteSiteUrl(canonicalURL) : undefined

export function getNewsEventDetailMetadata(
  entry: PublicNewsEventDetail,
  inheritedRobots: RobotsFieldValue | null | undefined,
): Metadata {
  const title = entry.metaTitle || entry.title
  const description = entry.metaDescription || entry.excerpt
  const canonical = absoluteCanonical(
    resolveCanonicalURL({ canonicalURL: entry.canonicalURL, resolvedPath: entry.href }),
  )
  const image = entry.ogImageURL || entry.image?.src

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: entry.ogTitle || title,
      description: entry.ogDescription || description,
      images: image ? [{ url: image }] : undefined,
      type: 'article',
      url: canonical,
    },
    robots: resolveRobotsMode({ inheritedRobots, robotsMode: entry.robotsMode }),
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: entry.ogTitle || title,
      description: entry.ogDescription || description,
      images: image ? [image] : undefined,
    },
  }
}

export function getNewsEventStructuredData(
  entry: PublicNewsEventDetail,
  authorLabel = 'Management, SNMIH',
) {
  const url = toAbsoluteSiteUrl(entry.href)

  if (entry.behavior === 'event') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      description: entry.excerpt,
      endDate: entry.eventAllDay ? entry.eventEndDateKey : entry.eventEnd,
      image: entry.image?.src,
      location: entry.eventLocation ? { '@type': 'Place', name: entry.eventLocation } : undefined,
      name: entry.title,
      startDate: entry.eventAllDay ? entry.eventStartDateKey : entry.eventStart,
      url,
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    author: { '@type': 'Organization', name: authorLabel },
    dateModified: entry.updatedAt,
    datePublished: entry.publishedAt,
    description: entry.excerpt,
    headline: entry.title,
    image: entry.image?.src,
    mainEntityOfPage: url,
    url,
  }
}
