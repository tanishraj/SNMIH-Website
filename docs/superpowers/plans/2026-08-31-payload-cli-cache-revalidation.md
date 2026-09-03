# Payload CLI Cache Revalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make legal-page provisioning safe in the standalone Payload migration CLI, then complete and verify the restored local database migrations, including Department Profiles nesting.

**Architecture:** A typed request-context key lets the trusted legal-page migration suppress only the Page cache side effect that requires a live Next.js request store. Normal Page writes preserve their existing tag invalidation, while the official Payload runner remains responsible for migration ordering and ledger records.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, TypeScript 5.7, Vitest 4, MongoDB 8.0.29, pnpm.

## Global Constraints

- Do not commit any changes.
- Run migrations only against `mongodb://127.0.0.1:27017/payload-cms-starter-kit`.
- Do not insert migration ledger entries or rewrite records manually.
- Preserve normal Admin, API, and application cache invalidation behavior.
- Preserve all 1,285 Department Profile entries across current documents and historical versions.

---

### Task 1: Add an explicit Page cache-revalidation bypass

**Files:**
- Modify: `tests/int/cache-revalidation.int.spec.ts:11-49`
- Modify: `src/hooks/revalidateCmsContent.ts:25-54`

**Interfaces:**
- Produces: `SKIP_CACHE_REVALIDATION_CONTEXT`, whose value is the literal `skipCacheRevalidation`.
- Produces: `revalidatePagesCache` behavior that returns `doc` without calling `revalidateTag` only when `context.skipCacheRevalidation === true`.
- Preserves: all existing Page publication and takedown invalidation behavior when the flag is absent or not exactly `true`.

- [ ] **Step 1: Write the failing cache-hook test**

Import the context key, allow the helper to accept context, and add the migration-style bypass assertion:

```ts
import {
  CMS_CACHE_TAGS,
  SKIP_CACHE_REVALIDATION_CONTEXT,
  revalidateArticlesCache,
  // existing imports remain
} from '@/hooks/revalidateCmsContent'

const afterChange = (
  hook: (...args: never[]) => unknown,
  current: string,
  previous: string,
  context: Record<string, unknown> = {},
) =>
  hook({
    context,
    doc: { _status: current },
    previousDoc: { _status: previous },
  } as never)

it('skips Page cache invalidation for explicitly marked maintenance writes', () => {
  afterChange(revalidatePagesCache as never, 'published', 'draft', {
    [SKIP_CACHE_REVALIDATION_CONTEXT]: true,
  })

  expect(mocks.revalidateTag).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cache-revalidation.int.spec.ts
```

Expected: failure because `SKIP_CACHE_REVALIDATION_CONTEXT` is not exported or the hook still calls `revalidateTag`.

- [ ] **Step 3: Implement the minimal hook behavior**

Add the shared key and guard only the Page after-change hook:

```ts
export const SKIP_CACHE_REVALIDATION_CONTEXT = 'skipCacheRevalidation' as const

export const revalidatePagesCache: CollectionAfterChangeHook = ({ context, doc, previousDoc }) => {
  if (context?.[SKIP_CACHE_REVALIDATION_CONTEXT] === true) return doc

  if (isOrWasPublished(doc, previousDoc)) {
    revalidateTags(CMS_CACHE_TAGS.pages, CMS_CACHE_TAGS.sitemap)
  }

  return doc
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cache-revalidation.int.spec.ts
```

Expected: the full cache-revalidation test file passes, including normal publication and takedown cases.

### Task 2: Mark legal-page creation as a maintenance write

**Files:**
- Modify: `tests/int/legal-pages-migration.int.spec.ts:4-6,98-137`
- Modify: `src/migrations/20260831_000000_provision_legal_pages.ts:4-5,323-333`

**Interfaces:**
- Consumes: `SKIP_CACHE_REVALIDATION_CONTEXT` from `src/hooks/revalidateCmsContent.ts`.
- Preserves: `LEGAL_PAGES_MIGRATION_CONTEXT` for editorial-workflow provisioning.
- Produces: Page create calls containing both maintenance context values.

- [ ] **Step 1: Tighten the legal migration contract test**

Import the shared key and update the exact context expectation:

```ts
import { SKIP_CACHE_REVALIDATION_CONTEXT } from '@/hooks/revalidateCmsContent'

expect(create).toHaveBeenNthCalledWith(
  callIndex,
  expect.objectContaining({
    collection: 'pages',
    context: {
      [SKIP_CACHE_REVALIDATION_CONTEXT]: true,
      systemProvisioning: 'legal-pages-migration',
    },
    // existing expectations remain
  }),
)
```

