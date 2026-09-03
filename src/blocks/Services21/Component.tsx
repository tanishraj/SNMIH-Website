import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import { ActionButtonContent } from '@/components/ActionButtonContent'
import { BorderButton } from '@/components/shadcnblocks/border-button'
import { Services21, type Services21Item, type Services21Alignment } from '@/components/services21'
import { ContentLink } from '@/components/ContentLink'
import {
  getCmsActionAnchorProps,
  resolveCmsActions,
  type CmsActionValue,
  type CmsActionVariant,
} from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

type Services21BlockService = {
  code?: string | null
  description?: string | null
  image?: unknown
  title?: string | null
}

type Services21BlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: Services21Alignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  services?: Services21BlockService[] | null
  size?: 'none' | 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

const resolveServiceCode = (code: string | null | undefined, index: number) => {
  const trimmed = code?.trim()
  const paddedIndex = String(index + 1).padStart(2, '0')

  return trimmed && trimmed.length > 0 ? trimmed : `{${paddedIndex}}`
}

export function Services21BlockComponent({
  accentTitle,
  actions,
  appearance,
  description,
  eyebrow,
  footerActions,
  contentAlignment = 'center',
  services,
  size = 'default',
  title,
}: Services21BlockLike) {
  const resolvedServices = (services ?? []).flatMap((service, index): Services21Item[] => {
    const titleValue = service.title?.trim()
    const image = getMediaImageProps({
      media: service.image as Media | null | number | string,
      preset: 'hero',
      fallbackAlt: titleValue || 'Service image',
    })

    if (!titleValue || !image) {
      return []
    }

    return [
      {
        description: service.description?.trim() || '',
        id: resolveServiceCode(service.code, index),
        image: image.src,
        title: titleValue,
      },
    ]
  })

  const resolvedActions = resolveCmsActions(actions).slice(0, 1)
  const resolvedTitle = title?.trim()
  const resolvedDescription = description?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedContentAlignment = contentAlignment ?? 'left'
  const action = resolvedActions[0]
  const actionVariant: Exclude<CmsActionVariant, 'link'> =
    action?.variant === 'link' ? 'default' : (action?.variant ?? 'default')
  const actionSurface = resolveCardSurface('default', appearance?.background ?? 'none')
  const hasServices = resolvedServices.length > 0
  const actionNode = action ? (
    action.mode === 'button' ? (
      <BorderButton
        asChild
        className={cn('group mt-10', actionSurface.button[actionVariant])}
        variant={actionVariant}
      >
        <a {...getCmsActionAnchorProps(action)}>
          <ActionButtonContent
            indicator={action.indicator}
            indicatorPosition={action.indicatorPosition}
            label={action.label}
            showArrow={action.showArrow}
          />
        </a>
      </BorderButton>
    ) : (
      <ContentLink
        className={cn('mt-10', actionSurface.link)}
        download={action.download}
        href={action.href}
        indicator={action.indicator}
        indicatorPosition={action.indicatorPosition}
        label={action.label}
        openInNewTab={action.openInNewTab}
      />
    )
  ) : null

  if (!hasServices) {
    return null
  }

  return (
    <>
      <Services21
        accentTitle={accentTitle}
        appearance={appearance}
        actions={actionNode}
        contentAlignment={resolvedContentAlignment}
        description={resolvedDescription}
        eyebrow={resolvedEyebrow}
        items={resolvedServices}
        size={size ?? 'default'}
        title={resolvedTitle}
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}
