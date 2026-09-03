# Articles And Reviews Design

## Summary

This spec adds two new first-class content types to the starter:

- `articles`
- `reviews`

The goal is to support two distinct workflows without over-abstracting them into a generic entry system:

- editorial long-form publishing for articles
- public submission plus moderation for reviews

`Articles` should behave like proper routed CMS content with a strong Lexical writing experience. `Reviews` should behave like moderated public content that can also render as full frontend entries with flexible block-based presentation.

This work also extends the admin capability model so `Articles` and `Reviews` appear as explicit capability checkboxes for non-admin users, while `admin` continues to receive unconditional access to everything.

## Why This Direction

Three possible models were considered:

### 1. Two First-Class Collections

Use separate `articles` and `reviews` collections with their own fields, routes, capabilities, and admin workflows.

This matches the actual product shape:

- articles are writing-first
- reviews are submission-first

This is the recommended approach.

### 2. Articles As Content, Reviews As Form-Like Records

Treat `articles` as first-class routed content but keep `reviews` closer to the current generic form submission model.

This is simpler at first, but it conflicts with the requirement that reviews should support their own page presentation and block-based layout choices.

### 3. One Generic Entry Model

Build a unified content-entry system with a type switch for article vs review.

This reduces top-level collection count, but it forces two materially different workflows into one schema and makes both admin UX and validation less clear.

### Decision

Use two first-class collections.

## Product Contract

After this work:

- `articles` are full routed content entries with slug, SEO, preview, workflow, and a Lexical article body
- `reviews` are full routed content entries with slug, SEO, preview, workflow, and structured review fields
- reviews can be submitted publicly and stored in a non-public moderation state
- reviews can render page layouts using a shared sample block component
- admins always retain access to both collections
- non-admin access to both collections is controlled by explicit capability checkboxes

This is an admin-permissions concern, not a generic feature-flag framework.

## Collection Architecture

### Articles

`articles` should be a first-class content collection intended for editorial publishing.

It should be optimized for writing, not block composition.

Required characteristics:

- routed frontend entry
- slug-based lookup
- SEO fields
- live preview or preview URL support
- editorial workflow compatibility
- featured media and summary metadata
- one primary Lexical article body

`Articles` should not start with block-based body composition by default. The main authoring surface should be a dedicated rich article editor.

### Reviews

`reviews` should be a first-class content collection intended for moderated public-facing review content.

It should combine:

- structured review submission fields
- editorial workflow and moderation fields
- block-based presentation layout

This collection needs to serve two different but connected roles:

1. intake target for public review submission
2. publishable frontend review entry

## Field Model

### Articles Fields

The initial `articles` schema should include:

- `title`
- `slug`
- `excerpt`
- `featuredImage`
- `authorName`
- optional `publishedAtOverride`
- `body` as a Lexical `richText` field
- SEO fields aligned with existing page-level SEO behavior
- workflow fields aligned with the current editorial governance layer

The `body` field is the primary authoring surface. It is not a secondary notes area and it is not replaced by blocks.

### Reviews Fields

The initial `reviews` schema should include:

- `title`
  - CMS entry title used for admin and routing
- `slug`
- `rating`
  - required select, expected initial range `1` through `5`
- `reviewTitle`
- `reviewBody`
- `reviewerName`
- `reviewerEmail`
- `isGenuineExperience`
- `displayName`
  - optional safer public name used at publish time
- `internalModerationNotes`
- optional `featuredImage`
- optional `subjectLabel`
- SEO fields
- workflow fields
- `layout` blocks

The public-facing review display can use `displayName` when present, otherwise a moderated form of `reviewerName`.

## Review Submission Flow

### Dedicated Route

Reviews should not be forced through the generic `forms` collection.

Instead, create a dedicated public route for review intake:

- `src/app/api/reviews/submit/route.ts`

This keeps review validation, moderation behavior, and persistence rules explicit.

### Validation Rules

The public review endpoint should validate:

- `rating` required
- `reviewTitle` required
- `reviewBody` required
- `reviewerName` required
- `reviewerEmail` required and valid
- `isGenuineExperience` required if the product requirement is to enforce user attestation

### Anti-Spam

The review route should reuse the existing anti-spam utilities where practical:

- honeypot
- IP-based rate limiting

This keeps behavior consistent with the current form submission surface.

### Persistence

A valid public review submission should create a `reviews` document directly.

It should not publish automatically.

Recommended initial state:

- workflow state: `in_review`
- Payload `_status`: `draft`

This ensures the moderation step remains explicit.

### Moderation

Once submitted:

- admins or publishers review the content in Payload
- they can adjust display-safe or SEO-safe fields
- they can choose whether to publish it

The review collection is the moderation surface. A second submission shadow collection is unnecessary for the first pass.

## Sample Block Strategy

Start with one shared sample block component rather than separate article and review block systems.

Recommended block:

- `ContentSpotlight`

Suggested responsibility:

