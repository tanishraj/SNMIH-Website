export const ANALYTICS_CONSENT_COOKIE = 'analytics_consent'
export const ANALYTICS_CONSENT_CHANGE_EVENT = 'analytics-consent-change'

export type AnalyticsConsent = 'granted' | 'denied' | null

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof document === 'undefined') return null

  const consentCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))

  const value = consentCookie?.slice(ANALYTICS_CONSENT_COOKIE.length + 1)
  return value === 'granted' || value === 'denied' ? value : null
}

export function writeAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>): void {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${consent}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(
    new CustomEvent<Exclude<AnalyticsConsent, null>>(ANALYTICS_CONSENT_CHANGE_EVENT, {
      detail: consent,
    }),
  )
}
