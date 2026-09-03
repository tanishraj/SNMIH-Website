# Operator Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full operator manual under `docs/guides/` that explains every visible left-panel admin section through a consistent medical-college example, with clear purpose, website impact, step-by-step usage, and safe operating guidance.

**Architecture:** Create a dedicated `docs/guides/` documentation system with one index file and one guide per visible admin section. Write the guides in grouped batches that mirror the actual Payload admin navigation so each batch is internally coherent, reviewable on its own, and easy to verify for completeness and consistency.

**Tech Stack:** Markdown, existing repository docs, Payload CMS collection/global configuration, shell verification commands (`test`, `rg`)

## Global Constraints

- Create a dedicated `docs/guides/` operator-manual system with one entry guide and one guide per visible left-panel admin section.
- Use the shared fictional website `North Valley Medical College` across the whole guide set.
- Each guide must explain purpose, frontend impact, dependencies, safe usage, and step-by-step operations.
- Each guide must follow the same structure.
- The guides must work for technical and non-technical users.
- `docs/guides/` remains separate from `docs/architecture/`, `docs/operations/`, `docs/superpowers/specs/`, and `docs/superpowers/plans/`.

---

## File Structure

- Create: `docs/guides/README.md`
  - Entry point for the operator manual, reading order, admin grouping, and example-site framing.
- Create: `docs/guides/pages.md`
- Create: `docs/guides/categories.md`
- Create: `docs/guides/tags.md`
- Create: `docs/guides/articles.md`
- Create: `docs/guides/reviews.md`
- Create: `docs/guides/links.md`
- Create: `docs/guides/media.md`
  - Content-area operator guides.
- Create: `docs/guides/redirects.md`
- Create: `docs/guides/headers.md`
- Create: `docs/guides/footers.md`
- Create: `docs/guides/system-pages.md`
  - Site-structure operator guides.
- Create: `docs/guides/forms.md`
- Create: `docs/guides/form-submissions.md`
- Create: `docs/guides/operational-audit-events.md`
- Create: `docs/guides/work-queue.md`
- Create: `docs/guides/users.md`
  - Forms and admin operations guides.
- Create: `docs/guides/site-defaults.md`
- Create: `docs/guides/system-modes.md`
- Create: `docs/guides/site-settings.md`
- Create: `docs/guides/theme-settings.md`
- Create: `docs/guides/seo-settings.md`
  - Defaults and settings guides.
- Modify: `README.md`
  - Add discoverability link to the new operator manual entry point once the guides exist.

## Task 1: Create The Guide System Entry Point

**Files:**
- Create: `docs/guides/README.md`
- Modify: `README.md`

**Interfaces:**
- Consumes:
  - `docs/architecture/content-model-map.md`
  - `README.md`
  - actual admin groups from `src/collections/*` and `src/globals/*`
- Produces:
  - `docs/guides/README.md`
  - discoverability link from repository docs to the operator manual

- [ ] **Step 1: Verify the guide folder and entry file do not exist yet**

Run: `test -d docs/guides || echo missing && test -f docs/guides/README.md || echo missing`
Expected: prints `missing` because the operator guide system has not been created yet.

- [ ] **Step 2: Create the `docs/guides/` folder**

Run: `mkdir -p docs/guides`
Expected: command succeeds with no output.

- [ ] **Step 3: Write the entry guide**

Create `docs/guides/README.md` with this exact structure:

```md
# CMS Operator Guide

## What This Manual Is

This guide set explains how to use the CMS to build and operate a real website. It is written for both technical and non-technical users.

Throughout the guides, the CMS is taught through one example website:

- `North Valley Medical College`

That shared example shows how pages, content, structure, forms, settings, and operational tools work together.

## Who This Manual Is For

- `Content Manager`: publishes and updates normal website content
- `Site Manager`: manages content, structure, settings, and higher-impact website controls
- `Admin`: manages the full system, including users and recovery controls
- technical implementers onboarding to the CMS
- non-technical operators who need practical step-by-step instructions

## How The Admin Is Grouped

### Content

- Pages
- Categories
- Tags
- Articles
- Reviews
- Links
- Media

### Site Structure

- Redirects
- Headers
- Footers
- System Pages

### Forms

- Forms
- Form Submissions

### Admin

- Operational Audit Events
- Work Queue
- Users

### System Defaults

- Site Defaults
- System Modes

### Settings

- Site Settings
- Theme Settings
- SEO Settings

## Recommended Reading Order

1. [Site Settings](./site-settings.md), [Theme Settings](./theme-settings.md), [SEO Settings](./seo-settings.md)
2. [Site Defaults](./site-defaults.md), [Headers](./headers.md), [Footers](./footers.md), [Links](./links.md)
3. [Pages](./pages.md), [Media](./media.md), [Articles](./articles.md), [Categories](./categories.md), [Tags](./tags.md), [Reviews](./reviews.md)
4. [Forms](./forms.md), [Form Submissions](./form-submissions.md)
5. [Redirects](./redirects.md), [System Pages](./system-pages.md), [System Modes](./system-modes.md), [Operational Audit Events](./operational-audit-events.md), [Work Queue](./work-queue.md), [Users](./users.md)

## How To Use These Guides

Each guide follows the same pattern:

1. what the section is
2. when to use it
3. how it connects to the website
4. a step-by-step medical college example
5. best practices
6. common mistakes and recovery
7. related guides

If you are new to the CMS, read in order. If you are already operating the website, jump directly to the section you need.
```

- [ ] **Step 4: Add a discoverability link in the repository README**

Update `README.md` by adding this line under `## Handoff Docs`:

```md
- [CMS operator guide](docs/guides/README.md)
```

- [ ] **Step 5: Verify the entry guide exists and includes the required framing**

Run: `rg -n "North Valley Medical College|## How The Admin Is Grouped|## Recommended Reading Order" docs/guides/README.md README.md`
Expected: matches from `docs/guides/README.md` and one `CMS operator guide` link in `README.md`.

- [ ] **Step 6: Commit**

```bash
git add docs/guides/README.md README.md
git commit -m "docs(guides): add operator manual index"
```

## Task 2: Write The Content Guides

**Files:**
- Create: `docs/guides/pages.md`
- Create: `docs/guides/categories.md`
- Create: `docs/guides/tags.md`
- Create: `docs/guides/articles.md`
- Create: `docs/guides/reviews.md`
- Create: `docs/guides/links.md`
- Create: `docs/guides/media.md`

**Interfaces:**
- Consumes:
  - `docs/guides/README.md`
  - `docs/architecture/content-model-map.md`
  - current collection roles from `src/collections/Pages.ts`, `Categories.ts`, `Tags.ts`, `Articles.ts`, `Reviews.ts`, `NavigationLinks.ts`, and `Media.ts`
- Produces:
  - the complete `Content` guide set

- [ ] **Step 1: Verify the content guide files do not exist yet**

Run: `test -f docs/guides/pages.md || echo missing && test -f docs/guides/articles.md || echo missing && test -f docs/guides/media.md || echo missing`
Expected: prints `missing` because the content guides have not been created yet.

- [ ] **Step 2: Write `docs/guides/pages.md`**

Create `docs/guides/pages.md` with content following this exact structure and example:

```md
# Pages Guide

## What This Section Is

`Pages` is the main place where standard website pages are created and managed. Use it for public-facing pages such as Home, About, Admissions, Programs, Faculty, Research, and Contact.

## When To Use It

Use `Pages` when you need a normal website page with its own URL and layout.

Do not use it for:

- system-only experiences like 404 or maintenance pages
- long-form newsroom content that belongs in `Articles`

## How It Connects To The Website

Pages define real frontend routes. A published page can become the homepage through `Site Defaults`, can appear in navigation through `Links`, and can rely on `Headers`, `Footers`, and `Media`.

If a page slug or hierarchy is changed, related navigation and redirects may also need attention.

## Step-By-Step Medical College Example

Create an `Admissions Overview` page for North Valley Medical College:

1. Open `Pages`.
2. Click `Create New`.
3. Enter the title `Admissions Overview`.
4. Add the page content blocks needed for the page.
5. Set the slug to `admissions`.
6. Review the public URL preview.
7. Add SEO details that describe the admissions page.
8. Move the workflow to the correct state and publish when ready.

Expected website result:

- the public site has a page at `/admissions`
- the page can later be linked from the header or footer

## Best Practices

- keep titles clear and institution-facing
- confirm the public URL before publishing
- use pages for stable evergreen sections of the site

## Common Mistakes And Recovery

- creating an article when the content should really be a page
- changing a slug without checking related links
- publishing before reviewing the page URL and SEO settings

If a URL changes unexpectedly, review `Redirects` and related `Links`.

## Related Guides

- [Links](./links.md)
- [Headers](./headers.md)
- [Footers](./footers.md)
- [Site Defaults](./site-defaults.md)
```

- [ ] **Step 3: Write the remaining content guides**

Create these files with the same seven-section template and these example anchors:

```md
docs/guides/categories.md -> category example: `Admissions`
docs/guides/tags.md -> tag example: `MBBS`
docs/guides/articles.md -> article example: `How To Apply For MBBS Admission`
docs/guides/reviews.md -> approved testimonial example from a student
docs/guides/links.md -> reusable links: `Apply Now`, `Download Prospectus`, `Book Campus Visit`
docs/guides/media.md -> upload campus photos, faculty portraits, logo, and brochure PDF
```

Each file must include:

- `## What This Section Is`
- `## When To Use It`
- `## How It Connects To The Website`
- `## Step-By-Step Medical College Example`
- `## Best Practices`
- `## Common Mistakes And Recovery`
- `## Related Guides`

- [ ] **Step 4: Verify the content guides are complete and use the shared example**

Run: `rg -n "## What This Section Is|## Step-By-Step Medical College Example|North Valley Medical College|Admissions|MBBS|Apply Now" docs/guides/pages.md docs/guides/categories.md docs/guides/tags.md docs/guides/articles.md docs/guides/reviews.md docs/guides/links.md docs/guides/media.md`
Expected: matches across all seven files, with each file containing the common headings and at least one shared-example term.

- [ ] **Step 5: Commit**

```bash
git add docs/guides/pages.md docs/guides/categories.md docs/guides/tags.md docs/guides/articles.md docs/guides/reviews.md docs/guides/links.md docs/guides/media.md
git commit -m "docs(guides): add content section manuals"
```

## Task 3: Write The Site Structure Guides

**Files:**
- Create: `docs/guides/redirects.md`
- Create: `docs/guides/headers.md`
- Create: `docs/guides/footers.md`
- Create: `docs/guides/system-pages.md`

**Interfaces:**
- Consumes:
  - `docs/guides/README.md`
  - current collection roles from `src/collections/Redirects.ts`, `Headers.ts`, `Footers.ts`, and `SystemPages.ts`
- Produces:
  - the complete `Site Structure` guide set

- [ ] **Step 1: Verify the structure guide files do not exist yet**

Run: `test -f docs/guides/redirects.md || echo missing && test -f docs/guides/system-pages.md || echo missing`
Expected: prints `missing`.

- [ ] **Step 2: Write the structure guides**

Create these files using the same seven-section template and these example anchors:

```md
docs/guides/redirects.md -> redirect `/old-admissions` to `/admissions`
docs/guides/headers.md -> top navigation for `About`, `Programs`, `Admissions`, `Research`, `Contact`
docs/guides/footers.md -> footer with address, accreditation, quick links, and admissions CTA
docs/guides/system-pages.md -> branded 404 and maintenance pages for North Valley Medical College
```

Each guide must explicitly explain:

- how it influences site-wide behavior
- which other sections it depends on
- what happens if it is misconfigured

