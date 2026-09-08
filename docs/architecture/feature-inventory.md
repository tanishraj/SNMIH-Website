# Feature Inventory

This is the maintained technical map of the starter. It records what is registered and reachable in the current source tree; historical plans in `docs/superpowers` explain how features were built but are not product documentation.

## Runtime Architecture

- Payload CMS 3.85.2 and Next.js 16 share one App Router application.
- React Server Components load public CMS data; focused client components provide carousels, dialogs, tabs, consent, forms, and gallery interaction.
- The public shell uses tagged CMS caches and does not read request cookies or authenticate a Payload user. A private no-store `/api/frontend-session` lookup mounts the editor toolbar after hydration when a CMS session exists.
- Analytics settings cross the cached shell as primitive props; a client consent boundary mounts GTM or standalone GA4 plus Speed Insights only after consent.
- MongoDB is the only supported database adapter.
- Uploads use local disk or an S3-compatible provider. Production on Vercel rejects local-disk media at startup.
- Public fonts use `next/font`-hosted Inter, Playfair Display, and IBM Plex Mono assets rather than runtime Google stylesheet imports.
- Email is disabled or delivered through Resend.
- Payload REST, GraphQL, admin, generated types, and generated import-map support are enabled.
- The local plugin `withTrash()` enables Payload Trash on every collection.

## Payload Collections

| Group          | Collection                             | Responsibilities                                                                                                     |
| -------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Content        | Pages                                  | Hierarchical routes, 59-block layouts, native drafts, SEO, live preview, page-owned links, path-change redirects     |
| Content        | Articles                               | Long-form Lexical content, topics/tags, related content, SEO, native drafts, live preview                            |
| News & Events  | News & Events                          | Single-choice classifications, event validation/registration, taxonomy, block/detail/feed data, drafts, live preview |
| News & Events  | Classifications                        | Public labels, Story/Event behavior, and Calendar colors used by entries, badges, tabs, dates, and validation        |
| Content        | Reviews                                | Moderated ratings and testimonials, source-submission linkage, taxonomy, SEO, native drafts, live preview            |
| Content        | Reusable Sections                      | Shared versioned block stacks with recursion and high-complexity block restrictions                                  |
| Taxonomy       | Topics (`categories`)                  | Hierarchical editorial topics with SEO data                                                                          |
| Taxonomy       | Tags                                   | Flat editorial keywords with SEO data                                                                                |
| Navigation     | Navigation Links                       | Page/custom destinations, including records synchronized from Pages                                                  |
| Navigation     | Redirects                              | Normalized unique incoming paths, page/custom targets, 301/302 choice, enable state                                  |
| Site Structure | Headers                                | Versioned Header Navbar presets                                                                                      |
| Site Structure | Footers                                | Versioned Footer 56 presets                                                                                          |
| Site Structure | Office Locations                       | Versioned map/contact records used by Regional Offices                                                               |
| Site Structure | System Pages                           | Governed 404, maintenance, and coming-soon presets with matching block validation                                    |
| Media          | Media                                  | Uploads, classification, alt validation, usage detection, deletion guards, storage health, operational sync          |
| Media          | Gallery Albums                         | Versioned ordered image albums used by Event Gallery's count-aware rectangular quilt and full-screen viewer          |
| Forms          | Forms                                  | Versioned general, lead, and review-intent field schemas plus email configuration                                    |
| Forms          | Form Submissions                       | Stored immutable payload/metadata, operational status/assignment/activity, optional review promotion                 |
| Administration | Action Queue (`work-queue`)            | Deduplicated CMS-generated approval, moderation, follow-up, publishing, media, and system work                       |
| Administration | Audit Log (`operational-audit-events`) | Immutable selected operational events and actor metadata                                                             |
| Administration | Users                                  | Payload authentication, Admin/Site Manager roles, and Site Manager feature grants                                    |

All collections use timestamps and Trash. Draft/version support is enabled where the individual config declares it; operational records and users are not public content.

## Payload Globals

