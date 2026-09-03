# Open Graph AVIF Image Dimensions Design

## Goal

Prevent production builds from failing when the server-generated Open Graph images include a
remote AVIF logo from the configured public media origin.

## Problem

The root, Article, Review, and News & Events Open Graph routes render the Site Settings logo with
an absolute URL but without intrinsic `width` and `height` attributes. The image renderer bundled
with Next.js cannot infer AVIF dimensions, so prerendering fails with `Image size cannot be
determined` even when the R2 object is valid and publicly accessible.

## Decision

Add a shared Open Graph media resolver in `src/lib/media.ts`. It will return the absolute URL and
positive intrinsic dimensions only when the populated Payload media record provides all three.
Root-relative URLs remain excluded from build-time Open Graph images.

Each Open Graph route will use the resolved URL, width, and height as explicit `<img>` attributes
while retaining its current visual sizing through inline styles. If the logo relationship is not
populated, its URL is not absolute, or its dimensions are missing or invalid, the route will render
the existing site-name fallback instead of risking a failed build.

This applies consistently to:

- `src/app/(frontend)/opengraph-image.tsx`
- `src/app/(frontend)/articles/[slug]/opengraph-image.tsx`
- `src/app/(frontend)/reviews/[slug]/opengraph-image.tsx`
- `src/app/(frontend)/news-events/[slug]/opengraph-image.tsx`

## Error Handling

Invalid or incomplete media metadata is treated as an unavailable Open Graph logo. The generated
image remains valid and contains the site name. No database write, schema change, network probe, or
runtime exception is introduced by the resolver.

Explicit dimensions also allow the Open Graph renderer to continue when it cannot detect the
remote format's intrinsic size. The remote asset remains the image source and continues to use the
configured R2 public origin.

## Testing

Focused integration tests will verify that the shared resolver:

- accepts an absolute HTTPS media URL with positive width and height;
- rejects root-relative URLs;
- rejects media without both dimensions; and
- rejects zero or negative dimensions.

Open Graph route coverage will verify that a populated AVIF logo renders explicit intrinsic
dimensions and that incomplete media metadata falls back to the site name. Verification will also
include TypeScript, the affected integration tests, a production build, and the repository's
project-context update/check loop.

## Scope

No Payload schema, generated type, database record, R2 configuration, environment variable, or
visual Open Graph layout change is required. Existing `S3_PUBLIC_URL` behavior remains unchanged.
All repository changes remain uncommitted.
