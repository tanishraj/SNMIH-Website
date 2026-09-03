# Release Gate Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the audited production release blockers while preserving the starter's one-client-per-deployment architecture.

**Architecture:** Keep capability helpers as the central access vocabulary, but distinguish public globals/non-versioned records from draft-enabled public collections. Make cache invalidation transition-aware, make preview Local API calls user-scoped, validate security-sensitive runtime values once, and restore every maintained registry/test/generated contract before CI becomes required.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript, Vitest, MongoDB Memory ReplSet, GitHub Actions, Docker.

## Global Constraints

- Preserve one client, one deployment, and one Payload dataset.
- Do not add tenants, tenant switching, a theme marketplace, or SaaS-builder infrastructure.
- Do not rewrite Git history in this plan.
- Do not create a cross-environment block registry that mixes server-only and client-capable imports.
- Use `user` with `overrideAccess: false` for Local API operations performed on behalf of an authenticated user.
- Pass `req` through nested Payload operations and preserve existing hook recursion guards.
- Run `pnpm generate:types` after schema changes.
- Complete the project-context update/check loop before handoff.

## File Structure

- `src/access/adminCapabilities.ts`: reusable public/published/capability and authenticated-field access policies.
- `src/collections/*.ts`: collection-specific selection of the correct public read policy and protected fields.
- `src/globals/SearchSettings.ts`: capability-governed, recoverable search configuration.
- `src/app/(frontend)/**/page.tsx`, `src/lib/contentEntries.ts`, `src/lib/newsEvents.ts`: user-scoped draft previews.
- `src/hooks/revalidateCmsContent.ts`: transition-aware cache tag helpers for change and delete operations.
- `src/config/runtime.ts`, `src/payload.config.ts`: validated Payload secret and explicit production GraphQL policy.
- `.gitignore`, `.dockerignore`, `docs/operations/*`: repository/build-context and operator safety contract.
- `src/globals/NewsEventsDetailTemplate.ts`, theme/Rich Text contracts: registration and baseline recovery.
- `tests/helpers/mongoMemoryServer.ts`, `.github/workflows/quality.yml`: replica-set-compatible test runtime and CI gate.

---

### Task 1: Enforce published-only anonymous collection reads

**Files:**
- Modify: `src/access/adminCapabilities.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/SystemPages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/collections/Headers.ts`
- Modify: `src/collections/Footers.ts`
- Modify: `src/collections/OfficeLocations.ts`
- Modify: `src/collections/NavigationLinks.ts`
- Modify: `src/collections/Redirects.ts`
- Modify: `src/collections/Forms.ts`
- Modify: `src/collections/Media.ts`
- Modify: `src/collections/GalleryAlbums.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`
- Create: `tests/int/public-content-access.int.spec.ts`

**Interfaces:**
- Consumes: existing `AdminCapability`, `hasAdminCapability`, and `allowPublishedReadOrCapability` workflow policy.
- Produces: `allowDraftPublishedReadOrCapability(capability): Access` and `authenticatedFieldReadAccess: FieldAccess`.

- [ ] **Step 1: Add failing helper tests**

Add these assertions to `tests/int/adminCapabilities.int.spec.ts` and import the two new exports:

```ts
it('limits anonymous draft-enabled reads to published documents', () => {
  const access = allowDraftPublishedReadOrCapability('manage_media')

  expect(access(toAccessReq(createReq(null)))).toEqual({
    _status: { equals: 'published' },
  })
  expect(
    access(
      toAccessReq(
        createReq({ capabilities: { manage_media: true }, role: 'contentManager' }),
      ),
    ),
  ).toBe(true)
})

it('keeps internal fields authenticated-only', () => {
  expect(authenticatedFieldReadAccess({ req: createReq(null) } as never)).toBe(false)
  expect(
    authenticatedFieldReadAccess({ req: createReq({ role: 'contentManager' }) } as never),
  ).toBe(true)
})
```

- [ ] **Step 2: Run the helper test and confirm the missing exports fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts`

Expected: FAIL because `allowDraftPublishedReadOrCapability` and `authenticatedFieldReadAccess` are not exported.

- [ ] **Step 3: Implement the two access primitives**

Add `FieldAccess` to the Payload type imports and add:

```ts
export const allowDraftPublishedReadOrCapability =
  (capability: AdminCapability | AdminCapability[]): Access =>
  ({ req }) => {
    const user = req.user as AdminUserLike | null | undefined

    if (
      toCapabilitiesArray(capability).some((currentCapability) =>
        hasAdminCapability(user, currentCapability),
      )
    ) {
      return true
    }

    return {
      _status: { equals: 'published' },
    }
  }

