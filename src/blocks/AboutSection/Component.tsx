import Image from 'next/image'
import * as LucideIcons from 'lucide-react'

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

type ValueItem = {
  icon?: string | null
  title?: string | null
  description?: string | null
}

type StatItem = {
  value?: string | null
  label?: string | null
}

type ListItem = {
  icon?: string | null
  text?: string | null
}

type ImageDetail = {
  description?: string | null
  enabled?: boolean | null
  eyebrow?: string | null
  value?: string | null
}

type ResolvedImageDetail = Omit<ImageDetail, 'value'> & { value: string }

type AboutSectionBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  body?: string | null
  contentAlignment?: 'left' | 'center' | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  title?: string | null
  image?: string | number | Media | null
  imageDetail?: ImageDetail | null
  imageDetailBackground?: Exclude<BlockBackground, 'none'> | null
  imageDetailPosition?: 'left' | 'right' | null
  imagePosition?: 'left' | 'right' | null
  listItems?: ListItem[] | null
  listStyle?: 'ordered' | 'unordered' | null
  mediaFillMode?: 'contained' | 'containedFill' | 'edgeToEdge' | null
  size?: RegularBlockSize | null
  stats?: StatItem[] | null
  values?: ValueItem[] | null
  variant?: 'split' | 'centered' | 'text' | null
}

const splitOrderClasses = {
  left: { content: 'md:order-2', media: 'md:order-1' },
  right: { content: 'md:order-1', media: 'md:order-2' },
} as const

const filledLayoutMinHeightClasses = {
  none: 'min-h-[24rem] md:min-h-[32rem]',
  compact: 'min-h-[18rem] md:min-h-[24rem]',
  default: 'min-h-[24rem] md:min-h-[32rem]',
  comfortable: 'min-h-[30rem] md:min-h-[40rem]',
} as const satisfies Record<RegularBlockSize, string>

const filledMediaMinHeightClasses = {
  none: 'min-h-72',
  compact: 'min-h-64',
  default: 'min-h-72',
  comfortable: 'min-h-80',
} as const satisfies Record<RegularBlockSize, string>

function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null
  const IconComponent = (LucideIcons as Record<string, unknown>)[name] as
    React.ComponentType<{ className?: string }> | undefined
  if (!IconComponent) return null
  return <IconComponent className={className} />
}

function ContentList({
  items,
  style,
  surface,
}: {
  items: ListItem[]
  style: 'ordered' | 'unordered'
  surface: 'brand' | 'light'
}) {
  const List = style === 'ordered' ? 'ol' : 'ul'
  const markerColor = surface === 'brand' ? 'text-current' : 'text-primary'

  return (
    <List className="flex flex-col gap-3 pt-1" data-about-list-style={style}>
      {items.map((item, index) => {
        const iconName = item.icon?.trim()
        const IconComponent = iconName
          ? ((LucideIcons as Record<string, unknown>)[iconName] as
              React.ComponentType<{ className?: string }> | undefined)
          : undefined

        return (
          <li className="flex items-start gap-3" key={`${item.text}-${index}`}>
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center',
                markerColor,
                !IconComponent &&
                  style === 'ordered' &&
                  'rounded-full border border-current/25 text-[0.6875rem] leading-none font-semibold tabular-nums',
              )}
              data-list-marker={
                IconComponent ? 'custom-icon' : style === 'ordered' ? 'number' : 'fallback-icon'
              }
            >
              {IconComponent ? (
                <IconComponent className="size-5" />
              ) : style === 'ordered' ? (
                index + 1
              ) : (
                <LucideIcons.CheckCircle2 className="size-5" />
              )}
            </span>
            <span className="text-base leading-7 text-current/75">{item.text?.trim()}</span>
          </li>
        )
      })}
    </List>
  )
}

