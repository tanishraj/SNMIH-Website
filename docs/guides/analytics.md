# Analytics & Tracking Guide

## What This Section Is

`Analytics & Tracking` is where you connect the website to Google Tag Manager or Google Analytics 4. The starter also integrates Vercel Speed Insights for real-user performance metrics. All three integrations are held back until a visitor explicitly accepts analytics cookies. This provides consent gating but does not, by itself, guarantee compliance with any privacy law.

## When To Use It

Use `Analytics & Tracking` when you need to:

- start measuring page views, events, or conversions on the public website
- connect a Google Tag Manager container that manages third-party scripts
- add Google Analytics 4 directly without a tag manager
- change or update a tracking ID without touching the codebase

Do not paste tracking scripts into page content or HTML embeds. All analytics belong here so the consent system can gate them correctly.

## How It Connects To The Website

The cached public layout reads this global with the other frontend settings and passes only the enablement flags and IDs to a client consent controller. The controller checks consent after hydration. If a visitor has accepted the cookie consent notice, it mounts the configured GTM container or standalone GA4 plus Vercel Speed Insights. If the visitor has not yet decided or has rejected cookies, none of those integrations load.

When `Cookie Consent Banner` is enabled, it appears if the visitor has no decision cookie. **Accept all** mounts the allowed integrations immediately on the same page without navigation; **Reject non-essential** stores denial without loading analytics. GTM takes precedence when both GTM and standalone GA4 are configured.

Changing settings invalidates the cached frontend settings and takes effect on the next page load for visitors who have already consented.

## Vercel Speed Insights

Vercel Speed Insights reports anonymous Core Web Vitals for public frontend routes. It is configured in code rather than through the Payload `Analytics & Tracking` global and does not measure Payload Admin routes.

To activate it for a deployment:

1. Open the project in the Vercel dashboard.
2. Open **Speed Insights** and select **Enable Speed Insights**.
3. Deploy the repository with the `@vercel/speed-insights` integration.
4. Visit the deployed website, accept analytics cookies, navigate between pages, and then leave or blur the page so pending metrics can be sent.

The component is rendered only when `analytics_consent=granted`. Visitors who reject analytics or have not made a choice do not load the Speed Insights script. The integration uses Vercel's default sampling and endpoint configuration.

If metrics do not appear, confirm the Vercel project feature is enabled, test after granting consent, navigate between public routes, and check whether a content blocker prevented the Speed Insights script or request. A blocked or unavailable metrics endpoint does not affect website rendering.

## Step-By-Step Medical College Example

Add Google Tag Manager to North Valley Medical College:

1. Open `Analytics & Tracking` in the admin under `Settings`.
2. On the **Google Tag Manager** tab, turn on `Enable Google Tag Manager`.
3. Enter the GTM container ID in the format `GTM-XXXXXXX`.
4. Save the global.

Expected website result:

- visitors who accept cookies will trigger the GTM container on every page
- the admissions team can now configure events inside GTM without CMS changes
- visitors who reject cookies receive no tracking scripts

## Choosing Between GTM And GA4 Direct

Use **Google Tag Manager** if:
- you need more than GA4, such as ad pixels, heatmap tools, or custom events
- the marketing team manages tags independently in the GTM interface
- you already have an existing GTM container set up

Use **GA4 Direct** if:
- you only need basic analytics and want a simpler setup
- you do not have a GTM account
- `Enable Google Tag Manager` is turned off and `Enable GA4` is turned on instead

Do not enable both GTM and GA4 direct at the same time. If GTM is enabled, the GA4 direct script is automatically suppressed because GA4 should be configured inside GTM instead.

## Cookie Consent And Privacy

When enabled, the consent banner:

- links to the Privacy Policy page configured in `Site Identity`
- stores the visitor's choice in a browser cookie for one year
- does not load any analytics until the visitor has accepted

If a visitor later clears their cookies, the banner will show again on their next session.

The Privacy Policy page link comes from `Site Identity → Legal`. If it is empty, the banner still works without the link. Configure the banner's style and copy separately in `Cookie Consent Banner`.

## Best Practices

- always use a GTM container rather than GA4 direct on sites that may need additional third-party tools later
- confirm that the GTM container ID is correct before saving — an incorrect ID will silently produce no data
- verify consent behavior by visiting the site in a private browser window and checking that no analytics requests are made until you click **Accept all**
- keep Speed Insights consent-gated unless a deployment-specific privacy review explicitly approves another policy
- keep the Privacy Policy page up to date with an accurate description of cookie usage

## Common Mistakes And Recovery

- entering the wrong ID format — GTM IDs start with `GTM-`, GA4 IDs start with `G-`
- enabling GTM and GA4 direct at the same time — the GA4 direct script will not load when GTM is enabled
- expecting analytics to fire before the visitor has accepted — this is correct behavior, not a bug
- not having a Privacy Policy Page selected in Site Identity

If analytics data is not appearing after saving, check the consent banner in a private browsing window, verify the ID format, and confirm the global has been saved.

## Related Guides

- [Site Identity](./site-settings.md)
- [SEO & Metadata](./seo-settings.md)
- [Cookie Consent Banner](./cookie-consent.md)
