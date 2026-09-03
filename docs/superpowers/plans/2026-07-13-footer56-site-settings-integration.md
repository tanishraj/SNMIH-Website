# Footer56 Site Settings Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `footer56` footer preset so site-wide contact, social, and privacy data come from `Site Settings`, while the footer block keeps layout, branding overrides, and footer-authored utility content.

**Architecture:** Keep `Site Settings` as the single source of truth for contact and legal metadata, then thread those values through the existing frontend layout → global footer → footer block render pipeline. Preserve the existing `footer56` block shape where it still makes sense, only adding a logo height override and removing footer-authored social data.

**Tech Stack:** Payload CMS 3.85.x globals and blocks, Next.js App Router, React 19 server rendering, TypeScript, Vitest integration tests

## Global Constraints

- add a block-level logo height override
- remove footer-authored social link data
- render address, phone, and email from `Site Settings`
- render social icons from `Site Settings.socialLinks`
- add `privacyPolicyPage` to `Site Settings`
- render privacy policy alongside footer utility links in the footer bottom row
- `logoHeight` minimum value: `20`
- logo height uses `logoHeight` when provided and `32` when not provided
- the footer block component must not read `Site Settings` directly
- the revised footer must remain restrained, institutional, theme-driven, and compatible with both light and dark themes

---

## File Map

- Modify: `src/blocks/Footer56/config.ts`
  - Add the `logoHeight` field and remove the footer-owned `socialLinks` array.
- Modify: `src/globals/SiteSettings.ts`
  - Add the canonical `privacyPolicyPage` relationship under the existing site settings tabs.
- Modify: `tests/int/page-blocks.int.spec.ts`
  - Lock the footer block schema and site settings schema contract with focused assertions.
- Modify: `src/blocks/Footer56/Component.tsx`
  - Replace footer-authored social rendering with site-settings-driven contact, social, and privacy rendering.
- Modify: `src/blocks/renderFooterBlocks.tsx`
  - Expand the footer render context contract passed into `Footer56BlockComponent`.
- Modify: `src/components/global/GlobalFooter.tsx`
  - Accept and forward the expanded footer site context.
- Modify: `src/app/(frontend)/layout.tsx`
  - Fetch the privacy page with sufficient depth and pass site settings values into `GlobalFooter`.
- Modify: `tests/int/global-footer.int.spec.ts`
  - Verify renderer wiring, left-column ordering, privacy link rendering, and layout-level context wiring.
- Modify: `src/payload-types.ts`
  - Regenerate Payload types after schema changes.

### Task 1: Lock the footer schema and site settings contract

**Files:**
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `src/blocks/Footer56/config.ts`
- Modify: `src/globals/SiteSettings.ts`

**Interfaces:**
- Consumes: existing `Footer56Block.fields` and `SiteSettings.fields` definitions
- Produces:
  - `Footer56Block.fields` with `logoHeight?: number` and no `socialLinks`
  - `SiteSettings.fields` with `privacyPolicyPage?: Page`

- [ ] **Step 1: Write the failing schema tests**

Update `tests/int/page-blocks.int.spec.ts` inside `it('defines the footer56 schema with branding, link groups, utilities, and background style', ...)` and add a site-settings assertion block:

```ts
const logoHeightField = Footer56Block.fields.find(
  (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'logoHeight',
) as { min?: number; type?: string } | undefined

const socialLinksField = Footer56Block.fields.find(
  (field) => typeof field === 'object' && field !== null && 'name' in field && field.name === 'socialLinks',
) as { type?: string } | undefined

expect(logoHeightField?.type).toBe('number')
expect(logoHeightField?.min).toBe(20)
expect(socialLinksField).toBeUndefined()

const siteSettingsTabs = SiteSettings.fields.find(
  (field) => typeof field === 'object' && field !== null && 'tabs' in field,
) as { tabs: Array<{ fields: unknown[]; label: string }> } | undefined

const contactTab = siteSettingsTabs?.tabs.find((tab) => tab.label === 'Contact')

const privacyPolicyField = contactTab?.fields.find(
  (field) =>
    typeof field === 'object' && field !== null && 'name' in field && field.name === 'privacyPolicyPage',
) as { relationTo?: string; type?: string } | undefined

expect(privacyPolicyField?.type).toBe('relationship')
expect(privacyPolicyField?.relationTo).toBe('pages')
```

Also add the missing import near the top of the file:

```ts
import { SiteSettings } from '@/globals/SiteSettings'
```

- [ ] **Step 2: Run the schema tests to verify they fail**

Run: `pnpm test:int -- --runInBand tests/int/page-blocks.int.spec.ts`

Expected: FAIL because `logoHeight` is missing, `socialLinks` still exists, and `privacyPolicyPage` is not defined on `SiteSettings`.

