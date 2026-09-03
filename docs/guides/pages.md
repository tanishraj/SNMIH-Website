# Pages Guide

## What This Section Is

`Pages` is the main place where standard website pages are created and managed. Use it for public-facing pages such as Home, About, Admissions, Programs, Faculty, Research, and Contact for North Valley Medical College.

## When To Use It

Use `Pages` when you need a normal website page with its own URL and layout.

Do not use it for:

- system-only experiences like 404 or maintenance pages
- long-form newsroom content that belongs in `Articles`

## How It Connects To The Website

Pages define real frontend routes. A published Page can become the homepage through `Layout Defaults`. The CMS maintains its owned Navigation Link and creates 301 Redirects for the old path when a published slug/parent path changes, including affected descendants.

The parent validator prevents self-parenting and circular hierarchies. Referenced Pages cannot be unpublished when doing so would invalidate configured relationships. Layout offers 43 blocks, SEO is publish-validated, and live preview renders every production Page block in desktop, tablet, and mobile frames.

## Step-By-Step Medical College Example

Create an `Admissions Overview` page for North Valley Medical College:

1. Open `Pages`.
2. Click `Create New`.
3. Enter the title `Admissions Overview`.
4. Add the page content blocks needed for the page.
5. Set the slug to `admissions`.
6. Review the public URL preview.
7. Add SEO details that describe the admissions page.
8. Save as a draft or publish when ready.

Expected website result:

- the public site has a page at `/admissions`
- the page can later be linked from the header or footer

## Best Practices

- keep titles clear and institution-facing
- confirm the public URL before publishing
- use pages for stable evergreen sections of the site
- use live preview before publishing major layout changes
- use the [Page Blocks guide](./blocks.md) to choose data-backed rather than duplicated content
- add a short change summary when the page update affects structure or messaging

## Common Mistakes And Recovery

- creating an article when the content should really be a page
- changing a slug without checking related links
- publishing before reviewing the page URL and SEO settings
- selecting a parent page that creates a confusing hierarchy

If a URL changes unexpectedly, review `Redirects` and related `Navigation Links`.

## Related Guides

- [Navigation Links](./links.md)
- [Headers](./headers.md)
- [Footers](./footers.md)
- [Layout Defaults](./site-defaults.md)
- [Page Blocks](./blocks.md)
