export const NEWS_GRID_DEFAULT_TOTAL_CARDS = 3
export const NEWS_GRID_MAX_TOTAL_CARDS = 6

export type NewsGridCardsPerRow = '2' | '3' | '4'

type NewsGridFeatureLike = {
  enabled?: boolean | null
  title?: string | null
}

const gridClassesByCardsPerRow = {
  '2': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const satisfies Record<NewsGridCardsPerRow, string>

const imageSizesByCardsPerRow = {
  '2': '(min-width: 768px) 50vw, 100vw',
  '3': '(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw',
  '4': '(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw',
} as const satisfies Record<NewsGridCardsPerRow, string>

export function normalizeNewsGridTotalCards(value?: number | null): number {
  if (!Number.isInteger(value) || !value || value < 1 || value > NEWS_GRID_MAX_TOTAL_CARDS) {
    return NEWS_GRID_DEFAULT_TOTAL_CARDS
  }

  return value
}

export function hasValidNewsGridFeature(featureCard?: NewsGridFeatureLike | null): boolean {
  return Boolean(featureCard?.enabled && featureCard.title?.trim())
}

export function getNewsGridCollectionItemCount(
  totalCards?: number | null,
  featureCard?: NewsGridFeatureLike | null,
): number {
  return Math.max(
    0,
    normalizeNewsGridTotalCards(totalCards) - (hasValidNewsGridFeature(featureCard) ? 1 : 0),
  )
}

export function normalizeNewsGridCardsPerRow(value?: string | null): NewsGridCardsPerRow {
  return value === '2' || value === '4' ? value : '3'
}

export function getNewsGridClasses(value?: string | null): string {
  return gridClassesByCardsPerRow[normalizeNewsGridCardsPerRow(value)]
}

export function getNewsGridImageSizes(value?: string | null): string {
  return imageSizesByCardsPerRow[normalizeNewsGridCardsPerRow(value)]
}
