# Open Graph AVIF Image Dimensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every generated Open Graph image buildable when the configured logo is a remote AVIF by supplying Payload's stored intrinsic dimensions and falling back to the site name when the media metadata is incomplete.

**Architecture:** Replace the URL-only Open Graph media helper with a focused resolver that validates an absolute URL and positive intrinsic dimensions together. All four Open Graph routes consume that object, pass explicit HTML image dimensions to `ImageResponse`, and retain their current CSS sizing and text fallback.

**Tech Stack:** Next.js 16 App Router metadata routes, React 19, Payload CMS 3 media documents, TypeScript, Vitest, `next/og` `ImageResponse`.

## Global Constraints

- Keep `S3_PUBLIC_URL=https://assets.snmih.tanish.im` unchanged.
- Do not change the Payload schema, generated Payload types, database records, R2 settings, or Open Graph visual layout.
- Root-relative media URLs remain excluded from build-time Open Graph images.
- Missing, zero, negative, or incomplete intrinsic dimensions must render the existing site-name fallback.
- Do not commit any repository changes.

---

### Task 1: Resolve Open Graph Media With Intrinsic Dimensions

**Files:**
- Modify: `src/lib/media.ts`
- Test: `tests/int/media-url.int.spec.ts`

**Interfaces:**
- Consumes: `Media.url`, `Media.width`, and `Media.height` from a populated Payload media relationship.
- Produces: `getOpenGraphMediaImage(media): { src: string; width: number; height: number } | undefined`.

- [ ] **Step 1: Write failing resolver tests**

Replace the Open Graph helper import and Open Graph-specific cases in
`tests/int/media-url.int.spec.ts` with:

```ts
import { getMediaAbsoluteUrl, getOpenGraphMediaImage } from '@/lib/media'

const mediaWithURL = (url: string): Media => ({ url }) as Media
const mediaImage = (url: string, width?: number | null, height?: number | null): Media =>
  ({ height, url, width }) as Media

it('omits root-relative media from build-time Open Graph images', () => {
  expect(
    getOpenGraphMediaImage(mediaImage('/api/media/file/social-image.png', 1200, 630)),
  ).toBeUndefined()
})

it('returns absolute Open Graph media with positive intrinsic dimensions', () => {
  expect(
    getOpenGraphMediaImage(mediaImage('https://cdn.example.com/social-image.avif', 1200, 630)),
  ).toEqual({
    height: 630,
    src: 'https://cdn.example.com/social-image.avif',
    width: 1200,
  })
})

it.each([
  ['missing width', undefined, 630],
  ['missing height', 1200, undefined],
  ['zero width', 0, 630],
  ['zero height', 1200, 0],
  ['negative width', -1, 630],
  ['negative height', 1200, -1],
])('omits Open Graph media with %s', (_label, width, height) => {
  expect(
    getOpenGraphMediaImage(
      mediaImage('https://cdn.example.com/social-image.avif', width, height),
    ),
  ).toBeUndefined()
})
```

Keep the two existing `getMediaAbsoluteUrl` cases unchanged.

- [ ] **Step 2: Run the resolver tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-url.int.spec.ts
```

Expected: FAIL because `getOpenGraphMediaImage` is not exported from `src/lib/media.ts`.

- [ ] **Step 3: Implement the minimal shared resolver**

In `src/lib/media.ts`, replace `getOpenGraphMediaUrl` with:

```ts
type OpenGraphMediaImage = {
  src: string
  width: number
  height: number
}

export const getOpenGraphMediaImage = (
  media: string | number | Media | null | undefined,
): OpenGraphMediaImage | undefined => {
  if (
    !isMediaDoc(media) ||
    !media.url ||
    typeof media.width !== 'number' ||
    media.width <= 0 ||
    typeof media.height !== 'number' ||
    media.height <= 0
  ) {
    return undefined
  }

  const src = media.url.trim()

  if (!/^https?:\/\//i.test(src)) {
    return undefined
  }

  return {
    height: media.height,
    src,
    width: media.width,
  }
}
```

Do not change `getMediaAbsoluteUrl` or `getMediaImageProps`.

- [ ] **Step 4: Run the resolver tests and verify success**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-url.int.spec.ts
```

