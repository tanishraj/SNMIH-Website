# Block Cleanup Design

## Goal

Remove the starter's existing reusable content, form, header, and footer block implementations so the project has a clean foundation for a new block library. Preserve the three system-page blocks: Not Found, Coming Soon, and Maintenance.

## Scope

Delete the `Hero36`, `Form`, `ContentSpotlight`, `HeaderNavbar12`, and `Footer2` block directories and presentation components used only by those blocks. Remove their imports, block registrations, render branches, live-preview branches, migrations, and media-usage logic where that logic is exclusive to a deleted block type.

Keep `System404`, `SystemComingSoon`, and `SystemMaintenance`, along with their shared system-page fields and rendering support. `RenderBlocks` will recognize only these three block types after cleanup.

## Preserved Infrastructure

Keep the Pages, Reviews, Headers, Footers, and Forms collections and all general-purpose CMS infrastructure. Their deleted block references will be removed so the project compiles, but the collections remain available for future block work. Keep shared link, media, navigation, and form utilities unless they have no use outside the deleted block implementations.

Existing unrelated work, including the current modification to `src/styles/globals.css`, must remain untouched.

## Data and Compatibility

This is a code and schema cleanup, not a content migration. Stored documents containing removed block types may retain old database data, but Payload will no longer expose or render those block definitions. The generated Payload types must be refreshed to reflect the reduced schema.

Header and footer collection architecture remains in place, but no legacy header or footer block implementation will be registered. Future blocks can be introduced into these collections without rebuilding the surrounding collection infrastructure.

## Verification

After cleanup:

- Generate Payload types and the import map if required by the project scripts.
- Run formatting or lint checks relevant to changed files.
- Run the TypeScript check and focused tests covering block rendering, system pages, navigation, media usage, and live preview where such tests exist.
- Search for references to all five removed block types and remove any remaining runtime or type dependency.
- Confirm the three system-page blocks still render and remain registered in the system-page schema.

## Completion Criteria

The repository builds without references to the five removed blocks, only the three system-page block implementations remain under `src/blocks`, unrelated infrastructure and user changes are preserved, and verification passes or any pre-existing failures are documented.
