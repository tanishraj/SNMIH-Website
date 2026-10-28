import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type Field,
} from 'payload'
import { revalidatePagesCache } from '@/hooks/revalidateCmsContent'

export const editorName = (user: unknown): string => {
  if (
    user &&
    typeof user === 'object' &&
    'publicDisplayName' in user &&
    typeof user.publicDisplayName === 'string' &&
    user.publicDisplayName.trim()
  )
    return user.publicDisplayName.trim()
  return user ? 'Editorial team' : 'System import'
}
export const updateFields: Field[] = [
  {
    name: 'publicUpdatedAt',
    type: 'date',
    admin: { readOnly: true, position: 'sidebar' },
    access: { create: () => false, update: () => false },
  },
  {
    name: 'publicUpdatedBy',
    type: 'text',
    admin: { readOnly: true, position: 'sidebar' },
    access: { create: () => false, update: () => false },
  },
]
const id = (v: unknown): string =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String(v.id) : ''
/** A record always belongs to its period's dataset, so the dataset follows the chosen period. */
export const deriveRecordDataset: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const period = id(data?.period ?? originalDoc?.period)
  if (!data || !period || data.dataset || originalDoc?.dataset) return data
  const parent = await req.payload.findByID({
    collection: 'disclosure-periods',
    id: period,
    depth: 0,
    draft: true,
    joins: false,
    req,
    overrideAccess: false,
    user: req.user,
  })
  return { ...data, dataset: id(parent.dataset) }
}
export const validateDisclosureScope: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  collection,
}) => {
  const dataset = id(data.dataset ?? originalDoc?.dataset)
  if (originalDoc?.dataset && dataset !== id(originalDoc.dataset))
    throw new APIError('A historical record cannot be moved to another dataset.', 400)
  if (collection.slug === 'disclosure-records') {
    const period = id(data.period ?? originalDoc?.period)
    if (originalDoc?.period && period !== id(originalDoc.period))
      throw new APIError('Create a new record for a different reporting period.', 400)
    if (!period && (data._status ?? originalDoc?._status) !== 'published') return data
    const parent = await req.payload.findByID({
      collection: 'disclosure-periods',
      id: period,
      depth: 0,
      req,
      overrideAccess: false,
      user: req.user,
      draft: true,
    })
    if (id(parent.dataset) !== dataset)
      throw new APIError('Reporting period must belong to the selected dataset.', 400)
  }
  return data
}
export const stampDisclosure: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  collection,
}) => {
  if (originalDoc?.id) {
    // The latest draft can differ from the published base document, including during unpublish.
    const stored = await req.payload.findByID({
      collection: collection.slug as 'disclosure-records' | 'disclosure-periods',
      id: originalDoc.id,
      draft: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    req.context[`disclosurePublished:${collection.slug}:${originalDoc.id}`] =
      stored._status === 'published'
  }
  if ((data._status ?? originalDoc?._status) === 'published') {
    return {
      ...data,
      publicUpdatedAt: new Date().toISOString(),
      publicUpdatedBy: editorName(req.user),
    }
  }
  return data
}
export const touchDisclosureDataset: CollectionAfterChangeHook = async (args) => {
  const { doc, previousDoc, req, context } = args
  // A draft save does not advance public metadata. Explicit unpublication does.
  const wasPublished =
    context[`disclosurePublished:${args.collection.slug}:${doc.id}`] === true ||
    previousDoc?._status === 'published'
  if (doc._status !== 'published' && !wasPublished) return doc
  if (doc._status !== 'published') {
    const stored = await req.payload.findByID({
      collection: args.collection.slug as 'disclosure-records' | 'disclosure-periods',
      id: doc.id,
      draft: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (stored._status === 'published') return doc
  }
  if (args.collection.slug === 'disclosure-records') {
    const parent = await req.payload.findByID({
      collection: 'disclosure-periods',
      id: id(doc.period),
      draft: false,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (parent._status !== 'published') return doc
  }
  await req.payload.update({
    collection: 'disclosure-datasets',
    id: id(doc.dataset),
    req,
    overrideAccess: true,
    data: { publicUpdatedAt: new Date().toISOString(), publicUpdatedBy: editorName(req.user) },
    context: { ...context, disclosureRevision: true },
  })
  return revalidatePagesCache({
    ...args,
    previousDoc: wasPublished ? { ...previousDoc, _status: 'published' } : previousDoc,
  })
}

// Only the containing document being saved is visited; relationship documents have their own hooks.
export function stampDisclosureLayout(
  data: Record<string, unknown>,
  original: Record<string, unknown> | null | undefined,
  user: unknown,
) {
  const layout = Object.hasOwn(data, 'layout') ? data.layout : original?.layout
  if ((data._status ?? original?._status) !== 'published' || !Array.isArray(layout)) return data
  return {
    ...data,
    layout: layout.map((block) =>
      block?.blockType === 'disclosureProforma'
        ? { ...block, publicUpdatedAt: new Date().toISOString(), publicUpdatedBy: editorName(user) }
        : block,
    ),
  }
}
export const stampPageDisclosures: CollectionBeforeChangeHook = ({ data, originalDoc, req }) =>
  stampDisclosureLayout(data, originalDoc, req.user)
