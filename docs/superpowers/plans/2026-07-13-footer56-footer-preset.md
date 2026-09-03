# Footer56 Footer Preset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable `footer56` footer preset block to the existing `Footers` collection and render the selected footer site-wide through `PageSettings.activeFooter`.

**Architecture:** Follow the existing header preset architecture: a collection-backed preset with a `layout` blocks field, a dedicated block folder under `src/blocks`, a thin renderer for footer blocks, and a global shell component rendered from the frontend layout. The visual structure is adapted from `@shadcnblocks/footer56`, but the link model, logo handling, and theme behavior are replaced with project-native patterns.

**Tech Stack:** Payload CMS 3, Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui radix-luma preset, lucide-react, react-icons, Vitest

## Global Constraints

- Extend the existing `Footers` collection with a `layout` blocks field
- Add one footer block variant: `footer56`
- Render the active footer site-wide from the current footer preset selection
- Follow the same development pattern as existing block components
- Adapt the `@shadcnblocks/footer56` layout concept to the project, rather than importing it unchanged
- Reuse the existing site logo behavior and existing CMS link model
- Use theme tokens only for color, borders, radius, and spacing behavior
- Keep the footer editorial and institutional rather than CTA-heavy
- `backgroundStyle` values are `default`, `muted`, `accent`, and `inverse`
- `inverse` maps to `bg-sidebar text-sidebar-foreground`
- `linkGroups` minimum rows: 1, maximum rows: 4
- The footer must render as top, middle, and bottom bands
- Do not treat this as a page-level layout block

---

### Task 1: Add the footer block schema and register it in `Footers`

**Files:**
- Create: `src/blocks/Footer56/config.ts`
- Create: `src/blocks/Footer56/thumbnail.ts`
- Modify: `src/collections/Footers.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**
- Consumes:
  - existing link field patterns from `src/blocks/HeaderNavbar12/config.ts`
  - `CollectionConfig` structure from `src/collections/Headers.ts`
- Produces:
  - `export const Footer56Block: Block`
  - `Footers.fields` includes `layout` blocks field
  - block slug `footer56`
  - footer block field names:
    - `logoMode`
    - `customLogoLight`
    - `customLogoDark`
    - `description`
    - `linkGroups`
    - `ctaButtons`
    - `bottomLinks`
    - `copyrightText`
    - `socialLinks`
    - `backgroundStyle`

- [ ] **Step 1: Write the failing schema tests**

Update `tests/int/system-page-blocks.int.spec.ts`:

```ts
  it('registers footer blocks only for footer presets and system blocks only for system pages', () => {
    expect(collectBlockSlugs(Pages.fields)).toEqual([])
    expect(collectBlockSlugs(Reviews.fields)).toEqual([])
    expect(collectBlockSlugs(Headers.fields)).toEqual([])
    expect(collectBlockSlugs(Footers.fields)).toEqual(['footer56'])
    expect(collectBlockSlugs(SystemPages.fields)).toEqual([
      'system404',
      'systemMaintenance',
      'systemComingSoon',
    ])
  })
```

Add a new footer schema test to `tests/int/page-blocks.int.spec.ts`:

```ts
  it('defines the footer56 schema with branding, link groups, utilities, and background style', async () => {
    const { Footer56Block } = await import('@/blocks/Footer56/config')

    const logoModeField = Footer56Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'logoMode',
    ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

    const linkGroupsField = Footer56Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'linkGroups',
    ) as { maxRows?: number; minRows?: number; type?: string } | undefined

    const ctaButtonsField = Footer56Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'ctaButtons',
    ) as { maxRows?: number; type?: string } | undefined

    const socialLinksField = Footer56Block.fields.find(
      (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'socialLinks',
    ) as { type?: string } | undefined

    const backgroundStyleField = Footer56Block.fields.find(
      (field) =>
        typeof field === 'object' && field !== null && 'name' in field && field.name === 'backgroundStyle',
    ) as { defaultValue?: string; options?: Array<{ value: string }>; type?: string } | undefined

    expect(logoModeField?.type).toBe('select')
    expect(logoModeField?.defaultValue).toBe('siteDefault')
    expect(logoModeField?.options?.map((option) => option.value)).toEqual(['siteDefault', 'customLogo'])
    expect(linkGroupsField?.type).toBe('array')
    expect(linkGroupsField?.minRows).toBe(1)
    expect(linkGroupsField?.maxRows).toBe(4)
    expect(ctaButtonsField?.type).toBe('array')
    expect(ctaButtonsField?.maxRows).toBe(2)
    expect(socialLinksField?.type).toBe('array')
    expect(backgroundStyleField?.type).toBe('select')
    expect(backgroundStyleField?.defaultValue).toBe('inverse')
    expect(backgroundStyleField?.options?.map((option) => option.value)).toEqual([
      'default',
      'muted',
      'accent',
      'inverse',
    ])
  })
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected:

