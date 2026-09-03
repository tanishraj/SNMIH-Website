# Office Locations Guide

## What This Section Is

`Office Locations` stores versioned regional-office records used by the `Regional Offices` page block. It replaces duplicated address and map configuration inside individual Pages.

## Fields And Rules

Each location requires a city, an HTTPS interactive-map embed URL, and an HTTPS external map URL. Region/country, address, phone, email, and an accessible map title are optional. Turning off `Show Address Details` hides contact fields and shows only the interactive map.

## Step-By-Step Medical College Example

1. Open `Office Locations` in `Site Structure`.
2. Create the Dubai campus office and enter its region.
3. Choose whether public address, phone, and email details should appear.
4. Paste the map provider's HTTPS embed URL and public HTTPS map URL.
5. Add a meaningful iframe title such as `Interactive map for the Dubai campus`.
6. Publish the location.
7. On a Page, add `Regional Offices`; leave `Offices to Show` empty for all published locations or select and sort specific locations.

The block can independently hide location details even when the source record allows them. It also controls section/details alignment, spacing, appearance, and whether the map action is a link or button.

## Migration

`pnpm migrate:offices` migrates legacy office rows into this collection. Run it only after backing up the database and reviewing the target environment.

## Related Guides

- [Site Identity](./site-settings.md)
- [Pages](./pages.md)
- [Page Blocks](./blocks.md)