function ImageDetailPanel({
  background,
  detail,
  position,
}: {
  background: Exclude<BlockBackground, 'none'>
  detail: ResolvedImageDetail
  position: 'left' | 'right'
}) {
  const panelAppearance = resolveBlockAppearanceClasses({ background, border: 'none' })

  return (
    <aside
      className={cn(
        'absolute bottom-0 z-10 w-full border-t-4 border-ring p-4 sm:w-[min(82%,20rem)] sm:p-5 lg:p-6',
        panelAppearance.className,
        position === 'left' ? 'left-0' : 'right-0',
      )}
      data-about-image-detail-background={panelAppearance.background}
      data-about-image-detail="true"
      data-about-image-detail-position={position}
    >
      {detail.eyebrow?.trim() ? (
        <SectionEyebrow surface={panelAppearance.background}>
          {detail.eyebrow.trim()}
        </SectionEyebrow>
      ) : null}
      <p className="mt-6 font-sans text-xl leading-none font-semibold tracking-tight text-current sm:text-3xl">
        {detail.value}
      </p>
      {detail.description?.trim() ? (
        <p className="mt-4 text-xs leading-6 text-current/75 sm:text-sm sm:leading-6">
          {detail.description.trim()}
        </p>
      ) : null}
    </aside>
  )
}

function BodyText({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <div className="flex flex-col gap-4 text-current/70 leading-relaxed">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

function StatsRow({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex flex-wrap gap-6 pt-2">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col">
          <span className="text-3xl font-bold text-current">{s.value?.trim()}</span>
          <span className="text-sm text-current/70">{s.label?.trim()}</span>
        </div>
      ))}
    </div>
  )
}

