import type { Block } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

export const CelebrationBlock: Block = {
  slug: 'celebration',
  interfaceName: 'CelebrationBlock',
  labels: {
    singular: 'Celebration',
    plural: 'Celebrations',
  },
  admin: getBlockThumbnailAdmin('celebration'),
  fields: [
    {
      name: 'celebration',
      type: 'relationship',
      relationTo: 'celebrations',
      required: true,
      filterOptions: { _status: { equals: 'published' } },
      admin: {
        allowCreate: false,
        description:
          'Shows this celebration as a modal on this page during its dates. It takes priority over a site-wide celebration on the same day and adds nothing to the page layout itself. Create and schedule celebrations under Content → Celebrations.',
      },
    },
  ],
}
