# News & Events Detail Block Template Design

## Purpose

Replace the field-heavy News & Events detail-template configuration with a familiar block-builder
workflow. Editors will compose one shared detail-page template using the existing Page Header,
Breadcrumb, and other compatible page blocks, plus one required dynamic News & Events Content
block.

Every `/news-events/[slug]` route will continue to resolve its content from the News & Events
collection. The template controls presentation only; editors will never select or bind an individual
entry inside the template.

## Approved Direction

Keep the existing versioned `news-events-detail-template` Payload global as the single source of
shared detail-page presentation. Rename its Admin label to **News & Events Detail Page** and replace
its Page Header, Breadcrumb, and Article Layout setting groups with one `layout` blocks field.

This is intentionally a singleton global rather than a new collection:

- There is one shared template for every News & Events entry.
- Editors do not need to create, name, publish, or select a template record.
- The dynamic route requires no additional relationship or slug ownership.
- Existing global access, drafts, caching, and invalidation conventions remain applicable.

The global's block builder will offer compatible page blocks before and after the dynamic article.
It will also offer one global-only block named **News & Events Content**. That block is the binding
point for the current route entry.

## Admin Experience

An editor opens **Configuration → News & Events Detail Page** and arranges blocks in normal page
order. A typical template is:

1. Page Header.
2. Breadcrumb.
3. News & Events Content.
4. Optional related or promotional blocks.

The existing Page Header and Breadcrumb block schemas remain authoritative. Editors receive the
same content, theme, spacing, media, action, and appearance options available when those blocks are
used on a regular Page.

The template can include the same block set registered for Pages, including Reusable Section, plus
the global-only News & Events Content block.
Registration remains explicit in the global config and detail renderer, following the repository's
current block-system convention. The implementation must not introduce a mixed server/client block
registry merely to reduce repeated imports.

The News & Events Content block is available only in the detail template. It is not registered in
Pages or Reusable Sections because it has no meaningful output without a current News & Events
entry.

## Template Validation

A published template must contain exactly one News & Events Content block.

- A template with no dynamic content block cannot be published.
- A template with more than one dynamic content block cannot be published.
- The Admin validation message must explain that exactly one News & Events Content block is
  required.
- Draft templates may be incomplete so editors can save work in progress.

Runtime normalization remains defensive. Legacy or malformed published data must not make detail
pages blank or duplicate the article.

## News & Events Content Block

The block stores presentation settings only:

- Author label, defaulting to `Management, SNMIH`.
- Semantic section appearance.
- Section spacing.
- Featured-image aspect-ratio preset.
- Sidebar card semantic background.
- Sidebar card outline.
- Share-actions visibility.

The block receives these values automatically from the current News & Events entry:

- Title and excerpt.
- Featured image and its entry-owned object position.
- Classification, display date, and Event-specific metadata.
- Lexical body content.
- Registration action when applicable.
- Entry URL used by share controls.

The block does not expose a relationship, slug, source-mode, or manual-content option. It cannot be
bound to the wrong entry.

## Public Presentation

The existing News & Events article presentation remains the visual source of truth. Moving it into
the dynamic block is an architectural reorganization, not a redesign.

The block continues to render:

1. Entry title and excerpt with no entry-specific eyebrow.
2. Featured image with no text overlay.
3. A desktop two-column article region.
4. Styled Lexical content in the main column.
5. Story Details and optional Share This cards in the right sidebar.

The sidebar stays on the right on desktop and stacks below the article on smaller screens. Existing
theme tokens, responsive behavior, sticky positioning, card surfaces, and article typography remain
unchanged.

Standard template blocks render in their configured order before or after the dynamic content.

## Breadcrumb Behavior

When the existing Breadcrumb block is configured for automatic breadcrumbs, the detail renderer
provides:

1. Home.
2. News & Events.
3. Current entry title.

Manual breadcrumb mode remains available because the template uses the existing block contract.
Automatic mode is the recommended default and is used by the built-in fallback template.

The Page Header remains shared across all entries. Its content is authored directly in the template
and does not inherit the current entry title or excerpt.

## Runtime Data Flow

Production rendering follows this sequence:

1. Resolve and validate the published News & Events entry for the route slug.
2. Load the published News & Events Detail Page global in parallel.
3. Normalize the global layout or construct the safe fallback layout.
4. Build detail render context containing the current entry and automatic breadcrumbs.
5. Render standard blocks through their existing components.
6. Render News & Events Content with the current entry from context.
7. Generate metadata and structured data from the entry, preserving the existing author-label
   behavior.

The dynamic content block performs no second entry query. The route remains responsible for entry
authorization, publication filtering, scheduled visibility, and not-found behavior.

## Rendering Boundary

Use a dedicated `renderNewsEventDetailBlocks` renderer that accepts the normalized template layout
and explicit detail context. It may delegate standard block rendering to focused shared helpers, but
the public interface must make the dynamic dependency visible rather than placing entry data in
global state.

The renderer must:

- Preserve block order.
- Pass automatic breadcrumbs to Page Header and Breadcrumb blocks.
- Pass the current entry only to News & Events Content.
- Preserve existing reusable-section depth protection when reusable sections are allowed.
- Keep each block inside the established block error boundary.
- Return no output for an unrecognized optional block without breaking the article route.

## Fallback and Legacy Data

The existing field-based global may already contain header, breadcrumb, and article settings. No
destructive data migration is required.

If the published `layout` is absent, empty, invalid, or cannot be loaded, runtime normalization
constructs a default layout equivalent to the current detail page:

1. Minimal Page Header using the current default eyebrow, title, and description.
2. Automatic Breadcrumb using the current default appearance.
3. News & Events Content using the current article defaults.

This fallback keeps every published detail URL usable during deployment and before an editor
publishes the new block template. Legacy fields can be removed from the active schema once their
defaults have been represented in the fallback; stored database values do not require destructive
cleanup.

If old data and a new layout are both present, the new layout wins.

For malformed saved layouts, normalization keeps valid standard blocks, appends one default News &
Events Content block when none exists, and renders only the first dynamic content block when more
than one exists. This is a runtime safety net; normal Admin publishing still rejects either invalid
state.

## Preview and Drafts

The authenticated News & Events entry preview continues to use live entry data and the shared
detail-page presentation. It renders the published template unless the existing global-preview
workflow explicitly supplies a draft template.

The implementation must preserve:

- Authenticated draft entry lookup.
- The existing public-entry adapter.
- `RefreshRouteOnSave` behavior for server-owned changes.
- The same detail-template renderer in preview and production.

Template drafts do not affect public detail pages until published.

## Error Handling

- A missing or unpublished News & Events entry retains the existing not-found behavior.
- A failed template load is logged and uses the built-in fallback layout.
- Missing optional media does not render a broken image wrapper.
- Missing optional Event metadata is omitted cleanly.
- Share API failures remain isolated to the client-side share controls.
- Optional block failures remain isolated by the existing block error boundary.
- Invalid template multiplicity is rejected at publish time and normalized defensively at runtime.

## Caching and Access

Preserve the existing global capabilities, drafts/versions, public-read behavior, cache tags, and
revalidation hook. Public rendering reads only the published global. User-scoped Payload operations
must continue to enforce access explicitly; trusted server rendering may use the established
server-side access convention.

## Verification

Focused verification must cover:

- Global registration, Admin label, versions, access, and `layout` block field.
- Availability of compatible blocks and global-only registration of News & Events Content.
- Publish validation for zero, one, and multiple dynamic content blocks.
- Drafts remaining saveable while incomplete.
- Block ordering before and after dynamic content.
- Current-entry injection without a secondary lookup.
- Automatic and manual Breadcrumb behavior.
- Reuse of the existing article, sidebar, share, featured-image, and Lexical presentation.
- Safe fallback for missing, empty, invalid, legacy, and failed template data.
- Entry not-found and optional-data behavior.
- Authenticated News & Events live preview.
- Existing metadata, structured data, canonical URLs, and sitemap contracts.
- Generated Payload types and import map.
- Focused integration tests, TypeScript, lint, and project-context update/check.

## Out of Scope

- Multiple templates or category-specific templates.
- Per-entry template overrides.
- A template collection or template-selection relationship.
- Manual entry binding inside the dynamic block.
- Moving News & Events content ownership out of the News & Events collection.
- Redesigning the existing article or sidebar.
- Destructive cleanup of legacy global data.

## Repository Safety

Preserve unrelated staged and unstaged work. The later implementation must touch only files needed
for this approved architecture and must not commit changes unless the user explicitly requests it.
