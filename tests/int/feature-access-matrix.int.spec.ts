import { describe, expect, it } from 'vitest'

import { ADMIN_FEATURES, ADMIN_FEATURE_KEYS } from '@/access/adminFeatures'
import { Articles } from '@/collections/Articles'
import { Categories } from '@/collections/Categories'
import { Footers } from '@/collections/Footers'
import { Forms } from '@/collections/Forms'
import { FormSubmissions } from '@/collections/FormSubmissions'
import { GalleryAlbums } from '@/collections/GalleryAlbums'
import { Headers } from '@/collections/Headers'
import { Media } from '@/collections/Media'
import { NavigationLinks } from '@/collections/NavigationLinks'
import { NewsEventClassifications } from '@/collections/NewsEventClassifications'
import { NewsEvents } from '@/collections/NewsEvents'
import { OfficeLocations } from '@/collections/OfficeLocations'
import { OperationalAuditEvents } from '@/collections/OperationalAuditEvents'
import { Pages } from '@/collections/Pages'
import { Redirects } from '@/collections/Redirects'
import { ReusableSections } from '@/collections/ReusableSections'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'
import { Tags } from '@/collections/Tags'
import { WorkQueue } from '@/collections/WorkQueue'
import { AnalyticsSettings } from '@/globals/AnalyticsSettings'
import { CookieConsentSettings } from '@/globals/CookieConsentSettings'
import { NewsEventsDetailTemplate } from '@/globals/NewsEventsDetailTemplate'
import { PageSettings } from '@/globals/PageSettings'
import { SearchSettings } from '@/globals/SearchSettings'
import { SEOSettings } from '@/globals/SEOSettings'
import { SiteSettings } from '@/globals/SiteSettings'
import { SystemModeSettings } from '@/globals/SystemModeSettings'
import { ThemeSettings } from '@/globals/ThemeSettings'

const resources = {
  pages: Pages,
  articles: Articles,
  reviews: Reviews,
  reusableSections: ReusableSections,
  newsEvents: NewsEvents,
  newsEventClassifications: NewsEventClassifications,
  newsEventsDetailTemplate: NewsEventsDetailTemplate,
  topics: Categories,
  tags: Tags,
  navigationLinks: NavigationLinks,
  redirects: Redirects,
  headers: Headers,
  footers: Footers,
  officeLocations: OfficeLocations,
  systemPages: SystemPages,
  media: Media,
  galleryAlbums: GalleryAlbums,
  forms: Forms,
  formSubmissions: FormSubmissions,
  actionQueue: WorkQueue,
  auditLog: OperationalAuditEvents,
  siteIdentity: SiteSettings,
  appearance: ThemeSettings,
  seoMetadata: SEOSettings,
  analyticsTracking: AnalyticsSettings,
  cookieConsent: CookieConsentSettings,
  layoutDefaults: PageSettings,
  searchSettings: SearchSettings,
  maintenanceModes: SystemModeSettings,
} as const

const accessArgs = (user: unknown, data?: Record<string, unknown>) =>
  ({ req: { user }, data }) as never

describe('feature access matrix', () => {
  it('binds every grantable destination exactly once', () => {
    expect(Object.keys(resources)).toEqual([...ADMIN_FEATURE_KEYS])
    expect(
      new Set(
        Object.values(ADMIN_FEATURES).map(({ resource }) => `${resource.kind}:${resource.slug}`),
      ).size,
    ).toBe(29)
  })

  it.each(ADMIN_FEATURE_KEYS)('uses %s for destination visibility and management', async (key) => {
    const config = resources[key]
    const hidden = config.admin?.hidden
    const without = { role: 'siteManager', features: {} }
    const withFeature = {
      role: 'siteManager',
      features: {
        [key]: true,
        ...((key === 'actionQueue' || key === 'auditLog') && { pages: true }),
      },
    }

    expect(typeof hidden).toBe('function')
    if (typeof hidden === 'function') {
      expect(hidden({ user: without } as never)).toBe(true)
      expect(hidden({ user: withFeature } as never)).toBe(false)
    }

    const access = config.access as
      | {
          create?: (args: never) => unknown
          read?: (args: never) => unknown
          readVersions?: (args: never) => unknown
          update?: (args: never) => unknown
        }
      | undefined
    if (access?.create) {
      const expected =
        key === 'actionQueue' || key === 'auditLog' || key === 'formSubmissions' ? false : true
      expect(await access.create(accessArgs(withFeature))).toBe(expected)
    }

    if (access?.read) {
      expect(await access.read(accessArgs(without))).toBe(false)
      expect(await access.read(accessArgs(withFeature))).not.toBe(false)
    }

    if (access?.update) {
      expect(await access.update(accessArgs(without))).toBe(false)
      if (key === 'auditLog') {
        expect(await access.update(accessArgs(withFeature))).toBe(false)
      } else {
        expect(await access.update(accessArgs(withFeature))).not.toBe(false)
      }
    }

    if (access?.readVersions) {
      expect(await access.readVersions(accessArgs(without))).toBe(false)
      expect(await access.readVersions(accessArgs(withFeature))).not.toBe(false)
    }
  })

  it('allows only soft deletion for an authorized Site Manager', async () => {
    const manager = { role: 'siteManager', features: { pages: true } }
    expect(await Pages.access?.delete?.(accessArgs(manager))).toBe(false)
    expect(
      await Pages.access?.delete?.(accessArgs(manager, { deletedAt: new Date().toISOString() })),
    ).toBe(true)
    expect(await Pages.access?.delete?.(accessArgs({ role: 'admin' }))).toBe(true)
  })

  it('grants relationship reads without exposing the supporting destination', async () => {
    const manager = { role: 'siteManager', features: { articles: true } }
    expect(await Media.access?.read?.(accessArgs(manager))).toBe(true)
    expect(await Categories.access?.read?.(accessArgs(manager))).toBe(true)
    expect(await Media.access?.update?.(accessArgs(manager))).toBe(false)
    expect(await Categories.access?.update?.(accessArgs(manager))).toBe(false)

    const mediaHidden = Media.admin?.hidden
    expect(typeof mediaHidden).toBe('function')
    if (typeof mediaHidden === 'function')
      expect(mediaHidden({ user: manager } as never)).toBe(true)
  })

  it('sanitizes Form Submission dependency reads for Reviews operators', async () => {
    const manager = { role: 'siteManager', features: { reviews: true } }
    expect(await FormSubmissions.access?.read?.(accessArgs(manager))).toBe(true)

    const afterRead = FormSubmissions.hooks?.afterRead?.[0]
    if (!afterRead) throw new Error('Expected Form Submission dependency sanitizer.')

    expect(
      await afterRead({
        doc: {
          data: { reviewerEmail: 'private@example.test', reviewBody: 'Private raw payload' },
          id: 'submission-1',
          submitterEmail: 'private@example.test',
        },
        req: { user: manager },
      } as never),
    ).toEqual({ id: 'submission-1', submitterEmail: 'Submission #submission-1' })
  })
})
