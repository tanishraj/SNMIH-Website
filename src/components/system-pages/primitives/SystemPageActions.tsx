import { ArrowRight, ExternalLink } from 'lucide-react'

import type { SystemPageActionLink } from '@/components/system-pages/types'
import { Button } from '@/components/ui/button'

function ActionButton({
  action,
  variant,
}: {
  action?: SystemPageActionLink | null
  variant: 'default' | 'outline'
}) {
  if (!action?.label || !action.url) {
    return null
  }

  const isExternal = /^https?:\/\//.test(action.url)
  const openInNewTab = action.openInNewTab || isExternal

  return (
    <Button asChild size="lg" variant={variant} className="animate-[fade-in_.7s_ease-out_.3s_both]">
      <a
        href={action.url}
        target={openInNewTab ? '_blank' : undefined}
        rel={openInNewTab ? 'noreferrer noopener' : undefined}
      >
        {action.label}
        {variant === 'default' ? <ArrowRight data-icon="inline-end" /> : null}
        {variant === 'outline' && openInNewTab ? <ExternalLink data-icon="inline-end" /> : null}
      </a>
    </Button>
  )
}

export function SystemPageActions({
  primaryAction,
  secondaryAction,
}: {
  primaryAction?: SystemPageActionLink | null
  secondaryAction?: SystemPageActionLink | null
}) {
  const hasPrimary = Boolean(primaryAction?.label && primaryAction.url)
  const hasSecondary = Boolean(secondaryAction?.label && secondaryAction.url)

  if (!hasPrimary && !hasSecondary) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ActionButton action={primaryAction} variant="default" />
      <ActionButton action={secondaryAction} variant="outline" />
    </div>
  )
}
