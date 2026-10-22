import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

import {
  ADMIN_FEATURE_KEYS,
  getFeatureForResource,
  type AdminFeatureGrants,
  type AdminFeatureKey,
} from '@/access/adminFeatures'

type JsonRecord = Record<string, unknown>
type MigrationArgs = Pick<MigrateUpArgs, 'payload' | 'session'>
type MongoUpdate = {
  $set?: JsonRecord
  $unset?: Record<string, ''>
}

type MigrationModel = {
  bulkWrite: (
    operations: Array<{
      updateOne: {
        filter: { _id: unknown }
        update: MongoUpdate
      }
    }>,
    options: { session: never },
  ) => Promise<unknown>
  find: (query: JsonRecord) => {
    lean: () => {
      exec: () => Promise<JsonRecord[]>
      session: (session: never) => { exec: () => Promise<JsonRecord[]> }
    }
  }
}

type CapabilityRule = {
  capabilities: readonly string[]
  mode?: 'all' | 'any'
}

type RecordRollback = {
  present: string[]
  values: JsonRecord
  version: 1
}

export type UserMigrationPlan = {
  conflicts: AdminFeatureKey[]
  update: MongoUpdate | null
  unknownRole: boolean
}

export type EditorialMigrationPlan = {
  becameDraft: boolean
  moderation: 'approved' | 'pending' | null
  update: MongoUpdate | null
}

export type QueueMigrationPlan = {
  retiredWorkflowItem: boolean
  update: MongoUpdate | null
}

export type TwoRoleFeatureMigrationReport = {
  editorial: {
    becameDraft: string[]
    changed: number
    moderationApproved: string[]
    moderationPending: string[]
  }
  queue: {
    changed: number
    retiredWorkflowItems: string[]
    unmapped: string[]
  }
  users: {
    changed: number
    conflicts: Array<{ features: AdminFeatureKey[]; id: string }>
    proposed: Array<{
      features: AdminFeatureKey[]
      fromRole: string
      id: string
      toRole: 'admin' | 'siteManager'
    }>
    unknownRoles: string[]
  }
}

const MIGRATION_FIELD = '_twoRoleFeatureMigration'
const LEGACY_WORKFLOW_FIELDS = [
  'workflowState',
  'scheduledPublishAt',
  'changeSummary',
  'lastReviewedAt',
  'lastReviewedBy',
] as const
const REVIEW_MODERATION_FIELDS = ['moderationStatus', 'moderatedAt', 'moderatedBy'] as const
const LEGACY_QUEUE_REASON_CODES = new Set([
  'page-review-required',
  'page-scheduled-publication',
  'article-review-required',
  'article-scheduled-publication',
  'news-event-review-required',
  'news-event-scheduled-publication',
  'system-page-review-required',
  'system-page-scheduled-publication',
])
const KNOWN_NON_ADMIN_ROLES = new Set([
  'siteManager',
  'contentManager',
  'contentEditor',
  'editor',
  'marketingOps',
  'publisher',
])

export const LEGACY_FEATURE_CAPABILITY_RULES: Record<AdminFeatureKey, CapabilityRule> = {
  pages: { capabilities: ['manage_pages', 'publish_pages'] },
  articles: { capabilities: ['manage_articles', 'publish_articles'] },
  reviews: { capabilities: ['manage_reviews', 'publish_reviews'] },
  reusableSections: { capabilities: ['manage_pages'] },
  // Added after this migration ran; kept typed so the record covers every current feature.
  celebrations: { capabilities: ['manage_page_settings'] },
  newsEvents: { capabilities: ['manage_news_events', 'publish_news_events'] },
  newsEventClassifications: { capabilities: ['manage_news_events'] },
  newsEventsDetailTemplate: {
    capabilities: ['manage_news_events', 'manage_page_settings'],
    mode: 'any',
  },
  topics: { capabilities: ['manage_taxonomy'] },
  tags: { capabilities: ['manage_taxonomy'] },
  navigationLinks: { capabilities: ['manage_navigation'] },
  redirects: { capabilities: ['manage_redirects'] },
  headers: { capabilities: ['manage_headers'] },
  footers: { capabilities: ['manage_footers'] },
  officeLocations: { capabilities: ['manage_site_settings'] },
  systemPages: { capabilities: ['manage_system_pages', 'publish_system_pages'] },
  media: { capabilities: ['manage_media'] },
  galleryAlbums: { capabilities: ['manage_media'] },
  forms: { capabilities: ['manage_forms'] },
  formSubmissions: { capabilities: ['manage_form_submissions'] },
  actionQueue: { capabilities: ['manage_work_queue'] },
  auditLog: { capabilities: ['view_operational_audit'] },
  siteIdentity: { capabilities: ['manage_site_settings'] },
  appearance: { capabilities: ['manage_theme_settings'] },
  seoMetadata: { capabilities: ['manage_seo_settings'] },
  analyticsTracking: { capabilities: ['manage_site_settings'] },
  cookieConsent: { capabilities: ['manage_site_settings'] },
  layoutDefaults: { capabilities: ['manage_page_settings'] },
  searchSettings: { capabilities: ['manage_site_settings'] },
  maintenanceModes: { capabilities: ['manage_system_modes'] },
}

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const hasOwn = (value: JsonRecord, key: string) => Object.prototype.hasOwnProperty.call(value, key)

