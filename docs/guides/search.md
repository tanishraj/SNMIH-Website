# Site Search Guide

## What This Section Is

The website has a built-in full-text search that lets visitors find pages, articles, reviews, and news and events quickly. There is no configuration required in the CMS to enable search — it is always active.

## How Search Works For Visitors

Visitors can reach search in two ways:

**Keyboard shortcut** — pressing `Cmd+K` (Mac) or `Ctrl+K` (Windows and Linux) opens a search dialog anywhere on the website. The dialog shows instant results as the visitor types, with keyboard navigation using the arrow keys and Enter to open a result.

**Search page** — visiting `/search` directly, or clicking the search icon in the site header, opens a full search results page. Results are grouped and labelled by content type.

Both surfaces search across:
- public pages
- published articles
- published reviews
- published news and events

## What Search Finds

Search matches against:

| Content type | Fields searched |
|---|---|
| Pages | Title, meta description |
| Articles | Title, excerpt, author name |
| Reviews | Title, review title, reviewer name |
| News and Events | Title, excerpt, author name |

Search requires at least two characters before returning results.

The dialog returns at most six matches per content type and is protected by an in-memory limit of 20 requests per IP per ten seconds. The full Page returns at most eight matches per content type, so `View all results` means the broader results surface rather than an unbounded export.

Both views rank matches within each content type before applying those limits: exact title,
title starting with the query, title containing the query phrase, title containing all query words,
then matches found only in descriptions or other searchable fields. Ties use alphabetical title
order and then record ID. Ranking ignores capitalization and repeated whitespace. For example,
`Admission Enquiry` and `Admission Eligibility` appear above pages that only mention admission in
their descriptions. Admission Enquiry is not manually pinned; every query uses the same rules.

## Suggested Searches And Result Labels

`Search Settings` accepts up to six ordered suggested terms. The full Search page presents them as keyboard-focusable chips. Use each term only once; matching ignores capitalization and surrounding spaces. Older settings with additional or duplicate rows display only their first six unique, non-empty terms until an editor trims and republishes the global.

Full-page result labels use the active website theme with a content-type icon and visible text. News/Event results keep their configured classification label. Result types never depend on color alone, and changing the deployment theme automatically updates their presentation.

## How It Connects To The Website

The search dialog is embedded in the site layout and is available on every page without any configuration. The search icon appears automatically in the site header next to the navigation.

Search results link directly to the relevant content page. Clicking a result from the dialog or the search page takes the visitor straight to that article, news entry, or page.

Page results use their complete parent path, so a child Page such as `Admissions / Requirements` links to `/admissions/requirements`. If a Page's parent chain cannot be resolved, search omits that Page instead of returning a broken leaf-slug link.

Search is not indexed by Google because it is a dynamic query surface (`robots: noindex` is set on the `/search` page).

## Search Structured Data

The website emits `WebSite` structured data with a `SearchAction` describing `/search`. Google retired the Sitelinks Search Box visual result in November 2024, so this markup must not be treated as a promise that Google will show a search box. See [Google Search Central's announcement](https://developers.google.com/search/blog/2024/10/sitelinks-search-box).

## Step-By-Step Medical College Example

A prospective student wants to find all content about the admissions process:

1. They press `Cmd+K` from any page on the North Valley Medical College website.
2. They type `admissions`.
3. The dialog instantly shows matching pages, articles, and news entries.
4. They click the most relevant result.

The visitor found the content without needing to use the navigation.

## Best Practices

- keep article titles and excerpts clear and specific — these are the primary fields that search matches against
- use consistent terminology in titles and excerpts across related content so search returns a coherent result set
- publish an excerpt on every article and news entry because the search results display the excerpt as the result description

## Common Mistakes And Recovery

- search results appear empty for content that has not been published — draft content is not searchable
- search does not return results for media files, PDF downloads, or embedded content — it only searches the text fields listed above
- if a recently published page does not appear in search, wait a few seconds and try again — there is no indexing delay but the database query runs live

## Related Guides

- [Pages](./pages.md)
- [Articles](./articles.md)
