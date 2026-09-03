# CMS Foundation Audit Design

## Summary

This spec defines a `CMS-first` assessment for the current Payload + Next.js starter kit. The goal is to judge whether this repository is ready to serve as a strong single-site marketing CMS starter that can be copied for future client projects.

The review explicitly excludes block expansion. Blocks will be added after the system foundation is stable, safe for editors, and strong enough for production handoff.

## Product Target

The target is:

- one strong starter that gets copied
- one deployment and one dataset per client site
- a design that does not block future multi-site evolution, but does not optimize for it now

This means the assessment should favor:

- production-ready editorial workflows
- stable content architecture
- operational marketing features
- reusable project conventions
- clean environment and handoff boundaries

It should not drift into speculative multi-tenant platform work.

## Current Project Baseline

The current repo is no longer a blank Payload template. It already includes several meaningful CMS capabilities:

- Payload collections for pages, forms, form submissions, media, redirects, navigation links, headers, footers, system pages, and users
- globals for site defaults, site settings, theme settings, and SEO settings
- route-level frontend data resolution in `src/app/(frontend)/pageData.ts`
- system-mode routing for maintenance, coming soon, and managed 404 flows
- redirect and navigation synchronization hooks
- form validation, spam throttling, and email notifications
- capability-based admin access controls for operational areas

This matters because the audit should not ask “how do we build a CMS from scratch?” It should ask:

- which CMS capabilities are already structurally sound
- which are incomplete for real client use
- which decisions make the starter hard to clone safely

## Deliverable Shape

The final output should have three parts:

1. `Prioritized gap audit`
2. `Target-state definition`
3. `Phased roadmap`

Each finding must include:

- severity: `critical`, `important`, or `nice-to-have`
- category: one of the agreed audit categories
- evidence from the current codebase
- why it matters for a reusable client starter
- recommended direction, without dropping into implementation-plan detail

## Non-Goals

The assessment must not include:

- block library breadth
- visual design polish
- landing page creativity
- speculative multi-tenant architecture
- frontend component expansion unrelated to CMS foundation

The assessment may mention frontend concerns only when they expose a CMS weakness, such as fragile preview flows, hardcoded route assumptions, or content-model limitations.

## Audit Categories

### 1. Platform Foundation

Assess:

- local setup and cloneability
- environment structure and secrets handling
- database, storage, and email portability
- dependency and upgrade safety
- test coverage and confidence baseline
- deployment readiness and operational defaults

Good looks like:

- a new client project can be created with minimal code edits
- provider-specific values are isolated
- production requirements are explicit
- the starter has enough validation and tests to survive handoff

### 2. Content Architecture

Assess:

- collection and global boundaries
- relationship design
- path and slug modeling
- reusable content ownership
- SEO and system-setting ownership
- whether content structures are opinionated without becoming rigid

Good looks like:

- editors can predict where content belongs
- shared data structures are reusable
- site-specific assumptions can be changed without rewriting the CMS core

### 3. Editorial Workflows

Assess:

- admin roles and capabilities
- drafts and preview flows
- publish safety and guardrails
- redirect integrity
- system-page protection
- media management
- form authoring and submission handling
- admin usability for non-technical operators

Good looks like:

- editors can manage the site without developer intervention
- dangerous actions are guarded
- draft and published content behave predictably

### 4. Marketing Operations

Assess:

- SEO defaults and overrides
- canonical, sitemap, and robots behavior
- lead capture workflows
- notification flows
- campaign support primitives
- analytics and integration readiness
- marketing-specific operational tooling

Good looks like:

- the starter supports real marketing operations, not only content entry
- common SEO and lead-gen workflows are first-class

### 5. Starter-Kit Reusability

Assess:

- hardcoded project assumptions
- branding/provider coupling
- extension seams
- reusable conventions
- boundaries between starter core and client-specific customization

Good looks like:

- copying the starter creates leverage
- client-specific changes happen in predictable places
- the starter stays opinionated without becoming tangled

## Evaluation Method

The assessment should run in two passes.

### Pass 1: Current-State Audit

Inspect the existing implementation and identify:

- what is already strong
- what is incomplete
- what is structurally risky

The review should cover:

- schema and globals
- hooks and access control
- frontend content-resolution flow
- settings and system-page routing
- forms, redirects, and navigation synchronization
- environment and deployment setup
- tests and verification posture

This pass must stay grounded in actual code, not generic CMS expectations.

### Pass 2: Starter-Kit Fitness Test

Judge the repo as a template intended for future client reuse.

Key questions:

- what is too hardcoded
- what is too implicit for handoff
- where editor workflows depend on developer knowledge
- where operational behavior is fragile in production
- where extension seams are missing or unclear

## Prioritization Rules

- `critical`: blocks safe client use, creates structural instability, or makes the starter unreliable to clone or operate
- `important`: should be resolved before calling this a serious production CMS starter
- `nice-to-have`: beneficial improvements that should wait until the foundation is stable

## Roadmap Ordering Principle

The roadmap should order work like this:

1. stabilize foundation and editor safety
2. close operational CMS gaps
3. improve starter reusability and handoff quality
4. expand block inventory after the foundation is trustworthy

## Initial Review Focus Areas

Based on the current repo, the audit should pay particular attention to these areas:

- whether the capability model in `src/access/adminCapabilities.ts` and `src/collections/Users.ts` is sufficient for real editorial teams
- whether `src/payload.config.ts` is too tightly coupled to the current provider choices and project assumptions
- whether `src/app/(frontend)/pageData.ts` is a strong enough abstraction for future client-specific routing and SEO behavior
- whether forms are only “working” or actually ready for real lead-handling operations
- whether global settings are clear enough for non-technical admins
- whether cloning this starter for a new client would expose too many hidden assumptions
- whether the current test posture is enough for safe iteration

## Output Quality Bar

The finished audit succeeds if:

- it clearly separates strong existing foundations from missing CMS capabilities
- it gives a realistic picture of what must improve before aggressive block expansion
- it can act as a standard for evaluating future client starter quality
- it is specific enough to produce an implementation plan later without reopening the problem definition

## Acceptance Criteria

This design is complete when:

- the scope is explicitly limited to CMS foundation quality
- the audit categories are stable
- the evaluation method is clear
- the prioritization rules are unambiguous
- the deliverable format is specific enough to support a follow-up planning phase
