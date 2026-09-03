# CMS Foundation Audit

## Executive Summary

This repo is already a credible marketing-site CMS foundation rather than a blank Payload install. It has real content primitives, centralized frontend resolution, managed system pages, SEO defaults, redirects, and a safer-than-basic forms pipeline. The main weakness is not missing core CMS concepts, but the gap between a capable internal starter and a productized client-copyable starter.

The highest-priority work is to harden platform portability, clarify starter versus client-specific boundaries, raise the test baseline around actual CMS behaviors, and tighten editorial and operational guardrails. Block expansion should wait until the foundation is easier to clone, safer to operate, and better documented for client handoff.

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

## Current Strengths

- The repo already models core marketing-site concepts such as pages, redirects, navigation links, forms, form submissions, system pages, headers, footers, and site-wide settings.
- `src/payload.config.ts` registers a coherent CMS surface instead of a bare Payload install, including content collections, site globals, a rich-text editor, email integration, and a trash workflow plugin.
- `src/app/(frontend)/pageData.ts` centralizes frontend content resolution instead of scattering Payload access across route files, including homepage lookup, published-page resolution, and system-mode checks.
- `src/globals/PageSettings.ts` provides a workable system-defaults surface for homepage, header, footer, and system-mode behavior, with validation around published references.
- `src/collections/SystemPages.ts` treats maintenance, coming soon, and 404 behavior as managed CMS content instead of hardcoded templates, with type-aware layout validation.
- `src/collections/NavigationLinks.ts` already separates reusable destinations from page layout content, which is the right direction for menus, CTAs, and synced page links.
- Page publishing, live preview, redirect generation, and navigation synchronization already exist in the core page model, which means the starter is solving real CMS integrity problems rather than only rendering static pages.
- The repo has an automated test entry point under `tests/int/api.int.spec.ts`, which gives the starter at least a foothold for future behavioral coverage.

## Prioritized Gap Audit

### Platform Foundation

- **Important** — The starter still reads like a modified Payload template rather than a productized client-copyable starter.
  - Category: Platform Foundation
  - Evidence: `README.md` still presents the repo as "Payload Blank Template", describes generic template setup, and does not document the actual CMS feature set or client clone workflow.
  - Why it matters: a starter stops being reusable when setup, operating assumptions, and handoff guidance live only in code.
  - Recommended direction: rewrite the README and onboarding docs around the real CMS capabilities, environment requirements, and expected clone path for new client sites.
- **Important** — Infrastructure choices are still coupled directly into the core Payload config.
  - Category: Platform Foundation
  - Evidence: `src/payload.config.ts` hard-wires `sqliteAdapter`, configures `resendAdapter` inline, and throws in production when Resend variables are missing.
  - Why it matters: copying the starter to a new client should not require editing core config just to adapt storage, database, or email provider assumptions.
  - Recommended direction: move provider assumptions behind documented environment conventions and clear extension seams so deployments can vary without restructuring the CMS core.
- **Important** — The current test baseline is too thin for a starter that aims to be production-safe and reusable.
  - Category: Platform Foundation
  - Evidence: `tests/int/api.int.spec.ts` only verifies that the `users` collection can be fetched and does not cover page resolution, publishing rules, system pages, or starter-specific workflows.
  - Why it matters: a copied starter needs regression protection around its platform behaviors, not only proof that Payload boots.
  - Recommended direction: expand tests around the starter's real CMS contracts, especially route resolution, settings validation, and publishing guardrails.

### Content Architecture

- **Important** — The current schema already covers real marketing-site entities, which is a strong foundation rather than an empty starter.
  - Category: Content Architecture
  - Evidence: `src/collections/Pages.ts`, `src/collections/SystemPages.ts`, `src/collections/NavigationLinks.ts`, and `src/globals/PageSettings.ts` define core page, system-page, navigation, and site-default models.
  - Why it matters: the audit needs to preserve and refine existing capability instead of treating the starter as if the core CMS model is still missing.
  - Recommended direction: keep these entities as the backbone of the starter and tighten the conventions around how future client sites extend them.
- **Important** — Page behavior ownership is powerful but concentrated, which will make the starter harder to reason about as it gets copied and extended.
  - Category: Content Architecture
  - Evidence: `src/collections/Pages.ts` owns hierarchy validation, preview URLs, SEO fields, publishing hooks, redirect generation, and navigation sync behavior inside a single collection definition.
  - Why it matters: when too many site concerns converge in one content type, future client projects inherit complexity without a clear extension model.
  - Recommended direction: keep the page collection as the content hub, but document and progressively separate cross-cutting responsibilities into clearer starter conventions.
