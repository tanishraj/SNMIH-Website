# Media Guide

## What This Section Is

`Media` is the shared asset library for uploaded files. In North Valley Medical College, this includes campus photos, faculty portraits, logos, brochure PDFs, hero images, and default social-sharing assets.

## When To Use It

Use `Media` whenever a file should be uploaded once and reused across the website.

Do not use it for:

- text content that belongs in `Pages`, `Articles`, or `Reviews`
- external links that belong in `Navigation Links`

## How It Connects To The Website

Media supports Pages, Articles, News & Events, Reviews, galleries, shell presets, and SEO sharing. Assets can be labeled `Logo`, `Hero`, `SEO`, `Icon`, `Document`, or `General`, and the CMS tracks governed references before deletion.

Images require alt text. Logo, Hero, and SEO classifications only accept image MIME types. A referenced asset cannot be deleted until every reported collection/global reference is removed.

If a critical asset is replaced carelessly, the public website can show the wrong logo, weak hero imagery, broken brochures, or poor social previews.

## Step-By-Step Medical College Example

Upload shared assets for North Valley Medical College:

1. Open `Media`.
2. Click `Create New`.
3. Upload a campus photo and classify it as a hero or general image.
4. Add strong alt text that describes the image clearly.
5. Upload a faculty portrait if articles or pages need it.
6. Upload the official college logo and classify it as `Logo`.
7. Upload a brochure PDF and classify it as `Document`.
8. Add internal notes or replacement notes if the asset has special usage rules.
9. Save each asset and reuse it from pages, articles, reviews, or SEO settings.

Expected website result:

- content editors can reuse approved imagery and documents consistently
- critical assets like the logo and brochure stay governed from one place

## Best Practices

- always write meaningful alt text
- use asset types accurately so governance stays clear
- mark high-sensitivity files as critical assets
- add notes when an asset has placement, cropping, or replacement requirements
- reuse existing assets before uploading duplicates

## Common Mistakes And Recovery

- uploading duplicate versions of the same image
- replacing a critical logo without checking where it is used
- leaving alt text weak or empty
- using the wrong asset type for SEO or hero imagery

If an asset change causes regressions, review the usage summary before replacing or deleting it again.

## Storage Health

Read-only status fields show `Unchecked`, `Healthy`, `Missing`, `Check Failed`, or `Local Only`, plus the last check and diagnostic detail. The protected reconciliation endpoint scans up to 1,000 records per call, marks local files `Local Only`, verifies S3 objects, creates media Action Queue conditions, and audits missing/restored transitions. See [Developer Workflows](../operations/developer-workflows.md) for the authenticated command.

## Related Guides

- [Pages](./pages.md)
- [Articles](./articles.md)
- [Reviews](./reviews.md)
- [Gallery Albums](./gallery-albums.md)
- [SEO & Metadata](./seo-settings.md)
- [Trash and Recovery](./trash-and-recovery.md)
