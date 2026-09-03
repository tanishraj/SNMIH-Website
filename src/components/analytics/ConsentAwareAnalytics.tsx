'use client'

import { GoogleTagManager } from '@next/third-parties/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { useEffect, useState } from 'react'

import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  readAnalyticsConsent,
} from '@/lib/analyticsConsent'

type ConsentAwareAnalyticsProps = {
  ga4Enabled?: boolean | null
  ga4MeasurementId?: string | null
  gtmEnabled?: boolean | null
  gtmContainerId?: string | null
}

export function ConsentAwareAnalytics({
  ga4Enabled,
  ga4MeasurementId,
  gtmEnabled,
  gtmContainerId,
}: ConsentAwareAnalyticsProps) {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const updateConsent = () => setGranted(readAnalyticsConsent() === 'granted')

    updateConsent()
    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, updateConsent)

    return () => window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, updateConsent)
  }, [])

  if (!granted) return null

  const gtmId = gtmContainerId?.trim()
  const ga4Id = ga4MeasurementId?.trim()
  const serializedGa4Id = JSON.stringify(ga4Id ?? '').replace(/</g, '\\u003c')

  return (
    <>
      {gtmEnabled && gtmId ? (
        <GoogleTagManager gtmId={gtmId} />
      ) : ga4Enabled && ga4Id ? (
        <>
          <Script
            id="ga4-library"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${serializedGa4Id});`}
          </Script>
        </>
      ) : null}
      <SpeedInsights />
    </>
  )
}
