import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const analyticsSource = readFileSync(
  'src/components/analytics/ConsentAwareAnalytics.tsx',
  'utf8',
)
const layoutSource = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')
const packageJSON = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>
}
const analyticsGuide = readFileSync('docs/guides/analytics.md', 'utf8')
const featureInventory = readFileSync('docs/architecture/feature-inventory.md', 'utf8')

describe('Vercel Speed Insights integration', () => {
  it('installs and imports the framework-specific package', () => {
    expect(packageJSON.dependencies?.['@vercel/speed-insights']).toBeTruthy()
    expect(packageJSON.dependencies?.['@next/third-parties']).toBe('16.2.10')
    expect(analyticsSource).toContain(
      "import { SpeedInsights } from '@vercel/speed-insights/next'",
    )
    expect(analyticsSource).toContain(
      "import { GoogleTagManager } from '@next/third-parties/google'",
    )
  })

  it('mounts Speed Insights only after the client consent boundary grants access', () => {
    expect(analyticsSource).toContain(
      "const [granted, setGranted] = useState(false)",
    )
    expect(analyticsSource).toContain("if (!granted) return null")
    expect(analyticsSource).toContain('<SpeedInsights />')
  })

  it('retains GTM precedence over standalone GA4 inside the granted branch', () => {
    expect(analyticsSource).toMatch(
      /gtmEnabled\s*&&\s*gtmId\s*\?\s*\(\s*<GoogleTagManager/,
    )
    expect(analyticsSource).toContain(': ga4Enabled && ga4Id ? (')
    expect(analyticsSource).not.toContain('googletagmanager.com/gtm.js?id=')
  })

  it('keeps request cookies and analytics integrations out of the public server layout', () => {
    expect(layoutSource).not.toContain("from 'next/headers'")
    expect(layoutSource).not.toContain("@vercel/speed-insights/next")
    expect(layoutSource).not.toContain("@next/third-parties/google")
    expect(layoutSource).toContain('<ConsentAwareAnalytics')
  })

  it('documents deployment setup and consent-gated collection', () => {
    expect(analyticsGuide).toContain('## Vercel Speed Insights')
    expect(analyticsGuide).toContain('analytics_consent=granted')
    expect(analyticsGuide).toContain('Enable Speed Insights')
    expect(featureInventory).toContain(
      'Vercel Speed Insights collects public-route Web Vitals only after analytics consent.',
    )
  })
})