const createRollback = (record: JsonRecord, fields: readonly string[]): RecordRollback => {
  const present = fields.filter((field) => hasOwn(record, field))
  return {
    present,
    values: Object.fromEntries(present.map((field) => [field, record[field]])),
    version: 1,
  }
}

const restoreRollback = (
  rollback: RecordRollback,
  managedFields: readonly string[],
): MongoUpdate => {
  const present = new Set(rollback.present)
  const $set = Object.fromEntries(rollback.present.map((field) => [field, rollback.values[field]]))
  const $unset = Object.fromEntries(
    [...managedFields, MIGRATION_FIELD]
      .filter((field) => !present.has(field))
      .map((field) => [field, '' as const]),
  )

  if (present.has(MIGRATION_FIELD)) delete $set[MIGRATION_FIELD]
  $unset[MIGRATION_FIELD] = ''

  return {
    ...(Object.keys($set).length > 0 ? { $set } : {}),
    $unset,
  }
}

const emptyFeatures = (): AdminFeatureGrants =>
  Object.fromEntries(ADMIN_FEATURE_KEYS.map((key) => [key, false])) as AdminFeatureGrants

export const planLegacyUserMigration = (record: JsonRecord): UserMigrationPlan => {
  if (isRecord(record[MIGRATION_FIELD])) {
    return { conflicts: [], unknownRole: false, update: null }
  }

  const role = typeof record.role === 'string' ? record.role : ''
  const capabilities = isRecord(record.capabilities) ? record.capabilities : {}
  const isKnownRole = role === 'admin' || KNOWN_NON_ADMIN_ROLES.has(role)
  const isLegacyRecord = hasOwn(record, 'capabilities') || !isKnownRole

  if (!isLegacyRecord) return { conflicts: [], unknownRole: false, update: null }

  const features = emptyFeatures()
  const conflicts: AdminFeatureKey[] = []

  if (role !== 'admin' && KNOWN_NON_ADMIN_ROLES.has(role)) {
    for (const key of ADMIN_FEATURE_KEYS) {
      const rule = LEGACY_FEATURE_CAPABILITY_RULES[key]
      const values = rule.capabilities.map((capability) => capabilities[capability] === true)
      const granted = rule.mode === 'any' ? values.some(Boolean) : values.every(Boolean)
      features[key] = granted

      if (
        rule.mode !== 'any' &&
        values.length > 1 &&
        values.some(Boolean) &&
        !values.every(Boolean)
      ) {
        conflicts.push(key)
        features[key] = false
      }
    }
  }

  const rollback = createRollback(record, ['role', 'capabilities', 'features'])
  return {
    conflicts,
    unknownRole: !isKnownRole,
    update: {
      $set: {
        [MIGRATION_FIELD]: rollback,
        features,
        role: role === 'admin' ? 'admin' : 'siteManager',
        sessions: [],
      },
      $unset: { capabilities: '' },
    },
  }
}

export const restoreLegacyUser = (record: JsonRecord): MongoUpdate | null => {
  const rollback = record[MIGRATION_FIELD]
  if (!isRecord(rollback) || rollback.version !== 1) return null
  return restoreRollback(rollback as RecordRollback, ['role', 'capabilities', 'features'])
}

