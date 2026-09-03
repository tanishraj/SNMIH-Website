import { describe, expect, it, vi } from 'vitest'

import { Articles } from '@/collections/Articles'
import { NewsEvents } from '@/collections/NewsEvents'
import { Pages } from '@/collections/Pages'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'
import {
  enforcePublicationPolicy,
  PERMISSIONS_MIGRATION_CONTEXT,
} from '@/hooks/enforcePublicationPolicy'

const createReq = (user: unknown, blockers: unknown[] = []) => ({
  payload: {
    find: vi.fn(async () => ({ docs: blockers })),
  },
  user,
})

const runPolicy = async ({
  blockers = [],
  context,
  data,
  originalDoc = { _status: 'draft', id: 11 },
  user,
}: {
  blockers?: unknown[]
  context?: Record<string, unknown>
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  user: unknown
}) =>
  enforcePublicationPolicy(
    'pages',
    'pages',
  )({
    context,
    data,
    originalDoc,
    operation: 'update',
    req: createReq(user, blockers),
  } as never)

describe('feature-owned publication policy', () => {
  it('lets an Admin publish and stamps publication metadata', async () => {
    const result = await runPolicy({
      data: { _status: 'published' },
      user: { id: 7, role: 'admin' },
    })

    expect(result).toMatchObject({ _status: 'published', publishedBy: 7 })
    expect(result.publishedAt).toEqual(expect.any(String))
  })

  it('lets a Site Manager publish only with the owning feature', async () => {
    await expect(
      runPolicy({
        data: { _status: 'published' },
        user: { features: { pages: true }, id: 'manager-1', role: 'siteManager' },
      }),
    ).resolves.toMatchObject({ _status: 'published', publishedBy: 'manager-1' })

    await expect(
      runPolicy({
        data: { _status: 'published' },
        user: { features: { articles: true }, id: 'manager-2', role: 'siteManager' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('blocks publication while an unresolved publish issue exists', async () => {
    await expect(
      runPolicy({
        blockers: [{ summary: 'Fix missing metadata' }],
        data: { _status: 'published' },
        user: { features: { pages: true }, id: 'manager-1', role: 'siteManager' },
      }),
    ).rejects.toThrow('Fix missing metadata')
  })

  it('does not require a publish check for drafts or already-published updates', async () => {
    await expect(runPolicy({ data: { _status: 'draft' }, user: null })).resolves.toEqual({
      _status: 'draft',
    })
    await expect(
      runPolicy({
        data: { title: 'Updated title' },
        originalDoc: { _status: 'published', id: 11 },
        user: { features: { pages: true }, role: 'siteManager' },
      }),
    ).resolves.toEqual({ title: 'Updated title' })
  })

  it('accepts only the named migration bypass for trusted data conversion', async () => {
    await expect(
      runPolicy({
        context: { permissionsMigration: PERMISSIONS_MIGRATION_CONTEXT },
        data: { _status: 'published' },
        user: null,
      }),
    ).resolves.toMatchObject({ _status: 'published' })

    await expect(
      runPolicy({
        context: { permissionsMigration: 'lookalike' },
        data: { _status: 'published' },
        user: null,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('removes the generic workflow fields from every governed collection', () => {
    for (const collection of [Pages, Articles, NewsEvents, Reviews, SystemPages]) {
      const fields = JSON.stringify(collection.fields)
      for (const retired of [
        'workflowState',
        'scheduledPublishAt',
        'changeSummary',
        'lastReviewedAt',
        'lastReviewedBy',
      ]) {
        expect(fields).not.toContain(`\"name\":\"${retired}\"`)
      }
      expect(fields).toContain('"name":"publishedAt"')
      expect(fields).toContain('"name":"publishedBy"')
    }
  })
})
