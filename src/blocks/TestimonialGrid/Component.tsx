import Image from 'next/image'
import { Quote } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'
import { resolveCardSurface, type CardSurfaceClasses } from '@/blocks/shared/cardSurface'

type Testimonial = {
  cardBackground?: string | null
  quote?: string | null
  name?: string | null
  role?: string | null
  department?: string | null
  avatar?: string | number | Media | null
}

type TestimonialGridBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: '2' | '3' | '4' | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  title?: string | null
  size?: RegularBlockSize | null
  testimonials?: Testimonial[] | null
  variant?: 'grid' | 'featured' | 'list' | null
}

function Avatar({
  avatar,
  name,
  surface,
}: {
  avatar?: ReturnType<typeof getMediaImageProps>
  name?: string | null
  surface?: CardSurfaceClasses
}) {
  if (avatar) {
    return (
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
        <Image src={avatar.src} alt={avatar.alt} fill className="object-cover" sizes="48px" />
      </div>
    )
  }
  const initials = name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-full bg-current/10 text-sm font-semibold',
        surface?.icon ?? 'text-primary',
      )}
    >
      {initials ?? '?'}
    </div>
  )
}

function TestimonialCard({
  testimonial,
  sectionBackground,
}: {
  testimonial: Testimonial
  sectionBackground: BlockBackground
}) {
  const avatarProps = getMediaImageProps({ media: testimonial.avatar, preset: 'generic' })
  const surface = resolveCardSurface(testimonial.cardBackground, sectionBackground)

  return (
    <div
      className={cn(
        'flex h-full flex-col gap-4 rounded-card border p-6 shadow-sm',
        surface.className,
        surface.divider,
      )}
      data-card-background={surface.value}
    >
      <Quote className={cn('size-7 shrink-0 opacity-30', surface.icon)} aria-hidden="true" />
      <blockquote className={cn('grow text-sm leading-relaxed', surface.secondary)}>
        &ldquo;{testimonial.quote?.trim()}&rdquo;
      </blockquote>
      <div className={cn('flex items-center gap-3 border-t pt-4', surface.divider)}>
        <Avatar avatar={avatarProps ?? undefined} name={testimonial.name} surface={surface} />
        <div className="min-w-0 flex-1">
          {testimonial.name?.trim() ? (
            <p className="truncate text-sm font-semibold text-current">{testimonial.name.trim()}</p>
          ) : null}
          {testimonial.role?.trim() ? (
            <p className={cn('truncate text-xs', surface.secondary)}>{testimonial.role.trim()}</p>
          ) : null}
          {testimonial.department?.trim() ? (
            <p className={cn('truncate text-xs opacity-80', surface.secondary)}>
              {testimonial.department.trim()}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FeaturedTestimonial({
  testimonial,
  sectionBackground,
}: {
  testimonial: Testimonial
  sectionBackground: BlockBackground
}) {
  const surface = resolveCardSurface(testimonial.cardBackground, sectionBackground)

  return (
    <div
      className={cn('rounded-card border p-8 shadow-sm md:p-12', surface.className, surface.divider)}
      data-card-background={surface.value}
    >
      <Quote className={cn('mb-4 size-9 opacity-30', surface.icon)} aria-hidden="true" />
      <blockquote className="mb-6 text-xl font-medium leading-relaxed text-current md:text-2xl">
        &ldquo;{testimonial.quote?.trim()}&rdquo;
      </blockquote>
      <div className={cn('flex items-center gap-4 border-t pt-6', surface.divider)}>
        <Avatar
          avatar={getMediaImageProps({ media: testimonial.avatar, preset: 'generic' }) ?? undefined}
          name={testimonial.name}
          surface={surface}
        />
        <div>
          <p className="font-semibold text-current">{testimonial.name?.trim()}</p>
          {testimonial.role?.trim() ? (
            <p className={cn('text-sm', surface.secondary)}>{testimonial.role.trim()}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const columnClasses = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const

export function TestimonialGridBlockComponent({
  accentTitle,
  actions,
  appearance,
  columns = '3',
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  title,
  size = 'default',
  testimonials,
  variant = 'grid',
}: TestimonialGridBlockLike) {
  const items = (testimonials ?? []).filter((t) => t.quote?.trim() && t.name?.trim())
  if (!items.length) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const isCenter = (contentAlignment ?? 'center') === 'center'
  const resolvedActions = resolveCmsActions(actions)
  const sectionBackground: BlockBackground = appearance?.background ?? 'none'
  const resolvedAccentTitle = accentTitle?.trim() || undefined

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
    >
      <div className={regularBlockContainerClasses}>
        {/* Header */}
        {eyebrow?.trim() || title?.trim() || description?.trim() || resolvedActions.length > 0 ? (
          <div
            className={cn(
              'mb-12 flex flex-col gap-4',
              isCenter ? 'mx-auto max-w-3xl items-center text-center' : 'items-start',
            )}
          >
            {eyebrow?.trim() ? (
              <SectionEyebrow surface={sectionBackground}>
                {eyebrow.trim()}
              </SectionEyebrow>
            ) : null}
            {title?.trim() ? (
              <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                {resolvedAccentTitle ? (
                  <>
                    <span className="block font-[inherit]">{title.trim()}</span>
                    <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                  </>
                ) : (
                  title.trim()
                )}
              </h2>
            ) : null}
            {description?.trim() ? (
              <p className="text-base leading-7 text-current/70">{description.trim()}</p>
            ) : null}
            {resolvedActions.length > 0 ? (
              <div className="mt-2">
                <ContentActions actions={resolvedActions} />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Grid variant */}
        {variant === 'grid' || !variant ? (
          <div className={cn('grid gap-6', columnClasses[columns ?? '3'])}>
            {items.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} sectionBackground={sectionBackground} />
            ))}
          </div>
        ) : null}

        {/* Featured variant: first card large, rest in a row below */}
        {variant === 'featured' ? (
          <div className="flex flex-col gap-6">
            {items[0] ? (
              <FeaturedTestimonial testimonial={items[0]} sectionBackground={sectionBackground} />
            ) : null}
            {items.length > 1 ? (
              <div className={cn('grid gap-6', columnClasses[columns ?? '3'])}>
                {items.slice(1).map((t, i) => (
                  <TestimonialCard key={i} testimonial={t} sectionBackground={sectionBackground} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* List variant */}
        {variant === 'list' ? (
          <div className="flex flex-col divide-y divide-border">
            {items.map((t, i) => {
              const avatarProps = getMediaImageProps({ media: t.avatar, preset: 'generic' })
              return (
                <div key={i} className="flex gap-5 py-6">
                  <Avatar avatar={avatarProps ?? undefined} name={t.name} />
                  <div className="flex flex-col gap-1">
                    <blockquote className="text-sm leading-relaxed text-current/80">
                      &ldquo;{t.quote?.trim()}&rdquo;
                    </blockquote>
                    <p className="mt-2 text-sm font-semibold text-current">{t.name?.trim()}</p>
                    {t.role?.trim() ? (
                      <p className="text-xs text-current/70">{t.role.trim()}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
