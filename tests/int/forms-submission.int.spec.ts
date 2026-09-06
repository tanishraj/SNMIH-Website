import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Field } from 'payload'

import { FormSubmissions } from '@/collections/FormSubmissions'
import { updateFormSubmissionActivity } from '@/hooks/updateFormSubmissionActivity'
import { formFieldTypeOptions, validateFormFieldDefinitionsForIntent } from '@/lib/forms'
import { reviewRatingOptions } from '@/lib/reviews'

const payloadMocks = vi.hoisted(() => {
  return {
    create: vi.fn(),
    find: vi.fn(),
    findGlobal: vi.fn(),
    loggerError: vi.fn(),
    sendEmail: vi.fn(),
    update: vi.fn(),
  }
})

const eventMocks = vi.hoisted(() => {
  return {
    emitFormSubmissionEvent: vi.fn(),
  }
})

const spamProtectionMocks = vi.hoisted(() => {
  return {
    getClientIPAddress: vi.fn(),
    isRateLimited: vi.fn(),
    isSpamHoneypotTriggered: vi.fn(),
    recordSubmissionAttempt: vi.fn(),
  }
})

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    create: payloadMocks.create,
    find: payloadMocks.find,
    findGlobal: payloadMocks.findGlobal,
    logger: {
      error: payloadMocks.loggerError,
    },
    sendEmail: payloadMocks.sendEmail,
    update: payloadMocks.update,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/lib/formSubmissionEvents', () => ({
  emitFormSubmissionEvent: eventMocks.emitFormSubmissionEvent,
}))

vi.mock('@/lib/formSpamProtection', () => ({
  getClientIPAddress: spamProtectionMocks.getClientIPAddress,
  isRateLimited: spamProtectionMocks.isRateLimited,
  isSpamHoneypotTriggered: spamProtectionMocks.isSpamHoneypotTriggered,
  recordSubmissionAttempt: spamProtectionMocks.recordSubmissionAttempt,
}))

type NamedField = {
  admin?: {
    readOnly?: boolean
  }
  defaultValue?: unknown
  name: string
  options?: Array<string | { value: string }>
  type: string
}

const getField = (fieldName: string): NamedField => {
  const field = FormSubmissions.fields.find(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'name' in candidate &&
      candidate.name === fieldName,
  ) as Field | undefined

  if (!field) {
    throw new Error(`Expected FormSubmissions to include "${fieldName}".`)
  }

  return field as unknown as NamedField
}

const loadRouteModule = async () => {
  vi.resetModules()
  return import('@/app/api/forms/[slug]/submit/route')
}