Expected: PASS for absolute AVIF media, root-relative rejection, and every invalid-dimension case.

### Task 2: Supply Dimensions in Every Open Graph Route

**Files:**
- Modify: `src/app/(frontend)/opengraph-image.tsx`
- Modify: `src/app/(frontend)/articles/[slug]/opengraph-image.tsx`
- Modify: `src/app/(frontend)/reviews/[slug]/opengraph-image.tsx`
- Modify: `src/app/(frontend)/news-events/[slug]/opengraph-image.tsx`
- Test: `tests/int/news-events-opengraph-image.int.spec.tsx`

**Interfaces:**
- Consumes: `getOpenGraphMediaImage(media)` from Task 1.
- Produces: Open Graph `<img>` elements with `src`, `width`, and `height` attributes, or the existing site-name fallback.

- [ ] **Step 1: Write the failing route behavior tests**

Add these tests to `tests/int/news-events-opengraph-image.int.spec.tsx`:

```tsx
it('renders an absolute AVIF logo with intrinsic dimensions', async () => {
  mocks.findGlobal.mockResolvedValue({
    logo: {
      height: 512,
      url: 'https://assets.snmih.tanish.im/Logo.avif',
      width: 512,
    },
    siteName: 'SNMIH',
  })

  const response = await NewsEventOgImage({
    params: Promise.resolve({ slug: 'clinical-learning-symposium' }),
  })
  const markup = renderToStaticMarkup((response as unknown as { element: ReactNode }).element)

  expect(markup).toContain('src="https://assets.snmih.tanish.im/Logo.avif"')
  expect(markup).toContain('width="512"')
  expect(markup).toContain('height="512"')
})

it('falls back to the site name when logo dimensions are incomplete', async () => {
  mocks.findGlobal.mockResolvedValue({
    logo: {
      height: null,
      url: 'https://assets.snmih.tanish.im/Logo.avif',
      width: 512,
    },
    siteName: 'SNMIH',
  })

  const response = await NewsEventOgImage({
    params: Promise.resolve({ slug: 'clinical-learning-symposium' }),
  })
  const markup = renderToStaticMarkup((response as unknown as { element: ReactNode }).element)

  expect(markup).not.toContain('https://assets.snmih.tanish.im/Logo.avif')
  expect(markup).toContain('SNMIH')
})
```

- [ ] **Step 2: Run the route test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-opengraph-image.int.spec.tsx
```

Expected: FAIL because the current route renders an AVIF logo without explicit `width` and `height` attributes and does not require complete dimensions.

- [ ] **Step 3: Update the root Open Graph route**

In `src/app/(frontend)/opengraph-image.tsx`, change the import and resolved value:

```ts
import { getOpenGraphMediaImage } from '@/lib/media'

const logoImage = getOpenGraphMediaImage(siteSettings.logo)
```

Replace the conditional logo element with:

```tsx
{logoImage ? (
  <img
    src={logoImage.src}
    alt={siteName}
    width={logoImage.width}
    height={logoImage.height}
    style={{ height: 36, maxWidth: 180, objectFit: 'contain' }}
  />
) : (
  <span style={{ color: '#888', fontSize: 18, letterSpacing: '0.05em' }}>{siteName}</span>
)}
```

- [ ] **Step 4: Update the Article Open Graph route**

In `src/app/(frontend)/articles/[slug]/opengraph-image.tsx`, change the import and resolved value:

```ts
import { getOpenGraphMediaImage } from '@/lib/media'

