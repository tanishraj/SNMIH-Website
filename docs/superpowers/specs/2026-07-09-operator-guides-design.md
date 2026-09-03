# Operator Guides Design

## Goal

Create a full operator manual for the CMS so any user, technical or non-technical, can understand what each left-panel admin section does, when to use it, how it affects the website, and how to use it step by step through meaningful examples.

The documentation should explain the CMS as a connected website-building system, not as a loose collection of schema references.

## Why This Work Matters

The current project has architecture docs, setup docs, and some handoff guidance, but it does not yet have a true user manual for operating the CMS.

That creates a handoff gap:

- technical users can read code and architecture docs
- non-technical users can click around the admin, but they do not have enough context to understand intent, relationships, or safe operating patterns

For a client-handoff-safe CMS starter, that gap is real product work. The admin needs documentation that teaches operators how the system works in practice.

## Scope

This work creates operator-facing guides for the visible left-panel sections in the Payload admin.

This work includes:

- one guide index file
- one guide file per visible admin section
- consistent structure across all guides
- one shared fictional example website used across the entire manual
- explanation of purpose, frontend impact, dependencies, safe usage, and step-by-step operations

This work does not include:

- implementation changes to collections or globals
- block-library expansion
- API reference docs
- code-level developer documentation

## Audience

The manual should work for:

- `Content Manager`
- `Site Manager`
- `Admin`
- technical implementers onboarding to the project
- non-technical operators managing a real client website

Because the audience is mixed, each guide should be layered:

- simple and practical at the start
- deeper and more operational as the guide continues

This allows non-technical users to get value quickly while still giving technical users the detailed context they need.

## Documentation Architecture

The guides should live in a dedicated operator-facing folder:

- `docs/guides/README.md`

Then one guide per visible left-panel item:

- `docs/guides/pages.md`
- `docs/guides/categories.md`
- `docs/guides/tags.md`
- `docs/guides/articles.md`
- `docs/guides/reviews.md`
- `docs/guides/links.md`
- `docs/guides/media.md`
- `docs/guides/redirects.md`
- `docs/guides/headers.md`
- `docs/guides/footers.md`
- `docs/guides/system-pages.md`
- `docs/guides/forms.md`
- `docs/guides/form-submissions.md`
- `docs/guides/operational-audit-events.md`
- `docs/guides/work-queue.md`
- `docs/guides/users.md`
- `docs/guides/site-defaults.md`
- `docs/guides/system-modes.md`
- `docs/guides/site-settings.md`
- `docs/guides/theme-settings.md`
- `docs/guides/seo-settings.md`

These guides should stay separate from:

- `docs/architecture/`
- `docs/operations/`
- `docs/superpowers/specs/`
- `docs/superpowers/plans/`

Those areas remain developer-facing or project-facing. `docs/guides/` becomes the operator manual system.

## Guide Template

Every guide should follow the same structure.

### 1. What This Section Is

Explain:

- the plain-language purpose of the section
- who typically uses it
- what part of the website it controls

### 2. When To Use It

Explain:

- common situations where this section is the right tool
- when not to use it
- how it differs from nearby sections

### 3. How It Connects To The Website

Explain:

- where the content or settings appear on the frontend
- what related sections depend on it
- what can break or become confusing if it is misconfigured

### 4. Step-By-Step Medical College Example

Give:

- one realistic example tied to the shared example website
- the exact sequence of actions in admin
- the expected result on the public website

### 5. Best Practices

Cover:

- naming and content conventions
- publishing and review habits
- safe usage recommendations

### 6. Common Mistakes And Recovery

Cover:

- typical operator mistakes
- how to spot them
- how to fix them safely

### 7. Related Guides

Link to:

- the next guides users should read
- adjacent sections they should understand together

## Shared Example Website

The entire guide system should teach the CMS through one continuous fictional website:

- `North Valley Medical College`

This example site should be reused across every guide so users understand how CMS sections work together as one operating system for a real website.

### Example mappings

- `Pages`
  - create an `Admissions Overview` page
- `Categories`
  - create categories such as `Admissions`, `Academics`, and `Campus Life`
