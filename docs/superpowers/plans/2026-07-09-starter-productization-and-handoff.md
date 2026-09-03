# Starter Productization And Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the starter safer to clone, configure, document, and verify by codifying its supported runtime/storage contract and aligning the handoff docs with executable checks.

**Architecture:** Add one explicit starter-contract module on top of the existing runtime config so the repo can state what is supported and reject unsafe deployed combinations early. Then rewrite the repo-facing docs around the actual content ownership and clone workflow, and finish with a small clone-safety test layer that proves the documented starter contract still matches the code.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, Vitest, Markdown docs

## Global Constraints

- no new abstraction layer unless the current code truly requires one
- no broad storage-provider support claims
- no docs that promise workflows the code does not enforce
- no productization scope creep into search, blocks, or multi-tenant behavior
- local development uses `SQLite`
- Vercel preview and production use `Postgres`
- current media/storage behavior must be explicitly documented and, where necessary, validated or rejected early
- use focused integration tests
- use startup validation tests
- use doc-aligned contract checks

## File Structure

- Create: `src/config/starterContract.ts`
  - Encodes the supported starter deployment/storage contract derived from `RuntimeConfig`.
- Modify: `src/payload.config.ts`
  - Enforces the starter contract before Payload boot finishes.
- Modify: `.env.example`
  - States the supported local defaults and the deployed media caveat in one obvious place.
- Create: `tests/int/starter-contract.int.spec.ts`
  - Covers supported vs unsupported starter contract combinations without booting the full app.
- Modify: `README.md`
  - Becomes the primary developer-facing product entry point for cloning and first boot.
- Modify: `docs/operations/starter-clone-checklist.md`
  - Becomes the operator-facing handoff checklist for client copies.
- Modify: `docs/architecture/content-model-map.md`
  - Expands ownership guidance to cover articles, reviews, taxonomies, forms, and globals.
- Modify: `docs/operations/vercel-postgres-deployment.md`
  - States the database contract plus the current deployed media limitation explicitly.
- Create: `tests/int/starter-productization.int.spec.ts`
  - Proves the documented local starter profile boots and exposes the core collections/globals the docs promise.
- Modify: `tests/int/api.int.spec.ts`
  - Reuses the documented local defaults and keeps the boot path aligned with the starter contract.

---

### Task 1: Codify The Starter Runtime And Storage Contract

**Files:**
- Create: `src/config/starterContract.ts`
- Modify: `src/payload.config.ts`
- Modify: `.env.example`
- Create: `tests/int/starter-contract.int.spec.ts`

**Interfaces:**
- Consumes: `getRuntimeConfig(env?: NodeJS.ProcessEnv): RuntimeConfig` from `src/config/runtime.ts`
- Produces: `type StarterContract`, `getStarterContract(config: RuntimeConfig): StarterContract`, `assertSupportedStarterContract(contract: StarterContract): void`

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from 'vitest'

import { assertSupportedStarterContract, getStarterContract } from '@/config/starterContract'

describe('starter contract', () => {
  it('marks the documented local profile as supported', () => {
    const contract = getStarterContract({
      database: {
        provider: 'sqlite',
        url: 'file:./payload.db',
      },
      deployment: {
        isProduction: false,
        isVercel: false,
      },
      email: {
        apiKey: null,
        fromAddress: null,
        fromName: 'Website',
        provider: 'none',
      },
    })

    expect(contract.media).toEqual({
      mode: 'localDisk',
      reason: null,
      supported: true,
    })
  })

  it('rejects Vercel production because local-disk media is not durable there', () => {
    const contract = getStarterContract({
      database: {
        provider: 'postgres',
        url: 'postgres://starter:secret@db.example.com:5432/payload',
      },
      deployment: {
        isProduction: true,
        isVercel: true,
      },
      email: {
        apiKey: null,
        fromAddress: null,
        fromName: 'Website',
        provider: 'none',
      },
    })

    expect(() => assertSupportedStarterContract(contract)).toThrow(
      'This starter uses local disk media storage. Vercel deployments require a durable media adapter before editors can upload assets safely.',
    )
  })
})
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `pnpm vitest tests/int/starter-contract.int.spec.ts --config ./vitest.config.mts`

