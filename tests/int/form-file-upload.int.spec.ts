// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FormAttachments } from '@/collections/FormAttachments'
import { FormSubmissions } from '@/collections/FormSubmissions'
import { validateContact33FormDefinition } from '@/lib/contact33Form'
import {
  buildEmailAttachments,
  buildStoredAttachmentFilename,
  parseFormSubmissionRequest,
} from '@/lib/formAttachments'
import { FORM_ATTACHMENT_MIME_TYPES } from '@/lib/formAttachmentsShared'
import {
  describeFormFileRules,
  formFieldTypeOptions,
  getFormFileAcceptAttribute,
  resolveFormFileMaxMB,
  validateFormFieldDefinitionsForIntent,
  validateFormSubmission,
  type SimpleFormField,
} from '@/lib/forms'

const payloadMocks = vi.hoisted(() => ({
  create: vi.fn(),
  find: vi.fn(),
  findGlobal: vi.fn(),
  loggerError: vi.fn(),
  sendEmail: vi.fn(),
  update: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    create: payloadMocks.create,
    find: payloadMocks.find,
    findGlobal: payloadMocks.findGlobal,
    logger: { error: payloadMocks.loggerError },
    sendEmail: payloadMocks.sendEmail,
    update: payloadMocks.update,
  })),
}))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/formSubmissionEvents', () => ({ emitFormSubmissionEvent: vi.fn() }))
vi.mock('@/lib/formSpamProtection', () => ({
  getClientIPAddress: () => '127.0.0.1',
  isRateLimited: () => false,
  isSpamHoneypotTriggered: () => false,
  recordSubmissionAttempt: vi.fn(),
}))

const cvField: SimpleFormField = {
  fileTypes: ['pdf', 'document'],
  label: 'CV',
  maxFileSizeMB: 2,
  name: 'cv',
  required: true,
  type: 'file',
}

const applicationForm = {
  fields: [
    { label: 'Full name', name: 'fullName', required: true, type: 'text' },
    { label: 'Email', name: 'email', required: true, type: 'email' },
    { ...cvField },
  ],
  id: 'form-1',
  notificationRecipients: [{ email: 'hr@example.test' }],
  slug: 'career-application',
  submissionIntent: 'lead',
  successMessage: 'Thanks. Your application has been received.',
  title: 'Career Application',
}

const pdfBytes = new TextEncoder().encode('%PDF-1.4\n%%EOF\n')

const multipartRequest = (
  entries: Record<string, File | string>,
  headers: Record<string, string> = {},
) => {
  const body = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    if (value instanceof File) body.append(key, value, value.name)
    else body.append(key, value)
  }
  return new Request('http://localhost/api/forms/career-application/submit', {
    body,
    headers,
    method: 'POST',
  })
}

const loadRoute = async () => {
  vi.resetModules()
  return import('@/app/api/forms/[slug]/submit/route')
}

