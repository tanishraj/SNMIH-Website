# Project Context Skill Design

## Goal

Create a project-local Codex skill that captures the current architecture and implementation contracts of this Payload CMS starter, guides future repository work, and verifies after every implementation that its generated project inventory remains synchronized with source.

The skill must complement the existing Payload skill rather than duplicate general Payload CMS documentation. Its project-specific knowledge must cover the registered content model, block system, frontend delivery, shared configuration, operational behavior, and change-impact rules.

## Canonical Location and Discovery

The canonical skill will live at `.agents/skills/project-context/` and contain:

- `SKILL.md` for the concise operating workflow and reference routing.
- `agents/openai.yaml` for skill-list metadata.
- `references/architecture.md` for runtime layers, routes, rendering, providers, caching, and testing boundaries.
- `references/payload-model.md` for collections, globals, shared fields, access control, hooks, workflow, and relationships.
- `references/block-system.md` for block categories, registration, production rendering, live preview, thumbnails, reusable sections, shared block configuration, generated types, tests, and operator documentation.
- `references/change-impact-map.md` for mapping changed paths to required inspections, reference updates, generated artifacts, and checks.
- `references/project-inventory.json` for deterministic machine-derived facts.
- `scripts/project-context-lib.mjs` for reusable extraction, normalization, comparison, and validation functions.
- `scripts/update-project-context.mjs` for regenerating the inventory.
- `scripts/check-project-context.mjs` for validating the checked-in inventory and cross-file contracts.

`AGENTS.md` will require this project-context skill for repository implementations and retain the existing requirement to load the Payload skill for Payload-specific work. The root `SKILL.md` will become a short compatibility pointer to the canonical project-context skill so there is one maintained source of detailed project knowledge.

The skill description will trigger for implementation, review, diagnosis, or architecture questions involving this repository, especially collections, globals, blocks, routes, themes, access, hooks, providers, tests, and documentation.

## Project Knowledge Scope

The initial references will describe the complete current source tree rather than reproducing historical implementation plans. Current source, registered configuration, generated Payload types, and maintained architecture documentation are authoritative in that order when conflicts appear.

The baseline inventory will capture at least:

- Package name, scripts, and direct framework/runtime versions.
- All collections and globals registered in `src/payload.config.ts`, including order and source file.
- All Page blocks registered in `src/collections/Pages.ts`.
- Header, footer, reusable-section, and system-page block restrictions.
- Every block slug, exported config name, interface name, config path, component path, and optional preview/presentation/client files.
- Production and live-preview renderer coverage by block slug.
- Thumbnail definition, fixture, and generated image coverage.
- Shared block field factories and presentation helpers.
- App Router pages, route handlers, feeds, metadata routes, and preview routes.
- Access, hooks, library modules, runtime/provider configuration, themes, and test files.
- The current knowledge-graph metadata so structural staleness can be reported.

The initial narrative references will explicitly document the current Payload architecture: 20 registered collections, nine registered globals, 49 Page blocks, governed editorial workflow, reusable-section recursion limits, block error boundaries, shared theme surfaces, local/S3 media providers, optional Resend email, public/draft filtering, and the repository's test layers. These counts are regenerated facts, not hard-coded assumptions in validation logic.

## Update Workflow

Every repository implementation that uses the skill must finish with:

1. Run `pnpm project-context:update` to regenerate the deterministic inventory.
2. Inspect the implementation diff using `references/change-impact-map.md`.
3. Update narrative references when architecture, behavior, ownership, or an operator-facing contract changed.
4. Run `pnpm project-context:check`.
5. Report which skill artifacts changed, or explicitly report that the skill was checked and remained current.

Running the updater satisfies the after-every-implementation requirement even when the resulting inventory has no diff. CSS-only, copy-only, or isolated test changes do not force meaningless edits to narrative documentation. They still require the update and check commands, and theme-contract changes still require a review of block and architecture references.

The updater will parse source text with the repository's existing TypeScript dependency. It must not boot Payload, connect to MongoDB, require application secrets, or import runtime configuration that can fail based on environment variables.

The updater will build the full inventory in memory, validate the extracted model, serialize keys and arrays deterministically, and write through a temporary sibling file followed by an atomic rename. A parse or validation failure must leave the previous inventory unchanged.

The inventory will omit volatile timestamps. It may include deterministic content hashes for monitored source sets so repeated runs against unchanged source produce byte-identical output.

## Change-Impact Rules

The change-impact map will route implementation diffs as follows:

