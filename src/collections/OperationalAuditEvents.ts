import type { CollectionConfig } from 'payload'

import { ADMIN_FEATURE_KEYS, ADMIN_FEATURES } from '@/access/adminFeatures'
import {
  getGrantedFeatureKeys,
  hasFeature,
  hideUnlessFeature,
  isAdmin,
} from '@/access/featureAccess'

export const OperationalAuditEvents: CollectionConfig = {
  slug: 'operational-audit-events',
  labels: {
    singular: 'Audit Log Entry',
    plural: 'Audit Log',
  },
  admin: {
    description:
      'Read-only record of selected governed content, settings, queue, and media operations.',
    group: 'Administration',
    hidden: hideUnlessFeature('auditLog'),
    useAsTitle: 'summary',
    defaultColumns: ['occurredAt', 'entityType', 'entityTitle', 'actorEmail', 'action'],
  },
  access: {
    create: () => false,
    delete: () => false,
    read: ({ req }) => {
      if (isAdmin(req.user)) return true
      if (!hasFeature(req.user, 'auditLog')) return false
      const features = getGrantedFeatureKeys(req.user).filter((key) => key !== 'auditLog')
      return features.length > 0 ? { feature: { in: features } } : false
    },
    update: () => false,
  },
  fields: [
    {
      name: 'feature',
      type: 'select',
      options: ADMIN_FEATURE_KEYS.map((value) => ({
        label: ADMIN_FEATURES[value].label,
        value,
      })),
      index: true,
      admin: {
        description: 'Feature associated with this event. Unmapped legacy events are Admin-only.',
        readOnly: true,
      },
    },
    {
      name: 'entityType',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'entityId',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'entityTitle',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'action',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'actorId',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'actorEmail',
      type: 'email',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'actorRole',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
