'use client'

import { ArrowUpIcon, ChevronDownIcon } from 'lucide-react'
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react'

import { cn } from '@/lib/utils'

const EDGE_TOLERANCE = 2
const EDGE_FADE = '2.5rem'

type Overflow = { above: boolean; below: boolean }
const none: Overflow = { above: false, below: false }

// Content fades at whichever edge still has more to show; both when the reader is mid-list.
const maskFor = ({ above, below }: Overflow): string | undefined => {
  if (!above && !below) return undefined
  const top = above ? `transparent 0, #000 ${EDGE_FADE}` : '#000 0'
  const bottom = below ? `#000 calc(100% - ${EDGE_FADE}), transparent 100%` : '#000 100%'
  return `linear-gradient(to bottom, ${top}, ${bottom})`
}

type Props = ComponentPropsWithoutRef<'div'> & {
  /** When false the list is not clipped, so no hint is shown. */
  bounded: boolean
  /** Plural noun for the hint, e.g. "departments". */
  itemsLabel: string
}

/**
 * A vertically scrolling list that says so: the clipped edge fades, and a pill at the foot offers
 * "More departments" until the end, then "Back to top". Nothing renders until the list has measured.
 */
export function DepartmentScrollRegion({
  bounded,
  children,
  className,
  itemsLabel,
  style,
  ...props
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState<Overflow>(none)

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const clipped = getComputedStyle(viewport).overflowY !== 'visible'
    const max = clipped ? Math.max(0, viewport.scrollHeight - viewport.clientHeight) : 0
    const next = {
      above: viewport.scrollTop > EDGE_TOLERANCE,
      below: viewport.scrollTop < max - EDGE_TOLERANCE,
    }
    setOverflow((current) =>
      current.above === next.above && current.below === next.below ? current : next,
    )
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !bounded) return
    measure()
    viewport.addEventListener('scroll', measure, { passive: true })
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(viewport)
    if (!observer) window.addEventListener('resize', measure)
    return () => {
      viewport.removeEventListener('scroll', measure)
      observer?.disconnect()
      if (!observer) window.removeEventListener('resize', measure)
    }
  }, [bounded, measure])

  const nudge = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    viewport.scrollTo({
      top: overflow.below ? viewport.scrollTop + viewport.clientHeight * 0.8 : 0,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  const mask = maskFor(overflow)
  const maskStyle: CSSProperties = mask ? { maskImage: mask, WebkitMaskImage: mask } : {}
  const showHint = bounded && (overflow.below || overflow.above)

  return (
    <div className={cn('relative min-w-0', bounded && 'lg:flex lg:min-h-0 lg:flex-1 lg:flex-col')}>
      <div
        {...props}
        className={className}
        data-overflow-above={bounded ? overflow.above : undefined}
        data-overflow-below={bounded ? overflow.below : undefined}
        ref={viewportRef}
        style={{ ...style, ...maskStyle }}
      >
        {children}
      </div>
      {showHint ? (
        <button
          type="button"
          onClick={nudge}
          data-pg-fee-scroll-hint={overflow.below ? 'more' : 'top'}
          className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card/95 py-1.5 pl-3.5 pr-3 text-xs font-medium text-card-foreground shadow-[0_2px_10px_-2px_rgba(0,0,0,0.18)] backdrop-blur transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:inline-flex motion-reduce:transition-none"
        >
          {overflow.below ? (
            <>
              More {itemsLabel}
              <ChevronDownIcon aria-hidden="true" className="size-3.5" />
            </>
          ) : (
            <>
              Back to top
              <ArrowUpIcon aria-hidden="true" className="size-3.5" />
            </>
          )}
        </button>
      ) : null}
    </div>
  )
}