export const authenticatedFieldReadAccess: FieldAccess = ({ req }) => Boolean(req.user)
```

Do not change `allowPublicReadOrCapability`; public globals and non-versioned public records still rely on its boolean behavior. Keep `allowPublishedReadOrCapability` as the stricter `_status` plus `workflowState` policy.

- [ ] **Step 4: Select the correct policy in every draft-enabled public collection**

Use `allowPublishedReadOrCapability` for governed collections:

```ts
Pages: allowPublishedReadOrCapability('manage_pages')
Articles: allowPublishedReadOrCapability('manage_articles')
Reviews: allowPublishedReadOrCapability('manage_reviews')
SystemPages: allowPublishedReadOrCapability('manage_system_pages')
```

Use `allowDraftPublishedReadOrCapability` for `_status`-only collections:

```ts
ReusableSections: allowDraftPublishedReadOrCapability('manage_pages')
Headers: allowDraftPublishedReadOrCapability('manage_headers')
Footers: allowDraftPublishedReadOrCapability('manage_footers')
OfficeLocations: allowDraftPublishedReadOrCapability('manage_site_settings')
NavigationLinks: allowDraftPublishedReadOrCapability('manage_navigation')
Redirects: allowDraftPublishedReadOrCapability('manage_redirects')
Forms: allowDraftPublishedReadOrCapability('manage_forms')
Media: allowDraftPublishedReadOrCapability('manage_media')
GalleryAlbums: allowDraftPublishedReadOrCapability('manage_media')
```

Leave Categories, Tags, News Event Classifications, and public globals on `allowPublicReadOrCapability` because they do not use collection draft status in the same way.

- [ ] **Step 5: Protect internal Form and Media fields**

Apply this exact access shape to `Forms.internalNotes` and `Forms.notificationRecipients`:

```ts
access: {
  read: authenticatedFieldReadAccess,
},
```

Apply the same read access to Media fields `storageStatus`, `storageCheckedAt`, `storageMissingSince`, `storageIssue`, `title`, `assetType`, `tags`, `usageDetails`, and `usageSummary`. Keep public delivery fields such as `alt`, `url`, `filename`, `mimeType`, dimensions, and generated sizes readable.

- [ ] **Step 6: Add a schema-level collection policy regression test**

Create `tests/int/public-content-access.int.spec.ts` that finds each collection by slug, calls its `access.read`, and asserts the anonymous result:

```ts
import { describe, expect, it } from 'vitest'

import { Articles } from '@/collections/Articles'
import { Forms } from '@/collections/Forms'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'

const anonymousArgs = { req: { user: null } } as never

describe('public content access', () => {
  it('requires both publication states for governed editorial records', () => {
    expect(Pages.access?.read?.(anonymousArgs)).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { workflowState: { equals: 'published' } },
      ],
    })
    expect(Articles.access?.read?.(anonymousArgs)).toEqual(Pages.access?.read?.(anonymousArgs))
  })

  it('requires Payload publication for draft-only public records', () => {
    const expected = { _status: { equals: 'published' } }
    expect(Forms.access?.read?.(anonymousArgs)).toEqual(expected)
    expect(Media.access?.read?.(anonymousArgs)).toEqual(expected)
    expect(ReusableSections.access?.read?.(anonymousArgs)).toEqual(expected)
  })
})
```

Extend the file with a recursive named-field helper and assert that anonymous reads return `false` for every protected Form/Media field listed in Step 5.

- [ ] **Step 7: Run access tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts tests/int/public-content-access.int.spec.ts tests/int/forms-submission.int.spec.ts tests/int/media-governance.int.spec.ts`

Expected: PASS.

- [ ] **Step 8: Commit the access boundary**

```bash
git add src/access/adminCapabilities.ts src/collections tests/int/adminCapabilities.int.spec.ts tests/int/public-content-access.int.spec.ts
git commit -m "fix(access): protect draft content" -m "Anonymous REST and GraphQL reads must not expose drafts or internal operational fields."
```

