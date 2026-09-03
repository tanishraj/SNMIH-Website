import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getMediaAbsoluteUrl } from '@/lib/media'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'

export const revalidate = 3600

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const [{ docs: articles }, siteSettings] = await Promise.all([
    payload.find({
      collection: 'articles',
      depth: 1,
      limit: 50,
      sort: '-publishedAt',
      where: { _status: { equals: 'published' } },
    }),
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
  ])

  const siteUrl = toAbsoluteSiteUrl('/')
  const feedUrl = toAbsoluteSiteUrl('/articles/feed.xml')
  const articlesUrl = toAbsoluteSiteUrl('/articles')
  const siteName = escapeXml(siteSettings.siteName?.trim() || 'Website')

  const items = articles
    .map((article) => {
      const url = toAbsoluteSiteUrl(`/articles/${article.slug}`)
      const image = getMediaAbsoluteUrl(article.featuredImage)
      const pubDate = new Date(article.publishedAt ?? article.createdAt).toUTCString()

      return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${article.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${article.authorName ? `<author><![CDATA[${article.authorName}]]></author>` : ''}
      ${image ? `<enclosure url="${image}" type="image/jpeg" length="0" />` : ''}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[${siteName} — Articles]]></title>
    <link>${articlesUrl}</link>
    <description><![CDATA[Latest articles from ${siteName}]]></description>
    <language>en</language>
    <managingEditor><![CDATA[${siteSettings.contactEmail ?? siteUrl}]]></managingEditor>
    <webMaster><![CDATA[${siteSettings.contactEmail ?? siteUrl}]]></webMaster>
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
