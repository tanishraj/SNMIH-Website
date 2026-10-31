import { DisclosurePresentation } from '@/blocks/DisclosureProforma/Presentation'
import type { ReactNode } from 'react'

import { AnnouncementBlockComponent } from '@/blocks/Announcement/Component'
import { ContentHighlightsBlockComponent } from '@/blocks/ContentHighlights/Component'
import { EditorialReasonsBlockComponent } from '@/blocks/EditorialReasons/Component'
import { AcademicProgrammesBlockComponent } from '@/blocks/AcademicProgrammes/Component'
import { LeadershipProfilesBlockComponent } from '@/blocks/LeadershipProfiles/Component'
import { DepartmentProfilesBlockComponent } from '@/blocks/DepartmentProfiles/Component'
import { FeatureMatrixBlockComponent } from '@/blocks/FeatureMatrix/Component'
import { Footer56BlockComponent } from '@/blocks/Footer56/Component'
import { FooterMinimalBlockComponent } from '@/blocks/FooterMinimal/Component'
import { GalleryShowcaseBlockComponent } from '@/blocks/GalleryShowcase/Component'
import { GalleryCoverflowBlockComponent } from '@/blocks/GalleryCoverflow/Component'
import { BannerCtaBlockComponent } from '@/blocks/BannerCta/Component'
import { NewsGridBlockPresentation } from '@/blocks/NewsGrid/Presentation'
import { NewsEventsTabsBlockPresentation } from '@/blocks/NewsEventsTabs/Presentation'
import { CalendarBlockPresentation } from '@/blocks/Calendar/Presentation'
import { AnnualCalendarBlockPresentation } from '@/blocks/AnnualCalendar/Presentation'
import {
  getAnnualCalendarMonthKeys,
  materializeAnnualCalendarMonths,
  type AnnualCalendarInitialSnapshot,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import type {
  CalendarClassification,
  CalendarEvent,
  CalendarInitialSnapshot,
} from '@/blocks/Calendar/calendarShared'
import { Cta39BlockComponent } from '@/blocks/Cta39/Component'
import { HeaderNavbar12BlockComponent } from '@/blocks/HeaderNavbar12/Component'
import { HeroBannerBlockComponent } from '@/blocks/HeroBanner/Component'
import { HeroCarouselBlockComponent } from '@/blocks/HeroCarousel/Component'
import { ImageMosaicBlockComponent } from '@/blocks/ImageMosaic/Component'
import { StudentExperienceBlockComponent } from '@/blocks/StudentExperience/Component'
import { NewsEventsHighlightsBlockPresentation } from '@/blocks/NewsEventsHighlights/Presentation'
import { ProfileCarouselBlockComponent } from '@/blocks/ProfileCarousel/Component'
import { QaAccordionBlockComponent } from '@/blocks/QaAccordion/Component'
import { RatingSpotlightBlockComponent } from '@/blocks/RatingSpotlight/Component'
import { ReviewSubmissionBlockComponent } from '@/blocks/ReviewSubmission/Component'
import { Contact33BlockComponent } from '@/blocks/Contact33/Component'
import { DynamicFormBlockComponent } from '@/blocks/DynamicForm/Component'
import { FeatureSpotlightBlockComponent } from '@/blocks/FeatureSpotlight/Component'
import { TestimonialSpotlightBlockComponent } from '@/blocks/TestimonialSpotlight/Component'
import { StatsStripBlockComponent } from '@/blocks/StatsStrip/Component'
import { TeamShowcase } from '@/components/team-showcase'
import { ReviewFeed } from '@/components/review-feed'
import { Services21BlockComponent } from '@/blocks/Services21/Component'
import { System404BlockComponent } from '@/blocks/System404/Component'
import { SystemComingSoonBlockComponent } from '@/blocks/SystemComingSoon/Component'
import { SystemMaintenanceBlockComponent } from '@/blocks/SystemMaintenance/Component'
import { Contact24 } from '@/components/contact24'
import { EventGallery } from '@/components/event-gallery'
import { GalleryAlbumTabsBlockPresentation } from '@/blocks/GalleryAlbumTabs/Presentation'
import type { SiteOfficeLocation } from '@/lib/siteOfficesShared'
import type {
  NewsEventClassificationBehavior,
  CalendarTone,
  ResolvedNewsEventClassification,
} from '@/lib/newsEventClassifications'
import type { PublicNewsEventCard, PublicNewsEventPage } from '@/lib/newsEventsShared'
import type { Form, Media, RichTextBlock } from '@/payload-types'

import { AboutSectionBlockComponent } from '@/blocks/AboutSection/Component'
import { AccreditationCardsBlockComponent } from '@/blocks/AccreditationCards/Component'
import { AwardsListBlockComponent } from '@/blocks/AwardsList/Component'
import { CareersBlockComponent } from '@/blocks/Careers/Component'
import { BankDetailsBlockComponent } from '@/blocks/BankDetails/Component'
import { DocumentChecklistBlockComponent } from '@/blocks/DocumentChecklist/Component'
import { CelebrationPreview } from '@/components/celebration/CelebrationPreview'
import { ContactNumbersBlockComponent } from '@/blocks/ContactNumbers/Component'
import { BentoGridBlockComponent } from '@/blocks/BentoGrid/Component'
import { DownloadListBlockComponent } from '@/blocks/DownloadList/Component'
import { FeeStructureBlockComponent } from '@/blocks/FeeStructure/Component'
import { PGFeeStructureBlockComponent } from '@/blocks/PGFeeStructure/Component'
import { IconCardShowcaseBlockComponent } from '@/blocks/IconCardShowcase/Component'
import { IconGridBlockComponent } from '@/blocks/IconGrid/Component'
import { Integration23BlockComponent } from '@/blocks/Integration23/Component'
import { Logos20BlockComponent } from '@/blocks/Logos20/Component'
import { LogoStripBlockComponent } from '@/blocks/LogoStrip/Component'
import { MediaCarouselBlockComponent } from '@/blocks/MediaCarousel/Component'
import { NumberedStepsBlockComponent } from '@/blocks/NumberedSteps/Component'
import { PageHeaderBlockComponent } from '@/blocks/PageHeader/Component'
import { BreadcrumbBlockComponent } from '@/blocks/Breadcrumb/Component'
import { ProgramMatrixBlockComponent } from '@/blocks/ProgramMatrix/Component'
import { QuoteBlockBlockComponent } from '@/blocks/QuoteBlock/Component'
import { RichTextBlockComponent } from '@/blocks/RichTextBlock/Component'
import { TabsContentBlockComponent } from '@/blocks/TabsContent/Component'
import { TestimonialGridBlockComponent } from '@/blocks/TestimonialGrid/Component'
import { TimelineBlockComponent } from '@/blocks/Timeline/Component'
import { VideoEmbedBlockComponent } from '@/blocks/VideoEmbed/Component'

import type { BlockThumbnailSlug } from './definitions'

export const blockThumbnailAssetPaths = [
  '/block-thumbnail-assets/editorial-landscape.svg',
  '/block-thumbnail-assets/collaboration.svg',
  '/block-thumbnail-assets/portrait.svg',
  '/block-thumbnail-assets/brand-mark.svg',
  '/block-thumbnail-assets/office-map.svg',
] as const

const [editorialLandscape, collaboration, portrait, brandMark, officeMap] = blockThumbnailAssetPaths

const richTextParagraph = (text: string): RichTextBlock['content'] => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const fakeMedia = (url: string, alt: string, width = 1200, height = 800): Media =>
  ({
    id: alt,
    url,
    alt,
    width,
    height,
    mimeType: 'image/svg+xml',
    updatedAt: '',
    createdAt: '',
  }) as unknown as Media

const qaAccordionFixtureItems = [
  {
    question: 'How do I choose the right program?',
    answer: richTextParagraph(
      'Start with your goals, preferred learning style, and the kind of support you value most.',
    ),
  },
  {
    question: 'Can I visit before I apply?',
    answer: richTextParagraph(
      'Yes. Guided visits and open events are available throughout the year.',
    ),
  },
  {
    question: 'What support is available?',
    answer: richTextParagraph(
      'Advising, learning resources, and community support are available from your first day.',
    ),
  },
]

const reviewFormFixture: Pick<
  Form,
  'fields' | 'slug' | 'submitButtonLabel' | 'successMessage' | 'title'
> = {
  fields: [
    {
      label: 'Rating',
      name: 'rating',
      options: [
        { label: 'Poor', value: '1' },
        { label: 'Fair', value: '2' },
        { label: 'Good', value: '3' },
        { label: 'Very Good', value: '4' },
        { label: 'Excellent', value: '5' },
      ],
      required: true,
      type: 'select',
    },
    {
      label: 'What is it about?',
      name: 'subjectLabel',
      options: [
        { label: 'Programs', value: 'programs' },
        { label: 'Campus', value: 'campus' },
        { label: 'Support', value: 'support' },
      ],
      required: false,
      type: 'select',
    },
    {
      label: 'Your name',
      name: 'reviewerName',
      placeholder: 'Your name',
      required: true,
      type: 'text',
    },
    {
      label: 'Email',
      name: 'reviewerEmail',
      placeholder: 'you@example.com',
      required: false,
      type: 'email',
    },
    {
      label: 'Your review',
      name: 'reviewBody',
      placeholder: 'Tell us what stood out.',
      required: true,
      type: 'textarea',
    },
  ],
  slug: 'thumbnail-review-form',
  submitButtonLabel: 'Submit review',
  successMessage: 'Thank you for sharing your experience.',
  title: 'Review form',
}

const contactFormFixture: Pick<
  Form,
  'fields' | 'slug' | 'submitButtonLabel' | 'successMessage' | 'title'
> = {
  fields: [
    {
      label: 'Name',
      name: 'name',
      placeholder: 'Your name',
      required: true,
      type: 'text',
    },
    {
      label: 'Email',
      name: 'email',
      placeholder: 'you@example.com',
      required: true,
      type: 'email',
    },
    {
      label: 'Subject',
      name: 'subject',
      options: [
        { label: 'Programs', value: 'programs' },
        { label: 'Admissions', value: 'admissions' },
        { label: 'Partnerships', value: 'partnerships' },
      ],
      required: false,
      type: 'select',
    },
    {
      label: 'Message',
      name: 'message',
      placeholder: 'How can we help?',
      required: true,
      type: 'textarea',
    },
  ],
  slug: 'thumbnail-contact-form',
  submitButtonLabel: 'Send message',
  successMessage: 'Thanks. Our team will be in touch.',
  title: 'Contact form',
}

const contact24OfficeFixtures: SiteOfficeLocation[] = [
  {
    id: 'new-york',
    region: 'North America',
    city: 'New York',
    address: '350 Fifth Avenue, New York, NY 10118',
    phone: '+1 (212) 555-0123',
    phoneHref: 'tel:+12125550123',
    email: 'nyc@northstar.example',
    mapEmbedUrl: officeMap,
    mapUrl: 'https://maps.google.com/?q=New+York',
    mapTitle: 'Interactive map for the New York office',
    showAddressDetails: true,
  },
  {
    id: 'dubai',
    region: 'Middle East',
    city: 'Dubai',
    address: 'DIFC, Gate Building, Level 13, Dubai, UAE',
    phone: '+971 4 555 0123',
    phoneHref: 'tel:+97145550123',
    email: 'dubai@northstar.example',
    mapEmbedUrl: officeMap,
    mapUrl: 'https://maps.google.com/?q=Dubai',
    mapTitle: 'Interactive map for the Dubai office',
    showAddressDetails: true,
  },
]

const headerMenuFixture = [
  {
    label: 'Programs',
    linkType: 'custom' as const,
    url: '/programs',
    children: [
      { label: 'Overview', linkType: 'custom' as const, url: '/programs' },
      { label: 'Learning paths', linkType: 'custom' as const, url: '/programs/paths' },
    ],
  },
  { label: 'Experience', linkType: 'custom' as const, url: '/experience' },
  { label: 'Community', linkType: 'custom' as const, url: '/community' },
]

const footerGroupsFixture = [
  {
    title: 'Explore',
    links: [
      { label: 'Programs', linkType: 'custom' as const, url: '/programs' },
      { label: 'Experience', linkType: 'custom' as const, url: '/experience' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Visit', linkType: 'custom' as const, url: '/visit' },
      { label: 'Contact', linkType: 'custom' as const, url: '/contact' },
    ],
  },
]

const thumbnailNewsEventClassification = (
  slug: string,
  badgeLabel: string,
  behavior: NewsEventClassificationBehavior = 'story',
  calendarColor: CalendarTone = 'blue',
): ResolvedNewsEventClassification => ({
  active: true,
  badgeLabel,
  behavior,
  calendarColor,
  id: `thumbnail-classification-${slug}`,
  legacyValue: null,
  slug,
  title: badgeLabel,
})

const thumbnailNewsClassification = thumbnailNewsEventClassification('news', 'News')
const thumbnailEventClassification = thumbnailNewsEventClassification('event', 'Event', 'event')
const thumbnailNoticeClassification = thumbnailNewsEventClassification('notice', 'Notice')
const thumbnailAchievementClassification = thumbnailNewsEventClassification(
  'achievement',
  'Achievement',
)
const thumbnailHolidayClassification = thumbnailNewsEventClassification('holiday', 'Holiday')

const calendarClassifications: CalendarClassification[] = [
  {
    badgeLabel: 'Academic',
    calendarColor: 'green',
    id: 'academic',
    slug: 'academic',
    title: 'Academic',
  },
  { badgeLabel: 'Exam', calendarColor: 'blue', id: 'exam', slug: 'exam', title: 'Examination' },
  {
    badgeLabel: 'Clinical',
    calendarColor: 'cyan',
    id: 'clinical',
    slug: 'clinical',
    title: 'Clinical',
  },
  {
    badgeLabel: 'Holiday',
    calendarColor: 'amber',
    id: 'holiday',
    slug: 'holiday',
    title: 'Holiday',
  },
  {
    badgeLabel: 'Research',
    calendarColor: 'violet',
    id: 'research',
    slug: 'research',
    title: 'Research',
  },
]

const calendarEvent = (
  id: string,
  title: string,
  classification: CalendarClassification,
  startDateKey: string,
  options: { allDay?: boolean; endDateKey?: string; location?: string; timeLabel?: string } = {},
): CalendarEvent => ({
  allDay: options.allDay ?? false,
  classification,
  endDateKey: options.endDateKey ?? startDateKey,
  eventStart: `${startDateKey}T04:30:00.000Z`,
  href: `/news-events/${id}`,
  id,
  location: options.location,
  rangeLabel:
    startDateKey === options.endDateKey
      ? startDateKey
      : `${startDateKey} – ${options.endDateKey ?? startDateKey}`,
  startDateKey,
  timeLabel: options.allDay ? undefined : (options.timeLabel ?? '10:00 AM IST'),
  title,
})

const calendarEvents: CalendarEvent[] = [
  calendarEvent('semester-begins', 'Semester I begins', calendarClassifications[0], '2026-08-02', {
    allDay: true,
  }),
  calendarEvent(
    'clinical-orientation',
    'Clinical rotation orientation',
    calendarClassifications[2],
    '2026-08-05',
    { location: 'Teaching hospital' },
  ),
  calendarEvent(
    'research-workshop',
    'Research methods workshop',
    calendarClassifications[4],
    '2026-08-07',
  ),
  calendarEvent(
    'anatomy-assessment',
    'Internal assessment — Anatomy',
    calendarClassifications[1],
    '2026-08-14',
    { location: 'Examination hall' },
  ),
  calendarEvent('ward-posting', 'Ward posting rotation', calendarClassifications[2], '2026-08-19'),
  calendarEvent(
    'guest-lecture',
    'Guest lecture — Cardiology',
    calendarClassifications[0],
    '2026-08-21',
  ),
  calendarEvent('mentoring', 'Academic mentoring day', calendarClassifications[0], '2026-08-23'),
  calendarEvent('holiday', 'Institutional holiday', calendarClassifications[3], '2026-08-26', {
    allDay: true,
  }),
  calendarEvent(
    'research-presentation',
    'Student research presentation',
    calendarClassifications[4],
    '2026-08-28',
  ),
  calendarEvent('assessment', 'Formative assessment', calendarClassifications[1], '2026-08-31'),
]

const calendarInitialSnapshot: CalendarInitialSnapshot = {
  classifications: calendarClassifications,
  month: {
    events: calendarEvents,
    monthKey: '2026-08',
    monthLabel: 'August 2026',
    version: 1,
  },
  timeZone: 'Asia/Kolkata',
  todayKey: '2026-08-23',
  upcoming: calendarEvents.slice(6, 10),
}

const annualCalendarInitialSnapshot: AnnualCalendarInitialSnapshot = {
  classifications: calendarClassifications,
  endMonthKey: '2026-12',
  eventCount: calendarEvents.length,
  months: materializeAnnualCalendarMonths(getAnnualCalendarMonthKeys(2026), calendarEvents),
  periodLabel: 'Calendar year 2026',
  startMonthKey: '2026-01',
  timeZone: 'Asia/Kolkata',
  todayKey: '2026-08-23',
  upcoming: calendarEvents.slice(6, 10),
  version: 3,
}

const thumbnailNewsEventsTabsItems: PublicNewsEventCard[] = [
  {
    behavior: 'story',
    classification: thumbnailNoticeClassification,
    contentType: 'notice',
    dateISO: '2026-08-12',
    dateLabel: '12 Aug 2026',
    excerpt: 'The latest academic notice for students and faculty.',
    href: '/news-events/academic-notice',
    id: 'notice-1',
    isPastEvent: false,
    slug: 'academic-notice',
    title: 'Academic calendar and admissions notice',
  },
  {
    behavior: 'event',
    classification: thumbnailEventClassification,
    contentType: 'event',
    dateISO: '2026-08-20',
    dateLabel: '20 Aug 2026',
    eventStart: '2026-08-20',
    excerpt: 'Join faculty and students for a campus-wide programme.',
    href: '/news-events/open-day',
    id: 'event-1',
    isPastEvent: false,
    slug: 'open-day',
    title: 'Community open day returns in August',
  },
  {
    behavior: 'story',
    classification: thumbnailAchievementClassification,
    contentType: 'achievement',
    dateISO: '2026-08-08',
    dateLabel: '8 Aug 2026',
    excerpt: 'Students are recognised for outstanding clinical learning.',
    href: '/news-events/student-achievement',
    id: 'achievement-1',
    isPastEvent: false,
    slug: 'student-achievement',
    title: 'Students earn state-level recognition',
  },
]

const thumbnailNewsEventsTabsPage = (docs: PublicNewsEventCard[]): PublicNewsEventPage => ({
  docs,
  hasNextPage: false,
  page: 1,
})

const thumbnailNewsEventsTabsGroups = {
  [thumbnailAchievementClassification.id]: thumbnailNewsEventsTabsPage(
    thumbnailNewsEventsTabsItems.filter(
      (item) => item.classification.id === thumbnailAchievementClassification.id,
    ),
  ),
  all: thumbnailNewsEventsTabsPage(thumbnailNewsEventsTabsItems),
  [thumbnailEventClassification.id]: thumbnailNewsEventsTabsPage(
    thumbnailNewsEventsTabsItems.filter(
      (item) => item.classification.id === thumbnailEventClassification.id,
    ),
  ),
  [thumbnailNoticeClassification.id]: thumbnailNewsEventsTabsPage(
    thumbnailNewsEventsTabsItems.filter(
      (item) => item.classification.id === thumbnailNoticeClassification.id,
    ),
  ),
}

export const blockThumbnailFixtures = {
  disclosureProforma: (
    <DisclosurePresentation
      dataset="thumbnail"
      title="Institutional disclosures"
      description="Explore current information and previous reporting periods."
      defaultSection="statistics"
      archiveNote="Previous reporting periods remain available within each section."
      staticPreview
      initial={{
        dataset: 'thumbnail',
        periods: [{ id: 'september', label: 'September 2026' }],
        period: 'september',
        periodPage: 1,
        hasMorePeriods: false,
        groups: {
          highlights: {
            rows: [
              { id: 'opd', label: 'Outpatient visits', value: '58,245' },
              { id: 'ipd', label: 'Inpatients', value: '6,264' },
              { id: 'births', label: 'Births reported', value: '182' },
            ],
            page: 1,
            total: 3,
            totalPages: 1,
          },
          monthly: {
            rows: [
              { id: 'deaths', label: 'Deaths reported', value: '26' },
              { id: 'grievances', label: 'Grievances reported', value: null },
            ],
            page: 1,
            total: 2,
            totalPages: 1,
          },
        },
      }}
    />
  ),
  accreditationCards: (
    <AccreditationCardsBlockComponent
      accreditations={[
        {
          title: 'NMC',
          description: 'National Medical Commission Approved',
          icon: 'Medal',
        },
        {
          title: 'NABH',
          description: 'Hospital accreditation in progress',
          icon: 'Medal',
        },
        {
          title: 'NAAC',
          description: 'Applying for grading 2025',
          icon: 'Medal',
        },
        {
          title: 'ISO',
          description: '9001:2015 Quality Certified',
          icon: 'Medal',
        },
      ]}
      appearance={{ background: 'brand', border: 'none' }}
      columns="4"
      size="compact"
    />
  ),
  academicProgrammes: (
    <AcademicProgrammesBlockComponent
      appearance={{ background: 'subtle', border: 'none' }}
      columns="2"
      eyebrow="Our programmes"
      programmes={[
        {
          ctaLabel: 'Apply now',
          description:
            'Our flagship undergraduate programme combines medical science and supervised clinical learning.',
          duration: '4.5 Years + 1 Year Internship',
          eyebrow: 'Undergraduate',
          facts: [
            { icon: 'Users', label: 'Seats', value: '150' },
            {
              icon: 'BookOpen',
              label: 'Eligibility',
              value: '10+2 with PCB, NEET-UG qualified',
            },
            { icon: 'IndianRupee', label: 'Fee', value: 'As officially notified' },
          ],
          icon: 'GraduationCap',
          linkType: 'custom',
          title: 'MBBS',
          url: '/programmes/mbbs',
        },
        {
          ctaLabel: 'Apply now',
          description: 'Postgraduate specialisations across clinical disciplines.',
          duration: '3 Years',
          eyebrow: 'Postgraduate',
          facts: [
            { icon: 'Users', label: 'Seats', value: 'As approved' },
            {
              icon: 'BookOpen',
              label: 'Eligibility',
              value: 'MBBS and NEET-PG qualified',
            },
            { icon: 'IndianRupee', label: 'Fee', value: 'As officially notified' },
          ],
          icon: 'GraduationCap',
          linkType: 'custom',
          title: 'MD / MS',
          url: '/programmes/postgraduate',
        },
      ]}
      showFilter
      size="compact"
      title="Medical education from undergraduate study to specialist training"
      viewMode="detailedCards"
    />
  ),
  leadershipProfiles: (
    <LeadershipProfilesBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      cardBackground="default"
      cardLayout="imageOverlay"
      columns="3"
      description="Meet the academic and clinical leaders guiding the institution's education and patient-care mission."
      eyebrow="Leadership"
      overlayCoverage="full"
      overlayDirection="bottomToTop"
      overlayStyle="dark"
      profiles={[
        {
          designation: 'Principal & Professor of Medicine',
          expertise: [{ item: 'Academic administration' }, { item: 'Clinical education' }],
          image: {
            alt: 'Portrait of the Principal',
            url: portrait,
            width: 900,
            height: 1200,
          },
          leadershipLabel: 'Principal',
          name: 'Dr. Ananya Sharma',
          qualification: 'MD (Medicine)',
        },
        {
          designation: 'Medical Superintendent',
          expertise: [{ item: 'Hospital operations' }, { item: 'Surgical education' }],
          image: {
            alt: 'Portrait of the Medical Superintendent',
            url: portrait,
            width: 900,
            height: 1200,
          },
          leadershipLabel: 'Medical Superintendent',
          name: 'Dr. Arvind Mehta',
          qualification: 'MS (General Surgery)',
        },
        {
          designation: 'Dean, Academic Affairs',
          expertise: [{ item: 'Curriculum planning' }, { item: 'Medical education' }],
          image: {
            alt: 'Portrait of the Dean of Academics',
            url: portrait,
            width: 900,
            height: 1200,
          },
          leadershipLabel: 'Dean, Academics',
          name: 'Dr. Kavita Rao',
          qualification: 'MD (Physiology)',
        },
      ]}
      size="compact"
      themeMode="dark"
      title="Academic leadership"
    />
  ),
  departmentProfiles: (
    <DepartmentProfilesBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      cardFrame="framed"
      cardLayout="overlay"
      cardSize="sm"
      columns="4"
      departments={[
        {
          id: 'general-medicine',
          name: 'General Medicine',
          profiles: [
            {
              designation: 'Dean, Professor of Medicine',
              image: { alt: 'Dr. Rakesh Kumar Jha', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Rakesh Kumar Jha',
            },
          ],
        },
        {
          id: 'anatomy',
          name: 'Anatomy',
          profiles: [
            {
              designation: 'HOD, Anatomy',
              image: { alt: 'Dr. Anjali Verma', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Anjali Verma',
            },
          ],
        },
        {
          id: 'general-surgery',
          name: 'General Surgery',
          profiles: [
            {
              designation: 'Professor & HOD',
              image: { alt: 'Dr. Suresh Prasad', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Suresh Prasad',
            },
          ],
        },
        {
          id: 'obg',
          name: 'Obstetrics & Gynaecology',
          profiles: [{ designation: 'HOD, OBG', name: 'Dr. Meera Iyer' }],
        },
        {
          id: 'radiology',
          name: 'Radiology',
          profiles: [
            {
              designation: 'Associate Professor',
              image: { alt: 'Dr. Arvind Mehta', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Arvind Mehta',
            },
          ],
        },
        {
          id: 'paediatrics',
          name: 'Paediatrics',
          profiles: [
            {
              designation: 'Professor',
              image: { alt: 'Dr. Kavita Rao', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Kavita Rao',
            },
          ],
        },
        {
          id: 'orthopaedics',
          name: 'Orthopaedics',
          profiles: [
            {
              designation: 'Associate Professor',
              image: { alt: 'Dr. Nikhil Singh', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Nikhil Singh',
            },
          ],
        },
        {
          id: 'pathology',
          name: 'Pathology',
          profiles: [
            {
              designation: 'Professor & HOD',
              image: { alt: 'Dr. Priya Nair', height: 1200, url: portrait, width: 900 },
              name: 'Dr. Priya Nair',
            },
          ],
        },
      ]}
      eyebrow="Faculty Directory"
      profilesPerLoad="20"
      showDepartmentTabs
      showSearch
      size="compact"
      smallColumns="8"
      tabVariant="pill"
      title="Department-wise faculty profiles"
    />
  ),
  newsGrid: (
    <NewsGridBlockPresentation
      accentTitle="announcements."
      actions={[{ label: 'View all news', linkType: 'custom', url: '/news-events' }]}
      cardsPerRow="3"
      eyebrow="Latest from Northstar"
      featureCard={{
        actionLabel: 'Explore campus',
        enabled: true,
        eyebrow: 'Campus',
        image: { alt: 'Campus at dusk', url: editorialLandscape },
        linkType: 'custom',
        title: 'Discover life and learning on campus',
        url: '/campus',
      }}
      items={[
        {
          behavior: 'story',
          category: { id: 1, slug: 'academics', title: 'Academics' },
          classification: thumbnailNewsClassification,
          contentType: 'news',
          dateISO: '2026-08-12',
          dateLabel: '12 Aug 2026',
          excerpt: '',
          href: '/news-events/pg-courses',
          id: 'news-1',
          isPastEvent: false,
          slug: 'pg-courses',
          title: 'PG Courses move forward with State Government NOC milestone',
        },
        {
          behavior: 'event',
          category: { id: 2, slug: 'admissions', title: 'Admissions' },
          classification: thumbnailEventClassification,
          contentType: 'event',
          dateISO: '2026-08-20',
          dateLabel: 'Admission update',
          excerpt: '',
          href: '/news-events/mbbs-approval',
          id: 'event-1',
          isPastEvent: false,
          slug: 'mbbs-approval',
          title: 'Fifth MBBS batch receives admission approval',
        },
      ]}
      size="default"
      title="News &"
      totalCards={3}
    />
  ),
  newsEventsTabs: (
    <NewsEventsTabsBlockPresentation
      accentTitle="events."
      actions={[{ label: 'View archive', linkType: 'custom', url: '/news-events' }]}
      cardsPerRow="3"
      classifications={[
        thumbnailNoticeClassification,
        thumbnailEventClassification,
        thumbnailAchievementClassification,
      ]}
      description="Browse notices, events, achievements and institutional announcements."
      eyebrow="Campus updates"
      groups={thumbnailNewsEventsTabsGroups}
      itemsPerTab="6"
      layoutStyle="editorialList"
      size="compact"
      title="News &"
    />
  ),
  calendar: (
    <CalendarBlockPresentation
      calendarPdf={
        {
          filename: 'academic-calendar-2026-27.pdf',
          id: 'calendar-pdf',
          mimeType: 'application/pdf',
          url: '/academic-calendar-2026-27.pdf',
        } as Media
      }
      calendarPdfLabel="Download"
      calendarPdfTitle="Academic calendar PDF"
      initial={calendarInitialSnapshot}
      size="compact"
      title="Academic calendar"
    />
  ),
  annualCalendar: (
    <AnnualCalendarBlockPresentation
      calendarPdf={
        {
          filename: 'academic-calendar-2026-27.pdf',
          id: 'annual-calendar-pdf',
          mimeType: 'application/pdf',
          url: '/academic-calendar-2026-27.pdf',
        } as Media
      }
      calendarPdfLabel="Download"
      calendarPdfTitle="Academic calendar PDF"
      initial={annualCalendarInitialSnapshot}
      size="compact"
      title="Academic calendar"
    />
  ),
  bannerCta: (
    <BannerCtaBlockComponent
      accentTitle="starts here."
      actions={[
        {
          label: 'Explore admissions',
          linkType: 'custom',
          mode: 'button',
          url: '/admissions',
          variant: 'default',
        },
        {
          label: 'Download brochure',
          linkType: 'custom',
          mode: 'button',
          showArrow: true,
          url: '/brochure',
          variant: 'outline',
        },
      ]}
      backgroundImage={{ alt: 'Abstract architectural landscape', url: editorialLandscape }}
      description="Discover an academic environment built around knowledge, clinical experience and compassionate care."
      eyebrow="Admissions"
      height="compact"
      title="Your journey in medicine"
    />
  ),
  announcement: (
    <AnnouncementBlockComponent
      appearance={{ background: 'subtle', border: 'bottom' }}
      displayMode="vertical"
      items={[
        {
          description: 'Explore the latest programs and resources.',
          title: 'New',
        },
      ]}
      label="Latest"
    />
  ),
  qaAccordion: (
    <QaAccordionBlockComponent
      defaultOpenFirst
      description="Clear answers to common questions about programs, visits, and support."
      title="Frequently asked questions"
      items={qaAccordionFixtureItems}
      layoutMode="fiftyFifty"
      sideColumn={{
        contact: {
          actions: [
            {
              label: 'Contact our team',
              linkType: 'custom',
              url: '/contact',
            },
          ],
          description: 'Our team can help you find the right next step.',
          title: 'Still have questions?',
        },
        profile: {
          image: { alt: 'Program advisor', url: portrait },
          name: 'Alex Morgan',
          title: 'Program advisor',
        },
      }}
      size="compact"
    />
  ),
  featureMatrix: (
    <FeatureMatrixBlockComponent
      actions={[
        {
          label: 'Explore our facilities',
          linkType: 'custom',
          url: '/facilities',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      description="Four connected environments support focused study, practical work, collaboration, and community."
      eyebrow="Facilities"
      features={[
        {
          cardBackground: 'muted',
          description: 'Flexible spaces for independent and collaborative learning.',
          image: { alt: 'Modern learning environment', url: editorialLandscape },
          title: 'Learning spaces',
        },
        {
          cardBackground: 'primary',
          description: 'Hands-on settings designed for practical exploration.',
          image: { alt: 'Collaborative practical environment', url: collaboration },
          title: 'Practical labs',
        },
        {
          description: 'Helpful people and resources at every stage.',
          image: { alt: 'Student support advisor', url: portrait },
          title: 'Student support',
        },
        {
          description: 'Shared programs that connect ideas with the wider community.',
          image: { alt: 'Community learning environment', url: editorialLandscape },
          title: 'Community programs',
        },
      ]}
      size="compact"
      title="Designed around the way you learn"
    />
  ),
  contentHighlights: (
    <ContentHighlightsBlockComponent
      actions={[
        {
          label: 'Explore student life',
          linkType: 'custom',
          url: '/student-life',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Resources, communities, and opportunities designed to support every part of the student experience."
      eyebrow="Life here"
      headerLayout="stacked"
      items={[
        {
          cardAction: [
            {
              label: 'Explore housing',
              linkType: 'custom',
              mode: 'link',
              url: '/student-life/housing',
            },
          ],
          description: 'On-campus and supported off-campus options for every stage.',
          markerMode: 'numbered',
          title: 'Housing',
        },
        {
          cardBackground: 'primary',
          description: 'Dedicated people and resources for physical and mental wellbeing.',
          markerLabel: 'Care',
          markerMode: 'custom',
          title: 'Wellness',
        },
        {
          cardAction: [
            {
              label: 'Discover organizations',
              linkType: 'custom',
              mode: 'button',
              showArrow: true,
              url: '/student-life/organizations',
              variant: 'default',
            },
          ],
          description: 'Student-led groups spanning academic, creative, and community interests.',
          markerMode: 'hidden',
          title: 'Organizations',
        },
      ]}
      layout="highlightsGrid"
      size="compact"
      title="What students say matters"
    />
  ),
  editorialReasons: (
    <EditorialReasonsBlockComponent
      accentTitle="Driven by purpose."
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="A learning environment shaped around academic development, clinical experience, and service."
      eyebrow="Why choose us"
      listColumns="1"
      numberLayout="columns"
      reasons={[
        {
          description: 'Learning connected directly with real-world patient care.',
          title: 'Clinical exposure',
        },
        {
          description: 'Guidance from experienced educators and practicing clinicians.',
          title: 'Experienced faculty',
        },
        {
          description: 'Contemporary spaces designed for practical education.',
          title: 'Modern infrastructure',
        },
        {
          description: 'Education connected to meaningful service in the wider community.',
          title: 'Community impact',
        },
      ]}
      size="compact"
      title="Built for learning."
    />
  ),
  cta39: (
    <Cta39BlockComponent
      actions={[
        {
          mode: 'button',
          label: 'Get started',
          linkType: 'custom',
          url: '/get-started',
          variant: 'white',
        },
        {
          mode: 'button',
          label: 'Talk to our team',
          linkType: 'custom',
          url: '/contact',
          variant: 'whiteOutline',
        },
      ]}
      appearance={{ background: 'brand', border: 'topAndBottom' }}
      actionLayout="inline"
      description="Learn quickly, build confidently, and deliver with quality using a modern production workflow."
      eyebrow="Ready when you are"
      headerLayout="actionSplit"
      size="compact"
      title="Turn goals into action with focused execution."
    />
  ),
  newsEventsHighlights: (
    <NewsEventsHighlightsBlockPresentation
      actions={[{ label: 'View all stories', linkType: 'custom', url: '/news-events' }]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      autoplay={false}
      carouselControlsPosition="bottom"
      description="Discover the latest stories, milestones, and opportunities from across our community."
      eyebrow="Latest"
      items={[
        {
          action: { href: '/news-events/research-center', label: 'Read more' },
          classification: thumbnailNewsClassification,
          dateISO: '2026-07-18T00:00:00.000Z',
          dateLabel: 'Jul 18, 2026',
          description:
            'A new center brings collaborative research and practical learning together.',
          id: 'news-1',
          image: { alt: 'Campus landscape', position: 'center', src: editorialLandscape },
          title: 'New research center opens this summer',
        },
        {
          action: { href: '/news-events/open-day', label: 'Read more' },
          classification: thumbnailEventClassification,
          dateISO: '2026-08-12T00:00:00.000Z',
          dateLabel: 'Aug 12, 2026',
          description: 'Meet faculty, explore learning spaces, and discover the programs on offer.',
          id: 'event-1',
          image: { alt: 'Community gathering', position: 'center', src: collaboration },
          title: 'Community open day returns in August',
        },
        {
          action: { href: '/news-events/community-impact', label: 'Read more' },
          classification: thumbnailNewsClassification,
          dateISO: '2026-07-10T00:00:00.000Z',
          dateLabel: 'Jul 10, 2026',
          description:
            'Student-led projects are creating meaningful connections across the region.',
          id: 'news-2',
          image: { alt: 'Student portrait', position: 'top', src: portrait },
          title: 'Student initiatives make a community impact',
        },
        {
          action: { href: '/news-events/campus-holiday', label: 'Read more' },
          classification: thumbnailHolidayClassification,
          dateISO: '2026-08-28T00:00:00.000Z',
          dateLabel: 'Aug 28, 2026',
          description: 'Campus services and teaching schedules for the upcoming holiday.',
          id: 'holiday-1',
          image: { alt: 'Campus landscape', position: 'center', src: editorialLandscape },
          title: 'Campus holiday schedule announced',
        },
      ]}
      size="compact"
      title="News & Events"
    />
  ),
  profileCarousel: (
    <ProfileCarouselBlockComponent
      actions={[
        {
          label: 'Meet the full team',
          linkType: 'custom',
          url: '/team',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      cardVariant="overlay"
      contentAlignment="left"
      description="A multidisciplinary team brings practical experience, thoughtful guidance, and shared purpose to every program."
      eyebrow="Our people"
      overlayAlignment="left"
      profiles={[
        {
          image: { alt: 'Program director', url: portrait },
          name: 'Alex Morgan',
          role: 'Program Director',
        },
        {
          cardBackground: 'muted',
          image: { alt: 'Student experience lead', url: collaboration },
          name: 'Jordan Lee',
          role: 'Student Experience Lead',
        },
        {
          cardBackground: 'primary',
          image: { alt: 'Faculty advisor', url: editorialLandscape },
          name: 'Sam Rivera',
          role: 'Faculty Advisor',
        },
        {
          image: { alt: 'Research coordinator', url: portrait },
          imagePosition: 'top',
          name: 'Taylor Chen',
          role: 'Research Coordinator',
        },
        {
          image: { alt: 'Community partner', url: collaboration },
          imagePosition: 'right',
          name: 'Jamie Patel',
          role: 'Community Partner',
        },
      ]}
      size="compact"
      title="The people behind our work"
    />
  ),
  galleryShowcase: (
    <GalleryShowcaseBlockComponent
      actions={[
        {
          label: 'Explore the gallery',
          linkType: 'custom',
          url: '/gallery',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      description="Five perspectives capture the spaces, people, and shared moments that shape the experience."
      eyebrow="Inside our community"
      images={[
        {
          image: {
            alt: 'Editorial landscape',
            height: 900,
            id: 1,
            url: editorialLandscape,
            width: 1600,
          },
        },
        {
          image: {
            alt: 'Collaborative environment',
            height: 900,
            id: 2,
            url: collaboration,
            width: 1600,
          },
          imagePosition: 'top',
        },
        {
          image: { alt: 'Community portrait', height: 1200, id: 3, url: portrait, width: 900 },
          imagePosition: 'center',
        },
        {
          image: {
            alt: 'Learning environment',
            height: 900,
            id: 4,
            url: editorialLandscape,
            width: 1600,
          },
          imagePosition: 'right',
        },
        {
          image: {
            alt: 'Shared campus moment',
            height: 900,
            id: 5,
            url: collaboration,
            width: 1600,
          },
          imagePosition: 'bottom',
        },
      ]}
      size="compact"
      title="A closer look at life here"
    />
  ),
  galleryCoverflow: (
    <GalleryCoverflowBlockComponent
      actions={[
        {
          label: 'Explore the gallery',
          linkType: 'custom',
          url: '/gallery',
          variant: 'default',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      description="A collection of spaces, people, and moments from across the community."
      eyebrow="Photo library"
      images={[
        {
          image: {
            alt: 'Editorial landscape one',
            height: 900,
            id: 'coverflow-1',
            url: editorialLandscape,
            width: 1600,
          },
        },
        {
          image: {
            alt: 'Collaborative environment one',
            height: 900,
            id: 'coverflow-2',
            url: collaboration,
            width: 1600,
          },
        },
        {
          image: {
            alt: 'Community portrait',
            height: 1200,
            id: 'coverflow-3',
            url: portrait,
            width: 900,
          },
        },
        {
          image: {
            alt: 'Editorial landscape two',
            height: 900,
            id: 'coverflow-4',
            url: editorialLandscape,
            width: 1600,
          },
        },
        {
          image: {
            alt: 'Collaborative environment two',
            height: 900,
            id: 'coverflow-5',
            url: collaboration,
            width: 1600,
          },
        },
      ]}
      size="compact"
      title="Your photos, brought together."
    />
  ),
  eventGallery: (
    <EventGallery
      albums={[
        {
          cover: {
            alt: 'Community gathering',
            height: 900,
            id: 'event-cover-1',
            src: collaboration,
            width: 1600,
          },
          createdAt: '2026-07-25T00:00:00.000Z',
          description: 'A day of workshops, performances, and shared experiences.',
          eventDate: '2026-07-25T00:00:00.000Z',
          id: 'event-album-1',
          imageCount: 3,
          images: [
            {
              alt: 'Community gathering',
              height: 900,
              id: 'event-cover-1',
              src: collaboration,
              width: 1600,
            },
            {
              alt: 'Learning environment',
              height: 900,
              id: 'event-image-2',
              src: editorialLandscape,
              width: 1600,
            },
            {
              alt: 'Community portrait',
              height: 900,
              id: 'event-image-3',
              src: portrait,
              width: 1600,
            },
          ],
          title: 'Community Day',
        },
        {
          cover: {
            alt: 'Editorial landscape',
            height: 900,
            id: 'event-cover-2',
            src: editorialLandscape,
            width: 1600,
          },
          createdAt: '2026-06-21T00:00:00.000Z',
          eventDate: '2026-06-21T00:00:00.000Z',
          id: 'event-album-2',
          imageCount: 2,
          images: [
            {
              alt: 'Editorial landscape',
              height: 900,
              id: 'event-cover-2',
              src: editorialLandscape,
              width: 1600,
            },
            {
              alt: 'Community gathering',
              height: 900,
              id: 'event-image-4',
              src: collaboration,
              width: 1600,
            },
          ],
          title: 'Yoga Day',
        },
        {
          cover: {
            alt: 'Community portrait',
            height: 1200,
            id: 'event-cover-3',
            src: portrait,
            width: 900,
          },
          createdAt: '2026-05-12T00:00:00.000Z',
          eventDate: '2026-05-12T00:00:00.000Z',
          id: 'event-album-3',
          imageCount: 2,
          images: [
            {
              alt: 'Community portrait',
              height: 1200,
              id: 'event-cover-3',
              src: portrait,
              width: 900,
            },
            {
              alt: 'Collaborative environment',
              height: 900,
              id: 'event-image-5',
              src: collaboration,
              width: 1600,
            },
          ],
          title: 'Student Orientation',
        },
      ]}
      alignment="left"
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      cardTextLayout="split"
      description="Browse recent celebrations, programs, and community events."
      eyebrow="Moments"
      overlayCoverage="full"
      overlayDirection="bottomToTop"
      overlayStyle="darker"
      showCardOverlay
      showEventDate
      showImageCount
      size="compact"
      themeMode="dark"
      title="Event gallery"
    />
  ),
  galleryAlbumTabs: (
    <GalleryAlbumTabsBlockPresentation
      albums={[
        {
          cover: {
            alt: 'Learning environment',
            height: 900,
            id: 'tabs-campus-1',
            mediaID: 'tabs-campus-media-1',
            src: editorialLandscape,
            width: 1600,
          },
          createdAt: '2026-07-25T00:00:00.000Z',
          id: 'tabs-campus',
          imageCount: 3,
          images: [
            {
              alt: 'Learning environment',
              height: 900,
              id: 'tabs-campus-1',
              mediaID: 'tabs-campus-media-1',
              src: editorialLandscape,
              width: 1600,
            },
            {
              alt: 'Collaborative learning',
              height: 900,
              id: 'tabs-campus-2',
              mediaID: 'tabs-campus-media-2',
              src: collaboration,
              width: 1600,
            },
            {
              alt: 'Community portrait',
              height: 1200,
              id: 'tabs-campus-3',
              mediaID: 'tabs-campus-media-3',
              src: portrait,
              width: 900,
            },
          ],
          title: 'Campus Life',
        },
        {
          cover: {
            alt: 'Community gathering',
            height: 900,
            id: 'tabs-events-1',
            mediaID: 'tabs-events-media-1',
            src: collaboration,
            width: 1600,
          },
          createdAt: '2026-07-20T00:00:00.000Z',
          id: 'tabs-events',
          imageCount: 3,
          images: [
            {
              alt: 'Community gathering',
              height: 900,
              id: 'tabs-events-1',
              mediaID: 'tabs-events-media-1',
              src: collaboration,
              width: 1600,
            },
            {
              alt: 'Campus landscape',
              height: 900,
              id: 'tabs-events-2',
              mediaID: 'tabs-events-media-2',
              src: editorialLandscape,
              width: 1600,
            },
            {
              alt: 'Student community',
              height: 1200,
              id: 'tabs-events-3',
              mediaID: 'tabs-events-media-3',
              src: portrait,
              width: 900,
            },
          ],
          title: 'Events',
        },
      ]}
      description="Choose an album to explore photographs from campus life and community events."
      eyebrow="Photo stories"
      imagesPerLoad="6"
      size="compact"
      tabVariant="underline"
      title="Explore our gallery"
    />
  ),
  imageMosaic: (
    <ImageMosaicBlockComponent
      actions={[
        {
          label: 'Explore all spaces',
          linkType: 'custom',
          url: '/spaces',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      contentSource="manualImages"
      description="Explore the spaces, people, and moments that shape our community."
      eyebrow="Inside our community"
      items={[
        {
          action: [
            {
              label: 'Explore',
              linkType: 'custom',
              mode: 'link',
              url: '/spaces',
              variant: 'default',
            },
          ],
          image: {
            alt: 'Learning environment',
            height: 900,
            id: 1,
            url: editorialLandscape,
            width: 1600,
          },
          title: 'Learning spaces',
        },
        {
          action: [
            {
              label: 'Discover',
              linkType: 'custom',
              mode: 'button',
              url: '/community',
              variant: 'outline',
            },
          ],
          image: {
            alt: 'Collaborative environment',
            height: 900,
            id: 2,
            url: collaboration,
            width: 1600,
          },
          imagePosition: 'top',
          title: 'Collaboration',
        },
        {
          image: { alt: 'Community portrait', height: 1200, id: 3, url: portrait, width: 900 },
          imagePosition: 'center',
          title: 'Our community',
        },
        {
          action: [
            {
              label: 'Take a look',
              linkType: 'custom',
              mode: 'link',
              url: '/campus',
              variant: 'default',
            },
          ],
          image: {
            alt: 'Campus landscape',
            height: 900,
            id: 4,
            url: editorialLandscape,
            width: 1600,
          },
          imagePosition: 'right',
          title: 'Campus life',
        },
        {
          action: [
            {
              label: 'Learn more',
              linkType: 'custom',
              mode: 'link',
              url: '/experience',
              variant: 'default',
            },
          ],
          image: {
            alt: 'Shared learning moment',
            height: 900,
            id: 5,
            url: collaboration,
            width: 1600,
          },
          imagePosition: 'bottom',
          title: 'Shared experiences',
        },
      ]}
      size="compact"
      title="A closer look at life here"
    />
  ),
  studentExperience: (
    <StudentExperienceBlockComponent
      accentTitle="medical college."
      appearance={{ background: 'none', border: 'none' }}
      cardHeight="compact"
      description="Medical education extends beyond lectures. Students learn, collaborate, practise, compete, and grow within a connected campus environment."
      eyebrow="The student experience"
      experiences={[
        {
          image: fakeMedia(portrait, 'Campus life', 900, 1200),
          imagePosition: 'center',
          title: 'Campus Life',
        },
        {
          image: fakeMedia(editorialLandscape, 'Library and learning'),
          title: 'Library & Learning',
        },
        {
          image: fakeMedia(collaboration, 'Clinical training'),
          title: 'Clinical Training',
        },
        {
          image: fakeMedia(officeMap, 'Student activities'),
          title: 'Student Activities',
        },
      ]}
      headerLayout="split"
      showNumbers
      size="compact"
      title="More than a"
    />
  ),
  footerMinimal: (
    <FooterMinimalBlockComponent
      appearance={{ background: 'brand', border: 'none' }}
      copyrightText="© 2026 Northstar. All rights reserved."
      description={'100 Market Street,\nSpringfield, 01234\nBypass NH 107'}
      linkGroups={footerGroupsFixture}
      logoMode="siteDefault"
      siteLogo={{ alt: 'Northstar', url: brandMark }}
      siteName="Northstar Medical Institute"
      siteSocialLinks={{
        facebook: 'https://facebook.com/northstar',
        instagram: 'https://instagram.com/northstar',
        x: 'https://x.com/northstar',
        youtube: 'https://youtube.com/@northstar',
      }}
      size="default"
    />
  ),
  footer56: (
    <Footer56BlockComponent
      appearance={{ background: 'subtle', border: 'top' }}
      blockType="footer56"
      copyrightText="© 2026 Northstar"
      description="Thoughtful programs, practical resources, and a community built around progress."
      linkGroups={footerGroupsFixture}
      logoMode="siteDefault"
      siteAddress="100 Market Street"
      siteEmail="hello@example.com"
      siteLogo={{ alt: 'Northstar', url: brandMark }}
      siteName="Northstar"
      sitePhone="+1 555 0100"
      size="default"
    />
  ),
  headerNavbar12: (
    <HeaderNavbar12BlockComponent
      appearance={{ background: 'none', border: 'bottom' }}
      blockType="headerNavbar12"
      ctaButtons={[
        {
          label: 'Get started',
          linkType: 'custom',
          url: '/start',
          variant: 'default',
        },
      ]}
      logoMode="siteDefault"
      menuItems={headerMenuFixture}
      siteLogo={{ alt: 'Northstar', url: brandMark }}
      siteName="Northstar"
      size="compact"
    />
  ),
  heroBanner: (
    <HeroBannerBlockComponent
      backgroundImage={{ alt: 'Abstract architectural landscape', url: editorialLandscape }}
      buttons={[
        {
          label: 'Explore programs',
          linkType: 'custom',
          url: '/programs',
          variant: 'default',
        },
        {
          label: 'Plan a visit',
          linkType: 'custom',
          url: '/visit',
          variant: 'outline',
        },
      ]}
      description="Practical learning, thoughtful teaching, and spaces designed for discovery."
      eyebrow="Learning without limits"
      height="compact"
      horizontalAlignment="left"
      overlayStyle="light"
      themeMode="auto"
      title="A place to learn, connect, and grow."
    />
  ),
  heroCarousel: (
    <HeroCarouselBlockComponent
      autoplay={false}
      height="compact"
      overlayStyle="dark"
      showArrows
      showDots
      slides={[
        {
          backgroundImage: {
            alt: 'Editorial landscape',
            id: 'hero-1',
            url: editorialLandscape,
          },
          buttons: [
            {
              label: 'Explore',
              linkType: 'custom',
              url: '/explore',
              variant: 'secondary',
            },
          ],
          description: 'Ideas, people, and places moving forward together.',
          eyebrow: 'Discover more',
          title: 'A wider view of what is possible.',
        },
        {
          backgroundImage: {
            alt: 'Collaborative environment',
            id: 'hero-2',
            url: collaboration,
          },
          title: 'Built around shared progress.',
        },
      ]}
    />
  ),
  reviewSubmission: (
    <ReviewSubmissionBlockComponent
      description="Share what stood out and help others understand the experience."
      eyebrow="Your perspective matters"
      form={reviewFormFixture}
      size="compact"
      title="Tell us about your experience."
    />
  ),
  contact33: (
    <Contact33BlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Tell us what you need and our team will help you find the right next step."
      eyebrow="Contact"
      form={contactFormFixture}
      image={{ alt: 'Modern learning environment', url: editorialLandscape }}
      imageAlt="A welcoming modern learning environment"
      imagePosition="right"
      size="compact"
      title="Start a conversation."
    />
  ),
  dynamicForm: (
    <DynamicFormBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Send your CV and a short note. Shortlisted candidates hear from the department within two weeks of the closing date."
      eyebrow="Careers"
      image={{ alt: 'Clinician working at a laptop', url: editorialLandscape }}
      imageAlt="Clinician working at a laptop"
      form={{
        fields: [
          { label: 'Full name', name: 'fullName', required: true, type: 'text' },
          { label: 'Email', name: 'email', required: true, type: 'email' },
          { label: 'Phone', name: 'phone', required: true, type: 'phone' },
          {
            label: 'Post applied for',
            name: 'post',
            options: [
              { label: 'Professor – General Medicine', value: 'prof-gm' },
              { label: 'Senior Resident – Paediatrics', value: 'sr-paed' },
            ],
            required: true,
            type: 'select',
          },
          {
            fileTypes: ['pdf', 'document'],
            label: 'CV / résumé',
            maxFileSizeMB: 5,
            name: 'cv',
            required: true,
            type: 'file',
          },
          { label: 'Cover note', name: 'coverNote', required: false, type: 'textarea' },
        ],
        slug: 'application',
        submitButtonLabel: 'Submit application',
        successMessage: 'Thanks. Your application has been received.',
        title: 'Application',
      }}
      layout="image"
      size="compact"
      title="Apply for a post"
    />
  ),
  contact24: (
    <Contact24
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Regional teams provide local support wherever your work takes you."
      eyebrow="Global presence"
      offices={contact24OfficeFixtures}
      size="compact"
      title="Our offices"
    />
  ),
  reviewFeed: (
    <ReviewFeed
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Published experiences shared by students, families, alumni, and visitors."
      emptyStateMessage="No published reviews yet."
      eyebrow="Community voices"
      initialPage={{
        docs: [
          {
            authorName: 'Alex M.',
            content: 'The support was thoughtful, clear, and genuinely welcoming throughout.',
            date: 'Jul 18, 2026',
            id: 'review-feed-1',
            rating: 5,
            title: 'Outstanding support',
            verified: true,
          },
          {
            authorName: 'Jordan K.',
            content: 'Every step felt organized, and the team always made time for questions.',
            date: 'Jul 15, 2026',
            id: 'review-feed-2',
            rating: 5,
            title: 'A welcoming experience',
            verified: true,
          },
          {
            authorName: 'Priya S.',
            content: 'A positive experience with helpful people and excellent communication.',
            date: 'Jul 10, 2026',
            id: 'review-feed-3',
            rating: 4,
            title: 'Helpful and responsive',
            verified: false,
          },
        ],
        hasNextPage: true,
        page: 1,
        totalPages: 2,
      }}
      loadMoreLabel="Load More Reviews"
      pageSize={3}
      size="compact"
      summary={{ average: 4.7, count: 124, counts: [2, 3, 8, 19, 92] }}
      title="What our community is saying"
    />
  ),
  services21: (
    <Services21BlockComponent
      actions={[
        {
          label: 'View all services',
          linkType: 'custom',
          openInNewTab: false,
          url: '#',
          variant: 'default',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Service-first design support for products, teams, and platforms from discovery to launch."
      eyebrow="Capabilities"
      services={[
        {
          description: 'From initial planning to execution, we shape products around user needs.',
          image: {
            alt: 'Design workshop',
            url: editorialLandscape,
            width: 1200,
            height: 800,
          },
          code: '{01}',
          title: 'Discovery',
        },
        {
          description:
            'Refine goals, priorities, and architecture before any implementation begins.',
          image: { alt: 'Roadmap planning', url: collaboration, width: 1200, height: 800 },
          code: '{02}',
          title: 'Strategy',
        },
        {
          description: 'Create polished visuals and interactions with clear execution standards.',
          image: { alt: 'UI implementation', url: portrait, width: 1200, height: 800 },
          code: '{03}',
          title: 'Design & UX',
        },
      ]}
      title="Services built to move ideas into impact"
    />
  ),
  ratingSpotlight: (
    <RatingSpotlightBlockComponent
      actions={[
        {
          mode: 'button',
          label: 'Leave a review',
          linkType: 'custom',
          url: '/reviews/new',
          variant: 'default',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Students, alumni, parents, and campus visitors — your rating and review help us keep sharpening what works."
      eyebrow="Feedback"
      ratingData={{ dataMode: 'manual', manualRating: 4.8, manualReviewCount: 1240 }}
      size="compact"
      title="Tell us how we're doing."
    />
  ),
  teamShowcase: (
    <TeamShowcase
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="left"
      description="Our team combines practical experience, community focus, and active mentorship."
      heading="Meet the team"
      members={[
        {
          cardBackground: 'muted',
          description: 'Leads program design, curriculum planning, and student-facing support.',
          image: editorialLandscape,
          name: 'Jordan Lee',
          role: 'Academic Director',
        },
        {
          cardBackground: 'primary',
          description: 'Builds partnerships, coordinates initiatives, and keeps teams aligned.',
          image: collaboration,
          name: 'Sam Rivera',
          role: 'Community Lead',
        },
        {
          description: 'Supports operations, accessibility, and day-to-day learning experiences.',
          image: portrait,
          name: 'Avery Chen',
          role: 'Student Success Lead',
        },
      ]}
      size="compact"
    />
  ),
  featureSpotlight: (
    <FeatureSpotlightBlockComponent
      actions={[
        {
          label: 'Explore the experience',
          linkType: 'custom',
          url: '/experience',
        },
      ]}
      description="Flexible spaces and collaborative programs help ideas move from discussion to practice."
      eyebrow="Built for collaboration"
      image={{ alt: 'Abstract collaboration scene', url: collaboration }}
      layoutMode="split"
      mediaFillMode="containedFill"
      mediaPosition="left"
      size="compact"
      title="Designed around the way people learn."
    />
  ),
  testimonialSpotlight: (
    <TestimonialSpotlightBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      containerBackground="muted"
      containerOutline="outline"
      description="A long-term commitment to education, healthcare, and service guides every institutional decision."
      designation="Founder"
      eyebrow="Message from management"
      image={{ alt: 'Institutional leader portrait', url: portrait }}
      mediaFillMode="containedFill"
      mediaPosition="left"
      personName="Shri Ravindra Kumar Singh"
      sectionContentAlignment="center"
      sectionDescription="Perspectives from the people guiding our institution."
      sectionEyebrow="Leadership"
      sectionTitle="Messages from our leadership"
      size="compact"
      testimonial="Our aim is to build an institution where education, healthcare, and service strengthen one another."
      title="Leadership with a long-term purpose."
    />
  ),
  statsStrip: (
    <StatsStripBlockComponent
      animationEnabled={false}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      items={[
        { label: 'Programs', suffix: '+', value: 48 },
        { label: 'Positive outcomes', suffix: '%', value: 92 },
        { label: 'Digital access', suffix: '/7', value: 24 },
        { label: 'Community partners', value: 18 },
      ]}
    />
  ),
  system404: (
    <System404BlockComponent
      appearance={{ background: 'subtle', border: 'none' }}
      badge="404"
      blockType="system404"
      description="The page may have moved or the address may be incorrect."
      heading="We couldn't find that page"
    />
  ),
  systemComingSoon: (
    <SystemComingSoonBlockComponent
      appearance={{ background: 'subtle', border: 'none' }}
      badge="Coming soon"
      blockType="systemComingSoon"
      description="We are preparing a new experience."
      heading="Something thoughtful is taking shape"
    />
  ),
  systemMaintenance: (
    <SystemMaintenanceBlockComponent
      appearance={{ background: 'subtle', border: 'none' }}
      badge="Maintenance"
      blockType="systemMaintenance"
      description="Scheduled improvements are underway."
      heading="We'll be back shortly"
    />
  ),
  aboutSection: (
    <AboutSectionBlockComponent
      actions={[{ label: 'Learn more', linkType: 'custom', url: '/about', variant: 'default' }]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      body="We started with the belief that thoughtful education changes outcomes. Over twelve years, that belief has shaped every program, space, and partnership we have built."
      contentAlignment="left"
      eyebrow="Our story"
      image={fakeMedia(editorialLandscape, 'Our campus')}
      imagePosition="right"
      size="compact"
      stats={[
        { value: '12+', label: 'Years' },
        { value: '5 000+', label: 'Graduates' },
        { value: '40+', label: 'Programs' },
      ]}
      title="Built around the way people actually learn."
      values={[
        {
          icon: 'Lightbulb',
          title: 'Purpose',
          description: 'Every decision begins with outcomes.',
        },
        { icon: 'Users', title: 'Community', description: 'Learning works better together.' },
        { icon: 'Star', title: 'Excellence', description: 'High standards in everything we do.' },
      ]}
      variant="split"
    />
  ),
  awardsList: (
    <AwardsListBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      awards={[
        {
          cardBackground: 'muted',
          title: 'Centre of Excellence',
          organization: 'Education Standards Board',
          category: 'accreditation',
          year: '2025',
          description: 'Recognised for outstanding curriculum design and student outcomes.',
        },
        {
          cardBackground: 'primary',
          title: 'Top 10 Learning Environments',
          organization: 'National Education Review',
          category: 'ranking',
          year: '2025',
          description: 'Ranked among the best learning environments in the country.',
        },
        {
          title: 'Community Impact Award',
          organization: 'Regional Foundation',
          category: 'award',
          year: '2024',
          description: 'Awarded for sustained engagement with local communities.',
        },
        {
          title: 'Digital Innovation Recognition',
          organization: 'EdTech Alliance',
          category: 'recognition',
          year: '2024',
          description: 'Recognised for leading digital-first delivery models.',
        },
      ]}
      contentAlignment="center"
      description="A record of independent recognition across curriculum quality, community impact, and innovation."
      eyebrow="Recognition"
      size="compact"
      title="Awards & accreditations"
      variant="cards"
    />
  ),
  bentoGrid: (
    <BentoGridBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      contentAlignment="center"
      description="Four dimensions that shape how we approach every program, partnership, and student experience."
      eyebrow="What we stand for"
      items={[
        {
          title: 'Learning spaces',
          description: 'Flexible environments built for focus and collaboration.',
          image: fakeMedia(editorialLandscape, 'Learning space'),
          size: 'large',
        },
        {
          title: 'Community',
          description: 'Programs that connect learning with real-world impact.',
          icon: 'Users',
          accentColor: 'primary',
          size: 'medium',
        },
        {
          title: 'Support',
          description: 'Dedicated people at every stage of your journey.',
          icon: 'HeartHandshake',
          accentColor: 'secondary',
          size: 'small',
        },
        {
          title: 'Research culture',
          description: 'Evidence-led practice in every programme.',
          icon: 'Microscope',
          accentColor: 'muted',
          size: 'small',
        },
        {
          title: 'Research',
          description: 'Practical inquiry that informs teaching and shapes outcomes.',
          image: fakeMedia(collaboration, 'Research collaboration'),
          size: 'medium',
        },
        {
          title: 'Innovation',
          description: 'Always finding smarter ways to deliver quality education.',
          icon: 'Lightbulb',
          accentColor: 'accent',
          size: 'small',
        },
      ]}
      size="compact"
      title="Four pillars, one purpose."
    />
  ),
  downloadList: (
    <DownloadListBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      columns="2"
      contentAlignment="left"
      description="Access official recognition, permission, and affiliation documents related to medical education."
      displayMode="framedGrid"
      documentIconSize="medium"
      downloads={[
        {
          title: 'NMC Letter of Intent – MBBS',
          fileType: 'PDF',
          file: {
            id: 'nmc-letter-of-intent',
            url: '#nmc-letter-of-intent',
            mimeType: 'application/pdf',
          } as Media,
          description: 'National Medical Commission approval document.',
        },
        {
          title: 'NMC Letter of Permission – MBBS',
          fileType: 'PDF',
          file: {
            id: 'nmc-permission',
            url: '#nmc-permission',
            mimeType: 'application/pdf',
          } as Media,
          description: 'Permission for the current undergraduate intake.',
        },
        {
          title: 'MBBS Batch Permission – 2025',
          fileType: 'PDF',
          file: {
            id: 'batch-permission',
            url: '#batch-permission',
            mimeType: 'application/pdf',
          } as Media,
          description: 'Approved intake and batch permission record.',
        },
        {
          title: 'BUHS Affiliation – UG & PG',
          fileType: 'PDF',
          file: {
            id: 'buhs-affiliation',
            url: '#buhs-affiliation',
            mimeType: 'application/pdf',
          } as Media,
          description: 'University affiliation for undergraduate and postgraduate programmes.',
        },
      ]}
      eyebrow="Official Documents"
      gridActionDisplay="labelled"
      gridIconPosition="inline"
      showDocumentIcon
      size="compact"
      title="Approvals & Affiliation Documents"
    />
  ),
  feeStructure: (
    <FeeStructureBlockComponent
      academicSession="2026-27"
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Official programme fees arranged by category and academic year."
      downloadAppearance={{ background: 'brand', border: 'none' }}
      downloadButtonVariant="whiteOutline"
      eyebrow="Admissions"
      feeCategories={[
        {
          label: 'General',
          caption: 'General category fee structure for MBBS, session 2026-27.',
          completeProgrammeExpenseLabel: 'Complete programme expense',
          completeProgrammeExpense: '₹71.75 lakh',
          completeProgrammeExpenseNote:
            'Official General category package for the 4.5-year programme.',
          columns: [
            { label: '1st Year' },
            { label: '2nd Year' },
            { label: '3rd Year' },
            { label: '4th Year' },
            { label: '5th Year' },
          ],
          rows: [
            {
              label: 'Tuition Fee',
              cells: [
                { value: '12,75,000' },
                { value: '12,75,000' },
                { value: '12,75,000' },
                { value: '12,75,000' },
                { value: '6,37,500' },
              ],
            },
            {
              label: 'Admission Fee',
              note: 'One time',
              cells: [
                { value: '1,00,000' },
                { value: '—' },
                { value: '—' },
                { value: '—' },
                { value: '—' },
              ],
            },
            {
              label: 'Security Money',
              note: 'One time',
              cells: [
                { value: '1,00,000' },
                { value: '—' },
                { value: '—' },
                { value: '—' },
                { value: '—' },
              ],
            },
            {
              label: 'Accommodation and Fooding etc.',
              cells: [
                { value: '2,75,000' },
                { value: '2,75,000' },
                { value: '2,75,000' },
                { value: '2,75,000' },
                { value: '1,37,500' },
              ],
            },
            {
              label: 'Total',
              emphasis: 'total',
              cells: [
                { value: '17,50,000' },
                { value: '15,50,000' },
                { value: '15,50,000' },
                { value: '15,50,000' },
                { value: '7,75,000' },
              ],
            },
          ],
          notes: [
            {
              text: 'Amounts are displayed exactly as published.',
            },
          ],
        },
        {
          label: 'NRI',
          columns: [
            { label: '1st Year' },
            { label: '2nd Year' },
            { label: '3rd Year' },
            { label: '4th Year' },
            { label: '5th Year' },
          ],
          rows: [
            {
              label: 'Tuition Fee',
              cells: [
                { value: 'USD 35,000' },
                { value: 'USD 35,000' },
                { value: 'USD 35,000' },
                { value: 'USD 35,000' },
                { value: 'USD 17,500' },
              ],
            },
          ],
        },
      ]}
      feeDocument={
        {
          id: 'fee-structure-pdf',
          mimeType: 'application/pdf',
          url: '#fee-structure',
        } as Media
      }
      layout="programmeCostAtlas"
      programmeDetails={[{ label: 'Programme Duration', value: '4.5 Years' }]}
      programmeName="MBBS"
      size="compact"
      tabWidth="centered"
      title="Fee Structure"
    />
  ),
  pgFeeStructure: (
    <PGFeeStructureBlockComponent
      academicSession="2026-27"
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Official postgraduate fees arranged by category and clinical department."
      eyebrow="Postgraduate Admissions"
      feeCategories={[
        {
          label: 'General',
          caption: 'Resident Indian postgraduate fee structure for session 2026-27.',
          columns: [
            { label: 'Tuition (Per Annum)', valueMode: 'department' },
            {
              label: 'Hostel (Per Annum)',
              valueMode: 'shared',
              sharedValue: '₹3,15,000',
            },
            {
              label: 'Security (One Time)',
              valueMode: 'shared',
              sharedValue: '₹2,00,000',
            },
          ],
          departments: [
            { name: 'General Medicine', variableValues: [{ value: '₹28,00,000' }] },
            { name: 'General Surgery', variableValues: [{ value: '₹25,00,000' }] },
            { name: 'Orthopedics', variableValues: [{ value: '₹37,00,000' }] },
            { name: 'Ophthalmology', variableValues: [{ value: '₹21,00,000' }] },
          ],
          notes: [{ text: 'Amounts are displayed exactly as officially published.' }],
        },
        {
          label: 'NRI',
          columns: [
            { label: 'Tuition (Per Annum)', valueMode: 'department' },
            {
              label: 'Hostel (Per Annum)',
              valueMode: 'shared',
              sharedValue: '₹3,15,000',
            },
            {
              label: 'Security (One Time)',
              valueMode: 'shared',
              sharedValue: '₹2,00,000',
            },
          ],
          departments: [
            { name: 'General Medicine', variableValues: [{ value: 'USD 64,000' }] },
            { name: 'OBG', variableValues: [{ value: 'USD 82,500' }] },
            { name: 'Radiology', variableValues: [{ value: 'USD 1,07,500' }] },
          ],
        },
      ]}
      programmeName="Postgraduate Medical Courses"
      size="compact"
      tabWidth="centered"
      title="PG Fee Structure"
    />
  ),
  bankDetails: (
    <BankDetailsBlockComponent
      accounts={[
        {
          purpose: 'Preview account',
          accountHolder: 'Example Medical Institute',
          accountNumber: '000000000000',
          ifscCode: 'TEST0000000',
          bankName: 'Example Bank',
          branch: 'Demo Branch',
          instructions: 'Sample payment details for block preview only.',
          upiId: 'demo@invalid',
        },
      ]}
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      displayMode="text"
      officialAccountLabel="Demo account"
      panelDescription="Fictional payment information for preview purposes only."
      panelPosition="right"
      panelTitle="Example transfer details"
      size="compact"
    />
  ),
  celebration: (
    <CelebrationPreview
      view={{
        badgeLabel: 'Celebrating today',
        confetti: { enabled: true, pieces: 160, shots: 5, speed: 'medium' },
        dateLabel: { day: '22', month: 'October', year: '2026' },
        endKey: '2026-10-22',
        eyebrow: 'Today we celebrate',
        frequency: 'oncePerDay',
        heading: 'Happy',
        accentHeading: "Founder's Day",
        id: 'preview',
        imageOnly: false,
        message: 'Join the SNMIH family for the ceremony, cultural programme, and alumni meet.',
        openDelayMs: 0,
        showReopenBadge: true,
        startKey: '2026-10-22',
        style: 'aurora',
        timesPerDay: 1,
      }}
    />
  ),
  contactNumbers: (
    <ContactNumbersBlockComponent
      appearance={{ background: 'brand', border: 'none' }}
      contacts={[
        { id: 'admissions', label: 'Admission Panel', phone: '+91 00000 00001' },
        { id: 'counselling', label: 'Admission Panel', phone: '+91 00000 00002' },
        { id: 'documents', label: 'Admission Panel', phone: '+91 00000 00003' },
      ]}
      description="Our admissions team is available to answer your questions and guide you through the admission process."
      eyebrow="Stuck on applications"
      layout="switchboard"
      showOpenStatus={false}
      size="compact"
      title="Need Help with Admissions?"
    />
  ),
  documentChecklist: (
    <DocumentChecklistBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      description="Upload every applicable certificate while downloading the allotment order, then bring the originals for verification."
      items={[
        { id: 'residential', label: 'Residential Certificate' },
        { id: 'caste', label: 'Caste Certificate' },
        { id: 'leaving', label: 'College Leaving Certificate' },
        { id: 'internship', label: 'Internship Completion Certificate' },
        { id: 'passing', label: 'Degree Passing Certificate' },
        { id: 'registration', label: 'Medical Registration Certificate' },
        { id: 'noc', label: 'No Objection Certificate', qualifier: 'If required' },
        { id: 'matric', label: 'Matric Certificate' },
        { id: 'admit', label: 'Admit Card' },
        { id: 'identity', label: 'Identity Card' },
        { id: 'dq', label: 'DQ Certificate', qualifier: 'If required' },
        { id: 'photos', label: 'Six photographs' },
      ]}
      markerStyle="lowerRoman"
      notes={[
        {
          label: 'Note',
          text: 'Merge supporting certificates into a single PDF and bring the originals to verification.',
        },
      ]}
      size="compact"
      title="Documents required"
    />
  ),
  iconGrid: (
    <IconGridBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      columns="3"
      contentAlignment="center"
      description="Education, healthcare and community service are treated as connected responsibilities rather than separate activities."
      eyebrow="Our purpose"
      iconStyle="outline"
      items={[
        {
          title: 'Education',
          description:
            'Build strong academic foundations through teaching, laboratories and clinical learning.',
          icon: 'GraduationCap',
        },
        {
          title: 'Healthcare',
          description:
            'Support multidisciplinary diagnosis and treatment through associated clinical services.',
          icon: 'Hospital',
        },
        {
          title: 'Community',
          description: 'Develop medical professionals and expand access to regional care.',
          icon: 'Users',
        },
      ]}
      size="compact"
      title="Three responsibilities. One institution."
      variant="ruled"
    />
  ),
  iconCardShowcase: (
    <IconCardShowcaseBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      cardContentAlignment="center"
      cardHeight="standard"
      cards={[
        { eyebrow: 'Value', icon: 'Handshake', title: 'Integrity' },
        {
          actionLabel: 'Learn more',
          actionMode: 'link',
          eyebrow: 'Value',
          icon: 'Scale',
          linkType: 'custom',
          title: 'Compassion',
          url: '#',
        },
        { eyebrow: 'Value', title: 'Excellence' },
      ]}
      cardWidth="standard"
      defaultCardBackground="brand"
      description="The principles that shape how we learn, serve, and work together."
      eyebrow="Our values"
      iconSize="large"
      size="compact"
      title="What we stand for"
    />
  ),
  integration23: (
    <Integration23BlockComponent
      appearance={{ background: 'subtle', border: 'none' }}
      columns="4"
      contentAlignment="center"
      eyebrow="Our network"
      title="Insurance partners"
      description="Find insurer information and contact our team for assistance."
      items={[
        'Northstar',
        'Horizon',
        'Meridian',
        'Apex',
        'Veritas',
        'Centurion',
        'Summit',
        'Pioneer',
      ].map((name) => ({
        id: name,
        name: `${name} Insurance`,
        logo: fakeMedia(brandMark, `${name} logo`, 200, 80),
        description: 'Example directory entry. Add your own insurer details in the CMS.',
      }))}
      footerActions={[
        { label: 'Contact our team', linkType: 'custom', url: '/contact', mode: 'link' },
      ]}
      size="compact"
    />
  ),
  logos20: (
    <Logos20BlockComponent
      appearance={{ background: 'subtle' }}
      title="Our partners"
      eyebrow="Working together"
      description="A shared commitment to education, research, and community care."
      rows={[
        {
          logos: ['Northstar', 'Horizon', 'Meridian', 'Apex'].map((name) => ({
            name,
            image: fakeMedia(brandMark, name, 200, 80),
          })),
        },
        {
          logos: ['Veritas', 'Summit', 'Pioneer', 'Centurion'].map((name) => ({
            name,
            image: fakeMedia(brandMark, name, 200, 80),
          })),
        },
      ]}
      showLabels
      size="compact"
    />
  ),
  logoStrip: (
    <LogoStripBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      description="Trusted by leading organisations across education, research, and public service."
      displayMode="grid"
      eyebrow="Partners"
      grayscale
      logoHeight="md"
      logos={[
        { image: fakeMedia(brandMark, 'Northstar logo', 200, 80), label: 'Northstar' },
        { image: fakeMedia(brandMark, 'Horizon logo', 200, 80), label: 'Horizon' },
        { image: fakeMedia(brandMark, 'Meridian logo', 200, 80), label: 'Meridian' },
        { image: fakeMedia(brandMark, 'Apex logo', 200, 80), label: 'Apex' },
        { image: fakeMedia(brandMark, 'Veritas logo', 200, 80), label: 'Veritas' },
        { image: fakeMedia(brandMark, 'Centurion logo', 200, 80), label: 'Centurion' },
      ]}
      showLabels
      size="compact"
      title="Our partners"
    />
  ),
  mediaCarousel: (
    <MediaCarouselBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      columns="3"
      contentAlignment="center"
      description="A closer look at the spaces, events, and everyday moments that define life here."
      eyebrow="Gallery"
      items={[
        {
          cardBackground: 'muted',
          title: 'Learning spaces',
          summary: 'Flexible rooms designed for focused and collaborative work.',
          media: fakeMedia(editorialLandscape, 'Learning space'),
        },
        {
          cardBackground: 'primary',
          title: 'Community day',
          summary: 'Annual events that bring the whole campus together.',
          media: fakeMedia(collaboration, 'Community gathering'),
        },
        {
          title: 'Our people',
          summary: 'Students, staff, and partners working side by side.',
          media: fakeMedia(portrait, 'Community portrait', 800, 1000),
        },
      ]}
      size="compact"
      title="Moments from campus"
    />
  ),
  numberedSteps: (
    <NumberedStepsBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      description="A clear, supported process that takes you from first interest to full enrolment."
      eyebrow="How it works"
      numberStyle="circle"
      size="compact"
      steps={[
        {
          cardBackground: 'muted',
          title: 'Explore your options',
          description:
            'Browse programs, attend an info session, or speak with an advisor to find the right fit.',
        },
        {
          cardBackground: 'primary',
          title: 'Submit your application',
          description:
            'Complete the online form, attach your documents, and submit before the deadline.',
        },
        {
          title: 'Receive your offer',
          description:
            'Our team reviews every application and sends a formal offer within five business days.',
        },
        {
          title: 'Confirm your place',
          description: 'Accept your offer, complete enrolment, and get ready for your first day.',
        },
      ]}
      title="From interest to enrolment in four steps."
      variant="cards"
    />
  ),
  pageHeader: (
    <PageHeaderBlockComponent
      actionPlacement="side"
      actions={[
        {
          label: 'Explore Admissions',
          linkType: 'custom',
          mode: 'button',
          showArrow: true,
          url: '/admissions',
          variant: 'default',
        },
        {
          label: 'Download Brochure',
          linkType: 'custom',
          mode: 'button',
          showArrow: true,
          url: '/brochure.pdf',
          variant: 'outline',
        },
      ]}
      appearance={{ background: 'brand', border: 'none' }}
      backgroundImage={fakeMedia(editorialLandscape, 'Medical learning environment', 1600, 900)}
      breadcrumbMode="hidden"
      contentAlignment="left"
      contentWidth="default"
      eyebrow="Admissions"
      height="default"
      overlayDirection="leftToRight"
      overlayStyle="darker"
      size="default"
      subtitle="Discover an academic environment built around knowledge, clinical experience, and compassionate care."
      themeMode="dark"
      title="Your journey in medicine starts here."
      topContent="eyebrow"
      variant="banner"
    />
  ),
  breadcrumb: (
    <BreadcrumbBlockComponent
      alignment="left"
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      automaticBreadcrumbs={[
        { label: 'Home', url: '/' },
        { label: 'Academics', url: '/academics' },
        { label: 'MBBS Programme', url: '/academics/mbbs' },
      ]}
      breadcrumbMode="automatic"
      sectionPadding="compact"
      separator="chevron"
      showCurrentPage
      showHome
      size="default"
    />
  ),
  programMatrix: (
    <ProgramMatrixBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      columns="3"
      contentAlignment="left"
      description="Three routes into clinical practice, each with a defined intake, published curriculum, and supervised hospital rotations."
      eyebrow="Academics"
      headerLayout="split"
      headerPosition="left"
      headerVerticalAlignment="center"
      items={[
        {
          cardBackground: 'default',
          cardAction: [
            {
              label: 'View programme',
              linkType: 'custom',
              mode: 'link',
              url: '/programmes/mbbs',
            },
          ],
          icon: 'stethoscope',
          title: 'MBBS',
          metadata: '4.5 Years + 1 Year Internship',
          description: '150 seats approved by the National Medical Commission.',
        },
        {
          cardBackground: 'muted',
          cardAction: [
            {
              label: 'Apply now',
              linkType: 'custom',
              mode: 'button',
              showArrow: true,
              url: '/admissions',
              variant: 'secondary',
            },
          ],
          icon: 'graduation-cap',
          title: 'Postgraduate MD / MS',
          metadata: '3 Years',
          description: 'Residencies across medicine, surgery, paediatrics, and radiology.',
        },
        {
          cardBackground: 'primary',
          icon: 'heart-pulse',
          title: 'GNM & B.Sc Nursing',
          metadata: '3–4 Years',
          description: 'Recognised nursing programmes with supervised hospital rotations.',
        },
      ]}
      size="compact"
      title="Programmes offered"
    />
  ),
  quoteBlock: (
    <QuoteBlockBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      attributionCompany="Program graduate, 2024"
      attributionName="Jordan Lee"
      attributionTitle="Business & Management"
      avatar={fakeMedia(portrait, 'Jordan Lee', 400, 400)}
      eyebrow="Student voice"
      quote="The support I received here changed how I think about my work. Every challenge felt manageable because I was never navigating it alone."
      quoteSize="lg"
      rating="5"
      size="compact"
      variant="side"
    />
  ),
  richText: (
    <RichTextBlockComponent
      appearance={{ background: 'none', border: 'none' }}
      content={richTextParagraph(
        'Our approach to education is grounded in the belief that practical experience and critical thinking are inseparable. We design programs that challenge students to engage deeply with real-world problems, building skills that last well beyond graduation. Every course, every assessment, and every learning space reflects a commitment to outcomes that matter — to students, to employers, and to the communities they serve.',
      )}
      maxWidth="prose"
      size="compact"
    />
  ),
  reusableSection: (
    <PageHeaderBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="left"
      eyebrow="Reusable content"
      height="compact"
      subtitle="Manage this shared section once and keep every referenced page in sync."
      title="A shared section for consistent pages."
      variant="minimal"
    />
  ),
  tabsContent: (
    <TabsContentBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      contentLayout="curriculum"
      curriculumColumns="2"
      eyebrow="MBBS curriculum"
      size="compact"
      tabStyle="segmented"
      tabs={[
        {
          label: '1st Year',
          title: '1st Year',
          items: [
            { title: 'Anatomy', icon: 'Clock3' },
            { title: 'Physiology', icon: 'Clock3' },
            { title: 'Biochemistry', icon: 'Clock3' },
            { title: 'Foundation Course', icon: 'Clock3' },
          ],
        },
        {
          label: '2nd Year',
          title: '2nd Year',
          items: [{ title: 'Pathology', icon: 'Clock3' }],
        },
        {
          label: '3rd Year',
          title: '3rd Year',
          items: [{ title: 'Community Medicine', icon: 'Clock3' }],
        },
      ]}
      title="A closer look at 4.5 years + internship"
    />
  ),
  testimonialGrid: (
    <TestimonialGridBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      columns="3"
      contentAlignment="center"
      description="Honest reflections from students, alumni, and community partners."
      eyebrow="Voices from our community"
      size="compact"
      testimonials={[
        {
          cardBackground: 'muted',
          quote:
            'The instructors brought real-world experience to every session. I left each class with something immediately useful.',
          name: 'Alex Morgan',
          role: 'Graduate',
          department: 'Business & Management',
        },
        {
          cardBackground: 'primary',
          quote:
            'The support network here is unlike anything I expected. Every question got a thoughtful, genuine answer.',
          name: 'Jordan Lee',
          role: 'Graduate',
          department: 'Technology & Innovation',
        },
        {
          quote:
            'I came in unsure of my direction. The program helped me find clarity and the confidence to act on it.',
          name: 'Sam Rivera',
          role: 'Graduate',
          department: 'Health & Community Services',
        },
      ]}
      title="What our community says."
      variant="grid"
    />
  ),
  timeline: (
    <TimelineBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      contentAlignment="center"
      description="Key milestones across twelve years of programs, partnerships, and community impact."
      eyebrow="Our journey"
      items={[
        {
          title: 'Founded',
          date: '2013',
          badge: 'done',
          description: 'Launched with three programs and a founding cohort of eighty students.',
        },
        {
          title: 'First graduates',
          date: '2015',
          badge: 'done',
          description:
            'Two hundred graduates entered the workforce, with 94% employed within three months.',
        },
        {
          title: 'Campus expansion',
          date: '2019',
          badge: 'done',
          description:
            'Opened a second campus and expanded to twenty-two programs across four disciplines.',
        },
        {
          title: 'Digital-first transition',
          date: '2022',
          badge: 'done',
          description:
            'Launched a full hybrid delivery model, reaching students across five regions.',
        },
        {
          title: 'Centre of Excellence',
          date: '2025',
          badge: 'active',
          description:
            'Recognised by the Education Standards Board for curriculum quality and student outcomes.',
        },
      ]}
      showConnectors
      size="compact"
      title="A decade of progress."
      variant="vertical"
    />
  ),
  videoEmbed: (
    <VideoEmbedBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      aspectRatio="16/9"
      caption="A two-minute overview of life on campus."
      contentAlignment="center"
      description="See our learning spaces, meet some of our students, and get a feel for the experience we offer."
      eyebrow="Campus life"
      maxWidth="lg"
      size="compact"
      title="A closer look at Northstar."
      url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    />
  ),
  careers: (
    <CareersBlockComponent
      appearance={{ background: 'subtle', border: 'topAndBottom' }}
      description="Current faculty, resident and administrative openings. Each notification lists eligibility, documents and how to apply."
      eyebrow="Careers at SNMIH"
      groups={[
        { id: 'faculty', name: 'Faculty' },
        { id: 'residents', name: 'Residents & nursing' },
      ]}
      layout="register"
      openings={[
        {
          actions: [{ label: 'View notification', linkType: 'custom', url: '#', mode: 'link' }],
          applyBy: '2026-11-15T12:00:00.000Z',
          department: 'General Medicine',
          employmentType: 'regular',
          group: 'faculty',
          location: 'Saharsa campus',
          positions: 1,
          publishedOn: '2026-10-12T12:00:00.000Z',
          reference: 'SNMIH/FAC/2026/41',
          status: 'open',
          title: 'Professor – General Medicine',
        },
        {
          actions: [{ label: 'View notification', linkType: 'custom', url: '#', mode: 'link' }],
          applyBy: '2026-11-15T12:00:00.000Z',
          department: 'Anaesthesiology',
          employmentType: 'regular',
          group: 'faculty',
          location: 'Saharsa campus',
          positions: 2,
          publishedOn: '2026-10-12T12:00:00.000Z',
          reference: 'SNMIH/FAC/2026/42',
          status: 'open',
          title: 'Associate Professor – Anaesthesiology',
        },
        {
          actions: [{ label: 'View notification', linkType: 'custom', url: '#', mode: 'link' }],
          applyBy: '2026-11-10T12:00:00.000Z',
          department: 'Paediatrics',
          employmentNote: '3 years',
          employmentType: 'contract',
          group: 'residents',
          location: 'SNMIH Hospital',
          positions: 3,
          publishedOn: '2026-10-20T12:00:00.000Z',
          reference: 'SNMIH/SR/2026/18',
          status: 'open',
          title: 'Senior Resident – Paediatrics',
        },
        {
          actions: [{ label: 'View notification', linkType: 'custom', url: '#', mode: 'link' }],
          applyBy: '2026-11-30T12:00:00.000Z',
          department: 'Nursing',
          employmentType: 'regular',
          group: 'residents',
          location: 'SNMIH Hospital',
          positions: 12,
          publishedOn: '2026-10-25T12:00:00.000Z',
          reference: 'SNMIH/NUR/2026/07',
          status: 'open',
          title: 'Staff Nurse (GNM / B.Sc Nursing)',
        },
      ]}
      title="Work with us"
    />
  ),
} satisfies Record<BlockThumbnailSlug, ReactNode>

export function getBlockThumbnailFixture(slug: BlockThumbnailSlug): ReactNode {
  const fixture = blockThumbnailFixtures[slug]

  if (!fixture) {
    throw new Error(`Unknown block thumbnail fixture: ${slug}`)
  }

  return fixture
}
