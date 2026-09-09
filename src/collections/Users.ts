import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  Field,
  Where,
} from 'payload'
import { APIError } from 'payload'

import {
  ADMIN_FEATURE_GROUPS,
  ADMIN_FEATURE_KEYS,
  ADMIN_FEATURES,
  type AdminFeatureGrants,
  type AdminRole,
} from '@/access/adminFeatures'
import {
  adminFieldAccess,
  adminOnlyAccess,
  adminOrFirstUserAccess,
  hideFromNonAdmin,
  hasFeature,
  isAdmin,
} from '@/access/featureAccess'
import { recordOperationalAuditEvent } from '@/lib/operationalAudit'
import {
  deleteTwoFactorCredentials,
  enforceTwoFactorLogin,
  filterTwoFactorSessions,
} from '@/lib/twoFactor'
import { twoFactorSettingsEndpoint, twoFactorStatusEndpoint } from '@/endpoints/twoFactor'

type UserAccessDocument = {
  deletedAt?: string | null
  features?: AdminFeatureGrants | null
  id?: number | string
  role?: string | null
}

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Site Manager', value: 'siteManager' },
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeRole = (value: unknown, fallback: AdminRole = 'siteManager'): AdminRole =>
  value === 'admin' || value === 'siteManager' ? value : fallback

export const normalizeFeatureGrants = (value: unknown): AdminFeatureGrants => {
  const source = isRecord(value) ? value : {}

  return ADMIN_FEATURE_KEYS.reduce<AdminFeatureGrants>((grants, key) => {
    grants[key] = source[key] === true
    return grants
  }, {})
}

const enabledFeatureKeys = (value: unknown) =>
  ADMIN_FEATURE_KEYS.filter((key) => normalizeFeatureGrants(value)[key] === true)

const sameFeatures = (left: unknown, right: unknown) =>
  ADMIN_FEATURE_KEYS.every(
    (key) => normalizeFeatureGrants(left)[key] === normalizeFeatureGrants(right)[key],
  )

const createFeatureRows = (keys: readonly (typeof ADMIN_FEATURE_KEYS)[number][]): Field[] => {
  const fields = keys.map<Field>((key) => ({
    name: key,
    type: 'checkbox',
    defaultValue: false,
    label: ADMIN_FEATURES[key].label,
    admin: {
      description: ADMIN_FEATURES[key].description,
      width: '33.33%',
    },
  }))

  const rows: Field[] = []
  for (let index = 0; index < fields.length; index += 3) {
    rows.push({ type: 'row', fields: fields.slice(index, index + 3) })
  }
  return rows
}

export const adminFeatureCheckboxFields: Field[] = ADMIN_FEATURE_GROUPS.map((group) => {
  const keys = ADMIN_FEATURE_KEYS.filter((key) => ADMIN_FEATURES[key].group === group)
  return {
    type: 'collapsible',
    label: group,
    admin: { initCollapsed: false },
    fields: createFeatureRows(keys),
  }
})

const showFeatureAccess = (
  data: Record<string, unknown>,
  siblingData: Record<string, unknown>,
  { user }: { user?: unknown },
) => isAdmin(user) && normalizeRole(siblingData.role ?? data.role) === 'siteManager'

const adminOrSelfAccess = ({ id, req }: { id?: number | string; req: { user?: unknown } }) => {
  if (isAdmin(req.user)) return true
  if (!isRecord(req.user) || req.user.id == null) return false
  if (id != null) return String(req.user.id) === String(id)
  return { id: { equals: req.user.id } }
}

const canUseAssignmentControls = (user: unknown) =>
  hasFeature(user, 'formSubmissions') || hasFeature(user, 'actionQueue')

const adminSelfOrAssignmentRead = ({
  id,
  req,
}: {
  id?: number | string
  req: { user?: unknown }
}) => {
  if (isAdmin(req.user) || canUseAssignmentControls(req.user)) return true
  return adminOrSelfAccess({ id, req })
}

const sanitizeAssignmentUser: CollectionAfterReadHook = ({ doc, req }) => {
  if (isAdmin(req.user) || String(req.user?.id ?? '') === String(doc.id)) return doc
  if (!canUseAssignmentControls(req.user)) return doc

  return {
    id: doc.id,
    email: `User #${doc.id}`,
  }
}

const countOtherActiveAdmins = async ({
  id,
  req,
}: {
  id?: number | string
  req: Parameters<CollectionBeforeChangeHook>[0]['req']
}) => {
  const conditions: Where[] = [
    { role: { equals: 'admin' } },
    {
      or: [{ deletedAt: { exists: false } }, { deletedAt: { equals: null } }],
    },
  ]

  if (id != null) conditions.push({ id: { not_equals: id } })

  const result = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    req,
    trash: true,
    where: { and: conditions },
  })

  return result.totalDocs
}

const assertAnotherAdminExists = async ({
  originalDoc,
  req,
}: {
  originalDoc?: UserAccessDocument | null
  req: Parameters<CollectionBeforeChangeHook>[0]['req']
}) => {
  if (originalDoc?.role !== 'admin') return

  const total = await countOtherActiveAdmins({ id: originalDoc.id, req })
  if (total === 0) {
    throw new APIError('The last active Admin cannot be demoted, trashed, or deleted.', 400)
  }
}

