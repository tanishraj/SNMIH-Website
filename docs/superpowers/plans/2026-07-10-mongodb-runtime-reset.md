# MongoDB Runtime Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter's split SQLite and Postgres runtime with a MongoDB-only database contract, while preserving the working S3-compatible media integration.

**Architecture:** Collapse the runtime to a single `DATABASE_URL`-driven MongoDB path, back Payload with `mongooseAdapter`, and move real integration suites to isolated in-memory MongoDB instances. Keep the local developer story centered on Docker MongoDB and rewrite the active docs to describe only the new contract.

**Tech Stack:** Payload 3.85.2, Next.js 16, `@payloadcms/db-mongodb`, `mongodb-memory-server`, Docker Compose, Vitest, Playwright

## Global Constraints

- The starter becomes `MongoDB only`.
- The result should be: one database model for local and hosted usage.
- Use `Docker MongoDB` for day-to-day local runtime.
- Use `in-memory MongoDB` for automated integration tests.
- Leave `no active SQLite or Postgres runtime paths left in the starter`.
- Make `no change to the current S3-compatible media strategy`.
- `DATABASE_PROVIDER` is removed from the runtime contract.
- `POSTGRES_URL` is removed from the active runtime contract.
- Accepted `DATABASE_URL` prefixes are `mongodb://` and `mongodb+srv://`.
- The project should not require the entire app to run inside Docker to develop locally.
- This reset does not include changing the editorial workflow model, content collections or roles, the work queue or audit model, the current S3 media integration design, or adding multi-database compatibility back into the starter.

---

## File Structure

- `src/config/runtime.ts`
  Owns runtime env parsing and validation. After this migration it should expose a single MongoDB database contract and keep the existing media/email parsing intact.
- `src/config/providers.ts`
  Owns provider creation. After this migration it should create only the MongoDB adapter plus the existing email/storage plugins.
- `src/config/starterContract.ts`
  Owns the declared supported runtime contract. After this migration it should stop describing SQLite/Postgres and only gate media durability.
- `src/payload.config.ts`
  Owns Payload bootstrap wiring. It should continue to consume the runtime/provider seams, with no database branching.
- `package.json`
  Owns first-party dependency declarations. Remove SQLite/Postgres adapters and add only the MongoDB adapter and test harness.
- `.env.example`
  Owns the canonical local and hosted env contract. It should show MongoDB plus the existing media/email settings.
- `docker-compose.yml`
  Owns the documented local MongoDB container path. It should describe MongoDB as the primary local database.
- `tests/helpers/mongoMemoryServer.ts`
  New helper that starts/stops an isolated in-memory MongoDB server and exposes a URI for integration suites.
- `tests/helpers/seedUser.ts`
  Existing e2e seeding helper. Remove SQLite retry behavior and keep direct Payload calls.
- `tests/helpers/seedHomepage.ts`
  Existing homepage seed helper. Remove SQLite retry behavior and keep direct Payload calls.
- `tests/int/runtime-config.int.spec.ts`
  Runtime contract coverage. Rewrite assertions for MongoDB-only validation.
- `tests/int/provider-selection.int.spec.ts`
  Provider coverage. Rewrite database adapter assertions for `mongooseAdapter`.
- `tests/int/starter-contract.int.spec.ts`
  Starter contract coverage. Rewrite examples so they describe MongoDB-only runtime plus existing media gating.
- `tests/int/api.int.spec.ts`
  Real Payload boot test. Replace SQLite temp-file setup with in-memory MongoDB.
- `tests/int/starter-productization.int.spec.ts`
  Real Payload boot test for starter assumptions. Replace SQLite temp-file setup with in-memory MongoDB and update doc assertions.
- `tests/helpers/sqliteRetry.ts`
  Delete. It exists only to handle SQLite file locks.
- `src/payload-generated-schema.ts`
  Delete if it is no longer required by the MongoDB runtime path. The file is currently SQLite-shaped and should not remain as an active artifact.
- `README.md`
  Rewrite the supported runtime story, first-boot instructions, and env contract to MongoDB.
- `docs/operations/starter-clone-checklist.md`
  Update the clone workflow to MongoDB-only.
- `docs/operations/mongodb-deployment.md`
  New hosted deployment runbook replacing the active Postgres runbook.
- `docs/operations/vercel-postgres-deployment.md`
  Delete or retire from the active doc set.

### Task 1: Reset Runtime And Provider Contract To MongoDB

**Files:**
- Modify: `package.json`
- Modify: `src/config/runtime.ts`
- Modify: `src/config/providers.ts`
- Modify: `src/config/starterContract.ts`
- Modify: `src/payload.config.ts`
- Test: `tests/int/runtime-config.int.spec.ts`
- Test: `tests/int/provider-selection.int.spec.ts`
- Test: `tests/int/starter-contract.int.spec.ts`

