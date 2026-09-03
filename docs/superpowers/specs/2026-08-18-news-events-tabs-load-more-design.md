# News & Events Tabs Load More Design

**Date:** 2026-08-18

**Status:** Approved

## Goal

Extend the collection-backed `News & Events Tabs` block so `Items Per Tab` controls the number of cards loaded in each batch instead of imposing a permanent result limit. When an active tab contains more eligible entries, visitors can load the next batch without navigation or a full-page refresh.

With the default batch size of six, a collection containing twelve matching entries initially shows six cards and one activation of `Load More` appends the remaining six.

This specification supersedes only the earlier decision that the tabbed block would not paginate or fetch from the browser. The existing block identity, configurable tabs, card presentation, responsive grid, theme contract, and collection eligibility rules remain unchanged.

## Approved Behavior

- The initial page for every configured tab is rendered on the server.
- `Items Per Tab` remains configurable with the existing supported values and becomes the page/batch size.
- A configurable `Load More Label` defaults to `Load More`.
- The button appears only when the active tab has another page or a failed request can be retried.
- Each activation fetches and appends one further batch for the active tab.
- Every tab retains its own loaded documents, page, terminal state, loading state, and error state while the current page remains mounted.
- Switching tabs does not discard already loaded items or trigger an automatic request.
- A full page refresh resets each tab to its server-rendered first batch.
- Appended entries are de-duplicated by stable public ID.
- The active tab, ARIA tab behavior, keyboard navigation, configured tab labels/order, card layout, and narrow-screen wrapping remain unchanged.

## Admin Configuration

Retain `itemsPerTab` in the block settings and revise its admin description to explain that it controls how many entries are initially displayed and appended by each `Load More` request.

Add an optional `loadMoreLabel` text field with:

- admin label: `Load More Label`;
- default value: `Load More`;
- normalized fallback: `Load More` when the saved value is null, missing, or whitespace-only.

No editor-authored entries, manual pagination controls, endpoint settings, or per-tab page-size overrides are introduced.

## Public Data Contract

Replace the array-only initial group contract with a page-aware public group contract. Each configured classification, including `all`, receives:

- `docs`: presentation-ready `PublicNewsEventCard` values;
- `page`: the resolved current page, initially `1`;
- `hasNextPage`: whether another page exists.

The browser receives only the existing public card fields and pagination metadata. Payload documents, access fields, draft metadata, and unrelated collection fields must not cross the client boundary.

The initial data loader should preserve bounded selections and relationship depth. The public card normalization remains the single mapping used by the initial server render and subsequent endpoint responses.

## Query and Ordering Rules

All queries retain the existing public eligibility contract:

- Payload `_status` equals `published`;
- editorial `workflowState` equals `published`;
- Event entries are current or upcoming according to the existing `eventEnd`/`eventStart` rules;
- non-event classifications sort by publication recency with a stable ID tie-breaker;
- Event entries sort by ascending event start with a stable ID tie-breaker.

Classification pages query the selected stored classification directly with Payload page and limit controls.

The `All` tab preserves its current deterministic mixed behavior: eligible non-event entries and current/upcoming Events are fetched in their established source order and interleaved consistently. Pagination must operate on that stable mixed sequence so page two is the continuation of page one, with no gaps or intentional repeats. The implementation may fetch a bounded prefix sufficient to construct the requested mixed page; it must not fetch the unbounded collection.

## Public Endpoint

Add a dedicated read-only endpoint for subsequent tab pages. It accepts:

- `classification`: `all` or one supported stored classification;
- `page`: a positive integer;
- `limit`: one supported block batch size.

The endpoint:

- uses the server's current time for Event eligibility;
- rejects unknown classifications, invalid page values, and unsupported limits with HTTP `400`;
- returns the same page-aware public DTO used by the initial server loader;
- returns HTTP `500` with a generic message when loading fails;
- performs no mutations and exposes no authenticated CMS data.

The endpoint is dynamic so its Event eligibility and pagination state are not frozen by a static route cache. Server helpers remain in `server-only` modules; shared DTOs, constants, and parsers required by the client or route boundary remain client-safe.

## Client State and Interaction

The client initializes a state record for every supplied group. Each record owns:

- loaded cards;
- current page;
- `hasNextPage`;
- pending state;
- recoverable error state.

Activating `Load More` requests `page + 1` for the active classification and configured batch size. A successful response appends unseen IDs, advances the page, adopts the returned `hasNextPage`, and clears the error. A failed response preserves all visible cards and marks that tab retryable.

The button is centered beneath the active card grid and uses the project's existing themed `Button` primitive:

- normal: configured label;
- pending: `Loading…` and disabled;
- failure: `Retry`;
- terminal: not rendered.

Focus remains on the initiating button while it exists. Loading and failure text must be understandable without color alone. The interaction must not cause horizontal page overflow or change the existing responsive grid geometry.

## Empty and Edge States

- An empty first page retains the existing bounded empty-state presentation and shows no load-more button.
- Exactly one full batch with `hasNextPage: false` shows no button.
- A short final page appends normally and then removes the button.
- A duplicate returned ID is ignored without preventing unique returned items from appearing.
- A failed page does not advance the stored page number.
- Each tab's failure and retry state is independent.
- If the configured active classification is unavailable, the existing fallback to `All` remains in effect.
- Live preview uses server-supplied initial page snapshots and does not import Payload or another server-only loader into its client graph. Later button requests use the same public endpoint as production.

## Compatibility

- Keep the existing block slug and registration.
- Existing saved blocks without `loadMoreLabel` resolve to `Load More`.
- Existing `itemsPerTab` values remain valid; only their behavior changes from a permanent cap to a batch size.
- No migration is required for News & Events documents or tab configuration.
- The prior Review Feed implementation is the behavioral precedent for pending, retry, de-duplication, and terminal button states, but News & Events requires independent state per classification and special mixed pagination for `All`.

## Testing and Verification

Focused schema and normalization tests verify:

- `Load More Label` placement, default, and whitespace fallback;
- the revised `Items Per Tab` batch-size description and existing allowed values;
- page-aware initial group normalization and compatibility fallbacks.

Focused data and endpoint tests verify:

- first and subsequent classification pages;
- stable mixed `All` ordering across page boundaries;
- accurate `hasNextPage` behavior for exact, short, and empty result sets;
- published/workflow filtering and expired Event exclusion;
- classification, page, and limit validation;
- public DTO selection and generic server failure responses.

Focused client tests verify:

- six initial cards followed by six appended cards for a twelve-entry result;
- button absence when no additional page exists;
- configurable label, pending, Retry, and terminal states;
- preserved cards after failure and successful retry;
- de-duplication by ID;
- independent progress and error state across tab switches;
- unchanged ARIA tabs, keyboard navigation, grid classes, and empty states.

Production renderer and live-preview tests verify that initial page metadata and the configured label cross their respective boundaries without adding a client import of any `server-only` module.

Completion checks include focused News & Events block, data, route, preview, and renderer tests; Payload type generation when the schema change requires it; TypeScript; targeted lint/format checks; and the required project-context update/check loop.

## Out of Scope

- Infinite scrolling or automatic loading on viewport intersection.
- URL-synchronized pagination or shareable tab-page URLs.
- Loading multiple pages in one request.
- A total-result counter or explicit page-number controls.
- Manual entry selection inside the collection-backed tabs block.
- Changes to the featured News & Events Highlights carousel or detail pages.
