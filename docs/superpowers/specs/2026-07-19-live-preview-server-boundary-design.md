# Live Preview Server Boundary Design

## Problem

`PageLivePreview` is a Client Component, but it imports the normal page-block renderer. That renderer imports the Review Feed and Rating Spotlight server components, which import Payload configuration and `sharp`. Turbopack therefore attempts to bundle Node-only dependencies such as `child_process` for the browser and fails the build.

The public page renderer must continue loading current published review data on the server. The authenticated live preview must also display current published review data, but no Payload configuration, Payload Local API code, `sharp`, or other Node-only dependency may enter its client import graph.

## Goals

- Remove all server-only Payload imports from the live-preview browser bundle.
- Preserve the current public Review Feed and Rating Spotlight behavior.
- Show real published review data in authenticated page live preview.
- Support every unique Review Feed page size used by the previewed page.
- Keep Review Feed's existing client-side “Load more” behavior.
- Make future server/client boundary regressions easier to detect.

## Non-goals

- Changing the Review Feed or Rating Spotlight design.
- Changing review publication, moderation, or access rules.
- Replacing the existing Review Feed API route.
- Fetching draft review submissions for page preview.
- Editing individual reviews from a page block or live-preview surface.

## Architecture

### Server-only data modules

The modules that initialize Payload or import `@payload-config` remain server-only. They will explicitly import `server-only` so an accidental browser import fails at the module boundary with a useful error.

Client-safe types, constants, normalization functions, and rating calculations will live in shared modules that do not import Payload. Client components and preview adapters may import only these shared modules.

### Serializable preview snapshot

The authenticated preview page will inspect the draft page layout before rendering `PageLivePreview`. It will collect:

- every unique normalized `pageSize` required by Review Feed blocks;
- whether a published rating distribution is needed by Review Feed or a live-data Rating Spotlight block.

It will start all independent review queries together and pass a minimal serializable snapshot to the Client Component. The snapshot will contain Review Feed pages keyed by normalized page size and, when needed, the published rating distribution.

Only values required for rendering will cross the React Server Component boundary. Payload instances, configuration, query functions, and errors will not be serialized.

The snapshot is presentation-only. Page editors may configure block content and appearance, but individual reviews remain read-only on the page and are managed exclusively through the Payload Reviews collection. Rating Spotlight manual values remain editable only when its existing Manual data mode is selected; Live data mode always uses the read-only published snapshot.

### Separate renderers

The normal public page renderer remains a Server Component renderer and continues using the current server-backed Review Feed and Rating Spotlight components.

Live preview receives a client-safe renderer. It reuses existing client-safe block components and adapters, but handles Review Feed and Rating Spotlight through dedicated preview adapters that consume the supplied snapshot. The client-safe renderer must not import either server-backed component or any server-only data module.

## Component Behavior

### Review Feed preview adapter

The adapter normalizes the block's configured page size, looks up the matching initial page in the snapshot, and renders the existing Review Feed presentation. If the snapshot entry is unavailable, it renders the existing empty state. The existing browser-side “Load more” request continues to use `/api/review-feed` after the initial preview render.

### Rating Spotlight preview adapter

Manual-data mode continues to resolve its configured manual values without a server query. Live-data mode derives the displayed summary from the published rating distribution in the snapshot. If that distribution is unavailable, it renders the component's existing no-data state rather than importing Payload or starting a browser-side Payload query.

### Other blocks

All other blocks keep their current rendering behavior. The client-safe renderer will import only components already safe to use beneath `PageLivePreview`.

## Data Flow

1. The authenticated preview route loads the requested draft page with Payload on the server.
2. The route scans the page layout and determines the required Review Feed page sizes and rating-distribution need.
3. Independent published-review queries run in parallel.
4. Query results are converted to the serializable preview snapshot.
5. The route passes the draft page and snapshot to `PageLivePreview`.
6. `PageLivePreview` renders the draft layout through the client-safe renderer.
7. Review Feed and live Rating Spotlight preview adapters read only from the snapshot.

## Error Handling

Preview review-data queries are auxiliary to editing the page. A failed query must not make the whole preview route fail. Each failed Review Feed page query falls back to an empty page for that page size. A failed rating-distribution query falls back to `null`. Normal public page error behavior remains unchanged.

The fallback is deterministic between server render and hydration, preventing a second hydration mismatch while still allowing editors to preview the rest of the page.

## Performance

- Layout inspection happens synchronously before any review query.
- Duplicate page sizes are deduplicated.
- Independent page and distribution queries run in parallel.
- No review query runs when the layout does not need it.
- The snapshot contains only public review presentation data, not full Payload documents.

## Testing

Focused tests will verify:

- the live-preview renderer has no import path to `@payload-config`, Payload Local API initialization, or the server-backed review components;
- Review Feed preview selects the snapshot page for its normalized page size;
- multiple Review Feed blocks with different page sizes receive the correct data;
- Rating Spotlight manual mode remains independent of the snapshot;
- Rating Spotlight live mode renders the snapshot summary;
- missing or failed preview data produces deterministic empty/no-data output;
- the production build no longer attempts to resolve `child_process` in the client bundle.

## Acceptance Criteria

- `pnpm build` passes without the `child_process` browser-module error.
- Normal public pages still show current published Review Feed and Rating Spotlight data.
- Authenticated live preview shows current published data for both blocks.
- Review records cannot be edited through page blocks or live preview.
- Review Feed “Load more” remains functional.
- No existing staged changes are altered, and this work remains unstaged.