- FAIL because `Footers.fields` has no `layout`
- FAIL because `@/blocks/Footer56/config` does not exist

- [ ] **Step 3: Add the footer block config and collection registration**

Create `src/blocks/Footer56/config.ts` with the same link field pattern used by the header block:

```ts
import type { ArrayField, Block, CheckboxField, Field, RadioField, SelectField } from 'payload'

import { footer56Thumbnail } from './thumbnail'

type LinkType = 'page' | 'custom'
type LogoMode = 'siteDefault' | 'customLogo'

const isPageLink = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'custom'

const isCustomLogo = (_data: unknown, siblingData: { logoMode?: LogoMode | null }) =>
  siblingData?.logoMode === 'customLogo'

const createLinkFields = (): Field[] => [
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
  } satisfies RadioField,
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    admin: { condition: isPageLink },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: { condition: isCustomLink },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

export const Footer56Block: Block = {
  slug: 'footer56',
  interfaceName: 'Footer56Block',
  admin: {
    images: {
      thumbnail: {
        alt: 'Footer 56 preview',
        url: footer56Thumbnail,
      },
    },
  },
  labels: {
    singular: 'Footer 56',
    plural: 'Footer 56',
  },
  fields: [
    {
      name: 'logoMode',
      type: 'select',
      defaultValue: 'siteDefault',
      options: [
        { label: 'Site Default Logo', value: 'siteDefault' },
        { label: 'Custom Logo Override', value: 'customLogo' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'customLogoLight',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: isCustomLogo },
    },
    {
      name: 'customLogoDark',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: isCustomLogo },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'linkGroups',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          minRows: 1,
          fields: createLinkFields(),
        } satisfies ArrayField,
      ],
    } satisfies ArrayField,
    {
      name: 'ctaButtons',
      type: 'array',
      maxRows: 2,
      fields: [
        ...createLinkFields(),
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'outline',
          options: [
            { label: 'Link', value: 'link' },
            { label: 'Outline', value: 'outline' },
            { label: 'Default', value: 'default' },
          ],
        } satisfies SelectField,
      ],
    } satisfies ArrayField,
    {
      name: 'bottomLinks',
      type: 'array',
      fields: createLinkFields(),
    } satisfies ArrayField,
    {
      name: 'copyrightText',
      type: 'text',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X / Twitter', value: 'twitter' },
            { label: 'GitHub', value: 'github' },
          ],
        } satisfies SelectField,
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    } satisfies ArrayField,
    {
      name: 'backgroundStyle',
      type: 'select',
      defaultValue: 'inverse',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
        { label: 'Inverse', value: 'inverse' },
      ],
      required: true,
    } satisfies SelectField,
  ],
}
```

Create `src/blocks/Footer56/thumbnail.ts`:

```ts
export const footer56Thumbnail =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" fill="none"><rect width="640" height="360" rx="24" fill="%23131418"/><rect x="48" y="56" width="160" height="18" rx="6" fill="%23F5F5F5"/><rect x="48" y="92" width="200" height="10" rx="5" fill="%23757B85"/><rect x="48" y="110" width="184" height="10" rx="5" fill="%23757B85"/><rect x="48" y="152" width="16" height="16" rx="8" fill="%23F5F5F5"/><rect x="76" y="152" width="16" height="16" rx="8" fill="%23F5F5F5"/><rect x="104" y="152" width="16" height="16" rx="8" fill="%23F5F5F5"/><rect x="312" y="58" width="70" height="10" rx="5" fill="%23F5F5F5"/><rect x="312" y="92" width="92" height="8" rx="4" fill="%23757B85"/><rect x="312" y="112" width="84" height="8" rx="4" fill="%23757B85"/><rect x="312" y="132" width="78" height="8" rx="4" fill="%23757B85"/><rect x="446" y="58" width="70" height="10" rx="5" fill="%23F5F5F5"/><rect x="446" y="92" width="92" height="8" rx="4" fill="%23757B85"/><rect x="446" y="112" width="84" height="8" rx="4" fill="%23757B85"/><rect x="446" y="132" width="78" height="8" rx="4" fill="%23757B85"/><rect x="48" y="262" width="544" height="1" fill="%23363A45"/><rect x="48" y="286" width="148" height="8" rx="4" fill="%23757B85"/><rect x="456" y="286" width="56" height="8" rx="4" fill="%23757B85"/><rect x="524" y="286" width="68" height="8" rx="4" fill="%23757B85"/></svg>'
```

