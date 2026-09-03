# Hero Banner Fetch Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the first renderable production Hero Banner emits explicit high fetch priority while preserving its responsive Next.js preload and moving production originals to the configured R2 public origin.

**Architecture:** Keep preload ownership in the existing recursive production block renderer, where only the first valid Hero Banner is selected. The Hero Banner component will derive both `preload` and `fetchPriority="high"` from that single flag. R2 delivery remains configuration-driven through `S3_PUBLIC_URL`; no media schema or stored relationship changes are required.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3, TypeScript, Vitest, Cloudflare R2, Vercel.

## Global Constraints

- Only the first renderable production Hero Banner may be preloaded or assigned high fetch priority.
- Live preview and later Hero Banners must not receive high priority.
- Preserve responsive `next/image` optimization and `sizes="100vw"`.
- Production media originals must use `https://assets.snmih.tanish.im`, not `/api/media/file/**`.
- Do not change the Payload schema or database records.
- Do not commit any changes.

---

### Task 1: Couple Hero preload and fetch priority

**Files:**
- Modify: `tests/int/hero-banner-render.int.spec.ts`
- Modify: `tests/int/hero-banner-preload.int.spec.tsx`
- Modify: `src/blocks/HeroBanner/Component.tsx`

**Interfaces:**
- Consumes: existing `preload?: boolean` assigned by `renderPageBlocks()`.
- Produces: a Next Image whose preload resource and rendered image carry `fetchPriority="high"` only when `preload` is true.

- [ ] **Step 1: Add failing rendering assertions**

Extend the direct Hero Banner test with:

```ts
expect(eager.match(/fetchPriority="high"/g)).toHaveLength(2)
expect(lazy).not.toContain('fetchPriority="high"')
```

Extend the recursive selection test with:

```ts
expect(html.match(/fetchPriority="high"/g)).toHaveLength(2)
expect(html).toMatch(/<img[^>]+fetchPriority="high"[^>]+nested\.jpg/)
```

The two expected occurrences are the responsive preload resource and its matching `<img>`.

- [ ] **Step 2: Run the focused tests and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-banner-render.int.spec.ts tests/int/hero-banner-preload.int.spec.tsx
```

Expected: existing preload assertions pass, while the new `fetchPriority="high"` assertions fail.

- [ ] **Step 3: Add explicit high fetch priority to the selected image**

Update the Hero Banner `Image` invocation:

```tsx
<Image
  fill
  alt={image.alt}
  className="object-cover"
  fetchPriority={preload ? 'high' : undefined}
  preload={preload}
  sizes="100vw"
  src={image.src}
/>
```

Do not add `loading="eager"`; Next.js already makes a preloaded image non-lazy, and combining explicit loading behavior adds no value.

- [ ] **Step 4: Run Hero and renderer regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-banner-render.int.spec.ts tests/int/hero-banner-preload.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx
```

Expected: all tests pass, exactly one production Hero Banner emits a preload and explicit high priority, and preview rendering remains valid.

---

### Task 2: Complete the R2 production-origin rollout

**Files:**
- Verify only: `.env.example`, `next.config.ts`, `src/config/providers.ts`, `docs/operations/runtime-and-providers.md`
- Production configuration: Vercel environment variable `S3_PUBLIC_URL`

**Interfaces:**
- Consumes: validated `S3_PUBLIC_URL` in `getRuntimeConfig()` and `getMediaRemotePattern()`.
- Produces: Payload media URLs rooted at `https://assets.snmih.tanish.im` and a matching Next image remote allow-list.

- [ ] **Step 1: Confirm the repository contract is already configured**

Verify that `S3_PUBLIC_URL` drives both Payload `generateFileURL` and Next `remotePatterns`, and that `.env.example` documents:

```dotenv
S3_PUBLIC_URL=https://assets.snmih.tanish.im
```

Expected: no source change is required for R2 routing.

- [ ] **Step 2: Verify or set the production environment value**

Using the linked Vercel project, confirm Production contains exactly:

```dotenv
S3_PUBLIC_URL=https://assets.snmih.tanish.im
```

Do not print credentials or unrelated environment values. If the variable changes, trigger a production redeployment because `next.config.ts` reads it during the build.

- [ ] **Step 3: Verify deployed media routing after redeployment**

Fetch the public homepage HTML and verify:

```text
fetchpriority="high"
url=https%3A%2F%2Fassets.snmih.tanish.im%2FHero%2520Banner.avif
```

Reject the rollout if the Hero Banner still uses `url=%2Fapi%2Fmedia%2Ffile%2F`.

---

### Task 3: Refresh project context and run final checks

**Files:**
- Verify generated project context under `.agents/skills/project-context/references/`

**Interfaces:**
- Consumes: final source and test diff.
- Produces: synchronized project context or a verified no-op.

- [ ] **Step 1: Refresh and check maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands pass. The update should be a no-op because no structural inventory changes are introduced.

- [ ] **Step 2: Run static and diff verification**

Run:

```bash
pnpm exec tsc --noEmit
git diff --check
git status --short
```

Expected: TypeScript and whitespace checks pass, and all task changes remain uncommitted.
