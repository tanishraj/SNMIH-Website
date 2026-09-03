import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

export type CalendarSurfaceClasses = {
  alert: string
  border: string
  navButton: string
  panel: string
  selectContent: string
  selectItem: string
  selectTrigger: string
  separator: string
  supportingText: string
  tabsList: string
  tabsTrigger: string
  toolbar: string
  weekday: string
}

export const resolveCalendarSurfaceClasses = (
  surface: BlockSurface = 'light',
): CalendarSurfaceClasses => {
  const isBrand = surface === 'brand'
  const border = isBrand ? 'border-primary-foreground/20' : 'border-border'

  return {
    alert: 'border-destructive/60 bg-transparent text-current',
    border,
    navButton: cn(
      'relative size-11 rounded-none bg-transparent text-current hover:bg-transparent hover:text-current before:absolute before:inset-1.5 before:rounded-compact before:transition-colors motion-reduce:before:transition-none [&_svg]:relative [&_svg]:z-10',
      isBrand
        ? 'hover:before:bg-primary-foreground/12 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40'
        : 'hover:before:bg-primary/10 focus-visible:border-ring focus-visible:ring-ring/30',
    ),
    panel: cn('rounded-card border bg-transparent text-current', border),
    selectContent: 'rounded-card border-border bg-popover text-popover-foreground',
    selectItem: 'rounded-control',
    selectTrigger: cn(
      'min-w-44 rounded-control bg-transparent text-current data-[size=default]:h-11',
      border,
      isBrand
        ? 'focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40'
        : 'focus-visible:border-ring focus-visible:ring-ring/30',
    ),
    separator: isBrand ? 'bg-primary-foreground/20' : 'bg-border',
    supportingText: isBrand ? 'text-primary-foreground/70' : 'text-muted-foreground',
    tabsList: cn(
      'hidden rounded-control border bg-transparent p-1 group-data-horizontal/tabs:h-11 md:inline-flex',
      border,
    ),
    tabsTrigger: cn(
      'h-full min-w-24 rounded-control border-0 px-4 font-sans text-sm font-semibold after:hidden',
      isBrand
        ? 'text-primary-foreground/70 hover:text-primary-foreground data-[state=active]:bg-primary-foreground data-[state=active]:text-primary focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/40'
        : 'text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/30',
    ),
    toolbar: cn(
      'flex flex-col rounded-card border bg-transparent text-current sm:flex-row sm:items-stretch',
      border,
    ),
    weekday: isBrand
      ? 'bg-transparent text-primary-foreground/70'
      : 'bg-transparent text-muted-foreground',
  }
}
