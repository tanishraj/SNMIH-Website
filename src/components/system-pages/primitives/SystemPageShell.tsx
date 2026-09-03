import type { ReactNode } from 'react'

import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { SystemPageVariant } from '@/components/system-pages/types'
import { cn } from '@/lib/utils'

export function SystemPageShell({
  appearance,
  children,
  className,
  variant,
}: {
  appearance?: BlockAppearance | null
  children: ReactNode
  className?: string
  variant: SystemPageVariant
}) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  return (
    <section
      data-system-page-root="true"
      data-system-page-variant={variant}
      className={cn(
        'flex min-h-screen items-center justify-center bg-background px-6 py-16 text-center text-foreground md:px-10',
        appearanceClasses.className,
        className,
      )}
    >
      {children}
    </section>
  )
}
