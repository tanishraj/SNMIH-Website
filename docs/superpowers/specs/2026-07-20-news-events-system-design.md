# News & Events System Design

## Goal

Add a first-class News & Events editorial system to the Payload site. Editors can create news stories and scheduled events in one governed collection, feature current entries through a reusable page block, browse them through a dedicated server-rendered archive, and open a complete detail page for each entry.

The implementation must match the site's existing theme, typography, action, appearance, spacing, workflow, SEO, live-preview, and responsive conventions. Public lists are live collection data and are not manually editable inside page blocks.

## Product Contract

After this work:

- Payload contains one **News & Events** collection with explicit News and Event entry types;
- only published entries are public;
- event entries support start/end scheduling, location, and registration details;
- editors can add a **News & Events Highlights** block to normal pages;
- `/news-events` provides a filterable, server-paginated archive;
- `/news-events/[slug]` provides a complete News or Event detail page;
- past events remain accessible in the archive and at their detail URLs but do not appear in Highlights;
- archive presentation and SEO copy are managed through a **News & Events Settings** global;
- the archive and detail routes are route-owned and are not selectable page-builder blocks;
- categories, tags, editorial workflow, capabilities, audit behavior, media usage, and live preview follow existing project infrastructure.

## Names and Canonical Identities

Use these user-facing names:

- collection: **News & Events**;
- singular collection label: **News & Event Entry**;
- page-builder block: **News & Events Highlights**;
- archive presentation component: **News & Events Feed**;
- archive page title: **News & Events**;
- global: **News & Events Settings**;
- detail template: **News & Event Story**.

Use these canonical technical identities:

- collection slug: `news-events`;
- global slug: `news-events-settings`;
- highlights block slug: `newsEventsHighlights`;
- highlights generated interface: `NewsEventsHighlightsBlock`;
- archive route: `/news-events`;
- detail route: `/news-events/[slug]`.

This is a new feature. No backward-compatibility alias or data migration is required.

## Architecture Decision

### Selected: One Typed Collection

Use one `news-events` collection with a required `contentType` field whose values are:

- `news`;
- `event`.

This creates one clear editorial destination and one archive while retaining meaningful conditional event fields and query behavior.

### Rejected: Separate News and Events Collections

Separate collections make event validation straightforward, but duplicate workflow, access, SEO, category, media, archive, and detail infrastructure. They also make the unified archive and Highlights query more complex.

### Rejected: Extend Articles

The existing Articles collection is writing-first and does not represent event scheduling. Adding conditional event semantics there would blur its purpose and complicate existing article behavior.

## Shadcnblocks References

Use the registry implementations as layout references, then adapt them into the project's established block and route architecture.

### Archive: `@shadcnblocks/blog37`

This is the primary requested reference. Preserve its recognizable filtered blog-row structure:

- category/filter navigation;
- horizontal image-and-content rows;
- metadata and badges;
- clear Read More behavior;
- responsive stacked rows on small screens.

Replace its client-only in-memory filtering with URL-backed server filtering and pagination. The full collection must not be serialized to the browser.

### Highlights: `@shadcnblocks/blog13`

Use its heading plus View All action and compact three-card grid as the closest match for News & Events Highlights.

### Detail: `@shadcnblocks/blogpost2`

Use its editorial detail structure as a reference for metadata, featured media, rich content, and supporting navigation. Adapt typography and spacing to existing site conventions rather than importing an isolated visual system.

`blog39`, `blog41`, and `blog45` were considered but are not selected. The first is more feature-story oriented, the second adds unnecessary carousel behavior, and the third is too text-only for the requested archive.

Generated registry demos are reference material, not final runtime identities. Remove unused demo files after canonical components are implemented.

## News & Events Collection

### Admin Presentation

Place the collection alongside the site's existing editorial content collections. Use title as the admin display field and expose useful default columns:

- title;
- content type;
- workflow state;
- event start date where relevant;
- updated date.

Reuse existing preview, workflow status, and admin-description patterns.

### Content Fields

Organize collection fields into clear Content, Classification, Event Details, Presentation, and SEO areas.

Core fields:

1. `title`
   - required text;
2. `slug`
   - generated through the existing slug-field pattern;
   - required and unique;
3. `contentType`
   - required select;
   - News or Event;
4. `excerpt`
   - required textarea used by cards, archives, metadata fallbacks, and previews;
5. `featuredImage`
   - required relationship to Media;
6. `featuredImagePosition`
   - select with Center, Top, Bottom, Left, and Right;
   - default Center;
   - maps to stable `object-position` classes;
7. `authorName`
   - optional text;
8. `body`
   - required Lexical rich text;
   - primary long-form authoring surface;
