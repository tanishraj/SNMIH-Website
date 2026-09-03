# Header Navbar Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable sticky header navbar block to the `Headers` collection, render the active header globally, and support block-level logo behavior, navigation alignment, size, one-level dropdowns, and CTA buttons.

**Architecture:** Reuse the existing header preset boundary by adding a `layout` blocks field to `Headers` and rendering the selected preset from the frontend shell. Keep menu structure self-contained inside the block, resolve logo defaults from `site-settings`, and use small presentational components (`SiteLogo`, desktop nav, mobile nav) rather than a single monolithic navbar file.

**Tech Stack:** Payload CMS 3, Next.js App Router, React Server Components + client components where needed, TypeScript, shadcn/ui, `@shadcnblocks/navbar2`, Tailwind CSS, Vitest

## Global Constraints

- Add a reusable, sticky navigation header block that lives in the `Headers` collection, is selected globally from `Website Defaults`.
- This is explicitly a header preset concern, not page content.
- `navigation-links` is a flat reusable destination collection and does not support nested menus.
- The navbar block is fully self-contained for structure and alignment.
- Default behavior: use `Site Settings.logo`; if no logo media exists, fallback to text using `siteName`.
- Override behavior: `customLogoLight` replaces the default logo; `customLogoDark` is used in dark theme when present; if no dark override exists, fallback to the light custom logo.
- Use a sheet-based mobile menu.
- One nesting level only.
- The header must stack correctly with admin session bar and global announcement bar.
- The requested `@shadcnblocks/navbar2` should be treated as a starting visual pattern, not as the final data model.

---

## File Structure

- Create: `src/blocks/HeaderNavbar12/config.ts`
  - Payload block config for the reusable header navbar preset.
- Create: `src/blocks/HeaderNavbar12/Component.tsx`
  - Server wrapper that adapts block data to the visual header components.
- Create: `src/blocks/HeaderNavbar12/thumbnail.ts`
  - Colocated admin thumbnail for the block picker.
- Create: `src/blocks/renderHeaderBlocks.tsx`
  - Shared renderer for `Headers.layout`.
- Create: `src/components/site/SiteLogo.tsx`
  - Shared logo component with site-default/custom light/dark behavior and text fallback.
- Create: `src/components/header/HeaderNavbar.tsx`
  - Main visual shell for desktop/mobile header layout.
- Create: `src/components/header/HeaderNavMenu.tsx`
  - Desktop nav row with one-level dropdown behavior.
- Create: `src/components/header/HeaderMobileMenu.tsx`
  - Mobile sheet with expandable child items.
- Create: `src/components/global/GlobalHeader.tsx`
  - Shell entrypoint that renders the active header preset with sticky offset.
- Create: `src/lib/headerNavigation.ts`
  - Normalize page/custom links and shape menu/CTA props for rendering.
- Modify: `src/collections/Headers.ts`
  - Add `layout` blocks field and register `headerNavbar12`.
- Modify: `src/app/(frontend)/layout.tsx`
  - Fetch/render active header in the global shell above `<main>`.
- Modify: `src/lib/mediaUsage.ts`
  - Track header logo usage for `customLogoLight` and `customLogoDark`.
- Modify: `src/payload-types.ts`
  - Regenerated after schema changes.
- Create: `tests/int/header-presets.int.spec.ts`
  - Schema and render-path coverage for `Headers.layout`.
- Create: `tests/int/header-navbar-render.int.spec.ts`
  - Logo, menu, CTA, and dropdown render coverage.
- Create: `tests/int/global-header.int.spec.ts`
  - Root layout/global shell header wiring coverage.
- Modify: `tests/int/media-governance.int.spec.ts`
  - Update media usage expectations for the new header logo fields.

### Task 1: Register the header navbar block in `Headers`

**Files:**
- Create: `src/blocks/HeaderNavbar12/config.ts`
- Create: `src/blocks/HeaderNavbar12/thumbnail.ts`
- Modify: `src/collections/Headers.ts`
- Test: `tests/int/header-presets.int.spec.ts`

**Interfaces:**
- Consumes: `Headers` collection config from `src/collections/Headers.ts`
- Produces:
  - `HeaderNavbar12Block: Block`
  - `renderHeaderBlocks(blocks?: HeaderBlock[] | null, context?: { siteLogo?: unknown; siteName?: string | null }): React.ReactNode` (signature used in later tasks)
  - `Headers.fields[].layout` blocks field containing slug `headerNavbar12`

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from 'vitest'

