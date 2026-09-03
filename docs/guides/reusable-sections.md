# Reusable Sections Guide

## What This Section Is

`Reusable Sections` is a library of saved content blocks that can be placed on any page. When you update a reusable section, every page that uses it is updated automatically — you only edit it once.

## When To Use It

Use `Reusable Sections` when:

- the same content block appears on more than one page and should stay in sync
- a team-wide disclaimer, accreditation badge section, or promotional strip needs to appear consistently site-wide
- a CTA that changes seasonally is placed on several pages and updating each page individually would take too long

Do not use reusable sections for one-off page content that is not shared anywhere else. Unique content should stay inside the page layout directly.

## How It Connects To The Website

When a page layout includes a `Reusable Section` block, the frontend fetches the saved section by its reference and renders it exactly as if those blocks had been placed directly in the page. If the reusable section is updated and republished, the change appears on every page that references it.

Reusable sections use a deliberately smaller catalog than regular Pages. They cannot contain another Reusable Section, Hero Carousel, Gallery Coverflow, Testimonial Grid, Awards List, or About Section.

## Step-By-Step Medical College Example

North Valley Medical College adds an accreditation badge strip to every academic program page:

1. Open `Reusable Sections` under `Content`.
2. Click `Create New`.
3. Give it a clear title such as `Accreditation Badges Strip`.
4. Add a `Stats Strip` block with accreditation body names and badge logos.
5. Save and publish the section.
6. Open each academic program page.
7. Add a `Reusable Section` block at the appropriate position in the layout.
8. Select `Accreditation Badges Strip` from the relationship picker.
9. Save and publish each page.

Expected website result:

- the accreditation strip appears on every academic program page
- when an accreditation body changes, only the reusable section needs to be updated
- all program pages reflect the change automatically on the next publish

## Editing A Reusable Section

1. Open `Reusable Sections`.
2. Find the section by title.
3. Edit the blocks inside it.
4. Save and publish.

All pages that reference the section pick up the change automatically. There is no need to republish the individual pages.

## Best Practices

- give each reusable section a clear, specific title that describes its content and context
- use reusable sections only for content that is genuinely shared — resist placing unique page content inside a section just to avoid building it on the page directly
- treat a reusable section like any other published content: draft changes stay hidden until the section is published
- when removing a reusable section from a page layout, check whether it is still used by other pages before archiving the section itself

## Common Mistakes And Recovery

- editing a reusable section without realising it will update every page that references it
- placing a reusable section inside another reusable section — this is prevented by the CMS but the nesting is not supported
- forgetting to publish the section after editing — drafts are not visible on the public website

If the content change appears on pages it should not have, check which pages use that reusable section and whether the section title was the correct one to edit.

## Related Guides

- [Pages](./pages.md)
- [Page Blocks](./blocks.md)
