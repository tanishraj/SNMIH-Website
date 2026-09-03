import Image from 'next/image'
import { Quote, Star } from 'lucide-react'

import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import {
  regularBlockMobilePaddingClasses,
  regularBlockContainerClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

type QuoteBlockLike = {
  appearance?: BlockAppearance | null
  attributionCompany?: string | null
  attributionName?: string | null
  attributionTitle?: string | null
  avatar?: string | number | Media | null
  eyebrow?: string | null
  quote?: string | null
  quoteSize?: 'sm' | 'lg' | 'xl' | '2xl' | null
  rating?: 'none' | '1' | '2' | '3' | '4' | '5' | null
  size?: RegularBlockSize | null
  variant?: 'centered' | 'side' | 'card' | 'highlight' | null
}

const quoteSizeClasses = {
  sm: 'text-lg md:text-xl',
  lg: 'text-xl md:text-2xl',
  xl: 'text-2xl md:text-3xl',
  '2xl': 'text-3xl md:text-4xl font-light',
} as const

function StarRating({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} out of 5 stars`} className="flex gap-0.5" role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          aria-hidden="true"
          key={i}
          className={cn(
            'size-4',
            i < rating
              ? 'fill-rating-excellent text-rating-excellent'
              : 'fill-transparent text-muted-foreground',
          )}
        />
      ))}
    </div>
  )
}

function Attribution({
  name,
  title,
  company,
  avatar,
  size = 'md',
}: {
  name?: string | null
  title?: string | null
  company?: string | null
  avatar?: ReturnType<typeof getMediaImageProps>
  size?: 'sm' | 'md'
}) {
  const hasAttribution = name?.trim() || title?.trim() || company?.trim()
  if (!hasAttribution && !avatar) return null

  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-full',
            size === 'sm' ? 'size-10' : 'size-12',
          )}
        >
          <Image src={avatar.src} alt={avatar.alt} fill className="object-cover" sizes="48px" />
        </div>
      ) : null}
      {hasAttribution ? (
        <div className="flex flex-col">
          {name?.trim() ? (
            <span className="text-sm font-semibold text-current">{name.trim()}</span>
          ) : null}
          {(title?.trim() || company?.trim()) ? (
            <span className="text-sm text-current/70">
              {[title?.trim(), company?.trim()].filter(Boolean).join(', ')}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function QuoteBlockBlockComponent({
  appearance,
  attributionCompany,
  attributionName,
  attributionTitle,
  avatar,
  eyebrow,
  quote,
  quoteSize = 'lg',
  rating,
  size = 'default',
  variant = 'centered',
}: QuoteBlockLike) {
  const resolvedQuote = quote?.trim()
  if (!resolvedQuote) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const avatarProps = getMediaImageProps({ media: avatar, preset: 'generic' })
  const ratingNum = rating && rating !== 'none' ? parseInt(rating, 10) : 0
  const resolvedVariant = variant ?? 'centered'
  const resolvedQuoteSize = quoteSize ?? 'lg'

  return (
    <section className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}>
      <div className={regularBlockContainerClasses}>
        {resolvedVariant === 'centered' && (
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            {eyebrow?.trim() ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>
                {eyebrow.trim()}
              </SectionEyebrow>
            ) : null}
            <Quote className="size-10 text-primary/30" aria-hidden="true" />
            {ratingNum > 0 ? <StarRating rating={ratingNum} /> : null}
            <blockquote
              className={cn(
                'font-medium leading-relaxed text-current',
                quoteSizeClasses[resolvedQuoteSize],
              )}
            >
              &ldquo;{resolvedQuote}&rdquo;
            </blockquote>
            <Attribution
              name={attributionName}
              title={attributionTitle}
              company={attributionCompany}
              avatar={avatarProps}
            />
          </div>
        )}

        {resolvedVariant === 'side' && (
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
            {/* Avatar side */}
            <div className="flex shrink-0 flex-col items-center gap-3 md:w-48">
              {avatarProps ? (
                <div className="relative size-24 overflow-hidden rounded-full md:size-32">
                  <Image
                    src={avatarProps.src}
                    alt={avatarProps.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 96px, 128px"
                  />
                </div>
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 md:size-32">
                  <Quote className="size-10 text-primary/40" />
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                {attributionName?.trim() ? (
                  <span className="text-sm font-semibold text-current">
                    {attributionName.trim()}
                  </span>
                ) : null}
                {(attributionTitle?.trim() || attributionCompany?.trim()) ? (
                  <span className="text-xs text-current/70">
                    {[attributionTitle?.trim(), attributionCompany?.trim()]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Quote side */}
            <div className="flex flex-col gap-4">
              {eyebrow?.trim() ? (
                <SectionEyebrow surface={appearance?.background ?? 'none'}>
                  {eyebrow.trim()}
                </SectionEyebrow>
              ) : null}
              {ratingNum > 0 ? <StarRating rating={ratingNum} /> : null}
              <blockquote
                className={cn(
                  'font-medium leading-relaxed text-current',
                  quoteSizeClasses[resolvedQuoteSize],
                )}
              >
                &ldquo;{resolvedQuote}&rdquo;
              </blockquote>
            </div>
          </div>
        )}

        {resolvedVariant === 'card' && (
          <div className="mx-auto max-w-3xl rounded-card border border-border bg-card p-8 text-card-foreground shadow-sm md:p-12">
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                {eyebrow?.trim() ? (
                  <SectionEyebrow surface={appearance?.background ?? 'none'}>
                    {eyebrow.trim()}
                  </SectionEyebrow>
                ) : <span />}
                <Quote className="size-8 shrink-0 text-primary/20" aria-hidden="true" />
              </div>
              {ratingNum > 0 ? <StarRating rating={ratingNum} /> : null}
              <blockquote
                className={cn(
                  'font-medium leading-relaxed text-current',
                  quoteSizeClasses[resolvedQuoteSize],
                )}
              >
                &ldquo;{resolvedQuote}&rdquo;
              </blockquote>
              <div className="border-t border-border pt-6">
                <Attribution
                  name={attributionName}
                  title={attributionTitle}
                  company={attributionCompany}
                  avatar={avatarProps}
                />
              </div>
            </div>
          </div>
        )}

        {resolvedVariant === 'highlight' && (
          <div className="mx-auto max-w-3xl border-s border-primary ps-6 md:ps-8">
            <div className="flex flex-col gap-4">
              {eyebrow?.trim() ? (
                <SectionEyebrow surface={appearance?.background ?? 'none'}>
                  {eyebrow.trim()}
                </SectionEyebrow>
              ) : null}
              {ratingNum > 0 ? <StarRating rating={ratingNum} /> : null}
              <blockquote
                className={cn(
                  'font-medium italic leading-relaxed text-current',
                  quoteSizeClasses[resolvedQuoteSize],
                )}
              >
                &ldquo;{resolvedQuote}&rdquo;
              </blockquote>
              <Attribution
                name={attributionName}
                title={attributionTitle}
                company={attributionCompany}
                avatar={avatarProps}
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
