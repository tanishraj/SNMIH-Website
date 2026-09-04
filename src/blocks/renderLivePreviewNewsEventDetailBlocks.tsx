import React from 'react'

import { NewsEventsContentBlockComponent } from '@/blocks/NewsEventsContent/Component'
import { PageBlockStack } from '@/blocks/PageBlockStack'
import {
  renderLivePreviewPageBlockNode,
  type LivePreviewPageBlock,
  type LivePreviewPageBlockRenderArgs,
} from '@/blocks/renderLivePreviewPageBlocks'
import { BlockErrorBoundary } from '@/blocks/shared/BlockErrorBoundary'
import { BlockAnchorWrapper } from '@/blocks/shared/BlockAnchorWrapper'
import { claimBlockAnchorID } from '@/blocks/shared/blockAnchor'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import type {
  NewsEventDetailTemplateBlock,
  ResolvedNewsEventDetailTemplate,
} from '@/lib/newsEventDetailTemplateShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import type { NewsEventsContentBlock } from '@/payload-types'

type DetailLivePreviewContext = {
  entry: PublicNewsEventDetail
  eventGalleryAlbums: EventGalleryAlbum[]
  newsEventsSnapshot: NewsEventsPreviewSnapshot
  officeLocations: SiteOfficeLocation[]
  reviewSnapshot: ReviewPreviewSnapshot
}

const isDynamicContent = (
  block: NewsEventDetailTemplateBlock,
): block is NewsEventDetailTemplateBlock & NewsEventsContentBlock =>
  block.blockType === 'newsEventsContent'

const isPageBlock = (
  block: NewsEventDetailTemplateBlock,
): block is NewsEventDetailTemplateBlock & LivePreviewPageBlock =>
  block.blockType !== 'newsEventsContent'

export function renderLivePreviewNewsEventDetailBlocks(
  template: ResolvedNewsEventDetailTemplate,
  context: DetailLivePreviewContext,
) {
  const automaticBreadcrumbs: ResolvedPageBreadcrumb[] = [
    { label: 'Home', url: '/' },
    { label: 'News & Events', url: '/news-events' },
    { label: context.entry.title },
  ]
  const args: LivePreviewPageBlockRenderArgs = {
    automaticBreadcrumbs,
    eventGalleryAlbums: context.eventGalleryAlbums,
    newsEventsSnapshot: context.newsEventsSnapshot,
    officeLocations: context.officeLocations,
    snapshot: context.reviewSnapshot,
    usedAnchorIDs: new Set(['main-content']),
  }

  return (
    <PageBlockStack>
      {template.layout.map((block, index) => {
        if (isPageBlock(block)) {
          return renderLivePreviewPageBlockNode(block, index, args)
        }

        if (!isDynamicContent(block)) return null

        const key = block.id ?? `${block.blockType}-${index}`
        const anchorID = claimBlockAnchorID(block.anchorId, args.usedAnchorIDs)
        return (
          <BlockAnchorWrapper anchorID={anchorID} key={key}>
            <BlockErrorBoundary blockType={block.blockType}>
              <NewsEventsContentBlockComponent {...block} entry={context.entry} />
            </BlockErrorBoundary>
          </BlockAnchorWrapper>
        )
      })}
    </PageBlockStack>
  )
}
