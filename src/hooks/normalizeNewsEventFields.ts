import type { CollectionBeforeChangeHook } from 'payload'

import {
  clearNewsEventEventFields,
  getNewsEventClassificationBehavior,
} from '@/hooks/resolveNewsEventClassification'

export const normalizeNewsEventFields: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data || getNewsEventClassificationBehavior(req) !== 'story') return data

  return clearNewsEventEventFields(data)
}
