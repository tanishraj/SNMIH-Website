# Starter Productization And Handoff Design

## Summary

This phase turns the repo from a strong CMS codebase into a safer copied starter product.

The current project now has:

- a clearer editorial governance model
- content collections for `articles` and `reviews`
- taxonomy and archive behavior
- SEO operations with route-aware metadata and sitemap rules
- a local/deployed database contract centered on `SQLite` locally and `Postgres` on Vercel

What is still missing is a reliable handoff surface. A developer can work in this repo and understand it by reading code, but a cloned starter still needs stronger product boundaries, clearer operator-facing docs, more explicit media/storage assumptions, and executable checks that prove the documented contract still matches reality.

This phase closes those gaps without expanding into a general platform abstraction layer.

## Goal

Make this repo safer to clone, configure, deploy, and hand off by defining a clear starter contract in code, docs, and verification.

## Why This Phase Now

The product goal is not only to build CMS features. It is to build one strong marketing CMS starter that gets copied for client work.

This is the right next move because:

- the CMS feature surface is now broad enough that unclear contracts become a real reuse risk
- the runtime and SEO layers already assume a supported deployment model, but the starter still needs stronger handoff framing around them
- media/storage behavior is still mostly implicit
- operator documentation is still lighter than the implementation complexity now present in the repo

Search and broader discovery work can wait. First the starter itself needs to be clearer, safer, and more deterministic to reuse.

## Product Direction

This phase should make the starter better at:

- telling a new developer exactly what is supported
- telling a non-original operator how the CMS is organized and what to verify before launch
- making runtime, deployment, and storage assumptions explicit
- proving the starter still matches its documented contract through executable checks

This phase should not try to become:

- a generalized hosting abstraction layer
- a pluggable storage platform
- a broad CI matrix project
- a multi-tenant starter
- a feature-discovery or search expansion phase

## Scope

### In Scope

- rewrite the repo-facing docs around the actual starter product
- add a `starter clone checklist`
- add a `content model / ownership map`
- tighten the runtime contract for local vs deployed use
- make current storage/media assumptions explicit in code and docs
- add executable clone-safety checks that verify the documented contract

### Out Of Scope

- full storage abstraction
- storage-provider plugin architecture
- multi-provider deployment support beyond the existing local/Vercel profile
- heavy CI matrix expansion
- search and content discovery features
- block-system expansion

## Current-State Assessment

### What Exists Already

- `src/config/runtime.ts`, `src/config/providers.ts`, and `src/payload.config.ts` provide a real local vs deployed runtime seam
- `docs/operations/vercel-postgres-deployment.md` already documents the database deployment profile
- `tests/int/runtime-config.int.spec.ts` and `tests/int/provider-selection.int.spec.ts` already verify parts of the runtime contract
- homepage seeding and route-readiness work already improve clone-safe local verification
- the repo now has meaningful editorial, content, taxonomy, and SEO behavior worth documenting clearly

### What Is Missing

- the main `README.md` still needs to read like a starter product instead of a code-first template
- no single `starter clone checklist` exists for onboarding a new client copy
- no single `content model map` explains ownership boundaries across collections and globals
- storage/media assumptions are still implicit compared with the explicit database contract
- the docs and runtime contract are not yet tied together as one deliberate handoff standard

## Recommended Approach

Use a contract-first productization pass.

That means:

- documentation must be rewritten around the supported starter contract, not around generic framework setup
- runtime validation must continue to define what is supported locally and on Vercel
- current media/storage assumptions must be explicitly described and, where necessary, validated or rejected at startup
- executable checks must verify the contract instead of leaving it as doc-only guidance

This is the right approach because it keeps the starter honest. The repo should not claim support for workflows that the code does not enforce, and it should not depend on the original author’s context for safe handoff.

## Productization Artifacts

This phase should produce five concrete deliverables.

### 1. Starter-Specific README

`README.md` should become the primary entry point for a developer cloning this repo for a new client site.

It should explain:

- what the starter is for
- the supported local and deployed runtime model
- the first boot path
- where CMS ownership lives
- where operational and handoff docs live

It should optimize for clarity, not for showing every implementation detail.

### 2. Starter Clone Checklist

Create:

- `docs/operations/starter-clone-checklist.md`

This should be the practical copy-and-adapt checklist for a new client starter.

It should include:

- branding and naming replacements
- environment variables to review
- homepage and system-page checks
- forms and review-flow checks
- SEO and site-default checks
- deployment and storage assumptions to confirm before launch

### 3. Content Model Map

Create:

- `docs/architecture/content-model-map.md`

This should explain ownership boundaries clearly across the CMS:

- structural site content
  - `pages`
  - `navigation-links`
  - `headers`
  - `footers`
  - `system-pages`
