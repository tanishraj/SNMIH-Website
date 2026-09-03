import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { regularBlockMobilePaddingClasses } from '@/blocks/shared/blockSpacing'

const regularBlockSources = [
  'src/components/gallery-showcase.tsx',
  'src/components/profile-carousel.tsx',
  'src/components/content-highlights.tsx',
  'src/components/image-mosaic.tsx',
  'src/components/news-events/NewsEventsFeaturedCarousel.tsx',
  'src/components/review-feed.tsx',
] as const

describe('regular block responsive spacing', () => {
  it('uses one responsive outer-padding contract for every size', () => {
    expect(regularBlockMobilePaddingClasses).toEqual({
      none: '',
      compact: 'py-8 md:py-10',
      default: 'py-12 md:py-16',
      comfortable: 'py-20 md:py-28',
    })
  })

  it('keeps the primary regular block presentations on the shared spacing contract', () => {
    for (const sourcePath of regularBlockSources) {
      expect(readFileSync(sourcePath, 'utf8'), sourcePath).toContain(
        'regularBlockMobilePaddingClasses',
      )
    }
  })
})
