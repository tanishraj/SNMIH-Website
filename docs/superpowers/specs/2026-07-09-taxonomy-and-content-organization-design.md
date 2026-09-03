# Taxonomy And Content Organization Design

## Summary

This phase strengthens the starter as a website CMS by introducing reusable taxonomy and inventory behavior for content-driven sections of the site.

The current repo already has:

- strong structural website primitives in `pages`, `navigation-links`, `headers`, `footers`, and site globals
- dedicated content collections in `articles` and `reviews`
- centralized published-content resolution for entry pages
- editorial workflow guardrails and SEO defaults

What is still missing is a scalable content-organization model. `articles` and `reviews` can be authored and published, but they are still thin as inventory systems. There is no reusable taxonomy layer, no archive/discovery rules, and no built-in related-content behavior that would let teams manage larger content sets consistently.

This phase adds that missing inventory layer without expanding into full search, block-library growth, or broader application behavior.

## Goal

Turn `articles` and `reviews` into better-organized website content types by introducing reusable taxonomy, deterministic archive behavior, and simple related-content rules.

## Why This Phase Now

The primary product goal is a strong content management tool for creating websites.

Because of that, this phase should prioritize website content operations over deeper lead-operations work.

This is the right next move because:

- a website CMS is judged first by how well teams can organize, publish, and maintain content
- `forms` and `form-submissions` already provide a credible operational baseline
- `articles` and `reviews` are present, but their inventory model is still too thin for long-term content management
- better article editing alone would improve authoring quality, but not the underlying organization model that archive pages, discovery, and scaling depend on

## Product Direction

This phase should make the starter better at:

- organizing editorial content into reusable categories and tags
- building website archive surfaces from CMS-managed taxonomy
- connecting related entries through deterministic rules
- supporting larger inventories without custom per-client content hacks

This phase should not try to become:

- a search product
- a recommendation engine
- a generalized taxonomy system for every content type in the repo
- a page-builder expansion phase

## Scope

### In Scope

- introduce reusable `categories` and `tags` collections
- connect taxonomy to `articles`
- connect taxonomy to `reviews`
- add category and tag-driven archive behavior for article content
- add category-driven archive behavior for review content
- add simple related-content behavior for article and review entry pages
- improve admin organization and list-view visibility for taxonomy-aware content
- add tests around taxonomy-driven published-content behavior

### Out Of Scope

- taxonomy support for `pages`
- full-text search
- faceted filtering UI beyond archive-level taxonomy views
- managed landing-page builders for category or tag pages
- advanced recommendation logic
- article editor redesign
- personalization

## Current-State Assessment

### What Exists Already

- `src/collections/Articles.ts` provides article authoring, workflow, SEO, and entry-page preview
- `src/collections/Reviews.ts` provides moderated review authoring, supplemental layout, workflow, SEO, and entry-page preview
- `src/lib/contentEntries.ts` centralizes article/review published lookup and metadata resolution
- frontend routes already exist for individual content entries:
  - `/articles/[slug]`
  - `/reviews/[slug]`

### What Is Missing

- no reusable category system
- no reusable tag system
- no archive routes driven by CMS content organization
- no related-content rules
- no editorial structure for grouping content beyond raw slugs and titles

## Recommended Approach

Use a dedicated reusable taxonomy layer:

- `categories`
  - hierarchical
  - editorially managed
  - used for primary organization and archive ownership
- `tags`
  - flat
  - lightweight topical labeling
  - used for cross-cutting themes and filtering

Attach taxonomy only to `articles` and `reviews` in this phase.

Do not make `pages` taxonomy-driven by default. `pages` remain structural website content, not inventory content. This keeps the separation between site architecture and editorial inventory clear.

## Taxonomy Model

### Categories

`categories` should be first-class CMS content, not enums or hardcoded constants.

Each category should include:

- title
- slug
- optional parent category
- optional short description

Behavior:

- categories are hierarchical
- hierarchy is for organization and archive grouping
- categories are centrally managed in admin
- categories are reused across content entries

Purpose:

- support primary website archive structure
- support scalable editorial organization
- support future content hubs without reworking the model

### Tags

`tags` should also be first-class CMS content.

Each tag should include:

- title
- slug
- optional short description

Behavior:

- flat, not hierarchical
- centrally managed
- lighter-weight than categories

Purpose:

- support cross-cutting topics
- support topical grouping that does not belong in the main category tree
- support future filtering and cross-linking behavior

### Relationships On Articles And Reviews

For both `articles` and `reviews`, add:

- `primaryCategory`
  - one relationship
  - required for entries that participate in archive behavior
- `categories`
  - many relationship
  - allows supporting category membership
- `tags`
  - many relationship
  - allows topical labeling

Relationship rules:

- `primaryCategory` should also exist in the broader `categories` relationship set
- the admin experience should make category ownership clear rather than treating all taxonomy equally

