import type { CollectionBeforeDeleteHook } from 'payload'

import { findMediaUsage, formatMediaUsageLocation } from '@/lib/mediaUsage'

const formatUsageList = (locations: string[]): string => locations.join('; ')

export const preventMediaDeletionWhileInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const mediaID = typeof id === 'number' || typeof id === 'string' ? id : null

  if (mediaID == null) {
    return
  }

  const references = await findMediaUsage({
    mediaID,
    payload: req.payload,
  })

  if (references.length === 0) {
    return
  }

  throw new Error(
    `Cannot delete media asset because it is still referenced in: ${formatUsageList(
      references.map(formatMediaUsageLocation),
    )}`,
  )
}
