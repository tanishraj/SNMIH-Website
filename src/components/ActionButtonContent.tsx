import { ActionArrow } from '@/components/ActionArrow'
import type { CmsActionIndicator, CmsActionIndicatorPosition } from '@/lib/cmsLinks'

type ActionButtonContentProps = {
  indicator?: CmsActionIndicator
  indicatorPosition?: CmsActionIndicatorPosition
  label: string
  showArrow?: boolean
}

export function ActionButtonContent({
  indicator,
  indicatorPosition,
  label,
  showArrow = false,
}: ActionButtonContentProps) {
  const resolvedPosition =
    indicator === 'download' ? (indicatorPosition ?? 'left') : ('right' as const)
  const indicatorNode =
    indicator === 'download' ? (
      <ActionArrow
        data-action-indicator="download"
        data-icon={resolvedPosition === 'left' ? 'inline-start' : 'inline-end'}
        direction="down"
      />
    ) : indicator === 'none' || !showArrow ? null : (
      <ActionArrow data-action-arrow="true" data-icon="inline-end" />
    )

  return (
    <>
      {resolvedPosition === 'left' ? indicatorNode : null}
      <span>{label}</span>
      {resolvedPosition === 'right' ? indicatorNode : null}
    </>
  )
}
