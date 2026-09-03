import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  create: vi.fn(),
  loggerError: vi.fn(),
  sendEmail: vi.fn(),
  update: vi.fn(),
}))

const eventMocks = vi.hoisted(() => ({
  emitFormSubmissionEvent: vi.fn(),
}))

const spamProtectionMocks = vi.hoisted(() => ({
  getClientIPAddress: vi.fn(),
  isRateLimited: vi.fn(),
  isSpamHoneypotTriggered: vi.fn(),
  recordSubmissionAttempt: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()

  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      create: payloadMocks.create,
      find: payloadMocks.find,
      logger: {
        error: payloadMocks.loggerError,
      },
      sendEmail: payloadMocks.sendEmail,
      update: payloadMocks.update,
    })),
  }
})

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

const loadRouteModule = async () => {
  vi.resetModules()
  return import('@/app/api/forms/[slug]/submit/route')
}

describe('review submission promotion', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    eventMocks.emitFormSubmissionEvent.mockResolvedValue(undefined)
    spamProtectionMocks.getClientIPAddress.mockReturnValue('127.0.0.1')
    spamProtectionMocks.isRateLimited.mockReturnValue(false)
    spamProtectionMocks.isSpamHoneypotTriggered.mockReturnValue(false)
    payloadMocks.sendEmail.mockResolvedValue(undefined)
  })

  it('rejects incomplete review payloads', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          fields: [
            {
              label: 'Your overall rating',
              name: 'rating',
              options: [
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
                { label: '5', value: '5' },
              ],
              required: true,
              type: 'select',
            },
            {
              label: 'Title of your review',
              name: 'reviewTitle',
              required: true,
              type: 'text',
            },
            {
              label: 'Your review',
              name: 'reviewBody',
              required: true,
              type: 'textarea',
            },
            {
              label: 'Your name',
              name: 'reviewerName',
              required: true,
              type: 'text',
            },
            {
              label: 'Your email',
              name: 'reviewerEmail',
              required: true,
              type: 'email',
            },
            {
              label: 'This review is based on my own experience',
              name: 'isGenuineExperience',
              required: true,
              type: 'checkbox',
            },
          ],
          id: 42,
          notificationRecipients: [],
          slug: 'reviews',
          submissionIntent: 'review',
          successMessage: 'Thanks for your review.',
          title: 'Reviews',
        },
      ],
    })

    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/forms/reviews/submit', {
        body: JSON.stringify({
          values: {
            reviewTitle: '',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
      {
        params: Promise.resolve({
          slug: 'reviews',
        }),
      },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        errors: expect.objectContaining({
          isGenuineExperience: expect.any(String),
          rating: expect.any(String),
          reviewBody: expect.any(String),
        }),
        message: 'Please correct the highlighted fields and try again.',
      }),
    )
  })

  it('creates a submission and links it to a pending draft Review', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          fields: [
            {
              label: 'Your overall rating',
              name: 'rating',
              options: [
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
                { label: '5', value: '5' },
              ],
              required: true,
              type: 'select',
            },
            {
              label: 'Title of your review',
              name: 'reviewTitle',
              required: true,
              type: 'text',
            },
            {
              label: 'Your review',
              name: 'reviewBody',
              required: true,
              type: 'textarea',
            },
            {
              label: 'Your name',
              name: 'reviewerName',
              required: true,
              type: 'text',
            },
            {
              label: 'Your email',
              name: 'reviewerEmail',
              required: true,
              type: 'email',
            },
            {
              label: 'This review is based on my own experience',
              name: 'isGenuineExperience',
              required: true,
              type: 'checkbox',
            },
          ],
          id: 42,
          notificationRecipients: [],
          slug: 'reviews',
          submissionIntent: 'review',
          successMessage: 'Thanks for your review.',
          title: 'Reviews',
        },
      ],
    })
    payloadMocks.create
      .mockResolvedValueOnce({
        id: 33,
        linkedReview: null,
      })
      .mockResolvedValueOnce({
        id: 44,
      })

    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/forms/reviews/submit', {
        body: JSON.stringify({
          values: {
            rating: '5',
            reviewBody: 'Everything worked exactly as expected.',
            reviewerName: 'Taylor Lead',
            subjectLabel: 'academics',
            isGenuineExperience: true,
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
          slug: 'reviews',
        }),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Thanks for your review.',
    })

    expect(spamProtectionMocks.recordSubmissionAttempt).toHaveBeenCalledWith({
      formSlug: 'reviews',
      ipAddress: '127.0.0.1',
    })

    expect(payloadMocks.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'form-submissions',
        data: expect.objectContaining({
          data: expect.objectContaining({
            isGenuineExperience: true,
            rating: '5',
            reviewBody: 'Everything worked exactly as expected.',
            reviewerEmail: '',
            reviewerName: 'Taylor Lead',
            reviewTitle: 'Everything worked exactly as expected.',
            subjectLabel: 'academics',
          }),
          email: undefined,
          form: 42,
          submissionIntent: 'review',
          submitterEmail: undefined,
          submitterName: 'Taylor Lead',
        }),
        overrideAccess: true,
      }),
    )

    expect(payloadMocks.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'reviews',
        data: expect.objectContaining({
          _status: 'draft',
          moderationStatus: 'pending',
          sourceSubmission: '33',
          subjectLabel: 'academics',
          title: 'Everything worked exactly as expected.',
          reviewTitle: 'Everything worked exactly as expected.',
          reviewerEmail: undefined,
        }),
        overrideAccess: true,
      }),
    )

    expect(payloadMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'form-submissions',
        data: {
          linkedReview: '44',
          promotionError: null,
        },
        id: 33,
        overrideAccess: true,
      }),
    )
  })

  it('keeps the submission and records a promotion error when linked review creation fails', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          fields: [
            {
              label: 'Your overall rating',
              name: 'rating',
              options: [
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
                { label: '5', value: '5' },
              ],
              required: true,
              type: 'select',
            },
            {
              label: 'Title of your review',
              name: 'reviewTitle',
              required: true,
              type: 'text',
            },
            {
              label: 'Your review',
              name: 'reviewBody',
              required: true,
              type: 'textarea',
            },
            {
              label: 'Your name',
              name: 'reviewerName',
              required: true,
              type: 'text',
            },
            {
              label: 'Your email',
              name: 'reviewerEmail',
              required: true,
              type: 'email',
            },
            {
              label: 'This review is based on my own experience',
              name: 'isGenuineExperience',
              required: true,
              type: 'checkbox',
            },
          ],
          id: 42,
          notificationRecipients: [],
          slug: 'reviews',
          submissionIntent: 'review',
          successMessage: 'Thanks for your review.',
          title: 'Reviews',
        },
      ],
    })
    payloadMocks.create
      .mockResolvedValueOnce({
        id: 33,
        linkedReview: null,
      })
      .mockRejectedValueOnce(new Error('review create failed'))

    const { POST } = await loadRouteModule()
    const response = await POST(
      new Request('http://localhost/api/forms/reviews/submit', {
        body: JSON.stringify({
          values: {
            rating: '5',
            reviewTitle: 'Fast, clear, and reliable',
            reviewBody: 'Everything worked exactly as expected.',
            reviewerName: 'Taylor Lead',
            reviewerEmail: 'taylor@example.com',
            isGenuineExperience: true,
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
          slug: 'reviews',
        }),
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Thanks for your review.',
    })

    expect(payloadMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'form-submissions',
        data: {
          promotionError: 'review create failed',
        },
        id: 33,
        overrideAccess: true,
      }),
    )
    expect(payloadMocks.loggerError).toHaveBeenCalled()
  })
})
