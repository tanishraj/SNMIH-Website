import type {
  ArrayField,
  CheckboxField,
  Condition,
  Field,
  RadioField,
  SelectField,
  TabsField,
  UploadField,
} from 'payload'

type LinkSiblingData = {
  fileBehavior?: 'download' | 'view' | null
  linkType?: 'custom' | 'file' | 'page' | null
}

export type ContentActionLinkType = 'custom' | 'file' | 'page'
export type ContentActionFileBehavior = 'download' | 'view'
export type ContentActionButtonVariant =
  'default' | 'outline' | 'primary' | 'secondary' | 'white' | 'whiteOutline'

type CreateContentActionsFieldOptions = {
  actionLabel?: string
  allowedLinkTypes?: readonly ContentActionLinkType[]
  defaultVariant?: ContentActionButtonVariant
  fileFilterOptions?: UploadField['filterOptions']
  fixedFileBehavior?: ContentActionFileBehavior
  includeDisplayMode?: boolean
  includeNavigationArrow?: boolean
  label?: string
  maxRows?: number
  name?: string
}

type ActionLayoutSiblingData = LinkSiblingData & {
  mode?: 'button' | 'link' | null
  showFileIcon?: boolean | null
}

type CreateContentActionModeFieldOptions = {
  condition?: Condition
  label?: string
  name?: string
}

export const buttonVariantOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Outline', value: 'outline' },
  { label: 'White Filled', value: 'white' },
  { label: 'White Outline', value: 'whiteOutline' },
] satisfies SelectField['options']

export const buttonVariantWithLinkOptions = [
  ...buttonVariantOptions,
  { label: 'Link', value: 'link' },
] satisfies SelectField['options']

export const buttonVariantDescription =
  "Default adapts to the surrounding section or image overlay. Primary always uses the site theme's primary color. White variants stay white and are intended for dark, brand, or image backgrounds."

const isPageLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'custom'

const isFileLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'file'

const isNavigationalLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const isFileView = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'file' && siblingData?.fileBehavior !== 'download'

const isFileDownload = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'file' && siblingData?.fileBehavior === 'download'

const isNotFileDownload = (_data: unknown, siblingData: LinkSiblingData) =>
  !isFileDownload(_data, siblingData)

const isButtonMode = (_data: unknown, siblingData: ActionLayoutSiblingData) =>
  siblingData?.mode === 'button'

const isButtonWithoutDownloadIndicator = (_data: unknown, siblingData: ActionLayoutSiblingData) =>
  siblingData?.mode === 'button' && !isFileDownload(_data, siblingData)

const showsFileIcon = (_data: unknown, siblingData: ActionLayoutSiblingData) =>
  isFileDownload(_data, siblingData) && siblingData?.showFileIcon !== false

const allLinkTypes: readonly ContentActionLinkType[] = ['page', 'custom', 'file']

const linkTypeLabels: Record<ContentActionLinkType, string> = {
  page: 'Page',
  custom: 'Custom URL',
  file: 'File',
}

const createActionContentFields = ({
  actionLabel,
  allowedLinkTypes = allLinkTypes,
  fileFilterOptions,
  fixedFileBehavior,
}: Pick<
  CreateContentActionsFieldOptions,
  'actionLabel' | 'allowedLinkTypes' | 'fileFilterOptions' | 'fixedFileBehavior'
>): Field[] => {
  const resolvedLinkTypes = allowedLinkTypes.length ? [...allowedLinkTypes] : [...allLinkTypes]
  const includes = (value: ContentActionLinkType) => resolvedLinkTypes.includes(value)

  return [
    {
      name: 'label',
      label: actionLabel,
      type: 'text',
      required: true,
    },
    {
      name: 'linkType',
      type: 'radio',
      defaultValue: resolvedLinkTypes[0],
      options: resolvedLinkTypes.map((value) => ({ label: linkTypeLabels[value], value })),
      admin: {
        hidden: resolvedLinkTypes.length === 1,
        layout: 'horizontal',
      },
    } satisfies RadioField,
    ...(includes('page')
      ? [
          {
            name: 'page',
            type: 'relationship',
            relationTo: 'pages',
            admin: { condition: isPageLink },
          } satisfies Field,
        ]
      : []),
    ...(includes('custom')
      ? [
          {
            name: 'url',
            label: 'Custom URL',
            type: 'text',
            admin: {
              condition: isCustomLink,
              description:
                'Use #anchor-id for a section on this page or /page-path#anchor-id for a section on another page.',
              placeholder: '#admissions or /programmes#mbbs',
            },
          } satisfies Field,
          {
            name: 'openInNewTab',
            type: 'checkbox',
            defaultValue: false,
            admin: { condition: isNavigationalLink },
          } satisfies CheckboxField,
        ]
      : includes('page')
        ? [
            {
              name: 'openInNewTab',
              type: 'checkbox',
              defaultValue: false,
              admin: { condition: isNavigationalLink },
            } satisfies CheckboxField,
          ]
        : []),
    ...(includes('file')
      ? [
          {
            name: 'file',
            label: 'File',
            type: 'upload',
            relationTo: 'media',
            filterOptions: fileFilterOptions,
            admin: {
              condition: isFileLink,
              description: 'Choose the Media asset this action should view or download.',
            },
          } satisfies UploadField,
          {
            name: 'fileBehavior',
            label: 'File Behavior',
            type: 'select',
            defaultValue: fixedFileBehavior ?? 'view',
            options: fixedFileBehavior
              ? [
                  {
                    label: fixedFileBehavior === 'download' ? 'Download' : 'View',
                    value: fixedFileBehavior,
                  },
                ]
              : [
                  { label: 'View', value: 'view' },
                  { label: 'Download', value: 'download' },
                ],
            admin: {
              condition: isFileLink,
              hidden: Boolean(fixedFileBehavior),
            },
          } satisfies SelectField,
          ...(fixedFileBehavior === 'download'
            ? []
            : [
                {
                  name: 'openFileInNewTab',
                  label: 'Open View in New Tab',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { condition: isFileView },
                } satisfies CheckboxField,
              ]),
        ]
      : []),
  ]
}

