# Two-Role Feature Permissions Implementation Plan

> **For agentic workers:** Use the `subagent-driven-development` subskill to execute this plan task by task when the user explicitly chooses delegated execution.

**Goal:** Replace the legacy editorial roles/capabilities and generic workflow with exactly two roles, a 29-feature Site Manager permission model, and focused moderation for public-submitted reviews.

**Architecture:** A server-safe typed feature registry is the source of truth for Payload Admin visibility and server authorization. Admins receive implicit full access; Site Managers fail closed and receive feature grants with narrow dependency reads. Payload `_status`, drafts, versions, preview, Trash, Action Queue, and audit remain; the parallel editorial workflow state is removed.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, MongoDB, Vitest, React Testing Library, pnpm.

**Specification:** `docs/superpowers/specs/2026-09-02-two-role-feature-permissions-design.md`

## Global constraints

- Do not stage or commit files. The user explicitly requested an uncommitted implementation.
- Do not run a migration against Atlas or production. That requires a fresh backup, reviewed dry run, and separate approval.
- Follow the repository's `project-context` and Payload skills; finish with the project-context update/check loop.
- Write access behavior tests first. `admin.hidden` is presentation only; server access remains authoritative.
- Preserve unrelated working-tree changes.

---

### Task 1: Add the canonical feature registry and fail-closed helpers

**Files:**

- Create: `src/access/adminFeatures.ts`
- Create: `src/access/featureAccess.ts`
- Create: `tests/int/admin-features.int.spec.ts`

**Step 1: Write failing tests**

Assert that the registry has exactly 29 unique keys in specification order, every entry has complete metadata/resource binding, Admin always passes, Site Manager requires explicit `true`, and missing/malformed/unknown user data fails closed.

Use this public contract:

```ts
export type AdminRole = 'admin' | 'siteManager'

export const ADMIN_FEATURE_KEYS = [
  'pages',
  'articles',
  'reviews',
  'reusableSections',
  'newsEvents',
  'newsEventClassifications',
  'newsEventsDetailTemplate',
  'topics',
  'tags',
  'navigationLinks',
  'redirects',
  'headers',
  'footers',
  'officeLocations',
  'systemPages',
  'media',
  'galleryAlbums',
  'forms',
  'formSubmissions',
  'actionQueue',
  'auditLog',
  'siteIdentity',
  'appearance',
  'seoMetadata',
  'analyticsTracking',
  'cookieConsent',
  'layoutDefaults',
  'searchSettings',
  'maintenanceModes',
] as const

export type AdminFeatureKey = (typeof ADMIN_FEATURE_KEYS)[number]
export type AdminFeatureGrants = Partial<Record<AdminFeatureKey, boolean>>
```

Run `pnpm test:int tests/int/admin-features.int.spec.ts` and confirm it fails for missing modules.

**Step 2: Implement the data-only registry**

Each entry must have `label`, `description`, `group`, `resource`, `policyKind`, and `dependencyReads`. The access layer may not import collection/global configs.

**Step 3: Implement pure access primitives**

Provide strict `isAdmin`, `hasFeature`, `hasDependencyRead`, and `hideUnlessFeature` helpers plus collection/global factories for management, published reads, version reads, dependency reads, soft delete/restore, and Admin-only permanent deletion. Unknown feature strings must not type-check; malformed runtime input returns `false`.

**Step 4: Verify**

Run `pnpm test:int tests/int/admin-features.int.spec.ts`. Expected: PASS.

---

### Task 2: Rebuild Users around two roles and Admin-managed grants

**Files:**

- Modify: `src/collections/Users.ts`
- Modify: `src/access/editorialRoles.ts`
- Modify: `src/hooks/logOperationalAuditEvent.ts`
- Modify: `src/lib/operationalAudit.ts`
- Create: `tests/int/user-feature-administration.int.spec.ts`
- Modify: `tests/int/adminCapabilities.int.spec.ts`
- Modify: `tests/int/operational-audit.int.spec.ts`

**Step 1: Write failing account-policy tests**

Cover exactly two runtime roles, first-user Admin bootstrap, multiple Admin/Site Manager creation by Admin, zero-grant Site Manager defaults, Admin-only Users/lifecycle/role/grant operations, safe own-account editing, last-active-Admin protection, session clearing after role/grant changes, and sanitized authorization audit events.