Update `src/collections/Footers.ts`:

```ts
import { Footer56Block } from '@/blocks/Footer56/config'

// ...

    {
      name: 'layout',
      type: 'blocks',
      blocks: [Footer56Block],
    },
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS for the new footer registration and schema assertions.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/Footer56/config.ts src/blocks/Footer56/thumbnail.ts src/collections/Footers.ts tests/int/system-page-blocks.int.spec.ts tests/int/page-blocks.int.spec.ts
git commit -m "feat: add footer preset block schema"
```

### Task 2: Build the footer renderer and global footer shell

**Files:**
- Create: `src/blocks/Footer56/Component.tsx`
- Create: `src/blocks/renderFooterBlocks.tsx`
- Create: `src/components/global/GlobalFooter.tsx`
- Create: `tests/int/global-footer.int.spec.ts`

**Interfaces:**
- Consumes:
  - `Footer56Block` field contract from Task 1
  - `SiteLogo` and `LogoMediaLike` from `@/components/site/SiteLogo`
  - `resolveHeaderLink` from `@/lib/headerNavigation`
- Produces:
  - `export function Footer56BlockComponent(props: Footer56BlockComponentProps): JSX.Element`
  - `export function renderFooterBlocks(blocks?: FooterBlock[] | null, context?: { siteLogo?: LogoMediaLike; siteName?: string | null }): JSX.Element | null`
  - `export function GlobalFooter(props: GlobalFooterProps): JSX.Element | null`

- [ ] **Step 1: Write the failing global footer tests**

Create `tests/int/global-footer.int.spec.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { GlobalFooter } from '@/components/global/GlobalFooter'

describe('global footer wiring', () => {
  it('renders nothing without a configured active footer layout', () => {
    expect(renderToStaticMarkup(createElement(GlobalFooter, { footer: null }))).toBe('')
    expect(
      renderToStaticMarkup(
        createElement(GlobalFooter, {
          footer: {
            layout: [],
          },
        }),
      ),
    ).toBe('')
  })

  it('renders the active footer preset with branding, links, and utility row', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalFooter, {
        footer: {
          layout: [
            {
              backgroundStyle: 'inverse',
              blockType: 'footer56',
              bottomLinks: [{ label: 'Privacy Policy', linkType: 'custom', url: '/privacy' }],
              copyrightText: '© 2026 Acme Institute. All rights reserved.',
              ctaButtons: [{ label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'outline' }],
              description: 'Preparing students for decisive practice and public service.',
              linkGroups: [
                {
                  links: [{ label: 'Programs', linkType: 'custom', url: '/programs' }],
                  title: 'Academics',
                },
              ],
              logoMode: 'siteDefault',
              socialLinks: [{ platform: 'linkedin', url: 'https://example.com/linkedin' }],
            },
          ],
        } as never,
        siteLogo: null,
        siteName: 'Acme Institute',
      }),
    )

    expect(html).toContain('data-global-footer="true"')
    expect(html).toContain('data-footer56-background="inverse"')
    expect(html).toContain('Acme Institute')
    expect(html).toContain('Programs')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Apply now')
    expect(html).toContain('© 2026 Acme Institute. All rights reserved.')
  })

  it('fetches and renders the active footer preset in the frontend shell', () => {
    const layoutSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'), 'utf8')

    expect(layoutSource).toContain("import { GlobalFooter } from '@/components/global/GlobalFooter'")
    expect(layoutSource).toContain('const activeFooterID =')
    expect(layoutSource).toContain('const activeFooter =')
    expect(layoutSource).toContain("collection: 'footers'")
    expect(layoutSource).toContain('<GlobalFooter')

    const headerIndex = layoutSource.indexOf('<GlobalHeader')
    const mainIndex = layoutSource.indexOf('<main data-site-main=\"true\">')
    const footerIndex = layoutSource.indexOf('<GlobalFooter')

    expect(footerIndex).toBeGreaterThan(mainIndex)
    expect(mainIndex).toBeGreaterThan(headerIndex)
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts
```

