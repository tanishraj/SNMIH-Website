# Cloudflare R2 Media Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure the existing Payload S3 storage path for Cloudflare R2 uploads and direct, cached delivery from `assets.snmih.tanish.im`.

**Architecture:** Keep `MEDIA_PROVIDER=s3`, add a shared public-origin helper, and expose the validated origin to both Payload's `generateFileURL` callback and Next.js image remote patterns. Represent an omitted S3 ACL as `null` in runtime configuration so the R2 client never sends an unsupported ACL header while explicit legacy ACLs remain available.

**Tech Stack:** TypeScript 5.7, Payload CMS 3.85.2, `@payloadcms/storage-s3` 3.85.2, Next.js 16.2, Vitest 4, Cloudflare R2.

## Global Constraints

- Do not commit any implementation or planning changes.
- Keep the provider selector as `MEDIA_PROVIDER=s3`; do not add an R2-specific dependency.
- Use `https://assets.snmih.tanish.im` as the production public media origin.
- Use R2 region `auto`, path-style addressing, server-side uploads, and `S3_ACL=none`.
- Treat every object in the public bucket as unrestricted public content, including objects whose Payload records are drafts.
- Leave the user's live `.env` secrets untouched until real R2 credentials and the account endpoint are available.
- No Payload schema migration, generated type change, Cloudflare Images transformation, or direct browser upload is part of this implementation.

---

### Task 1: Shared public media URL contract

**Files:**

- Create: `src/config/mediaPublicURL.ts`
- Modify: `src/config/runtime.ts`
- Create: `tests/int/media-public-url.int.spec.ts`
- Modify: `tests/int/runtime-config.int.spec.ts`

**Interfaces:**

- Produces: `normalizeMediaPublicURL(value: string | undefined): string | null`.
- Produces: `buildMediaPublicURL({ filename, prefix, publicURL }): string`.
- Produces: `getMediaRemotePattern(value: string | undefined): RemotePattern | null`.
- Changes S3 runtime media fields to `acl: 'private' | 'public-read' | null` and `publicURL: string | null`.

- [x] **Step 1: Add failing URL helper and runtime tests**

Cover normalization of a trailing slash, rejection of HTTP/credentials/query/fragment/path values,
encoding of prefix and filename path segments, construction of an HTTPS `/**` remote pattern,
`S3_ACL=none`, default ACL omission, explicit legacy ACL preservation, and R2 public URL parsing.

- [x] **Step 2: Run the focused tests and confirm they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-public-url.int.spec.ts tests/int/runtime-config.int.spec.ts
```

Expected: failures because `mediaPublicURL.ts`, `publicURL`, nullable ACL behavior, and URL validation do not exist.

- [x] **Step 3: Implement the URL helpers and runtime parsing**

Use this contract in `src/config/mediaPublicURL.ts`:

```ts
export type MediaRemotePattern = {
  hostname: string
  pathname: '/**'
  port: string
  protocol: 'https'
}

const invalidPublicURLError = (): Error =>
  new Error(
    'Invalid S3_PUBLIC_URL. Use an HTTPS origin without credentials, path, query, or fragment.',
  )

export const normalizeMediaPublicURL = (value: string | undefined): string | null => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) return null

  let parsedURL: URL

  try {
    parsedURL = new URL(trimmedValue)
  } catch {
    throw invalidPublicURLError()
  }

  if (
    parsedURL.protocol !== 'https:' ||
    parsedURL.username ||
    parsedURL.password ||
    parsedURL.pathname !== '/' ||
    parsedURL.search ||
    parsedURL.hash
  ) {
    throw invalidPublicURLError()
  }

  return parsedURL.origin
}