function ValuesGrid({ values, centered }: { values: ValueItem[]; centered?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {values.map((v, i) => (
        <div key={i} className={cn('flex flex-col gap-3', centered && 'items-center text-center')}>
          {v.icon?.trim() ? (
            <div className="flex size-10 items-center justify-center rounded-compact bg-primary/10">
              <DynamicIcon name={v.icon.trim()} className="size-5 text-primary" />
            </div>
          ) : (
            <div className="size-1.5 shrink-0 rounded-full bg-primary" />
          )}
          <div>
            {v.title?.trim() ? (
              <h4 className="font-sans text-lg font-semibold text-current">{v.title.trim()}</h4>
            ) : null}
            {v.description?.trim() ? (
              <p className="mt-1 text-base leading-7 text-current/70">{v.description.trim()}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AboutSectionBlockComponent({
  accentTitle,
  actions,
  appearance,
  body,
  contentAlignment = 'center',
  eyebrow,
  footerActions,
  title,
  image,
  imageDetail,
  imageDetailBackground = 'brand',
  imageDetailPosition = 'right',
  imagePosition = 'right',
  listItems,
  listStyle = 'unordered',
  mediaFillMode = 'contained',
  size = 'default',
  stats,
  values,
  variant = 'split',
}: AboutSectionBlockLike) {
  const resolvedBody = body?.trim()
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  if (!resolvedTitle && !resolvedBody) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const imageProps = getMediaImageProps({ media: image, preset: 'generic' })
  const resolvedStats = (stats ?? []).filter((s) => s.value?.trim() && s.label?.trim())
  const resolvedListItems = (listItems ?? []).filter((item) => item.text?.trim())
  const resolvedValues = (values ?? []).filter((v) => v.title?.trim())
  const resolvedActions = resolveCmsActions(actions)
  const hasFooterActions = resolveCmsActions(footerActions).length > 0
  const resolvedImageDetailValue = imageDetail?.value?.trim()
  const resolvedImageDetail: ResolvedImageDetail | undefined =
    imageDetail?.enabled === true && resolvedImageDetailValue
      ? { ...imageDetail, value: resolvedImageDetailValue }
      : undefined
  const resolvedImageDetailPosition = imageDetailPosition ?? 'right'
  const resolvedImageDetailBackground = imageDetailBackground ?? 'brand'
  const resolvedImageSide = imagePosition ?? 'right'
  const resolvedMediaFillMode = mediaFillMode ?? 'contained'
  const resolvedSize = size ?? 'default'
  const resolvedVariant = variant ?? 'split'
  const renderAsSplit = resolvedVariant === 'split' && Boolean(imageProps)
  const renderAsContainedFill = renderAsSplit && resolvedMediaFillMode === 'containedFill'
  const renderAsEdgeToEdge = renderAsSplit && resolvedMediaFillMode === 'edgeToEdge'
  const splitOrder = splitOrderClasses[resolvedImageSide]
  const isCenter = (contentAlignment ?? 'center') === 'center'

  const textContent = (
    <div
      className={cn(
        'flex flex-col gap-5',
        isCenter && resolvedVariant !== 'split' && 'items-center text-center',
      )}
    >
      {eyebrow?.trim() ? (
        <SectionEyebrow surface={appearanceClasses.background}>{eyebrow.trim()}</SectionEyebrow>
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
      {resolvedBody ? <BodyText text={resolvedBody} /> : null}
      {resolvedListItems.length > 0 ? (
        <ContentList
          items={resolvedListItems}
          style={listStyle ?? 'unordered'}
          surface={appearanceClasses.surface}
        />
      ) : null}
      {resolvedActions.length > 0 ? (
        <div className="mt-2">
          <ContentActions actions={resolvedActions} />
        </div>
      ) : null}
      {resolvedStats.length > 0 ? <StatsRow stats={resolvedStats} /> : null}
      {resolvedValues.length > 0 ? (
        <div className={cn(resolvedStats.length > 0 && 'mt-4 border-t border-current/15 pt-8')}>
          <ValuesGrid values={resolvedValues} centered={isCenter && resolvedVariant !== 'split'} />
        </div>
      ) : null}
    </div>
  )

  const containedImageContent = imageProps ? (
    <div
      className={cn(
        'relative aspect-4/3 w-full overflow-hidden rounded-card',
        renderAsSplit && resolvedMediaFillMode === 'contained' && 'md:h-full md:aspect-auto',
      )}
    >
      <Image
        src={imageProps.src}
        alt={imageProps.alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {resolvedImageDetail ? (
        <ImageDetailPanel
          background={resolvedImageDetailBackground}
          detail={resolvedImageDetail}
          position={resolvedImageDetailPosition}
        />
      ) : null}
    </div>
  ) : null

  const filledContentPaddingClasses =
    resolvedImageSide === 'right' ? 'md:py-16 md:pr-8 lg:pr-12' : 'md:px-8 md:py-16 lg:px-12'

  const edgeContentPaddingClasses =
    resolvedImageSide === 'right'
      ? 'pr-4 md:py-16 md:pr-8 lg:pr-12'
      : 'px-4 md:px-8 md:py-16 lg:px-12'

  const sectionPaddingClasses =
    renderAsContainedFill || renderAsEdgeToEdge
      ? cn(regularBlockMobilePaddingClasses[resolvedSize], 'md:py-0')
      : regularBlockMobilePaddingClasses[resolvedSize]

  const renderFilledImage = (frame: 'containedFill' | 'edgeToEdge') =>
    imageProps ? (
      <div
        className={cn(
          'relative aspect-4/3 overflow-hidden md:aspect-auto',
          frame === 'edgeToEdge' ? 'md:min-h-full' : 'md:h-full',
          frame === 'edgeToEdge' && filledMediaMinHeightClasses[resolvedSize],
        )}
        data-about-media-frame={frame}
      >
        <Image
          alt={imageProps.alt}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          src={imageProps.src}
        />
        {resolvedImageDetail ? (
          <ImageDetailPanel
            background={resolvedImageDetailBackground}
            detail={resolvedImageDetail}
            position={resolvedImageDetailPosition}
          />
        ) : null}
      </div>
    ) : null

  return (
    <section
      className={cn(sectionPaddingClasses, appearanceClasses.className)}
      data-about-image-side={renderAsSplit ? resolvedImageSide : 'contentOnly'}
      data-about-media-fill={renderAsSplit ? resolvedMediaFillMode : 'contentOnly'}
      data-about-variant={resolvedVariant}
    >
      {renderAsEdgeToEdge ? (
        <>
          <div
            className={cn(
              'grid items-stretch gap-8 md:grid-cols-2 md:gap-0',
              filledLayoutMinHeightClasses[resolvedSize],
            )}
          >
            <div className={splitOrder.media}>{renderFilledImage('edgeToEdge')}</div>
            <div className={splitOrder.content}>
              {resolvedImageSide === 'right' ? (
                <div className="ml-auto h-full w-full max-w-[calc(var(--breakpoint-2xl)/2)] pl-4">
                  <div
                    className={cn(
                      'flex min-h-full flex-col justify-center',
                      edgeContentPaddingClasses,
                    )}
                  >
                    <div className="mr-auto w-full max-w-xl text-left">{textContent}</div>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex min-h-full flex-col justify-center',
                    edgeContentPaddingClasses,
                  )}
                >
                  <div className="mr-auto w-full max-w-xl text-left">{textContent}</div>
                </div>
              )}
            </div>
          </div>
          {hasFooterActions ? (
            <div className={regularBlockContainerClasses}>
              <BlockFooterActions actions={footerActions} />
            </div>
          ) : null}
        </>
      ) : renderAsContainedFill ? (
        <div className={regularBlockContainerClasses}>
          <div
            className={cn(
              'grid items-stretch gap-8 md:grid-cols-2 md:gap-0',
              filledLayoutMinHeightClasses[resolvedSize],
            )}
          >
            <div className={splitOrder.media}>{renderFilledImage('containedFill')}</div>
            <div
              className={cn(
                splitOrder.content,
                'flex min-h-full flex-col justify-center',
                filledContentPaddingClasses,
              )}
            >
              <div className="w-full max-w-xl text-left">{textContent}</div>
            </div>
          </div>
          <BlockFooterActions actions={footerActions} />
        </div>
      ) : (
        <div className={regularBlockContainerClasses}>
          {renderAsSplit ? (
            <div className="grid items-stretch gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
              <div className={cn(splitOrder.media, 'md:h-full')} data-about-media-frame="contained">
                {containedImageContent}
              </div>
              <div className={cn(splitOrder.content, 'w-full max-w-xl text-left')}>
                {textContent}
              </div>
            </div>
          ) : resolvedVariant === 'centered' ? (
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
              <div className="flex flex-col items-center gap-5">
                {eyebrow?.trim() ? (
                  <SectionEyebrow surface={appearanceClasses.background}>
                    {eyebrow.trim()}
                  </SectionEyebrow>
                ) : null}
                {resolvedTitle ? (
                  <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                    {resolvedTitle}
                  </h2>
                ) : null}
                {resolvedBody ? <BodyText text={resolvedBody} /> : null}
                {resolvedListItems.length > 0 ? (
                  <ContentList
                    items={resolvedListItems}
                    style={listStyle ?? 'unordered'}
                    surface={appearanceClasses.surface}
                  />
                ) : null}
                {resolvedActions.length > 0 ? (
                  <div className="mt-2">
                    <ContentActions actions={resolvedActions} />
                  </div>
                ) : null}
                {resolvedStats.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-8 pt-2">
                    {resolvedStats.map((stat, index) => (
                      <div className="flex flex-col items-center" key={index}>
                        <span className="text-3xl font-bold text-current">
                          {stat.value?.trim()}
                        </span>
                        <span className="text-sm text-current/70">{stat.label?.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {containedImageContent}
              {resolvedValues.length > 0 ? (
                <div className="w-full text-left">
                  <ValuesGrid values={resolvedValues} />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl">{textContent}</div>
          )}
          <BlockFooterActions actions={footerActions} />
        </div>
      )}
    </section>
  )
}
