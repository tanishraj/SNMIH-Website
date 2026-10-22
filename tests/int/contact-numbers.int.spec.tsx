import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContactNumbersBlockComponent } from '@/blocks/ContactNumbers/Component'
import { ContactNumbersBlock } from '@/blocks/ContactNumbers/config'
import {
  formatContactDays,
  groupContacts,
  isContactOpen,
  isValidContactTime,
  normalizeContacts,
  toTelHref,
  toWhatsAppHref,
} from '@/blocks/ContactNumbers/normalizeContactNumbers'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri']
const contacts = [
  {
    id: 'a',
    label: 'Admission Panel',
    desk: 'Admissions Desk',
    group: 'Admissions',
    phone: ' +91 91990 44557 ',
    email: 'admissions@example.edu',
    whatsapp: true,
    hours: { days: weekdays, opens: '09:30', closes: '17:30' },
  },
  { id: 'b', label: 'Admission Panel', group: 'Accounts', phone: '+91 82991 09094' },
  { id: 'c', phone: 'call us' },
]

const collectFieldNames = () => {
  const names: string[] = []
  const visit = (fields: unknown[]) => {
    for (const field of fields as Array<Record<string, unknown>>) {
      if (typeof field.name === 'string') names.push(field.name)
      if (Array.isArray(field.tabs)) {
        for (const tab of field.tabs as Array<{ fields: unknown[] }>) visit(tab.fields)
      }
    }
  }
  visit(ContactNumbersBlock.fields)
  return names
}

describe('Contact Numbers block', () => {
  it('registers the slug, five layouts, and the shared section options', () => {
    expect(ContactNumbersBlock.slug).toBe('contactNumbers')
    expect(ContactNumbersBlock.interfaceName).toBe('ContactNumbersBlock')
    expect(collectFieldNames()).toEqual(
      expect.arrayContaining([
        'eyebrow',
        'title',
        'accentTitle',
        'description',
        'actions',
        'footerActions',
        'appearance',
        'layout',
        'contentAlignment',
        'size',
      ]),
    )
  })

  it('builds dialable links and drops numbers without digits', () => {
    expect(toTelHref('+91 91990-44557')).toBe('tel:+919199044557')
    expect(toWhatsAppHref('+91 91990 44557')).toBe('https://wa.me/919199044557')

    const [first, second, ...rest] = normalizeContacts(contacts)
    expect(rest).toHaveLength(0)
    expect(first).toMatchObject({
      hoursText: 'Mon–Fri · 9:30 AM – 5:30 PM',
      key: 'a',
      phone: '+91 91990 44557',
      telHref: 'tel:+919199044557',
      whatsappHref: 'https://wa.me/919199044557',
    })
    expect(second?.schedule).toBeUndefined()
  })

  it('validates hours and formats day ranges', () => {
    expect(isValidContactTime('09:30')).toBe(true)
    expect(isValidContactTime('9:30')).toBe(false)
    expect(isValidContactTime('24:00')).toBe(false)
    expect(formatContactDays(['mon', 'wed', 'fri'])).toBe('Mon, Wed, Fri')
    expect(formatContactDays(['sat', 'sun'])).toBe('Sat, Sun')
    expect(
      normalizeContacts([
        { phone: '1', hours: { days: ['mon'], opens: '18:00', closes: '09:00' } },
      ])[0]?.schedule,
    ).toBeUndefined()
  })

  it('computes open status in the configured timezone', () => {
    const [contact] = normalizeContacts(contacts)
    // Wednesday 2026-10-21 10:00 IST is 04:30 UTC.
    expect(
      isContactOpen(contact!.schedule!, new Date('2026-10-21T04:30:00Z'), 'Asia/Kolkata'),
    ).toBe(true)
    expect(isContactOpen(contact!.schedule!, new Date('2026-10-21T04:30:00Z'), 'UTC')).toBe(false)
    // Saturday is outside Mon–Fri.
    expect(
      isContactOpen(contact!.schedule!, new Date('2026-10-24T06:00:00Z'), 'Asia/Kolkata'),
    ).toBe(false)
  })

  it('groups directory contacts in first-seen order', () => {
    expect(groupContacts(normalizeContacts(contacts)).map((group) => group.name)).toEqual([
      'Admissions',
      'Accounts',
    ])
  })

  it.each(['switchboard', 'callDesk', 'deskCards', 'ribbon', 'directory'] as const)(
    'renders the %s layout with tap-to-call links',
    (layout) => {
      const html = renderToStaticMarkup(
        <ContactNumbersBlockComponent
          accentTitle="with Admissions?"
          contacts={contacts}
          layout={layout}
          title="Need Help"
        />,
      )

      expect(html).toContain(`data-contact-numbers-layout="${layout}"`)
      expect(html).toContain('href="tel:+919199044557"')
      expect(html).toContain('<span class="italic">with Admissions?</span>')
      expect(html).not.toContain('call us')
    },
  )

  it('shows directory tabs, email, and WhatsApp only in the directory layout', () => {
    const html = renderToStaticMarkup(
      <ContactNumbersBlockComponent contacts={contacts} layout="directory" title="Directory" />,
    )

    expect(html).toContain('role="tab"')
    expect(html).toContain('mailto:admissions@example.edu')
    expect(html).toContain('https://wa.me/919199044557')
  })

  it('copies a number and announces it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    render(<ContactNumbersBlockComponent contacts={contacts} title="Help" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy +91 91990 44557' }))
    })

    expect(writeText).toHaveBeenCalledWith('+91 91990 44557')
    expect(screen.getAllByText('+91 91990 44557 copied').length).toBeGreaterThan(0)
  })

  it('shows open status after hydration and hides it when disabled', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-21T04:30:00Z'))

    const { container, rerender } = render(
      <ContactNumbersBlockComponent contacts={contacts} title="Help" />,
    )
    expect(container.querySelector('[data-contact-status="open"]')).toBeTruthy()

    rerender(
      <ContactNumbersBlockComponent contacts={contacts} showOpenStatus={false} title="Help" />,
    )
    expect(container.querySelector('[data-contact-status]')).toBeNull()
  })

  it('centres the width-capped introduction itself', () => {
    const html = renderToStaticMarkup(
      <ContactNumbersBlockComponent contacts={contacts} contentAlignment="center" title="Help" />,
    )

    expect(html).toContain('mx-auto items-center text-center')
  })

  it('renders nothing without a dialable number', () => {
    expect(renderToStaticMarkup(<ContactNumbersBlockComponent contacts={[{ phone: ' ' }]} />)).toBe(
      '',
    )
  })
})