---

### Task 2: Capability-scope previews and Search Settings

**Files:**
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Modify: `src/app/(frontend)/articles/[slug]/page.tsx`
- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Modify: `src/lib/contentEntries.ts`
- Modify: `src/lib/newsEvents.ts`
- Modify: `src/globals/SearchSettings.ts`
- Modify: `tests/int/news-events-metadata-routes.int.spec.ts`
- Create: `tests/int/preview-access.int.spec.ts`
- Create: `tests/int/search-settings-access.int.spec.ts`

**Interfaces:**
- Consumes: Payload-authenticated `user`, `requireCapability`, `allowPublicReadOrCapability`, and `hideFromUsersWithoutCapability`.
- Produces: `getArticlePreviewBySlug(slug, user)` and `getNewsEventPreviewBySlug(slug, user)`, both enforcing collection access.

- [ ] **Step 1: Add failing preview helper tests**

Create `tests/int/preview-access.int.spec.ts` with module mocks for `payload.find` and assert the Local API arguments:

```ts
expect(find).toHaveBeenCalledWith(
  expect.objectContaining({
    collection: 'articles',
    draft: true,
    overrideAccess: false,
    user,
  }),
)

expect(find).toHaveBeenCalledWith(
  expect.objectContaining({
    collection: 'news-events',
    draft: true,
    overrideAccess: false,
    user,
  }),
)
```

Use `{ id: 7, role: 'contentManager' } as User` as the authenticated test user and call each helper with `(slug, user)`.

- [ ] **Step 2: Run the preview test and confirm the signatures fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/preview-access.int.spec.ts`

Expected: FAIL because the helpers currently accept only `slug` and force `overrideAccess: true`.

- [ ] **Step 3: Enforce user-scoped Local API preview reads**

Change the helpers to:

```ts
export async function getArticlePreviewBySlug(slug: string, user: User): Promise<Article | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'articles',
    depth: 2,
    draft: true,
    limit: 1,
    overrideAccess: false,
    user,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
}
```

Apply the identical `user` and `overrideAccess: false` contract to `getNewsEventPreviewBySlug`. Import the generated `User` type in both modules.

- [ ] **Step 4: Pass authenticated users from all preview routes**

For Article and News/Event detail routes, call:

```ts
const draftArticle = await getArticlePreviewBySlug(slug, user as User)
const draftEntry = await getNewsEventPreviewBySlug(slug, user as User)
```

For Page preview, add these arguments to the `pages` draft `findByID`:

```ts
overrideAccess: false,
user,
```

Load `page-settings` without draft access for homepage identity:

```ts
payload.findGlobal({
  slug: 'page-settings',
  depth: 0,
  draft: false,
  overrideAccess: false,
})
```

Do not pass the authenticated editor to this published global lookup. It must exercise the global's
public-read branch; passing a Page-only editor would incorrectly require `manage_page_settings`.

- [ ] **Step 5: Govern Search Settings**

Update `SearchSettings` with:

```ts
admin: {
  group: 'Configuration',
  description: 'Suggested search terms displayed on the search page.',
  hidden: hideFromUsersWithoutCapability('manage_site_settings'),
},
access: {
  read: allowPublicReadOrCapability('manage_site_settings'),
  readVersions: requireCapability('manage_site_settings'),
  update: requireCapability('manage_site_settings'),
},
versions: {
  drafts: true,
},
```

- [ ] **Step 6: Add Search Settings access tests**

Create `tests/int/search-settings-access.int.spec.ts` and assert anonymous read is `true`, an editor without `manage_site_settings` cannot update/read versions, a site manager can, and `versions.drafts` is `true`.

- [ ] **Step 7: Update affected route mocks and run focused tests**

Update `tests/int/news-events-metadata-routes.int.spec.ts` to expect:

```ts
expect(mocks.getNewsEventPreviewBySlug).toHaveBeenCalledWith(
  'draft-example',
  expect.objectContaining({ id: expect.anything() }),
)
```

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/preview-access.int.spec.ts tests/int/search-settings-access.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts`

Expected: PASS.

- [ ] **Step 8: Regenerate Payload types and commit**

Run: `pnpm generate:types`

Expected: `src/payload-types.ts` reflects Search Settings versioning without TypeScript errors.

