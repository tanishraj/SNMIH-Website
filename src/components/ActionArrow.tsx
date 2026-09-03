import { ArrowDown, ArrowRight } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Shared animated action arrow for navigation and downloads.
 *
 * Two stacked arrows inside a clipped box: the resting one sits at -35° and
 * rotates flat as it slides out, while a second, already-flat arrow slides in
 * behind it. The download treatment uses the same clipped exchange vertically.
 *
 * Shared by buttons and text links so both animate identically. Relies on the
 * `group/button` class that `buttonVariants` puts on every button and link.
 */
type ActionArrowProps = ComponentProps<'span'> & {
  direction?: 'down' | 'right'
}

export function ActionArrow({ className, direction = 'right', ...spanProps }: ActionArrowProps) {
  const Icon = direction === 'down' ? ArrowDown : ArrowRight
  const outgoingClassName =
    direction === 'down'
      ? 'absolute left-0 top-0 size-4 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-y-1 group-hover/button:opacity-0 group-focus-visible/button:translate-y-1 group-focus-visible/button:opacity-0 motion-reduce:group-hover/button:translate-y-0 motion-reduce:group-hover/button:opacity-100 motion-reduce:group-focus-visible/button:translate-y-0 motion-reduce:group-focus-visible/button:opacity-100'
      : 'absolute left-0 top-0 size-4 rotate-[-35deg] transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-x-1 group-hover/button:opacity-0 group-hover/button:rotate-0 group-focus-visible/button:translate-x-1 group-focus-visible/button:opacity-0 group-focus-visible/button:rotate-0'
  const incomingClassName =
    direction === 'down'
      ? 'absolute left-0 top-0 size-4 -translate-y-[70%] opacity-0 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-y-0 group-hover/button:opacity-100 group-focus-visible/button:translate-y-0 group-focus-visible/button:opacity-100 motion-reduce:group-hover/button:-translate-y-[70%] motion-reduce:group-hover/button:opacity-0 motion-reduce:group-focus-visible/button:-translate-y-[70%] motion-reduce:group-focus-visible/button:opacity-0'
      : 'absolute left-0 top-0 size-4 translate-x-[-70%] opacity-0 transition-all duration-200 ease-out motion-reduce:transition-none group-hover/button:translate-x-0 group-hover/button:opacity-100 group-focus-visible/button:translate-x-0 group-focus-visible/button:opacity-100'

  return (
    <span
      aria-hidden="true"
      {...spanProps}
      className={cn('relative inline-flex size-4 shrink-0 overflow-hidden', className)}
    >
      <Icon className={outgoingClassName} strokeWidth={2.5} />
      <Icon className={incomingClassName} strokeWidth={2.5} />
    </span>
  )
}
