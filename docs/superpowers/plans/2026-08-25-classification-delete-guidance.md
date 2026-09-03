# Classification Delete Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep required News & Events classification relationships safe while telling editors exactly what must be changed before deletion.

**Architecture:** Enrich the existing bounded reference detector with a human-readable title. Format a public 409 error from that reference rather than cascading writes. The News & Events relationship schema remains required and active-only for new selections.

**Tech Stack:** Payload CMS 3, TypeScript, Vitest.

## Global Constraints

- Do not automatically detach or reassign relationships.
- Preserve request threading, draft scans, trash exclusion, and guarded hard-delete behavior.
- Do not stage or commit.

---

### Task 1: Return an actionable reference description

**Files:**

- Modify: `tests/int/news-event-classifications.int.spec.ts`
- Modify: `src/hooks/newsEventClassificationReferences.ts`
- Modify: `src/hooks/preventReferencedNewsEventClassificationDelete.ts`

**Interfaces:**

- Consumes: `findNewsEventClassificationReference({ classificationID, req })`.
- Produces: `{ collection, id, title? }` and an editor-facing 409 message naming the resource and reference.

- [x] Add tests for News & Events, Page, Reusable Section, Calendar, and detail-template reference messages plus the unused delete path.
- [x] Run `pnpm exec vitest run tests/int/news-event-classifications.int.spec.ts --reporter=dot` and verify the new message assertions fail.
- [x] Capture a safe title from referenced documents and add a resource-label formatter.
- [x] Throw a public 409 explaining that the editor must remove or replace the named reference, then retry; mention archiving as the safe alternative.
- [x] Run the focused test and verify it passes.

### Task 2: Verify the relationship contract and maintained knowledge

**Files:**

- Modify: `tests/int/news-events-collection.int.spec.ts` only if the existing required-relationship contract needs clearer coverage.
- Modify: `.agents/skills/project-context/references/payload-model.md`

**Interfaces:**

- Consumes: the required `classification` relationship in `NewsEvents`.
- Produces: maintained documentation for reference-aware guarded deletion.

- [x] Verify the existing schema test proves active classifications are selectable and classification is required.
- [x] Update the Payload model narrative to describe actionable reference guidance.
- [x] Run focused tests, TypeScript, formatting checks, `pnpm project-context:update`, and `pnpm project-context:check`.
