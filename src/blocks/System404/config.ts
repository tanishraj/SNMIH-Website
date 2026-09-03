import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

import { createBaseSystemPageFields, createSystemPageBlock } from '../systemPageFields'

const defaults = {
  badge: '404',
  heading: "We couldn't find that page",
  description: 'It may have been moved, deleted, or the web address might be incorrect.',
}

export const System404Block = createSystemPageBlock({
  fields: createBaseSystemPageFields(defaults),
  singularLabel: 'System 404',
  pluralLabel: 'System 404 Blocks',
  slug: 'system404',
  thumbnailAdmin: getBlockThumbnailAdmin('system404'),
})