Expected: FAIL with `Cannot find module '@/config/starterContract'`

- [ ] **Step 3: Implement the starter contract module and enforce it at boot**

```ts
// src/config/starterContract.ts
import type { RuntimeConfig } from './runtime'

export type StarterContract = {
  database: RuntimeConfig['database']
  deployment: RuntimeConfig['deployment']
  email: RuntimeConfig['email']
  media: {
    mode: 'localDisk'
    supported: boolean
    reason: string | null
  }
}

export const getStarterContract = (config: RuntimeConfig): StarterContract => {
  const deployedToVercel = config.deployment.isProduction && config.deployment.isVercel

  return {
    database: config.database,
    deployment: config.deployment,
    email: config.email,
    media: deployedToVercel
      ? {
          mode: 'localDisk',
          supported: false,
          reason:
            'This starter uses local disk media storage. Vercel deployments require a durable media adapter before editors can upload assets safely.',
        }
      : {
          mode: 'localDisk',
          supported: true,
          reason: null,
        },
  }
}

export const assertSupportedStarterContract = (contract: StarterContract): void => {
  if (!contract.media.supported && contract.media.reason) {
    throw new Error(contract.media.reason)
  }
}
```

```ts
// src/payload.config.ts
import { assertSupportedStarterContract, getStarterContract } from './config/starterContract'

const runtimeConfig = getRuntimeConfig()
const starterContract = getStarterContract(runtimeConfig)
assertSupportedStarterContract(starterContract)
const email = createEmailAdapter(runtimeConfig)
```

```dotenv
# .env.example
# Local development defaults
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./payload-cms-next-tailwind-shadcn-starter-kit.db
PAYLOAD_SECRET=YOUR_SECRET_HERE
EMAIL_PROVIDER=none

# This starter currently uses local-disk media storage.
# Vercel deployments need a durable media adapter before editors can upload assets safely.
```

- [ ] **Step 4: Re-run the targeted contract test**

Run: `pnpm vitest tests/int/starter-contract.int.spec.ts --config ./vitest.config.mts`

Expected: PASS with 2 tests passed

- [ ] **Step 5: Commit the contract slice**

```bash
git add .env.example src/config/starterContract.ts src/payload.config.ts tests/int/starter-contract.int.spec.ts
git commit -m "feat(cms): codify starter contract"
```

### Task 2: Rewrite The Starter Handoff Docs Around The Actual CMS Product

**Files:**
- Modify: `README.md`
- Modify: `docs/operations/starter-clone-checklist.md`
- Modify: `docs/architecture/content-model-map.md`
- Modify: `docs/operations/vercel-postgres-deployment.md`

**Interfaces:**
- Consumes: `getStarterContract(...)` and current collection/global ownership in `src/payload.config.ts`
- Produces: developer-facing startup contract, operator-facing clone checklist, expanded content ownership map, explicit deployed media caveat

- [ ] **Step 1: Replace the README opening with a starter-product contract**

```md
# Payload CMS Marketing Starter

This repository is an editorial-first marketing CMS starter built to be copied for one client website at a time. It already includes page routing, system pages, forms, articles, reviews, SEO defaults, editorial governance, and capability-based admin access.

## Supported Runtime Profile

- local development: `SQLite` + local disk uploads
- Vercel preview/production database: `Postgres`
- email: `none` or `resend`
- media on Vercel: not durable yet in this starter without adding a deployed media adapter

## First Boot

1. Copy `.env.example` to `.env`.
2. Keep `DATABASE_PROVIDER=sqlite` for local development.
3. Set `PAYLOAD_SECRET`.
4. Run `pnpm install` then `pnpm dev`.
5. Open `http://localhost:3000` and create the first admin user.
```

- [ ] **Step 2: Expand the content model map to cover editorial inventory and intake**

```md
## Editorial Inventory

`articles` owns long-form editorial content with lexical rich text, featured media, taxonomies, and SEO fields. Use it for authored posts, resources, and newsroom-style content.

`reviews` owns approved public testimonials promoted from review submissions. Use it only for moderated, publishable review content that should appear on the site.