| Group         | Global                | Responsibilities                                                                              |
| ------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| Settings      | Site Identity         | Brand, regional timezone, contact, address, legal Page relationships, and social destinations |
| Settings      | Appearance            | SNMIH-Green/SNMIH-Blue theme and system/light/dark color scheme                               |
| Settings      | SEO & Metadata        | Fallback title, template, description, image, robots, and Google verification                 |
| Settings      | Analytics & Tracking  | GTM or standalone GA4 identifiers and enablement                                              |
| Settings      | Cookie Consent Banner | Enablement, four presentation variants, corner position, and copy                             |
| Configuration | Layout Defaults       | Homepage, active header/footer, page appearance, and global announcement bar                  |
| News & Events | Detail Page Template  | Shared detail Page Header, Breadcrumb, article/sidebar appearance, image ratio, and author    |
| Configuration | Search Settings       | Up to 6 unique operator-managed suggested terms shown on the full Search page                 |
| Configuration | Maintenance & Modes   | Published type-safe system-page references and off/maintenance/coming-soon mode               |

Globals with versions retain history. Relevant changes invalidate cached frontend data; selected higher-risk changes are written to the Audit Log.

## Roles, Features, And Publication Governance

- The only roles are Admin and Site Manager. The first user is promoted to Admin, and the last active Admin cannot be demoted or deleted.
- Admins implicitly hold every feature and may create additional Admins or Site Managers. New Site Managers receive no features until an Admin grants them.
- The registry exposes 29 features corresponding to Admin destinations. Each grant controls sidebar visibility and server access; missing grants fail closed.
- Pages, Articles, News & Events, Reviews, and System Pages use Payload's native `_status` as their only draft/publication state. Publishing stamps user/time metadata.
- Review submissions remain draft and pending until an Admin or Reviews-granted Site Manager approves or rejects them. Only approved submitted Reviews may be public.
- Action Queue and Audit Log access is intersected with the user's source-feature grants; records from ungranted or unmapped features remain hidden.
- Open or blocked approval/publish-issue Action Queue items prevent publishing; `in_progress` items do not.
- Queue hooks create, reopen, deduplicate, and auto-resolve work from form, header/footer, link, redirect, review, media, and publication conditions.
- Audit coverage is selective rather than a complete database history: governed publication events, Reusable Sections, selected configuration globals, queue operator changes, and media deletion/storage events are covered.

See [Users, Features, and Publication Governance](../operations/editorial-governance.md) for the complete feature catalog, dependency-read behavior, migration procedure, and security boundaries.

## Page And Shell Block Systems

The canonical catalog contains 59 Page blocks. Normal Pages register all 59 choices: Announcement, Banner CTA, News Grid, News & Events Tabs, Calendar, Annual Calendar, Call to Action, Hero Banner, Hero Carousel, Gallery Coverflow, Feature Spotlight, Testimonial Spotlight, Feature Matrix, Content Highlights, Editorial Reasons, Academic Programmes, Leadership Profiles, Department Profiles, News & Events Highlights, Profile Carousel, Gallery Showcase, Event Gallery, Gallery Album Tabs, Image Mosaic, Student Experience, Stats Strip, Q&A Accordion, Rating Spotlight, Review Feed, Review Submission, Contact Form, Regional Offices, Team Showcase, Services, Rich Text, Video Embed, Media Carousel, Program Matrix, Logo Strip, Logo Marquee, Partner Directory, Page Header, Breadcrumb, Timeline, Icon Card Showcase, Icon Grid, Quote Block, Tabs Content, Download List, Fee Structure, PG Fee Structure, Bank Details, Numbered Steps, Bento Grid, Testimonial Grid, Awards List, About Section, Accreditation Cards, and Reusable Section. Reusable Sections expose the 58 non-recursive Page-compatible blocks.

Leadership Profiles provides a static, non-clickable leadership directory with an optional section title, required profile media and names, optional content nameplates, accented designations, qualifications, and up to three smaller expertise items. It omits an entirely empty header, adapts profile heading levels to the presence of a section title, and uses the shared split/stacked header when content exists. Its block-wide Standard layout preserves all profile metadata and one shared semantic card surface; a hidden per-profile field remains only as a first-profile fallback for saved content. The optional Image Overlay layout uses fixed `4:5` portraits plus shared tone, strength, direction, and coverage controls, and displays only the leadership label, name, and designation. Qualification and expertise values remain saved and return when Standard is selected. Existing documents use Standard without migration. The responsive grid retains one mobile column, at most two tablet columns, and two-to-four configured desktop columns.

