import type { Condition, SelectField } from 'payload'

import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from './mediaOverlayPresentation'

type CreateMediaOverlayFieldOptions<Value extends string> = {
  condition?: Condition
  defaultValue?: Value
  name?: string
  required?: boolean
}

const withCondition = (field: SelectField, condition?: Condition): SelectField =>
  condition ? { ...field, admin: { ...field.admin, condition } } : field

export const createMediaOverlayToneField = ({
  condition,
  defaultValue = 'auto',
  name = 'themeMode',
  required = true,
}: CreateMediaOverlayFieldOptions<MediaOverlayTone> = {}): SelectField =>
  withCondition(
    {
      name,
      label: 'Overlay Tone',
      type: 'select',
      defaultValue,
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Brand', value: 'brand' },
      ],
      required,
      admin: {
        description:
          'Auto uses Brand on brand surfaces and Dark elsewhere. Light uses dark copy; Dark and Brand use light copy.',
      },
    },
    condition,
  )

export const createMediaOverlayStrengthField = ({
  condition,
  defaultValue = 'dark',
  name = 'overlayStyle',
  required = true,
}: CreateMediaOverlayFieldOptions<MediaOverlayStrength> = {}): SelectField =>
  withCondition(
    {
      name,
      label: 'Overlay Strength',
      type: 'select',
      defaultValue,
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Darker', value: 'darker' },
      ],
      required,
    },
    condition,
  )

export const createMediaOverlayDirectionField = ({
  condition,
  defaultValue = 'vertical',
  name = 'overlayDirection',
  required = true,
}: CreateMediaOverlayFieldOptions<MediaOverlayDirection> = {}): SelectField =>
  withCondition(
    {
      name,
      label: 'Overlay Direction',
      type: 'select',
      defaultValue,
      options: [
        { label: 'Even / Vertical', value: 'vertical' },
        { label: 'Left to Right', value: 'leftToRight' },
        { label: 'Right to Left', value: 'rightToLeft' },
        { label: 'Bottom to Top', value: 'bottomToTop' },
        { label: 'Top to Bottom', value: 'topToBottom' },
      ],
      required,
      admin: {
        description: 'The named edge receives the strongest tint; Even keeps coverage balanced.',
      },
    },
    condition,
  )

export const createMediaOverlayCoverageField = ({
  condition,
  defaultValue = 'full',
  name = 'overlayCoverage',
  required = true,
}: CreateMediaOverlayFieldOptions<MediaOverlayCoverage> = {}): SelectField =>
  withCondition(
    {
      name,
      label: 'Overlay Coverage',
      type: 'select',
      defaultValue,
      options: [
        { label: 'Full', value: 'full' },
        { label: 'Split (50%)', value: 'split' },
      ],
      required,
      admin: {
        description:
          'Full spans the image. Split limits directional gradients to the strongest half; Even remains full-frame.',
      },
    },
    condition,
  )
