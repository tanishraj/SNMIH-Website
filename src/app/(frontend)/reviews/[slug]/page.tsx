import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ReviewPage } from '@/components/reviews/ReviewPage'
import { getRelatedReviews, getReviewBySlug, getReviewMetadataBySlug } from '@/lib/contentEntries'

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  return getReviewMetadataBySlug(slug)
}

export default async function ReviewEntryPage({ params }: PageProps) {
  const { slug } = await params
  const review = await getReviewBySlug(slug)

  if (!review) {
    notFound()
  }

  const relatedReviews = await getRelatedReviews(review)

  return (
    <ReviewPage
      review={review}
      relatedReviews={relatedReviews}
    />
  )
}
