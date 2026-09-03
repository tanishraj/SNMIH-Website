import type { Field } from 'payload'

import { featureFieldReadAccess } from '@/access/featureAccess'

type RelationshipValue = number | string | { id?: number | string | null } | null | undefined

type PayloadLike = {
  find: unknown
  findGlobal: unknown
}

export type MediaUsageReference = {
  documentID?: number | string
  documentLabel: string
  fieldPath: string
  locationLabel: string
  sourceSlug: string
  sourceType: 'collection' | 'global'
  sourceLabel: string
}

type CollectionUsageSource = {
  getDocumentLabel: (doc: Record<string, unknown>) => string
  resolve: (doc: Record<string, unknown>, mediaID: number | string) => MediaUsageReference[]
  slug: string
  sourceLabel: string
}

type GlobalUsageSource = {
  resolve: (doc: Record<string, unknown>, mediaID: number | string) => MediaUsageReference[]
  slug: string
  sourceLabel: string
}

const mediaUsageSourceLabelByCollection: Record<string, string> = {
  articles: 'Articles',
  'gallery-albums': 'Gallery Albums',
  'news-events': 'News & Events',
  footers: 'Footers',
  headers: 'Headers',
  pages: 'Pages',
  reviews: 'Reviews',
  'system-pages': 'System Pages',
}

const mediaUsageSourceLabelByGlobal: Record<string, string> = {
  'news-events-detail-template': 'News & Events Detail Template',
  'seo-settings': 'SEO & Metadata',
  'site-settings': 'Site Identity',
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const getRelationshipID = (value: RelationshipValue): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = value.id

    if (typeof id === 'number' || typeof id === 'string') {
      return id
    }
  }

  return null
}

const matchesMedia = (value: RelationshipValue, mediaID: number | string): boolean =>
  getRelationshipID(value) === mediaID

const getDocumentID = (doc: Record<string, unknown>): number | string | undefined => {
  const { id } = doc

  if (typeof id === 'number' || typeof id === 'string') {
    return id
  }

  return undefined
}

const getTextValue = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback

const buildLocationLabel = ({
  documentLabel,
  fieldPath,
  sourceLabel,
}: {
  documentLabel: string
  fieldPath: string
  sourceLabel: string
}): string => `${sourceLabel} > ${documentLabel} > ${fieldPath}`

const createCollectionReference = ({
  doc,
  documentLabel,
  fieldPath,
  slug,
}: {
  doc: Record<string, unknown>
  documentLabel: string
  fieldPath: string
  slug: string
}): MediaUsageReference => {
  const sourceLabel = mediaUsageSourceLabelByCollection[slug] ?? slug

  return {
    documentID: getDocumentID(doc),
    documentLabel,
    fieldPath,
    locationLabel: buildLocationLabel({
      documentLabel,
      fieldPath,
      sourceLabel,
    }),
    sourceLabel,
    sourceSlug: slug,
    sourceType: 'collection',
  }
}

const createGlobalReference = ({
  documentLabel,
  fieldPath,
  slug,
}: {
  documentLabel: string
  fieldPath: string
  slug: string
}): MediaUsageReference => {
  const sourceLabel = mediaUsageSourceLabelByGlobal[slug] ?? slug

  return {
    documentLabel,
    fieldPath,
    locationLabel: buildLocationLabel({
      documentLabel,
      fieldPath,
      sourceLabel,
    }),
    sourceLabel,
    sourceSlug: slug,
    sourceType: 'global',
  }
}

const pushIfMatched = ({
  references,
  reference,
  value,
  mediaID,
}: {
  mediaID: number | string
  reference: MediaUsageReference
  references: MediaUsageReference[]
  value: RelationshipValue
}) => {
  if (matchesMedia(value, mediaID)) {
    references.push(reference)
  }
}

