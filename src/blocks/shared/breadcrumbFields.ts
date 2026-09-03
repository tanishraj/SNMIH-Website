import type { ArrayField, Condition, RadioField, SelectField } from 'payload'

type BreadcrumbLinkSiblings = {
  linkType?: 'custom' | 'page' | null
}

type BreadcrumbModeSiblings = {
  breadcrumbMode?: 'automatic' | 'custom' | 'hidden' | null
}

const isPageLink = (_data: unknown, siblingData: BreadcrumbLinkSiblings) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: BreadcrumbLinkSiblings) =>
  siblingData?.linkType === 'custom'

const usesCustomBreadcrumbs = (_data: unknown, siblingData: BreadcrumbModeSiblings) =>
  siblingData?.breadcrumbMode === 'custom'

export function createBreadcrumbModeField({
  condition,
  includeHidden = false,
  label = 'Breadcrumb Source',
}: {
  condition?: Condition
  includeHidden?: boolean
  label?: string
} = {}): SelectField {
  return {
    name: 'breadcrumbMode',
    label,
    type: 'select',
    defaultValue: 'automatic',
    required: true,
    admin: {
      ...(condition ? { condition } : {}),
      description: includeHidden
        ? 'Use the page hierarchy, configure a custom trail, or hide breadcrumbs.'
        : 'Use the page hierarchy or configure a custom trail.',
    },
    options: [
      { label: 'Automatic — use page hierarchy', value: 'automatic' },
      { label: 'Custom — configure trail below', value: 'custom' },
      ...(includeHidden ? [{ label: 'Hidden', value: 'hidden' }] : []),
    ],
  }
}

export function createBreadcrumbsField({
  condition,
}: {
  condition?: Condition
} = {}): ArrayField {
  return {
    name: 'breadcrumbs',
    label: 'Custom Breadcrumbs',
    type: 'array',
    maxRows: 8,
    admin: {
      condition: (data, siblingData, operation) =>
        usesCustomBreadcrumbs(data, siblingData) &&
        (condition?.(data, siblingData, operation) ?? true),
      initCollapsed: true,
      description:
        'The last item is the current page and is not linked. Empty or unresolved destinations render as text.',
    },
    fields: [
      { name: 'label', type: 'text', required: true },
      {
        name: 'linkType',
        label: 'Link Type',
        type: 'radio',
        defaultValue: 'page',
        options: [
          { label: 'Page', value: 'page' },
          { label: 'Custom URL', value: 'custom' },
        ],
        admin: { layout: 'horizontal' },
      } satisfies RadioField,
      {
        name: 'page',
        type: 'relationship',
        relationTo: 'pages',
        admin: { condition: isPageLink },
      },
      {
        name: 'url',
        label: 'Custom URL',
        type: 'text',
        admin: { condition: isCustomLink },
      },
    ],
  }
}
