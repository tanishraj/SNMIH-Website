import type { ReactNode } from 'react'
import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import { regularBlockMobilePaddingClasses } from '@/blocks/shared/blockSpacing'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { cn } from '@/lib/utils'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'

export type FeatureMatrixAlignment = 'center' | 'left' | 'right'
export type FeatureMatrixImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type FeatureMatrixSize = 'none' | 'comfortable' | 'compact' | 'default'

export type FeatureMatrixItem = {
  cardBackground?: string | null
  description?: string | null
  image: {
    alt: string
    src: string
  }
  imagePosition?: FeatureMatrixImagePosition | null
  title?: string | null
}

type FeatureMatrixProps = {
  accentTitle?: string | null
  actions?: ReactNode
  alignment?: FeatureMatrixAlignment
  appearance?: BlockAppearance | null
  borderAnimationEnabled?: boolean
  className?: string
  description?: string | null
  eyebrow?: string | null
  features: FeatureMatrixItem[]
  showOuterBorder?: boolean
  size?: FeatureMatrixSize
  title?: string | null
}

const panelPaddingClasses = {
  none: 'p-6 md:p-8',
  compact: 'p-5 md:p-6',
  default: 'p-6 md:p-8',
  comfortable: 'p-8 md:p-10',
} as const

const introMarginClasses = {
  none: 'mb-10',
  compact: 'mb-8',
  default: 'mb-10',
  comfortable: 'mb-12',
} as const

const imageHeightClasses = {
  none: 'h-48 md:h-52 lg:h-56',
  compact: 'h-44 md:h-48 lg:h-52',
  default: 'h-48 md:h-52 lg:h-56',
  comfortable: 'h-52 md:h-64 lg:h-72',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const panelDividerClasses = [
  'border-b border-border lg:border-r',
  'border-b border-border',
  'border-b border-border lg:border-r lg:border-b-0',
  '',
] as const

type FeatureMatrixDividerBeamOrientation = 'horizontal' | 'vertical'

type FeatureMatrixDividerBeamDescriptor = {
  className?: string
  orientation: FeatureMatrixDividerBeamOrientation
  phase: 0 | 1 | 2 | 3 | 4
}

const panelDividerBeams = [
  [
    { orientation: 'horizontal', phase: 0 },
    { className: 'hidden lg:block', orientation: 'vertical', phase: 1 },
  ],
  [{ orientation: 'horizontal', phase: 2 }],
  [
    { className: 'lg:hidden', orientation: 'horizontal', phase: 3 },
    { className: 'hidden lg:block', orientation: 'vertical', phase: 4 },
  ],
  [],
] satisfies readonly (readonly FeatureMatrixDividerBeamDescriptor[])[]

function FeatureMatrixDividerBeam({
  className,
  orientation,
  phase,
}: FeatureMatrixDividerBeamDescriptor) {
  return (
    <span
      aria-hidden="true"
      className={cn('feature-matrix-divider-beam', className)}
      data-feature-matrix-divider-beam={orientation}
      data-feature-matrix-divider-beam-phase={phase}
    />
  )
}

export function FeatureMatrix({
  accentTitle,
  actions,
  alignment = 'center',
  appearance,
  borderAnimationEnabled = true,
  className,
  description,
  eyebrow,
  features,
  showOuterBorder = true,
  size = 'default',
  title,
}: FeatureMatrixProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedAlignment = alignment ?? 'center'
  const resolvedBorderAnimationEnabled = borderAnimationEnabled ?? true
  const resolvedSize = size ?? 'default'
  const resolvedShowOuterBorder = showOuterBorder ?? true
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const visibleFeatures = features.slice(0, 4)
  const sectionBackground: BlockBackground = appearance?.background ?? 'none'
  const sectionSurface = resolveCardSurface('default', sectionBackground)

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[resolvedSize],
        appearanceClasses.className,
        className,
      )}
      data-feature-matrix="true"
      data-feature-matrix-alignment={resolvedAlignment}
      data-feature-matrix-background={appearance?.background ?? 'none'}
      data-feature-matrix-border-animation={resolvedBorderAnimationEnabled ? 'enabled' : 'disabled'}
      data-feature-matrix-outer-border={resolvedShowOuterBorder ? 'shown' : 'hidden'}
      data-feature-matrix-size={resolvedSize}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-4">
        <div
          className={cn(
            'flex max-w-3xl flex-col gap-4',
            introMarginClasses[resolvedSize],
            alignmentClasses[resolvedAlignment],
          )}
        >
          {eyebrow ? (
            <SectionEyebrow surface={sectionBackground}>{eyebrow}</SectionEyebrow>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
            {resolvedAccentTitle ? (
              <>
                <span className="block font-[inherit]">{title}</span>
                <em className="block font-[inherit]">{resolvedAccentTitle}</em>
              </>
            ) : (
              title
            )}
          </h2>
          {description ? (
            <p className="text-base leading-7 text-balance text-current/70">{description}</p>
          ) : null}
          {actions}
        </div>

        <div
          className={cn(
            'grid overflow-hidden rounded-card',
            resolvedShowOuterBorder ? cn('border', sectionSurface.divider) : '',
            'lg:grid-cols-5',
          )}
        >
          {visibleFeatures.map((feature, index) => {
            const isWidePanel = index === 0 || index === 3
            const resolvedImagePosition = feature.imagePosition ?? 'center'
            const surface = resolveCardSurface(feature.cardBackground, sectionBackground)

            return (
              <article
                className={cn(
                  'relative flex flex-col gap-3',
                  surface.className,
                  panelPaddingClasses[resolvedSize],
                  panelDividerClasses[index].replaceAll('border-border', surface.divider),
                  isWidePanel ? 'lg:col-span-3' : 'lg:col-span-2',
                )}
                data-card-background={surface.value}
                data-feature-matrix-panel={index + 1}
                key={`${feature.title}-${index}`}
              >
                {resolvedBorderAnimationEnabled
                  ? panelDividerBeams[index].map((beam) => (
                      <FeatureMatrixDividerBeam
                        {...beam}
                        key={`${beam.orientation}-${beam.phase}`}
                      />
                    ))
                  : null}
                <div className="flex flex-col gap-1">
                  <p className="text-base leading-tight font-semibold text-current">
                    {feature.title}
                  </p>
                  {feature.description ? (
                    <p className={cn('text-sm leading-6', surface.secondary)}>
                      {feature.description}
                    </p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    'relative mt-2 w-full overflow-hidden rounded-card',
                    imageHeightClasses[resolvedSize],
                  )}
                  data-feature-matrix-image-position={resolvedImagePosition}
                >
                  <Image
                    fill
                    alt={feature.image.alt}
                    className={cn('object-cover', objectPositionClasses[resolvedImagePosition])}
                    src={feature.image.src}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
