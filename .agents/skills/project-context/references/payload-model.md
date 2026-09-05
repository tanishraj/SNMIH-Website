# Payload Model

## Registered Collections

Registration order in [payload.config.ts](../../../../src/payload.config.ts) is intentional:

1. Editorial collections: Pages and Articles under Content; NewsEvents and NewsEventClassifications under News & Events; Reviews and ReusableSections under Content.
2. Taxonomy: Categories (Topics), Tags.
3. Navigation and structure: NavigationLinks, Headers, Footers, OfficeLocations, Redirects, SystemPages.
4. Media: Media, GalleryAlbums.
5. Intake: Forms, FormSubmissions.
6. Administration: WorkQueue (Action Queue), OperationalAuditEvents (Audit Log), Users.

Exact symbols and files are generated in [project-inventory.json](project-inventory.json). Collections receive Trash through [withTrash.ts](../../../../src/plugins/withTrash.ts), except NewsEventClassifications: classification deletion remains a guarded hard delete. An in-use delete identifies the first referencing News & Events entry, Page, Reusable Section, Calendar/Annual Calendar/Tabs container, or Detail Page Template so the editor can remove or replace that relationship; classifications that must remain connected are archived instead. Content and structural presets opt into drafts/versions in their own configs; operational records and users are not public content.

## Registered Globals

Nine globals are registered:

1. SiteSettings — identity, regional timezone, contact, address, legal Pages, social destinations.
2. ThemeSettings — preset and system/light/dark scheme.
3. SEOSettings — default titles, metadata, image, robots, verification.
4. AnalyticsSettings — GTM or GA4 configuration.
5. CookieConsentSettings — banner enablement, variants, placement, copy.
6. PageSettings — homepage, header/footer presets, announcement, Page defaults.
7. NewsEventsDetailTemplate — ordered Page-compatible News/Event detail layout plus one global-only dynamic content block, presented with the News & Events Admin group.
8. SearchSettings — up to six unique operator-managed suggested search terms, governed by the Search
   Settings feature with draft/version recovery; public rendering trims, de-duplicates, and caps
   legacy rows defensively.
9. SystemModeSettings — off, maintenance, or coming-soon behavior and referenced presets. The active
   schema has no authenticated public-route bypass; any historical stored
   `bypassForLoggedInAdmins` value is ignored and deliberately left untouched.

## Ownership and Relationships

- Pages own hierarchical public routes and composed layouts, including the Page-backed `/news-events`
  index. Every Page-compatible block receives an optional centrally defined `anchorId`; Pages and
  Reusable Sections reject direct duplicate values, while runtime document-order claiming protects
  against duplicates introduced by nested or repeated Reusable Sections. Parent validation prevents
  cycles; hooks populate URL previews, synchronize links, create redirects after path changes, and
  revalidate caches. Published slug changes preserve MongoDB string IDs when creating the automatic
  permanent redirect, so saving a renamed Page and resolving its former URL remain one transaction.
- SiteSettings owns the Privacy Policy and Terms and Conditions Page relationships used by the public footer and consent UI. The dated legal-page migration creates only missing exact-slug Pages, fills only relationships empty in both published and latest states, and has an intentionally non-destructive rollback; later legal-copy changes remain editor-owned Page publications.
- Articles, NewsEvents, and Reviews own their detail content, taxonomy, SEO, native draft/publication state, and preview behavior. NewsEvents, NewsEventClassifications, and NewsEventsDetailTemplate share the `News & Events` Admin group. The entry editor keeps Content, Event Details, SEO, and Publication as its four primary tabs; Content also owns the required active Entry Classification relationship, featured-image controls, and a collapsed Topics & Tags group without changing their top-level stored paths. NewsEventClassifications provides centrally managed, public classification records with Story/Event behavior, semantic Calendar color, and archive-in-place lifecycle controls. Seeded records retain a hidden immutable legacy value; referenced records cannot be deleted or change behavior. NewsEvents entries require one classification relationship; request-aware validation resolves its behavior, keeps Event fields visible, validates dates and location for Event behavior, supports an all-day flag with an inclusive end date, and clears Event-only data, including `featuredInHighlights`, for Story behavior. Timed featured Events require an end date. Highlights renders up to three eligible featured Events before three eligible non-featured Events; Tabs ignores that flag and exposes the complete published classification directory, ordering Event classifications as current/upcoming then recent past. SiteSettings owns the supported IANA timezone and falls back to `Asia/Kolkata`; public News/Event adapters preformat labels and date keys in that timezone so browser locale cannot change grouping, while visitor time labels omit technical GMT/UTC suffixes. The hidden optional `contentType` field and an original-document fallback remain only for unmigrated entry updates during the compatibility release. Public News/Event adapters expose the resolved classification and behavior while retaining the classification slug as deprecated `contentType`. Public list loaders query canonical relationship IDs and also match a seeded legacy value only when an entry has no classification relationship, so unmigrated records remain visible without allowing stale compatibility data to override migrated behavior. NewsEventsDetailTemplate owns the shared ordered Page-block composition. Its global-only `newsEventsContent` block binds the current entry and owns article/sidebar appearance, image ratio and shared overlay settings, share visibility, and public author label. Published templates require exactly one dynamic block; drafts may remain incomplete. The retained legacy entry Byline is hidden and ignored publicly.
- ReusableSections own shared block stacks and the anchors configured on their nested blocks. Direct
  recursive selection is excluded; renderers stop nesting after depth 10.