- `Tags`
  - create tags such as `MBBS`, `Scholarships`, `Hostel`, and `Campus Visit`
- `Articles`
  - publish `How To Apply For MBBS Admission`
- `Reviews`
  - approve a student testimonial about teaching quality
- `Links`
  - reuse `Apply Now`, `Download Prospectus`, and `Book Campus Visit`
- `Media`
  - upload campus photos, faculty portraits, logos, and brochures
- `Headers`
  - build the top navigation for `About`, `Programs`, `Admissions`, `Research`, and `Contact`
- `Footers`
  - add institutional links, contact details, and accreditation references
- `System Pages`
  - configure the college 404 page and maintenance page
- `Forms`
  - create an `Admission Enquiry` form
- `Form Submissions`
  - track incoming admissions leads
- `Operational Audit Events`
  - review who changed high-impact settings
- `Work Queue`
  - review operational follow-up and publishing issues
- `Users`
  - explain who should be `Admin`, `Site Manager`, and `Content Manager`
- `Site Defaults`
  - choose the homepage, header, and footer
- `System Modes`
  - enable maintenance mode during a website update
- `Site Settings`
  - configure college identity, contact information, and social links
- `Theme Settings`
  - choose the site-wide visual preset
- `SEO Settings`
  - configure institutional metadata defaults

This shared narrative is required because random isolated examples would weaken the teaching value of the guides.

## Index Guide Responsibilities

`docs/guides/README.md` should act as the entry point to the whole manual.

It should explain:

- what this CMS is for
- what the North Valley Medical College example represents
- how the admin is grouped
- what the main roles mean
- how to read the guide set
- what order a new user should follow

It should also define a recommended reading order:

1. `site-settings`, `theme-settings`, `seo-settings`
2. `site-defaults`, `headers`, `footers`, `links`
3. `pages`, `media`, `articles`, `categories`, `tags`, `reviews`
4. `forms`, `form-submissions`
5. `redirects`, `system-pages`, `system-modes`, `operational-audit-events`, `work-queue`, `users`

This order teaches users how the website is set up, then structured, then filled with content, then operated safely.

## Writing Style

The guides should be written as practical operator manuals, not as terse technical references.

Requirements:

- use plain language first
- avoid assuming the reader knows Payload CMS terminology
- explain terms when they first appear
- be explicit about consequences and dependencies
- prefer realistic website-building sequences over abstract lists
- keep the tone instructional and operational, not promotional

The guides should feel safe for client handoff and usable by someone seeing the CMS for the first time.

## Relationship To Existing Docs

The new guide system should complement existing docs, not replace them.

- `README.md` remains the repository-level starter overview
- `docs/architecture/` remains the developer-facing system map
- `docs/operations/` remains checklist-style operational guidance
- `docs/guides/` becomes the end-user manual

Where useful, guides may link outward to existing docs, but they should not depend on those docs to make basic usage understandable.

## Risks And Design Choices

### Option 1: short per-section notes

Pros:

- fastest to write
- low maintenance cost

Cons:

- weak handoff value
- not enough depth for mixed technical and non-technical audiences

### Option 2: full operator manual with per-section guides

Pros:

- strongest handoff quality
- easy to maintain section by section
- easy to deep-link from inside the product or future docs
- supports both quick lookup and full-system learning

Cons:

- larger writing investment
- requires consistency across many files

### Option 3: one large handbook

Pros:

- simple single-file reading experience

Cons:

- hard to maintain
- hard to deep-link
- harder to update as sections evolve

## Decision

Adopt option 2.

Create a dedicated `docs/guides/` operator-manual system with one entry guide and one guide per visible left-panel admin section.

## Success Criteria

This work is successful when:

- a new non-technical user can understand what each section is for
- a technical user can understand how sections connect to frontend behavior
- each guide contains a meaningful step-by-step example
- the full manual explains the CMS as one connected website system
- the guide system is maintainable as the starter grows

## Testing And Review Impact

This documentation work does not require runtime application changes, but it should still be reviewed for:

- completeness across all visible left-panel items
- naming consistency with the current admin UI
- consistency of the medical college example across files
- clarity for both technical and non-technical readers
- correctness of links between related guides