Expected: FAIL with `Cannot find module '@/components/global/GlobalFooter'`.

- [ ] **Step 3: Build the footer component and render path**

Create `src/blocks/renderFooterBlocks.tsx`:

```tsx
import type { Footer } from '@/payload-types'
import type { LogoMediaLike } from '@/components/site/SiteLogo'

import { Footer56BlockComponent } from './Footer56/Component'

export type FooterBlock = NonNullable<Footer['layout']>[number]

export function renderFooterBlocks(
  blocks?: FooterBlock[] | null,
  context?: { siteLogo?: LogoMediaLike; siteName?: string | null },
) {
  if (!blocks?.length) {
    return null
  }

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.blockType) {
          case 'footer56':
            return (
              <Footer56BlockComponent
                key={block.id ?? `${block.blockType}-${index}`}
                siteLogo={context?.siteLogo}
                siteName={context?.siteName}
                {...block}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
```

Create `src/components/global/GlobalFooter.tsx`:

```tsx
import { renderFooterBlocks } from '@/blocks/renderFooterBlocks'
import type { LogoMediaLike } from '@/components/site/SiteLogo'
import type { Footer } from '@/payload-types'

type GlobalFooterProps = {
  footer?: Pick<Footer, 'layout'> | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
}

export function GlobalFooter({ footer, siteLogo, siteName }: GlobalFooterProps) {
  if (!footer?.layout?.length) {
    return null
  }

  return (
    <div data-global-footer="true">
      {renderFooterBlocks(footer.layout, { siteLogo, siteName })}
    </div>
  )
}
```

Create `src/blocks/Footer56/Component.tsx` by adapting the shadcnblocks layout into project-native primitives:

```tsx
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from 'react-icons/fa'

import { Button } from '@/components/ui/button'
import { SiteLogo, type LogoMediaLike } from '@/components/site/SiteLogo'
import { cn } from '@/lib/utils'
import { resolveHeaderLink } from '@/lib/headerNavigation'
import type { Footer56Block as Footer56BlockType } from '@/payload-types'

type Footer56BlockComponentProps = Footer56BlockType & {
  siteLogo?: LogoMediaLike
  siteName?: string | null
}

const backgroundClasses = {
  default: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  accent: 'bg-accent text-accent-foreground',
  inverse: 'bg-sidebar text-sidebar-foreground',
} as const

const socialIconByPlatform = {
  facebook: FaFacebook,
  github: FaGithub,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  twitter: FaTwitter,
} as const

export function Footer56BlockComponent({
  backgroundStyle = 'inverse',
  bottomLinks,
  copyrightText,
  ctaButtons,
  customLogoDark,
  customLogoLight,
  description,
  linkGroups,
  logoMode = 'siteDefault',
  siteLogo,
  siteName,
  socialLinks,
}: Footer56BlockComponentProps) {
  const resolvedCtas = (ctaButtons ?? [])
    .map((button) => {
      const link = resolveHeaderLink(button)
      if (!link) return null
      return { ...link, label: button.label?.trim() ?? '', variant: button.variant ?? 'outline' }
    })
    .filter((button): button is NonNullable<typeof button> => Boolean(button?.href && button?.label))

  const resolvedBottomLinks = (bottomLinks ?? [])
    .map((link) => resolveHeaderLink(link))
    .filter((link): link is NonNullable<typeof link> => Boolean(link?.href))

  return (
    <section
      className={cn('border-t border-border/70', backgroundClasses[backgroundStyle])}
      data-footer56-background={backgroundStyle}
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col px-4 py-12 md:py-16">
        <div className="grid gap-10 border-b border-border/70 pb-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-6">
            <a aria-label={`Go to ${siteName?.trim() || 'home page'}`} className="inline-flex items-center" href="/">
              <SiteLogo
                customDark={customLogoDark}
                customLight={customLogoLight}
                fallbackText={siteName?.trim() || 'Site'}
                height={32}
                mode={logoMode}
                siteLogo={siteLogo}
              />
            </a>
            {description ? <p className="max-w-[34ch] text-sm leading-6 opacity-80">{description}</p> : null}
            {resolvedCtas.length ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {resolvedCtas.map((button) => (
                  <Button asChild key={`${button.label}-${button.href}`} variant={button.variant}>
                    <a href={button.href} rel={button.openInNewTab ? 'noreferrer' : undefined} target={button.openInNewTab ? '_blank' : undefined}>
                      {button.label}
                    </a>
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {(linkGroups ?? []).map((group, groupIndex) => (
              <div className="flex flex-col gap-4" key={`${group.title}-${groupIndex}`}>
                <h3 className="font-mono text-xs uppercase tracking-[0.18em] opacity-70">{group.title}</h3>
                <ul className="flex flex-col gap-3 text-sm">
                  {(group.links ?? []).map((link, linkIndex) => {
                    const resolvedLink = resolveHeaderLink(link)
                    return resolvedLink ? (
                      <li key={`${group.title}-${linkIndex}`}>
                        <a href={resolvedLink.href} rel={resolvedLink.openInNewTab ? 'noreferrer' : undefined} target={resolvedLink.openInNewTab ? '_blank' : undefined}>
                          {link.label}
                        </a>
                      </li>
                    ) : null
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {copyrightText ? <p className="text-xs opacity-70">{copyrightText}</p> : null}
            {resolvedBottomLinks.length ? (
              <ul className="flex flex-wrap gap-4 text-xs">
                {resolvedBottomLinks.map((link, linkIndex) => (
                  <li key={`${link.href}-${linkIndex}`}>
                    <a href={link.href} rel={link.openInNewTab ? 'noreferrer' : undefined} target={link.openInNewTab ? '_blank' : undefined}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {(socialLinks ?? []).length ? (
            <ul className="flex flex-wrap gap-4">
              {(socialLinks ?? []).map((social, socialIndex) => {
                const Icon = socialIconByPlatform[social.platform]
                return (
                  <li key={`${social.platform}-${socialIndex}`}>
                    <a aria-label={social.platform} href={social.url}>
                      <Icon className="size-4" />
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts
```