import { HeaderNavbar12Block } from '@/blocks/HeaderNavbar12/config'
import { Headers } from '@/collections/Headers'

const getLayoutField = () =>
  Headers.fields.find(
    (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'layout',
  ) as { blocks?: Array<{ slug: string }>; type?: string } | undefined

describe('header presets', () => {
  it('registers a reusable header layout blocks field', () => {
    const layoutField = getLayoutField()

    expect(layoutField?.type).toBe('blocks')
    expect(layoutField?.blocks?.map((block) => block.slug)).toEqual(['headerNavbar12'])
  })

  it('defines the header navbar schema', () => {
    const stickyField = HeaderNavbar12Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'sticky',
    ) as { defaultValue?: boolean; type?: string } | undefined
    const sizeField = HeaderNavbar12Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'size',
    ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined
    const navAlignmentField = HeaderNavbar12Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'navAlignment',
    ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

    expect(stickyField?.type).toBe('checkbox')
    expect(stickyField?.defaultValue).toBe(true)
    expect(sizeField?.options?.map((option) => option.value)).toEqual(['compact', 'default', 'large'])
    expect(navAlignmentField?.options?.map((option) => option.value)).toEqual(['left', 'center', 'right'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-presets.int.spec.ts
```

Expected: FAIL with module-not-found for `@/blocks/HeaderNavbar12/config` and/or missing `layout` on `Headers`.

- [ ] **Step 3: Add the block config and register it on `Headers`**

```ts
// src/blocks/HeaderNavbar12/config.ts
import type { Block } from 'payload'

import { headerNavbar12Thumbnail } from './thumbnail'

const linkFields = [
  { name: 'label', type: 'text', required: true },
  {
    name: 'linkType',
    type: 'radio',
    defaultValue: 'page',
    options: [
      { label: 'Page', value: 'page' },
      { label: 'Custom URL', value: 'custom' },
    ],
    admin: { layout: 'horizontal' },
  },
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      condition: (_data: unknown, siblingData: { linkType?: 'page' | 'custom' | null }) =>
        siblingData?.linkType === 'page',
    },
  },
  {
    name: 'url',
    type: 'text',
    admin: {
      condition: (_data: unknown, siblingData: { linkType?: 'page' | 'custom' | null }) =>
        siblingData?.linkType === 'custom',
    },
  },
  { name: 'openInNewTab', type: 'checkbox', defaultValue: false },
]

export const HeaderNavbar12Block: Block = {
  slug: 'headerNavbar12',
  interfaceName: 'HeaderNavbar12Block',
  admin: {
    images: {
      thumbnail: {
        alt: 'Header navbar block preview',
        url: headerNavbar12Thumbnail,
      },
    },
  },
  fields: [
    { name: 'sticky', type: 'checkbox', defaultValue: true },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Compact', value: 'compact' },
        { label: 'Default', value: 'default' },
        { label: 'Large', value: 'large' },
      ],
    },
    {
      name: 'navAlignment',
      type: 'select',
      defaultValue: 'center',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    {
      name: 'logoMode',
      type: 'select',
      defaultValue: 'siteDefault',
      options: [
        { label: 'Site Default Logo', value: 'siteDefault' },
        { label: 'Custom Logo Override', value: 'customLogo' },
      ],
    },
    {
      name: 'customLogoLight',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_data: unknown, siblingData: { logoMode?: 'siteDefault' | 'customLogo' | null }) =>
          siblingData?.logoMode === 'customLogo',
      },
    },
    {
      name: 'customLogoDark',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_data: unknown, siblingData: { logoMode?: 'siteDefault' | 'customLogo' | null }) =>
          siblingData?.logoMode === 'customLogo',
      },
    },
    { name: 'logoHeight', type: 'number', defaultValue: 32, min: 20 },
    {
      name: 'menuItems',
      type: 'array',
      minRows: 1,
      fields: [
        ...linkFields,
        {
          name: 'children',
          type: 'array',
          maxRows: 12,
          fields: linkFields,
        },
      ],
    },
    {
      name: 'ctaButtons',
      type: 'array',
      maxRows: 2,
      fields: [
        ...linkFields,
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Outline', value: 'outline' },
            { label: 'Link', value: 'link' },
          ],
        },
      ],
    },
  ],
}

// src/collections/Headers.ts
import { HeaderNavbar12Block } from '@/blocks/HeaderNavbar12/config'