- **Important** — Site structure is modeled across collections and globals, but the starter does not yet explain those ownership boundaries explicitly.
  - Category: Content Architecture
  - Evidence: `src/globals/PageSettings.ts` decides the active homepage, header, footer, and system overrides while `src/collections/SystemPages.ts` and `src/collections/NavigationLinks.ts` define the reusable content those globals point at.
  - Why it matters: editors and developers cloning the starter need to know where structure lives, or they will create duplicate patterns and misplace content.
  - Recommended direction: formalize the content model map so page content, reusable navigation entities, and site-wide defaults have obvious ownership rules.

### Editorial Workflows

- **Important** — Capability-based access is a strong start, but the starter still needs validation that the current role and capability model is sufficient for real client editorial teams.
  - Category: Editorial Workflows
  - Evidence: `src/access/adminCapabilities.ts` and `src/collections/Users.ts` implement capability-driven access, per-area admin visibility, role normalization, and automatic full-access handling for admin users.
  - Why it matters: a starter intended for client reuse needs roles that map cleanly to administrators, marketers, and content editors rather than only a developer-admin workflow.
  - Recommended direction: assess whether the current role and capability split is enough for common client team structures without requiring custom authorization code on every project.
- **Important** — System-mode bypass behavior is broader than the admin-facing language suggests.
  - Category: Editorial Workflows
  - Evidence: `src/globals/PageSettings.ts` labels `bypassForLoggedInAdmins` as an admin-only bypass, but `src/app/(frontend)/pageData.ts` bypasses maintenance and coming-soon modes for any authenticated user returned by `payload.auth`, not only users with the `admin` role.
  - Why it matters: public-site safety is weakened if lower-privilege CMS users can see the normal site while operators believe the bypass is restricted to administrators.
  - Recommended direction: align the bypass rule with an explicit admin role or dedicated capability and make the CMS wording match the actual access behavior.
- **Important** — The permission model is surface-based, but it does not yet separate lower-risk editing from higher-risk publishing and system-control actions.
  - Category: Editorial Workflows
  - Evidence: `src/access/adminCapabilities.ts` defines area capabilities such as `manage_pages`, `manage_system_pages`, and `manage_page_settings`, while `src/collections/Users.ts` stores those capabilities without introducing distinct approval, publish, or system-override workflow roles.
  - Why it matters: reusable client starters often need cleaner separation of duties so content editors can work safely without inheriting every operational responsibility.
  - Recommended direction: decide whether the starter intentionally targets small teams only or should add workflow-sensitive capability boundaries for publishing, system modes, and lead-data access.

### Marketing Operations

- **Important** — SEO ownership exists across page content, global defaults, and frontend metadata assembly, but the starter still needs an operator-level completeness review.
  - Category: Marketing Operations
  - Evidence: `src/globals/SEOSettings.ts` defines default SEO values, while `src/app/(frontend)/pageData.ts` composes canonical URLs, Open Graph data, robots rules, and metadata fallbacks from page and global settings.
  - Why it matters: a marketing CMS starter must support SEO operations as a first-class workflow, not only as a developer-maintained schema.
  - Recommended direction: judge the SEO surface from a marketer perspective, especially around default clarity, override rules, and integration expectations.
- **Important** — The form pipeline is operationally safer than a basic contact form starter, but lead handling is still too thin for a reusable marketing CMS foundation.
  - Category: Marketing Operations
  - Evidence: `src/collections/Forms.ts` supports reusable published form definitions, `src/app/api/forms/[slug]/submit/route.ts` validates payloads, applies honeypot and rate limiting, stores submissions, and sends notifications, while `src/collections/FormSubmissions.ts` persists only a form reference and raw submitted JSON.
  - Why it matters: client teams need more than successful submission capture; they need lead records that are understandable, reviewable, and extensible without redesigning the starter.
  - Recommended direction: define a starter-level lead handling model that keeps the current safe submission pipeline but adds clearer operational structure for follow-up and reporting.