- `src/payload.config.ts`, `src/collections`, `src/globals`, `src/fields`, `src/hooks`, `src/access`, and `src/plugins` require review of `payload-model.md`.
- `src/blocks`, the Page/Reusable Section/System Page collection configs, block renderers, `src/block-thumbnails`, generated Payload types, block tests, and the block operator guide require review of `block-system.md`.
- `src/app`, `src/lib`, `src/config`, middleware, providers, cache behavior, package scripts, Docker, and Next.js configuration require review of `architecture.md`.
- Theme styles and shared presentation helpers require review of both block and architecture references when semantic surfaces, layout tokens, or cross-block behavior change.
- Operator-visible behavior requires the matching maintained guide under `docs/guides` to be reviewed in the same implementation.

Historical files under `docs/superpowers` are design and execution records. They are not scanned as current product contracts and do not cause narrative skill updates unless a task explicitly works on the project-planning process.

## Deterministic Validation

`pnpm project-context:check` will regenerate the expected inventory in memory and compare it with the checked-in `references/project-inventory.json`. A mismatch will exit non-zero and instruct the agent to run the updater.

The checker will also enforce objective repository invariants:

- Collection and global registration resolves to existing source files without duplicate identities.
- Block slugs and generated interface names are unique.
- Every Page block has production-renderer coverage.
- Production and live-preview Page block coverage remains equivalent, with explicit documented exceptions only where architecture requires them.
- Every selectable block that participates in the Admin picker has a thumbnail definition, fixture, and generated image.
- Reusable Section excludes direct recursive selection and preserves the renderer depth guard.
- Restricted header, footer, and system-page blocks are not accidentally exposed as Page blocks.
- Every path referenced by the skill exists.
- Required skill files and frontmatter remain valid.

Generated Payload types will be checked for the expected block interfaces when `src/payload-types.ts` is present. The checker will not regenerate Payload types itself; schema-changing workflows continue to require `pnpm generate:types`.

Knowledge-graph staleness will be reported as a warning when `.understand-anything/meta.json` does not describe the current Git commit. It will not fail normal implementations. The skill will request an incremental graph refresh when a change materially alters architectural structure, ownership, or cross-module relationships.

## Errors, Warnings, and No-Op Updates

Errors represent objective contract failures, parse failures, missing required files, duplicate registrations, renderer/thumbnail parity failures, or stale generated inventory. They exit non-zero, name the affected slug or registration, and list relevant file paths.

Warnings represent conditions requiring judgment, including a stale knowledge graph, monitored architectural files changing without a narrative reference edit, or a source construct the extractor can see but cannot classify confidently. Warnings do not silently modify narrative files.

A no-op update is valid. When source changes do not alter the generated inventory or project-level contracts, the agent reports that the project skill was refreshed and required no content changes.

## Package Scripts

The root package will expose:

- `project-context:update` to run the updater.
- `project-context:check` to run the checker.
- `test:project-context` to run focused extractor and contract tests.

These scripts must run without a database or network connection. Existing `test:int`, lint, type-generation, and build commands retain their current responsibilities.

## Testing

Implementation will use test-driven coverage for the reusable extraction library and repository contracts.

Unit tests will cover:

- TypeScript source parsing and stable normalization.
- Collection, global, and block-array extraction.
- Block slug and interface extraction.
- Switch-case renderer extraction.
- Thumbnail definition and fixture extraction.
- Deterministic serialization and content hashing.
- Duplicate identity, malformed config, and missing renderer diagnostics.

Repository-level tests will run the extractor against the current source tree and verify:

- Generated output matches the checked-in inventory.
- All 49 current Page blocks satisfy production and live-preview contracts.
- Current thumbnail and generated-type coverage passes.
- Restricted block systems remain isolated.
- Running the updater twice produces no second change.
- All Markdown paths routed directly from `SKILL.md` exist.

Failure fixtures will be small strings or temporary fixture trees, not mutations of live project source. Tests must demonstrate that updater failure does not replace the previous inventory.

## Skill Validation and Completion

The skill will be initialized with the official `skill-creator` scaffolding command and generated UI metadata. Completion requires:

1. The official skill validator passes for `.agents/skills/project-context/`.
2. `pnpm test:project-context` passes.
3. `pnpm project-context:update` followed by `pnpm project-context:check` passes.
4. Existing focused block registration, live-preview, thumbnail, and repository-hygiene tests pass.
5. `git diff --check` reports no whitespace errors.
6. The final handoff identifies the canonical skill location, generated inventory, update commands, and any pre-existing unrelated working-tree changes left untouched.

Success means a future coding agent can locate the relevant project contract quickly, make a change with the correct related surfaces in view, and deterministically prove at the end of the implementation that project-specific machine-derived knowledge is current.