```bash
git add src/app src/lib/contentEntries.ts src/lib/newsEvents.ts src/globals/SearchSettings.ts src/payload-types.ts tests/int
git commit -m "fix(preview): enforce editor access" -m "Authenticated preview URLs must not bypass Payload capabilities."
```

---

### Task 3: Invalidate caches on every public-state transition

**Files:**
- Modify: `src/hooks/revalidateCmsContent.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/collections/Redirects.ts`
- Create: `tests/int/cache-revalidation.int.spec.ts`

**Interfaces:**
- Consumes: `CMS_CACHE_TAGS` and Next.js 16 `revalidateTag(tag, 'max')`.
- Produces: transition-aware after-change hooks and explicit after-delete hooks for each cached collection.

- [ ] **Step 1: Write the transition matrix as failing tests**

Mock `next/cache` and cover each hook with these cases:

```ts
it.each([
  ['published update', 'published', 'published', true],
  ['unpublish', 'draft', 'published', true],
  ['first publish', 'published', 'draft', true],
  ['draft-only update', 'draft', 'draft', false],
])('%s', (_label, current, previous, shouldInvalidate) => {
  revalidatePagesCache({
    doc: { _status: current },
    previousDoc: { _status: previous },
  } as never)

  expect(revalidateTag.mock.calls.length > 0).toBe(shouldInvalidate)
})
```

Add equivalent assertions for Article, Review, News/Event, and Redirect tags. Add one test per delete hook asserting its collection tag and sitemap tag where applicable.

- [ ] **Step 2: Run the cache tests and confirm unpublish/delete failures**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cache-revalidation.int.spec.ts`

Expected: FAIL for Page/Article/Review/Redirect unpublish and for missing delete-hook exports.

- [ ] **Step 3: Centralize the transition predicate and tag calls**

Add:

```ts
type PublishableDocument = { _status?: string | null }

const isOrWasPublished = (
  doc: PublishableDocument,
  previousDoc?: PublishableDocument | null,
): boolean => doc._status === 'published' || previousDoc?._status === 'published'

const revalidateTags = (...tags: Array<(typeof CMS_CACHE_TAGS)[keyof typeof CMS_CACHE_TAGS]>) => {
  for (const tag of tags) {
    revalidateTag(tag, REVALIDATE_PROFILE)
  }
}
```

Update every after-change hook to accept `{ doc, previousDoc }` and gate on `isOrWasPublished(doc, previousDoc)`.

- [ ] **Step 4: Add explicit delete hooks**

Export:

```ts
export const revalidateDeletedPageCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') revalidateTags(CMS_CACHE_TAGS.pages, CMS_CACHE_TAGS.sitemap)
  return doc
}

export const revalidateDeletedArticleCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') revalidateTags(CMS_CACHE_TAGS.articles, CMS_CACHE_TAGS.sitemap)
  return doc
}

export const revalidateDeletedReviewCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') revalidateTags(CMS_CACHE_TAGS.reviews, CMS_CACHE_TAGS.sitemap)
  return doc
}

export const revalidateDeletedNewsEventCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') revalidateTags(CMS_CACHE_TAGS.newsEvents, CMS_CACHE_TAGS.sitemap)
  return doc
}

