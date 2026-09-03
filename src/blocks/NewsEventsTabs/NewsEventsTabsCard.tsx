import { ContentLink } from '@/components/ContentLink'
import { NewsEventClassificationBadge } from '@/components/news-events/NewsEventClassificationBadge'
import { NewsEventDateMeta } from '@/components/news-events/NewsEventDateMeta'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { PublicNewsEventCard } from '@/lib/newsEventsShared'

type NewsEventsTabsCardProps = {
  eventActionLabel: string
  item: PublicNewsEventCard
  newsActionLabel: string
}

export function NewsEventsTabsCard({
  eventActionLabel,
  item,
  newsActionLabel,
}: NewsEventsTabsCardProps) {
  const isEvent = item.behavior === 'event'
  const dateLabel = item.dateLabel

  return (
    <Card
      className="h-full min-h-[18rem] gap-0 rounded-card bg-card py-0 text-card-foreground shadow-none ring-1 ring-border dark:ring-border"
      data-news-events-tabs-card="true"
      data-news-events-tabs-card-type={item.classification.slug}
    >
      <CardHeader className="gap-4 rounded-none px-6 pt-6 sm:px-7 sm:pt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <NewsEventClassificationBadge classification={item.classification} />
          {dateLabel ? (
            <NewsEventDateMeta
              className="text-muted-foreground"
              dateISO={item.dateISO}
              dateLabel={dateLabel}
            />
          ) : null}
        </div>

        <h3 className="line-clamp-3 font-sans text-xl leading-snug font-semibold tracking-tight text-foreground">
          {item.title}
        </h3>
      </CardHeader>

      {item.excerpt?.trim() ? (
        <CardContent className="px-6 pt-4 text-base leading-6 font-normal text-muted-foreground sm:px-7">
          <p className="line-clamp-4">{item.excerpt.trim()}</p>
        </CardContent>
      ) : null}

      <CardFooter className="mt-auto rounded-none px-6 pb-6 pt-6 sm:px-7 sm:pb-7">
        <ContentLink href={item.href} label={isEvent ? eventActionLabel : newsActionLabel} />
      </CardFooter>
    </Card>
  )
}