- [ ] **Step 3: Implement the schema changes**

In `src/blocks/Footer56/config.ts`, add `logoHeight` after the custom logo upload fields and delete the `socialLinks` array field:

```ts
{
  name: 'logoHeight',
  label: 'Logo Height',
  type: 'number',
  min: 20,
  admin: {
    description: 'Overrides the rendered footer logo height in pixels.',
  },
},
```

In `src/globals/SiteSettings.ts`, add the privacy policy relationship to the existing `Contact` tab after `googleMapEmbedUrl`:

```ts
{
  name: 'privacyPolicyPage',
  label: 'Privacy Policy Page',
  type: 'relationship',
  relationTo: 'pages',
},
```

Keep the rest of the contact and social fields unchanged in this task.

- [ ] **Step 4: Run the schema tests to verify they pass**

Run: `pnpm test:int -- --runInBand tests/int/page-blocks.int.spec.ts`

Expected: PASS for the footer schema and site settings assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/int/page-blocks.int.spec.ts src/blocks/Footer56/config.ts src/globals/SiteSettings.ts
git commit -m "feat: align footer schema with site settings"
```

### Task 2: Render contact, social, privacy, and logo height from shared footer context

**Files:**
- Modify: `tests/int/global-footer.int.spec.ts`
- Modify: `src/blocks/Footer56/Component.tsx`
- Modify: `src/blocks/renderFooterBlocks.tsx`
- Modify: `src/components/global/GlobalFooter.tsx`

**Interfaces:**
- Consumes:
  - `Footer56Block.fields.logoHeight?: number`
  - `SiteLogo` from `@/components/site/SiteLogo`
  - `getPageHref(page)` from `@/lib/pagePaths`
- Produces:
  - `renderFooterBlocks(blocks, context)` where `context` is:

```ts
{
  siteLogo?: LogoMediaLike
  siteName?: string | null
  siteAddress?: string | null
  sitePhone?: string | null
  siteEmail?: string | null
  siteSocialLinks?: {
    facebook?: string | null
    instagram?: string | null
    linkedin?: string | null
    youtube?: string | null
  } | null
  privacyPolicyPage?: Page | null
}
```

- [ ] **Step 1: Write the failing footer renderer tests**

Update `tests/int/global-footer.int.spec.ts` so the shared renderer test passes site settings data instead of block-authored social links:

```ts
renderFooterBlocks(
  [
    {
      backgroundStyle: 'inverse',
      blockType: 'footer56',
      bottomLinks: [{ label: 'Terms and Conditions', linkType: 'custom', url: '/terms' }],
      copyrightText: '© 2026 Acme Institute. All rights reserved.',
      ctaButtons: [{ label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'outline' }],
      description: 'Preparing students for decisive practice and public service.',
      linkGroups: [
        {
          links: [{ label: 'Programs', linkType: 'custom', url: '/programs' }],
          title: 'Academics',
        },
      ],
      logoHeight: 44,
      logoMode: 'siteDefault',
    },
  ] as never,
  {
    privacyPolicyPage: { id: 'privacy-page', slug: 'privacy-policy', title: 'Privacy Policy' } as never,
    siteAddress: '123 Market Street, Suite 400',
    siteEmail: 'hello@acme.edu',
    siteLogo: null,
    siteName: 'Acme Institute',
    sitePhone: '+1 (555) 000-0000',
    siteSocialLinks: {
      linkedin: 'https://example.com/linkedin',
      youtube: 'https://example.com/youtube',
    },
  },
)
```

Add these assertions to the same test:

```ts
expect(html).toContain('123 Market Street, Suite 400')
expect(html).toContain('+1 (555) 000-0000')
expect(html).toContain('hello@acme.edu')
expect(html).toContain('Privacy Policy')
expect(html).toContain('Terms and Conditions')
expect(html).toContain('linkedin')
expect(html).toContain('youtube')
expect(html).toContain('height:44px')

const descriptionIndex = html.indexOf('Preparing students for decisive practice and public service.')
const addressIndex = html.indexOf('123 Market Street, Suite 400')
const phoneIndex = html.indexOf('+1 (555) 000-0000')
const emailIndex = html.indexOf('hello@acme.edu')
const linkedInIndex = html.indexOf('linkedin')