9. existing editorial workflow fields;
10. existing reusable SEO fields.

### Classification

Reuse the shared Categories and Tags collections.

- `primaryCategory`: optional relationship to one Category;
- `categories`: optional relationship to multiple Categories;
- `tags`: optional relationship to multiple Tags.

Avoid creating News-specific duplicate taxonomy collections. Query and serialization helpers should deduplicate the primary category from supporting categories when necessary.

### Conditional Event Fields

Show and validate these fields when `contentType` is `event`:

- `eventStart`
  - required date/time;
- `eventEnd`
  - optional date/time;
- `eventLocation`
  - required text;
- `eventRegistrationAction`
  - optional shared link/action configuration, maximum one row.

Validation must reject an Event without a start date or location. When both dates are supplied, `eventEnd` cannot precede `eventStart`.

News entries do not require event fields. Switching an existing draft from Event to News should clear event-only values through a collection hook or explicitly ignore them in public serializers so stale scheduling data cannot leak into News output.

### Drafts and Editorial Workflow

Enable drafts and use the existing editorial workflow conventions. Public reads include only documents whose Payload status and workflow state satisfy the established published-content rules.

Add these capabilities:

- `manage_news_events`;
- `publish_news_events`.

Admins retain unconditional access. Non-admin management and publishing remain separate. Extend the existing capability UI, role defaults, work queue, audit behavior, and workflow guards rather than introducing a second authorization system.

Recommended role defaults should mirror Articles unless current project role conventions dictate a stricter mapping.

### Live Preview

Configure collection preview URLs at `/news-events/[slug]`. Draft live preview must work for unpublished entries without weakening public access controls.

## News & Events Highlights Block

### Responsibility

The block presents current live collection data. It does not store selected News/Event relationships and does not let a page editor modify entry content.

### Payload Configuration

Use the established two-tab page-block pattern.

#### Content Tab

1. optional `eyebrow` text;
2. required `title` text;
3. optional `description` textarea;
4. zero or one shared action through the existing Content Actions field;
5. `itemCount`
   - integer from 1 through 6;
   - default 3;
6. optional `emptyStateMessage`.

The action commonly links to `/news-events`, but use the shared action model so editors retain the same internal/external link behavior used elsewhere on the site.

#### Layout & Theme Tab

1. standard Appearance fields without a bespoke text-color implementation;
2. action mode:
   - Link by default;
   - Button as the alternative;
3. shared Button variant when Button mode is selected:
   - Primary;
   - Secondary;
   - Outline;
4. Size:
   - Compact;
   - Default;
   - Comfortable.

Do not add manual entry selection, per-card style controls, carousel controls, autoplay, or independent raw colors.

### Selection Algorithm

At render time:

1. query the newest published News entries by publication date descending;
2. query published current/upcoming Event entries whose effective end (`eventEnd ?? eventStart`) is at or after the current server time, ordered by `eventStart` nearest-first;
3. alternate News and Event entries until `itemCount` is reached;
4. when one type has insufficient results, backfill from the other type;
5. never include Events whose effective end is in the past;
6. never duplicate an entry.

The initial alternation should begin with the newest News item. If no News exists, begin with the nearest Event.

### Presentation

Adapt Blog 13 into the site's block conventions:

- optional eyebrow, title, description, and action above the cards;
- one column on mobile, two at medium widths when appropriate, and three at desktop;
- featured image with stable aspect ratio and configured object position;
- type/category, relevant date, title, excerpt, and Read More affordance;
- semantic background, foreground, muted foreground, border, and radius tokens;
- existing normalized regular-block typography;
- shared page container and block size spacing;
- shared Link and Button components and hover behavior.

The title is an `h2`; card titles use the appropriate nested heading level.

### Server and Live-Preview Boundary

The normal frontend block is server-backed. Query modules must begin with `import 'server-only'` and must never be imported by Client Components.

Authenticated page live preview follows the existing Review Feed snapshot architecture:

1. the preview route queries a serializable News/Event snapshot on the server;
2. it passes that snapshot to the client-safe Page Live Preview tree;
3. the Highlights preview adapter renders the snapshot without importing Payload configuration or server-only query modules.

This boundary prevents Node dependencies such as `sharp`, `detect-libc`, and `child_process` from entering browser bundles.

## News & Events Settings Global

Create a configurable global with Content, Layout & Theme, and SEO tabs.

### Content Tab

- optional eyebrow;
- archive title, defaulting to `News & Events`;
- optional archive description;
- filter labels for All, News, Events, Upcoming Events, and Past Events;
- Read More label;
- empty-state title and description;
- entries per page, constrained to a reasonable range and defaulting to 9.

