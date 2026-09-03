# Playwright Readiness Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Playwright detect app startup from an always-live route so e2e tests can seed homepage CMS state after server readiness instead of deadlocking on `/`.

**Architecture:** Keep homepage routing owned by `PageSettings.homepage`, preserve the seeded homepage helper for frontend assertions, and change only Playwright’s `webServer.url` to a route that is live before content seeding. This separates server startup readiness from homepage content readiness and keeps runtime behavior unchanged.

**Tech Stack:** Playwright, Next.js App Router, Payload CMS 3, TypeScript

## Global Constraints

- Keep `/` owned by `PageSettings.homepage`
- Do not add runtime fallback behavior for `/`
- Preserve homepage seeding in the frontend e2e suite
- Change only Playwright startup readiness behavior, not public routing
- If additional e2e failures appear after readiness is fixed, report them as separate issues

---

### Task 1: Point Playwright Readiness At An Always-Live Route

**Files:**
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/frontend.e2e.spec.ts`
- Modify: `tests/helpers/seedHomepage.ts`
- Modify: `tests/helpers/seedUser.ts`

**Interfaces:**
- Consumes: `webServer.command = 'pnpm dev'`, existing frontend homepage seed helper, existing admin route availability
- Produces: Playwright readiness on `/admin`, seeded homepage frontend assertions on `/`

- [ ] Confirm the current failure mode is `config.webServer` timing out while waiting for `/` before the frontend `beforeAll` seed logic runs.
- [ ] Update `playwright.config.ts` so `webServer.url` targets `http://localhost:3000/admin`.
- [ ] Keep the homepage seed helper and frontend test setup in place so the actual homepage assertion still uses seeded CMS state.
- [ ] Re-run `pnpm test:e2e`
Expected: Playwright gets past startup readiness and reaches test execution instead of timing out on homepage availability.
- [ ] Commit the readiness-route slice.

### Task 2: Verify Full Test Behavior And Capture Any Follow-Up

**Files:**
- Modify: no source changes expected
- Test: `playwright.config.ts`, `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Consumes: readiness on `/admin`, seeded homepage setup for frontend tests
- Produces: verified separation of startup health from homepage content readiness, plus any newly exposed e2e/application failures

- [ ] Run `pnpm test:e2e`
Expected: the suite no longer blocks on homepage readiness before setup runs.

- [ ] Run `pnpm test`
Expected: the prior `config.webServer` timeout on `/` is gone. If another failure appears, capture it exactly as the next issue instead of broadening this patch silently.

- [ ] Commit the verification slice if no further code changes are needed; otherwise stop and report the newly exposed failure.