`categories` and `tags` provide reusable taxonomy for articles and reviews. Use them instead of ad hoc free-text labels when content needs filtering, archives, or shared SEO surfaces.

## Intake And Lead Operations

`forms` owns public submission schemas, notification recipients, throttling behavior, and submission intent.

`form-submissions` owns stored submissions, lead workflow state, assignment, follow-up, and audit context after a form is submitted.

Review intake starts in `forms` and `form-submissions`; public-facing reviews only belong in `reviews` after editorial approval.
```

- [ ] **Step 3: Tighten the clone checklist and deployment runbook**

```md
## Verify Deployment Assumptions

- Confirm `DATABASE_PROVIDER=postgres` and `POSTGRES_URL` in Vercel.
- Do not treat the default `media` upload behavior as durable on Vercel.
- If the client needs editor-managed uploads in production, add and verify a durable media adapter before launch.
- Submit one form, promote one approved review, and confirm the public site reflects the expected state.
- Verify the configured homepage, 404 page, maintenance page, and coming-soon page all resolve correctly.
```

```md
## Media Limitation

This starter's database contract supports Vercel deployments, but its default `media` collection still writes to local disk. That is acceptable for local development and test runs. It is not a durable production upload strategy on Vercel.

Before handing a Vercel deployment to editors, add a durable deployed media adapter and re-run the starter verification checklist.
```

- [ ] **Step 4: Verify the docs point to each other correctly**

Run: `rg -n "starter-clone-checklist|content-model-map|Vercel|media" README.md docs/operations/starter-clone-checklist.md docs/architecture/content-model-map.md docs/operations/vercel-postgres-deployment.md`

Expected: matches from all four files, with the README linking to the checklist and content map and the deployment doc mentioning the media limitation

- [ ] **Step 5: Commit the docs slice**

```bash
git add README.md docs/operations/starter-clone-checklist.md docs/architecture/content-model-map.md docs/operations/vercel-postgres-deployment.md
git commit -m "docs(cms): productize starter handoff docs"
```

### Task 3: Add Executable Clone-Safety Checks For The Documented Starter Profile

**Files:**
- Create: `tests/int/starter-productization.int.spec.ts`
- Modify: `tests/int/api.int.spec.ts`
- Test: `tests/int/page-routing.int.spec.ts`

**Interfaces:**
- Consumes: `getStarterContract(...)`, `getPayload({ config })`, documented local `.env.example` defaults, `getHomepagePath(): Promise<string | null>`, `getHomepageMetadata(): Promise<Metadata>`
- Produces: clone-safety regression coverage for local boot, homepage/public-route contract, core collection/global availability, and doc-aligned starter assumptions

- [ ] **Step 1: Write a failing clone-safety integration test**

```ts
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let testDirectory = ''

