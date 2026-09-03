import { ArrowRight, ChevronRight } from 'lucide-react'

import type { ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'
import { cn } from '@/lib/utils'

export type BreadcrumbAlignment = 'center' | 'left' | 'right'
export type BreadcrumbSeparator = 'arrow' | 'chevron' | 'dot' | 'slash'
export type BreadcrumbSize = 'compact' | 'default'

type BreadcrumbTrailProps = {
  alignment?: BreadcrumbAlignment
  className?: string
  items: ResolvedPageBreadcrumb[]
  linkClassName?: string
  separator?: BreadcrumbSeparator
  showCurrentPage?: boolean
  showHome?: boolean
  size?: BreadcrumbSize
}

type VisibleBreadcrumb = ResolvedPageBreadcrumb & {
  isCurrent: boolean
  originalIndex: number
}

const alignmentClasses = {
  center: 'justify-center text-center',
  left: 'justify-start text-left',
  right: 'justify-end text-right',
} as const

const sizeClasses = {
  compact: 'gap-y-1 text-xs',
  default: 'gap-y-1.5 text-sm',
} as const

const separatorSpacingClasses = {
  compact: 'mx-1',
  default: 'mx-1.5',
} as const

function isHomeBreadcrumb(item: ResolvedPageBreadcrumb, index: number): boolean {
  if (index !== 0) return false

  return item.url === '/' || item.label.trim().toLowerCase() === 'home'
}

export function getVisibleBreadcrumbItems({
  items,
  showCurrentPage = true,
  showHome = true,
}: Pick<BreadcrumbTrailProps, 'items' | 'showCurrentPage' | 'showHome'>): VisibleBreadcrumb[] {
  return items
    .map((item, originalIndex) => ({
      ...item,
      isCurrent: originalIndex === items.length - 1,
      originalIndex,
    }))
    .filter(
      (item) =>
        (showHome || !isHomeBreadcrumb(item, item.originalIndex)) &&
        (showCurrentPage || !item.isCurrent),
    )
}

function Separator({ separator, size }: { separator: BreadcrumbSeparator; size: BreadcrumbSize }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center text-current/40',
        separatorSpacingClasses[size],
      )}
      data-breadcrumb-separator={separator}
    >
      {separator === 'chevron' ? <ChevronRight className="size-[1em]" /> : null}
      {separator === 'arrow' ? <ArrowRight className="size-[1em]" /> : null}
      {separator === 'slash' ? '/' : null}
      {separator === 'dot' ? '•' : null}
    </span>
  )
}

export function BreadcrumbTrail({
  alignment = 'left',
  className,
  items,
  linkClassName,
  separator = 'chevron',
  showCurrentPage = true,
  showHome = true,
  size = 'default',
}: BreadcrumbTrailProps) {
  const visibleItems = getVisibleBreadcrumbItems({ items, showCurrentPage, showHome })

  if (visibleItems.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className={cn(
          'flex min-w-0 flex-wrap items-center text-current/70',
          alignmentClasses[alignment],
          sizeClasses[size],
        )}
      >
        {visibleItems.map((item, visibleIndex) => (
          <li
            className="inline-flex min-w-0 items-center"
            key={`${item.label}-${item.url ?? 'text'}-${item.originalIndex}`}
          >
            {visibleIndex > 0 ? <Separator separator={separator} size={size} /> : null}
            {item.url && !item.isCurrent ? (
              <a
                className={cn(
                  'break-words font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current',
                  linkClassName ?? 'text-current hover:text-current/80',
                )}
                href={item.url}
              >
                {item.label}
              </a>
            ) : (
              <span
                aria-current={item.isCurrent ? 'page' : undefined}
                className={cn('break-words', item.isCurrent && 'font-normal text-current/70')}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
