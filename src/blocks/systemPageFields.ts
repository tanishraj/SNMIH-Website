import type { Block, Field, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCmsLinkFields } from '@/fields/cmsLinkFields'

type SystemPageDefaults = {
  badge: string
  description: string
  heading: string
}

const actionFields: Field[] = [
  {
    name: 'label',
    type: 'text',
  },
  ...createCmsLinkFields(),
]

export const createBaseSystemPageFields = (defaults: SystemPageDefaults): Field[] => [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Content',
        fields: [
          {
            name: 'badge',
            type: 'text',
            defaultValue: defaults.badge,
          },
          {
            name: 'heading',
            type: 'text',
            required: true,
            defaultValue: defaults.heading,
          },
          {
            name: 'description',
            type: 'textarea',
            defaultValue: defaults.description,
          },
          {
            name: 'supportingNote',
            type: 'text',
          },
          {
            type: 'row',
            fields: [
              {
                name: 'primaryAction',
                type: 'group',
                admin: {
                  width: '50%',
                },
                fields: actionFields,
              },
              {
                name: 'secondaryAction',
                type: 'group',
                admin: {
                  width: '50%',
                },
                fields: actionFields,
              },
            ],
          },
        ],
      },
      {
          label: 'Theme Settings',
        fields: [createBlockAppearanceFields()],
      },
    ],
  } satisfies TabsField,
]

export const createSystemPageBlock = ({
  fields,
  pluralLabel,
  singularLabel,
  slug,
  thumbnailAdmin,
}: {
  fields: Field[]
  pluralLabel: string
  singularLabel: string
  slug: string
  thumbnailAdmin: NonNullable<Block['admin']>
}): Block => ({
  slug,
  interfaceName: `${slug.charAt(0).toUpperCase()}${slug.slice(1)}Block`,
  admin: thumbnailAdmin,
  labels: {
    singular: singularLabel,
    plural: pluralLabel,
  },
  fields,
})
