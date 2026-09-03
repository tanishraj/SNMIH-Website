# MongoDB URI Environment Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter's active `DATABASE_URL` environment contract with strict `MONGODB_URI` configuration everywhere it is consumed or documented.

**Architecture:** `getRuntimeConfig()` remains the single runtime validation boundary and continues to expose `database.url` to the MongoDB adapter. Environment-facing code, local/Docker configuration, database export tooling, integration setup, and active documentation move to `MONGODB_URI` with no legacy fallback.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, TypeScript, Node.js environment variables, MongoDB/Mongoose adapter, Vitest, Docker Compose, pnpm

## Global Constraints

- Runtime code and operational scripts must read only `MONGODB_URI`.
- `DATABASE_URL` must not be accepted as a fallback or produce a deprecation warning.
- Accepted values must start with `mongodb://` or `mongodb+srv://`.
- Keep the internal `RuntimeConfig.database.url` interface unchanged.
- Preserve the existing local MongoDB URI, database name, credentials, and backup behavior.
- Rename the ignored local `.env` key without printing its value.
- Do not rewrite historical files under `docs/superpowers`.
- Do not stage or commit any changes.

## File Map

- Modify `src/config/runtime.ts`: read and validate `MONGODB_URI` while preserving `database.url`.
- Modify `tests/int/runtime-config.int.spec.ts`: cover valid values, exact errors, and strict rejection of the legacy variable.
- Create `tests/int/mongodb-uri-contract.int.spec.ts`: protect the active environment contract across code, tooling, configuration, and documentation.
- Modify `.env.example` and ignored `.env`: rename the environment key while preserving the URI value.
- Modify `scripts/export-db.mjs`: read `MONGODB_URI` for `mongodump`.
- Modify `docker-compose.yml`: inject and document `MONGODB_URI`.
- Modify `tests/int/api.int.spec.ts`, `tests/int/starter-productization.int.spec.ts`, and `tests/int/media-storage.int.spec.ts`: use `MONGODB_URI` in integration setup and assertions.
- Modify `README.md` and the four active `docs/operations/*.md` files containing the old key.

---

### Task 1: Enforce The Strict Runtime Contract

**Files:**

- Modify: `tests/int/runtime-config.int.spec.ts`
- Modify: `src/config/runtime.ts:65-82`

**Interfaces:**

- Consumes: `getRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig`.
- Produces: `RuntimeConfig.database.url` sourced exclusively from `env.MONGODB_URI`.

- [ ] **Step 1: Rename the current runtime test inputs and errors**

Apply the mechanical rename only within `tests/int/runtime-config.int.spec.ts`:

```bash
perl -pi -e 's/DATABASE_URL/MONGODB_URI/g' tests/int/runtime-config.int.spec.ts
```

The existing cases must then use entries such as:

```ts
MONGODB_URI: 'mongodb://127.0.0.1:27017/payload-cms-starter-kit'
```

and expect these exact messages:

```ts
'Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.'
'Invalid MongoDB MONGODB_URI. Use a connection string starting with "mongodb://" or "mongodb+srv://".'
```

- [ ] **Step 2: Add the strict legacy-rejection test**

Add this test immediately after the missing-connection-string case:

```ts
it('does not accept DATABASE_URL as a legacy fallback', () => {
  process.env = {
    ...ORIGINAL_ENV,
    MONGODB_URI: '',
    DATABASE_URL: 'mongodb://127.0.0.1:27017/legacy-database',
    EMAIL_PROVIDER: 'none',
    MEDIA_PROVIDER: 'localDisk',
  }

  expect(() => getRuntimeConfig(process.env)).toThrow(
    'Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.',
  )
})
```

- [ ] **Step 3: Run the runtime test and verify that it fails**

Run:

```bash
pnpm exec vitest run tests/int/runtime-config.int.spec.ts --config ./vitest.config.mts
```

Expected: the renamed cases fail because production code still reads `DATABASE_URL`, and the legacy-fallback test fails because the old variable is still accepted.

- [ ] **Step 4: Change the runtime validation boundary**

Replace the database environment block in `src/config/runtime.ts` with:

```ts
const mongodbURI = env.MONGODB_URI?.trim() || ''

if (!mongodbURI) {
  throw new Error('Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.')
}

if (!isMongoConnectionString(mongodbURI)) {
  throw new Error(
    'Invalid MongoDB MONGODB_URI. Use a connection string starting with "mongodb://" or "mongodb+srv://".',
  )
}
```

In the returned configuration, preserve the public interface and change only the value source:

```ts
database: {
  url: mongodbURI,
},
```

- [ ] **Step 5: Run the runtime test and verify that it passes**

Run:

```bash
pnpm exec vitest run tests/int/runtime-config.int.spec.ts --config ./vitest.config.mts
```

Expected: all runtime configuration tests pass, including the strict legacy-rejection case.

---

### Task 2: Migrate Active Configuration, Tooling, Tests, And Documentation

**Files:**

- Create: `tests/int/mongodb-uri-contract.int.spec.ts`
- Modify: `.env.example`
- Modify without tracking: `.env`
- Modify: `scripts/export-db.mjs`
- Modify: `docker-compose.yml`
- Modify: `tests/int/api.int.spec.ts`
- Modify: `tests/int/starter-productization.int.spec.ts`
- Modify: `tests/int/media-storage.int.spec.ts`
- Modify: `README.md`
- Modify: `docs/operations/runtime-and-providers.md`
- Modify: `docs/operations/developer-workflows.md`
- Modify: `docs/operations/mongodb-deployment.md`
- Modify: `docs/operations/starter-clone-checklist.md`

**Interfaces:**

