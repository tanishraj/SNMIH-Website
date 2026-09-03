# Media Upload Size Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow Payload admin media uploads up to 10 MiB without hitting Next.js's default 1 MB Server Action boundary.

**Architecture:** A small shared configuration module owns the editor-facing file limit and the larger transport allowance. Next.js consumes the 12 MB Server Action limit, while Payload consumes the exact 10 MiB upload validator with truncation disabled.

**Tech Stack:** Next.js 16.2, Payload CMS 3.85, TypeScript, Vitest

## Global Constraints

- The editor-facing maximum media file size is exactly `10 * 1024 * 1024` bytes.
- The Next.js Server Action request-body allowance is `12mb` to include multipart overhead.
- Payload must reject oversized files with HTTP 413 behavior instead of truncating them.
- Existing local-disk and S3 storage selection must remain unchanged.
- No new dependencies, MIME-type changes, or compression behavior.

---

## File Structure

- Create `src/config/uploadLimits.ts`: typed shared constants and Payload upload options.
- Modify `next.config.ts`: export the base config for testing and apply the Server Action transport limit.
- Modify `src/payload.config.ts`: apply the shared Payload upload options.
- Create `tests/int/media-upload-limits.int.spec.ts`: verify the two coordinated boundaries.

### Task 1: Coordinate Next.js and Payload upload limits

**Files:**
- Create: `src/config/uploadLimits.ts`
- Modify: `next.config.ts`
- Modify: `src/payload.config.ts`
- Create: `tests/int/media-upload-limits.int.spec.ts`

**Interfaces:**
- Consumes: Next.js `NextConfig` and Payload `Config['upload']`.
- Produces: `MAX_MEDIA_UPLOAD_BYTES`, `SERVER_ACTION_BODY_SIZE_LIMIT`, `payloadUploadConfig`, and a named `nextConfig` export.

- [ ] **Step 1: Write the failing configuration contract test**

Create `tests/int/media-upload-limits.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { nextConfig } from '../../next.config'
import {
  MAX_MEDIA_UPLOAD_BYTES,
  payloadUploadConfig,
  SERVER_ACTION_BODY_SIZE_LIMIT,
} from '@/config/uploadLimits'

describe('media upload limits', () => {
  it('allows multipart overhead above the editor-facing file limit', () => {
    expect(SERVER_ACTION_BODY_SIZE_LIMIT).toBe('12mb')
    expect(nextConfig.experimental?.serverActions).toMatchObject({
      bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT,
    })
  })

  it('rejects Payload uploads above exactly 10 MiB', () => {
    expect(MAX_MEDIA_UPLOAD_BYTES).toBe(10 * 1024 * 1024)
    expect(payloadUploadConfig).toEqual({
      abortOnLimit: true,
      limits: { fileSize: MAX_MEDIA_UPLOAD_BYTES },
    })
  })
})
```

- [ ] **Step 2: Run the test and verify the missing configuration boundary**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-upload-limits.int.spec.ts
```

Expected: FAIL because `src/config/uploadLimits.ts` and the named `nextConfig` export do not exist.

- [ ] **Step 3: Add the typed shared upload limits**

Create `src/config/uploadLimits.ts`:

```ts
import type { Config } from 'payload'

export const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024
export const SERVER_ACTION_BODY_SIZE_LIMIT = '12mb' as const

export const payloadUploadConfig = {
  abortOnLimit: true,
  limits: {
    fileSize: MAX_MEDIA_UPLOAD_BYTES,
  },
} satisfies NonNullable<Config['upload']>
```

- [ ] **Step 4: Apply the transport allowance in Next.js**

In `next.config.ts`, import the shared value:

```ts
import { SERVER_ACTION_BODY_SIZE_LIMIT } from './src/config/uploadLimits'
```

Change the existing declaration from `const nextConfig` to a named export and insert the Server Action option before `output`:

```ts
export const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT,
    },
  },
  output: 'standalone',
}
```

Keep the existing default export:

```ts
export default withPayload(nextConfig, { devBundleServerPackages: false })
```

- [ ] **Step 5: Apply the authoritative Payload limit**

In `src/payload.config.ts`, import:

```ts
import { payloadUploadConfig } from './config/uploadLimits'
```

Add the option beside the existing root-level `secret` and `typescript` options:

```ts
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  upload: payloadUploadConfig,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
```

- [ ] **Step 6: Format and run focused verification**

Run:

```bash
pnpm exec prettier --write next.config.ts src/config/uploadLimits.ts src/payload.config.ts tests/int/media-upload-limits.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-upload-limits.int.spec.ts tests/int/runtime-config.int.spec.ts tests/int/media-storage.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint next.config.ts src/config/uploadLimits.ts src/payload.config.ts tests/int/media-upload-limits.int.spec.ts
```

Expected: all tests pass, TypeScript exits successfully, and ESLint reports no errors.

- [ ] **Step 7: Commit the verified fix**

```bash
git add next.config.ts src/config/uploadLimits.ts src/payload.config.ts tests/int/media-upload-limits.int.spec.ts
git commit -m "fix(media): allow 10 MiB uploads"
```

- [ ] **Step 8: Record the runtime handoff**

Tell the operator to restart `pnpm dev` because Next.js reads `next.config.ts` at startup. The acceptance check is: a file below 10 MiB uploads successfully, while a file above 10 MiB is rejected by Payload rather than the Next.js 1 MB Server Action boundary.
