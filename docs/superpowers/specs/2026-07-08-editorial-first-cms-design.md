# Editorial-First CMS Architecture Design

## Summary

This spec defines the next architectural target for this repo: an editorial-first, client-handoff-safe marketing CMS starter built on Payload.

The goal is not to turn the project into a generic CMS platform. The goal is to make one strong single-site starter that can be copied for client work, operated safely by non-technical teams, and extended without rewriting the CMS core.

The current repo already has a credible foundation:

- real page, system-page, navigation, form, redirect, and settings models
- centralized frontend content resolution
- draft/publish behavior and live preview support
- a clearer deployment contract for Vercel-hosted production

What is still missing is the operational layer that makes this safe as a handoff-ready CMS product. The main gaps are editorial governance, content and marketing operations, starter productization, and operator-facing safety.

Block expansion is explicitly deferred until those workflows are stable.

## Product Position

This starter should be positioned as:

- single-site
- marketing-focused
- editorial-first
- clone-oriented for future client projects
- safe for non-technical operators after handoff

It should not try to be:

- a multi-tenant platform
- a generic abstraction over every CMS use case
- a block-library race before editorial and operational workflows are hardened

## Primary User Model

The primary operating model is:

- a developer or small agency clones the starter for a client project
- the developer configures deployment, branding, and project-specific extensions
- the client team then operates the site through the Payload admin

The primary non-technical users are:

- content editors
- publishers or marketing leads
- marketing operations users handling forms, SEO, and campaign execution

This means the CMS must optimize for safe operation under pressure, not only for developer flexibility.

## Current Status

The current project is no longer a blank template. It is a strong CMS foundation, but not yet a complete handoff-safe CMS product.

Today it already does these things well:

- models pages, system pages, navigation links, forms, redirects, headers, footers, and site settings
- treats SEO, homepage ownership, and system modes as managed CMS concerns
- centralizes frontend page resolution instead of scattering content logic
- has a clearer local-versus-Vercel runtime contract than before

Today it is still weak in these areas:

- role boundaries are too close to capability buckets and not yet clearly mapped to editorial team structures
- editing, publishing, and system-wide control are not separated strongly enough
- revision and audit surfaces are still more developer-shaped than operator-shaped
- lead handling stops at submission capture rather than becoming a first-class marketing workflow
- clone and handoff standards are improving, but still not yet deterministic enough to count as a productized starter

The practical status is:

- strong foundation for developers
- partial readiness for small internal teams
- not yet fully ready for repeatable client handoff

## Architectural Goal

The repo should evolve into a CMS starter where:

- non-technical editors can manage content without accidental system-level risk
- publishing and high-impact changes are guarded by clearer workflows
- forms, SEO, and campaign operations are treated as first-class marketing operations
- deployment and provider assumptions are explicit and repeatable
- future client customization happens through clear extension seams instead of core rewrites

Success is not measured by how many content blocks exist. Success is measured by whether the starter can be copied, launched, handed off, and safely operated.

## Recommended Approach

Three paths were considered:

### 1. Expand Features Broadly

Add more blocks, more content types, and more frontend flexibility first.

This makes the starter look richer quickly, but it compounds weak operational foundations and increases handoff risk.

### 2. Productize Infrastructure First

Focus almost entirely on deployment, providers, docs, and clone reliability before editorial workflow improvements.

This reduces platform ambiguity, but it leaves the admin experience too unsafe for the actual operators who will own the site after handoff.

### 3. Editorial-First CMS Hardening

Treat this as a marketing CMS productization effort where editorial governance comes first, then content and marketing operations, then handoff and deployment standards, and only then broader block expansion.

This is the recommended path because it improves the highest-risk gap: the distance between a technically capable starter and an operationally safe CMS.

### Decision

Choose editorial-first CMS hardening.

## Architecture Tracks

The missing work should be handled in four tracks, in this order.

### Track 1: Editorial Governance

This track hardens who can do what, how risky actions are controlled, and how mistakes are understood and reversed.

Required outcomes:

- define a clearer role model than raw capability buckets alone
- separate content editing, publishing, and system-wide controls
- support publish guardrails and approval-ready workflow states
- improve recovery paths when editors make mistakes
- expose revision history and audit surfaces in language operators can understand

The target role shape should be close to:

- `admin`
- `publisher`
- `editor`
- `marketing_ops`

This does not require a heavyweight enterprise workflow engine. It does require explicit separation of duties.

Minimum workflow expectations:

- content can move through `draft`, `in_review`, `scheduled`, `published`, and `reverted` states
- users with editing rights do not automatically inherit publish or system-mode control
- system-wide settings changes are more visible and easier to audit than normal content edits
- operators can identify who changed high-impact settings and when

This track matters first because unsafe editorial control is the biggest blocker to client handoff.

### Track 2: Content And Marketing Operations

This track makes the content model safer to run at scale for actual marketing teams.

Required outcomes:

- stronger page lifecycle controls
- reusable taxonomy and metadata patterns
- safer operation of system pages and global settings
- better media organization, replacement, governance, and cleanup
- forms treated as lead operations instead of only submission storage
- more complete SEO workflow coverage
- analytics and integration seams for campaign operations
- explicit decisions about search and discoverability scope
- environment-specific launch and verification checklists

Page lifecycle needs stronger rules around:

- homepage ownership
- slug stability
- parent-child page movement
- archive versus deletion behavior
- redirect expectations after URL changes

