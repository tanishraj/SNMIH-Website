# Vercel Postgres Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real Vercel-ready production runtime contract by keeping SQLite as the default local database, supporting Postgres for Vercel preview/production, and aligning package-manager/docs/tooling with that contract.

**Architecture:** The work starts at the runtime boundary so environment parsing and validation become trustworthy before any adapter branching is added. Once the runtime contract is explicit, the Payload provider layer can switch between SQLite and a Vercel-hosted Postgres adapter, and the final task can update the repo contract in `package.json`, `.env.example`, and deployment docs so a cloned starter matches the code path that is actually supported.

**Tech Stack:** Payload CMS, Next.js App Router, TypeScript, Vitest, pnpm, SQLite, Postgres, Resend, Markdown docs

## Global Constraints

- `SQLite` by default for local development
- `Postgres` for Vercel preview and production deployments
- `Resend` as the supported email provider seam for now
- provider choice is controlled through environment variables, not code edits
- the starter remains single-site, single-dataset, and clone-oriented
- when the app is running in a Vercel deployment context, `sqlite` must not be treated as a supported production database mode
- widen the supported `pnpm` engine range to include `11.x`
- this pass does not include block system expansion
- this pass does not include multi-tenant architecture
- this pass does not include an opt-in local Postgres workflow
- this pass does not include storage-adapter migration for uploads
- this pass does not include deployment automation or infrastructure-as-code

---

## File Structure

- Modify: `package.json`
- Delete: `package-lock.json`
- Create: `pnpm-lock.yaml`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `src/config/runtime.ts`
- Modify: `src/config/providers.ts`
- Modify: `src/payload.config.ts`
- Create: `docs/operations/vercel-postgres-deployment.md`
- Modify: `tests/int/runtime-config.int.spec.ts`
- Create: `tests/int/provider-selection.int.spec.ts`

### Task 1: Harden Runtime Contract Parsing

**Files:**
- Modify: `src/config/runtime.ts`
- Modify: `tests/int/runtime-config.int.spec.ts`

**Interfaces:**
- Consumes: raw environment variables from `process.env`
- Produces:
  - `type RuntimeConfig`
  - `getRuntimeConfig(env?: NodeJS.ProcessEnv): RuntimeConfig`
  - startup-safe validation for `sqlite` and `postgres` provider modes

- [ ] **Step 1: Expand the failing runtime-config test file**

Replace `tests/int/runtime-config.int.spec.ts` with:

```ts
import { afterEach, describe, expect, it } from 'vitest'

import { getRuntimeConfig } from '@/config/runtime'

const ORIGINAL_ENV = { ...process.env }

describe('runtime config', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('reads sqlite as the default local database provider', () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_PROVIDER: 'sqlite',
      DATABASE_URL: 'file:./payload.db',
      EMAIL_PROVIDER: 'none',
      VERCEL: '',
    }

    const config = getRuntimeConfig(process.env)

    expect(config.database).toEqual({
      provider: 'sqlite',
      url: 'file:./payload.db',
    })
    expect(config.deployment).toEqual({
      isProduction: false,
      isVercel: false,
    })
    expect(config.email.provider).toBe('none')
  })

  it('reads postgres from POSTGRES_URL for vercel deployments', () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_PROVIDER: 'postgres',
      POSTGRES_URL: 'postgres://starter:secret@db.example.com:5432/payload',
      NODE_ENV: 'production',
      VERCEL: '1',
    }

    const config = getRuntimeConfig(process.env)

    expect(config.database).toEqual({
      provider: 'postgres',
      url: 'postgres://starter:secret@db.example.com:5432/payload',
    })
    expect(config.deployment).toEqual({
      isProduction: true,
      isVercel: true,
    })
  })

  it('rejects sqlite in vercel production', () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_PROVIDER: 'sqlite',
      DATABASE_URL: 'file:./payload.db',
      NODE_ENV: 'production',
      VERCEL: '1',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'SQLite is only supported for local development. Use DATABASE_PROVIDER=postgres on Vercel.',
    )
  })

  it('rejects postgres without a connection string', () => {
    process.env = {
      ...ORIGINAL_ENV,
      DATABASE_PROVIDER: 'postgres',
      POSTGRES_URL: '',
    }

    expect(() => getRuntimeConfig(process.env)).toThrow(
      'Missing Postgres connection string. Set POSTGRES_URL or DATABASE_URL.',
    )
  })
})
```