fields: [
  { name: 'title', type: 'text', required: true },
  slugField({ useAsSlug: 'title' }),
  {
    name: 'layout',
    type: 'blocks',
    blocks: [HeaderNavbar12Block],
  },
]
```

- [ ] **Step 4: Add the thumbnail file**

```ts
// src/blocks/HeaderNavbar12/thumbnail.ts
export const headerNavbar12Thumbnail = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" rx="20" fill="#171717"/>
    <rect x="40" y="70" width="520" height="86" rx="14" fill="#F5F5F5"/>
    <rect x="68" y="97" width="78" height="32" rx="8" fill="#262626"/>
    <rect x="212" y="104" width="62" height="12" rx="6" fill="#9CA3AF"/>
    <rect x="294" y="104" width="62" height="12" rx="6" fill="#9CA3AF"/>
    <rect x="376" y="104" width="62" height="12" rx="6" fill="#9CA3AF"/>
    <rect x="470" y="96" width="62" height="28" rx="8" fill="#262626"/>
  </svg>
`)}`;
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-presets.int.spec.ts
```

Expected: PASS for the new header preset schema assertions.

- [ ] **Step 6: Commit**

```bash
git add src/blocks/HeaderNavbar12/config.ts src/blocks/HeaderNavbar12/thumbnail.ts src/collections/Headers.ts tests/int/header-presets.int.spec.ts
git commit -m "feat: register header navbar block"
```

### Task 2: Add shared header normalization and logo/media tracking

**Files:**
- Create: `src/lib/headerNavigation.ts`
- Create: `src/components/site/SiteLogo.tsx`
- Modify: `src/lib/mediaUsage.ts`
- Modify: `tests/int/media-governance.int.spec.ts`
- Test: `tests/int/header-navbar-render.int.spec.ts`

**Interfaces:**
- Consumes:
  - `HeaderNavbar12Block` row data
  - `site-settings` shape: `{ logo?: Media | string | null; siteName?: string | null }`
- Produces:
  - `type ResolvedHeaderLink = { href: string; label: string; newTab: boolean }`
  - `type ResolvedHeaderMenuItem = ResolvedHeaderLink & { children?: ResolvedHeaderLink[] }`
  - `SiteLogo(props: { customDark?: unknown; customLight?: unknown; fallbackText: string; height: number; mode: 'siteDefault' | 'customLogo'; siteLogo?: unknown })`

- [ ] **Step 1: Write the failing render + media-usage tests**

```ts
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { SiteLogo } from '@/components/site/SiteLogo'
import { findMediaUsage } from '@/lib/mediaUsage'

describe('header logo resolution', () => {
  it('falls back to site name when no media logo is available', () => {
    const html = renderToStaticMarkup(
      <SiteLogo fallbackText="Acme Studio" height={32} mode="siteDefault" siteLogo={null} />,
    )

    expect(html).toContain('Acme Studio')
  })
})

