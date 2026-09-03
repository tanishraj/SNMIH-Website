import type { ArrayField, Block, CheckboxField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type HeaderLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

type DirectoryControlSiblingData = {
  departmentFilterPresentation?: 'dropdown' | 'tabs' | null
  showDepartmentTabs?: boolean | null
  showSearch?: boolean | null
}

type CardLayoutSiblingData = {
  cardLayout?: 'inline' | 'overlay' | null
}

type CardSizeSiblingData = {
  cardLayout?: 'inline' | 'overlay' | null
  cardSize?: 'lg' | 'md' | 'sm' | null
}

type FeaturedCarouselSiblingData = {
  featuredCarouselCardVariant?: 'overlay' | 'stacked' | null
  showFeaturedCarousel?: boolean | null
}

type DepartmentValue = {
  id?: string | null
  name?: string | null
  profiles?: DepartmentProfileValue[] | null
}

type DepartmentProfileValue = {
  featured?: boolean | null
  image?: unknown
  name?: string | null
}

const isSplitHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout !== 'stacked'

const showsSearch = (_data: unknown, siblingData: DirectoryControlSiblingData) =>
  siblingData?.showSearch !== false

const showsDepartmentFilter = (_data: unknown, siblingData: DirectoryControlSiblingData) =>
  siblingData?.showDepartmentTabs !== false

const usesDepartmentTabs = (_data: unknown, siblingData: DirectoryControlSiblingData) =>
  siblingData?.showDepartmentTabs !== false &&
  siblingData?.departmentFilterPresentation !== 'dropdown'

const usesOverlayCards = (_data: unknown, siblingData: CardLayoutSiblingData) =>
  siblingData?.cardLayout !== 'inline'

const usesBaseColumns = (_data: unknown, siblingData: CardSizeSiblingData) =>
  siblingData?.cardLayout === 'inline' ||
  (siblingData?.cardSize !== 'md' && siblingData?.cardSize !== 'sm')

const usesMediumCards = (_data: unknown, siblingData: CardSizeSiblingData) =>
  siblingData?.cardLayout !== 'inline' && siblingData?.cardSize === 'md'

const usesSmallCards = (_data: unknown, siblingData: CardSizeSiblingData) =>
  siblingData?.cardLayout !== 'inline' && siblingData?.cardSize === 'sm'

const showsFeaturedCarousel = (_data: unknown, siblingData: FeaturedCarouselSiblingData) =>
  siblingData?.showFeaturedCarousel === true

const usesFeaturedCarouselOverlay = (_data: unknown, siblingData: FeaturedCarouselSiblingData) =>
  siblingData?.showFeaturedCarousel === true &&
  siblingData?.featuredCarouselCardVariant === 'overlay'

const normalizeDepartmentName = (value?: string | null) => value?.trim().toLocaleLowerCase() ?? ''

export const validateDepartmentRows = (value: unknown): string | true => {
  if (!Array.isArray(value)) return true

  const seen = new Set<string>()
  const profiles: DepartmentProfileValue[] = []

  for (const row of value as DepartmentValue[]) {
    const normalizedName = normalizeDepartmentName(row?.name)
    if (!normalizedName) return 'Every department must have a name.'
    if (seen.has(normalizedName)) return 'Department names must be unique.'
    seen.add(normalizedName)
    if (Array.isArray(row?.profiles)) profiles.push(...row.profiles)
  }

  if (profiles.length === 0) return 'Add at least one profile across all departments.'
  if (profiles.length > 400) return 'Add no more than 400 profiles across all departments.'

  const featuredProfiles = profiles.filter((profile) => profile?.featured === true)
  if (featuredProfiles.length > 12) {
    return 'Select no more than 12 featured profiles.'
  }

  const missingImage = featuredProfiles.find((profile) => !profile?.image)
  if (missingImage) {
    const name = missingImage.name?.trim()
    return name
      ? `Featured profile “${name}” requires a Profile Image.`
      : 'Every featured profile requires a Profile Image.'
  }

  return true
}

const profileFields = [
  {
    name: 'image',
    label: 'Profile Image',
    type: 'upload',
    relationTo: 'media',
  },
  { name: 'name', type: 'text', required: true },
  { name: 'designation', type: 'text' },
  {
    name: 'featured',
    label: 'Featured in Carousel',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      description: 'Show this profile in the optional featured carousel.',
    },
  } satisfies CheckboxField,
  {
    name: 'imagePosition',
    label: 'Image Position',
    type: 'select',
    defaultValue: 'center',
    required: true,
    options: [
      { label: 'Center', value: 'center' },
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  } satisfies SelectField,
] satisfies ArrayField['fields']

const departmentsField = {
  name: 'departments',
  label: 'Departments',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 50,
  validate: validateDepartmentRows,
  admin: {
    components: {
      RowLabel: '/blocks/DepartmentProfiles/RowLabels#DepartmentRowLabel',
    },
    description:
      'Add departments in public filter order, then expand each department to manage its profiles. Maximum 400 profiles total.',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'name',
      label: 'Department Name',
      type: 'text',
      required: true,
    },
    {
      name: 'profiles',
      label: 'Profiles',
      type: 'array',
      maxRows: 400,
      admin: {
        components: {
          RowLabel: '/blocks/DepartmentProfiles/RowLabels#DepartmentProfileRowLabel',
        },
        description: 'Profiles shown for this department in their displayed order.',
        initCollapsed: true,
      },
      fields: profileFields,
    } satisfies ArrayField,
  ],
} satisfies ArrayField

