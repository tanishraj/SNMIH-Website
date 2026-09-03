import type { CollectionAfterChangeHook } from 'payload'

import {
  buildWorkQueueDedupeKey,
  syncWorkQueueConditions,
  type WorkQueueCondition,
} from '@/lib/workQueue'

type ReviewDoc = {
  id: number | string
  internalModerationNotes?: string | null
  moderationStatus?: string | null
  slug?: string | null
  title?: string | null
  updatedAt?: string | null
  sourceSubmission?: number | string | { id?: number | string } | null
}

export const syncReviewToWorkQueue: CollectionAfterChangeHook = async ({ doc, req }) => {
  const typedDoc = doc as Partial<ReviewDoc>

  if (!typedDoc?.id) {
    return doc
  }

  const title = typedDoc.title || `Review ${typedDoc.id}`
  const conditions: WorkQueueCondition[] = [
    {
      dedupeKey: buildWorkQueueDedupeKey({
        sourceCollection: 'reviews',
        sourceID: typedDoc.id,
        queueType: 'moderation',
        reasonCode: 'review-moderation-required',
      }),
      details: typedDoc.internalModerationNotes,
      priority: 'normal',
      queueType: 'moderation',
      reasonCode: 'review-moderation-required',
      resolutionSummary: `${title} no longer requires moderation review.`,
      sourceAdminPath: `/admin/collections/reviews/${typedDoc.id}`,
      sourceCollection: 'reviews',
      sourceID: typedDoc.id,
      sourceSlug: typedDoc.slug ?? null,
      sourceTitle: title,
      sourceUpdatedAt: typedDoc.updatedAt ?? null,
      summary: `${title} requires review moderation.`,
    },
  ]

  const activeCondition =
    typedDoc.sourceSubmission && typedDoc.moderationStatus === 'pending' ? conditions[0] : null

  await syncWorkQueueConditions({
    activeCondition,
    conditions,
    req,
  })

  return typedDoc
}
