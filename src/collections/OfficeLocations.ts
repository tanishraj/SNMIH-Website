import type { CollectionConfig } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { revalidateGlobalsCache } from '@/hooks/revalidateCmsContent'
import { validateHttpsUrl } from '@/lib/siteOfficesShared'

export const OfficeLocations: CollectionConfig = {
  slug: 'office-locations',
  labels: {
    singular: 'Office Location',
    plural: 'Office Locations',
  },
  admin: {
    group: 'Site Structure',
    hidden: hideUnlessFeature('officeLocations'),
    useAsTitle: 'city',
    defaultColumns: ['city', 'region', '_status', 'updatedAt'],
    description:
      'Office locations used by Regional Offices (Contact24) blocks. Each entry can be placed on any page independently.',
    listSearchableFields: ['city', 'region'],
  },
  access: {
    create: requireFeature('officeLocations'),
    delete: deleteFeatureOrAdmin('officeLocations'),
    read: allowPublishedReadOrFeature('officeLocations'),
    readVersions: requireFeature('officeLocations'),
    update: requireFeature('officeLocations'),
  },
  hooks: {
    afterChange: [revalidateGlobalsCache],
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields: [
    {
      name: 'city',
      type: 'text',
      required: true,
    },
    {
      name: 'region',
      label: 'Region / Country',
      type: 'text',
      admin: {
        description: 'e.g. "North America", "Middle East", "India"',
      },
    },
    {
      name: 'showAddressDetails',
      label: 'Show Address Details',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'When unchecked only the interactive map is shown — address, phone and email are hidden.',
      },
    },
    {
      name: 'address',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.showAddressDetails !== false,
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.showAddressDetails !== false,
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        condition: (_, siblingData) => siblingData?.showAddressDetails !== false,
      },
    },
    {
      name: 'mapEmbedUrl',
      label: 'Interactive Map Embed URL',
      type: 'text',
      required: true,
      validate: validateHttpsUrl,
      admin: {
        description: 'Paste the HTTPS embed URL from Google Maps / other map provider.',
      },
    },
    {
      name: 'mapUrl',
      label: 'External Map URL',
      type: 'text',
      required: true,
      validate: validateHttpsUrl,
      admin: {
        description: 'Full HTTPS URL opened when the visitor clicks "View on Map".',
      },
    },
    {
      name: 'mapTitle',
      label: 'Accessible Map Title',
      type: 'text',
      admin: {
        description:
          'Screen-reader title for the map iframe, e.g. "Interactive map for the Dubai office".',
        condition: (_, siblingData) => siblingData?.showAddressDetails !== false,
      },
    },
  ],
}
