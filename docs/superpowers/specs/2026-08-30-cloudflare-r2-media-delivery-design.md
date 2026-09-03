# Cloudflare R2 Media Delivery Design

## Goal

Replace the blocked iDrive E2 media backend with Cloudflare R2 and serve public website assets
through Cloudflare's edge network. Preserve the repository's generic S3 provider abstraction while
making images load directly from a production custom domain instead of through the application.

## Decision

Use one public R2 bucket connected to `assets.snmih.tanish.im`. Payload uploads to R2 through its
private S3-compatible endpoint, while browsers read files directly from the custom domain. The
repository continues to select `MEDIA_PROVIDER=s3`; R2 is configuration of that provider, not a new
provider type.

The alternatives were rejected for this migration:

- Proxying every file through Payload preserves collection access checks but adds an application
  hop and application resource usage to every uncached request.
- Splitting public images and private documents across two collections and buckets gives stronger
  isolation but expands the schema and migration before the current public-image outage is solved.

The selected bucket is therefore public-by-URL. Only assets safe for unrestricted public delivery
may be uploaded to it. If private media becomes a requirement, it will use a separate private
collection and bucket rather than weakening or complicating this delivery path.

## Architecture

```text
Payload Admin / server
        |
        | authenticated S3 API writes and deletes
        v
Cloudflare R2 bucket
        |
        | public custom-domain reads, cached at Cloudflare edge
        v
assets.snmih.tanish.im  --->  website visitors
```

- The R2 S3 endpoint uses the account-specific
  `https://<account-id>.r2.cloudflarestorage.com` origin, region `auto`, and path-style addressing.
- A bucket-scoped R2 token supplies only the read/write permissions required by Payload. Secrets
  remain in environment configuration and never enter source, documentation, logs, or browser
  bundles.
- The R2 custom domain is the canonical file origin. The rate-limited `r2.dev` development URL is
  disabled after the custom domain is verified.
- `tanish.im` DNS moves to Cloudflare without changing record values. Existing records are
  inventoried before the nameserver switch and verified after propagation.

## Runtime Configuration

Add an optional `S3_PUBLIC_URL` to the S3 runtime configuration. For R2 it is set to
`https://assets.snmih.tanish.im` and is normalized without a trailing slash. It must be an absolute
HTTPS origin with no credentials, query, fragment, or non-root path. An invalid value fails startup
with a targeted configuration error.

Make S3 ACL behavior explicit and optional:

- blank or `none` omits the ACL argument, which is required for R2 compatibility;
- `private` and `public-read` remain available for other S3-compatible providers; and
- the example R2 configuration uses `S3_ACL=none`.

Local-disk behavior and non-R2 S3 support remain intact. Server-side uploads remain the initial
default (`S3_CLIENT_UPLOADS=false`), avoiding a browser CORS dependency during the migration. A
future switch to direct browser uploads requires a narrowly scoped R2 CORS rule for the production
and preview admin origins.

## Payload and Next.js Integration

When `S3_PUBLIC_URL` is present, configure the `media` collection in the S3 storage adapter with:

- `disablePayloadAccessControl: true`, so generated media URLs do not point at Payload's file
  handler; and
- `generateFileURL`, joining the optional Payload prefix and filename to the validated public
  origin without changing the object key.

When `S3_PUBLIC_URL` is absent, retain the adapter's current generated URL and Payload file-handler
behavior. The ACL option is passed to the S3 adapter only when configured, so R2 requests never send
an unsupported ACL header.

Add the validated public origin to the Next.js image remote patterns while retaining the existing
local `/api/media/file/**` pattern. The remote pattern is derived from configuration rather than
hard-coding the production hostname, keeping preview and cloned deployments portable.

Payload collection metadata access still follows the existing collection access rules. Direct R2
objects do not: a person who knows an object URL can fetch it even when its Payload document is a
draft. This is an accepted property of the public-media design and must be stated in operations
documentation and the admin workflow.

## Cache Policy

Create a Cloudflare cache rule scoped only to `assets.snmih.tanish.im` and cache eligible static
asset responses at the edge. Use a 30-day edge TTL and a one-day browser TTL, preserving MIME type
and validators from R2. Do not apply an immutable one-year policy because existing CMS object keys
may be reused.

Prefer a new filename when replacing an asset. If an existing key must be overwritten, purge that
exact custom-domain URL from Cloudflare after the successful upload. Error responses, authenticated
application routes, and the R2 S3 API endpoint are outside the cache rule.

## Migration and Cutover

1. Inventory the current DNS zone before changing nameservers, then recreate and verify every
   existing DNS record in Cloudflare.
2. Create the R2 bucket, bucket-scoped token, custom domain, and cache rule.
3. Build a source manifest from the Payload media records, including original filenames, generated
   sizes, prefixes, expected MIME types, and object keys.
4. Copy readable objects from iDrive E2. For missing or inaccessible objects, use the collected
   local website image folder as the recovery source. Preserve exact object keys and set correct
   content types.
5. Compare the R2 object manifest with Payload's expected manifest. Do not cut over while required
   originals or generated sizes are missing.
6. Verify representative asset URLs through the custom domain, including filenames with spaces or
   punctuation, and confirm repeated requests are served from Cloudflare cache.
7. Update deployment environment variables and redeploy. Keep the former provider unchanged until
   the website and Payload Admin pass smoke checks.
8. Crawl all sitemap pages after deployment and confirm that every rendered image succeeds from the
   custom domain. Run the existing media reconciliation workflow and resolve any missing objects.

The 48 locally collected files are recovery material, not the authoritative migration manifest.
Payload records and their generated image variants define completeness.

## Failure Handling and Rollback

- Runtime validation stops deployment when the R2 endpoint, credentials, bucket, region, or public
  URL configuration is incomplete or malformed.
- Upload or delete failures remain visible to Payload and must not be treated as successful CMS
  operations.
- Migration copying is additive: do not delete source objects or local recovery files during setup
  or cutover.
- If CDN validation, admin uploads, or the page crawl fails, restore the previous deployment
  environment values and redeploy. DNS for the website remains on Cloudflare; only the media
  provider configuration is rolled back.
- Rotate the previously exposed iDrive E2 credentials independently of the R2 cutover.

## Verification

Repository verification will cover:

- runtime parsing and normalization of `S3_PUBLIC_URL`;
- rejection of malformed public origins and unsupported ACL values;
- omission of the ACL option for R2 and preservation of explicit legacy ACLs;
- public URL generation with and without prefixes;
- preservation of the local-disk and S3-without-public-URL paths;
- Next.js image allow-list behavior for the configured public origin;
- focused storage, provider-selection, runtime, documentation, TypeScript, lint, and build checks;
  and
- the project-context update/check loop required by the repository.

Operational verification will cover an authenticated admin upload, direct custom-domain fetch,
correct content type, cache behavior on a repeated request, responsive image rendering, deletion,
media reconciliation, and a crawl of every sitemap page.

## Repository Impact

Expected durable changes are limited to runtime configuration, S3 storage composition, Next.js
image configuration, environment examples, focused tests, active operations documentation, and
project-context knowledge. No Payload schema migration or generated-type change is expected.

## Out of Scope

- Cloudflare Images transformations or paid image-resizing products.
- Private or signed media delivery.
- Direct browser uploads during the initial cutover.
- Renaming legacy files or changing Payload media relationships.
- Deleting the iDrive E2 bucket or the local recovery folder.
