# Footer56 Legal Tab Terms Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-settings-owned Terms and Conditions page relationship, move both legal relationships into a dedicated `Legal` tab, and render the terms link automatically in the footer utility row.

**Architecture:** Keep site-wide legal page ownership inside `Site Settings`, now under a dedicated `Legal` tab, and thread `termsAndConditionsPage` through the existing frontend layout → global footer → footer renderer → footer block pipeline. Preserve footer `bottomLinks` and append the site-settings legal links after them in a fixed order.

**Tech Stack:** Payload CMS 3.85.x globals and generated types, Next.js App Router, React 19 server rendering, TypeScript, Vitest, ESLint

## Global Constraints

- `Site Settings` gets a new `Legal` tab
- `Legal` owns:
- `privacyPolicyPage`
- `termsAndConditionsPage`
- `Contact` keeps only contact-specific fields:
- email
- phone
- address
- map URL
- Footer bottom row right side renders, in order:
- footer `bottomLinks`
- `Terms and Conditions` from `Site Settings > Legal`
- `Privacy Policy` from `Site Settings > Legal`
- Link labels are fixed:
- `Terms and Conditions`
- `Privacy Policy`
- The footer component must continue to avoid reading `Site Settings` directly

---

## File Map

- Modify: `src/globals/SiteSettings.ts`
  - Move `privacyPolicyPage` into a new `Legal` tab and add `termsAndConditionsPage`.
- Modify: `src/blocks/Footer56/Component.tsx`
  - Accept `termsAndConditionsPage`, resolve it to a footer utility link, and keep legal links ordered after custom `bottomLinks`.
- Modify: `src/blocks/renderFooterBlocks.tsx`
  - Extend the footer render context with `termsAndConditionsPage`.
- Modify: `src/components/global/GlobalFooter.tsx`
  - Accept and forward `termsAndConditionsPage`.
- Modify: `src/app/(frontend)/layout.tsx`
  - Pass `siteSettings.termsAndConditionsPage` into `GlobalFooter`.
- Modify: `tests/int/page-blocks.int.spec.ts`
  - Lock the new `Legal` tab schema contract.
- Modify: `tests/int/global-footer.int.spec.ts`
  - Lock footer terms rendering and layout wiring.
- Modify: `src/payload-types.ts`
  - Regenerate Payload types for the new global field.

### Task 1: Move legal ownership into Site Settings > Legal and wire footer terms rendering

