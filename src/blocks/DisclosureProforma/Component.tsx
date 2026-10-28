import { getSiteTimeZone } from '@/lib/siteTimeZone.server'
import { DisclosurePresentation } from './Presentation'
import { loadDisclosure } from './load'
import {
  normalizeLimit,
  normalizeSections,
  relationshipID,
  type DisclosureBlockLike,
} from './shared'
export async function DisclosureProformaBlockComponent(props: DisclosureBlockLike) {
  const dataset = relationshipID(props.dataset)
  const sections = normalizeSections(props.sections)
  const section = sections.find((s) => s.key === props.defaultSection) ?? sections[0]
  if (!dataset || !section || !section.groups.length) return null
  const [initial, timeZone] = await Promise.all([
    loadDisclosure({
      dataset,
      section: section.key,
      groupKeys: section.groups.map((g) => g.key),
      query: '',
      page: 1,
      limit: normalizeLimit(props.itemsPerPage),
      periodPage: 1,
      periodQuery: '',
      draft: false,
    }),
    getSiteTimeZone(),
  ])
  return <DisclosurePresentation {...props} initial={initial} timeZone={timeZone} />
}
