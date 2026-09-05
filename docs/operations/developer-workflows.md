# Developer Workflows

## Application Commands

| Command                                                     | Purpose                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                                  | Start Next.js development mode                                   |
| `pnpm devsafe`                                              | Remove `.next` and start development; use for stale build output |
| `pnpm build`                                                | Create the production Next.js build                              |
| `pnpm start`                                                | Serve an existing production build                               |
| `pnpm lint`                                                 | Run ESLint across the repository                                 |
| `pnpm payload`                                              | Run the Payload CLI                                              |
| `pnpm generate:types`                                       | Regenerate `src/payload-types.ts` after schema changes           |
| `pnpm generate:importmap`                                   | Regenerate the Payload admin import map                          |
| `pnpm test:int`                                             | Run Vitest integration/component tests                           |
| `pnpm test:e2e`                                             | Run Playwright Admin/frontend journeys                           |
| `pnpm test`                                                 | Run integration tests, then E2E tests                            |
| `pnpm report:permissions-migration -- --database-uri <uri>` | Preview the two-role migration without writing data              |

Run type and import-map generation after changing collections, globals, fields, blocks, or custom Admin components.

## Test Safety

Tests load environment configuration. Use an isolated MongoDB database: E2E helpers seed and delete known test users and homepage content. Never point the test commands at a production or irreplaceable staging database.

Install a browser before the first E2E run:

```bash
pnpm exec playwright install chromium
```

## Database Export

`pnpm export:db` loads `.env`, requires `MONGODB_URI`, and invokes the external `mongodump`
executable. When `DATABASE_NAME` is set, the export passes it explicitly to `mongodump` so the
archive matches the database selected by the application. It writes a gzip archive named
`backups/payload-db-<timestamp>.archive`.

```bash
pnpm export:db
```

Install MongoDB Database Tools first. Treat archives as sensitive production data, store them in
approved encrypted external storage, keep them out of source control, and verify a restore procedure
separately before relying on them.

Deleting an archive from the working tree does not remove it from Git history. If an archive was ever
tracked, inspect its contents, rotate any affected credentials, notify collaborators, and schedule a
coordinated history rewrite separately. Do not rewrite shared history as part of an ordinary export or
release task.

## Legal Pages

The checked-in Payload migration `20260831_000000_provision_legal_pages` provisions published
`/privacy-policy` and `/terms-and-conditions` Pages only when those exact slugs do not already exist.
It connects only empty relationships under **Site Identity → Legal**. Existing Pages—including
drafts—and existing published or pending relationship choices remain unchanged.

After deployment:

1. review both Pages with qualified Indian legal counsel against the institution's actual website
   and data practices
2. edit copy through **Content → Pages** and use the native draft/publication controls
3. select the public Pages under **Site Identity → Legal** if a different relationship is required
4. update the displayed last-updated date whenever legal copy changes
5. verify the configured footer and Cookie Consent Banner link to the intended Pages

The draft copy covers website activity only. It is not a clinical patient-record privacy notice,
medical consent form, or admissions contract. Migration rollback is intentionally non-destructive:
`payload migrate:down` does not unlink or delete provisioned legal content. Export the database and
confirm `MONGODB_URI` targets the intended environment before running deployment migrations.

## Two-Role Permission Migration

The `20260902_000000_two_role_feature_permissions` migration converts legacy roles and capability
overrides into the Admin/Site Manager model, removes retired workflow fields, preserves public
content only when it was both published and in the published legacy workflow state, and assigns a
source feature to Action Queue records. It stores hidden rollback data and is idempotent.

Always preview the proposed role, grant, content, and queue changes against a backup or local clone:

```bash
pnpm report:permissions-migration -- --database-uri 'mongodb://127.0.0.1:27017/payload-cms-starter-kit'
```

The reporter is read-only and masks credentials in its output. Review all conservative grant
disagreements and unmapped queue records. Export the target database, obtain explicit production
approval, and only then run `pnpm payload migrate` with the intended `MONGODB_URI`.

## Office Migration

`pnpm migrate:offices` moves legacy site-office data into the `office-locations` collection. Before running it:

1. export the database
2. confirm `MONGODB_URI` targets the intended environment
3. run the migration once
4. inspect and publish migrated Office Locations
5. verify every Regional Offices block

## Block Thumbnails

`pnpm generate:block-thumbnails` uses Playwright to capture the development-only preview route and writes JPEGs to `public/block-thumbnails`.

Optional variables:

| Variable                   | Purpose                                                                          |
| -------------------------- | -------------------------------------------------------------------------------- |
| `BLOCK_THUMBNAIL_SLUG`     | Generate one known block slug instead of all previews                            |
| `BLOCK_THUMBNAIL_BASE_URL` | Reuse an already running development server; defaults to `http://localhost:3000` |
| `BLOCK_THUMBNAIL_PORT`     | Port for the script-managed server; defaults to `3199`                           |

Examples:

```bash
pnpm generate:block-thumbnails
BLOCK_THUMBNAIL_SLUG=heroBanner pnpm generate:block-thumbnails
BLOCK_THUMBNAIL_BASE_URL=http://localhost:3000 pnpm generate:block-thumbnails
```

The preview route returns 404 outside development.

## Media Storage Reconciliation

Configure `MEDIA_RECONCILE_TOKEN`, then call:

```bash
curl -X POST \
  -H "Authorization: Bearer $MEDIA_RECONCILE_TOKEN" \
  https://example.com/api/operations/media/reconcile-storage
```

The endpoint also accepts `x-media-reconcile-token`. It returns counts for `scanned`, `updated`, `healthy`, `missing`, `checkFailed`, and `localOnly`. One call scans at most 1,000 records. A missing token configuration returns 503; a wrong token returns 401.

For local disk, reconciliation marks records `local_only`. For S3, it checks each object, updates read-only storage fields, and records missing/restored operational events. Run it through a trusted scheduler or operator process; never embed the token in browser code.
