import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentCMSUser: vi.fn(),
}))

vi.mock('@/lib/cmsSession', () => ({
  getCurrentCMSUser: mocks.getCurrentCMSUser,
}))

import { GET } from '@/app/api/frontend-session/route'
import { DeferredAdminSessionBar } from '@/components/admin/DeferredAdminSessionBar'

const privateCacheControl = 'private, no-store, max-age=0'

describe('frontend session endpoint', () => {
  beforeEach(() => {
    mocks.getCurrentCMSUser.mockReset()
  })

  it('returns only the toolbar fields for an authenticated user', async () => {
    mocks.getCurrentCMSUser.mockResolvedValue({
      email: 'operator@example.com',
      id: 'user-1',
      role: 'siteManager',
    })

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(privateCacheControl)
    expect(await response.json()).toEqual({
      user: { email: 'operator@example.com', role: 'siteManager' },
    })
  })

  it('returns a private null session for anonymous and failed authentication', async () => {
    mocks.getCurrentCMSUser.mockResolvedValueOnce(null)
    const anonymous = await GET()

    expect(anonymous.headers.get('cache-control')).toBe(privateCacheControl)
    expect(await anonymous.json()).toEqual({ user: null })

    mocks.getCurrentCMSUser.mockRejectedValueOnce(new Error('expired session'))
    const failed = await GET()

    expect(failed.headers.get('cache-control')).toBe(privateCacheControl)
    expect(await failed.json()).toEqual({ user: null })
  })
})

describe('deferred admin session bar', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--cms-toolbar-offset')
  })

  afterEach(() => {
    cleanup()
    document.documentElement.style.removeProperty('--cms-toolbar-offset')
    vi.unstubAllGlobals()
  })

  it('mounts authenticated UI and publishes the toolbar offset after hydration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          user: { email: 'operator@example.com', role: 'siteManager' },
        }),
        ok: true,
      }),
    )

    const view = render(<DeferredAdminSessionBar />)

    await screen.findByText('Open Admin')
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('3rem')

    view.unmount()
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('')
  })

  it.each([
    ['anonymous', { json: async () => ({ user: null }), ok: true }],
    ['invalid payload', { json: async () => ({ user: { email: 42 } }), ok: true }],
    ['non-OK response', { json: async () => ({ user: null }), ok: false }],
  ])('fails closed for an %s response', async (_label, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<DeferredAdminSessionBar />)

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Open Admin')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('')
  })

  it('fails closed when the session request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))

    render(<DeferredAdminSessionBar />)

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Open Admin')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('')
  })
})
