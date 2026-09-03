# News & Events Taxonomy Routes Design

**Date:** 2026-08-06

## Goal

Give News & Events categories and tags stable, indexable archive URLs so eligible taxonomy terms can be represented in the sitemap without adding non-canonical query-string combinations.

## Public Route Contract

Add two public route families:

- `/news-events/category/[slug]`
- `/news-events/tag/[slug]`

Each route renders the existing News & Events archive experience with the matching taxonomy filter fixed by the pathname. An unknown term returns the application 404. A term excluded from the sitemap or configured as noindex can still resolve as a public archive when it exists; its SEO controls determine indexability and sitemap inclusion rather than route availability.

The existing `/news-events` query filters remain supported. When a user selects exactly one category or tag, navigation uses the matching dedicated route. Additional browsing state—content type, the other taxonomy dimension, or pagination—uses query parameters on the active route.

## Rendering And Data Flow

The archive page and both taxonomy routes share one server-side archive renderer. The renderer receives an optional fixed taxonomy context, parses the remaining search parameters, and overwrites the corresponding query field with the pathname slug. This prevents a query parameter from contradicting the dedicated pathname.

The shared renderer continues to load archive settings, available category/tag filters, archive results, and upcoming/past event pages through the existing News & Events helpers. Existing failure fallbacks remain unchanged.

The feed link builder receives the active archive base path. Category selections switch to `/news-events/category/[slug]`; tag selections switch to `/news-events/tag/[slug]`. Clearing the fixed taxonomy returns to `/news-events`, while adding the other taxonomy filter preserves the active base path and uses a query parameter. Pagination and content-type links preserve the active base path.

Story taxonomy links also use the dedicated category and tag paths.

## Taxonomy Resolution And Metadata

Add cached News & Events taxonomy lookup helpers for category and tag slugs. They read the corresponding Payload collection at depth zero and return the term or `null`.

Dedicated route metadata uses:

- the taxonomy term's SEO title and description when present;
- otherwise a deterministic title such as `<Term> | News & Events` and the News & Events archive description;
- the term's canonical override when configured, otherwise the dedicated route pathname;
- the term's robots mode inherited from the global SEO policy;
- the News & Events archive Open Graph image and Twitter card defaults.

Pagination and additional filters remain canonicalized to the base dedicated taxonomy pathname. Metadata generation returns the inherited noindex form only through the existing robots resolver; it does not manufacture separate canonical URLs for filter combinations.

## Sitemap Model

The sitemap derives News & Events category and tag usage from eligible published News & Events records. It considers `primaryCategory`, additional `categories`, and `tags`.

For each used taxonomy term:

- include `/news-events/category/[slug]` when the category term passes its robots and sitemap controls;
- include `/news-events/tag/[slug]` when the tag term passes its robots and sitemap controls;
- use the taxonomy term's `updatedAt` value for `lastModified`;
- rely on the sitemap's pathname map for deduplication.

Article category, article tag, and review category sitemap behavior remains unchanged. The sitemap never generates the cross-product of content type, category, tag, or pagination parameters.

## Verification

Focused tests cover:

- category and tag route rendering with the fixed pathname filter;
- unknown taxonomy terms returning 404;
- taxonomy metadata fallback, canonical URL, robots inheritance, and configured overrides;
- archive and story links using dedicated taxonomy paths;
- sitemap inclusion for categories and tags used only by News & Events;
- additional categories as well as primary categories;
- exclusion of unused, noindex, or sitemap-excluded terms;
- absence of query-string taxonomy entries in the sitemap.

TypeScript, ESLint, documentation vocabulary tests, the focused News & Events suites, and patch-integrity checks complete verification.

## Documentation

Update the News & Events guide and feature inventory with the dedicated category and tag route behavior. Remove the sitemap taxonomy limitation and the empty Known Implementation Boundaries section after the implementation passes.

## Out Of Scope

- generating sitemap entries for taxonomy combinations, content-type filters, or pagination;
- adding standalone article or review index pages;
- changing the Payload taxonomy schemas;
- changing the existing archive presentation design;
- redirecting legacy News & Events query-filter URLs.