export const revalidateDeletedRedirectCache: CollectionAfterDeleteHook = ({ doc }) => {
  if (doc._status === 'published') revalidateTags(CMS_CACHE_TAGS.redirects)
  return doc
}
```

- [ ] **Step 5: Register delete hooks without disturbing existing hook order**

Append the appropriate revalidation hook to each collection's existing `afterDelete` array. Create an `afterDelete` array where absent. For Pages, keep `syncNavigationLinkAfterDelete` first and revalidation second.

- [ ] **Step 6: Run cache and affected collection tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/cache-revalidation.int.spec.ts tests/int/page-routing.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts tests/int/news-events-collection.int.spec.ts tests/int/redirects.int.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit cache correctness**

```bash
git add src/hooks/revalidateCmsContent.ts src/collections/{Pages,Articles,Reviews,NewsEvents,Redirects}.ts tests/int/cache-revalidation.int.spec.ts
git commit -m "fix(cache): invalidate unpublished content" -m "Public takedowns must evict previously published pages and redirects."
```

---

### Task 4: Harden repository, runtime, and GraphQL defaults

**Files:**
- Modify: `.gitignore`
- Create: `.dockerignore`
- Delete: `backups/payload-db-2026-07-26.archive`
- Delete: `backups/payload-db-2026-08-08-19-39-55-880.archive`
- Delete: `backups/pre-import-2026-07-26T05-53-33-650Z.archive`
- Modify: `src/config/runtime.ts`
- Modify: `src/payload.config.ts`
- Modify: `tests/int/runtime-config.int.spec.ts`
- Modify: `tests/int/repository-hygiene.int.spec.ts`
- Modify: `tests/int/docker-standalone.int.spec.ts`
- Modify: `.env.example`
- Modify: `docs/operations/runtime-and-providers.md`
- Modify: `docs/operations/developer-workflows.md`
- Modify: `docs/operations/starter-clone-checklist.md`

**Interfaces:**
- Consumes: `getRuntimeConfig(process.env)` as the single runtime validation entry point.
- Produces: `RuntimeConfig.payload.secret`, strict production secret validation, explicit production GraphQL protection, and documented archive recovery procedure.

- [ ] **Step 1: Add failing secret-contract tests**

Add a `baseEnv` with Mongo/local providers to `tests/int/runtime-config.int.spec.ts`, then assert:

```ts
expect(() => getRuntimeConfig({ ...baseEnv, PAYLOAD_SECRET: '' })).toThrow(
  'Missing PAYLOAD_SECRET. Set a unique secret for this environment.',
)

expect(() =>
  getRuntimeConfig({
    ...baseEnv,
    NODE_ENV: 'production',
    PAYLOAD_SECRET: 'YOUR_PAYLOAD_CMS_SECRET_HERE',
  }),
).toThrow('Invalid production PAYLOAD_SECRET. Use at least 32 non-placeholder characters.')