export const normalizeUserAccessFields: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data

  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      overrideAccess: true,
      where: {},
    })

    if (totalDocs === 0) {
      data.role = 'admin'
      data.features = normalizeFeatureGrants(null)
      return data
    }

    const role = normalizeRole(data.role)
    data.role = role
    data.features =
      role === 'siteManager' ? normalizeFeatureGrants(data.features) : normalizeFeatureGrants(null)
    return data
  }

  const previous = (originalDoc ?? {}) as UserAccessDocument
  const previousRole = normalizeRole(previous.role)
  const nextRole = normalizeRole(data.role, previousRole)
  const isTrashAttempt = typeof data.deletedAt === 'string' && data.deletedAt.length > 0

  if (previousRole === 'admin' && (nextRole !== 'admin' || isTrashAttempt)) {
    await assertAnotherAdminExists({ originalDoc: previous, req })
  }

  const nextFeatures =
    nextRole === 'siteManager'
      ? normalizeFeatureGrants(data.features ?? previous.features)
      : normalizeFeatureGrants(null)
  const accessChanged = nextRole !== previousRole || !sameFeatures(nextFeatures, previous.features)

  data.role = nextRole
  data.features = nextFeatures
  if (accessChanged) data.sessions = []

  return data
}

export const preventLastAdminDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const target = (await req.payload.findByID({
    collection: 'users',
    id,
    depth: 0,
    overrideAccess: true,
    req,
    trash: true,
  })) as UserAccessDocument

  await assertAnotherAdminExists({ originalDoc: target, req })
}

const auditUserAuthorizationChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const current = doc as UserAccessDocument
  const previous = previousDoc as UserAccessDocument | undefined
  const lifecycleChanged = current.deletedAt !== previous?.deletedAt
  const authorizationChanged =
    normalizeRole(current.role) !== normalizeRole(previous?.role) ||
    !sameFeatures(current.features, previous?.features)

  if (operation !== 'create' && !lifecycleChanged && !authorizationChanged) return doc

  if (lifecycleChanged) {
    const trashed = Boolean(current.deletedAt)
    await recordOperationalAuditEvent({
      action: trashed ? 'user_trashed' : 'user_restored',
      entityId: String(current.id ?? ''),
      entityTitle: `User #${current.id ?? 'unknown'}`,
      entityType: 'user',
      req,
      summary: `User #${current.id ?? 'unknown'} was ${trashed ? 'trashed' : 'restored'}.`,
    })
  }

  if (operation === 'create' || authorizationChanged) {
    const before = previous
      ? `${normalizeRole(previous.role)} [${enabledFeatureKeys(previous.features).join(', ')}]`
      : 'new user'
    const after = `${normalizeRole(current.role)} [${enabledFeatureKeys(current.features).join(', ')}]`

    await recordOperationalAuditEvent({
      action: operation === 'create' ? 'user_created' : 'user_access_changed',
      entityId: String(current.id ?? ''),
      entityTitle: `User #${current.id ?? 'unknown'}`,
      entityType: 'user',
      req,
      summary: `Authorization changed from ${before} to ${after}.`,
    })
  }

  return doc
}

const auditUserDeletion: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await recordOperationalAuditEvent({
    action: 'user_permanently_deleted',
    entityId: String(doc.id),
    entityTitle: `User #${doc.id}`,
    entityType: 'user',
    req,
    summary: `User #${doc.id} was permanently deleted.`,
  })

  return doc
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    group: 'Administration',
    hidden: hideFromNonAdmin,
    useAsTitle: 'email',
  },
  auth: { useSessions: true },
  endpoints: [twoFactorStatusEndpoint, twoFactorSettingsEndpoint],
  access: {
    create: adminOrFirstUserAccess,
    delete: adminOnlyAccess,
    read: adminSelfOrAssignmentRead,
    readVersions: adminOnlyAccess,
    unlock: adminOnlyAccess,
    update: adminOrSelfAccess,
  },
  hooks: {
    afterChange: [auditUserAuthorizationChange],
    afterDelete: [auditUserDeletion, deleteTwoFactorCredentials],
    afterRead: [sanitizeAssignmentUser, filterTwoFactorSessions],
    beforeLogin: [enforceTwoFactorLogin],
    beforeChange: [normalizeUserAccessFields],
    beforeDelete: [preventLastAdminDelete],
  },
  fields: [
    {
      name: 'twoFactorSettings',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/TwoFactorSettings#TwoFactorSettings' } },
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'siteManager',
      options: [...roleOptions],
      required: true,
      saveToJWT: true,
      access: { create: adminFieldAccess, read: adminFieldAccess, update: adminFieldAccess },
      admin: {
        description: 'Admins have full access. Site Managers receive only selected features.',
        position: 'sidebar',
      },
    },
    {
      name: 'features',
      type: 'group',
      saveToJWT: true,
      access: { create: adminFieldAccess, read: adminFieldAccess, update: adminFieldAccess },
      admin: {
        condition: showFeatureAccess,
        description:
          'Choose the Admin destinations this Site Manager may use. New Site Managers start with no access.',
      },
      fields: adminFeatureCheckboxFields,
    },
  ],
}