describe('file upload form fields', () => {
  it('is a first-class field type with sensible defaults and hints', () => {
    expect(formFieldTypeOptions).toContainEqual({ label: 'File upload', value: 'file' })
    expect(getFormFileAcceptAttribute({ fileTypes: null })).toBe('.pdf,.doc,.docx')
    expect(getFormFileAcceptAttribute({ fileTypes: ['image'] })).toBe('.jpg,.jpeg,.png')
    expect(describeFormFileRules({ fileTypes: null, maxFileSizeMB: null })).toBe(
      'PDF or Word document, up to 5 MB',
    )
    expect(resolveFormFileMaxMB({ maxFileSizeMB: 50 })).toBe(10)
    expect(resolveFormFileMaxMB({ maxFileSizeMB: 0 })).toBe(5)
  })

  it('validates presence, extension, MIME type and size of a submitted file', () => {
    const run = (value: unknown) =>
      validateFormSubmission({ fields: [cvField], values: { cv: value } })

    expect(run(undefined).errors).toEqual({ cv: 'CV is required.' })
    expect(run({ name: 'cv.exe', size: 10, type: 'application/octet-stream' }).errors.cv).toContain(
      'must be a PDF or Word document',
    )
    expect(run({ name: 'cv.pdf', size: 10, type: 'image/png' }).errors.cv).toBe(
      'CV has an unsupported file type.',
    )
    expect(run({ name: 'cv.pdf', size: 3 * 1024 * 1024, type: 'application/pdf' }).errors.cv).toBe(
      'CV must be 2 MB or smaller.',
    )
    expect(run({ name: 'cv.pdf', size: 0, type: 'application/pdf' }).errors.cv).toBe('CV is empty.')

    const valid = run({ name: 'Asha CV.PDF', size: 1024, type: 'application/pdf' })
    expect(valid.errors).toEqual({})
    expect(valid.normalizedData).toEqual({ cv: 'Asha CV.PDF' })
  })

  it('keeps file fields out of the fixed Review Submission and Contact Form renderers', () => {
    expect(
      validateFormFieldDefinitionsForIntent({
        fields: [{ label: 'CV', name: 'cv', required: false, type: 'file' }],
        submissionIntent: 'review',
      }),
    ).toBe('Review Submission cannot render file upload field "cv".')
    expect(
      validateFormFieldDefinitionsForIntent({
        fields: [{ label: 'CV', name: 'cv', required: true, type: 'file' }],
        submissionIntent: 'lead',
      }),
    ).toBe(true)
    expect(
      validateContact33FormDefinition({
        fields: [
          { label: 'Name', name: 'name', type: 'text' },
          { label: 'Email', name: 'email', type: 'email' },
          {
            label: 'Subject',
            name: 'subject',
            options: [{ label: 'A', value: 'a' }],
            type: 'select',
          },
          { label: 'Message', name: 'message', type: 'textarea' },
          { label: 'CV', name: 'cv', type: 'file' },
        ],
      } as never),
    ).toContain('cannot render file upload field "cv"')
  })

  it('stores uploads in a private, append-only Form Attachments collection', () => {
    expect(FormAttachments.slug).toBe('form-attachments')
    expect(FormAttachments.admin?.group).toBe('Forms')
    expect(FormAttachments.access?.create?.({} as never)).toBe(false)
    expect(FormAttachments.access?.update?.({} as never)).toBe(false)
    expect(FormAttachments.access?.read?.({ req: { user: null } } as never)).toBe(false)
    expect(FormAttachments.access?.read?.({ req: { user: { role: 'admin' } } } as never)).toBe(true)
    const upload = FormAttachments.upload as { mimeTypes?: string[]; staticDir?: string }
    expect(upload.staticDir).toBe('form-attachments')
    expect(upload.mimeTypes).toEqual(FORM_ATTACHMENT_MIME_TYPES)
    expect(FORM_ATTACHMENT_MIME_TYPES).toEqual(
      expect.arrayContaining([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
      ]),
    )

    const attachments = FormSubmissions.fields.find(
      (field) => 'name' in field && field.name === 'attachments',
    )
    expect(attachments).toMatchObject({
      admin: { readOnly: true },
      hasMany: true,
      relationTo: 'form-attachments',
      type: 'relationship',
    })
  })

  it('names stored files unguessably and base64-encodes e-mail attachments', () => {
    expect(buildStoredAttachmentFilename('../tmp/My CV (final).PDF')).toMatch(
      /^[0-9a-f]{12}-My-CV-final\.pdf$/,
    )
    expect(buildStoredAttachmentFilename('résumé')).toMatch(/^[0-9a-f]{12}-r-sum$/)

    const content = Buffer.from('hello')
    expect(
      buildEmailAttachments([
        {
          content,
          fieldName: 'cv',
          id: 'a',
          mimeType: 'application/pdf',
          originalFilename: 'cv.pdf',
        },
      ]),
    ).toEqual([
      { content: content.toString('base64'), contentType: 'application/pdf', filename: 'cv.pdf' },
    ])
  })

  it('parses multipart bodies into values, files and metadata', async () => {
    const parsed = await parseFormSubmissionRequest(
      multipartRequest({
        cv: new File([pdfBytes], 'cv.pdf', { type: 'application/pdf' }),
        fullName: 'Asha Verma',
        metadata: JSON.stringify({ landingPage: '/apply', source: 'linkedin' }),
      }),
    )

    expect(parsed?.values).toEqual({ fullName: 'Asha Verma' })
    expect(parsed?.metadata).toEqual({ landingPage: '/apply', source: 'linkedin' })
    expect(parsed?.files.cv?.name).toBe('cv.pdf')
    expect(parsed?.files.cv?.size).toBe(pdfBytes.length)
  })
})