## Content-Type Boundaries

### Articles

Articles should be the most fully taxonomy-driven content type in this phase.

They should support:

- primary category archives
- tag archives
- related content
- clear editorial organization

### Reviews

Reviews should also support taxonomy, but the behavior should be slightly narrower.

They should support:

- primary category archives
- supporting tags
- related content

In phase one:

- review category archives are included
- review tag archive routes are not included
- reviews can still store tags for related-content and topical labeling

### Pages

Pages should not become taxonomy-driven content in this phase.

Reason:

- `pages` represent site structure and website architecture
- `articles` and `reviews` represent scalable content inventory
- forcing pages into the same taxonomy model would blur ownership and make the CMS harder to reason about

Future phases may add explicit related-content references to `pages`, but this phase does not introduce taxonomy or archive behavior for them.

## Public-Site Behavior

### Archive Routes

This phase should include usable frontend behavior, not only schema changes.

Recommended route pattern:

- `/articles/category/[slug]`
- `/articles/tag/[slug]`
- `/reviews/category/[slug]`

Review tag routes are explicitly out of scope for this phase. Article category and tag archives are part of the first version.

### Archive Content Rules

Archive pages should:

- show published content only
- exclude drafts, scheduled-only, reverted, or unpublished entries
- update automatically when content is published or unpublished

This preserves the repo’s current published-only frontend contract.

### Related Content

Each entry page should be able to resolve a small related-content section.

Related-content resolution should remain deterministic and explainable:

1. match on same primary category first
2. then use shared tags
3. exclude the current entry
4. cap the number of returned items

This should not try to be “smart.” The goal is reusable CMS behavior that operators can understand.

### No Search In This Phase

Taxonomy should solve organization first.

Search is a separate future phase and should not be folded into this work. Adding search now would expand this phase from CMS organization into product/discovery infrastructure too early.

## Editorial Workflow Behavior

Taxonomy should become part of the editorial operating model, not just metadata storage.

Editors should:

- choose one primary category per entry
- optionally assign supporting categories
- optionally assign tags
- reuse centrally managed taxonomy instead of inventing labels ad hoc on each entry

Editorial expectations:

- taxonomy terms are shared across content, not created inline during rushed publishing
- categories are stable and structural
- tags are lighter but still controlled enough to avoid duplicate spelling drift

## Admin Experience

### Taxonomy Collections

Admin should expose:

- `Categories`
- `Tags`

These should have:

- clear titles
- safe slug behavior
- straightforward reusable management

### Article And Review Lists

List views for `articles` and `reviews` should surface taxonomy fields clearly enough that operators can sort and scan content organization from admin without opening each entry.

That means:

- default columns should include primary category or equivalent visible taxonomy ownership
- taxonomy should be searchable/filterable enough for operational use

## Architecture Boundaries

### Data Ownership

Taxonomy lives in dedicated collections.

`articles` and `reviews` reference those collections.

`pages` do not adopt taxonomy in this phase.

### Retrieval Layer

Frontend content resolution should extend the existing `src/lib/contentEntries.ts` pattern instead of bypassing it or scattering taxonomy logic directly across route files.

That keeps published-entry lookup, metadata resolution, archive resolution, and related-content behavior in a coherent content-service layer.

### Published-Only Contract

All archive and related-content behavior should follow the same published-only rules already used by content entry pages.

### SEO Behavior

This phase should not invent a full managed SEO-landing system for taxonomy archives.

Initial taxonomy archive SEO can be deterministic and lightweight. If richer archive landing behavior is needed later, that should be its own phase.

## Testing Strategy

This phase should raise behavioral coverage around website-content organization.

Tests should verify:

- taxonomy relationships on `articles` and `reviews`
- published-only archive resolution
- unpublished entries disappearing from archives
- related-content selection rules
- slug-based archive lookup behavior

The tests should protect CMS contracts, not just boot behavior.

## Success Criteria

This phase succeeds when:

- editors can organize `articles` and `reviews` with reusable categories and tags
- the website can expose archive pages without custom client-specific code paths
- related content becomes a reusable CMS behavior
- content inventory is easier to scale before adding more blocks or more content types
- the starter becomes more credible as a website-content CMS, not only an admin backend

## Non-Goals

This work does not include:

- full search
- faceted search UX
- taxonomy on `pages`
- category landing-page block composition
- major article editor redesign
- personalization
- CRM or lead-pipeline work

## Recommendation

The recommended next implementation phase is:

1. add reusable taxonomy collections
2. attach taxonomy to `articles` and `reviews`
3. add archive/discovery routes
4. add deterministic related-content behavior
5. verify it with CMS-behavior tests

After this lands, the next high-value phase should be the article authoring/editor experience, built on top of the stronger content-organization model rather than before it.
