import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ArticleLivePreview } from '@/components/live-preview/ArticleLivePreview'
import { getArticlePreviewBySlug } from '@/lib/contentEntries'
import type { User } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

type PageProps = { params: Promise<{ slug: string }> }

export default async function ArticlePreviewPage({ params }: PageProps) {
  const { slug } = await params
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