- NavigationLinks provide reusable destinations and page-synchronized records. Headers and Footers provide versioned shell presets.
- SystemPages pair one type with its matching block and are referenced from system modes.
- Media owns governed uploads, alt requirements, usage detection, deletion guards, storage health, queue sync, and audit events. GalleryAlbums own ordered reusable image sets.
- Forms define general, lead, and review-intent inputs and notifications. FormSubmissions own immutable submitted data plus operational state, activity, assignment, and optional Review promotion.
- WorkQueue stores deduplicated actionable conditions. OperationalAuditEvents stores selected immutable operational history. Both record their source feature for Site Manager row filtering. Users own authentication, Admin/Site Manager roles, and feature grants.

## Feature and Publication Governance

The only roles are Admin and Site Manager. Admins implicitly hold every registered feature and may grant any subset of the 29 Admin destinations to Site Managers. A missing grant fails closed in the sidebar and at the Payload access layer. Relationship dependencies receive bounded read access without exposing the destination or permitting mutation.

Governed content uses Payload's native `_status` as its only draft/publication state. Open or blocked approval/publish-issue queue items prevent publishing; in-progress items do not. Publishing stamps actor and time metadata. Public review submissions additionally remain draft and pending until an Admin or Reviews-granted Site Manager approves or rejects them.

Read [adminFeatures.ts](../../../../src/access/adminFeatures.ts), [featureAccess.ts](../../../../src/access/featureAccess.ts), [enforcePublicationPolicy.ts](../../../../src/hooks/enforcePublicationPolicy.ts), [enforceReviewModeration.ts](../../../../src/hooks/enforceReviewModeration.ts), and the [editorial governance runbook](../../../../docs/operations/editorial-governance.md) together before changing this model.

## Shared Fields and Hook Safety

- [bodyEditorConfig.ts](../../../../src/fields/bodyEditorConfig.ts) defines one complete fixed-toolbar
  Lexical editor used explicitly by Article bodies, News/Event bodies, Rich Text blocks, Q&A answers,
  and the Payload fallback. H1 remains reserved for the surrounding document title.
- [buildSEOFields.ts](../../../../src/fields/buildSEOFields.ts) defines reusable route SEO controls.
- [cmsLinkFields.ts](../../../../src/fields/cmsLinkFields.ts) defines reusable Navigation Link relationships.
- [projectSlugField.ts](../../../../src/fields/projectSlugField.ts) wraps Payload's generated slug field for all slug-based collections. It collapses separators and assigns the first available `-copy`, `-copy-2`, and later suffix while preserving existing stored slugs.

Anonymous reads of draft-enabled public collections are constrained to published documents at the
Payload access layer. Submitted Reviews additionally require approved moderation, and internal
Form/Media fields require an appropriate feature grant. Payload Local API calls bypass access
by default. Use `overrideAccess: false` when acting for a user. Pass `req` into nested operations so
they share transactions. Use request context flags when a hook writes data that could trigger itself.
Run `pnpm generate:types` after schema changes and keep
[payload-types.ts](../../../../src/payload-types.ts) synchronized.