Run:

```bash
pnpm test:int tests/int/user-feature-administration.int.spec.ts tests/int/adminCapabilities.int.spec.ts tests/int/operational-audit.int.spec.ts
```

Expected: FAIL against the legacy model.

**Step 2: Normalize roles without runtime privilege migration**

`admin` stays Admin; `siteManager` stays Site Manager; everything else becomes a zero-grant Site Manager. Legacy mapping exists only in Task 9's migration.

**Step 3: Replace capabilities with registry-driven feature fields**

In Users, expose only Admin/Site Manager role options. Generate a `features` group from the registry, grouped like the sidebar, visible/editable only to Admins when editing a Site Manager. Every checkbox defaults false. Admin access is implicit and stored Admin feature maps are cleared/ignored.

**Step 4: Enforce lifecycle invariants**

Request-aware hooks must prevent demotion, trash, or permanent deletion of the last active Admin; compare original/next authorization; clear the target's `sessions` in the same update; and audit only actor ID, target ID, and before/after role/grants. Guard recursion with a typed internal context marker. Never log passwords, tokens, sessions, or arbitrary submitted data.

**Step 5: Verify**

Run the Step 1 command. Expected: PASS.

---

### Task 3: Bind every Admin destination to exactly one feature

**Files:**

- Modify: the 20 collection and 9 global configs in the tables below
- Modify: `src/access/featureAccess.ts`
- Create: `tests/int/feature-access-matrix.int.spec.ts`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `tests/int/admin-information-architecture.int.spec.ts`
- Modify: `tests/int/public-content-access.int.spec.ts`
- Modify: `tests/int/media-governance.int.spec.ts`
- Modify: `tests/int/preview-access.int.spec.ts`

**Collection bindings:**

| Feature                    | File                                          |
| -------------------------- | --------------------------------------------- |
| `pages`                    | `src/collections/Pages.ts`                    |
| `articles`                 | `src/collections/Articles.ts`                 |
| `reviews`                  | `src/collections/Reviews.ts`                  |
| `reusableSections`         | `src/collections/ReusableSections.ts`         |
| `newsEvents`               | `src/collections/NewsEvents.ts`               |
| `newsEventClassifications` | `src/collections/NewsEventClassifications.ts` |
| `topics`                   | `src/collections/Categories.ts`               |
| `tags`                     | `src/collections/Tags.ts`                     |
| `navigationLinks`          | `src/collections/NavigationLinks.ts`          |
| `redirects`                | `src/collections/Redirects.ts`                |
| `headers`                  | `src/collections/Headers.ts`                  |
| `footers`                  | `src/collections/Footers.ts`                  |
| `officeLocations`          | `src/collections/OfficeLocations.ts`          |
| `systemPages`              | `src/collections/SystemPages.ts`              |
| `media`                    | `src/collections/Media.ts`                    |
| `galleryAlbums`            | `src/collections/GalleryAlbums.ts`            |
| `forms`                    | `src/collections/Forms.ts`                    |
| `formSubmissions`          | `src/collections/FormSubmissions.ts`          |
| `actionQueue`              | `src/collections/WorkQueue.ts`                |
| `auditLog`                 | `src/collections/OperationalAuditEvents.ts`   |

**Global bindings:**

| Feature                    | File                                      |
| -------------------------- | ----------------------------------------- |
| `newsEventsDetailTemplate` | `src/globals/NewsEventsDetailTemplate.ts` |
| `siteIdentity`             | `src/globals/SiteSettings.ts`             |
| `appearance`               | `src/globals/ThemeSettings.ts`            |
| `seoMetadata`              | `src/globals/SEOSettings.ts`              |
| `analyticsTracking`        | `src/globals/AnalyticsSettings.ts`        |
| `cookieConsent`            | `src/globals/CookieConsentSettings.ts`    |
| `layoutDefaults`           | `src/globals/PageSettings.ts`             |
| `searchSettings`           | `src/globals/SearchSettings.ts`           |
| `maintenanceModes`         | `src/globals/SystemModeSettings.ts`       |

**Step 1: Write the failing matrix**

Assert one registry binding per destination, no duplicate/orphan key, visibility and server access from the same key, feature-off denial/feature-on access, unchanged anonymous reads, version access, authorized trash/restore, Admin-only permanent deletion, and direct REST/GraphQL/Local API/preview enforcement. Classifications remain archive-only for Site Managers because they are not Trash-enabled and deletion stays Admin-only.

