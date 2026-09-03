import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPageMetadataByPath: vi.fn(),
}))

vi.mock('@/app/(frontend)/pageData', () => ({
  getPageMetadataByPath: mocks.getPageMetadataByPath,
}))

import { ManagedCmsPage } from '@/app/(frontend)/ManagedCmsPage'
import NewsEventsPage, { generateMetadata } from '@/app/(frontend)/news-events/page'

describe('manual News & Events Page route', () => {
  it('renders the manually authored news-events Page', () => {
    const element = NewsEventsPage()

    expect(element.type).toBe(ManagedCmsPage)
    expect(element.props.segments).toEqual(['news-events'])
  })

  it('uses the Page document metadata contract', async () => {
    mocks.getPageMetadataByPath.mockResolvedValue({ title: 'Manual News & Events' })

    await expect(generateMetadata()).resolves.toEqual({ title: 'Manual News & Events' })
    expect(mocks.getPageMetadataByPath).toHaveBeenCalledWith(['news-events'])
  })
})
