import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  getClientIPAddress,
  isRateLimited,
  isSpamHoneypotTriggered,
  recordSubmissionAttempt,
} from '@/lib/formSpamProtection'
import {
  buildFormNotificationEmail,
  buildSubmitterConfirmationEmail,
  getNotificationRecipients,
} from '@/lib/formNotifications'
import { emitFormSubmissionEvent } from '@/lib/formSubmissionEvents'
import {
  getSubmissionContactMetadata,
  isReviewFormSubmissionIntent,
  normalizeFormSubmissionIntent,
  normalizeFormSubmissionMetadata,
  validateFormSubmission,
  type FormSubmissionValues,
  type SimpleFormField,
} from '@/lib/forms'
import { upsertReviewFromSubmission } from '@/lib/reviewPromotion'
import { validateReviewSubmission } from '@/lib/reviews'
import type { Form } from '@/payload-types'

const toSimpleFields = (form: Form): SimpleFormField[] => {
  return (form.fields ?? []).map((field) => ({
    label: field.label,
    name: field.name,
    options:
      field.options?.map((option) => ({
        label: option.label,
        value: option.value,
      })) ?? null,
    placeholder: field.placeholder ?? null,
    required: field.required ?? false,
    type: field.type,
  }))
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await payload.find({
    collection: 'forms',
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
    depth: 0,
    limit: 1,
  })

  const form = result.docs[0] ?? null

  if (!form) {
    return NextResponse.json(
      {
        message: 'The requested form is not available.',
      },
      { status: 404 },
    )
  }

  let payloadBody: { metadata?: unknown; values?: FormSubmissionValues } | null = null

  try {
    payloadBody = (await request.json()) as { values?: FormSubmissionValues }
  } catch {
    return NextResponse.json(
      {
        message: 'Invalid form submission payload.',
      },
      { status: 400 },
    )
  }

  const submissionValues =
    payloadBody?.values && typeof payloadBody.values === 'object' ? payloadBody.values : {}
  const submissionMetadata = normalizeFormSubmissionMetadata(payloadBody?.metadata)

  if (isSpamHoneypotTriggered(submissionValues)) {
    return NextResponse.json({
      message: form.successMessage,
    })
  }

  const ipAddress = getClientIPAddress(request)

  if (isRateLimited({ formSlug: slug, ipAddress })) {
    return NextResponse.json(
      {
        message: 'Too many submissions from this device. Please wait a few minutes and try again.',
      },
      { status: 429 },
    )
  }

  recordSubmissionAttempt({
    formSlug: slug,
    ipAddress,
  })

  const submissionIntent = normalizeFormSubmissionIntent(form.submissionIntent)
  const isReviewSubmission = isReviewFormSubmissionIntent(submissionIntent)
  const formFields = toSimpleFields(form)
  const validationFields = isReviewSubmission
    ? formFields.map((field) =>
        field.name === 'isGenuineExperience' ||
        field.name === 'reviewTitle' ||
        field.name === 'reviewerEmail'
          ? { ...field, required: false }
          : field,
      )
    : formFields
  const { errors, normalizedData } = validateFormSubmission({
    fields: validationFields,
    values: submissionValues,
  })
  const reviewValidation = isReviewSubmission
    ? validateReviewSubmission({
        values: {
          ...submissionValues,
          ...normalizedData,
        },
      })
    : null
  const combinedErrors = reviewValidation
    ? {
        ...errors,
        ...reviewValidation.errors,
      }
    : errors

  if (Object.keys(combinedErrors).length > 0) {
    return NextResponse.json(
      {
        errors: combinedErrors,
        message: 'Please correct the highlighted fields and try again.',
      },
      { status: 400 },
    )
  }

  const submissionData = reviewValidation
    ? {
        ...normalizedData,
        ...reviewValidation.normalizedData,
      }
    : normalizedData
  const { email: submitterEmail, name: submitterName } =
    getSubmissionContactMetadata(submissionData)
  const submittedAt = new Date()
  const submission = await payload.create({
    collection: 'form-submissions',
    data: {
      data: submissionData,
      campaign: submissionMetadata.campaign,
      email: submitterEmail,
      form: form.id,
      landingPage: submissionMetadata.landingPage,
      source: submissionMetadata.source,
      status: 'new',
      submissionIntent,
      submittedAt: submittedAt.toISOString(),
      submitterEmail,
      submitterName,
    },
    overrideAccess: true,
  })

  if (reviewValidation) {
    try {
      const linkedReviewID = await upsertReviewFromSubmission({
        existingReview: submission.linkedReview,
        payload,
        sourceSubmissionID: submission.id,
        values: reviewValidation.normalizedData,
      })

      await payload.update({
        collection: 'form-submissions',
        data: {
          linkedReview: linkedReviewID,
          promotionError: null,
        },
        id: submission.id,
        overrideAccess: true,
      })
    } catch (error) {
      const promotionError =
        error instanceof Error ? error.message : 'Failed to create the linked review draft.'

      payload.logger.error({
        err: error,
        msg: `Failed to promote review submission for form "${form.slug}".`,
      })

      await payload.update({
        collection: 'form-submissions',
        data: {
          promotionError,
        },
        id: submission.id,
        overrideAccess: true,
      })
    }
  }

  try {
    await emitFormSubmissionEvent({
      campaign: submissionMetadata.campaign,
      formId: form.id,
      formSlug: form.slug,
      landingPage: submissionMetadata.landingPage,
      owner: undefined,
      submissionId: submission.id,
      source: submissionMetadata.source,
      status: 'new',
      submissionIntent,
      submitterEmail,
      submitterName,
      values: submissionData,
    })
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: `Failed to emit form submission event for form "${form.slug}".`,
    })
  }

  const notificationRecipients = getNotificationRecipients(form)

  if (notificationRecipients.length > 0) {
    const emailContent = buildFormNotificationEmail({
      form,
      submittedAt,
      values: submissionData,
    })

    try {
      await payload.sendEmail({
        html: emailContent.html,
        subject: emailContent.subject,
        text: emailContent.text,
        to: notificationRecipients,
      })
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: `Failed to send form notification email for form "${form.slug}".`,
      })
    }
  }

  if (form.submitterReply?.enabled && submitterEmail) {
    const replyEmail = buildSubmitterConfirmationEmail({ form, submitterName })
    try {
      await payload.sendEmail({
        html: replyEmail.html,
        subject: replyEmail.subject,
        text: replyEmail.text,
        to: submitterEmail,
      })
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: `Failed to send submitter confirmation email for form "${form.slug}".`,
      })
    }
  }

  return NextResponse.json({
    message: form.successMessage,
  })
}
