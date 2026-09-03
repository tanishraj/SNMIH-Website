# SEO & Metadata Guide

## What This Section Is

`SEO & Metadata` stores the default search and social metadata used when a route does not provide its own overrides.

In North Valley Medical College, this is the global fallback SEO layer that helps keep metadata consistent across the website.

## When To Use It

Use `SEO & Metadata` when you need to:

- define the default site title used by the website
- set a title template such as `%s | North Valley Medical College`
- write a default site description
- set a default social sharing image
- choose the inherited robots rule
- store Google site verification

Do not use this section for a single page’s campaign SEO. Use the local SEO fields on the page, article, review, or system page when one route needs custom metadata.

## How It Connects To The Website

This global is loaded by the frontend layout and metadata builders. It affects:

- the default browser and search title
- fallback description metadata
- fallback Open Graph and Twitter image behavior
- the inherited robots setting
- verification metadata for search tooling

When local content-level SEO stays on default or is left empty, these values fill the gap. That makes this section critical for baseline SEO quality across the entire site.

## Step-By-Step Medical College Example

Set global SEO defaults for North Valley Medical College:

1. Open `SEO & Metadata` in `Settings`.
2. Enter a strong `Default Title`.
3. Enter a `Title Template` such as `%s | North Valley Medical College`.
4. Write a clear `Default Description` for the institution.
5. Select a high-quality default social image from `Media`.
6. Choose the standard `Robots` value for the public site.
7. Enter the Google site verification string if search tooling requires it.
8. Save the global.
9. Review a page that uses default SEO to confirm the inherited values look correct.

Expected website result:

- pages without custom overrides still have meaningful baseline metadata
- social sharing and search presentation stay more consistent across the website

## Best Practices

- keep the default title and description broad enough to represent the full institution
- use a default image that is brand-safe and works well in social sharing
- let route-level SEO override these values only when a page truly needs custom messaging
- review SEO defaults after major rebranding or positioning changes

## Common Mistakes And Recovery

- writing defaults that are too campaign-specific for the whole website
- leaving the title template inconsistent with the institution name
- forgetting to update the default image after a branding change
- trying to solve route-specific SEO issues only from the global settings layer

If search previews look wrong on one route, check whether that route is inheriting global defaults or overriding them locally. If the problem is site-wide, review this global first.

## Related Guides

- [Pages](./pages.md)
- [Articles](./articles.md)
- [Reviews](./reviews.md)
- [System Pages](./system-pages.md)
