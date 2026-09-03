# Manual News & Events Page Design

**Date:** 2026-08-17

**Status:** Approved

## Objective

Make `/news-events` a normal editor-authored Payload Page. Editors create and publish a root Page
with the slug `news-events`, compose it from any registered Page blocks, and use the collection-backed
`News & Events Highlights` and `News & Events Tabs` blocks wherever dynamic listings are needed.

The existing fixed archive UI is removed completely. Individual News & Events detail pages and the
RSS feed remain available.

## Route Ownership

The dedicated `src/app/(frontend)/news-events/page.tsx` route remains so its ownership is explicit
beside `news-events/[slug]`. Instead of rendering `NewsEventsArchivePage`, it loads the published Page
whose complete path is `/news-events` through the existing Page data layer and renders `PageContent`.

This route follows the established managed Page contract:

- only a published Page renders publicly;
- a missing or unpublished Page uses the managed 404 behavior;
- maintenance and coming-soon modes use the existing system-mode resolution;
- Page metadata, canonical settings, Open Graph data, robots policy, and structured Page data come
  from the Page document;
- the Page layout uses the normal Page renderer and block error boundaries;
- Page cache tags and existing Page revalidation hooks govern updates.

The Page is not seeded or created automatically. The operator must create a root Page with the exact
slug `news-events`, add the desired blocks, complete its SEO fields, and publish it.

## Dynamic Listing and Detail Flow

The manual Page may contain any Page blocks. The intended composition uses:

1. `News & Events Highlights` in Featured Carousel mode;
2. `News & Events Tabs` for the text-only classified listing;
3. optional normal Page blocks before, between, or after them.

Those blocks remain collection-driven. They load eligible published News & Events records on the
server and do not duplicate entry content inside the Page document. Every card continues to link to
`/news-events/[entry-slug]`, where the existing detail route renders the full entry.

The Page does not inherit the old archive's query-string filters or pagination. The tabbed block owns
its fixed All, News, Events, Notice, Holiday, Achievements, Announcement, and Others interaction.

## Removed Archive Surfaces

Remove the fixed archive implementation and its public taxonomy routes:

- `NewsEventsArchivePage`;
- `NewsEventsFeed`;
- `/news-events/category/[slug]`;
- `/news-events/tag/[slug]`;
- archive-only pagination, query parsing, URL construction, data loaders, and metadata helpers once
  all callers are removed.

Removed category and tag URLs return the normal managed 404. No redirects are added because the site
is still local and those routes have not been publicly indexed.

Topics and Tags remain part of News & Events documents for editorial organization, search, and any
future collection queries. On entry detail pages they render as non-interactive metadata instead of
links to removed routes.

## News & Events Settings Removal

Remove the `News & Events Settings` global from Payload configuration and delete its schema. Its
archive heading, filter labels, pagination, appearance, empty state, and archive SEO settings have no
consumer after the manual Page conversion.

Update every affected surface:

- generated Payload types;
- global-count and Admin information-architecture contracts;
- media usage and governance mappings for the removed global;
- operator guides, clone checklist, feature inventory, content-model map, and project-context
  references;
- archive-specific tests and fixtures.

The global's existing stored database document can remain harmlessly orphaned. No destructive data
migration or production database operation is part of this change.

## Preserved Routes and Features

The following remain unchanged:

- `/news-events/[slug]` detail pages;
- News/Event structured data and per-entry metadata;
- `/news-events/feed.xml` RSS output and feed autodiscovery;
- collection live preview for individual News & Events records;
- News & Events classifications, workflow, taxonomy relationships, media, and SEO fields;
- search results and entry URLs;
- `News & Events Highlights`, `News & Events Tabs`, and the existing `News Grid` block behavior.

## Sitemap and Discovery

The sitemap no longer creates a special News & Events index entry from the removed global. The
published `/news-events` Page is included through the standard Pages sitemap loop, using the Page's
own `updatedAt`, robots mode, and sitemap controls.

Published News & Events detail URLs remain in the sitemap. News & Events category and tag URLs are
removed. Taxonomy URLs used by Articles or Reviews remain governed by those domains and are not
affected.

The RSS feed continues to link its channel to `/news-events` and each item to its existing detail URL.

## Error and Empty States

- Missing or unpublished `/news-events` Page: managed 404.
- Published Page with an empty layout: the normal empty Page rendering behavior.
- Dynamic block query failure: the block's existing empty-state/failure fallback; sibling blocks
  continue rendering.
- Removed category or tag route: managed 404 with no redirect.
- Missing News & Events entries: the editor-configured empty state inside the selected dynamic block.

## Testing and Verification

Focused tests cover:

- `/news-events` loads and renders the published Page layout;
- Page metadata replaces archive-global metadata;
- missing and unpublished Pages use the managed 404;
- system modes retain their established behavior;
- both dynamic News & Events blocks still link cards to detail routes;
- detail pages retain taxonomy labels without removed archive links;
- category and tag route modules are absent and their sitemap URLs are omitted;
- the RSS feed and entry detail routes remain registered and functional;
- `News & Events Settings` is absent from Payload globals, generated types, Admin documentation, and
  media governance;
- global counts, route inventories, sitemap contracts, and project-context inventory are current.

Verification includes focused Vitest coverage, Payload type generation, TypeScript, lint, the full
integration suite in proportion to the final diff, and the required project-context update/check
loop.

## Out of Scope

- Automatically creating or seeding the `/news-events` Page.
- Redirecting removed archive or taxonomy URLs.
- Changing News & Events entry detail URLs.
- Removing Topics or Tags from the News & Events collection.
- Removing or changing the RSS feed.
- Adding client-side Payload queries or pagination to Page blocks.
- Changing unrelated Page, theme, or collection behavior.

No changes from this design are committed or staged unless the user explicitly requests a commit.
