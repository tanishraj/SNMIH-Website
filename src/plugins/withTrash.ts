import type { Config, Plugin } from 'payload'

type WithTrashOptions = {
  exclude?: string[]
}

export const withTrash =
  ({ exclude = [] }: WithTrashOptions = {}): Plugin =>
  (config: Config): Config => {
    const excludedSlugs = new Set(exclude)

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (excludedSlugs.has(collection.slug) || typeof collection.trash === 'boolean') {
          return collection
        }

        return {
          ...collection,
          trash: true,
        }
      }),
    }
  }
