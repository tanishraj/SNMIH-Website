import { ArrowRight, Star, type LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockMobilePaddingClasses,
  regularBlockContainerClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import {
  contentItemDescriptionClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'
import { Button } from '@/components/ui/button'
import { ContentActions } from '@/components/ContentActions'
import { ContentLink } from '@/components/ContentLink'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue, type CmsActionVariant } from '@/lib/cmsLinks'
import { getPageHref } from '@/lib/pagePaths'
import type { Page } from '@/payload-types'
import { cn } from '@/lib/utils'
import { resolveCardSurface, type CardSurfaceClasses } from '@/blocks/shared/cardSurface'

type IconGridCardBackground = 'default' | 'subtle' | 'brand' | 'gradient-subtle' | 'gradient-brand'

type IconGridCardSurface = Omit<CardSurfaceClasses, 'value'> & {
  value: IconGridCardBackground
}

type IconGridItem = {
  cardBackground?: IconGridCardBackground | 'primary' | 'secondary' | 'muted' | 'accent' | null
  description?: string | null
  icon?: string | null
  linkType?: 'none' | 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  title?: string | null
  url?: string | null
}

type IconGridBlockLike = {
  accentTitle?: string | null
  // Presentation of the per-item card CTAs; the section actions carry their own.
  actionMode?: 'button' | 'link' | null
  actionVariant?: CmsActionVariant | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: '2' | '3' | '4' | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  iconStyle?: 'square' | 'circle' | 'outline' | 'plain' | null
  itemActionLabel?: string | null
  items?: IconGridItem[] | null
  size?: RegularBlockSize | null
  title?: string | null
  variant?: 'card' | 'contactCards' | 'minimal' | 'iconTop' | 'ruled' | null
}

const columnClasses = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
} as const

const ruledColumnClasses: Record<NonNullable<IconGridBlockLike['columns']>, string> = {
  '2': 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l',
  '3': 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-3 lg:[&>*:nth-child(-n+3)]:border-t-0 lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
  '4': 'sm:grid-cols-2 sm:[&>*:nth-child(-n+2)]:border-t-0 sm:[&>*:nth-child(2n)]:border-l lg:grid-cols-4 lg:[&>*:nth-child(-n+4)]:border-t-0 lg:[&>*:nth-child(4n+1)]:border-l-0 lg:[&>*:nth-child(4n+2)]:border-l lg:[&>*:nth-child(4n+3)]:border-l lg:[&>*:nth-child(4n)]:border-l',
}

const iconContainerClasses = {
  square: 'flex size-11 shrink-0 items-center justify-center rounded-compact bg-primary/10 text-primary',
  circle:
    'flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
  outline:
    'flex size-11 shrink-0 items-center justify-center rounded-compact border border-border text-primary',
  plain: 'flex size-11 shrink-0 items-center justify-center text-primary',
} as const

function normalizeIconGridCardBackground(value?: string | null): IconGridCardBackground {
  if (
    value === 'subtle' ||
    value === 'brand' ||
    value === 'gradient-subtle' ||
    value === 'gradient-brand'
  ) {
    return value
  }

  if (value === 'primary') return 'brand'
  if (value === 'secondary' || value === 'muted' || value === 'accent') return 'subtle'

  return 'default'
}

function resolveIconGridCardSurface(
  value: IconGridItem['cardBackground'],
  sectionBackground: BlockBackground,
): IconGridCardSurface {
  const background = normalizeIconGridCardBackground(value)
  const surfaceBackground =
    background === 'default'
      ? sectionBackground
      : background === 'gradient-brand'
        ? 'gradient-subtle'
        : background
  const inheritedSurface = resolveCardSurface('default', surfaceBackground)

  if (background === 'default') {
    return { ...inheritedSurface, value: background }
  }

  const className =
    background === 'gradient-brand'
      ? 'bg-card-gradient-brand text-foreground'
      : resolveBlockAppearanceClasses({ background, border: 'none' }).className
  const icon =
    background === 'brand'
      ? 'bg-primary-foreground/10 text-primary-foreground'
      : background === 'gradient-brand'
        ? 'bg-primary/10 text-primary'
        : inheritedSurface.icon

  return { ...inheritedSurface, className, icon, value: background }
}

