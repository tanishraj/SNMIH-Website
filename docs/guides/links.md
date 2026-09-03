# Navigation Links Guide

## What This Section Is

`Navigation Links` stores manual or Page-synchronized Page/custom destinations. System Page actions can reference these records. Current Header, Footer, and normal Page action fields use their own inline Page/custom links rather than this collection.

## When To Use It

Use `Navigation Links` when a feature explicitly offers a Navigation Link relationship or when inspecting the link record synchronized from a Page.

Do not use it for:

- full page content, which belongs in `Pages`
- redirect rules, which belong in `Redirects`

## How It Connects To The Website

Publishing a Page creates or updates its owned synchronized link; deleting the Page removes that link. Manual records remain independent. Avoid editing ownership fields on synchronized records.

If a reusable link points to the wrong page or URL, multiple parts of the frontend can break at once.

## Step-By-Step Medical College Example

Create reusable links for North Valley Medical College:

1. Open `Navigation Links`.
2. Click `Create New`.
3. Create a link titled `Apply Now`.
4. Choose whether it points to a page or a custom URL.
5. If it points to a page, select the correct admissions-related page.
6. Save the link.
7. Repeat the process for `Download Prospectus`.
8. Repeat the process for `Book Campus Visit`.
9. Review whether any of these links should open in a new tab.

Expected website result:

- the destinations are available to features that explicitly reference Navigation Links
- Page-owned records track the current Page destination automatically

## Best Practices

- use short action-oriented titles
- prefer reusable links for repeated destinations
- use custom URLs only when the destination is not a managed page
- avoid editing page-synced links unless you understand how they were created

## Common Mistakes And Recovery

- creating duplicate links for the same destination
- selecting the wrong page target
- using a custom URL where a page relationship would be safer
- forgetting that a reusable link may affect multiple frontend locations

If a Page destination changes, update the Page and allow synchronization to update its owned record. For an inline Header/Footer/Page action, edit that source preset or block directly.

## Related Guides

- [Pages](./pages.md)
- [Headers](./headers.md)
- [Footers](./footers.md)
- [Redirects](./redirects.md)
