import type {
  ArrayField,
  Block,
  CheckboxField,
  Condition,
  RadioField,
  SelectField,
  TabsField,
  TextField,
} from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import {
  buttonVariantDescription,
  buttonVariantOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

type DownloadListSiblingData = {
  displayMode?: 'cards' | 'compact' | 'framedGrid' | 'list' | 'openGrid' | null
  sectionLayout?: 'split' | 'stacked' | null
}

type DocumentActionSiblingData = {
  actionType?: 'custom' | 'download' | 'view' | null
  linkType?: 'custom' | 'page' | null
  mode?: 'button' | 'link' | null
}

type DocumentActionValue = DocumentActionSiblingData & {
  label?: string | null
  page?: unknown
  url?: string | null
}

type DownloadItemSiblingData = {
  externalUrl?: string | null
  file?: unknown
}

type ManualActionSiblingData = {
  actionType?: 'download' | 'link' | null
  linkType?: 'custom' | 'page' | null
}

const isGridMode = (_data: unknown, siblingData: DownloadListSiblingData) =>
  siblingData?.displayMode === 'cards' ||
  siblingData?.displayMode === 'openGrid' ||
  siblingData?.displayMode === 'framedGrid'

const isSplitSection = (_data: unknown, siblingData: DownloadListSiblingData) =>
  siblingData?.sectionLayout === 'split'

const isViewAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'view'

const isCustomAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom'

const isCustomPageAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom' && siblingData?.linkType === 'page'

const isCustomUrlDocumentAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom' && siblingData?.linkType === 'custom'

const isCustomButtonAction: Condition = (_data, siblingData: DocumentActionSiblingData) =>
  siblingData?.actionType === 'custom' && siblingData?.mode === 'button'

const getCustomDestinationKey = (action: DocumentActionValue): string | undefined => {
  if (action.linkType === 'custom') {
    const url = action.url?.trim()
    return url ? `url:${url}` : undefined
  }

  if (action.linkType === 'page' && action.page) {
    const page = action.page
    const id = typeof page === 'object' && page && 'id' in page ? page.id : page
    return id !== undefined && id !== null ? `page:${String(id)}` : undefined
  }

  return undefined
}

const validateDocumentActions = (
  value: unknown,
  { siblingData }: { siblingData?: DownloadItemSiblingData },
) => {
  const actions = Array.isArray(value) ? (value as DocumentActionValue[]).slice(0, 2) : []
  const actionTypes = actions.map((action) => action.actionType)

  for (const type of ['download', 'view'] as const) {
    if (actionTypes.filter((actionType) => actionType === type).length > 1) {
      return `Add ${type === 'download' ? 'Download' : 'View'} only once per document.`
    }
  }

  const customDestinations: string[] = []
  for (const [index, action] of actions.entries()) {
    const position = index + 1
    if (action.actionType === 'download' && !siblingData?.file) {
      return `Download action ${position} requires File Upload.`
    }
    if (action.actionType === 'view' && !siblingData?.file && !siblingData?.externalUrl?.trim()) {
      return `View action ${position} requires View URL or File Upload.`
    }
    if (action.actionType === 'custom') {
      if (!action.label?.trim()) return `Custom action ${position} requires a label.`
      const destination = getCustomDestinationKey(action)
      if (!destination) return `Custom action ${position} requires a destination.`
      customDestinations.push(destination)
    }
  }

  return new Set(customDestinations).size === customDestinations.length
    ? true
    : 'Custom actions must use different destinations.'
}

const isLinkAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'link'

const isDownloadAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'download'

const isPageAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'link' && siblingData?.linkType === 'page'

const isCustomUrlAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'link' && siblingData?.linkType === 'custom'

const legacyActionsField: ArrayField = {
  name: 'actions',
  label: 'Manual Actions',
  type: 'array',
  maxRows: 2,
  admin: {
    hidden: true,
    initCollapsed: true,
    description:
      'Legacy action data retained for existing content. Use Document Actions for new content.',
  },
  fields: [
    {
      name: 'actionType',
      label: 'Action Type',
      type: 'radio',
      defaultValue: 'link',
      required: true,
      options: [
        { label: 'Link', value: 'link' },
        { label: 'Download', value: 'download' },
      ],
      admin: { layout: 'horizontal' },
    } satisfies RadioField,
    { name: 'label', type: 'text', required: true },
    {
      name: 'linkType',
      label: 'Link Destination',
      type: 'radio',
      defaultValue: 'page',
      options: [
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
      admin: { condition: isLinkAction, layout: 'horizontal' },
    } satisfies RadioField,
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: isPageAction },
      validate: (value: unknown, { siblingData }: { siblingData?: ManualActionSiblingData }) =>
        !isPageAction(undefined, siblingData ?? {}) || Boolean(value)
          ? true
          : 'Select a page for this Link action.',
    },
    {
      name: 'url',
      label: 'Custom URL',
      type: 'text',
      admin: { condition: isCustomUrlAction },
      validate: (value: unknown, { siblingData }: { siblingData?: ManualActionSiblingData }) =>
        !isCustomUrlAction(undefined, siblingData ?? {}) ||
        (typeof value === 'string' && value.trim().length > 0)
          ? true
          : 'Enter a URL for this Link action.',
    } satisfies TextField,
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: isLinkAction },
    } satisfies CheckboxField,
    {
      name: 'file',
      label: 'Download File',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: isDownloadAction },
      validate: (value: unknown, { siblingData }: { siblingData?: ManualActionSiblingData }) =>
        !isDownloadAction(undefined, siblingData ?? {}) || Boolean(value)
          ? true
          : 'Select a file for this Download action.',
    },
  ],
}

