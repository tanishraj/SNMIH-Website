# SEO Operations Completeness Design

## Summary

This phase strengthens the starter as a handoff-safe marketing CMS by turning SEO from a loose set of fields into an explicit operating contract.

The current repo already has:

- global SEO defaults in `seo-settings`
- per-entry SEO fields on `pages`, `articles`, and `reviews`
- metadata resolution for page and content-entry routes
- basic `robots.txt` and sitemap support

What is still missing is operational completeness. SEO behavior is not yet standardized across all public surfaces, taxonomy archives do not have local SEO ownership, sitemap rules are too generic, and there are not enough guardrails to prevent contradictory or unclear configurations.

This phase closes those gaps without introducing enterprise workflow overhead or external SEO tooling.

## Goal

Turn SEO into a predictable, reusable operating layer across public content and archive routes, with local editorial ownership, consistent fallback behavior, and safe validation rules.

## Why This Phase Now

The primary product goal is still a strong content management tool for creating websites.

That means the next step after taxonomy should improve how public content is discovered, indexed, and handed off to non-technical teams.

This is the right next move because:

- the repo now has enough public content surfaces that SEO inconsistency becomes an operational risk
- taxonomy archives now exist and need first-class metadata ownership
- the starter should be able to support real editorial and marketing teams without relying on developers to interpret metadata behavior
- sitemap and robots behavior are part of the CMS contract for a real website starter, not optional polish

## Product Direction

This phase should make the starter better at:

- giving editors clear local ownership of SEO on every public surface
- making metadata resolution predictable across pages, entries, and taxonomy archives
- ensuring sitemap inclusion follows understandable rules instead of hidden implementation details
- preventing structural SEO contradictions at publish time

This phase should not try to become:

- an SEO scoring product
- a Search Console integration
- an analytics integration
- an AI suggestion system
- a manual SEO registry platform

## Scope

### In Scope

- standardize SEO behavior across `pages`, homepage, `system-pages`, `articles`, `reviews`, and routed taxonomy archives
- add optional SEO overrides to `categories` and `tags`
- add consistent canonical, robots, and sitemap controls
- expand sitemap generation to all eligible public routes
- add balanced SEO validation and publish-time guardrails
- add tests around resolver behavior, route inclusion, and structural SEO contradictions

### Out Of Scope

- keyword analysis
- readability scoring
- external webmaster integrations
- manual sitemap curation
- review tag archive routing
- block-library expansion

## Current-State Assessment

### What Exists Already

- `src/globals/SEOSettings.ts` defines global title, description, image, and robots defaults
- `src/app/(frontend)/pageData.ts` resolves metadata for pages through page-local fields plus global fallback
- `src/lib/contentEntries.ts` resolves metadata for `articles` and `reviews`
- `src/app/sitemap.ts` publishes a sitemap for `pages`
- `src/app/robots.ts` publishes a fixed `robots.txt`

### What Is Missing

- no SEO ownership on `categories` or `tags`
- `system-pages` only expose minimal meta fields and do not follow the same SEO contract as other public surfaces
- no consistent sitemap inclusion controls
- no route-aware sitemap handling for `articles`, `reviews`, or taxonomy archives
- robots behavior is string-based and not tied cleanly to sitemap/indexability rules
- no publish-time blocking for structural SEO contradictions
- limited admin clarity around inheritance and final resolved output

## Recommended Approach

Use an integrated SEO contract with local ownership on each public surface.

This means:

- `pages`, `system-pages`, `articles`, and `reviews` keep SEO fields on the document itself
- `categories` and `tags` gain optional SEO overrides for public archive routes
- `seo-settings` remains the fallback layer, not the main authoring surface
- metadata resolution, robots resolution, and sitemap eligibility follow one shared rule system

This is the right fit for the starter because it keeps ownership close to content, avoids introducing a second control plane, and matches the product goal of a client-handoff-safe editorial CMS.

## SEO Ownership Model

SEO should be treated as a shared contract with local ownership.

### Public Content Ownership

The following surfaces own their own SEO configuration:

- `pages`
- homepage through the selected homepage page document
- `system-pages`
- `articles`
- `reviews`
- `categories`
- `tags`

### Fallback Order

Each public surface should resolve metadata in this order:

1. surface-specific override
2. taxonomy-term override for archive routes
3. content-derived fallback
4. global SEO default

This preserves flexibility without making the final output unpredictable.

### Operational Controls

Each routed public surface should expose the same core controls:

- canonical URL override
- robots mode
- sitemap inclusion mode
- Open Graph overrides where the surface already supports richer metadata

Review tags remain non-routed in this phase, so they may store SEO fields as future-safe content but they do not participate in public route resolution yet.

## Field Model

### Reusable SEO Field Group

Create a reusable SEO field builder and apply it consistently where route behavior exists.

The field group should include:

