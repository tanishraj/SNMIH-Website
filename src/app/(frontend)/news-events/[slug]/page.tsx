import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { NewsEventLivePreview } from '@/components/live-preview/NewsEventLivePreview'
import { NewsEventDetailPage } from '@/components/news-events/NewsEventDetailPage'
import { getDraftEventGalleryAlbums } from '@/lib/eventGallery'
import { getGalleryAlbumIDsFromBlocks } from '@/lib/eventGalleryShared'
import { getNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplate'
import {
  getNewsEventDetailAuthorLabel,
  getNewsEventDetailPageBlocks,
} from '@/lib/newsEventDetailTemplateShared'
import {
  getNewsEventBySlug,
  getNewsEventPreviewBySlug,
  getNewsEventsInheritedRobots,
} from '@/lib/newsEvents'
import { getNewsEventDetailMetadata, getNewsEventStructuredData } from '@/lib/newsEventsMetadata'
import { loadNewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewSnapshot'
import { loadReviewPreviewSnapshot } from '@/lib/reviewPreviewSnapshot'
import { getDraftSiteOfficeLocations } from '@/lib/siteOffices'
import type { User } from '@/payload-types'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'news-events',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    select: { slug: true },
    where: {
      _status: { equals: 'published' },
    },
  })
  return result.docs.map((entry) => ({ slug: entry.slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string | string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const [entry, inheritedRobots] = await Promise.all([
    getNewsEventBySlug(slug, new Date().toISOString()),
    getNewsEventsInheritedRobots(),
  ])

  return entry ? getNewsEventDetailMetadata(entry, inheritedRobots) : {}
}

export default async function NewsEventEntryPage({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const isPreview = resolvedSearchParams.preview === 'true'
  const nowISO = new Date().toISOString()

  if (isPreview) {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({
      canSetHeaders: false,
      headers: new Headers(await getHeaders()),
    })

    if (!user) notFound()

    const [draftEntry, template] = await Promise.all([
      getNewsEventPreviewBySlug(slug, user as User),
      getNewsEventDetailTemplate(),
    ])
    if (!draftEntry) notFound()

    const pageBlocks = getNewsEventDetailPageBlocks(template)
    const hasContact24 = pageBlocks.some((block) => block.blockType === 'contact24')
    const selectedGalleryAlbumIDs = getGalleryAlbumIDsFromBlocks(pageBlocks)
    const [reviewSnapshot, newsEventsSnapshot, officeLocations, eventGalleryAlbums] =
      await Promise.all([
        loadReviewPreviewSnapshot(pageBlocks),
        loadNewsEventsPreviewSnapshot(pageBlocks, user as User),
        hasContact24 ? getDraftSiteOfficeLocations() : Promise.resolve([]),
        selectedGalleryAlbumIDs.length
          ? getDraftEventGalleryAlbums(selectedGalleryAlbumIDs)
          : Promise.resolve([]),
      ])

    return (
      <NewsEventLivePreview
        eventGalleryAlbums={eventGalleryAlbums}
        initialData={draftEntry}
        initialTemplate={template}
        newsEventsSnapshot={newsEventsSnapshot}
        nowISO={nowISO}
        officeLocations={officeLocations}
        reviewSnapshot={reviewSnapshot}
      />
    )
  }

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