export const buildMediaPublicURL = ({
  filename,
  prefix,
  publicURL,
}: {
  filename: string
  prefix?: string
  publicURL: string
}): string => {
  const normalizedPublicURL = normalizeMediaPublicURL(publicURL)
  if (!normalizedPublicURL) throw invalidPublicURLError()

  const objectKey = [prefix, filename]
    .flatMap((segment) => segment?.split('/') ?? [])
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${normalizedPublicURL}/${objectKey}`
}

export const getMediaRemotePattern = (value: string | undefined): MediaRemotePattern | null => {
  const publicURL = normalizeMediaPublicURL(value)
  if (!publicURL) return null

  const parsedURL = new URL(publicURL)

  return {
    hostname: parsedURL.hostname,
    pathname: '/**',
    port: parsedURL.port,
    protocol: 'https',
  }
}
```

In `getRuntimeConfig`, parse blank or `none` ACL as `null`, retain `private` and `public-read`, reject
anything else with `Unsupported S3_ACL. Use "none", "public-read", or "private".`, and normalize
`S3_PUBLIC_URL` into `publicURL`.

- [x] **Step 4: Run the focused tests and confirm they pass**

Run the Task 1 Vitest command. Expected: all URL helper and runtime configuration tests pass.

### Task 2: Payload S3 adapter composition

**Files:**

- Modify: `src/config/providers.ts`
- Modify: `tests/int/provider-selection.int.spec.ts`

**Interfaces:**

- Consumes: nullable `media.acl`, `media.publicURL`, and `buildMediaPublicURL` from Task 1.
- Produces: an S3 options object that omits `acl` when null and uses direct public URLs only when configured.

- [x] **Step 1: Add failing provider tests**

Keep the explicit legacy `public-read` case with `collections.media === true`. Add an R2 case with
`acl: null` and `publicURL: 'https://assets.snmih.tanish.im'` that asserts:

```ts
expect(storageOptions).not.toHaveProperty('acl')
expect(storageOptions.collections.media).toMatchObject({
  disablePayloadAccessControl: true,
})
expect(
  storageOptions.collections.media.generateFileURL({
    filename: 'Campus image.PNG',
    prefix: 'school events',
  }),
).toBe('https://assets.snmih.tanish.im/school%20events/Campus%20image.PNG')
```

- [x] **Step 2: Run the provider test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/provider-selection.int.spec.ts
```

Expected: failure because the adapter always supplies an ACL and has no public URL callback.

- [x] **Step 3: Implement conditional adapter options**

Type the options as `Parameters<typeof s3Storage>[0]`. Use `collections: { media: true }` without a
public origin; otherwise use `disablePayloadAccessControl: true` and a `generateFileURL` callback
that calls `buildMediaPublicURL`. Add `storageOptions.acl` only when runtime ACL is non-null.

- [x] **Step 4: Run the provider test and confirm it passes**

Run the Task 2 Vitest command. Expected: legacy and R2 adapter cases pass.

### Task 3: Next.js remote image allow-list

**Files:**

- Modify: `next.config.ts`
- Modify: `tests/int/media-public-url.int.spec.ts`

**Interfaces:**

- Consumes: `getMediaRemotePattern(process.env.S3_PUBLIC_URL)` from Task 1.
- Produces: `nextConfig.images.remotePatterns` containing the configured HTTPS media origin.

- [x] **Step 1: Add a failing Next config assertion**

Set `S3_PUBLIC_URL=https://assets.snmih.tanish.im`, reset modules, dynamically import
`../../next.config`, and expect:

```ts
expect(nextConfig.images?.remotePatterns).toContainEqual({
  hostname: 'assets.snmih.tanish.im',
  pathname: '/**',
  port: '',
  protocol: 'https',
})
```

- [x] **Step 2: Run the URL test and confirm it fails**

Run the Task 1 Vitest command. Expected: the helper assertions pass but the Next config lacks the
remote pattern.

- [x] **Step 3: Add the conditional remote pattern**

Compute the pattern once at module load and retain the current local media pattern:

```ts
const mediaRemotePattern = getMediaRemotePattern(process.env.S3_PUBLIC_URL)

images: {
  localPatterns: [{ pathname: '/api/media/file/**' }],
  remotePatterns: mediaRemotePattern ? [mediaRemotePattern] : [],
},
```

- [x] **Step 4: Run the URL and existing upload-limit tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-public-url.int.spec.ts tests/int/media-upload-limits.int.spec.ts
```

Expected: both files pass.

### Task 4: Operator contract and project knowledge

**Files:**

- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/operations/runtime-and-providers.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Potential generated update: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Documents: R2 endpoint format, region `auto`, `S3_ACL=none`, public URL, custom-domain caching,
  public-by-URL security boundary, server-side upload default, DNS/cutover checks, and rollback.

- [x] **Step 1: Replace the iDrive-specific example with an R2 example**

Document these non-secret values while keeping credentials as placeholders:

```dotenv
# S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
# S3_REGION=auto
# S3_PUBLIC_URL=https://assets.snmih.tanish.im
# S3_ACL=none
# S3_FORCE_PATH_STYLE=true
# S3_CLIENT_UPLOADS=false
```

- [x] **Step 2: Update README and the runtime runbook**

Add `S3_PUBLIC_URL`, list `S3_ACL=none | public-read | private`, explain that R2 direct delivery
bypasses Payload object access checks, and include setup/cutover/cache/rollback steps without real
secrets.

- [x] **Step 3: Update the maintained architecture provider contract**

State that S3-compatible storage may supply a validated public origin, causing Payload URLs and
Next.js image loading to use direct CDN delivery while uploads and reconciliation continue through
the authenticated S3 endpoint.

- [x] **Step 4: Run project-context generation and inspect the routed diff**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/project-inventory.json
pnpm project-context:check
```

Expected: update/check pass; only generated facts that truly changed remain in the inventory diff.

### Task 5: Complete verification and handoff

**Files:**

- Verify all modified files.

**Interfaces:**

- Produces: an uncommitted, tested R2-ready repository diff and an operator list of values still required.

- [x] **Step 1: Format changed files**

Run Prettier only on the changed TypeScript, Markdown, and environment example files.

- [x] **Step 2: Run focused and full static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/runtime-config.int.spec.ts tests/int/provider-selection.int.spec.ts tests/int/media-public-url.int.spec.ts tests/int/media-storage.int.spec.ts tests/int/starter-productization.int.spec.ts tests/int/docker-standalone.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm project-context:check
```

Expected: every command exits zero.

- [x] **Step 3: Run the production build**

Run `pnpm build`. Expected: the Next.js production build completes successfully.

- [x] **Step 4: Inspect the final change impact**

Read `.agents/skills/project-context/references/change-impact-map.md` again, run
`git diff --check`, `git diff --stat`, and `git status --short`, and confirm there are no staged or
committed implementation changes.

- [x] **Step 5: Hand off Cloudflare prerequisites**

Report the exact uncommitted files, verification results, and the still-required Cloudflare account
ID, bucket name, access key ID, secret access key, DNS activation, custom-domain connection, and
cache rule. Do not print or request secret values in chat; direct the user to place them in `.env`
or deployment environment settings.
