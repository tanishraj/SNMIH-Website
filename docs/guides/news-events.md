# News & Events Guide

## What This Section Is

`News & Events` is the governed collection for public updates and dated events. Every entry belongs
to exactly one `Entry Classification`: News, Events, Notice, Holiday, Achievements, Announcement, or
Others. Editors compose the public index as a normal Page, while the collection continues to own
individual detail pages and event-only fields appear only when the classification is `Events`.

Event classifications also own a semantic `Calendar Color`. The color is shared by every Calendar
and Annual Calendar block and remains readable across the active website theme; editors do not choose a separate color
on each Page.

Manage classification records under `News & Events > Classifications`. Every entry selects one
active classification through `Entry Classification` in its Content tab. Archive a classification
to stop new selections while preserving existing entries. Deleting remains available only when the
classification is unused; if a reference exists, the deletion message identifies the first News &
Events entry, Page, Reusable Section, Calendar/Annual Calendar/Tabs block container, or Detail Page Template that
must be updated before retrying.

## When To Use It

Choose the classification that matches the entry's single public tab. Use `Events` only for a
scheduled activity with a start time and location. Use `Articles` for evergreen long-form editorial
content that belongs in article topic and tag archives.

## Required Content And Validation

Every entry requires a title, slug, excerpt, rich-text body, featured image, image position, and SEO-safe publication state. An Event additionally requires:

- `Event Start`
- `Event Location`
- an optional `Event End` that cannot be earlier than the start
- an optional `All-day Event` setting that omits time and treats the end date as inclusive
- an optional registration action

The primary topic is automatically included in additional topics. Tags are optional. Only entries whose Payload status is published are exposed publicly.

## How It Connects To The Website

- Create and publish a root Page with the slug `news-events` to own `/news-events`.
- Compose that Page with normal Page blocks. Use `News & Events Highlights` for the featured carousel and `News & Events Tabs` for the classified text-only listing.
- Listing cards remain collection-driven and link to `/news-events/[slug]` detail pages.
- Configure the shared detail layout in `News & Events > Detail Page Template`. It uses the
  same ordered blocks as Pages plus one global-only `News & Events Content` block. Add and arrange
  Page Header, Breadcrumb, and other standard blocks around that dynamic block; drafts may be
  incomplete, but publishing requires exactly one `News & Events Content` block.
- `News & Events Content` automatically binds the current entry. Its main column renders the
  featured image first, places the entry classification and title in a bottom-left image overlay,
  then renders the excerpt and the Lexical body. Its Theme Settings control section appearance,
  spacing, featured-image ratio, sidebar surface/outline, and the shared Overlay Tone, Strength,
  Direction, and Coverage. Missing settings fall back to Dark, Darker, Bottom to Top, and Full;
  missing media uses the bundled SNMIH default image.
- Story Details and the optional Share This card remain in a right-hand sticky sidebar on large
  screens and follow the main article on smaller screens. The shared author defaults to
  `Management, SNMIH` and is configured inside `News & Events Content`. Story Details uses the
  theme mono family for metadata labels and values, with tabular numerals for dates. Card headings
  and Share actions retain their established display and text families.
- The Lexical body shares the same theme-aware long-form typography as Article details and Rich Text
  Page blocks. Q&A Accordion answers use a matching compact preset instead of article-scale spacing.
- Topics and Tags remain editorial metadata; News & Events does not publish taxonomy archive routes.
- `/news-events/[slug]` renders the saved global block order and injects the current record only into
  `News & Events Content`. Event structured data is included when applicable. Non-event entries
  expose the configured shared author as an Organization in NewsArticle structured data.
- `/news-events/feed.xml` publishes the feed.
- `News & Events Highlights` is an Event-only Featured Carousel. It shows up to three published,
  non-expired Events checked **Featured in Highlights**, followed by the next three published,
  non-featured current or upcoming Events. Events are de-duplicated and ordered by their start date
  within each group. Editors can limit it to selected active Event classifications under Content;
  leaving the selection empty includes all active Event classifications. Autoplay and Empty State
  Message live under Theme Settings. Entries without a usable featured image display the bundled
  SNMIH default image.
- `News Grid` retains its established mixed grid. Editors choose a total of 1–6 cards and 2, 3, or 4
  desktop columns; mobile stays one column and tablet stays two. An optional editor-authored feature
  card occupies the final configured slot rather than adding another card beyond the selected total.
  Entries are ordered by most recently updated, with creation time as the fallback.
- `News & Events Tabs` is the separate text-only directory block. `All` is always first; editors
  can add, remove, rename, and reorder the News, Events, Notice, Holiday, Achievements,
  Announcement, and Others tabs, with each classification used at most once. The block loads 3, 6,
  9, or 12 entries per tab and Load More makes every published entry available. Story-based tabs use
  newest-published order. Event-based tabs show current and upcoming Events earliest-first, followed
  by past Events most-recent-first. The block supports 2–4 desktop columns and retains the shared
  section appearance, optional header, header actions, footer actions, spacing, action labels, and
  empty-state controls.
