# Cookie Consent Banner Guide

## What This Section Is

`Cookie Consent Banner` controls the first-visit analytics choice shown on the public site. Analytics scripts do not load until the visitor grants consent.

## Configuration

- enable or disable the banner globally
- choose Bottom Bar, Floating Card, Modal, or Corner Badge
- choose bottom-left or bottom-right for corner-based variants
- customize the optional heading, message, accept label, reject label, and privacy-policy label

The privacy-policy destination comes from `Site Identity > Legal`. If no Privacy Policy Page is selected, the banner omits that link.

## Visitor Behavior

The choice is stored in the `analytics_consent` cookie for one year with `SameSite=Lax` and `Secure` on HTTPS. Accepting stores `granted` and dispatches a same-page consent event, so configured GTM or standalone GA4 plus Vercel Speed Insights can mount immediately without navigation. Rejecting stores `denied`, emits the same state-change event, and keeps analytics absent. The Modal variant uses a dialog; all variants expose explicit accept and reject actions.

The Modal variant moves initial focus to `Reject non-essential` and keeps keyboard focus inside the
dialog. Escape records rejection and closes the dialog; clicking the backdrop does not dismiss it.
After either explicit choice, focus returns to the previously active control when it still exists.
The other banner variants remain non-modal and do not take over keyboard focus.

## Step-By-Step Medical College Example

1. Publish the privacy policy Page and select it under `Site Identity > Legal`.
2. Open `Cookie Consent Banner` in `Settings`.
3. Enable the banner, choose the approved style, and enter reviewed privacy copy.
4. Configure either GTM or standalone GA4 in `Analytics & Tracking`.
5. Test in a private browser window: no analytics before a choice, no analytics after rejection, and analytics after acceptance.
6. Clear the `analytics_consent` cookie before repeating the test.

## Related Guides

- [Analytics & Tracking](./analytics.md)
- [Site Identity](./site-settings.md)
- [SEO & Metadata](./seo-settings.md)
