import type { Field } from 'payload'

import { robotsModeOptions, sitemapInclusionOptions } from '@/lib/seo'

type BuildSEOFieldsOptions = {
  allowOpenGraph?: boolean
  allowSitemap?: boolean
}

export const buildSEOFields = ({
  allowOpenGraph = true,
  allowSitemap = true,
}: BuildSEOFieldsOptions = {}): Field[] => {
  const fields: Field[] = [
    {
      name: 'metaTitle',
      type: 'text',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'canonicalURL',
          label: 'Canonical URL Override',
          type: 'text',
          admin: {
            description:
              'Optional. Leave empty to use the resolved public URL. Supports site-relative paths or full URLs.',
            width: allowSitemap ? '34%' : '50%',
          },
        },
        {
          name: 'robotsMode',
          type: 'select',
          defaultValue: 'default',
          options: [...robotsModeOptions],
          admin: {
            description: 'Default inherits the global robots setting.',
            width: allowSitemap ? '33%' : '50%',
          },
        },
      ],
    },
  ]

  if (allowSitemap) {
    const seoRow = fields[2]

    if (seoRow && seoRow.type === 'row') {
      seoRow.fields.push({
        name: 'includeInSitemap',
        type: 'select',
        defaultValue: 'default',
        options: [...sitemapInclusionOptions],
        admin: {
          description: 'Default includes public published routes that remain indexable.',
          width: '33%',
        },
      })
    }
  }

  if (!allowOpenGraph) {
    return fields
  }

  fields.push({
    type: 'row',
    fields: [
      {
        name: 'ogTitle',
        type: 'text',
        admin: {
          width: '50%',
        },
      },
      {
        name: 'ogImage',
        type: 'upload',
        relationTo: 'media',
        admin: {
          width: '50%',
        },
      },
    ],
  })

  fields.push({
    name: 'ogDescription',
    type: 'textarea',
  })

  return fields
}