const relationshipExists = (value: unknown) =>
  (typeof value === 'string' && value.length > 0) ||
  typeof value === 'number' ||
  (isRecord(value) && value.id != null)

export const planLegacyEditorialMigration = (
  record: JsonRecord,
  isReview: boolean,
): EditorialMigrationPlan => {
  if (isRecord(record[MIGRATION_FIELD])) {
    return { becameDraft: false, moderation: null, update: null }
  }

  const hasLegacyWorkflow = LEGACY_WORKFLOW_FIELDS.some((field) => hasOwn(record, field))
  const needsSubmittedReviewModeration =
    isReview && relationshipExists(record.sourceSubmission) && !hasOwn(record, 'moderationStatus')
  if (!hasLegacyWorkflow && !needsSubmittedReviewModeration) {
    return { becameDraft: false, moderation: null, update: null }
  }

  const wasPublished = record._status === 'published'
  const remainsPublished = wasPublished && record.workflowState === 'published'
  const isSubmittedReview = isReview && relationshipExists(record.sourceSubmission)
  const managedFields = [
    '_status',
    ...LEGACY_WORKFLOW_FIELDS,
    ...(isReview ? REVIEW_MODERATION_FIELDS : []),
  ]
  const rollback = createRollback(record, managedFields)
  const $set: JsonRecord = {
    [MIGRATION_FIELD]: rollback,
    _status: remainsPublished ? 'published' : 'draft',
  }
  const $unset = Object.fromEntries(LEGACY_WORKFLOW_FIELDS.map((field) => [field, '' as const]))
  let moderation: EditorialMigrationPlan['moderation'] = null

  if (isSubmittedReview) {
    moderation = remainsPublished ? 'approved' : 'pending'
    $set.moderationStatus = moderation
    if (moderation === 'pending') {
      $unset.moderatedAt = ''
      $unset.moderatedBy = ''
    }
  } else if (isReview) {
    for (const field of REVIEW_MODERATION_FIELDS) $unset[field] = ''
  }

  return {
    becameDraft: wasPublished && !remainsPublished,
    moderation,
    update: { $set, $unset },
  }
}

export const restoreLegacyEditorialRecord = (
  record: JsonRecord,
  isReview: boolean,
): MongoUpdate | null => {
  const rollback = record[MIGRATION_FIELD]
  if (!isRecord(rollback) || rollback.version !== 1) return null
  return restoreRollback(rollback as RecordRollback, [
    '_status',
    ...LEGACY_WORKFLOW_FIELDS,
    ...(isReview ? REVIEW_MODERATION_FIELDS : []),
  ])
}

export const planLegacyQueueMigration = (record: JsonRecord): QueueMigrationPlan => {
  if (isRecord(record[MIGRATION_FIELD])) {
    return { retiredWorkflowItem: false, update: null }
  }

  const sourceCollection =
    typeof record.sourceCollection === 'string' ? record.sourceCollection : ''
  const sourceFeature = getFeatureForResource({ kind: 'collection', slug: sourceCollection })
  const retiredWorkflowItem =
    typeof record.reasonCode === 'string' && LEGACY_QUEUE_REASON_CODES.has(record.reasonCode)
  const needsFeature = Boolean(sourceFeature && record.feature !== sourceFeature)

  if (!needsFeature && !retiredWorkflowItem) {
    return { retiredWorkflowItem: false, update: null }
  }

  const managedFields = [
    'feature',
    'status',
    'autoResolved',
    'resolvedAt',
    'lastSyncedAt',
    'resolutionSummary',
  ]
  const $set: JsonRecord = {
    [MIGRATION_FIELD]: createRollback(record, managedFields),
  }

  if (needsFeature) $set.feature = sourceFeature
  if (retiredWorkflowItem) {
    const now = new Date().toISOString()
    $set.autoResolved = true
    $set.lastSyncedAt = now
    $set.resolutionSummary = 'Resolved because the generic editorial workflow was retired.'
    $set.resolvedAt = now
    $set.status = 'resolved'
  }

  return { retiredWorkflowItem, update: { $set } }
}

export const restoreLegacyQueueRecord = (record: JsonRecord): MongoUpdate | null => {
  const rollback = record[MIGRATION_FIELD]
  if (!isRecord(rollback) || rollback.version !== 1) return null
  return restoreRollback(rollback as RecordRollback, [
    'feature',
    'status',
    'autoResolved',
    'resolvedAt',
    'lastSyncedAt',
    'resolutionSummary',
  ])
}

