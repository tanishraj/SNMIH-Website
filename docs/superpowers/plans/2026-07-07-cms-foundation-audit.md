# CMS Foundation Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a project-specific CMS foundation audit for this Payload starter that includes a prioritized gap audit, a target-state definition, and a phased roadmap for making the repo a strong client-copyable marketing CMS starter.

**Architecture:** This is a documentation-first implementation. The worker will inspect the existing Payload collections, globals, hooks, frontend data flow, setup files, and tests, then synthesize those findings into a single audit report under `docs/superpowers/reviews/`. The report must stay grounded in real code evidence and explicitly exclude block-library expansion.

**Tech Stack:** Markdown documentation, Payload CMS, Next.js App Router, TypeScript, Vitest, repo-local specs in `docs/superpowers/specs/`

## Global Constraints

- The review explicitly excludes block expansion.
- Blocks will be added after the system foundation is stable, safe for editors, and strong enough for production handoff.
- The target is one strong starter that gets copied.
- The target is one deployment and one dataset per client site.
- The assessment must not drift into speculative multi-tenant platform work.
- The final output should have three parts: `Prioritized gap audit`, `Target-state definition`, and `Phased roadmap`.
- Each finding must include severity, category, current-state evidence, why it matters, and a recommended direction.
- The assessment must not include block library breadth, visual design polish, landing page creativity, speculative multi-tenant architecture, or unrelated frontend component expansion.

---

## File Structure

- Create: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Modify: `docs/superpowers/plans/2026-07-07-cms-foundation-audit.md`
- Reference: `docs/superpowers/specs/2026-07-07-cms-foundation-audit-design.md`
- Reference: `README.md`
- Reference: `src/payload.config.ts`
- Reference: `src/access/adminCapabilities.ts`
- Reference: `src/collections/Users.ts`
- Reference: `src/collections/Pages.ts`
- Reference: `src/collections/SystemPages.ts`
- Reference: `src/collections/NavigationLinks.ts`
- Reference: `src/collections/Forms.ts`
- Reference: `src/collections/FormSubmissions.ts`
- Reference: `src/globals/PageSettings.ts`
- Reference: `src/globals/SEOSettings.ts`
- Reference: `src/app/(frontend)/pageData.ts`
- Reference: `src/app/api/forms/[slug]/submit/route.ts`
- Reference: `src/lib/forms.ts`
- Reference: `tests/int/api.int.spec.ts`

### Task 1: Scaffold The Audit Report

**Files:**
- Create: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Test: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-07-cms-foundation-audit-design.md`
- Produces: a review document with these exact top-level sections:
  - `# CMS Foundation Audit`
  - `## Executive Summary`
  - `## Audit Scope`
  - `## Current Strengths`
  - `## Prioritized Gap Audit`
  - `## Target State`
  - `## Phased Roadmap`
  - `## Appendix: Evidence Base`

- [ ] **Step 1: Create the report skeleton**

```md
# CMS Foundation Audit

## Executive Summary

## Audit Scope

### In Scope

### Out of Scope

## Current Strengths

## Prioritized Gap Audit

### Platform Foundation

### Content Architecture

### Editorial Workflows

### Marketing Operations

### Starter-Kit Reusability

## Target State

## Phased Roadmap

### Phase 1: Foundation And Safety

### Phase 2: Operational CMS Gaps

### Phase 3: Reusability And Handoff

### Phase 4: Block Expansion Readiness

## Appendix: Evidence Base
```

- [ ] **Step 2: Save the file and verify the headings exist**

Run: `rg -n '^#|^##|^###' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

Expected:
- one `# CMS Foundation Audit`
- the exact `##` sections listed above
- the exact four roadmap `###` phases

- [ ] **Step 3: Add scope text from the approved spec**

```md
## Audit Scope

### In Scope

- judging this repo as a single-site marketing CMS starter that should be copied for future client projects
- evaluating platform foundation, content architecture, editorial workflows, marketing operations, and starter-kit reusability
- identifying current strengths, gaps, risks, and sequencing

### Out of Scope

- block library breadth
- visual design polish
- landing page creativity
- speculative multi-tenant architecture
- unrelated frontend component expansion
```

- [ ] **Step 4: Verify scope language matches the spec**

