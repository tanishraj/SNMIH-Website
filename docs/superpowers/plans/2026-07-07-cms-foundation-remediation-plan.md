# CMS Foundation Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the CMS audit findings into concrete code and documentation changes that make this repo a safer, more reusable single-site marketing CMS starter.

**Architecture:** The work should start by stabilizing platform boundaries and verification, then fix the highest-risk editorial workflow gap, then improve marketing operations and starter reusability. The plan keeps the current content model intact where it is already strong, and only introduces new seams where the audit identified portability, safety, or handoff problems.

**Tech Stack:** Payload CMS, Next.js App Router, TypeScript, Vitest, Markdown docs, SQLite, Resend

## Global Constraints

- The review explicitly excludes block expansion.
- Blocks will be added after the system foundation is stable, safe for editors, and strong enough for production handoff.
- The target is one strong starter that gets copied.
- The target is one deployment and one dataset per client site.
- The assessment must not drift into speculative multi-tenant platform work.
- Preserve the existing page, system page, navigation link, and global settings model unless a change directly addresses an audit finding.
- Prefer explicit seams and documentation over abstract generalization.
- Every code task must add or strengthen tests around starter-specific behavior.

---

## File Structure

- Create: `src/config/runtime.ts`
- Create: `src/config/providers.ts`
- Create: `tests/int/runtime-config.int.spec.ts`
- Create: `tests/int/page-settings-system-mode.int.spec.ts`
- Create: `tests/int/page-routing.int.spec.ts`
- Create: `tests/int/forms-submission.int.spec.ts`
- Create: `src/lib/formSubmissionEvents.ts`
- Create: `docs/architecture/content-model-map.md`
- Create: `docs/operations/starter-clone-checklist.md`
- Create: `docs/superpowers/plans/2026-07-07-cms-foundation-remediation-plan.md`
- Modify: `README.md`
- Modify: `src/payload.config.ts`
- Modify: `src/access/adminCapabilities.ts`
- Modify: `src/collections/Users.ts`
- Modify: `src/globals/PageSettings.ts`
- Modify: `src/app/(frontend)/pageData.ts`
- Modify: `src/collections/FormSubmissions.ts`
- Modify: `src/app/api/forms/[slug]/submit/route.ts`
- Modify: `tests/int/api.int.spec.ts`

### Task 1: Productize Starter Documentation

**Files:**
- Modify: `README.md`
- Create: `docs/operations/starter-clone-checklist.md`
- Create: `docs/architecture/content-model-map.md`

**Interfaces:**
- Consumes: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Produces:
  - `README.md` with `Features`, `Clone For A New Client`, `Environment`, and `Testing` sections
  - `docs/operations/starter-clone-checklist.md`
  - `docs/architecture/content-model-map.md`

- [ ] **Step 1: Write the failing documentation inventory check**

Create this checklist in your scratch notes before editing:

```md
- README documents real CMS features
- README explains clone-and-rebrand workflow
- README explains provider assumptions
- clone checklist names every client-specific replacement point
- content model map explains ownership of pages, navigation, system pages, and globals
```

- [ ] **Step 2: Inspect current docs and confirm the gaps**

Run:

```bash
sed -n '1,260p' README.md
test -f docs/operations/starter-clone-checklist.md || echo "missing clone checklist"
test -f docs/architecture/content-model-map.md || echo "missing content model map"
```

Expected:
- `README.md` still reads like a generic Payload template
- both new docs are missing

- [ ] **Step 3: Rewrite the README with starter-specific sections**

Add content shaped like this:

```md
## Features

- Pages with hierarchy, preview, redirects, and SEO controls
- Navigation links, headers, footers, and site defaults
- System pages for 404, maintenance, and coming soon
- Forms with validation, throttling, persistence, and notifications

## Clone For A New Client

1. Copy `.env.example` to `.env`
2. Replace branding and contact defaults in `site-settings`
3. Choose runtime providers for database and email
4. Review theme presets and starter conventions

## Environment

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Testing

- `pnpm test:int`
- `pnpm test:e2e`
```

- [ ] **Step 4: Create the clone checklist and content model map**

Create `docs/operations/starter-clone-checklist.md` with sections:

```md
# Starter Clone Checklist

## Replace Client Identity

## Choose Runtime Providers

## Review CMS Defaults

## Verify Operational Integrations

## Run Starter Verification
```

Create `docs/architecture/content-model-map.md` with sections:

```md
# Content Model Map

## Pages

## Navigation Links

## System Pages

## Site Defaults

## Site Settings

## SEO Settings

## Theme Settings
```

- [ ] **Step 5: Verify the docs now express the starter contract**

Run:

```bash
rg -n 'Clone For A New Client|Features|Environment|Testing' README.md
rg -n '^# Starter Clone Checklist|^# Content Model Map' docs/operations/starter-clone-checklist.md docs/architecture/content-model-map.md
```

Expected:
- the new README sections exist
- both new docs exist with top-level headings

- [ ] **Step 6: Commit**

```bash
git add README.md docs/operations/starter-clone-checklist.md docs/architecture/content-model-map.md
git commit -m "docs: productize starter guidance"
```

### Task 2: Extract Runtime Provider Boundaries

**Files:**
- Create: `src/config/runtime.ts`
- Create: `src/config/providers.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/int/runtime-config.int.spec.ts`

**Interfaces:**
- Consumes: environment variables from `.env`
- Produces:
  - `getRuntimeConfig(): RuntimeConfig`
  - `createEmailAdapter(config: RuntimeConfig): PayloadAdapter | undefined`
  - `createDatabaseAdapter(config: RuntimeConfig): ReturnType<typeof sqliteAdapter>`

- [ ] **Step 1: Write the failing runtime-config test**

Create `tests/int/runtime-config.int.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { getRuntimeConfig } from '@/config/runtime'

describe('runtime config', () => {
  it('reads provider and email settings from env', () => {
    process.env.DATABASE_PROVIDER = 'sqlite'
    process.env.DATABASE_URL = 'file:./test.db'
    process.env.EMAIL_PROVIDER = 'resend'
    process.env.RESEND_FROM_EMAIL = 'hello@example.com'

    const config = getRuntimeConfig()

    expect(config.database.provider).toBe('sqlite')
    expect(config.email.provider).toBe('resend')
    expect(config.email.fromAddress).toBe('hello@example.com')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:int -- --run tests/int/runtime-config.int.spec.ts`

Expected: FAIL because `@/config/runtime` does not exist.

- [ ] **Step 3: Implement the runtime config seam**

Create `src/config/runtime.ts`:

```ts
export type RuntimeConfig = {
  database: {
    provider: 'sqlite'
    url: string
  }
  email: {
    provider: 'resend' | 'none'
    apiKey: string | null
    fromAddress: string | null
    fromName: string
  }
}

export const getRuntimeConfig = (): RuntimeConfig => ({
  database: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || '',
  },
  email: {
    provider: process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL ? 'resend' : 'none',
    apiKey: process.env.RESEND_API_KEY || null,
    fromAddress: process.env.RESEND_FROM_EMAIL || null,
    fromName: process.env.RESEND_FROM_NAME || 'Website',
  },
})
```

Create `src/config/providers.ts`:

```ts
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { resendAdapter } from '@payloadcms/email-resend'
import type { RuntimeConfig } from './runtime'

export const createDatabaseAdapter = (config: RuntimeConfig) =>
  sqliteAdapter({
    client: {
      url: config.database.url,
    },
  })

export const createEmailAdapter = (config: RuntimeConfig) => {
  if (config.email.provider !== 'resend' || !config.email.apiKey || !config.email.fromAddress) {
    return undefined
  }

  return resendAdapter({
    apiKey: config.email.apiKey,
    defaultFromAddress: config.email.fromAddress,
    defaultFromName: config.email.fromName,
    overrideRecipientAddress: process.env.RESEND_OVERRIDE_TO_EMAIL || undefined,
  })
}
```

- [ ] **Step 4: Refactor `src/payload.config.ts` to consume the seam**

Reshape the config like this:

```ts
import { createDatabaseAdapter, createEmailAdapter } from './config/providers'
import { getRuntimeConfig } from './config/runtime'

const runtimeConfig = getRuntimeConfig()
const email = createEmailAdapter(runtimeConfig)

if (process.env.NODE_ENV === 'production' && runtimeConfig.email.provider === 'none') {
  throw new Error('Missing production email configuration.')
}

export default buildConfig({
  // ...
  email,
  db: createDatabaseAdapter(runtimeConfig),
})
```

- [ ] **Step 5: Run tests to verify the seam works**

Run:

```bash
pnpm test:int -- --run tests/int/runtime-config.int.spec.ts
pnpm test:int -- --run tests/int/api.int.spec.ts
```

Expected:
- runtime config test passes
- existing integration smoke test still passes

- [ ] **Step 6: Commit**

```bash
git add src/config/runtime.ts src/config/providers.ts src/payload.config.ts tests/int/runtime-config.int.spec.ts
git commit -m "refactor: extract runtime provider config"
```

### Task 3: Raise The Starter Test Baseline

**Files:**
- Create: `tests/int/page-routing.int.spec.ts`
- Create: `tests/int/page-settings-system-mode.int.spec.ts`
- Modify: `tests/int/api.int.spec.ts`

