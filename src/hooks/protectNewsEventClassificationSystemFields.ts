import { APIError, type CollectionBeforeChangeHook } from 'payload'

import { findNewsEventClassificationReference } from '@/hooks/newsEventClassificationReferences'
import type { LegacyNewsEventClassification } from '@/lib/newsEventClassifications'

const normalizeStoredValue = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  const normalized = value.trim()

  return normalized || null
}

export const protectNewsEventClassificationSystemFields: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'create') {
    const legacyValue = normalizeStoredValue(data.legacyValue)

    if (legacyValue) {
      throw new APIError('The internal compatibility value cannot be assigned manually.', 409)
    }

    return data
  }

  if (operation !== 'update' || !originalDoc) return data

  const storedLegacyValue = normalizeStoredValue(originalDoc.legacyValue)
  const nextLegacyValue =
    data.legacyValue === undefined ? storedLegacyValue : normalizeStoredValue(data.legacyValue)

  if (data.legacyValue !== undefined && nextLegacyValue !== storedLegacyValue) {
    throw new APIError(
      'The compatibility value for a seeded classification cannot be changed.',
      409,
    )
  }

  const storedBehavior = originalDoc.behavior
  const nextBehavior = data.behavior ?? storedBehavior

  if (nextBehavior === storedBehavior || originalDoc.id == null) return data

  const reference = await findNewsEventClassificationReference({
    classificationID: originalDoc.id,
    legacyValue: storedLegacyValue as LegacyNewsEventClassification | null,
    req,
  })

  if (reference) {
    throw new APIError(
      'Remove this classification from News & Events entries, Calendar blocks, Annual Calendar blocks, Highlights blocks, and Tabs blocks before changing its behavior.',
      409,
    )
  }

  return data
}