Department Profiles stores profiles inside its ordered block-local department rows. Editors expand a department to manage its ordered profile list; department and profile row labels expose their names while collapsed. Empty departments remain valid, at least one profile is required, and the combined block limit is 400 profiles. The public All view follows department order and then nested profile order. The public directory independently enables search and department tabs, keeps All first, omits empty departments, searches name/designation/department across the complete list before pagination, and reveals 12, 16, 20, or 24 results per batch with 20 as the default. The department tab rail supports Content Width, Centered Auto Width, and Equal Full Width. Missing or invalid values use Content Width. Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable from the inline start when they overflow; Equal Full Width divides the available Search-adjacent rail evenly, or the full toolbar width when Search is hidden. Static non-clickable cards support Image Overlay and Inline layouts plus Large, Medium, and Small density. Image Overlay uses a compact portrait `4:5` ratio on mobile and a taller `3:4` width-to-height ratio from `sm` upward. It shares the established Overlay Tone (Auto/Light/Dark/Brand), Strength (Light/Dark/Darker), Direction, and Coverage (Full/Split 50%) controls; Even/Vertical always resolves to full coverage, while missing settings preserve Dark tone, Dark strength, Bottom-to-Top direction, and Full coverage. Its single-column mobile grid is centered and capped at 320px for Large, 288px for Medium, and 256px for Small. Inline uses a compact left image beside name, designation, and department. Boxed separates rounded cards, Framed Grid joins square cells inside a complete outer border, and Ruled Grid retains only the top and bottom outer rules. Images are optional in both layouts and unresolved media falls back to a semantic `UserRound` placeholder. Image Overlay Large remembers two-to-four profiles per row and defaults to four, Medium remembers three-to-six and defaults to six, and Small remembers four-to-eight and defaults to eight; mobile remains one column, small screens use at most two, standard desktop uses at most four, and five-to-eight columns activate at `2xl`. Inline retains the original two-to-four-column control at every size so its metadata keeps a readable measure. Missing legacy display settings resolve to Image Overlay Large, four columns, and Boxed. A reversible migration covers current and versioned Pages, Reusable Sections, and the News & Events Detail Template, while runtime temporarily accepts legacy flat assignments during rollout. The section reuses shared appearance, split/stacked header, actions, alignment, padding, and tab variants.

Program Matrix supports a stacked introduction or a 40/60 split at large breakpoints, with the introduction on either visual side and top, center, or bottom vertical positioning. Editors can select one to four responsive columns: mobile uses one, tablet uses at most two, and desktop uses the selected count. The introduction remains first in document order, and every programme card can independently expose one optional Link or Button action.

Fee Structure models one programme and one academic session per block. Editors configure one to four fee categories with ordered period columns, fee rows, text values, manual total emphasis, category-owned fee notes, and an optional Media download. Multiple-category tabs can use content width, centered auto width, or divide the full rail equally. Centered auto width shrink-wraps and centers the tabs when they fit, then returns them to the inline start inside the existing horizontal scroller when long labels or narrow viewports overflow. Runtime normalization never calculates totals, converts currencies, infers missing values, or exposes bank/payment-account fields. Table & Mobile Cards remains the default: tablet and desktop render a semantic horizontally scrollable table with a sticky fee-head column, while mobile renders one card per period. The optional Programme Cost Atlas uses the same normalized values in a 50/50 Primary/Card layout, moves only the first authored Total row into left-side Annual totals, renders remaining fee heads once on the right, and supports additional programme details plus a required, manually authored category-owned complete programme expense. Its statement heading preserves the authored category label verbatim beneath the fixed `Statement breakdown` eyebrow. New block authoring initializes those details with an editable `Programme Duration` / `4.5 Years` row without adding a runtime fallback or migrating existing documents. Atlas uses standard sans-serif titles, left-aligned period labels and values, matched two-half spacing, and semantic Primary/Card colors. The file remains the fixed download destination; it renders after the categories in the table layout and inside the active Atlas summary, as either an underlined Link or a semantic Button.

