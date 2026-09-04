import type { BlocksFieldValidation, GlobalConfig } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { newsEventsDetailBuilderBlocks } from '@/blocks/blockCatalog'
import { validateUniqueBlockAnchorIDs } from '@/blocks/shared/blockAnchor'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'

type LayoutBlock = { blockType?: string | null }

export const validateNewsEventsDetailLayout: BlocksFieldValidation = async (value, { data }) => {
  const anchorValidation = validateUniqueBlockAnchorIDs(value)
  if (anchorValidation !== true) return anchorValidation

  const status = (data as { _status?: 'draft' | 'published' } | undefined)?._status
  if (status !== 'published') return true

  const count = Array.isArray(value)
    ? (value as LayoutBlock[]).filter(({ blockType }) => blockType === 'newsEventsContent').length
    : 0

  return count === 1 || 'Add exactly one News & Events Content block before publishing.'
}

export const NewsEventsDetailTemplate: GlobalConfig = {
  slug: 'news-events-detail-template',
  label: 'Detail Page Template',
  admin: {
    group: 'News & Events',
    description: 'Build the shared page used by every News & Events detail entry.',
    hidden: hideUnlessFeature('newsEventsDetailTemplate'),
  },
  access: {
    read: allowPublicReadOrFeature('newsEventsDetailTemplate'),
    readVersions: requireFeature('newsEventsDetailTemplate'),
    update: requireFeature('newsEventsDetailTemplate'),
  },
  versions: { drafts: true },
  hooks: { afterChange: [revalidateGlobalsCacheForGlobal] },
  fields: [
    {
      name: 'layout',
      label: 'Layout',
      type: 'blocks',
      blocks: newsEventsDetailBuilderBlocks,
      required: false,
      validate: validateNewsEventsDetailLayout,
      admin: {
        description:
          'Add exactly one News & Events Content block, then arrange shared blocks around it.',
        initCollapsed: true,
      },
    },
  ],
}