- [ ] **Step 2: Run the legal migration test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/legal-pages-migration.int.spec.ts
```

Expected: the create-call assertion fails because `skipCacheRevalidation` is absent.

- [ ] **Step 3: Pass the context flag from the migration**

Import the key and add it to the existing Payload create context:

```ts
import { LEGAL_PAGES_MIGRATION_CONTEXT } from '@/hooks/enforceEditorialWorkflow'
import { SKIP_CACHE_REVALIDATION_CONTEXT } from '@/hooks/revalidateCmsContent'

context: {
  [SKIP_CACHE_REVALIDATION_CONTEXT]: true,
  systemProvisioning: LEGAL_PAGES_MIGRATION_CONTEXT,
},
```

- [ ] **Step 4: Run the focused migration and cache tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cache-revalidation.int.spec.ts tests/int/legal-pages-migration.int.spec.ts tests/int/department-profiles-migration.int.spec.ts
```

Expected: all focused tests pass.

### Task 3: Document and validate the maintenance contract

**Files:**
- Modify: `.agents/skills/project-context/references/architecture.md` in `Caching and Delivery Safety`
- Potentially modify through generator: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Documents: trusted CLI migrations may explicitly suppress cache revalidation because no live Next.js cache store exists.
- Preserves: ordinary runtime writes always invalidate their existing tags.

- [ ] **Step 1: Add the focused architecture sentence**

Append this contract to the caching section:

```md
Trusted CLI migrations that create Pages mark their writes to skip Next.js cache revalidation,
because the standalone Payload process has no live Next.js cache store; ordinary runtime writes
retain the complete invalidation behavior above.
```

- [ ] **Step 2: Run code and generated-artifact validation**

Run:

```bash
pnpm generate:types
pnpm exec tsc --noEmit
pnpm lint
```

Expected: each command exits successfully. Generated Payload types should remain unchanged because the schema did not change.

### Task 4: Resume the official local Payload migrations

**Files:**
- Data mutation only: local MongoDB database `payload-cms-starter-kit`

**Interfaces:**
- Consumes: the local `.env` `MONGODB_URI` and registered migrations from `src/migrations/index.ts`.
- Produces: canonical Payload migration ledger entries and nested Department Profiles data.

- [ ] **Step 1: Reconfirm the local database target without exposing credentials**

Run:

```bash
if rg -q '^MONGODB_URI=mongodb://(127\.0\.0\.1|localhost):27017/payload-cms-starter-kit([?].*)?$' .env; then
  echo 'ENV_DATABASE_TARGET=verified-local-docker'
else
  echo 'ENV_DATABASE_TARGET=not-exact-local-match'
fi
```

Expected: `ENV_DATABASE_TARGET=verified-local-docker`.

- [ ] **Step 2: Resume migrations with the Payload runner**

Run:

```bash
pnpm payload migrate
```

Expected: Payload skips the recorded theme migration, completes `20260831_000000_provision_legal_pages`, then completes `20260831_010000_nest_department_profiles` without a Next.js static-generation-store error.

- [ ] **Step 3: Audit the migration result read-only**

Use `mongosh` against `mongodb://127.0.0.1:27017/payload-cms-starter-kit` to aggregate the migration ledger, legal-page slugs, and Department Profiles states across Pages, Page versions, Reusable Sections and versions, and the News/Event detail global and versions.

Expected:

```text
migrations=3
legalPages=2
departmentProfileBlocks=78
legacyFlatBlocks=0
mixedBlocks=0
nestedBlocks=78
allProfileEntries=1285
currentPageProfileEntries=80
```

### Task 5: Complete repository verification and handoff

**Files:**
- Potentially modify through generator: `.agents/skills/project-context/references/project-inventory.json`
- Inspect: every task file and all pre-existing working-tree changes

**Interfaces:**
- Produces: checked project context, passing affected tests, and an uncommitted handoff.

- [ ] **Step 1: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit successfully. Retain any legitimate generated inventory update.

- [ ] **Step 2: Run the final affected test set**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/cache-revalidation.int.spec.ts tests/int/legal-pages-migration.int.spec.ts tests/int/department-profiles-migration.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 3: Inspect the final working tree**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; the intended hook, migration, tests, architecture reference, design, plan, and any valid generated inventory update remain uncommitted alongside the user's pre-existing branch changes.

- [ ] **Step 4: Report the completed migration**

Report the exact migration ledger, legal-page count, Department Profiles state and profile totals, focused test results, project-context result, and all files changed for this fix. Explicitly state that no commit was created.
