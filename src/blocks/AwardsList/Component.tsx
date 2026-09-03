import { Award, Medal, Star, TrendingUp, Trophy } from 'lucide-react'

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
import { cn } from '@/lib/utils'
import { resolveCardSurface, type CardSurfaceClasses } from '@/blocks/shared/cardSurface'

type AwardCategory = 'accreditation' | 'ranking' | 'award' | 'recognition' | 'milestone'

type AwardItem = {
  cardBackground?: string | null
  title?: string | null
  organization?: string | null
  category?: AwardCategory | null
  year?: string | null
  description?: string | null
}

type AwardsListBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  awards?: AwardItem[] | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  title?: string | null
  size?: RegularBlockSize | null
  variant?: 'cards' | 'table' | 'rows' | null
}

const categoryConfig: Record<
  AwardCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  accreditation: { label: 'Accreditation', icon: Medal, color: 'bg-primary/10 text-primary' },
  ranking: { label: 'Ranking', icon: TrendingUp, color: 'bg-secondary text-secondary-foreground' },
  award: { label: 'Award', icon: Trophy, color: 'bg-accent text-accent-foreground' },
  recognition: { label: 'Recognition', icon: Star, color: 'bg-muted text-foreground' },
  milestone: { label: 'Milestone', icon: Award, color: 'bg-destructive/10 text-destructive' },
}

function CategoryBadge({
  category,
  surface,
}: {
  category?: AwardCategory | null
  surface?: CardSurfaceClasses
}) {
  const cat = category ?? 'recognition'
  const { label, icon: Icon, color } = categoryConfig[cat]
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        surface?.value === 'primary' ? 'bg-primary-foreground/15 text-primary-foreground' : color,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  )
}

export function AwardsListBlockComponent({
  accentTitle,
  actions,
  appearance,
  awards,
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  title,
  size = 'default',
  variant = 'cards',
}: AwardsListBlockLike) {
  const items = (awards ?? []).filter((a) => a.title?.trim())
  if (!items.length) return null

  const { className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const isCenter = (contentAlignment ?? 'left') === 'center'
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
              <SectionEyebrow surface={sectionBackground}>{eyebrow.trim()}</SectionEyebrow>
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

        {/* Cards variant */}
        {variant === 'cards' || !variant ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const cat = (item.category ?? 'recognition') as AwardCategory
              const { icon: Icon, color } = categoryConfig[cat]
              const surface = resolveCardSurface(item.cardBackground, sectionBackground)
              return (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col gap-3 rounded-card border p-5',
                    surface.className,
                    surface.divider,
                  )}
                  data-card-background={surface.value}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-compact',
                        surface.value === 'primary'
                          ? 'bg-primary-foreground/15 text-primary-foreground'
                          : color,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    {item.year?.trim() ? (
                      <span className={cn('text-xs font-medium', surface.secondary)}>
                        {item.year.trim()}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-sans font-semibold leading-tight text-current">
                      {item.title?.trim()}
                    </h3>
                    {item.organization?.trim() ? (
                      <p className={cn('text-sm', surface.secondary)}>{item.organization.trim()}</p>
                    ) : null}
                    {item.description?.trim() ? (
                      <p className={cn('mt-1 text-sm', surface.secondary)}>
                        {item.description.trim()}
                      </p>
                    ) : null}
                  </div>
                  <CategoryBadge category={item.category} surface={surface} />
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Table variant */}
        {variant === 'table' ? (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-foreground">
                  <th className="px-4 py-3 text-left font-semibold text-current">
                    Award / Accreditation
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-current sm:table-cell">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-current">Category</th>
                  <th className="hidden px-4 py-3 text-right font-semibold text-current md:table-cell">
                    Year
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-current">{item.title?.trim()}</p>
                      {item.description?.trim() ? (
                        <p className="mt-0.5 text-xs text-current/70">{item.description.trim()}</p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-current/70 sm:table-cell">
                      {item.organization?.trim() ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="hidden px-4 py-3 text-right text-current/70 md:table-cell">
                      {item.year?.trim() ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Rows variant */}
        {variant === 'rows' ? (
          <div className="flex flex-col divide-y divide-border">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                  <p className="font-semibold text-current sm:flex-1">{item.title?.trim()}</p>
                  {item.organization?.trim() ? (
                    <p className="text-sm text-current/70 sm:w-40 sm:shrink-0">
                      {item.organization.trim()}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <CategoryBadge category={item.category} />
                  {item.year?.trim() ? (
                    <span className="text-xs text-current/70">{item.year.trim()}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
