import { describe, expect, it } from 'vitest'

import { ADMIN_FEATURE_KEYS } from '@/access/adminFeatures'
import {
  LEGACY_FEATURE_CAPABILITY_RULES,
  planLegacyEditorialMigration,
  planLegacyQueueMigration,
  planLegacyUserMigration,
  restoreLegacyEditorialRecord,
  restoreLegacyQueueRecord,
  restoreLegacyUser,
} from '@/migrations/20260902_000000_two_role_feature_permissions'

type JsonRecord = Record<string, unknown>
type MongoUpdate = {
  $set?: JsonRecord
  $unset?: Record<string, string>
}

const applyUpdate = (record: JsonRecord, update: MongoUpdate | null): JsonRecord => {
  const next = structuredClone(record)
  if (!update) return next
  for (const [key, value] of Object.entries(update.$set ?? {})) next[key] = value
  for (const key of Object.keys(update.$unset ?? {})) delete next[key]
  return next
}

const enabledFeatures = (record: JsonRecord) =>
  Object.entries(record.features as JsonRecord)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => key)

describe('two-role feature-permissions migration', () => {
  it('defines an explicit compatibility rule for all 33 features', () => {
    expect(Object.keys(LEGACY_FEATURE_CAPABILITY_RULES)).toEqual([...ADMIN_FEATURE_KEYS])
  })

  it.each([
    'siteManager',
    'contentManager',
    'contentEditor',
    'editor',
    'marketingOps',
    'publisher',
  ])('maps the legacy %s role to Site Manager', (role) => {
    const plan = planLegacyUserMigration({ capabilities: {}, role })
    const migrated = applyUpdate({ capabilities: {}, role }, plan.update)

    expect(migrated.role).toBe('siteManager')
    expect(enabledFeatures(migrated)).toEqual([])
  })

  it('keeps Admin implicit and ignores its stored capability values', () => {
    const source = { capabilities: { manage_pages: true, publish_pages: true }, role: 'admin' }
    const migrated = applyUpdate(source, planLegacyUserMigration(source).update)

    expect(migrated.role).toBe('admin')
    expect(enabledFeatures(migrated)).toEqual([])
    expect(migrated).not.toHaveProperty('capabilities')
  })

  it('grants paired content features only when manage and publish agree', () => {
    const agreeing = {
      capabilities: {
        manage_articles: true,
        manage_pages: true,
        publish_articles: true,
        publish_pages: false,
      },
      role: 'contentManager',
    }
    const plan = planLegacyUserMigration(agreeing)
    const migrated = applyUpdate(agreeing, plan.update)

    expect((migrated.features as JsonRecord).articles).toBe(true)
    expect((migrated.features as JsonRecord).pages).toBe(false)
    expect(plan.conflicts).toEqual(['pages'])
  })

  it('fails unknown and malformed roles closed with no grants', () => {
    const source = {
      capabilities: { manage_pages: true, publish_pages: true },
      role: 'unexpectedSuperuser',
    }
    const plan = planLegacyUserMigration(source)
    const migrated = applyUpdate(source, plan.update)

    expect(plan.unknownRole).toBe(true)
    expect(migrated.role).toBe('siteManager')
    expect(enabledFeatures(migrated)).toEqual([])
  })

  it('invalidates sessions and restores the exact legacy authorization data on down', () => {
    const source = {
      capabilities: { manage_media: true },
      role: 'editor',
      sessions: [{ id: 'old-session' }],
    }
    const migrated = applyUpdate(source, planLegacyUserMigration(source).update)
    const restored = applyUpdate(migrated, restoreLegacyUser(migrated))

    expect(migrated.sessions).toEqual([])
    expect(restored.role).toBe('editor')
    expect(restored.capabilities).toEqual({ manage_media: true })
    expect(restored).not.toHaveProperty('features')
    expect(restored).not.toHaveProperty('_twoRoleFeatureMigration')
  })

  it.each([
    ['published', 'published', 'published', false],
    ['published', 'draft', 'draft', true],
    ['published', undefined, 'draft', true],
    ['draft', 'published', 'draft', false],
  ] as const)(
    'maps _status=%s and workflow=%s to %s without accidental publication',
    (status, workflowState, expectedStatus, becameDraft) => {
      const source: JsonRecord = { _status: status, title: 'Example' }
      if (workflowState) source.workflowState = workflowState
      else source.changeSummary = 'Legacy record with no workflow state'

      const plan = planLegacyEditorialMigration(source, false)
      const migrated = applyUpdate(source, plan.update)

      expect(migrated._status).toBe(expectedStatus)
      expect(plan.becameDraft).toBe(becameDraft)
      expect(migrated).not.toHaveProperty('workflowState')
      expect(migrated).not.toHaveProperty('changeSummary')
    },
  )

  it('maps submitted Reviews to approved or pending while leaving staff Reviews unmoderated', () => {
    const approvedSource = {
      _status: 'published',
      sourceSubmission: 'submission-1',
      workflowState: 'published',
    }
    const pendingSource = {
      _status: 'draft',
      sourceSubmission: 'submission-2',
      workflowState: 'in_review',
    }
    const staffSource = { _status: 'published', workflowState: 'published' }

    const approved = applyUpdate(
      approvedSource,
      planLegacyEditorialMigration(approvedSource, true).update,
    )
    const pending = applyUpdate(
      pendingSource,
      planLegacyEditorialMigration(pendingSource, true).update,
    )
    const staff = applyUpdate(staffSource, planLegacyEditorialMigration(staffSource, true).update)

    expect(approved.moderationStatus).toBe('approved')
    expect(pending.moderationStatus).toBe('pending')
    expect(pending._status).toBe('draft')
    expect(staff).not.toHaveProperty('moderationStatus')
  })

  it('conservatively initializes submitted Reviews that lack legacy workflow fields', () => {
    const plan = planLegacyEditorialMigration(
      {
        _status: 'published',
        sourceSubmission: 'submission-22',
      },
      true,
    )

    expect(plan.moderation).toBe('pending')
    expect(plan.becameDraft).toBe(true)
    expect(plan.update?.$set?._status).toBe('draft')
    expect(plan.update?.$set?.moderationStatus).toBe('pending')
  })

  it('restores editorial and moderation fields exactly and is idempotent in both directions', () => {
    const source = {
      _status: 'published',
      moderatedAt: '2026-01-01T00:00:00.000Z',
      moderationStatus: 'rejected',
      sourceSubmission: 'submission-1',
      workflowState: 'draft',
    }
    const migrated = applyUpdate(source, planLegacyEditorialMigration(source, true).update)

    expect(planLegacyEditorialMigration(migrated, true).update).toBeNull()

    const restored = applyUpdate(migrated, restoreLegacyEditorialRecord(migrated, true))
    expect(restored).toMatchObject(source)
    expect(restored).not.toHaveProperty('_twoRoleFeatureMigration')
    expect(restoreLegacyEditorialRecord(restored, true)).toBeNull()
  })

  it('assigns queue ownership and resolves retired generic workflow items reversibly', () => {
    const source = {
      autoResolved: false,
      reasonCode: 'article-review-required',
      sourceCollection: 'articles',
      status: 'open',
    }
    const plan = planLegacyQueueMigration(source)
    const migrated = applyUpdate(source, plan.update)

    expect(plan.retiredWorkflowItem).toBe(true)
    expect(migrated).toMatchObject({
      autoResolved: true,
      feature: 'articles',
      status: 'resolved',
    })
    expect(planLegacyQueueMigration(migrated).update).toBeNull()

    const restored = applyUpdate(migrated, restoreLegacyQueueRecord(migrated))
    expect(restored).toMatchObject(source)
    expect(restored).not.toHaveProperty('feature')
    expect(restored).not.toHaveProperty('_twoRoleFeatureMigration')
  })

  it('leaves unmapped queue items unchanged and therefore Admin-only', () => {
    expect(
      planLegacyQueueMigration({
        reasonCode: 'external-system-item',
        sourceCollection: 'unknown-source',
      }).update,
    ).toBeNull()
  })

  it('skips records created entirely under the new schema', () => {
    expect(
      planLegacyUserMigration({ features: { pages: true }, role: 'siteManager' }).update,
    ).toBeNull()
    expect(
      planLegacyEditorialMigration({ _status: 'published', publishedAt: 'now' }, false).update,
    ).toBeNull()
    expect(
      planLegacyQueueMigration({
        feature: 'pages',
        reasonCode: 'draft-change-pending-publication',
        sourceCollection: 'pages',
      }).update,
    ).toBeNull()
  })
})