const logoImage = getOpenGraphMediaImage(siteSettings.logo)
```

Replace the conditional logo element with:

```tsx
{logoImage ? (
  <img
    src={logoImage.src}
    alt={siteName}
    width={logoImage.width}
    height={logoImage.height}
    style={{ height: 32, maxWidth: 160, objectFit: 'contain' }}
  />
) : (
  <span style={{ color: '#6b7280', fontSize: 16, letterSpacing: '0.05em' }}>{siteName}</span>
)}
```

- [ ] **Step 5: Update the Review Open Graph route**

In `src/app/(frontend)/reviews/[slug]/opengraph-image.tsx`, change the import and resolved value:

```ts
import { getOpenGraphMediaImage } from '@/lib/media'

const logoImage = getOpenGraphMediaImage(siteSettings.logo)
```

Replace the conditional logo element with:

```tsx
{logoImage ? (
  <img
    src={logoImage.src}
    alt={siteName}
    width={logoImage.width}
    height={logoImage.height}
    style={{ height: 32, maxWidth: 160, objectFit: 'contain' }}
  />
) : (
  <span style={{ color: '#6b7280', fontSize: 16, letterSpacing: '0.05em' }}>{siteName}</span>
)}
```

- [ ] **Step 6: Update the News & Events Open Graph route**

In `src/app/(frontend)/news-events/[slug]/opengraph-image.tsx`, change the import and resolved value:

```ts
import { getOpenGraphMediaImage } from '@/lib/media'

const logoImage = getOpenGraphMediaImage(siteSettings.logo)
```

Replace the conditional logo element with:

```tsx
{logoImage ? (
  <img
    src={logoImage.src}
    alt={siteName}
    width={logoImage.width}
    height={logoImage.height}
    style={{ height: 32, maxWidth: 160, objectFit: 'contain' }}
  />
) : (
  <span style={{ color: '#6b7280', fontSize: 16, letterSpacing: '0.05em' }}>
    {siteName}
  </span>
)}
```

- [ ] **Step 7: Run focused Open Graph tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-url.int.spec.ts tests/int/news-events-opengraph-image.int.spec.tsx
```

Expected: PASS, including explicit AVIF dimensions and the incomplete-metadata fallback.

- [ ] **Step 8: Confirm the obsolete URL-only helper has no consumers**

Run:

```bash
rg -n "getOpenGraphMediaUrl|logoUrl" src/app/'(frontend)' src/lib tests/int
```

Expected: no matches related to the removed helper or the four updated Open Graph routes.

### Task 3: Repository and Production-Build Verification

**Files:**
- Update if generated facts change: `.agents/skills/project-context/references/project-inventory.json`
- Inspect: `.agents/skills/project-context/references/change-impact-map.md`
- Inspect: `docs/operations/runtime-and-providers.md`

**Interfaces:**
- Consumes: the completed resolver and all four updated metadata routes.
- Produces: a verified, uncommitted production-build fix with current project context.

- [ ] **Step 1: Run TypeScript validation**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: exit code 0 with no new lint errors.

- [ ] **Step 3: Run the production build**

Run:

```bash
pnpm build
```

Expected: exit code 0; `/(frontend)/opengraph-image` prerenders without `Image size cannot be determined`.

- [ ] **Step 4: Refresh project context**

Run:

```bash
pnpm project-context:update
```

Expected: exit code 0. A no-op is acceptable; keep generated changes only when repository facts changed.

- [ ] **Step 5: Inspect the final diff against the impact map**

Run:

```bash
git diff --check
git status --short
git diff -- src/lib/media.ts src/app/'(frontend)' tests/int .agents/skills/project-context/references docs/superpowers
```

Expected: only the approved resolver, four route updates, focused tests, uncommitted planning documents, and any justified generated context update appear. There are no whitespace errors and no environment secrets in the diff.

- [ ] **Step 6: Validate project context**

Run:

```bash
pnpm project-context:check
```

Expected: exit code 0. Narrative architecture documentation remains unchanged because route ownership and the public-media operator contract did not change.

- [ ] **Step 7: Report the uncommitted result**

Report the exact focused test, TypeScript, lint, build, and project-context outcomes. Explicitly state that no schema, database, R2, or environment changes were made and that no commit was created.
