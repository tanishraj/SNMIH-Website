# Articles Guide

## What This Section Is

`Articles` is the writing-first section for long-form editorial content. It uses a rich text editor, structured taxonomy, featured images, native drafts, and SEO controls to publish content like explainers, announcements, and guidance pieces for North Valley Medical College.

## When To Use It

Use `Articles` when you need newsroom-style or blog-style content that is primarily read as an article rather than as a block-based website page.

Do not use it for:

- evergreen landing pages that belong in `Pages`
- raw testimonials that belong in `Reviews`

## How It Connects To The Website

Articles render at `/articles/[slug]`, Topic archives at `/articles/category/[slug]`, Tag archives at `/articles/tag/[slug]`, and the newest 50 feed entries at `/articles/feed.xml`. There is no built-in `/articles` index; create a CMS Page at that path when the site needs one. Related content prioritizes the same primary Topic, then shared Tags, with at most three results.

If taxonomy, excerpt, or featured image quality is weak, article listings and cross-linking will also weaken on the frontend.

## Step-By-Step Medical College Example

Publish an article titled `How To Apply For MBBS Admission` for North Valley Medical College:

1. Open `Articles`.
2. Click `Create New`.
3. Enter the title `How To Apply For MBBS Admission`.
4. Confirm the slug.
5. Select `Admissions` as the primary category.
6. Add related tags such as `MBBS` and `Scholarships` if they fit.
7. Write a concise excerpt that explains what the reader will learn.
8. Upload or select a featured image from `Media`.
9. Enter the author name.
10. Write the article body in the Lexical editor.
11. Add SEO metadata for search and sharing.
12. Save as a draft or publish when ready.

Expected website result:

- the article appears at its article route
- it can be grouped under admissions content and related MBBS topics
- article cards can use the excerpt and featured image

## Best Practices

- write article titles for real readers, not only internal teams
- always choose a strong primary category
- keep excerpts short and specific
- use the rich text body for narrative content, not page-builder structure
- resolve any open or blocked approval/publish-issue Action Queue item before publishing

## Common Mistakes And Recovery

- creating a page-like landing experience inside an article
- forgetting the primary category
- publishing with a weak excerpt or missing featured image
- over-tagging the article with every available label

If the article is structurally wrong for its purpose, move the concept into `Pages` and leave `Articles` for editorial reading experiences.

## Related Guides

- [Topics](./categories.md)
- [Tags](./tags.md)
- [Media](./media.md)
- [Reviews](./reviews.md)
