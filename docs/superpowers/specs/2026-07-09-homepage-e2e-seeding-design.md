# Homepage E2E Seeding Design

## Summary

This spec fixes a test reliability gap around the frontend homepage route.

In this starter, `/` is intended to be a real homepage path controlled by `PageSettings.homepage`. The current e2e flow assumes the homepage already exists, but the test setup does not declare or seed that prerequisite. As a result, browser tests can fail on fresh or cleaned databases because `http://localhost:3000/` resolves to no configured homepage.

The goal of this work is to make the homepage contract explicit in Playwright setup rather than relying on leftover database state or adding runtime fallbacks.

## Why This Direction

Three approaches were considered.

### 1. Recommended: seed a published homepage in e2e setup and point `PageSettings.homepage` to it

Create one deterministic published page for tests and update `page-settings` so `/` resolves correctly during the frontend suite.

This matches the real CMS ownership model and keeps the test suite responsible for its own content prerequisites.

### 2. Seed only the homepage reference and assume a page already exists

Update `page-settings.homepage` without creating a known page as part of the test flow.

This is too brittle for a clone-safe starter. A fresh database may not contain any suitable published page.

### 3. Add runtime fallback behavior for `/`

Change frontend page resolution so `/` falls back to some other page or default behavior when `PageSettings.homepage` is empty.

This would weaken the CMS contract. The homepage should exist because the CMS state declares it, not because the runtime guesses.

### Decision

Seed a dedicated published homepage in e2e setup and set `PageSettings.homepage` to that page.

## Product Contract

After this work:

- Playwright frontend tests declare their homepage prerequisite explicitly
- the e2e suite creates one published homepage page with deterministic content
- `page-settings.homepage` points to that seeded page during the suite
- `http://localhost:3000/` resolves as a real homepage path during e2e verification
- the seeded homepage state is cleaned up after the suite

No runtime fallback behavior should be added to frontend routing.

## Architecture

### Test-Owned Homepage State

Homepage readiness should live in Playwright setup, not in production runtime behavior.

The test layer should own:

- homepage page creation
- page publishing state
- `page-settings.homepage` assignment
- teardown and cleanup

This keeps the application contract unchanged and makes test prerequisites explicit.

### Dedicated Seed Helper

Add a focused helper alongside the existing Playwright helpers, for example:

- `tests/helpers/seedHomepage.ts`

This helper should:

- create or replace one published homepage page
- set `page-settings.homepage` to that page
- expose cleanup that clears `page-settings.homepage`
- delete the seeded page during teardown

This should remain separate from admin-user seeding for now. The user seed and homepage seed solve different test prerequisites.

### Keep Admin E2E Scope Stable

This patch should update the frontend e2e setup only.

Do not broaden it into:

- a global Playwright bootstrap layer
- admin-suite restructuring
- cross-suite shared content orchestration

Those may be reasonable later, but they are not required to fix the homepage contract now.

## Seeded Homepage Content

The seeded homepage should be minimal and deterministic.

Required characteristics:

- published page document
- stable title
- stable slug
- `metaTitle`
- `metaDescription`
- content sufficient for the existing homepage assertion to render predictably

The content should use the existing page model only. No special test-only runtime shortcuts should be added.

## Verification Strategy

Validation should prove:

1. the frontend e2e setup can create and assign a homepage explicitly
2. `http://localhost:3000/` resolves during the frontend suite
3. the homepage test passes against seeded content
4. the suite no longer depends on leftover local database state for homepage routing

If further frontend assertions fail after routing succeeds, those should be treated as normal application or test expectation issues, not as homepage-seeding failures.

## Error Handling

This patch should keep cleanup explicit.

Rules:

- teardown should clear `page-settings.homepage`
- teardown should delete the seeded homepage page
- setup should replace prior conflicting test homepage state rather than assuming a clean database

This avoids accumulation of test artifacts across repeated local runs.

## Non-Goals

This work does not include:

- redesigning homepage routing
- adding runtime fallback behavior for `/`
- shipping default published homepage content as production starter state
- rewriting the admin e2e suite
- merging all e2e setup into one global bootstrap system

## Testing

Verification for this work should prove:

- Playwright `webServer` can treat `/` as a real homepage path once seeded state exists
- `tests/e2e/frontend.e2e.spec.ts` passes with declared seeded prerequisites
- `pnpm test:e2e` gets past homepage routing without relying on leftover local database state
- no runtime fallback behavior was added to frontend page resolution
