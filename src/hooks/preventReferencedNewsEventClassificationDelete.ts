import { APIError, type CollectionBeforeDeleteHook } from 'payload'

import { findNewsEventClassificationReference } from '@/hooks/newsEventClassificationReferences'

const REFERENCE_LABELS = {
  'news-events': 'News & Events entry',
  'news-events-detail-template': 'News & Events Detail Page',
  pages: 'Page',
  'reusable-sections': 'Reusable Section',
} as const

const formatReferenceLabel = (
  reference: NonNullable<Awaited<ReturnType<typeof findNewsEventClassificationReference>>>,
): string => {
  const resourceLabel = REFERENCE_LABELS[reference.collection]
  const title =
    reference.collection === 'news-events-detail-template'
      ? ''
      : reference.title
        ? ` “${reference.title}”`
        : ''

  return `${resourceLabel}${title} (ID: ${String(reference.id)})`
}

export const preventReferencedNewsEventClassificationDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  if (id == null) return

  const reference = await findNewsEventClassificationReference({
    classificationID: id,
    req,
  })

  if (reference) {
    throw new APIError(
      `Cannot delete this classification because it is still used by ${formatReferenceLabel(reference)}. Remove or replace that reference, then try again. To keep the classification without allowing new selections, archive it instead.`,
      409,
    )
  }
}