describe('submit route with file uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMocks.find.mockResolvedValue({ docs: [applicationForm] })
    payloadMocks.findGlobal.mockResolvedValue({ siteName: 'SNMIH', timeZone: 'Asia/Kolkata' })
    payloadMocks.sendEmail.mockResolvedValue(undefined)
    payloadMocks.update.mockResolvedValue({})
    payloadMocks.create.mockImplementation(async ({ collection }: { collection: string }) =>
      collection === 'form-attachments' ? { id: 'att-1' } : { id: 'sub-1' },
    )
  })

  it('stores the file, links it to the submission and attaches it to the notification e-mail', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      multipartRequest({
        cv: new File([pdfBytes], 'Asha CV.pdf', { type: 'application/pdf' }),
        email: 'asha@example.com',
        fullName: 'Asha Verma',
        metadata: JSON.stringify({ landingPage: '/apply-test' }),
        website: '',
      }),
      { params: Promise.resolve({ slug: 'career-application' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Thanks. Your application has been received.',
    })

    const attachmentCreate = payloadMocks.create.mock.calls.find(
      ([args]) => args.collection === 'form-attachments',
    )?.[0]
    expect(attachmentCreate).toMatchObject({
      data: { fieldName: 'cv', form: 'form-1', originalFilename: 'Asha CV.pdf' },
      file: { mimetype: 'application/pdf', size: pdfBytes.length },
      overrideAccess: true,
    })
    expect(attachmentCreate.file.name).toMatch(/^[0-9a-f]{12}-Asha-CV\.pdf$/)
    expect(Buffer.isBuffer(attachmentCreate.file.data)).toBe(true)

    const submissionCreate = payloadMocks.create.mock.calls.find(
      ([args]) => args.collection === 'form-submissions',
    )?.[0]
    expect(submissionCreate.data).toMatchObject({
      attachments: ['att-1'],
      data: { cv: 'Asha CV.pdf', email: 'asha@example.com', fullName: 'Asha Verma' },
      landingPage: '/apply-test',
      submitterEmail: 'asha@example.com',
      submitterName: 'Asha Verma',
    })

    expect(payloadMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'form-attachments',
        data: { submission: 'sub-1' },
        id: 'att-1',
      }),
    )

    expect(payloadMocks.sendEmail).toHaveBeenCalledTimes(1)
    const email = payloadMocks.sendEmail.mock.calls[0][0]
    expect(email.to).toEqual(['hr@example.test'])
    expect(email.attachments).toEqual([
      {
        content: Buffer.from(pdfBytes).toString('base64'),
        contentType: 'application/pdf',
        filename: 'Asha CV.pdf',
      },
    ])
    expect(email.text).toContain('CV: Asha CV.pdf (attached)')
  })

  it('rejects a disallowed or missing file before storing anything', async () => {
    const { POST } = await loadRoute()

    const wrongType = await POST(
      multipartRequest({
        cv: new File([pdfBytes], 'cv.exe', { type: 'application/octet-stream' }),
        email: 'asha@example.com',
        fullName: 'Asha Verma',
      }),
      { params: Promise.resolve({ slug: 'career-application' }) },
    )
    expect(wrongType.status).toBe(400)
    const wrongTypeBody = await wrongType.json()
    expect(wrongTypeBody.errors.cv).toContain('must be a PDF or Word document')

    const missing = await POST(
      multipartRequest({ email: 'asha@example.com', fullName: 'Asha Verma' }),
      { params: Promise.resolve({ slug: 'career-application' }) },
    )
    expect(missing.status).toBe(400)
    await expect(missing.json()).resolves.toMatchObject({ errors: { cv: 'CV is required.' } })

    const tooLarge = await POST(
      multipartRequest({ fullName: 'x' }, { 'content-length': String(20 * 1024 * 1024) }),
      { params: Promise.resolve({ slug: 'career-application' }) },
    )
    expect(tooLarge.status).toBe(413)

    expect(payloadMocks.create).not.toHaveBeenCalled()
    expect(payloadMocks.sendEmail).not.toHaveBeenCalled()
  })

  it('reports a file Payload rejects as corrupted under its field instead of failing silently', async () => {
    payloadMocks.create.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'form-attachments') {
        throw Object.assign(new Error('The following field is invalid: file'), {
          data: { errors: [{ message: 'Invalid or corrupted PDF file.', path: 'file' }] },
          name: 'ValidationError',
        })
      }
      return { id: 'sub-1' }
    })

    const { POST } = await loadRoute()
    const response = await POST(
      multipartRequest({
        cv: new File([new Uint8Array(64)], 'cv.pdf', { type: 'application/pdf' }),
        email: 'asha@example.com',
        fullName: 'Asha Verma',
      }),
      { params: Promise.resolve({ slug: 'career-application' }) },
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.errors.cv).toContain('could not be read as a valid file')
    expect(
      payloadMocks.create.mock.calls.some(([args]) => args.collection === 'form-submissions'),
    ).toBe(false)
    expect(payloadMocks.sendEmail).not.toHaveBeenCalled()
  })
})
