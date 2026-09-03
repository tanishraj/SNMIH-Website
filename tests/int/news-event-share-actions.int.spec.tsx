import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewsEventShareActions } from '@/components/news-events/NewsEventShareActions'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('News & Events share actions', () => {
  it('uses native sharing when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })

    render(<NewsEventShareActions title="Campus story" url="https://example.test/story" />)
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: 'Campus story',
        url: 'https://example.test/story',
      }),
    )
  })

  it('copies from the fallback and announces the result', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<NewsEventShareActions title="Campus story" url="https://example.test/story" />)
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://example.test/story'))
    expect(screen.getByRole('status').textContent).toContain('Link copied.')
  })

  it('reports clipboard failures accessibly', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
    })

    render(<NewsEventShareActions title="Campus story" url="https://example.test/story" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }))

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('Unable to share this link.'),
    )
  })
})
