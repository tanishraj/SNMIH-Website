import type { Field } from 'payload'

export const createCmsLinkFields = (): Field[] => {
  return [
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'navigation-links',
      admin: {
        description:
          'Select a reusable link. Save target pages first so their synced links exist in the Links collection.',
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
    },
  ]
}