- Consumes: the strict `MONGODB_URI` runtime boundary from Task 1.
- Produces: one consistent environment key for local startup, Docker, exports, integration tests, production setup, and operator guidance.

- [ ] **Step 1: Add the failing active-contract test**

Create `tests/int/mongodb-uri-contract.int.spec.ts` with:

```ts
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const activeContractPaths = [
  '.env.example',
  'README.md',
  'docker-compose.yml',
  'scripts/export-db.mjs',
  'src/config/runtime.ts',
  'docs/operations/developer-workflows.md',
  'docs/operations/mongodb-deployment.md',
  'docs/operations/runtime-and-providers.md',
  'docs/operations/starter-clone-checklist.md',
] as const

describe('MongoDB environment contract', () => {
  it('uses MONGODB_URI throughout every active contract surface', () => {
    for (const filePath of activeContractPaths) {
      const source = readFileSync(filePath, 'utf8')

      expect(source, filePath).toContain('MONGODB_URI')
      expect(source, filePath).not.toContain('DATABASE_URL')
    }
  })

  it('documents the local MongoDB URI in the environment example', () => {
    const envExample = readFileSync('.env.example', 'utf8')

    expect(envExample).toContain('MONGODB_URI=mongodb://127.0.0.1:27017/payload-cms-starter-kit')
  })
})
```

- [ ] **Step 2: Run the active-contract test and verify that it fails**

Run:

```bash
pnpm exec vitest run tests/int/mongodb-uri-contract.int.spec.ts --config ./vitest.config.mts
```

Expected: FAIL because the environment example, export script, Docker configuration, README, and operations guides still contain `DATABASE_URL`.

- [ ] **Step 3: Rename the tracked active contract surfaces**

Run this exact mechanical replacement:

```bash
perl -pi -e 's/DATABASE_URL/MONGODB_URI/g' .env.example README.md docker-compose.yml scripts/export-db.mjs docs/operations/runtime-and-providers.md docs/operations/developer-workflows.md docs/operations/mongodb-deployment.md docs/operations/starter-clone-checklist.md tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts tests/int/media-storage.int.spec.ts
```

This preserves every URI value and changes only the environment key text. In `scripts/export-db.mjs`, the resulting contract must be:

```js
const databaseUrl = process.env.MONGODB_URI

if (!databaseUrl) {
  console.error('MONGODB_URI is required in .env')
  process.exit(1)
}
```

In `docker-compose.yml`, the resulting application environment must be:

```yaml
environment:
  MONGODB_URI: mongodb://mongo:27017/payload-cms-starter-kit

# Use MONGODB_URI=mongodb://mongo:27017/payload-cms-starter-kit when the app runs in Docker.
```

- [ ] **Step 4: Rename the ignored local environment key without exposing its value**

Run:

```bash
perl -pi -e 's/^DATABASE_URL=/MONGODB_URI=/' .env
```

Do not print `.env`. Confirm only its matching key name with:

```bash
awk -F= '/^(DATABASE_URL|MONGODB_URI)=/{print $1}' .env
```

Expected output:

```text
MONGODB_URI
```

- [ ] **Step 5: Run the active-contract and runtime tests**

Run:

```bash
pnpm exec vitest run tests/int/mongodb-uri-contract.int.spec.ts tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts --config ./vitest.config.mts
```

Expected: all tests pass.

---

### Task 3: Verify Integration Setup And Production Build

**Files:**

- Verify only; no planned file changes.

**Interfaces:**

- Consumes: the strict runtime contract and migrated active surfaces from Tasks 1 and 2.
- Produces: evidence that local, integration, Docker, export, documentation, and production-build paths use `MONGODB_URI` successfully.

- [ ] **Step 1: Verify legacy references are limited to the rejection test and history**

Run:

```bash
rg -n 'DATABASE_URL' README.md docker-compose.yml scripts src/config tests/int docs/operations .env.example --hidden -g '!runtime-config.int.spec.ts' -g '!mongodb-uri-contract.int.spec.ts'
```

Expected: no output and exit code 1 because no active legacy references remain outside the explicit rejection contract.

Run:

```bash
rg -n 'DATABASE_URL' tests/int/runtime-config.int.spec.ts
```

Expected: only the strict legacy-rejection test name and its `DATABASE_URL` input are reported.

- [ ] **Step 2: Verify integration environment setup**

Run:

```bash
pnpm exec vitest run tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts tests/int/media-storage.int.spec.ts --config ./vitest.config.mts
```

Expected: all three integration files pass. If the sandbox denies the MongoMemoryServer port with `EPERM`, rerun the same command with approved local network access; do not alter application code.

- [ ] **Step 3: Run TypeScript validation**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: exit code 0 with no diagnostics.

- [ ] **Step 4: Run targeted linting**

Run:

```bash
pnpm exec eslint src/config/runtime.ts scripts/export-db.mjs tests/int/runtime-config.int.spec.ts tests/int/mongodb-uri-contract.int.spec.ts tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts tests/int/media-storage.int.spec.ts
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 5: Run the production build with database access**

Run:

```bash
pnpm build
```

Expected: Next.js compilation, TypeScript validation, page-data collection, static generation, and final optimization complete successfully using `MONGODB_URI`.

- [ ] **Step 6: Check the final unstaged change set**

Run:

```bash
git diff --check
git status --short
git diff -- src/config/runtime.ts scripts/export-db.mjs docker-compose.yml .env.example README.md docs/operations tests/int
git diff -- docs/superpowers/specs/2026-08-10-mongodb-uri-env-contract-design.md docs/superpowers/plans/2026-08-10-mongodb-uri-env-contract.md
```

Expected: only the approved environment-contract implementation, tests, active documentation, design, and plan are present. `.env` remains ignored, and no changes are staged or committed.
