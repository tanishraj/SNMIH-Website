import { act } from 'react'
import { createElement } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let prefersReducedMotion = false
const motionPreferenceListeners = new Set<() => void>()

vi.mock('framer-motion', async () => {
  const React = await import('react')

  return {
    AnimatePresence: ({ children, mode }: { children: ReactNode; mode?: string }) =>
      React.createElement('div', { 'data-presence-mode': mode }, children),
    motion: {
      div: React.forwardRef<
        HTMLDivElement,
        HTMLAttributes<HTMLDivElement> & {
          animate?: unknown
          exit?: unknown
          initial?: unknown
          transition?: { duration?: number }
        }
      >(function MotionDiv(
        { animate: _animate, exit: _exit, initial: _initial, transition, ...props },
        ref,
      ) {
        return React.createElement('div', {
          ...props,
          'data-duration': transition?.duration,
          ref,
        })
      }),
    },
  }
})

import { RotatingAnnouncementContent } from '@/components/announcement/RotatingAnnouncementContent'

describe('rotating announcement content', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    prefersReducedMotion = false
    motionPreferenceListeners.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        addEventListener: (_event: string, listener: () => void) =>
          motionPreferenceListeners.add(listener),
        get matches() {
          return prefersReducedMotion
        },
        media: '(prefers-reduced-motion: reduce)',
        removeEventListener: (_event: string, listener: () => void) =>
          motionPreferenceListeners.delete(listener),
      })),
    )
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    cleanup()
  })

  it('renders a single item without advancing away from it', () => {
    render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 4000,
        items: [{ description: 'One description', url: '/one' }],
      }),
    )

    expect(screen.getByText('One description')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'One description' }).getAttribute('href')).toBe('/one')
    expect(screen.queryByRole('button', { name: /announcements/i })).toBeNull()

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.getByText('One description')).toBeTruthy()
  })

  it('rotates through multiple items one at a time', () => {
    render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [
          { description: 'First description', title: 'First title' },
          { description: 'Second description', title: 'Second title' },
        ],
      }),
    )

    expect(screen.getByText('First title')).toBeTruthy()
    expect(screen.getByText('First description')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2325)
    })

    expect(screen.getByText('Second title')).toBeTruthy()
    expect(screen.getByText('Second description')).toBeTruthy()
    expect(screen.queryByText('First title')).toBeNull()
    expect(screen.queryByText('First description')).toBeNull()
  })

  it('uses wait-mode presence and renders one announcement layer', () => {
    const { container } = render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [
          { description: 'First description', title: 'First title' },
          { description: 'Second description', title: 'Second title' },
        ],
      }),
    )

    expect(container.querySelector('[data-presence-mode="wait"]')).toBeTruthy()
    expect(screen.getAllByTestId('announcement-item')).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getAllByTestId('announcement-item')).toHaveLength(1)
  })

  it('pauses rotation while hovered and resumes after hover ends', () => {
    render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [
          { description: 'First description', title: 'First title' },
          { description: 'Second description', title: 'Second title' },
        ],
      }),
    )

    const rotator = screen.getByTestId('announcement-rotator')

    act(() => {
      fireEvent.pointerEnter(rotator)
    })

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText('Second title')).toBeNull()
    expect(screen.queryByText('Second description')).toBeNull()

    act(() => {
      fireEvent.pointerLeave(rotator)
    })

    act(() => {
      vi.advanceTimersByTime(2325)
    })

    expect(screen.getByText('Second title')).toBeTruthy()
    expect(screen.getByText('Second description')).toBeTruthy()
  })

  it('supports horizontal transitions with the same one-at-a-time rotation model', () => {
    render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [
          { description: 'First horizontal description', title: 'First horizontal title' },
          { description: 'Second horizontal description', title: 'Second horizontal title' },
        ],
        mode: 'horizontal',
      }),
    )

    expect(screen.getByText('First horizontal title')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2325)
    })

    expect(screen.getByText('Second horizontal title')).toBeTruthy()
    expect(screen.getByText('Second horizontal description')).toBeTruthy()
    expect(screen.queryByText('First horizontal title')).toBeNull()
  })

  it('persists the visitor pause choice until Play is selected', () => {
    render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [{ description: 'First description' }, { description: 'Second description' }],
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pause announcements' }))

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.getByText('First description')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Play announcements' }))

    act(() => {
      vi.advanceTimersByTime(2325)
    })

    expect(screen.getByText('Second description')).toBeTruthy()
  })

  it('keeps pointer and focus pauses independent', () => {
    render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [
          { description: 'First description', url: '/first' },
          { description: 'Second description', url: '/second' },
        ],
      }),
    )

    const rotator = screen.getByTestId('announcement-rotator')
    const currentLink = screen.getByRole('link', { name: 'First description' })

    fireEvent.pointerEnter(rotator)
    fireEvent.focus(currentLink)
    fireEvent.pointerLeave(rotator)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.getByText('First description')).toBeTruthy()

    fireEvent.blur(currentLink, { relatedTarget: null })

    act(() => {
      vi.advanceTimersByTime(2325)
    })

    expect(screen.getByText('Second description')).toBeTruthy()
  })

  it('stops replacement and transitions when reduced motion is preferred', () => {
    prefersReducedMotion = true

    render(
      createElement(RotatingAnnouncementContent, {
        items: [{ description: 'First description' }, { description: 'Second description' }],
      }),
    )

    expect(screen.getByTestId('announcement-item').getAttribute('data-duration')).toBe('0')
    expect(screen.queryByRole('button', { name: /announcements/i })).toBeNull()

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.getByText('First description')).toBeTruthy()
    expect(screen.queryByText('Second description')).toBeNull()
  })

  it('cleans up rotation when content shrinks to one item', () => {
    const view = render(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [{ description: 'First description' }, { description: 'Second description' }],
      }),
    )

    view.rerender(
      createElement(RotatingAnnouncementContent, {
        intervalMs: 2000,
        items: [{ description: 'Only description' }],
      }),
    )

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.getByText('Only description')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /announcements/i })).toBeNull()
  })
})
