import type { Form } from '@/payload-types'
import { DEFAULT_SITE_TIME_ZONE, type SiteTimeZone } from '@/lib/siteTimeZone'

const escapeHTML = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

type FormDefinitionField = Form['fields'][number]

const formatSubmissionValue = (field: FormDefinitionField, value: boolean | string): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (field.type === 'select' && value) {
    return field.options?.find((option) => option.value === value)?.label || value
  }

  return value || '—'
}

const formatHTMLSubmissionValue = (field: FormDefinitionField, value: boolean | string): string => {
  const displayValue = formatSubmissionValue(field, value)

  if (displayValue === '—') {
    return displayValue
  }

  if (field.type === 'email' && typeof value === 'string') {
    return `<a href="${escapeHTML(`mailto:${value}`)}" style="color: #146c4b; text-decoration: underline;">${escapeHTML(displayValue)}</a>`
  }

  if (field.type === 'phone' && typeof value === 'string') {
    const phoneTarget = value.replace(/[^\d+]/g, '')

    return `<a href="${escapeHTML(`tel:${phoneTarget}`)}" style="color: #146c4b; text-decoration: underline;">${escapeHTML(displayValue)}</a>`
  }

  return escapeHTML(displayValue).replaceAll('\n', '<br>')
}

export const formatFormSubmissionDate = (
  value: Date,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): string => {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    month: 'long',
    timeZone,
    year: 'numeric',
  }).format(value)
}

const buildEmailShell = ({
  body,
  preheader,
  siteName,
  title,
}: {
  body: string
  preheader: string
  siteName: string
  title: string
}): string =>
  `
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHTML(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-collapse: collapse; background: #f2f6f4; color: #17221d; font-family: Arial, Helvetica, sans-serif;">
    <tbody>
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 640px; border-collapse: separate; border-spacing: 0; overflow: hidden; border: 1px solid #dce6e1; border-radius: 16px; background: #ffffff;">
            <tbody>
              <tr>
                <td style="padding: 24px 28px; background: #0f5132; color: #ffffff;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <tbody>
                      <tr>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 12px; font-weight: 700; letter-spacing: 1.5px; line-height: 1.4; text-transform: uppercase; color: #cde8dc;">${escapeHTML(siteName)}</div>
                          <div style="margin-top: 5px; font-size: 23px; font-weight: 700; line-height: 1.25; color: #ffffff;">${escapeHTML(title)}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px;">
                  ${body}
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 28px; border-top: 1px solid #e5ece8; background: #f8faf9; font-size: 12px; line-height: 1.6; color: #68756f;">
                  This is an automated email from ${escapeHTML(siteName)}. Please do not include sensitive information when forwarding it.
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
`.trim()

export const getNotificationRecipients = (form: Form): string[] => {
  return (form.notificationRecipients ?? [])
    .map((recipient) => recipient.email?.trim())
    .filter((email): email is string => Boolean(email))
}

export const buildFormNotificationEmail = ({
  form,
  siteName = 'SNMIH',
  submittedAt,
  timeZone = DEFAULT_SITE_TIME_ZONE,
  values,
}: {
  form: Form
  siteName?: string
  submittedAt: Date
  timeZone?: SiteTimeZone
  values: Record<string, boolean | string>
}) => {
  const subject = `New submission: ${form.title}`
  const fields = (form.fields ?? []).map((field) => {
    const value = values[field.name] ?? ''

    return {
      htmlValue: formatHTMLSubmissionValue(field, value),
      label: field.label,
      value: formatSubmissionValue(field, value),
    }
  })
  const submittedAtLabel = formatFormSubmissionDate(submittedAt, timeZone)

  const text = [
    `A new submission was received for "${form.title}".`,
    '',
    `Submitted: ${submittedAtLabel}`,
    '',
    ...fields.map((field) => `${field.label}: ${field.value}`),
  ].join('\n')

  const html = buildEmailShell({
    body: `
      <p style="margin: 0; font-size: 16px; line-height: 1.65; color: #33413a;">A new website submission was received for <strong style="color: #17221d;">${escapeHTML(form.title)}</strong>.</p>
      <div style="margin: 20px 0 26px; padding: 14px 16px; border: 1px solid #d3e7dd; border-radius: 8px; background: #edf6f1;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; line-height: 1.4; text-transform: uppercase; color: #39735c;">Submitted</div>
        <div style="margin-top: 4px; font-size: 15px; font-weight: 600; line-height: 1.5; color: #19382b;">${escapeHTML(submittedAtLabel)}</div>
      </div>
      <div style="margin-bottom: 10px; font-size: 13px; font-weight: 700; line-height: 1.4; color: #17221d;">Submission details</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #dce6e1; border-radius: 10px; overflow: hidden;">
        <tbody>
          ${fields
            .map(
              (field, index) => `
                <tr>
                  <td style="padding: 14px 16px;${index > 0 ? ' border-top: 1px solid #e5ece8;' : ''}">
                    <div style="margin-bottom: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; line-height: 1.4; text-transform: uppercase; color: #6c7b74;">${escapeHTML(field.label)}</div>
                    <div style="font-size: 15px; line-height: 1.55; color: #17221d; overflow-wrap: anywhere;">${field.htmlValue}</div>
                  </td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
    `,
    preheader: `New submission received for ${form.title}`,
    siteName: siteName.trim() || 'SNMIH',
    title: form.title,
  })

  return {
    html,
    subject,
    text,
  }
}

export const buildSubmitterConfirmationEmail = ({
  form,
  siteName = 'SNMIH',
  submitterName,
}: {
  form: Form
  siteName?: string
  submitterName: string | null | undefined
}) => {
  const subject = form.submitterReply?.subject?.trim() || 'Thanks for getting in touch'
  const message =
    form.submitterReply?.message?.trim() ||
    'We have received your message and will be in touch shortly.'
  const greeting = submitterName ? `Hi ${escapeHTML(submitterName)},` : 'Hello,'

  const html = buildEmailShell({
    body: `
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.65; color: #17221d;">${greeting}</p>
      <p style="margin: 0; font-size: 16px; line-height: 1.65; color: #33413a;">${escapeHTML(message).replaceAll('\n', '<br>')}</p>
      <div style="margin-top: 26px; padding: 16px; border-radius: 8px; background: #edf6f1; font-size: 14px; line-height: 1.6; color: #315143;">Your submission has been received successfully. Keep this email for your records.</div>
    `,
    preheader: subject,
    siteName: siteName.trim() || 'SNMIH',
    title: subject,
  })

  const text = [greeting, '', message].join('\n')

  return { html, subject, text }
}