**Interfaces:**
- Consumes: existing `RuntimeConfig`, `createDatabaseAdapter`, `createStoragePlugins`, `getStarterContract`
- Produces:
  - `RuntimeConfig['database'] = { url: string }`
  - `getRuntimeConfig(env): { database: { url: string }, deployment, email, media }`
  - `createDatabaseAdapter(config): ReturnType<typeof mongooseAdapter>`
  - `getStarterContract(config).database` compatible with MongoDB-only contract

- [ ] **Step 1: Write the failing runtime and provider tests**

Update the database contract assertions in the three integration spec files.

Use these target assertions:

```ts
// tests/int/runtime-config.int.spec.ts
expect(config.database).toEqual({
  url: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
})

expect(() => getRuntimeConfig(process.env)).toThrow(
  'Missing MongoDB DATABASE_URL. Set DATABASE_URL to a MongoDB connection string.',
)

expect(() => getRuntimeConfig(process.env)).toThrow(
  'Invalid MongoDB DATABASE_URL. Use a connection string starting with "mongodb://" or "mongodb+srv://".',
)
```

```ts
// tests/int/provider-selection.int.spec.ts
const adapterMocks = vi.hoisted(() => ({
  mongooseAdapter: vi.fn((config) => ({ kind: 'mongo', config })),
  resendAdapter: vi.fn((config) => ({ kind: 'email', config })),
  s3Storage: vi.fn((config) => ({ kind: 's3-plugin', config })),
}))

expect(adapterMocks.mongooseAdapter).toHaveBeenCalledWith({
  url: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
})
```

```ts
// tests/int/starter-contract.int.spec.ts
const contract = getStarterContract({
  database: {
    url: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit',
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
  media: {
    provider: 'localDisk',
  },
})

expect(contract.media).toEqual({
  mode: 'localDisk',
  reason: null,
  supported: true,
})
```