describe('form submission model', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    spamProtectionMocks.getClientIPAddress.mockReturnValue('127.0.0.1')
    spamProtectionMocks.isRateLimited.mockReturnValue(false)
    spamProtectionMocks.isSpamHoneypotTriggered.mockReturnValue(false)
    eventMocks.emitFormSubmissionEvent.mockResolvedValue(undefined)
    payloadMocks.sendEmail.mockResolvedValue(undefined)
  })

  it('stores operator-friendly submission fields', () => {
    const statusField = getField('status')
    const emailField = getField('email')
    const submissionIntentField = getField('submissionIntent')
    const submittedAtField = getField('submittedAt')
    const submitterEmailField = getField('submitterEmail')
    const submitterPhoneField = getField('submitterPhone')
    const linkedReviewField = getField('linkedReview')
    const ownerField = getField('owner')
    const internalNotesField = getField('internalNotes')
    const lastActionAtField = getField('lastActionAt')

    expect(statusField.type).toBe('select')
    expect(statusField.defaultValue).toBe('new')
    expect(
      statusField.options?.map((option) => (typeof option === 'string' ? option : option.value)),
    ).toEqual(['new', 'in_review', 'qualified', 'won', 'rejected', 'archived'])
    expect(submissionIntentField.type).toBe('select')
    expect(submissionIntentField.defaultValue).toBe('general')
    expect(submissionIntentField.admin?.readOnly).toBe(true)
    expect(ownerField.type).toBe('relationship')
    expect(internalNotesField.type).toBe('textarea')
    expect(emailField.type).toBe('email')
    expect(emailField.admin?.readOnly).toBe(true)
    expect(submitterEmailField.type).toBe('email')
    expect(submitterEmailField.admin?.readOnly).toBe(true)
    expect(submitterPhoneField.type).toBe('text')
    expect(submitterPhoneField.admin?.readOnly).toBe(true)
    expect(linkedReviewField.type).toBe('relationship')
    expect(submittedAtField.type).toBe('date')
    expect(submittedAtField.admin?.readOnly).toBe(true)
    expect(lastActionAtField.type).toBe('date')
    expect(lastActionAtField.admin?.readOnly).toBe(true)
  })

  it('offers phone as a first-class form field type', () => {
    expect(formFieldTypeOptions).toContainEqual({
      label: 'Phone',
      value: 'phone',
    })
  })

  it('keeps phone available to contact forms while rejecting it as a required review-only field', () => {
    const phoneField = {
      label: 'Phone',
      name: 'phone',
      required: true,
      type: 'phone',
    }

    expect(
      validateFormFieldDefinitionsForIntent({
        fields: [phoneField],
        submissionIntent: 'lead',
      }),
    ).toBe(true)
    expect(
      validateFormFieldDefinitionsForIntent({
        fields: [phoneField],
        submissionIntent: 'review',
      }),
    ).toBe('Review Submission cannot render required field "phone".')
  })

  it('allows the required values that Review Submission supplies itself', () => {
    expect(
      validateFormFieldDefinitionsForIntent({
        fields: [
          {
            label: 'Rating',
            name: 'rating',
            options: reviewRatingOptions.map((option) => ({ ...option })),
            required: true,
            type: 'select',
          },
          {
            label: 'Review',
            name: 'reviewBody',
            required: true,
            type: 'textarea',
          },
          {
            label: 'Name',
            name: 'reviewerName',
            required: true,
            type: 'text',
          },
          {
            label: 'Genuine experience',
            name: 'isGenuineExperience',
            required: true,
            type: 'checkbox',
          },
        ],
        submissionIntent: 'review',
      }),
    ).toBe(true)
  })

  it('enriches persisted submissions and emits the starter event seam with ops metadata', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          fields: [
            {
              label: 'Email',
              name: 'email',
              required: true,
              type: 'email',
            },
            {
              label: 'Full Name',
              name: 'fullName',
              required: true,
              type: 'text',
            },
            {
              label: 'Phone',
              name: 'phone',
              required: true,
              type: 'phone',
            },
          ],
          id: 42,
          notificationRecipients: [],
          slug: 'contact',
          submissionIntent: 'lead',
          successMessage: 'Thanks. Your submission has been received.',
          title: 'Contact',
        },
      ],
    })
    payloadMocks.create.mockResolvedValue({
      createdAt: '2026-07-07T12:00:00.000Z',
      id: 99,
    })

    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/forms/contact/submit', {
        body: JSON.stringify({
          metadata: {
            campaign: 'summer-launch',
            landingPage: '/contact?utm_campaign=summer-launch',
            source: 'homepage-cta',
          },
          values: {
            email: 'lead@example.com',
            fullName: 'Taylor Lead',
            phone: '+91 98765 43210',
            website: '',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
      {
        params: Promise.resolve({
          slug: 'contact',
        }),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Thanks. Your submission has been received.',
    })

    expect(spamProtectionMocks.recordSubmissionAttempt).toHaveBeenCalledWith({
      formSlug: 'contact',
      ipAddress: '127.0.0.1',
    })

    expect(payloadMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'form-submissions',
        data: expect.objectContaining({
          campaign: 'summer-launch',
          data: {
            email: 'lead@example.com',
            fullName: 'Taylor Lead',
            phone: '+91 98765 43210',
          },
          email: 'lead@example.com',
          form: 42,
          landingPage: '/contact?utm_campaign=summer-launch',
          source: 'homepage-cta',
          status: 'new',
          submissionIntent: 'lead',
          submittedAt: expect.any(String),
          submitterEmail: 'lead@example.com',
          submitterName: 'Taylor Lead',
          submitterPhone: '+91 98765 43210',
        }),
        overrideAccess: true,
      }),
    )

    const createCall = payloadMocks.create.mock.calls[0]?.[0]
    expect(createCall?.data.submittedAt).toBe(new Date(createCall?.data.submittedAt).toISOString())

    expect(eventMocks.emitFormSubmissionEvent).toHaveBeenCalledWith({
      campaign: 'summer-launch',
      formId: 42,
      formSlug: 'contact',
      landingPage: '/contact?utm_campaign=summer-launch',
      owner: undefined,
      source: 'homepage-cta',
      submissionId: 99,
      status: 'new',
      submissionIntent: 'lead',
      submitterEmail: 'lead@example.com',
      submitterName: 'Taylor Lead',
      submitterPhone: '+91 98765 43210',
      values: {
        email: 'lead@example.com',
        fullName: 'Taylor Lead',
        phone: '+91 98765 43210',
      },
    })
    expect(payloadMocks.sendEmail).not.toHaveBeenCalled()
    expect(payloadMocks.update).not.toHaveBeenCalled()
  })

  it('rejects an invalid phone number before creating a submission', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          fields: [
            {
              label: 'Phone',
              name: 'phone',
              required: true,
              type: 'phone',
            },
          ],
          id: 42,
          notificationRecipients: [],
          slug: 'contact',
          submissionIntent: 'lead',
          successMessage: 'Thanks.',
          title: 'Contact',
        },
      ],
    })

    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/forms/contact/submit', {
        body: JSON.stringify({
          values: {
            phone: 'not-a-phone-number',
            website: '',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
      {
        params: Promise.resolve({ slug: 'contact' }),
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      errors: {
        phone: 'Phone must be a valid phone number.',
      },
      message: 'Please correct the highlighted fields and try again.',
    })
    expect(payloadMocks.create).not.toHaveBeenCalled()
  })

  it('stamps lastActionAt when operators change status, owner, or notes', async () => {
    await expect(
      updateFormSubmissionActivity({
        data: {
          internalNotes: 'Reached out by email.',
          owner: 7,
          status: 'in_review',
        },
        operation: 'update',
        originalDoc: {
          internalNotes: '',
          owner: null,
          status: 'new',
        },
      } as never),
    ).resolves.toEqual(
      expect.objectContaining({
        internalNotes: 'Reached out by email.',
        lastActionAt: expect.any(String),
        owner: 7,
        status: 'in_review',
      }),
    )
  })
})
