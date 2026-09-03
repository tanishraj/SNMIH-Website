# Footer56 Footer Preset Revision Design

## Goal

Revise the newly added `footer56` footer preset so it behaves more like the intended institutional footer layout:

- add a block-level logo height override similar to the header logo height control
- render address, phone, and email in the left column
- place social icons under the contact information
- keep legal links such as Terms and Conditions and Privacy Policy in the bottom row
- source contact and social data from `Site Settings`, not from the footer preset itself

This revision must preserve the existing footer preset architecture while tightening the division between site-wide identity data and per-footer structural content.

## Approved Direction

- Keep `footer56` as a reusable footer preset block
- Add `logoHeight` to the block schema
- Remove per-footer `socialLinks` authoring from the footer block
- Read address, phone, email, and social URLs from `Site Settings`
- Keep legal links in `bottomLinks`
- Keep link groups and CTA buttons as footer-authored content

## Design Principles

- Site-wide identity data should be authored once in `Site Settings`
- Footer presets should control structure and footer-specific navigation, not duplicate global contact data
- Logo handling should remain consistent with the header system
- The footer should stay restrained and institutional
- Data flow should remain explicit through render context rather than hidden global reads inside leaf components

## Revised Content Ownership

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

This removes duplicated site identity and contact data from the footer preset layer.

## Schema Changes

### Add

- `logoHeight`
  - type: number
  - block-level logo height override
  - minimum value: 20
  - uses the same admin interaction pattern as the header logo height control

### Remove

- `socialLinks`
  - remove from `Footer56` block schema

No footer-level address, phone, or email fields should be added.

## Rendering Contract

### Left column order

The left column must render in this order:

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

- address renders from `Site Settings.address`
- phone renders from `Site Settings.contactPhone`
- email renders from `Site Settings.contactEmail`
- each contact row uses a compact icon + text pattern
- any missing value does not render

### Social behavior

- social icons render only for populated URLs from `Site Settings.socialLinks`
- icon selection is internal and controlled by platform name
- no freeform icon authoring
- social row sits under the contact information

### Bottom row behavior

- `copyrightText` renders on the left
- `bottomLinks` render on the right
- this is the location for Terms and Conditions, Privacy Policy, and similar utility links

## Render Context Changes

The global footer render context must be expanded so the footer block receives all required site-wide identity data.

Required footer render context:

- `siteLogo`
- `siteName`
- `siteAddress`
- `sitePhone`
- `siteEmail`
- `siteSocialLinks`

This context should be passed:

1. from frontend layout
2. into `GlobalFooter`
3. into `renderFooterBlocks`
4. into `Footer56BlockComponent`

The footer block component should not fetch `Site Settings` directly.

## Visual Direction

The revised footer should match the approved reference layout direction:

- logo sits at the top of the left column
- contact stack sits directly under the description
- social icons sit below contact
- legal links remain in the bottom utility row

The footer must still remain:

- theme-driven
- restrained
- divider-led rather than card-led
- compatible with both light and dark themes

## Testing Expectations

- validate `logoHeight` is present in the `footer56` schema
- validate `socialLinks` is removed from the `footer56` schema
- validate footer rendering consumes site contact and social context
- validate terms/privacy style links still render through `bottomLinks`
- validate footer rendering remains site-wide through the active footer preset path