- `metaTitle`
- `metaDescription`
- `ogTitle`
- `ogDescription`
- `ogImage`
- `canonicalURL`
- `robotsMode`
- `includeInSitemap`

### Robots Mode

`robotsMode` should use a normalized operating model:

- `default`
- `index`
- `noindex`

`default` means inherit from the normal resolver chain, not “unknown.”

This is intentionally simpler than exposing every robots string permutation on every document.

### Sitemap Inclusion Mode

`includeInSitemap` should use:

- `default`
- `include`
- `exclude`

`default` resolves from route eligibility:

- published
- public
- indexable

This creates a safe automatic baseline while still allowing per-entry control.

## Route Behavior

### Pages And Homepage

Pages and the real homepage should continue to resolve metadata from their own SEO fields first, then from content-derived fallback, then from global defaults.

Homepage SEO remains owned by the page selected through `page-settings.homepage`, not by a separate SEO-only record.

### System Pages

`system-pages` should be upgraded from minimal meta fields to the same SEO contract as other public surfaces.

Only system pages that are actually routed on the public site should participate in sitemap and robots resolution.

### Articles And Reviews

`articles` and `reviews` should continue using entry-local SEO fields, but the resolver should move to the shared contract so canonical, robots, and sitemap behavior are consistent with pages.

### Taxonomy Archives

Public archive routes should resolve metadata from the taxonomy term first:

- `/articles/category/[slug]`
- `/articles/tag/[slug]`
- `/reviews/category/[slug]`

Resolution order:

1. term SEO override
2. term title and description
3. global SEO defaults

Review tag routes remain out of scope, so review tags do not produce public SEO routes in this phase.

## Sitemap Behavior

Use automatic inclusion with per-entry override.

### Default Inclusion Rules

By default, a route is included in the sitemap only when it is:

- public
- published
- indexable

### Included Route Families

The sitemap should include eligible routes for:

- homepage
- published `pages`
- routed public `system-pages`
- published `articles`
- published `reviews`
- public `categories` used by article and review category archives
- public `tags` used by article tag archives

### Excluded Route Families

The sitemap should exclude:

- noindexed routes
- routes explicitly excluded through `includeInSitemap=exclude`
- non-routed taxonomy terms
- admin and internal-only surfaces
- unpublished content

### Override Rules

Editors may explicitly exclude otherwise eligible routes.

Editors may explicitly include routes only when the route is public and indexable. A noindexed route cannot be forced into the sitemap.

## Guardrails And Validation

The validation model should be balanced, not punitive.

### Blocking Rules

Publishing should be blocked for structural contradictions such as:

- invalid canonical values that are neither valid absolute site URLs nor valid site-relative paths
- `robotsMode=noindex` combined with `includeInSitemap=include`
- forced sitemap inclusion on non-routed taxonomy terms

### Warning Rules

Warnings should be shown, but publication should still be allowed, for:

- missing `metaTitle`
- missing `metaDescription`
- missing archive-term SEO copy when title/description fallback still exists
- weak Open Graph coverage where fallback behavior is still valid

### Admin Clarity

The admin should explain inheritance and resolved behavior in plain language, for example:

- `Robots: inherited from global`
- `Sitemap: excluded because this route is noindex`
- `Canonical: resolves to /articles/category/guides`

The goal is to help operators understand the final output without reading code or internal documentation.

## Implementation Shape

This phase should prefer shared utilities over duplicated collection-specific logic.

Recommended implementation seams:

- a reusable SEO field builder for public content and routable taxonomy
- a resolver utility that returns resolved canonical, robots, metadata text, Open Graph image, and sitemap eligibility
- shared helpers for route eligibility and sitemap aggregation
- updates to `pageData`, `contentEntries`, `sitemap`, and `robots` to consume the shared resolver behavior

This should reduce hidden divergence between pages, entries, and archive routes.

## Testing

This phase should add direct coverage for the SEO contract.

### Required Coverage

- metadata resolution tests for `pages`, `system-pages`, `articles`, `reviews`, and routed taxonomy archives
- canonical validation tests
- publish-block tests for contradictory SEO states
- sitemap inclusion and exclusion tests across all eligible route families
- tests for taxonomy-term SEO fallback behavior
- tests confirming non-routed terms do not leak into sitemap output

### Verification Goal

An operator should be able to predict, from the admin UI alone, whether a route will:

- be indexable
- be included in sitemap
- publish with valid canonical behavior
- resolve meaningful metadata even when optional overrides are empty

## Risks And Constraints

- `system-pages` currently use a smaller meta model and will need a deliberate upgrade path
- existing robots handling is string-based and should be simplified without breaking current behavior
- sitemap expansion must stay route-aware rather than blindly enumerating collections
- taxonomy archives now exist, so public SEO logic must remain aligned with route scope and non-goals

## Non-Goals

This phase does not include:

- keyword targeting tools
- SEO scoring dashboards
- analytics reporting
- Search Console submission tooling
- AI content assistance
- manual sitemap registry management
