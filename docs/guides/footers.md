# Footers Guide

## What This Section Is

`Footers` creates reusable Footer 56 presets. The preset controls logo behavior, description, up to four inline Page/custom link groups, up to two calls to action, bottom links, copyright, appearance, and spacing.

## When To Use It

Use `Footers` when you need to:

- update the footer's layout, links, description, and calls to action
- add quick links to major sections
- include accreditation or compliance references
- place a repeated admissions CTA at the bottom of the site

Do not use it for page-specific content that belongs inside a page layout block.

## How It Connects To The Website

The active Footer is selected in `Layout Defaults`. Site address, phone, email, social links, privacy policy, and terms are injected from `Site Identity`; they are not duplicated in the Footer preset or Navigation Links collection.

If it is misconfigured, the public website can show outdated address information, broken quick links, or missing trust signals on every page. A footer problem is rarely isolated to one page because the same footer preset is reused globally.

## Step-By-Step Medical College Example

Create a footer for North Valley Medical College with address, accreditation, quick links, and an admissions CTA:

1. Open `Footers`.
2. Click `Create New`.
3. Enter the title `Primary College Footer`.
4. Open the footer layout block.
5. Configure the logo source and description.
6. Add inline Page/custom link groups such as `Programs`, `Admissions`, `Campus Life`, and `Contact`.
7. Add an accreditation or institutional trust section if the block supports it.
8. Add an admissions CTA such as `Request Prospectus`.
9. Save and publish the footer preset.
10. Open `Layout Defaults` and choose this Footer as active.

Expected website result:

- the footer appears across the frontend with college contact and trust information
- visitors can reach important utility pages from the bottom of the site

## Best Practices

- keep footer links practical and stable
- maintain address, phone, email, social, and legal destinations in `Site Identity`
- use the footer for secondary navigation, not as a duplicate of every header item
- review footer links after structural page changes
- treat footer edits as site-wide changes that deserve a quick smoke test

## Common Mistakes And Recovery

- publishing a footer but not making it active
- showing outdated contact or accreditation information
- adding links that point to unpublished or removed pages
- forgetting that a footer change affects the frontend everywhere

If the live Footer looks wrong, confirm the active preset in `Layout Defaults`, review its inline links, and compare injected details against `Site Identity`.

## Related Guides

- [Media](./media.md)
- [Site Identity](./site-settings.md)
- [Layout Defaults](./site-defaults.md)
