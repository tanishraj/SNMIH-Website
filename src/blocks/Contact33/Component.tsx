import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { Contact33 } from '@/components/contact33'
import { ContentActions } from '@/components/ContentActions'
import type { Contact33FormLike } from '@/lib/contact33Form'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'

type Contact33BlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  form?: Contact33FormLike | number | string | null
  image?: unknown
  imageAlt?: string | null
  imagePosition?: 'left' | 'right' | null
  size?: 'none' | 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

export function Contact33BlockComponent({
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  form,
  image,
  imageAlt,
  imagePosition = 'right',
  size = 'default',
  title,
}: Contact33BlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedImageAlt = imageAlt?.trim()
  const resolvedImage = getMediaImageProps({
    fallbackAlt: resolvedImageAlt || resolvedTitle,
    media: image as Media | number | string | null,
    preset: 'generic',
  })
  const resolvedForm =
    form && typeof form === 'object' ? (form as Contact33FormLike) : null

  if (!resolvedTitle || !resolvedImage || !resolvedImageAlt) {
    return null
  }

  const resolvedActions = resolveCmsActions(actions)

  return (
    <>
      <Contact33
        actions={resolvedActions.length > 0 ? <ContentActions actions={resolvedActions} /> : undefined}
        appearance={appearance}
        contentAlignment={contentAlignment ?? 'center'}
        description={description?.trim()}
        eyebrow={eyebrow?.trim()}
        form={resolvedForm}
        image={{ ...resolvedImage, alt: resolvedImageAlt }}
        imagePosition={imagePosition ?? 'right'}
        size={size ?? 'default'}
        title={resolvedTitle}
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}