- editorial inventory
  - `articles`
  - `reviews`
  - `categories`
  - `tags`
- intake and lead operations
  - `forms`
  - `form-submissions`
  - review promotion path
- settings globals
  - `page-settings`
  - `system-mode-settings`
  - `site-settings`
  - `theme-settings`
  - `seo-settings`

The goal is to make the system understandable without reading the full codebase first.

### 4. Runtime And Storage Contract

This phase should make supported assumptions explicit, both in docs and in code.

The contract should clearly state:

- local development uses `SQLite`
- Vercel preview and production use `Postgres`
- email behavior follows the existing provider rules
- the current media/storage behavior is supported as-is only for the documented environments
- unsupported combinations should be described clearly and, where appropriate, rejected early

This is not a storage abstraction phase. The storage goal is explicitness, not flexibility.

### 5. Executable Clone-Safety Checks

This phase should add a small verification seam that proves:

- the starter boots under documented local defaults
- the documented provider/runtime contract still holds
- homepage and core public routes resolve under the documented setup
- the storage/deployment assumptions do not silently drift away from the docs

This should stay intentionally small. The objective is starter trustworthiness, not infrastructure completeness.

## Runtime Contract Boundaries

### Database

Keep the existing supported model:

- local: `SQLite`
- Vercel preview/production: `Postgres`

This is already the chosen deployment contract and should remain the foundation for the productized starter.

### Email

Keep the current provider contract explicit and fail-fast.

This phase should not broaden email support. It should only ensure the docs and checks match the current supported behavior.

### Media / Storage

The repo should explicitly state what it supports now.

That means:

- local development media behavior should be documented as part of the supported local profile
- deployed media/storage assumptions should be documented as part of the supported Vercel profile
- if the current behavior is not safe for a documented deployment path, startup validation or docs should make that obvious

This phase should not add a full storage abstraction or provider matrix.

## Documentation Model

The docs should be organized around actual user roles.

### Developer-Facing Docs

- `README.md`
- deployment/runtime runbook
- content model map

### Operator-Facing Docs

- starter clone checklist
- editorial governance doc
- deployment checks relevant to launch readiness

The documentation should make it easy to answer these questions:

- what does this starter support?
- what must I change for a new client copy?
- which collection or global owns a given part of the site?
- what should I verify before launch?

## Verification Strategy

Use executable clone-safety checks rather than a broad CI matrix.

### Required Verification Coverage

- runtime/provider contract still matches the supported local/Vercel profile
- starter boots with documented local defaults
- homepage and core public route resolution still work on a fresh documented setup
- storage/media assumptions are checked at the same level the repo documents them
- docs and runtime assumptions do not drift apart silently

### Verification Boundaries

This phase should prefer:

- focused integration tests
- startup validation tests
- doc-aligned contract checks

It should avoid:

- broad cross-provider matrices
- full end-to-end infrastructure simulations
- speculative storage-provider tests for unsupported environments

## Implementation Shape

This phase should be implemented in three layers, in this order.

### 1. Contract Layer

Tighten the runtime/config surface so the repo can state, in code, what is supported.

This includes:

- local runtime assumptions
- deployed runtime assumptions
- explicit media/storage assumptions
- fail-fast behavior when a documented unsupported combination is attempted

### 2. Handoff Docs Layer

Write the docs around the real code, not around a hypothetical future platform.

This includes:

- `README.md`
- `docs/operations/starter-clone-checklist.md`
- `docs/architecture/content-model-map.md`
- deployment/storage runbook updates

### 3. Executable Verification Layer

Add a small check layer proving that the documented contract is still true.

This includes:

- runtime/provider tests
- storage/deployment assumption tests
- fresh-setup route verification
- doc-aligned starter checks

## Guardrails

- no new abstraction layer unless the current code truly requires one
- no broad storage-provider support claims
- no docs that promise workflows the code does not enforce
- no productization scope creep into search, blocks, or multi-tenant behavior

## Risks And Constraints

- the runtime contract is already more explicit than the storage contract, so this phase must be careful not to overstate current media support
- documentation quality now has outsized impact because the repo is intended to be copied by others
- executable clone-safety checks need to stay small enough to maintain, otherwise they become noise instead of protection
- the productized starter should reflect today’s supported path, not an idealized future infrastructure model

## Non-Goals

This phase does not include:

- pluggable storage provider architecture
- a full environment matrix
- search and discoverability work
- block-library growth
- multi-tenant concerns
- analytics or operational dashboards

## Success Criteria

This phase is successful when:

- a developer can clone the repo and quickly understand the supported setup
- a non-original developer can hand the project to a client team with clear documentation
- the runtime, deployment, and storage contract is explicit in both docs and code
- the declared starter contract is backed by executable checks
- the repo reads like a maintained starter product, not a loose implementation template
