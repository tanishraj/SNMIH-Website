import { getStaticSlugParams } from '@/lib/staticParams'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ArticleArchivePage } from '@/components/articles/ArticleArchivePage'
import { getArticleTagArchiveBySlug, getArticleTagArchiveMetadataBySlug } from '@/lib/contentEntries'

// Prebuild known content; newly published paths are generated on their first visit.
export const dynamic = 'force-static'
export const dynamicParams = true

export async function generateStaticParams() {
  return getStaticSlugParams('tags')
}

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
