import type { ComponentPropsWithoutRef } from 'react'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

export type SectionEyebrowSurface = BlockBackground | 'darkOverlay' | 'lightOverlay'

/**
 * Eyebrow typography, exported so elements that should read as an eyebrow but
 * need different semantics — a footer column heading, say — can match it without
 * copying the classes. Pair it with `data-section-eyebrow-surface` to pick up the
 * per-surface accent colour too.
 */
export const sectionEyebrowClasses =
  'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current'

type SectionEyebrowProps = ComponentPropsWithoutRef<'p'> & {
  surface?: SectionEyebrowSurface
}

export function SectionEyebrow({
  children,
  className,
  surface = 'none',
  ...props
}: SectionEyebrowProps) {
  return (
    <p
      {...props}
      className={cn(sectionEyebrowClasses, className)}
      data-section-eyebrow="true"
      data-section-eyebrow-surface={surface}
    >
      {children}
    </p>
  )
}