- `Calendar` reads one to five selected active classifications whose behavior is Event. Desktop
  visitors start with a Sunday-first six-week month grid and can switch to Timeline; phones receive
  the Timeline-first presentation without a view toggle. A day shows at most two event tiles before
  an accessible `+N more` control moves focus into the Timeline. Multi-day and all-day ranges are
  inclusive, filtering changes only the main view, and the next four Upcoming events remain stable
  across month, filter, and view changes. Every row or tile links to the existing detail page.
- `Annual Calendar` is the collection-backed twelve-month overview. It defaults to January through
  December for the current configured site-timezone year. Editors may instead select a start month
  and year plus an end month and year; the inclusive range must contain exactly 12 consecutive
  months, such as July 2026 through June 2027. The ledger derives a `Calendar year 2026` or
  `Academic year 2026–2027` summary and shows the total number of events. It keeps empty months
  visible with vertically centered copy and places the same next four Coming Next semantics in a
  sticky panel beside the ledger on desktop and below it on mobile. Coming Next is independent of
  the selected ledger period. The block has no visitor year, month, view, filter, or pagination
  controls. It supports the shared section appearance, actions, alignment, spacing, light mode, and
  dark mode, and requires one to five active
  Event classifications. No content migration is required.
- Site Identity → Regional owns the deployment timezone. It defaults and safely falls back to
  `Asia/Kolkata`; News & Events labels, Calendar grouping, month boundaries, and “today” all use it
  instead of the visitor's browser timezone.
- The root Page owns index copy, layout, appearance, actions, and SEO through the standard Page fields and selected blocks.
- Live preview is available at desktop, tablet, and mobile breakpoints.

Past events remain available at their detail URL, in RSS history, and through News & Events Tabs.
Highlights and News Grid select only current or upcoming Events.

The sitemap includes the published `/news-events` Page through the normal Page rules and includes eligible News & Events detail URLs. It does not generate News & Events taxonomy, filter, or pagination URLs.

## Step-By-Step Medical College Example

1. Open `News & Events` in the `News & Events` Admin group.
2. Create `White Coat Ceremony 2026` and set `Entry Classification` to `Events`.
3. In `Content`, write the card excerpt, choose the featured image and image position, add optional Topics & Tags, and complete the body.
4. In `Event Details`, set the start, optional inclusive end, all-day state, venue, and registration
   action. Check **Featured in Highlights** to place an eligible Event in the manual featured group.
   A timed featured Event requires an end; an all-day Event remains eligible through its inclusive
   final local calendar day, using the site timezone.
5. Complete the SEO fields and use live preview at all three breakpoints.
6. Resolve any blocking `Action Queue` item, then publish the entry.
7. Verify the detail page, feed, and the Highlights or Tabs block that should feature it on the manually composed Page.
8. When changing the shared detail presentation, open `News & Events > Detail Page Template`,
   arrange the standard Page blocks, and configure the single `News & Events Content` block before
   publishing the global.

## Best Practices

- keep the excerpt useful as standalone archive and feed copy
- update the shared author in the `News & Events Content` block under `Detail Page Template`;
  the legacy per-entry Byline remains stored but is hidden and is not rendered publicly
- close event registration by editing its action instead of deleting the event history
- configure the deployment timezone once under Site Identity → Regional and verify all-day and timed labels
- expect visitor-facing times such as `1:30 AM`; timezone conversion still uses Site Identity but
  technical `GMT`/`UTC` suffixes are intentionally omitted
- archive classifications that should no longer be selected; remove or replace every reported News &
  Events entry, Calendar, Annual Calendar, Highlights, or Tabs reference before permanently deleting an unused
  classification
- leave Robots at `Default` to inherit the global SEO & Metadata crawler policy; choose `Index` or `No index` only for an intentional entry-level override
- use a draft when an entry is not ready to publish

## Common Mistakes And Recovery

- selecting News for an item that needs event dates and Event JSON-LD
- setting an end time before the start time
- overlooking an open or blocked approval/publish-issue queue item
- expecting past events to remain in the Highlights block

If an entry is missing publicly, check its publication status, slug, and whether an open or blocked approval/publish-issue item remains in `Action Queue`. If `/news-events` itself is missing, confirm the root Page is published with the exact slug `news-events`.

## Related Guides

- [Pages](./pages.md)
- [Topics](./categories.md)
- [Tags](./tags.md)
- [Media](./media.md)
- [Action Queue](./work-queue.md)
- [Page Blocks](./blocks.md)
