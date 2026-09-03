# Playwright Readiness Route Design

## Summary

This spec fixes the remaining e2e startup gap after the pnpm contract repair and homepage seeding design.

The current issue is structural:

- the frontend homepage `/` is correctly owned by `PageSettings.homepage`
- the homepage should be seeded by the e2e layer, not by runtime fallback behavior
- Playwright `webServer` waits for its configured readiness URL before any test `beforeAll` runs

That means a readiness check against `/` can never succeed on a fresh or cleaned database if homepage content is only created during test setup.

The goal of this work is to separate server readiness from homepage content readiness so the starter can keep its real CMS ownership model and still run clone-safe e2e verification.

## Why This Direction

Three approaches were considered.

### 1. Recommended: point Playwright `webServer.url` at an always-live route such as `/admin`

Let Playwright verify that the Next/Payload app is running by waiting on a route that does not depend on seeded homepage content.

This keeps startup health checks and seeded content prerequisites separate.

### 2. Keep readiness on `/` and move homepage seeding earlier

Try to seed homepage content in a Playwright hook such as `globalSetup`.

This does not solve the problem because Playwright starts `webServer` before test-level setup can make `/` resolve through CMS state in the intended way.

### 3. Add runtime fallback behavior for `/`

Make the frontend treat `/` as healthy even when `PageSettings.homepage` is empty.

This weakens the CMS contract and turns a testing problem into runtime behavior.

### Decision

Point Playwright `webServer.url` at an always-live route and keep homepage seeding for the frontend spec itself.

## Product Contract

After this work:

- Playwright determines server readiness from a route that is expected to be alive before seeded content exists
- homepage ownership remains with `PageSettings.homepage`
- homepage seeding still happens in e2e setup for frontend assertions
- `/` remains a real CMS-driven homepage path, not a runtime fallback path
- `pnpm test:e2e` no longer blocks on homepage readiness before setup can seed content

## Architecture

### Separate Startup Health From Content Readiness

There are two different readiness concerns:

- application startup readiness
- seeded homepage content readiness

They should not use the same URL.

The application startup probe should target a route that comes up as part of normal server boot, independent of whether marketing content has been seeded.

### Use An Always-Live Payload Route

The recommended readiness target is:

- `/admin`

This route is appropriate because:

- it is part of the starter's real app surface
- it does not depend on seeded homepage content
- it is already used by the admin e2e flow

This is a testing-infrastructure choice, not a change to public routing.

### Preserve Homepage Seeding

The frontend e2e suite should still:

- seed a published homepage page
- assign `PageSettings.homepage`
- clean up the seeded homepage state after the suite

The readiness route change does not replace the homepage seed helper. It only removes the startup deadlock.

## Verification Strategy

Validation should prove:

1. Playwright `webServer` reaches readiness without depending on `/`
2. the frontend suite can then seed homepage content explicitly
3. `/` resolves during the frontend test after seeding
4. `pnpm test:e2e` no longer times out waiting for homepage readiness before setup runs

If additional frontend or browser-test failures appear after startup succeeds, those should be treated as separate issues.

## Error Handling

This patch should remain narrow.

Rules:

- do not broaden this into homepage runtime fallback logic
- do not broaden it into a global test bootstrap redesign
- do not change the public homepage ownership model

The only infrastructure change should be which route Playwright waits on to declare the app ready.

## Non-Goals

This work does not include:

- redesigning homepage routing
- changing `PageSettings.homepage` ownership
- shipping default published homepage content as runtime starter state
- rewriting the admin e2e suite
- introducing broad Playwright environment orchestration

## Testing

Verification for this work should prove:

- Playwright `webServer` can start reliably on fresh or cleaned databases
- homepage tests still rely on declared seeded content, not leftover database state
- `/admin` readiness does not change public routing behavior
- no runtime fallback behavior was added for `/`