const documentActionsField: ArrayField = {
  name: 'documentActions',
  label: 'Document Actions',
  type: 'array',
  maxRows: 2,
  validate: validateDocumentActions,
  admin: {
    initCollapsed: true,
    description: 'Add up to two ordered Download, View, or Custom actions.',
  },
  fields: [
    {
      name: 'actionType',
      label: 'Action Type',
      type: 'radio',
      defaultValue: 'download',
      required: true,
      options: [
        { label: 'Download', value: 'download' },
        { label: 'View', value: 'view' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: { layout: 'horizontal' },
    } satisfies RadioField,
    {
      name: 'label',
      type: 'text',
      admin: { description: 'Download and View use their action name when left empty.' },
    },
    {
      name: 'viewOpenInNewTab',
      label: 'Open View in New Tab',
      type: 'checkbox',
      defaultValue: true,
      admin: { condition: isViewAction },
    } satisfies CheckboxField,
    {
      name: 'linkType',
      label: 'Custom Destination',
      type: 'radio',
      defaultValue: 'page',
      options: [
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
      admin: { condition: isCustomAction, layout: 'horizontal' },
    } satisfies RadioField,
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: isCustomPageAction },
    },
    {
      name: 'url',
      label: 'Custom URL',
      type: 'text',
      admin: { condition: isCustomUrlDocumentAction },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: isCustomAction },
    } satisfies CheckboxField,
    {
      name: 'mode',
      label: 'Display As',
      type: 'select',
      defaultValue: 'link',
      options: [
        { label: 'Link', value: 'link' },
        { label: 'Button', value: 'button' },
      ],
      admin: { condition: isCustomAction },
    } satisfies SelectField,
    {
      name: 'variant',
      label: 'Button Variant',
      type: 'select',
      defaultValue: 'default',
      options: buttonVariantOptions,
      admin: {
        condition: isCustomButtonAction,
        description: buttonVariantDescription,
      },
    } satisfies SelectField,
    {
      name: 'showArrow',
      label: 'Show Arrow',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: isCustomButtonAction,
        description: 'Adds a trailing arrow when this action is displayed as a button.',
      },
    } satisfies CheckboxField,
  ],
}

const legacyCustomActionField = createContentActionsField({
  name: 'customAction',
  label: 'Custom Action',
  maxRows: 1,
})

legacyCustomActionField.admin = {
  ...legacyCustomActionField.admin,
  hidden: true,
}

const columnOptions = Array.from({ length: 8 }, (_, index) => ({
  label: `${index + 1} column${index === 0 ? '' : 's'}`,
  value: String(index + 1),
}))

const downloadsField: ArrayField = {
  name: 'downloads',
  label: 'Downloads',
  type: 'array',
  minRows: 1,
  admin: {
    initCollapsed: true,
    description: 'Files or links available for download.',
  },
  fields: [
    createCardTabs({
      backgroundFieldOptions: {
        adminDescription:
          'Applied only to Boxed Card Grid. Open Grid, Framed Grid, and Inline List inherit the section surface.',
      },
      contentFields: [
        {
          name: 'title',
          label: 'Document Title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          label: 'Metadata / Supporting Text',
          type: 'text',
          admin: {
            description: 'Short authority, programme, year, or explanatory detail.',
          },
        },
        {
          name: 'file',
          label: 'File Upload',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Upload a file to Payload media. Takes priority over external URL.',
          },
        },
        {
          name: 'externalUrl',
          label: 'View URL',
          type: 'text',
          admin: {
            description:
              'Optional viewer or external destination. When a file is also uploaded, View uses this URL and Download uses the file.',
          },
        },
        {
          name: 'fileType',
          label: 'File Type Label',
          type: 'select',
          options: [
            { label: 'PDF', value: 'PDF' },
            { label: 'DOC', value: 'DOC' },
            { label: 'DOCX', value: 'DOCX' },
            { label: 'XLS', value: 'XLS' },
            { label: 'XLSX', value: 'XLSX' },
            { label: 'CSV', value: 'CSV' },
            { label: 'PPT', value: 'PPT' },
            { label: 'PPTX', value: 'PPTX' },
            { label: 'ZIP', value: 'ZIP' },
          ],
          admin: {
            description:
              'Optional override. Leave empty to detect the type from the uploaded file.',
          },
        } satisfies SelectField,
        documentActionsField,
        legacyCustomActionField,
        legacyActionsField,
      ],
    }),
  ],
}

