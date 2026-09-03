import type { Access, FieldAccess, Where } from 'payload'

import {
  ADMIN_FEATURES,
  ADMIN_FEATURE_KEYS,
  type AdminFeatureGrants,
  type AdminFeatureKey,
} from '@/access/adminFeatures'

export type AdminUserLike = {
  features?: AdminFeatureGrants | null | unknown
  id?: number | string | null
  role?: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const isAdmin = (user: unknown): user is Record<string, unknown> & { role: 'admin' } =>
  isRecord(user) && user.role === 'admin'

export const isSiteManager = (
  user: unknown,
): user is Record<string, unknown> & { role: 'siteManager' } =>
  isRecord(user) && user.role === 'siteManager'

export const hasFeature = (user: unknown, key: AdminFeatureKey): boolean => {
  if (isAdmin(user)) return true
  if (!isSiteManager(user) || !isRecord(user.features)) return false
  return user.features[key] === true
}

export const getGrantedFeatureKeys = (user: unknown): AdminFeatureKey[] =>
  ADMIN_FEATURE_KEYS.filter((key) => hasFeature(user, key))

export const hasDependencyRead = (user: unknown, target: AdminFeatureKey): boolean => {
  if (isAdmin(user)) return true
  if (!isSiteManager(user)) return false

  return ADMIN_FEATURE_KEYS.some(
    (source) => hasFeature(user, source) && ADMIN_FEATURES[source].dependencyReads.includes(target),
  )
}

export const canReadFeature = (user: unknown, key: AdminFeatureKey): boolean =>
  hasFeature(user, key) || hasDependencyRead(user, key)

export const adminOnlyAccess: Access = ({ req }) => isAdmin(req.user)

export const adminOrFirstUserAccess: Access = async ({ req }) => {
  if (isAdmin(req.user)) return true

  const { totalDocs } = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    where: {},
  })

  return totalDocs === 0
}

export const requireFeature =
  (key: AdminFeatureKey): Access =>
  ({ req }) =>
    hasFeature(req.user, key)

export const allowPublicReadOrFeature =
  (key: AdminFeatureKey): Access =>
  ({ req }) => {
    if (!req.user) return true
    return canReadFeature(req.user, key)
  }

export const allowPublishedReadOrFeature =
  (key: AdminFeatureKey): Access =>
  ({ req }) => {
    if (req.user) return canReadFeature(req.user, key)

    const publishedWhere: Where = { _status: { equals: 'published' } }
    return publishedWhere
  }

export const deleteFeatureOrAdmin =
  (key: AdminFeatureKey): Access =>
  ({ data, req }) => {
    if (isAdmin(req.user)) return true
    if (!hasFeature(req.user, key)) return false

    return isRecord(data) && typeof data.deletedAt === 'string' && data.deletedAt.length > 0
  }

export const authenticatedFieldReadAccess: FieldAccess = ({ req }) => Boolean(req.user)
export const adminFieldAccess: FieldAccess = ({ req }) => isAdmin(req.user)
export const featureFieldReadAccess =
  (key: AdminFeatureKey): FieldAccess =>
  ({ req }) =>
    hasFeature(req.user, key)

export const hideFromNonAdmin = ({ user }: { user?: unknown }) => !isAdmin(user)
export const hideUnlessFeature =
  (key: AdminFeatureKey) =>
  ({ user }: { user?: unknown }) =>
    !hasFeature(user, key)