PG Fee Structure is an independent department-first model for postgraduate fees. Every General, NRI, or other category owns its ordered columns, departments, values, notes, and published currency strings. Columns are either shared across that category or supplied once per department; normalization expands both modes into one ordered row without calculation, parsing, inference, formatting, or conversion. Visitors receive one responsive 50/50 Primary/Card department atlas: the Primary summary contains programme/session context, active category, department count, category-shared charges, notes, and the optional canonical fee-document Link or Button panel, while the Card statement repeats the active category label unchanged as its heading, renders one complete chapter per department, and repeats shared values for self-contained reading. Categories with up to four departments retain natural height. At five or more departments, the desktop atlas is bounded to 676px, leaves the Primary summary and statement header independent, and scrolls only the complete department-chapter list; compact layouts remain natural-flow. Compact department chapters use a two-column ruled fee grid shared visually with Fee Structure Atlas; odd final values span the row, while `lg` layouts retain adaptive columns. Compact layouts stack summary then statement, and container-aware fee grids reflow without page-level horizontal scrolling. Multiple categories reuse the shared themed tab system and switch the complete frame. The block exposes no alternate layout selector, calculated totals, or payment-account fields.

Bank Details independently models one to six ordered, purpose-specific official payment accounts. Each
valid row requires only a purpose, account holder, account number, and IFSC code; bank name, Branch &
Type, UPI ID, and account-owned instructions are optional. Runtime normalization trims only outer
whitespace, preserves internal account characters, omits rows missing core fields, and keeps the first
valid occurrence of a case-insensitive purpose. One account renders directly; multiple accounts use
the shared themed and width-aware tab rail. Theme Settings owns Text/Scanner mode and the reversible
desktop panel side. The active account uses mirrored desktop tracks so the Primary context remains
36% and the white ledger remains 64% on either side at `lg`; compact layouts always stack contextual
content before the ledger and preserve space before the Text notice. Payment Purpose supplies both
the account tab and white-ledger eyebrow without additional suffix text. The optional Content-owned
Ledger Text group customizes the remaining persistent ledger copy, with independent code-owned
defaults for every missing, malformed, or whitespace-only nested value and no migration for
historical blocks.
The Primary context uses an upright display title; the operational ledger uses an upright sans title;
shared surface-aware green accents distinguish eyebrow and credential metadata. The fixed-white
ledger keeps dark light-overlay foregrounds across color schemes, and its compact Copy controls keep
touch-sized targets while Copy all uses smaller type. Every visible credential, Copy all, and the QR
share normalized payment-routing values; optional lines disappear cleanly, while Payment Purpose and
instructions remain visible context outside the payload. Transient copy and QR messages remain
system-owned. Clipboard feedback remains polite and recoverable, and QR generation makes no external
request. The block has no fee fields, calculations, masking, payment processing, data migration, or
fallback clipboard mutation.

Headers register only Header Navbar 12; Footers register only Footer 56; System Pages register one matching System 404, System Maintenance, or System Coming Soon block. The admin picker uses generated JPEG thumbnails. `/block-thumbnail-previews/[slug]` is development-only. See [Page Blocks](../guides/blocks.md) for the operator catalog.

Production Page blocks are wrapped in a block-level error boundary. The production renderer preloads only the first renderable Hero Banner image in document order, including heroes reached through Reusable Section recursion; missing hero media does not consume the preload. Live Page preview covers the same block types and production components, including blocks reached through Reusable Sections, without assigning that production preload. Reusable Section rendering has a maximum nesting depth of 10, while the schema prevents direct recursive selection.

Configurable visual blocks standardize their Payload editor structure as top-level `Content` and `Theme Settings` tabs. Genuine repeating card rows use the same nested tab structure and a shared semantic surface vocabulary: Default Card, Primary, Secondary, Muted, and Accent. The renderer resolves foreground, supporting text, icon, divider, link, and matching button contrast from the active theme. Variant-dependent controls only render a surface for existing card presentations; utility rows, connected timelines, lists, tables, galleries, logos, and navigation structures remain unboxed.

