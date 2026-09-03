# Versioned Media Image URLs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each Payload-backed remote image a stable source-version query so replacing an object under the same filename produces a new Next.js optimizer cache key.

**Architecture:** Keep canonical media URLs unchanged for downloads, feeds, metadata, videos, and direct storage access. Add versioning only in `getMediaImageProps`, using a valid Payload `updatedAt` value for absolute HTTP(S) image URLs while leaving local/root-relative paths and incomplete records untouched. Route the remaining direct CMS `next/image` adapters through that shared resolver.

**Tech Stack:** TypeScript, Payload CMS media documents, Next.js Image, Vitest

## Global Constraints

- Preserve Next.js resizing and AVIF/WebP content negotiation.
- Do not change `minimumCacheTTL`, CDN policy, S3 object naming, or unavailable-image fallback behavior.
- Preserve root-relative local media paths exactly.
- Preserve existing query parameters and append the media version without overwriting them.

---

### Task 1: Version Payload-backed remote image sources

**Files:**
- Modify: `src/blocks/LogoStrip/Component.tsx`
- Modify: `src/blocks/MediaCarousel/Component.tsx`
- Modify: `src/components/site/SiteLogo.tsx`
- Modify: `src/lib/media.ts`
- Test: `tests/int/media-url.int.spec.ts`

**Interfaces:**
- Consumes: `Media.url` and `Media.updatedAt` from generated Payload types.
- Produces: `getMediaImageProps({ media, preset?, fallbackAlt? })`, returning the existing image-props shape with a versioned `src` when eligible.

- [x] **Step 1: Write failing URL-version tests**

Add cases proving that a valid timestamp creates `?v=<encoded updatedAt>`, an existing query uses `&v=`, local paths remain unchanged, and missing or invalid timestamps preserve the canonical remote URL.

- [x] **Step 2: Run the focused test and verify the new cases fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/media-url.int.spec.ts`

Expected: FAIL because `getMediaImageProps` still returns the unversioned remote source.

- [x] **Step 3: Implement the minimal image-only versioning helper**

In `src/lib/media.ts`, validate `updatedAt` with `Date.parse`, restrict versioning to absolute HTTP(S) URLs, and append a `v` query using `URL.searchParams` so existing queries are retained and encoded safely. Call it only from `getMediaImageProps`; leave `getMediaAbsoluteUrl` and `getOpenGraphMediaImage` unchanged. Use the image-props resolver from Logo Strip, Site Logo, and the image branch of Media Carousel while leaving video resolution on the canonical URL helper.

- [x] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-url.int.spec.ts tests/int/media-public-url.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all commands pass.

- [x] **Step 5: Refresh and verify project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the update is a no-op unless generated repository facts changed; the consistency check passes.

- [x] **Step 6: Commit the implementation**

```bash
git add .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-09-01-versioned-media-image-urls.md docs/superpowers/specs/2026-09-01-versioned-media-image-urls-design.md src/blocks/LogoStrip/Component.tsx src/blocks/MediaCarousel/Component.tsx src/components/site/SiteLogo.tsx src/lib/media.ts tests/int/media-url.int.spec.ts
git commit -m "fix(media): version optimized image URLs"
```
