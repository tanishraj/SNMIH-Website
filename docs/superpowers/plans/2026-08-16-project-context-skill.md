# Project Context Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a discoverable project-local skill that documents this starter's current architecture and deterministically verifies after every implementation that its generated project inventory matches source.

**Architecture:** Keep concise operating instructions in `.agents/skills/project-context/SKILL.md`, detailed knowledge in routed references, and machine-derived facts in stable JSON. A pure ESM library parses TypeScript without booting Payload; thin update/check commands write the inventory atomically and enforce repository contracts.

**Tech Stack:** Node.js ESM, TypeScript compiler API, Payload CMS 3.85.2, Next.js 16, React 19, Vitest 4, Markdown, JSON, YAML.

## Global Constraints

- Keep `.agents/skills/project-context/` as the canonical skill.
- Also load `.agents/skills/payload/SKILL.md` for Payload-specific work.
- Never boot Payload, connect to MongoDB, access the network, or require application secrets from context scripts.
- Generate byte-stable inventory without timestamps; replace it only after successful extraction and validation.
- Run update/check after every implementation; allow a valid no-op update.
- Treat knowledge-graph staleness as a warning.
- Preserve unrelated changes, especially `src/styles/themes/theme-snmih.css`.

---

## File Structure

- `.agents/skills/project-context/SKILL.md` — workflow, safety rules, and reference routing.
- `.agents/skills/project-context/agents/openai.yaml` — skill metadata.
- `.agents/skills/project-context/references/architecture.md` — runtime, routes, providers, caching, themes, and tests.
- `.agents/skills/project-context/references/payload-model.md` — collections, globals, access, hooks, fields, workflow, and relationships.
- `.agents/skills/project-context/references/block-system.md` — block registration and all integration surfaces.
- `.agents/skills/project-context/references/change-impact-map.md` — changed-path routing.
- `.agents/skills/project-context/references/project-inventory.json` — generated facts and digest.
- `.agents/skills/project-context/scripts/project-context-lib.mjs` — extraction, normalization, validation, and atomic writes.
- `.agents/skills/project-context/scripts/update-project-context.mjs` — updater CLI.
- `.agents/skills/project-context/scripts/check-project-context.mjs` — checker CLI.
- `tests/int/project-context-lib.int.spec.ts` — extractor/diagnostic tests.
- `tests/int/project-context-repository.int.spec.ts` — real-repository contract tests.
- `package.json`, `AGENTS.md`, `SKILL.md` — scripts and discovery.
- `README.md`, `docs/architecture/feature-inventory.md` — reconcile stale 39/48 counts to 49.

### Task 1: Scaffold the Skill and Parsing Library

**Files:**

- Create: `.agents/skills/project-context/` with the official initializer.
- Create: `.agents/skills/project-context/scripts/project-context-lib.mjs`
- Create: `tests/int/project-context-lib.int.spec.ts`

**Interfaces:**

- Produces: `parseSource`, `extractImports`, `extractArrayPropertyIdentifiers`, `extractBlockDefinition`, `extractSwitchCases`, `extractThumbnailDefinitions`, `extractExportedObjectKeys`, `extractExportNames`, `stableStringify`, and `sha256`.
- Consumes: source strings and file paths; no application imports.

- [ ] **Step 1: Initialize the canonical skill**

Run:

```bash
python3 /Users/tanishraj/.codex/skills/.system/skill-creator/scripts/init_skill.py project-context --path .agents/skills --resources scripts,references --interface display_name="Project Context" --interface short_description="Navigate and maintain this Payload starter" --interface default_prompt="Use $project-context to implement this repository change and keep its project knowledge current."
```

Expected: skill directory, placeholder `SKILL.md`, `agents/openai.yaml`, `scripts/`, and `references/` exist.

- [ ] **Step 2: Write failing parser tests**

Create `tests/int/project-context-lib.int.spec.ts`. Use in-memory TypeScript fixtures and assert these exact outcomes:

```ts
expect(extractImports(importFixture, 'src/payload.config.ts')).toEqual({
  Articles: './collections/Articles',
  Pages: './collections/Pages',
})
expect(extractArrayPropertyIdentifiers(configFixture, 'config.ts', 'collections')).toEqual([
  'Pages',
  'Articles',
])
expect(extractBlockDefinition(blockFixture, 'src/blocks/Example/config.ts')).toEqual({
  configPath: 'src/blocks/Example/config.ts',
  interfaceName: 'ExampleBlock',
  slug: 'example',
  symbol: 'ExampleBlock',
})
expect(extractBlockDefinition(systemFactoryFixture, 'src/blocks/System404/config.ts')).toEqual({
  configPath: 'src/blocks/System404/config.ts',
  interfaceName: 'System404Block',
  slug: 'system404',
  symbol: 'System404Block',
})
expect(extractSwitchCases("case 'alpha': break; case 'beta': break")).toEqual([
  'alpha',
  'beta',
])
expect(extractThumbnailDefinitions(thumbnailFixture, 'definitions.ts')).toEqual([
  { filename: 'alpha.jpg', slug: 'alpha' },
])
expect(extractExportedObjectKeys(fixtureObject, 'fixtures.tsx', 'blockThumbnailFixtures')).toEqual([
  'alpha',
  'beta',
])
expect(stableStringify({ z: 1, a: { d: 2, b: 1 }, rows: ['b', 'a'] })).toBe(
  '{\n  "a": {\n    "b": 1,\n    "d": 2\n  },\n  "rows": [\n    "b",\n    "a"\n  ],\n  "z": 1\n}\n',
)
```

- [ ] **Step 3: Verify the tests fail**

Run `pnpm exec vitest run tests/int/project-context-lib.int.spec.ts`.

Expected: FAIL because the parsing exports do not exist.

- [ ] **Step 4: Implement parsing primitives**

Use `typescript`'s `createSourceFile` with `TS`/`TSX` script kinds. Walk AST nodes to:

- Map named import local identifiers to module specifiers.
- Find array-valued object properties and retain identifier order.
- Find exported block object literals, including `satisfies` wrappers, and read `slug`/`interfaceName`.
- Recognize `createSystemPageBlock({ slug })` factory calls and derive the interface exactly as the factory does: uppercase the first slug character and append `Block`.
- Find `defineThumbnail({ slug, filename })` calls.
- Find keys on the named exported fixture object.
- Collect exported function/variable names.
- Extract renderer cases with `/case\s+['"]([^'"]+)['"]\s*:/g`.
- Recursively sort object keys while preserving array order in `stableStringify`.
- Hash strings with SHA-256.

Every malformed expected construct must throw an error containing its file path.

- [ ] **Step 5: Run tests**

