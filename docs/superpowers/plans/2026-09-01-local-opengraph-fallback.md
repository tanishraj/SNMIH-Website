# Local Open Graph Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve healthy page-specific Open Graph cards while returning the supplied local SNMIH preview whenever the remote R2 logo or a requested detail record is unavailable.

**Architecture:** A server-only helper owns the required local PNG, the three-second remote-logo request, conversion to a renderer-safe data URL, and construction of the full-card fallback `ImageResponse`. The root, Article, Review, and News & Events routes keep their current templates but render them only after their content and logo dependencies resolve successfully.

**Tech Stack:** Next.js 16 App Router metadata routes, `next/og` `ImageResponse`, React 19, Payload CMS 3, Node.js filesystem APIs, TypeScript, Vitest.

## Global Constraints

- Keep `getOpenGraphMediaImage` and its absolute-URL and positive-dimension validation.
- Keep healthy dynamic Open Graph cards at `1200x630` with their current content and styling.
- Return the local preview without text or overlays when a required dependency is unavailable.
- Use a three-second timeout for the remote logo request.
- Reject unsuccessful HTTP responses and non-image content types.
- Store the source asset at `src/assets/open-graph/SNMIH-Preview-og-image.png`.
- Do not change Payload schemas, generated Payload types, database records, R2 settings, environment variables, SEO fields, or public page components.
- Preserve the source image in Documents; copy it into the repository instead of moving it.
- Do not stage or commit any changes.

---

### Task 1: Add the Local Fallback Asset and Server Helper

**Files:**
- Create: `src/assets/open-graph/SNMIH-Preview-og-image.png`
- Create: `src/lib/openGraphImages.tsx`
- Modify: `src/lib/media.ts`
- Test: `tests/int/open-graph-images.int.spec.tsx`

**Interfaces:**
- Consumes: `OpenGraphMediaImage` from `src/lib/media.ts` and the supplied `1672x941` PNG.
- Produces: `OPEN_GRAPH_SIZE`, `loadOpenGraphRemoteImage(image, options?)`, and `createOpenGraphFallbackResponse()`.

- [ ] **Step 1: Write the failing helper tests**

Create `tests/int/open-graph-images.int.spec.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/og', () => ({
  ImageResponse: class {
    element: unknown
    options: unknown

    constructor(element: unknown, options: unknown) {
      this.element = element
      this.options = options
    }
  },
}))

import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'
import type { OpenGraphMediaImage } from '@/lib/media'

const remoteImage: OpenGraphMediaImage = {
  height: 512,
  src: 'https://assets.snmih.tanish.im/Logo.avif',
  width: 512,
}

describe('Open Graph image loading', () => {
  it('loads a successful remote image into a renderer-safe data URL', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('logo', {
        headers: { 'content-type': 'image/avif; charset=binary' },
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toEqual({
      height: 512,
      src: 'data:image/avif;base64,bG9nbw==',
      width: 512,
    })
    expect(fetcher).toHaveBeenCalledWith(
      remoteImage.src,
      expect.objectContaining({ cache: 'force-cache', signal: expect.any(Object) }),
    )
  })

  it('omits a missing image without fetching', async () => {
    const fetcher = vi.fn()

    await expect(loadOpenGraphRemoteImage(undefined, { fetcher })).resolves.toBeUndefined()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('omits an unsuccessful response', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('unavailable', {
        headers: { 'content-type': 'text/plain' },
        status: 503,
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('omits a non-image response', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('<html />', {
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('omits a rejected remote request', async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    await expect(loadOpenGraphRemoteImage(remoteImage, { fetcher })).resolves.toBeUndefined()
  })

  it('aborts a remote request after the configured timeout', async () => {
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      }),
    )

    await expect(
      loadOpenGraphRemoteImage(remoteImage, { fetcher, timeoutMs: 5 }),
    ).resolves.toBeUndefined()
  })

  it('renders the local preview as a full 1200x630 fallback without text', async () => {
    const response = await createOpenGraphFallbackResponse()
    const fallback = response as unknown as { element: ReactNode; options: unknown }
    const markup = renderToStaticMarkup(fallback.element)

    expect(fallback.options).toEqual({ height: 630, width: 1200 })
    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).toContain('width="1672"')
    expect(markup).toContain('height="941"')
    expect(markup).toContain('object-fit:cover')
    expect(markup).not.toContain('SNMIH')
  })
})
```