Download List provides Boxed Card, Open Grid, Framed Grid, and Inline List presentations beneath a
Stacked introduction or beside it in a responsive 40/60 Split. Split supports Left or Right
introduction placement plus Top, Center, or Bottom vertical alignment, always restores introduction-
first order on smaller screens, and does not reserve an empty introduction column. Grid items keep
file-type badges at the top right while their main icons can sit above or inline with the document
content. One shared one-to-eight Columns setting applies to every presentation and defaults or falls
back to three. The main file icon is optional across the block and defaults on. Inline never shows a
file-type badge. File Type Label provides an optional PDF/DOC/DOCX/XLS/XLSX/CSV/PPT/PPTX/ZIP preset
override; empty values auto-detect from uploaded Media, and historical explicit values remain
readable. Document categories and visitor filtering are removed. Inline ruled items keep a permanent
vertical divider and compact button actions at the far right at every width. One grid-wide
action-display setting switches boxed-family buttons between labelled and accessible icon-only
treatments. Each document owns an ordered `documentActions` list with at most two Download, View, or
Custom rows. Download and View are fixed-icon buttons; Custom Link stays textual in every layout;
Custom Button stays visibly labelled in every layout and may add the shared animated trailing arrow.
Only Custom Buttons expose Show Arrow. Duplicate Download/View rows are invalid, as are two Custom
rows with the same destination.
A non-empty `documentActions` list is authoritative even when every row is unusable. When it is empty,
the current hidden `customAction` is appended to available automatic actions; otherwise valid older
manual `actions` replace the automatic fallback; otherwise the hidden automatic fallback renders.
Historical visual-action settings remain ignored without a migration.

Every Page-compatible block receives one optional `anchorId` field from the central block catalog.
The schema accepts lowercase URL-safe IDs, reserves the site-owned `main-content` target, and rejects
direct duplicates within Pages, Reusable Sections, and the News & Events Detail Template. Production
and live-preview renderers wrap configured blocks with the same fragment target, including the
dynamic News & Events Content block. A shared document-order claim prevents nested or repeated
Reusable Sections from emitting duplicate DOM IDs. Root fragment navigation uses smooth scrolling
with sticky-shell clearance and an immediate reduced-motion fallback. Existing content needs no
migration.

News & Events Highlights retains the `newsEventsHighlights` block slug and renders an Event-only
priority stream: up to three manually featured published, non-expired Events followed by three
non-featured current or upcoming Events. It keeps the shared presentation model, overlay controls,
image-position precedence, bundled missing-image fallback, and synchronized carousel. Its optional
active Event-classification relationship strictly scopes results; an empty selection includes all
active Event classifications. Editors can place the status and previous/next controls above or below
the carousel; Bottom remains the default and legacy fallback.
News Grid retains its legacy mixed grid and optional editor-authored feature card. The separate News
& Events Tabs block provides Card Grid and Editorial List presentations under an editor-configurable
subset of News/Events/Notice/Holiday/Achievements/Announcement/Others classifications, with All fixed
first and 3, 6, 9, or 12 server-loaded entries per tab. Both presentations share the same automatic
collection data and incremental Load More state, which can reach the complete published directory.
Event tabs show current/upcoming Events earliest-first before past Events most-recent-first. Card Grid
retains its configurable 2–4 desktop
columns. Editorial List renders a full-row detail link with date, a badge-above-title group, excerpt,
and the shared animated arrow. The title and excerpt use equal-width tracks, the arrow receives a
wider trailing track, and one equal horizontal gutter separates the desktop columns. The date and
arrow center vertically while the badge/title and excerpt remain top-aligned before stacking without
horizontal scrolling on smaller screens.

SNMIH-Blue is the default and runtime fallback; it uses `#031d44` as its light-mode Primary brand color and a deep navy dark canvas with a lighter accessible Primary surface. SNMIH-Green uses the established institutional green accent as its Primary action color and adds restrained radii. Buttons, links, selected framed Tabs, active underline Tabs, and focus states inherit semantic Primary tokens in both modes.

## Public Routes

