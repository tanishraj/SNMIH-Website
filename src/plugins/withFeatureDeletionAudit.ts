import type { CollectionAfterDeleteHook, Config, Plugin } from 'payload'

import { ADMIN_FEATURES, getFeatureForResource } from '@/access/adminFeatures'
import { recordOperationalAuditEvent } from '@/lib/operationalAudit'

const excludedFeatures = new Set(['actionQueue', 'auditLog'])

export const withFeatureDeletionAudit =
  (): Plugin =>
  (config: Config): Config => ({
    ...config,
    collections: config.collections?.map((collection) => {
      const feature = getFeatureForResource({ kind: 'collection', slug: collection.slug })

      if (!feature || excludedFeatures.has(feature)) {
        return collection
      }

      const auditPermanentDeletion: CollectionAfterDeleteHook = async ({ doc, req }) => {
        const label = ADMIN_FEATURES[feature].label

        await recordOperationalAuditEvent({
          action: 'permanently_deleted',
          entityId: String(doc.id),
          entityTitle: `${label} #${doc.id}`,
          entityType: collection.slug,
          feature,
          req,
          summary: `${label} record #${doc.id} was permanently deleted.`,
        })

        return doc
      }

      return {
        ...collection,
        hooks: {
          ...collection.hooks,
          afterDelete: [...(collection.hooks?.afterDelete ?? []), auditPermanentDeletion],
        },
      }
    }),
  })
