import {
  type AnnouncementDisplayMode,
  type AnnouncementItemInput,
} from '@/components/announcement/AnnouncementBar'
import { MarqueeAnnouncementContent } from '@/components/announcement/MarqueeAnnouncementContent'
import { RotatingAnnouncementContent } from '@/components/announcement/RotatingAnnouncementContent'
import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import { Megaphone } from 'lucide-react'

type AnnouncementBlockLike = {
  appearance?: BlockAppearance | null
  displayMode?: AnnouncementDisplayMode | null
  intervalMs?: number | null
  items?: AnnouncementItemInput[] | null
  label?: string | null
  marqueeDurationMs?: number | null
}

const normalizeAnnouncementItems = (items?: AnnouncementItemInput[] | null) =>
  (items ?? []).flatMap((item) => {
    const description = item.description?.trim()
    const title = item.title?.trim()
    const url = item.url?.trim()

    return description
      ? [
          {
            description,
            title,
            url: url || undefined,
          },
        ]
      : []
  })

export function AnnouncementBlockComponent(props: AnnouncementBlockLike) {
  const normalizedItems = normalizeAnnouncementItems(props.items)
  const resolvedDisplayMode = props.displayMode ?? 'vertical'
  const resolvedLabel = props.label?.trim() || 'Announcement'
  const { className } = resolveBlockAppearanceClasses(props.appearance)

  if (normalizedItems.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Announcement"
      className={className}
      data-announcement-background={props.appearance?.background ?? 'none'}
    >
      <div className="mx-auto flex min-h-10 w-full max-w-screen-2xl items-center gap-2 px-4 py-2 text-sm">
        <Megaphone aria-hidden="true" className="size-4 shrink-0 text-current/80 md:hidden" />
        <span className="hidden shrink-0 font-mono font-bold uppercase tracking-wider md:inline">
          {resolvedLabel}
        </span>
        <span aria-hidden="true" className="hidden shrink-0 text-current/70 md:inline">
          |
        </span>
        {resolvedDisplayMode === 'marquee' ? (
          <MarqueeAnnouncementContent durationMs={props.marqueeDurationMs} items={normalizedItems} />
        ) : (
          <RotatingAnnouncementContent
            intervalMs={props.intervalMs}
            items={normalizedItems}
            mode={resolvedDisplayMode}
          />
        )}
      </div>
    </section>
  )
}