export const DownloadListBlock: Block = {
  admin: getBlockThumbnailAdmin('downloadList'),
  slug: 'downloadList',
  interfaceName: 'DownloadListBlock',
  labels: {
    singular: 'Download List',
    plural: 'Download Lists',
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
            },
            {
              name: 'title',
              type: 'text',
            },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            {
              type: 'collapsible',
              label: 'Automatic Action Fallback',
              admin: { hidden: true, initCollapsed: true },
              fields: [
                {
                  name: 'showViewAction',
                  label: 'Show View Action',
                  type: 'checkbox',
                  defaultValue: false,
                } satisfies CheckboxField,
                {
                  name: 'openViewInNewTab',
                  label: 'Open View in New Tab',
                  type: 'checkbox',
                  defaultValue: true,
                } satisfies CheckboxField,
                {
                  name: 'showDownloadAction',
                  label: 'Show Download Action',
                  type: 'checkbox',
                  defaultValue: true,
                } satisfies CheckboxField,
              ],
            },
            downloadsField,
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
              name: 'sectionLayout',
              label: 'Section Layout',
              type: 'select',
              defaultValue: 'stacked',
              required: true,
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Split', value: 'split' },
              ],
            } satisfies SelectField,
            {
              name: 'introPosition',
              label: 'Introduction Position',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                condition: isSplitSection,
                description:
                  'Choose which side contains the section introduction on large screens.',
              },
            } satisfies SelectField,
            {
              name: 'introVerticalAlignment',
              label: 'Introduction Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitSection,
                description:
                  'Position the introduction relative to the downloads on large screens.',
              },
            } satisfies SelectField,
            {
              name: 'displayMode',
              label: 'Display Mode',
              type: 'select',
              defaultValue: 'list',
              options: [
                { label: 'Inline List', value: 'list' },
                { label: 'Boxed Card Grid', value: 'cards' },
                { label: 'Open Grid', value: 'openGrid' },
                { label: 'Framed Grid', value: 'framedGrid' },
              ],
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Columns',
              type: 'select',
              defaultValue: '3',
              required: true,
              options: columnOptions,
              admin: {
                description:
                  'Sets the maximum number of responsive columns for every presentation.',
              },
            } satisfies SelectField,
            {
              name: 'documentIconSize',
              label: 'Document Icon Size',
              type: 'select',
              defaultValue: 'medium',
              required: true,
              options: [
                { label: 'Small', value: 'small' },
                { label: 'Medium', value: 'medium' },
                { label: 'Large', value: 'large' },
              ],
              admin: {
                description: 'Controls the main file icon. Action icons remain compact.',
              },
            } satisfies SelectField,
            {
              name: 'showDocumentIcon',
              label: 'Show File Icon',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Shows the main file icon in every Download List presentation.',
              },
            } satisfies CheckboxField,
            {
              name: 'gridIconPosition',
              label: 'Grid Icon Position',
              type: 'select',
              defaultValue: 'above',
              required: true,
              options: [
                { label: 'Above Title', value: 'above' },
                { label: 'Left of Content', value: 'inline' },
              ],
              admin: {
                condition: isGridMode,
                description:
                  'Place the main document icon above the title or inline beside the title and supporting text. The file-type badge stays at the top right.',
              },
            } satisfies SelectField,
            {
              name: 'gridActionDisplay',
              label: 'Grid Action Display',
              type: 'select',
              defaultValue: 'labelled',
              required: true,
              options: [
                { label: 'Labelled', value: 'labelled' },
                { label: 'Icon only', value: 'icons' },
              ],
              admin: {
                condition: isGridMode,
                description:
                  'Show every grid action with its label or as an accessible icon-only control.',
              },
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
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
