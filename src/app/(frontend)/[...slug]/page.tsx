import type { Metadata } from 'next'

import { ManagedCmsPage } from '../ManagedCmsPage'
import { getPageMetadataByPath } from '../pageData'

type PageProps = {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return getPageMetadataByPath(slug)
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params
  return <ManagedCmsPage segments={slug} />
}
