import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

const inheritedSurfaceFiles = [
  'src/blocks/FeatureSpotlight/Component.tsx',
  'src/blocks/TestimonialSpotlight/Component.tsx',
  'src/blocks/QaAccordion/Component.tsx',
  'src/blocks/ReviewSubmission/Component.tsx',
  'src/blocks/PageHeader/Component.tsx',
  'src/blocks/Timeline/Component.tsx',
  'src/blocks/QuoteBlock/Component.tsx',
  'src/blocks/AboutSection/Component.tsx',
  'src/blocks/NumberedSteps/Component.tsx',
  'src/blocks/IconGrid/Component.tsx',
  'src/blocks/LogoStrip/Component.tsx',
  'src/blocks/VideoEmbed/Component.tsx',
  'src/blocks/AwardsList/Component.tsx',
  'src/blocks/TestimonialGrid/Component.tsx',
  'src/components/footer56.tsx',
  'src/components/contact24.tsx',
  'src/components/services21.tsx',
  'src/components/team-showcase.tsx',
] as const

describe('block surface semantics', () => {
  it.each(inheritedSurfaceFiles)('%s consumes inherited surface text', (file) => {
    expect(read(file)).toContain('text-current')
  })

  it.each(['src/components/news-events/NewsEventsFeaturedCarouselClient.tsx'])(
    '%s pairs card backgrounds with card foregrounds',
    (file) => {
      const source = read(file)

      expect(source).toMatch(/bg-card[^"']*text-card-foreground|text-card-foreground[^"']*bg-card/)
    },
  )

  it.each([
    'src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx',
    'src/blocks/TestimonialGrid/Component.tsx',
    'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
  ])('%s uses resolveCardSurface for adaptive card theming', (file) => {
    const source = read(file)
    expect(source).toContain("from '@/blocks/shared/cardSurface'")
    expect(source).toContain('resolveCardSurface')
  })

  it('uses semantic brand colors instead of raw palette utilities', () => {
    const roots = ['src/blocks', 'src/components']
    const source = roots
      .flatMap((root) =>
        fs
          .readdirSync(path.resolve(process.cwd(), root), { recursive: true })
          .filter((entry): entry is string => typeof entry === 'string' && entry.endsWith('.tsx'))
          .map((entry) => read(path.join(root, entry))),
      )
      .join('\n')

    expect(source).not.toMatch(
      /(?:text|bg|border|from|via|to)-(?:red|blue|green|yellow|purple|pink|indigo|orange|lime|emerald|cyan|sky|violet|fuchsia|rose|teal)-\d+/,
    )
    expect(read('src/components/services21.tsx')).toContain('text-primary')
    expect(read('src/components/team-showcase.tsx')).toContain('resolveCardSurface')
  })
})