- [ ] **Step 3: Verify the structure guides contain site-wide impact language**

Run: `rg -n "site-wide|frontend|North Valley Medical College|404|maintenance|Admissions|Contact" docs/guides/redirects.md docs/guides/headers.md docs/guides/footers.md docs/guides/system-pages.md`
Expected: each file has content that ties the section to real frontend behavior and the shared example site.

- [ ] **Step 4: Commit**

```bash
git add docs/guides/redirects.md docs/guides/headers.md docs/guides/footers.md docs/guides/system-pages.md
git commit -m "docs(guides): add site structure manuals"
```

## Task 4: Write The Forms And Admin Operation Guides

**Files:**
- Create: `docs/guides/forms.md`
- Create: `docs/guides/form-submissions.md`
- Create: `docs/guides/operational-audit-events.md`
- Create: `docs/guides/work-queue.md`
- Create: `docs/guides/users.md`

**Interfaces:**
- Consumes:
  - `docs/guides/README.md`
  - current collection roles from `src/collections/Forms.ts`, `FormSubmissions.ts`, `OperationalAuditEvents.ts`, `WorkQueue.ts`, and `Users.ts`
- Produces:
  - the complete forms/admin-operations guide set

- [ ] **Step 1: Verify the forms/admin guide files do not exist yet**

Run: `test -f docs/guides/forms.md || echo missing && test -f docs/guides/work-queue.md || echo missing && test -f docs/guides/users.md || echo missing`
Expected: prints `missing`.

- [ ] **Step 2: Write the forms and submissions guides**

Create:

```md
docs/guides/forms.md -> `Admission Enquiry` form and `Request Prospectus` form
docs/guides/form-submissions.md -> track incoming admissions leads from those forms
```

Both guides must explain:

- how form design affects public website behavior
- how submissions move into operational follow-up
- the difference between building a form and handling a submission

- [ ] **Step 3: Write the admin operation guides**

Create:

```md
docs/guides/operational-audit-events.md -> review who changed site-wide settings and publishing state
docs/guides/work-queue.md -> review and manage actionable CMS items
docs/guides/users.md -> explain `Admin`, `Site Manager`, and `Content Manager`, when to use each, and how capability overrides work
```

The `users.md` guide must explicitly explain:

- role purpose
- how to choose the correct role
- why role changes reset the non-admin preset
- when capability overrides are appropriate

- [ ] **Step 4: Verify the forms/admin guides use the correct operational language**

Run: `rg -n "Admission Enquiry|Request Prospectus|lead|follow-up|Admin|Site Manager|Content Manager|capability" docs/guides/forms.md docs/guides/form-submissions.md docs/guides/operational-audit-events.md docs/guides/work-queue.md docs/guides/users.md`
Expected: all key operational terms appear in the relevant files.

- [ ] **Step 5: Commit**

```bash
git add docs/guides/forms.md docs/guides/form-submissions.md docs/guides/operational-audit-events.md docs/guides/work-queue.md docs/guides/users.md
git commit -m "docs(guides): add operations manuals"
```

## Task 5: Write The Defaults And Settings Guides

**Files:**
- Create: `docs/guides/site-defaults.md`
- Create: `docs/guides/system-modes.md`
- Create: `docs/guides/site-settings.md`
- Create: `docs/guides/theme-settings.md`
- Create: `docs/guides/seo-settings.md`

**Interfaces:**
- Consumes:
  - `docs/guides/README.md`
  - current global roles from `src/globals/PageSettings.ts`, `SystemModeSettings.ts`, `SiteSettings.ts`, `ThemeSettings.ts`, and `SEOSettings.ts`
- Produces:
  - the complete defaults/settings guide set

- [ ] **Step 1: Verify the defaults/settings guide files do not exist yet**

Run: `test -f docs/guides/site-defaults.md || echo missing && test -f docs/guides/site-settings.md || echo missing && test -f docs/guides/seo-settings.md || echo missing`
Expected: prints `missing`.

