import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  role: 'admin' as const,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: testUser,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'users',
      data: testUser,
      overrideAccess: true,
    })
  }
}

export async function getTestUserDocument(): Promise<{
  features?: unknown
  email: string
  id: number | string
  role: string
}> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  const user = result.docs[0]

  if (!user) {
    throw new Error(`Expected test user ${testUser.email} to exist before seeding homepage.`)
  }

  return {
    features: user.features,
    email: user.email ?? testUser.email,
    id: user.id,
    role: user.role ?? 'admin',
  }
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: testUser.email } },
  })
  const user = existing.docs[0]
  if (!user) return

  if (user.role === 'admin') {
    const otherAdmins = await payload.count({
      collection: 'users',
      overrideAccess: true,
      trash: true,
      where: {
        and: [
          { id: { not_equals: user.id } },
          { role: { equals: 'admin' } },
          { or: [{ deletedAt: { exists: false } }, { deletedAt: { equals: null } }] },
        ],
      },
    })
    if (otherAdmins.totalDocs === 0) return
  }

  await payload.delete({
    collection: 'users',
    id: user.id,
    overrideAccess: true,
  })
}