expect(
  getRuntimeConfig({
    ...baseEnv,
    NODE_ENV: 'production',
    PAYLOAD_SECRET: '4f3a8db96b7240b4a6fbd84585f9bb21',
  }).payload.secret,
).toBe('4f3a8db96b7240b4a6fbd84585f9bb21')
```

- [ ] **Step 2: Add failing repository/build-context tests**

Extend `repository-hygiene.int.spec.ts` to assert no tracked files match `backups/*.archive` and `.gitignore` contains `/backups/` and `*.archive`.

Extend `docker-standalone.int.spec.ts` to assert `.dockerignore` contains `.git`, `.env*`, `backups`, `node_modules`, `.next`, `playwright-report`, and `test-results`, while it does not exclude `public` or `src`.

- [ ] **Step 3: Run focused tests and confirm failures**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts tests/int/repository-hygiene.int.spec.ts tests/int/docker-standalone.int.spec.ts`

Expected: FAIL for missing secret validation, tracked archives, and absent `.dockerignore`.

- [ ] **Step 4: Validate and consume the Payload secret**

Add `payload: { secret: string }` to `RuntimeConfig`. Read and validate the trimmed value before provider construction:

```ts
const payloadSecret = env.PAYLOAD_SECRET?.trim() || ''
const placeholderSecrets = new Set([
  'YOUR_PAYLOAD_CMS_SECRET_HERE',
  'change-me',
  'changeme',
])

if (!payloadSecret) {
  throw new Error('Missing PAYLOAD_SECRET. Set a unique secret for this environment.')
}

if (isProduction && (payloadSecret.length < 32 || placeholderSecrets.has(payloadSecret))) {
  throw new Error('Invalid production PAYLOAD_SECRET. Use at least 32 non-placeholder characters.')
}
```

Return `payload: { secret: payloadSecret }` and change Payload config to:

```ts
graphQL: {
  disableIntrospectionInProduction: true,
  disablePlaygroundInProduction: true,
},
secret: runtimeConfig.payload.secret,
```

Keep the generated Playground route file unchanged; Payload's route handler consumes the config policy.

- [ ] **Step 5: Remove current archives and prevent recurrence**

Remove only the three tracked archive files listed under Files. Do not use `git filter-repo`, BFG, force push, or any history rewrite.

Append to `.gitignore`:

```gitignore
# Local database exports contain sensitive client data.
/backups/
*.archive
```

Create `.dockerignore`:

```dockerignore
.git
.github
.next
node_modules
.env*
!.env.example
backups
coverage
playwright-report
test-results
*.log
```

- [ ] **Step 6: Update runtime examples and operator recovery guidance**

Keep the `.env.example` value visibly non-production and add a comment requiring replacement. Update the three operator documents to state:

- production secrets require at least 32 non-placeholder characters;
- database archives belong in approved encrypted external storage;
- deleting a tracked archive does not remove it from Git history;
- operators must inspect archive sensitivity, rotate affected credentials, notify collaborators, and schedule history cleanup separately when needed.

Remove the obsolete statement that the repository has no CI after Task 6 creates the workflow.

- [ ] **Step 7: Run focused tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts tests/int/repository-hygiene.int.spec.ts tests/int/docker-standalone.int.spec.ts tests/int/starter-productization.int.spec.ts`

Expected: PASS.

- [ ] **Step 8: Commit repository and runtime hardening**

```bash
git add .gitignore .dockerignore .env.example backups src/config/runtime.ts src/payload.config.ts tests/int docs/operations
git commit -m "fix(security): harden release defaults" -m "Database exports must stay outside source and production must reject weak Payload secrets."
```

---

### Task 5: Restore block, theme, and Rich Text contracts

**Files:**
- Modify: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`
- Modify: `tests/int/block-appearance-contract.int.spec.ts`
- Modify: `tests/int/theme-contracts.int.spec.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**
- Consumes: explicit Page/Reusable/News detail schema registries and shared Rich Text style ownership.
- Produces: exact Page-compatible News detail schema parity and resilient semantic-style/theme tests.

- [ ] **Step 1: Preserve the failing registry test and add the missing import**

Import `DepartmentProfilesBlock` next to `LeadershipProfilesBlock` and insert it immediately afterward in the News & Events detail layout registry:

```ts
import { DepartmentProfilesBlock } from '@/blocks/DepartmentProfiles/config'

// In layout.blocks, immediately after LeadershipProfilesBlock:
DepartmentProfilesBlock,
```

The existing parity assertion remains the acceptance test; do not weaken it or replace explicit registries with a mixed server/client registry.

- [ ] **Step 2: Point the Rich Text contract at its current owner**

In `block-appearance-contract.int.spec.ts`, read both the component and `src/components/rich-text/richTextStyles.ts`. Keep component assertions about semantic consumption, and move class-token assertions to `richTextStyles.ts`:

```ts
const stylesSource = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/rich-text/richTextStyles.ts'),
  'utf8',
)

expect(stylesSource).toContain('[--tw-prose-body:currentColor]')
expect(stylesSource).toContain('[--tw-prose-links:var(--primary)]')
expect(stylesSource).toContain('[--tw-prose-hr:var(--border)]')
expect(stylesSource).toContain('[&_a]:focus-visible:ring-2')
```

- [ ] **Step 3: Compare SNMIH palette values numerically**

Add this helper in `theme-contracts.int.spec.ts`:

```ts
const expectOklchTokens = (
  actual: Record<string, string>,
  expected: Record<string, string>,
) => {
  for (const [token, expectedValue] of Object.entries(expected)) {
    expect(parseOklch(actual[token]), token).toEqual(parseOklch(expectedValue))
  }
}
```

Replace the two serialization-exact `toMatchObject` assertions in the approved SNMIH palette test with `expectOklchTokens(light, { ... })` and `expectOklchTokens(dark, { ... })`, retaining every existing expected token/value. This treats `0.01373` and `0.013730` as equal without tolerating a numeric palette change.

- [ ] **Step 4: Run the three previously failing contracts**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx tests/int/block-appearance-contract.int.spec.ts tests/int/theme-contracts.int.spec.ts`

Expected: PASS.

- [ ] **Step 5: Regenerate types and run registry boundaries**

Run: `pnpm generate:types`

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx`

Expected: PASS.

- [ ] **Step 6: Commit contract recovery**

```bash
git add src/globals/NewsEventsDetailTemplate.ts src/payload-types.ts tests/int/news-events-detail-template.int.spec.tsx tests/int/block-appearance-contract.int.spec.ts tests/int/theme-contracts.int.spec.ts
git commit -m "fix(contracts): restore release baseline"
```

---

### Task 6: Add replica-set testing, CI, documentation, and final verification

**Files:**
- Modify: `tests/helpers/mongoMemoryServer.ts`
- Create: `.github/workflows/quality.yml`
- Modify: `docs/operations/runtime-and-providers.md`
- Modify: `docs/operations/developer-workflows.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: all preceding tasks, repository scripts, and `createTestMongoServer()` callers.
- Produces: the same `{ uri, stop }` helper interface backed by a single-node replica set and a required GitHub quality workflow.

- [ ] **Step 1: Upgrade the test database without changing its caller contract**

Replace `MongoMemoryServer` with `MongoMemoryReplSet`:

```ts
import { MongoMemoryReplSet } from 'mongodb-memory-server'

const server = await MongoMemoryReplSet.create({
  binary: {
    downloadDir,
  },
  replSet: {
    count: 1,
    storageEngine: 'wiredTiger',
  },
})
```

Keep `uri: server.getUri()` and the existing async stop/temp-directory cleanup interface unchanged.

- [ ] **Step 2: Prove the replica-set helper with Mongo-backed tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts tests/int/starter-productization.int.spec.ts`

Expected: PASS outside restricted sandboxes; both suites start a replica-set URI and shut it down cleanly.

- [ ] **Step 3: Create the GitHub Actions quality gate**

Create `.github/workflows/quality.yml`:

```yaml
name: Quality

on:
  pull_request:
  push:
    branches: [develop, main]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      EMAIL_PROVIDER: none
      MEDIA_PROVIDER: localDisk
      MONGODB_URI: mongodb://127.0.0.1:27017/payload-cms-starter-kit
      PAYLOAD_SECRET: ci-only-payload-secret-32-characters
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm project-context:check
      - run: pnpm generate:types
      - run: git diff --exit-code -- src/payload-types.ts
      - run: pnpm exec tsc --noEmit
      - run: pnpm lint
      - run: pnpm test:int
      - run: pnpm build
```

- [ ] **Step 4: Update maintained architecture and operator contracts**

Document these final facts:

- anonymous draft-enabled collection reads are constrained in Payload access;
- preview Local API reads are user-scoped;
- cache invalidation includes unpublish and delete transitions;
- Search Settings is capability-governed and versioned;
- runtime validates `PAYLOAD_SECRET` and disables production GraphQL introspection/playground;
- CI runs context, generated types, TypeScript, lint, integration, and build gates;
- Mongo-backed tests use a replica set.

Update the runtime/provider documentation so it no longer says CI is absent.

- [ ] **Step 5: Refresh generated project context**

Run: `pnpm project-context:update`

Inspect the generated `project-inventory.json` and confirm the new test/workflow paths and Search Settings versioning facts are represented. Do not make normal context checks fail solely because the optional Understand graph is stale.

- [ ] **Step 6: Run focused context checks**

Run: `pnpm test:project-context`

Run: `pnpm project-context:check`

Expected: both commands pass; an optional stale-graph warning is acceptable only if the checker documents it as non-fatal.

- [ ] **Step 7: Run complete verification**

Run in order:

```bash
pnpm generate:types
git diff --exit-code -- src/payload-types.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
pnpm build
git diff --check
```

Expected: every command exits 0. If MongoMemoryServer cannot bind in the managed sandbox, rerun the two Mongo-backed suites in CI or an unrestricted local environment and report the environment limitation separately; do not skip or weaken them.

- [ ] **Step 8: Inspect the final change-impact surface**

Read `.agents/skills/project-context/references/change-impact-map.md` and inspect:

```bash
git status --short
git diff --stat ca11a77..HEAD
git diff ca11a77..HEAD
```

Confirm no unrelated UI or client content changed and no database archive remains in the current tree.

- [ ] **Step 9: Commit CI and maintained context**

```bash
git add .github/workflows/quality.yml tests/helpers/mongoMemoryServer.ts docs/operations .agents/skills/project-context/references
git commit -m "ci: enforce release quality gate"
```

## Handoff Checklist

- [ ] Confirm the six implementation commits are present and scoped.
- [ ] Report archive filenames removed from the current tree and state that Git history was not rewritten.
- [ ] Report the exact full-test, typecheck, lint, build, and project-context results.
- [ ] Report which project-context files changed.
- [ ] List any credential rotation/history-cleanup action that still requires operator coordination.
- [ ] Confirm the product remains one client per deployment.
