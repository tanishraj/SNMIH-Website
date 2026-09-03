# Footer56 Terms and Conditions Site Settings Design

## Goal

Extend the current footer legal-link model so `Terms and Conditions` is owned by `Site Settings` in the same way as `Privacy Policy`.

This keeps site-wide legal destinations centralized and allows the footer to render them automatically without duplicating URLs or page choices inside footer content.

## Approved Direction

- Add `termsAndConditionsPage` to `Site Settings`
- Keep it as a `pages` relationship, matching `privacyPolicyPage`
- Pass the resolved page relationship through the existing footer render context
- Render `Terms and Conditions` automatically in the footer bottom utility row
- Keep `bottomLinks` on the footer block for any extra non-legal utility links

## Ownership Model

### Site Settings owns

- `privacyPolicyPage`
- `termsAndConditionsPage`

### Footer block owns

- `bottomLinks`
- `copyrightText`
- all existing visual and structural footer configuration

This keeps legal links site-wide while preserving footer-level flexibility for additional utility links.

## Schema Changes

### Site Settings

Add:

- `termsAndConditionsPage`
  - type: relationship
  - relation: `pages`
  - label: `Terms and Conditions Page`

Placement:

- `Site Settings > Legal`
- adjacent to the existing `privacyPolicyPage`

### Site Settings tabs

`Site Settings` must be organized as:

- `Brand`
- `Contact`
- `Legal`
- `Social Links`

The new `Legal` tab owns both legal page relationships:

- `termsAndConditionsPage`
- `privacyPolicyPage`

`Contact` must no longer contain legal page relationships.

No footer block schema changes are required for this delta.

## Render Context Contract

The footer render context must be extended with:

- `termsAndConditionsPage`

This value must flow:

1. from frontend layout
2. into `GlobalFooter`
3. into `renderFooterBlocks`
4. into `Footer56BlockComponent`

The footer component must continue to avoid reading `Site Settings` directly.

## Rendering Contract

### Bottom row right side

The footer bottom row right side must render, in order:

1. footer-authored `bottomLinks`
2. `Terms and Conditions` from `termsAndConditionsPage` when populated
3. `Privacy Policy` from `privacyPolicyPage` when populated

If either site-settings legal relationship is empty, that link is omitted.

Both legal links must resolve from real `pages` relationships through the existing page-path helper, not from duplicated custom URLs.

## UX and Content Rules

- Link labels are fixed:
  - `Terms and Conditions`
  - `Privacy Policy`
- Footer editors do not need to re-enter those legal links in the footer block
- `bottomLinks` remains available for any other utility links

## Testing Expectations

- validate `termsAndConditionsPage` exists in `Site Settings > Legal`
- validate `privacyPolicyPage` exists in `Site Settings > Legal`
- validate frontend layout passes `termsAndConditionsPage` into `GlobalFooter`
- validate footer rendering includes `Terms and Conditions` when configured
- validate footer bottom-row ordering remains:
  - custom `bottomLinks`
  - terms link
  - privacy link

## Scope

This is a narrow delta to the already-implemented footer site-settings integration.

It does not change:

- footer logo behavior
- footer contact rendering
- footer social rendering
- footer CTA behavior
- footer visual styling
