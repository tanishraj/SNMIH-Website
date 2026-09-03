import { describe, expect, it, vi } from 'vitest'

import { WorkQueue } from '@/collections/WorkQueue'
import { syncFormSubmissionToWorkQueue } from '@/hooks/syncFormSubmissionToWorkQueue'
import { syncMediaToWorkQueue } from '@/hooks/syncMediaToWorkQueue'
import { syncReviewToWorkQueue } from '@/hooks/syncReviewToWorkQueue'
import { createDraftPublishQueueHook } from '@/hooks/syncDraftPublishToWorkQueue'
import {
  buildWorkQueueDedupeKey,
  findBlockingPublishQueueItems,
  formatBlockingPublishQueueMessage,
  resolveWorkQueueItem,
  upsertWorkQueueItem,
} from '@/lib/workQueue'

type TestReq = {
  context?: Record<string, unknown>
  payload: {
    create: ReturnType<typeof vi.fn>
    find: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  user?: { features?: Record<string, boolean>; role?: string }
}

const createReq = ({
  docs = [],
  context,
  user,
}: {
  context?: Record<string, unknown>
  docs?: Array<Record<string, unknown>>
  user?: { features?: Record<string, boolean>; role?: string }
} = {}) => {
  const create = vi.fn(async () => ({}))
  const find = vi.fn(async () => ({
    docs,
  }))
  const update = vi.fn(async () => ({}))

  return {
    context,
    payload: {
      create,
      find,
      update,
    },
    user,
  } as TestReq
}

describe('work queue collection', () => {
  it('registers under Administration with system-managed create and delete', () => {
    expect(WorkQueue.slug).toBe('work-queue')
    expect(WorkQueue.admin?.group).toBe('Administration')
    expect(WorkQueue.access?.create?.({ req: {} } as never)).toBe(false)
    expect(WorkQueue.access?.delete?.({ req: {} } as never)).toBe(false)
  })

  it('uses operator-facing list defaults and the expected editable fields', () => {
    expect(WorkQueue.admin?.defaultColumns).toEqual([
      'summary',
      'sourceCollection',
      'sourceTitle',
      'queueType',
      'status',
      'assignee',
      'priority',
      'dueDate',
      'lastSyncedAt',
    ])

    const tabsField = WorkQueue.fields[0]
    if (!tabsField || !('tabs' in tabsField)) {
      throw new Error('Expected tabbed work queue field layout.')
    }

    const tabNames = tabsField.tabs.map((tab) => tab.label)
    expect(tabNames).toEqual(['Details', 'Source', 'System'])
  })

  it('keeps operator resolution metadata synchronized with terminal status changes', async () => {
    const beforeChange = WorkQueue.hooks?.beforeChange?.[0]
    if (!beforeChange) throw new Error('Expected Work Queue beforeChange hook.')

    const resolved = await beforeChange({
      data: { status: 'resolved' },
      operation: 'update',
      originalDoc: { status: 'open' },
      req: { context: {} },
    } as never)
    expect(resolved).toMatchObject({ autoResolved: false, status: 'resolved' })
    expect(resolved?.resolvedAt).toEqual(expect.any(String))

    const reopened = await beforeChange({
      data: { status: 'open' },
      operation: 'update',
      originalDoc: { resolvedAt: '2026-09-01T00:00:00.000Z', status: 'resolved' },
      req: { context: {} },
    } as never)
    expect(reopened).toMatchObject({ autoResolved: false, resolvedAt: null, status: 'open' })
  })

  it('scopes queue access to both Action Queue and the source feature', async () => {
    const access = WorkQueue.access?.read
    if (!access) throw new Error('Expected Work Queue read access.')

    expect(await access({ req: { user: { role: 'admin' } } } as never)).toBe(true)
    expect(
      await access({
        req: { user: { features: { actionQueue: true }, role: 'siteManager' } },
      } as never),
    ).toBe(false)
    expect(
      await access({
        req: {
          user: { features: { actionQueue: true, pages: true }, role: 'siteManager' },
        },
      } as never),
    ).toEqual({ feature: { in: ['pages'] } })
  })

  it('builds stable dedupe keys per source condition', () => {
    expect(
      buildWorkQueueDedupeKey({
        sourceCollection: 'pages',
        sourceID: 12,
        queueType: 'approval',
        reasonCode: 'publish-checklist-required',
      }),
    ).toBe('pages:12:approval:publish-checklist-required')
  })

  it('finds blocking publish queue items by source identity, status, and queue type', async () => {
    const docs = [
      {
        id: 17,
        queueType: 'approval',
        sourceCollection: 'pages',
        sourceID: '12',
        status: 'open',
        summary: 'Homepage is awaiting editorial approval.',
      },
    ]
    const req = createReq({ docs })

    await expect(
      findBlockingPublishQueueItems({
        req: req as never,
        sourceCollection: 'pages',
        sourceID: 12,
      }),
    ).resolves.toEqual(docs)

    expect(req.payload.find).toHaveBeenCalledWith({
      collection: 'work-queue',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      req: req as never,
      sort: 'summary',
      where: {
        and: [
          {
            sourceCollection: {
              equals: 'pages',
            },
          },
          {
            sourceID: {
              equals: '12',
            },
          },
          {
            status: {
              in: ['open', 'blocked'],
            },
          },
          {
            queueType: {
              in: ['approval', 'publish_issue'],
            },
          },
        ],
      },
    })
  })

  it('formats one blocking queue summary into a publish-safe error message', () => {
    expect(
      formatBlockingPublishQueueMessage([
        {
          summary: 'Homepage is awaiting editorial approval.',
        },
      ]),
    ).toBe(
      'Cannot publish because Work Queue still has a blocking item: "Homepage is awaiting editorial approval.". Resolve it in Work Queue before publishing.',
    )
  })

  it('formats multiple blocking queue summaries with an additional blocker count', () => {
    expect(
      formatBlockingPublishQueueMessage([
        {
          summary: 'Homepage is awaiting editorial approval.',
        },
        {
          summary: 'Publish checklist is incomplete.',
        },
      ]),
    ).toBe(
      'Cannot publish because Work Queue still has blocking items: "Homepage is awaiting editorial approval." and 1 more. Resolve them in Work Queue before publishing.',
    )
  })

  it('creates a new queue item when no matching dedupe key exists', async () => {
    const req = createReq()

    await upsertWorkQueueItem({
      dedupeKey: 'pages:12:approval:publish-checklist-required',
      queueType: 'approval',
      reasonCode: 'publish-checklist-required',
      req: req as never,
      sourceCollection: 'pages',
      sourceID: 12,
      sourceTitle: 'About',
      summary: 'About requires a publication checklist.',
    })

    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'work-queue',
        data: expect.objectContaining({
          dedupeKey: 'pages:12:approval:publish-checklist-required',
          feature: 'pages',
          queueType: 'approval',
          reasonCode: 'publish-checklist-required',
          sourceCollection: 'pages',
          sourceID: '12',
          sourceTitle: 'About',
          status: 'open',
          summary: 'About requires a publication checklist.',
        }),
        overrideAccess: true,
      }),
    )
  })

  it('updates an existing queue item in place and reopens resolved entries', async () => {
    const req = createReq({
      docs: [
        {
          id: 99,
          status: 'resolved',
        },
      ],
    })

    await upsertWorkQueueItem({
      dedupeKey: 'pages:12:approval:publish-checklist-required',
      queueType: 'approval',
      reasonCode: 'publish-checklist-required',
      req: req as never,
      sourceCollection: 'pages',
      sourceID: 12,
      sourceTitle: 'About',
      summary: 'About requires a publication checklist.',
    })

    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'work-queue',
        id: 99,
        data: expect.objectContaining({
          autoResolved: false,
          resolvedAt: null,
          sourceTitle: 'About',
          status: 'open',
          summary: 'About requires a publication checklist.',
        }),
        overrideAccess: true,
      }),
    )
  })

  it('resolves a matching queue item without deleting it', async () => {
    const req = createReq({
      docs: [
        {
          id: 44,
          status: 'open',
        },
      ],
    })

    await resolveWorkQueueItem({
      dedupeKey: 'pages:12:approval:publish-checklist-required',
      req: req as never,
      resolutionSummary: 'The page was published.',
    })

    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'work-queue',
        id: 44,
        data: expect.objectContaining({
          autoResolved: true,
          resolutionSummary: 'The page was published.',
          status: 'resolved',
        }),
        overrideAccess: true,
      }),
    )
  })

  it('creates a publish queue item for draft-only collections', async () => {
    const req = createReq()
    const hook = createDraftPublishQueueHook({
      sourceAdminPathPrefix: '/admin/collections/headers',
      sourceCollection: 'headers',
      summary: (_doc, title) => `${title} has unpublished draft changes.`,
      titleField: 'title',
    })

    await hook({
      doc: {
        _status: 'draft',
        id: 8,
        title: 'Primary Header',
      },
      req: req as never,
    } as never)

    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          queueType: 'publish_issue',
          reasonCode: 'draft-change-pending-publication',
          sourceCollection: 'headers',
          sourceID: '8',
        }),
      }),
    )
  })

  it('creates a follow-up queue item for new form submissions', async () => {
    const req = createReq()

    await syncFormSubmissionToWorkQueue({
      doc: {
        id: 22,
        status: 'new',
        submissionIntent: 'lead',
        submitterEmail: 'lead@example.com',
      },
      req: req as never,
    } as never)

    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          queueType: 'follow_up',
          priority: 'high',
          reasonCode: 'submission-new',
          sourceCollection: 'form-submissions',
        }),
      }),
    )
  })

  it('creates a moderation queue item for a pending submitted Review', async () => {
    const req = createReq()

    await syncReviewToWorkQueue({
      doc: {
        id: 31,
        moderationStatus: 'pending',
        sourceSubmission: 'submission-9',
        title: 'Review Title',
      },
      req: req as never,
    } as never)

    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          queueType: 'moderation',
          reasonCode: 'review-moderation-required',
          sourceCollection: 'reviews',
        }),
      }),
    )
  })

  it('creates a media issue queue item for critical assets without replacement guidance', async () => {
    const req = createReq()

    await syncMediaToWorkQueue({
      doc: {
        id: 51,
        isCriticalAsset: true,
        replacementNotes: '',
        title: 'Homepage Logo',
      },
      req: req as never,
    } as never)

    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          queueType: 'media_issue',
          reasonCode: 'critical-media-replacement-guidance-missing',
          sourceCollection: 'media',
        }),
      }),
    )
  })
})
