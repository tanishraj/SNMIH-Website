# Homepage E2E Seeding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the frontend e2e suite seed its own published homepage so `/` resolves through `PageSettings.homepage` without relying on leftover database state.

**Architecture:** Add one dedicated Playwright helper that creates a real published page and assigns it to `page-settings.homepage` using authenticated Local API writes, then use that helper only in the frontend e2e suite. Keep runtime homepage routing unchanged and update the frontend expectation to assert against the deterministic seeded content rather than the old blank-template placeholder.

**Tech Stack:** Payload CMS 3, Next.js App Router, Playwright, TypeScript

## Global Constraints

- Keep `/` owned by `PageSettings.homepage`
- Do not add runtime fallback behavior for `/`
- Seed a dedicated published homepage in e2e setup and clean it up in teardown
- Keep admin e2e setup unchanged unless verification proves otherwise
- Use the existing page model and authenticated Local API writes for seed data

---

### Task 1: Add Homepage Seed Helper

**Files:**
- Create: `tests/helpers/seedHomepage.ts`
- Modify: `tests/helpers/seedUser.ts`

**Interfaces:**
- Consumes: `getPayload({ config })`, `testUser`, `payload.find`, `payload.create`, `payload.updateGlobal`, `payload.delete`
- Produces: `seedHomepage(): Promise<void>`, `cleanupHomepage(): Promise<void>`, `getTestUserDocument(): Promise<{ id: number | string; role: string; capabilities?: unknown }>`

- [ ] Add a failing e2e-path verification step by confirming the frontend suite currently depends on an unconfigured homepage.
- [ ] Add `getTestUserDocument()` to `tests/helpers/seedUser.ts` so other helpers can fetch the seeded admin user document.
- [ ] Create `tests/helpers/seedHomepage.ts` that:
  - removes any prior test homepage page by stable slug
  - fetches the seeded admin user document
  - creates a published `pages` document with deterministic fields:
    - `title`
    - `slug`
    - `metaTitle`
    - `metaDescription`
    - `workflowState: 'published'`
    - one minimal `hero36` block with stable heading text
  - updates `page-settings.homepage` to the created page ID using the same admin user context
  - exports cleanup that clears `page-settings.homepage` and deletes the seeded page
- [ ] Run the smallest helper-level verification available through the frontend suite path after wiring the helper.
- [ ] Commit the helper slice.

### Task 2: Use Homepage Seeding In Frontend E2E

**Files:**
- Modify: `tests/e2e/frontend.e2e.spec.ts`
- Test: `playwright.config.ts`

**Interfaces:**
- Consumes: `seedHomepage()`, `cleanupHomepage()`
- Produces: frontend e2e setup with declared homepage prerequisite and assertions against seeded content

- [ ] Update the frontend suite `beforeAll` to call `seedHomepage()` before opening the page.
- [ ] Add `afterAll` cleanup with `cleanupHomepage()`.
- [ ] Replace the stale blank-template expectation with assertions that match the seeded homepage content, including a stable `<h1>` heading rendered through the page block.
- [ ] Run `pnpm test:e2e`
Expected: Playwright gets past startup and the frontend homepage spec no longer depends on leftover DB state.
- [ ] Commit the frontend-suite slice.

### Task 3: Verify Full Behavior And Record Follow-Up Issues

**Files:**
- Modify: no source changes expected
- Test: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Consumes: seeded homepage helper and updated frontend e2e spec
- Produces: verified homepage routing through seeded `PageSettings.homepage` state and any newly exposed non-seeding failures

- [ ] Run `pnpm test:e2e`
Expected: the homepage route resolves from seeded CMS state and the frontend suite passes or exposes a different application/e2e issue.

- [ ] Run `pnpm test`
Expected: the prior homepage-routing failure is gone. If another failure appears, capture it as a separate next issue rather than broadening this patch silently.

- [ ] Commit the verification slice if no additional code changes are needed; otherwise stop and report the newly exposed issue.
