'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BACK_TO_TOP_VISIBILITY_THRESHOLD = 64

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let animationFrame: number | null = null

    const updateVisibility = () => {
      setIsVisible(window.scrollY > BACK_TO_TOP_VISIBILITY_THRESHOLD)
    }

    const scheduleUpdate = () => {
      if (animationFrame !== null) return

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null
        updateVisibility()
      })
    }

    updateVisibility()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    window.scrollTo({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      top: 0,
    })
  }

  return (
    <Button
      type="button"
      size="icon-lg"
      aria-hidden={isVisible ? undefined : true}
      aria-label="Back to top"
      title="Back to top"
      tabIndex={isVisible ? 0 : -1}
      data-back-to-top="true"
      onClick={scrollToTop}
      className={cn(
        'fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom)+var(--cookie-consent-back-to-top-offset,0px))] z-40 size-11 shadow-lg transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom)+var(--cookie-consent-back-to-top-offset,0px))]',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp aria-hidden="true" />
    </Button>
  )
}
