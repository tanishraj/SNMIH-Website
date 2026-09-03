# Layout Defaults Guide

## What This Section Is

`Layout Defaults` controls the site's active homepage, Header, Footer, default Page appearance, and optional site-wide announcement bar.

## Site Structure

- `Homepage` must reference a published Page and renders at `/`.
- `Header` selects the Header preset rendered across the public layout.
- `Footer` selects the Footer preset rendered across the public layout.

Edit and publish the source Page/Header/Footer before selecting it here. These relationships select active records; they do not edit their content.

## Page Appearance

The Page Appearance tab sets the shared frontend Page background/surface behavior through the same appearance system used by project blocks. Treat it as a site-wide design change and verify representative routes in light and dark modes.

## Announcement Bar

The Announcement tab configures a bar above the global Header:

- enablement, optional label, and one or more items with description and optional title/URL
- Vertical Slider, Horizontal Slider, or Marquee animation
- rotation interval of at least 2,000 ms for slider modes
- marquee cycle of at least 8,000 ms
- shared appearance settings
- optional visitor dismissal for the browser session
- optional hide-on-scroll behavior instead of a persistent bar

This is separate from the in-page `Announcement` block.

## Step-By-Step Medical College Example

1. Publish the intended Homepage, Header, and Footer presets.
2. Open `Layout Defaults` in `Configuration`.
3. Select those three records under `Site Structure`.
4. Review the default Page appearance.
5. If a campus notice is required, enable the announcement bar, add concise items, select an animation, and validate its timing.
6. Save and verify `/`, a nested Page, mobile layout, dismissal, scrolling, and Header spacing.

## Common Mistakes And Recovery

- selecting a draft Homepage (validation rejects it)
- assuming a draft Header/Footer will render publicly
- confusing the site-wide announcement with an in-page Announcement block
- using overly fast rotation or marquee timing

If the root route or shell is wrong, restore the previous relationships here. If only one Page is wrong, edit that Page rather than changing a global default.

## Related Guides

- [Pages](./pages.md)
- [Headers](./headers.md)
- [Footers](./footers.md)
- [Page Blocks](./blocks.md)
- [Appearance](./theme-settings.md)