| Route                                                   | Behavior                                                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/`                                                     | Renders the published homepage selected in Layout Defaults                                                 |
| `/[...slug]`                                            | Renders hierarchical Pages, canonical metadata, breadcrumbs, and WebPage JSON-LD                           |
| `/privacy-policy`                                       | Migration-provisioned editable Page selected under Site Identity → Legal for footer and consent links      |
| `/terms-and-conditions`                                 | Migration-provisioned editable Page selected under Site Identity → Legal for footer links                  |
| `/articles/[slug]`                                      | Article detail, related content, metadata, and Article JSON-LD                                             |
| `/articles/category/[slug]`                             | Topic-filtered article archive                                                                             |
| `/articles/tag/[slug]`                                  | Tag-filtered article archive                                                                               |
| `/reviews/[slug]`                                       | Review detail, related reviews, metadata                                                                   |
| `/reviews/category/[slug]`                              | Topic-filtered review archive                                                                              |
| `/news-events`                                          | Published CMS Page composed from normal and collection-backed Page blocks                                  |
| `/news-events/[slug]`                                   | Global-templated NewsArticle/Event detail, Lexical article, right metadata/share rail, and structured data |
| `/search`                                               | SSR search, capped at eight results per content type                                                       |
| `/preview/page/[id]`                                    | Authenticated Page preview                                                                                 |
| `/articles/feed.xml`                                    | RSS 2.0 feed with Atom self-link; newest 50; one-hour cache                                                |
| `/news-events/feed.xml`                                 | RSS 2.0 feed with Atom self-link; newest 50; one-hour cache                                                |
| `/robots.txt`                                           | CMS-controlled robots response; one-hour revalidation                                                      |
| `/sitemap.xml`                                          | Paginated published content map; five-minute revalidation                                                  |
| root/article/review/news-event `opengraph-image` routes | Server-generated fallback/detail social images                                                             |

There is no built-in `/articles` or `/reviews` index route; create CMS Pages at those paths when the site needs archive landing pages. `/news-events` keeps an explicit route that resolves the published Page at that path so it can coexist with News & Events detail and feed routes. Generic Pages inherit configured metadata/default media rather than having their own dynamic Open Graph image route.

Maintenance and coming-soon overrides are applied to the homepage and catch-all CMS Page routes regardless of CMS authentication. Editors use `/preview/page/[id]` to inspect normal or draft Page content while a mode is active. Dedicated article, review, news-event, search, feed, and API routes remain reachable.

## APIs And Middleware

| Surface                                        | Contract                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/admin`                                       | Payload admin UI with dashboard and session bar integration                                                                  |
| `GET /api/frontend-session`                    | Private no-store email/role projection used by the deferred public editor toolbar                                            |
| `/api/[...slug]`                               | Payload REST API                                                                                                             |
| `/api/graphql` and `/api/graphql-playground`   | Payload GraphQL API and playground                                                                                           |
| `POST /api/forms/[slug]/submit`                | Published-form validation, honeypot, best-effort in-memory throttling, storage, email, events, and optional review promotion |
| `GET /api/search`                              | Debounced dialog search; six results/type; 20 requests/IP/10 seconds in memory                                               |
| `GET /api/review-feed`                         | Validated paginated published Review data for load-more behavior                                                             |
| `GET /api/calendar-events`                     | Validated published or authenticated-draft Calendar month projection for one to five Event classifications                   |
| `GET /api/redirects`                           | Cached enabled redirect map consumed by the request proxy                                                                    |
| `POST /api/operations/media/reconcile-storage` | Token-protected local/S3 media health reconciliation                                                                         |
| `/my-route`                                    | Public example custom route returning a static JSON message; replace or remove before client handoff                         |

The redirect proxy excludes Next.js internals, APIs, Admin, and common static/metadata routes. It keeps an in-process map per origin for 60 seconds and safely falls back to its previous map on API failure.

## Forms, Notifications, And Review Promotion

- Public submission only loads published Forms.
- The hidden honeypot key is `website`; suspected bots receive a neutral success response.
- The built-in limiter allows five attempts per IP and form slug per ten minutes. It is per process, in memory, and is not a durable distributed rate limiter.
- Required, email, phone, select-option, and checkbox-acceptance validation derive from the Form schema. Phone validation accepts common international display punctuation and requires 7 to 15 digits.
- Source, campaign, and landing-page metadata are captured when supplied.
- General/lead Forms can optionally expose a dedicated `phone` input in Contact Form, store searchable submitter phone metadata, notify internal recipients, and send a submitter confirmation. Internal and confirmation messages use one responsive branded shell; internal dates render in the Site Identity timezone. Contact email lookup prefers `submitterEmail`, then `reviewerEmail`, then `email`.
- Review-intent Forms can create or update a pending draft Review and record its relationship or promotion error. Form validation rejects additional required fields that the fixed Review Submission UI cannot render.
- Notification, confirmation, downstream-event, and promotion failures are logged without changing the visitor's successful submission response after storage succeeds.

