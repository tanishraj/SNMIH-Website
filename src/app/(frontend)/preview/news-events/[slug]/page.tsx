import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { NewsEventLivePreview } from '@/components/live-preview/NewsEventLivePreview'
import { getDraftEventGalleryAlbums } from '@/lib/eventGallery'
import { getGalleryAlbumIDsFromBlocks } from '@/lib/eventGalleryShared'
import { getNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplate'
import { getNewsEventDetailPageBlocks } from '@/lib/newsEventDetailTemplateShared'
import { getNewsEventPreviewBySlug } from '@/lib/newsEvents'
import { loadNewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewSnapshot'
import { loadReviewPreviewSnapshot } from '@/lib/reviewPreviewSnapshot'
import { getDraftSiteOfficeLocations } from '@/lib/siteOffices'
import type { User } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ slug: string }> }

export default async function NewsEventPreviewPage({ params }: PageProps) {
  const { slug } = await params
  const nowISO = new Date().toISOString()
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
