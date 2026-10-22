import type { Block } from 'payload'

import { AboutSectionBlock } from '@/blocks/AboutSection/config'
import { AcademicProgrammesBlock } from '@/blocks/AcademicProgrammes/config'
import { AccreditationCardsBlock } from '@/blocks/AccreditationCards/config'
import { AnnouncementBlock } from '@/blocks/Announcement/config'
import { AwardsListBlock } from '@/blocks/AwardsList/config'
import { BankDetailsBlock } from '@/blocks/BankDetails/config'
import { BannerCtaBlock } from '@/blocks/BannerCta/config'
import { BentoGridBlock } from '@/blocks/BentoGrid/config'
import { BreadcrumbBlock } from '@/blocks/Breadcrumb/config'
import { CalendarBlock } from '@/blocks/Calendar/config'
import { AnnualCalendarBlock } from '@/blocks/AnnualCalendar/config'
import { Contact24Block } from '@/blocks/Contact24/config'
import { Contact33Block } from '@/blocks/Contact33/config'
import { ContactNumbersBlock } from '@/blocks/ContactNumbers/config'
import { ContentHighlightsBlock } from '@/blocks/ContentHighlights/config'
import { Cta39Block } from '@/blocks/Cta39/config'
import { DepartmentProfilesBlock } from '@/blocks/DepartmentProfiles/config'
import { DocumentChecklistBlock } from '@/blocks/DocumentChecklist/config'
import { DownloadListBlock } from '@/blocks/DownloadList/config'
import { EditorialReasonsBlock } from '@/blocks/EditorialReasons/config'
import { EventGalleryBlock } from '@/blocks/EventGallery/config'
import { FeatureMatrixBlock } from '@/blocks/FeatureMatrix/config'
import { FeatureSpotlightBlock } from '@/blocks/FeatureSpotlight/config'
import { FeeStructureBlock } from '@/blocks/FeeStructure/config'
import { PGFeeStructureBlock } from '@/blocks/PGFeeStructure/config'
import { GalleryAlbumTabsBlock } from '@/blocks/GalleryAlbumTabs/config'
import { GalleryCoverflowBlock } from '@/blocks/GalleryCoverflow/config'
import { GalleryShowcaseBlock } from '@/blocks/GalleryShowcase/config'
import { HeroBannerBlock } from '@/blocks/HeroBanner/config'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/config'
import { IconCardShowcaseBlock } from '@/blocks/IconCardShowcase/config'
import { IconGridBlock } from '@/blocks/IconGrid/config'
import { ImageMosaicBlock } from '@/blocks/ImageMosaic/config'
import { LeadershipProfilesBlock } from '@/blocks/LeadershipProfiles/config'
import { Integration23Block } from '@/blocks/Integration23/config'
import { Logos20Block } from '@/blocks/Logos20/config'
import { LogoStripBlock } from '@/blocks/LogoStrip/config'
import { MediaCarouselBlock } from '@/blocks/MediaCarousel/config'
import { NewsEventsContentBlock } from '@/blocks/NewsEventsContent/config'
import { NewsEventsHighlightsBlock } from '@/blocks/NewsEventsHighlights/config'
import { NewsEventsTabsBlock } from '@/blocks/NewsEventsTabs/config'
import { NewsGridBlock } from '@/blocks/NewsGrid/config'
import { NumberedStepsBlock } from '@/blocks/NumberedSteps/config'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { ProfileCarouselBlock } from '@/blocks/ProfileCarousel/config'
import { ProgramMatrixBlock } from '@/blocks/ProgramMatrix/config'
import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
import { QuoteBlockBlock } from '@/blocks/QuoteBlock/config'
import { RatingSpotlightBlock } from '@/blocks/RatingSpotlight/config'
import { ReusableSectionBlock } from '@/blocks/ReusableSection/config'
import { ReviewFeedBlock } from '@/blocks/ReviewFeed/config'
import { ReviewSubmissionBlock } from '@/blocks/ReviewSubmission/config'
import { RichTextBlock } from '@/blocks/RichTextBlock/config'
import { Services21Block } from '@/blocks/Services21/config'
import { StatsStripBlock } from '@/blocks/StatsStrip/config'
import { StudentExperienceBlock } from '@/blocks/StudentExperience/config'
import { TabsContentBlock } from '@/blocks/TabsContent/config'
import { TeamShowcaseBlock } from '@/blocks/TeamShowcase/config'
import { TestimonialGridBlock } from '@/blocks/TestimonialGrid/config'
import { TestimonialSpotlightBlock } from '@/blocks/TestimonialSpotlight/config'
import { TimelineBlock } from '@/blocks/Timeline/config'
import { VideoEmbedBlock } from '@/blocks/VideoEmbed/config'
import { createBlockAnchorField } from '@/blocks/shared/blockAnchor'

