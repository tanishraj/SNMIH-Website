import React from 'react'
import type { Page } from '@/payload-types'
import { resolveAutomaticPageBreadcrumbs, type ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'

import { AnnouncementBlockComponent } from './Announcement/Component'
import { ContentHighlightsBlockComponent } from './ContentHighlights/Component'
import { EditorialReasonsBlockComponent } from './EditorialReasons/Component'
import { AcademicProgrammesBlockComponent } from './AcademicProgrammes/Component'
import { LeadershipProfilesBlockComponent } from './LeadershipProfiles/Component'
import { DepartmentProfilesBlockComponent } from './DepartmentProfiles/Component'
import { QaAccordionBlockComponent } from './QaAccordion/Component'
import { FeatureMatrixBlockComponent } from './FeatureMatrix/Component'
import { GalleryShowcaseBlockComponent } from './GalleryShowcase/Component'
import { EventGalleryBlockComponent } from './EventGallery/Component'
import { GalleryAlbumTabsBlockComponent } from './GalleryAlbumTabs/Component'
import { HeroBannerBlockComponent, resolveHeroBannerImage } from './HeroBanner/Component'
import { HeroCarouselBlockComponent } from './HeroCarousel/Component'
import { GalleryCoverflowBlockComponent } from './GalleryCoverflow/Component'
import { ImageMosaicBlockComponent } from './ImageMosaic/Component'
import { StudentExperienceBlockComponent } from './StudentExperience/Component'
import { NewsEventsHighlightsBlockComponent } from './NewsEventsHighlights/Component'
import { ProfileCarouselBlockComponent } from './ProfileCarousel/Component'
import { RatingSpotlightBlockComponent } from './RatingSpotlight/Component'
import { ReviewFeedBlockComponent } from './ReviewFeed/Component'
import { ReviewSubmissionBlockComponent } from './ReviewSubmission/Component'
import { Contact24BlockComponent } from './Contact24/Component'
import { Contact33BlockComponent } from './Contact33/Component'
import { FeatureSpotlightBlockComponent } from './FeatureSpotlight/Component'
import { TestimonialSpotlightBlockComponent } from './TestimonialSpotlight/Component'
import { BannerCtaBlockComponent } from './BannerCta/Component'
import { NewsGridBlockComponent } from './NewsGrid/Component'
import { NewsEventsTabsBlockComponent } from './NewsEventsTabs/Component'
import { Cta39BlockComponent } from './Cta39/Component'
import { TeamShowcaseBlockComponent } from './TeamShowcase/Component'
import { PageBlockStack } from './PageBlockStack'
import { StatsStripBlockComponent } from './StatsStrip/Component'
import { Services21BlockComponent } from './Services21/Component'
import { RichTextBlockComponent } from './RichTextBlock/Component'
import { VideoEmbedBlockComponent } from './VideoEmbed/Component'
import { MediaCarouselBlockComponent } from './MediaCarousel/Component'
import { ProgramMatrixBlockComponent } from './ProgramMatrix/Component'
import { Integration23BlockComponent } from './Integration23/Component'
import { Logos20BlockComponent } from './Logos20/Component'
import { LogoStripBlockComponent } from './LogoStrip/Component'
import { PageHeaderBlockComponent } from './PageHeader/Component'
import { BreadcrumbBlockComponent } from './Breadcrumb/Component'
import { CalendarBlockComponent } from './Calendar/Component'
import { AnnualCalendarBlockComponent } from './AnnualCalendar/Component'
import { TimelineBlockComponent } from './Timeline/Component'
import { IconCardShowcaseBlockComponent } from './IconCardShowcase/Component'
import { IconGridBlockComponent } from './IconGrid/Component'
import { QuoteBlockBlockComponent } from './QuoteBlock/Component'
import { TabsContentBlockComponent } from './TabsContent/Component'
import { DownloadListBlockComponent } from './DownloadList/Component'
import { FeeStructureBlockComponent } from './FeeStructure/Component'
import { PGFeeStructureBlockComponent } from './PGFeeStructure/Component'
import { BankDetailsBlockComponent } from './BankDetails/Component'
import { NumberedStepsBlockComponent } from './NumberedSteps/Component'
import { BentoGridBlockComponent } from './BentoGrid/Component'
import { TestimonialGridBlockComponent } from './TestimonialGrid/Component'
import { AwardsListBlockComponent } from './AwardsList/Component'
import { AboutSectionBlockComponent } from './AboutSection/Component'
import { AccreditationCardsBlockComponent } from './AccreditationCards/Component'
import { BlockAnchorWrapper } from './shared/BlockAnchorWrapper'
import { BlockErrorBoundary } from './shared/BlockErrorBoundary'
import { claimBlockAnchorID } from './shared/blockAnchor'

export type PageBlock = NonNullable<Page['layout']>[number]

type PopulatedReusableSection = {
  id: string | number
  title?: string | null
  layout?: PageBlock[] | null
}

export type PageRenderContext = {
  isHomepage?: boolean
  page?: Page | null
}

export type PageBlockRenderArgs = {
  automaticBreadcrumbs: ResolvedPageBreadcrumb[]
  heroPreloadState: { assigned: boolean }
  usedAnchorIDs: Set<string>
}

function renderPageBlockContent(
  block: PageBlock,
  index: number,
  args: PageBlockRenderArgs,
  depth = 0,
): React.ReactNode {
  if (depth > 10) return null

  const key = block.id ?? `${block.blockType}-${index}`
  const wrap = (element: React.ReactNode) => (
    <BlockErrorBoundary key={key} blockType={block.blockType}>
      {element}
    </BlockErrorBoundary>
  )

  switch (block.blockType) {
    case 'announcement':
      return wrap(<AnnouncementBlockComponent {...block} />)
    case 'heroBanner': {
      const preload = !args.heroPreloadState.assigned && Boolean(resolveHeroBannerImage(block))
      if (preload) args.heroPreloadState.assigned = true
      return wrap(<HeroBannerBlockComponent {...block} preload={preload} />)
    }
    case 'heroCarousel':
      return wrap(<HeroCarouselBlockComponent {...block} />)
    case 'galleryCoverflow':
      return wrap(<GalleryCoverflowBlockComponent {...block} />)
    case 'qaAccordion':
      return wrap(<QaAccordionBlockComponent {...block} />)
    case 'featureMatrix':
      return wrap(<FeatureMatrixBlockComponent {...block} />)
    case 'contentHighlights':
      return wrap(<ContentHighlightsBlockComponent {...block} />)
    case 'editorialReasons':
      return wrap(<EditorialReasonsBlockComponent {...block} />)
    case 'academicProgrammes':
      return wrap(<AcademicProgrammesBlockComponent {...block} />)
    case 'leadershipProfiles':
      return wrap(<LeadershipProfilesBlockComponent {...block} />)
    case 'departmentProfiles':
      return wrap(<DepartmentProfilesBlockComponent {...block} />)
    case 'newsEventsHighlights':
      return wrap(<NewsEventsHighlightsBlockComponent {...block} />)
    case 'profileCarousel':
      return wrap(<ProfileCarouselBlockComponent {...block} />)
    case 'galleryShowcase':
      return wrap(<GalleryShowcaseBlockComponent {...block} />)
    case 'eventGallery':
      return wrap(<EventGalleryBlockComponent {...block} />)
    case 'galleryAlbumTabs':
      return wrap(<GalleryAlbumTabsBlockComponent {...block} />)
    case 'imageMosaic':
      return wrap(<ImageMosaicBlockComponent {...block} />)
    case 'studentExperience':
      return wrap(<StudentExperienceBlockComponent {...block} />)
    case 'reviewSubmission':
      return wrap(<ReviewSubmissionBlockComponent {...block} />)
    case 'contact33':
      return wrap(<Contact33BlockComponent {...block} />)
    case 'contact24':
      return wrap(<Contact24BlockComponent {...block} />)
    case 'ratingSpotlight':
      return wrap(<RatingSpotlightBlockComponent {...block} />)
    case 'reviewFeed':
      return wrap(<ReviewFeedBlockComponent {...block} />)
    case 'featureSpotlight':
      return wrap(<FeatureSpotlightBlockComponent {...block} />)
    case 'testimonialSpotlight':
      return wrap(<TestimonialSpotlightBlockComponent {...block} />)
    case 'statsStrip':
      return wrap(<StatsStripBlockComponent {...block} />)
    case 'teamShowcase':
      return wrap(<TeamShowcaseBlockComponent {...block} />)
    case 'services21':
      return wrap(<Services21BlockComponent {...block} />)
    case 'newsGrid':
      return wrap(<NewsGridBlockComponent {...block} />)
    case 'newsEventsTabs':
      return wrap(<NewsEventsTabsBlockComponent {...block} />)
    case 'calendar':
      return wrap(<CalendarBlockComponent {...block} />)
    case 'annualCalendar':
      return wrap(<AnnualCalendarBlockComponent {...block} />)
    case 'bannerCta':
      return wrap(<BannerCtaBlockComponent {...block} />)
    case 'cta39':
      return wrap(<Cta39BlockComponent {...block} />)
    case 'richText':
      return wrap(<RichTextBlockComponent {...block} />)
    case 'videoEmbed':
      return wrap(<VideoEmbedBlockComponent {...block} />)
    case 'mediaCarousel':
      return wrap(<MediaCarouselBlockComponent {...block} />)
    case 'programMatrix':
      return wrap(<ProgramMatrixBlockComponent {...block} />)
    case 'integration23':
      return wrap(<Integration23BlockComponent {...block} />)
    case 'logos20':
      return wrap(<Logos20BlockComponent {...block} />)
    case 'logoStrip':
      return wrap(<LogoStripBlockComponent {...block} />)
    case 'pageHeader':
      return wrap(
        <PageHeaderBlockComponent {...block} automaticBreadcrumbs={args.automaticBreadcrumbs} />,
      )
    case 'breadcrumb':
      return wrap(
        <BreadcrumbBlockComponent {...block} automaticBreadcrumbs={args.automaticBreadcrumbs} />,
      )
    case 'timeline':
      return wrap(<TimelineBlockComponent {...block} />)
    case 'iconCardShowcase':
      return wrap(<IconCardShowcaseBlockComponent {...block} />)
    case 'iconGrid':
      return wrap(<IconGridBlockComponent {...block} />)
    case 'quoteBlock':
      return wrap(<QuoteBlockBlockComponent {...block} />)
    case 'tabsContent':
      return wrap(<TabsContentBlockComponent {...block} />)
    case 'downloadList':
      return wrap(<DownloadListBlockComponent {...block} />)
    case 'feeStructure':
      return wrap(<FeeStructureBlockComponent {...block} />)
    case 'pgFeeStructure':
      return wrap(<PGFeeStructureBlockComponent {...block} />)
    case 'bankDetails':
      return wrap(<BankDetailsBlockComponent {...block} />)
    case 'numberedSteps':
      return wrap(<NumberedStepsBlockComponent {...block} />)
    case 'bentoGrid':
      return wrap(<BentoGridBlockComponent {...block} />)
    case 'testimonialGrid':
      return wrap(<TestimonialGridBlockComponent {...block} />)
    case 'awardsList':
      return wrap(<AwardsListBlockComponent {...block} />)
    case 'aboutSection':
      return wrap(<AboutSectionBlockComponent {...block} />)
    case 'accreditationCards':
      return wrap(<AccreditationCardsBlockComponent {...block} />)
    case 'reusableSection': {
      const populated = block.section as PopulatedReusableSection | string | null | undefined
      if (!populated || typeof populated === 'string') return null
      const innerBlocks = populated.layout ?? []
      if (!innerBlocks.length) return null
      return (
        <React.Fragment key={key}>
          {innerBlocks.map((inner, i) => renderPageBlockNode(inner, i, args, depth + 1))}
        </React.Fragment>
      )
    }
    default:
      return null
  }
}

export function renderPageBlockNode(
  block: PageBlock,
  index: number,
  args: PageBlockRenderArgs,
  depth = 0,
): React.ReactNode {
  if (depth > 10) return null

  const key = block.id ?? `${block.blockType}-${index}`
  const anchorID = claimBlockAnchorID(block.anchorId, args.usedAnchorIDs)
  const content = renderPageBlockContent(block, index, args, depth)

  return content ? (
    <BlockAnchorWrapper anchorID={anchorID} key={key}>
      {content}
    </BlockAnchorWrapper>
  ) : null
}

export function renderPageBlocks(blocks?: PageBlock[] | null, context: PageRenderContext = {}) {
  if (!blocks?.length) {
    return null
  }

  const args: PageBlockRenderArgs = {
    automaticBreadcrumbs: context.page
      ? resolveAutomaticPageBreadcrumbs(context.page, { isHomepage: context.isHomepage })
      : [],
    heroPreloadState: { assigned: false },
    usedAnchorIDs: new Set(['main-content']),
  }

  return (
    <PageBlockStack>
      {blocks.map((block, index) => renderPageBlockNode(block, index, args))}
    </PageBlockStack>
  )
}
