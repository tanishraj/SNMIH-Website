# Playwright SQLite Worker Serialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make local and CI Playwright runs use a single worker so the shared SQLite database is not locked by concurrent e2e setup.

**Architecture:** Keep the fix narrow and local to Playwright configuration. Do not change Payload runtime, the homepage seeding helper, or database provider behavior; only force one browser worker so existing admin and frontend setup flows stop contending for SQLite.

**Tech Stack:** Playwright, Next.js, Payload CMS, SQLite, pnpm

## Global Constraints

- Set Playwright `workers` to `1` unconditionally.
- Keep the existing readiness route at `http://localhost:3000/admin`.
- Do not add per-worker databases, provider switches, or broader suite restructuring.
- Verification must prove the prior `SQLITE_BUSY` startup failure is removed or replaced by a separate issue.

---

### Task 1: Serialize Playwright Workers

**Files:**
- Modify: `playwright.config.ts`
- Test: `playwright.config.ts`

**Interfaces:**
- Consumes: existing `defineConfig({ ... })` export in `playwright.config.ts`
- Produces: `workers: 1` in Playwright config for all environments

- [ ] **Step 1: Write the failing test**

```ts
// No dedicated automated test is added for this config-only change.
// The failure is already present in runtime verification:
// `pnpm test:e2e` fails with `SQLITE_BUSY: database is locked`
// while multiple Playwright workers hit the shared SQLite database.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test:e2e`
Expected: FAIL with `SQLITE_BUSY: database is locked` during e2e setup when admin and frontend flows overlap.

- [ ] **Step 3: Write minimal implementation**

```ts
export default defineConfig({
  // ...
  workers: 1,
  // ...
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test:e2e`
Expected: Playwright starts with one worker and gets past the prior `SQLITE_BUSY` failure.

Run: `pnpm test`
Expected: The full test command gets past this specific concurrency issue.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts docs/superpowers/plans/2026-07-09-playwright-sqlite-worker-serialization.md
git commit -m "test: serialize playwright sqlite workers"
```
