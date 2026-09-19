// Refresh time-sensitive block projections even when no editor publishes a change.
export const revalidate = 300

import configPromise from '@payload-config'
import { getPayload, type PopulateType } from 'payload'
import { unstable_cache } from 'next/cache'
import { IBM_Plex_Mono, Inter, Playfair_Display } from 'next/font/google'
import React from 'react'

import '../../styles/globals.css'

import type { Metadata } from 'next'
import { DeferredAdminSessionBar } from '@/components/admin/DeferredAdminSessionBar'
import { ConsentAwareAnalytics } from '@/components/analytics/ConsentAwareAnalytics'
import { BackToTopButton } from '@/components/global/BackToTopButton'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'
import { RouteTransitionScrollGuard } from '@/components/global/RouteTransitionScrollGuard'
import { SearchDialog } from '@/components/global/SearchDialog'
import { GlobalAnnouncement } from '@/components/global/GlobalAnnouncement'
import { GlobalFooter } from '@/components/global/GlobalFooter'
import { GlobalHeader, isGlobalHeaderSticky } from '@/components/global/GlobalHeader'
import {
  type BlockAppearance,
  resolveBlockAppearanceClasses,
} from '@/blocks/shared/blockAppearance'
import { resolveLegalPageHrefs } from '@/lib/legalPagePaths'
import { getMediaAbsoluteUrl } from '@/lib/media'
import { getRobotsMetadata } from '@/lib/seo'
import { getSiteURL } from '@/lib/siteUrl'
import { normalizeWebsiteTheme } from '@/lib/themes/websiteThemes'
import type { Footer, Header } from '@/payload-types'
import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import { stripInternalMediaFields } from '@/lib/stripInternalMediaFields'

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
})

const playfairDisplay = Playfair_Display({
  display: 'swap',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair-display',
})

const ibmPlexMono = IBM_Plex_Mono({
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-ibm-plex-mono',
})

const defaultSiteURL = getSiteURL()

// Linked pages supply destinations, not page content, to the shared shell.
const frontendGlobalsPopulate = {
  pages: { slug: true, parent: true, title: true, publicUrlPreview: true },
} satisfies PopulateType