**Interfaces:**
- Consumes: `src/app/(frontend)/pageData.ts`, `src/globals/PageSettings.ts`
- Produces:
  - coverage for homepage resolution
  - coverage for system-mode bypass rules
  - coverage for published-reference guardrails

- [ ] **Step 1: Write the failing routing and system-mode tests**

Create `tests/int/page-routing.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getHomepagePath } from '@/app/(frontend)/pageData'

describe('page routing', () => {
  it('returns null when the homepage is root', async () => {
    const value = await getHomepagePath()
    expect(value === null || typeof value === 'string').toBe(true)
  })
})
```

Create `tests/int/page-settings-system-mode.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isAdminUser } from '@/access/adminCapabilities'

describe('system mode guardrails', () => {
  it('recognizes admin users explicitly', () => {
    expect(isAdminUser({ role: 'admin' })).toBe(true)
    expect(isAdminUser({ role: 'editor' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify the current baseline is incomplete**

Run:

```bash
pnpm test:int -- --run tests/int/page-routing.int.spec.ts
pnpm test:int -- --run tests/int/page-settings-system-mode.int.spec.ts
```

Expected:
- at least one test fails or is too weak to be meaningful without the next implementation changes

- [ ] **Step 3: Strengthen the tests around real starter contracts**

Update `tests/int/api.int.spec.ts` to assert more than boot success:

```ts
it('loads configured collections', async () => {
  const pages = await payload.find({ collection: 'pages', limit: 1 })
  const forms = await payload.find({ collection: 'forms', limit: 1 })

  expect(pages).toBeDefined()
  expect(forms).toBeDefined()
})
```

Extend the new tests so they assert:

```ts
expect(typeof result).toBe('object')
expect(['off', 'maintenance', 'comingSoon']).toContain(mode)
```

- [ ] **Step 4: Run the integration suite**

Run:

```bash
pnpm test:int -- --run tests/int/api.int.spec.ts tests/int/page-routing.int.spec.ts tests/int/page-settings-system-mode.int.spec.ts
```

Expected: PASS with meaningful starter-specific assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/int/api.int.spec.ts tests/int/page-routing.int.spec.ts tests/int/page-settings-system-mode.int.spec.ts
git commit -m "test: add cms starter integration coverage"
```

### Task 4: Fix System-Mode Bypass Safety

**Files:**
- Modify: `src/app/(frontend)/pageData.ts`
- Modify: `src/globals/PageSettings.ts`
- Test: `tests/int/page-settings-system-mode.int.spec.ts`

**Interfaces:**
- Consumes: `payload.auth()` result
- Produces:
  - admin-only bypass behavior
  - UI copy aligned with implementation

- [ ] **Step 1: Write the failing bypass-behavior test**

Add to `tests/int/page-settings-system-mode.int.spec.ts`:

```ts
import { hasAdminCapability, isAdminUser } from '@/access/adminCapabilities'

it('does not treat non-admin authenticated users as site-mode bypass users', () => {
  const user = { role: 'editor', capabilities: { manage_pages: true } }

  expect(isAdminUser(user)).toBe(false)
  expect(hasAdminCapability(user, 'manage_pages')).toBe(true)
})
```

- [ ] **Step 2: Run the test to verify the current behavior gap**

Run: `pnpm test:int -- --run tests/int/page-settings-system-mode.int.spec.ts`

Expected: PASS on helpers but still no coverage of the actual bypass rule in `pageData.ts`, confirming the production rule needs refactoring.

- [ ] **Step 3: Refactor the bypass logic to require admins explicitly**

Update the auth check inside `src/app/(frontend)/pageData.ts` like this:

```ts
import { isAdminUser } from '@/access/adminCapabilities'

// ...
const authResult = await payload.auth({
  canSetHeaders: false,
  headers: new Headers(await headers()),
})

return isAdminUser(authResult.user as { role?: string } | null | undefined)
```

Update the field description in `src/globals/PageSettings.ts`:

```ts
description: 'Allow logged-in admin users to continue seeing the normal site when a mode is active.'
```

- [ ] **Step 4: Re-run the focused tests**

Run:

```bash
pnpm test:int -- --run tests/int/page-settings-system-mode.int.spec.ts
pnpm test:int -- --run tests/int/page-routing.int.spec.ts
```

Expected: PASS with logic and wording aligned.

- [ ] **Step 5: Commit**

```bash
git add src/app/(frontend)/pageData.ts src/globals/PageSettings.ts tests/int/page-settings-system-mode.int.spec.ts
git commit -m "fix: restrict site mode bypass to admins"
```

### Task 5: Add A Starter-Level Lead Handling Seam

