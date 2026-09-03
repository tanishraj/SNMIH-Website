import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'

const modalConfig = {
  enabled: true,
  variant: 'modal' as const,
  heading: 'Privacy choices',
  message: 'Choose whether analytics may run.',
  acceptLabel: 'Accept all',
  rejectLabel: 'Reject non-essential',
  learnMoreLabel: 'Read privacy policy',
  privacyPolicyUrl: '/privacy',
}

describe('Cookie Consent Modal', () => {
  beforeEach(() => {
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
  })

  afterEach(() => {
    cleanup()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
    document
      .querySelectorAll('[data-cookie-consent-test-external="true"]')
      .forEach((element) => element.remove())
  })

  it('exposes labelled modal semantics and initially focuses rejection', async () => {
    render(<CookieConsentBanner {...modalConfig} />)

    const dialog = await screen.findByRole('dialog', { name: 'Privacy choices' })
    const reject = screen.getByRole('button', { name: 'Reject non-essential' })

    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText('Choose whether analytics may run.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(reject))
  })

  it('does not allow background elements to retain focus', async () => {
    const outside = document.createElement('button')
    outside.textContent = 'Outside action'
    outside.dataset.cookieConsentTestExternal = 'true'
    document.body.append(outside)

    render(<CookieConsentBanner {...modalConfig} />)
    const reject = await screen.findByRole('button', { name: 'Reject non-essential' })
    const accept = screen.getByRole('button', { name: 'Accept all' })

    await waitFor(() => expect(document.activeElement).toBe(reject))
    accept.focus()
    outside.focus()
    expect(document.activeElement).toBe(accept)
    reject.focus()
    outside.focus()
    expect(document.activeElement).toBe(reject)

    outside.remove()
  })

  it('treats Escape as rejection and restores previous focus', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open preferences'
    opener.dataset.cookieConsentTestExternal = 'true'
    document.body.append(opener)
    opener.focus()

    render(<CookieConsentBanner {...modalConfig} />)
    await screen.findByRole('dialog', { name: 'Privacy choices' })
    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.cookie).toContain('analytics_consent=denied')
    await waitFor(() => expect(document.activeElement).toBe(opener))

    opener.remove()
  })

  it('ignores backdrop interaction without writing consent', async () => {
    const { container } = render(<CookieConsentBanner {...modalConfig} />)
    await screen.findByRole('dialog', { name: 'Privacy choices' })
    const overlay = container.ownerDocument.querySelector('[data-cookie-consent-overlay="true"]')

    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as Element)

    expect(screen.getByRole('dialog', { name: 'Privacy choices' })).toBeTruthy()
    expect(document.cookie).not.toContain('analytics_consent=')
  })

  it('preserves explicit accept and reject cookie behavior', async () => {
    const acceptView = render(<CookieConsentBanner {...modalConfig} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Accept all' }))

    await waitFor(() => expect(document.cookie).toContain('analytics_consent=granted'))

    acceptView.unmount()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'

    render(<CookieConsentBanner {...modalConfig} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Reject non-essential' }))

    await waitFor(() => expect(document.cookie).toContain('analytics_consent=denied'))
  })

  it('does not move focus for the non-modal Bottom Bar variant', async () => {
    const current = document.createElement('button')
    current.textContent = 'Current action'
    current.dataset.cookieConsentTestExternal = 'true'
    document.body.append(current)
    current.focus()

    render(<CookieConsentBanner enabled variant="bottom-bar" />)
    await screen.findByRole('dialog', { name: 'Cookie consent' })

    expect(document.activeElement).toBe(current)
    current.remove()
  })
})