**Step 2: Apply policies without weakening existing guards**

Replace capability checks and `admin.hidden` in every bound config. Retain anonymous-read rules, integrity hooks, upload limits, relationship guards, and cache invalidation. Users remains outside the registry and Admin-only.

**Step 3: Add bounded dependency reads**

Implement the specification's dependency graph. Dependency access can read/select only the IDs and labels required by relationship controls. It never shows the supporting destination or grants mutation. Protect reviewer contact data, raw submissions, auth data, credentials, and storage internals with field access. Form Submission assignment may expose only a safe user identifier/display label.

**Step 4: Verify**

Run:

```bash
pnpm test:int tests/int/admin-features.int.spec.ts tests/int/feature-access-matrix.int.spec.ts tests/int/feature-matrix.int.spec.ts tests/int/admin-information-architecture.int.spec.ts tests/int/public-content-access.int.spec.ts tests/int/media-governance.int.spec.ts tests/int/preview-access.int.spec.ts
```

Expected: PASS.

---

### Task 4: Scope Action Queue and Audit Log rows by source feature

**Files:**

- Modify: `src/collections/WorkQueue.ts`
- Modify: `src/collections/OperationalAuditEvents.ts`
- Modify: `src/hooks/syncWorkQueueItem.ts`
- Modify: `src/hooks/logOperationalAuditEvent.ts`
- Modify: `src/lib/operationalAudit.ts`
- Modify: `tests/int/work-queue.int.spec.ts`
- Modify: `tests/int/operational-audit.int.spec.ts`

**Step 1: Write failing row-scope tests**

Admin sees all rows. A Site Manager needs `actionQueue`/`auditLog` plus the row's source feature. Unmapped legacy rows are Admin-only. Queue records remain system-created/non-deletable; audit records remain append-only/read-only. Unauthorized source titles, relations, and links must not appear.

Run `pnpm test:int tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts` and confirm failure.

**Step 2: Persist and validate source feature**

Add `feature: AdminFeatureKey` to new queue records and as an optional backward-compatible field on audit events. Populate it at every producer from the registry mapping and reject unknown values.

**Step 3: Apply row filters**

For Site Managers, intersect the Administration grant with held source features. Return `false` when the intersection is empty. Restrict queue updates to documented operational fields; keep creation/deletion trusted-system only. Unmapped audit records stay Admin-only.

**Step 4: Verify**

Run the Step 1 command. Expected: PASS.

---

### Task 5: Replace generic workflow with focused publication policy

**Files:**

- Create: `src/fields/publicationMetadataFields.ts`
- Create: `src/hooks/enforcePublicationPolicy.ts`
- Create: `src/hooks/syncDraftPublishToWorkQueue.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/SystemPages.ts`
- Modify: `src/collections/Headers.ts`
- Modify: `src/collections/Footers.ts`
- Modify: `src/collections/NavigationLinks.ts`
- Modify: `src/collections/Redirects.ts`
- Modify: `tests/int/editorial-workflow.int.spec.ts`
- Modify: `tests/int/articles.int.spec.ts`
- Modify: `tests/int/news-events-collection.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/reviews.int.spec.ts`
- Modify: `tests/int/work-queue.int.spec.ts`
- Delete after zero-consumer proof: `src/hooks/enforceEditorialWorkflow.ts`
- Delete after extraction: `src/hooks/syncWorkflowStateToWorkQueue.ts`
- Delete after zero-consumer proof: `src/lib/editorialWorkflow.ts`

**Step 1: Rewrite tests around retained behavior**

Assert no Workflow tab or retired fields (`workflowState`, `scheduledPublishAt`, `changeSummary`, `lastReviewedAt`, `lastReviewedBy`), while drafts, versions, preview, `_status`, `publishedAt`, `publishedBy`, publish blockers, cache invalidation, and publish/unpublish audit remain.

Run:

```bash
pnpm test:int tests/int/editorial-workflow.int.spec.ts tests/int/articles.int.spec.ts tests/int/news-events-collection.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/reviews.int.spec.ts tests/int/work-queue.int.spec.ts
```

Expected: FAIL against legacy workflow fields.

