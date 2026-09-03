# Playwright SQLite Worker Serialization Design

## Summary

This spec fixes the next exposed e2e reliability issue after the pnpm startup repair and Playwright readiness-route adjustment.

The current failure is:

- Playwright now reaches real test execution
- frontend and admin e2e specs can start concurrently
- both suites perform local Payload writes during setup
- the local SQLite database then throws `SQLITE_BUSY: database is locked`

The goal of this work is to stabilize clone-safe local e2e execution by removing the concurrent browser-worker pattern that conflicts with SQLite in this starter.

## Why This Direction

Three approaches were considered.

### 1. Recommended: run Playwright with `workers: 1`

Serialize e2e workers so only one Playwright worker performs setup and browser actions at a time.

This is the narrowest fix and matches the local SQLite runtime the starter already uses.

### 2. Per-worker isolated databases

Give each worker its own database file and bootstrap flow.

This is more complex than the current starter needs and would expand test infrastructure significantly.

### 3. Switch local e2e to Postgres

Move local browser tests off SQLite entirely.

This is heavier operationally and unnecessary for solving the current failure.

### Decision

Run Playwright with `workers: 1`.

## Product Contract

After this work:

- Playwright no longer runs admin and frontend e2e in parallel
- concurrent SQLite lock failures during e2e setup are eliminated
- `pnpm test:e2e` no longer fails because multiple workers contend for the same local SQLite database
- `pnpm test` no longer fails for this specific concurrency reason

If new failures appear after serialization, they should be treated as separate issues.

## Architecture

### Serialize Browser Workers

Set Playwright `workers` to `1` unconditionally for this starter.

This should apply to:

- local runs
- CI runs

The point is predictability. Since the starter’s local e2e path depends on SQLite, allowing multiple workers locally but not in CI would keep the clone-safe path ambiguous.

### Keep Existing Test Ownership

This patch should not change:

- admin e2e ownership
- frontend e2e ownership
- homepage seed helper behavior
- Playwright readiness route
- Payload runtime configuration

The fix is about concurrency, not data modeling or startup sequencing.

## Verification Strategy

Validation should prove:

1. Playwright starts with a single worker
2. admin and frontend e2e no longer contend for SQLite during setup
3. `pnpm test:e2e` gets past the prior `SQLITE_BUSY` failure
4. `pnpm test` gets past this specific concurrency problem

If another e2e failure appears after serialization, that should be recorded as the next issue rather than folded into this patch.

## Error Handling

This patch should remain narrow.

Rules:

- do not broaden it into database-provider changes
- do not add per-worker database orchestration
- do not restructure the whole Playwright suite

The only behavior change should be e2e worker concurrency.

## Non-Goals

This work does not include:

- switching e2e to Postgres
- per-worker database isolation
- broader Playwright suite redesign
- changing app runtime or CMS data model
- changing admin/frontend seeding ownership

## Testing

Verification for this work should prove:

- Playwright no longer runs e2e suites in parallel
- SQLite lock errors from concurrent worker startup are eliminated
- `pnpm test:e2e` gets past the previous `SQLITE_BUSY` failure
- `pnpm test` gets past this specific SQLite concurrency issue
