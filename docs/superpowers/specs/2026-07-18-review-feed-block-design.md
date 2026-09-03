# Review Feed Block Design

## Objective

Add a reusable Payload page block based on `@shadcnblocks/reviews5` that presents a live, paginated feed of public reviews. Only published Review documents may contribute to the summary or appear in the feed.

## Naming

- Display name: **Review Feed**
- Payload block slug: `reviewFeed`
- Generated interface name: `ReviewFeedBlock`

## Upstream Design Adaptation

The implementation will preserve the useful structure and visual character of Shadcn Blocks `reviews5`:

1. Configurable header content.
2. Overall average rating with stars.
3. Five rating-distribution bars.
4. A separator.
5. A vertically separated review list.
6. A Load More Reviews action.

The following upstream elements are intentionally excluded:

- The review-count and sort-controls row.
- All sorting controls and client-side sorting state.
- Helpful-vote text and helpful-count sorting.
- External placeholder avatars and sample review data.

## Payload Configuration

The block uses the same two-tab organization as the existing page blocks.

### Content

- `eyebrow`: optional text.
- `title`: required text.
- `description`: optional textarea.
- `pageSize`: required number, default `4`, integer range `1` through `12`.
- `loadMoreLabel`: optional text, default `Load More Reviews`.
- `emptyStateMessage`: optional text, default `No published reviews yet.`.

### Layout & Theme

- Shared block appearance fields, without a manual text-color override.
- `size`: required select with `compact`, `default`, and `comfortable`; default `default`.

The block uses the shared website container and shared regular-block vertical spacing. Its internal review content is centered and constrained to the upstream readable width of `max-w-3xl`.

## Review Card Mapping

Every public review card is derived from a published Review document and contains only public-safe values:

- `id`: stable document identifier used for rendering and pagination.
- `rating`: normalized numeric rating from 1 through 5.
- `title`: `reviewTitle` with `title` as a defensive fallback.
- `content`: `reviewBody`.
- `authorName`: resolved with the existing public display-name helper, preferring `displayName` and applying the safe fallback behavior already used by review pages.
- `date`: `publishedAt`, falling back to `updatedAt` only when required.
- `verified`: derived from `isGenuineExperience`.

The Avatar uses initials only because the Review collection has no reviewer-avatar field. The verified indicator is labelled as a verified experience. Private fields—including reviewer email, raw source submission, moderation notes, workflow metadata, and internal relationship data—are never included in the browser DTO.

## Published-Only Data Contract

All list and count operations explicitly filter on:

```ts
{
  _status: {
    equals: 'published'
  }
}
```

The public feed does not rely on default access behavior to exclude drafts. The filter is present in every server query, including the initial server render, pagination endpoint, total count, and five rating-bucket counts.

## Summary Data

The summary always represents all published reviews, independent of pagination.

- Five rating buckets are counted in parallel.
- Total published reviews is the sum of the buckets.
- Average rating is the weighted bucket total divided by the total review count.
- Distribution percentages are derived from the same bucket counts.
- When the total is zero, the summary is omitted and the empty state is displayed.

The existing published-rating summary utility will be extended to expose bucket counts while retaining its current Rating Spotlight contract. Shared calculation logic will prevent duplicate database work within one server render.

## Pagination Architecture

### Initial render

The block remains server-first. It starts the first-page query and summary query together and awaits them in parallel. The first page is rendered into the HTML for fast content display and search visibility.

### Load More endpoint

The dedicated read-only endpoint at `/api/review-feed` accepts validated `page` and `limit` query parameters.

- `page` must be a positive integer.
- `limit` must be an integer from 1 through 12.
- Invalid values return HTTP 400.
- The endpoint always applies the published-only filter.
- The endpoint returns public DTOs plus pagination metadata: `page`, `hasNextPage`, and `totalPages`.
- Database failures are logged server-side and return a generic HTTP 500 response.

Reviews use a stable newest-first order with `sort: ['-publishedAt', '-id']`. Returned items are also de-duplicated by ID in the client before being appended, protecting the visible feed if the published dataset changes between requests.

### Client boundary

Only the incremental feed controller is a client component. It owns:

- Already rendered and appended public review DTOs.
- Current page number.
- Pending state.
- Load More and retry interaction.
- De-duplication of appended IDs.

It does not own the summary, theme, block header, or initial data query. The Load More button disappears when `hasNextPage` is false.

## Empty and Failure States

- With zero published reviews, retain the configured header and show the themed empty-state message.
- If the initial server query fails, log the error and show the same safe empty state rather than breaking the page.
- If an incremental request fails, retain all existing reviews and replace the pending state with a retry affordance.
- Endpoint error details and database messages are never sent to the browser.

## Presentation and Theme Behavior

- Use semantic tokens such as `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, and `text-primary`.
- Use the shared block appearance resolver and shared vertical/container spacing.
- Use the project's shadcn Button, Avatar, Progress, and Separator implementations.
- Use the project radius and button variants without local color overrides.
- Preserve the upstream compact rating distribution and vertically separated review list.
- On narrow screens, author/date and rating/title rows may wrap without horizontal overflow.
- Dates use deterministic server formatting so server and browser output cannot diverge during hydration.
- Star output includes an accessible text alternative while decorative stars remain hidden from assistive technology.

## Registration and Thumbnail

Implementation includes:

- Page collection block registration.
- Page block renderer registration.
- Payload type regeneration.
- A deterministic manual fixture for thumbnail rendering.
- A `1600 × 900` JPEG thumbnail and matching manifest definition.

The thumbnail uses static fixture review data. Runtime pages always use live published Review data.

## Performance

- Use React `cache()` for request-level server deduplication.
- Start independent summary and first-page operations together.
- Fetch and serialize only fields required by the public DTO.
- Keep pagination interactivity in one small client component.
- Avoid loading all reviews into the browser.
- Do not introduce client-side sorting or a second review data store.

## Verification

Automated coverage will verify:

1. Block fields, defaults, validation, and two-tab organization.
2. Published-only filters on every list and count query.
3. Weighted average and five-bucket distribution calculations.
4. Public DTOs never expose private Review fields.
5. Page and limit validation.
6. Initial rendering, empty state, Load More, retry, de-duplication, and terminal pagination behavior.
7. Absence of the upstream sort/count row and helpful-vote UI.
8. Page registration, renderer registration, generated types, fixture coverage, and thumbnail dimensions.
9. Chromium and WebKit behavior at mobile and desktop widths, including overflow and hydration-console checks.

## Out of Scope

- Helpful voting.
- User-controlled sorting.
- Reviewer avatar uploads.
- Manual review selection or manual review-data overrides.
- Draft previews inside the public feed.
- Changing Form Submission or Review moderation workflows.
