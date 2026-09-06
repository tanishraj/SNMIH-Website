import { describe, expect, it } from 'vitest'

import {
  buildFormNotificationEmail,
  buildSubmitterConfirmationEmail,
  formatFormSubmissionDate,
} from '@/lib/formNotifications'
import type { Form } from '@/payload-types'

const form = {
  fields: [
    { label: 'Name', name: 'name', required: true, type: 'text' },
    { label: 'Email', name: 'email', required: true, type: 'email' },
    { label: 'Phone', name: 'phone', required: true, type: 'phone' },
    {
      label: 'Subject',
      name: 'subject',
      options: [{ label: 'MBBS admission', value: 'mbbs-admission' }],
      type: 'select',
    },
    { label: 'Message', name: 'message', required: true, type: 'textarea' },
  ],
  id: 'form-id',
  slug: 'admission-enquiry',
  submissionIntent: 'lead',
  submitButtonLabel: 'Submit',
  successMessage: 'Thanks.',
  title: 'Admission Enquiry Form',
} as Form

describe('form notification emails', () => {
  it('uses a readable zoned date and a mobile-friendly branded layout', () => {
    const email = buildFormNotificationEmail({
      form,
      siteName: 'SNMIH',
      submittedAt: new Date('2026-09-06T12:11:16.470Z'),
      timeZone: 'Asia/Kolkata',
      values: {
        email: 'student@example.com',
        message: 'Please share the admission details.\nThank you.',
        name: 'Shambhavi Kumari',
        phone: '+91 98765 43210',
        subject: 'mbbs-admission',
      },
    })

    const readableDate = '6 September 2026 at 5:41 pm'
    expect(email.text).toContain(`Submitted: ${readableDate}`)
    expect(email.html).toContain(readableDate)
    expect(email.html).not.toContain('2026-09-06T12:11:16.470Z')
    expect(email.html).toContain('max-width: 640px')
    expect(email.html).toContain('background: #0f5132')
    expect(email.html).toContain('A new website submission was received')
    expect(email.html).toContain('mailto:student@example.com')
    expect(email.html).toContain('tel:+919876543210')
    expect(email.html).toContain('MBBS admission')
    expect(email.html).not.toContain('>mbbs-admission<')
    expect(email.html).toContain('Please share the admission details.<br>Thank you.')
  })

  it('applies the shared professional shell to submitter confirmations', () => {
    const email = buildSubmitterConfirmationEmail({
      form: {
        ...form,
        submitterReply: {
          enabled: true,
          message: 'Our admissions team will contact you shortly.',
          subject: 'We received your enquiry',
        },
      },
      siteName: 'SNMIH',
      submitterName: 'Shambhavi',
    })

    expect(email.subject).toBe('We received your enquiry')
    expect(email.html).toContain('Your submission has been received successfully')
    expect(email.html).toContain('Hi Shambhavi,')
    expect(email.html).toContain('background: #0f5132')
    expect(email.html).toContain('automated email from SNMIH')
  })

  it('formats other supported site timezones explicitly', () => {
    expect(formatFormSubmissionDate(new Date('2026-09-06T12:11:16.470Z'), 'Asia/Dubai')).toBe(
      '6 September 2026 at 4:11 pm',
    )
  })
})
