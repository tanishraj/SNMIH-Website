# MongoDB URI Environment Contract Design

## Goal

Replace the starter's active `DATABASE_URL` environment contract with a strict `MONGODB_URI` contract so local development, production deployments, database exports, tests, and operator documentation use the same MongoDB-specific variable name.

## Decision

The cutover is strict. Runtime code and operational scripts will read only `MONGODB_URI`. `DATABASE_URL` will not be accepted as a fallback and will not produce a deprecation warning.

This matches the existing production environment and prevents an obsolete variable from silently masking configuration drift.

## Active Surfaces

The rename covers:

- `src/config/runtime.ts` runtime validation and error messages
- `scripts/export-db.mjs` database export configuration and errors
- `.env.example` and the ignored local `.env`
- `docker-compose.yml`
- current integration tests that construct or assert the database environment
- `README.md`
- active operator documentation under `docs/operations`

Historical specifications and plans under `docs/superpowers` remain unchanged because they document the architecture and decisions that existed when they were written.

## Runtime Contract

`getRuntimeConfig()` will trim `env.MONGODB_URI`, require a non-empty value, and accept only `mongodb://` or `mongodb+srv://` connection strings. Its returned `database.url` property remains unchanged so the provider boundary and Payload configuration do not need modification.

The missing-variable error will be:

```text
Missing MongoDB MONGODB_URI. Set MONGODB_URI to a MongoDB connection string.
```

The invalid-variable error will be:

```text
Invalid MongoDB MONGODB_URI. Use a connection string starting with "mongodb://" or "mongodb+srv://".
```

Supplying only `DATABASE_URL` must fail as a missing `MONGODB_URI` configuration.

## Local And Deployment Configuration

The key in `.env.example` changes to `MONGODB_URI` while retaining the existing local MongoDB example value. The ignored local `.env` key will be renamed without printing or changing its value.

Docker Compose will inject `MONGODB_URI=mongodb://mongo:27017/payload-cms-starter-kit` into the application container. Production operators must configure `MONGODB_URI` in their hosting environment.

## Database Export

`pnpm export:db` will read `process.env.MONGODB_URI` and pass that value to `mongodump --uri`. If the variable is absent, the script will stop with an error naming `MONGODB_URI`.

Archive naming and export behavior remain unchanged.

## Testing And Verification

- Update runtime tests to cover valid local and SRV values through `MONGODB_URI`.
- Verify missing and invalid `MONGODB_URI` values produce the new exact errors.
- Add a strict-cutover assertion that a valid legacy `DATABASE_URL` without `MONGODB_URI` is rejected.
- Update Mongo-backed integration setup to assign temporary database URIs through `process.env.MONGODB_URI`.
- Assert `.env.example` contains `MONGODB_URI` and no longer contains `DATABASE_URL`.
- Verify active code, scripts, Docker configuration, README, integration setup, and operations documentation contain no `DATABASE_URL` references. The strict-rejection test is the only intentional legacy reference.
- Run focused runtime/provider tests, TypeScript, lint, and the production build.

## Security And Failure Handling

Connection-string values must never be printed during migration or verification. Only environment key names may appear in command output.

Missing or invalid configuration fails at startup before Payload connects. Database connection failures after validation retain the existing adapter behavior.

## Non-Goals

- Supporting `DATABASE_URL` as a legacy alias.
- Renaming the internal `database.url` runtime property.
- Changing the MongoDB adapter, database provider, database name, credentials, or connection options.
- Rewriting historical documents under `docs/superpowers`.
- Changing backup archive format or storage location.
