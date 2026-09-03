import Image from 'next/image'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

type TimelineItem = {
  badge?: 'none' | 'done' | 'active' | 'upcoming' | null
  date?: string | null
  description?: string | null
  image?: string | number | Media | null
  title?: string | null
}

type TimelineBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  items?: TimelineItem[] | null
  showConnectors?: boolean | null
  size?: RegularBlockSize | null
  title?: string | null
  variant?: 'horizontal' | 'vertical' | 'alternating' | null
}

// ── Status styles for Horizontal Steps ──────────────────────────────────────
const stepCircleClasses = {
  none: 'border-2 border-border bg-background text-foreground/70',
  upcoming: 'border-2 border-border bg-background text-foreground/70',
  active: 'border-2 border-primary bg-primary text-primary-foreground',
  done: 'border-2 border-success bg-success text-success-foreground',
} as const

const stepConnectorClasses = {
  none: 'bg-current/15',
  upcoming: 'bg-current/15',
  active: 'bg-current/15',
  done: 'bg-current/15',
} as const

function StatusIcon({ badge, index }: { badge: string; index: number }) {
  if (badge === 'done') return <CheckCircle2 className="size-4" />
  if (badge === 'active') return <span className="text-sm font-bold">{index + 1}</span>
  return <span className="text-sm font-semibold">{index + 1}</span>
}

export const formatStepLabel = (index: number) =>
  `Step ${String(index + 1).padStart(2, '0')}`

