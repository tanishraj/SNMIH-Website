// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { launchConfetti } from '@/components/celebration/confetti'
import { getConfettiConeGeometry } from '@/components/celebration/confettiCones'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.querySelectorAll('[data-celebration-confetti]').forEach((node) => node.remove())
})

const mockCanvas = (reducedMotion: boolean) => {
  const translate = vi.fn()
  const context = new Proxy(
    { translate },
    {
      get: (target, key) => {
        if (key === 'translate') return target.translate
        if (key === 'createLinearGradient') return () => ({ addColorStop: vi.fn() })
        return vi.fn()
      },
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }))
  return translate
}

describe('celebration party cones', () => {
  it.each([
    [390, 844],
    [1440, 900],
  ])('keeps both mouths inset and mirrored at %sx%s', (width, height) => {
    const { left, right } = getConfettiConeGeometry(width, height)
    expect(left.x).toBeGreaterThan(0)
    expect(right.x).toBeLessThan(width)
    expect(left.x + right.x).toBe(width)
    expect(left.y).toBe(right.y)
    expect(left.y).toBeGreaterThan(height / 2)
    expect(left.y).toBeLessThan(height)
  })

  it('shows static cones without timers or animation for reduced motion and cleans up on close', () => {
    const translate = mockCanvas(true)
    const frames = vi.spyOn(window, 'requestAnimationFrame')
    const stop = launchConfetti({ pieces: 20, shots: 1, speed: 'medium' })
    expect(document.querySelector('[data-celebration-confetti]')).not.toBeNull()
    expect(translate).toHaveBeenCalledTimes(2)
    expect(frames).not.toHaveBeenCalled()
    window.dispatchEvent(new Event('resize'))
    expect(translate).toHaveBeenCalledTimes(4)
    stop()
    expect(document.querySelector('[data-celebration-confetti]')).toBeNull()
    window.dispatchEvent(new Event('resize'))
    expect(translate).toHaveBeenCalledTimes(4)
  })

  it('launches particles just above and inward from both visible mouths', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const translate = mockCanvas(false)
    let draw: FrameRequestCallback | undefined
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      draw = callback
      return 1
    })
    const stop = launchConfetti({ pieces: 20, shots: 1, speed: 'medium' })
    vi.advanceTimersByTime(0)
    translate.mockClear()
    draw?.(0)
    const { left, right } = getConfettiConeGeometry(window.innerWidth, window.innerHeight)
    expect(translate.mock.calls[0]).toEqual([left.x, left.y])
    expect(translate.mock.calls[1]).toEqual([right.x, right.y])
    const [lx, ly] = translate.mock.calls[2]!
    const [rx, ry] = translate.mock.calls[3]!
    expect(lx).toBeGreaterThan(left.x)
    expect(lx).toBeLessThan(left.x + 20)
    expect(rx).toBeLessThan(right.x)
    expect(rx).toBeGreaterThan(right.x - 20)
    expect(ly).toBeLessThan(left.y)
    expect(ry).toBeLessThan(right.y)
    stop()
    expect(vi.getTimerCount()).toBe(0)
    expect(document.querySelector('[data-celebration-confetti]')).toBeNull()
  })
})