expect(addressIndex).toBeGreaterThan(descriptionIndex)
expect(phoneIndex).toBeGreaterThan(addressIndex)
expect(emailIndex).toBeGreaterThan(phoneIndex)
expect(linkedInIndex).toBeGreaterThan(emailIndex)
expect(html).not.toContain('github')
```

Update the active footer shell test so `GlobalFooter` receives:

```ts
siteAddress: '123 Market Street, Suite 400',
siteEmail: 'hello@acme.edu',
sitePhone: '+1 (555) 000-0000',
siteSocialLinks: { facebook: 'https://example.com/facebook' },
```

- [ ] **Step 2: Run the footer renderer tests to verify they fail**

Run: `pnpm test:int -- --runInBand tests/int/global-footer.int.spec.ts`

Expected: FAIL because `renderFooterBlocks` and `GlobalFooter` do not accept the extra site context yet, `Footer56BlockComponent` still expects `socialLinks`, and the footer markup does not contain contact or privacy content.

- [ ] **Step 3: Implement the shared footer context**

In `src/blocks/renderFooterBlocks.tsx`, widen the `context` parameter and pass every field into `Footer56BlockComponent`:

```ts
import type { Page } from '@/payload-types'

export function renderFooterBlocks(
  blocks?: FooterBlock[] | null,
  context?: {
    privacyPolicyPage?: Page | null
    siteAddress?: string | null
    siteEmail?: string | null
    siteLogo?: LogoMediaLike
    siteName?: string | null
    sitePhone?: string | null
    siteSocialLinks?: {
      facebook?: string | null
      instagram?: string | null
      linkedin?: string | null
      youtube?: string | null
    } | null
  },
) {
  // ...
  return (
    <Footer56BlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      privacyPolicyPage={context?.privacyPolicyPage}
      siteAddress={context?.siteAddress}
      siteEmail={context?.siteEmail}
      siteLogo={context?.siteLogo}
      siteName={context?.siteName}
      sitePhone={context?.sitePhone}
      siteSocialLinks={context?.siteSocialLinks}
      {...block}
    />
  )
}
```

In `src/components/global/GlobalFooter.tsx`, mirror the same prop contract and forward it:

```ts
import type { Footer, Page } from '@/payload-types'

type GlobalFooterProps = {
  footer?: Pick<Footer, 'layout'> | null
  privacyPolicyPage?: Page | null
  siteAddress?: string | null
  siteEmail?: string | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
  sitePhone?: string | null
  siteSocialLinks?: {
    facebook?: string | null
    instagram?: string | null
    linkedin?: string | null
    youtube?: string | null
  } | null
}
```

In `src/blocks/Footer56/Component.tsx`, remove `socialLinks` from the props, import `getPageHref`, use `logoHeight ?? 32`, build the site-driven social list, and render privacy on the right-side utility row:

```ts
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa'
import { getPageHref } from '@/lib/pagePaths'
import type { Footer56Block as Footer56BlockType, Page } from '@/payload-types'

type Footer56BlockComponentProps = Footer56BlockType & {
  privacyPolicyPage?: Page | null
  siteAddress?: string | null
  siteEmail?: string | null
  siteLogo?: LogoMediaLike
  siteName?: string | null
  sitePhone?: string | null
  siteSocialLinks?: {
    facebook?: string | null
    instagram?: string | null
    linkedin?: string | null
    youtube?: string | null
  } | null
}

const socialIconByPlatform = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
} as const

const resolvedSiteSocialLinks = Object.entries(siteSocialLinks ?? {})
  .filter((entry): entry is [keyof typeof socialIconByPlatform, string] => {
    const [platform, url] = entry
    return platform in socialIconByPlatform && typeof url === 'string' && url.trim().length > 0
  })
  .map(([platform, url]) => ({ platform, url: url.trim() }))

const privacyHref = getPageHref(privacyPolicyPage)

const resolvedBottomLinks = [
  ...(bottomLinks ?? [])
    .map((link) => resolveHeaderLink(link))
    .filter((link): link is NonNullable<typeof link> => link !== null),
  ...(privacyHref ? [{ href: privacyHref, label: 'Privacy Policy', newTab: false }] : []),
]

const resolvedLogoHeight = Math.max(20, logoHeight ?? 32)
```

Render the left column in this order:

```tsx
<a aria-label={`Go to ${fallbackName} home page`} className="inline-flex items-center" href="/">
  <SiteLogo
    customDark={customLogoDark}
    customLight={customLogoLight}
    fallbackText={fallbackName}
    height={resolvedLogoHeight}
    mode={logoMode}
    siteLogo={siteLogo}
  />
