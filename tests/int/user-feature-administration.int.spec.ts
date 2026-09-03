import { describe, expect, it, vi } from 'vitest'

import { ADMIN_FEATURE_KEYS } from '@/access/adminFeatures'
import {
  Users,
  normalizeFeatureGrants,
  normalizeUserAccessFields,
  preventLastAdminDelete,
} from '@/collections/Users'

const reqWithCount = (totalDocs: number, user: unknown = { id: 1, role: 'admin' }) => ({
  payload: {
    count: vi.fn(async () => ({ totalDocs })),
  },
  user,
})

const fieldNamed = (name: string) =>
  Users.fields.find((field) => 'name' in field && field.name === name)

describe('two-role user administration', () => {
  it('exposes only Admin and Site Manager with 29 default-off grants', () => {
    const role = fieldNamed('role')
    const features = fieldNamed('features')

    expect(role && 'options' in role ? role.options : null).toEqual([
      { label: 'Admin', value: 'admin' },
      { label: 'Site Manager', value: 'siteManager' },
    ])
    expect(features && 'fields' in features ? JSON.stringify(features.fields) : '').not.toContain(
      'contentManager',
    )
    expect(Object.keys(normalizeFeatureGrants(null))).toEqual([...ADMIN_FEATURE_KEYS])
    expect(Object.values(normalizeFeatureGrants(null)).every((value) => value === false)).toBe(true)
  })

  it('bootstraps the first account as Admin and defaults later accounts to zero-grant Site Managers', async () => {
    const first = await normalizeUserAccessFields({
      data: { email: 'first@example.test' },
      operation: 'create',
      req: reqWithCount(0, null),
    } as never)
    const later = await normalizeUserAccessFields({
      data: { email: 'manager@example.test' },
      operation: 'create',
      req: reqWithCount(1),
    } as never)

    expect(first?.role).toBe('admin')
    expect(later?.role).toBe('siteManager')
    expect(later?.features).toEqual(normalizeFeatureGrants(null))
  })

  it('preserves explicit Site Manager grants and clears active sessions when grants change', async () => {
    const result = await normalizeUserAccessFields({
      data: { features: { pages: true }, role: 'siteManager' },
      operation: 'update',
      originalDoc: { features: {}, id: 8, role: 'siteManager' },
      req: reqWithCount(2),
    } as never)

    expect(result?.features.pages).toBe(true)
    expect(result?.features.articles).toBe(false)
    expect(result?.sessions).toEqual([])
  })

  it('protects the last active Admin from demotion', async () => {
    await expect(
      normalizeUserAccessFields({
        data: { role: 'siteManager' },
        operation: 'update',
        originalDoc: { features: {}, id: 8, role: 'admin' },
        req: reqWithCount(0),
      } as never),
    ).rejects.toThrow('last active Admin')
  })

  it('keeps Users hidden and lifecycle operations unavailable to Site Managers', async () => {
    const manager = { id: 7, role: 'siteManager', features: { pages: true } }
    const admin = { id: 1, role: 'admin' }

    const hidden = Users.admin?.hidden
    if (typeof hidden !== 'function') throw new Error('Expected dynamic Users visibility.')

    expect(hidden({ user: manager } as never)).toBe(true)
    expect(hidden({ user: admin } as never)).toBe(false)
    expect(Users.access?.delete?.({ req: { user: manager } } as never)).toBe(false)
    expect(Users.access?.unlock?.({ req: { user: manager } } as never)).toBe(false)
    await expect(Users.access?.create?.({ req: reqWithCount(1, manager) } as never)).resolves.toBe(
      false,
    )
  })

  it('allows an Admin to create multiple accounts while keeping role and grants Admin-only', async () => {
    const admin = { id: 1, role: 'admin' }
    await expect(Users.access?.create?.({ req: reqWithCount(4, admin) } as never)).resolves.toBe(
      true,
    )

    for (const name of ['role', 'features']) {
      const field = fieldNamed(name)
      if (!field || !('access' in field) || !field.access) {
        throw new Error(`Expected ${name} field access.`)
      }
      expect(field.access.create?.({ req: { user: admin } } as never)).toBe(true)
      expect(field.access.update?.({ req: { user: admin } } as never)).toBe(true)
      expect(field.access.create?.({ req: { user: { role: 'siteManager' } } } as never)).toBe(false)
      expect(field.access.update?.({ req: { user: { role: 'siteManager' } } } as never)).toBe(false)
    }
  })

  it('provides sanitized assignment labels without exposing other users', async () => {
    const manager = {
      features: { formSubmissions: true },
      id: 'manager-1',
      role: 'siteManager',
    }
    expect(await Users.access?.read?.({ req: { user: manager } } as never)).toBe(true)

    const afterRead = Users.hooks?.afterRead?.[0]
    if (!afterRead) throw new Error('Expected assignment sanitizer.')
    expect(
      await afterRead({
        doc: {
          email: 'private@example.test',
          features: { auditLog: true },
          hash: 'private-hash',
          id: 'manager-2',
          role: 'siteManager',
        },
        req: { user: manager },
      } as never),
    ).toEqual({ email: 'User #manager-2', id: 'manager-2' })
  })

  it('protects the last active Admin from permanent deletion', async () => {
    const findByID = vi.fn(async () => ({ id: 8, role: 'admin' }))
    const count = vi.fn(async () => ({ totalDocs: 0 }))

    await expect(
      preventLastAdminDelete({
        id: 8,
        req: { payload: { count, findByID }, user: { role: 'admin' } },
      } as never),
    ).rejects.toThrow('last active Admin')
  })

  it('audits Site Manager trash and restore lifecycle changes without personal data', async () => {
    const create = vi.fn(async () => ({}))
    const hook = Users.hooks?.afterChange?.[0]
    if (!hook) throw new Error('Expected user lifecycle audit hook.')

    await hook({
      doc: {
        deletedAt: '2026-09-03T00:00:00.000Z',
        email: 'private@example.test',
        features: { pages: true },
        id: 8,
        role: 'siteManager',
      },
      operation: 'update',
      previousDoc: {
        deletedAt: null,
        email: 'private@example.test',
        features: { pages: true },
        id: 8,
        role: 'siteManager',
      },
      req: {
        payload: { create },
        user: { email: 'admin@example.test', id: 1, role: 'admin' },
      },
    } as never)

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'user_trashed',
          entityId: '8',
          entityTitle: 'User #8',
        }),
      }),
    )
    expect(JSON.stringify(create.mock.calls)).not.toContain('private@example.test')
  })
})
