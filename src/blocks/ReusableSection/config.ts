import type { Block } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

export const ReusableSectionBlock: Block = {
  slug: 'reusableSection',
  interfaceName: 'ReusableSectionBlock',
  labels: {
    singular: 'Reusable Section',
    plural: 'Reusable Sections',
  },
  admin: getBlockThumbnailAdmin('reusableSection'),
  fields: [
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'reusable-sections',
      required: true,
      admin: {
        description: 'Select a reusable section to embed on this page.',
      },
    },
  ],
}