</a>
{description ? <p className="max-w-[36ch] text-sm leading-6 text-current/75">{description}</p> : null}
{siteAddress ? <p className="max-w-[36ch] whitespace-pre-line text-sm leading-6 text-current/75">{siteAddress}</p> : null}
{sitePhone ? <p className="text-sm leading-6 text-current/75">{sitePhone}</p> : null}
{siteEmail ? <a className="text-sm leading-6 text-current/75 transition-opacity hover:opacity-70" href={`mailto:${siteEmail}`}>{siteEmail}</a> : null}
{resolvedSiteSocialLinks.length ? (
  <ul className="flex flex-wrap gap-4">
    {resolvedSiteSocialLinks.map(({ platform, url }) => {
      const Icon = socialIconByPlatform[platform]
      return (
        <li key={platform}>
          <a aria-label={`${fallbackName} on ${platform}`} className="inline-flex items-center justify-center text-current/70 transition-opacity hover:opacity-100 focus-visible:opacity-100" href={url} rel="noreferrer" target="_blank">
            <Icon className="size-4" />
          </a>
        </li>
      )
    })}
  </ul>
) : null}
```

Keep the existing CTA buttons below the social block so the revision stays backward-compatible with the stored `ctaButtons` field.

- [ ] **Step 4: Run the footer renderer tests to verify they pass**

Run: `pnpm test:int -- --runInBand tests/int/global-footer.int.spec.ts`

Expected: PASS with site-driven contact info, site-driven social icons, privacy policy rendering, and the footer logo using the block-defined height.

- [ ] **Step 5: Commit**

```bash
git add tests/int/global-footer.int.spec.ts src/blocks/Footer56/Component.tsx src/blocks/renderFooterBlocks.tsx src/components/global/GlobalFooter.tsx
git commit -m "feat: render footer site metadata"
```

### Task 3: Wire site settings into the frontend shell and regenerate types

**Files:**
- Modify: `tests/int/global-footer.int.spec.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/payload-types.ts`

**Interfaces:**
- Consumes:
  - `GlobalFooterProps` from Task 2
  - `SiteSettings.privacyPolicyPage`
- Produces:
  - frontend layout wiring that passes `siteAddress`, `sitePhone`, `siteEmail`, `siteSocialLinks`, and `privacyPolicyPage`
  - regenerated Payload types reflecting `logoHeight` and `privacyPolicyPage`

- [ ] **Step 1: Write the failing layout wiring assertions**

Update the final test in `tests/int/global-footer.int.spec.ts` so it checks the frontend shell for the expanded `GlobalFooter` call:

```ts
expect(layoutSource).toContain("payload.findGlobal({\n      slug: 'site-settings',\n      depth: 2,")
expect(layoutSource).toContain('privacyPolicyPage={siteSettings.privacyPolicyPage}')
expect(layoutSource).toContain('siteAddress={siteSettings.address}')
expect(layoutSource).toContain('sitePhone={siteSettings.contactPhone}')
expect(layoutSource).toContain('siteEmail={siteSettings.contactEmail}')
expect(layoutSource).toContain('siteSocialLinks={siteSettings.socialLinks}')
```

Replace the old exact JSX assertion with:

```ts
expect(layoutSource).toContain('<GlobalFooter')
```

Keep the existing main-before-footer ordering assertion.

- [ ] **Step 2: Run the layout wiring test to verify it fails**

Run: `pnpm test:int -- --runInBand tests/int/global-footer.int.spec.ts -t "fetches and renders the active footer preset in the frontend shell"`

Expected: FAIL because `site-settings` is still loaded at depth `1` and the `GlobalFooter` JSX does not yet pass the extra context props.

- [ ] **Step 3: Implement the layout wiring and regenerate types**

In `src/app/(frontend)/layout.tsx`, change the site settings fetch depth to `2` and pass the extra footer context:

```ts
payload.findGlobal({
  slug: 'site-settings',
  depth: 2,
}),
```

Then update the footer render call:

```tsx
<GlobalFooter
  footer={activeFooter}
  privacyPolicyPage={siteSettings.privacyPolicyPage}
  siteAddress={siteSettings.address}
  siteEmail={siteSettings.contactEmail}
  siteLogo={siteSettings.logo}
  siteName={siteSettings.siteName}
  sitePhone={siteSettings.contactPhone}
  siteSocialLinks={siteSettings.socialLinks}
/>
```

Regenerate the Payload types:

Run: `pnpm generate:types`

Expected: PASS and `src/payload-types.ts` updates with `Footer56Block.logoHeight`, `SiteSetting.privacyPolicyPage`, and the corresponding select types.

- [ ] **Step 4: Run the focused verification suite**

Run:

```bash
pnpm test:int -- --runInBand tests/int/page-blocks.int.spec.ts tests/int/global-footer.int.spec.ts
pnpm exec eslint src/blocks/Footer56/config.ts src/blocks/Footer56/Component.tsx src/blocks/renderFooterBlocks.tsx src/components/global/GlobalFooter.tsx src/globals/SiteSettings.ts 'src/app/(frontend)/layout.tsx' tests/int/page-blocks.int.spec.ts tests/int/global-footer.int.spec.ts
```

Expected: PASS for both Vitest files and no ESLint errors in the touched source files.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(frontend)/layout.tsx' src/payload-types.ts tests/int/global-footer.int.spec.ts
git commit -m "feat: wire footer globals from site settings"
```
