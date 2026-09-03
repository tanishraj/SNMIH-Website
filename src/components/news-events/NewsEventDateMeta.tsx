import { CalendarDays } from 'lucide-react'

import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'text-sm [&_svg]:size-4',
  xs: 'text-xs [&_svg]:size-3.5',
} as const

export function NewsEventDateMeta({
  className,
  dateISO,
  dateLabel,
  size = 'xs',
}: {
  className?: string
  dateISO?: string
  dateLabel: string
  size?: keyof typeof sizeClasses
}) {
  return (
    <time
      className={cn(
        'inline-flex items-center gap-1.5 font-sans font-normal tracking-normal tabular-nums',
        sizeClasses[size],
        className,
      )}
      dateTime={dateISO}
    >
      <CalendarDays aria-hidden="true" />
      {dateLabel}
    </time>
  )
}
