import { existsSync } from 'node:fs'
import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { config, proxy } from '@/proxy'

describe('redirect proxy', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserves configured permanent redirects', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        redirects: [{ from: '/old-page', permanent: true, to: '/new-page' }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await proxy(new NextRequest('https://snmih.in/old-page'))

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://snmih.in/new-page')
    expect(fetchMock).toHaveBeenCalledWith('https://snmih.in/api/public-redirects', {
      cache: 'no-store',
    })
  })

  it('keeps Payload collection REST ownership at /api/redirects', () => {
    expect(existsSync('src/app/api/redirects/route.ts')).toBe(false)
    expect(existsSync('src/app/api/public-redirects/route.ts')).toBe(true)
  })

  it.each(['articles', 'news-events'])(
    'redirects legacy %s previews before public routing',
    async (collection) => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const response = await proxy(
        new NextRequest(`https://snmih.in/${collection}/draft?preview=true`),
      )
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe(`https://snmih.in/preview/${collection}/draft`)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('retains the public-path matcher exclusions', () => {
    expect(config.matcher).toEqual([
      '/((?!_next|api|admin|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.xml$|.*\\.json$).*)',
    ])
  })
})
