import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { regularBlockMobilePaddingClasses } from '@/blocks/shared/blockSpacing'
import { Contact33BlockComponent } from '@/blocks/Contact33/Component'

const contactForm = {
  fields: [
    {
      label: 'Full name',
      name: 'name',
      placeholder: 'Jane Doe',
      required: true,
      type: 'text',
    },
    {
      label: 'Work email',
      name: 'email',
      placeholder: 'jane@example.com',
      required: true,
      type: 'email',
    },
    {
      label: 'Topic',
      name: 'subject',
      options: [
        { label: 'Admissions', value: 'admissions' },
        { label: 'Partnerships', value: 'partnerships' },
      ],
      required: false,
      type: 'select',
    },
    {
      label: 'Your message',
      name: 'message',
      placeholder: 'Tell us more',
      required: true,
      type: 'textarea',
    },
  ],
  slug: 'contact',
  submitButtonLabel: 'Send inquiry',
  successMessage: 'Thanks. We will reply soon.',
  title: 'Contact',
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('contact33 block', () => {
  it.each(['compact', 'default', 'comfortable'] as const)(
    'uses shared outer spacing for %s size',
    (size) => {
      const html = renderToStaticMarkup(
        createElement(Contact33BlockComponent, {
          form: contactForm,
          image: {
            alt: 'Campus team',
            height: 900,
            url: '/contact.jpg',
            width: 1200,
          },
          imageAlt: 'An advisor welcoming a visitor',
          size,
          title: 'Start a conversation',
        } as never),
      )

      expect(html).toContain(`data-contact33-size="${size}"`)
      expect(html).toContain(regularBlockMobilePaddingClasses[size])
      expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
    },
  )

  it('uses project typography, editor copy, media alt, and form metadata', () => {
    const html = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        contentAlignment: 'center',
        description: 'Our advisors are ready to help.',
        eyebrow: 'Contact',
        form: contactForm,
        image: {
          alt: 'Ignored media alt',
          height: 900,
          url: '/contact.jpg',
          width: 1200,
        },
        imageAlt: 'An advisor welcoming a visitor',
        title: 'Start a conversation',
      } as never),
    )

    expect(html).toContain('font-mono text-xs font-semibold uppercase')
    expect(html).toContain('text-3xl font-semibold tracking-tight text-balance')
    expect(html).toContain('text-base leading-7')
    expect(html).toContain('Full name')
    expect(html).toContain('Work email')
    expect(html).toContain('Topic')
    expect(html).toContain('What can we help with?')
    expect(html).toContain('Your message')
    expect(html).toContain('Send inquiry')
    expect(html).toContain('alt="An advisor welcoming a visitor"')
    expect(html).toContain('data-contact33-content-alignment="center"')
    expect(html).toContain('items-center text-center')
  })

  it('keeps the form first on mobile and reverses only desktop placement', () => {
    const left = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form: contactForm,
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        imagePosition: 'left',
        title: 'Contact us',
      } as never),
    )
    const right = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form: contactForm,
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        imagePosition: 'right',
        title: 'Contact us',
      } as never),
    )

    expect(left).toContain('data-contact33-image-position="left"')
    expect(left).toContain('lg:order-first')
    expect(right).toContain('data-contact33-image-position="right"')
    expect(right).not.toContain('lg:order-first')
    expect(left).toContain('min-h-72')
    expect(left).toContain('lg:min-h-168')
  })

  it('renders an unavailable message for an unpopulated form relationship', () => {
    const html = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form: 'form-id',
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        title: 'Contact us',
      } as never),
    )

    expect(html).toContain('This contact form is currently unavailable.')
    expect(html).not.toContain('<form')
  })

  it('matches Review Submission control height and radius', () => {
    const html = renderToStaticMarkup(
      createElement(Contact33BlockComponent, {
        form: contactForm,
        image: { alt: 'Contact', url: '/contact.jpg' },
        imageAlt: 'Contact team',
        title: 'Contact us',
      } as never),
    )

    expect(html.match(/h-11 rounded-control/g)).toHaveLength(2)
    expect(html).toContain('data-[size=default]:h-11 w-full rounded-control')
    expect(html).toContain('min-h-32 rounded-control')
  })

  it('submits values and attribution metadata through the existing endpoint', async () => {
    window.history.replaceState(
      {},
      '',
      '/contact?utm_source=newsletter&utm_campaign=summer',
    )
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        message: 'Thanks. We will reply soon.',
      }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <Contact33BlockComponent
        form={contactForm as never}
        image={{ alt: 'Contact', url: '/contact.jpg' } as never}
        imageAlt="Contact team"
        title="Contact us"
      />,
    )

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: 'Jane Doe' },
    })
    fireEvent.change(screen.getByLabelText(/Work email/), {
      target: { value: 'jane@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Your message/), {
      target: { value: 'I would like to learn more.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/forms/contact/submit',
      expect.objectContaining({
        method: 'POST',
      }),
    )

    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(request).toEqual({
      metadata: {
        campaign: 'summer',
        landingPage: '/contact?utm_source=newsletter&utm_campaign=summer',
        source: 'newsletter',
      },
      values: {
        email: 'jane@example.com',
        message: 'I would like to learn more.',
        name: 'Jane Doe',
        subject: '',
        website: '',
      },
    })
    expect((await screen.findByRole('status')).textContent).toContain(
      'Thanks. We will reply soon.',
    )
    expect((screen.getByLabelText(/Full name/) as HTMLInputElement).value).toBe('')
  })

  it('maps endpoint errors to fields and restores the submit action', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          errors: {
            email: 'Work email must be a valid email address.',
          },
          message: 'Please correct the highlighted fields and try again.',
        }),
        ok: false,
      }),
    )

    render(
      <Contact33BlockComponent
        form={contactForm as never}
        image={{ alt: 'Contact', url: '/contact.jpg' } as never}
        imageAlt="Contact team"
        title="Contact us"
      />,
    )

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: 'Jane' },
    })
    fireEvent.change(screen.getByLabelText(/Work email/), {
      target: { value: 'jane@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Your message/), {
      target: { value: 'Hello' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send inquiry' }))

    expect(
      await screen.findByText('Work email must be a valid email address.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Please correct the highlighted fields and try again.')
        .textContent,
    ).toContain('Please correct the highlighted fields and try again.')
    expect(
      (screen.getByRole('button', { name: 'Send inquiry' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })
})