- [ ] **Step 2: Run the helper test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/open-graph-images.int.spec.tsx
```

Expected: FAIL because `src/lib/openGraphImages.tsx` and the repository asset do not exist.

- [ ] **Step 3: Copy and verify the supplied PNG**

Run these commands separately:

```bash
mkdir -p src/assets/open-graph
cp '/Users/tanishraj/Documents/College/Website Uploaded Image/SNMIH-Preview-image.png' src/assets/open-graph/SNMIH-Preview-og-image.png
sips -g pixelWidth -g pixelHeight src/assets/open-graph/SNMIH-Preview-og-image.png
shasum -a 256 '/Users/tanishraj/Documents/College/Website Uploaded Image/SNMIH-Preview-image.png' src/assets/open-graph/SNMIH-Preview-og-image.png
```

Expected: the copied asset is `1672x941`; both SHA-256 values are identical.

- [ ] **Step 4: Export the validated media shape**

In `src/lib/media.ts`, export the existing type without changing its fields:

```ts
export type OpenGraphMediaImage = {
  src: string
  width: number
  height: number
}
```

- [ ] **Step 5: Implement the server-only loader and fallback response**

Create `src/lib/openGraphImages.tsx`:

```tsx
import 'server-only'

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

import type { OpenGraphMediaImage } from '@/lib/media'

export const OPEN_GRAPH_SIZE = { height: 630, width: 1200 } as const

const FALLBACK_IMAGE_SIZE = { height: 941, width: 1672 } as const
const REMOTE_IMAGE_TIMEOUT_MS = 3_000
const fallbackImagePath = join(
  process.cwd(),
  'src/assets/open-graph/SNMIH-Preview-og-image.png',
)

type OpenGraphImageFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

type LoadOpenGraphRemoteImageOptions = {
  fetcher?: OpenGraphImageFetcher
  timeoutMs?: number
}

let fallbackImageDataURLPromise: Promise<string> | undefined

const getFallbackImageDataURL = (): Promise<string> => {
  fallbackImageDataURLPromise ??= readFile(fallbackImagePath, 'base64').then(
    (data) => `data:image/png;base64,${data}`,
  )

  return fallbackImageDataURLPromise
}

export const loadOpenGraphRemoteImage = async (
  image: OpenGraphMediaImage | undefined,
  {
    fetcher = fetch,
    timeoutMs = REMOTE_IMAGE_TIMEOUT_MS,
  }: LoadOpenGraphRemoteImageOptions = {},
): Promise<OpenGraphMediaImage | undefined> => {
  if (!image) {
    return undefined
  }

  try {
    const response = await fetcher(image.src, {
      cache: 'force-cache',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const contentType = response.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase()

    if (!response.ok || !contentType?.startsWith('image/')) {
      return undefined
    }

    const data = Buffer.from(await response.arrayBuffer()).toString('base64')

    return {
      ...image,
      src: `data:${contentType};base64,${data}`,
    }
  } catch {
    return undefined
  }
}

export const createOpenGraphFallbackResponse = async (): Promise<ImageResponse> => {
  const src = await getFallbackImageDataURL()

  return new ImageResponse(
    <img
      src={src}
      alt=""
      width={FALLBACK_IMAGE_SIZE.width}
      height={FALLBACK_IMAGE_SIZE.height}
      style={{ height: '100%', objectFit: 'cover', width: '100%' }}
    />,
    { ...OPEN_GRAPH_SIZE },
  )
}
```

- [ ] **Step 6: Run the helper test and verify success**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/open-graph-images.int.spec.tsx
```

Expected: PASS for success, missing metadata, HTTP failure, invalid content type, request rejection,
timeout, and full-card local rendering.

### Task 2: Apply the Fallback to Every Generated Open Graph Route

**Files:**
- Modify: `src/app/(frontend)/opengraph-image.tsx`
- Modify: `src/app/(frontend)/articles/[slug]/opengraph-image.tsx`
- Modify: `src/app/(frontend)/reviews/[slug]/opengraph-image.tsx`
- Modify: `src/app/(frontend)/news-events/[slug]/opengraph-image.tsx`
- Modify: `tests/int/news-events-opengraph-image.int.spec.tsx`
- Create: `tests/int/opengraph-fallback-routes.int.spec.tsx`

**Interfaces:**
- Consumes: `getOpenGraphMediaImage`, `loadOpenGraphRemoteImage`, and `createOpenGraphFallbackResponse`.
- Produces: four metadata routes that either return their existing dynamic `ImageResponse` or the exact shared local fallback.

- [ ] **Step 1: Update the News & Events route tests to express the new contract**

Replace `tests/int/news-events-opengraph-image.int.spec.tsx` with:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  find: vi.fn(),
  findGlobal: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/og', () => ({
  ImageResponse: class {
    element: unknown
    options: unknown

    constructor(element: unknown, options: unknown) {
      this.element = element
      this.options = options
    }
  },
}))

