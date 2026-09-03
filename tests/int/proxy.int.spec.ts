import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { config, proxy } from '@/proxy'

describe('redirect proxy', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('preserves configured permanent redirects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          redirects: [{ from: '/old-page', permanent: true, to: '/new-page' }],
        }),
      ),
    )

    const response = await proxy(new NextRequest('https://snmih.in/old-page'))

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://snmih.in/new-page')
  })

  it('retains the public-path matcher exclusions', () => {
    expect(config.matcher).toEqual([
      '/((?!_next|api|admin|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.xml$|.*\\.json$).*)',
    ])
  })
})
