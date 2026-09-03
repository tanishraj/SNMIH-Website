import fs from 'node:fs'
import path from 'node:path'
import { act } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BackToTopButton } from '@/components/global/BackToTopButton'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

let animationFrames: FrameRequestCallback[]
let consentBounds = { left: 0, right: 360, top: 700 }
let resizeObserverCallback: ResizeObserverCallback | null

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value })
}

function flushAnimationFrame() {
  const callbacks = animationFrames.splice(0)
  act(() => callbacks.forEach((callback) => callback(0)))
}

function makeRect({ left, right, top }: { left: number; right: number; top: number }) {
  return {
    bottom: 800,
    height: 800 - top,
    left,
    right,
    top,
    width: right - left,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

describe('BackToTopButton', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    animationFrames = []
    consentBounds = { left: 0, right: 360, top: 700 }
    resizeObserverCallback = null
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
    document.documentElement.style.removeProperty('--cookie-consent-back-to-top-offset')
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    setScrollY(0)
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationFrames.push(callback)
        return animationFrames.length
      }),
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    )
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserverMock {
        constructor(callback: ResizeObserverCallback) {
          resizeObserverCallback = callback
        }

        disconnect = vi.fn()
        observe = vi.fn()
        unobserve = vi.fn()
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.dataset.backToTop === 'true') {
        return makeRect({ left: 300, right: 344, top: 740 })
      }
      if (this.dataset.cookieConsentSurface) return makeRect(consentBounds)
      return makeRect({ left: 0, right: 0, top: 800 })
    })
  })

  afterEach(() => {
    cleanup()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
    document.documentElement.style.removeProperty('--cookie-consent-back-to-top-offset')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reveals after 64px and hides the inactive control from interaction', () => {
    const { container } = render(<BackToTopButton />)
    const button = container.querySelector('[data-back-to-top="true"]') as HTMLButtonElement

    expect(button.getAttribute('aria-hidden')).toBe('true')
    expect(button.tabIndex).toBe(-1)

    setScrollY(64)
    fireEvent.scroll(window)
    flushAnimationFrame()
    expect(button.getAttribute('aria-hidden')).toBe('true')

    setScrollY(65)
    fireEvent.scroll(window)
    flushAnimationFrame()

    expect(screen.getByRole('button', { name: 'Back to top' })).toBe(button)
    expect(button.getAttribute('aria-hidden')).toBeNull()
    expect(button.tabIndex).toBe(0)
  })

  it('uses smooth scrolling unless reduced motion is requested', () => {
    const { rerender } = render(<BackToTopButton />)
    const button = document.querySelector('[data-back-to-top="true"]') as HTMLButtonElement

    fireEvent.click(button)
    expect(window.scrollTo).toHaveBeenLastCalledWith({ behavior: 'smooth', top: 0 })

    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList)
    rerender(<BackToTopButton />)
    fireEvent.click(button)

    expect(window.scrollTo).toHaveBeenLastCalledWith({ behavior: 'auto', top: 0 })
  })

  it('uses the shared themed control and mobile safe-area positioning', () => {
    const { container } = render(<BackToTopButton />)
    const button = container.querySelector('[data-back-to-top="true"]') as HTMLButtonElement

    expect(button.dataset.slot).toBe('button')
    expect(button.className).toContain('z-40')
    expect(button.className).toContain('size-11')
    expect(button.className).toContain('env(safe-area-inset-bottom)')
    expect(button.className).toContain('var(--cookie-consent-back-to-top-offset,0px)')
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('removes global listeners and a queued frame on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const view = render(<BackToTopButton />)

    fireEvent.scroll(window)
    view.unmount()

    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })

  it('moves above an overlapping bottom consent surface and clears after dismissal', async () => {
    render(
      <>
        <BackToTopButton />
        <CookieConsentBanner enabled variant="bottom-bar" />
      </>,
    )

    await screen.findByRole('dialog', { name: 'Cookie consent' })
    await waitFor(() =>
      expect(
        document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
      ).toBe('100px'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reject non-essential' }))

    await waitFor(() =>
      expect(
        document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
      ).toBe(''),
    )
  })

  it('uses rendered overlap so a left floating card only offsets when it reaches the button', async () => {
    consentBounds = { left: 16, right: 280, top: 660 }
    render(
      <>
        <BackToTopButton />
        <CookieConsentBanner enabled variant="floating-card" position="bottom-left" />
      </>,
    )

    await screen.findByRole('dialog', { name: 'Cookie consent' })
    expect(
      document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
    ).toBe('')

    consentBounds = { left: 16, right: 360, top: 660 }
    act(() => resizeObserverCallback?.([], {} as ResizeObserver))

    expect(
      document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
    ).toBe('140px')
  })

  it('does not publish a collision offset for modal consent', async () => {
    render(
      <>
        <BackToTopButton />
        <CookieConsentBanner enabled variant="modal" heading="Privacy choices" />
      </>,
    )

    await screen.findByRole('dialog', { name: 'Privacy choices' })
    expect(
      document.documentElement.style.getPropertyValue('--cookie-consent-back-to-top-offset'),
    ).toBe('')
  })

  it('is mounted once in the public frontend layout', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'),
      'utf8',
    )

    expect(source).toContain(
      "import { BackToTopButton } from '@/components/global/BackToTopButton'",
    )
    expect(source.match(/<BackToTopButton \/>/g)).toHaveLength(1)
  })
})
