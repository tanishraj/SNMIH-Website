import type { PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Pages } from '@/collections/Pages'
import { createPageFromRecipeEndpoint } from '@/endpoints/createPageFromRecipe'

const create = vi.fn()
const loggerError = vi.fn()

const pageManager = {
  features: { pages: true },
  id: 'manager-1',
  role: 'siteManager',
}

const makeRequest = ({
  body = { recipe: 'landing', title: '  Admissions  ' },
  jsonError,
  user = pageManager,
}: {
  body?: unknown
  jsonError?: Error
  user?: null | typeof pageManager | { id: string; role: 'siteManager' }
} = {}) =>
  ({
    json: jsonError ? vi.fn().mockRejectedValue(jsonError) : vi.fn().mockResolvedValue(body),
    payload: {
      config: { routes: { admin: '/cms' }, serverURL: 'https://example.test' },
      create,
      logger: { error: loggerError },
    },
    user,
  }) as unknown as PayloadRequest

describe('create Page from recipe endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    create.mockResolvedValue({ id: 'page-17' })
  })

  it('is registered on Pages', () => {
    expect(Pages.endpoints).toContain(createPageFromRecipeEndpoint)
  })

  it('creates an access-controlled Landing draft and returns its edit URL', async () => {
    const req = makeRequest()
    const response = await createPageFromRecipeEndpoint.handler(req)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      editURL: '/cms/collections/pages/page-17',
      id: 'page-17',
    })
    expect(create).toHaveBeenCalledWith({
      collection: 'pages',
      data: {
        layout: [
          expect.objectContaining({ blockType: 'pageHeader', title: 'Admissions' }),
          expect.objectContaining({ blockType: 'breadcrumb' }),
        ],
        title: 'Admissions',
      },
      draft: true,
      overrideAccess: false,
      req,
      user: pageManager,
    })
  })

  it('creates an empty Blank draft', async () => {
    const response = await createPageFromRecipeEndpoint.handler(
      makeRequest({ body: { recipe: 'blank', title: 'Plain Page' } }),
    )

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ layout: [] }) }),
    )
  })

  it.each([
    ['anonymous', makeRequest({ user: null }), 401],
    ['unauthorized', makeRequest({ user: { id: 'writer-1', role: 'siteManager' } }), 403],
    ['malformed JSON', makeRequest({ jsonError: new Error('bad JSON') }), 400],
    ['empty title', makeRequest({ body: { recipe: 'blank', title: '   ' } }), 400],
    ['unknown recipe', makeRequest({ body: { recipe: 'service', title: 'Services' } }), 400],
  ])('rejects %s without mutation', async (_label, req, status) => {
    const response = await createPageFromRecipeEndpoint.handler(req)

    expect(response.status).toBe(status)
    expect(create).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({ message: expect.any(String) })
  })

  it('logs internal failure and returns a safe message', async () => {
    create.mockRejectedValue(new Error('database credentials leaked here'))

    const response = await createPageFromRecipeEndpoint.handler(makeRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Unable to create the Page draft.' })
    expect(loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Page recipe draft creation failed.' }),
    )
  })
})
