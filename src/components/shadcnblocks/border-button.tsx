import { type ComponentProps, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

export type BorderCornerStyle = 'l' | 'plus' | 'square' | 'double' | 'dot'

const cornerPlacements = [
  { className: 'absolute -bottom-px -left-px' },
  { className: 'absolute -bottom-px -right-px scale-x-[-1]' },
  { className: 'absolute -top-px -left-px scale-y-[-1]' },
  { className: 'absolute -top-px -right-px scale-[-1]' },
] as const

const overflowVisibleStyles: Partial<Record<BorderCornerStyle, boolean>> = {
  plus: true,
  double: true,
  dot: true,
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1,
  strokeLinecap: 'square' as const,
}

const cornerPaths: Record<BorderCornerStyle, ReactNode> = {
  l: (
    <>
      <path d="M0 0V12" {...stroke} />
      <path d="M0 12H12" {...stroke} />
    </>
  ),
  plus: (
    <>
      <path d="M-6 12 H6" {...stroke} />
      <path d="M0 6 V18" {...stroke} />
    </>
  ),
  square: <rect x="0" y="8" width="4" height="4" {...stroke} />,
  double: (
    <>
      <path d="M0 0 V12" {...stroke} />
      <path d="M0 12 H12" {...stroke} />
      <path d="M-2 2 V14" {...stroke} />
      <path d="M-2 14 H10" {...stroke} />
    </>
  ),
  dot: (
    <>
      <circle cx="0" cy="12" r="1.25" fill="currentColor" />
      <path d="M-4.5 12 H0" {...stroke} />
      <path d="M0 12 V16.5" {...stroke} />
    </>
  ),
}

const CornerArt = ({ style, className }: { style: BorderCornerStyle; className?: string }) => {
  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none size-3', className)}
      fill="none"
      overflow={overflowVisibleStyles[style] ? 'visible' : undefined}
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      {cornerPaths[style]}
    </svg>
  )
}

type BorderButtonProps = Omit<
  ComponentProps<typeof Button>,
  'children' | 'className' | 'variant'
> & {
  children: ReactNode
  variant?: NonNullable<ComponentProps<typeof Button>['variant']>
  corners?: BorderCornerStyle
  className?: string
}

export const BorderButton = ({
  children,
  variant = 'outline',
  corners = 'l',
  className,
}: BorderButtonProps) => {
  return (
    <Button
      className={cn(className, 'relative overflow-visible rounded-none px-4! shadow-none')}
      variant={variant}
    >
      {children}
      {cornerPlacements.map((placement) => (
        <CornerArt key={placement.className} className={placement.className} style={corners} />
      ))}
    </Button>
  )
}
