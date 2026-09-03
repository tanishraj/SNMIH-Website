import type { PayloadRequest } from 'payload'

import type { LegacyNewsEventClassification } from '@/lib/newsEventClassifications'

const REFERENCE_SCAN_PAGE_SIZE = 100

type ReferenceSource = 'news-events' | 'news-events-detail-template' | 'pages' | 'reusable-sections'

export type NewsEventClassificationReference = {
  collection: ReferenceSource
  id: number | string
  title?: string
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeID = (value: unknown): string | null => {
  if (typeof value === 'number') return String(value)
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  return normalized || null
}

const getRelationshipID = (value: unknown): string | null => {
  const directID = normalizeID(value)
  if (directID) return directID
  if (!isRecord(value)) return null

  return normalizeID(value.id) ?? normalizeID(value.value)
}

const getReferenceTitle = (value: unknown): string | undefined => {
  if (!isRecord(value) || typeof value.title !== 'string') return undefined

  const title = value.title.replace(/\s+/g, ' ').trim()
  if (!title) return undefined

  return title.length > 120 ? `${title.slice(0, 117)}…` : title
}

const relationshipSelectionIncludes = (value: unknown, classificationID: string): boolean => {
  const values = Array.isArray(value) ? value : [value]

  return values.some((item) => getRelationshipID(item) === classificationID)
}

const layoutReferencesClassification = ({
  classificationID,
  legacyValue,
  value,
}: {
  classificationID: string
  legacyValue: LegacyNewsEventClassification | null
  value: unknown
}): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) =>
      layoutReferencesClassification({ classificationID, legacyValue, value: item }),
    )
  }

  if (!isRecord(value)) return false

  if (
    (value.blockType === 'calendar' ||
      value.blockType === 'annualCalendar' ||
      value.blockType === 'newsEventsHighlights' ||
      value.blockType === 'newsEventsTabs') &&
    relationshipSelectionIncludes(value.classifications, classificationID)
  ) {
    return true
  }

  return Object.values(value).some((item) =>
    layoutReferencesClassification({ classificationID, legacyValue, value: item }),
  )
}

const newsEventReferencesClassification = ({
  classificationID,
  doc,
  legacyValue,
}: {
  classificationID: string
  doc: unknown
  legacyValue: LegacyNewsEventClassification | null
}): boolean => {
  if (!isRecord(doc)) return false

  const relationshipID = getRelationshipID(doc.classification)

  return (
    relationshipID === classificationID ||
    (relationshipID === null &&
      legacyValue !== null &&
      normalizeID(doc.contentType) === legacyValue)
  )
}

const findCollectionReference = async ({
  collection,
  matches,
  req,
}: {
  collection: 'news-events' | 'pages' | 'reusable-sections'
  matches: (doc: unknown) => boolean
  req: PayloadRequest
}): Promise<NewsEventClassificationReference | null> => {
  let page = 1

  while (true) {
    const result = await req.payload.find({
      collection,
      depth: 0,
      draft: true,
      limit: REFERENCE_SCAN_PAGE_SIZE,
      overrideAccess: true,
      page,
      pagination: true,
      req,
      trash: false,
    })

    const referencedDoc = result.docs.find(matches)

    if (referencedDoc?.id != null) {
      return {
        collection,
        id: referencedDoc.id,
        title: getReferenceTitle(referencedDoc),
      }
    }

    if (!result.hasNextPage) return null

    const nextPage = typeof result.nextPage === 'number' ? result.nextPage : page + 1
    if (nextPage <= page) return null
    page = nextPage
  }
}

const resolveLegacyValue = async ({
  classificationID,
  legacyValue,
  req,
}: {
  classificationID: number | string
  legacyValue?: LegacyNewsEventClassification | null
  req: PayloadRequest
}): Promise<LegacyNewsEventClassification | null> => {
  if (legacyValue !== undefined) return legacyValue

  const classification = await req.payload.findByID({
    collection: 'news-event-classifications',
    depth: 0,
    id: classificationID,
    overrideAccess: true,
    req,
  })

  return typeof classification.legacyValue === 'string'
    ? (classification.legacyValue as LegacyNewsEventClassification)
    : null
}

export const findNewsEventClassificationReference = async ({
  classificationID,
  legacyValue: providedLegacyValue,
  req,
}: {
  classificationID: number | string
  legacyValue?: LegacyNewsEventClassification | null
  req: PayloadRequest
}): Promise<NewsEventClassificationReference | null> => {
  const normalizedClassificationID = String(classificationID)
  const legacyValue = await resolveLegacyValue({
    classificationID,
    legacyValue: providedLegacyValue,
    req,
  })

  const newsEventReference = await findCollectionReference({
    collection: 'news-events',
    matches: (doc) =>
      newsEventReferencesClassification({
        classificationID: normalizedClassificationID,
        doc,
        legacyValue,
      }),
    req,
  })
  if (newsEventReference) return newsEventReference

  for (const collection of ['pages', 'reusable-sections'] as const) {
    const reference = await findCollectionReference({
      collection,
      matches: (doc) =>
        layoutReferencesClassification({
          classificationID: normalizedClassificationID,
          legacyValue,
          value: doc,
        }),
      req,
    })

    if (reference) return reference
  }

  const detailTemplate = await req.payload.findGlobal({
    slug: 'news-events-detail-template',
    depth: 0,
    draft: true,
    overrideAccess: true,
    req,
  })

  if (
    layoutReferencesClassification({
      classificationID: normalizedClassificationID,
      legacyValue,
      value: detailTemplate,
    })
  ) {
    return {
      collection: 'news-events-detail-template',
      id: 'news-events-detail-template',
      title: 'News & Events Detail Page',
    }
  }

  return null
}
