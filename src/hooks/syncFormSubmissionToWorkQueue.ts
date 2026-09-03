import type { CollectionAfterChangeHook } from 'payload'

import { buildWorkQueueDedupeKey, syncWorkQueueConditions, type WorkQueueCondition } from '@/lib/workQueue'

type FormSubmissionDoc = {
  id: number | string
  internalNotes?: string | null
  submissionIntent?: 'general' | 'lead' | 'review' | null
  status?: string | null
  submitterEmail?: string | null
  submitterName?: string | null
  updatedAt?: string | null
}

export const syncFormSubmissionToWorkQueue: CollectionAfterChangeHook = async ({ doc, req }) => {
  const typedDoc = doc as Partial<FormSubmissionDoc>

  if (!typedDoc?.id) {
    return doc
  }

  const title = typedDoc.submitterEmail || typedDoc.submitterName || `Submission ${typedDoc.id}`
  const conditions: WorkQueueCondition[] = [
    {
      dedupeKey: buildWorkQueueDedupeKey({
        sourceCollection: 'form-submissions',
        sourceID: typedDoc.id,
        queueType: 'follow_up',
        reasonCode: 'submission-new',
      }),
      details: typedDoc.internalNotes,
      priority: typedDoc.submissionIntent === 'lead' ? 'high' : 'normal',
      queueType: 'follow_up',
      reasonCode: 'submission-new',
      resolutionSummary: `${title} is no longer new.`,
      sourceAdminPath: `/admin/collections/form-submissions/${typedDoc.id}`,
      sourceCollection: 'form-submissions',
      sourceID: typedDoc.id,
      sourceTitle: title,
      sourceUpdatedAt: typedDoc.updatedAt ?? null,
      summary: `${title} requires initial follow-up.`,
    },
    {
      dedupeKey: buildWorkQueueDedupeKey({
        sourceCollection: 'form-submissions',
        sourceID: typedDoc.id,
        queueType: 'follow_up',
        reasonCode: 'submission-in-review',
      }),
      details: typedDoc.internalNotes,
      priority: typedDoc.submissionIntent === 'lead' ? 'high' : 'normal',
      queueType: 'follow_up',
      reasonCode: 'submission-in-review',
      resolutionSummary: `${title} is no longer in review.`,
      sourceAdminPath: `/admin/collections/form-submissions/${typedDoc.id}`,
      sourceCollection: 'form-submissions',
      sourceID: typedDoc.id,
      sourceTitle: title,
      sourceUpdatedAt: typedDoc.updatedAt ?? null,
      summary: `${title} still requires follow-up review.`,
    },
  ]

  const activeCondition =
    typedDoc.status === 'new'
      ? conditions[0]
      : typedDoc.status === 'in_review'
        ? conditions[1]
        : null

  await syncWorkQueueConditions({
    activeCondition,
    conditions,
    req,
  })

  return typedDoc
}
