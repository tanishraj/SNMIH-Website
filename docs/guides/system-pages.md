# System Pages Guide

## What This Section Is

`System Pages` creates branded 404, maintenance, and coming-soon presets. These are not normal content Pages and each record must contain exactly one system block matching its selected type.

## When To Use It

Use `System Pages` when you need to:

- create a branded `404` page for missing routes
- prepare a maintenance page before planned site work
- prepare a coming-soon experience before a launch

Do not use `System Pages` for normal marketing or editorial content. Use `Pages` for standard public routes.

## How It Connects To The Website

The selected 404 handles missing frontend routes. Maintenance and coming-soon presets are activated through `Maintenance & Modes`; current overrides cover the homepage and catch-all CMS Page routes, not every dedicated route.

All three active preset relationships live in `Maintenance & Modes`. If a referenced preset is unpublished, deleted, or changed to the wrong type, validation prevents the invalid configuration.

## Step-By-Step Medical College Example

Create branded `404` and maintenance experiences for North Valley Medical College:

1. Open `System Pages`.
2. Click `Create New`.
3. Enter the title `College 404 Page`.
4. Set the type to `404`.
5. Add the matching `404` system block and include helpful recovery content such as links back to `Admissions`, `Programs`, and `Contact`.
6. Save and publish the page.
7. Create another system page called `Scheduled Maintenance Page`.
8. Set the type to `maintenance`.
9. Add the matching maintenance block and explain that the college website is temporarily unavailable during planned updates.
10. Save and publish the maintenance page.
11. Open `Maintenance & Modes` and select the published 404, maintenance, and coming-soon presets.
12. Keep the mode Off until the temporary experience is required.

Expected website result:

- missing routes show the branded `404` experience
- if maintenance mode is enabled later, CMS Page routes switch to the maintenance experience

## Best Practices

- always match the selected page type with the correct system block
- include recovery links so users can still reach important destinations
- publish and verify system pages before enabling a mode that depends on them
- keep system messaging short, calm, and operationally accurate
- treat changes here as high-risk because they influence site-wide fallback behavior

## Common Mistakes And Recovery

- using the wrong block for the selected page type
- forgetting to connect the system page in `Maintenance & Modes`
- publishing weak fallback content with no route back to key sections
- editing a referenced system page without checking how it behaves on the frontend

If a fallback experience looks wrong, verify the page type, confirm the selected block matches it, and check the related system-page selections in defaults and modes.

## Related Guides

- [Pages](./pages.md)
- [Layout Defaults](./site-defaults.md)
- [Maintenance & Modes](./system-modes.md)
- [SEO & Metadata](./seo-settings.md)
