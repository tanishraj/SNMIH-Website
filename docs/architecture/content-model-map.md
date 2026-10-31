# Content Model Map

Use this ownership map before adding schema so client-specific changes land in the correct collection, global, or runtime layer. The exhaustive technical map is [Feature Inventory](./feature-inventory.md).

## Content

`pages` owns hierarchical public CMS routes, block layouts, optional per-block Section Anchor IDs,
native draft/publication state, live preview, route SEO, synchronized Page links, and automatic
redirects when a published path changes. Anchor links use Custom URL destinations such as
`#admissions` or `/programmes#mbbs`.

`reusable-sections` owns shared block groups referenced from Pages, including the anchor IDs of its
nested blocks. It uses a restricted block set and cannot reference itself.

`articles` owns authored long-form content, Topics and Tags, featured media, related-article behavior, SEO, and live preview. Article topic and tag archives are route-owned.

`news-events` owns both news stories and dated events. Event entries add validated date, location, and registration data. The collection drives the dedicated archive, detail routes, Highlights block, feed, structured data, and live preview.

`reviews` owns moderated public ratings/testimonials and immutable linkage back to a promoted Form Submission. Review topic archives, feed blocks, rating summaries, SEO, and live preview read this collection.

## Taxonomy

`categories`, labeled `Topics`, owns hierarchical reusable classifications. Articles, Reviews, and News & Events use primary Topics; Articles and News & Events also support additional Topics.

`tags` owns flat keywords used by Articles, Reviews, and News & Events. The built-in tag archive route exists for Articles; News & Events filters Tags through archive query parameters.

## Navigation And Site Structure

`navigation-links` owns reusable Page or custom destinations, including same-page and cross-page
fragment URLs. Pages create and update their own synchronized records; manual records remain
independently managed. Current Header/Footer presets use their own inline Page/custom link fields,
while System Page actions can use Navigation Links.

`redirects` owns enabled normalized incoming paths, 301/302 status, and Page/custom destinations. The redirect proxy refreshes its in-process map every 60 seconds.

`headers` and `footers` own versioned shell presets. The current schema registers Header Navbar 12 and Footer 56 respectively. Site identity, contact, legal, and social defaults are injected from `site-settings` rather than duplicated in each preset.

`office-locations` owns reusable map/contact records consumed by the Regional Offices Page block. Both map URLs must be HTTPS.

`system-pages` owns one matching 404, maintenance, or coming-soon block per preset, plus SEO and native draft/publication state. `system-mode-settings` selects and activates these presets.

## Media

`media` owns uploads, internal classification, alt text, usage summaries, critical-asset notes, deletion protection, storage health, Action Queue integration, and selected Audit Log events.

`gallery-albums` owns ordered image collections for Event Gallery. Its first image is the cover and the remaining row order controls the viewer.

## Forms And Intake

`forms` owns general, lead, or review-intent schemas, including dedicated phone fields, validation fields, notification recipients, and optional submitter confirmation copy. Review-intent validation prevents additional required fields that the fixed Review Submission renderer cannot display. Public spam controls, phone-format rules, email presentation, and rate-limit constants live in application code, not editable Form fields.

`form-submissions` owns stored visitor data, searchable submitter contact metadata including phone, source/campaign metadata, assignment, follow-up state, activity, optional promotion to a governed Review, and links to any uploaded attachments.

`form-attachments` owns files uploaded through `File upload` form fields. Records are created only by the submission route, are never editable, link back to their Form and Form Submission, and are readable only with the Form Submissions feature; object storage serves them through Payload access control rather than a public URL.

## Administration

`work-queue`, labeled `Action Queue`, owns CMS-generated operational work. Hooks deduplicate, reopen, and auto-resolve approval, moderation, follow-up, publish, media, and system conditions.

`operational-audit-events`, labeled `Audit Log`, owns immutable selected operational history. It is not a complete record of every database change.

`users` owns Payload authentication, the Admin and Site Manager roles, and the 30 feature grants that Admins assign to Site Managers. Admin access is implicit and Users administration is never grantable.

`work-queue` and `operational-audit-events` carry their source feature. A Site Manager can see those records only when granted both the Action Queue or Audit Log feature and the record's source feature.

All collections receive Payload Trash through the project plugin, subject to their normal access rules.

## Settings Globals

`site-settings`, labeled `Site Identity`, owns site name/description, logo/favicon, contact/address, privacy and terms Page relationships, and social links.

`theme-settings`, labeled `Appearance`, owns the site theme preset and system/light/dark mode.

`seo-settings`, labeled `SEO & Metadata`, owns fallback title, title template, description, default social image, robots behavior, and Google verification.

`analytics-settings`, labeled `Analytics & Tracking`, owns GTM and standalone GA4 configuration.

`cookie-consent-settings`, labeled `Cookie Consent Banner`, owns consent UI enablement, four variants, position, and copy. Analytics still requires a granted consent cookie.

## Configuration Globals

`page-settings`, labeled `Layout Defaults`, chooses the homepage, active Header/Footer, default Page appearance, and site-wide announcement behavior.

Pages own the `/news-events` index route and its layout, appearance, and Page SEO. The News & Events
collection owns individual entries and the Event-only `featuredInHighlights` flag. News & Events
Highlights prioritizes eligible checked Events before automatic upcoming Events, while News & Events
Tabs queries the complete published classification directory for Page composition.

`news-events-detail-template`, labeled `News & Events Detail Template`, owns the fixed Page Header,
automatic Breadcrumb appearance, article/sidebar presentation, featured-image ratio, and shared
public author label for every `/news-events/[slug]` route. Entry title, excerpt, featured image,
Lexical body, dates, category, location, and registration remain collection-owned.

`system-mode-settings`, labeled `Maintenance & Modes`, selects the published type-safe 404/maintenance/coming-soon presets and activates maintenance or coming-soon mode. Current mode overrides apply to the homepage, catch-all CMS Page routes, and the explicit Page-backed `/news-events` route, not every dedicated domain route.

## Runtime-Owned Features

- `/search` and the command-key dialog query Pages, Articles, and News & Events; they have no CMS global.
- `/articles/feed.xml` and `/news-events/feed.xml` are RSS 2.0 feeds with Atom self-links.
- `/robots.txt`, `/sitemap.xml`, dynamic social images, JSON-LD, and cache/revalidation behavior are application routes and helpers.
- the Forms submission, review feed, search, redirects, and media reconciliation APIs are application-owned.
- MongoDB, Resend, local/S3 media, and deployment constraints are environment-owned.

## Extension Rules

- add client-specific collections beside the core starter collections instead of overloading Pages or System Pages
- prefer hooks and `src/lib` helpers for cross-cutting side effects
- keep global ownership explicit so identity, layout, modes, SEO, analytics, and archive settings do not drift
- keep visitor intake in Forms/Form Submissions and only promote curated public content to editorial collections
- add a Page block only when its data does not deserve a governed reusable collection of its own
