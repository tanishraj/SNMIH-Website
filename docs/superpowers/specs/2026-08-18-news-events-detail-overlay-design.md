# News & Events Detail Image Overlay Design

## Purpose

Update the global-only News & Events Content block so every News & Events detail page presents its
entry image, classification, title, excerpt, Lexical body, and metadata in one consistent editorial
layout. This design supersedes the earlier detail-page decision that prohibited content over the
featured image.

## Ownership and data flow

- The News & Events collection remains the source of the current entry's classification, title,
  excerpt, featured image, Lexical body, dates, location, registration action, and taxonomy.
- The shared News & Events Detail Page global controls presentation through its single required
  `newsEventsContent` block.
- The dynamic block does not gain a relationship, slug, source selector, or manual content fields.
- Production and authenticated live preview receive the current entry through their existing
  explicit render context. Neither path adds a client-side Payload or template query.

## Admin configuration

The News & Events Content block retains its existing settings:

- Author label
- Show Share Actions
- Section appearance and padding
- Sidebar card background and outline
- Featured image ratio

Its Theme Settings tab adds the existing shared media-overlay controls:

- Overlay Tone: Auto, Light, Dark, or Brand
- Overlay Strength: Light, Dark, or Darker
- Overlay Direction: Even/Vertical, Left-to-Right, Right-to-Left, Bottom-to-Top, or Top-to-Bottom
- Overlay Coverage: Full or Split

Defaults are Dark tone, Darker strength, Bottom-to-Top direction, and Full coverage. Missing,
legacy, or malformed values normalize to these defaults. The implementation reuses the shared
overlay field factories and presentation resolver rather than defining new overlay semantics.

## Article presentation

The main content column renders in this order:

1. Featured image with the configured aspect ratio.
2. Shared overlay over the image.
3. Entry classification label, such as News, Event, Notice, Holiday, Achievement, Announcement, or
   Other, as the overlay eyebrow.
4. Entry title as the overlay heading.
5. Entry excerpt immediately below the image.
6. Styled Lexical body content.

The overlay content position is fixed at the bottom-left for consistent scanning across entries.
The shared overlay resolver supplies the correct title and eyebrow contrast classes for the selected
tone. The excerpt remains visually distinct from the Lexical body through typography and spacing,
but does not receive a separate card surface.

If an entry has no usable featured image, the page uses the existing bundled SNMIH News & Events
default image. This preserves the image-and-overlay composition instead of switching to a different
text-only layout.

## Sidebar and responsive behavior

- The existing right sidebar remains the metadata area.
- Story Details continues to show author, date or event date, classification/category, and event
  location when present.
- Event registration remains inside Story Details.
- Share actions remain controlled by `showShareActions`.
- At desktop widths, the main content and right sidebar retain the existing two-column grid and
  sticky sidebar behavior.
- At smaller widths, the sidebar stacks below the main content and is no longer sticky.
- The featured image remains full-width within the main column at every breakpoint.

## Compatibility and fallback behavior

- Existing saved News & Events Content blocks without overlay fields render with the recommended
  defaults.
- The existing featured-image ratio, section surface, padding, sidebar surface, outline, author,
  share, Lexical styling, event metadata, and registration behavior remain supported.
- The default template, failed-global fallback, production renderer, and live-preview renderer all
  resolve the same overlay settings.
- The global remains collection-backed and automatic; no manual-entry mode is introduced.

## Verification

Focused tests must prove:

- Payload exposes the four shared overlay controls on the global-only dynamic block.
- Valid overlay values are preserved and invalid or missing values use the approved defaults.
- The classification and title render inside the image overlay in that order.
- The excerpt renders after the image and before the Lexical body.
- A missing entry image uses the bundled SNMIH fallback image.
- Shared overlay contrast and frame classes are applied.
- Story Details, optional Share actions, event registration, responsive grid, and sticky sidebar
  behavior remain intact.
- Production and live preview render the same composition without violating the client/server import
  boundary.

Payload types, affected integration tests, maintained block/news-event documentation, and
project-context references are regenerated or updated after implementation. No commit is created
unless explicitly requested.
