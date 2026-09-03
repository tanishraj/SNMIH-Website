import type { PayloadRequest } from 'payload'

import { getFeatureForResource, type AdminFeatureKey } from '@/access/adminFeatures'
import { isWorkQueueSyncContext, withWorkQueueSyncContext } from '@/hooks/syncWorkQueueItem'

export type WorkQueueStatus = 'open' | 'in_progress' | 'blocked' | 'resolved' | 'canceled'
export type WorkQueuePriority = 'low' | 'normal' | 'high' | 'urgent'
export type WorkQueueType =
  'approval' | 'moderation' | 'follow_up' | 'publish_issue' | 'media_issue' | 'system_issue'

export type WorkQueueRecord = {
  id: number | string
  autoResolved?: boolean | null
  assignee?: number | string | { id?: number | string } | null
  details?: string | null
  dueDate?: string | null
  firstOpenedAt?: string | null
  feature?: AdminFeatureKey | null
  lastSyncedAt?: string | null
  operatorNotes?: string | null
  priority?: WorkQueuePriority | null
  resolutionSummary?: string | null
  resolvedAt?: string | null
  sourceAdminPath?: string | null
  sourceCollection?: string | null
  sourceID?: string | null
  sourceSlug?: string | null
  sourceTitle?: string | null
  sourceUpdatedAt?: string | null
  status?: WorkQueueStatus | null
  summary?: string | null
}

const blockingPublishStatuses: WorkQueueStatus[] = ['open', 'blocked']
const blockingPublishQueueTypes: WorkQueueType[] = ['approval', 'publish_issue']

export type UpsertWorkQueueItemArgs = {
  dedupeKey: string
  details?: string | null
  priority?: WorkQueuePriority
  queueType: WorkQueueType
  reasonCode: string
  req: PayloadRequest
  sourceAdminPath?: string | null
  sourceCollection: string
  sourceID: number | string
  sourceSlug?: string | null
  sourceTitle: string
  sourceUpdatedAt?: string | null
  summary: string
}

export type ResolveWorkQueueItemArgs = {
  dedupeKey: string
  req: PayloadRequest
  resolutionSummary?: string
  status?: Extract<WorkQueueStatus, 'resolved' | 'canceled'>
}

export type WorkQueueCondition = Omit<UpsertWorkQueueItemArgs, 'req'> & {
  resolveStatus?: Extract<WorkQueueStatus, 'resolved' | 'canceled'>
  resolutionSummary?: string
}

export const buildWorkQueueDedupeKey = ({
  sourceCollection,
  sourceID,
  queueType,
  reasonCode,
}: {
  sourceCollection: string
  sourceID: number | string
  queueType: WorkQueueType
  reasonCode: string
}) => `${sourceCollection}:${sourceID}:${queueType}:${reasonCode}`

const findWorkQueueRecord = async ({
  dedupeKey,
  req,
}: {
  dedupeKey: string
  req: PayloadRequest
}): Promise<WorkQueueRecord | null> => {
  const result = await req.payload.find({
    collection: 'work-queue',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      dedupeKey: {
        equals: dedupeKey,
      },
    },
  })

  return (result.docs[0] as WorkQueueRecord | undefined) ?? null
}

export const findBlockingPublishQueueItems = async ({
  req,
  sourceCollection,
  sourceID,
}: {
  req: PayloadRequest
  sourceCollection: string
  sourceID: number | string
}): Promise<WorkQueueRecord[]> => {
  const result = await req.payload.find({
    collection: 'work-queue',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    req,
    sort: 'summary',
    where: {
      and: [
        {
          sourceCollection: {
            equals: sourceCollection,
          },
        },
        {
          sourceID: {
            equals: String(sourceID),
          },
        },
        {
          status: {
            in: blockingPublishStatuses,
          },
        },
        {
          queueType: {
            in: blockingPublishQueueTypes,
          },
        },
      ],
    },
  })

  return result.docs as WorkQueueRecord[]
}

