import { describe, expect, it } from 'vitest'

import { Reviews } from '@/collections/Reviews'
import { enforceReviewModeration } from '@/hooks/enforceReviewModeration'

const manager = {
  features: { reviews: true },
  id: 'manager-1',
  role: 'siteManager',
}

const runModeration = ({
  data,
  originalDoc = {
    _status: 'draft',
    id: 9,
    moderationStatus: 'pending',
    sourceSubmission: 'submission-1',
  },
  user = manager,
}: {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  user?: unknown
}) =>
  enforceReviewModeration({
    data,
    operation: 'update',
    originalDoc,
    req: { user },
  } as never)

describe('public Review moderation', () => {
  it('rejects untrusted writes to automated moderation and publication metadata fields', () => {
    const serialized = JSON.stringify(Reviews.fields)

    for (const fieldName of ['moderatedAt', 'moderatedBy', 'publishedAt', 'publishedBy']) {
      expect(serialized).toContain(`\"name\":\"${fieldName}\"`)
      const field = Reviews.fields
        .flatMap((field) => ('fields' in field && Array.isArray(field.fields) ? field.fields : []))
        .find((field) => 'name' in field && field.name === fieldName)

      if (field && 'access' in field) {
        expect(field.access?.create?.({} as never)).toBe(false)
        expect(field.access?.update?.({} as never)).toBe(false)
      }
    }
  })

  it('rejects approval by a Site Manager without Reviews access', async () => {
    await expect(
      runModeration({
        data: { moderationStatus: 'approved' },
        user: { features: { pages: true }, id: 'manager-2', role: 'siteManager' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects direct publication while a submitted Review is pending', async () => {
    await expect(runModeration({ data: { _status: 'published' } })).rejects.toThrow(
      'must be approved before publication',
    )
  })

  it('publishes and attributes an authorized approval in one operation', async () => {
    const result = await runModeration({ data: { moderationStatus: 'approved' } })

    expect(result).toMatchObject({
      _status: 'published',
      moderatedBy: 'manager-1',
      moderationStatus: 'approved',
      publishedBy: 'manager-1',
    })
    expect(result.moderatedAt).toEqual(expect.any(String))
    expect(result.publishedAt).toEqual(expect.any(String))
  })

  it('keeps rejected submissions as attributed drafts', async () => {
    const result = await runModeration({
      data: { internalModerationNotes: 'Unable to verify', moderationStatus: 'rejected' },
    })

    expect(result).toMatchObject({
      _status: 'draft',
      moderatedBy: 'manager-1',
      moderationStatus: 'rejected',
    })
    expect(result.moderatedAt).toEqual(expect.any(String))
  })

  it('preserves an approved decision when the Review is explicitly unpublished', async () => {
    await expect(
      runModeration({
        data: { _status: 'draft' },
        originalDoc: {
          _status: 'published',
          moderatedAt: '2026-09-01T00:00:00.000Z',
          moderatedBy: 'admin-1',
          moderationStatus: 'approved',
          sourceSubmission: 'submission-1',
        },
      }),
    ).resolves.toEqual({ _status: 'draft' })
  })

  it('prevents changing or clearing the immutable source submission', async () => {
    await expect(runModeration({ data: { sourceSubmission: 'submission-2' } })).rejects.toThrow(
      'source submission cannot be changed',
    )
    await expect(runModeration({ data: { sourceSubmission: null } })).rejects.toThrow(
      'source submission cannot be changed',
    )
  })
})
