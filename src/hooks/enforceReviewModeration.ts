import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { hasFeature } from '@/access/featureAccess'
import { PERMISSIONS_MIGRATION_CONTEXT } from '@/hooks/enforcePublicationPolicy'

export const TRUSTED_REVIEW_PROMOTION_CONTEXT = 'validated-public-review-promotion' as const

type ReviewModerationDocument = {
  id?: number | string | null
  _status?: 'draft' | 'published' | null
  moderatedAt?: string | null
  moderatedBy?: number | string | null
  moderationStatus?: 'pending' | 'approved' | 'rejected' | null
  publishedAt?: string | null
  publishedBy?: number | string | null
  sourceSubmission?: number | string | { id?: number | string | null } | null
}

const relationshipID = (value: ReviewModerationDocument['sourceSubmission']) => {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && value.id != null) return String(value.id)
  return null
}

const userID = (user: unknown): number | string | null => {
  if (!user || typeof user !== 'object' || !('id' in user)) return null
  const id = user.id
  return typeof id === 'number' || typeof id === 'string' ? id : null
}

export const enforceReviewModeration: CollectionBeforeChangeHook = async ({
  context,
  data,
  originalDoc,
  req,
}) => {
  const next = { ...((data ?? {}) as ReviewModerationDocument) }
  const original = (originalDoc ?? {}) as ReviewModerationDocument
  const trustedPromotion = context?.trustedReviewPromotion === TRUSTED_REVIEW_PROMOTION_CONTEXT
  const trustedMigration = context?.permissionsMigration === PERMISSIONS_MIGRATION_CONTEXT

  const originalSource = relationshipID(original.sourceSubmission)
  const submittedSource = relationshipID(next.sourceSubmission)
  const sourceWasSubmitted = Object.prototype.hasOwnProperty.call(next, 'sourceSubmission')

  if (trustedPromotion) {
    if (!submittedSource) throw new APIError('Review promotion requires a source submission.', 400)
    next._status = 'draft'
    next.moderationStatus = 'pending'
    next.moderatedAt = null
    next.moderatedBy = null
    return next
  }

  if (!trustedMigration && sourceWasSubmitted && submittedSource !== originalSource) {
    throw new APIError('The source submission cannot be changed.', 400)
  }

  const source = originalSource ?? submittedSource
  if (!source) {
    delete next.moderationStatus
    return next
  }

  if (trustedMigration) return next

  const previousStatus = original.moderationStatus ?? 'pending'
  const nextStatus = next.moderationStatus ?? previousStatus
  const decisionChanged = nextStatus !== previousStatus

  if (decisionChanged && !hasFeature(req.user, 'reviews')) {
    throw new APIError('Review moderation requires access to Reviews.', 403)
  }

  if (decisionChanged && (nextStatus === 'approved' || nextStatus === 'rejected')) {
    const now = new Date().toISOString()
    const actor = userID(req.user)
    next.moderatedAt = now
    next.moderatedBy = actor

    if (nextStatus === 'approved') {
      next._status = 'published'
      next.publishedAt = now
      next.publishedBy = actor
    } else {
      next._status = 'draft'
    }
  } else if (decisionChanged && nextStatus === 'pending') {
    next._status = 'draft'
    next.moderatedAt = null
    next.moderatedBy = null
  }

  const effectiveStatus = next.moderationStatus ?? original.moderationStatus ?? 'pending'
  const effectiveDocumentStatus = next._status ?? original._status ?? 'draft'
  if (effectiveDocumentStatus === 'published' && effectiveStatus !== 'approved') {
    throw new APIError('A submitted Review must be approved before publication.', 400)
  }

  return next
}