Run: `rg -n 'block library breadth|single-site marketing CMS starter|speculative multi-tenant architecture' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md docs/superpowers/specs/2026-07-07-cms-foundation-audit-design.md`

Expected: matching wording appears in both files.

- [ ] **Step 5: Add the canonical finding template under `## Prioritized Gap Audit`**

```md
Use this exact structure for every finding:

- **Critical** — Short finding statement.
  - Category: Platform Foundation
  - Evidence: `exact/file.ts` plus the concrete behavior it demonstrates
  - Why it matters: one sentence tying the problem to starter reliability, editor safety, or client reuse
  - Recommended direction: one sentence describing the correction without implementation detail
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
git commit -m "docs(audit): scaffold cms foundation review"
```

### Task 2: Write Platform And Content Findings

**Files:**
- Modify: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Test: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

**Interfaces:**
- Consumes: `README.md`, `src/payload.config.ts`, `src/collections/Pages.ts`, `src/collections/SystemPages.ts`, `src/collections/NavigationLinks.ts`, `src/globals/PageSettings.ts`, `tests/int/api.int.spec.ts`
- Produces:
  - `## Current Strengths` with 5-8 bullets
  - `### Platform Foundation` findings
  - `### Content Architecture` findings
  - `## Appendix: Evidence Base` entries citing the inspected files

- [ ] **Step 1: Inspect setup, configuration, and schema boundary files**

Run:

```bash
sed -n '1,220p' README.md
sed -n '1,220p' src/payload.config.ts
sed -n '1,260p' src/collections/Pages.ts
sed -n '1,220p' src/collections/SystemPages.ts
sed -n '1,220p' src/collections/NavigationLinks.ts
sed -n '1,260p' src/globals/PageSettings.ts
sed -n '1,200p' tests/int/api.int.spec.ts
```

Expected: evidence for current capabilities, setup assumptions, and test posture.

- [ ] **Step 2: Add concrete current strengths**

```md
## Current Strengths

- The repo already models core marketing-site concepts such as pages, redirects, navigation links, forms, system pages, headers, footers, and site-wide settings.
- `src/app/(frontend)/pageData.ts` centralizes frontend content resolution instead of scattering Payload access across route files.
- `src/globals/PageSettings.ts` provides a workable system-defaults surface for homepage, header, footer, and system-mode behavior.
- `src/collections/SystemPages.ts` and related hooks already treat maintenance, coming soon, and 404 behavior as managed CMS content instead of hardcoded templates.
- Navigation synchronization and redirect support indicate the starter is already solving real CMS integrity problems, not only rendering static pages.
- Form submission handling already includes validation, honeypot detection, rate limiting, and email notification hooks.
```

- [ ] **Step 3: Add Platform Foundation findings with severity labels**

```md
### Platform Foundation

- **Important** — The starter still reads like a modified template rather than a productized starter.
  - Category: Platform Foundation
  - Evidence: `README.md` still documents the base template more than the actual CMS feature set and clone workflow.
  - Why it matters: a client starter fails quickly when setup and operational expectations live only in code.
  - Recommended direction: rewrite setup and handoff docs around the real CMS capabilities and clone path.
```

- [ ] **Step 4: Add Content Architecture findings with severity labels**

```md
### Content Architecture

- **Important** — The current schema already covers real marketing-site entities, which is a good base.
  - Category: Content Architecture
  - Evidence: `src/collections/Pages.ts`, `src/collections/SystemPages.ts`, `src/collections/NavigationLinks.ts`, and `src/globals/PageSettings.ts` already define the core site model.
  - Why it matters: the audit must distinguish between missing capability and capability that already exists but needs stronger conventions.
  - Recommended direction: evaluate where the current boundaries are reusable versus too tailored to this specific starter state.
```

- [ ] **Step 5: Add appendix evidence entries for these sections and commit**

```md
## Appendix: Evidence Base

- `README.md` — setup and deployment narrative still reflects the base template more than the current CMS feature set.
- `src/payload.config.ts` — confirms collection/global registration and current provider coupling.
- `src/collections/Pages.ts` — shows the core marketing page model, preview settings, publishing hooks, and SEO ownership.
- `src/collections/SystemPages.ts` — shows the current treatment of system-mode content as managed CMS entities.
- `src/collections/NavigationLinks.ts` — shows the reusable link model and page-sync design direction.
- `src/globals/PageSettings.ts` — shows how site-wide defaults and system behaviors are currently owned.
- `tests/int/api.int.spec.ts` — shows the current minimal test baseline.
```

