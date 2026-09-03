# Rating Spotlight Block Design

## Goal

Add a theme-native Payload page block named **Rating Spotlight** that presents an editorial feedback message, a live aggregate of published review ratings, and one call to action. Editors can switch the aggregate to a complete manual override without changing the presentation.

## Canonical Identity

- Payload slug: `ratingSpotlight`.
- Generated interface: `RatingSpotlightBlock`.
- Singular label: `Rating Spotlight`.
- Plural label: `Rating Spotlights`.

This is a new block. No legacy alias or migration is required.

## Visual Direction

Adapt the rating treatment from `@shadcnblocks/trust-strip4` to the supplied reference rather than installing the registry block unchanged.

The section uses the regular website container and normalized block spacing. On desktop, the content and rating occupy the left side while one action aligns to the right. On mobile, content, rating, and action stack vertically. Content alignment applies to the content and rating group; the action follows that alignment on mobile and occupies the opposite desktop column where appropriate.

The content order is:

1. optional eyebrow;
2. required title;
3. optional description;
4. optional rating summary;
5. optional action.

Use existing normalized content typography:

- eyebrow: `font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70`;
- title: `text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl`;
- description: `text-base leading-7 text-balance text-current/70`.

The rating row contains five Lucide stars, the average as one decimal followed by `/ 5`, a separator dot, and a locale-formatted review count with singular or plural copy. Stars use the semantic theme primary color rather than a raw brand color. The complete row has an accessible label such as `4.8 out of 5 from 1,240 reviews`; decorative stars are hidden from assistive technology.

Use the existing shared Button, ContentActions, appearance, action, spacing, and `cn` utilities. Do not install a duplicate star-rating or button component.

## Payload Configuration

Use the existing two-tab block pattern.

### Content

1. optional `eyebrow` text;
2. required `title` text;
3. optional `description` textarea;
4. zero or one shared action through `createContentActionsField({ label: 'Action', maxRows: 1 })`;
5. `ratingData` group with:
   - required `dataMode` select, default `live`, with Live and Manual Override options;
   - `manualRating` number, minimum `0`, maximum `5`, shown only when `dataMode` is `manual` and conditionally required through validation;
   - `manualReviewCount` number, minimum `0`, shown only when `dataMode` is `manual`, conditionally required through validation, and restricted to integers.

Manual mode is all-or-nothing. It never combines a live rating with a manual count or a manual rating with a live count.

### Layout & Theme

1. standard Appearance group through `createBlockAppearanceFields({ includeTextOverride: false })`;
2. shared action mode, defaulting to Link;
3. Content Alignment with Left, Center, and Right options, defaulting to Left;
4. Size with Compact, Default, and Comfortable options, defaulting to Default.

The deterministic thumbnail fixture uses Manual Override mode and Button action mode so generation never depends on database content.

## Live Data Architecture

Live mode aggregates only records in the `reviews` collection where `_status` equals `published`. It never reads raw `form-submissions`, draft reviews, scheduled reviews, rejected submissions, or in-review content.

Create a focused server utility that resolves the published rating summary. It obtains Payload once, then runs five `payload.count()` calls concurrently—one for each rating value from `1` through `5`—with the published constraint applied to every query. This avoids loading review bodies or other document data and scales independently of the number of reviews.

The result shape is:

```ts
type PublishedReviewRatingSummary = {
  average: number
  count: number
}
```

Calculate the total as the sum of the five counts. Calculate the weighted average as `(1*c1 + 2*c2 + 3*c3 + 4*c4 + 5*c5) / total`. Return `null` when the total is zero.

Wrap the zero-argument resolver with React `cache()` so multiple Rating Spotlight blocks in the same server render share one aggregate query. The frontend layout is already `force-dynamic`, so published changes appear on the next request without adding client-side fetching, effects, browser storage, or hydration branches.

Manual mode must not call the live resolver.

## Rendering Boundaries and Failure Behavior

Keep the presentation component synchronous, pure, and server-rendered. It accepts already resolved content, appearance, actions, and an optional rating summary.

The Payload block adapter selects between two paths:

- Manual Override validates and normalizes both manual fields, then immediately renders the pure presentation without a database query.
- Live renders a small async server child that resolves the published aggregate and passes it to the presentation.

This split keeps the deterministic thumbnail and manual rendering synchronous while isolating the async database work to Live mode.

If Live mode has no published reviews, omit the rating row while preserving the content and action. If a count query fails, the resolver records the error with `payload.logger.error()` and returns `null`, degrading to the same content-and-action presentation rather than failing the complete page. Manual mode renders the rating row when its normalized values are valid, including a review count of zero.

## Theme and Responsive Behavior

Resolve background, foreground, and border through the existing block appearance utilities. Use semantic tokens only; do not add raw light/dark colors or manual dark-mode overrides.

Use the shared regular block container and Compact/Default/Comfortable spacing scale. The desktop layout becomes two columns only when an action exists; without an action, the content group retains its readable maximum width and selected alignment. On mobile, the action is full width only when the shared Button component's existing responsive behavior requires it; Link mode remains intrinsic.

Stars, text, borders, action variants, focus states, radius, and hover behavior must inherit the selected site theme. No custom CSS is required.

## Registration and Thumbnail

Register Rating Spotlight in:

- the Pages layout block list;
- the page-block renderer;
- generated Payload types;
- block-thumbnail definitions;
- the deterministic real-render thumbnail fixture.

The thumbnail uses an average of `4.8`, a count of `1,240`, the reference content, and a Button action. It renders through the production presentation and must not access Payload or external data.

## Testing and Verification

Focused coverage verifies:

- canonical slug, interface, labels, tabs, field order, conditional manual fields, validation bounds, integer review count, defaults, and one-action limit;
- Live mode aggregates only published reviews using five parallel count queries and calculates weighted average and total correctly;
- zero published reviews returns no summary;
- Manual mode renders without calling the live resolver and uses both override values;
- live aggregation failure logs through `payload.logger.error()` and omits only the metric row;
- semantic appearance, normalized typography, alignment, responsive layout, action mode, size, star accessibility, singular/plural copy, decimal formatting, and locale count formatting;
- Pages and renderer registration;
- deterministic thumbnail definition and fixture coverage;
- no client component, effect, viewport branch, or client-side data request is introduced.

Run Payload type generation, focused Vitest tests, scoped Prettier and ESLint, block-thumbnail generation, thumbnail tests, browser responsive checks, and staged and unstaged diff checks. Do not stage or commit any files.

## Non-Goals

- Publishing or aggregating raw form submissions.
- Displaying individual reviews.
- Filtering the aggregate by category, subject, form, page, or date range.
- Adding client-side polling, charts, rating input, or animation.
- Storing a denormalized aggregate or adding review synchronization hooks.
- Supporting mixed live/manual metrics.
- Adding more than one action.