export const DepartmentProfilesBlock: Block = {
  admin: getBlockThumbnailAdmin('departmentProfiles'),
  slug: 'departmentProfiles',
  interfaceName: 'DepartmentProfilesBlock',
  labels: {
    singular: 'Department Profiles',
    plural: 'Department Profiles',
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
              admin: { description: 'Small label above the section title.' },
            },
            { name: 'title', type: 'text' },
            {
              name: 'accentTitle',
              label: 'Accent Title',
              type: 'text',
              admin: { description: 'Optional italic second line of the heading.' },
            },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            {
              name: 'showFeaturedCarousel',
              label: 'Enable Featured Profile Carousel',
              type: 'checkbox',
              defaultValue: false,
            } satisfies CheckboxField,
            {
              name: 'featuredCarouselTitle',
              label: 'Featured Carousel Title',
              type: 'text',
              defaultValue: 'Featured Profiles',
              admin: { condition: showsFeaturedCarousel },
            },
            {
              name: 'directoryTitle',
              label: 'Directory Title',
              type: 'text',
              defaultValue: 'Profile Directory',
              admin: { condition: showsFeaturedCarousel },
            },
            departmentsField,
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
              name: 'showSearch',
              label: 'Show Search',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'searchPlaceholder',
              label: 'Search Placeholder',
              type: 'text',
              defaultValue: 'Search profiles',
              admin: { condition: showsSearch },
            },
            {
              name: 'showDepartmentTabs',
              label: 'Show Department Filter',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'departmentFilterPresentation',
              label: 'Department Filter Presentation',
              type: 'select',
              defaultValue: 'tabs',
              required: true,
              options: [
                { label: 'Tabs', value: 'tabs' },
                { label: 'Dropdown', value: 'dropdown' },
              ],
              admin: { condition: showsDepartmentFilter },
            } satisfies SelectField,
            {
              name: 'allTabLabel',
              label: 'All Departments Label',
              type: 'text',
              defaultValue: 'All',
              admin: { condition: showsDepartmentFilter },
            },
            {
              name: 'tabVariant',
              label: 'Department Tab Style',
              type: 'select',
              defaultValue: 'pill',
              required: true,
              options: [
                { label: 'Pill', value: 'pill' },
                { label: 'Underline', value: 'underline' },
                { label: 'Contained', value: 'contained' },
              ],
              admin: { condition: usesDepartmentTabs },
            } satisfies SelectField,
            {
              name: 'tabWidth',
              label: 'Department Tab Width',
              type: 'select',
              defaultValue: 'content',
              required: true,
              options: [
                { label: 'Content Width', value: 'content' },
                { label: 'Centered Auto Width', value: 'centered' },
                { label: 'Equal Full Width', value: 'equal' },
              ],
              admin: {
                condition: usesDepartmentTabs,
                description:
                  'Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable when they overflow. Equal Full Width divides the complete available tab rail evenly.',
              },
            } satisfies SelectField,
            {
              name: 'profilesPerLoad',
              label: 'Profiles Per Load',
              type: 'select',
              defaultValue: '20',
              required: true,
              options: [
                { label: '12 Profiles', value: '12' },
                { label: '16 Profiles', value: '16' },
                { label: '20 Profiles', value: '20' },
                { label: '24 Profiles', value: '24' },
              ],
            } satisfies SelectField,
            {
              name: 'loadMoreLabel',
              label: 'Load More Label',
              type: 'text',
              defaultValue: 'Load More',
            },
            {
              name: 'noResultsMessage',
              label: 'No Results Message',
              type: 'text',
              defaultValue: 'No matching profiles found.',
            },
            {
              name: 'cardLayout',
              label: 'Card Layout',
              type: 'select',
              defaultValue: 'overlay',
              required: true,
              options: [
                { label: 'Image Overlay', value: 'overlay' },
                { label: 'Inline', value: 'inline' },
              ],
            } satisfies SelectField,
            {
              name: 'cardSize',
              label: 'Card Size',
              type: 'select',
              defaultValue: 'lg',
              required: true,
              options: [
                { label: 'Small', value: 'sm' },
                { label: 'Medium', value: 'md' },
                { label: 'Large', value: 'lg' },
              ],
              admin: {
                description: 'Controls card proportion, media size, spacing, and typography.',
              },
            } satisfies SelectField,
            createMediaOverlayToneField({
              condition: usesOverlayCards,
              defaultValue: 'dark',
            }),
            createMediaOverlayStrengthField({
              condition: usesOverlayCards,
              defaultValue: 'dark',
            }),
            createMediaOverlayDirectionField({
              condition: usesOverlayCards,
              defaultValue: 'bottomToTop',
            }),
            createMediaOverlayCoverageField({
              condition: usesOverlayCards,
              defaultValue: 'full',
            }),
            {
              name: 'featuredCarouselCardVariant',
              label: 'Featured Carousel Card Variant',
              type: 'select',
              defaultValue: 'stacked',
              options: [
                { label: 'Text Below Image', value: 'stacked' },
                { label: 'Image Overlay', value: 'overlay' },
              ],
              admin: { condition: showsFeaturedCarousel },
            } satisfies SelectField,
            {
              name: 'featuredCarouselSize',
              label: 'Featured Carousel Card Size',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              admin: {
                condition: showsFeaturedCarousel,
                description: 'Controls featured portrait height without changing section padding.',
              },
            } satisfies SelectField,
            {
              name: 'featuredCarouselOverlayAlignment',
              label: 'Featured Carousel Overlay Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: { condition: usesFeaturedCarouselOverlay },
            } satisfies SelectField,
            createMediaOverlayToneField({
              condition: usesFeaturedCarouselOverlay,
              name: 'featuredCarouselThemeMode',
              required: false,
            }),
            createMediaOverlayStrengthField({
              condition: usesFeaturedCarouselOverlay,
              name: 'featuredCarouselOverlayStyle',
              required: false,
            }),
            createMediaOverlayDirectionField({
              condition: usesFeaturedCarouselOverlay,
              defaultValue: 'bottomToTop',
              name: 'featuredCarouselOverlayDirection',
              required: false,
            }),
            createMediaOverlayCoverageField({
              condition: usesFeaturedCarouselOverlay,
              name: 'featuredCarouselOverlayCoverage',
              required: false,
            }),
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            } satisfies SelectField,
            {
              name: 'headerLayout',
              label: 'Header Layout',
              type: 'select',
              defaultValue: 'split',
              required: true,
              options: [
                { label: 'Split', value: 'split' },
                { label: 'Stacked', value: 'stacked' },
              ],
            } satisfies SelectField,
            {
              name: 'descriptionPosition',
              label: 'Description Placement',
              type: 'select',
              defaultValue: 'side',
              required: true,
              options: [
                { label: 'Right Column', value: 'side' },
                { label: 'Under Title', value: 'underTitle' },
              ],
              admin: { condition: isSplitHeader },
            } satisfies SelectField,
            {
              name: 'sideContentAlignment',
              label: 'Right Column Alignment',
              type: 'select',
              defaultValue: 'bottom',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: { condition: isSplitHeader },
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Profiles per Row',
              type: 'select',
              defaultValue: '4',
              required: true,
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
              admin: { condition: usesBaseColumns },
            } satisfies SelectField,
            {
              name: 'mediumColumns',
              label: 'Profiles per Row',
              type: 'select',
              defaultValue: '6',
              required: true,
              options: [
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
                { label: '5 Columns', value: '5' },
                { label: '6 Columns', value: '6' },
              ],
              admin: { condition: usesMediumCards },
            } satisfies SelectField,
            {
              name: 'smallColumns',
              label: 'Profiles per Row',
              type: 'select',
              defaultValue: '8',
              required: true,
              options: [
                { label: '4 Columns', value: '4' },
                { label: '5 Columns', value: '5' },
                { label: '6 Columns', value: '6' },
                { label: '7 Columns', value: '7' },
                { label: '8 Columns', value: '8' },
              ],
              admin: { condition: usesSmallCards },
            } satisfies SelectField,
            {
              name: 'cardFrame',
              label: 'Card Frame',
              type: 'select',
              defaultValue: 'boxed',
              required: true,
              options: [
                { label: 'Boxed Cards', value: 'boxed' },
                { label: 'Framed Grid', value: 'framed' },
                { label: 'Ruled Grid', value: 'open' },
              ],
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