describe('media governance resolver', () => {
  it('tracks both header logo override fields', async () => {
    const references = await findMediaUsage({
      mediaID: 7,
      payload: {
        find: async ({ collection }: { collection: string }) =>
          collection === 'headers'
            ? {
                docs: [
                  {
                    id: 40,
                    layout: [
                      {
                        blockType: 'headerNavbar12',
                        customLogoDark: 7,
                        customLogoLight: 7,
                        logoMode: 'customLogo',
                      },
                    ],
                    title: 'Main Header',
                  },
                ],
              }
            : { docs: [] },
        findGlobal: async () => ({ logo: null }),
      },
    })

    expect(references.map((reference) => reference.fieldPath)).toEqual(
      expect.arrayContaining(['layout[0].customLogoLight', 'layout[0].customLogoDark']),
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts tests/int/media-governance.int.spec.ts
```

Expected: FAIL with missing `SiteLogo` / missing media field-path coverage.

- [ ] **Step 3: Add link normalization and `SiteLogo`**

```ts
// src/lib/headerNavigation.ts
export type HeaderLinkRow = {
  label?: string | null
  linkType?: 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: { slug?: string | null } | string | null
  url?: string | null
}

export type ResolvedHeaderLink = {
  href: string
  label: string
  newTab: boolean
}

export type ResolvedHeaderMenuItem = ResolvedHeaderLink & {
  children?: ResolvedHeaderLink[]
}

const getPageHref = (page: HeaderLinkRow['page']) =>
  typeof page === 'object' && page !== null && typeof page.slug === 'string' ? `/${page.slug}` : null

export const resolveHeaderLink = (item: HeaderLinkRow): ResolvedHeaderLink | null => {
  const label = item.label?.trim()
  if (!label) return null

  const href =
    item.linkType === 'page' ? getPageHref(item.page) : item.url?.trim() || null

  if (!href) return null

  return {
    href,
    label,
    newTab: Boolean(item.openInNewTab),
  }
}

// src/components/site/SiteLogo.tsx
import { getMediaAbsoluteUrl } from '@/lib/media'

export function SiteLogo({
  customDark,
  customLight,
  fallbackText,
  height,
  mode,
  siteLogo,
}: {
  customDark?: unknown
  customLight?: unknown
  fallbackText: string
  height: number
  mode: 'siteDefault' | 'customLogo'
  siteLogo?: unknown
}) {
  const lightLogo = mode === 'customLogo' ? customLight : siteLogo
  const darkLogo = mode === 'customLogo' ? customDark || customLight : siteLogo
  const lightSrc = getMediaAbsoluteUrl(lightLogo)
  const darkSrc = getMediaAbsoluteUrl(darkLogo)

  if (!lightSrc) {
    return <span className="font-semibold tracking-tight">{fallbackText}</span>
  }

  return (
    <>
      <img alt={fallbackText} className="dark:hidden" src={lightSrc} style={{ height }} />
      <img alt={fallbackText} className="hidden dark:block" src={darkSrc || lightSrc} style={{ height }} />
    </>
  )
}
```

- [ ] **Step 4: Update media usage tracking for both logo fields**

```ts
// src/lib/mediaUsage.ts
if (block.logoMode !== 'customLogo') {
  return
}

pushIfMatched({
  mediaID,
  reference: createCollectionReference({
    doc,
    documentLabel,
    fieldPath: `layout[${blockIndex}].customLogoLight`,
    slug: 'headers',
  }),
  references,
  value: block.customLogoLight as RelationshipValue,
})

pushIfMatched({
  mediaID,
  reference: createCollectionReference({
    doc,
    documentLabel,
    fieldPath: `layout[${blockIndex}].customLogoDark`,
    slug: 'headers',
  }),
  references,
  value: block.customLogoDark as RelationshipValue,
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts tests/int/media-governance.int.spec.ts
```

Expected: PASS for text fallback and dual logo usage tracking.

- [ ] **Step 6: Commit**

```bash
git add src/lib/headerNavigation.ts src/components/site/SiteLogo.tsx src/lib/mediaUsage.ts tests/int/header-navbar-render.int.spec.ts tests/int/media-governance.int.spec.ts
git commit -m "feat: add shared header navigation helpers"
```

### Task 3: Build the header navbar UI from shadcn/navbar sources

**Files:**
- Create: `src/components/header/HeaderNavbar.tsx`
- Create: `src/components/header/HeaderNavMenu.tsx`
- Create: `src/components/header/HeaderMobileMenu.tsx`
- Create: `src/blocks/HeaderNavbar12/Component.tsx`
- Create: `src/blocks/renderHeaderBlocks.tsx`
- Test: `tests/int/header-navbar-render.int.spec.ts`

**Interfaces:**
- Consumes:
  - `ResolvedHeaderMenuItem[]`
  - `ResolvedHeaderLink[]`
  - `SiteLogo`
- Produces:
  - `HeaderNavbar(props: { ctas: ResolvedHeaderLink[]; logo: React.ReactNode; menuItems: ResolvedHeaderMenuItem[]; navAlignment: 'left' | 'center' | 'right'; size: 'compact' | 'default' | 'large' })`
  - `HeaderNavbar12BlockComponent(props: HeaderNavbar12BlockShape & { siteLogo?: unknown; siteName?: string | null })`
  - `renderHeaderBlocks(blocks?: HeaderBlock[] | null, context?: { siteLogo?: unknown; siteName?: string | null }): React.ReactNode`

- [ ] **Step 1: Scaffold the required shadcn sources**

Run:

```bash
npx shadcn@latest add @shadcnblocks/navbar2
npx shadcn@latest add navigation-menu sheet accordion button
```

Expected: files are added under the project `@/components` aliases and can be adapted instead of copied from docs.

- [ ] **Step 2: Write the failing UI render test**

```ts
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { HeaderNavbar } from '@/components/header/HeaderNavbar'

describe('header navbar', () => {
  it('renders aligned menu items, dropdown children, and CTA buttons', () => {
    const html = renderToStaticMarkup(
      <HeaderNavbar
        ctas={[{ href: '/contact', label: 'Contact', newTab: false }]}
        logo={<span>Acme</span>}
        menuItems={[
          { href: '/work', label: 'Work', newTab: false },
          {
            href: '/services',
            label: 'Services',
            newTab: false,
            children: [{ href: '/services/web', label: 'Web', newTab: false }],
          },
        ]}
        navAlignment="center"
        size="default"
      />
    )

    expect(html).toContain('Acme')
    expect(html).toContain('Services')
    expect(html).toContain('Contact')
    expect(html).toContain('Web')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts
```

Expected: FAIL with missing `HeaderNavbar`.

- [ ] **Step 4: Implement the visual navbar, desktop nav, and mobile nav**

```tsx
// src/components/header/HeaderNavbar.tsx
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HeaderMobileMenu } from '@/components/header/HeaderMobileMenu'
import { HeaderNavMenu } from '@/components/header/HeaderNavMenu'
import { cn } from '@/lib/utils'
import type { ResolvedHeaderLink, ResolvedHeaderMenuItem } from '@/lib/headerNavigation'

const sizeClasses = {
  compact: 'min-h-14',
  default: 'min-h-18',
  large: 'min-h-24',
} as const

const navAlignmentClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

export function HeaderNavbar({
  ctas,
  logo,
  menuItems,
  navAlignment,
  size,
}: {
  ctas: ResolvedHeaderLink[]
  logo: React.ReactNode
  menuItems: ResolvedHeaderMenuItem[]
  navAlignment: 'left' | 'center' | 'right'
  size: 'compact' | 'default' | 'large'
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={cn('mx-auto flex w-full max-w-screen-2xl items-center gap-4 px-4', sizeClasses[size])}>
        <div className="shrink-0">{logo}</div>
        <div className={cn('hidden min-w-0 flex-1 lg:flex', navAlignmentClasses[navAlignment])}>
          <HeaderNavMenu menuItems={menuItems} />
        </div>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {ctas.map((item) => (
            <Button asChild key={item.href} variant="default">
              <a href={item.href} target={item.newTab ? '_blank' : undefined} rel={item.newTab ? 'noreferrer' : undefined}>
                {item.label}
              </a>
            </Button>
          ))}
        </div>
        <div className="ml-auto lg:hidden">
          <HeaderMobileMenu
            ctas={ctas}
            menuItems={menuItems}
            trigger={<Button size="icon" variant="ghost"><Menu /></Button>}
          />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Implement the block wrapper and renderer**

```tsx
// src/blocks/HeaderNavbar12/Component.tsx
import { HeaderNavbar } from '@/components/header/HeaderNavbar'
import { SiteLogo } from '@/components/site/SiteLogo'
import { resolveHeaderLink } from '@/lib/headerNavigation'

export function HeaderNavbar12BlockComponent(props: {
  ctaButtons?: Array<Record<string, unknown>> | null
  customLogoDark?: unknown
  customLogoLight?: unknown
  logoHeight?: number | null
  logoMode?: 'siteDefault' | 'customLogo' | null
  menuItems?: Array<Record<string, unknown>> | null
  navAlignment?: 'left' | 'center' | 'right' | null
  siteLogo?: unknown
  siteName?: string | null
  size?: 'compact' | 'default' | 'large' | null
}) {
  const menuItems = (props.menuItems ?? [])
    .map((item) => {
      const link = resolveHeaderLink(item)
      if (!link) return null
      const children = Array.isArray(item.children) ? item.children.map(resolveHeaderLink).filter(Boolean) : []
      return { ...link, children: children.length ? children : undefined }
    })
    .filter(Boolean)

  const ctas = (props.ctaButtons ?? []).map(resolveHeaderLink).filter(Boolean)

  return (
    <HeaderNavbar
      ctas={ctas}
      logo={
        <SiteLogo
          customDark={props.customLogoDark}
          customLight={props.customLogoLight}
          fallbackText={props.siteName?.trim() || 'Site'}
          height={props.logoHeight ?? 32}
          mode={props.logoMode ?? 'siteDefault'}
          siteLogo={props.siteLogo}
        />
      }
      menuItems={menuItems}
      navAlignment={props.navAlignment ?? 'center'}
      size={props.size ?? 'default'}
    />
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts
```

Expected: PASS with menu/child/CTA rendering verified.

- [ ] **Step 7: Commit**

```bash
git add src/components/header src/blocks/HeaderNavbar12/Component.tsx src/blocks/renderHeaderBlocks.tsx tests/int/header-navbar-render.int.spec.ts
git commit -m "feat: add header navbar ui"
```

### Task 4: Wire the active header into the frontend shell

**Files:**
- Create: `src/components/global/GlobalHeader.tsx`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/components/admin/AdminSessionBar.tsx` (only if an explicit test hook/class is needed)
- Modify: `src/payload-types.ts`
- Test: `tests/int/global-header.int.spec.ts`

**Interfaces:**
- Consumes:
  - `pageSettings.activeHeader`
  - `renderHeaderBlocks(blocks?: HeaderBlock[] | null)`
  - `HeaderNavbar12BlockComponent`
- Produces:
  - `GlobalHeader(props: { header?: { layout?: HeaderBlock[] | null } | null; siteLogo?: unknown; siteName?: string | null; stickyTopOffset?: string })`
  - root layout order: admin bar → global announcement → global header → main

- [ ] **Step 1: Write the failing global wiring test**

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('global header wiring', () => {
  it('fetches and renders the active header preset in the frontend shell', () => {
    const layoutSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'), 'utf8')

    expect(layoutSource).toContain("import { GlobalHeader } from '@/components/global/GlobalHeader'")
    expect(layoutSource).toContain('const activeHeader =')
    expect(layoutSource).toContain('<GlobalHeader')
    expect(layoutSource).toContain('stickyTopOffset={headerTopOffset}')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/global-header.int.spec.ts
```

Expected: FAIL because `GlobalHeader` is not wired in the root layout.

- [ ] **Step 3: Implement the global renderer and layout fetch**

```tsx
// src/components/global/GlobalHeader.tsx
import { renderHeaderBlocks } from '@/blocks/renderHeaderBlocks'

export function GlobalHeader({
  header,
  siteLogo,
  siteName,
  stickyTopOffset = '0px',
}: {
  header?: { layout?: Array<Record<string, unknown>> | null } | null
  siteLogo?: unknown
  siteName?: string | null
  stickyTopOffset?: string
}) {
  if (!header?.layout?.length) {
    return null
  }

  return (
    <div style={{ position: 'sticky', top: stickyTopOffset, zIndex: 999 }}>
      {renderHeaderBlocks(header.layout, { siteLogo, siteName })}
    </div>
  )
}

// src/app/(frontend)/layout.tsx
const activeHeaderID = pageSettings?.activeHeader
const activeHeader =
  activeHeaderID && typeof activeHeaderID === 'object' ? activeHeaderID : null
const headerTopOffset = `calc(${cmsToolbarOffset} + ${announcementItems?.length ? '3rem' : '0px'})`

<GlobalHeader
  header={activeHeader}
  siteLogo={frontendGlobals.siteSettings.logo}
  siteName={frontendGlobals.siteSettings.siteName}
  stickyTopOffset={headerTopOffset}
/>
```

Implementation note: if `page-settings.activeHeader` only returns an ID at current depth, add a targeted `payload.findByID({ collection: 'headers', depth: 2, id, })` inside `getFrontendGlobals()` and expose `activeHeader` in the returned object.

- [ ] **Step 4: Regenerate types and run the focused test suite**

Run:

```bash
./node_modules/.bin/payload generate:types
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/header-presets.int.spec.ts tests/int/header-navbar-render.int.spec.ts tests/int/global-header.int.spec.ts tests/int/media-governance.int.spec.ts
./node_modules/.bin/tsc --noEmit
```

Expected:

- Payload types regenerate without errors
- all four focused test files PASS
- TypeScript exits with code 0

- [ ] **Step 5: Commit**

```bash
git add src/components/global/GlobalHeader.tsx "src/app/(frontend)/layout.tsx" src/payload-types.ts tests/int/global-header.int.spec.ts
git commit -m "feat: render active global header"
```

## Self-Review

- Spec coverage:
  - `Headers` preset boundary: Task 1
  - block-level sticky/size/alignment/logo/menu/CTA schema: Task 1
  - site default/custom light-dark logo behavior: Task 2
  - shadcn/navbar-based desktop + mobile nav UI: Task 3
  - global shell rendering order: Task 4
  - media governance updates for custom logos: Task 2
- Placeholder scan:
  - No `TBD`, `TODO`, “similar to Task N”, or unscoped “add tests later” steps remain.
- Type consistency:
  - Plan consistently uses slug `headerNavbar12` to match existing media governance references.
  - Shared interfaces are defined before later tasks consume them.
