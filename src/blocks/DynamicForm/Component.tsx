import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import {
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { DynamicForm, type DynamicFormLike } from '@/components/DynamicForm'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

export type DynamicFormLayout = 'image' | 'split' | 'stacked'

export type DynamicFormBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  form?: DynamicFormLike | number | string | null
  image?: unknown
  imageAlt?: string | null
  imagePosition?: 'left' | 'right' | null
  layout?: DynamicFormLayout | null
  size?: RegularBlockSize | null
  title?: string | null
}

const text = (value?: string | null) => value?.trim() || undefined

export function DynamicFormBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  eyebrow,
  footerActions,
  form,
  image,
  imageAlt,
  imagePosition = 'right',
  layout = 'image',
  size = 'default',
  title,
}: DynamicFormBlockLike) {
  const resolvedForm = form && typeof form === 'object' ? form : null
  const resolvedImageAlt = text(imageAlt)
  const resolvedImage =
    (layout ?? 'image') === 'image'
      ? getMediaImageProps({
          fallbackAlt: resolvedImageAlt || text(title),
          media: image as Media | number | string | null,
          preset: 'generic',
        })
      : null
  // Without a usable image the Image layout degrades to Split instead of leaving a hole.
  const resolvedLayout: DynamicFormLayout =
    (layout ?? 'image') === 'image' ? (resolvedImage ? 'image' : 'split') : (layout ?? 'split')
  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const surface: BlockBackground = appearance?.background ?? 'none'
  const isCenter = resolvedLayout === 'stacked' && contentAlignment === 'center'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedTitle = text(title)
  const resolvedAccent = text(accentTitle)
  const resolvedEyebrow = text(eyebrow)
  const resolvedDescription = text(description)
  const hasHeader =
    resolvedEyebrow || resolvedTitle || resolvedDescription || resolvedActions.length > 0

  const header = hasHeader ? (
    <div
      className={cn(
        'flex flex-col gap-4',
        isCenter ? 'mx-auto max-w-3xl items-center text-center' : 'items-start',
        resolvedLayout === 'stacked' && !isCenter && 'max-w-3xl',
      )}
    >
      {resolvedEyebrow ? (
        <SectionEyebrow surface={surface}>{resolvedEyebrow}</SectionEyebrow>
      ) : null}
      {resolvedTitle ? (
        <h2 className={contentSectionHeadingClasses}>
          {resolvedAccent ? (
            <>
              <span className="block font-[inherit]">{resolvedTitle}</span>
              <em className="block font-[inherit]">{resolvedAccent}</em>
            </>
          ) : (
            resolvedTitle
          )}
        </h2>
      ) : null}
      {resolvedDescription ? (
        <p className={cn(contentSectionDescriptionClasses, 'text-current/70')}>
          {resolvedDescription}
        </p>
      ) : null}
      {resolvedActions.length > 0 ? (
        <div className="mt-2">
          <ContentActions actions={resolvedActions} alignment={isCenter ? 'center' : 'left'} />
        </div>
      ) : null}
    </div>
  ) : null

  const formArea = resolvedForm ? (
    <DynamicForm form={resolvedForm} />
  ) : (
    <p className="text-sm leading-6 text-current/70" data-dynamic-form-unavailable="true">
      This form is currently unavailable.
    </p>
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-dynamic-form-layout={resolvedLayout}
    >
      <div className={regularBlockContainerClasses}>
        {resolvedLayout === 'image' && resolvedImage ? (
          <div
            className="grid items-stretch gap-10 lg:grid-cols-2 lg:gap-14"
            data-dynamic-form-image-position={imagePosition ?? 'right'}
          >
            <div className="flex min-w-0 flex-col gap-8">
              {header}
              {formArea}
            </div>
            <div
              className={cn(
                'relative min-h-72 overflow-hidden rounded-card lg:min-h-168',
                imagePosition === 'left' && 'lg:order-first',
              )}
            >
              <Image
                alt={resolvedImageAlt || resolvedImage.alt || ''}
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                src={resolvedImage.src}
              />
            </div>
          </div>
        ) : resolvedLayout === 'split' ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
            <div className="lg:sticky lg:top-[calc(var(--block-anchor-offset,1rem)+1rem)] lg:self-start">
              {header}
            </div>
            {formArea}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {header}
            <div className={cn('w-full max-w-3xl', isCenter && 'mx-auto')}>{formArea}</div>
          </div>
        )}
        <BlockFooterActions actions={footerActions} alignment={isCenter ? 'center' : 'left'} />
      </div>
    </section>
  )
}
