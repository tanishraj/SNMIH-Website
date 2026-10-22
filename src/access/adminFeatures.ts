export const ADMIN_ROLES = ['admin', 'siteManager'] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ADMIN_FEATURE_KEYS = [
  'pages',
  'articles',
  'reviews',
  'reusableSections',
  'celebrations',
  'newsEvents',
  'newsEventClassifications',
  'newsEventsDetailTemplate',
  'topics',
  'tags',
  'navigationLinks',
  'redirects',
  'headers',
  'footers',
  'officeLocations',
  'systemPages',
  'media',
  'galleryAlbums',
  'forms',
  'formSubmissions',
  'actionQueue',
  'auditLog',
  'siteIdentity',
  'appearance',
  'seoMetadata',
  'analyticsTracking',
  'cookieConsent',
  'layoutDefaults',
  'searchSettings',
  'maintenanceModes',
] as const

export type AdminFeatureKey = (typeof ADMIN_FEATURE_KEYS)[number]
export type AdminFeatureGrants = Partial<Record<AdminFeatureKey, boolean | null>>
export type AdminFeatureGroup =
  | 'Content'
  | 'News & Events'
  | 'Taxonomy'
  | 'Navigation'
  | 'Site Structure'
  | 'Media'
  | 'Forms'
  | 'Administration'
  | 'Settings'
  | 'Configuration'
export type AdminFeaturePolicyKind =
  'draftContent' | 'publicContent' | 'internal' | 'classification' | 'queue' | 'audit'

export type AdminFeatureResource = {
  kind: 'collection' | 'global'
  slug: string
}

export type AdminFeatureDefinition = {
  dependencyReads: readonly AdminFeatureKey[]
  description: string
  group: AdminFeatureGroup
  key: AdminFeatureKey
  label: string
  policyKind: AdminFeaturePolicyKind
  resource: AdminFeatureResource
}

const feature = (
  definition: Omit<AdminFeatureDefinition, 'dependencyReads'> & {
    dependencyReads?: readonly AdminFeatureKey[]
  },
): AdminFeatureDefinition => ({ dependencyReads: [], ...definition })