// ── Section header shared across variants ────────────────────────────────────
function SectionHeader({
  accentTitle,
  actions,
  eyebrow,
  title,
  description,
  alignment,
  surface,
}: {
  accentTitle?: string
  actions?: React.ReactNode
  eyebrow?: string
  title?: string | null
  description?: string
  alignment: 'left' | 'center'
  surface: BlockBackground
}) {
  return (
    <div
      className={cn(
        'mb-12 flex flex-col gap-4',
        alignment === 'center' ? 'mx-auto max-w-3xl items-center text-center' : 'items-start',
      )}
    >
      {eyebrow ? (
        <SectionEyebrow surface={surface}>{eyebrow}</SectionEyebrow>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
        {accentTitle ? (
          <>
            <span className="block font-[inherit]">{title}</span>
            <em className="block font-[inherit]">{accentTitle}</em>
          </>
        ) : (
          title
        )}
      </h2>
      {description ? <p className="text-base leading-7 text-current/70">{description}</p> : null}
      {actions ? <div className="mt-2">{actions}</div> : null}
    </div>
  )
}

// ── HORIZONTAL STEPS ─────────────────────────────────────────────────────────
function HorizontalTimeline({ items, showConnectors }: { items: TimelineItem[]; showConnectors: boolean }) {
  return (
    <div className="w-full pt-2">
      {/* ── Mobile: vertical stacked list ── */}
      <div className="flex flex-col md:hidden">
        {items.map((item, index) => {
          const badge = item.badge ?? 'none'
          const isLast = index === items.length - 1
          return (
            <div key={index} className="flex gap-4">
              {/* Left column: circle + connector, no gap so line touches both circles */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    stepCircleClasses[badge],
                    badge === 'active' && 'ring-4 ring-primary/20',
                  )}
                >
                  <StatusIcon badge={badge} index={index} />
                </div>
                {showConnectors && !isLast ? (
                  <div className="w-px flex-1 bg-current/15" />
                ) : null}
              </div>
              {/* Right column: content, pb spaces out to next circle */}
              <div className={cn('flex flex-col gap-1.5', !isLast && 'pb-8')}>
                <span className="flex items-center gap-1 text-sm text-current/70">
                  <Clock className="size-3.5 shrink-0" />
                  {formatStepLabel(index)}
                </span>
                <p className="text-base font-semibold leading-snug text-current">
                  {item.title?.trim()}
                </p>
                {item.description?.trim() ? (
                  <p className="text-sm leading-relaxed text-current/70">
                    {item.description.trim()}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop: horizontal row ── */}
      <div className="hidden w-full md:flex">
        {items.map((item, index) => {
          const badge = item.badge ?? 'none'
          const isFirst = index === 0
          const isLast = index === items.length - 1
          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div className="relative flex w-full items-center justify-center">
                {showConnectors && !isFirst ? (
                  <div
                    className={cn(
                      'absolute left-0 right-[calc(50%+20px)] top-1/2 h-0.5 -translate-y-1/2',
                      stepConnectorClasses[badge],
                    )}
                  />
                ) : null}
                <div
                  className={cn(
                    'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full',
                    stepCircleClasses[badge],
                    badge === 'active' && 'ring-4 ring-primary/20',
                  )}
                >
                  <StatusIcon badge={badge} index={index} />
                </div>
                {showConnectors && !isLast ? (
                  <div
                    className={cn(
                      'absolute left-[calc(50%+20px)] right-0 top-1/2 h-0.5 -translate-y-1/2',
                      stepConnectorClasses[badge],
                    )}
                  />
                ) : null}
              </div>
              <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                <span className="flex items-center gap-1 text-sm text-current/70">
                  <Clock className="size-3.5 shrink-0" />
                  {formatStepLabel(index)}
                </span>
                <p className="text-base font-semibold leading-snug text-current">
                  {item.title?.trim()}
                </p>
                {item.description?.trim() ? (
                  <p className="text-sm leading-relaxed text-current/70">
                    {item.description.trim()}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── VERTICAL ──────────────────────────────────────────────────────────────────
function VerticalTimeline({ items, sectionBackground }: { items: TimelineItem[]; sectionBackground: BlockBackground }) {
  return (
    <div className="relative flex flex-col gap-0">
      {items.map((item, index) => {
        const badge = item.badge ?? 'none'
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex gap-5">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  stepCircleClasses[badge],
                  badge === 'active' && 'ring-4 ring-primary/20',
                )}
              >
                {badge === 'done' ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Circle className="size-3 fill-current" />
                )}
              </div>
              {!isLast ? <div className="w-0.5 flex-1 bg-current/15" /> : null}
            </div>
            <div className={cn('flex flex-col gap-1 pb-10', isLast && 'pb-0')}>
              {item.date?.trim() ? (
                <SectionEyebrow surface={sectionBackground}>{item.date.trim()}</SectionEyebrow>
              ) : null}
              <h3 className="text-lg font-semibold leading-snug text-current">
                {item.title?.trim()}
              </h3>
              {item.description?.trim() ? (
                <p className="text-base leading-relaxed text-current/70">
                  {item.description.trim()}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ALTERNATING ───────────────────────────────────────────────────────────────
function AlternatingTimeline({ items, sectionBackground }: { items: TimelineItem[]; sectionBackground: BlockBackground }) {
  return (
    <div className="flex flex-col gap-16">
      {items.map((item, index) => {
        const isEven = index % 2 === 0
        const image = getMediaImageProps({ media: item.image, preset: 'generic' })

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
                  <span className="font-serif text-8xl font-bold text-border">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 md:flex-1">
              {item.date?.trim() ? (
                <SectionEyebrow surface={sectionBackground}>{item.date.trim()}</SectionEyebrow>
              ) : (
                <span className="font-serif text-5xl font-bold leading-none text-border/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              <h3 className="text-2xl font-semibold leading-snug tracking-tight text-current md:text-3xl">
                {item.title?.trim()}
              </h3>
              {item.description?.trim() ? (
                <p className="text-base leading-relaxed text-current/70">
                  {item.description.trim()}
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
export function TimelineBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  items,
  showConnectors = true,
  size = 'default',
  title,
  variant = 'vertical',
}: TimelineBlockLike) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null
  const resolvedAccentTitle = accentTitle?.trim() || undefined

  const validItems = (items ?? []).filter((item) => item.title?.trim())
  if (validItems.length === 0) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const alignment = contentAlignment ?? 'center'
  const resolvedActions = resolveCmsActions(actions)

  return (
    <section className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}>
      <div className="mx-auto w-full max-w-screen-2xl px-4">
        <SectionHeader
          accentTitle={resolvedAccentTitle}
          actions={resolvedActions.length > 0 ? <ContentActions actions={resolvedActions} /> : undefined}
          alignment={alignment}
          description={description?.trim() || undefined}
          eyebrow={eyebrow?.trim() || undefined}
          surface={appearance?.background ?? 'none'}
          title={resolvedTitle}
        />

        {variant === 'horizontal' ? (
          <HorizontalTimeline items={validItems} showConnectors={showConnectors ?? true} />
        ) : variant === 'alternating' ? (
          <AlternatingTimeline items={validItems} sectionBackground={appearance?.background ?? 'none'} />
        ) : (
          <div className="mx-auto max-w-2xl">
            <VerticalTimeline items={validItems} sectionBackground={appearance?.background ?? 'none'} />
          </div>
        )}
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