const createActionLayoutFields = ({
  defaultVariant = 'default',
  includeDisplayMode,
  includeNavigationArrow,
}: Pick<
  CreateContentActionsFieldOptions,
  'defaultVariant' | 'includeDisplayMode' | 'includeNavigationArrow'
>): Field[] => [
  ...(includeDisplayMode
    ? [
        {
          name: 'mode',
          label: 'Display As',
          type: 'select',
          defaultValue: 'link',
          options: [
            { label: 'Link', value: 'link' },
            { label: 'Button', value: 'button' },
          ],
          required: false,
        } satisfies SelectField,
      ]
    : []),
  {
    name: 'variant',
    label: 'Button Variant',
    type: 'select',
    defaultValue: defaultVariant,
    options: buttonVariantOptions,
    required: true,
    admin: {
      description: buttonVariantDescription,
      ...(includeDisplayMode ? { condition: isButtonMode } : {}),
    },
  } satisfies SelectField,
  ...(includeNavigationArrow
    ? [
        {
          name: 'showArrow',
          label: 'Show arrow',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Adds a trailing arrow when this action is displayed as a button.',
            condition: includeDisplayMode ? isButtonWithoutDownloadIndicator : isNotFileDownload,
          },
        } satisfies CheckboxField,
      ]
    : []),
  {
    name: 'showFileIcon',
    label: 'Show Download Icon',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      condition: isFileDownload,
      description: 'Shows an animated down arrow for this file download.',
    },
  } satisfies CheckboxField,
  {
    name: 'fileIconPosition',
    label: 'Download Icon Position',
    type: 'select',
    defaultValue: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
    admin: {
      condition: showsFileIcon,
    },
  } satisfies SelectField,
]

export const createContentActionModeField = ({
  condition,
  label = 'Action Mode',
  name = 'actionMode',
}: CreateContentActionModeFieldOptions = {}): SelectField => ({
  name,
  label,
  type: 'select',
  defaultValue: 'link',
  options: [
    { label: 'Link', value: 'link' },
    { label: 'Button', value: 'button' },
  ],
  // Optional: the default already covers unset values, and marking it required
  // would make the generated type demand it on every seeded block.
  required: false,
  ...(condition
    ? {
        admin: {
          condition,
        },
      }
    : {}),
})

export const createContentActionsField = ({
  actionLabel,
  allowedLinkTypes,
  defaultVariant,
  fileFilterOptions,
  fixedFileBehavior,
  // Display mode lives on each action, inside its own Theme Settings tab, so a
  // row can be a button while its neighbour stays a link.
  includeDisplayMode = true,
  includeNavigationArrow = true,
  label = 'Actions',
  maxRows = 2,
  name = 'actions',
}: CreateContentActionsFieldOptions = {}): ArrayField => ({
  name,
  label,
  type: 'array',
  maxRows,
  admin: {
    initCollapsed: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: createActionContentFields({
            actionLabel,
            allowedLinkTypes,
            fileFilterOptions,
            fixedFileBehavior,
          }),
        },
        {
          label: 'Theme Settings',
          fields: createActionLayoutFields({
            defaultVariant,
            includeDisplayMode,
            includeNavigationArrow,
          }),
        },
      ],
    } satisfies TabsField,
  ],
})