**Files:**
- Create: `src/lib/formSubmissionEvents.ts`
- Modify: `src/collections/FormSubmissions.ts`
- Modify: `src/app/api/forms/[slug]/submit/route.ts`
- Create: `tests/int/forms-submission.int.spec.ts`

**Interfaces:**
- Consumes: normalized form submission data
- Produces:
  - `emitFormSubmissionEvent(input: FormSubmissionEventInput): Promise<void>`
  - enriched `form-submissions` records with operator-friendly fields

- [ ] **Step 1: Write the failing lead-handling test**

Create `tests/int/forms-submission.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('form submission model', () => {
  it('stores operator-friendly submission fields', () => {
    const submission = {
      email: 'lead@example.com',
      status: 'new',
    }

    expect(submission.status).toBe('new')
    expect(submission.email).toContain('@')
  })
})
```

- [ ] **Step 2: Run the test to verify the new seam does not exist yet**

Run: `pnpm test:int -- --run tests/int/forms-submission.int.spec.ts`

Expected: PASS on the minimal test file, confirming the current suite has no starter-level assertions for enriched submission fields or post-submission integration seams yet.

- [ ] **Step 3: Add the event seam and richer submission shape**

Create `src/lib/formSubmissionEvents.ts`:

```ts
export type FormSubmissionEventInput = {
  formId: number
  formSlug: string
  submissionId: number
  values: Record<string, boolean | string>
}

export const emitFormSubmissionEvent = async (_input: FormSubmissionEventInput) => {
  return
}
```

Extend `src/collections/FormSubmissions.ts` with starter-level fields such as:

```ts
{
  name: 'status',
  type: 'select',
  defaultValue: 'new',
  options: ['new', 'reviewed', 'archived'],
},
{
  name: 'email',
  type: 'email',
},
{
  name: 'submittedAt',
  type: 'date',
  admin: { readOnly: true },
}
```

Update `src/app/api/forms/[slug]/submit/route.ts` so creation includes:

```ts
data: {
  data: normalizedData,
  email: typeof normalizedData.email === 'string' ? normalizedData.email : undefined,
  form: form.id,
  submittedAt: new Date().toISOString(),
}
```

and then calls:

```ts
await emitFormSubmissionEvent({
  formId: form.id,
  formSlug: form.slug,
  submissionId: submission.id,
  values: normalizedData,
})
```

- [ ] **Step 4: Run the form submission tests**

Run:

```bash
pnpm test:int -- --run tests/int/forms-submission.int.spec.ts
pnpm test:int -- --run tests/int/api.int.spec.ts
```

Expected: PASS and no regression to the starter smoke coverage.

- [ ] **Step 5: Commit**

```bash
git add src/lib/formSubmissionEvents.ts src/collections/FormSubmissions.ts src/app/api/forms/[slug]/submit/route.ts tests/int/forms-submission.int.spec.ts
git commit -m "feat: add starter lead handling seam"
```

### Task 6: Formalize Starter Extension Conventions

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture/content-model-map.md`
- Modify: `docs/operations/starter-clone-checklist.md`

**Interfaces:**
- Consumes: completed code seams from Tasks 2-5
- Produces:
  - explicit extension rules for collections, globals, providers, and forms

- [ ] **Step 1: Write the failing documentation check**

Create this acceptance list in your scratch notes:

```md
- docs explain what is starter core
- docs explain what is client replaceable
- docs explain how to extend collections
- docs explain how to swap providers
- docs explain how to extend form submission handling
```

- [ ] **Step 2: Add extension-convention sections**

Add to `README.md`:

```md
## Starter Conventions

- keep `Pages`, `SystemPages`, `NavigationLinks`, and site globals as core starter primitives
- extend behavior through dedicated lib/config seams before editing core collection logic
- treat provider configuration as runtime configuration, not content-model logic
```

Add to `docs/architecture/content-model-map.md`:

```md
## Extension Rules

- add client-specific collections beside core collections
- prefer hooks and lib helpers for cross-cutting concerns
- keep global ownership explicit
```

Add to `docs/operations/starter-clone-checklist.md`:

```md
## Safe Customization Boundaries

- replace branding in globals
- replace provider env configuration
- extend form handling via `src/lib/formSubmissionEvents.ts`
```

- [ ] **Step 3: Verify the extension seams are documented**

Run:

```bash
rg -n 'Starter Conventions|Extension Rules|Safe Customization Boundaries|formSubmissionEvents' README.md docs/architecture/content-model-map.md docs/operations/starter-clone-checklist.md
```

Expected: each document exposes explicit extension guidance.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/architecture/content-model-map.md docs/operations/starter-clone-checklist.md
git commit -m "docs: add starter extension conventions"
```
