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
  {
    label: 'File upload',
    value: 'file',
  },
] as const

export type FormFieldType = (typeof formFieldTypeOptions)[number]['value']

export const formFileKindOptions = [
  { label: 'PDF (.pdf)', value: 'pdf' },
  { label: 'Word document (.doc, .docx)', value: 'document' },
  { label: 'Image (.jpg, .png)', value: 'image' },
] as const

export type FormFileKind = (typeof formFileKindOptions)[number]['value']

export const formFileKindDefinitions: Record<
  FormFileKind,
  { extensions: string[]; label: string; mimeTypes: string[] }
> = {
  document: {
    extensions: ['doc', 'docx'],
    label: 'Word document',
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  image: {
    extensions: ['jpg', 'jpeg', 'png'],
    label: 'JPG or PNG image',
    mimeTypes: ['image/jpeg', 'image/png'],
  },
  pdf: {
    extensions: ['pdf'],
    label: 'PDF',
    mimeTypes: ['application/pdf'],
  },
}

export const FORM_FILE_DEFAULT_KINDS: FormFileKind[] = ['pdf', 'document']
export const FORM_FILE_DEFAULT_MAX_MB = 5
export const FORM_FILE_MAX_MB = 10

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
  fileTypes?: FormFileKind[] | null
  label: string
  maxFileSizeMB?: number | null
  name: string
  options?: SimpleFormFieldOption[] | null
  placeholder?: string | null
  required?: boolean | null
  type: FormFieldType
}

/** What a submitted file looks like to validation: the bytes themselves stay in the request. */
export type FormSubmissionFileInfo = {
  name: string
  size: number
  type?: string | null
}

export const isFormSubmissionFileInfo = (value: unknown): value is FormSubmissionFileInfo =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as FormSubmissionFileInfo).name === 'string' &&
    typeof (value as FormSubmissionFileInfo).size === 'number',
  )

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

export const isFileFormFieldType = (type: FormFieldType): boolean => {
  return type === 'file'
}

/** Short fields can share a row in a rendered form; long or interactive ones take the full width. */
export const isShortFormFieldType = (type: FormFieldType): boolean => {
  return type === 'text' || type === 'email' || type === 'phone' || type === 'select'
}

const isFormFileKind = (value: unknown): value is FormFileKind =>
  typeof value === 'string' && value in formFileKindDefinitions

export const resolveFormFileKinds = (field: Pick<SimpleFormField, 'fileTypes'>): FormFileKind[] => {
  const kinds = (field.fileTypes ?? []).filter(isFormFileKind)
  return kinds.length ? [...new Set(kinds)] : FORM_FILE_DEFAULT_KINDS
}

export const resolveFormFileMaxMB = (field: Pick<SimpleFormField, 'maxFileSizeMB'>): number => {
  const value = field.maxFileSizeMB
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
    return FORM_FILE_DEFAULT_MAX_MB
  }
  return Math.min(Math.floor(value), FORM_FILE_MAX_MB)
}

export const resolveFormFileMaxBytes = (field: Pick<SimpleFormField, 'maxFileSizeMB'>): number =>
  resolveFormFileMaxMB(field) * 1024 * 1024

export const getFormFileExtensions = (field: Pick<SimpleFormField, 'fileTypes'>): string[] =>
  resolveFormFileKinds(field).flatMap((kind) => formFileKindDefinitions[kind].extensions)

export const getFormFileMimeTypes = (field: Pick<SimpleFormField, 'fileTypes'>): string[] =>
  resolveFormFileKinds(field).flatMap((kind) => formFileKindDefinitions[kind].mimeTypes)

/** Value for the `accept` attribute of a file input, e.g. ".pdf,.doc,.docx". */
export const getFormFileAcceptAttribute = (field: Pick<SimpleFormField, 'fileTypes'>): string =>
  getFormFileExtensions(field)
    .map((extension) => `.${extension}`)
    .join(',')

const joinWithOr = (parts: string[]): string =>
  parts.length <= 1
    ? (parts[0] ?? '')
    : `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`

/** Hint shown under a file input, e.g. "PDF or Word document, up to 5 MB". */
export const describeFormFileRules = (
  field: Pick<SimpleFormField, 'fileTypes' | 'maxFileSizeMB'>,
): string =>
  `${joinWithOr(resolveFormFileKinds(field).map((kind) => formFileKindDefinitions[kind].label))}, up to ${resolveFormFileMaxMB(field)} MB`

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export const getFileExtension = (filename: string): string => {
  const match = /\.([A-Za-z0-9]+)$/.exec(filename.trim())
  return match ? match[1].toLowerCase() : ''
}

/** Type and size rules for one uploaded file; the extension is authoritative because browsers report unreliable MIME types. */
export const validateFormFile = ({
  field,
  file,
}: {
  field: SimpleFormField
  file: FormSubmissionFileInfo
}): string | null => {
  const extensions = getFormFileExtensions(field)
  const mimeTypes = getFormFileMimeTypes(field)
  const extension = getFileExtension(file.name)
  const mimeType = file.type?.trim().toLowerCase() || ''

  if (!extension || !extensions.includes(extension)) {
    return `${field.label} must be a ${joinWithOr(
      resolveFormFileKinds(field).map((kind) => formFileKindDefinitions[kind].label),
    )} (${extensions.map((value) => `.${value}`).join(', ')}).`
  }

  if (mimeType && mimeType !== 'application/octet-stream' && !mimeTypes.includes(mimeType)) {
    return `${field.label} has an unsupported file type.`
  }

  if (file.size <= 0) {
    return `${field.label} is empty.`
  }

  if (file.size > resolveFormFileMaxBytes(field)) {
    return `${field.label} must be ${resolveFormFileMaxMB(field)} MB or smaller.`
  }

  return null
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

  const fileField = fields.find((field): field is { name: string; type: 'file' } =>
    Boolean(field && typeof field === 'object' && 'type' in field && field.type === 'file'),
  )

  if (fileField && typeof fileField.name === 'string') {
    return `Review Submission cannot render file upload field "${normalizeFormFieldName(fileField.name)}".`
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

    if (field.type === 'file') {
      // Stored data keeps the original filename; the file itself lives in Form Attachments.
      const file = isFormSubmissionFileInfo(rawValue) ? rawValue : null
      normalizedData[field.name] = file?.name.trim() ?? ''

      if (!file) {
        if (field.required) {
          errors[field.name] = `${field.label} is required.`
        }
        continue
      }

      const fileError = validateFormFile({ field, file })
      if (fileError) {
        errors[field.name] = fileError
      }

      continue
    }

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
