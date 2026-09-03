import type { ArrayField, Block, Field, TabsField } from 'payload'
import { describe, expect, it } from 'vitest'

import { AcademicProgrammesBlock } from '@/blocks/AcademicProgrammes/config'
import { AboutSectionBlock } from '@/blocks/AboutSection/config'
import { AccreditationCardsBlock } from '@/blocks/AccreditationCards/config'
import { AnnouncementBlock } from '@/blocks/Announcement/config'
import { AwardsListBlock } from '@/blocks/AwardsList/config'
import { BentoGridBlock } from '@/blocks/BentoGrid/config'
import { ContentHighlightsBlock } from '@/blocks/ContentHighlights/config'
import { DownloadListBlock } from '@/blocks/DownloadList/config'
import { FeatureMatrixBlock } from '@/blocks/FeatureMatrix/config'
import { Footer56Block } from '@/blocks/Footer56/config'
import { GalleryCoverflowBlock } from '@/blocks/GalleryCoverflow/config'
import { GalleryShowcaseBlock } from '@/blocks/GalleryShowcase/config'
import { HeaderNavbar12Block } from '@/blocks/HeaderNavbar12/config'
import { IconGridBlock } from '@/blocks/IconGrid/config'
import { ImageMosaicBlock } from '@/blocks/ImageMosaic/config'
import { LeadershipProfilesBlock } from '@/blocks/LeadershipProfiles/config'
import { LogoStripBlock } from '@/blocks/LogoStrip/config'
import { MediaCarouselBlock } from '@/blocks/MediaCarousel/config'
import { NumberedStepsBlock } from '@/blocks/NumberedSteps/config'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { ProfileCarouselBlock } from '@/blocks/ProfileCarousel/config'
import { ProgramMatrixBlock } from '@/blocks/ProgramMatrix/config'
import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
import { StatsStripBlock } from '@/blocks/StatsStrip/config'
import { TabsContentBlock } from '@/blocks/TabsContent/config'
import { TeamShowcaseBlock } from '@/blocks/TeamShowcase/config'
import { TestimonialGridBlock } from '@/blocks/TestimonialGrid/config'
import { TimelineBlock } from '@/blocks/Timeline/config'

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
  }

  return undefined
}

const cardRows = [
  [AccreditationCardsBlock, 'accreditations', 'cardBackground'],
  [AcademicProgrammesBlock, 'programmes', 'cardBackground'],
  [ProgramMatrixBlock, 'items', 'cardBackground'],
  [IconGridBlock, 'items', 'cardBackground'],
  [BentoGridBlock, 'items', 'accentColor'],
  [FeatureMatrixBlock, 'features', 'cardBackground'],
  [ContentHighlightsBlock, 'items', 'cardBackground'],
  [ProfileCarouselBlock, 'profiles', 'cardBackground'],
  [LeadershipProfilesBlock, 'profiles', 'cardBackground'],
  [TeamShowcaseBlock, 'members', 'cardBackground'],
  [TestimonialGridBlock, 'testimonials', 'cardBackground'],
  [AwardsListBlock, 'awards', 'cardBackground'],
  [DownloadListBlock, 'downloads', 'cardBackground'],
  [MediaCarouselBlock, 'items', 'cardBackground'],
  [NumberedStepsBlock, 'steps', 'cardBackground'],
] satisfies [Block, string, string][]

const utilityRows = [
  [TimelineBlock, 'items'],
  [StatsStripBlock, 'items'],
  [TabsContentBlock, 'tabs'],
  [AboutSectionBlock, 'values'],
  [PageHeaderBlock, 'keyFacts'],
  [AnnouncementBlock, 'items'],
  [QaAccordionBlock, 'items'],
  [LogoStripBlock, 'logos'],
  [GalleryShowcaseBlock, 'images'],
  [GalleryCoverflowBlock, 'images'],
  [ImageMosaicBlock, 'items'],
  [HeaderNavbar12Block, 'menuItems'],
  [Footer56Block, 'linkGroups'],
] satisfies [Block, string][]

describe('nested card Theme Settings contract', () => {
  it.each(cardRows)(
    '%s.%s exposes Content and Theme Settings',
    (block, fieldName, backgroundName) => {
      const array = findNamedField(block.fields, fieldName) as ArrayField
      const tabs = array.fields[0] as TabsField

      expect(array.type, block.slug).toBe('array')
      expect(tabs.type, `${block.slug}.${fieldName}`).toBe('tabs')
      expect(
        tabs.tabs.map((tab) => tab.label),
        `${block.slug}.${fieldName}`,
      ).toEqual(['Content', 'Theme Settings'])
      expect(
        findNamedField(array.fields, backgroundName),
        `${block.slug}.${fieldName}`,
      ).toMatchObject({
        type: 'select',
        defaultValue: backgroundName === 'accentColor' ? 'none' : 'default',
        required: true,
      })
    },
  )

  it('uses section surface options for Icon Grid cards', () => {
    const background = findNamedField(IconGridBlock.fields, 'cardBackground')

    expect(background).toMatchObject({
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Match Section', value: 'default' },
        { label: 'Subtle', value: 'subtle' },
        { label: 'Brand', value: 'brand' },
        { label: 'Gradient: Subtle', value: 'gradient-subtle' },
        { label: 'Gradient: Brand', value: 'gradient-brand' },
      ],
    })
  })

  it('exposes theme-aligned Accreditation Card presentation controls', () => {
    expect(findNamedField(AccreditationCardsBlock.fields, 'cardFrame')).toMatchObject({
      type: 'select',
      defaultValue: 'stepped',
      required: true,
      options: [
        { label: 'Stepped Rules', value: 'stepped' },
        { label: 'Grouped', value: 'grouped' },
        { label: 'Boxed', value: 'boxed' },
        { label: 'Open', value: 'open' },
      ],
    })
    expect(findNamedField(AccreditationCardsBlock.fields, 'cardSize')).toMatchObject({
      type: 'select',
      defaultValue: 'default',
      required: true,
    })
    expect(findNamedField(AccreditationCardsBlock.fields, 'iconStyle')).toMatchObject({
      type: 'select',
      defaultValue: 'plain',
      required: true,
    })
    expect(findNamedField(AccreditationCardsBlock.fields, 'cardBackground')).toMatchObject({
      type: 'select',
      defaultValue: 'default',
      required: true,
    })
  })

  it.each(utilityRows)('%s.%s stays a utility row without card theming', (block, fieldName) => {
    const array = findNamedField(block.fields, fieldName) as ArrayField

    expect(array.type, block.slug).toBe('array')
    expect(array.fields[0], `${block.slug}.${fieldName}`).not.toMatchObject({ type: 'tabs' })
    expect(
      findNamedField(array.fields, 'cardBackground'),
      `${block.slug}.${fieldName}`,
    ).toBeUndefined()
  })
})
