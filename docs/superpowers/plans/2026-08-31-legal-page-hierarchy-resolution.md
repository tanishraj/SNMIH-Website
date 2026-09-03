# Legal Page Hierarchy Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve Site Settings legal Page links through every Payload parent relationship before rendering the consent banner and global footer.

**Architecture:** A focused server-only helper accepts the two Site Settings Page relationships and a narrow Payload `findByID` client. It resolves both URLs through `getPageHrefFromSourceWithResolver`, caches shared parent lookups, and returns nullable strings that flow through the frontend shell and footer renderers without any presentation component querying Payload.

**Tech Stack:** TypeScript 5.7, Next.js 16 App Router, Payload CMS 3.85 Local API, React 19, Vitest 4.

## Global Constraints

- Scope is limited to Privacy Policy and Terms and Conditions links in the public frontend shell.
- Redirects and unrelated `getPageHref` consumers remain unchanged.
- Missing, unpopulated, malformed, or unresolvable Page relationships produce `null` and omit the automatic link.
- No schema change, migration, generated Payload type change, dependency change, or commit.
- Keep the working tree uncommitted.

---

### Task 1: Resolve legal Page URLs at the Payload boundary

**Files:**
- Create: `src/lib/legalPagePaths.ts`
- Create: `tests/int/legal-page-paths.int.spec.ts`

**Interfaces:**
- Consumes: `getPageHrefFromSourceWithResolver(page, resolver)` from `src/lib/pagePaths.ts` and `Payload.findByID`.
- Produces: `resolveLegalPageHrefs(siteSettings, payload): Promise<{ privacyPolicyUrl: string | null; termsAndConditionsUrl: string | null }>`.

- [ ] **Step 1: Write failing resolver tests**

Add tests that pass a top-level Page, an ID-backed two-level parent chain, a shared parent used by both legal Pages, an unpopulated selected relationship, and a rejected parent lookup. Assert complete URLs, `null` fallbacks, and one cached `findByID` call per shared parent ID.

```ts
const result = await resolveLegalPageHrefs(
  {
    privacyPolicyPage: { id: 'privacy', parent: 'legal', slug: 'privacy-policy' } as never,
    termsAndConditionsPage: { id: 'terms', parent: 'legal', slug: 'terms-and-conditions' } as never,
  },
  { findByID } as never,
)

expect(result).toEqual({
  privacyPolicyUrl: '/company/legal/privacy-policy',
  termsAndConditionsUrl: '/company/legal/terms-and-conditions',
})
expect(findByID).toHaveBeenCalledTimes(2)
```

- [ ] **Step 2: Run the resolver tests and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/legal-page-paths.int.spec.ts
```

Expected: FAIL because `@/lib/legalPagePaths` does not exist.

- [ ] **Step 3: Implement the server-only resolver**

Create `src/lib/legalPagePaths.ts` with a parent cache shared by both legal Page resolutions. Each lookup selects only `parent` and `slug`, uses `depth: 0`, and converts lookup failures to `null`.

```ts
import 'server-only'

import type { Payload } from 'payload'

import { getPageHrefFromSourceWithResolver, isPageDoc } from '@/lib/pagePaths'
import type { Page, SiteSetting } from '@/payload-types'

type PageParent = Pick<Page, 'parent' | 'slug'>
type LegalPageHrefs = {
  privacyPolicyUrl: string | null
  termsAndConditionsUrl: string | null
}

export async function resolveLegalPageHrefs(
  siteSettings: Pick<SiteSetting, 'privacyPolicyPage' | 'termsAndConditionsPage'>,
  payload: Pick<Payload, 'findByID'>,
): Promise<LegalPageHrefs> {
  const parentCache = new Map<string, Promise<PageParent | null>>()
  const resolveParent = (id: string | number): Promise<PageParent | null> => {
    const key = String(id)
    const cached = parentCache.get(key)
    if (cached) return cached

    const lookup = payload
      .findByID({
        collection: 'pages',
        id,
        depth: 0,
        select: { parent: true, slug: true },
      })
      .then(({ parent, slug }) => ({ parent, slug }))
      .catch(() => null)
    parentCache.set(key, lookup)
    return lookup
  }
  const resolvePage = (page: SiteSetting['privacyPolicyPage']) =>
    isPageDoc(page) ? getPageHrefFromSourceWithResolver(page, resolveParent) : null

  const [privacyPolicyUrl, termsAndConditionsUrl] = await Promise.all([
    resolvePage(siteSettings.privacyPolicyPage),
    resolvePage(siteSettings.termsAndConditionsPage),
  ])

  return { privacyPolicyUrl, termsAndConditionsUrl }
}
```

- [ ] **Step 4: Run the resolver tests**

Run the command from Step 2.

Expected: PASS for top-level, nested, shared-parent, and failure-safe cases.

---

### Task 2: Carry resolved URLs through the frontend shell and footers

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/components/global/GlobalFooter.tsx`
- Modify: `src/blocks/renderFooterBlocks.tsx`
- Modify: `src/blocks/Footer56/Component.tsx`
- Modify: `src/blocks/FooterMinimal/Component.tsx`
- Modify: `tests/int/global-footer.int.spec.ts`
- Modify: `tests/int/footer56-presentation.int.spec.tsx`
- Modify: `tests/int/footer-minimal.int.spec.tsx`

