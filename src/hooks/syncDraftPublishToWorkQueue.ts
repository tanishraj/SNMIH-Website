import type { CollectionAfterChangeHook } from 'payload'

import type { WorkQueueCondition } from '@/lib/workQueue'
import { buildWorkQueueDedupeKey, syncWorkQueueConditions } from '@/lib/workQueue'

type DraftDocument = {
  [key: string]: unknown
  _status?: 'draft' | 'published' | null
  id: number | string
  slug?: string | null
  title?: string | null
  updatedAt?: string | null
}

const sourceTitle = (doc: DraftDocument, field: string, fallback: string) => {
  const value = doc[field]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

export const createDraftPublishQueueHook =
  ({
    isActionable,
    sourceCollection,
    sourceAdminPathPrefix,
    summary,
    titleField,
  }: {
    isActionable?: (doc: DraftDocument) => boolean
    sourceAdminPathPrefix: string
    sourceCollection: string
    summary: (doc: DraftDocument, title: string) => string
    titleField: string
  }): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    const typedDoc = doc as Partial<DraftDocument>
    if (!typedDoc.id) return doc

    const title = sourceTitle(
      typedDoc as DraftDocument,
      titleField,
      `${sourceCollection} ${typedDoc.id}`,
    )
    const condition: WorkQueueCondition = {
      dedupeKey: buildWorkQueueDedupeKey({
        sourceCollection,
        sourceID: typedDoc.id,
        queueType: 'publish_issue',
        reasonCode: 'draft-change-pending-publication',
      }),
      priority: 'normal',
      queueType: 'publish_issue',
      reasonCode: 'draft-change-pending-publication',
      resolutionSummary: `${title} no longer has unpublished draft changes.`,
      sourceAdminPath: `${sourceAdminPathPrefix}/${typedDoc.id}`,
      sourceCollection,
      sourceID: typedDoc.id,
      sourceSlug: typedDoc.slug ?? null,
      sourceTitle: title,
      sourceUpdatedAt: typedDoc.updatedAt ?? null,
      summary: summary(typedDoc as DraftDocument, title),
    }
    const actionable =
      typedDoc._status === 'draft' && (isActionable?.(typedDoc as DraftDocument) ?? true)

    await syncWorkQueueConditions({
      activeCondition: actionable ? condition : null,
      conditions: [condition],
      req,
    })

    return typedDoc
  }
