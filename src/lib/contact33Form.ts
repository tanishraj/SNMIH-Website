import type { Form } from '@/payload-types'

export type Contact33FieldName = 'email' | 'message' | 'name' | 'phone' | 'subject'
type Contact33CoreFieldName = Exclude<Contact33FieldName, 'phone'>

export type Contact33FormLike = Pick<
  Form,
  'fields' | 'slug' | 'submitButtonLabel' | 'successMessage' | 'title'
>

export type Contact33FieldDefinition = {
  label: string
  name: Contact33FieldName
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  required: boolean
  type: 'email' | 'phone' | 'select' | 'text' | 'textarea'
}

export type Contact33FieldDefinitions = Record<Contact33CoreFieldName, Contact33FieldDefinition> & {
  phone?: Contact33FieldDefinition
}

const fallbackFields: Record<Contact33CoreFieldName, Contact33FieldDefinition> = {
  name: {
    label: 'Name',
    name: 'name',
    placeholder: 'Your name',
    required: true,
    type: 'text',
  },
  email: {
    label: 'Email',
    name: 'email',
    placeholder: 'you@example.com',
    required: true,
    type: 'email',
  },
  subject: {
    label: 'Subject',
    name: 'subject',
    options: [{ label: 'General inquiry', value: 'general' }],
    required: false,
    type: 'select',
  },
  message: {
    label: 'Message',
    name: 'message',
    placeholder: 'How can we help?',
    required: true,
    type: 'textarea',
  },
}

const expectedTypes = {
  email: 'email',
  message: 'textarea',
  name: 'text',
  subject: 'select',
} as const

const typeLabels = {
  email: 'Email',
  phone: 'Phone',
  select: 'Select',
  text: 'Text',
  textarea: 'Textarea',
} as const

export function validateContact33FormDefinition(
  form: Pick<Contact33FormLike, 'fields'> | null | undefined,
): true | string {
  const fields = form?.fields ?? []

  for (const [name, expectedType] of Object.entries(expectedTypes) as Array<
    [Contact33CoreFieldName, (typeof expectedTypes)[Contact33CoreFieldName]]
  >) {
    const field = fields.find((candidate) => candidate.name === name)

    if (!field) {
      return `Contact form must include a "${name}" ${typeLabels[expectedType]} field.`
    }

    if (field.type !== expectedType) {
      return `Contact form field "${name}" must use the ${typeLabels[expectedType]} type.`
    }

    if (name === 'subject' && !field.options?.length) {
      return 'Contact form field "subject" must include at least one option.'
    }
  }

  const fileField = fields.find((candidate) => candidate.type === 'file')

  if (fileField) {
    return `Contact Form cannot render file upload field "${fileField.name}". Use the Dynamic Form block for forms with file uploads.`
  }

  const phoneField = fields.find((candidate) => candidate.name === 'phone')

  if (phoneField && phoneField.type !== 'phone') {
    return 'Contact form field "phone" must use the Phone type.'
  }

  const unsupportedRequiredField = fields.find(
    (field) => field.required && field.name !== 'phone' && !(field.name in expectedTypes),
  )

  return unsupportedRequiredField
    ? `Contact 33 cannot render required field "${unsupportedRequiredField.name}".`
    : true
}

export function getContact33FieldDefinitions(
  form: Pick<Contact33FormLike, 'fields'> | null | undefined,
): Contact33FieldDefinitions {
  const definitions = Object.fromEntries(
    (Object.keys(fallbackFields) as Contact33CoreFieldName[]).map((name) => {
      const fallback = fallbackFields[name]
      const field = form?.fields?.find((candidate) => candidate.name === name)
      const options =
        field?.options?.flatMap((option) => {
          const label = option.label?.trim()
          const value = option.value?.trim()

          return label && value ? [{ label, value }] : []
        }) ?? []

      return [
        name,
        {
          ...fallback,
          label: field?.label?.trim() || fallback.label,
          options: name === 'subject' && options.length ? options : fallback.options,
          placeholder: field?.placeholder?.trim() || fallback.placeholder,
          required: field?.required ?? fallback.required,
        },
      ]
    }),
  ) as Record<Contact33CoreFieldName, Contact33FieldDefinition>
  const phoneField = form?.fields?.find(
    (candidate) => candidate.name === 'phone' && candidate.type === 'phone',
  )

  return {
    ...definitions,
    ...(phoneField
      ? {
          phone: {
            label: phoneField.label?.trim() || 'Phone',
            name: 'phone' as const,
            placeholder: phoneField.placeholder?.trim() || undefined,
            required: phoneField.required ?? false,
            type: 'phone' as const,
          },
        }
      : {}),
  }
}
