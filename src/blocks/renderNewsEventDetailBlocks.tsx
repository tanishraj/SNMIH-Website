import React from 'react'

import { NewsEventsContentBlockComponent } from '@/blocks/NewsEventsContent/Component'
import { PageBlockStack } from '@/blocks/PageBlockStack'
import {
  renderPageBlockNode,
  type PageBlock,
  type PageBlockRenderArgs,
} from '@/blocks/renderPageBlocks'
import { BlockErrorBoundary } from '@/blocks/shared/BlockErrorBoundary'
import { BlockAnchorWrapper } from '@/blocks/shared/BlockAnchorWrapper'
import { claimBlockAnchorID } from '@/blocks/shared/blockAnchor'
import type {
  NewsEventDetailTemplateBlock,
  ResolvedNewsEventDetailTemplate,
} from '@/lib/newsEventDetailTemplateShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'
import type { NewsEventsContentBlock } from '@/payload-types'

type DetailRenderContext = {
  automaticBreadcrumbs: ResolvedPageBreadcrumb[]
  entry: PublicNewsEventDetail
}

const isDynamicContent = (
  block: NewsEventDetailTemplateBlock,
): block is NewsEventDetailTemplateBlock & NewsEventsContentBlock =>
  block.blockType === 'newsEventsContent'

const isPageBlock = (
  block: NewsEventDetailTemplateBlock,
): block is NewsEventDetailTemplateBlock & PageBlock => block.blockType !== 'newsEventsContent'

export function renderNewsEventDetailBlocks(
  template: ResolvedNewsEventDetailTemplate,
  context: DetailRenderContext,
) {
  const args: PageBlockRenderArgs = {
    automaticBreadcrumbs: context.automaticBreadcrumbs,
    heroPreloadState: { assigned: false },
    usedAnchorIDs: new Set(['main-content']),
  }

  return (
    <PageBlockStack>
      {template.layout.map((block, index) => {
        if (isPageBlock(block)) {
          return renderPageBlockNode(block, index, args)
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
