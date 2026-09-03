import type { Metadata } from 'next'

import { ManagedCmsPage } from '../ManagedCmsPage'
import { getPageMetadataByPath } from '../pageData'

const newsEventsPageSegments = ['news-events']

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadataByPath(newsEventsPageSegments)
}

export default function NewsEventsPage() {
  return <ManagedCmsPage segments={newsEventsPageSegments} />
}
