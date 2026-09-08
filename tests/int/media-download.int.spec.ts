import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/media-download/[id]/route'
import { resolveCmsLink } from '@/lib/cmsLinks'
import { getMediaDownloadUrl } from '@/lib/media'
import { resolveDocumentActions } from '@/blocks/DownloadList/resolveActions'
import type { Media } from '@/payload-types'

const { find } = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ find })) }))
vi.mock('@payload-config', () => ({ default: {} }))

const remote = {
  id: 'fees',
  filename: 'fees.pdf',
  url: 'https://assets.snmih.in/fees.pdf',
} as Media
const fetchMock = vi.fn()
const request = () =>
  GET(new Request('https://snmih.in/api/media-download/fees'), {
    params: Promise.resolve({ id: 'fees' }),
  })

describe('Media attachment downloads', () => {
  beforeEach(() => {
    vi.stubEnv('S3_PUBLIC_URL', 'https://assets.snmih.in')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://snmih.in')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset().mockImplementation(
      async () =>
        new Response('%PDF-file', {
          headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline' },
        }),
    )
    find.mockReset().mockResolvedValue({ docs: [remote] })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('routes remote Download actions through the attachment endpoint and keeps View direct', () => {
    expect(
      resolveCmsLink({ file: remote, linkType: 'file', fileBehavior: 'download' }),
    ).toMatchObject({
      href: '/api/media-download/fees',
      download: 'fees.pdf',
      openInNewTab: false,
    })
    expect(resolveCmsLink({ file: remote, linkType: 'file', fileBehavior: 'view' })).toMatchObject({
      href: remote.url,
      download: undefined,
      openInNewTab: true,
    })
    expect(getMediaDownloadUrl({ ...remote, url: '/api/media/file/fees.pdf' })).toBe(
      '/api/media/file/fees.pdf',
    )
    expect(
      resolveDocumentActions({
        legacyActions: [{ actionType: 'download', file: remote, label: 'Fees' }],
        fallback: {},
      })[0].href,
    ).toBe('/api/media-download/fees')
  })

  it('streams the actual bytes with attachment headers and enforces public Media access', async () => {
    const response = await request()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="fees.pdf"; filename*=UTF-8\'\'fees.pdf',
    )
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(await response.text()).toBe('%PDF-file')
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: false,
        user: null,
        draft: false,
        where: { and: [{ id: { equals: 'fees' } }, { _status: { equals: 'published' } }] },
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(remote.url!),
      expect.objectContaining({ redirect: 'error', cache: 'no-store' }),
    )
  })

  it('encodes Unicode filenames and strips header and path characters', async () => {
    find.mockResolvedValue({ docs: [{ ...remote, filename: 'Fées/"2026"\r\n.pdf' }] })
    const response = await request()
    const header = response.headers.get('content-disposition')!
    expect(header).toContain("filename*=UTF-8''F%C3%A9es_%222026%22__.pdf")
    expect(header).not.toMatch(/[\r\n]/)
  })

  it('returns 404 without fetching when Media is absent or inaccessible', async () => {
    find.mockResolvedValue({ docs: [] })
    expect((await request()).status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    'https://untrusted.example/fees.pdf',
    'http://169.254.169.254/metadata',
    'https://user:password@assets.snmih.in/fees.pdf',
    'https://snmih.in/api/media-download/fees',
  ])('rejects an untrusted or recursive source: %s', async (url) => {
    find.mockResolvedValue({ docs: [{ ...remote, url }] })
    expect((await request()).status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows the trusted local Payload file endpoint', async () => {
    find.mockResolvedValue({ docs: [{ ...remote, url: '/api/media/file/fees.pdf' }] })
    expect((await request()).status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://snmih.in/api/media/file/fees.pdf'),
      expect.anything(),
    )
  })

  it.each([404, 500, 302])(
    'handles an upstream %s without returning a false download',
    async (status) => {
      fetchMock.mockResolvedValue(new Response(null, { status }))
      expect((await request()).status).toBe(status === 404 ? 404 : 502)
    },
  )

  it('handles upstream network errors without exposing details', async () => {
    fetchMock.mockRejectedValue(new Error('private origin details'))
    const response = await request()
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('private origin')
  })
})