function resolveHref(item: IconGridItem): { href: string; openInNewTab: boolean } | undefined {
  if (item.linkType === 'custom' && item.url?.trim()) {
    return { href: item.url.trim(), openInNewTab: item.openInNewTab ?? false }
  }
  if (item.linkType === 'page' && item.page) {
    const href = getPageHref(item.page)
    if (href) return { href, openInNewTab: item.openInNewTab ?? false }
  }
  return undefined
}

function IconContainer({
  icon,
  iconStyle,
  inheritOutlineBorder = false,
  surface,
}: {
  icon: string
  iconStyle: keyof typeof iconContainerClasses
  inheritOutlineBorder?: boolean
  surface?: Pick<CardSurfaceClasses, 'divider' | 'icon'>
}) {
  const Icon = ((LucideIcons as Record<string, unknown>)[icon] as LucideIcon | undefined) ?? Star
  return (
    <div
      className={cn(
        iconContainerClasses[iconStyle],
        surface?.icon,
        inheritOutlineBorder && iconStyle === 'outline' && surface?.divider,
      )}
    >
      <Icon className="size-5" />
    </div>
  )
}

type ActionProps = {
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  actionLabel: string
  link: { href: string; openInNewTab: boolean }
  surface?: Pick<CardSurfaceClasses, 'button' | 'link'>
}

function CardAction({ actionMode, actionVariant, actionLabel, link, surface }: ActionProps) {
  if (actionMode === 'button') {
    return (
      <Button
        asChild
        size="sm"
        variant={actionVariant}
        className={cn('mt-auto self-start', surface?.button[actionVariant])}
      >
        <a
          href={link.href}
          target={link.openInNewTab ? '_blank' : undefined}
          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {actionLabel}
        </a>
      </Button>
    )
  }
  return (
    <div
      className={cn(
        'mt-auto flex items-center gap-1 text-sm font-medium',
        surface?.link ?? 'text-primary',
      )}
    >
      {actionLabel}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </div>
  )
}

// ── Card variant ──────────────────────────────────────────────────────────────
function CardItem({
  item,
  iconStyle,
  actionMode,
  actionVariant,
  actionLabel,
  sectionBackground,
}: {
  item: IconGridItem
  iconStyle: keyof typeof iconContainerClasses
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  actionLabel: string
  sectionBackground: BlockBackground
}) {
  const link = resolveHref(item)
  const surface = resolveIconGridCardSurface(item.cardBackground, sectionBackground)
  const inner = (
    <div
      data-card-background={surface.value}
      className={cn(
        'group flex h-full flex-col gap-4 rounded-card border p-6 transition-shadow',
        surface.className,
        surface.divider,
        link && 'hover:shadow-md hover:border-primary/30',
      )}
    >
      {item.icon ? (
        <IconContainer icon={item.icon} iconStyle={iconStyle} surface={surface} />
      ) : null}
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-sans text-base font-semibold leading-snug text-current">
          {item.title?.trim()}
        </h3>
        {item.description?.trim() ? (
          <p className={cn('text-sm leading-relaxed', surface.secondary)}>
            {item.description.trim()}
          </p>
        ) : null}
      </div>
      {link ? (
        <CardAction
          actionMode={actionMode}
          actionVariant={actionVariant}
          actionLabel={actionLabel}
          link={link}
          surface={surface}
        />
      ) : null}
    </div>
  )

  if (link && actionMode === 'link') {
    return (
      <a
        href={link.href}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        className="block h-full rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {inner}
      </a>
    )
  }
  return <div className="h-full">{inner}</div>
}

const phonePattern = /^\+?[\d][\d\s()./-]{5,}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolveContactLine(value: string): { href?: string; label: string } {
  const label = value.trim()

  if (phonePattern.test(label)) {
    return { href: `tel:${label.replace(/[^\d+]/g, '')}`, label }
  }

  if (emailPattern.test(label)) {
    return { href: `mailto:${label}`, label }
  }

  return { label }
}

