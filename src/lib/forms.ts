export const formFieldTypeOptions = [
  {
    label: 'Text',
    value: 'text',
  },
  {
    label: 'Email',
    value: 'email',
  },
  {
    label: 'Phone',
    value: 'phone',
  },
  {
    label: 'Textarea',
    value: 'textarea',
  },
  {
    label: 'Select',
    value: 'select',
  },
  {
    label: 'Checkbox',
    value: 'checkbox',
  },
] as const

export type FormFieldType = (typeof formFieldTypeOptions)[number]['value']

export const formSubmissionIntentOptions = [
  {
    label: 'General',
    value: 'general',
  },
  {
    label: 'Lead',
    value: 'lead',
  },
  {
    label: 'Review',
    value: 'review',
  },
] as const

export type FormSubmissionIntent = (typeof formSubmissionIntentOptions)[number]['value']

export type SimpleFormFieldOption = {
  label: string
  value: string
}

export type SimpleFormField = {
  name: string
  label: string
  options?: SimpleFormFieldOption[] | null
  placeholder?: string | null
  required?: boolean | null
  type: FormFieldType
}

export type FormSubmissionValues = Record<string, unknown>
export type FormSubmissionErrors = Record<string, string>
export type FormSubmissionMetadata = {
  campaign?: string
  landingPage?: string
  source?: string
}

export const FORM_HONEYPOT_FIELD_NAME = 'website'
export const FORM_RATE_LIMIT_MAX_SUBMISSIONS = 5
export const FORM_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
export const FORM_PHONE_MAX_DIGITS = 15
export const FORM_PHONE_MAX_INPUT_LENGTH = 25

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneCharactersPattern = /^\+?[\d][\d\s()./-]*$/
const phoneDigitPattern = /\d/
const phoneFormattingCharacterPattern = /[\s()./-]/

export const sanitizePhoneNumberInput = (value: string): string => {
  let digitCount = 0
  let sanitizedValue = ''

  for (const character of value) {
    if (sanitizedValue.length >= FORM_PHONE_MAX_INPUT_LENGTH) {
      break
    }

    if (phoneDigitPattern.test(character)) {
      if (digitCount < FORM_PHONE_MAX_DIGITS) {
        sanitizedValue += character
        digitCount += 1
      }

      continue
    }

    if (character === '+' && sanitizedValue.length === 0) {
      sanitizedValue += character
      continue
    }

    if (digitCount > 0 && phoneFormattingCharacterPattern.test(character)) {
      sanitizedValue += character
    }
  }

  return sanitizedValue
}

export const isValidPhoneNumber = (value: string): boolean => {
  const normalizedValue = value.trim()

  if (!phoneCharactersPattern.test(normalizedValue)) {
    return false
  }

  const digitCount = normalizedValue.replace(/\D/g, '').length

  return digitCount >= 7 && digitCount <= 15
}

export const isTextLikeFormFieldType = (type: FormFieldType): boolean => {
  return type === 'text' || type === 'email' || type === 'phone' || type === 'textarea'
}

export const isSelectFormFieldType = (type: FormFieldType): boolean => {
  return type === 'select'
}

export const normalizeFormSubmissionIntent = (value: unknown): FormSubmissionIntent => {
  if (value === 'lead' || value === 'review') {
    return value
  }

  return 'general'
}

export const isReviewFormSubmissionIntent = (value: unknown): boolean => {
  return normalizeFormSubmissionIntent(value) === 'review'
}

export const normalizeFormFieldName = (value: string): string => {
  return value.trim()
}

export const isValidFormFieldName = (value: string): boolean => {
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value)
}

export const validateFormFieldDefinitions = (value: unknown): true | string => {
  if (!Array.isArray(value) || value.length === 0) {
    return 'Add at least one field.'
  }

  const seen = new Set<string>()

  for (const field of value) {
    if (!field || typeof field !== 'object') {
      return 'Each form field must be a valid object.'
    }

    const name = typeof field.name === 'string' ? normalizeFormFieldName(field.name) : ''

    if (!name) {
      return 'Each form field must include a name.'
    }

    if (!isValidFormFieldName(name)) {
      return 'Field names must start with a letter and use only letters, numbers, and underscores.'
    }

    if (seen.has(name)) {
      return `Field name "${name}" is duplicated.`
    }

    seen.add(name)

    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : []

      if (!options.length) {
        return `Select field "${name}" must include at least one option.`
      }

      const optionValues = new Set<string>()

      for (const option of options) {
        const optionValue = typeof option?.value === 'string' ? option.value.trim() : ''

        if (!optionValue) {
          return `Each option in select field "${name}" must include a value.`
        }

        if (optionValues.has(optionValue)) {
          return `Select field "${name}" has duplicate option value "${optionValue}".`
        }

        optionValues.add(optionValue)
      }
    }
  }

  return true
}

