import type {
  ArrayField,
  ArrayFieldValidation,
  Block,
  GroupField,
  SelectField,
  TabsField,
} from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type BankDetailsSiblingData = {
  accounts?: unknown[] | null
}

const hasMultipleAccounts = (_data: unknown, siblingData: BankDetailsSiblingData) =>
  Array.isArray(siblingData?.accounts) && siblingData.accounts.length > 1

const normalizedKey = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''

export const validateBankAccounts: ArrayFieldValidation = (value) => {
  if (!Array.isArray(value)) return true

  const purposes = new Set<string>()
  const duplicateIndex = value.findIndex((account) => {
    if (!account || typeof account !== 'object') return false

    const purpose = normalizedKey((account as { purpose?: unknown }).purpose)
    if (!purpose) return false
    if (purposes.has(purpose)) return true

    purposes.add(purpose)
    return false
  })

  return duplicateIndex < 0
    ? true
    : `Bank account ${duplicateIndex + 1} duplicates an earlier payment purpose.`
}

const accountsField = {
  name: 'accounts',
  label: 'Bank Accounts',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 6,
  validate: validateBankAccounts,
  admin: {
    components: {
      RowLabel: '/blocks/BankDetails/RowLabel#BankAccountRowLabel',
    },
    description: 'Add accounts in visitor tab order. Each payment purpose must be unique.',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'purpose',
      label: 'Payment Purpose',
      type: 'text',
      required: true,
      admin: {
        description: 'Short visitor-facing label, such as Admissions or Hostel.',
      },
    },
    {
      name: 'accountHolder',
      label: 'Account Holder',
      type: 'text',
      required: true,
    },
    {
      name: 'accountNumber',
      label: 'Account Number',
      type: 'text',
      required: true,
      admin: {
        description: 'Stored and displayed as text so leading zeroes remain intact.',
      },
    },
    {
      name: 'ifscCode',
      label: 'IFSC Code',
      type: 'text',
      required: true,
    },
    {
      name: 'bankName',
      label: 'Bank Name',
      type: 'text',
    },
    {
      name: 'branch',
      label: 'Branch & Type',
      type: 'text',
    },
    {
      name: 'upiId',
      label: 'UPI ID',
      type: 'text',
    },
    {
      name: 'instructions',
      label: 'Payment Instructions',
      type: 'textarea',
      admin: {
        description: 'Optional guidance shown for this payment purpose.',
      },
    },
  ],
} satisfies ArrayField

export const BankDetailsBlock: Block = {
  admin: getBlockThumbnailAdmin('bankDetails'),
  slug: 'bankDetails',
  interfaceName: 'BankDetailsBlock',
  labels: {
    singular: 'Bank Details',
    plural: 'Bank Details',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              admin: {
                description: 'Small label above the optional section heading.',
              },
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'accentTitle',
              label: 'Accent Title (Italic)',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            {
              name: 'officialAccountLabel',
              label: 'Official Account Label',
              type: 'text',
              defaultValue: 'Official college account',
              admin: {
                description: 'Leave blank to hide the official-account badge.',
              },
            },
            {
              name: 'panelTitle',
              label: 'Panel Title',
              type: 'text',
              defaultValue: 'Bank transfer details',
            },
            {
              name: 'panelDescription',
              label: 'Panel Description',
              type: 'textarea',
            },
            {
              name: 'ledgerText',
              label: 'Ledger Text',
              type: 'group',
              admin: {
                description: 'Customize persistent labels on the white account-information panel.',
              },
              fields: [
                {
                  name: 'ledgerTitle',
                  label: 'Ledger Title',
                  type: 'text',
                  defaultValue: 'Bank Account Information',
                },
                {
                  name: 'verifiedLabel',
                  label: 'Verification Label',
                  type: 'text',
                  defaultValue: 'Verified',
                },
                {
                  name: 'accountHolderLabel',
                  label: 'Account Holder Label',
                  type: 'text',
                  defaultValue: 'Account Holder',
                },
                {
                  name: 'accountNumberLabel',
                  label: 'Account Number Label',
                  type: 'text',
                  defaultValue: 'Account Number',
                },
                {
                  name: 'bankNameLabel',
                  label: 'Bank Name Label',
                  type: 'text',
                  defaultValue: 'Bank Name',
                },
                {
                  name: 'ifscCodeLabel',
                  label: 'IFSC Code Label',
                  type: 'text',
                  defaultValue: 'IFSC Code',
                },
                {
                  name: 'branchLabel',
                  label: 'Branch & Type Label',
                  type: 'text',
                  defaultValue: 'Branch & Type',
                },
                {
                  name: 'upiIdLabel',
                  label: 'UPI ID Label',
                  type: 'text',
                  defaultValue: 'UPI ID',
                },
                {
                  name: 'copyAllLabel',
                  label: 'Copy All Label',
                  type: 'text',
                  defaultValue: 'Copy all details',
                },
              ],
            } satisfies GroupField,
            accountsField,
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
            } satisfies SelectField,
            {
              name: 'displayMode',
              label: 'Panel Mode',
              type: 'select',
              defaultValue: 'text',
              options: [
                { label: 'Text', value: 'text' },
                { label: 'Scanner', value: 'scanner' },
              ],
              admin: {
                description:
                  'Choose the contextual content rendered beside the bank-information panel.',
              },
            } satisfies SelectField,
            {
              name: 'panelPosition',
              label: 'Panel Position',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                description:
                  'Desktop only. The contextual panel remains first on smaller screens.',
              },
            } satisfies SelectField,
            {
              name: 'tabStyle',
              label: 'Account Tab Style',
              type: 'select',
              defaultValue: 'underline',
              required: true,
              options: [
                { label: 'Underline', value: 'underline' },
                { label: 'Pills', value: 'pills' },
                { label: 'Boxed', value: 'boxed' },
              ],
              admin: {
                condition: hasMultipleAccounts,
              },
            } satisfies SelectField,
            {
              name: 'tabWidth',
              label: 'Account Tab Width',
              type: 'select',
              defaultValue: 'content',
              required: true,
              options: [
                { label: 'Content Width', value: 'content' },
                { label: 'Centered Auto Width', value: 'centered' },
                { label: 'Equal Full Width', value: 'equal' },
              ],
              admin: {
                condition: hasMultipleAccounts,
                description:
                  'Centered Auto Width stays centered when it fits and scrolls from the start when it overflows.',
              },
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              required: true,
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
