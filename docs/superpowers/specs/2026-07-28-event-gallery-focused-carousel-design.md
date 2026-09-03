# Event Gallery Focused Carousel Design

## Objective

Refine the Event Gallery full-screen image viewer into an elegant, focused
carousel. The viewer should feel consistent with the site's restrained design
language while retaining PhotoSwipe's mature zoom, gesture, keyboard, and
focus-management behavior.

This design updates only the viewer described in
`2026-07-27-event-gallery-block-design.md`. Album selection, ordering, data
loading, album cards, and Payload schemas remain unchanged.

## Approved direction

Use the **Focused Carousel** visual direction:

- A dark charcoal, full-viewport stage.
- One centered active image.
- Subtle previews of the adjacent images at the desktop edges.
- A compact floating thumbnail dock instead of a full-width footer.
- Restrained top metadata and icon-only controls.
- Minimal transitions that keep attention on the photography.

## Architecture

Keep PhotoSwipe as the carousel engine. It continues to own:

- Full-screen lifecycle and body-scroll locking.
- Active-slide positioning and looping.
- Touch swiping and vertical-drag dismissal.
- Keyboard navigation and Escape handling.
- Wheel, pinch, and click zoom.
- Responsive image sizing and focus restoration.

Disable PhotoSwipe's visible default toolbar, counter, arrows, and zoom
controls. Add a focused React overlay mounted into the PhotoSwipe root. The
overlay owns the visual controls, adjacent-image previews, caption, and
thumbnail dock while calling PhotoSwipe's public navigation, zoom, and close
methods.

The React overlay imports Lucide React icons so its chevrons, zoom control, and
close control match the rest of the project. PhotoSwipe events synchronize the
overlay's active index and zoomed state. Event subscriptions and the overlay
mount are removed when the viewer closes or the component unmounts.

Keep the overlay isolated from the album grid. `EventGalleryClient` continues
to select an album and restore focus to its opener; `EventGalleryViewer`
continues to receive only the album, initial index, and close callback.

## Viewer composition

### Image stage

The active image remains contained within the viewport so it is never cropped.
Desktop padding reserves a narrow visual lane at each side and room for the
floating thumbnail dock below. The stage uses charcoal rather than pure black.

When the album has multiple images and the active image is not zoomed, narrow
cropped previews of the previous and next images appear at the left and right
edges. They are dimmed and decorative, with no duplicated accessible image
content. They update after each slide change and wrap consistently with the
PhotoSwipe loop.

Side previews are hidden:

- Below the desktop breakpoint.
- While the active image is zoomed.
- When the album contains only one image.

### Top controls

The top-left area displays the album title and a zero-padded
`current / total` counter. The top-right area contains compact icon buttons for
zoom and close.

Controls use translucent charcoal surfaces, a fine light border, the project's
radius, visible focus rings, and Lucide icons. Tooltips are unnecessary because
each control has a concise accessible label and uses a familiar icon.

The zoom icon reflects the available action: zoom in at the fitted level and
zoom out when enlarged. The zoom button is disabled when PhotoSwipe reports
that the current image is not zoomable.

### Previous and next controls

Circular previous and next buttons sit inside the safe viewport edge. They use
Lucide chevrons and remain visually quiet until hover or focus.

The buttons are:

- Hidden for a single-image album.
- Available on desktop and mobile.
- Paired with PhotoSwipe's existing arrow-key and swipe navigation.

### Caption

An optional caption appears centered above the thumbnail dock. The image's
explicit caption is preferred. Alt text may be used only when it provides
useful descriptive content; the album title is not repeated as a fallback
caption.

When no useful caption exists, the caption region is omitted and the image
receives the space.

### Thumbnail dock

For multi-image albums, thumbnails sit in a compact floating dock centered
near the bottom of the viewport. The dock:

- Uses a translucent charcoal surface with backdrop blur and a fine border.
- Scrolls horizontally without a visible scrollbar.
- Keeps the active thumbnail centered when practical.
- Uses a crisp light outline and full opacity for the active thumbnail.
- Uses reduced opacity for inactive thumbnails.
- Navigates directly to the selected slide.

The dock width is capped on desktop and respects mobile viewport gutters. It is
hidden for a single-image album.

## Responsive and motion behavior

Desktop shows the complete Focused Carousel composition, including adjacent
image previews. Tablet and mobile prioritize the active image and hide those
previews. Control sizes retain a minimum touch target even when their visual
icons remain compact.

Transitions use short opacity and transform changes. The viewer does not add
autoplay, parallax, or ornamental animation. When reduced motion is requested,
custom overlay transitions become immediate; PhotoSwipe retains only the
motion required for direct navigation feedback.

## State and error handling

- **Single image:** hide adjacent previews, arrows, and thumbnail dock.
- **Missing caption:** omit the caption region.
- **Unzoomable image:** disable the zoom control.
- **Broken decorative preview:** hide that preview without affecting the active
  PhotoSwipe image.
- **Rapid navigation:** derive all overlay content from PhotoSwipe's current
  index rather than independently advancing state.
- **Close during transition:** unsubscribe events, remove the overlay mount, and
  allow the existing client component to restore focus.

The data source and media normalization remain unchanged. Invalid or unusable
album images continue to be filtered before the viewer opens.

## Accessibility

- Every control is a native button with a concise accessible label.
- The active thumbnail uses `aria-current="true"`.
- The album title and counter are exposed once, without duplicating decorative
  preview content.
- Focus rings remain visible against the charcoal stage.
- Arrow keys navigate, Escape closes, and focus returns to the album card.
- Touch users can swipe and pinch; pointer users can click controls and use the
  wheel to zoom.
- Reduced-motion preferences are honored by custom transitions.

## Testing

Focused tests should verify:

- PhotoSwipe's default visible UI is disabled while engine behavior remains
  enabled.
- The custom overlay receives the active index and updates title, counter,
  caption, thumbnails, and adjacent previews.
- Previous, next, zoom, close, and thumbnail controls call the correct
  PhotoSwipe methods.
- Adjacent previews wrap with looped navigation and hide on mobile, zoom, and
  single-image albums.
- Single-image albums omit arrows and the thumbnail dock.
- Missing captions do not render an empty caption region.
- Active thumbnails receive `aria-current` and scroll into view.
- Focus restoration, keyboard behavior, accessible labels, and reduced-motion
  styling remain intact.
- Type checking, ESLint, and the existing Event Gallery test suite pass.

## Out of scope

- Changes to Gallery Album fields or the Event Gallery block schema.
- Changes to album selection, ordering, loading, cards, or live preview.
- Autoplay, slideshow timing, downloads, sharing, or social controls.
- Video or mixed-media slides.
- A separate carousel dependency or replacement of PhotoSwipe.
- Per-block viewer style configuration.