- [ ] **Step 2: Run the runtime test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts
```

Expected:
- FAIL because `RuntimeConfig` does not yet expose `deployment`
- FAIL because `getRuntimeConfig` does not yet support `postgres` or startup validation

- [ ] **Step 3: Implement the runtime contract in `src/config/runtime.ts`**

Replace the file contents with:

```ts
export type RuntimeConfig = {
  database:
    | {
        provider: 'sqlite'
        url: string
      }
    | {
        provider: 'postgres'
        url: string
      }
  deployment: {
    isProduction: boolean
    isVercel: boolean
  }
  email: {
    provider: 'resend' | 'none'
    apiKey: string | null
    fromAddress: string | null
    fromName: string
  }
}

const getDatabaseProvider = (env: NodeJS.ProcessEnv): 'sqlite' | 'postgres' => {
  if (!env.DATABASE_PROVIDER || env.DATABASE_PROVIDER === 'sqlite') {
    return 'sqlite'
  }

  if (env.DATABASE_PROVIDER === 'postgres') {
    return 'postgres'
  }

  throw new Error('Unsupported DATABASE_PROVIDER. Use "sqlite" or "postgres".')
}

export const getRuntimeConfig = (env: NodeJS.ProcessEnv = process.env): RuntimeConfig => {
  const databaseProvider = getDatabaseProvider(env)
  const isProduction = env.NODE_ENV === 'production'
  const isVercel = Boolean(env.VERCEL)
  const postgresUrl = env.POSTGRES_URL || env.DATABASE_URL || ''

  const database =
    databaseProvider === 'postgres'
      ? (() => {
          if (!postgresUrl) {
            throw new Error('Missing Postgres connection string. Set POSTGRES_URL or DATABASE_URL.')
          }

          return {
            provider: 'postgres' as const,
            url: postgresUrl,
          }
        })()
      : (() => {
          if (!env.DATABASE_URL) {
            throw new Error('Missing SQLite DATABASE_URL. Set DATABASE_URL to a local file path.')
          }

          if (isVercel && isProduction) {
            throw new Error(
              'SQLite is only supported for local development. Use DATABASE_PROVIDER=postgres on Vercel.',
            )
          }

          return {
            provider: 'sqlite' as const,
            url: env.DATABASE_URL,
          }
        })()

  const emailProvider =
    env.EMAIL_PROVIDER === 'resend' || (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL)
      ? 'resend'
      : 'none'

  if (emailProvider === 'resend' && (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL)) {
    throw new Error(
      'Incomplete Resend configuration. Set RESEND_API_KEY and RESEND_FROM_EMAIL or use EMAIL_PROVIDER=none.',
    )
  }

  return {
    database,
    deployment: {
      isProduction,
      isVercel,
    },
    email: {
      provider: emailProvider,
      apiKey: env.RESEND_API_KEY || null,
      fromAddress: env.RESEND_FROM_EMAIL || null,
      fromName: env.RESEND_FROM_NAME || 'Website',
    },
  }
}
```

- [ ] **Step 4: Run the runtime test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts
```

Expected:
- PASS with 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/config/runtime.ts tests/int/runtime-config.int.spec.ts
git commit -m "feat: harden runtime config contract"
```

### Task 2: Add SQLite/Postgres Provider Branching

**Files:**
- Modify: `src/config/providers.ts`
- Modify: `src/payload.config.ts`
- Create: `tests/int/provider-selection.int.spec.ts`
- Modify: `package.json`
- Delete: `package-lock.json`
- Create: `pnpm-lock.yaml`

**Interfaces:**
- Consumes:
  - `getRuntimeConfig(env?: NodeJS.ProcessEnv): RuntimeConfig`
  - `RuntimeConfig['database']` with `provider: 'sqlite' | 'postgres'`
- Produces:
  - `createDatabaseAdapter(config: RuntimeConfig): ReturnType<typeof sqliteAdapter> | ReturnType<typeof vercelPostgresAdapter>`
  - `createEmailAdapter(config: RuntimeConfig): ReturnType<typeof resendAdapter> | undefined`

- [ ] **Step 1: Add a failing provider-selection test**

Create `tests/int/provider-selection.int.spec.ts` with:

```ts
import { describe, expect, it, vi } from 'vitest'