type EditorialTarget = {
  isReview: boolean
  label: string
  model: MigrationModel
  recordPath: 'root' | 'version'
}

const getEditorialTargets = ({ payload }: MigrationArgs): EditorialTarget[] => {
  const slugs = ['pages', 'articles', 'news-events', 'reviews', 'system-pages'] as const
  return slugs.flatMap((slug) => [
    {
      isReview: slug === 'reviews',
      label: slug,
      model: payload.db.collections[slug] as unknown as MigrationModel,
      recordPath: 'root' as const,
    },
    {
      isReview: slug === 'reviews',
      label: `${slug} versions`,
      model: payload.db.versions[slug] as unknown as MigrationModel,
      recordPath: 'version' as const,
    },
  ])
}

const getRecord = (document: JsonRecord, path: EditorialTarget['recordPath']) => {
  if (path === 'root') return document
  return isRecord(document.version) ? document.version : {}
}

const prefixUpdate = (update: MongoUpdate, prefix: '' | 'version.'): MongoUpdate => ({
  ...(update.$set
    ? {
        $set: Object.fromEntries(
          Object.entries(update.$set).map(([key, value]) => [`${prefix}${key}`, value]),
        ),
      }
    : {}),
  ...(update.$unset
    ? {
        $unset: Object.fromEntries(
          Object.keys(update.$unset).map((key) => [`${prefix}${key}`, '' as const]),
        ),
      }
    : {}),
})

const findDocuments = async (
  model: MigrationModel,
  query: JsonRecord,
  session?: MigrateUpArgs['session'],
) => {
  const leanQuery = model.find(query).lean()
  return session ? leanQuery.session(session as never).exec() : leanQuery.exec()
}

const emptyReport = (): TwoRoleFeatureMigrationReport => ({
  editorial: {
    becameDraft: [],
    changed: 0,
    moderationApproved: [],
    moderationPending: [],
  },
  queue: {
    changed: 0,
    retiredWorkflowItems: [],
    unmapped: [],
  },
  users: {
    changed: 0,
    conflicts: [],
    proposed: [],
    unknownRoles: [],
  },
})

const prepareUp = async (args: MigrationArgs, write: boolean) => {
  const report = emptyReport()
  const usersModel = args.payload.db.collections.users as unknown as MigrationModel
  const users = await findDocuments(
    usersModel,
    {
      $or: [{ capabilities: { $exists: true } }, { role: { $nin: ['admin', 'siteManager'] } }],
    },
    args.session,
  )
  const userOperations = []

  for (const user of users) {
    const plan = planLegacyUserMigration(user)
    const update = plan.update
    if (!update) continue
    const id = String(user._id)
    report.users.changed += 1
    if (plan.conflicts.length > 0) report.users.conflicts.push({ id, features: plan.conflicts })
    if (plan.unknownRole) report.users.unknownRoles.push(id)
    report.users.proposed.push({
      features: ADMIN_FEATURE_KEYS.filter(
        (key) => (update.$set?.features as AdminFeatureGrants | undefined)?.[key] === true,
      ),
      fromRole: typeof user.role === 'string' ? user.role : '[invalid]',
      id,
      toRole: update.$set?.role === 'admin' ? 'admin' : 'siteManager',
    })
    userOperations.push({ updateOne: { filter: { _id: user._id }, update } })
  }

  if (write && userOperations.length > 0) {
    await usersModel.bulkWrite(userOperations, { session: args.session as never })
  }

  for (const target of getEditorialTargets(args)) {
    const prefix = target.recordPath === 'version' ? 'version.' : ''
    const legacyConditions: JsonRecord[] = LEGACY_WORKFLOW_FIELDS.map((field) => ({
      [`${prefix}${field}`]: { $exists: true },
    }))
    if (target.isReview) {
      legacyConditions.push({
        $and: [
          { [`${prefix}sourceSubmission`]: { $exists: true, $ne: null } },
          { [`${prefix}moderationStatus`]: { $exists: false } },
        ],
      })
    }
    const legacyQuery = {
      $or: legacyConditions,
    }
    const documents = await findDocuments(target.model, legacyQuery, args.session)
    const operations = []

    for (const document of documents) {
      const plan = planLegacyEditorialMigration(
        getRecord(document, target.recordPath),
        target.isReview,
      )
      if (!plan.update) continue
      const identity = `${target.label}:${String(document._id)}`
      report.editorial.changed += 1
      if (plan.becameDraft) report.editorial.becameDraft.push(identity)
      if (plan.moderation === 'approved') report.editorial.moderationApproved.push(identity)
      if (plan.moderation === 'pending') report.editorial.moderationPending.push(identity)
      operations.push({
        updateOne: {
          filter: { _id: document._id },
          update: prefixUpdate(plan.update, prefix),
        },
      })
    }

    if (write && operations.length > 0) {
      await target.model.bulkWrite(operations, { session: args.session as never })
    }
  }

  const queueModel = args.payload.db.collections['work-queue'] as unknown as MigrationModel
  const queueDocuments = await findDocuments(
    queueModel,
    {
      $or: [
        { feature: { $nin: [...ADMIN_FEATURE_KEYS] } },
        { reasonCode: { $in: [...LEGACY_QUEUE_REASON_CODES] } },
      ],
    },
    args.session,
  )
  const queueOperations = []

  for (const document of queueDocuments) {
    const id = String(document._id)
    const sourceCollection =
      typeof document.sourceCollection === 'string' ? document.sourceCollection : ''
    const sourceFeature = getFeatureForResource({ kind: 'collection', slug: sourceCollection })
    const plan = planLegacyQueueMigration(document)

    if (!sourceFeature) report.queue.unmapped.push(id)
    if (!plan.update) continue
    report.queue.changed += 1
    if (plan.retiredWorkflowItem) report.queue.retiredWorkflowItems.push(id)
    queueOperations.push({ updateOne: { filter: { _id: document._id }, update: plan.update } })
  }

  if (write && queueOperations.length > 0) {
    await queueModel.bulkWrite(queueOperations, { session: args.session as never })
  }

  return report
}

