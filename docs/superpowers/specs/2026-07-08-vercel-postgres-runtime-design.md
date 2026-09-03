# Vercel Postgres Runtime Design

## Summary

This spec defines the supported deployment contract for the marketing CMS starter.

The chosen target is:

- `SQLite` by default for local development
- `Postgres` for Vercel preview and production deployments
- `Resend` as the supported email provider seam for now

The goal is to make the starter easy to clone locally while making the production story explicit, reliable, and aligned with a Vercel-hosted deployment model.

This spec also fixes the toolchain mismatch that currently undermines the documented setup and test commands.

## Why This Direction

The repo already has a useful runtime seam in `src/config/runtime.ts` and `src/config/providers.ts`, but it is still effectively hard-coded to `SQLite`.

That is acceptable for local development, but not strong enough as the declared production contract for a starter meant to be reused for client sites on Vercel.

This design favors:

- simple local onboarding
- explicit production infrastructure assumptions
- environment-driven provider selection
- fail-fast startup behavior when deployment configuration is invalid
- documentation and tests that match the real supported path

It avoids optimizing for broad database portability that the starter does not need yet.

## Product Contract

The starter should officially support this model:

- local development uses `SQLite` by default
- Vercel preview and production use `Postgres`
- provider choice is controlled through environment variables, not code edits
- the starter remains single-site, single-dataset, and clone-oriented

Success means a new clone can:

1. run locally with minimal setup
2. deploy to Vercel with a managed Postgres database
3. fail clearly when required deployment variables are missing or contradictory

## Current Baseline

Today the project has these relevant conditions:

- `package.json` declares `pnpm: ^9 || ^10`
- the current working environment already uses `pnpm 11.x`
- `src/config/runtime.ts` only models `SQLite` for database configuration
- `src/config/providers.ts` only returns the `SQLite` database adapter
- the docs now describe provider seams, but not a concrete Vercel production contract

This means the project has the right direction, but not a complete or trustworthy deployment story.

## Recommended Approach

Three approaches were considered:

### 1. SQLite Everywhere

Keep the starter fully `SQLite` across local and deployed environments.

This is the smallest code change, but it is the weakest production story for Vercel and should not be the official target.

### 2. SQLite Local, Postgres On Vercel

Keep local development simple with `SQLite`, but make `Postgres` the supported deployment database for preview and production.

This preserves low-friction local onboarding while giving the starter a real hosted production contract.

### 3. Postgres Everywhere

Use `Postgres` in all environments for complete parity.

This is operationally consistent, but it adds unnecessary local setup friction for a starter designed to be copied quickly for marketing sites.

### Decision

Choose `SQLite local, Postgres on Vercel`.

## Architecture

### Runtime Configuration

`src/config/runtime.ts` remains the single source of truth for environment interpretation.

It should support:

- `DATABASE_PROVIDER=sqlite | postgres`
- SQLite URL handling for local development
- Postgres connection handling for Vercel preview and production
- explicit environment validation rules

The runtime layer should normalize raw environment variables into a typed configuration object that the rest of the app can trust.

### Provider Boundary

`src/config/providers.ts` remains the adapter boundary.

It should choose between:

- `@payloadcms/db-sqlite` when `DATABASE_PROVIDER=sqlite`
- Payload's supported Postgres adapter for a Vercel-hosted Postgres deployment when `DATABASE_PROVIDER=postgres`
- the existing Resend adapter when email configuration is valid

The database decision must stay separate from email-provider concerns.

### Payload Config Integration

`src/payload.config.ts` should continue consuming only normalized runtime configuration and adapter factories.

The Payload config should not contain provider-specific branching beyond wiring together the already validated runtime output.

### Deployment Contract

The repo should declare one supported hosted path clearly:

- local/dev: `SQLite`
- Vercel preview: `Postgres`
- Vercel production: `Postgres`

The docs should treat this as the official starter contract, not as one option among many.

## Validation Rules

Startup validation should be strict and explicit.

### Database Rules

- when `DATABASE_PROVIDER=sqlite`, `DATABASE_URL` must exist and point to a SQLite database path
- when `DATABASE_PROVIDER=postgres`, a Postgres connection string must exist
- when the app is running in a Vercel deployment context, `sqlite` must not be treated as a supported production database mode
- invalid provider values must fail immediately with clear startup errors

### Email Rules

- email may remain optional outside production
- if the app is configured to use the Resend provider, required Resend keys must exist
- production should fail if the deployment claims to use Resend but does not provide the required credentials

These rules are intended to surface misconfiguration early instead of allowing partial boot or silent fallback behavior.

## Toolchain Contract

The repo should stop rejecting the package-manager version already present in the environment.

The recommended change is:

- widen the supported `pnpm` engine range to include `11.x`

This is preferable to pinning the repo back to `pnpm 9/10`, because the starter gains nothing from that restriction and clone adoption becomes harder when the documented commands fail under a current `pnpm` install.

The final docs should make the supported `Node.js` and `pnpm` versions explicit.

## Documentation Changes

The documentation should make the deployment profile unambiguous.

Required updates:

- `README.md`
  - supported local vs deployed database model
  - supported package-manager/runtime versions
  - required environment variables
- `.env.example`
  - default local SQLite setup
  - production Postgres variables and examples
- a deployment-focused doc under `docs/operations/` or `docs/deployment/`
  - Vercel environment variables
  - required provider values
  - expected deployment assumptions

The docs should optimize for a developer cloning the repo for a new client, not for a platform team evaluating many possible infrastructures.

## Testing Strategy

This change needs contract tests, not just happy-path boot checks.

Required coverage:

- runtime config tests for `sqlite`
- runtime config tests for `postgres`
- validation tests for missing or invalid provider values
- provider-selection tests that assert the correct adapter branch is chosen
- verification that the documented environment model matches the implemented runtime model

The tests should stay focused on startup contract and adapter selection, not on reproducing full database integration inside the test suite.

## Rollout

No content-model migration is required.

This is an infrastructure and documentation pass that changes:

- environment parsing
- provider selection
- startup validation
- package-manager support policy
- deployment documentation

The rollout should be safe to land before any future block-system work.

## Non-Goals

This pass does not include:

- block system expansion
- multi-tenant architecture
- an opt-in local Postgres workflow
- storage-adapter migration for uploads
- deployment automation or infrastructure-as-code
- a generalized multi-provider matrix for every supported Payload database

The objective is a strong default deployment contract for one copied starter, not a broad hosting abstraction layer.

## Success Criteria

This work is successful when:

- local clones can still boot quickly with `SQLite`
- the starter can declare a real supported Vercel production profile
- invalid deployment configuration fails at startup with clear errors
- documented setup commands work under the supported toolchain
- docs and tests reflect the same runtime contract