**Interfaces:**
- Consumes: `resolveLegalPageHrefs(siteSettings, payload)` from Task 1.
- Produces: `privacyPolicyUrl?: string | null` and `termsAndConditionsUrl?: string | null` presentation props through every footer layer.

- [ ] **Step 1: Change footer tests to require resolved URL props**

Replace Page-object legal props with complete URL props and assert nested paths survive rendering and duplicate suppression.

```tsx
<FooterMinimalBlockComponent
  privacyPolicyUrl="/legal/privacy-policy"
  termsAndConditionsUrl="/legal/terms-and-conditions"
/>
```

Update the global-footer wiring contract to require `resolveLegalPageHrefs`, loader-returned URLs, and URL props instead of `getPageHref(privacyPolicyPage)`.

- [ ] **Step 2: Run focused footer tests and confirm type/assertion failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts tests/int/footer56-presentation.int.spec.tsx tests/int/footer-minimal.int.spec.tsx
```

Expected: FAIL because the components do not yet accept the URL props.

- [ ] **Step 3: Resolve URLs in the cached frontend loader**

Import `resolveLegalPageHrefs`, call it after Site Settings loads, include both URLs in the object returned by `_getFrontendGlobals`, and consume them in `RootLayout`.

```ts
const { privacyPolicyUrl, termsAndConditionsUrl } = await resolveLegalPageHrefs(
  siteSettings,
  payload,
)

return stripInternalMediaFields({
  activeFooter,
  activeHeader,
  analyticsSettings,
  cookieConsentSettings,
  pageSettings,
  privacyPolicyUrl,
  seoSettings,
  siteSettings,
  termsAndConditionsUrl,
  themeSettings,
})
```

Pass `privacyPolicyUrl` to `CookieConsentBanner` and both URL values to `GlobalFooter`.

- [ ] **Step 4: Make footer presentation URL-only**

Rename legal Page props to URL props through `GlobalFooter`, `renderFooterBlocks`, Footer56, and FooterMinimal. Remove their `Page` and `getPageHref` imports. Preserve fixed labels and URL-based duplicate suppression.

```ts
const legalPageLinks = (
  [
    [termsAndConditionsUrl, 'Terms & Conditions'],
    [privacyPolicyUrl, 'Privacy Policy'],
  ] as const
).flatMap(([href, label]) => {
  if (!href || linkedHrefs.has(href)) return []
  linkedHrefs.add(href)
  return [{ href, label, newTab: false }]
})
```

- [ ] **Step 5: Run focused resolver and footer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/legal-page-paths.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/footer56-presentation.int.spec.tsx tests/int/footer-minimal.int.spec.tsx
```

Expected: all focused files pass.

---

### Task 3: Complete repository verification

**Files:**
- Update if generated facts changed: `.agents/skills/project-context/references/project-inventory.json`
- Update if the checker requires it: `.agents/skills/project-context/references/architecture.md`

**Interfaces:**
- Consumes: completed runtime and test changes from Tasks 1 and 2.
- Produces: verified, uncommitted working tree ready for review.

- [ ] **Step 1: Run the project-context update loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit successfully; retain generated inventory changes only when facts changed.

- [ ] **Step 2: Run static verification**

```bash
pnpm exec tsc --noEmit
pnpm lint
git diff --check
```

Expected: all commands exit successfully without diagnostics.

- [ ] **Step 3: Run the complete integration suite**

```bash
pnpm test:int
```

Expected: every integration test passes.

- [ ] **Step 4: Run the production build under Node 22 LTS**

```bash
env PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin /opt/homebrew/bin/pnpm build
```

Expected: Next.js Turbopack completes the production build successfully.

- [ ] **Step 5: Inspect the final change impact**

Read `.agents/skills/project-context/references/change-impact-map.md`, inspect `git diff --check`, `git diff --stat`, and `git status --short`, and confirm there are no commits or unrelated source changes.
