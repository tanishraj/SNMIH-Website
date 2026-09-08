'use client'

import { Pause, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MotionToggleProps = {
  className?: string
  contextLabel: string
  isPaused: boolean
  onToggle: () => void
  size?: 'icon-sm' | 'icon' | 'icon-lg' | 'icon-xl' | 'icon-2xl' | 'icon-3xl'
  variant?: 'default' | 'ghost' | 'secondary'
}

export function MotionToggle({
  className,
  contextLabel,
  isPaused,
  onToggle,
  size,
  variant = 'secondary',
}: MotionToggleProps) {
  const action = isPaused ? 'Play' : 'Pause'
  const Icon = isPaused ? Play : Pause

  return (
    <Button
      aria-label={`${action} ${contextLabel}`}
      className={cn('touch-manipulation', !size && 'size-11', className)}
      onClick={onToggle}
      size={size ?? 'icon-lg'}
      type="button"
      variant={variant}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
