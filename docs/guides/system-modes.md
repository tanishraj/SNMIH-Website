# Maintenance & Modes Guide

## What This Section Is

`Maintenance & Modes` selects published System Page presets for 404, maintenance, and coming-soon behavior, then activates `Off`, `Maintenance`, or `Coming Soon` mode.

## Configuration Rules

- each relationship only accepts a published System Page of the matching type
- activating Maintenance requires a Maintenance preset
- activating Coming Soon requires a Coming Soon preset
- ordinary CMS Page routes always respect the active mode, including requests from signed-in Admin users
- changes are versioned and written to the Audit Log

Current mode overrides apply to `/` and catch-all CMS Page routes. Dedicated article, review, News & Events, search, feed, Admin, and API routes are not replaced by the mode.

## Step-By-Step Medical College Example

1. Create and publish matching 404, Maintenance, and Coming Soon records in `System Pages`.
2. Open `Maintenance & Modes` in `Configuration` and select each preset.
3. Save while `Site Mode` is `Off` and verify each preset.
4. Select `Maintenance` only when the CMS Page surface should show the maintenance experience.
5. Test the public route while signed out and signed in; both should show the active mode.
6. Use `/preview/page/[id]` while authenticated when editors need to inspect normal or draft Page content during an active mode.
7. Return the mode to `Off` after the operational window.

## Best Practices

- preconfigure and review all three presets before an incident
- use authenticated Page Preview for editorial inspection; there is no public-route bypass checkbox
- do not assume the mode blocks every dedicated route or API
- coordinate mode changes with operational communications and cache verification
- use the Audit Log to confirm who changed the mode

## Related Guides

- [System Pages](./system-pages.md)
- [Layout Defaults](./site-defaults.md)
- [Audit Log](./operational-audit-events.md)
