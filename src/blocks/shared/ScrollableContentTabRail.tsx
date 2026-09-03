'use client'

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

import {
  getContentTabRailClasses,
  type ContentTabSurface,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { cn } from '@/lib/utils'

const EDGE_TOLERANCE = 1
const EDGE_FADE_WIDTH = '2.75rem'

type OverflowState = {
  end: boolean
  start: boolean
}

const noOverflow: OverflowState = { end: false, start: false }

const getMaskImage = ({ end, start }: OverflowState): string | undefined => {
  if (!start && !end) return undefined

  if (start && end) {
    return `linear-gradient(to right, transparent 0, #000 ${EDGE_FADE_WIDTH}, #000 calc(100% - ${EDGE_FADE_WIDTH}), transparent 100%)`
  }

  if (start) {
    return `linear-gradient(to right, transparent 0, #000 ${EDGE_FADE_WIDTH}, #000 100%)`
  }

  return `linear-gradient(to right, #000 0, #000 calc(100% - ${EDGE_FADE_WIDTH}), transparent 100%)`
}

type DataAttributes = {
  [key: `data-${string}`]: boolean | number | string | undefined
}

type ViewportProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className' | 'onScroll' | 'ref'
> &
  DataAttributes

export type ScrollableContentTabRailProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  children: ReactNode
  surface?: ContentTabSurface
  variant: ContentTabVariant
  viewportClassName?: string
  viewportProps?: ViewportProps
}

export function ScrollableContentTabRail({
  children,
  className,
  surface = 'light',
  variant,
  viewportClassName,
  viewportProps,
  ...frameProps
}: ScrollableContentTabRailProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState<OverflowState>(noOverflow)

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
    const scrollLeft = Math.min(maxScrollLeft, Math.max(0, viewport.scrollLeft))
    const next = {
      start: scrollLeft > EDGE_TOLERANCE,
      end: scrollLeft < maxScrollLeft - EDGE_TOLERANCE,
    }

    setOverflow((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    )
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    measure()
    viewport.addEventListener('scroll', measure, { passive: true })

    let resizeObserver: ResizeObserver | undefined

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(viewport)

      if (viewport.firstElementChild instanceof HTMLElement) {
        resizeObserver.observe(viewport.firstElementChild)
      }
    } else {
      window.addEventListener('resize', measure)
    }

    return () => {
      viewport.removeEventListener('scroll', measure)
      resizeObserver?.disconnect()

      if (!resizeObserver) window.removeEventListener('resize', measure)
    }
  }, [measure])

  const maskImage = getMaskImage(overflow)
  const maskStyle: CSSProperties = maskImage
    ? { maskImage, WebkitMaskImage: maskImage }
    : {}

  return (
    <div
      {...frameProps}
      className={cn(
        'relative min-w-0 overflow-hidden',
        getContentTabRailClasses(variant, surface),
        className,
      )}
      data-scrollable-content-tab-frame="true"
    >
      <div
        {...viewportProps}
        className={cn(
          'no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain',
          viewportClassName,
        )}
        data-overflow-end={overflow.end}
        data-overflow-start={overflow.start}
        data-scrollable-content-tab-viewport="true"
        ref={viewportRef}
        style={{ ...viewportProps?.style, ...maskStyle }}
      >
        {children}
      </div>
    </div>
  )
}
