# Media Upload Size Limit Design

## Problem

Payload admin media uploads currently inherit Next.js's default 1 MB Server Action request-body limit. Files larger than that are rejected by Next.js before Payload can validate or store them.

## Design

The CMS will allow media files up to 10 MiB (`10 * 1024 * 1024` bytes).

- `next.config.ts` will set `experimental.serverActions.bodySizeLimit` to `12mb`. This is a transport allowance, not the editor-facing file limit. The additional capacity covers multipart form fields and request framing for a 10 MiB file.
- `src/payload.config.ts` will set Payload's global upload limit to 10 MiB and enable `abortOnLimit`. Payload remains the authoritative file-size validator and returns an HTTP 413 response for oversized files.
- Existing storage behavior remains unchanged. Local-disk uploads continue through Payload. S3 deployments may still use the existing `S3_CLIENT_UPLOADS` option for direct uploads.

## Error Handling

Files above 10 MiB will be rejected by Payload rather than being truncated. Requests that exceed the larger 12 MB transport allowance will still be rejected by Next.js as a resource-protection boundary.

## Verification

A focused integration test will inspect the exported Next and Payload configurations and assert:

- the Server Action body limit is `12mb`;
- Payload aborts when the upload limit is exceeded;
- Payload's file-size limit is exactly `10 * 1024 * 1024` bytes.

TypeScript, the focused test, and the existing runtime configuration tests must pass. The development server must be restarted before the new Next.js setting takes effect.

## Scope

This change does not add image compression, change accepted MIME types, alter storage providers, or raise any deployment-platform request limit.
