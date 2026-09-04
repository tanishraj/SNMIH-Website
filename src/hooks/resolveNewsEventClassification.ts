import { APIError, type CollectionBeforeValidateHook, type PayloadRequest } from 'payload'

import {
  type LegacyNewsEventClassification,
  normalizeNewsEventClassificationRecord,
  type NewsEventClassificationBehavior,
  type ResolvedNewsEventClassification,
} from '@/lib/newsEventClassifications'

export const NEWS_EVENT_CLASSIFICATION_BEHAVIOR_CONTEXT_KEY =
  'newsEventClassificationBehavior' as const

type NewsEventEntryData = Record<string, unknown>

const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key)

const getRelationshipID = (value: unknown): string | null => {
  const normalized = normalizeNewsEventClassificationRecord(value)
  if (normalized) return normalized.id

  if (typeof value !== 'string' && typeof value !== 'number') return null

  const id = String(value).trim()
  return id || null
}

const getLegacyValue = (value: unknown): LegacyNewsEventClassification | null => {
  if (
    value === 'news' ||
    value === 'event' ||
    value === 'notice' ||
    value === 'holiday' ||
    value === 'achievement' ||
    value === 'announcement' ||
    value === 'other'
  ) {
    return value
  }

  return null
}

const resolveByID = async (
  id: string,
  req: PayloadRequest,
): Promise<ResolvedNewsEventClassification | null> => {
  try {
    const record = await req.payload.findByID({
      collection: 'news-event-classifications',
      depth: 0,
      id,
      overrideAccess: false,
      req,
    })

    return normalizeNewsEventClassificationRecord(record)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      (error as { status?: unknown }).status === 404
    ) {
      return null
    }

    throw error
  }
}

const resolveLegacyValue = async (
  legacyValue: LegacyNewsEventClassification,
  req: PayloadRequest,
): Promise<ResolvedNewsEventClassification | null> => {
  const result = await req.payload.find({
    collection: 'news-event-classifications',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    where: { legacyValue: { equals: legacyValue } },
  })

  return normalizeNewsEventClassificationRecord(result.docs[0])
}

const getEffectiveValue = (
  data: NewsEventEntryData,
  originalDoc: NewsEventEntryData,
  key: string,
): unknown => (hasOwn(data, key) ? data[key] : originalDoc[key])

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const validateEventFields = (data: NewsEventEntryData, originalDoc: NewsEventEntryData): void => {
  const eventStart = parseDate(getEffectiveValue(data, originalDoc, 'eventStart'))
  if (!eventStart) {
    throw new APIError('Event Start is required for Event entries.', 400)
  }

  const eventLocation = getEffectiveValue(data, originalDoc, 'eventLocation')
  if (typeof eventLocation !== 'string' || !eventLocation.trim()) {
    throw new APIError('Event Location is required for Event entries.', 400)
  }

  const rawEventEnd = getEffectiveValue(data, originalDoc, 'eventEnd')
  if (rawEventEnd === null || rawEventEnd === undefined || rawEventEnd === '') {
    const isFeatured = getEffectiveValue(data, originalDoc, 'featuredInHighlights') === true
    const isAllDay = getEffectiveValue(data, originalDoc, 'eventAllDay') === true

    if (isFeatured && !isAllDay) {
      throw new APIError('Event End is required when a timed Event is featured in Highlights.', 400)
    }

    return
  }

  const eventEnd = parseDate(rawEventEnd)
  if (!eventEnd) {
    throw new APIError('Enter a valid Event End date.', 400)
  }

  if (eventEnd.getTime() < eventStart.getTime()) {
    throw new APIError('Event End cannot be earlier than Event Start.', 400)
  }
}

export const clearNewsEventEventFields = (data: NewsEventEntryData): NewsEventEntryData => {
  data.eventStart = null
  data.eventEnd = null
  data.eventAllDay = null
  data.featuredInHighlights = false
  data.eventLocation = null
  data.eventRegistrationAction = []

  return data
}

export const getNewsEventClassificationBehavior = (
  req: Pick<PayloadRequest, 'context'>,
): NewsEventClassificationBehavior | null => {
  const behavior = req.context?.[NEWS_EVENT_CLASSIFICATION_BEHAVIOR_CONTEXT_KEY]
  return behavior === 'event' || behavior === 'story' ? behavior : null
}

export const resolveNewsEventClassification: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const entryData = data as NewsEventEntryData
  const previousData = (originalDoc ?? {}) as NewsEventEntryData
  const classificationWasSubmitted = hasOwn(entryData, 'classification')
  const submittedValue = classificationWasSubmitted
    ? entryData.classification
    : previousData.classification
  const submittedID = getRelationshipID(submittedValue)
  let resolved = submittedID ? await resolveByID(submittedID, req) : null

  if (
    !resolved &&
    operation === 'update' &&
    !classificationWasSubmitted &&
    !getRelationshipID(previousData.classification)
  ) {
    const legacyValue = getLegacyValue(previousData.contentType)
    if (legacyValue) {
      resolved = await resolveLegacyValue(legacyValue, req)
    }
  }

  if (!resolved) {
    throw new APIError('Select an Entry Classification.', 400)
  }

  const originalClassificationID = getRelationshipID(previousData.classification)
  const relationshipIsUnchanged = operation === 'update' && originalClassificationID === resolved.id

  if (!resolved.active && !relationshipIsUnchanged) {
    throw new APIError('The selected Entry Classification is archived.', 400)
  }

  entryData.classification = resolved.id
  req.context ??= {}
  req.context[NEWS_EVENT_CLASSIFICATION_BEHAVIOR_CONTEXT_KEY] = resolved.behavior

  if (resolved.behavior === 'event') {
    validateEventFields(entryData, previousData)
  } else {
    clearNewsEventEventFields(entryData)
  }

  return data
}
