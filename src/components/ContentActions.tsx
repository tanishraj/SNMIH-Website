import type { ComponentProps } from 'react'

import { ActionButtonContent } from '@/components/ActionButtonContent'
import { ContentLink } from '@/components/ContentLink'
import { Button } from '@/components/ui/button'
import {
  getCmsActionAnchorProps,
  type CmsActionVariant,
  type ResolvedCmsAction,
} from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

type ContentActionAlignment = 'center' | 'left' | 'right'

type ContentActionsProps = Omit<ComponentProps<'div'>, 'children'> & {
  actions: ResolvedCmsAction[]
  alignment?: ContentActionAlignment
  buttonClassNames?: Partial<Record<CmsActionVariant, string>>
  linkClassName?: string
}

const linkAlignmentClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

const buttonAlignmentClasses = {
  left: 'items-start sm:justify-start',
  center: 'items-center sm:justify-center',
  right: 'items-end sm:justify-end',
} as const

const rendersAsButton = (action: ResolvedCmsAction) =>
  action.mode === 'button' && action.variant !== 'link'

export function ContentActions({
  actions,
  alignment = 'left',
  buttonClassNames,
  className,
  linkClassName,
  ...divProps
}: ContentActionsProps) {
  if (!actions.length) {
    return null
  }

  // Display mode is per action, but the row itself can only be laid out one way.
  // A single button needs the roomier button spacing, so it wins the mix.
  const mode = actions.some(rendersAsButton) ? 'button' : 'link'

  return (
    <div
      {...divProps}
      className={cn(
        'flex w-full flex-wrap',
        mode === 'button'
          ? cn('flex-col gap-3 sm:flex-row', buttonAlignmentClasses[alignment])
          : cn('gap-x-6 gap-y-3', linkAlignmentClasses[alignment]),
        className,
      )}
      data-action-mode={mode}
    >
      {actions.map((action, index) => {
        return rendersAsButton(action) ? (
          <Button
            asChild
            className={buttonClassNames?.[action.variant]}
            data-action-variant={action.variant}
            key={`${action.label}-${action.href}-${index}`}
            size="lg"
            variant={action.variant}
          >
            <a {...getCmsActionAnchorProps(action)}>
              <ActionButtonContent
                indicator={action.indicator}
                indicatorPosition={action.indicatorPosition}
                label={action.label}
                showArrow={action.showArrow}
              />
            </a>
          </Button>
        ) : (
          <ContentLink
            className={linkClassName}
            download={action.download}
            href={action.href}
            indicator={action.indicator}
            indicatorPosition={action.indicatorPosition}
            key={`${action.label}-${action.href}-${index}`}
            label={action.label}
            openInNewTab={action.openInNewTab}
          />
        )
      })}
    </div>
  )
}
