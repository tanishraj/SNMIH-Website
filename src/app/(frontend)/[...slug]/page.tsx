import { getStaticPageParams } from '@/lib/staticParams'
import type { Metadata } from 'next'

import { ManagedCmsPage } from '../ManagedCmsPage'
import { getPageMetadataByPath } from '../pageData'

// Prebuild known content; newly published paths are generated on their first visit.
export const dynamic = 'force-static'
export const dynamicParams = true

export async function generateStaticParams() {
  return getStaticPageParams()
}

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
