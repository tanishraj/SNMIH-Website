# Reviews Guide

## What This Section Is

`Reviews` stores moderated public reviews with structured fields such as rating, reviewer identity, review title, review body, and moderation notes. In North Valley Medical College, this section can be used for approved student testimonials and experience-based public trust content.

## When To Use It

Use `Reviews` when you need structured testimonial-style content that should be reviewed carefully before publication.

Do not use it for:

- long editorial explainers that belong in `Articles`
- broad landing-page storytelling that belongs in `Pages`

## How It Connects To The Website

Reviews render at `/reviews/[slug]`; Topic archives render at `/reviews/category/[slug]`. There is no built-in `/reviews` index, so create a CMS Page there when needed. Rating Spotlight and Review Feed read published Reviews; Review Feed exposes averages, a five-to-one distribution, verified-experience badges, and paginated newest-first entries.

If a review is published without proper moderation, the website can surface low-quality or unsafe testimonial content.

## Step-By-Step Medical College Example

Approve a student testimonial for North Valley Medical College:

1. Open `Reviews`.
2. Click `Create New`.
3. Enter an internal title such as `Aarav Sharma MBBS Testimonial`.
4. Choose `Admissions` or another appropriate primary category.
5. Select a rating.
6. Enter the public-facing review title.
7. Paste the student review into the review body field.
8. Enter the reviewer name and email.
9. Add a public-safe display name if you do not want to show the full private name.
10. Confirm the `genuine experience` checkbox if the statement supports it.
11. Add moderation notes explaining what was reviewed.
12. Publish only after approval.

Expected website result:

- the public site shows an approved student testimonial for North Valley Medical College
- the review can support trust-building on admissions or campus-related content

## Best Practices

- treat reviews as moderated public statements
- use internal moderation notes for context and decision history
- prefer display names when privacy matters
- preserve private reviewer email for moderation only and use the public display name intentionally

## Common Mistakes And Recovery

- publishing a review before confirming it is appropriate for public display
- exposing private reviewer details unnecessarily
- using reviews as a substitute for well-written article or page content
- ignoring rating and category quality

If a review should not be public, move it back out of the published state and record the moderation reason internally.

## Related Guides

- [Topics](./categories.md)
- [Tags](./tags.md)
- [Articles](./articles.md)
- [Media](./media.md)
- [Forms](./forms.md)
- [Page Blocks](./blocks.md)