describe('starter productization', () => {
  beforeAll(async () => {
    testDirectory = mkdtempSync(join(tmpdir(), 'payload-starter-productization-'))
    process.env.DATABASE_PROVIDER = 'sqlite'
    process.env.DATABASE_URL = `file:${join(testDirectory, 'payload-test.db')}`
    process.env.EMAIL_PROVIDER = 'none'
    process.env.PAYLOAD_SECRET = 'test-secret'

    const { default: config } = await import('@/payload.config')
    payload = await getPayload({ config: await config })
  })

  afterAll(() => {
    if (testDirectory) {
      rmSync(testDirectory, { force: true, recursive: true })
    }
  })

  it('keeps the documented local defaults in .env.example', () => {
    const envExample = readFileSync('.env.example', 'utf8')

    expect(envExample).toContain('DATABASE_PROVIDER=sqlite')
    expect(envExample).toContain('EMAIL_PROVIDER=none')
    expect(envExample).toContain('durable media adapter')
  })

  it('boots the starter and exposes the documented core collections and globals', async () => {
    const [pages, articles, reviews, forms, pageSettings, siteSettings, seoSettings] = await Promise.all([
      payload.find({ collection: 'pages', limit: 1 }),
      payload.find({ collection: 'articles', limit: 1 }),
      payload.find({ collection: 'reviews', limit: 1 }),
      payload.find({ collection: 'forms', limit: 1 }),
      payload.findGlobal({ slug: 'page-settings' }),
      payload.findGlobal({ slug: 'site-settings' }),
      payload.findGlobal({ slug: 'seo-settings' }),
    ])

    expect(Array.isArray(pages.docs)).toBe(true)
    expect(Array.isArray(articles.docs)).toBe(true)
    expect(Array.isArray(reviews.docs)).toBe(true)
    expect(Array.isArray(forms.docs)).toBe(true)
    expect(pageSettings).toBeDefined()
    expect(siteSettings).toBeDefined()
    expect(seoSettings).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the new integration test and verify it fails**

Run: `pnpm vitest tests/int/starter-productization.int.spec.ts --config ./vitest.config.mts`

Expected: FAIL because the test file does not exist yet

- [ ] **Step 3: Implement the integration test and align the existing API boot test with the documented local profile**

```ts
// tests/int/api.int.spec.ts
beforeAll(async () => {
  testDirectory = mkdtempSync(join(tmpdir(), 'payload-api-int-'))
  process.env.DATABASE_PROVIDER = 'sqlite'
  process.env.DATABASE_URL = `file:${join(testDirectory, 'payload-test.db')}`
  process.env.EMAIL_PROVIDER = 'none'
  process.env.PAYLOAD_SECRET = 'test-secret'

  const { default: config } = await import('@/payload.config')
  const payloadConfig = await config
  payload = await getPayload({ config: payloadConfig })
})
```

```ts
// tests/int/starter-productization.int.spec.ts
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let testDirectory = ''

describe('starter productization', () => {
  beforeAll(async () => {
    testDirectory = mkdtempSync(join(tmpdir(), 'payload-starter-productization-'))
    process.env.DATABASE_PROVIDER = 'sqlite'
    process.env.DATABASE_URL = `file:${join(testDirectory, 'payload-test.db')}`
    process.env.EMAIL_PROVIDER = 'none'
    process.env.PAYLOAD_SECRET = 'test-secret'

    const { default: config } = await import('@/payload.config')
    payload = await getPayload({ config: await config })
  })

  afterAll(() => {
    if (testDirectory) {
      rmSync(testDirectory, { force: true, recursive: true })
    }
  })

  it('keeps the documented local defaults in .env.example', () => {
    const envExample = readFileSync('.env.example', 'utf8')

    expect(envExample).toContain('DATABASE_PROVIDER=sqlite')
    expect(envExample).toContain('EMAIL_PROVIDER=none')
    expect(envExample).toContain('durable media adapter')
  })

  it('boots the starter and exposes the documented core collections and globals', async () => {
    const [pages, articles, reviews, forms, pageSettings, siteSettings, seoSettings] = await Promise.all([
      payload.find({ collection: 'pages', limit: 1 }),
      payload.find({ collection: 'articles', limit: 1 }),
      payload.find({ collection: 'reviews', limit: 1 }),
      payload.find({ collection: 'forms', limit: 1 }),
      payload.findGlobal({ slug: 'page-settings' }),
      payload.findGlobal({ slug: 'site-settings' }),
      payload.findGlobal({ slug: 'seo-settings' }),
    ])

    expect(Array.isArray(pages.docs)).toBe(true)
    expect(Array.isArray(articles.docs)).toBe(true)
    expect(Array.isArray(reviews.docs)).toBe(true)
    expect(Array.isArray(forms.docs)).toBe(true)
    expect(pageSettings).toBeDefined()
    expect(siteSettings).toBeDefined()
    expect(seoSettings).toBeDefined()
  })
})
```

- [ ] **Step 4: Run the starter clone-safety regression set**

Run: `pnpm vitest tests/int/starter-contract.int.spec.ts tests/int/starter-productization.int.spec.ts tests/int/api.int.spec.ts tests/int/page-routing.int.spec.ts --config ./vitest.config.mts`

Expected: PASS with the starter contract test, starter productization test, API boot test, and homepage route contract test all green

Run: `pnpm test:int`

Expected: PASS with the full integration suite green

- [ ] **Step 5: Commit the verification slice**

```bash
git add tests/int/api.int.spec.ts tests/int/starter-contract.int.spec.ts tests/int/starter-productization.int.spec.ts
git commit -m "test(cms): add starter clone safety checks"
```
