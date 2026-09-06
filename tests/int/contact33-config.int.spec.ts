import { describe, expect, it, vi } from 'vitest'

import { getContact33FieldDefinitions, validateContact33FormDefinition } from '@/lib/contact33Form'

const validForm = {
  fields: [
    {
      label: 'Name',
      name: 'name',
      placeholder: 'Your name',
      required: true,
      type: 'text',
    },
    {
      label: 'Email',
      name: 'email',
      placeholder: 'you@example.com',
      required: true,
      type: 'email',
    },
    {
      label: 'Subject',
      name: 'subject',
      options: [{ label: 'Admissions', value: 'admissions' }],
      required: false,
      type: 'select',
    },
    {
      label: 'Message',
      name: 'message',
      placeholder: 'How can we help?',
      required: true,
      type: 'textarea',
    },
  ],
  slug: 'contact',
  submitButtonLabel: 'Send message',
  successMessage: 'Thanks. We will be in touch.',
  title: 'Contact',
}

const validFormWithPhone = {
  ...validForm,
  fields: [
    ...validForm.fields.slice(0, 2),
    {
      label: 'Phone number',
      name: 'phone',
      placeholder: '+91 98765 43210',
      required: true,
      type: 'phone',
    },
    ...validForm.fields.slice(2),
  ],
}

describe('contact33 form contract', () => {
  it('accepts and normalizes the four required form fields', () => {
    expect(validateContact33FormDefinition(validForm as never)).toBe(true)
    expect(getContact33FieldDefinitions(validForm as never)).toMatchObject({
      email: { label: 'Email', required: true, type: 'email' },
      message: { label: 'Message', required: true, type: 'textarea' },
      name: { label: 'Name', required: true, type: 'text' },
      subject: {
        options: [{ label: 'Admissions', value: 'admissions' }],
        required: false,
        type: 'select',
      },
    })
    expect(getContact33FieldDefinitions(validForm as never).phone).toBeUndefined()
  })

  it('accepts and normalizes an optional phone definition', () => {
    expect(validateContact33FormDefinition(validFormWithPhone as never)).toBe(true)
    expect(getContact33FieldDefinitions(validFormWithPhone as never).phone).toMatchObject({
      label: 'Phone number',
      name: 'phone',
      placeholder: '+91 98765 43210',
      required: true,
      type: 'phone',
    })
  })

  it.each([
    [
      {
        ...validForm,
        fields: validForm.fields.filter((field) => field.name !== 'message'),
      },
      'Contact form must include a "message" Textarea field.',
    ],
    [
      {
        ...validForm,
        fields: validForm.fields.map((field) =>
          field.name === 'email' ? { ...field, type: 'text' } : field,
        ),
      },
      'Contact form field "email" must use the Email type.',
    ],
    [
      {
        ...validForm,
        fields: validForm.fields.map((field) =>
          field.name === 'subject' ? { ...field, options: [] } : field,
        ),
      },
      'Contact form field "subject" must include at least one option.',
    ],
    [
      {
        ...validForm,
        fields: [
          ...validForm.fields,
          {
            label: 'Phone',
            name: 'phone',
            required: false,
            type: 'text',
          },
        ],
      },
      'Contact form field "phone" must use the Phone type.',
    ],
    [
      {
        ...validForm,
        fields: [
          ...validForm.fields,
          {
            label: 'Company',
            name: 'company',
            required: true,
            type: 'text',
          },
        ],
      },
      'Contact 33 cannot render required field "company".',
    ],
  ])('rejects incompatible form definitions', (form, expected) => {
    expect(validateContact33FormDefinition(form as never)).toBe(expected)
  })

  it('defines the approved Payload tabs, defaults, relationship filter, and validator', async () => {
    const { Contact33Block } = await import('@/blocks/Contact33/config')
    const tabs = Contact33Block.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const content = tabs?.tabs?.find((tab) => tab.label === 'Content')
    const layout = tabs?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const byName = <T>(fields: unknown[], name: string) =>
      fields.find(
        (field) =>
          typeof field === 'object' && field !== null && 'name' in field && field.name === name,
      ) as T | undefined
    const form = byName<{
      filterOptions?: unknown
      required?: boolean
      validate?: (value: unknown, context: unknown) => Promise<true | string>
    }>(content?.fields ?? [], 'form')

    expect(Contact33Block.labels).toEqual({
      plural: 'Contact Forms',
      singular: 'Contact Form',
    })
    expect(tabs?.type).toBe('tabs')
    expect(tabs?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(
      content?.fields.map((field) =>
        typeof field === 'object' && field !== null && 'name' in field ? field.name : undefined,
      ),
    ).toEqual([
      'eyebrow',
      'title',
      'description',
      'actions',
      'footerActions',
      'image',
      'imageAlt',
      'form',
    ])
    expect(form?.required).toBe(true)
    expect(form?.filterOptions).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { submissionIntent: { in: ['general', 'lead'] } },
      ],
    })
    expect(byName<{ type?: string }>(layout?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(
      byName<{ defaultValue?: string; type?: string }>(layout?.fields ?? [], 'contentAlignment'),
    ).toMatchObject({
      defaultValue: 'center',
      type: 'select',
    })
    expect(
      byName<{ defaultValue?: string; type?: string }>(layout?.fields ?? [], 'size'),
    ).toMatchObject({
      defaultValue: 'default',
      type: 'select',
    })
    expect(
      byName<{ defaultValue?: string; type?: string }>(layout?.fields ?? [], 'imagePosition'),
    ).toMatchObject({
      defaultValue: 'right',
      type: 'select',
    })

    const findByID = vi.fn().mockResolvedValue(validForm)
    await expect(
      form?.validate?.('form-id', {
        req: {
          payload: {
            findByID,
          },
        },
      }),
    ).resolves.toBe(true)
    await expect(
      form?.validate?.(
        {
          relationTo: 'forms',
          value: 'related-form-id',
        },
        {
          req: {
            payload: {
              findByID,
            },
          },
        },
      ),
    ).resolves.toBe(true)
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'forms',
        depth: 0,
        id: 'form-id',
      }),
    )
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'forms',
        depth: 0,
        id: 'related-form-id',
      }),
    )
  })
})