### Layout & Theme Tab

- the standard global/page appearance controls supported by route-owned sections;
- Compact, Default, and Comfortable spacing;
- no raw color inputs;
- no archive-only radius system.

### SEO Tab

Reuse existing SEO field helpers for archive title, description, image, indexing controls, and social metadata.

## Archive Route

### Route Ownership

`/news-events` is a dedicated server-rendered route. It is not a Page document and the News & Events Feed is not registered in the Pages block selector.

The route reads presentation and SEO content from News & Events Settings and collection data from server-only query modules.

### URL Filters

Use URL query parameters so filtering and pagination are linkable, refresh-safe, crawlable, and compatible with server rendering.

Supported parameters:

- `type=all|news|event`;
- `category=<category-slug>`;
- `page=<positive-integer>` for All and News feeds;
- `upcomingPage=<positive-integer>` and `pastPage=<positive-integer>` for the two Event sections.

Unknown filter values fall back safely to defaults. Page values below one, non-integers, and excessive values are normalized or routed to the final valid page without throwing.

### Sorting

- All: published News and Event entries ordered by effective publication date descending;
- News: publication date descending;
- Events: two explicit sections:
  - Upcoming Events includes ongoing and future Events whose effective end (`eventEnd ?? eventStart`) is not in the past, ordered by `eventStart` ascending;
  - Past Events includes Events whose effective end is in the past, ordered by `eventStart` descending.

The two Event sections paginate independently. This preserves correct temporal ordering without loading the full event collection or performing an unbounded merge in application memory.

### Presentation

Adapt Blog 37 while retaining server ownership:

- responsive filter/category navigation;
- active filters represented by semantic links or Buttons rendered as links;
- horizontal media/content rows at larger breakpoints;
- stacked image-above-content rows on narrow screens;
- Badge, Button, Card, Separator, and Pagination primitives where they materially match the registry design;
- no client-side copy of the complete collection;
- no horizontal overflow on iPhone Safari or Chrome;
- stable image aspect ratios and explicit width constraints.

The archive occupies the complete site container width. Empty feeds use the configured empty-state copy and retain the archive heading and filters.

### Pagination

Pagination is performed through Payload server queries. Render previous/next and page links with the current type/category filters preserved. Do not implement infinite scroll in this pass.

## Detail Route

### Lookup and Access

`/news-events/[slug]` queries one public, published entry by slug. Unknown, draft, or unauthorized entries return the standard not-found result.

Draft preview uses the authenticated preview path and must not make draft content public.

### News Presentation

Render:

- breadcrumb/back-to-archive navigation;
- content type and primary category;
- title;
- publication date and optional byline;
- excerpt where appropriate;
- featured image with configured position;
- Lexical rich-text body;
- supporting categories and tags.

### Event Presentation

Render the same editorial structure plus:

- start date/time;
- optional end date/time;
- location;
- optional registration action using the shared action and Button behavior;
- a clear past-event state when the event has ended.

Do not hide a published detail page merely because its event date has passed.

### Theme and Responsiveness

Use the Blogpost 2 structure as a reference while respecting existing site typography, maximum reading width, background, border, action, and spacing conventions. Detail titles may use the larger editorial heading scale; ordinary block headings remain on the normalized content-block scale.

Avoid browser-dependent viewport height assumptions. Media should use stable aspect ratios and responsive `sizes`, and the page must not rely on client measurements for its initial HTML.

## Query and Serialization Layer

Create server-only query modules that return narrow, serializable view models rather than Payload documents.

Recommended responsibilities:

- `getNewsEventsHighlights`;
- `getNewsEventsArchive`;
- `getUpcomingEventsPage`;
- `getPastEventsPage`;
- `getNewsEventBySlug`;
- `getNewsEventsSettings`;
- public serializers for cards and detail pages.

Use field selection and relationship depth deliberately. Resolve only media, category, tag, and action data required by the consumer. Avoid leaking private workflow, authoring, or audit fields.

Cache repeated request-safe reads with the project's existing server caching pattern. Time-dependent upcoming-event queries must use an explicit server timestamp per request/revalidation boundary; do not call `Date.now()` inside Client Component render paths.

## Error and Empty-State Behavior

- a missing detail entry uses `notFound()`;
- an empty Highlights query renders configured empty-state copy only when supplied, otherwise the block may omit the empty card region while preserving configured heading content;
- an empty archive retains its heading, filters, and configured empty-state message;
- query failures should be logged through existing server conventions and produce a stable, non-sensitive fallback;
- malformed related media or taxonomy records are omitted safely rather than crashing the entire page;
- client hydration must not depend on locale-formatted server/client differences.