Taxonomy and metadata patterns should cover the kinds of reuse marketing teams actually need, such as:

- campaigns
- themes
- audiences
- content groupings used for filtering, reporting, or reuse

Global and system content should be safer to operate by making ownership clearer:

- which settings are site-wide defaults
- which entities are reusable structured content
- which pages are operational system surfaces

Media operations should move beyond upload-only behavior toward:

- better organization conventions
- safer asset replacement
- alt-text completeness expectations
- visibility into where assets are used
- cleanup paths for stale files

Form handling should evolve from raw submissions to lead operations:

- lead status
- owner or assignee
- internal notes
- source or campaign metadata
- downstream routing seam for CRM or automation

SEO should feel complete from an operator perspective, not just from a schema perspective. That includes:

- sensible defaults
- clear override behavior
- canonical management
- robots control
- sitemap expectations
- preview of likely search-facing outcomes where practical

Lead handling should support real follow-up work:

- triage state
- assignment
- reporting-friendly metadata
- integration boundaries for email automation or CRM sync

Campaign operations also need explicit seams for:

- analytics identifiers
- attribution metadata
- webhooks or downstream automation
- launch verification steps across environments

If this starter is expected to support larger content inventories, search and discoverability need an explicit product decision rather than accidental sprawl.

This track is what turns the starter from a content admin into a marketing operations tool.

### Track 3: Starter Productization Layer

This track makes the repo reliable to clone, extend, deploy, and hand off.

Required outcomes:

- deterministic clone workflow
- stable deployment, storage, and provider contract
- clear extension boundaries for future client-specific additions
- tests around actual CMS behaviors
- admin-facing and operator-facing docs, not only developer docs

The clone path should be predictable enough that a developer does not need to reverse-engineer hidden assumptions from config files.

The deployment contract should stay opinionated and narrow:

- local development defaults should remain simple
- Vercel deployment assumptions should stay explicit
- supported provider seams should be documented as contracts, not guesses

Extension boundaries should explain:

- what is core starter behavior
- what is expected to be replaced per client
- where new collections, globals, integrations, and frontend rendering rules should be added

Testing should focus on the CMS behaviors that matter most:

- permissions
- publishing rules
- page and system-mode resolution
- global settings validation
- form and lead workflows
- redirect behavior

Docs should support both sides of handoff:

- developers cloning and extending the starter
- operators running the CMS safely after launch

This track makes the repo reproducible as a product rather than only understandable as a codebase.

### Track 4: Block Expansion

This track remains intentionally deferred.

Only after the first three tracks are stable should the starter expand its block library more aggressively.

At that point, block work should build on:

- proven editorial roles and workflows
- clearer content and campaign operations
- stable deployment, testing, and handoff standards

The rule is simple: workflow safety first, block breadth second.

## Ordering

The implementation order should be:

1. editorial governance
2. content and marketing operations
3. starter productization and deployment standards
4. block expansion

This order is intentional.

It is better to have fewer blocks inside a safe, understandable, repeatable CMS than a rich block library on top of weak workflows and unclear operating rules.

## System Boundaries

To keep the architecture coherent, the repo should preserve these boundaries:

- content modeling stays separate from deployment-provider wiring
- editorial permissions stay separate from frontend rendering concerns
- operational surfaces such as forms, system modes, and SEO defaults stay explicit instead of being hidden in generic page fields
- client-specific customization should happen through extensions, not by forking core starter assumptions into many one-off edits

The project should remain a strong opinionated starter, not a universal framework.

## Non-Goals

This phase does not include:

- multi-tenant architecture
- generalized support for every hosting or database combination
- a broad block-library expansion program
- a generic abstraction layer for all possible CMS use cases
- solving every enterprise workflow requirement up front

The point is to harden one reliable marketing CMS starter, not to build a platform company inside the starter.

## Testing Strategy

This architecture needs tests that reflect operator risk, not only application boot.

The next implementation phases should add coverage around:

- role and access boundaries
- draft, review, schedule, publish, and revert transitions
- page settings and system-mode safety rules
- redirect behavior after URL or hierarchy changes
- form capture, lead-state transitions, and downstream handoff seams
- deployment contract validation where runtime assumptions affect CMS safety

The most important test question is:

Can the repo prove that a non-technical team can operate the CMS without accidentally breaking site behavior?

## Documentation Strategy

The starter needs documentation in three layers:

- developer onboarding and clone setup
- CMS architecture and extension boundaries
- operator-facing admin guidance for publishing, system modes, forms, and SEO

The documentation should explain both structure and ownership:

- what lives in collections
- what lives in globals
- what controls frontend rendering
- what counts as a high-risk operational change

Operator docs are part of the product, not optional polish.

## Success Criteria

This work is successful when all of the following are true:

- a developer can clone the repo for a new client without reverse-engineering hidden platform assumptions
- a non-technical editor can manage normal content safely without system-level access
- publishing and high-impact changes are visibly controlled and recoverable
- forms, SEO, and campaign operations feel first-class rather than bolted on
- deployment and provider expectations are explicit and repeatable
- future client customization can happen without rewriting core CMS behavior

## Immediate Next Step

The next planning step should decompose this architecture into implementation phases and ticket-sized work, starting with editorial governance.

That implementation plan should stay aligned with the ordering in this spec and should continue treating block expansion as deferred work.
