import React from 'react'
import type { Page } from '@/payload-types'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import { resolveAutomaticPageBreadcrumbs, type ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'

import { AnnouncementBlockComponent } from './Announcement/Component'
import { ContentHighlightsBlockComponent } from './ContentHighlights/Component'
import { EditorialReasonsBlockComponent } from './EditorialReasons/Component'
import { AcademicProgrammesBlockComponent } from './AcademicProgrammes/Component'
import { LeadershipProfilesBlockComponent } from './LeadershipProfiles/Component'
import { DepartmentProfilesBlockComponent } from './DepartmentProfiles/Component'
import { FeatureMatrixBlockComponent } from './FeatureMatrix/Component'
import { FeatureSpotlightBlockComponent } from './FeatureSpotlight/Component'
import { TestimonialSpotlightBlockComponent } from './TestimonialSpotlight/Component'
import { BannerCtaBlockComponent } from './BannerCta/Component'
import { NewsGridPreviewBlockComponent } from './NewsGrid/PreviewComponent'
import { NewsEventsTabsPreviewBlockComponent } from './NewsEventsTabs/PreviewComponent'
import { Cta39BlockComponent } from './Cta39/Component'
import { GalleryShowcaseBlockComponent } from './GalleryShowcase/Component'
import { EventGalleryPreviewBlockComponent } from './EventGallery/PreviewComponent'
import { GalleryAlbumTabsPreviewBlockComponent } from './GalleryAlbumTabs/PreviewComponent'
import { GalleryCoverflowBlockComponent } from './GalleryCoverflow/Component'
import { HeroBannerBlockComponent } from './HeroBanner/Component'
import { HeroCarouselBlockComponent } from './HeroCarousel/Component'
import { ImageMosaicPreviewBlockComponent } from './ImageMosaic/PreviewComponent'
import { StudentExperienceBlockComponent } from './StudentExperience/Component'
import { NewsEventsHighlightsPreviewBlockComponent } from './NewsEventsHighlights/PreviewComponent'
import { PageBlockStack } from './PageBlockStack'
import { ProfileCarouselBlockComponent } from './ProfileCarousel/Component'
import { QaAccordionBlockComponent } from './QaAccordion/Component'
import { RatingSpotlightPreviewBlockComponent } from './RatingSpotlight/PreviewComponent'
import { ReviewFeedPreviewBlockComponent } from './ReviewFeed/PreviewComponent'
import { ReviewSubmissionBlockComponent } from './ReviewSubmission/Component'
import { Contact24PreviewBlockComponent } from './Contact24/PreviewComponent'
import { Contact33BlockComponent } from './Contact33/Component'
import { TeamShowcaseBlockComponent } from './TeamShowcase/Component'
import { StatsStripBlockComponent } from './StatsStrip/Component'
import { Services21BlockComponent } from './Services21/Component'
import { RichTextBlockComponent } from './RichTextBlock/Component'
import { VideoEmbedBlockComponent } from './VideoEmbed/Component'
import { MediaCarouselBlockComponent } from './MediaCarousel/Component'
import { ProgramMatrixBlockComponent } from './ProgramMatrix/Component'
import { LogoStripBlockComponent } from './LogoStrip/Component'
import { PageHeaderBlockComponent } from './PageHeader/Component'
import { BreadcrumbBlockComponent } from './Breadcrumb/Component'
import { CalendarPreviewBlockComponent } from './Calendar/PreviewComponent'
import { AnnualCalendarPreviewBlockComponent } from './AnnualCalendar/PreviewComponent'
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

export type LivePreviewPageBlock = NonNullable<Page['layout']>[number]

type PopulatedReusableSection = {
  id: string | number
  title?: string | null
  layout?: LivePreviewPageBlock[] | null
}

export type LivePreviewPageBlockRenderArgs = {
  automaticBreadcrumbs: ResolvedPageBreadcrumb[]
  snapshot: ReviewPreviewSnapshot
  newsEventsSnapshot: NewsEventsPreviewSnapshot
  officeLocations: SiteOfficeLocation[]
  eventGalleryAlbums: EventGalleryAlbum[]
}

export function renderLivePreviewPageBlockNode(
  block: LivePreviewPageBlock,
  index: number,
  args: LivePreviewPageBlockRenderArgs,
  depth = 0,
): React.ReactNode {
  if (depth > 10) return null

  const key = block.id ?? `${block.blockType}-${index}`
  const {
    automaticBreadcrumbs,
    snapshot,
    newsEventsSnapshot,
    officeLocations,
    eventGalleryAlbums,
  } = args

  switch (block.blockType) {
    case 'announcement':
      return <AnnouncementBlockComponent key={key} {...block} />
    case 'heroBanner':
      return <HeroBannerBlockComponent key={key} {...block} />
    case 'heroCarousel':
      return <HeroCarouselBlockComponent key={key} {...block} />
    case 'galleryCoverflow':
      return <GalleryCoverflowBlockComponent key={key} {...block} />
    case 'qaAccordion':
      return <QaAccordionBlockComponent key={key} {...block} />
    case 'featureMatrix':
      return <FeatureMatrixBlockComponent key={key} {...block} />
    case 'contentHighlights':
      return <ContentHighlightsBlockComponent key={key} {...block} />
    case 'editorialReasons':
      return <EditorialReasonsBlockComponent key={key} {...block} />
    case 'academicProgrammes':
      return <AcademicProgrammesBlockComponent key={key} {...block} />
    case 'leadershipProfiles':
      return <LeadershipProfilesBlockComponent key={key} {...block} />
    case 'departmentProfiles':
      return <DepartmentProfilesBlockComponent key={key} {...block} />
    case 'newsEventsHighlights':
      return (
        <NewsEventsHighlightsPreviewBlockComponent
          key={key}
          snapshot={newsEventsSnapshot}
          {...block}
        />
      )
    case 'profileCarousel':
      return <ProfileCarouselBlockComponent key={key} {...block} />
    case 'galleryShowcase':
      return <GalleryShowcaseBlockComponent key={key} {...block} />
    case 'eventGallery':
      return <EventGalleryPreviewBlockComponent albums={eventGalleryAlbums} key={key} {...block} />
    case 'galleryAlbumTabs':
      return (
        <GalleryAlbumTabsPreviewBlockComponent albums={eventGalleryAlbums} key={key} {...block} />
      )
    case 'imageMosaic':
      return <ImageMosaicPreviewBlockComponent albums={eventGalleryAlbums} key={key} {...block} />
    case 'studentExperience':
      return <StudentExperienceBlockComponent key={key} {...block} />
    case 'reviewSubmission':
      return <ReviewSubmissionBlockComponent key={key} {...block} />
    case 'contact33':
      return <Contact33BlockComponent key={key} {...block} />
    case 'contact24':
      return (
        <Contact24PreviewBlockComponent key={key} officeLocations={officeLocations} {...block} />
      )
    case 'ratingSpotlight':
      return <RatingSpotlightPreviewBlockComponent key={key} snapshot={snapshot} {...block} />
    case 'reviewFeed':
      return <ReviewFeedPreviewBlockComponent key={key} snapshot={snapshot} {...block} />
    case 'featureSpotlight':
      return <FeatureSpotlightBlockComponent key={key} {...block} />
    case 'testimonialSpotlight':
      return <TestimonialSpotlightBlockComponent key={key} {...block} />
    case 'statsStrip':
      return <StatsStripBlockComponent key={key} {...block} />
    case 'teamShowcase':
      return <TeamShowcaseBlockComponent key={key} {...block} />
    case 'services21':
      return <Services21BlockComponent key={key} {...block} />
    case 'newsGrid':
      return <NewsGridPreviewBlockComponent key={key} snapshot={newsEventsSnapshot} {...block} />
    case 'newsEventsTabs':
      return (
        <NewsEventsTabsPreviewBlockComponent key={key} snapshot={newsEventsSnapshot} {...block} />
      )
    case 'calendar':
      return <CalendarPreviewBlockComponent key={key} snapshot={newsEventsSnapshot} {...block} />
    case 'annualCalendar':
      return (
        <AnnualCalendarPreviewBlockComponent key={key} snapshot={newsEventsSnapshot} {...block} />
      )
    case 'bannerCta':
      return <BannerCtaBlockComponent key={key} {...block} />
    case 'cta39':
      return <Cta39BlockComponent key={key} {...block} />
    case 'richText':
      return <RichTextBlockComponent key={key} {...block} />
    case 'videoEmbed':
      return <VideoEmbedBlockComponent key={key} {...block} />
    case 'mediaCarousel':
      return <MediaCarouselBlockComponent key={key} {...block} />
    case 'programMatrix':
      return <ProgramMatrixBlockComponent key={key} {...block} />
    case 'logoStrip':
      return <LogoStripBlockComponent key={key} {...block} />
    case 'pageHeader':
      return (
        <PageHeaderBlockComponent
          key={key}
          {...block}
          automaticBreadcrumbs={automaticBreadcrumbs}
        />
      )
    case 'breadcrumb':
      return (
        <BreadcrumbBlockComponent
          key={key}
          {...block}
          automaticBreadcrumbs={automaticBreadcrumbs}
        />
      )
    case 'timeline':
      return <TimelineBlockComponent key={key} {...block} />
    case 'iconCardShowcase':
      return <IconCardShowcaseBlockComponent key={key} {...block} />
    case 'iconGrid':
      return <IconGridBlockComponent key={key} {...block} />
    case 'quoteBlock':
      return <QuoteBlockBlockComponent key={key} {...block} />
    case 'tabsContent':
      return <TabsContentBlockComponent key={key} {...block} />
    case 'downloadList':
      return <DownloadListBlockComponent key={key} {...block} />
    case 'feeStructure':
      return <FeeStructureBlockComponent key={key} {...block} />
    case 'pgFeeStructure':
      return <PGFeeStructureBlockComponent key={key} {...block} />
    case 'bankDetails':
      return <BankDetailsBlockComponent key={key} {...block} />
    case 'numberedSteps':
      return <NumberedStepsBlockComponent key={key} {...block} />
    case 'bentoGrid':
      return <BentoGridBlockComponent key={key} {...block} />
    case 'testimonialGrid':
      return <TestimonialGridBlockComponent key={key} {...block} />
    case 'awardsList':
      return <AwardsListBlockComponent key={key} {...block} />
    case 'aboutSection':
      return <AboutSectionBlockComponent key={key} {...block} />
    case 'accreditationCards':
      return <AccreditationCardsBlockComponent key={key} {...block} />
    case 'reusableSection': {
      const populated = block.section as PopulatedReusableSection | string | null | undefined
      if (!populated || typeof populated === 'string') return null
      const innerBlocks = populated.layout ?? []
      if (!innerBlocks.length) return null
      return (
        <React.Fragment key={key}>
          {innerBlocks.map((inner, i) => renderLivePreviewPageBlockNode(inner, i, args, depth + 1))}
        </React.Fragment>
      )
    }
    default:
      return null
  }
}

export function renderLivePreviewPageBlocks(
  blocks: Page['layout'] | null | undefined,
  snapshot: ReviewPreviewSnapshot,
  newsEventsSnapshot: NewsEventsPreviewSnapshot,
  officeLocations: SiteOfficeLocation[],
  eventGalleryAlbums: EventGalleryAlbum[],
  context: { isHomepage?: boolean; page?: Page | null } = {},
) {
  if (!blocks?.length) {
    return null
  }

  const args: LivePreviewPageBlockRenderArgs = {
    automaticBreadcrumbs: context.page
      ? resolveAutomaticPageBreadcrumbs(context.page, { isHomepage: context.isHomepage })
      : [],
    snapshot,
    newsEventsSnapshot,
    officeLocations,
    eventGalleryAlbums,
  }

  return (
    <PageBlockStack>
      {blocks.map((block, index) => renderLivePreviewPageBlockNode(block, index, args))}
    </PageBlockStack>
  )
}
