import type { CollectionBeforeChangeHook } from 'payload'

type FormSubmissionActivityDoc = {
  id: number | string
  internalNotes?: string | null
  lastActionAt?: string | null
  owner?: number | { id?: number | null } | null
  status?: string | null
}

const normalizeOwnerID = (value: FormSubmissionActivityDoc['owner']): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (value && typeof value === 'object' && typeof value.id === 'number' && Number.isFinite(value.id)) {
    return value.id
  }

  return null
}

const normalizeNotes = (value: string | null | undefined): string => {
  return typeof value === 'string' ? value.trim() : ''
}

export const updateFormSubmissionActivity: CollectionBeforeChangeHook<FormSubmissionActivityDoc> = async ({
  data,
  operation,
  originalDoc,
}) => {
  if (operation !== 'update' || !data) {
    return data
  }

  const nextStatus = data.status ?? originalDoc?.status ?? null
  const previousStatus = originalDoc?.status ?? null
  const nextOwnerID = data.owner === undefined ? normalizeOwnerID(originalDoc?.owner) : normalizeOwnerID(data.owner)
  const previousOwnerID = normalizeOwnerID(originalDoc?.owner)
  const nextNotes =
    data.internalNotes === undefined
      ? normalizeNotes(originalDoc?.internalNotes)
      : normalizeNotes(data.internalNotes)
  const previousNotes = normalizeNotes(originalDoc?.internalNotes)

  if (
    nextStatus !== previousStatus ||
    nextOwnerID !== previousOwnerID ||
    nextNotes !== previousNotes
  ) {
    data.lastActionAt = new Date().toISOString()
  }

  return data
}