export const ADMIN_FEATURES: Record<AdminFeatureKey, AdminFeatureDefinition> = {
  pages: feature({
    key: 'pages',
    label: 'Pages',
    group: 'Content',
    description: 'Create, edit, preview, publish, version, trash, and restore Pages.',
    resource: { kind: 'collection', slug: 'pages' },
    policyKind: 'draftContent',
    dependencyReads: [
      'media',
      'reusableSections',
      'navigationLinks',
      'newsEventClassifications',
      'forms',
      'galleryAlbums',
      'officeLocations',
      'celebrations',
    ],
  }),
  articles: feature({
    key: 'articles',
    label: 'Articles',
    group: 'Content',
    description: 'Create, edit, preview, publish, version, trash, and restore Articles.',
    resource: { kind: 'collection', slug: 'articles' },
    policyKind: 'draftContent',
    dependencyReads: ['media', 'topics', 'tags'],
  }),
  reviews: feature({
    key: 'reviews',
    label: 'Reviews',
    group: 'Content',
    description: 'Manage Reviews and moderate public review submissions.',
    resource: { kind: 'collection', slug: 'reviews' },
    policyKind: 'draftContent',
    dependencyReads: ['media', 'topics', 'tags', 'formSubmissions'],
  }),
  reusableSections: feature({
    key: 'reusableSections',
    label: 'Reusable Sections',
    group: 'Content',
    description: 'Create, edit, version, trash, and restore Reusable Sections.',
    resource: { kind: 'collection', slug: 'reusable-sections' },
    policyKind: 'draftContent',
    dependencyReads: [
      'media',
      'navigationLinks',
      'pages',
      'newsEventClassifications',
      'forms',
      'galleryAlbums',
      'officeLocations',
      'celebrations',
    ],
  }),
  celebrations: feature({
    key: 'celebrations',
    label: 'Celebrations',
    group: 'Content',
    description:
      'Schedule, edit, preview, publish, enable or disable, trash, and restore celebration modals.',
    resource: { kind: 'collection', slug: 'celebrations' },
    policyKind: 'draftContent',
    dependencyReads: ['media', 'pages'],
  }),
  newsEvents: feature({
    key: 'newsEvents',
    label: 'News & Events',
    group: 'News & Events',
    description: 'Create, edit, preview, publish, version, trash, and restore News & Events.',
    resource: { kind: 'collection', slug: 'news-events' },
    policyKind: 'draftContent',
    dependencyReads: ['media', 'newsEventClassifications', 'topics', 'tags'],
  }),
  newsEventClassifications: feature({
    key: 'newsEventClassifications',
    label: 'Classifications',
    group: 'News & Events',
    description: 'Create, edit, and archive News & Event classifications.',
    resource: { kind: 'collection', slug: 'news-event-classifications' },
    policyKind: 'classification',
  }),
  newsEventsDetailTemplate: feature({
    key: 'newsEventsDetailTemplate',
    label: 'Detail Page Template',
    group: 'News & Events',
    description: 'Edit, preview, and publish the shared News & Events detail layout.',
    resource: { kind: 'global', slug: 'news-events-detail-template' },
    policyKind: 'draftContent',
    dependencyReads: [
      'media',
      'reusableSections',
      'navigationLinks',
      'forms',
      'galleryAlbums',
      'newsEventClassifications',
      'officeLocations',
      'pages',
      'celebrations',
    ],
  }),
  topics: feature({
    key: 'topics',
    label: 'Topics',
    group: 'Taxonomy',
    description: 'Create, edit, archive, trash, restore, and select Topics.',
    resource: { kind: 'collection', slug: 'categories' },
    policyKind: 'publicContent',
  }),
  tags: feature({
    key: 'tags',
    label: 'Tags',
    group: 'Taxonomy',
    description: 'Create, edit, archive, trash, restore, and select Tags.',
    resource: { kind: 'collection', slug: 'tags' },
    policyKind: 'publicContent',
  }),
  navigationLinks: feature({
    key: 'navigationLinks',
    label: 'Navigation Links',
    group: 'Navigation',
    description: 'Create, edit, publish, version, trash, and restore Navigation Links.',
    resource: { kind: 'collection', slug: 'navigation-links' },
    policyKind: 'draftContent',
    dependencyReads: ['pages'],
  }),
  redirects: feature({
    key: 'redirects',
    label: 'Redirects',
    group: 'Navigation',
    description: 'Create, edit, enable, version, trash, and restore Redirects.',
    resource: { kind: 'collection', slug: 'redirects' },
    policyKind: 'draftContent',
    dependencyReads: ['pages'],
  }),
  headers: feature({
    key: 'headers',
    label: 'Headers',
    group: 'Site Structure',
    description: 'Create, edit, preview, publish, version, trash, and restore Headers.',
    resource: { kind: 'collection', slug: 'headers' },
    policyKind: 'draftContent',
    dependencyReads: ['navigationLinks', 'media', 'pages'],
  }),
  footers: feature({
    key: 'footers',
    label: 'Footers',
    group: 'Site Structure',
    description: 'Create, edit, preview, publish, version, trash, and restore Footers.',
    resource: { kind: 'collection', slug: 'footers' },
    policyKind: 'draftContent',
    dependencyReads: ['navigationLinks', 'officeLocations', 'pages', 'media'],
  }),
  officeLocations: feature({
    key: 'officeLocations',
    label: 'Office Locations',
    group: 'Site Structure',
    description: 'Create, edit, version, trash, and restore Office Locations.',
    resource: { kind: 'collection', slug: 'office-locations' },
    policyKind: 'draftContent',
  }),
  systemPages: feature({
    key: 'systemPages',
    label: 'System Pages',
    group: 'Site Structure',
    description: 'Create, edit, preview, publish, version, trash, and restore System Pages.',
    resource: { kind: 'collection', slug: 'system-pages' },
    policyKind: 'draftContent',
  }),
  media: feature({
    key: 'media',
    label: 'Media',
    group: 'Media',
    description: 'Upload, edit, replace, version, trash, and restore Media.',
    resource: { kind: 'collection', slug: 'media' },
    policyKind: 'draftContent',
  }),
  galleryAlbums: feature({
    key: 'galleryAlbums',
    label: 'Gallery Albums',
    group: 'Media',
    description: 'Create, edit, reorder, version, trash, and restore Gallery Albums.',
    resource: { kind: 'collection', slug: 'gallery-albums' },
    policyKind: 'draftContent',
    dependencyReads: ['media'],
  }),
  forms: feature({
    key: 'forms',
    label: 'Forms',
    group: 'Forms',
    description: 'Create, edit, configure, version, trash, and restore Forms.',
    resource: { kind: 'collection', slug: 'forms' },
    policyKind: 'draftContent',
    dependencyReads: ['media', 'pages'],
  }),
  formSubmissions: feature({
    key: 'formSubmissions',
    label: 'Form Submissions',
    group: 'Forms',
    description: 'Read submissions and update assignment, status, and internal notes.',
    resource: { kind: 'collection', slug: 'form-submissions' },
    policyKind: 'internal',
  }),
  actionQueue: feature({
    key: 'actionQueue',
    label: 'Action Queue',
    group: 'Administration',
    description: 'Read and operate generated tasks for otherwise authorized features.',
    resource: { kind: 'collection', slug: 'work-queue' },
    policyKind: 'queue',
  }),
  auditLog: feature({
    key: 'auditLog',
    label: 'Audit Log',
    group: 'Administration',
    description: 'Read audit events for otherwise authorized features.',
    resource: { kind: 'collection', slug: 'operational-audit-events' },
    policyKind: 'audit',
  }),
  siteIdentity: feature({
    key: 'siteIdentity',
    label: 'Site Identity',
    group: 'Settings',
    description: 'Edit and publish identity, contact, address, legal, and social settings.',
    resource: { kind: 'global', slug: 'site-settings' },
    policyKind: 'publicContent',
    dependencyReads: ['pages', 'media'],
  }),
  appearance: feature({
    key: 'appearance',
    label: 'Appearance',
    group: 'Settings',
    description: 'Edit and publish theme and color-mode settings.',
    resource: { kind: 'global', slug: 'theme-settings' },
    policyKind: 'publicContent',
  }),
  seoMetadata: feature({
    key: 'seoMetadata',
    label: 'SEO & Metadata',
    group: 'Settings',
    description: 'Edit and publish site metadata, robots, and verification settings.',
    resource: { kind: 'global', slug: 'seo-settings' },
    policyKind: 'publicContent',
    dependencyReads: ['media'],
  }),
  analyticsTracking: feature({
    key: 'analyticsTracking',
    label: 'Analytics & Tracking',
    group: 'Settings',
    description: 'Edit and publish GTM or GA4 settings.',
    resource: { kind: 'global', slug: 'analytics-settings' },
    policyKind: 'publicContent',
  }),
  cookieConsent: feature({
    key: 'cookieConsent',
    label: 'Cookie Consent Banner',
    group: 'Settings',
    description: 'Edit and publish consent visibility, copy, links, and presentation.',
    resource: { kind: 'global', slug: 'cookie-consent-settings' },
    policyKind: 'publicContent',
    dependencyReads: ['pages'],
  }),
  layoutDefaults: feature({
    key: 'layoutDefaults',
    label: 'Layout Defaults',
    group: 'Configuration',
    description: 'Select homepage, Header, Footer, and configure the announcement.',
    resource: { kind: 'global', slug: 'page-settings' },
    policyKind: 'publicContent',
    dependencyReads: ['pages', 'headers', 'footers', 'newsEventClassifications'],
  }),
  searchSettings: feature({
    key: 'searchSettings',
    label: 'Search Settings',
    group: 'Configuration',
    description: 'Edit and publish suggested-search settings.',
    resource: { kind: 'global', slug: 'search-settings' },
    policyKind: 'publicContent',
  }),
  maintenanceModes: feature({
    key: 'maintenanceModes',
    label: 'Maintenance & Modes',
    group: 'Configuration',
    description: 'Configure normal, maintenance, and coming-soon modes.',
    resource: { kind: 'global', slug: 'system-mode-settings' },
    policyKind: 'publicContent',
    dependencyReads: ['systemPages'],
  }),
}

const featureKeys = new Set<string>(ADMIN_FEATURE_KEYS)

export const isAdminFeatureKey = (value: unknown): value is AdminFeatureKey =>
  typeof value === 'string' && featureKeys.has(value)

export const getFeatureForResource = (resource: AdminFeatureResource): AdminFeatureKey | null => {
  const match = ADMIN_FEATURE_KEYS.find((key) => {
    const candidate = ADMIN_FEATURES[key].resource
    return candidate.kind === resource.kind && candidate.slug === resource.slug
  })

  return match ?? null
}

export const ADMIN_FEATURE_GROUPS = [
  'Content',
  'News & Events',
  'Taxonomy',
  'Navigation',
  'Site Structure',
  'Media',
  'Forms',
  'Administration',
  'Settings',
  'Configuration',
] as const satisfies readonly AdminFeatureGroup[]
