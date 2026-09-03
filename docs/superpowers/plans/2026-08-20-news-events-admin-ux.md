# News & Events Admin UX Implementation Plan

> **For agentic workers:** Execute inline with the repository project-context and Payload instructions. Do not stage or commit.

**Goal:** Reorganize News & Events Admin navigation and reduce its entry form from six tabs to four without changing stored data or public behavior.

**Architecture:** Change only Payload Admin metadata and field containers. Existing top-level field names stay unchanged while Presentation fields and topical taxonomy fields move into Content.

**Tech Stack:** Payload CMS, TypeScript, Vitest.

## Global Constraints

- Preserve SEO and Workflow field definitions exactly.
- Preserve all existing field names and top-level data paths.
- Do not change frontend consumers, hooks, access, or queries.
- Do not stage or commit.

---

### Task 1: Lock the Admin contract with tests

**Files:**

- Modify: `tests/int/news-events-collection.int.spec.ts`
- Modify: `tests/int/news-event-classifications.int.spec.ts`
- Modify: `tests/int/admin-information-architecture.int.spec.ts`

- [ ] Assert the four-tab order: Content, Event Details, SEO, Workflow.
- [ ] Assert Presentation and topical fields remain top-level descendants of Content.
- [ ] Assert Topics & Tags is collapsed initially.
- [ ] Assert the collection, classifications, and detail template use the News & Events group and shortened labels.
- [ ] Run the focused tests and confirm they fail against the current six-tab/content-group schema.

### Task 2: Reorganize Payload Admin configuration

**Files:**

- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/collections/NewsEventClassifications.ts`
- Modify: `src/globals/NewsEventsDetailTemplate.ts`

- [ ] Set the three Admin resources to `group: 'News & Events'`.
- [ ] Shorten classification and detail-template labels within the dedicated group.
- [ ] Move featured image and position into Content.
- [ ] Move Primary Topic, Tags, and Additional Topics into a collapsed Topics & Tags collapsible in Content.
- [ ] Remove the redundant Classification and Presentation tabs.
- [ ] Replace Event Start with `_status` in default list columns.
- [ ] Leave Event Details, SEO, Workflow, hooks, access, and field names unchanged.

### Task 3: Synchronize generated knowledge and verify

**Files:**

- Modify: `src/payload-types.ts` only if type generation produces a semantic change.
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: generated project-context inventory only when the update command changes it.

- [ ] Run `pnpm generate:types`.
- [ ] Run focused Admin and collection tests.
- [ ] Run targeted ESLint, Prettier, TypeScript, and `git diff --check`.
- [ ] Run `pnpm project-context:update`, inspect the final diff, update the Payload model navigation description, and run `pnpm project-context:check`.
