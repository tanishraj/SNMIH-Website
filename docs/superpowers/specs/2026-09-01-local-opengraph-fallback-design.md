# Local Open Graph Fallback Design

## Goal

Keep generated Open Graph images page-specific when their normal dependencies are available, while
returning the supplied SNMIH preview image when a required record or the remote R2 logo is missing
or unreachable.

## Current Behavior

The root, Article, Review, and News & Events Open Graph routes generate `1200x630` PNG responses.
Their normal templates load the Site Settings logo from the configured public media origin. The
shared media resolver now requires an absolute URL and positive Payload width and height metadata,
which prevents AVIF dimension inference from failing the build.

The renderer still fetches that remote logo internally. An invalid or incomplete media record can
fall back to text, but a DNS, timeout, or HTTP failure is not observable before `ImageResponse`
starts rendering. Detail routes also generate generic cards when their requested published record
does not exist.

## Decision

Store the user-supplied `SNMIH-Preview-og-image.png` as a code-owned local asset. Add a focused
server-only Open Graph helper that:

1. reads and memoizes the local PNG from the filesystem;
2. creates a full-card `ImageResponse` at the existing `1200x630` output size;
3. renders the preview without text or other overlays, using `object-fit: cover`; and
4. resolves a validated remote logo into bytes with a three-second request timeout so transport
   failures are observable before rendering.

The attached preview keeps its original content. It is fitted into the standard Open Graph canvas,
so a small amount of vertical edge content may be cropped when its aspect ratio differs from
`1200x630`.

All four generated Open Graph routes retain their current dynamic design on the success path. They
return the local full-card fallback when:

- the Site Settings logo is not a populated media document;
- the logo URL is not absolute;
- its width or height is missing, zero, or negative;
- fetching the remote logo times out, fails, returns a non-success HTTP status, or returns a
  non-image content type; or
- a detail route cannot find its requested published Article, Review, or News/Event record.

The root route has no content-record condition; its fallback is determined by logo availability.

## Data Flow

1. The route loads its existing Payload data.
2. `getOpenGraphMediaImage` validates the populated logo URL and intrinsic dimensions.
3. The new helper fetches the logo with a bounded timeout and returns its bytes plus the validated
   dimensions.
4. When both the content record and remote logo are available, the route renders its existing
   dynamic card and passes the fetched logo bytes with explicit dimensions to `ImageResponse`.
5. Otherwise, the route reads the memoized local preview and returns the standard-size fallback
   response.

Fetching the remote logo explicitly replaces the renderer's implicit request; it does not add a
second logo download. Generated metadata routes retain Next.js's normal caching behavior.

## Error Handling

Remote transport errors are expected fallback conditions and do not fail the route or production
build. The remote request uses a short timeout so unavailable DNS or storage cannot hold up image
generation indefinitely.

The local fallback is a required code asset. A missing or unreadable local file is treated as a
deployment error rather than silently producing another incomplete fallback. Tests and the
production build verify that it is packaged correctly.

## File Placement and Ownership

- Store the supplied source image at
  `src/assets/open-graph/SNMIH-Preview-og-image.png`.
- Keep remote media shape validation in `src/lib/media.ts`.
- Add the local-read, bounded-fetch, and fallback-response behavior in a focused server-only helper
  under `src/lib`.
- Update the root, Article, Review, and News & Events Open Graph routes to consume the shared helper.

No Payload schema, generated type, database record, R2 setting, environment variable, or public
page-rendering component changes.

## Testing

Focused tests will cover:

- successful remote logo resolution with explicit intrinsic dimensions;
- fallback when logo metadata is invalid;
- fallback when the logo request rejects, times out, or returns a non-success status;
- fallback when a detail record is absent;
- preservation of the existing dynamic card when its record and logo are available; and
- local fallback rendering at `1200x630` with no text overlay.

Verification will include the affected Vitest integration tests, TypeScript, lint, a production
build, and the repository's project-context update/check loop.

## Scope

The fallback does not replace healthy dynamic Open Graph cards, add editor configuration, modify
SEO fields, probe R2 during ordinary page rendering, or change public media delivery. All
repository changes remain uncommitted.
