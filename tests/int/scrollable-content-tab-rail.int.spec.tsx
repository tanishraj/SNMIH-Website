// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'

type ResizeCallback = ResizeObserverCallback

let resizeCallback: ResizeCallback | undefined
const disconnect = vi.fn()

class ResizeObserverMock {
  constructor(callback: ResizeCallback) {
    resizeCallback = callback
  }

  disconnect = disconnect
  observe = vi.fn()
  unobserve = vi.fn()
}

const setMetrics = (
  viewport: HTMLElement,
  {
    clientWidth,
    scrollLeft,
    scrollWidth,
  }: Record<'clientWidth' | 'scrollLeft' | 'scrollWidth', number>,
) => {
  Object.defineProperties(viewport, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollLeft: { configurable: true, value: scrollLeft, writable: true },
    scrollWidth: { configurable: true, value: scrollWidth },
  })
}

const renderRail = () =>
  render(
    <ScrollableContentTabRail surface="light" variant="pill">
      <div aria-label="Test tabs" className="flex w-max" role="tablist">
        <button role="tab" type="button">
          One
        </button>
        <button role="tab" type="button">
          Two
        </button>
      </div>
    </ScrollableContentTabRail>,
  )

const triggerResize = () => {
  act(() => resizeCallback?.([], {} as ResizeObserver))
}

describe('ScrollableContentTabRail', () => {
  beforeEach(() => {
    resizeCallback = undefined
    disconnect.mockClear()
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('tracks the four overflow states and applies a radius-clipped mask', () => {
    const { container } = renderRail()
    const frame = container.querySelector<HTMLElement>(
      '[data-scrollable-content-tab-frame="true"]',
    )!
    const viewport = container.querySelector<HTMLElement>(
      '[data-scrollable-content-tab-viewport="true"]',
    )!

    expect(frame.className).toContain('rounded-full')

    setMetrics(viewport, { clientWidth: 240, scrollLeft: 0, scrollWidth: 240 })
    triggerResize()
    expect(viewport.dataset.overflowStart).toBe('false')
    expect(viewport.dataset.overflowEnd).toBe('false')
    expect(viewport.style.maskImage).toBe('')

    setMetrics(viewport, { clientWidth: 240, scrollLeft: 0, scrollWidth: 600 })
    triggerResize()
    expect(viewport.dataset.overflowStart).toBe('false')
    expect(viewport.dataset.overflowEnd).toBe('true')
    expect(viewport.style.maskImage).toContain('calc(100% - 2.75rem)')

    viewport.scrollLeft = 120
    fireEvent.scroll(viewport)
    expect(viewport.dataset.overflowStart).toBe('true')
    expect(viewport.dataset.overflowEnd).toBe('true')

    viewport.scrollLeft = 360
    fireEvent.scroll(viewport)
    expect(viewport.dataset.overflowStart).toBe('true')
    expect(viewport.dataset.overflowEnd).toBe('false')
  })

  it('uses passive scrolling and disconnects observation on unmount', () => {
    const addEventListener = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const { unmount } = renderRail()

    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('falls back to window resize when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { container, unmount } = renderRail()
    const viewport = container.querySelector<HTMLElement>(
      '[data-scrollable-content-tab-viewport="true"]',
    )!

    setMetrics(viewport, { clientWidth: 200, scrollLeft: 0, scrollWidth: 500 })
    fireEvent(window, new Event('resize'))

    expect(viewport.dataset.overflowEnd).toBe('true')
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('keeps the semantic tablist supplied by its consumer', () => {
    renderRail()
    expect(screen.getByRole('tablist', { name: 'Test tabs' })).toBeTruthy()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })
})
