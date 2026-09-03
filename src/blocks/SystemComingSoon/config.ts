import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

import { createBaseSystemPageFields, createSystemPageBlock } from '../systemPageFields'

const defaults = {
  badge: 'Coming Soon',
  heading: 'This website is being prepared',
  description: 'We are finalizing the website and its information. Please check back again soon.',
}

export const SystemComingSoonBlock = createSystemPageBlock({
  fields: createBaseSystemPageFields(defaults),
  singularLabel: 'System Coming Soon',
  pluralLabel: 'System Coming Soon Blocks',
  slug: 'systemComingSoon',
  thumbnailAdmin: getBlockThumbnailAdmin('systemComingSoon'),
})
