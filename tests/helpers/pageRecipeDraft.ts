import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

export const recipeE2ETitle = 'E2E Landing Recipe'

export async function cleanupPageRecipeDraft(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'pages',
    overrideAccess: true,
    where: {
      title: {
        equals: recipeE2ETitle,
      },
    },
  })
}
