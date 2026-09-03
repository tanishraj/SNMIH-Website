import { act, createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MarqueeAnnouncementContent } from '@/components/announcement/MarqueeAnnouncementContent'

let prefersReducedMotion = false
const motionPreferenceListeners = new Set<() => void>()

describe('marquee announcement content', () => {
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
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders clickable primary items and an inaccessible duplicate track', () => {
    render(
      createElement(MarqueeAnnouncementContent, {
        durationMs: 18000,
        items: [
          { description: 'First marquee item', title: 'First title', url: '/first' },
          { description: 'Second marquee item', url: '/second' },
        ],
      }),
    )

    const tracks = screen.getAllByTestId('announcement-marquee-track')
    const links = screen.getAllByRole('link')

    expect(tracks).toHaveLength(2)
    expect(tracks[1]?.getAttribute('aria-hidden')).toBe('true')
    expect(links).toHaveLength(2)
    expect(links[0]?.getAttribute('href')).toBe('/first')
    expect(links[1]?.getAttribute('href')).toBe('/second')
    expect(tracks[1]?.querySelectorAll('a')).toHaveLength(2)
    expect(
      Array.from(tracks[1]?.querySelectorAll('a') ?? []).every((link) => link.tabIndex === -1),
    ).toBe(true)
  })

  it('persists Pause and resumes after Play', () => {
    render(
      createElement(MarqueeAnnouncementContent, {
        durationMs: 18000,
        items: [{ description: 'First item', url: '/first' }, { description: 'Second item' }],
      }),
    )

    const primaryTrack = screen.getAllByTestId('announcement-marquee-track')[0]

    expect(primaryTrack?.getAttribute('style')).toContain('animation-play-state: running')

    fireEvent.click(screen.getByRole('button', { name: 'Pause marquee' }))

    expect(primaryTrack?.getAttribute('style')).toContain('animation-play-state: paused')
    expect(screen.getByRole('button', { name: 'Play marquee' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Play marquee' }))

    expect(primaryTrack?.getAttribute('style')).toContain('animation-play-state: running')
  })

  it('keeps pointer and focus pauses independent', () => {
    render(
      createElement(MarqueeAnnouncementContent, {
        durationMs: 18000,
        items: [
          { description: 'Focus item', url: '/focus' },
          { description: 'Second item', url: '/second' },
        ],
      }),
    )

    const marquee = screen.getByTestId('announcement-marquee')
    const primaryTrack = screen.getAllByTestId('announcement-marquee-track')[0]
    const link = screen.getByRole('link', { name: 'Focus item' })

    fireEvent.pointerEnter(marquee)
    fireEvent.focus(link)
    fireEvent.pointerLeave(marquee)

    expect(primaryTrack?.getAttribute('style')).toContain('animation-play-state: paused')

    fireEvent.blur(link, { relatedTarget: null })

    expect(primaryTrack?.getAttribute('style')).toContain('animation-play-state: running')
  })

  it('renders one static wrapping track under reduced motion', () => {
    prefersReducedMotion = true

    render(
      createElement(MarqueeAnnouncementContent, {
        durationMs: 18000,
        items: [{ description: 'First item', url: '/first' }, { description: 'Second item' }],
      }),
    )

    const tracks = screen.getAllByTestId('announcement-marquee-track')

    expect(tracks).toHaveLength(1)
    expect(tracks[0]?.className).toContain('flex-wrap')
    expect(tracks[0]?.className).toContain('whitespace-normal')
    expect(tracks[0]?.className).not.toContain('animate-marquee')
    expect(tracks[0]?.getAttribute('style')).toBeNull()
    expect(screen.queryByRole('button', { name: /marquee/i })).toBeNull()
  })

  it('renders one item statically without duplicate content or controls', () => {
    render(
      createElement(MarqueeAnnouncementContent, {
        items: [{ description: 'Only item', url: '/only' }],
      }),
    )

    const tracks = screen.getAllByTestId('announcement-marquee-track')

    expect(tracks).toHaveLength(1)
    expect(tracks[0]?.className).not.toContain('animate-marquee')
    expect(screen.getAllByRole('link', { name: 'Only item' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /marquee/i })).toBeNull()
  })

  it('switches to the static contract when content shrinks to one item', () => {
    const view = render(
      createElement(MarqueeAnnouncementContent, {
        items: [{ description: 'First item' }, { description: 'Second item' }],
      }),
    )

    view.rerender(
      createElement(MarqueeAnnouncementContent, {
        items: [{ description: 'Only item' }],
      }),
    )

    expect(screen.getAllByTestId('announcement-marquee-track')).toHaveLength(1)
    expect(screen.getByText('Only item')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /marquee/i })).toBeNull()
  })

  it('reacts when reduced-motion preference changes after mount', () => {
    render(
      createElement(MarqueeAnnouncementContent, {
        items: [{ description: 'First item' }, { description: 'Second item' }],
      }),
    )

    expect(screen.getAllByTestId('announcement-marquee-track')).toHaveLength(2)

    act(() => {
      prefersReducedMotion = true
      motionPreferenceListeners.forEach((listener) => listener())
    })

    expect(screen.getAllByTestId('announcement-marquee-track')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /marquee/i })).toBeNull()
  })
})
