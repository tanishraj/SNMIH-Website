import type { Field } from 'payload'

import type { AdminFeatureKey } from '@/access/adminFeatures'
import { featureFieldReadAccess } from '@/access/featureAccess'

export const publicationMetadataFields = (feature: AdminFeatureKey): Field[] => [
  {
    type: 'collapsible',
    label: 'Publication',
    admin: {
      initCollapsed: true,
      position: 'sidebar',
    },
    fields: [
      {
        name: 'publishedAt',
        type: 'date',
        access: {
          create: () => false,
          update: () => false,
        },
        admin: {
          description: 'Set automatically when this document is published.',
          readOnly: true,
        },
      },
      {
        name: 'publishedBy',
        type: 'relationship',
        relationTo: 'users',
        access: {
          create: () => false,
          read: featureFieldReadAccess(feature),
          update: () => false,
        },
        admin: {
          description: 'Account that most recently published this document.',
          readOnly: true,
        },
      },
    ],
  },
]
