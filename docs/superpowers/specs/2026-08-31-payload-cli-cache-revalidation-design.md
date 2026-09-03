# Payload CLI Cache Revalidation Safety Design

## Context

The restored local MongoDB database has an empty Payload migration ledger. Running `pnpm payload migrate` successfully applied `20260829_000000_rename_snmih_theme_values`, then stopped in `20260831_000000_provision_legal_pages` while creating the published Privacy Policy page. The Page `afterChange` cache hook called Next.js `revalidateTag` from the standalone Payload CLI, where no Next.js static-generation store exists.

The failed run left a recoverable partial state:

- the theme migration is recorded as complete;
- the Privacy Policy page and one version exist;
- the legal-page migration is not recorded as complete;
- all 78 stored Department Profiles blocks still use the legacy flat profile array.

The legal-page migration is already resumable because it looks up each legal page by slug before creating it.

## Goal

Allow trusted maintenance operations such as Payload migrations to suppress Page cache revalidation explicitly, without changing cache behavior for normal Admin, API, or application writes. Then resume the official migration runner and verify that the Department Profiles data is nested without losing profile entries.

## Approaches Considered

### 1. Explicit hook context flag — selected

Add a narrowly scoped `skipCacheRevalidation` context contract to the Page cache hook. The legal-page migration supplies the flag alongside its existing `systemProvisioning` context.

This keeps the normal Payload create path, validation, versions, and other hooks intact. Only the Next.js cache side effect is suppressed for the explicitly marked operation.

### 2. Catch missing Next.js request-context errors

The hook could catch the `static generation store missing` error. This is rejected because it would depend on an internal error message and could hide genuine revalidation failures during normal runtime operations.

### 3. Bypass Payload and edit MongoDB directly

The legal page or Department Profiles records could be modified with direct MongoDB commands. This is rejected because it would bypass Payload validation and version behavior and could leave the migration ledger inconsistent with the database.

## Design

`src/hooks/revalidateCmsContent.ts` will expose one shared context key and make `revalidatePagesCache` return the document without calling `revalidateTag` when that key is explicitly `true`. Published and unpublished transitions without the flag retain their current behavior.

`src/migrations/20260831_000000_provision_legal_pages.ts` will pass the flag only when it creates a missing legal page. Its existing `systemProvisioning` marker remains in place for editorial-workflow handling.

The retry uses `pnpm payload migrate`. Payload will skip the recorded theme migration, rerun legal-page provisioning, reuse the existing Privacy Policy page, create the missing Terms and Conditions page, update empty Site Settings relationships, and then run the Department Profiles nesting migration.

No migration ledger entries will be inserted manually, and no direct database rewrite will be used.

## Error Handling and Recovery

The pre-migration Atlas archive remains the rollback source. The Department Profiles migration validates every matching layout before issuing its bulk writes, including missing department IDs, duplicate department IDs, mixed flat/nested state, and profiles pointing to missing departments.

If the retry fails, execution stops and the database is audited again before any further action. The migration runner's ledger determines which completed migrations may be skipped on the next retry.

## Verification

Focused tests will confirm:

- a published Page write with the explicit context flag does not call `revalidateTag`;
- normal published Page changes still invalidate Page and sitemap tags;
- legal-page creation supplies both the workflow provisioning marker and the cache bypass flag;
- the Department Profiles transformation contract remains green.

After the retry, a read-only MongoDB audit will require:

- all three registered migrations present in `payload-migrations`;
- both legal-page slugs present exactly once;
- 78 Department Profiles blocks in nested state;
- zero legacy-flat or mixed Department Profiles blocks;
- 1,285 total profile entries preserved across current documents and historical versions, including 80 entries in the two current Page blocks.

Finally, the repository project-context update/check loop and affected tests will run. No changes will be committed.
