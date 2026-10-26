import { DisclosureDatasets, DisclosurePeriods, DisclosureRecords } from './collections/Disclosure'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { Categories } from './collections/Categories'
import { Celebrations } from './collections/Celebrations'
import { Users } from './collections/Users'
import { TwoFactorCredentials } from './collections/TwoFactorCredentials'
import { Footers } from './collections/Footers'
import { FormSubmissions } from './collections/FormSubmissions'
import { Forms } from './collections/Forms'
import { GalleryAlbums } from './collections/GalleryAlbums'
import { Media } from './collections/Media'
import { NavigationLinks } from './collections/NavigationLinks'
import { NewsEventClassifications } from './collections/NewsEventClassifications'
import { NewsEvents } from './collections/NewsEvents'
import { Pages } from './collections/Pages'
import { Redirects } from './collections/Redirects'
import { Reviews } from './collections/Reviews'
import { Tags } from './collections/Tags'
import { Headers } from './collections/Headers'
import { OfficeLocations } from './collections/OfficeLocations'
import { OperationalAuditEvents } from './collections/OperationalAuditEvents'
import { WorkQueue } from './collections/WorkQueue'
import { SystemPages } from './collections/SystemPages'
import { createDatabaseAdapter, createEmailAdapter, createStoragePlugins } from './config/providers'
import { assertSupportedStarterContract, getStarterContract } from './config/starterContract'
import { getRuntimeConfig } from './config/runtime'
import { payloadUploadConfig } from './config/uploadLimits'
import { projectEditor } from './fields/bodyEditorConfig'
import { PageSettings } from './globals/PageSettings'
import { NewsEventsDetailTemplate } from './globals/NewsEventsDetailTemplate'
import { SEOSettings } from './globals/SEOSettings'
import { SiteSettings } from './globals/SiteSettings'
import { SystemModeSettings } from './globals/SystemModeSettings'
import { ThemeSettings } from './globals/ThemeSettings'
import { AnalyticsSettings } from './globals/AnalyticsSettings'
import { CookieConsentSettings } from './globals/CookieConsentSettings'
import { SearchSettings } from './globals/SearchSettings'
import { ReusableSections } from './collections/ReusableSections'
import { withFeatureDeletionAudit } from './plugins/withFeatureDeletionAudit'
import { withTrash } from './plugins/withTrash'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const runtimeConfig = getRuntimeConfig()
const starterContract = getStarterContract(runtimeConfig)
assertSupportedStarterContract(starterContract)
const email = createEmailAdapter(runtimeConfig)
const storagePlugins = createStoragePlugins(runtimeConfig)

if (runtimeConfig.deployment.isProduction && !email && runtimeConfig.email.provider === 'resend') {
  throw new Error('Missing production email configuration.')
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ['@/components/admin/DashboardOverview#DashboardOverview'],
      views: {
        login: {
          Component: '@/components/admin/TwoFactorLoginView#TwoFactorLoginView',
          path: '/login',
        },
      },
    },
  },
  collections: [
    // Content
    Pages,
    Articles,
    NewsEvents,
    NewsEventClassifications,
    Reviews,
    ReusableSections,
    Celebrations,
    DisclosureDatasets,
    DisclosurePeriods,
    DisclosureRecords,
    // Taxonomy
    Categories,
    Tags,
    // Navigation
    NavigationLinks,
    Headers,
    Footers,
    OfficeLocations,
    Redirects,
    SystemPages,
    // Media
    Media,
    GalleryAlbums,
    // Forms
    Forms,
    FormSubmissions,
    // Administration
    WorkQueue,
    OperationalAuditEvents,
    Users,
    TwoFactorCredentials,
  ],
  globals: [
    // Settings (frequently adjusted)
    SiteSettings,
    ThemeSettings,
    SEOSettings,
    AnalyticsSettings,
    CookieConsentSettings,
    // Configuration (set-and-forget)
    PageSettings,
    NewsEventsDetailTemplate,
    SearchSettings,
    SystemModeSettings,
  ],
  editor: projectEditor,
  email,
  graphQL: {
    disableIntrospectionInProduction: true,
    disablePlaygroundInProduction: true,
  },
  secret: runtimeConfig.payload.secret,
  upload: payloadUploadConfig,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: createDatabaseAdapter(runtimeConfig),
  sharp,
  plugins: [
    ...storagePlugins,
    withTrash({
      exclude: [NewsEventClassifications.slug],
    }),
    withFeatureDeletionAudit(),
  ],
})
