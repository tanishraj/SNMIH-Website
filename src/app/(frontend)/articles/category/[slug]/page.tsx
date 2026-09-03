import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleArchivePage } from '@/components/articles/ArticleArchivePage'
import {
  getArticleCategoryArchiveBySlug,
  getArticleCategoryArchiveMetadataBySlug,
} from '@/lib/contentEntries'

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
