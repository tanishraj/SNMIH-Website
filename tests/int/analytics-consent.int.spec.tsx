import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@next/third-parties/google', () => ({
  GoogleTagManager: ({ gtmId }: { gtmId: string }) => (
    <div data-testid="gtm" data-id={gtmId} />
  ),
}))

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}))

vi.mock('next/script', () => ({
  default: ({ id, src }: { id: string; src?: string }) => (
    <div data-script-id={id} data-src={src} />
  ),
}))

import { ConsentAwareAnalytics } from '@/components/analytics/ConsentAwareAnalytics'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'

describe('consent-aware analytics', () => {
  beforeEach(() => {
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
  })

  afterEach(() => {
    cleanup()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
  })

  it('loads nothing before consent', () => {
    render(<ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />)
    expect(screen.queryByTestId('gtm')).toBeNull()
    expect(screen.queryByTestId('speed-insights')).toBeNull()
  })

  it('hydrates analytics from an existing granted cookie', async () => {
    document.cookie = 'analytics_consent=granted; Path=/'
    render(<ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />)

    expect(await screen.findByTestId('gtm')).toBeTruthy()
    expect(screen.getByTestId('speed-insights')).toBeTruthy()
  })

  it('mounts GTM and Speed Insights immediately after acceptance', async () => {
    render(
      <>
        <ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />
        <CookieConsentBanner enabled variant="bottom-bar" />
      </>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Accept all' }))
    expect((await screen.findByTestId('gtm')).getAttribute('data-id')).toBe('GTM-TEST')
    expect(screen.getByTestId('speed-insights')).toBeTruthy()
  })

  it('keeps analytics absent after rejection', async () => {
    render(
      <>
        <ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />
        <CookieConsentBanner enabled variant="bottom-bar" />
      </>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Reject non-essential' }))
    await waitFor(() => expect(document.cookie).toContain('analytics_consent=denied'))
    expect(screen.queryByTestId('gtm')).toBeNull()
    expect(screen.queryByTestId('speed-insights')).toBeNull()
  })

  it('gives GTM precedence over standalone GA4', async () => {
    document.cookie = 'analytics_consent=granted; Path=/'
    render(
      <ConsentAwareAnalytics
        ga4Enabled
        ga4MeasurementId="G-TEST"
        gtmEnabled
        gtmContainerId="GTM-TEST"
      />,
    )

    expect(await screen.findByTestId('gtm')).toBeTruthy()
    expect(document.querySelector('[data-script-id="ga4-library"]')).toBeNull()
  })

  it('loads standalone GA4 only when GTM is unavailable', async () => {
    document.cookie = 'analytics_consent=granted; Path=/'
    render(<ConsentAwareAnalytics ga4Enabled ga4MeasurementId="G-TEST" />)

    await waitFor(() =>
      expect(document.querySelector('[data-script-id="ga4-library"]')).toBeTruthy(),
    )
    const library = document.querySelector('[data-script-id="ga4-library"]')
    expect(library?.getAttribute('data-src')).toContain('id=G-TEST')
    expect(document.querySelector('[data-script-id="ga4-config"]')).toBeTruthy()
    expect(screen.queryByTestId('gtm')).toBeNull()
  })

  it('loads only Speed Insights when analytics IDs are missing', async () => {
    document.cookie = 'analytics_consent=granted; Path=/'
    render(<ConsentAwareAnalytics ga4Enabled gtmEnabled />)

    expect(await screen.findByTestId('speed-insights')).toBeTruthy()
    expect(screen.queryByTestId('gtm')).toBeNull()
    expect(document.querySelector('[data-script-id="ga4-library"]')).toBeNull()
  })
})