Run `pnpm exec vitest run tests/int/project-context-lib.int.spec.ts`.

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .agents/skills/project-context tests/int/project-context-lib.int.spec.ts
git commit -m "feat(context): add project source parser"
```

### Task 2: Build Stable Inventory and Atomic Updating

**Files:**

- Modify: `.agents/skills/project-context/scripts/project-context-lib.mjs`
- Create: `.agents/skills/project-context/scripts/update-project-context.mjs`
- Modify: `tests/int/project-context-lib.int.spec.ts`

**Interfaces:**

- Produces: `buildProjectInventory(projectRoot)` and `writeProjectInventory(projectRoot, inventory, explicitTarget?)`.
- Inventory keys: `schemaVersion`, `project`, `payload`, `blocks`, `surfaces`, `sourceDigest`, `knowledgeGraph`.

- [ ] **Step 1: Write failing inventory tests**

Add assertions against the actual repository:

```ts
const inventory = await buildProjectInventory(process.cwd())
expect(inventory.schemaVersion).toBe(1)
expect(inventory.payload.collections).toHaveLength(20)
expect(inventory.payload.globals).toHaveLength(9)
expect(inventory.blocks.page).toHaveLength(49)
expect(inventory.blocks.reusableSection).toEqual(
  inventory.blocks.page.filter((slug: string) => slug !== 'reusableSection'),
)
expect(inventory.blocks.header).toEqual(['headerNavbar12'])
expect(inventory.blocks.footer).toEqual(['footer56', 'footerMinimal'])
expect(inventory.blocks.systemPage).toEqual([
  'system404',
  'systemMaintenance',
  'systemComingSoon',
])
```

Add a temporary-directory test proving `writeProjectInventory` replaces `inventory.json`, produces stable formatted JSON, and leaves no `inventory.json.tmp` sibling.

- [ ] **Step 2: Verify failure**

Run `pnpm exec vitest run tests/int/project-context-lib.int.spec.ts`.

Expected: FAIL because inventory functions are missing.

- [ ] **Step 3: Implement repository walking and inventory construction**

Implement these exact behaviors:

1. Recursively walk paths with sorted POSIX-relative output.
2. Parse `package.json` for project identity, scripts, and versions of Next, Payload, React, Tailwind, TypeScript, and Vitest.
3. Parse `src/payload.config.ts` and resolve ordered collection/global symbols to import paths.
4. Scan every `src/blocks/*/config.ts`, extracting identity plus component, presentation, preview, and client files in that directory.
5. Resolve the `blocks` arrays in Pages, Reusable Sections, Headers, Footers, and System Pages from imported symbols to slugs.
6. Extract production/live-preview switch cases.
7. Extract thumbnail definitions, fixture keys, and JPEG paths.
8. Extract generated block interfaces from `src/payload-types.ts`.
9. List shared block exports plus access/config/field/hook/lib/route/test/theme paths.
10. Read `.understand-anything/meta.json` when present.
11. Hash sorted monitored content from `src`, `tests`, maintained `docs/architecture`, `docs/guides`, `docs/operations`, and root runtime/config files. Exclude `.agents/skills/project-context` and `docs/superpowers` to prevent recursive or historical churn.

Use this block inventory shape:

```js
blocks: {
  definitions,
  page,
  reusableSection,
  header,
  footer,
  systemPage,
  productionRenderer,
  livePreviewRenderer,
  thumbnails: { assets, definitions, fixtures },
  generatedInterfaces,
  shared,
}
```

Write the complete object to a sibling `.tmp` path with `stableStringify`, then rename it over the target. Never truncate the existing target before successful construction.

- [ ] **Step 4: Add the updater CLI**

`update-project-context.mjs` must derive the project root as four directories above its own file URL, call `buildProjectInventory`, call `writeProjectInventory`, print `Updated .agents/skills/project-context/references/project-inventory.json`, and set exit code 1 with `Project context update failed:` followed by the caught error message.

- [ ] **Step 5: Run tests**

Run `pnpm exec vitest run tests/int/project-context-lib.int.spec.ts`.

Expected: PASS, including actual counts and atomic-write behavior.

- [ ] **Step 6: Commit**

```bash
git add .agents/skills/project-context/scripts tests/int/project-context-lib.int.spec.ts
git commit -m "feat(context): build stable project inventory"
```

### Task 3: Add Contract Validation and the Checker CLI

**Files:**

- Modify: `.agents/skills/project-context/scripts/project-context-lib.mjs`
- Create: `.agents/skills/project-context/scripts/check-project-context.mjs`
- Modify: `src/blocks/ReusableSection/config.ts`
- Regenerate: `src/payload-types.ts`
- Modify: `tests/int/project-context-lib.int.spec.ts`
- Create: `tests/int/project-context-repository.int.spec.ts`

**Interfaces:**

- Produces: `validateProjectContracts(projectRoot, inventory, options?)` and `checkProjectContext(projectRoot)` returning `{ errors: string[], warnings: string[] }`.
- Errors exit non-zero; graph staleness remains a warning with exit zero.

- [ ] **Step 1: Write failing diagnostic tests**

Clone the real inventory, duplicate the first Page slug, remove `contentHighlights` from `productionRenderer`, and assert these exact messages:

```ts
expect(result.errors).toContain(`Duplicate Page block slug: ${broken.blocks.page[0]}`)
expect(result.errors).toContain(
  'Page block contentHighlights is missing from src/blocks/renderPageBlocks.tsx',
)
```

Inject `{ gitHead: 'current-commit' }`, set `knowledgeGraph.gitCommitHash` to `stale-commit`, and assert:

```ts
expect(result.errors).toEqual([])
expect(result.warnings).toContain(
  'Knowledge graph is stale: analyzed stale-commit, current current-commit.',
)
```

- [ ] **Step 2: Verify failure**

Run `pnpm exec vitest run tests/int/project-context-lib.int.spec.ts`.

Expected: FAIL because validator exports are missing.

- [ ] **Step 3: Give Reusable Section an explicit generated interface**

Add `interfaceName: 'ReusableSectionBlock'` immediately after its slug in `src/blocks/ReusableSection/config.ts`, then run `pnpm generate:types`. Assert in the parser test that every current definition has a non-null interface name and that `src/payload-types.ts` exports `ReusableSectionBlock`.

- [ ] **Step 4: Implement contract validation**

Validate all of the following with diagnostics naming the slug and relevant file:

- Unique Page block slugs and unique block-definition slugs/interfaces.
- Every block definition has `interfaceName`.
- Every Page slug exists in both renderers.
- Sorted production/live-preview case sets are equal.
- Reusable Section slugs equal Page slugs minus `reusableSection`, preserving Page order.
- Header/footer/system slugs never occur in Page slugs.
- Every unique registered Page/header/footer/system slug has one thumbnail definition, one fixture, and its named JPEG.
- Every block interface exists in generated Payload types.
- `src/blocks/renderPageBlocks.tsx` retains `if (depth > 10) return null`.
- Knowledge-graph commit mismatch creates only a warning.

`checkProjectContext` must build expected inventory, load checked-in JSON, compare `stableStringify` output, prepend `Project inventory is stale. Run pnpm project-context:update.` on mismatch, and report a missing inventory with the same remediation.

- [ ] **Step 5: Add the checker CLI**

`check-project-context.mjs` derives the root exactly like the updater, prints `Warning:` and `Error:` lines, exits 1 only when errors exist, and prints `Project context is current.` when there are no errors.

- [ ] **Step 6: Add repository tests**

Create `tests/int/project-context-repository.int.spec.ts` with two initial tests:

```ts
it('passes source-derived project contracts', async () => {
  const inventory = await buildProjectInventory(process.cwd())
  const result = await validateProjectContracts(process.cwd(), inventory)
  expect(result.errors).toEqual([])
})

it('matches the checked-in deterministic inventory', async () => {
  const inventory = await buildProjectInventory(process.cwd())
  const checkedIn = JSON.parse(
    await readFile('.agents/skills/project-context/references/project-inventory.json', 'utf8'),
  )
  expect(stableStringify(checkedIn)).toBe(stableStringify(inventory))
})
```

- [ ] **Step 7: Run tests**

Run:

```bash
pnpm exec vitest run tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts
```

Expected: unit diagnostics pass; repository comparison fails only because inventory has not yet been generated.

- [ ] **Step 8: Commit**

```bash
git add .agents/skills/project-context/scripts src/blocks/ReusableSection/config.ts src/payload-types.ts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts
git commit -m "feat(context): validate repository contracts"
```

### Task 4: Generate Inventory and Add Package Commands

**Files:**

- Create: `.agents/skills/project-context/references/project-inventory.json`
- Modify: `package.json`

**Interfaces:**

- Produces: `pnpm project-context:update`, `pnpm project-context:check`, and `pnpm test:project-context`.

- [ ] **Step 1: Add package scripts**

Add exactly:

```json
"project-context:check": "node .agents/skills/project-context/scripts/check-project-context.mjs",
"project-context:update": "node .agents/skills/project-context/scripts/update-project-context.mjs",
"test:project-context": "vitest run --config ./vitest.config.mts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts"
```

- [ ] **Step 2: Generate inventory**

Run `pnpm project-context:update`.

Expected: generated JSON reports 20 collections, nine globals, 49 Page blocks, 48 Reusable Section blocks, one header block, two footer blocks, and three system blocks.

- [ ] **Step 3: Prove stable generation**

```bash
cp .agents/skills/project-context/references/project-inventory.json /tmp/project-inventory-before.json
pnpm project-context:update
cmp /tmp/project-inventory-before.json .agents/skills/project-context/references/project-inventory.json
```

Expected: `cmp` exits 0 with no output.

- [ ] **Step 4: Run focused verification**

Run `pnpm test:project-context` and `pnpm project-context:check`.

Expected: PASS; a stale graph warning is allowed.

- [ ] **Step 5: Commit**

```bash
git add package.json .agents/skills/project-context/references/project-inventory.json
git commit -m "feat(context): add update and check commands"
```

### Task 5: Write Canonical Knowledge and Discovery

**Files:**

- Replace: `.agents/skills/project-context/SKILL.md`
- Create: `.agents/skills/project-context/references/architecture.md`
- Create: `.agents/skills/project-context/references/payload-model.md`
- Create: `.agents/skills/project-context/references/block-system.md`
- Create: `.agents/skills/project-context/references/change-impact-map.md`
- Regenerate: `.agents/skills/project-context/agents/openai.yaml`
- Modify: `AGENTS.md`
- Replace: `SKILL.md`
- Modify: `tests/int/project-context-repository.int.spec.ts`

**Interfaces:**

- Produces: one canonical skill entry point and direct, one-level routing to every reference.

- [ ] **Step 1: Add a failing discovery test**

Assert that `SKILL.md` names all five reference paths, each exists, and it contains both completion commands:

```ts
for (const reference of [
  'references/architecture.md',
  'references/payload-model.md',
  'references/block-system.md',
  'references/change-impact-map.md',
  'references/project-inventory.json',
]) {
  expect(skill).toContain(reference)
  expect(existsSync(`.agents/skills/project-context/${reference}`)).toBe(true)
}
expect(skill).toContain('pnpm project-context:update')
expect(skill).toContain('pnpm project-context:check')
```

- [ ] **Step 2: Verify failure**

Run `pnpm exec vitest run tests/int/project-context-repository.int.spec.ts`.

Expected: FAIL on missing references and scaffold content.

- [ ] **Step 3: Replace the canonical SKILL.md**

Use only `name` and `description` in YAML frontmatter. The body must:

1. Directly route architecture, Payload model, block system, change impact, and exact inventory queries.
2. Require the Payload skill before Payload config work.
3. State source authority order.
4. Preserve Local API access, nested transaction `req`, recursion flags, draft/public filters, and production-data safety.
5. Require this completion loop: update inventory; inspect diff with impact map; update narrative references when behavior changed; check inventory; run affected tests/generators; report skill changes or no-op.

Use this exact description:

```yaml
description: Understand, implement, review, or diagnose changes in this Payload CMS starter while preserving its project-specific architecture and keeping generated project knowledge current. Use for repository work involving collections, globals, blocks, renderers, routes, themes, access, hooks, providers, tests, documentation, or cross-file change impact.
```

- [ ] **Step 4: Write architecture.md**

Document the eight current layers; Next/Payload/React/Tailwind/MongoDB runtime; server/client boundaries; public/Admin/API/feed/preview/metadata routes; providers and Vercel S3 constraint; cache/invalidation; five themes including SNMIH; analytics consent; and verification routing. Link directly to current source and maintained operations docs.

- [ ] **Step 5: Write payload-model.md**

List all 20 collections and nine globals in registration order with source paths and ownership. Cover roles/capabilities, governed workflow states, publish blockers, drafts/Trash, Page hierarchy/SEO/live preview/redirect sync, taxonomy, reusable sections, media, forms, queue/audit/users, shared fields, hook safety, and Search Settings explicitly.

- [ ] **Step 6: Write block-system.md**

List all 49 Page slugs in exact `Pages.ts` order, 48 Reusable Section slugs by rule, header/footer/system restrictions, production/live-preview render paths, `BlockErrorBoundary`, depth 10, thumbnails/types/tests/docs, optional presentation/preview split, and every shared block helper under `src/blocks/shared`.

- [ ] **Step 7: Write change-impact-map.md**

Create a table with `Changed paths`, `Inspect together`, `Required commands`, and `Narrative references` for Payload schema, blocks, routes, hooks/lib, runtime/providers, themes/shared presentation, tests, package/infrastructure, and maintained docs. Mark `docs/superpowers/**` as historical rather than current product truth.

- [ ] **Step 8: Enforce skill paths and narrative-review warnings**

Extend `project-context-lib.mjs` and its tests so `checkProjectContext`:

- Requires `SKILL.md`, `agents/openai.yaml`, the four Markdown references, and `project-inventory.json`.
- Reads every local Markdown link in the canonical skill and references, resolves it relative to the containing file, and errors with `Broken project-context reference: <path> from <document>.` when missing.
- Accepts injected `changedFiles` in tests; otherwise reads `git diff --name-only`.
- Uses the exact path groups in `change-impact-map.md` and warns when a group changed but its routed narrative reference did not. The warning names both the changed group and reference. It never rewrites narrative Markdown.

Add fixtures proving a missing link errors and a `src/blocks/...` diff without `references/block-system.md` produces a warning.

- [ ] **Step 9: Update discovery files**

Set `AGENTS.md` to require `.agents/skills/project-context/SKILL.md` for every repository implementation/review/diagnosis and to additionally require the Payload skill for Payload work.

Replace root `SKILL.md` with a short compatibility entry point that links only to the canonical skill and does not duplicate its rules.

- [ ] **Step 10: Regenerate UI metadata**

Run:

```bash
python3 /Users/tanishraj/.codex/skills/.system/skill-creator/scripts/generate_openai_yaml.py .agents/skills/project-context --interface display_name="Project Context" --interface short_description="Navigate and maintain this Payload starter" --interface default_prompt="Use $project-context to implement this repository change and keep its project knowledge current."
```

Expected metadata contains only the quoted `display_name`, `short_description`, and `$project-context` default prompt under `interface`.

- [ ] **Step 11: Refresh and verify**

Run:

```bash
pnpm project-context:update
pnpm test:project-context
pnpm project-context:check
```

Expected: PASS, with only the allowed graph warning.

- [ ] **Step 12: Commit**

```bash
git add .agents/skills/project-context AGENTS.md SKILL.md tests/int/project-context-repository.int.spec.ts
git commit -m "docs(context): add canonical project knowledge"
```

### Task 6: Reconcile Maintained Documentation

**Files:**

- Modify: `README.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `tests/int/project-context-repository.int.spec.ts`
- Modify: `tests/int/starter-productization.int.spec.ts` only if it asserts a stale literal.
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: source-derived `inventory.blocks.page.length`.
- Produces: maintained docs that agree with the current 49-block and nine-global registries.

- [ ] **Step 1: Add a failing maintained-doc assertion**

Add:

```ts
it('keeps maintained Page block counts aligned with source', async () => {
  const inventory = await buildProjectInventory(process.cwd())
  const readme = readFileSync('README.md', 'utf8')
  const featureInventory = readFileSync('docs/architecture/feature-inventory.md', 'utf8')

  expect(readme).toContain(`${inventory.blocks.page.length} selectable Page blocks`)
  expect(readme).toContain(`${inventory.payload.globals.length} globals own`)
  expect(featureInventory).toContain(`${inventory.blocks.page.length}-block layouts`)
  expect(featureInventory).toContain('Icon Card Showcase')
  expect(featureInventory).toContain('| Configuration | Search Settings')
})
```

- [ ] **Step 2: Verify current drift**

Run `pnpm exec vitest run tests/int/project-context-repository.int.spec.ts`.

Expected: FAIL because README says 39 blocks/eight globals, while feature inventory says 48 blocks and omits Icon Card Showcase and Search Settings.

- [ ] **Step 3: Correct maintained facts**

- Change README's bullet to `49 selectable Page blocks`.
- Change README's ownership statement from `eight globals` to `nine globals` and include search suggestions in the owned defaults.
- Change the Pages row to `49-block layouts`.
- Change the block catalog lead to `Normal Pages register 49 choices:`.
- Insert `Icon Card Showcase` immediately before `Icon Grid`, matching `Pages.ts`.
- Add a Configuration-row entry for `Search Settings` describing its operator-managed suggested search terms.
- Do not rewrite historical plans/specs merely because they record older counts.

- [ ] **Step 4: Refresh and test**

Run:

```bash
pnpm project-context:update
pnpm test:project-context
pnpm exec vitest run tests/int/starter-productization.int.spec.ts tests/int/admin-documentation.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/project-inventory.json tests/int/project-context-repository.int.spec.ts
git commit -m "docs: align maintained project inventory"
```

If `tests/int/starter-productization.int.spec.ts` required a literal correction, add only that file to the same commit.

### Task 7: Validate the Complete Skill

**Files:**

- Modify only files required to repair failures introduced by Tasks 1–6.

**Interfaces:**

- Consumes: completed skill, generated inventory, scripts, docs, and existing tests.
- Produces: a validated project-context capability and final verification report.

- [ ] **Step 1: Run the official skill validator**

```bash
python3 /Users/tanishraj/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/project-context
```

Expected: success.

- [ ] **Step 2: Prove update/check stability**

```bash
pnpm project-context:update
pnpm project-context:check
cp .agents/skills/project-context/references/project-inventory.json /tmp/project-inventory-final.json
pnpm project-context:update
cmp /tmp/project-inventory-final.json .agents/skills/project-context/references/project-inventory.json
```

Expected: both commands exit 0 and `cmp` has no output. A graph warning is acceptable.

- [ ] **Step 3: Run focused contract tests**

```bash
pnpm test:project-context
pnpm exec vitest run tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/repository-hygiene.int.spec.ts tests/int/starter-productization.int.spec.ts tests/int/admin-documentation.int.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run type, lint, and integration verification**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
```

Expected: PASS. If MongoMemoryServer cannot bind or download in the environment, report that separately from deterministic/project-context results.

- [ ] **Step 5: Verify formatting and diff hygiene**

```bash
pnpm exec prettier --check AGENTS.md SKILL.md package.json README.md docs/architecture/feature-inventory.md .agents/skills/project-context tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts
git diff --check
git status --short
```

Expected: formatting and diff checks pass. The pre-existing `src/styles/themes/theme-snmih.css` modification may remain and must not be staged.

- [ ] **Step 6: Commit verification-only fixes if needed**

If verification changed files, stage only those exact project-context repair files and commit:

```bash
git add .agents/skills/project-context AGENTS.md SKILL.md package.json README.md docs/architecture/feature-inventory.md src/blocks/ReusableSection/config.ts src/payload-types.ts tests/int/project-context-lib.int.spec.ts tests/int/project-context-repository.int.spec.ts tests/int/starter-productization.int.spec.ts
git commit -m "fix(context): satisfy project checks"
```

Skip this commit when verification requires no changes.

- [ ] **Step 7: Final handoff**

Report the canonical skill path; exact generated counts; update/check/test commands; official validator, focused, and full test results; graph warning status; and unrelated user changes left untouched.
