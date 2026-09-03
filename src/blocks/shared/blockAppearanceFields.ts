import type { Condition, GroupField, SelectField } from 'payload'

import { normalizeBlockBackground } from './blockAppearance'

type CreateBlockAppearanceFieldsOptions = {
  condition?: Condition
  includeBackground?: boolean
  includeBorder?: boolean
  label?: string
  name?: string
}

const backgroundField = {
  name: 'background',
  label: 'Background',
  type: 'select',
  defaultValue: 'none',
  options: [
    { label: 'None (page background)', value: 'none' },
    { label: 'Subtle', value: 'subtle' },
    { label: 'Brand', value: 'brand' },
    { label: 'Gradient: Subtle', value: 'gradient-subtle' },
    { label: 'Gradient: Brand', value: 'gradient-brand' },
  ],
  required: true,
  hooks: {
    // Content saved before the palette collapsed still holds retired values such
    // as 'muted' or 'gradient-accent'. Without this the admin select would render
    // blank for those blocks; folding them to the nearest surviving surface on
    // read keeps existing pages editable and migrates them on the next save.
    afterRead: [({ value }) => normalizeBlockBackground(value as string | null | undefined)],
  },
} satisfies SelectField

const borderField = {
  name: 'border',
  label: 'Border',
  type: 'select',
  defaultValue: 'none',
  options: [
    { label: 'None', value: 'none' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Top and Bottom', value: 'topAndBottom' },
  ],
  required: true,
} satisfies SelectField

export const createBlockAppearanceFields = ({
  condition,
  includeBackground = true,
  includeBorder = true,
  label = 'Appearance',
  name = 'appearance',
}: CreateBlockAppearanceFieldsOptions = {}): GroupField =>
  ({
    name,
    label,
    type: 'group',
    ...(condition ? { admin: { condition } } : {}),
    fields: [
      ...(includeBackground ? [backgroundField] : []),
      ...(includeBorder ? [borderField] : []),
    ],
  }) satisfies GroupField
