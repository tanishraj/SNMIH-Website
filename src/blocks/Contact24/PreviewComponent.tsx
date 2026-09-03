import {
  Contact24BlockPresentation,
  type Contact24BlockLike,
} from '@/blocks/Contact24/Presentation'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'

export function Contact24PreviewBlockComponent({
  officeLocations,
  ...props
}: Contact24BlockLike & { officeLocations: SiteOfficeLocation[] }) {
  const selectedIds = new Set(
    (props.offices ?? []).flatMap((o) => {
      if (typeof o === 'string') return [o]
      if (typeof o === 'object' && o !== null && 'id' in o) return [(o as { id: string }).id]
      return []
    }),
  )

  const offices = selectedIds.size
    ? officeLocations.filter((o) => selectedIds.has(o.id))
    : officeLocations

  return <Contact24BlockPresentation {...props} offices={offices} />
}
