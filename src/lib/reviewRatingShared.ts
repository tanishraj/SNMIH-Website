export type PublishedReviewRatingSummary = {
  average: number
  count: number
}

export type PublishedReviewRatingDistribution = PublishedReviewRatingSummary & {
  counts: readonly [number, number, number, number, number]
}

const toRatingCounts = (counts: readonly number[]): PublishedReviewRatingDistribution['counts'] => [
  counts[0] ?? 0,
  counts[1] ?? 0,
  counts[2] ?? 0,
  counts[3] ?? 0,
  counts[4] ?? 0,
]

export function calculatePublishedReviewRatingDistribution(
  counts: readonly number[],
): PublishedReviewRatingDistribution | null {
  const normalizedCounts = toRatingCounts(counts)
  const count = normalizedCounts.reduce((total, current) => total + current, 0)

  if (count === 0) {
    return null
  }

  const weightedTotal = normalizedCounts.reduce(
    (total, current, index) => total + current * (index + 1),
    0,
  )

  return {
    average: weightedTotal / count,
    count,
    counts: normalizedCounts,
  }
}

export function calculatePublishedReviewRatingSummary(
  counts: readonly number[],
): PublishedReviewRatingSummary | null {
  const distribution = calculatePublishedReviewRatingDistribution(counts)

  return distribution
    ? {
        average: distribution.average,
        count: distribution.count,
      }
    : null
}
