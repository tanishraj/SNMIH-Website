import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

import type { AdminFeatureKey } from '@/access/adminFeatures'
import { recordOperationalAuditEvent } from '@/lib/operationalAudit'

type AuditDoc = {
  [key: string]: unknown
  id: number | string
  _status?: string | null
  moderationStatus?: string | null
  siteMode?: string | null
  title?: string | null
}

type HookConfig = {
  entityType: string
  feature: AdminFeatureKey
  getSummary: (args: { doc: AuditDoc; previousDoc?: Partial<AuditDoc> | null }) => string
  titleField: string
}

export const createCollectionAuditHook = (config: HookConfig): CollectionAfterChangeHook => {
  return async (args) => {
    const { doc, operation, previousDoc, req } = args as {
      doc: AuditDoc
      operation: string
      previousDoc?: Partial<AuditDoc> | null
      req: Parameters<typeof recordOperationalAuditEvent>[0]['req']
    }

    await recordOperationalAuditEvent({
      action: operation,
      entityId: String(doc.id ?? ''),
      entityTitle: String(doc[config.titleField] ?? `#${doc.id}`),
      entityType: config.entityType,
      feature: config.feature,
      req,
      summary: config.getSummary({ doc, previousDoc }),
    })

    return doc
  }
}

export const createGlobalAuditHook = (
  config: Omit<HookConfig, 'titleField'> & { title: string },
): GlobalAfterChangeHook => {
  return async (args) => {
    const { doc, previousDoc, req } = args as {
      doc: AuditDoc
      previousDoc?: Partial<AuditDoc> | null
      req: Parameters<typeof recordOperationalAuditEvent>[0]['req']
    }

    await recordOperationalAuditEvent({
      action: 'update',
      entityId: config.entityType,
      entityTitle: config.title,
      entityType: config.entityType,
      feature: config.feature,
      req,
      summary: config.getSummary({ doc, previousDoc }),
    })

    return doc
  }
}