- **Important** — Submission processing is portable at the validation layer, but downstream marketing integrations are still effectively email-only.
  - Category: Marketing Operations
  - Evidence: `src/lib/forms.ts` normalizes and validates field definitions and submission values, while `src/app/api/forms/[slug]/submit/route.ts` ends the workflow by storing data and calling `payload.sendEmail` for internal notifications.
  - Why it matters: copied starters should expose a clear post-submission extension seam for CRM, automation, or analytics workflows instead of forcing every client project to rework the same endpoint.
  - Recommended direction: formalize the submission handoff boundary so email notifications remain supported but are not the only operational path.

### Starter-Kit Reusability

- **Critical** — The starter still needs a sharper boundary between reusable CMS core and client-specific assumptions.
  - Category: Starter-Kit Reusability
  - Evidence: setup docs, provider configuration, and operational assumptions currently span `README.md`, `src/payload.config.ts`, `src/globals/SiteSettings.ts`, and `src/globals/ThemeSettings.ts`.
  - Why it matters: cloning should create leverage, not a hidden-assumption cleanup project.
  - Recommended direction: document and then tighten the seams between starter core, provider choices, and client-specific customization.
- **Important** — Brand and presentation defaults are modeled as first-class globals, but the starter does not yet separate portable CMS structure from example client choices cleanly enough.
  - Category: Starter-Kit Reusability
  - Evidence: `src/globals/SiteSettings.ts` stores contact, branding, and social details directly in the starter, while `src/globals/ThemeSettings.ts` ships opinionated presets such as `default`, `blue`, and `sera`.
  - Why it matters: copied starters should let developers replace client identity quickly without first auditing which settings are universal starter primitives versus sample project assumptions.
  - Recommended direction: define which settings are part of the reusable CMS contract and which are example starter defaults intended to be replaced per client.
- **Important** — The repo exposes strong site-structure primitives, but extension seams for future client customization are still implicit rather than documented as starter conventions.
  - Category: Starter-Kit Reusability
  - Evidence: `src/payload.config.ts` wires concrete collections and globals directly, and `README.md` does not explain which content models, settings surfaces, or integrations are safe to extend versus foundational to the starter.
  - Why it matters: without explicit extension rules, each cloned project is likely to fork core patterns inconsistently and increase upgrade cost.
  - Recommended direction: publish starter conventions for extending collections, globals, integrations, and site-level settings without rewriting core CMS behavior.

## Target State

The target state is a single-site Payload starter that a developer can clone for a new client project without reverse-engineering the platform. Editors should be able to manage pages, system states, navigation, redirects, SEO defaults, and forms safely through the admin. Operational integrations such as storage, email, and deployment should be portable and documented. The repo should include enough verification and handoff guidance that future client-specific customization starts from a stable CMS core instead of a fragile template fork.

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

## Appendix: Evidence Base

- `README.md` — setup and deployment narrative still reflects the base template more than the current CMS feature set.
- `src/payload.config.ts` — confirms collection/global registration, provider coupling, and the current database/email assumptions.
- `src/collections/Pages.ts` — shows the core marketing page model, live preview setup, publishing hooks, redirect behavior, hierarchy validation, and SEO ownership.
- `src/collections/SystemPages.ts` — shows the current treatment of system-mode content as managed CMS entities with type-constrained layouts.
- `src/collections/NavigationLinks.ts` — shows the reusable link model and the page-sync design direction for shared destinations.
- `src/globals/PageSettings.ts` — shows how site-wide defaults, published-reference validation, and system behaviors are currently owned.
- `src/app/(frontend)/pageData.ts` — shows centralized frontend content resolution for homepage lookup, published pages, metadata, and system-mode behavior.
- `src/access/adminCapabilities.ts` — shows the current capability map, area-based access helpers, and admin visibility rules.
- `src/collections/Users.ts` — shows the admin user model, role normalization, and capability storage strategy.
- `src/globals/SEOSettings.ts` — shows the current global SEO defaults available to operators.
- `src/collections/Forms.ts` — shows the reusable form-definition model and editor-facing lead-capture configuration.
- `src/collections/FormSubmissions.ts` — shows how lead data is currently stored and exposed to admins.
- `src/app/api/forms/[slug]/submit/route.ts` — shows the public submission flow, validation, throttling, persistence, and notification dispatch.
- `src/lib/forms.ts` — shows field-definition validation and submission normalization rules.
- `tests/int/api.int.spec.ts` — shows the current minimal test baseline.
- `src/globals/SiteSettings.ts` — shows that brand, contact, and social configuration already live in the starter as reusable but client-sensitive globals.
- `src/globals/ThemeSettings.ts` — shows the current theme preset surface and where presentation assumptions are still baked into the starter.