const collectionSources: CollectionUsageSource[] = [
  {
    slug: 'pages',
    sourceLabel: 'Pages',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Page'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled Page')
      const references: MediaUsageReference[] = []

      pushIfMatched({
        mediaID,
        reference: createCollectionReference({
          doc,
          documentLabel,
          fieldPath: 'ogImage',
          slug: 'pages',
        }),
        references,
        value: doc.ogImage as RelationshipValue,
      })

      return references
    },
  },
  {
    slug: 'articles',
    sourceLabel: 'Articles',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Article'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled Article')
      const references: MediaUsageReference[] = []

      pushIfMatched({
        mediaID,
        reference: createCollectionReference({
          doc,
          documentLabel,
          fieldPath: 'featuredImage',
          slug: 'articles',
        }),
        references,
        value: doc.featuredImage as RelationshipValue,
      })

      pushIfMatched({
        mediaID,
        reference: createCollectionReference({
          doc,
          documentLabel,
          fieldPath: 'ogImage',
          slug: 'articles',
        }),
        references,
        value: doc.ogImage as RelationshipValue,
      })

      return references
    },
  },
  {
    slug: 'reviews',
    sourceLabel: 'Reviews',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Review'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled Review')
      const references: MediaUsageReference[] = []

      pushIfMatched({
        mediaID,
        reference: createCollectionReference({
          doc,
          documentLabel,
          fieldPath: 'featuredImage',
          slug: 'reviews',
        }),
        references,
        value: doc.featuredImage as RelationshipValue,
      })

      pushIfMatched({
        mediaID,
        reference: createCollectionReference({
          doc,
          documentLabel,
          fieldPath: 'ogImage',
          slug: 'reviews',
        }),
        references,
        value: doc.ogImage as RelationshipValue,
      })

      return references
    },
  },
  {
    slug: 'news-events',
    sourceLabel: 'News & Events',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled News & Event Entry'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled News & Event Entry')
      const references: MediaUsageReference[] = []

      for (const fieldPath of ['featuredImage', 'ogImage'] as const) {
        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath,
            slug: 'news-events',
          }),
          references,
          value: doc[fieldPath] as RelationshipValue,
        })
      }

      return references
    },
  },
  {
    slug: 'gallery-albums',
    sourceLabel: 'Gallery Albums',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Gallery Album'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled Gallery Album')
      const references: MediaUsageReference[] = []
      const images = Array.isArray(doc.images) ? doc.images : []

      images.forEach((row, index) => {
        if (!row || typeof row !== 'object') {
          return
        }

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `images[${index}].image`,
            slug: 'gallery-albums',
          }),
          references,
          value: row.image as RelationshipValue,
        })
      })

      return references
    },
  },
  {
    slug: 'headers',
    sourceLabel: 'Headers',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Header'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled Header')
      const references: MediaUsageReference[] = []
      const layout = Array.isArray(doc.layout) ? doc.layout : []

      layout.forEach((block, blockIndex) => {
        if (
          !block ||
          typeof block !== 'object' ||
          block === null ||
          block.blockType !== 'headerNavbar12'
        ) {
          return
        }

        if (block.logoMode !== 'customLogo') {
          return
        }

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `layout[${blockIndex}].customLogoLight`,
            slug: 'headers',
          }),
          references,
          value: block.customLogoLight as RelationshipValue,
        })

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `layout[${blockIndex}].customLogoDark`,
            slug: 'headers',
          }),
          references,
          value: block.customLogoDark as RelationshipValue,
        })
      })

      return references
    },
  },
  {
    slug: 'footers',
    sourceLabel: 'Footers',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled Footer'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled Footer')
      const references: MediaUsageReference[] = []
      const layout = Array.isArray(doc.layout) ? doc.layout : []

      layout.forEach((block, blockIndex) => {
        if (
          !block ||
          typeof block !== 'object' ||
          block === null ||
          block.blockType !== 'footer56'
        ) {
          return
        }

        if (block.logoMode !== 'customLogo') {
          return
        }

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `layout[${blockIndex}].customLogoLight`,
            slug: 'footers',
          }),
          references,
          value: block.customLogoLight as RelationshipValue,
        })

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `layout[${blockIndex}].customLogoDark`,
            slug: 'footers',
          }),
          references,
          value: block.customLogoDark as RelationshipValue,
        })
      })

      return references
    },
  },
  {
    slug: 'system-pages',
    sourceLabel: 'System Pages',
    getDocumentLabel: (doc) => getTextValue(doc.title, 'Untitled System Page'),
    resolve: (doc, mediaID) => {
      const documentLabel = getTextValue(doc.title, 'Untitled System Page')
      const references: MediaUsageReference[] = []
      const layout = Array.isArray(doc.layout) ? doc.layout : []

      layout.forEach((block, blockIndex) => {
        if (!block || typeof block !== 'object' || block === null) {
          return
        }

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `layout[${blockIndex}].image`,
            slug: 'system-pages',
          }),
          references,
          value: block.image as RelationshipValue,
        })
      })

      return references
    },
  },
]

