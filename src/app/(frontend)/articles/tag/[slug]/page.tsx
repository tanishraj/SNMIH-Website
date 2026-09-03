import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleArchivePage } from '@/components/articles/ArticleArchivePage'
import { getArticleTagArchiveBySlug, getArticleTagArchiveMetadataBySlug } from '@/lib/contentEntries'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  return getArticleTagArchiveMetadataBySlug(slug)
}

export default async function ArticleTagArchiveEntryPage({ params }: PageProps) {
  const { slug } = await params
  const { articles, tag } = await getArticleTagArchiveBySlug(slug)

  if (!tag) {
    notFound()
  }

  return (
    <ArticleArchivePage
      archiveLabel={tag.title}
      archiveType="tag"
      articles={articles}
    />
  )
}