- [ ] **Step 2: Write the defaults and settings guides**

Create these files using the common seven-section template and these example anchors:

```md
docs/guides/site-defaults.md -> choose `Front Page`, active header, and active footer
docs/guides/system-modes.md -> enable maintenance mode for a planned college website update
docs/guides/site-settings.md -> set college name, address, phone, email, and social links
docs/guides/theme-settings.md -> choose the visual preset for the college brand
docs/guides/seo-settings.md -> define global title template, description, robots, and default social image
```

Each guide must clearly warn about site-wide impact and explain how mistakes in these areas affect the public website.

- [ ] **Step 3: Verify the defaults/settings guides contain site-wide warnings and related links**

Run: `rg -n "site-wide|homepage|maintenance|brand|SEO|robots|North Valley Medical College|Related Guides" docs/guides/site-defaults.md docs/guides/system-modes.md docs/guides/site-settings.md docs/guides/theme-settings.md docs/guides/seo-settings.md`
Expected: each file includes the shared example, site-wide consequence language, and related-guide links.

- [ ] **Step 4: Commit**

```bash
git add docs/guides/site-defaults.md docs/guides/system-modes.md docs/guides/site-settings.md docs/guides/theme-settings.md docs/guides/seo-settings.md
git commit -m "docs(guides): add defaults and settings manuals"
```

## Task 6: Final Consistency Sweep And Manual Verification

**Files:**
- Modify: `docs/guides/*.md`

**Interfaces:**
- Consumes:
  - all previously created guide files
- Produces:
  - a consistent, cross-linked operator manual with complete section coverage

- [ ] **Step 1: Verify every required guide file exists**

Run: `for f in README pages categories tags articles reviews links media redirects headers footers system-pages forms form-submissions operational-audit-events work-queue users site-defaults system-modes site-settings theme-settings seo-settings; do test -f "docs/guides/$f.md" || echo "missing:$f"; done`
Expected: no output.

- [ ] **Step 2: Verify every guide includes the required headings**

Run: `rg -L "## What This Section Is|## When To Use It|## How It Connects To The Website|## Step-By-Step Medical College Example|## Best Practices|## Common Mistakes And Recovery|## Related Guides" docs/guides/*.md`
Expected: no output.

- [ ] **Step 3: Verify the shared example website is used throughout**

Run: `rg -L "North Valley Medical College" docs/guides/*.md`
Expected: no output.

- [ ] **Step 4: Verify cross-links and reading-order discoverability**

Run: `rg -n "Related Guides|Recommended Reading Order|CMS operator guide" docs/guides/*.md README.md`
Expected: matches from the guide index, multiple section guides, and the repository README.

- [ ] **Step 5: Review the final worktree**

Run: `git status --short`
Expected: only `docs/guides/*.md` files and the intentional `README.md` change are modified or added for this documentation slice.

- [ ] **Step 6: Commit**

```bash
git add docs/guides README.md
git commit -m "docs(cms): add operator guide system"
```

## Spec Coverage Check

- One guide index plus one file per visible left-panel item: covered by Tasks 1-5.
- Shared `North Valley Medical College` example across the entire manual: covered by Tasks 1-6.
- Consistent guide structure: covered by Tasks 2-6.
- Frontend impact, dependencies, safe usage, and step-by-step usage: covered in the required template content for every task.
- Mixed technical and non-technical audience: covered by Task 1 framing and the layered guide template.
- Separation from developer docs: covered by Task 1 folder creation and README link strategy.

## Placeholder Scan

No `TBD`, `TODO`, or deferred implementation markers remain in this plan. Every task includes exact files, concrete content anchors, verification commands, and commit boundaries.

## Type Consistency Check

- Guide filenames consistently match the visible admin navigation names requested in the spec.
- The shared example website name remains `North Valley Medical College` everywhere.
- The repeated guide headings are identical across all tasks so verification can be automated with `rg`.
