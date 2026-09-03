# Open Graph AVIF Renderer Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Next.js Open Graph prerendering from crashing when the Payload site logo is AVIF.

**Architecture:** Keep the existing bounded remote-logo fetch and dynamic Open Graph layouts. Normalize successful AVIF responses to a PNG data URL with the existing `sharp` dependency before they reach `ImageResponse`; conversion failures continue through the existing local fallback path.

**Tech Stack:** Next.js 16.2.10 `ImageResponse`, TypeScript, Sharp 0.34.5, Vitest

## Global Constraints

- Change only the Open Graph remote-logo rendering path.
- Preserve PNG, JPEG, GIF, SVG, and WebP response bytes and MIME types.
- Preserve the three-second request timeout and existing fallback behavior.
- Do not change Payload schema, media storage, CDN caching, `next/image`, or Open Graph layouts.

---

### Task 1: Normalize AVIF logos before Open Graph rendering

**Files:**
- Create: `tests/int/open-graph-image-renderer.int.spec.tsx`
- Modify: `src/lib/openGraphImages.tsx`
- Modify: `tests/int/news-events-opengraph-image.int.spec.tsx`
- Modify: `tests/int/open-graph-images.int.spec.tsx`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: `loadOpenGraphRemoteImage(image, { fetcher?, timeoutMs? })` and fetched `image/avif` bytes.
- Produces: the existing `OpenGraphMediaImage | undefined` contract, with AVIF sources returned as `data:image/png;base64,...`.

- [x] **Step 1: Add failing AVIF normalization and real-renderer tests**

In `tests/int/open-graph-images.int.spec.tsx`, generate a valid AVIF buffer with `sharp`, return it from the injected fetcher, and assert the loader produces a PNG data URL. In the new Node-environment `tests/int/open-graph-image-renderer.int.spec.tsx`, pass that normalized source into the real `ImageResponse`, consume `response.arrayBuffer()`, and assert the PNG signature `[137, 80, 78, 71]`.

- [x] **Step 2: Run the focused tests and verify the regression fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/open-graph-images.int.spec.tsx tests/int/open-graph-image-renderer.int.spec.tsx
```

Expected: the AVIF normalization assertion fails because the loader still returns `data:image/avif`; the real renderer reproduces `TypeError: u2 is not iterable`.

- [x] **Step 3: Implement AVIF-to-PNG normalization**

In `src/lib/openGraphImages.tsx`, import `sharp`, keep the response body as a `Buffer`, and normalize only AVIF:

```ts
const normalizeOpenGraphImage = async ({
  contentType,
  data,
}: {
  contentType: string
  data: Buffer
}): Promise<{ contentType: string; data: Buffer }> => {
  if (contentType !== 'image/avif') {
    return { contentType, data }
  }

  return {
    contentType: 'image/png',
    data: await sharp(data).png().toBuffer(),
  }
}
```

Call it inside the existing `try` block before base64 encoding. A Sharp failure must be caught by the existing catch and return `undefined`.

- [x] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/open-graph-images.int.spec.tsx tests/int/open-graph-image-renderer.int.spec.tsx tests/int/opengraph-fallback-routes.int.spec.tsx tests/int/news-events-opengraph-image.int.spec.tsx
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all commands pass.

- [x] **Step 5: Update and check project context**

Document AVIF normalization in the Open Graph delivery note, then run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the deterministic inventory checksum updates and project context is current.

- [x] **Step 6: Verify the production build**

Run the worktree build with the root checkout's local environment file:

```bash
node --env-file="/Users/tanishraj/Tanishraj/Personal Projects/payload-cms-starter-kit/.env" -e "const { spawnSync } = require('node:child_process'); const result = spawnSync(process.execPath, ['--no-deprecation', '--max-old-space-size=8000', 'node_modules/next/dist/bin/next', 'build'], { env: process.env, stdio: 'inherit' }); process.exit(result.status ?? 1)"
```

Expected: static generation completes without an `/opengraph-image-*` prerender error.

- [x] **Step 7: Commit the verified fix**

```bash
git add .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-09-01-opengraph-avif-renderer-compatibility.md src/lib/openGraphImages.tsx tests/int/news-events-opengraph-image.int.spec.tsx tests/int/open-graph-image-renderer.int.spec.tsx tests/int/open-graph-images.int.spec.tsx
git commit -m "fix(og): normalize AVIF logos"
```
