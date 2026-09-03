'use client'

import { useEffect, useRef, useState } from 'react'

export type AnimatedMetricValueProps = {
  durationMs?: number | null
  prefix?: string | null
  suffix?: string | null
  triggerOnce?: boolean | null
  value: number
}

export function AnimatedMetricValue({
  durationMs = 1200,
  prefix,
  suffix,
  triggerOnce = true,
  value,
}: AnimatedMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    syncPreference()
    mediaQuery.addEventListener('change', syncPreference)

    return () => {
      mediaQuery.removeEventListener('change', syncPreference)
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      const animationFrame = window.requestAnimationFrame(() => setHasStarted(true))
      return () => window.cancelAnimationFrame(animationFrame)
    }

    const node = rootRef.current

    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return
        }

        setHasStarted(true)

        if (triggerOnce) {
          observer.disconnect()
        }
      },
      {
        threshold: 0.35,
      },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [prefersReducedMotion, triggerOnce])

  useEffect(() => {
    if (prefersReducedMotion || !hasStarted) return

    const safeDuration = Math.max(durationMs ?? 1200, 1)
    const stepMs = 16
    const totalSteps = Math.max(1, Math.ceil(safeDuration / stepMs))
    let currentStep = 0

    const interval = window.setInterval(() => {
      currentStep += 1

      const progress = Math.min(currentStep / totalSteps, 1)
      setDisplayValue(Math.round(value * progress))

      if (progress >= 1) {
        window.clearInterval(interval)
      }
    }, stepMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [durationMs, hasStarted, prefersReducedMotion, value])

  const renderedValue = prefersReducedMotion ? value : displayValue
  const text = `${prefix ?? ''}${renderedValue}${suffix ?? ''}`

  return (
    <span ref={rootRef} data-testid="stats-strip-value">
      {text}
    </span>
  )
}
