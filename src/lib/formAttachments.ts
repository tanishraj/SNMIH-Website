import { randomBytes } from 'node:crypto'

import type { Payload } from 'payload'

import { FORM_ATTACHMENTS_COLLECTION } from '@/lib/formAttachmentsShared'
import {
  formFileKindDefinitions,
  getFileExtension,
  normalizeFormSubmissionMetadata,
  type FormSubmissionFileInfo,
  type FormSubmissionMetadata,
  type FormSubmissionValues,
  type SimpleFormField,
} from '@/lib/forms'

/** Largest multipart body the submit route accepts: one maximum-size file plus text fields. */
export const FORM_UPLOAD_BODY_LIMIT_BYTES = 12 * 1024 * 1024
/** Resend accepts about 40 MB per message; stay well under it. */
export const FORM_EMAIL_ATTACHMENTS_LIMIT_BYTES = 25 * 1024 * 1024

export type UploadedFormFile = {
  arrayBuffer: () => Promise<ArrayBuffer>
  name: string
  size: number
  type: string
}

export type ParsedFormSubmissionRequest = {
  files: Record<string, UploadedFormFile>
  metadata: FormSubmissionMetadata
  values: FormSubmissionValues
}

const isUploadedFile = (entry: unknown): entry is UploadedFormFile =>
  Boolean(
    entry &&
    typeof entry === 'object' &&
    typeof (entry as UploadedFormFile).arrayBuffer === 'function' &&
    typeof (entry as UploadedFormFile).name === 'string' &&
    typeof (entry as UploadedFormFile).size === 'number',
  )

/**
 * Reads either the JSON body existing forms send or the multipart body a form with file fields
 * sends. Multipart text parts become string values; `metadata` may be a JSON string.
 */
export const parseFormSubmissionRequest = async (
  request: Request,
): Promise<ParsedFormSubmissionRequest | null> => {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.toLowerCase().includes('multipart/form-data')) {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return null
    }

    const files: Record<string, UploadedFormFile> = {}
    const values: FormSubmissionValues = {}
    let metadata: unknown

    formData.forEach((entry, key) => {
      if (isUploadedFile(entry)) {
        // An empty <input type="file"> submits a nameless zero-byte part; treat it as absent.
        if (entry.size > 0 || entry.name) files[key] = entry
        return
      }
      if (typeof entry !== 'string') return
      if (key === 'metadata') {
        try {
          metadata = JSON.parse(entry)
        } catch {
          metadata = undefined
        }
        return
      }
      values[key] = entry
    })

    return { files, metadata: normalizeFormSubmissionMetadata(metadata), values }
  }

  try {
    const body = (await request.json()) as { metadata?: unknown; values?: unknown } | null
    const values =
      body?.values && typeof body.values === 'object' ? (body.values as FormSubmissionValues) : {}
    return { files: {}, metadata: normalizeFormSubmissionMetadata(body?.metadata), values }
  } catch {
    return null
  }
}

export const toFormSubmissionFileInfo = (file: UploadedFormFile): FormSubmissionFileInfo => ({
  name: file.name,
  size: file.size,
  type: file.type,
})

/** Merges uploaded files into the value map so shared validation can check them like other fields. */
export const withFileValues = (
  values: FormSubmissionValues,
  files: Record<string, UploadedFormFile>,
  fields: SimpleFormField[],
): FormSubmissionValues => {
  const merged: FormSubmissionValues = { ...values }
  for (const field of fields) {
    if (field.type !== 'file') continue
    const file = files[field.name]
    merged[field.name] = file ? toFormSubmissionFileInfo(file) : undefined
  }
  return merged
}

const mimeTypeForExtension = (extension: string): string => {
  for (const kind of Object.values(formFileKindDefinitions)) {
    const index = kind.extensions.indexOf(extension)
    if (index >= 0) return kind.mimeTypes[Math.min(index, kind.mimeTypes.length - 1)]
  }
  return 'application/octet-stream'
}

/** Keeps the visitor's filename readable but unguessable, without path or control characters. */
export const buildStoredAttachmentFilename = (originalName: string): string => {
  const base = originalName.split(/[\\/]/).pop() ?? ''
  const extension = getFileExtension(base)
  const stem = (extension ? base.slice(0, -(extension.length + 1)) : base)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${randomBytes(6).toString('hex')}-${stem || 'file'}${extension ? `.${extension}` : ''}`
}

/** Payload rejected the file itself (corrupted, mismatched or disallowed content). */
export class FormAttachmentValidationError extends Error {
  readonly fieldLabel: string
  readonly fieldName: string

  constructor(field: Pick<SimpleFormField, 'label' | 'name'>) {
    super(`Uploaded file for "${field.name}" failed content validation.`)
    this.name = 'FormAttachmentValidationError'
    this.fieldLabel = field.label
    this.fieldName = field.name
  }

  /** Message shown under the field on the public form. */
  get publicMessage(): string {
    return `${this.fieldLabel} could not be read as a valid file. Please upload the original document, not a renamed or damaged copy.`
  }
}

const isPayloadFileValidationError = (error: unknown): boolean =>
  Boolean(
    error &&
    typeof error === 'object' &&
    (error as { name?: string }).name === 'ValidationError' &&
    JSON.stringify((error as { data?: unknown }).data ?? '').includes('"file"'),
  )

export type StoredFormAttachment = {
  content: Buffer
  fieldName: string
  id: string
  mimeType: string
  originalFilename: string
}

/** Stores each uploaded file in Form Attachments and returns what the e-mail and submission need. */
export const storeFormAttachments = async ({
  fields,
  files,
  formId,
  payload,
}: {
  fields: SimpleFormField[]
  files: Record<string, UploadedFormFile>
  formId: string
  payload: Pick<Payload, 'create'>
}): Promise<StoredFormAttachment[]> => {
  const stored: StoredFormAttachment[] = []

  for (const field of fields) {
    if (field.type !== 'file') continue
    const file = files[field.name]
    if (!file) continue

    const content = Buffer.from(await file.arrayBuffer())
    const originalFilename = file.name.split(/[\\/]/).pop() || 'file'
    const mimeType =
      file.type && file.type !== 'application/octet-stream'
        ? file.type
        : mimeTypeForExtension(getFileExtension(originalFilename))

    let attachmentId: string
    try {
      const attachment = await payload.create({
        collection: FORM_ATTACHMENTS_COLLECTION,
        data: {
          fieldName: field.name,
          form: formId,
          originalFilename,
        },
        file: {
          data: content,
          mimetype: mimeType,
          name: buildStoredAttachmentFilename(originalFilename),
          size: content.length,
        },
        overrideAccess: true,
      })
      attachmentId = attachment.id
    } catch (error) {
      if (isPayloadFileValidationError(error)) {
        throw new FormAttachmentValidationError(field)
      }
      throw error
    }

    stored.push({ content, fieldName: field.name, id: attachmentId, mimeType, originalFilename })
  }

  return stored
}

/** Attachments for `payload.sendEmail`, base64-encoded so every adapter can serialise them. */
export const buildEmailAttachments = (
  attachments: StoredFormAttachment[],
): Array<{ content: string; contentType: string; filename: string }> => {
  let total = 0
  const result: Array<{ content: string; contentType: string; filename: string }> = []
  for (const attachment of attachments) {
    total += attachment.content.length
    if (total > FORM_EMAIL_ATTACHMENTS_LIMIT_BYTES) break
    result.push({
      content: attachment.content.toString('base64'),
      contentType: attachment.mimeType,
      filename: attachment.originalFilename,
    })
  }
  return result
}