function ContactCardItem({
  actionLabel,
  actionMode,
  actionVariant,
  iconStyle,
  item,
  sectionBackground,
}: {
  actionLabel: string
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  iconStyle: keyof typeof iconContainerClasses
  item: IconGridItem
  sectionBackground: BlockBackground
}) {
  const link = resolveHref(item)
  const surface = resolveIconGridCardSurface(item.cardBackground, sectionBackground)
  const contactLines = (item.description ?? '')
    .split(/\r?\n/)
    .map(resolveContactLine)
    .filter(({ label }) => label.length > 0)

  return (
    <article
      className={cn(
        'flex min-h-64 flex-col gap-6 rounded-card border p-8 sm:min-h-72',
        surface.className,
        surface.divider,
      )}
      data-card-background={surface.value}
      data-icon-grid-presentation="contactCards"
    >
      {item.icon ? (
        <div className="[&>div]:size-14 [&>div]:rounded-compact [&_svg]:size-6">
          <IconContainer icon={item.icon} iconStyle={iconStyle} surface={surface} />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-2xl leading-tight font-semibold tracking-tight text-current">
          {item.title?.trim()}
        </h3>

        {contactLines.length ? (
          <address
            className={cn('flex flex-col gap-1 not-italic text-base leading-7', surface.secondary)}
          >
            {contactLines.map(({ href, label }, index) =>
              href ? (
                <a
                  className="w-fit rounded-compact underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  href={href}
                  key={`${label}-${index}`}
                >
                  {label}
                </a>
              ) : (
                <span key={`${label}-${index}`}>{label}</span>
              ),
            )}
          </address>
        ) : null}
      </div>

      {link ? (
        actionMode === 'button' ? (
          <Button
            asChild
            className={cn('self-start', surface.button[actionVariant])}
            size="sm"
            variant={actionVariant}
          >
            <a
              href={link.href}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              target={link.openInNewTab ? '_blank' : undefined}
            >
              {actionLabel}
            </a>
          </Button>
        ) : (
          <ContentLink
            className={surface.link}
            href={link.href}
            label={actionLabel}
            openInNewTab={link.openInNewTab}
          />
        )
      ) : null}
    </article>
  )
}

// ── Minimal variant ───────────────────────────────────────────────────────────
function MinimalItem({
  item,
  iconStyle,
  actionMode,
  actionVariant,
  actionLabel,
}: {
  item: IconGridItem
  iconStyle: keyof typeof iconContainerClasses
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  actionLabel: string
}) {
  const link = resolveHref(item)
  const inner = (
    <div className="group flex flex-col gap-3">
      <div className="flex gap-4">
        {item.icon ? <IconContainer icon={item.icon} iconStyle={iconStyle} /> : null}
        <div className="flex flex-col gap-1">
          <h3 className="font-sans text-base font-semibold leading-snug text-current">
            {item.title?.trim()}
          </h3>
          {item.description?.trim() ? (
            <p className="text-sm leading-relaxed text-current/70">{item.description.trim()}</p>
          ) : null}
        </div>
      </div>
      {link ? (
        <CardAction
          actionMode={actionMode}
          actionVariant={actionVariant}
          actionLabel={actionLabel}
          link={link}
        />
      ) : null}
    </div>
  )

  if (link && actionMode === 'link') {
    return (
      <a
        href={link.href}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        className="block focus-visible:outline-none"
      >
        {inner}
      </a>
    )
  }
  return <div>{inner}</div>
}

// ── Icon Top variant ──────────────────────────────────────────────────────────
function IconTopItem({
  item,
  iconStyle,
  actionMode,
  actionVariant,
  actionLabel,
}: {
  item: IconGridItem
  iconStyle: keyof typeof iconContainerClasses
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  actionLabel: string
}) {
  const link = resolveHref(item)
  const inner = (
    <div className="group flex h-full flex-col items-center gap-3 text-center">
      {item.icon ? <IconContainer icon={item.icon} iconStyle={iconStyle} /> : null}
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-base font-semibold leading-snug text-current">
          {item.title?.trim()}
        </h3>
        {item.description?.trim() ? (
          <p className="text-sm leading-relaxed text-current/70">{item.description.trim()}</p>
        ) : null}
      </div>
      {link ? (
        <CardAction
          actionMode={actionMode}
          actionVariant={actionVariant}
          actionLabel={actionLabel}
          link={link}
        />
      ) : null}
    </div>
  )

  if (link && actionMode === 'link') {
    return (
      <a
        href={link.href}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        className="block h-full focus-visible:outline-none"
      >
        {inner}
      </a>
    )
  }
  return <div className="h-full">{inner}</div>
}

// ── Ruled Columns variant ─────────────────────────────────────────────────────
function RuledItem({
  actionLabel,
  actionMode,
  actionVariant,
  iconStyle,
  item,
  surface,
}: {
  actionLabel: string
  actionMode: 'button' | 'link'
  actionVariant: CmsActionVariant
  iconStyle: keyof typeof iconContainerClasses
  item: IconGridItem
  surface: CardSurfaceClasses
}) {
  const link = resolveHref(item)
  const content = (
    <>
      {item.icon ? (
        <IconContainer
          icon={item.icon}
          iconStyle={iconStyle}
          inheritOutlineBorder
          surface={surface}
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-3">
        <h3 className={contentItemTitleClasses}>{item.title?.trim()}</h3>
        {item.description?.trim() ? (
          <p
            className={cn(contentItemDescriptionClasses, 'whitespace-pre-line', surface.secondary)}
          >
            {item.description.trim()}
          </p>
        ) : null}
      </div>
      {link ? (
        <CardAction
          actionLabel={actionLabel}
          actionMode={actionMode}
          actionVariant={actionVariant}
          link={link}
          surface={surface}
        />
      ) : null}
    </>
  )
  const itemClasses = cn(
    'group flex h-full min-w-0 flex-col gap-6 px-6 py-8 sm:p-8 lg:p-10',
    surface.divider,
  )

  if (link && actionMode === 'link') {
    return (
      <a
        className={cn(
          itemClasses,
          'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
        )}
        data-icon-grid-presentation="ruled"
        href={link.href}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
        target={link.openInNewTab ? '_blank' : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <article className={itemClasses} data-icon-grid-presentation="ruled">
      {content}
    </article>
  )
}

export function IconGridBlockComponent({
  accentTitle,
  actionMode,
  actionVariant,
  actions,
  appearance,
  columns = '3',
  contentAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  iconStyle = 'square',
  itemActionLabel,
  items,
  size = 'default',
  title,
  variant = 'card',
}: IconGridBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim() || undefined

  const validItems = (items ?? []).filter((item) => item.title?.trim())
  if (validItems.length === 0) return null

  const { background: sectionBackground, className: appearanceClassName } =
    resolveBlockAppearanceClasses(appearance)
  const ruledSurface = resolveCardSurface('default', sectionBackground)
  const isCenter = (contentAlignment ?? 'center') === 'center'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedColumns = columns ?? '3'
  const resolvedIconStyle = (iconStyle ?? 'square') as keyof typeof iconContainerClasses
  const resolvedVariant = variant ?? 'card'
  const resolvedActionMode = actionMode ?? 'link'
  const resolvedActionVariant = actionVariant ?? 'default'
  const resolvedActionLabel = itemActionLabel?.trim() || 'Learn More'
  const itemProps = {
    iconStyle: resolvedIconStyle,
    actionMode: resolvedActionMode,
    actionVariant: resolvedActionVariant,
    actionLabel: resolvedActionLabel,
    sectionBackground,
  }
  const hasHeader = Boolean(
    eyebrow?.trim() || resolvedTitle || description?.trim() || resolvedActions.length,
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
    >
      <div className={regularBlockContainerClasses}>
        {/* Header */}
        {hasHeader ? (
          <div
            className={cn(
              'mb-12 flex flex-col gap-4',
              isCenter ? 'mx-auto max-w-3xl items-center text-center' : 'items-start',
            )}
          >
            {eyebrow?.trim() ? (
              <SectionEyebrow surface={sectionBackground}>{eyebrow.trim()}</SectionEyebrow>
            ) : null}
            {resolvedTitle ? (
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

        {/* Grid */}
        <div
          className={cn(
            'grid grid-cols-1',
            resolvedVariant === 'ruled'
              ? cn(
                  'gap-0 border-y [&>*]:border-t [&>*:first-child]:border-t-0',
                  ruledColumnClasses[resolvedColumns],
                  ruledSurface.divider,
                )
              : cn('gap-6', columnClasses[resolvedColumns]),
          )}
          data-icon-grid-grid={resolvedVariant === 'ruled' ? 'ruled' : undefined}
        >
          {validItems.map((item, index) => {
            if (resolvedVariant === 'contactCards') {
              return <ContactCardItem key={index} item={item} {...itemProps} />
            }
            if (resolvedVariant === 'minimal') {
              return <MinimalItem key={index} item={item} {...itemProps} />
            }
            if (resolvedVariant === 'iconTop') {
              return <IconTopItem key={index} item={item} {...itemProps} />
            }
            if (resolvedVariant === 'ruled') {
              return <RuledItem key={index} item={item} {...itemProps} surface={ruledSurface} />
            }
            return <CardItem key={index} item={item} {...itemProps} />
          })}
        </div>
        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
