import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MotionToggle } from '@/components/motion/MotionToggle'
import { useControllableMotion } from '@/components/motion/useControllableMotion'

type MotionPreferenceHarness = {
  listenerCount: () => number
  setReducedMotion: (reduced: boolean) => void
}

function installMotionPreference(initialReducedMotion = false): MotionPreferenceHarness {
  let reducedMotion = initialReducedMotion
  const listeners = new Set<() => void>()
  const mediaQuery = {
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    get matches() {
      return reducedMotion
    },
    media: '(prefers-reduced-motion: reduce)',
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQuery),
  )

  return {
    listenerCount: () => listeners.size,
    setReducedMotion: (reduced) => {
      act(() => {
        reducedMotion = reduced
        listeners.forEach((listener) => listener())
      })
    },
  }
}

function MotionHarness({ enabled = true }: { enabled?: boolean }) {
  const motion = useControllableMotion({ enabled })

  return (
    <div data-testid="motion-region" {...motion.interactionProps}>
      <output data-testid="motion-allowed">{String(motion.isMotionAllowed)}</output>
      <output data-testid="motion-paused">{String(motion.isUserPaused)}</output>
      {motion.showMotionControl ? (
        <MotionToggle
          contextLabel="test motion"
          isPaused={motion.isUserPaused}
          onToggle={motion.toggleUserPaused}
        />
      ) : null}
      <button type="button">Inside control</button>
      <button type="button">Second control</button>
    </div>
  )
}

describe('controllable motion', () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('pauses independently for pointer and focus interactions', () => {
    installMotionPreference()
    render(<MotionHarness />)

    const region = screen.getByTestId('motion-region')
    const firstControl = screen.getByRole('button', { name: 'Inside control' })

    expect(screen.getByTestId('motion-allowed').textContent).toBe('true')

    fireEvent.pointerEnter(region)
    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')

    fireEvent.focus(firstControl)
    fireEvent.pointerLeave(region)
    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')

    fireEvent.blur(firstControl, { relatedTarget: null })
    expect(screen.getByTestId('motion-allowed').textContent).toBe('true')
  })

  it('does not resume while focus moves between controls inside the region', () => {
    installMotionPreference()
    render(<MotionHarness />)

    const firstControl = screen.getByRole('button', { name: 'Inside control' })
    const secondControl = screen.getByRole('button', { name: 'Second control' })

    fireEvent.focus(firstControl)
    fireEvent.blur(firstControl, { relatedTarget: secondControl })
    fireEvent.focus(secondControl)

    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')

    fireEvent.blur(secondControl, { relatedTarget: null })
    expect(screen.getByTestId('motion-allowed').textContent).toBe('true')
  })

  it('retains an explicit choice while interaction pauses remain temporary', () => {
    installMotionPreference()
    render(<MotionHarness />)

    fireEvent.click(screen.getByRole('button', { name: 'Pause test motion' }))

    expect(screen.getByTestId('motion-paused').textContent).toBe('true')
    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')

    const playButton = screen.getByRole('button', { name: 'Play test motion' })
    fireEvent.focus(playButton)
    fireEvent.click(playButton)

    expect(screen.getByTestId('motion-paused').textContent).toBe('false')
    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')

    fireEvent.blur(playButton, { relatedTarget: null })
    expect(screen.getByTestId('motion-allowed').textContent).toBe('true')
  })

  it('uses an accessible native control with a 44px target', () => {
    installMotionPreference()
    render(<MotionHarness />)

    const button = screen.getByRole('button', { name: 'Pause test motion' })

    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    expect(button.className).toContain('size-11')
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('gives reduced motion precedence and reacts to preference changes', () => {
    const preference = installMotionPreference()
    render(<MotionHarness />)

    expect(screen.getByTestId('motion-allowed').textContent).toBe('true')
    expect(screen.getByRole('button', { name: 'Pause test motion' })).toBeTruthy()

    preference.setReducedMotion(true)

    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')
    expect(screen.queryByRole('button', { name: /test motion/i })).toBeNull()

    preference.setReducedMotion(false)

    expect(screen.getByTestId('motion-allowed').textContent).toBe('true')
    expect(screen.getByRole('button', { name: 'Pause test motion' })).toBeTruthy()
  })

  it('does not expose a control when automatic motion is unavailable', () => {
    installMotionPreference()
    render(<MotionHarness enabled={false} />)

    expect(screen.getByTestId('motion-allowed').textContent).toBe('false')
    expect(screen.queryByRole('button', { name: /test motion/i })).toBeNull()
  })

  it('removes its media-query subscription on unmount', () => {
    const preference = installMotionPreference()
    const view = render(<MotionHarness />)

    expect(preference.listenerCount()).toBe(1)

    view.unmount()

    expect(preference.listenerCount()).toBe(0)
  })
})