Run: `rg -n 'Platform Foundation|Content Architecture|Evidence Base|Critical|Important|Nice-to-have' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

Expected: the new sections and severity markers are present.

```bash
git add docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
git commit -m "docs(audit): add foundation and content findings"
```

### Task 3: Write Editorial And Marketing Findings

**Files:**
- Modify: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Test: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

**Interfaces:**
- Consumes: `src/access/adminCapabilities.ts`, `src/collections/Users.ts`, `src/globals/PageSettings.ts`, `src/app/(frontend)/pageData.ts`, `src/collections/Forms.ts`, `src/collections/FormSubmissions.ts`, `src/app/api/forms/[slug]/submit/route.ts`, `src/lib/forms.ts`
- Produces:
  - `### Editorial Workflows` findings
  - `### Marketing Operations` findings
  - appended evidence entries for permissions, preview/system behavior, and forms

- [ ] **Step 1: Inspect editor workflow and marketing-operation files**

Run:

```bash
sed -n '1,260p' src/access/adminCapabilities.ts
sed -n '1,240p' src/collections/Users.ts
sed -n '1,260p' src/app/'(frontend)'/pageData.ts
sed -n '1,260p' src/collections/Forms.ts
sed -n '1,220p' src/collections/FormSubmissions.ts
sed -n '1,240p' src/app/api/forms/'[slug]'/submit/route.ts
sed -n '1,220p' src/lib/forms.ts
```

Expected: evidence for access control, publishing behavior, preview/system-mode flow, and lead capture handling.

- [ ] **Step 2: Add Editorial Workflows findings**

```md
### Editorial Workflows

- **Important** — Capability-based access is a strong start, but the starter needs validation that the current role and capability model is sufficient for real client editorial teams.
  - Category: Editorial Workflows
  - Evidence: `src/access/adminCapabilities.ts` and `src/collections/Users.ts` implement capability-driven access and per-area admin visibility.
  - Why it matters: a starter intended for client reuse needs roles that map cleanly to real operating teams, not only a developer-admin workflow.
  - Recommended direction: assess whether the current role/capability split is enough for administrators, marketers, and content editors without custom code.
```

- [ ] **Step 3: Add Marketing Operations findings**

```md
### Marketing Operations

- **Important** — SEO ownership exists across pages and SEO settings, but the audit should determine whether defaults, overrides, and operational guidance are complete enough for marketers.
  - Category: Marketing Operations
  - Evidence: `src/collections/Pages.ts`, `src/globals/SEOSettings.ts`, and `src/app/(frontend)/pageData.ts` already own metadata construction and settings.
  - Why it matters: a marketing CMS starter must support SEO operations as a first-class workflow, not only as a developer-maintained data shape.
  - Recommended direction: judge completeness from an operator perspective, especially around defaults, override clarity, and missing integrations.
```

- [ ] **Step 4: Extend the appendix with editorial and operations evidence**

```md
- `src/access/adminCapabilities.ts` — shows the current capability map and access helpers.
- `src/collections/Users.ts` — shows the admin user model, role normalization, and capability storage.
- `src/app/(frontend)/pageData.ts` — shows draft/published resolution, metadata construction, and system-mode bypass logic.
- `src/collections/Forms.ts` — shows the current form-definition model available to editors.
- `src/collections/FormSubmissions.ts` — shows how lead data is stored and exposed.
- `src/app/api/forms/[slug]/submit/route.ts` — shows the public submission flow, throttling, and notification dispatch.
- `src/lib/forms.ts` — shows field-definition validation and submission normalization rules.
```

- [ ] **Step 5: Verify the report now covers all five audit categories touched so far and commit**

Run: `rg -n '^### ' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

Expected:
- `### Platform Foundation`
- `### Content Architecture`
- `### Editorial Workflows`
- `### Marketing Operations`

```bash
git add docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
git commit -m "docs(audit): add editorial and marketing findings"
```

### Task 4: Write Reusability, Target State, And Roadmap

