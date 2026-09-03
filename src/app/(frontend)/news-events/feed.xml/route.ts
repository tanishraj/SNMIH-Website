import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getMediaAbsoluteUrl } from '@/lib/media'
import { resolveNewsEventClassificationRecord } from '@/lib/newsEventClassifications'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'

export const revalidate = 3600

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const [{ docs: entries }, siteSettings] = await Promise.all([
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit: 50,
      select: {
        authorName: true,
        classification: true,
        contentType: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        slug: true,
        title: true,
        updatedAt: true,
      },
      sort: '-publishedAt',
      where: {
        _status: { equals: 'published' },
      },
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])

  const feedUrl = toAbsoluteSiteUrl('/news-events/feed.xml')
  const archiveUrl = toAbsoluteSiteUrl('/news-events')
  const siteName = siteSettings.siteName?.trim() || 'Website'

  const items = entries
    .map((entry) => {
      const url = toAbsoluteSiteUrl(`/news-events/${entry.slug}`)
      const image = getMediaAbsoluteUrl(entry.featuredImage)
      const pubDate = new Date(
        (entry as { publishedAt?: string | null }).publishedAt ?? entry.updatedAt,
      ).toUTCString()
      const label =
        resolveNewsEventClassificationRecord(entry.classification, entry.contentType)?.badgeLabel ??
        'News & Events'

      return `    <item>
      <title><![CDATA[${entry.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${entry.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${label}]]></category>
      ${entry.authorName ? `<author><![CDATA[${entry.authorName}]]></author>` : ''}
      ${image ? `<enclosure url="${image}" type="${typeof entry.featuredImage === 'object' && entry.featuredImage?.mimeType ? entry.featuredImage.mimeType : 'image/jpeg'}" length="0" />` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${siteName} — News &amp; Events]]></title>
    <link>${archiveUrl}</link>
    <description><![CDATA[Latest news and events from ${siteName}]]></description>
    <language>en</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
