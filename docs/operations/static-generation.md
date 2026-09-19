# Public static generation and on-demand refresh

The public frontend uses Next.js static generation with incremental static regeneration (ISR).
The application still runs a Next.js server for Payload Admin, APIs, authenticated previews,
search, form submissions, and page regeneration. Keep `output: 'standalone'`; do not use a
static-only export for this combined application.

## Build and delivery

During `pnpm build`, published CMS Page paths, Articles, Reviews, News/Events, and Article/Review
taxonomy archives are enumerated through Payload's Local API. Queries enforce anonymous access,
read only routing fields, and paginate in batches of 100. This excludes drafts, trash, and
unapproved submitted Reviews. Page paths include their published ancestor hierarchy. Missing
ancestors and cycles are excluded. The homepage and fixed `/news-events` page also prerender.

The build environment must have the correct database connection, database name, Payload secret,
and provider configuration. It must be able to reach MongoDB. A failed routing query fails the
build instead of deploying an incomplete list silently. Empty databases remain supported.

Generated HTML includes initial CMS content and block data. Interactive components hydrate in
the browser; their existing pagination, search, and form endpoints remain dynamic. A new public
URL can be generated and cached on its first visit without rebuilding the deployment.

## Content changes

Publication, unpublishing, and deletion hooks expire the existing CMS data tags and the public
frontend route tree. Taxonomy changes and published shared-record changes also invalidate the
frontend. This deliberately covers all public pages because reusable blocks, navigation, and
related-content lists can embed records across collections. Admin and API route groups are not
part of this route-tree invalidation. Pages regenerate lazily when visited, not all at once.
Draft-only saves leave public caches intact.

The frontend has a five-minute time-based revalidation interval for displays whose meaning
changes with the clock, such as upcoming Events. Time-based ISR can serve the previous page
while regenerating it; it is not an exact scheduled-publication timer. Editorial publication and
takedown use explicit on-demand invalidation. Newly published URLs also invalidate cached 404s.

Vercel manages its deployment cache. A single standalone server uses Next.js's server cache;
multiple self-hosted replicas need shared cache storage and coordinated invalidation before
assuming a publication is immediately visible on every replica.

## Previews

Article previews use `/preview/articles/[slug]`; News/Event previews use
`/preview/news-events/[slug]`. They authenticate the Payload user, enforce draft read access,
remain dynamic, and carry noindex metadata. Existing `?preview=true` URLs redirect to these
routes. Page previews retain `/preview/page/[id]`. Public pages do not authenticate visitors or
read preview query parameters; the editor toolbar still loads its session after hydration.

## Verification

Run `pnpm test:ssg` for an isolated production build and HTTP smoke test. It creates a temporary
app copy and disposable MongoDB, without using application `.env` files or the development
server/build output. It checks generated route artifacts, cached delivery, private previews,
publication changes, unpublishing, URLs created after the build, and deletion. It requires local
ports and access to the MongoDB binary download if no binary is available.
