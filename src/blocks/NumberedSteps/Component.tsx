import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockMobilePaddingClasses,
  regularBlockContainerClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { resolveCardSurface, type CardSurfaceClasses } from '@/blocks/shared/cardSurface'

type Step = {
  badge?: string | null
  cardBackground?: string | null
  description?: string | null
  image?: string | number | Media | null
  title?: string | null
}

type NumberedStepsBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  numberStyle?: 'circle' | 'outlined' | 'serif' | null
  size?: RegularBlockSize | null
  steps?: Step[] | null
  title?: string | null
  variant?: 'vertical' | 'cards' | 'alternating' | null
}

function StepNumber({
  num,
  numberStyle,
  surface,
}: {
  num: number
  numberStyle: 'circle' | 'outlined' | 'serif'
  surface?: CardSurfaceClasses
}) {
  const label = String(num).padStart(2, '0')

  if (numberStyle === 'serif') {
    return (
      <span
        className={cn(
          'shrink-0 font-serif text-7xl font-bold leading-none opacity-20 select-none',
          surface?.icon ?? 'text-primary',
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold',
        numberStyle === 'circle' && 'bg-primary text-primary-foreground',
        numberStyle === 'outlined' && 'border-2 border-primary text-primary',
        surface?.value === 'primary' &&
          numberStyle === 'circle' &&
          'bg-primary-foreground text-primary',
        surface?.value === 'primary' &&
          numberStyle === 'outlined' &&
          'border-primary-foreground text-primary-foreground',
      )}
    >
      {num}
    </div>
  )
}

// ── VERTICAL ──────────────────────────────────────────────────────────────────
function VerticalSteps({
  steps,
  numberStyle,
}: {
  steps: Step[]
  numberStyle: 'circle' | 'outlined' | 'serif'
}) {
  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        return (
          <div key={index} className="flex gap-5">
            <div className="flex flex-col items-center">
              <StepNumber num={index + 1} numberStyle={numberStyle} />
              {!isLast ? <div className="w-0.5 flex-1 bg-current/15 my-1" /> : null}
            </div>
            <div className={cn('flex flex-col gap-1 pb-10', isLast && 'pb-0')}>
              {step.badge?.trim() ? (
                <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {step.badge.trim()}
                </span>
              ) : null}
              <h3 className="font-sans text-lg font-semibold leading-snug text-current">
                {step.title?.trim()}
              </h3>
              {step.description?.trim() ? (
                <p className="text-base leading-relaxed text-current/70">
                  {step.description.trim()}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── CARDS ─────────────────────────────────────────────────────────────────────
function CardSteps({
  steps,
  numberStyle,
  sectionBackground,
}: {
  steps: Step[]
  numberStyle: 'circle' | 'outlined' | 'serif'
  sectionBackground: BlockBackground
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-6', getNumberedStepsGridClasses(steps.length))}>
      {steps.map((step, index) => {
        const surface = resolveCardSurface(step.cardBackground, sectionBackground)

        return (
          <div
            key={index}
            className={cn(
              'relative flex flex-col gap-4 rounded-card border p-6',
              surface.className,
              surface.divider,
            )}
            data-card-background={surface.value}
          >
            <StepNumber num={index + 1} numberStyle={numberStyle} surface={surface} />
            <div className="flex flex-col gap-1">
              {step.badge?.trim() ? (
                <span
                  className={cn(
                    'w-fit rounded-full bg-current/10 px-2.5 py-0.5 text-xs font-semibold',
                    surface.icon,
                  )}
                >
                  {step.badge.trim()}
                </span>
              ) : null}
              <h3 className="font-sans text-base font-semibold leading-snug text-current">
                {step.title?.trim()}
              </h3>
              {step.description?.trim() ? (
                <p className={cn('text-sm leading-relaxed', surface.secondary)}>
                  {step.description.trim()}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const getNumberedStepsGridClasses = (stepCount: number) => {
  if (stepCount === 2) return 'sm:grid-cols-2 lg:grid-cols-2'
  if (stepCount === 4) return 'sm:grid-cols-2 lg:grid-cols-4'

  return 'sm:grid-cols-2 lg:grid-cols-3'
}

// ── ALTERNATING ───────────────────────────────────────────────────────────────
function AlternatingSteps({
  steps,
  numberStyle,
}: {
  steps: Step[]
  numberStyle: 'circle' | 'outlined' | 'serif'
}) {
  return (
    <div className="flex flex-col gap-16">
      {steps.map((step, index) => {
        const isEven = index % 2 === 0
        const image = getMediaImageProps({ media: step.image, preset: 'generic' })

        return (
          <div
            key={index}
            className={cn(
              'flex flex-col gap-8 md:flex-row md:items-center md:gap-12',
              !isEven && 'md:flex-row-reverse',
            )}
          >
            {/* Media or styled fallback */}
            <div className="relative aspect-video w-full overflow-hidden rounded-card md:flex-1">
              {image ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-foreground">
                  <span className="font-serif text-8xl font-bold text-border select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4 md:flex-1">
              <StepNumber num={index + 1} numberStyle={numberStyle} />
              {step.badge?.trim() ? (
                <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {step.badge.trim()}
                </span>
              ) : null}
              <h3 className="font-sans text-xl font-semibold tracking-tight text-current sm:text-2xl">
                {step.title?.trim()}
              </h3>
              {step.description?.trim() ? (
                <p className="text-base leading-relaxed text-current/70">
                  {step.description.trim()}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function NumberedStepsBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  numberStyle = 'circle',
  size = 'default',
  steps,
  title,
  variant = 'vertical',
}: NumberedStepsBlockLike) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null
  const resolvedAccentTitle = accentTitle?.trim() || undefined

  const validSteps = (steps ?? []).filter((s) => s.title?.trim())
  if (validSteps.length < 2) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const isCenter = (contentAlignment ?? 'center') === 'center'
  const resolvedNumberStyle = numberStyle ?? 'circle'
  const resolvedVariant = variant ?? 'vertical'
  const resolvedActions = resolveCmsActions(actions)
  const sectionBackground: BlockBackground = appearance?.background ?? 'none'

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
    >
      <div className={regularBlockContainerClasses}>
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
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
            {resolvedAccentTitle ? (
              <>
                <span className="block font-[inherit]">{resolvedTitle}</span>
                <em className="block font-[inherit]">{resolvedAccentTitle}</em>
              </>
            ) : (
              resolvedTitle
            )}
          </h2>
          {description?.trim() ? (
            <p className="text-base leading-7 text-current/70">{description.trim()}</p>
          ) : null}
          {resolvedActions.length > 0 ? (
            <div className="mt-2">
              <ContentActions actions={resolvedActions} />
            </div>
          ) : null}
        </div>

        {resolvedVariant === 'cards' ? (
          <CardSteps
            steps={validSteps}
            numberStyle={resolvedNumberStyle}
            sectionBackground={sectionBackground}
          />
        ) : resolvedVariant === 'alternating' ? (
          <AlternatingSteps steps={validSteps} numberStyle={resolvedNumberStyle} />
        ) : (
          <VerticalSteps steps={validSteps} numberStyle={resolvedNumberStyle} />
        )}
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
