# pnpm Startup Contract Fix Design

## Summary

This spec fixes a starter reliability gap in the test and local-development path.

The current failure is not a Payload or Playwright application bug. The failure happens because repo workflows such as:

- `pnpm dev`
- Playwright `webServer.command`
- `pnpm test`

can hit a pnpm contract that expects a root `.pnpmfile.mjs`, but the repository does not currently include that file.

The goal of this work is to make the repository self-contained again so a fresh clone can run the expected package-manager entrypoints without depending on missing local state.

## Why This Direction

Three approaches were considered.

### 1. Recommended: commit a no-op root `.pnpmfile.mjs`

Add the file that pnpm may attempt to load and keep it intentionally inert.

This fixes the repo-level contract directly and keeps the starter stable for:

- local development
- Playwright startup
- clone-to-test verification

### 2. Bypass pnpm only inside Playwright

Change Playwright to start Next.js directly instead of using `pnpm dev`.

This would unblock one test path, but it would leave the broader repository contract unresolved. A fresh clone could still fail when someone runs `pnpm dev` manually.

### 3. Remove the expectation indirectly

Try to change pnpm behavior or workspace configuration so no `pnpmfile` lookup occurs.

This is riskier and less explicit. It depends on understanding every environment-specific reason pnpm may be attempting that lookup.

### Decision

Commit a no-op root `.pnpmfile.mjs`.

## Product Contract

After this work:

- the repository includes the root `.pnpmfile.mjs` that pnpm may attempt to load
- the file is safe to keep long-term
- the file does not mutate dependencies, peer rules, or install behavior
- `pnpm dev` no longer fails because `.pnpmfile.mjs` is missing
- Playwright can get past `webServer` startup for this specific failure
- `pnpm test` no longer fails for this reason

If additional e2e or application failures appear after startup succeeds, those should be treated as separate issues.

## Architecture

### Repo-Level Compatibility File

The fix should add:

- `.pnpmfile.mjs`

at the repository root.

The file should act only as a compatibility placeholder that satisfies pnpm's file lookup when the toolchain expects the file to exist.

### No-Op Behavior

The committed `.pnpmfile.mjs` should be intentionally inert.

It should not:

- rewrite dependencies
- patch manifests
- alter peer dependency behavior
- inject install-time logic
- encode environment-specific assumptions

This keeps the fix low-risk and avoids turning a reliability patch into package-manager customization.

### Keep Existing Commands

This patch should not change:

- `package.json` scripts
- Playwright `webServer.command`
- runtime providers
- application startup logic

Those paths should remain unchanged unless verification reveals a second, unrelated failure after the missing-file issue is resolved.

## Verification Strategy

Validation should run in this order:

1. confirm `pnpm dev` does not fail with the missing `.pnpmfile.mjs` error
2. confirm `pnpm test:e2e` gets past Playwright `webServer` startup
3. confirm `pnpm test` no longer fails for this startup reason

This sequence matters because the goal is to prove the package-manager contract is fixed before evaluating higher-level application or browser-test behavior.

## Error Handling

This patch should not hide later failures.

Rules:

- if the missing-file error is resolved and a new failure appears, report that failure directly
- do not broaden this patch silently into unrelated Playwright, Next.js, or app-logic changes
- do not introduce compatibility code beyond the minimal no-op `pnpmfile`

The objective is a narrow, auditable repair to the starter contract.

## Non-Goals

This work does not include:

- changing deployment architecture
- changing the package manager
- rewriting Playwright flows
- changing app runtime behavior
- broader pnpm configuration experiments

## Testing

Verification for this work should prove:

- the repo remains clone-safe for pnpm entrypoints
- `pnpm dev` starts without the missing-file error
- `pnpm test:e2e` can launch the configured web server
- `pnpm test` no longer fails because the repository lacks `.pnpmfile.mjs`

If browser tests still fail after startup, that outcome should be recorded as a separate application or e2e issue rather than treated as part of this package-manager contract fix.
