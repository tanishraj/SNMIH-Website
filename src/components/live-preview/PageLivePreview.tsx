'use client'

import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import type { Page } from '@/payload-types'
import { RefreshRouteOnSave, useLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type Props = {
  eventGalleryAlbums: EventGalleryAlbum[]
  initialData: Page
  isHomepage: boolean
  newsEventsSnapshot: NewsEventsPreviewSnapshot
  officeLocations: SiteOfficeLocation[]
  reviewSnapshot: ReviewPreviewSnapshot
}

export function PageLivePreview({
  eventGalleryAlbums,
  initialData,
  isHomepage,
  newsEventsSnapshot,
  officeLocations,
  reviewSnapshot,
}: Props) {
  const router = useRouter()
  const { data } = useLivePreview<Page>({
    depth: 8,
    initialData,
    serverURL,
  })

  return (
    <>
      {renderLivePreviewPageBlocks(
        data.layout,
        reviewSnapshot,
        newsEventsSnapshot,
        officeLocations,
        eventGalleryAlbums,
        { isHomepage, page: data },
      )}
      <RefreshRouteOnSave depth={8} refresh={() => router.refresh()} serverURL={serverURL} />
    </>
  )
}
