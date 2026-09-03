# Consent-Gated Vercel Speed Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect Vercel Speed Insights metrics on public routes only after the visitor grants analytics consent.

**Architecture:** The public server layout already derives `hasAnalyticsConsent` from the `analytics_consent` cookie. Add Vercel's framework-specific component to that layout and render it through the same consent boolean used by GTM and GA4; keep Payload Admin and all CMS schemas unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Payload CMS 3, pnpm, Vitest, `@vercel/speed-insights`

## Global Constraints

- Speed Insights must render only when `analytics_consent=granted`.
- Use `@vercel/speed-insights/next`; do not add a custom client wrapper.
- Keep Vercel's default sample rate and endpoint configuration.
- Do not add Payload fields, globals, endpoints, environment variables, route exclusions, or Web Analytics.
- Payload Admin must remain outside the measured route group.
- Do not stage or commit any files.

## File Map

- Modify `package.json` and `pnpm-lock.yaml`: record the official Speed Insights dependency.
- Modify `src/app/(frontend)/layout.tsx`: mount Speed Insights behind the existing server-side consent boolean.
- Create `tests/int/speed-insights.int.spec.ts`: protect the dependency, import, consent boundary, and documentation contract.
- Modify `docs/guides/analytics.md`: explain setup, privacy behavior, verification, and troubleshooting.
- Modify `docs/architecture/feature-inventory.md`: record Speed Insights in the maintained architecture inventory.

---

### Task 1: Add The Consent-Gated Runtime Integration

**Files:**
- Create: `tests/int/speed-insights.int.spec.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/app/(frontend)/layout.tsx:1-28`
- Modify: `src/app/(frontend)/layout.tsx:361-373`

**Interfaces:**
- Consumes: `hasAnalyticsConsent: boolean`, derived from the existing `analytics_consent` cookie in `RootLayout`.
- Produces: a conditional `<SpeedInsights />` mount on public frontend routes; no exported application interface.

- [ ] **Step 1: Write the failing runtime contract test**

Create `tests/int/speed-insights.int.spec.ts` with:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const layoutSource = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')
const packageJSON = JSON.parse(readFileSync('package.json', 'utf8')) as {
  dependencies?: Record<string, string>
}

describe('Vercel Speed Insights integration', () => {
  it('installs and imports the framework-specific package', () => {
    expect(packageJSON.dependencies?.['@vercel/speed-insights']).toBeTruthy()
    expect(layoutSource).toContain(
      "import { SpeedInsights } from '@vercel/speed-insights/next'",
    )
  })

  it('mounts Speed Insights only through the existing analytics consent boundary', () => {
    expect(layoutSource).toContain("const hasAnalyticsConsent = analyticsConsent === 'granted'")
    expect(layoutSource).toMatch(
      /\{hasAnalyticsConsent\s*\?\s*<SpeedInsights\s*\/>\s*:\s*null\}/,
    )
    expect(layoutSource).not.toMatch(/^\s*<SpeedInsights\s*\/>\s*$/m)
  })
})
```

- [ ] **Step 2: Run the focused test and verify that it fails**

Run:

```bash
pnpm exec vitest run tests/int/speed-insights.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because `@vercel/speed-insights` is absent from `package.json` and the frontend layout has no `SpeedInsights` import.

- [ ] **Step 3: Install the official dependency**

Run:

```bash
pnpm add @vercel/speed-insights
```

Expected: `package.json` gains `@vercel/speed-insights` under `dependencies`, and `pnpm-lock.yaml` records its resolved package version.

- [ ] **Step 4: Add the framework import to the public layout**

In `src/app/(frontend)/layout.tsx`, add this direct import with the other package imports:

```ts
import { SpeedInsights } from '@vercel/speed-insights/next'
```

Keep the existing `hasAnalyticsConsent` calculation unchanged:

```ts
const analyticsConsent = cookieStore.get('analytics_consent')?.value
const hasAnalyticsConsent = analyticsConsent === 'granted'
```

- [ ] **Step 5: Mount Speed Insights through the consent gate**

At the end of `<body>`, immediately after `<SearchDialog />`, add:

```tsx
<SearchDialog />
{hasAnalyticsConsent ? <SpeedInsights /> : null}
```

Do not place the component in `src/app/(payload)/layout.tsx`; that keeps Payload Admin outside collection.

- [ ] **Step 6: Run the focused test and verify that it passes**

Run:

```bash
pnpm exec vitest run tests/int/speed-insights.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS with two tests.

---

### Task 2: Document Setup And Consent Behavior

**Files:**
- Modify: `tests/int/speed-insights.int.spec.ts`
- Modify: `docs/guides/analytics.md`
- Modify: `docs/architecture/feature-inventory.md`

**Interfaces:**
- Consumes: the runtime contract from Task 1.
- Produces: operator-facing setup instructions and an architecture inventory statement that match the code.

- [ ] **Step 1: Add the failing documentation contract test**

Append these constants after `packageJSON` in `tests/int/speed-insights.int.spec.ts`:

```ts
const analyticsGuide = readFileSync('docs/guides/analytics.md', 'utf8')
const featureInventory = readFileSync('docs/architecture/feature-inventory.md', 'utf8')
```

Append this test inside the existing `describe` block:

```ts
it('documents deployment setup and consent-gated collection', () => {
  expect(analyticsGuide).toContain('## Vercel Speed Insights')
  expect(analyticsGuide).toContain('analytics_consent=granted')
  expect(analyticsGuide).toContain('Enable Speed Insights')
  expect(featureInventory).toContain(
    'Vercel Speed Insights collects public-route Web Vitals only after analytics consent.',
  )
})
```

- [ ] **Step 2: Run the focused test and verify that the new assertion fails**

Run:

```bash
pnpm exec vitest run tests/int/speed-insights.int.spec.ts --config ./vitest.config.mts
```

Expected: two runtime tests pass and the documentation test fails because the new section and inventory sentence do not exist.

- [ ] **Step 3: Extend the analytics guide**

In `docs/guides/analytics.md`, change the opening paragraph to:

```markdown
`Analytics & Tracking` is where you connect the website to Google Tag Manager or Google Analytics 4. The starter also integrates Vercel Speed Insights for real-user performance metrics. All three integrations are held back until a visitor explicitly accepts analytics cookies. This provides consent gating but does not, by itself, guarantee compliance with any privacy law.
```

After `## How It Connects To The Website` and its existing explanatory paragraphs, insert:

```markdown
## Vercel Speed Insights

Vercel Speed Insights reports anonymous Core Web Vitals for public frontend routes. It is configured in code rather than through the Payload `Analytics & Tracking` global and does not measure Payload Admin routes.

To activate it for a deployment:

1. Open the project in the Vercel dashboard.
2. Open **Speed Insights** and select **Enable Speed Insights**.
3. Deploy the repository with the `@vercel/speed-insights` integration.
4. Visit the deployed website, accept analytics cookies, navigate between pages, and then leave or blur the page so pending metrics can be sent.

The component is rendered only when `analytics_consent=granted`. Visitors who reject analytics or have not made a choice do not load the Speed Insights script. The integration uses Vercel's default sampling and endpoint configuration.

If metrics do not appear, confirm the Vercel project feature is enabled, test after granting consent, navigate between public routes, and check whether a content blocker prevented the Speed Insights script or request. A blocked or unavailable metrics endpoint does not affect website rendering.
```

Add this bullet under `## Best Practices`:

```markdown
- keep Speed Insights consent-gated unless a deployment-specific privacy review explicitly approves another policy
```

- [ ] **Step 4: Update the feature inventory**

Under `## Analytics And Consent` in `docs/architecture/feature-inventory.md`, replace the first two bullets with:

```markdown
- GTM takes precedence over standalone GA4 when both are enabled.
- GTM, standalone GA4, and Vercel Speed Insights are not loaded until `analytics_consent=granted`.
- Vercel Speed Insights collects public-route Web Vitals only after analytics consent. Payload Admin is excluded.
```

Keep the existing cookie-duration and legal-review bullets unchanged.

- [ ] **Step 5: Run the focused test and verify that all assertions pass**

Run:

```bash
pnpm exec vitest run tests/int/speed-insights.int.spec.ts --config ./vitest.config.mts
```

Expected: PASS with three tests.

---

### Task 3: Verify The Complete Change

**Files:**
- Verify only; no planned file changes.

**Interfaces:**
- Consumes: the dependency, conditional layout mount, tests, and documentation from Tasks 1 and 2.
- Produces: evidence that the repository is ready for deployment without staging or committing it.

- [ ] **Step 1: Check formatting and accidental whitespace errors**

Run:

```bash
git diff --check
```

Expected: exit code 0 with no output.

- [ ] **Step 2: Run TypeScript validation**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: exit code 0 with no TypeScript diagnostics.

- [ ] **Step 3: Run linting**

Run:

```bash
pnpm lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 4: Run the integration suite**

Run:

```bash
pnpm run test:int
```

Expected: all integration test files pass, including `tests/int/speed-insights.int.spec.ts`.

- [ ] **Step 5: Verify the production build**

Run:

```bash
pnpm build
```

Expected: Next.js production build completes successfully.

- [ ] **Step 6: Review the final unstaged diff**

Run:

```bash
git status --short
git diff -- package.json pnpm-lock.yaml 'src/app/(frontend)/layout.tsx' tests/int/speed-insights.int.spec.ts docs/guides/analytics.md docs/architecture/feature-inventory.md
git diff -- docs/superpowers/specs/2026-08-10-vercel-speed-insights-design.md docs/superpowers/plans/2026-08-10-vercel-speed-insights.md
```

Expected: only the approved Speed Insights dependency, runtime integration, tests, documentation, design, and plan are present; no files are staged or committed.

## Deployment Verification

After the repository changes are deployed:

1. Enable Speed Insights in the Vercel project dashboard if it is not already enabled.
2. Open a public route in a private browser window and reject analytics; verify no Speed Insights script loads.
3. Clear the `analytics_consent` cookie, reload, and accept analytics; verify the route refreshes and the Speed Insights script loads.
4. Navigate between public routes, interact with the page, then switch tabs or leave the page.
5. Confirm data points appear in the Vercel Speed Insights dashboard. Content blockers may need to be disabled for this verification.
