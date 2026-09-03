import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { getTestUserDocument } from './seedUser'

const homepageSlug = 'e2e-homepage'

const homepagePageData = {
  _status: 'published' as const,
  layout: [
    {
      appearance: {
        background: 'none' as const,
        border: 'none' as const,
      },
      blockType: 'announcement' as const,
      displayMode: 'vertical' as const,
      intervalMs: 4000,
      items: [
        {
          description: 'E2E Homepage Description',
          title: 'E2E Homepage Heading',
        },
      ],
    },
    {
      actions: [
        {
          label: 'Get started',
          linkType: 'custom' as const,
          url: '/getting-started',
          variant: 'default' as const,
        },
      ],
      appearance: {
        background: 'subtle' as const,
        border: 'topAndBottom' as const,
      },
      contentAlignment: 'center' as const,
      description: 'Use this section as a quick call-to-action at the end of the page.',
      headerLayout: 'stacked' as const,
      size: 'compact' as const,
      blockType: 'cta39' as const,
      title: 'Ready to explore more?',
    },
  ],
  metaDescription: 'Seeded homepage description',
  metaTitle: 'E2E Homepage',
  slug: homepageSlug,
  title: 'E2E Homepage',
}

export async function seedHomepage(): Promise<void> {
  const payload = await getPayload({ config })
  const user = await getTestUserDocument()

  await payload.delete({
    collection: 'pages',
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: homepageSlug,
      },
    },
  })

  const page = await payload.create({
    collection: 'pages',
    data: homepagePageData,
    overrideAccess: false,
    user,
  })

  await payload.updateGlobal({
    data: {
      homepage: page.id,
    },
    overrideAccess: false,
    slug: 'page-settings',
    user,
  })
}

export async function cleanupHomepage(): Promise<void> {
  const payload = await getPayload({ config })
  const user = await getTestUserDocument()

  await payload.updateGlobal({
    data: {
      homepage: null,
    },
    overrideAccess: false,
    slug: 'page-settings',
    user,
  })

  await payload.delete({
    collection: 'pages',
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: homepageSlug,
      },
    },
  })
}