const reviewSubmissionProvidedFieldNames = new Set([
  'isGenuineExperience',
  'rating',
  'reviewBody',
  'reviewerEmail',
  'reviewerName',
  'reviewTitle',
  'subjectLabel',
])

export const validateFormFieldDefinitionsForIntent = ({
  fields,
  submissionIntent,
}: {
  fields: unknown
  submissionIntent: unknown
}): true | string => {
  const fieldValidation = validateFormFieldDefinitions(fields)

  if (
    fieldValidation !== true ||
    !Array.isArray(fields) ||
    !isReviewFormSubmissionIntent(submissionIntent)
  ) {
    return fieldValidation
  }

  const unsupportedRequiredField = fields.find((field): field is { name: string; required: true } =>
    Boolean(
      field &&
      typeof field === 'object' &&
      'required' in field &&
      field.required === true &&
      'name' in field &&
      typeof field.name === 'string' &&
      !reviewSubmissionProvidedFieldNames.has(normalizeFormFieldName(field.name)),
    ),
  )

  return unsupportedRequiredField
    ? `Review Submission cannot render required field "${normalizeFormFieldName(unsupportedRequiredField.name)}".`
    : true
}

const normalizeCheckboxValue = (value: unknown): boolean => {
  return value === true || value === 'true' || value === 'on' || value === '1' || value === 1
}

const normalizeTextValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

export const validateFormSubmission = ({
  fields,
  values,
}: {
  fields: SimpleFormField[]
  values: FormSubmissionValues
}): {
  errors: FormSubmissionErrors
  normalizedData: Record<string, boolean | string>
} => {
  const errors: FormSubmissionErrors = {}
  const normalizedData: Record<string, boolean | string> = {}

  for (const field of fields) {
    const rawValue = values[field.name]

    if (field.type === 'checkbox') {
      const normalizedValue = normalizeCheckboxValue(rawValue)
      normalizedData[field.name] = normalizedValue

      if (field.required && !normalizedValue) {
        errors[field.name] = `${field.label} must be accepted.`
      }

      continue
    }

    const normalizedValue = normalizeTextValue(rawValue)
    normalizedData[field.name] = normalizedValue

    if (field.required && !normalizedValue) {
      errors[field.name] = `${field.label} is required.`
      continue
    }

    if (field.type === 'email' && normalizedValue && !emailPattern.test(normalizedValue)) {
      errors[field.name] = `${field.label} must be a valid email address.`
      continue
    }

    if (field.type === 'phone' && normalizedValue && !isValidPhoneNumber(normalizedValue)) {
      errors[field.name] = `${field.label} must be a valid phone number.`
      continue
    }

    if (field.type === 'select' && normalizedValue) {
      const allowedValues = new Set((field.options ?? []).map((option) => option.value))

      if (!allowedValues.has(normalizedValue)) {
        errors[field.name] = `${field.label} contains an invalid option.`
      }
    }
  }

  return {
    errors,
    normalizedData,
  }
}

const getFirstNormalizedStringValue = (
  values: Record<string, boolean | string>,
  candidateKeys: string[],
): string | undefined => {
  for (const key of candidateKeys) {
    const rawValue = values[key]

    if (typeof rawValue !== 'string') {
      continue
    }

    const normalizedValue = rawValue.trim()

    if (normalizedValue) {
      return normalizedValue
    }
  }

  return undefined
}

export const getSubmissionContactMetadata = (
  values: Record<string, boolean | string>,
): {
  email?: string
  name?: string
  phone?: string
} => {
  const email = getFirstNormalizedStringValue(values, ['submitterEmail', 'reviewerEmail', 'email'])
  const name = getFirstNormalizedStringValue(values, [
    'submitterName',
    'reviewerName',
    'fullName',
    'name',
  ])
  const phone = getFirstNormalizedStringValue(values, [
    'submitterPhone',
    'phone',
    'phoneNumber',
    'telephone',
    'mobile',
  ])

  return {
    email,
    name,
    phone,
  }
}

const normalizeOptionalMetadataValue = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim()

  return normalizedValue || undefined
}

export const normalizeFormSubmissionMetadata = (value: unknown): FormSubmissionMetadata => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const metadata = value as Record<string, unknown>

  return {
    campaign: normalizeOptionalMetadataValue(metadata.campaign),
    landingPage: normalizeOptionalMetadataValue(metadata.landingPage),
    source: normalizeOptionalMetadataValue(metadata.source),
  }
}
