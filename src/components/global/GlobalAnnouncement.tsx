import { resolveBlockAppearanceClasses, type BlockAppearance } from '@/blocks/shared/blockAppearance'
import type {
  AnnouncementDisplayMode,
  AnnouncementItemInput,
} from '@/components/announcement/AnnouncementBar'
import { AnnouncementBar } from '@/components/announcement/AnnouncementBar'

type GlobalAnnouncementProps = {
  displayMode?: AnnouncementDisplayMode | null
  appearance?: BlockAppearance | null
  intervalMs?: number | null
  items?: AnnouncementItemInput[] | null
  label?: string | null
  marqueeDurationMs?: number | null
  stickyTopOffset?: string
  dismissible?: boolean | null
  hideOnScroll?: boolean | null
}

export function GlobalAnnouncement({
  displayMode,
  appearance,
  intervalMs,
  items,
  label,
  marqueeDurationMs,
  stickyTopOffset = '0px',
  dismissible,
  hideOnScroll,
}: GlobalAnnouncementProps) {
  const { className } = resolveBlockAppearanceClasses(appearance)

  return (
    <AnnouncementBar
      displayMode={displayMode}
      intervalMs={intervalMs}
      items={items}
      label={label}
      marqueeDurationMs={marqueeDurationMs}
      className={className}
      sticky
      topOffset={stickyTopOffset}
      dismissible={dismissible}
      hideOnScroll={hideOnScroll}
    />
  )
}
