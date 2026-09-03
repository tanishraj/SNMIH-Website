# pnpm Startup Contract Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo self-contained for pnpm startup so `pnpm dev`, Playwright web server boot, and `pnpm test` no longer fail because `.pnpmfile.mjs` is missing.

**Architecture:** Add a root no-op `.pnpmfile.mjs` as a long-term compatibility file and verify the existing scripts work without changing runtime commands. Keep the patch narrow so any later e2e or app failures are surfaced separately instead of folded into the package-manager fix.

**Tech Stack:** pnpm, Next.js, Playwright, TypeScript

## Global Constraints

- Commit a no-op root `.pnpmfile.mjs`
- Do not mutate dependencies, peer rules, or install behavior
- Do not change `package.json` scripts, Playwright `webServer.command`, runtime providers, or application startup logic in this patch
- Prove `pnpm dev`, `pnpm test:e2e`, and `pnpm test` no longer fail because `.pnpmfile.mjs` is missing
- If a different failure appears after startup succeeds, report it as a separate issue

---

### Task 1: Restore The Repo-Level pnpm Contract

**Files:**
- Create: `.pnpmfile.mjs`
- Test: `playwright.config.ts`

**Interfaces:**
- Consumes: Playwright `webServer.command = 'pnpm dev'`, package scripts in `package.json`
- Produces: root `.pnpmfile.mjs` that pnpm can load safely during `pnpm dev` and Playwright startup

- [ ] Add a failing verification step by running `pnpm dev` and confirming the current error references missing `.pnpmfile.mjs`.
- [ ] Create `.pnpmfile.mjs` with a no-op export only, for example:

```js
export default {}
```

- [ ] Run `pnpm dev`
Expected: the command may continue to normal app startup or reveal a different app-level issue, but it must not fail with `Cannot find module ... .pnpmfile.mjs`.

- [ ] Commit the compatibility-file slice.

### Task 2: Verify The Existing Test Entry Points

**Files:**
- Modify: no source changes expected
- Test: `playwright.config.ts`

**Interfaces:**
- Consumes: root `.pnpmfile.mjs`, existing `pnpm dev`, `pnpm test:e2e`, and `pnpm test`
- Produces: proof that the prior startup failure is gone, plus a clear report if another e2e failure appears

- [ ] Run `pnpm test:e2e`
Expected: Playwright gets past `webServer` startup without the missing `.pnpmfile.mjs` error.

- [ ] Run `pnpm test`
Expected: the command no longer fails for the missing `.pnpmfile.mjs` reason. If a different e2e or application error appears, capture that exact failure as the next issue.

- [ ] Commit the verification slice if the only code change remains `.pnpmfile.mjs`; otherwise stop and write down the newly exposed failure before broadening scope.
