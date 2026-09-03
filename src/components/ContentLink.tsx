import type { ComponentProps, CSSProperties } from 'react'

import { ActionArrow } from '@/components/ActionArrow'
import { buttonVariants } from '@/components/ui/button'
import type { CmsActionIndicator, CmsActionIndicatorPosition } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

type ContentLinkProps = Omit<ComponentProps<'a'>, 'children' | 'href' | 'rel' | 'target'> & {
  arrowStyle?: CSSProperties
  href: string
  indicator?: CmsActionIndicator
  indicatorPosition?: CmsActionIndicatorPosition
  label: string
  openInNewTab?: boolean
}

export function ContentLink({
  arrowStyle,
  className,
  href,
  indicator,
  indicatorPosition,
  label,
  openInNewTab,
  ...anchorProps
}: ContentLinkProps) {
  const resolvedPosition =
    indicator === 'download' ? (indicatorPosition ?? 'left') : ('right' as const)
  const indicatorNode =
    indicator === 'download' ? (
      <ActionArrow
        data-action-indicator="download"
        data-icon={resolvedPosition === 'left' ? 'inline-start' : 'inline-end'}
        direction="down"
        style={arrowStyle}
      />
    ) : indicator === 'none' ? null : (
      <ActionArrow data-content-link-arrow="true" data-icon="inline-end" style={arrowStyle} />
    )

  return (
    <a
      {...anchorProps}
      className={cn(
        buttonVariants({ variant: 'link' }),
        'group/button h-auto gap-2 px-0 py-0 text-sm font-semibold no-underline hover:no-underline',
        className,
      )}
      data-content-link="true"
      href={href}
      rel={openInNewTab ? 'noreferrer' : undefined}
      target={openInNewTab ? '_blank' : undefined}
    >
      {resolvedPosition === 'left' ? indicatorNode : null}
      {/* Underline stays a constant weight; only the arrow reacts to hover. */}
      <span
        className="underline decoration-current decoration-2 underline-offset-4"
        data-content-link-label="true"
      >
        {label}
      </span>
      {resolvedPosition === 'right' ? indicatorNode : null}
    </a>
  )
}
