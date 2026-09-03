# Review Intake Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route public review submissions through the generic forms system while automatically creating linked draft review content for moderation and publishing.

**Architecture:** Add an explicit review intake type to forms, enrich form submissions with operator-facing metadata and review linkage, and move review promotion into the generic forms submit route. Keep `reviews` as the public content collection and `form-submissions` as the immutable intake record.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, Vitest

## Global Constraints

- Keep one public intake path: `POST /api/forms/[slug]/submit`
- Treat `form-submissions` as immutable intake data, not editable content
- Keep `reviews` as the only publishable public review source
- Promotion must create or update one linked review, not duplicates
- Generic non-review forms must keep their current behavior

---

### Task 1: Schema And Helper Boundaries

**Files:**
- Modify: `src/collections/Forms.ts`
- Modify: `src/collections/FormSubmissions.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/lib/reviews.ts`
- Create: `src/lib/reviewPromotion.ts`

**Interfaces:**
- Consumes: existing form validation and review validation helpers
- Produces: `isReviewFormSubmissionType(...)`, `getSubmissionContactMetadata(...)`, `upsertReviewFromSubmission(...)`

- [ ] Add explicit `submissionType` to forms with default `general`
- [ ] Add submission metadata and bidirectional review linkage fields
- [ ] Extract review-promotion mapping into a focused helper module

### Task 2: Route Refactor

**Files:**
- Modify: `src/app/api/forms/[slug]/submit/route.ts`
- Delete: `src/app/api/reviews/submit/route.ts`

**Interfaces:**
- Consumes: form config, normalized submission data, review-promotion helper
- Produces: generic form route that can promote review submissions

- [ ] Keep generic form submission behavior for normal forms
- [ ] Add review-only validation and promotion inside the generic route
- [ ] Persist operator-facing submission metadata and failure notes

### Task 3: Verification

**Files:**
- Modify: `tests/int/forms-submission.int.spec.ts`
- Modify: `tests/int/reviews.int.spec.ts`
- Modify: `tests/int/review-submission.int.spec.ts`
- Modify: `src/payload-types.ts`
- Modify: `src/app/(payload)/admin/importMap.js`

**Interfaces:**
- Consumes: updated collections and route behavior
- Produces: regression coverage for generic forms and review promotion

- [ ] Rewrite route tests to assert review promotion through the generic forms endpoint
- [ ] Extend collection tests for new linkage fields
- [ ] Regenerate Payload artifacts and run targeted Vitest suites