export const blockPickerGroups = {
  start: 'Start',
  explain: 'Explain',
  explore: 'Explore',
  prove: 'Prove',
  convert: 'Convert',
  advanced: 'Advanced Library',
  templateCore: 'Template Core',
} as const

export type BlockPickerGroup = (typeof blockPickerGroups)[keyof typeof blockPickerGroups]

export type BlockGroupDefinition = Readonly<{
  blocks: readonly Block[]
  group: BlockPickerGroup
}>

const decorateBlock = (block: Block, group: BlockPickerGroup): Block => ({
  ...block,
  admin: {
    ...block.admin,
    group,
  },
  fields: [...block.fields, createBlockAnchorField()],
})

export const buildBlockRegistry = (groups: readonly BlockGroupDefinition[]): Block[] => {
  const slugs = new Set<string>()

  return groups.flatMap(({ blocks, group }) =>
    blocks.map((block) => {
      if (slugs.has(block.slug)) {
        throw new Error(`Duplicate block slug in catalog: ${block.slug}`)
      }

      slugs.add(block.slug)
      return decorateBlock(block, group)
    }),
  )
}

export const pageBlockGroupDefinitions = [
  {
    group: blockPickerGroups.start,
    blocks: [PageHeaderBlock, HeroBannerBlock, ReusableSectionBlock],
  },
  {
    group: blockPickerGroups.explain,
    blocks: [
      RichTextBlock,
      AboutSectionBlock,
      FeatureSpotlightBlock,
      ContentHighlightsBlock,
      AcademicProgrammesBlock,
    ],
  },
  {
    group: blockPickerGroups.explore,
    blocks: [
      NewsEventsTabsBlock,
      CalendarBlock,
      AnnualCalendarBlock,
      DepartmentProfilesBlock,
      GalleryAlbumTabsBlock,
      QaAccordionBlock,
    ],
  },
  {
    group: blockPickerGroups.prove,
    blocks: [StatsStripBlock, TestimonialSpotlightBlock, AccreditationCardsBlock],
  },
  {
    group: blockPickerGroups.convert,
    blocks: [BannerCtaBlock, Contact24Block, DownloadListBlock],
  },
  {
    group: blockPickerGroups.advanced,
    blocks: [
      AnnouncementBlock,
      NewsGridBlock,
      Cta39Block,
      HeroCarouselBlock,
      GalleryCoverflowBlock,
      FeatureMatrixBlock,
      EditorialReasonsBlock,
      LeadershipProfilesBlock,
      NewsEventsHighlightsBlock,
      ProfileCarouselBlock,
      GalleryShowcaseBlock,
      EventGalleryBlock,
      ImageMosaicBlock,
      StudentExperienceBlock,
      RatingSpotlightBlock,
      ReviewFeedBlock,
      ReviewSubmissionBlock,
      Contact33Block,
      TeamShowcaseBlock,
      Services21Block,
      VideoEmbedBlock,
      MediaCarouselBlock,
      ProgramMatrixBlock,
      LogoStripBlock,
      Logos20Block,
      Integration23Block,
      BreadcrumbBlock,
      TimelineBlock,
      IconCardShowcaseBlock,
      IconGridBlock,
      QuoteBlockBlock,
      TabsContentBlock,
      FeeStructureBlock,
      PGFeeStructureBlock,
      BankDetailsBlock,
      DocumentChecklistBlock,
      ContactNumbersBlock,
      NumberedStepsBlock,
      BentoGridBlock,
      TestimonialGridBlock,
      AwardsListBlock,
    ],
  },
] as const satisfies readonly BlockGroupDefinition[]

export const pageBuilderBlocks = buildBlockRegistry(pageBlockGroupDefinitions)

export const reusableSectionBuilderBlocks = pageBuilderBlocks.filter(
  (block) => block.slug !== ReusableSectionBlock.slug,
)

export const newsEventsDetailBuilderBlocks = buildBlockRegistry([
  {
    group: blockPickerGroups.templateCore,
    blocks: [NewsEventsContentBlock],
  },
  ...pageBlockGroupDefinitions,
])
