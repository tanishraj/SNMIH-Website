import Link from 'next/link'

import { ActionArrow } from '@/components/ActionArrow'
import { NewsEventClassificationBadge } from '@/components/news-events/NewsEventClassificationBadge'
import { NewsEventDateMeta } from '@/components/news-events/NewsEventDateMeta'
import type { PublicNewsEventCard } from '@/lib/newsEventsShared'

type NewsEventsTabsRowProps = {
  item: PublicNewsEventCard
}

export function NewsEventsTabsRow({ item }: NewsEventsTabsRowProps) {
  const dateLabel = item.dateLabel
  const excerpt = item.excerpt?.trim()

  return (
    <Link
      className="group/button grid min-h-40 gap-y-5 border-t border-border px-1 py-7 text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4 lg:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(6rem,0.35fr)] lg:items-start lg:gap-x-8"
      data-news-events-tabs-row="true"
      href={item.href}
    >
      <div className="min-w-0 lg:self-center" data-news-events-tabs-row-date="true">
        {dateLabel ? (
          <NewsEventDateMeta
            className="text-muted-foreground"
            dateISO={item.dateISO}
            dateLabel={dateLabel}
          />
        ) : null}
      </div>

      <div
        className="flex min-w-0 flex-col items-start gap-3"
        data-news-events-tabs-row-title="true"
      >
        <NewsEventClassificationBadge classification={item.classification} />
        <h3 className="line-clamp-2 font-sans text-xl leading-snug font-semibold tracking-tight">
          {item.title}
        </h3>
      </div>

      {excerpt ? (
        <p className="line-clamp-3 min-w-0 text-base leading-6 font-normal text-muted-foreground">
          {excerpt}
        </p>
      ) : (
        <span aria-hidden="true" data-news-events-tabs-row-description-placeholder="true" />
      )}

      <span className="ml-auto self-end lg:self-center" data-news-events-tabs-row-arrow="true">
        <ActionArrow />
      </span>
    </Link>
  )
}