Expected: PASS for the global footer shell and frontend layout source assertions.

- [ ] **Step 5: Commit**

```bash
git add src/blocks/Footer56/Component.tsx src/blocks/renderFooterBlocks.tsx src/components/global/GlobalFooter.tsx tests/int/global-footer.int.spec.ts
git commit -m "feat: add global footer rendering"
```

### Task 3: Wire the active footer into the frontend layout and generate Payload types

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/payload-types.ts`
- Modify: `tests/int/global-footer.int.spec.ts`

**Interfaces:**
- Consumes:
  - `GlobalFooter` from Task 2
  - `activeFooter` relationship from `PageSettings`
- Produces:
  - frontend shell fetches the published active footer preset
  - `RootLayout` renders `<GlobalFooter />` after `<main>`
  - generated `Footer56Block` and `Footer.layout` types

- [ ] **Step 1: Write the failing layout integration assertions**

Extend `tests/int/global-footer.int.spec.ts` with ordering checks:

```ts
    const announcementIndex = layoutSource.indexOf('<GlobalAnnouncement')
    const headerIndex = layoutSource.indexOf('<GlobalHeader')
    const mainIndex = layoutSource.indexOf('<main data-site-main=\"true\">')
    const footerIndex = layoutSource.indexOf('<GlobalFooter')

    expect(footerIndex).toBeGreaterThan(mainIndex)
    expect(mainIndex).toBeGreaterThan(headerIndex)
    expect(headerIndex).toBeGreaterThan(announcementIndex)
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts
```

Expected: FAIL because `layout.tsx` does not yet fetch or render `activeFooter`.

- [ ] **Step 3: Wire frontend footer fetching and regenerate types**

Update `src/app/(frontend)/layout.tsx`:

```tsx
import { GlobalFooter } from '@/components/global/GlobalFooter'
import type { Footer, Header } from '@/payload-types'

// inside getFrontendGlobals:
  const activeFooterID =
    typeof pageSettings?.activeFooter === 'string' || typeof pageSettings?.activeFooter === 'number'
      ? pageSettings.activeFooter
      : typeof pageSettings?.activeFooter === 'object' && pageSettings.activeFooter !== null
        ? pageSettings.activeFooter.id
        : null

  const activeFooterResult =
    activeFooterID == null
      ? null
      : await payload.find({
          collection: 'footers',
          where: {
            and: [
              { id: { equals: activeFooterID } },
              { _status: { equals: 'published' } },
            ],
          },
          depth: 2,
          limit: 1,
        })

  const activeFooter = (activeFooterResult?.docs[0] ?? null) as Footer | null