**Files:**
- Modify: `src/globals/SiteSettings.ts`
- Modify: `src/blocks/Footer56/Component.tsx`
- Modify: `src/blocks/renderFooterBlocks.tsx`
- Modify: `src/components/global/GlobalFooter.tsx`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/global-footer.int.spec.ts`
- Modify: `src/payload-types.ts`

**Interfaces:**
- Consumes:
  - `privacyPolicyPage?: Page | null`
  - `bottomLinks?: Footer56Block['bottomLinks']`
  - `getPageHref(page)` from `@/lib/pagePaths`
- Produces:

```ts
type GlobalFooterProps = {
  footer?: Pick<Footer, 'layout'> | null
  privacyPolicyPage?: Page | null
  termsAndConditionsPage?: Page | null
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

- [ ] **Step 1: Write the failing tests**

In `tests/int/page-blocks.int.spec.ts`, replace the old contact-tab legal assertion with `Legal` tab assertions:

```ts
it('defines the site settings legal schema with privacy policy and terms relationships', () => {
  const siteSettingsTabs = SiteSettings.fields.find(
    (field) => typeof field === 'object' && field !== null && 'tabs' in field,
  ) as { tabs: Array<{ fields: unknown[]; label: string }> } | undefined

  const contactTab = siteSettingsTabs?.tabs.find((tab) => tab.label === 'Contact')
  const legalTab = siteSettingsTabs?.tabs.find((tab) => tab.label === 'Legal')

  const privacyPolicyField = legalTab?.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'privacyPolicyPage',
  ) as { relationTo?: string; type?: string } | undefined

  const termsField = legalTab?.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'termsAndConditionsPage',
  ) as { relationTo?: string; type?: string } | undefined

  const contactPrivacyField = contactTab?.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'privacyPolicyPage',
  )

  expect(privacyPolicyField?.type).toBe('relationship')
  expect(privacyPolicyField?.relationTo).toBe('pages')
  expect(termsField?.type).toBe('relationship')
  expect(termsField?.relationTo).toBe('pages')
  expect(contactPrivacyField).toBeUndefined()
})
```

In `tests/int/global-footer.int.spec.ts`, extend the shared-renderer test input context:

```ts
termsAndConditionsPage: {
  id: 'terms-page',
  slug: 'terms-and-conditions',
  title: 'Terms and Conditions',
} as never,
```

Add assertions:

```ts
expect(html).toContain('Terms and Conditions')

const customBottomLinkIndex = html.indexOf('Terms and Conditions', html.indexOf('href=\"/terms\"'))
const legalTermsIndex = html.lastIndexOf('Terms and Conditions')
const privacyIndex = html.indexOf('Privacy Policy')

expect(legalTermsIndex).toBeGreaterThan(customBottomLinkIndex)
expect(privacyIndex).toBeGreaterThan(legalTermsIndex)
```

Update the layout-source assertions:

```ts
expect(layoutSource).toContain('termsAndConditionsPage={siteSettings.termsAndConditionsPage}')
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/global-footer.int.spec.ts
```

Expected: FAIL because there is no `Legal` tab yet, `termsAndConditionsPage` does not exist, and the footer context does not accept or render the terms page.

- [ ] **Step 3: Implement the schema and render changes**

In `src/globals/SiteSettings.ts`, create a dedicated `Legal` tab and move `privacyPolicyPage` there while adding `termsAndConditionsPage`:

```ts
{
  label: 'Legal',
  fields: [
    {
      name: 'privacyPolicyPage',
      label: 'Privacy Policy Page',
      type: 'relationship',
      relationTo: 'pages',
    },
    {
      name: 'termsAndConditionsPage',
      label: 'Terms and Conditions Page',
      type: 'relationship',
      relationTo: 'pages',
    },
  ],
},
```

In `src/blocks/renderFooterBlocks.tsx`, add:

```ts
termsAndConditionsPage?: Page | null
```

and pass it into `Footer56BlockComponent`.

In `src/components/global/GlobalFooter.tsx`, mirror the same prop and forward it into `renderFooterBlocks(...)`.

In `src/app/(frontend)/layout.tsx`, pass:

```tsx
termsAndConditionsPage={siteSettings.termsAndConditionsPage}
```

into `GlobalFooter`.

In `src/blocks/Footer56/Component.tsx`, resolve the new legal page and preserve utility-link ordering:

```ts
const termsHref = getPageHref(termsAndConditionsPage)
const privacyHref = getPageHref(privacyPolicyPage)

const resolvedBottomLinks = [
  ...(bottomLinks ?? [])
    .map((link) => resolveHeaderLink(link))
    .filter((link): link is NonNullable<typeof link> => link !== null),
  ...(termsHref ? [{ href: termsHref, label: 'Terms and Conditions', newTab: false }] : []),
  ...(privacyHref ? [{ href: privacyHref, label: 'Privacy Policy', newTab: false }] : []),
]
```

Add the new prop to `Footer56BlockComponentProps`:

```ts
termsAndConditionsPage?: Page | null
```

- [ ] **Step 4: Regenerate types and run verification**

Run:

```bash
pnpm generate:types
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/global-footer.int.spec.ts
pnpm exec eslint src/globals/SiteSettings.ts src/blocks/Footer56/Component.tsx src/blocks/renderFooterBlocks.tsx src/components/global/GlobalFooter.tsx 'src/app/(frontend)/layout.tsx' tests/int/page-blocks.int.spec.ts tests/int/global-footer.int.spec.ts
```

Expected:
- `pnpm generate:types` PASS and `src/payload-types.ts` includes `termsAndConditionsPage`
- focused Vitest run PASS
- focused ESLint run PASS

- [ ] **Step 5: Commit**

```bash
git add src/globals/SiteSettings.ts src/blocks/Footer56/Component.tsx src/blocks/renderFooterBlocks.tsx src/components/global/GlobalFooter.tsx 'src/app/(frontend)/layout.tsx' src/payload-types.ts tests/int/page-blocks.int.spec.ts tests/int/global-footer.int.spec.ts
git commit -m "feat: move footer legal links to site settings"
```