export const formatBlockingPublishQueueMessage = (
  items: Array<{
    summary?: string | null
  }>,
): string => {
  const [first, ...rest] = items
  const firstSummary = first?.summary || 'Unresolved publish blocker'

  if (rest.length === 0) {
    return `Cannot publish because Work Queue still has a blocking item: "${firstSummary}". Resolve it in Work Queue before publishing.`
  }

  return `Cannot publish because Work Queue still has blocking items: "${firstSummary}" and ${rest.length} more. Resolve them in Work Queue before publishing.`
}

export const upsertWorkQueueItem = async ({
  dedupeKey,
  details,
  priority = 'normal',
  queueType,
  reasonCode,
  req,
  sourceAdminPath,
  sourceCollection,
  sourceID,
  sourceSlug,
  sourceTitle,
  sourceUpdatedAt,
  summary,
}: UpsertWorkQueueItemArgs): Promise<void> => {
  if (isWorkQueueSyncContext(req.context as Record<string, unknown> | undefined)) {
    return
  }

  const existing = await findWorkQueueRecord({
    dedupeKey,
    req,
  })
  const now = new Date().toISOString()
  const sourceFeature = getFeatureForResource({ kind: 'collection', slug: sourceCollection })

  if (!sourceFeature) {
    throw new Error(`Cannot create a work queue item for unregistered source ${sourceCollection}.`)
  }

  const baseData = {
    autoResolved: false,
    details,
    feature: sourceFeature,
    lastSyncedAt: now,
    priority,
    queueType,
    reasonCode,
    sourceAdminPath,
    sourceCollection,
    sourceID: String(sourceID),
    sourceSlug,
    sourceTitle,
    sourceUpdatedAt,
    summary,
  }

  if (existing) {
    const shouldReopen = existing.status === 'resolved' || existing.status === 'canceled'

    await req.payload.update({
      collection: 'work-queue',
      id: existing.id,
      context: withWorkQueueSyncContext(req.context as Record<string, unknown> | undefined),
      data: {
        ...baseData,
        ...(shouldReopen
          ? {
              resolvedAt: null,
              status: 'open',
            }
          : {}),
      },
      overrideAccess: true,
      req,
    })

    return
  }

  await req.payload.create({
    collection: 'work-queue',
    context: withWorkQueueSyncContext(req.context as Record<string, unknown> | undefined),
    data: {
      ...baseData,
      dedupeKey,
      firstOpenedAt: now,
      status: 'open',
    },
    overrideAccess: true,
    req,
  })
}

export const resolveWorkQueueItem = async ({
  dedupeKey,
  req,
  resolutionSummary,
  status = 'resolved',
}: ResolveWorkQueueItemArgs): Promise<void> => {
  if (isWorkQueueSyncContext(req.context as Record<string, unknown> | undefined)) {
    return
  }

  const existing = await findWorkQueueRecord({
    dedupeKey,
    req,
  })

  if (!existing) {
    return
  }

  await req.payload.update({
    collection: 'work-queue',
    id: existing.id,
    context: withWorkQueueSyncContext(req.context as Record<string, unknown> | undefined),
    data: {
      autoResolved: true,
      lastSyncedAt: new Date().toISOString(),
      resolutionSummary,
      resolvedAt: new Date().toISOString(),
      status,
    },
    overrideAccess: true,
    req,
  })
}

export const syncWorkQueueConditions = async ({
  activeCondition,
  conditions,
  req,
}: {
  activeCondition?: WorkQueueCondition | null
  conditions: WorkQueueCondition[]
  req: PayloadRequest
}): Promise<void> => {
  if (activeCondition) {
    await upsertWorkQueueItem({
      ...activeCondition,
      req,
    })
  }

  const activeDedupeKey = activeCondition?.dedupeKey ?? null

  for (const condition of conditions) {
    if (condition.dedupeKey === activeDedupeKey) {
      continue
    }

    await resolveWorkQueueItem({
      dedupeKey: condition.dedupeKey,
      req,
      resolutionSummary:
        condition.resolutionSummary ??
        `${condition.sourceTitle} no longer requires this queue action.`,
      status: condition.resolveStatus ?? 'resolved',
    })
  }
}
