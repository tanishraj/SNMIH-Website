import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ReviewArchivePage } from '@/components/reviews/ReviewArchivePage'
import {
  getReviewCategoryArchiveBySlug,
  getReviewCategoryArchiveMetadataBySlug,
} from '@/lib/contentEntries'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  return getReviewCategoryArchiveMetadataBySlug(slug)
}

export default async function ReviewCategoryArchiveEntryPage({ params }: PageProps) {
  const { slug } = await params
  const { category, reviews } = await getReviewCategoryArchiveBySlug(slug)

  if (!category) {
    notFound()
  }

  return (
    <ReviewArchivePage
      archiveLabel={category.title}
      reviews={reviews}
    />
  )
}
