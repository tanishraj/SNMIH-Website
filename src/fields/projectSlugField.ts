import {
  APIError,
  slugField,
  type CollectionSlug,
  type FieldHook,
  type RowField,
  type TextField,
} from 'payload'

const DUPLICATE_SUFFIX = /(?:-copy(?:-\d+)?)+$/
const MAX_DUPLICATE_ATTEMPTS = 1_000

type ProjectSlugFieldArgs = Omit<NonNullable<Parameters<typeof slugField>[0]>, 'slugify'>

type SlugTextField = TextField & {
  custom?: TextField['custom'] & {
    slugify?: unknown
  }
}

export const normalizeProjectSlug = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || undefined
}

const createDuplicateSlug: FieldHook = async ({ collection, req, value }) => {
  const normalized = normalizeProjectSlug(value)

  if (!normalized) return undefined

  const base = normalized.replace(DUPLICATE_SUFFIX, '') || normalized

  if (!collection) return `${base}-copy`

  for (let attempt = 1; attempt <= MAX_DUPLICATE_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 1 ? `${base}-copy` : `${base}-copy-${attempt}`
    const result = await req.payload.find({
      collection: collection.slug as CollectionSlug,
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      where: {
        slug: {
          equals: candidate,
        },
      },
    })

    if (result.docs.length === 0) return candidate
  }

  throw new APIError(
    `Unable to create a unique duplicate slug after ${MAX_DUPLICATE_ATTEMPTS} attempts.`,
    409,
  )
}

const isSlugTextField = (field: RowField['fields'][number], name: string): field is SlugTextField =>
  'name' in field && field.name === name && field.type === 'text'

export const projectSlugField = (args: ProjectSlugFieldArgs = {}): RowField => {
  const { name = 'slug', overrides, ...rest } = args

  return slugField({
    ...rest,
    name,
    overrides: (row) => {
      const configuredRow = overrides?.(row) ?? row
      const slug = configuredRow.fields.find((field) => isSlugTextField(field, name))

      if (!slug) {
        throw new Error(`Expected Payload slugField to include the "${name}" text field.`)
      }

      slug.hooks = {
        ...slug.hooks,
        beforeDuplicate: [createDuplicateSlug],
      }

      return configuredRow
    },
    slugify: ({ valueToSlugify }) => normalizeProjectSlug(valueToSlugify),
  })
}
