'use client'

import { RefreshRouteOnSave, useLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

import { renderLivePreviewNewsEventDetailBlocks } from '@/blocks/renderLivePreviewNewsEventDetailBlocks'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import type { ResolvedNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplateShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'
import { toPublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import type { NewsEvent } from '@/payload-types'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export function NewsEventLivePreview({
  eventGalleryAlbums,
  initialData,
  initialTemplate,
  newsEventsSnapshot,
  nowISO,
  officeLocations,
  reviewSnapshot,
}: {
  eventGalleryAlbums: EventGalleryAlbum[]
  initialData: NewsEvent
  initialTemplate: ResolvedNewsEventDetailTemplate
  newsEventsSnapshot: NewsEventsPreviewSnapshot
  nowISO: string
  officeLocations: SiteOfficeLocation[]
  reviewSnapshot: ReviewPreviewSnapshot
}) {
  const router = useRouter()
  const { data } = useLivePreview<NewsEvent>({ depth: 2, initialData, serverURL })
  const entry = toPublicNewsEventDetail(data, nowISO)

  return (
    <>
      {renderLivePreviewNewsEventDetailBlocks(initialTemplate, {
        entry,
        eventGalleryAlbums,
        newsEventsSnapshot,
        officeLocations,
        reviewSnapshot,
      })}
      <RefreshRouteOnSave depth={2} refresh={() => router.refresh()} serverURL={serverURL} />
    </>
  )
}
