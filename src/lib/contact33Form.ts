import type { Form } from '@/payload-types'

export type Contact33FieldName = 'email' | 'message' | 'name' | 'subject'

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
  type: 'email' | 'select' | 'text' | 'textarea'
}

const fallbackFields: Record<Contact33FieldName, Contact33FieldDefinition> = {
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
  select: 'Select',
  text: 'Text',
  textarea: 'Textarea',
} as const

export function validateContact33FormDefinition(
  form: Pick<Contact33FormLike, 'fields'> | null | undefined,
): true | string {
  const fields = form?.fields ?? []

  for (const [name, expectedType] of Object.entries(expectedTypes) as Array<
    [Contact33FieldName, (typeof expectedTypes)[Contact33FieldName]]
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

  const unsupportedRequiredField = fields.find(
    (field) => field.required && !(field.name in expectedTypes),
  )

  return unsupportedRequiredField
    ? `Contact 33 cannot render required field "${unsupportedRequiredField.name}".`
    : true
}

export function getContact33FieldDefinitions(
  form: Pick<Contact33FormLike, 'fields'> | null | undefined,
): Record<Contact33FieldName, Contact33FieldDefinition> {
  return Object.fromEntries(
    (Object.keys(fallbackFields) as Contact33FieldName[]).map((name) => {
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
  ) as Record<Contact33FieldName, Contact33FieldDefinition>
}
