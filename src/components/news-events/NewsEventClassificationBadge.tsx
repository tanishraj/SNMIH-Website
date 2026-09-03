import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import type { ResolvedNewsEventClassification } from '@/lib/newsEventClassifications'
import { cn } from '@/lib/utils'

type NewsEventClassificationBadgeProps = Omit<
  ComponentProps<typeof Badge>,
  'children' | 'variant'
> & {
  classification: Pick<ResolvedNewsEventClassification, 'badgeLabel' | 'slug'>
}

export function NewsEventClassificationBadge({
  classification,
  className,
  ...props
}: NewsEventClassificationBadgeProps) {
  return (
    <Badge
      className={cn('border-border bg-accent text-accent-foreground', className)}
      data-news-event-classification={classification.slug}
      variant="outline"
      {...props}
    >
      {classification.badgeLabel}
    </Badge>
  )
}
