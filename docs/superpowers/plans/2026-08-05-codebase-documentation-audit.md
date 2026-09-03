# Codebase Documentation Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the maintained documentation describe every active CMS surface, public route, integration, operational workflow, and page-builder block in the current codebase.

**Architecture:** Treat the Payload configuration and registered Next.js routes as the source of truth. Keep task-oriented operator guidance in `docs/guides`, deployment and maintenance procedures in `docs/operations`, and the exhaustive technical inventory in `docs/architecture`; link all three layers from the root README and operator index.

**Tech Stack:** Payload CMS 3, Next.js 16 App Router, React 19, MongoDB, Tailwind CSS 4, Vitest, Playwright, optional Resend and S3-compatible storage.

## Global Constraints

- Document only behavior registered in the current source tree.
- Preserve existing guide URLs where filenames already exist, even when their UI labels have changed.
- Use the current admin labels and groups from collection/global configs.
- Distinguish public routes, internal APIs, development-only preview routes, and Payload-generated APIs.
- Keep operator instructions free of implementation-history details from `docs/superpowers`.

---

### Task 1: Correct documentation navigation and admin vocabulary

**Files:**
- Modify: `README.md`
- Modify: `docs/guides/README.md`
- Modify: existing guides whose titles or cross-links use superseded labels
- Modify: `docs/architecture/content-model-map.md`

**Interfaces:**
- Consumes: collection/global `admin.group`, `labels`, and `label` values.
- Produces: stable navigation to every operator guide using current UI terminology.

- [ ] **Step 1: Replace the old five-group admin map**

Document the nine active groups exactly: `Content`, `Taxonomy`, `Navigation`, `Site Structure`, `Media`, `Forms`, `Settings`, `Configuration`, and `Administration`.

- [ ] **Step 2: Correct renamed operator surfaces**

Use `Topics`, `Layout Defaults`, `Site Identity`, `Appearance`, `SEO & Metadata`, `Analytics & Tracking`, `Cookie Consent Banner`, `Maintenance & Modes`, and `Audit Log` while retaining existing guide filenames.

- [ ] **Step 3: Verify navigation links**

Run:

```bash
node -e "const fs=require('fs'),p=require('path'); for(const f of fs.readdirSync('docs/guides').filter(x=>x.endsWith('.md'))){const s=fs.readFileSync(p.join('docs/guides',f),'utf8'); for(const m of s.matchAll(/\]\((\.\/[^)#]+\.md)/g)){const q=p.resolve('docs/guides',m[1]); if(!fs.existsSync(q)) throw new Error(f+' -> '+m[1])}}"
```

Expected: exit code `0` with no missing guide links.

### Task 2: Add missing operator guides

**Files:**
- Create: `docs/guides/news-events.md`
- Create: `docs/guides/news-events-settings.md`
- Create: `docs/guides/gallery-albums.md`
- Create: `docs/guides/office-locations.md`
- Create: `docs/guides/cookie-consent.md`
- Create: `docs/guides/blocks.md`
- Create: `docs/guides/trash-and-recovery.md`
- Modify: `docs/guides/media.md`
- Modify: `docs/guides/site-defaults.md`

**Interfaces:**
- Consumes: the active Payload fields, validation, access rules, frontend consumers, and hooks.
- Produces: task-based instructions for every currently undocumented admin surface and recovery feature.

- [ ] **Step 1: Document News & Events and its settings global**

Cover entry type validation, taxonomy, event dates/location/registration, featured media, live preview, workflow, archive filters/pagination, detail pages, feed, SEO, and Highlights behavior.

- [ ] **Step 2: Document media-adjacent collections**

Cover ordered Gallery Albums, explicit Event Gallery selection, Office Locations, `showContactDetails`, map fields, and the Regional Offices block.

- [ ] **Step 3: Document consent, blocks, and trash**

Cover consent styles/cookie behavior, the 39 selectable page blocks and their intended use, shared appearance controls/error boundaries, and Payload trash/restore behavior applied to all collections.

- [ ] **Step 4: Expand existing guides**

Add media storage health/reconciliation and Layout Defaults announcement/page-appearance behavior.

### Task 3: Add an exhaustive technical feature inventory

**Files:**
- Create: `docs/architecture/feature-inventory.md`

**Interfaces:**
- Consumes: `src/payload.config.ts`, all registered collections/globals, `src/app`, middleware, hooks, providers, plugins, scripts, and tests.
- Produces: one source-oriented map proving documentation coverage for the complete product.

- [ ] **Step 1: Inventory the CMS schema**

List all 20 collections and 8 globals with ownership, public exposure, drafts, and governance behavior.

- [ ] **Step 2: Inventory delivery and integration surfaces**

List public routes, feeds, dynamic Open Graph images, sitemap/robots, redirects middleware, custom APIs, Payload REST/GraphQL, analytics/consent, email, and media providers.

- [ ] **Step 3: Inventory cross-cutting behavior and tooling**

Cover capabilities, editorial workflow, queue/audit sync, taxonomy sync, link/redirect sync, cache revalidation, SEO validation, media usage/deletion/storage checks, trash, scripts, and test suites.

- [ ] **Step 4: Inventory the block system**

List all page, header, footer, and system blocks, the development-only thumbnail preview route, live-preview adapters, and reusable-section recursion protection.

### Task 4: Add operational runbooks

**Files:**
- Create: `docs/operations/runtime-and-providers.md`
- Create: `docs/operations/developer-workflows.md`
- Modify: `docs/operations/starter-clone-checklist.md`
- Modify: `docs/operations/mongodb-deployment.md`

**Interfaces:**
- Consumes: `.env.example`, runtime provider validation, package scripts, Docker files, and operational API authentication.
- Produces: reproducible setup, deployment, backup, migration, media reconciliation, thumbnail generation, code generation, and verification instructions.

- [ ] **Step 1: Document every runtime variable and supported combination**

Include MongoDB-only database support; `none`/Resend email; local/S3 media; Vercel local-disk rejection; ACL, path-style, client-upload, override-recipient, public URL, and reconciliation token behavior.

- [ ] **Step 2: Document every package script**

Explain `dev`, `devsafe`, `build`, `start`, linting, tests, Payload CLI, type/import-map generation, database export, office migration, and block-thumbnail generation including optional thumbnail environment variables.

- [ ] **Step 3: Document operational endpoints safely**

Describe authorization and expected result fields for media reconciliation without publishing secrets.

### Task 5: Validate documentation against source

**Files:**
- Modify: `tests/int/admin-documentation.int.spec.ts`
- Modify: `tests/int/admin-information-architecture.int.spec.ts`

**Interfaces:**
- Consumes: the final guide index and current config labels/groups.
- Produces: regression checks that fail when operator navigation or vocabulary drifts again.

- [ ] **Step 1: Update documentation vocabulary assertions**

Assert current groups, current renamed surfaces, and links for all newly documented admin features.

- [ ] **Step 2: Run focused documentation tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/admin-documentation.int.spec.ts tests/int/admin-information-architecture.int.spec.ts
```

Expected: both files pass.

- [ ] **Step 3: Run static validation**

Run:

```bash
pnpm lint
pnpm test:int
```

Expected: lint and integration tests pass, or any unrelated pre-existing failure is reported with its exact test name.

- [ ] **Step 4: Review the final diff**

Confirm that every registered collection, global, route, API, block surface, integration, plugin, and package script appears in at least one maintained documentation page.
