'use client'

import type { FocusEventHandler, HTMLAttributes } from 'react'
import { useCallback, useState, useSyncExternalStore } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type MotionInteractionProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onBlurCapture' | 'onFocusCapture' | 'onPointerEnter' | 'onPointerLeave'
>

export type ControllableMotionState = {
  interactionProps: MotionInteractionProps
  isMotionAllowed: boolean
  isUserPaused: boolean
  prefersReducedMotion: boolean
  showMotionControl: boolean
  toggleUserPaused: () => void
}

const getServerSnapshot = () => true

const getSnapshot = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

export function useControllableMotion({ enabled }: { enabled: boolean }): ControllableMotionState {
  const prefersReducedMotion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isFocusPaused, setIsFocusPaused] = useState(false)
  const [isPointerPaused, setIsPointerPaused] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)

  const handleBlurCapture = useCallback<FocusEventHandler<HTMLDivElement>>((event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocusPaused(false)
    }
  }, [])
  const handleFocusCapture = useCallback(() => setIsFocusPaused(true), [])
  const handlePointerEnter = useCallback(() => setIsPointerPaused(true), [])
  const handlePointerLeave = useCallback(() => setIsPointerPaused(false), [])
  const toggleUserPaused = useCallback(() => setIsUserPaused((paused) => !paused), [])

  return {
    interactionProps: {
      onBlurCapture: handleBlurCapture,
      onFocusCapture: handleFocusCapture,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
    isMotionAllowed:
      enabled && !prefersReducedMotion && !isUserPaused && !isPointerPaused && !isFocusPaused,
    isUserPaused,
    prefersReducedMotion,
    showMotionControl: enabled && !prefersReducedMotion,
    toggleUserPaused,
  }
}
