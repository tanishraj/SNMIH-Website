type TaxonomyTermLike = {
  description?: string | null
  id: number | string
  slug: string
  title: string
}

type TaxonomyRelationshipValue = number | string | TaxonomyTermLike | null | undefined

export const getTaxonomyTerm = (
  value: TaxonomyRelationshipValue,
): TaxonomyTermLike | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (
    'id' in value &&
    (typeof value.id === 'number' || typeof value.id === 'string') &&
    'slug' in value &&
    typeof value.slug === 'string' &&
    'title' in value &&
    typeof value.title === 'string'
  ) {
    return {
      description:
        'description' in value && typeof value.description === 'string'
          ? value.description
          : null,
      id: value.id,
      slug: value.slug,
      title: value.title,
    }
  }

  return null
}

export const getTaxonomyTerms = (
  value: TaxonomyRelationshipValue | TaxonomyRelationshipValue[],
): TaxonomyTermLike[] => {
  const values = Array.isArray(value) ? value : [value]

  return values
    .map((currentValue) => getTaxonomyTerm(currentValue))
    .filter((term): term is TaxonomyTermLike => Boolean(term))
}

export const getTaxonomyRelationshipIDs = (
  value: TaxonomyRelationshipValue | TaxonomyRelationshipValue[],
): Array<number | string> => {
  const values = Array.isArray(value) ? value : [value]

  return values.flatMap((currentValue) => {
    if (typeof currentValue === 'number' || typeof currentValue === 'string') {
      return [currentValue]
    }

    const term = getTaxonomyTerm(currentValue)

    return term ? [term.id] : []
  })
}
