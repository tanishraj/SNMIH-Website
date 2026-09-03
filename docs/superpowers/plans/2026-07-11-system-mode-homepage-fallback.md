# System Mode Homepage Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the homepage from falling into `404` for bypass-eligible admins when `Website Modes` is active but the configured front page is missing or unpublished.

**Architecture:** Keep the existing `bypassForLoggedInAdmins` behavior intact for normal browsing, but add a homepage-specific fallback resolution path in the shared frontend page-data layer. When `/` is bypassed and has no usable published homepage, reuse the active system mode instead of returning a `404`-shaped result.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 app router, TypeScript, Vitest

## Global Constraints

- Do not change the meaning of `bypassForLoggedInAdmins`.
- Do not remove admin bypass support.
- Keep the fix limited to the homepage resolution path and shared metadata helpers.
- Preserve existing non-homepage routing behavior.
- Cover the regression with focused integration tests before implementation is considered complete.

---

### Task 1: Add Homepage Fallback For Bypassed System Modes

**Files:**
- Modify: `tests/int/page-routing.int.spec.ts`
- Modify: `src/app/(frontend)/pageData.ts`

**Interfaces:**
- Consumes:
  - `getSystemPageRenderState(pathname: string): Promise<{ mode: 'comingSoon' | 'maintenance' | null; page: SystemPage | null }>`
  - `getHomepagePage(): Promise<Page | null>`
  - `getHomepageMetadata(): Promise<Metadata>`
- Produces:
  - `getHomepageRenderState(): Promise<{ mode: 'comingSoon' | 'maintenance' | null; page: SystemPage | null }>`
  - updated homepage metadata behavior that resolves `Maintenance` or `Coming Soon` when admin bypass is active but no published homepage exists

- [ ] **Step 1: Write the failing test**

```ts
it('falls back to the active system mode for bypassed admins when the homepage is unavailable', async () => {
  payloadMocks.findGlobal.mockImplementation(async ({ slug }) => {
    if (slug === 'page-settings') {
      return { homepage: 42 }
    }

    if (slug === 'system-mode-settings') {
      return {
        bypassForLoggedInAdmins: true,
        comingSoonPage: null,
        maintenancePage: null,
        notFoundPage: null,
        siteMode: 'maintenance',
      }
    }

    return {
      defaultDescription: 'Global fallback description',
      defaultImage: null,
      defaultTitle: 'Global fallback title',
      robots: 'index,follow',
    }
  })

  payloadMocks.auth.mockResolvedValue({
    user: {
      role: 'admin',
    },
  })

  payloadMocks.find.mockResolvedValue({
    docs: [],
  })

  const { getHomepageMetadata, getHomepageRenderState } = await loadPageData()

  await expect(getHomepageRenderState()).resolves.toEqual({
    mode: 'maintenance',
    page: null,
  })

  await expect(getHomepageMetadata()).resolves.toMatchObject({
    title: 'Maintenance',
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-routing.int.spec.ts
```

Expected: FAIL because homepage resolution currently bypasses maintenance for admins and then falls through to homepage/404 metadata.

- [ ] **Step 3: Implement the minimal homepage fallback**

```ts
const getResolvedSystemPageRenderState = async ({
  ignoreBypass = false,
}: {
  ignoreBypass?: boolean
} = {}): Promise<{
  mode: 'comingSoon' | 'maintenance' | null
  page: SystemPage | null
}> => {
  const systemBehavior = await getSystemBehaviorPages()

  if (
    !ignoreBypass &&
    systemBehavior.bypassForLoggedInAdmins &&
    (await canCurrentRequestBypassSystemModes())
  ) {
    return { mode: null, page: null }
  }

  if (systemBehavior.siteMode === 'maintenance') {
    return { mode: 'maintenance', page: systemBehavior.maintenancePage }
  }

  if (systemBehavior.siteMode === 'comingSoon') {
    return { mode: 'comingSoon', page: systemBehavior.comingSoonPage }
  }

  return { mode: null, page: null }
}

export async function getHomepageRenderState() {
  const renderState = await getResolvedSystemPageRenderState()

  if (renderState.page || renderState.mode) {
    return renderState
  }

  if (await getHomepagePage()) {
    return { mode: null, page: null }
  }

  return getResolvedSystemPageRenderState({ ignoreBypass: true })
}
```

Update homepage consumers to use `getHomepageRenderState()` instead of duplicating `getSystemPageRenderState('/')`.

- [ ] **Step 4: Run focused tests to verify they pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-routing.int.spec.ts tests/int/page-settings-system-mode.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit the fix**

```bash
git add tests/int/page-routing.int.spec.ts src/app/\(frontend\)/pageData.ts src/app/\(frontend\)/page.tsx docs/superpowers/plans/2026-07-11-system-mode-homepage-fallback.md
git commit -m "fix(frontend): preserve maintenance fallback on home"
```
