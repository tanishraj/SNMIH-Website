import type { CollectionConfig, Field, Where } from 'payload'
import {
  allowPublicReadOrFeature,
  canReadFeature,
  featureFieldReadAccess,
  allowPublishedReadOrFeature,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { sectionOptions } from '@/blocks/DisclosureProforma/shared'
import { uniqueKeys } from '@/blocks/DisclosureProforma/config'
import {
  copyDisclosurePeriodEndpoint,
  publishDisclosurePeriodEndpoint,
} from '@/endpoints/disclosureMonth'
import {
  deriveRecordDataset,
  stampDisclosure,
  touchDisclosureDataset,
  updateFields,
  validateDisclosureScope,
} from './hooks'

const dataset: Field = {
  name: 'dataset',
  type: 'relationship',
  relationTo: 'disclosure-datasets',
  required: true,
  index: true,
}
const valueFields: Field[] = [
  {
    name: 'valueState',
    type: 'select',
    defaultValue: 'provided',
    options: [
      { label: 'Provided', value: 'provided' },
      { label: 'Not supplied', value: 'notSupplied' },
      { label: 'Not applicable', value: 'notApplicable' },
    ],
  },
  {
    name: 'value',
    type: 'textarea',
    maxLength: 6000,
    admin: {
      condition: (_, s) => s.valueState !== 'notApplicable' && s.valueState !== 'notSupplied',
      description: 'Enter the source value exactly. A blank value is not treated as zero.',
    },
  },
]
const retained = { trash: false, timestamps: true } as const
export const DisclosureDatasets: CollectionConfig = {
  slug: 'disclosure-datasets',
  ...retained,
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    hidden: hideUnlessFeature('disclosureDatasets'),
    description:
      'A reusable disclosure directory. Historical records are retained; deletion is disabled.',
  },
  access: {
    read: allowPublicReadOrFeature('disclosureDatasets'),
    create: requireFeature('disclosureDatasets'),
    update: requireFeature('disclosureDatasets'),
    delete: () => false,
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, context }) =>
        context.disclosureRevision
          ? data
          : {
              ...data,
              publicUpdatedAt: originalDoc?.publicUpdatedAt ?? null,
              publicUpdatedBy: originalDoc?.publicUpdatedBy ?? null,
            },
    ],
  },
  fields: [{ name: 'title', type: 'text', required: true }, ...updateFields],
}
export const DisclosurePeriods: CollectionConfig = {
  slug: 'disclosure-periods',
  ...retained,
  versions: { drafts: true, maxPerDoc: 0 },
  admin: {
    useAsTitle: 'label',
    group: 'Content',
    hidden: hideUnlessFeature('disclosurePeriods'),
    defaultColumns: ['label', 'dataset', 'asOf', '_status'],
    description:
      'One reporting month and its records. Use “Copy to a new month” to start the next report; previous months remain available.',
    components: {
      edit: {
        beforeDocumentControls: [
          '@/components/admin/DisclosureMonthActions#DisclosureMonthActions',
        ],
      },
    },
  },
  // Duplicating the period alone leaves its records behind; “Copy to a new month” copies both.
  disableDuplicate: true,
  endpoints: [copyDisclosurePeriodEndpoint, publishDisclosurePeriodEndpoint],
  access: {
    read: allowPublishedReadOrFeature('disclosurePeriods'),
    create: requireFeature('disclosurePeriods'),
    update: requireFeature('disclosurePeriods'),
    delete: () => false,
    readVersions: requireFeature('disclosurePeriods'),
  },
  hooks: {
    beforeChange: [validateDisclosureScope, stampDisclosure],
    afterChange: [touchDisclosureDataset],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            dataset,
            { name: 'label', type: 'text', required: true },
            {
              name: 'asOf',
              label: 'Reporting Date',
              type: 'date',
              required: true,
              index: true,
              admin: {
                description:
                  'Orders reporting periods. This is separate from the automatic publication date.',
              },
            },
            {
              name: 'academicSession',
              type: 'text',
              admin: {
                description:
                  'Only enter a confirmed session. Course commencement is not the current session.',
              },
            },
            { name: 'source', type: 'upload', relationTo: 'media' },
            {
              name: 'sourceNote',
              type: 'textarea',
              access: { read: featureFieldReadAccess('disclosurePeriods') },
            },
          ],
        },
        {
          label: 'Records',
          description:
            'Every fact and table row reported for this month. Open a record to edit it, or add a new one here.',
          fields: [
            {
              name: 'records',
              type: 'join',
              collection: 'disclosure-records',
              on: 'period',
              defaultLimit: 50,
              defaultSort: ['section', 'groupKey', 'sortOrder'],
              admin: { defaultColumns: ['label', 'section', 'groupKey', 'sortOrder', '_status'] },
            },
          ],
        },
      ],
    },
    ...updateFields,
  ],
}
export const DisclosureRecords: CollectionConfig = {
  slug: 'disclosure-records',
  ...retained,
  versions: { drafts: true, maxPerDoc: 0 },
  admin: {
    useAsTitle: 'label',
    // Records are edited inside their reporting month, so they stay out of the sidebar.
    // Their list and edit routes remain available.
    group: false,
    hidden: hideUnlessFeature('disclosureRecords'),
    defaultColumns: ['label', 'section', 'groupKey', 'period', '_status'],
    description:
      'One fact, metric or table row per record. Use the section and group keys configured in the Disclosure Proforma block.',
  },
  access: {
    read: ({ req }): boolean | Where =>
      req.user
        ? canReadFeature(req.user, 'disclosureRecords')
        : {
            and: [
              { _status: { equals: 'published' } },
              { 'period._status': { equals: 'published' } },
            ],
          },
    create: requireFeature('disclosureRecords'),
    update: requireFeature('disclosureRecords'),
    delete: () => false,
    readVersions: requireFeature('disclosureRecords'),
  },
  indexes: [{ fields: ['dataset', 'period', 'section', 'groupKey', 'sortOrder'] }],
  hooks: {
    beforeValidate: [deriveRecordDataset],
    beforeChange: [validateDisclosureScope, stampDisclosure],
    afterChange: [touchDisclosureDataset],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              ...dataset,
              // Filled from the reporting period on save, so a record added inside a month needs
              // no dataset choice. The scope hook still rejects a mismatch.
              required: false,
              admin: { readOnly: true, description: 'Set from the reporting period.' },
            },
            {
              name: 'period',
              type: 'relationship',
              relationTo: 'disclosure-periods',
              required: true,
              index: true,
              filterOptions: ({ siblingData }) => {
                const value = (siblingData as { dataset?: string | { id: string } })?.dataset
                if (!value) return true
                return { dataset: { equals: typeof value === 'object' ? value.id : value } }
              },
            },
            {
              name: 'section',
              type: 'select',
              required: true,
              index: true,
              options: [...sectionOptions],
            },
            {
              name: 'groupKey',
              type: 'text',
              required: true,
              index: true,
              maxLength: 64,
              admin: {
                description:
                  'Match a group key in the block, e.g. highlights, monthly, programmes or register.',
              },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              maxLength: 300,
              admin: {
                description: 'Fact / metric label, or a descriptive title for a table row.',
              },
            },
            { name: 'sortOrder', type: 'number', defaultValue: 0, required: true },
            {
              name: 'rowType',
              type: 'select',
              defaultValue: 'value',
              options: [
                { label: 'Fact or metric', value: 'value' },
                { label: 'Table row', value: 'table' },
              ],
            },
            {
              type: 'group',
              name: 'content',
              admin: { condition: (_, s) => s.rowType !== 'table' },
              fields: valueFields,
            },
            {
              name: 'cells',
              type: 'array',
              maxRows: 12,
              validate: uniqueKeys,
              admin: {
                condition: (_, s) => s.rowType === 'table',
                description:
                  'One cell for each configured column key. Leave unknown values unfilled.',
              },
              fields: [
                { name: 'key', type: 'text', required: true, maxLength: 64 },
                ...valueFields,
              ],
            },
            {
              name: 'department',
              type: 'text',
              index: true,
              admin: {
                description: 'Optional department for searching faculty or clinical records.',
              },
            },
            {
              name: 'details',
              label: 'Expandable Details',
              type: 'array',
              maxRows: 40,
              admin: {
                initCollapsed: true,
                description:
                  'Additional details such as promotion date, employment type, service history, lectures, topics and training dates. Add a new period record for later disclosures.',
              },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'textarea', maxLength: 6000 },
              ],
            },
            {
              name: 'sourceNote',
              type: 'textarea',
              access: { read: featureFieldReadAccess('disclosureRecords') },
            },
          ],
        },
      ],
    },
    ...updateFields,
  ],
}
