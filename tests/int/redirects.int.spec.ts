import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRedirectsForChangedPagePath } from '@/hooks/createRedirectsForChangedPagePath'

type RedirectDoc = {
  destinationType: 'custom' | 'page'
  enabled: boolean
  fromPath: string
  id: number
  page?: number | null
  statusCode: '301' | '302'
  url?: string | null
}

const createPayloadRequestMock = ({
  enabledRedirectsByPath = {},
  existingRedirectByPath = {},
}: {
  enabledRedirectsByPath?: Record<string, RedirectDoc[]>
  existingRedirectByPath?: Record<string, RedirectDoc | null>
} = {}) => {
  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 999,
    ...data,
  }))
  const deleteRedirect = vi.fn(async ({ id }: { id: number }) => ({
    id,
  }))
  const update = vi.fn(async ({ id, data }: { data: Record<string, unknown>; id: number }) => ({
    id,
    ...data,
  }))

  const find = vi.fn(async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
    if (collection === 'redirects') {
      const andConditions = Array.isArray(where?.and) ? where.and : []
      const directFromPath =
        typeof where?.fromPath === 'object' &&
        where.fromPath !== null &&
        'equals' in where.fromPath
          ? (where.fromPath as { equals?: string }).equals
          : undefined
      const fromPathCondition = andConditions.find(
        (condition) =>
          typeof condition === 'object' &&
          condition !== null &&
          'fromPath' in condition &&
          typeof condition.fromPath === 'object' &&
          condition.fromPath !== null &&
          'equals' in condition.fromPath,
      ) as { fromPath?: { equals?: string } } | undefined
      const enabledCondition = andConditions.find(
        (condition) =>
          typeof condition === 'object' &&
          condition !== null &&
          'enabled' in condition &&
          typeof condition.enabled === 'object' &&
          condition.enabled !== null &&
          'equals' in condition.enabled,
      ) as { enabled?: { equals?: boolean } } | undefined

      const fromPath = directFromPath ?? fromPathCondition?.fromPath?.equals

      if (fromPath && enabledCondition?.enabled?.equals === true) {
        return {
          docs: enabledRedirectsByPath[fromPath] ?? [],
        }
      }

      if (fromPath) {
        const existing = existingRedirectByPath[fromPath]
        return {
          docs: existing ? [existing] : [],
        }
      }
    }

    if (collection === 'pages') {
      return {
        docs: [],
      }
    }

    return {
      docs: [],
    }
  })

  const findGlobal = vi.fn(async () => ({
    homepage: null,
  }))

  return {
    req: {
      payload: {
        create,
        delete: deleteRedirect,
        find,
        findGlobal,
        update,
      },
    },
    spies: {
      create,
      delete: deleteRedirect,
      find,
      findGlobal,
      update,
    },
  }
}

