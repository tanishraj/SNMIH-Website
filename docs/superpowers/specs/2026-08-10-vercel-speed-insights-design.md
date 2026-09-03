# Consent-Gated Vercel Speed Insights Design

## Goal

Collect real-user Core Web Vitals for the public Next.js website through Vercel Speed Insights while preserving the starter's existing rule that browser analytics load only after a visitor grants analytics consent.

## Scope

- Install the official `@vercel/speed-insights` package.
- Add the framework-specific `SpeedInsights` component to the public frontend root layout.
- Render the component only when the existing `analytics_consent` cookie equals `granted`.
- Keep Payload Admin outside the integration because it uses a separate route-group layout.
- Update the analytics operator guide and architecture feature inventory.
- Verify the integration with focused tests, TypeScript, and linting.

The deployment owner must enable Speed Insights for the Vercel project. That dashboard action is outside the repository change.

## Architecture

The existing public root layout remains the single integration point. It already reads `analytics_consent` on the server and derives `hasAnalyticsConsent` for GTM and standalone GA4. The layout will import `SpeedInsights` from `@vercel/speed-insights/next` and render it near the end of `<body>` only when `hasAnalyticsConsent` is true.

No new Payload fields, globals, endpoints, client wrappers, environment variables, or custom event pipelines are introduced. Vercel's project-level dashboard setting controls whether the deployment accepts metrics, and the package's default sample rate is retained.

## Runtime Behavior

1. A request reaches the public frontend layout.
2. The server reads the existing `analytics_consent` cookie.
3. When its value is `granted`, the response includes the `SpeedInsights` component and its client script.
4. When the cookie is absent, denied, or contains another value, no Speed Insights component or script is included.
5. The existing consent banner refreshes the route after acceptance, causing the next server render to include Speed Insights immediately.

This behavior applies to every route rendered inside the frontend route group, including Pages, Articles, Reviews, News & Events, search, previews, and frontend fallback views. Payload Admin does not use this layout and is not measured.

## Privacy And Data Handling

Speed Insights follows the same opt-in boundary as GTM and standalone GA4. The integration does not change the consent cookie, add another identifier, or attempt to bypass content blockers.

The operator documentation will distinguish performance telemetry from marketing analytics while making the shared consent gate explicit. Deployment owners remain responsible for reviewing their privacy notice and jurisdiction-specific requirements.

## Failure Behavior

The integration is non-critical. If the Vercel project setting is disabled, the collection endpoint is unavailable, or a content blocker prevents the script from loading, the website continues to render and function normally. No custom retry UI or server-side error handling is added.

## Testing And Verification

- Confirm `@vercel/speed-insights` is recorded in `package.json` and the pnpm lockfile.
- Add or update focused coverage to verify that the frontend layout ties Speed Insights rendering to `hasAnalyticsConsent` and does not mount it unconditionally.
- Run the relevant integration tests.
- Run TypeScript validation and linting.
- After deployment, confirm Speed Insights is enabled in Vercel, grant analytics consent, navigate between public pages, and verify data appears in the Vercel dashboard.
- Repeat with consent denied and verify the Speed Insights script is absent from the page.

## Documentation Changes

- Extend `docs/guides/analytics.md` with setup, consent behavior, verification, and troubleshooting guidance.
- Update `docs/architecture/feature-inventory.md` so the maintained technical inventory records the consent-gated Speed Insights integration.

## Alternatives Rejected

- A Payload setting was rejected because Speed Insights is a deployment-level Vercel capability and does not need routine editor control.
- An environment-variable toggle was rejected because it duplicates the Vercel project setting without adding value to the initial integration.
- Unconditional collection was rejected because it would contradict the starter's documented analytics-consent policy.

## Non-Goals

- Vercel Web Analytics or custom analytics events.
- Custom sample rates, endpoint overrides, URL redaction, or route exclusions.
- Measuring Payload Admin performance.
- Automatically enabling or deploying the Vercel project.
- Changing GTM, GA4, or cookie-banner behavior.
