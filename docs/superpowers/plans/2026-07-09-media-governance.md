# Media Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add media usage visibility and deletion safety so editors can see where assets are used and cannot delete referenced files accidentally.

**Architecture:** Introduce one explicit media-usage resolver that scans the starter's known structured Payload `media` relationships across collections, globals, and supported block fields. Wire that resolver into the `media` collection through read-only admin fields and a delete guard hook, then prove the behavior with focused integration tests and regenerated Payload artifacts.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, Vitest

## Global Constraints

- Keep one `media` collection
- Report usage at field level for supported structured Payload relationships
- Block deletion entirely when a media asset is still referenced
- Keep support explicit to known structured relationship fields, not arbitrary code-only references
- Do not add DAM-style features such as folders, bulk archival, duplicate detection, or automatic replacement propagation

---

### Task 1: Build The Media Usage Resolver

**Files:**
- Create: `src/lib/mediaUsage.ts`
- Create: `tests/int/media-governance.int.spec.ts`
- Modify: `src/collections/Media.ts`

**Interfaces:**
- Consumes: existing `media` relationship fields in `src/collections/Pages.ts`, `src/collections/Articles.ts`, `src/collections/Reviews.ts`, `src/globals/SiteSettings.ts`, `src/globals/SEOSettings.ts`, `src/blocks/systemPageFields.ts`, `src/blocks/Hero36/config.ts`, `src/blocks/ContentSpotlight/config.ts`, `src/blocks/Footer2/config.ts`, and `src/blocks/HeaderNavbar12/config.ts`
- Produces: `type MediaUsageReference`, `findMediaUsage(...)`, `buildMediaUsageSummary(...)`, `mediaUsageAdminFieldConfig`

- [ ] Add a failing test that calls a new `findMediaUsage` helper against representative collection/global documents and expects field-level usage rows like `featuredImage`, `ogImage`, `logo`, and nested block image paths.
- [ ] Implement `src/lib/mediaUsage.ts` with one explicit resolver map per supported surface instead of generic recursive scanning.
- [ ] Add read-only `usageSummary` and `usageDetails` field definitions to `src/collections/Media.ts`, using the resolver output shape the test expects.
- [ ] Run `pnpm vitest tests/int/media-governance.int.spec.ts`
- [ ] Commit the resolver-only slice.

### Task 2: Wire Governance Fields And Delete Guard

**Files:**
- Create: `src/hooks/preventMediaDeletionWhileInUse.ts`
- Modify: `src/collections/Media.ts`
- Modify: `tests/int/media-governance.int.spec.ts`

**Interfaces:**
- Consumes: `findMediaUsage(...)`, `buildMediaUsageSummary(...)`
- Produces: `preventMediaDeletionWhileInUse`, `isCriticalAsset`, `replacementNotes`, hydrated read-only usage fields on media docs

- [ ] Add failing tests that assert referenced assets throw a readable delete error and unused assets are still deletable.
- [ ] Implement `preventMediaDeletionWhileInUse.ts` as a `beforeDelete` collection hook that resolves usage and throws with formatted locations when references exist.
- [ ] Extend `src/collections/Media.ts` with `isCriticalAsset`, `replacementNotes`, the new delete hook, and admin-only usage field wiring so operators can inspect asset usage from the media record.
- [ ] Re-run `pnpm vitest tests/int/media-governance.int.spec.ts`
- [ ] Commit the collection-and-hook slice.

### Task 3: Refresh Generated Artifacts And Regressions

**Files:**
- Modify: `src/payload-types.ts`
- Modify: `src/app/(payload)/admin/importMap.js` only if Payload regenerates it
- Modify: `tests/int/articles.int.spec.ts` only if schema assertions need to tolerate media governance fields
- Modify: `tests/int/reviews.int.spec.ts` only if schema assertions need to tolerate media governance fields
- Modify: `tests/int/adminCapabilities.int.spec.ts` only if media admin visibility expectations need coverage

**Interfaces:**
- Consumes: updated `media` collection schema and hooks
- Produces: regenerated Payload types and regression coverage for supported usage surfaces and delete blocking behavior

- [ ] Regenerate Payload artifacts so `src/payload-types.ts` reflects the new media governance fields.
- [ ] Keep or add regression assertions for the `media` collection admin schema, supported usage details, and delete-blocking behavior.
- [ ] Run `pnpm vitest tests/int/media-governance.int.spec.ts tests/int/articles.int.spec.ts tests/int/reviews.int.spec.ts`
- [ ] Run `pnpm test`
- [ ] Commit the verification-and-artifacts slice.
