import type { CollectionBeforeChangeHook } from 'payload'

const toRelationshipID = (
  value: number | string | { id?: number | string } | null | undefined,
): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && (typeof value.id === 'number' || typeof value.id === 'string')) {
    return value.id
  }

  return null
}

export const syncPrimaryCategoryMembership: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  if (!data) {
    return data
  }

  const primaryCategoryID = toRelationshipID(
    (data.primaryCategory as number | string | { id?: number | string } | null | undefined) ??
      (originalDoc?.primaryCategory as number | string | { id?: number | string } | null | undefined),
  )

  if (primaryCategoryID == null) {
    return data
  }

  const currentCategories = Array.isArray(data.categories)
    ? data.categories
    : Array.isArray(originalDoc?.categories)
      ? originalDoc.categories
      : []

  const categoryIDs = currentCategories
    .map((category: number | string | { id?: number | string } | null) =>
      toRelationshipID(category),
    )
    .filter((categoryID: number | string | null): categoryID is number | string => categoryID != null)

  if (!categoryIDs.includes(primaryCategoryID)) {
    categoryIDs.unshift(primaryCategoryID)
  }

  data.categories = Array.from(new Set(categoryIDs))

  return data
}
