# Footer56 Site Settings Integration Design

## Goal

Revise the current `footer56` footer preset so it draws site-wide contact, social, and privacy information from `Site Settings`, while keeping structural footer content inside the footer preset block.

The revision must:

- add a block-level logo height override
- remove footer-authored social link data
- render address, phone, and email from `Site Settings`
- render social icons from `Site Settings.socialLinks`
- add `privacyPolicyPage` to `Site Settings`
- render privacy policy alongside footer utility links in the footer bottom row

## Approved Direction

- Keep `footer56` as a reusable footer preset block
- Add `logoHeight` to the block schema
- Remove `socialLinks` from the footer block schema
- Add `privacyPolicyPage` to `Site Settings`
- Render privacy policy from `Site Settings`
- Keep `bottomLinks` for additional footer-authored utility links

## Ownership Model

### Footer block owns

- `logoMode`
- `customLogoLight`
- `customLogoDark`
- `logoHeight`
- `description`
- `linkGroups`
- `ctaButtons`
- `bottomLinks`
- `copyrightText`
- `backgroundStyle`

### Site Settings owns

- `address`
- `contactPhone`
- `contactEmail`
- `socialLinks.facebook`
- `socialLinks.instagram`
- `socialLinks.linkedin`
- `socialLinks.youtube`
- `privacyPolicyPage`

This keeps site-wide identity, contact, and privacy information in one global source.

## Schema Changes

### Footer56 block

Add:

- `logoHeight`
  - type: number
  - minimum value: 20
  - block-level logo height override
  - same admin interaction model as the header logo height control

Remove:

- `socialLinks`

No footer-level address, phone, email, or privacy page field is added.

### Site Settings

Add:

- `privacyPolicyPage`
  - type: relationship
  - relation: `pages`
  - use as the canonical privacy policy page relationship

## Render Context Contract

The footer render context must include:

- `siteLogo`
- `siteName`
- `siteAddress`
- `sitePhone`
- `siteEmail`
- `siteSocialLinks`
- `privacyPolicyPage`

This context must flow:

1. from frontend layout
2. into `GlobalFooter`
3. into `renderFooterBlocks`
4. into `Footer56BlockComponent`

The footer block component must not read `Site Settings` directly.

## Rendering Contract

### Left column order

The left column renders in this order:

1. logo
2. description
3. address
4. phone
5. email
6. social icons

### Logo behavior

- if `logoMode = customLogo`, use `customLogoLight` and `customLogoDark`
- otherwise use the site default logo
- logo height uses:
  - `logoHeight` when provided
  - `32` when not provided

### Contact behavior

- address renders from `siteAddress`
- phone renders from `sitePhone`
- email renders from `siteEmail`
- any missing value does not render

### Social behavior

- social icons render from `siteSocialLinks`
- render only platforms with populated URLs
- icon mapping is internal and controlled
- social icons appear under the contact information

### Bottom row behavior

- `copyrightText` renders on the left
- the right side renders:
  - footer-authored `bottomLinks`
  - privacy policy from `privacyPolicyPage` when it is populated

Privacy policy must be rendered from the resolved page relationship, not duplicated in footer content.

## Visual Direction

The revised footer should match the approved reference direction:

- logo at the top of the left column
- contact stack directly under the description
- social icons below contact
- utility/legal row at the bottom

The footer must remain:

- restrained
- institutional
- theme-driven
- compatible with both light and dark themes

## Testing Expectations

- validate `logoHeight` exists in the `footer56` schema
- validate `socialLinks` is removed from the `footer56` schema
- validate `privacyPolicyPage` exists in `Site Settings`
- validate footer rendering consumes site contact and social context
- validate privacy policy renders from site settings context
- validate footer rendering remains site-wide through the active footer preset path
