# MongoDB Runtime Reset Design

## Goal

Replace the starter's split SQLite and Postgres database contract with a single MongoDB-only contract.

The result should be:

- one database model for local and hosted usage
- Docker MongoDB for day-to-day local runtime
- in-memory MongoDB for automated integration tests
- no active SQLite or Postgres runtime paths left in the starter
- no change to the current S3-compatible media strategy

## Why This Change Exists

The current starter still carries multiple database stories:

- local development uses SQLite
- hosted deployment docs assume Postgres
- tests include SQLite-specific retry behavior
- generated artifacts and runtime validation still reflect the old split

That makes the starter harder to understand and hand off. The desired direction is one explicit database model across the product.

## Target Runtime Contract

The starter becomes MongoDB-only.

### Environment Contract

The active database contract is reduced to a single variable:

- `DATABASE_URL`

That value must be a MongoDB connection string.

Examples:

- local Docker Mongo: `mongodb://127.0.0.1:27017/payload-cms-starter-kit`
- docker-compose hostname path: `mongodb://mongo:27017/payload-cms-starter-kit`
- hosted MongoDB: `mongodb+srv://...`

`DATABASE_PROVIDER` is removed from the runtime contract.

`POSTGRES_URL` is removed from the active runtime contract.

### Runtime Validation

`src/config/runtime.ts` should:

- remove SQLite and Postgres branching
- validate only `DATABASE_URL`
- fail fast when `DATABASE_URL` is missing
- fail fast when the value is not a MongoDB-style connection string

Accepted URL prefixes should be:

- `mongodb://`
- `mongodb+srv://`

### Adapter Selection

`src/config/providers.ts` should:

- remove `sqliteAdapter`
- remove `vercelPostgresAdapter`
- use `mongooseAdapter` from `@payloadcms/db-mongodb`
- pass `DATABASE_URL` into the Mongo adapter

No database branching should remain in the active provider layer.

## Local Development Workflow

Local development should be centered on Docker MongoDB.

### Primary Local Flow

1. Start MongoDB with Docker.
2. Keep `DATABASE_URL` pointed at the local Mongo container.
3. Run `pnpm dev`.
4. Use Payload normally.

Recommended local default:

```env
DATABASE_URL=mongodb://127.0.0.1:27017/payload-cms-starter-kit
```

### Docker Scope

The existing `mongo` service in `docker-compose.yml` should become the documented local database path.

The app should still be runnable outside Docker as long as the Mongo container is already running.

The project should not require the entire app to run inside Docker to develop locally.

## Test Strategy

Automated tests should not depend on the local Docker Mongo container.

### Integration Tests

Integration suites that boot real Payload should use `mongodb-memory-server`.

That means:

- each real-boot test suite creates an isolated temporary Mongo URI
- tests assign that URI to `process.env.DATABASE_URL`
- tests import the Payload config only after environment setup
- the ephemeral database is disposed after the suite finishes

This replaces the current SQLite temporary-file setup.

### SQLite Retry Removal

The helper dedicated to SQLite busy-lock retries should be removed.

Specifically:

- remove the SQLite retry helper
- update seed helpers and integration setup code to call Payload directly without SQLite lock retries

### E2E Tests

E2E support code should stop relying on SQLite-specific assumptions.

The browser test server can still use the normal local app runtime, but the comments and helper naming should no longer mention SQLite locking semantics.

If later the team wants Playwright to boot against Docker Mongo explicitly, that can be a follow-up change, but it is not required for this reset.

## Media Contract

The recent S3-compatible media path remains unchanged.

The starter should continue to support:

- `MEDIA_PROVIDER=localDisk` for local-only media behavior
- `MEDIA_PROVIDER=s3` for IDrive e2 or another S3-compatible host

This database migration should not disturb the working media integration.

## Code Changes In Scope

### Runtime Layer

Update:

- `src/config/runtime.ts`
- `src/config/providers.ts`
- `src/payload.config.ts` only if needed to align imports or adapter shape
- `src/config/starterContract.ts`

### Dependencies

Add:

- `@payloadcms/db-mongodb`

Remove:

- `@payloadcms/db-sqlite`
- `@payloadcms/db-vercel-postgres`

### Tests And Helpers

Update or remove:

- `tests/helpers/sqliteRetry.ts`
- `tests/helpers/seedUser.ts`
- `tests/helpers/seedHomepage.ts`
- integration suites that currently seed SQLite temp database files
- runtime/provider contract tests that currently assert SQLite/Postgres behavior

### Generated Artifacts

Review and replace or remove SQLite-shaped generated artifacts, especially:

- `src/payload-generated-schema.ts`

The repo should not retain actively misleading SQLite-generated schema artifacts after the runtime reset.

## Documentation Changes

The active docs should be rewritten to reflect MongoDB as the only database path.

### Must Update

- `README.md`
- `.env.example`
- `docs/operations/starter-clone-checklist.md`
- the current Postgres deployment runbook

### Deployment Doc Change

`docs/operations/vercel-postgres-deployment.md` should no longer remain the active deployment document in its current form.

It should be replaced by a MongoDB deployment runbook, either by:

- renaming it to a MongoDB-specific file, or
- rewriting its contents completely if the existing path is intentionally preserved

Recommendation:

- replace it with a MongoDB deployment runbook so the filename matches reality

## Non-Goals

This reset does not include:

- changing the editorial workflow model
- changing content collections or roles
- changing the work queue or audit model
- changing the current S3 media integration design
- adding multi-database compatibility back into the starter

## Risks And Mitigations

### Risk: Test Harness Breakage

The current test harness assumes SQLite temp files and SQLite-specific retry behavior.

Mitigation:

- migrate only the true Payload-boot integration suites to `mongodb-memory-server`
- keep unit tests unchanged unless they assert old database-provider assumptions

### Risk: Stale Generated SQLite Artifacts

The repo currently contains generated SQLite schema code that will become misleading.

Mitigation:

- regenerate or remove the artifact as part of the migration
- ensure active docs no longer describe SQLite as a valid starter path

### Risk: Local Confusion During Transition

Developers may still have old `.env` values or old expectations about `DATABASE_PROVIDER`.

Mitigation:

- simplify `.env.example`
- update README first-boot instructions
- document the Docker Mongo startup flow clearly

## Recommendation

Implement the full MongoDB-only reset in one pass.

That is the cleanest result because the starter is meant to be handed off and copied. Carrying SQLite/Postgres compatibility forward would leave an unnecessary mixed contract in the repo and make future onboarding harder.