## SEO, Search, Feeds, And Caching

- SEO fields support route title/description/image, canonical, robots, and sitemap decisions with publish-time validation.
- Layout emits Organization and WebSite/SearchAction structured data. SearchAction describes onsite search; Google retired its Sitelinks Search Box result in November 2024.
- Sitemap fetches all result pages in batches of 500 and includes published Pages, Articles, Reviews, News & Events, the News & Events index, used article/review topic routes, used article tag routes, and eligible topic/tag routes used by indexable published News & Events entries. It does not generate filter-combination or pagination URLs.
- `robots.txt` disallows Admin, API, and preview paths, or disallows the whole site when global robots is noindex.
- Layout globals, Page data, and fixed Calendar month projections use persistent Next cache tags; Calendar Upcoming revalidates every five minutes. Article/review helper `cache()` calls mainly deduplicate within a render. Sitemap/robots/feeds also use explicit time revalidation.
- The anonymous public shell remains cacheable because editor-session and analytics-consent cookies are evaluated only by post-hydration client boundaries.

## Media Governance

- Shared File Download actions and Download List route absolute Media URLs through
  `/api/media-download/[id]`. This public endpoint resolves a published Media record with access
  enforcement and streams the file with `Content-Disposition: attachment`. Sources are restricted
  to the configured `S3_PUBLIC_URL` or the configured site's Payload file endpoint; redirects are
  rejected. Responses are not cached, and upstream requests have a 60-second timeout. Relative local
  downloads and direct File View URLs retain their existing behavior.

- Images require alt text. Logo, Hero, and SEO asset types require image MIME types.
- Media detail views calculate references from governed collections and globals. Referenced assets cannot be deleted.
- Storage status is `unchecked`, `healthy`, `missing`, `check_failed`, or `local_only`.
- Reconciliation scans at most 1,000 Media records per call, verifies S3 objects with `HeadObject`, updates health fields, creates/clears queue conditions, and audits missing/restored transitions.
- Internal storage and usage fields are stripped before frontend data is passed to client components.
- With `S3_PUBLIC_URL=https://assets.snmih.tanish.im`, rendered media uses the encoded direct R2 origin; `/api/media/file/**` remains the deliberate fallback when no public origin is configured. Next image variants use a one-day minimum optimizer TTL.
- Site logos use positive intrinsic dimensions, display-width `sizes` hints for optimized raster variants, and one image when light and dark sources resolve to the same URL.

## Analytics And Consent

- GTM takes precedence over standalone GA4 when both are enabled.
- GTM, standalone GA4, and Vercel Speed Insights are not loaded until `analytics_consent=granted`.
- Vercel Speed Insights collects public-route Web Vitals only after analytics consent. Payload Admin is excluded.
- The configurable banner writes `granted` or `denied` for one year using `SameSite=Lax` and `Secure` on HTTPS.
- Consent changes are dispatched in the current page, so acceptance mounts integrations immediately without a route refresh and rejection keeps them absent.
- This implements analytics consent gating, not a complete legal-compliance or consent-management platform. Obtain jurisdiction-specific legal review.

## Developer And Operational Tooling

- `pnpm dev`, `devsafe`, `build`, and `start` run the Next.js application.
- Payload commands generate types/import maps or expose the Payload CLI.
- `pnpm generate:block-thumbnails` captures admin block-picker previews.
- `pnpm export:db` uses `mongodump` to create a compressed archive under `backups/`.
- `pnpm backup:prod-db` exports only the `prod` database to the private
  `snmih-prod-db-backups/prod-db-backup/` R2 destination. Its daily/manual GitHub workflow verifies
  each upload and keeps the newest 30 managed archives.
- `pnpm migrate:offices` migrates legacy office data.
- Vitest covers schema, hooks, helpers, route behavior, rendering, providers, and documentation vocabulary; Playwright covers core Admin and frontend journeys.
- GitHub Actions verifies project context, generated Payload types, TypeScript, lint, integration
  tests, and the production build. Mongo-backed tests use a single-node replica set. The supplied
  Dockerfile builds a non-root Next.js standalone production image; production containers require
  durable MongoDB and S3-compatible media storage.