- short section title
- supporting text
- optional image
- optional CTA link

This block should be:

- available in `reviews.layout`
- generic enough to reuse later if article side layouts are introduced

`Articles` do not need block-based body composition in this pass. The shared sample block exists to satisfy flexible review layout needs without building a separate block framework.

## Admin Capability Model

Add these capabilities:

- `manage_articles`
- `publish_articles`
- `manage_reviews`
- `publish_reviews`

### Admin Behavior

`admin` continues to receive full automatic access to all capabilities, including the new ones.

Nothing about `articles` or `reviews` should ever be hidden from admins through capability checks.

### Non-Admin Behavior

Non-admin users should see explicit capability checkboxes for:

- article management
- article publishing
- review management
- review publishing

These should follow the existing governance pattern:

- editing and publishing remain separate
- access is explicit
- capability labels appear alongside the current CMS area checkboxes

### Role Defaults

Recommended role defaults:

- `publisher`
  - receives both publish capabilities
- `editor`
  - does not receive article or review capabilities by default in this pass
- `marketingOps`
  - does not need publish rights by default

Article and review access for `editor` should stay opt-in through explicit capability assignment.

## Routing And Frontend Model

### Articles Routes

Use dedicated routes:

- `src/app/(frontend)/articles/[slug]/page.tsx`

Optional listing routes can wait.

`Articles` should render through a dedicated article page component, not through the generic page block renderer.

### Reviews Routes

Use dedicated routes:

- `src/app/(frontend)/reviews/[slug]/page.tsx`

`Reviews` should render through a dedicated review page component that combines:

- structured review metadata
- review body
- optional block-based layout sections

### Shared Data Helpers

Do not overload `src/app/(frontend)/pageData.ts` with article and review routing logic.

Instead, use a separate focused helper such as:

- `src/lib/contentEntries.ts`
or
- `src/app/(frontend)/contentData.ts`

The existing `pageData.ts` is already specialized for page resolution and system-mode behavior.

## Rendering Model

### Articles Rendering

The article page component should render:

- featured image
- title
- excerpt
- byline
- publication metadata
- Lexical article body

It should read like editorial content, not like a block-composed landing page.

### Reviews Rendering

The review page component should render:

- rating
- review title
- review body
- display name
- optional subject label
- optional featured image
- `layout` blocks

The structured review content should remain primary. Blocks are supplemental presentation tools, not the review body itself.

## Payload Integration

This work requires updates to:

- collection registration in `src/payload.config.ts`
- admin capability definitions
- generated Payload types
- block rendering

No generic feature-flag framework is required for this pass.

The “always available for admins” requirement is satisfied by capability and admin visibility design, not by introducing a separate flag system.

## Testing Strategy

Add integration coverage for:

- capability wiring for articles and reviews
- article required fields and workflow compatibility
- review required fields and moderation defaults
- shared block availability in reviews
- public review submission validation
- review submission persistence into non-public workflow state

At minimum, plan for:

- `tests/int/articles.int.spec.ts`
- `tests/int/reviews.int.spec.ts`
- `tests/int/review-submission.int.spec.ts`
- extension of `tests/int/adminCapabilities.int.spec.ts`

## Scope Guardrails

This pass should not include:

- article or review listing pages unless explicitly requested later
- taxonomy system
- generalized feature-flag framework
- multiple sample blocks
- aggregate rating systems
- review replies, reactions, or threaded conversations

The goal is to land a clean first-class CMS model for articles and reviews, not to solve the full editorial platform in one step.

## Implementation Boundaries

Recommended new files:

- `src/collections/Articles.ts`
- `src/collections/Reviews.ts`
- `src/blocks/ContentSpotlight/config.ts`
- `src/blocks/ContentSpotlight/Component.tsx`
- `src/app/api/reviews/submit/route.ts`
- `src/lib/reviews.ts`
- `src/components/articles/ArticlePage.tsx`
- `src/components/reviews/ReviewPage.tsx`
- `src/app/(frontend)/articles/[slug]/page.tsx`
- `src/app/(frontend)/reviews/[slug]/page.tsx`

Recommended modified files:

- `src/access/adminCapabilities.ts`
- `src/access/editorialRoles.ts`
- `src/payload.config.ts`
- `src/blocks/renderBlocks.tsx`
- generated `src/payload-types.ts`
- relevant tests

## Sequencing

Recommended build order:

1. add capabilities and register both collections
2. implement `articles` schema and routed article page
3. implement shared sample block and `reviews.layout`
4. implement dedicated review submission route and moderation defaults
5. add integration tests and regenerate types

This order keeps the core CMS model stable before public review intake is layered on.

## Success Criteria

This work is successful when:

- admins can always see and manage articles and reviews
- non-admin users can receive explicit article/review capabilities through checkboxes
- articles support a strong Lexical-based authoring workflow
- reviews support public submission plus moderation
- reviews can render with at least one shared sample layout block
- both content types have dedicated routes, SEO, and preview-compatible structure
