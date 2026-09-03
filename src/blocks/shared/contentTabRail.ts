import { cn } from '@/lib/utils'

export const CONTENT_TAB_VARIANTS = ['contained', 'pill', 'underline'] as const
export type ContentTabVariant = (typeof CONTENT_TAB_VARIANTS)[number]
export type ContentTabSurface = 'brand' | 'light'

export const normalizeContentTabVariant = (value?: unknown): ContentTabVariant =>
  value === 'contained' || value === 'pill' ? value : 'underline'

const railClasses = {
  light: {
    contained: 'rounded-control border border-border bg-background p-1',
    pill: 'rounded-full border border-border bg-background p-1',
    underline: 'border-b border-border',
  },
  brand: {
    contained:
      'rounded-control border border-primary-foreground/25 bg-primary-foreground/[0.06] p-1',
    pill:
      'rounded-full border border-primary-foreground/25 bg-primary-foreground/[0.06] p-1',
    underline: 'border-b border-primary-foreground/25',
  },
} as const satisfies Record<ContentTabSurface, Record<ContentTabVariant, string>>

export const getContentTabRailClasses = (
  variant: ContentTabVariant,
  surface: ContentTabSurface = 'light',
): string => railClasses[surface][variant]

export const getContentTabClasses = (
  variant: ContentTabVariant,
  active: boolean,
  surface: ContentTabSurface = 'light',
): string =>
  cn(
    'relative inline-flex min-h-11 w-auto shrink-0 items-center justify-center px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 motion-reduce:transition-none',
    surface === 'brand'
      ? 'focus-visible:ring-primary-foreground/40'
      : 'focus-visible:ring-ring/40',
    variant === 'contained' && 'rounded-control',
    variant === 'pill' && 'rounded-full',
    variant === 'underline' && '-mb-px border-b-2 border-transparent',
    active
      ? variant === 'underline'
        ? surface === 'brand'
          ? 'border-primary-foreground text-primary-foreground'
          : 'border-primary text-primary'
        : surface === 'brand'
          ? 'bg-primary-foreground text-primary'
          : 'bg-primary text-primary-foreground'
      : surface === 'brand'
        ? 'text-primary-foreground hover:bg-primary-foreground/10'
        : 'text-muted-foreground hover:text-foreground',
  )