**Step 2: Extract retained publication metadata**

Create compact, read-only Admin fields for the existing `publishedAt` and `publishedBy` names and apply them to the draft-enabled resources that already store them.

**Step 3: Implement publication policy**

The new before-change hook detects transition to `_status: 'published'`, verifies the owning feature for user-scoped operations, rejects unresolved source-matched publish blockers, stamps actor/time atomically, and audits publication/unpublication. It must not introduce another status. Trusted migration bypass uses a typed context marker that request data cannot set.

**Step 4: Extract still-valid queue behavior**

Move `createDraftPublishQueueHook` into `syncDraftPublishToWorkQueue.ts` and update Headers, Footers, Navigation Links, and Redirects. Do not retain legacy workflow-state logic.

**Step 5: Remove fields/modules and verify**

Update the five editorial collections, then run the Step 1 command. Delete legacy modules only when `rg` confirms there are no request-time imports. Expected tests: PASS.

---

### Task 6: Make `_status` the sole public publication boundary

**Files:**

- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Modify: `src/app/(frontend)/news-events/[slug]/opengraph-image.tsx`
- Modify: `src/app/(frontend)/news-events/feed.xml/route.ts`
- Modify: `src/app/(frontend)/search/page.tsx`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/lib/calendarEvents.ts`
- Modify: `src/lib/newsEvents.ts`
- Modify: `src/lib/reviewFeed.ts`
- Modify: `src/lib/stripInternalMediaFields.ts`
- Modify: `src/endpoints/createPageFromRecipe.ts`
- Modify: the eight tests listed below

**Step 1: Update public-delivery tests first**

In `annual-calendar-data`, `calendar-data`, `news-events-data`, `news-grid`, `public-content-access`, `review-feed-data`, `sitemap`, and `page-recipe-endpoint` integration tests, assert published content is included and drafts excluded without `workflowState`.

Run:

```bash
pnpm test:int tests/int/annual-calendar-data.int.spec.ts tests/int/calendar-data.int.spec.ts tests/int/news-events-data.int.spec.ts tests/int/news-grid.int.spec.tsx tests/int/public-content-access.int.spec.ts tests/int/review-feed-data.int.spec.ts tests/int/sitemap.int.spec.ts tests/int/page-recipe-endpoint.int.spec.ts
```

Expected: FAIL while consumers require the retired field.

**Step 2: Remove workflow predicates**

Use `_status: 'published'` as the sole public persisted publication predicate. Preserve preview draft behavior, ordering, dates, classifications, and access override semantics. Remove retired workflow fields from sanitizers while retaining real internal media/storage and moderation-data protection.

**Step 3: Prove runtime references are gone**

Run:

```bash
rg -n "workflowState|scheduledPublishAt|changeSummary|lastReviewedAt|lastReviewedBy" src --glob '!payload-types.ts' --glob '!migrations/**'
```

Expected: no request-time source matches. Then rerun Step 1 tests; expected PASS.

---

### Task 7: Add focused moderation for public-submitted Reviews

**Files:**

- Create: `src/hooks/enforceReviewModeration.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/lib/reviewPromotion.ts`
- Modify: `src/hooks/syncReviewToWorkQueue.ts`
- Modify: `src/app/api/forms/[slug]/submit/route.ts`
- Modify: `tests/int/review-submission.int.spec.ts`
- Modify: `tests/int/reviews.int.spec.ts`
- Modify: `tests/int/review-feed-data.int.spec.ts`
- Modify: `tests/int/operational-audit.int.spec.ts`
- Modify: `tests/int/work-queue.int.spec.ts`

**Step 1: Write failing moderation tests**

Cover trusted intake creating a pending draft and immutable source link; rejection of public authorization/moderation fields; Admin/authorized-Site-Manager approval; unauthorized denial; direct/bulk/API publish guards; atomic approval/rejection metadata; no partial stamps after failure; public visibility only after approval; normal staff-created draft/publish; deduplicated pending-review queue; and audit events.

Run:

```bash
pnpm test:int tests/int/review-submission.int.spec.ts tests/int/reviews.int.spec.ts tests/int/review-feed-data.int.spec.ts tests/int/operational-audit.int.spec.ts tests/int/work-queue.int.spec.ts
```

Expected: FAIL before moderation exists.

**Step 2: Add the Moderation sidebar**

Add `moderationStatus: 'pending' | 'approved' | 'rejected'`, immutable `sourceSubmission`, read-only `moderatedAt`/`moderatedBy`, and an internal `moderationNote`. Show moderation only for source-linked Reviews; add status to columns and a Pending filter. Staff Reviews without a source do not require moderation.

**Step 3: Enforce atomic transitions**

Require Admin or `reviews`. Approval sets `_status: 'published'` plus moderation/publication stamps. Rejection sets `_status: 'draft'` plus moderation stamps. Block source-linked publication unless approval is valid in the same operation. Ordinary unpublish keeps prior decision metadata. Disallow untrusted source/actor/timestamp edits.

**Step 4: Narrow trusted intake**

Only validated review-intent promotion may use a typed `trustedReviewPromotion` context. Build privileged values inside `reviewPromotion.ts`; never spread public data into authorization fields. Promotion failure must preserve the Form Submission.

**Step 5: Focus queue behavior and verify**

Create one deduplicated `feature: 'reviews'` pending item and resolve it on approval/rejection. Remove generic review/scheduled queue states. Run Step 1 tests; expected PASS.

---

### Task 8: Simplify Dashboard and feature-filter every summary

**Files:**

- Modify: `src/components/admin/DashboardOverview.tsx`
- Modify: `src/components/admin/dashboardAttention.ts`
- Delete or refocus: `src/components/admin/DashboardWorkflowCard.tsx`
- Delete or refocus: `src/components/admin/DashboardWorkflowCard.scss`
- Modify: `tests/int/dashboard-capability-filtering.int.spec.tsx`
- Modify: `tests/int/dashboard-attention.int.spec.tsx`
- Modify: `tests/int/admin-information-architecture.int.spec.ts`

**Step 1: Write failing Dashboard tests**

All authenticated users can open Dashboard. Admin sees all summaries; Site Manager sees only granted summaries/links. A zero-grant account gets a useful non-leaking empty state. Remove In Review/Scheduled, show Pending Reviews only with `reviews`, retain unavailable/error versus zero, and do not issue unauthorized queries.

Run:

```bash
pnpm test:int tests/int/dashboard-capability-filtering.int.spec.tsx tests/int/dashboard-attention.int.spec.tsx tests/int/admin-information-architecture.int.spec.ts
```

Expected: FAIL against capability/workflow cards.

**Step 2: Drive queries and presentation from `hasFeature`**

Check authorization before every count/query and filter quick actions/links with the same helper as Payload configs. Replace workflow counts with pending source-linked draft Reviews. Delete DashboardWorkflowCard files only if `rg -n "DashboardWorkflowCard" src tests` proves they have no retained consumer; otherwise refocus names/copy on moderation.

**Step 3: Verify**

Run Step 1 tests. Expected: PASS.

---

### Task 9: Add a reversible, dry-run-first data migration

**Files:**

- Create: `src/migrations/20260902_000000_two_role_feature_permissions.ts`
- Modify: `src/migrations/index.ts`
- Create: `scripts/report-two-role-feature-migration.mjs`
- Create: `tests/int/two-role-feature-permissions-migration.int.spec.ts`
- Modify: `tests/int/legal-pages-migration.int.spec.ts`

**Step 1: Write failing migration tests**

Use fixtures for every legacy role, malformed roles, agreeing/disagreeing manage/publish flags, matching/contradictory/missing workflow states, public-linked Reviews, staff Reviews, live documents, and version snapshots. Assert deny-by-default mappings, contradiction reporting, no accidental publication, Review mappings, private rollback metadata, idempotent `up`, and restoring `down`.

Run:

```bash
pnpm test:int tests/int/two-role-feature-permissions-migration.int.spec.ts tests/int/legal-pages-migration.int.spec.ts
```

Expected: FAIL before migration exists.

**Step 2: Define the compatibility table**

Map each legacy capability to stable feature keys explicitly. Where manage and publish flags both existed, grant only when both are true:

```ts
const grant = manage === true && publish === true
```

Disagreement stays false and is reported. Unknown roles become zero-grant Site Managers. Do not infer Administration or Settings grants.

**Step 3: Implement reversible batches**

Follow existing Payload migration conventions. Operate only on the provided DB, update live documents and relevant version snapshots, write namespaced rollback data excluded from normal reads, guard hook recursion, install runtime-compatible fields before retiring stored fields, report IDs/counts without personal data, and make both directions idempotent. Never connect to `.env.atlas.local` or production.

Published content remains public only if both `_status` and legacy state were published; contradictions become drafts and are reported. A published public-linked Review becomes approved; an unpublished one becomes pending; staff Reviews do not gain moderation.

**Step 4: Add the read-only reporter**

Require an explicit `--database-uri`, default to read-only, mask credentials, and report roles, proposed grants, contradictions, publication changes, and moderation mappings without email/content/form data. Document only a local Docker example.

**Step 5: Register and verify**

Add the migration to `src/migrations/index.ts`, run Step 1 tests, and expect PASS.

---

### Task 10: Remove legacy code, generate artifacts, and verify

**Files:**

- Delete after zero-consumer proof: `src/access/adminCapabilities.ts`
- Trim legacy-only exports: `src/access/editorialRoles.ts`
- Generate: `src/payload-types.ts`
- Generate if custom Admin imports changed: `src/app/(payload)/admin/importMap.js`
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: project-context knowledge artifacts produced by its update script

**Step 1: Prove legacy runtime consumers are gone**

Run:

```bash
rg -n "adminCapabilities|contentManager|manage_[a-z_]+|publish_[a-z_]+|require_editorial_workflow" src tests --glob '!migrations/**'
rg -n "workflowState|scheduledPublishAt|changeSummary|lastReviewedAt|lastReviewedBy" src tests --glob '!migrations/**' --glob '!payload-types.ts'
```

Expected: no runtime source matches; tests may mention old names only to assert removal/migration compatibility. Then delete obsolete modules and imports.

**Step 2: Generate Payload artifacts**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Confirm generated types contain two roles, features, Review moderation, and queue/audit feature fields. Import-map output changes only if custom Admin imports changed.

**Step 3: Update documentation**

Document two roles/unlimited accounts, the 29 grants, deny-by-default Site Managers, Admin-only Users/permanent deletion, bounded dependencies, Review approval, immediate session revocation, local dry-run procedure, and separate production approval. Never include real credentials.

**Step 4: Run focused suites**

```bash
pnpm test:int tests/int/admin-features.int.spec.ts tests/int/user-feature-administration.int.spec.ts tests/int/feature-access-matrix.int.spec.ts tests/int/admin-information-architecture.int.spec.ts tests/int/public-content-access.int.spec.ts tests/int/editorial-workflow.int.spec.ts tests/int/reviews.int.spec.ts tests/int/review-submission.int.spec.ts tests/int/work-queue.int.spec.ts tests/int/operational-audit.int.spec.ts tests/int/dashboard-capability-filtering.int.spec.tsx tests/int/dashboard-attention.int.spec.tsx tests/int/two-role-feature-permissions-migration.int.spec.ts
```

Expected: PASS.

**Step 5: Run repository verification**

```bash
pnpm test:int
pnpm lint
pnpm build
pnpm project-context:update
pnpm project-context:check
```

All must pass; review generated project knowledge for accuracy. Fix causes rather than weakening access assertions.

**Step 6: Perform the no-commit handoff**

Run `git diff --check`, `git status --short`, and `git diff --stat`. Confirm nothing is staged/committed, no Atlas/production migration ran, verification results are reported, and production migration remains separately approved.

---

## Completion checklist

- [ ] Exactly two runtime roles; unlimited Admin/Site Manager creation by Admin.
- [ ] Last active Admin protection and immediate session revocation.
- [ ] Site Managers default to zero and cannot edit authorization fields.
- [ ] All 29 destinations have one canonical feature binding.
- [ ] Navigation, REST, GraphQL, Local API, preview, and versions enforce one policy.
- [ ] Authorized trash/restore works; Site Manager permanent deletion never does.
- [ ] Dependency reads are bounded and field-safe.
- [ ] Generic Workflow state is gone; drafts, versions, preview, and publication metadata remain.
- [ ] Public-submitted Reviews require authorized approval.
- [ ] Queue, audit, Dashboard, and public delivery are correctly scoped.
- [ ] Migration is reversible, idempotent, reported, and not run against production.
- [ ] Types, tests, lint, build, and project-context checks pass.
- [ ] Work is unstaged and uncommitted.

<!-- PLAN-END -->