const adapterMocks = vi.hoisted(() => ({
  sqliteAdapter: vi.fn((config) => ({ kind: 'sqlite', config })),
  vercelPostgresAdapter: vi.fn((config) => ({ kind: 'postgres', config })),
  resendAdapter: vi.fn((config) => ({ kind: 'email', config })),
}))

vi.mock('@payloadcms/db-sqlite', () => ({
  sqliteAdapter: adapterMocks.sqliteAdapter,
}))

vi.mock('@payloadcms/db-vercel-postgres', () => ({
  vercelPostgresAdapter: adapterMocks.vercelPostgresAdapter,
}))

vi.mock('@payloadcms/email-resend', () => ({
  resendAdapter: adapterMocks.resendAdapter,
}))

describe('provider selection', () => {
  it('creates a sqlite adapter for local runtime config', async () => {
    const { createDatabaseAdapter } = await import('@/config/providers')

    const adapter = createDatabaseAdapter({
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

    expect(adapterMocks.sqliteAdapter).toHaveBeenCalledWith({
      client: {
        url: 'file:./payload.db',
      },
    })
    expect(adapter).toMatchObject({ kind: 'sqlite' })
  })

  it('creates a vercel postgres adapter for hosted runtime config', async () => {
    const { createDatabaseAdapter } = await import('@/config/providers')

    const adapter = createDatabaseAdapter({
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

    expect(adapterMocks.vercelPostgresAdapter).toHaveBeenCalledWith({
      pool: {
        connectionString: 'postgres://starter:secret@db.example.com:5432/payload',
      },
    })
    expect(adapter).toMatchObject({ kind: 'postgres' })
  })
})
```

- [ ] **Step 2: Run the provider-selection test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/provider-selection.int.spec.ts
```

Expected:
- FAIL because `@payloadcms/db-vercel-postgres` is not installed
- or FAIL because `createDatabaseAdapter` never selects a Postgres branch

- [ ] **Step 3: Add the dependency and provider branching**

Update `package.json` in these exact places:

```json
{
  "dependencies": {
    "@payloadcms/db-sqlite": "3.85.1",
    "@payloadcms/db-vercel-postgres": "3.85.1",
    "@payloadcms/email-resend": "^3.85.1"
  },
  "engines": {
    "node": "^18.20.2 || >=20.9.0",
    "pnpm": "^9 || ^10 || ^11"
  }
}
```

Delete the npm lockfile and switch the repo to the package manager it already documents:

```bash
rm package-lock.json
pnpm install
```

Replace `src/config/providers.ts` with:

```ts
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { resendAdapter } from '@payloadcms/email-resend'

import type { RuntimeConfig } from './runtime'

export const createDatabaseAdapter = (config: RuntimeConfig) => {
  if (config.database.provider === 'postgres') {
    return vercelPostgresAdapter({
      pool: {
        connectionString: config.database.url,
      },
    })
  }

  return sqliteAdapter({
    client: {
      url: config.database.url,
    },
  })
}

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

Update the production guard in `src/payload.config.ts` to use deployment-aware runtime config:

```ts
const runtimeConfig = getRuntimeConfig()
const email = createEmailAdapter(runtimeConfig)

if (runtimeConfig.deployment.isProduction && !email && runtimeConfig.email.provider === 'resend') {
  throw new Error('Missing production email configuration.')
}
```

- [ ] **Step 4: Install dependencies and run focused tests**

Run:

```bash
pnpm test:int -- --run tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts
```

Expected:
- `pnpm install` has already succeeded with `pnpm 11.x`
- PASS with all runtime/provider tests passing

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/config/providers.ts src/payload.config.ts tests/int/provider-selection.int.spec.ts
git rm package-lock.json
git commit -m "feat: add vercel postgres database adapter"
```

### Task 3: Publish The Supported Vercel Deployment Contract

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Create: `docs/operations/vercel-postgres-deployment.md`

**Interfaces:**
- Consumes:
  - runtime contract from `src/config/runtime.ts`
  - supported adapter selection from `src/config/providers.ts`
- Produces:
  - `.env.example` that defaults to local SQLite and documents Vercel Postgres variables
  - `README.md` sections that match the new runtime/deployment contract
  - `docs/operations/vercel-postgres-deployment.md` as the deployment runbook

- [ ] **Step 1: Write the failing docs verification checklist**

Create this scratch checklist before editing:

```md
- .env.example no longer uses a MongoDB example URL
- README states SQLite local and Postgres on Vercel
- README declares pnpm 11 support
- deployment runbook names Vercel env vars and provider values
```

- [ ] **Step 2: Confirm the current doc/env gaps**

Run:

```bash
sed -n '1,120p' .env.example
rg -n 'SQLite|Postgres|pnpm 11|Vercel' README.md docs/operations || true
test -f docs/operations/vercel-postgres-deployment.md || echo "missing deployment runbook"
```

Expected:
- `.env.example` still starts with a MongoDB URL
- no dedicated Vercel Postgres deployment runbook exists

- [ ] **Step 3: Update `.env.example`, `README.md`, and add the deployment runbook**

Replace `.env.example` with:

```dotenv
# Local development defaults
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./payload-cms-next-tailwind-shadcn-starter-kit.db
PAYLOAD_SECRET=YOUR_SECRET_HERE
EMAIL_PROVIDER=none

# Resend
# Set EMAIL_PROVIDER=resend when email delivery is required.
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL=hello@yourdomain.com
RESEND_FROM_NAME=Your Website

# Optional: force all outgoing emails to a single inbox while testing
# RESEND_OVERRIDE_TO_EMAIL=you@example.com

# Vercel Postgres deployment
# DATABASE_PROVIDER=postgres
# POSTGRES_URL=postgres://user:password@host:5432/database
```

Update the environment/tooling sections in `README.md` to include:

```md
## Environment

Local development defaults:

- `DATABASE_PROVIDER=sqlite`
- `DATABASE_URL=file:./payload-cms-next-tailwind-shadcn-starter-kit.db`
- `PAYLOAD_SECRET`

Vercel deployments:

- `DATABASE_PROVIDER=postgres`
- `POSTGRES_URL`
- `PAYLOAD_SECRET`

Email:

- `EMAIL_PROVIDER=none | resend`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`

## Tooling

- `Node.js`: `^18.20.2 || >=20.9.0`
- `pnpm`: `^9 || ^10 || ^11`

## Deployment

- local/dev uses `SQLite`
- Vercel preview and production use `Postgres`
- see [docs/operations/vercel-postgres-deployment.md](docs/operations/vercel-postgres-deployment.md)
```

Create `docs/operations/vercel-postgres-deployment.md` with:

```md
# Vercel Postgres Deployment

## Supported Profile

- local development: `SQLite`
- Vercel preview: `Postgres`
- Vercel production: `Postgres`

## Required Environment Variables

- `DATABASE_PROVIDER=postgres`
- `POSTGRES_URL`
- `PAYLOAD_SECRET`

## Optional Email Variables

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_OVERRIDE_TO_EMAIL`

## Deployment Notes

- Do not deploy this starter to Vercel with `DATABASE_PROVIDER=sqlite`.
- Local clones should keep `DATABASE_PROVIDER=sqlite` unless they are being prepared for hosted deployment.
- Preview and production should both use the same Postgres-backed provider mode.

## Verification

1. Create or attach a Postgres database in Vercel.
2. Set `DATABASE_PROVIDER=postgres`.
3. Set `POSTGRES_URL`.
4. Set `PAYLOAD_SECRET`.
5. If email is required, set the Resend variables.
6. Deploy and verify the app boots without runtime configuration errors.
```

- [ ] **Step 4: Verify that docs match the runtime contract**

Run:

```bash
rg -n 'DATABASE_PROVIDER=sqlite|DATABASE_PROVIDER=postgres|pnpm.: .\\^9 \\|\\| \\^10 \\|\\| \\^11|Vercel Postgres Deployment' .env.example README.md docs/operations/vercel-postgres-deployment.md
pnpm test:int -- --run tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts
```

Expected:
- the grep output shows the local/dev and Vercel production profile in all three files
- tests still pass after the doc updates

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md docs/operations/vercel-postgres-deployment.md
git commit -m "docs: add vercel deployment contract"
```

## Self-Review

- Spec coverage:
  - runtime/provider contract is covered by Task 1 and Task 2
  - pnpm 11 support and package-manager consistency are covered by Task 2
  - local SQLite plus Vercel Postgres documentation is covered by Task 3
  - fail-fast startup rules are covered by Task 1
- Placeholder scan:
  - no `TODO`, `TBD`, or "similar to" references remain
- Type consistency:
  - `RuntimeConfig`, `getRuntimeConfig`, and `createDatabaseAdapter` names are used consistently across all tasks
