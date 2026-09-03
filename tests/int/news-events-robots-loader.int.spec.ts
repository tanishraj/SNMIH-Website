import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findGlobal: vi.fn(),
  getPayload: vi.fn(),
  unstableCache: vi.fn((loader: (...args: never[]) => unknown) => loader),
}))

vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('next/cache', () => ({ unstable_cache: mocks.unstableCache }))
vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return { ...actual, getPayload: mocks.getPayload }
})

describe('News & Events inherited robots loader', () => {
  beforeEach(() => {
    mocks.findGlobal.mockReset()
    mocks.getPayload.mockReset()
    mocks.getPayload.mockResolvedValue({
      findGlobal: mocks.findGlobal,
    })
    mocks.findGlobal.mockResolvedValue({
      robots: 'noindex,follow',
    })
  })

  it('loads the global policy through the globals cache tag', async () => {
    const { getNewsEventsInheritedRobots } = await import('@/lib/newsEvents')

    await expect(getNewsEventsInheritedRobots()).resolves.toBe('noindex,follow')
    expect(mocks.findGlobal).toHaveBeenCalledWith({
      depth: 0,
      slug: 'seo-settings',
    })
    expect(mocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ['news-events-inherited-robots'],
      {
        revalidate: false,
        tags: ['cms-globals'],
      },
    )
  })
})
