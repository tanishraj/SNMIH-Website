import type { Condition, SelectField } from 'payload'

import type { OverlayDisplayMode } from '@/blocks/shared/overlayDisplayPresentation'

export function createOverlayDisplayField({
  condition,
  defaultValue,
}: {
  condition: Condition
  defaultValue: OverlayDisplayMode
}): SelectField {
  return {
    name: 'overlayDisplay',
    label: 'Overlay Display',
    type: 'select',
    defaultValue,
    options: [
      { label: 'Always Visible', value: 'always' },
      { label: 'Reveal on Hover', value: 'hover' },
    ],
    required: true,
    admin: {
      condition,
      description:
        'Choose whether overlay details remain visible or reveal on hover and keyboard focus. Touch devices always keep details visible.',
    },
  }
}
