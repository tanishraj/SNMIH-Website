import { RichText } from '@payloadcms/richtext-lexical/react'
import { CalendarDays, FolderOpen, MapPin, UserRound } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import { resolveMediaOverlay } from '@/blocks/shared/mediaOverlayPresentation'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { resolveCardSurface, type CardSurfaceClasses } from '@/blocks/shared/cardSurface'
import { ContentActions } from '@/components/ContentActions'
import { NewsEventShareActions } from '@/components/news-events/NewsEventShareActions'
import { longFormRichTextClasses } from '@/components/rich-text/richTextStyles'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { ResolvedNewsEventsContentSettings } from '@/lib/newsEventDetailTemplateShared'
import { newsEventObjectPositionClasses, type PublicNewsEventDetail } from '@/lib/newsEventsShared'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'
import { cn } from '@/lib/utils'

type ArticleTemplate = ResolvedNewsEventsContentSettings

const featuredImageRatioClasses = {
  wide: 'aspect-[2/1]',
  video: 'aspect-video',
  standard: 'aspect-[4/3]',
} as const

function StoryDetail({
  icon,
  label,
  value,
  valueClassName,
  surface,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  valueClassName?: string
  surface: CardSurfaceClasses
}) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
      <span
        aria-hidden="true"
        className={cn('mt-0.5 flex size-8 items-center justify-center bg-current/5', surface.icon)}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt
          className={cn(
            'font-mono text-xs font-normal tracking-[0.14em] uppercase',
            surface.secondary,
          )}
          data-news-event-detail-label="true"
        >
          {label}
        </dt>
        <dd
          className={cn(
            'mt-1 break-words font-[family-name:var(--font-text)] text-sm leading-5 font-medium',
            valueClassName,
          )}
          data-news-event-detail-value="true"
        >
          {value}
        </dd>
      </div>
    </div>
  )
}

function SidebarCard({
  article,
  children,
  heading,
  surface,
}: {
  article: ArticleTemplate
  children: ReactNode
  heading: string
  surface: CardSurfaceClasses
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-5 rounded-card p-5 sm:p-6',
        surface.className,
        article.sidebarCardOutline && 'border',
        article.sidebarCardOutline && surface.divider,
      )}
    >
      <h2 className="text-base font-semibold tracking-tight">{heading}</h2>
      {children}
    </section>
  )
}

function StoryDetailsCard({
  article,
  entry,
  surface,
}: {
  article: ArticleTemplate
  entry: PublicNewsEventDetail
  surface: CardSurfaceClasses
}) {
  const isEvent = entry.behavior === 'event'
  const dateLabel = entry.dateLabel
  const categoryLabel = entry.classification.title

  return (
    <SidebarCard article={article} heading="Story Details" surface={surface}>
      <dl className="flex flex-col gap-5" data-news-event-story-details="true">
        <StoryDetail
          icon={<UserRound className="size-4" />}
          label="Author"
          surface={surface}
          value={article.authorLabel}
        />
        {dateLabel ? (
          <StoryDetail
            icon={<CalendarDays className="size-4" />}
            label={isEvent ? 'Event Date' : 'Date'}
            surface={surface}
            value={<time dateTime={entry.dateISO}>{dateLabel}</time>}
            valueClassName="tabular-nums"
          />
        ) : null}
        <StoryDetail
          icon={<FolderOpen className="size-4" />}
          label="Category"
          surface={surface}
          value={categoryLabel}
        />
        {isEvent && entry.eventLocation ? (
          <StoryDetail
            icon={<MapPin className="size-4" />}
            label="Location"
            surface={surface}
            value={entry.eventLocation}
          />
        ) : null}
      </dl>
      {isEvent && entry.eventRegistrationAction ? (
        <div className={cn('border-t pt-5', surface.divider)}>
          <ContentActions
            actions={[entry.eventRegistrationAction]}
            buttonClassNames={surface.button}
            linkClassName={surface.link}
          />
        </div>
      ) : null}
    </SidebarCard>
  )
}

export function NewsEventStory({
  article,
  entry,
}: {
  article: ArticleTemplate
  entry: PublicNewsEventDetail
}) {
  const appearance = resolveBlockAppearanceClasses(article.appearance)
  const cardSurface = resolveCardSurface(article.sidebarCardBackground, appearance.background)
  const classificationLabel = entry.classification.badgeLabel
  const usesFallbackImage = !entry.image
  const image = entry.image ?? {
    alt: '',
    position: 'center' as const,
    src: '/images/snmih-news-events-default.png',
  }
  const overlay = resolveMediaOverlay({
    coverage: article.coverage,
    direction: article.direction,
    sectionBackground: appearance.background,
    strength: article.strength,
    tone: article.tone,
  })

  return (
    <article
      className={cn(regularBlockMobilePaddingClasses[article.size], appearance.className)}
      data-block-surface={appearance.surface}
      data-news-event-story="true"
    >
      <div
        className={cn(
          regularBlockContainerClasses,
          'grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_30rem] lg:gap-12',
        )}
      >
        <div className="flex min-w-0 flex-col gap-8" data-news-event-main-content="true">
          <div
            className={cn(
              'relative isolate min-h-80 overflow-hidden rounded-card border border-border bg-muted md:min-h-0',
              featuredImageRatioClasses[article.featuredImageRatio],
            )}
            data-news-event-featured-image="true"
          >
            <Image
              fill
              alt={image.alt}
              className={cn('-z-20 object-cover', newsEventObjectPositionClasses[image.position])}
              data-news-event-image-fallback={usesFallbackImage ? 'true' : undefined}
              priority
              sizes="(max-width: 1024px) 100vw, calc(100vw - 24rem)"
              src={image.src}
            />
            <div
              className={cn('absolute -z-10', overlay.frameClassName, overlay.className)}
              data-news-event-image-overlay="true"
              data-overlay-coverage={overlay.coverage}
              data-overlay-direction={overlay.direction}
              data-overlay-strength={overlay.strength}
              data-overlay-tone={overlay.tone}
            />
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-6 sm:p-8',
                overlay.text.title,
              )}
            >
              <SectionEyebrow
                data-news-event-overlay-eyebrow="true"
                surface={overlay.eyebrowSurface}
              >
                {classificationLabel}
              </SectionEyebrow>
              <h1
                className="max-w-4xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
                data-news-event-overlay-title="true"
              >
                {entry.title}
              </h1>
            </div>
          </div>

          <p
            className="text-base leading-7 text-current/80 sm:text-lg"
            data-news-event-excerpt="true"
          >
            {entry.excerpt}
          </p>

          <div className={cn('min-w-0', longFormRichTextClasses)} data-news-event-rich-text="true">
            <RichText data={entry.body} />
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-28">
          <StoryDetailsCard article={article} entry={entry} surface={cardSurface} />
          {article.showShareActions ? (
            <SidebarCard article={article} heading="Share This" surface={cardSurface}>
              <NewsEventShareActions title={entry.title} url={toAbsoluteSiteUrl(entry.href)} />
            </SidebarCard>
          ) : null}
        </aside>
      </div>
    </article>
  )
}