describe('redirect cleanup', () => {
  it('creates a redirect for a normal single rename', async () => {
    const { req, spies } = createPayloadRequestMock()

    await createRedirectsForChangedPagePath({
      doc: {
        _status: 'published',
        id: 10,
        parent: null,
        slug: 'homepage',
      } as never,
      operation: 'update',
      previousDoc: {
        _status: 'published',
        id: 10,
        parent: null,
        slug: 'home',
      } as never,
      req: req as never,
    } as unknown as Parameters<typeof createRedirectsForChangedPagePath>[0])

    expect(spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'redirects',
        data: expect.objectContaining({
          destinationType: 'page',
          enabled: true,
          fromPath: '/home',
          page: '10',
        }),
      }),
    )
  })

  it('preserves MongoDB string IDs when a published page slug changes', async () => {
    const { req, spies } = createPayloadRequestMock()
    const pageID = '6a851324d90681b916813985'

    await createRedirectsForChangedPagePath({
      doc: {
        _status: 'published',
        id: pageID,
        parent: null,
        slug: 'academic-departments',
      } as never,
      operation: 'update',
      previousDoc: {
        _status: 'published',
        id: pageID,
        parent: null,
        slug: 'departments',
      } as never,
      req: req as never,
    } as unknown as Parameters<typeof createRedirectsForChangedPagePath>[0])

    expect(spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'redirects',
        data: expect.objectContaining({
          destinationType: 'page',
          fromPath: '/departments',
          page: pageID,
        }),
      }),
    )
  })

  it('deletes a stale conflicting redirect when a page reclaims a path and does not create a reverse redirect', async () => {
    const conflictingRedirect: RedirectDoc = {
      destinationType: 'custom',
      enabled: true,
      fromPath: '/home',
      id: 1,
      statusCode: '301',
      url: '/homepage',
    }
    const { req, spies } = createPayloadRequestMock({
      enabledRedirectsByPath: {
        '/home': [conflictingRedirect],
      },
    })

    await createRedirectsForChangedPagePath({
      doc: {
        _status: 'published',
        id: 10,
        parent: null,
        slug: 'home',
      } as never,
      operation: 'update',
      previousDoc: {
        _status: 'published',
        id: 10,
        parent: null,
        slug: 'homepage',
      } as never,
      req: req as never,
    } as unknown as Parameters<typeof createRedirectsForChangedPagePath>[0])

    expect(spies.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'redirects',
        id: 1,
      }),
    )
    expect(spies.create).not.toHaveBeenCalled()
  })

  it('deletes a page-backed conflicting redirect when restoring a previously owned path and skips creating a new redirect', async () => {
    const conflictingRedirect: RedirectDoc = {
      destinationType: 'page',
      enabled: true,
      fromPath: '/homepage',
      id: 3,
      page: 10,
      statusCode: '301',
      url: null,
    }
    const { req, spies } = createPayloadRequestMock({
      enabledRedirectsByPath: {
        '/homepage': [conflictingRedirect],
      },
    })

    await createRedirectsForChangedPagePath({
      doc: {
        _status: 'published',
        id: 10,
        parent: null,
        slug: 'homepage',
      } as never,
      operation: 'update',
      previousDoc: {
        _status: 'published',
        id: 10,
        parent: null,
        slug: 'home',
      } as never,
      req: req as never,
    } as unknown as Parameters<typeof createRedirectsForChangedPagePath>[0])

    expect(spies.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'redirects',
        id: 3,
      }),
    )
    expect(spies.create).not.toHaveBeenCalled()
  })
})

describe('redirect resolution guards', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('ignores self-loop redirects', async () => {
    vi.doMock('@payload-config', () => ({
      default: {},
    }))
    vi.doMock('payload', () => ({
      getPayload: vi.fn(async () => ({
        find: vi.fn(async ({ where }: { where: { and?: Array<{ fromPath?: { equals?: string } }> } }) => {
          const fromPath = where.and?.find((condition) => condition.fromPath)?.fromPath?.equals

          return {
            docs:
              fromPath === '/home'
                ? [
                    {
                      destinationType: 'custom',
                      enabled: true,
                      fromPath: '/home',
                      id: 1,
                      statusCode: '301',
                      url: '/home',
                    },
                  ]
                : [],
          }
        }),
      })),
    }))

    const { getRedirectByPath } = await import('@/lib/redirects')

    await expect(getRedirectByPath('/home')).resolves.toBeNull()
  })

  it('ignores short circular redirect chains', async () => {
    vi.doMock('@payload-config', () => ({
      default: {},
    }))
    vi.doMock('payload', () => ({
      getPayload: vi.fn(async () => ({
        find: vi.fn(async ({ where }: { where: { and?: Array<{ fromPath?: { equals?: string } }> } }) => {
          const fromPath = where.and?.find((condition) => condition.fromPath)?.fromPath?.equals

          if (fromPath === '/home') {
            return {
              docs: [
                {
                  destinationType: 'custom',
                  enabled: true,
                  fromPath: '/home',
                  id: 1,
                  statusCode: '301',
                  url: '/homepage',
                },
              ],
            }
          }

          if (fromPath === '/homepage') {
            return {
              docs: [
                {
                  destinationType: 'custom',
                  enabled: true,
                  fromPath: '/homepage',
                  id: 2,
                  statusCode: '301',
                  url: '/home',
                },
              ],
            }
          }

          return {
            docs: [],
          }
        }),
      })),
    }))

    const { getRedirectByPath } = await import('@/lib/redirects')

    await expect(getRedirectByPath('/home')).resolves.toBeNull()
  })
})