const _getFrontendGlobals = async () => {
  const payload = await getPayload({
    config: configPromise,
  })

  const [
    themeSettings,
    seoSettings,
    siteSettings,
    pageSettings,
    analyticsSettings,
    cookieConsentSettings,
  ] = await Promise.all([
    payload.findGlobal({ slug: 'theme-settings', depth: 0 }),
    payload.findGlobal({ slug: 'seo-settings', depth: 1 }),
    payload.findGlobal({ slug: 'site-settings', depth: 1, populate: frontendGlobalsPopulate }),
    payload.findGlobal({ slug: 'page-settings', depth: 0 }),
    payload.findGlobal({ slug: 'analytics-settings', depth: 0 }),
    payload.findGlobal({ slug: 'cookie-consent-settings', depth: 0 }),
  ])

  const activeHeaderID =
    typeof pageSettings?.activeHeader === 'string' || typeof pageSettings?.activeHeader === 'number'
      ? pageSettings.activeHeader
      : typeof pageSettings?.activeHeader === 'object' && pageSettings.activeHeader !== null
        ? pageSettings.activeHeader.id
        : null

  const activeHeaderResult =
    activeHeaderID == null
      ? null
      : await payload.find({
          collection: 'headers',
          where: {
            and: [
              {
                id: {
                  equals: activeHeaderID,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          },
          depth: 2,
          populate: frontendGlobalsPopulate,
          limit: 1,
        })

  const activeHeader = (activeHeaderResult?.docs[0] ?? null) as Header | null
  const activeFooterID =
    typeof pageSettings?.activeFooter === 'string' || typeof pageSettings?.activeFooter === 'number'
      ? pageSettings.activeFooter
      : typeof pageSettings?.activeFooter === 'object' && pageSettings.activeFooter !== null
        ? pageSettings.activeFooter.id
        : null

  const activeFooterResult =
    activeFooterID == null
      ? null
      : await payload.find({
          collection: 'footers',
          where: {
            and: [
              {
                id: {
                  equals: activeFooterID,
                },
              },
              {
                _status: {
                  equals: 'published',
                },
              },
            ],
          },
          depth: 2,
          populate: frontendGlobalsPopulate,
          limit: 1,
        })

  const activeFooter = (activeFooterResult?.docs[0] ?? null) as Footer | null
  const { privacyPolicyUrl, termsAndConditionsUrl } = await resolveLegalPageHrefs(
    siteSettings,
    payload,
  )

  return stripInternalMediaFields({
    activeFooter,
    activeHeader,
    analyticsSettings,
    cookieConsentSettings,
    pageSettings,
    privacyPolicyUrl,
    seoSettings,
    siteSettings,
    termsAndConditionsUrl,
    themeSettings,
  })
}

const getFrontendGlobals = unstable_cache(
  _getFrontendGlobals,
  ['frontend-globals', 'navigation-only-v2'],
  {
    tags: [CMS_CACHE_TAGS.globals],
    revalidate: false,
  },
)

const defaultSiteTitle = 'Payload Blank Template'
const defaultSiteDescription = 'A blank template using Payload in a Next.js app.'

export async function generateMetadata(): Promise<Metadata> {
  const { seoSettings, siteSettings } = await getFrontendGlobals()
  const defaultTitle = seoSettings.defaultTitle || defaultSiteTitle
  const title = seoSettings.titleTemplate
    ? {
        default: defaultTitle,
        template: seoSettings.titleTemplate,
      }
    : defaultTitle
  const defaultImageUrl = getMediaAbsoluteUrl(seoSettings.defaultImage)
  const faviconUrl = getMediaAbsoluteUrl(siteSettings.favicon)

  return {
    metadataBase: new URL(defaultSiteURL),
    formatDetection: {
      address: false,
      email: false,
      telephone: false,
    },
    title,
    description: seoSettings.defaultDescription || defaultSiteDescription,
    icons: faviconUrl
      ? {
          icon: faviconUrl,
          shortcut: faviconUrl,
          apple: faviconUrl,
        }
      : undefined,
    openGraph: defaultImageUrl
      ? {
          images: [
            {
              url: defaultImageUrl,
            },
          ],
        }
      : undefined,
    robots: getRobotsMetadata(seoSettings.robots),
    twitter: defaultImageUrl
      ? {
          card: 'summary_large_image',
          images: [defaultImageUrl],
        }
      : undefined,
    verification: {
      google: seoSettings.googleSiteVerification || undefined,
    },
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const frontendGlobals = await getFrontendGlobals()
  const {
    activeFooter,
    activeHeader,
    analyticsSettings,
    cookieConsentSettings,
    pageSettings,
    privacyPolicyUrl,
    siteSettings,
    termsAndConditionsUrl,
    themeSettings,
  } = frontendGlobals

  const colorScheme = themeSettings.colorScheme ?? 'system'
  const themeColor = normalizeWebsiteTheme(themeSettings.themeColor)
  const announcementSettings = pageSettings?.announcementEnabled ? pageSettings : null
  const announcementDisplayMode = announcementSettings?.announcementDisplayMode
  const announcementAppearance = announcementSettings?.announcementAppearance
  const announcementIntervalMs = announcementSettings?.announcementIntervalMs
  const announcementLabel = announcementSettings?.announcementLabel
  const announcementMarqueeDurationMs = announcementSettings?.announcementMarqueeDurationMs
  const announcementItems = announcementSettings?.announcementItems
  const announcementDismissible = announcementSettings?.announcementDismissible
  const announcementHideOnScroll = announcementSettings?.announcementHideOnScroll
  const pageAppearance = pageSettings?.pageAppearance as BlockAppearance | null | undefined
  const htmlClassName = [
    inter.variable,
    playfairDisplay.variable,
    ibmPlexMono.variable,
    colorScheme === 'dark' ? 'dark' : null,
  ]
    .filter(Boolean)
    .join(' ')
  const { className: pageBodyClassName } = resolveBlockAppearanceClasses(pageAppearance)
  const cmsToolbarOffset = 'var(--cms-toolbar-offset, 0px)'
  // Only a persistent (non-hide-on-scroll) announcement reserves space below it;
  // the bar collapses --global-announcement-height to 0 when dismissed. The
  // fallback keeps the correct offset during SSR and before hydration.
  const headerReservesAnnouncement = Boolean(announcementItems?.length) && !announcementHideOnScroll
  const announcementHeight = headerReservesAnnouncement ? '2.5rem' : '0px'
  const headerTopOffset = `calc(${cmsToolbarOffset} + var(--global-announcement-height, ${announcementHeight}))`
  const blockAnchorOffset = isGlobalHeaderSticky(activeHeader)
    ? `calc(${cmsToolbarOffset} + var(--global-announcement-height, ${announcementHeight}) + 6rem)`
    : '1rem'
  const htmlStyle = {
    ...(colorScheme === 'system' ? { colorScheme: 'light dark' } : { colorScheme }),
    '--block-anchor-offset': blockAnchorOffset,
    '--cms-toolbar-offset': '0px',
  } as React.CSSProperties & {
    '--block-anchor-offset': string
    '--cms-toolbar-offset': string
  }
  const contentShellStyle = { paddingTop: cmsToolbarOffset } as React.CSSProperties

  return (
    <html
      lang="en"
      className={htmlClassName}
      data-color-scheme={colorScheme}
      data-scroll-behavior="smooth"
      data-theme-color={themeColor}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <head>
        {/* RSS feed autodiscovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${siteSettings.siteName} — Articles`}
          href="/articles/feed.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${siteSettings.siteName} — News & Events`}
          href="/news-events/feed.xml"
        />
        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: siteSettings.siteName,
              description: siteSettings.siteDescription || undefined,
              url: defaultSiteURL,
              logo: getMediaAbsoluteUrl(siteSettings.logo) || undefined,
              email: siteSettings.contactEmail || undefined,
              telephone: siteSettings.contactPhone || undefined,
              address: siteSettings.address
                ? { '@type': 'PostalAddress', streetAddress: siteSettings.address }
                : undefined,
            }).replace(/</g, '\\u003c'),
          }}
        />
        {/* WebSite JSON-LD with SearchAction — enables Google Sitelinks search box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteSettings.siteName,
              url: defaultSiteURL,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${defaultSiteURL}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className={pageBodyClassName}>
        <RouteTransitionScrollGuard />
        {/* Skip navigation — visually hidden until focused */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-9999 focus:rounded-control focus:bg-background focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring focus:outline-none"
        >
          Skip to main content
        </a>
        <DeferredAdminSessionBar />
        <div style={contentShellStyle}>
          <GlobalAnnouncement
            displayMode={announcementDisplayMode}
            appearance={announcementAppearance}
            intervalMs={announcementIntervalMs}
            items={announcementItems}
            label={announcementLabel}
            marqueeDurationMs={announcementMarqueeDurationMs}
            stickyTopOffset={cmsToolbarOffset}
            dismissible={announcementDismissible}
            hideOnScroll={announcementHideOnScroll}
          />
          <GlobalHeader
            header={activeHeader}
            siteLogo={siteSettings.logo}
            siteName={siteSettings.siteName}
            stickyTopOffset={headerTopOffset}
          />
          <main id="main-content" data-site-main="true">
            {children}
          </main>
          <GlobalFooter
            footer={activeFooter}
            privacyPolicyUrl={privacyPolicyUrl}
            termsAndConditionsUrl={termsAndConditionsUrl}
            siteAddress={siteSettings.address}
            siteEmail={siteSettings.contactEmail}
            siteLogo={siteSettings.logo}
            siteName={siteSettings.siteName}
            sitePhone={siteSettings.contactPhone}
            siteSocialLinks={siteSettings.socialLinks}
          />
        </div>
        <BackToTopButton />
        <CookieConsentBanner
          enabled={cookieConsentSettings.enabled ?? true}
          variant={
            cookieConsentSettings.variant as
              | import('@/components/global/CookieConsentBanner').CookieConsentVariant
              | null
              | undefined
          }
          position={
            cookieConsentSettings.position as
              | import('@/components/global/CookieConsentBanner').CookieConsentPosition
              | null
              | undefined
          }
          heading={cookieConsentSettings.heading}
          message={cookieConsentSettings.message}
          acceptLabel={cookieConsentSettings.acceptLabel}
          rejectLabel={cookieConsentSettings.rejectLabel}
          learnMoreLabel={cookieConsentSettings.learnMoreLabel}
          privacyPolicyUrl={privacyPolicyUrl}
        />
        <ConsentAwareAnalytics
          ga4Enabled={analyticsSettings.ga4Enabled}
          ga4MeasurementId={analyticsSettings.ga4MeasurementId}
          gtmEnabled={analyticsSettings.gtmEnabled}
          gtmContainerId={analyticsSettings.gtmContainerId}
        />
        <SearchDialog />
      </body>
    </html>
  )
}
