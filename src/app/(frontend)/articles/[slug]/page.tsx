import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { ArticleLivePreview } from '@/components/live-preview/ArticleLivePreview'
import { ArticlePage } from '@/components/articles/ArticlePage'
import {
  getArticleBySlug,
  getArticleMetadataBySlug,
  getArticlePreviewBySlug,
  getArticleStructuredData,
  getRelatedArticles,
} from '@/lib/contentEntries'
import type { User } from '@/payload-types'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string | string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return getArticleMetadataBySlug(slug)
}

export default async function ArticleEntryPage({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams])
  const isPreview = resolvedSearchParams.preview === 'true'

  if (isPreview) {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({
      canSetHeaders: false,
      headers: new Headers(await getHeaders()),
    })

    if (!user) notFound()

    const draftArticle = await getArticlePreviewBySlug(slug, user as User)
    if (!draftArticle) notFound()

    return <ArticleLivePreview initialData={draftArticle} />
  }

  const article = await getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const [relatedArticles, structuredData] = await Promise.all([
    getRelatedArticles(article),
    Promise.resolve(getArticleStructuredData(article)),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <ArticlePage article={article} relatedArticles={relatedArticles} />
    </>
  )
}