Dates should be formatted on the server from an explicit locale/time-zone policy or passed as deterministic ISO values to a shared formatter whose output is stable between server and client.

## SEO and Discovery

### Metadata

- archive metadata comes from News & Events Settings;
- detail metadata comes from each entry's SEO fields with title, excerpt, and featured image fallbacks;
- canonical URLs use `/news-events` and `/news-events/[slug]`;
- archive filter and pagination URLs follow the project's indexing policy and avoid accidental duplicate canonicals.

### Structured Data

- News detail pages emit `NewsArticle` JSON-LD;
- Event detail pages emit `Event` JSON-LD with start/end, location, image, description, URL, and event status where available;
- structured data contains only published public values.

### Sitemap

Extend the sitemap with:

- `/news-events`;
- every published, indexable News/Event detail URL.

Draft, archived/unpublished, and explicitly no-index entries are excluded. Past published Events remain eligible unless individually marked no-index.

## Registration and Generated Types

Register the new feature in all required project surfaces:

- `news-events` in `payload.config.ts`;
- `news-events-settings` in the global list;
- News & Events Highlights in the Pages layout block list;
- Highlights in the page-block renderer;
- Highlights live-preview snapshot/adapter mapping;
- admin capabilities and role UI;
- workflow, work queue, audit, and media-usage mappings;
- sitemap and route metadata;
- deterministic block-thumbnail definition and fixture if all selectable page blocks require thumbnails;
- generated Payload types.

Do not register News & Events Feed or News & Event Story as selectable Page blocks.

## Accessibility

- use one page `h1` on archive and detail routes;
- preserve logical nested heading order in cards;
- provide meaningful image alt text from Media records;
- category, type, pagination, Read More, and registration controls must be keyboard reachable;
- active filters expose their current state semantically;
- links and buttons retain shared focus-visible behavior;
- do not communicate Event status through color alone;
- dates use semantic `time` elements with machine-readable `dateTime` values.

## Performance

- prefer Server Components for archive, detail, and normal Highlights rendering;
- keep client boundaries limited to existing live-preview requirements and genuinely interactive primitives;
- do not import `payload.config.ts`, Payload Local API helpers, or Node-only modules from client-reachable files;
- query only the fields and page sizes required;
- parallelize independent settings, taxonomy, and entry reads where safe;
- use responsive image `sizes` and existing media optimization;
- avoid request waterfalls between archive settings and feed queries;
- do not load all entries to filter or paginate in the browser.

## Testing and Verification

Add focused coverage for:

### Collection and Access

- collection slug, labels, field organization, conditional Event fields, date validation, and SEO/workflow composition;
- admins retain access;
- manage and publish capabilities remain distinct;
- public queries exclude drafts and non-published workflow states.

### Query Behavior

- News newest-first sorting;
- current/upcoming Events nearest-first using the effective-end boundary;
- past Events newest-first;
- expired Events excluded from Highlights;
- Highlights alternation, shortage backfill, item limit, and deduplication;
- category and type filters;
- All/News pagination;
- independent upcoming/past Event pagination;
- minimal serializable return objects.

### Rendering

- Highlights heading/action/card output and empty behavior;
- archive filter links retain existing query parameters correctly;
- responsive rows use bounded widths and stable image aspect ratios;
- detail pages render News and Event-specific metadata correctly;
- registration action is optional;
- shared theme, appearance, radius, action, link, and spacing primitives are used;
- no raw color or isolated font system is introduced.

### Server/Client Safety

- query modules are server-only;
- Page Live Preview receives a serializable snapshot;
- no client-reachable module imports Payload config, `sharp`, or Node built-ins;
- server and client initial markup do not use random, locale-dependent, or browser-only branches.

### SEO

- archive and detail metadata fallbacks;
- NewsArticle and Event JSON-LD;
- sitemap inclusion/exclusion rules;
- not-found behavior for missing and unpublished slugs.

Run Payload type generation, focused Vitest tests, Prettier, ESLint, the block-thumbnail generator when applicable, production build/type checks supported by the repository, and `git diff --check`. Keep all changes unstaged and uncommitted unless the user explicitly requests otherwise.

## Non-Goals

- Separate News and Events collections.
- Manual News/Event selection inside Highlights.
- Editable live entry content inside Page blocks.
- Infinite scrolling.
- Client-side loading or filtering of the complete archive.
- Event ticket inventory, payment, attendance, or calendar synchronization.
- Recurring-event rules.
- Related-entry recommendations on detail pages.
- Per-card raw colors, typography, radius, or layout controls.
- Replacing shared Categories, Tags, Media, actions, Buttons, appearance, workflow, or SEO infrastructure.
