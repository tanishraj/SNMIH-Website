import {
  Contact24BlockPresentation,
  type Contact24BlockLike,
} from '@/blocks/Contact24/Presentation'
import {
  getPublishedSiteOfficeLocations,
  getPublishedSiteOfficeLocationsByIds,
} from '@/lib/siteOffices'
import { normalizeSiteOfficeLocations, type SiteOfficeLocationSource } from '@/lib/siteOfficesShared'

export async function Contact24BlockComponent(props: Contact24BlockLike) {
  const selectedOffices = props.offices ?? []

  // If offices are already populated objects (depth ≥ 1), normalise them directly
  // to avoid a redundant DB round-trip.
  const populatedDocs = selectedOffices.filter(
    (o): o is { id: string } => typeof o === 'object' && o !== null,
  )

  if (populatedDocs.length) {
    const offices = normalizeSiteOfficeLocations(
      populatedDocs as unknown as SiteOfficeLocationSource[],
    )
    return <Contact24BlockPresentation {...props} offices={offices} />
  }

  // If only IDs were returned (depth 0), re-fetch them.
  const idList = selectedOffices.filter((o): o is string => typeof o === 'string')

  const offices = idList.length
    ? await getPublishedSiteOfficeLocationsByIds(idList)
    : await getPublishedSiteOfficeLocations()

  return <Contact24BlockPresentation {...props} offices={offices} />
}
