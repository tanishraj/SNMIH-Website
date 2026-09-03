# Redirects Guide

## What This Section Is

`Redirects` is where you tell the website what to do when an old URL should send visitors somewhere else. Use it when a page has moved, a campaign URL changed, or you need to preserve traffic from printed brochures, search results, or bookmarked links for North Valley Medical College.

## When To Use It

Use `Redirects` when:

- a page slug changes
- a legacy path still receives traffic
- a campaign or admissions URL should point to a newer page
- an old internal path should send users to a different live destination

Do not use it to build navigation. That belongs in `Navigation Links`, `Headers`, and `Footers`.

## How It Connects To The Website

Redirects affect real frontend routing. When a visitor opens a matching path, the public website sends them to the configured destination before the normal page lookup completes.

Redirects are runtime — publishing a redirect takes effect within approximately 60 seconds without a rebuild or server restart. There is no need to deploy the website again after adding or changing a redirect.

This section has site-wide impact because a bad redirect can send all users of one path to the wrong place, create loops, or hide the intended page. Redirects depend on stable destination pages, careful slug changes, and coordination with `Pages` and `Navigation Links`.

## Step-By-Step Medical College Example

Redirect `/old-admissions` to the current North Valley Medical College admissions page:

1. Open `Redirects`.
2. Click `Create New`.
3. Enter `From Path` as `/old-admissions`.
4. Leave `Destination Type` set to `Destination Page`.
5. Select the `Admissions Overview` page.
6. Keep the status code as `Permanent (301)` because the old URL has been replaced.
7. Leave `Enabled` turned on.
8. Save and publish the redirect.

Expected website result:

- anyone visiting `/old-admissions` is sent to `/admissions`
- old external links continue working
- search engines learn that the college has permanently moved that content

## Best Practices

- use `301` for real replacements and `302` only for temporary situations
- enter paths only, not full URLs, unless the destination is intentionally external
- review page slug changes and decide whether a redirect is needed immediately
- keep redirect paths simple and consistent with the public URL structure
- test the old path in the browser after publishing

## Common Mistakes And Recovery

- redirecting to the wrong destination page
- using a temporary `302` when the change is permanent
- forgetting that a redirect can override what users expect from an old URL
- creating a redirect after changing a page slug but not checking related links

If users are landing in the wrong place, disable the redirect, confirm the correct destination, and review related `Pages` and `Navigation Links`. If an old page path changed during publishing, also check whether an automatic redirect was already created.

## Related Guides

- [Pages](./pages.md)
- [Navigation Links](./links.md)
- [Headers](./headers.md)
- [Footers](./footers.md)