// return activeFooter
```

Render after `main`:

```tsx
          <main data-site-main="true">{children}</main>
          <GlobalFooter
            footer={activeFooter}
            siteLogo={siteSettings.logo}
            siteName={siteSettings.siteName}
          />
```

Regenerate types:

```bash
npm run generate:types
```

Expected generated changes:

```ts
export interface Footer56Block { /* generated block fields */ blockType: 'footer56' }
export interface Footer {
  layout?: Footer56Block[] | null
}
```

- [ ] **Step 4: Run the focused verification**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts
./node_modules/.bin/tsc --noEmit
```

Expected: PASS for footer layout integration and type generation.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(frontend)/layout.tsx' src/payload-types.ts tests/int/global-footer.int.spec.ts
git commit -m "feat: wire active footer preset"
```

### Task 4: Update media governance and stale footer references

**Files:**
- Modify: `src/lib/mediaUsage.ts`
- Modify: `tests/int/media-governance.int.spec.ts`

**Interfaces:**
- Consumes:
  - `Footer56Block` media fields from Task 1
- Produces:
  - media usage resolver understands `footer56` custom footer logos

- [ ] **Step 1: Write the failing media usage assertion**

Update the `footers` branch in `tests/int/media-governance.int.spec.ts`:

```ts
          case 'footers':
            return {
              docs: [
                {
                  id: 50,
                  layout: [
                    {
                      blockType: 'footer56',
                      customLogoDark: 7,
                      customLogoLight: 7,
                      logoMode: 'customLogo',
                    },
                  ],
                  title: 'Site Footer',
                },
              ],
            }
```

Add footer expectations:

```ts
        expect.objectContaining({
          documentID: 50,
          documentLabel: 'Site Footer',
          fieldPath: 'layout[0].customLogoLight',
          locationLabel: 'Footers > Site Footer > layout[0].customLogoLight',
          sourceSlug: 'footers',
          sourceType: 'collection',
        }),
        expect.objectContaining({
          documentID: 50,
          documentLabel: 'Site Footer',
          fieldPath: 'layout[0].customLogoDark',
          locationLabel: 'Footers > Site Footer > layout[0].customLogoDark',
          sourceSlug: 'footers',
          sourceType: 'collection',
        }),
```

Update counts:

```ts
    expect(references).toHaveLength(9)
    expect(buildMediaUsageSummary(references)).toBe('Used in 9 locations across 7 entries.')
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/media-governance.int.spec.ts
```

Expected: FAIL because `mediaUsage.ts` still checks `footer2` and `customLogo`.

- [ ] **Step 3: Update footer media usage resolution**

Patch the `footers` branch in `src/lib/mediaUsage.ts`:

```ts
      layout.forEach((block, blockIndex) => {
        if (!block || typeof block !== 'object' || block === null || block.blockType !== 'footer56') {
          return
        }

        if (block.logoMode !== 'customLogo') {
          return
        }

        pushIfMatched({
          mediaID,
          reference: createCollectionReference({
            doc,
            documentLabel,
            fieldPath: `layout[${blockIndex}].customLogoLight`,
            slug: 'footers',
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
            slug: 'footers',
          }),
          references,
          value: block.customLogoDark as RelationshipValue,
        })
      })
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts tests/int/media-governance.int.spec.ts
```

Expected: PASS with the updated footer media references and counts.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mediaUsage.ts tests/int/media-governance.int.spec.ts
git commit -m "fix: update footer media usage"
```

### Task 5: Run the full focused footer verification

**Files:**
- Modify: none
- Test: `tests/int/system-page-blocks.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/global-footer.int.spec.ts`
- Test: `tests/int/media-governance.int.spec.ts`

**Interfaces:**
- Consumes:
  - all interfaces from Tasks 1–4
- Produces:
  - validated footer preset feature set

- [ ] **Step 1: Run the focused footer test suite**

Run:

```bash
./node_modules/.bin/vitest run --config ./vitest.config.mts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/global-footer.int.spec.ts \
  tests/int/media-governance.int.spec.ts
```

Expected: PASS for all footer-related tests.

- [ ] **Step 2: Run the project typecheck**

Run:

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: PASS with generated footer types and global layout wiring intact.

- [ ] **Step 3: Confirm the footer worktree is clean**

Run:

```bash
git status --short
```

Expected: no modified footer-related source or test files remain after Tasks 1–4 commits.
