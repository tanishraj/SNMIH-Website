import { ContentActions } from '@/components/ContentActions'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

type BlockFooterActionsProps = {
  actions?: CmsActionValue[] | null
  alignment?: 'center' | 'left' | 'right'
  className?: string
}

export function BlockFooterActions({
  actions,
  alignment = 'center',
  className,
}: BlockFooterActionsProps) {
  const resolved = resolveCmsActions(actions)
  if (!resolved.length) return null

  return (
    <ContentActions actions={resolved} alignment={alignment} className={cn('mt-10', className)} />
  )
}