**Files:**
- Modify: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Test: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

**Interfaces:**
- Consumes: all prior findings and the approved spec’s ordering principle
- Produces:
  - `### Starter-Kit Reusability` findings
  - `## Target State`
  - `## Phased Roadmap`
  - a complete audit document ready for final polish

- [ ] **Step 1: Add Starter-Kit Reusability findings**

```md
### Starter-Kit Reusability

- **Critical** — The starter still needs a sharper boundary between reusable CMS core and client-specific assumptions.
  - Category: Starter-Kit Reusability
  - Evidence: setup docs, provider configuration, and operational assumptions currently span `README.md`, `src/payload.config.ts`, and multiple CMS settings surfaces.
  - Why it matters: cloning should create leverage, not a hidden-assumption cleanup project.
  - Recommended direction: document and then tighten the seams between starter core, provider choices, and client-specific customization.
```

- [ ] **Step 2: Add a target-state section**

```md
## Target State

The target state is a single-site Payload starter that a developer can clone for a new client project without reverse-engineering the platform. Editors should be able to manage pages, system states, navigation, redirects, SEO defaults, and forms safely through the admin. Operational integrations such as storage, email, and deployment should be portable and documented. The repo should include enough verification and handoff guidance that future client-specific customization starts from a stable CMS core instead of a fragile template fork.
```

- [ ] **Step 3: Add the phased roadmap**

```md
## Phased Roadmap

### Phase 1: Foundation And Safety

- strengthen setup, environment, and provider documentation
- define explicit portability boundaries for database, storage, and email
- raise the test baseline around content resolution, permissions, forms, and publishing behavior
- remove hidden assumptions that make cloning fragile

### Phase 2: Operational CMS Gaps

- tighten editor workflows around permissions, preview, publishing, and system modes
- close gaps in SEO and lead-handling operations
- improve admin clarity where workflows depend too much on developer knowledge

### Phase 3: Reusability And Handoff

- formalize extension seams for future client-specific content types and integrations
- document starter conventions and client customization boundaries
- make handoff quality part of the starter standard rather than an afterthought

### Phase 4: Block Expansion Readiness

- expand block inventory only after the CMS foundation is safe, documented, and operationally complete
```

- [ ] **Step 4: Verify all mandated deliverable parts exist**

Run: `rg -n '^## (Prioritized Gap Audit|Target State|Phased Roadmap)$|^### Starter-Kit Reusability$' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

Expected:
- one `## Prioritized Gap Audit`
- one `## Target State`
- one `## Phased Roadmap`
- one `### Starter-Kit Reusability`

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
git commit -m "docs(audit): add roadmap and target state"
```

### Task 5: Final Consistency Review And Publish

**Files:**
- Modify: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`
- Modify: `docs/superpowers/plans/2026-07-07-cms-foundation-audit.md`
- Test: `docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md`

**Interfaces:**
- Consumes: the completed audit report
- Produces: a final review document with consistent severity labels, complete evidence, and no scope drift

- [ ] **Step 1: Run the spec-coverage check**

Run:

```bash
rg -n 'Platform Foundation|Content Architecture|Editorial Workflows|Marketing Operations|Starter-Kit Reusability|Target State|Phased Roadmap' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
```

Expected: every required section appears exactly once in the finished report.

- [ ] **Step 2: Run the placeholder and ambiguity scan**

Run:

```bash
rg -n 'TODO|TBD|FIXME|placeholder|something|stuff|etc\\.' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
```

Expected: no matches.

- [ ] **Step 3: Normalize severity labels and evidence phrasing**

Apply these rules throughout the document:

```md
- Every finding begins with `**Critical**`, `**Important**`, or `**Nice-to-have**`.
- Every finding ties to a concrete repo behavior, file, or workflow.
- Every recommendation stays directional and avoids implementation detail.
```

- [ ] **Step 4: Verify the final audit reads as a starter evaluation, not a feature brainstorm**

Run:

```bash
rg -n 'multi-tenant|visual design|landing page creativity|block library breadth' docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
```

Expected:
- the out-of-scope section may mention these terms
- findings and roadmap sections should not drift into implementing them

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/reviews/2026-07-07-cms-foundation-audit.md
git commit -m "docs(audit): finalize cms foundation review"
```