const globalSources: GlobalUsageSource[] = [
  {
    slug: 'news-events-detail-template',
    sourceLabel: 'News & Events Detail Template',
    resolve: (doc, mediaID) => {
      const references: MediaUsageReference[] = []
      const header = asRecord(doc.header)

      pushIfMatched({
        mediaID,
        reference: createGlobalReference({
          documentLabel: 'News & Events Detail Template',
          fieldPath: 'header.backgroundImage',
          slug: 'news-events-detail-template',
        }),
        references,
        value: header.backgroundImage as RelationshipValue,
      })

      return references
    },
  },
  {
    slug: 'site-settings',
    sourceLabel: 'Site Identity',
    resolve: (doc, mediaID) => {
      const references: MediaUsageReference[] = []

      pushIfMatched({
        mediaID,
        reference: createGlobalReference({
          documentLabel: 'Site Identity',
          fieldPath: 'logo',
          slug: 'site-settings',
        }),
        references,
        value: doc.logo as RelationshipValue,
      })

      pushIfMatched({
        mediaID,
        reference: createGlobalReference({
          documentLabel: 'Site Identity',
          fieldPath: 'favicon',
          slug: 'site-settings',
        }),
        references,
        value: doc.favicon as RelationshipValue,
      })

      return references
    },
  },
  {
    slug: 'seo-settings',
    sourceLabel: 'SEO & Metadata',
    resolve: (doc, mediaID) => {
      const references: MediaUsageReference[] = []

      pushIfMatched({
        mediaID,
        reference: createGlobalReference({
          documentLabel: 'SEO & Metadata',
          fieldPath: 'defaultImage',
          slug: 'seo-settings',
        }),
        references,
        value: doc.defaultImage as RelationshipValue,
      })

      return references
    },
  },
]

export const findMediaUsage = async ({
  mediaID,
  payload,
}: {
  mediaID: number | string
  payload: PayloadLike
}): Promise<MediaUsageReference[]> => {
  const references: MediaUsageReference[] = []
  const find = payload.find as (args: {
    collection: string
    depth: number
    limit: number
    overrideAccess: boolean
    pagination: boolean
  }) => Promise<{ docs: Record<string, unknown>[] }>
  const findGlobal = payload.findGlobal as (args: {
    slug: string
    depth: number
    overrideAccess: boolean
  }) => Promise<Record<string, unknown> | null>

  for (const source of collectionSources) {
    const result = await find({
      collection: source.slug,
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
    })

    for (const doc of result.docs) {
      references.push(...source.resolve(doc, mediaID))
    }
  }

  for (const source of globalSources) {
    const doc = await findGlobal({
      slug: source.slug,
      depth: 0,
      overrideAccess: true,
    })

    if (!doc) {
      continue
    }

    references.push(...source.resolve(doc, mediaID))
  }

  return references
}

export const buildMediaUsageSummary = (references: MediaUsageReference[]): string => {
  if (references.length === 0) {
    return 'Unused asset.'
  }

  const uniqueEntries = new Set(
    references.map((reference) =>
      reference.sourceType === 'global'
        ? `${reference.sourceType}:${reference.sourceSlug}`
        : `${reference.sourceType}:${reference.sourceSlug}:${reference.documentID ?? 'unknown'}`,
    ),
  )

  const locationCount = references.length
  const entryCount = uniqueEntries.size
  const locationLabel = locationCount === 1 ? 'location' : 'locations'
  const entryLabel = entryCount === 1 ? 'entry' : 'entries'

  return `Used in ${locationCount} ${locationLabel} across ${entryCount} ${entryLabel}.`
}

export const formatMediaUsageLocation = (reference: MediaUsageReference): string =>
  reference.locationLabel

export const mediaUsageAdminFieldConfig: Field[] = [
  {
    name: 'usageSummary',
    type: 'text',
    virtual: true,
    access: {
      read: featureFieldReadAccess('media'),
    },
    admin: {
      description: 'Read-only usage overview derived from supported media relationship fields.',
      readOnly: true,
    },
  },
  {
    name: 'usageDetails',
    type: 'json',
    virtual: true,
    access: {
      read: featureFieldReadAccess('media'),
    },
    admin: {
      description: 'Read-only structured list of supported collection and global usage locations.',
      readOnly: true,
    },
  },
]
