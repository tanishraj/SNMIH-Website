import type { Block } from 'payload'

type BlockThumbnailDefinitionInput = {
  alt: string
  filename: string
  label: string
  slug: string
  stageAlignment?: 'center' | 'top'
}

const defineThumbnail = <const Definition extends BlockThumbnailDefinitionInput>({
  stageAlignment = 'center',
  ...definition
}: Definition) => ({
  ...definition,
  stageAlignment,
  url: `/block-thumbnails/${definition.filename}` as const,
})

export const blockThumbnailDefinitions = [
  defineThumbnail({
    slug: 'disclosureProforma',
    filename: 'disclosure-proforma.jpg',
    label: 'Disclosure Proforma',
    alt: 'Institutional disclosure sidebar and statistics preview',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Logo Marquee two-row partner logo preview',
    filename: 'logos20.jpg',
    label: 'Logo Marquee',
    slug: 'logos20',
  }),
  defineThumbnail({
    alt: 'Partner Directory bordered logo grid preview',
    filename: 'integration23.jpg',
    label: 'Partner Directory',
    slug: 'integration23',
  }),
  defineThumbnail({
    alt: 'Announcement block preview',
    filename: 'announcement.jpg',
    label: 'Announcement',
    slug: 'announcement',
  }),
  defineThumbnail({
    alt: 'Hero Banner block preview',
    filename: 'hero-banner.jpg',
    label: 'Hero Banner',
    slug: 'heroBanner',
  }),
  defineThumbnail({
    alt: 'Hero Carousel block preview',
    filename: 'hero-carousel.jpg',
    label: 'Hero Carousel',
    slug: 'heroCarousel',
  }),
  defineThumbnail({
    alt: 'Footer Minimal block preview',
    filename: 'footer-minimal.jpg',
    label: 'Footer Minimal',
    slug: 'footerMinimal',
  }),
  defineThumbnail({
    alt: 'News Grid block preview',
    filename: 'news-grid.jpg',
    label: 'News Grid',
    slug: 'newsGrid',
  }),
  defineThumbnail({
    alt: 'News and Events Tabs block preview',
    filename: 'news-events-tabs.jpg',
    label: 'News & Events Tabs',
    slug: 'newsEventsTabs',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Calendar block preview',
    filename: 'calendar.jpg',
    label: 'Calendar',
    slug: 'calendar',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Annual Calendar block preview',
    filename: 'annual-calendar.jpg',
    label: 'Annual Calendar',
    slug: 'annualCalendar',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Banner CTA block preview',
    filename: 'banner-cta.jpg',
    label: 'Banner CTA',
    slug: 'bannerCta',
  }),
  defineThumbnail({
    alt: 'Call to Action block preview',
    filename: 'cta-39.jpg',
    label: 'Call to Action',
    slug: 'cta39',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Feature Spotlight block preview',
    filename: 'feature-spotlight.jpg',
    label: 'Feature Spotlight',
    slug: 'featureSpotlight',
  }),
  defineThumbnail({
    alt: 'Testimonial Spotlight block preview',
    filename: 'testimonial-spotlight.jpg',
    label: 'Testimonial Spotlight',
    slug: 'testimonialSpotlight',
  }),
  defineThumbnail({
    alt: 'Feature Matrix block preview',
    filename: 'feature-matrix.jpg',
    label: 'Feature Matrix',
    slug: 'featureMatrix',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Content Highlights block preview',
    filename: 'content-highlights.jpg',
    label: 'Content Highlights',
    slug: 'contentHighlights',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Editorial Reasons block preview',
    filename: 'editorial-reasons.jpg',
    label: 'Editorial Reasons',
    slug: 'editorialReasons',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Academic Programmes block preview',
    filename: 'academic-programmes.jpg',
    label: 'Academic Programmes',
    slug: 'academicProgrammes',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Leadership Profiles block preview',
    filename: 'leadership-profiles.jpg',
    label: 'Leadership Profiles',
    slug: 'leadershipProfiles',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Department Profiles block preview',
    filename: 'department-profiles.jpg',
    label: 'Department Profiles',
    slug: 'departmentProfiles',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'News & Events Highlights block preview',
    filename: 'news-events-highlights.jpg',
    label: 'News & Events Highlights',
    slug: 'newsEventsHighlights',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Profile Carousel block preview',
    filename: 'profile-carousel.jpg',
    label: 'Profile Carousel',
    slug: 'profileCarousel',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Gallery Showcase block preview',
    filename: 'gallery-showcase.jpg',
    label: 'Gallery Showcase',
    slug: 'galleryShowcase',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Gallery Coverflow block preview',
    filename: 'gallery-coverflow.jpg',
    label: 'Gallery Coverflow',
    slug: 'galleryCoverflow',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Event Gallery block preview',
    filename: 'event-gallery.jpg',
    label: 'Event Gallery',
    slug: 'eventGallery',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Gallery Album Tabs block preview',
    filename: 'gallery-album-tabs.jpg',
    label: 'Gallery Album Tabs',
    slug: 'galleryAlbumTabs',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Image Mosaic block preview',
    filename: 'image-mosaic.jpg',
    label: 'Image Mosaic',
    slug: 'imageMosaic',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Student Experience block preview',
    filename: 'student-experience.jpg',
    label: 'Student Experience',
    slug: 'studentExperience',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Stats Strip block preview',
    filename: 'stats-strip.jpg',
    label: 'Stats Strip',
    slug: 'statsStrip',
  }),
  defineThumbnail({
    alt: 'Team Showcase block preview',
    filename: 'team-showcase.jpg',
    label: 'Team Showcase',
    slug: 'teamShowcase',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Q&A Accordion block preview',
    filename: 'qa-accordion.jpg',
    label: 'Q&A Accordion',
    slug: 'qaAccordion',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Review Feed block preview',
    filename: 'review-feed.jpg',
    label: 'Review Feed',
    slug: 'reviewFeed',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Review Submission block preview',
    filename: 'review-submission.jpg',
    label: 'Review Submission',
    slug: 'reviewSubmission',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Contact Form block preview',
    filename: 'contact-33.jpg',
    label: 'Contact Form',
    slug: 'contact33',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Regional Offices block preview',
    filename: 'contact-24.jpg',
    label: 'Regional Offices',
    slug: 'contact24',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Rating Spotlight block preview',
    filename: 'rating-spotlight.jpg',
    label: 'Rating Spotlight',
    slug: 'ratingSpotlight',
  }),
  defineThumbnail({
    alt: 'Services block preview',
    filename: 'services-21.jpg',
    label: 'Services',
    slug: 'services21',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Header Navbar 12 block preview',
    filename: 'header-navbar-12.jpg',
    label: 'Header Navbar 12',
    slug: 'headerNavbar12',
  }),
  defineThumbnail({
    alt: 'Footer 56 block preview',
    filename: 'footer-56.jpg',
    label: 'Footer 56',
    slug: 'footer56',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'System 404 preview',
    filename: 'system-404.jpg',
    label: 'System 404',
    slug: 'system404',
  }),
  defineThumbnail({
    alt: 'System Maintenance preview',
    filename: 'system-maintenance.jpg',
    label: 'System Maintenance',
    slug: 'systemMaintenance',
  }),
  defineThumbnail({
    alt: 'System Coming Soon preview',
    filename: 'system-coming-soon.jpg',
    label: 'System Coming Soon',
    slug: 'systemComingSoon',
  }),
  defineThumbnail({
    alt: 'About Section block preview',
    filename: 'about-section.jpg',
    label: 'About Section',
    slug: 'aboutSection',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Accreditation Cards block preview',
    filename: 'accreditation-cards.jpg',
    label: 'Accreditation Cards',
    slug: 'accreditationCards',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Awards List block preview',
    filename: 'awards-list.jpg',
    label: 'Awards List',
    slug: 'awardsList',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Bento Grid block preview',
    filename: 'bento-grid.jpg',
    label: 'Bento Grid',
    slug: 'bentoGrid',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Download List block preview',
    filename: 'download-list.jpg',
    label: 'Download List',
    slug: 'downloadList',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Fee Structure block preview',
    filename: 'fee-structure.jpg',
    label: 'Fee Structure',
    slug: 'feeStructure',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'PG Fee Structure block preview',
    filename: 'pg-fee-structure.jpg',
    label: 'PG Fee Structure',
    slug: 'pgFeeStructure',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Bank Details block preview',
    filename: 'bank-details.jpg',
    label: 'Bank Details',
    slug: 'bankDetails',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Document Checklist block preview',
    filename: 'document-checklist.jpg',
    label: 'Document Checklist',
    slug: 'documentChecklist',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Celebration block preview',
    filename: 'celebration.jpg',
    label: 'Celebration',
    slug: 'celebration',
  }),
  defineThumbnail({
    alt: 'Contact Numbers block preview',
    filename: 'contact-numbers.jpg',
    label: 'Contact Numbers',
    slug: 'contactNumbers',
  }),
  defineThumbnail({
    alt: 'Icon Grid block preview',
    filename: 'icon-grid.jpg',
    label: 'Icon Grid',
    slug: 'iconGrid',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Icon Card Showcase block preview',
    filename: 'icon-card-showcase.jpg',
    label: 'Icon Card Showcase',
    slug: 'iconCardShowcase',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Logo Strip block preview',
    filename: 'logo-strip.jpg',
    label: 'Logo Strip',
    slug: 'logoStrip',
  }),
  defineThumbnail({
    alt: 'Media Carousel block preview',
    filename: 'media-carousel.jpg',
    label: 'Media Carousel',
    slug: 'mediaCarousel',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Numbered Steps block preview',
    filename: 'numbered-steps.jpg',
    label: 'Numbered Steps',
    slug: 'numberedSteps',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Page Header block preview',
    filename: 'page-header.jpg',
    label: 'Page Header',
    slug: 'pageHeader',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Breadcrumb block preview',
    filename: 'breadcrumb.jpg',
    label: 'Breadcrumb',
    slug: 'breadcrumb',
  }),
  defineThumbnail({
    alt: 'Program Matrix block preview',
    filename: 'program-matrix.jpg',
    label: 'Program Matrix',
    slug: 'programMatrix',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Quote Block preview',
    filename: 'quote-block.jpg',
    label: 'Quote Block',
    slug: 'quoteBlock',
  }),
  defineThumbnail({
    alt: 'Rich Text block preview',
    filename: 'rich-text-block.jpg',
    label: 'Rich Text',
    slug: 'richText',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Tabs Content block preview',
    filename: 'tabs-content.jpg',
    label: 'Tabs Content',
    slug: 'tabsContent',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Testimonial Grid block preview',
    filename: 'testimonial-grid.jpg',
    label: 'Testimonial Grid',
    slug: 'testimonialGrid',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Timeline block preview',
    filename: 'timeline.jpg',
    label: 'Timeline',
    slug: 'timeline',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Video Embed block preview',
    filename: 'video-embed.jpg',
    label: 'Video Embed',
    slug: 'videoEmbed',
    stageAlignment: 'top',
  }),
  defineThumbnail({
    alt: 'Reusable Section block preview',
    filename: 'reusable-section.jpg',
    label: 'Reusable Section',
    slug: 'reusableSection',
    stageAlignment: 'top',
  }),
] as const

export type BlockThumbnailSlug = (typeof blockThumbnailDefinitions)[number]['slug']

export const isBlockThumbnailSlug = (value: string): value is BlockThumbnailSlug =>
  blockThumbnailDefinitions.some(({ slug }) => slug === value)

export function getBlockThumbnailDefinition(slug: BlockThumbnailSlug) {
  const definition = blockThumbnailDefinitions.find((item) => item.slug === slug)

  if (!definition) {
    throw new Error(`Unknown block thumbnail slug: ${slug}`)
  }

  return definition
}

export function getBlockThumbnailAdmin(slug: BlockThumbnailSlug): NonNullable<Block['admin']> {
  const { alt, url } = getBlockThumbnailDefinition(slug)

  return {
    images: {
      thumbnail: {
        alt,
        url,
      },
    },
  }
}

export const isBlockThumbnailPreviewEnabled = (nodeEnv: string | undefined) =>
  nodeEnv === 'development'
