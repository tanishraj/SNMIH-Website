# Gallery Albums Guide

## What This Section Is

`Gallery Albums` stores ordered, versioned image sets for the `Event Gallery` and album-backed `Image Mosaic` page blocks. The first usable image is the album cover; the remaining order is the full-screen viewer order.

## Step-By-Step Medical College Example

1. Open `Gallery Albums` in `Media` and create `White Coat Ceremony 2026`.
2. Add an optional description and event date.
3. Add at least one image, write captions where useful, and drag rows into the intended viewing order.
4. Publish the album.
5. Edit a Page and add either an `Event Gallery` block or an `Image Mosaic` block with Content Source set to `Gallery Albums`.
6. Explicitly select up to eight albums, choose `Latest Event Date` or `Manual` display order, and publish the Page.
7. Choose Bottom Left, Bottom Center, or Center — Vertical & Horizontal for album details; Event Date and Image Count can be hidden independently.
8. Keep `Enable Album Slideshow` on for an interactive gallery, or disable it for static image tiles.
9. Verify the cover card, numeric image counter, captions, keyboard controls, thumbnails, and previous/next navigation when the slideshow is enabled.

## Important Behavior

- albums do not receive standalone public routes
- normal frontend rendering excludes draft albums
- Event Gallery and album-backed Image Mosaic only load albums selected on that block
- selecting `Manual` preserves the relationship order chosen in the block
- Image Mosaic supports at most eight selected albums and contributes one cover tile per album
- existing Image Mosaic blocks without Content Source remain Manual Images
- existing Event Gallery blocks without the slideshow setting remain interactive
- authenticated live preview receives selected draft albums from the server; gallery clients do not query Payload
- a referenced image cannot be deleted from Media until its album reference is removed

## Related Guides

- [Media](./media.md)
- [Pages](./pages.md)
- [Page Blocks](./blocks.md)
