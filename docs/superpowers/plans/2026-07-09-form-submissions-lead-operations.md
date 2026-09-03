# Form Submissions Lead Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `form-submissions` into a consistent lead-operations surface for all forms while preserving review promotion and generic form behavior.

**Architecture:** Replace the narrower submission typing with `submissionIntent`, enrich `form-submissions` with operator workflow fields and optional source metadata, and update the generic forms route plus event seam to persist and emit the richer model. Keep one submission collection and one public intake route.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, Vitest

## Global Constraints

- Keep one public intake path: `POST /api/forms/[slug]/submit`
- Keep `form-submissions` as the single inbound collection for all forms
- Use one common operations model for `general`, `lead`, and `review`
- Keep assignment manual only in this phase
- Preserve review promotion behavior and non-review form behavior

---

### Task 1: Intent And Operations Schema

**Files:**
- Modify: `src/collections/Forms.ts`
- Modify: `src/collections/FormSubmissions.ts`
- Modify: `src/lib/forms.ts`
- Create: `src/hooks/updateFormSubmissionActivity.ts`

**Interfaces:**
- Consumes: existing form and submission collections
- Produces: `formSubmissionIntentOptions`, `normalizeFormSubmissionIntent(...)`, `normalizeSubmissionMetadata(...)`, `updateFormSubmissionActivity`

- [ ] Add `submissionIntent` to forms and common ops fields to form submissions
- [ ] Expand status options and read-only/editable boundaries
- [ ] Add a focused hook that stamps `lastActionAt` when operators change status, owner, or notes

### Task 2: Route And Event Enrichment

**Files:**
- Modify: `src/app/api/forms/[slug]/submit/route.ts`
- Modify: `src/lib/formSubmissionEvents.ts`
- Modify: `src/lib/reviewPromotion.ts`

**Interfaces:**
- Consumes: intent normalization, metadata normalization, review promotion helper
- Produces: richer persisted submission records and richer submission event payloads

- [ ] Accept optional submission metadata payload keys
- [ ] Persist `source`, `campaign`, and `landingPage` when provided
- [ ] Emit event payloads with submission intent, status, owner, and metadata

### Task 3: Verification And Artifact Refresh

**Files:**
- Modify: `tests/int/forms-submission.int.spec.ts`
- Modify: `tests/int/review-submission.int.spec.ts`
- Modify: `tests/int/api.int.spec.ts` only if needed for schema stability
- Modify: `src/payload-types.ts`
- Modify: `src/app/(payload)/admin/importMap.js` if Payload regenerates it

**Interfaces:**
- Consumes: updated route and collections
- Produces: regression coverage for general, lead, and review submissions plus updated generated types

- [ ] Update tests for intent, metadata capture, and richer event payloads
- [ ] Regenerate Payload artifacts
- [ ] Run targeted and full integration suites