const migrateDown = async (args: MigrationArgs) => {
  const usersModel = args.payload.db.collections.users as unknown as MigrationModel
  const users = await findDocuments(
    usersModel,
    { [MIGRATION_FIELD]: { $exists: true } },
    args.session,
  )
  const userOperations = users.flatMap((user) => {
    const update = restoreLegacyUser(user)
    return update ? [{ updateOne: { filter: { _id: user._id }, update } }] : []
  })
  if (userOperations.length > 0) {
    await usersModel.bulkWrite(userOperations, { session: args.session as never })
  }

  for (const target of getEditorialTargets(args)) {
    const prefix = target.recordPath === 'version' ? 'version.' : ''
    const documents = await findDocuments(
      target.model,
      { [`${prefix}${MIGRATION_FIELD}`]: { $exists: true } },
      args.session,
    )
    const operations = documents.flatMap((document) => {
      const update = restoreLegacyEditorialRecord(
        getRecord(document, target.recordPath),
        target.isReview,
      )
      return update
        ? [
            {
              updateOne: {
                filter: { _id: document._id },
                update: prefixUpdate(update, prefix),
              },
            },
          ]
        : []
    })
    if (operations.length > 0) {
      await target.model.bulkWrite(operations, { session: args.session as never })
    }
  }

  const queueModel = args.payload.db.collections['work-queue'] as unknown as MigrationModel
  const queueDocuments = await findDocuments(
    queueModel,
    { [MIGRATION_FIELD]: { $exists: true } },
    args.session,
  )
  const queueOperations = queueDocuments.flatMap((document) => {
    const update = restoreLegacyQueueRecord(document)
    return update ? [{ updateOne: { filter: { _id: document._id }, update } }] : []
  })

  if (queueOperations.length > 0) {
    await queueModel.bulkWrite(queueOperations, { session: args.session as never })
  }
}

export const collectTwoRoleFeatureMigrationReport = async (
  payload: MigrateUpArgs['payload'],
): Promise<TwoRoleFeatureMigrationReport> =>
  prepareUp({ payload, session: undefined as never }, false)

export async function up(args: MigrateUpArgs): Promise<void> {
  const report = await prepareUp(args, true)
  args.payload.logger.info({ msg: 'Two-role feature-permissions migration complete.', report })
}

export async function down(args: MigrateDownArgs): Promise<void> {
  await migrateDown(args)
}
