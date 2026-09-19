import { getStaticSlugParams } from '@/lib/staticParams'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { NewsEventDetailPage } from '@/components/news-events/NewsEventDetailPage'
import { getNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplate'
import { getNewsEventDetailAuthorLabel } from '@/lib/newsEventDetailTemplateShared'
import { getNewsEventBySlug, getNewsEventsInheritedRobots } from '@/lib/newsEvents'
import { getNewsEventDetailMetadata, getNewsEventStructuredData } from '@/lib/newsEventsMetadata'

// Prebuild known content; newly published paths are generated on their first visit.
export const dynamic = 'force-static'
export const dynamicParams = true

export async function generateStaticParams() {
  return getStaticSlugParams('news-events')
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const [entry, inheritedRobots] = await Promise.all([
    getNewsEventBySlug(slug, new Date().toISOString()),
    getNewsEventsInheritedRobots(),
  ])

  return entry ? getNewsEventDetailMetadata(entry, inheritedRobots) : {}
}

export default async function NewsEventEntryPage({ params }: PageProps) {
  const { slug } = await params
  const nowISO = new Date().toISOString()

  const [entry, template] = await Promise.all([
    getNewsEventBySlug(slug, nowISO),
    getNewsEventDetailTemplate(),
  ])
  if (!entry) notFound()

  const structuredData = getNewsEventStructuredData(entry, getNewsEventDetailAuthorLabel(template))

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />
      <NewsEventDetailPage entry={entry} template={template} />
    </>
  )
}
