import { getStaticSlugParams } from '@/lib/staticParams'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleArchivePage } from '@/components/articles/ArticleArchivePage'
import {
  getArticleCategoryArchiveBySlug,
  getArticleCategoryArchiveMetadataBySlug,
} from '@/lib/contentEntries'

// Prebuild known content; newly published paths are generated on their first visit.
export const dynamic = 'force-static'
export const dynamicParams = true

export async function generateStaticParams() {
  return getStaticSlugParams('categories')
}

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  return getArticleCategoryArchiveMetadataBySlug(slug)
}

export default async function ArticleCategoryArchiveEntryPage({ params }: PageProps) {
  const { slug } = await params
  const { articles, category } = await getArticleCategoryArchiveBySlug(slug)

  if (!category) {
    notFound()
  }

  return (
    <ArticleArchivePage
      archiveLabel={category.title}
      archiveType="category"
      articles={articles}
    />
  )
}
