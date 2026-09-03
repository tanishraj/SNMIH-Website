import type { PayloadRequest } from 'payload'

import type { AdminFeatureKey } from '@/access/adminFeatures'

export type RecordOperationalAuditEventArgs = {
  action: string
  entityId: string
  entityTitle: string
  entityType: string
  feature?: AdminFeatureKey | null
  req: PayloadRequest
  summary: string
}

export type RecordWorkQueueAuditEventArgs = {
  action: string
  feature: AdminFeatureKey | null
  req: PayloadRequest
  summary: string
  workQueueID: string
}

export const describeAuditValue = (value: unknown, fallback = 'unset'): string => {
  if (value == null || value === '') {
    return fallback
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'object') {
    if ('title' in value && typeof value.title === 'string' && value.title.length > 0) {
      return value.title
    }

    if ('slug' in value && typeof value.slug === 'string' && value.slug.length > 0) {
      return value.slug
    }

    if ('id' in value && (typeof value.id === 'string' || typeof value.id === 'number')) {
      return String(value.id)
    }
  }

  return fallback
}

export const recordOperationalAuditEvent = async ({
  action,
  entityId,
  entityTitle,
  entityType,
  feature,
  req,
  summary,
}: RecordOperationalAuditEventArgs): Promise<void> => {
  await req.payload.create({
    collection: 'operational-audit-events',
    data: {
      action,
      actorId:
        typeof req.user?.id === 'string' || typeof req.user?.id === 'number'
          ? String(req.user.id)
          : undefined,
      actorEmail: typeof req.user?.email === 'string' ? req.user.email : undefined,
      actorRole: typeof req.user?.role === 'string' ? req.user.role : undefined,
      entityId,
      entityTitle,
      entityType,
      feature: feature ?? undefined,
      occurredAt: new Date().toISOString(),
      summary,
    },
    overrideAccess: true,
    req,
  })
}

export const recordWorkQueueAuditEvent = async ({
  action,
  feature,
  req,
  summary,
  workQueueID,
}: RecordWorkQueueAuditEventArgs): Promise<void> => {
  await recordOperationalAuditEvent({
    action,
    entityId: workQueueID,
    entityTitle: 'Work Queue Item',
    entityType: 'work_queue',
    feature,
    req,
    summary,
  })
}