import NewsEventOgImage from '@/app/(frontend)/news-events/[slug]/opengraph-image'

const renderImage = async () => {
  const response = await NewsEventOgImage({
    params: Promise.resolve({ slug: 'clinical-learning-symposium' }),
  })

  return renderToStaticMarkup((response as unknown as { element: ReactNode }).element)
}

describe('News & Events detail OpenGraph image', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)
    mocks.fetch.mockResolvedValue(
      new Response('logo', { headers: { 'content-type': 'image/avif' } }),
    )
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      findGlobal: mocks.findGlobal,
    })
    mocks.find.mockResolvedValue({
      docs: [
        {
          classification: {
            active: true,
            badgeLabel: 'CME',
            behavior: 'event',
            id: 'classification-cme',
            legacyValue: null,
            slug: 'continuing-medical-education',
            title: 'Continuing Medical Education',
          },
          excerpt: 'A specialist learning event.',
          title: 'Clinical learning symposium',
        },
      ],
    })
    mocks.findGlobal.mockResolvedValue({
      logo: {
        height: 512,
        url: 'https://assets.snmih.tanish.im/Logo.avif',
        width: 512,
      },
      siteName: 'SNMIH',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('populates and renders the resolved classification badge label', async () => {
    const markup = await renderImage()

    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        depth: 1,
        select: expect.objectContaining({ classification: true }),
      }),
    )
    expect(markup).toContain('CME')
    expect(markup).toContain('Clinical learning symposium')
  })

  it('renders fetched AVIF data with intrinsic dimensions', async () => {
    const markup = await renderImage()

    expect(markup).toContain('src="data:image/avif;base64,bG9nbw=="')
    expect(markup).toContain('width="512"')
    expect(markup).toContain('height="512"')
  })

  it('returns the local preview when logo dimensions are incomplete', async () => {
    mocks.findGlobal.mockResolvedValue({
      logo: {
        height: null,
        url: 'https://assets.snmih.tanish.im/Logo.avif',
        width: 512,
      },
      siteName: 'SNMIH',
    })

    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).not.toContain('Clinical learning symposium')
  })

  it('returns the local preview when the remote logo request fails', async () => {
    mocks.fetch.mockResolvedValue(
      new Response('unavailable', {
        headers: { 'content-type': 'text/plain' },
        status: 503,
      }),
    )

    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).not.toContain('Clinical learning symposium')
  })

  it('returns the local preview without fetching the logo when the record is missing', async () => {
    mocks.find.mockResolvedValue({ docs: [] })

    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Add a failing all-route fallback test**

Create `tests/int/opengraph-fallback-routes.int.spec.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findGlobal: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/og', () => ({
  ImageResponse: class {
    element: unknown
    options: unknown

    constructor(element: unknown, options: unknown) {
      this.element = element
      this.options = options
    }
  },
}))

import ArticleOgImage from '@/app/(frontend)/articles/[slug]/opengraph-image'
import NewsEventOgImage from '@/app/(frontend)/news-events/[slug]/opengraph-image'
import DefaultOgImage from '@/app/(frontend)/opengraph-image'
import ReviewOgImage from '@/app/(frontend)/reviews/[slug]/opengraph-image'

type CapturedImageResponse = {
  element: ReactNode
  options: unknown
}

describe('OpenGraph route fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      findGlobal: mocks.findGlobal,
    })
    mocks.find.mockResolvedValue({
      docs: [
        {
          authorName: 'SNMIH',
          classification: null,
          contentType: 'news',
          displayName: 'SNMIH',
          excerpt: 'Published detail record.',
          rating: '5',
          reviewerName: 'SNMIH',
          reviewTitle: 'Published review',
          subjectLabel: 'Hospital',
          title: 'Published detail',
        },
      ],
    })
    mocks.findGlobal.mockImplementation(({ slug }: { slug: string }) => {
      if (slug === 'seo-settings') {
        return Promise.resolve({ defaultDescription: '' })
      }

      return Promise.resolve({ logo: null, siteDescription: '', siteName: 'SNMIH' })
    })
  })

  it.each([
    ['root', () => DefaultOgImage()],
    [
      'article',
      () => ArticleOgImage({ params: Promise.resolve({ slug: 'published-article' }) }),
    ],
    [
      'review',
      () => ReviewOgImage({ params: Promise.resolve({ slug: 'published-review' }) }),
    ],
    [
      'news-event',
      () => NewsEventOgImage({ params: Promise.resolve({ slug: 'published-event' }) }),
    ],
  ])('returns the local preview from the %s route when the logo is missing', async (_label, run) => {
    const response = (await run()) as unknown as CapturedImageResponse
    const markup = renderToStaticMarkup(response.element)

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).not.toContain('https://assets.snmih.tanish.im')
    expect(response.options).toEqual({ height: 630, width: 1200 })
  })
})
```

- [ ] **Step 3: Run the route tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-opengraph-image.int.spec.tsx tests/int/opengraph-fallback-routes.int.spec.tsx
```

Expected: FAIL because the routes still pass remote URLs directly to `ImageResponse` and still
render their text templates when the logo or record is unavailable.

- [ ] **Step 4: Update the root Open Graph route**

In `src/app/(frontend)/opengraph-image.tsx`, add the helper import:

```ts
import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'
```

Replace the `siteName`, `description`, and `logoImage` declarations with:

```ts
const siteName = siteSettings.siteName
const description = seoSettings.defaultDescription ?? siteSettings.siteDescription ?? ''
const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

if (!logoImage) {
  return createOpenGraphFallbackResponse()
}
```

Replace the conditional logo block with:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
  <img
    src={logoImage.src}
    alt={siteName}
    width={logoImage.width}
    height={logoImage.height}
    style={{ height: 36, maxWidth: 180, objectFit: 'contain', width: 'auto' }}
  />
</div>
```

- [ ] **Step 5: Update the Article Open Graph route**

In `src/app/(frontend)/articles/[slug]/opengraph-image.tsx`, add:

```ts
import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'
```

Replace the declarations from `const article` through `const logoImage` with:

```ts
const article = result.docs[0]

if (!article) {
  return createOpenGraphFallbackResponse()
}

const title = article.title
const excerpt = article.excerpt ?? ''
const author = article.authorName ?? ''
const siteName = siteSettings.siteName
const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

if (!logoImage) {
  return createOpenGraphFallbackResponse()
}
```

Replace the conditional logo element with:

```tsx
<img
  src={logoImage.src}
  alt={siteName}
  width={logoImage.width}
  height={logoImage.height}
  style={{ height: 32, maxWidth: 160, objectFit: 'contain', width: 'auto' }}
/>
```

Leave the Article label, title, excerpt, author, and all surrounding styles unchanged.

- [ ] **Step 6: Update the Review Open Graph route**

In `src/app/(frontend)/reviews/[slug]/opengraph-image.tsx`, add:

```ts
import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'
```

Replace the declarations from `const review` through `const logoImage` with:

```ts
const review = result.docs[0]

if (!review) {
  return createOpenGraphFallbackResponse()
}

const title = review.reviewTitle ?? 'Review'
const rating = review.rating ? parseInt(review.rating, 10) : null
const reviewer = review.displayName?.trim() || review.reviewerName?.trim() || ''
const subjectLabel = review.subjectLabel?.trim() ?? ''
const siteName = siteSettings.siteName
const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

if (!logoImage) {
  return createOpenGraphFallbackResponse()
}
```

Replace the conditional logo element with:

```tsx
<img
  src={logoImage.src}
  alt={siteName}
  width={logoImage.width}
  height={logoImage.height}
  style={{ height: 32, maxWidth: 160, objectFit: 'contain', width: 'auto' }}
/>
```

Leave `stars`, the subject badge, title, reviewer, and all surrounding styles unchanged.

- [ ] **Step 7: Update the News & Events Open Graph route**

In `src/app/(frontend)/news-events/[slug]/opengraph-image.tsx`, add:

```ts
import {
  createOpenGraphFallbackResponse,
  loadOpenGraphRemoteImage,
} from '@/lib/openGraphImages'
```

Replace the declarations from `const entry` through `const logoImage` with:

```ts
const entry = result.docs[0]

if (!entry) {
  return createOpenGraphFallbackResponse()
}

const title = entry.title
const excerpt = entry.excerpt ?? ''
const classification = resolveNewsEventClassificationRecord(
  entry.classification,
  entry.contentType,
)
const classificationLabel = classification?.badgeLabel ?? 'News & Events'
const siteName = siteSettings.siteName
const logoImage = await loadOpenGraphRemoteImage(getOpenGraphMediaImage(siteSettings.logo))

if (!logoImage) {
  return createOpenGraphFallbackResponse()
}
```

Replace the conditional logo element with:

```tsx
<img
  src={logoImage.src}
  alt={siteName}
  width={logoImage.width}
  height={logoImage.height}
  style={{ height: 32, maxWidth: 160, objectFit: 'contain', width: 'auto' }}
/>
```

Leave `accentColor`, the classification badge, title, excerpt, and all surrounding styles unchanged.

- [ ] **Step 8: Run the complete focused Open Graph suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-url.int.spec.ts tests/int/open-graph-images.int.spec.tsx tests/int/news-events-opengraph-image.int.spec.tsx tests/int/opengraph-fallback-routes.int.spec.tsx
```

Expected: PASS for the existing media contract, remote loading, local rendering, dynamic success,
transport fallback, missing metadata, missing records, and all four route consumers.

- [ ] **Step 9: Confirm no Open Graph route passes an R2 URL directly to `<img>`**

Run:

```bash
rg -n "logoImage\.src|getOpenGraphMediaImage|loadOpenGraphRemoteImage|createOpenGraphFallbackResponse" 'src/app/(frontend)' src/lib tests/int
```

Expected: every generated route resolves the validated media through `loadOpenGraphRemoteImage`;
`logoImage.src` contains a data URL by the time it reaches `ImageResponse`.

### Task 3: Repository and Production Verification

**Files:**
- Update if generated facts change: `.agents/skills/project-context/references/project-inventory.json`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Inspect: `.agents/skills/project-context/references/change-impact-map.md`

**Interfaces:**
- Consumes: the local asset, shared helper, route fallbacks, and focused tests.
- Produces: a verified, uncommitted production-build change with current project context.

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

- [ ] **Step 3: Run the production build without stopping the active dev server**

In one shell session, run each command separately:

```bash
typeset og_fallback_build_dir
og_fallback_build_dir="$(mktemp -d /private/tmp/snmih-og-build.XXXXXX)"
rsync -a --exclude .git --exclude .next --exclude node_modules ./ "$og_fallback_build_dir/"
cp -cR node_modules "$og_fallback_build_dir/node_modules"
cd "$og_fallback_build_dir"
node --no-deprecation --max-old-space-size=8000 node_modules/next/dist/bin/next build
```

Expected: exit code 0; `/opengraph-image-*` prerenders through the local fallback even when
`assets.snmih.tanish.im` cannot resolve. Run the build with network access so `next/font` can fetch
its configured Google fonts.

- [ ] **Step 4: Remove the validated temporary build copy**

Return to the repository, validate the generated path, and remove only that directory:

```bash
cd '/Users/tanishraj/Tanishraj/Personal Projects/payload-cms-starter-kit'
[[ "$og_fallback_build_dir" == /private/tmp/snmih-og-build.* ]]
rm -rf "$og_fallback_build_dir"
```

Expected: the path validation succeeds before deletion; the repository and Documents source image
remain untouched.

- [ ] **Step 5: Update the maintained route contract**

In the Public and Administrative Delivery section of
`.agents/skills/project-context/references/architecture.md`, replace:

```md
- `/search`, `/api/search`, feeds, sitemap, robots, and Open Graph image routes implement discovery.
```

with:

```md
- `/search`, `/api/search`, feeds, sitemap, robots, and Open Graph image routes implement discovery.
  Generated Open Graph routes keep their page-specific cards when their published record and public
  media logo are available, and return the code-owned SNMIH preview when a required record or the
  bounded remote-logo request is unavailable.
```

- [ ] **Step 6: Refresh project context**

Run:

```bash
pnpm project-context:update
```

Expected: exit code 0. Keep the generated inventory update because the new asset, helper, test, and
planning document change repository facts.

- [ ] **Step 7: Inspect the final diff against the impact map**

Run:

```bash
git diff --check
git status --short
git diff -- src/lib src/app/'(frontend)' tests/int .agents/skills/project-context/references docs/superpowers
```

Expected: only the approved AVIF-dimension work, local fallback asset/helper, four route updates,
focused tests, planning documents, and justified generated inventory update appear. `.env` and
other secrets must not appear.

- [ ] **Step 8: Validate project context**

Run:

```bash
pnpm project-context:check
```

Expected: exit code 0. The inventory and maintained Open Graph route contract are current.

- [ ] **Step 9: Report the uncommitted result**

Report the asset dimensions and checksum match; focused test counts; TypeScript, lint, build, and
project-context outcomes; the fallback conditions; and the unchanged schema/database/R2/environment
contracts. Explicitly state that the Documents source file remains in place and no commit was
created.