- [ ] **Step 2: Run the targeted failing tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts tests/int/starter-contract.int.spec.ts
```

Expected: FAIL with SQLite/Postgres-specific assertions and adapter mocks no longer matching the intended MongoDB-only contract.

- [ ] **Step 3: Replace the runtime and provider code with MongoDB-only implementation**

Apply the runtime/provider reset.

Use this implementation shape:

```ts
// src/config/runtime.ts
export type RuntimeConfig = {
  database: {
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
  media:
    | { provider: 'localDisk' }
    | {
        provider: 's3'
        acl: 'private' | 'public-read'
        bucket: string
        clientUploads: boolean
        endpoint: string
        forcePathStyle: boolean
        region: string
        accessKeyId: string
        secretAccessKey: string
      }
}

const isMongoConnectionString = (value: string): boolean =>
  value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')

export const getRuntimeConfig = (env: NodeJS.ProcessEnv = process.env): RuntimeConfig => {
  const databaseURL = env.DATABASE_URL?.trim() || ''

  if (!databaseURL) {
    throw new Error('Missing MongoDB DATABASE_URL. Set DATABASE_URL to a MongoDB connection string.')
  }

  if (!isMongoConnectionString(databaseURL)) {
    throw new Error(
      'Invalid MongoDB DATABASE_URL. Use a connection string starting with "mongodb://" or "mongodb+srv://".',
    )
  }

  // keep the existing email + media parsing logic

  return {
    database: {
      url: databaseURL,
    },
    deployment: {
      isProduction: env.NODE_ENV === 'production',
      isVercel: Boolean(env.VERCEL),
    },
    email,
    media,
  }
}
```

```ts
// src/config/providers.ts
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export const createDatabaseAdapter = (config: RuntimeConfig) => {
  return mongooseAdapter({
    url: config.database.url,
  })
}
```

```ts
// src/config/starterContract.ts
export type StarterContract = {
  database: RuntimeConfig['database']
  deployment: RuntimeConfig['deployment']
  email: RuntimeConfig['email']
  media: {
    mode: RuntimeConfig['media']['provider']
    supported: boolean
    reason: string | null
  }
}
```

Also update `package.json` dependencies so `@payloadcms/db-mongodb` remains and `@payloadcms/db-sqlite` / `@payloadcms/db-vercel-postgres` are removed.

- [ ] **Step 4: Run the targeted tests again**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts tests/int/starter-contract.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/config/runtime.ts src/config/providers.ts src/config/starterContract.ts src/payload.config.ts tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts tests/int/starter-contract.int.spec.ts
git commit -m "feat(db): switch runtime to mongodb"
```

### Task 2: Replace SQLite Test Harness With In-Memory MongoDB

**Files:**
- Create: `tests/helpers/mongoMemoryServer.ts`
- Modify: `tests/int/api.int.spec.ts`
- Modify: `tests/int/starter-productization.int.spec.ts`
- Modify: `tests/helpers/seedUser.ts`
- Modify: `tests/helpers/seedHomepage.ts`
- Delete: `tests/helpers/sqliteRetry.ts`
- Test: `tests/int/api.int.spec.ts`
- Test: `tests/int/starter-productization.int.spec.ts`

**Interfaces:**
- Consumes: MongoDB-only `getRuntimeConfig`, `@payloadcms/db-mongodb`, `mongodb-memory-server`, existing `getPayload`
- Produces:
  - `createTestMongoServer(): Promise<{ stop(): Promise<void>; uri: string }>`
  - direct Payload seed helpers with no SQLite retry wrapper

- [ ] **Step 1: Write the failing test harness changes**

Update the real-boot integration suites so they expect a Mongo URI instead of a SQLite file path.

Use this shape in both suites:

```ts
let mongo: { stop: () => Promise<void>; uri: string }

beforeAll(async () => {
  mongo = await createTestMongoServer()
  process.env.DATABASE_URL = mongo.uri
  process.env.EMAIL_PROVIDER = 'none'
  process.env.MEDIA_PROVIDER = 'localDisk'
  process.env.PAYLOAD_SECRET = 'test-secret'

  vi.resetModules()
  const { default: config } = await import('@/payload.config')
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  if (mongo) {
    await mongo.stop()
  }
})
```

Update the seed helpers to remove `runWithSQLiteBusyRetry` and call `payload.create`, `payload.delete`, and `payload.updateGlobal` directly.

- [ ] **Step 2: Run the targeted integration suites to verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts
```

Expected: FAIL because `createTestMongoServer` does not exist yet and the suites still rely on old SQLite setup.

- [ ] **Step 3: Implement the MongoDB memory helper and remove SQLite-specific retries**

Create the helper and simplify the seeds.

Use this helper shape:

```ts
// tests/helpers/mongoMemoryServer.ts
import { MongoMemoryServer } from 'mongodb-memory-server'

export async function createTestMongoServer(): Promise<{
  stop: () => Promise<void>
  uri: string
}> {
  const server = await MongoMemoryServer.create()

  return {
    uri: server.getUri(),
    stop: async () => {
      await server.stop()
    },
  }
}
```

Update the seed helpers like this:

```ts
// tests/helpers/seedUser.ts
await payload.delete({
  collection: 'users',
  where: {
    email: {
      equals: testUser.email,
    },
  },
})

await payload.create({
  collection: 'users',
  data: testUser,
})
```

```ts
// tests/helpers/seedHomepage.ts
await payload.delete({
  collection: 'pages',
  overrideAccess: false,
  user,
  where: {
    slug: {
      equals: homepageSlug,
    },
  },
})
```

Delete `tests/helpers/sqliteRetry.ts` once no imports remain.

- [ ] **Step 4: Run the targeted integration suites again**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/helpers/mongoMemoryServer.ts tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts tests/helpers/seedUser.ts tests/helpers/seedHomepage.ts
git rm tests/helpers/sqliteRetry.ts
git commit -m "test(db): move integration suites to in-memory mongo"
```

### Task 3: Clean Local Runtime Workflow And Remove SQLite Artifacts

**Files:**
- Modify: `.env.example`
- Modify: `docker-compose.yml`
- Delete: `src/payload-generated-schema.ts`
- Test: `tests/int/starter-productization.int.spec.ts`

**Interfaces:**
- Consumes: MongoDB-only runtime contract from Task 1
- Produces:
  - local env example centered on `DATABASE_URL=mongodb://127.0.0.1:27017/payload-cms-starter-kit`
  - Docker compose instructions centered on MongoDB
  - no active SQLite-generated schema artifact in repo

- [ ] **Step 1: Update the failing contract assertions in the productization suite**

Change the env-documentation assertions to match the MongoDB-only contract.

Use these checks:

```ts
const envExample = readFileSync('.env.example', 'utf8')

expect(envExample).toContain('DATABASE_URL=mongodb://127.0.0.1:27017/payload-cms-starter-kit')
expect(envExample).not.toContain('DATABASE_PROVIDER=sqlite')
expect(envExample).not.toContain('POSTGRES_URL=')
```

- [ ] **Step 2: Run the targeted productization suite to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/starter-productization.int.spec.ts
```

Expected: FAIL because `.env.example` and related assumptions still describe SQLite/Postgres.

- [ ] **Step 3: Rewrite local env and Docker defaults, then remove the SQLite generated artifact**

Update `.env.example` to this contract shape:

```env
DATABASE_URL=mongodb://127.0.0.1:27017/payload-cms-starter-kit
PAYLOAD_SECRET=YOUR_SECRET_HERE
EMAIL_PROVIDER=none
MEDIA_PROVIDER=localDisk

# Optional email
# RESEND_API_KEY=YOUR_RESEND_API_KEY
# RESEND_FROM_EMAIL=hello@yourdomain.com
# RESEND_FROM_NAME=Your Website
# RESEND_OVERRIDE_TO_EMAIL=you@example.com

# S3-compatible media storage
# MEDIA_PROVIDER=s3
# S3_BUCKET=your-bucket
# S3_ENDPOINT=https://s3.ap-northeast-1.idrivee2.com
# S3_REGION=ap-northeast-1
# S3_ACCESS_KEY_ID=your_access_key
# S3_SECRET_ACCESS_KEY=your_secret_key
# S3_ACL=public-read
# S3_FORCE_PATH_STYLE=true
# S3_CLIENT_UPLOADS=false
```

Update `docker-compose.yml` comments so Mongo is the primary documented database and remove the commented Postgres guidance.

Delete `src/payload-generated-schema.ts` if nothing in the active runtime imports it.

- [ ] **Step 4: Run the targeted suite again**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/starter-productization.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .env.example docker-compose.yml tests/int/starter-productization.int.spec.ts
git rm src/payload-generated-schema.ts
git commit -m "chore(db): remove sqlite runtime artifacts"
```

### Task 4: Rewrite Active Docs For The MongoDB-Only Contract And Re-verify The Starter

**Files:**
- Modify: `README.md`
- Modify: `docs/operations/starter-clone-checklist.md`
- Create: `docs/operations/mongodb-deployment.md`
- Delete: `docs/operations/vercel-postgres-deployment.md`
- Modify: any README links pointing at the old Postgres runbook
- Test: `tests/int/starter-productization.int.spec.ts`

**Interfaces:**
- Consumes: MongoDB-only runtime contract, Docker local flow, existing media contract
- Produces:
  - active handoff docs that describe MongoDB only
  - README links that point at the MongoDB deployment runbook

- [ ] **Step 1: Write the failing documentation assertions**

Extend the productization expectations and manual verification targets so the active docs refer to MongoDB instead of SQLite/Postgres.

Use this assertion pattern where appropriate:

```ts
expect(readme).toContain('Docker MongoDB')
expect(readme).toContain('DATABASE_URL=mongodb://127.0.0.1:27017/payload-cms-starter-kit')
expect(readme).not.toContain('Vercel Postgres deployment')
```

- [ ] **Step 2: Run the targeted productization suite to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/starter-productization.int.spec.ts
```

Expected: FAIL because the active docs still describe SQLite/Postgres and the README still links to the old runbook.

- [ ] **Step 3: Rewrite the active docs around MongoDB-only usage**

Update the docs with these content shifts:

```md
## Supported Starter Contract

- local development: `MongoDB` via Docker plus local-disk or S3 media
- hosted deployment: `MongoDB`
- media target: `localDisk` for local-only workflows or `S3-compatible` object storage such as `IDrive e2`
```

```md
## First Boot

1. Copy `.env.example` to `.env`.
2. Start MongoDB with Docker Compose.
3. Set `PAYLOAD_SECRET`.
4. Run `pnpm install`.
5. Run `pnpm dev`.
6. Open `http://localhost:3000` and create the first admin user.
```

Create `docs/operations/mongodb-deployment.md` with:

- required env: `DATABASE_URL`, `PAYLOAD_SECRET`, media envs as needed
- local Docker example and hosted MongoDB example
- hosted verification flow
- reminder that local disk media is not durable in hosted environments

Delete `docs/operations/vercel-postgres-deployment.md` and update README links to the new MongoDB runbook.

- [ ] **Step 4: Run the full integration suite and regenerate Payload artifacts**

Run:

```bash
pnpm run generate:importmap
pnpm run generate:types
pnpm run test:int
```

Expected:

- `generate:importmap` completes successfully
- `generate:types` completes successfully
- `test:int` passes

- [ ] **Step 5: Commit**

```bash
git add README.md docs/operations/starter-clone-checklist.md docs/operations/mongodb-deployment.md src/app/
git rm docs/operations/vercel-postgres-deployment.md
if [ -f src/payload-types.ts ]; then git add src/payload-types.ts; fi
git add src/app/'(payload)'/admin/importMap.js
git commit -m "docs(db): publish mongodb-only starter contract"
```

## Self-Review

- Spec coverage: Tasks 1-4 cover runtime reset, provider reset, Docker local flow, in-memory integration tests, removal of SQLite/Postgres runtime paths, generated artifact cleanup, and MongoDB deployment docs.
- Placeholder scan: No `TODO`, `TBD`, or deferred implementation markers remain.
- Type consistency: Later tasks use the same MongoDB-only `RuntimeConfig['database'] = { url: string }` contract introduced in Task 1.
