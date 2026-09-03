# Versioned Media Image URLs

## Problem

Next.js correctly negotiates optimized formats, so an AVIF source may be served as
WebP. However, the current `minimumCacheTTL` allows an optimized derivative to remain
cached for 24 hours when an S3 object is replaced under the same filename. That can
leave the browser or Next optimizer serving stale or invalid image data.

## Design

Update the shared media image-props resolver to append a stable version query derived
from a Payload media document's `updatedAt`. The version is applied only when the
record has a valid timestamp, preserving existing URLs for incomplete records and
root-relative local media paths. Existing query strings are joined with `&`; URLs
without one use `?`.

CMS `next/image` consumers use this shared resolver directly or are migrated to it at
their server adapter boundary. Media Carousel keeps video URLs canonical. Next's format
negotiation and resizing remain enabled, while the changed image source URL causes a new
optimizer cache key after an upload replacement or media edit.

## Validation

- Unit tests verify versioned absolute URLs and query-string joining.
- Existing media URL and Next image configuration tests continue to pass.
- Run project-context update/check and the focused media test suite.

## Out of Scope

- Disabling Next image optimization.
- Changing CDN cache policy or S3 object naming.
- Adding fallback rendering for unavailable upstream objects.
