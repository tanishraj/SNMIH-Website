import { describe, expect, it, vi } from 'vitest'

import { OperationalAuditEvents } from '@/collections/OperationalAuditEvents'
import { WorkQueue } from '@/collections/WorkQueue'
import { createCollectionAuditHook, createGlobalAuditHook } from '@/hooks/logOperationalAuditEvent'
import { recordWorkQueueAuditEvent } from '@/lib/operationalAudit'

describe('operational audit collection', () => {
  it('is read-only for operators and grouped under Administration', () => {
    expect(OperationalAuditEvents.slug).toBe('operational-audit-events')
    expect(OperationalAuditEvents.admin?.group).toBe('Administration')
    expect(OperationalAuditEvents.access?.create?.({} as never)).toBe(false)
    expect(OperationalAuditEvents.access?.update?.({} as never)).toBe(false)
  })

  it('scopes Site Manager reads to events for directly granted source features', () => {
    const read = OperationalAuditEvents.access?.read
    if (!read) throw new Error('Expected Audit Log read access.')

    expect(
      read({
        req: {
          user: {
            role: 'siteManager',
            features: { auditLog: true, pages: true },
          },
        },
      } as never),
    ).toEqual({ feature: { in: ['pages'] } })
    expect(
      read({
        req: { user: { role: 'siteManager', features: { auditLog: true } } },
      } as never),
    ).toBe(false)
  })

  it('stores human-readable audit summaries through the collection hook factory', async () => {
    const create = vi.fn(async () => ({}))
    const hook = createCollectionAuditHook({
      entityType: 'page',
      feature: 'pages',
      getSummary: ({ doc, previousDoc }) =>
        `Publication moved from ${previousDoc?._status ?? 'draft'} to ${doc._status}.`,
      titleField: 'title',
    })

    await hook({
      doc: {
        id: 44,
        title: 'About',
        _status: 'published',
      },
      operation: 'update',
      previousDoc: {
        _status: 'draft',
      },
      req: {
        payload: {
          create,
        },
        user: {
          email: 'publisher@example.com',
          id: 'publisher-1',
          role: 'siteManager',
        },
      },
    } as never)

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'operational-audit-events',
        data: expect.objectContaining({
          action: 'update',
          actorEmail: 'publisher@example.com',
          actorId: 'publisher-1',
          actorRole: 'siteManager',
          entityId: '44',
          entityTitle: 'About',
          entityType: 'page',
          feature: 'pages',
          summary: 'Publication moved from draft to published.',
        }),
        overrideAccess: true,
      }),
    )
  })

  it('stores global updates with stable titles through the global hook factory', async () => {
    const create = vi.fn(async () => ({}))
    const hook = createGlobalAuditHook({
      entityType: 'system_mode_settings',
      feature: 'maintenanceModes',
      getSummary: ({ doc, previousDoc }) =>
        `Site mode changed from ${previousDoc?.siteMode ?? 'off'} to ${doc.siteMode}.`,
      title: 'System Modes',
    })

    await hook({
      doc: {
        siteMode: 'maintenance',
      },
      previousDoc: {
        siteMode: 'off',
      },
      req: {
        payload: {
          create,
        },
        user: {
          email: 'ops@example.com',
          id: 'ops-1',
          role: 'siteManager',
        },
      },
    } as never)

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'operational-audit-events',
        data: expect.objectContaining({
          action: 'update',
          actorEmail: 'ops@example.com',
          actorId: 'ops-1',
          actorRole: 'siteManager',
          entityId: 'system_mode_settings',
          entityTitle: 'System Modes',
          entityType: 'system_mode_settings',
          feature: 'maintenanceModes',
          summary: 'Site mode changed from off to maintenance.',
        }),
        overrideAccess: true,
      }),
    )
  })

  it('records operator-driven work queue updates while ignoring sync-context writes', async () => {
    const create = vi.fn(async () => ({}))
    const hook = WorkQueue.hooks?.afterChange?.[0]

    if (!hook) {
      throw new Error('Expected Work Queue afterChange hook to exist.')
    }

    await hook({
      doc: {
        feature: 'pages',
        id: 9,
        assignee: 21,
        priority: 'high',
        status: 'in_progress',
      },
      operation: 'update',
      previousDoc: {
        assignee: null,
        priority: 'normal',
        status: 'open',
      },
      req: {
        context: {},
        payload: {
          create,
        },
        user: {
          email: 'ops@example.com',
          role: 'siteManager',
        },
      },
    } as never)

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'operational-audit-events',
        data: expect.objectContaining({
          action: 'work_queue_updated',
          entityId: '9',
          entityType: 'work_queue',
          feature: 'pages',
        }),
        overrideAccess: true,
      }),
    )

    create.mockClear()

    await hook({
      doc: {
        id: 9,
        status: 'resolved',
      },
      operation: 'update',
      previousDoc: {
        status: 'open',
      },
      req: {
        context: {
          workQueueSync: true,
        },
        payload: {
          create,
        },
      },
    } as never)

    expect(create).not.toHaveBeenCalled()
  })

  it('keeps audit events for unmapped legacy queue records Admin-only', async () => {
    const create = vi.fn(async () => ({}))

    await recordWorkQueueAuditEvent({
      action: 'work_queue_updated',
      feature: null,
      req: {
        payload: { create },
        user: { email: 'admin@example.com', role: 'admin' },
      } as never,
      summary: 'Legacy queue item updated.',
      workQueueID: 'legacy-1',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ feature: expect.anything() }),
      }),
    )
  })
})
