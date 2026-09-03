'use client'

import { Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MotionToggleProps = {
  className?: string
  contextLabel: string
  isPaused: boolean
  onToggle: () => void
  variant?: 'ghost' | 'secondary'
}

export function MotionToggle({
  className,
  contextLabel,
  isPaused,
  onToggle,
  variant = 'secondary',
}: MotionToggleProps) {
  const action = isPaused ? 'Play' : 'Pause'
  const Icon = isPaused ? Play : Pause

  return (
    <Button
      aria-label={`${action} ${contextLabel}`}
      className={cn('size-11 touch-manipulation', className)}
      onClick={onToggle}
      size="icon-lg"
      type="button"
      variant={variant}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
