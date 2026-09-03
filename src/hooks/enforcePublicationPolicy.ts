import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import type { AdminFeatureKey } from '@/access/adminFeatures'
import { hasFeature } from '@/access/featureAccess'
import { findBlockingPublishQueueItems, formatBlockingPublishQueueMessage } from '@/lib/workQueue'

type PublicationDocument = {
  id?: number | string | null
  _status?: 'draft' | 'published' | null
  publishedAt?: string | null
  publishedBy?: number | string | null
}

type QueueAwareCollection = 'pages' | 'articles' | 'news-events' | 'reviews' | 'system-pages'

export const LEGAL_PAGES_MIGRATION_CONTEXT = 'legal-pages-migration' as const
export const PERMISSIONS_MIGRATION_CONTEXT = 'two-role-feature-permissions-migration' as const

const isTrustedPublicationContext = (context: Record<string, unknown> | undefined) =>
  context?.systemProvisioning === LEGAL_PAGES_MIGRATION_CONTEXT ||
  context?.permissionsMigration === PERMISSIONS_MIGRATION_CONTEXT

const getUserID = (user: unknown): number | string | null => {
  if (!user || typeof user !== 'object' || !('id' in user)) return null
  const id = user.id
  return (typeof id === 'number' && Number.isFinite(id)) ||
    (typeof id === 'string' && id.length > 0)
    ? id
    : null
}

export const enforcePublicationPolicy =
  (feature: AdminFeatureKey, sourceCollection: QueueAwareCollection): CollectionBeforeChangeHook =>
  async ({ context, data, originalDoc, req }) => {
    const nextData = { ...((data ?? {}) as PublicationDocument) }
    const original = (originalDoc ?? {}) as PublicationDocument
    const nextStatus = nextData._status ?? original._status ?? 'draft'
    const isPublishing = nextStatus === 'published' && original._status !== 'published'

    if (!isPublishing) return nextData

    if (!isTrustedPublicationContext(context as Record<string, unknown> | undefined)) {
      if (!req.user || !hasFeature(req.user, feature)) {
        throw new APIError(`Publishing requires access to ${feature}.`, 403)
      }

      const sourceID = nextData.id ?? original.id
      if (sourceID != null) {
        const blockers = await findBlockingPublishQueueItems({
          req,
          sourceCollection,
          sourceID,
        })
        if (blockers.length > 0) {
          throw new APIError(formatBlockingPublishQueueMessage(blockers), 400)
        }
      }
    }

    nextData._status = 'published'
    nextData.publishedAt = new Date().toISOString()
    nextData.publishedBy = getUserID(req.user)
    return nextData
  }
