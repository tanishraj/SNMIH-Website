import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnnouncementBar } from '@/components/announcement/AnnouncementBar'

describe('AnnouncementBar controls', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        removeEventListener: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    cleanup()
    window.sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('gives Pause and Dismiss matching 44px targets and 16px icons', () => {
    render(
      <AnnouncementBar
        dismissible
        items={[{ description: 'First' }, { description: 'Second' }]}
      />,
    )

    const pause = screen.getByRole('button', { name: 'Pause announcements' })
    const dismiss = screen.getByRole('button', { name: 'Dismiss announcement' })

    expect(pause.className).toContain('size-11')
    expect(dismiss.className).toContain('size-11')
    expect(pause.querySelector('svg')?.classList.contains('lucide-pause')).toBe(true)
    expect(dismiss.querySelector('svg')?.classList.contains('lucide-x')).toBe(true)
    expect(pause.querySelector('svg')?.className.baseVal).not.toContain('size-')
    expect(dismiss.querySelector('svg')?.className.baseVal).not.toContain('size-')
  })
})
