# SNMIH-Blue Radius Implementation Plan

> **For agentic workers:** Implement this plan task-by-task in the current working tree. Do not commit or stage changes.

**Goal:** Restore the SNMIH-Blue shared website radius to `0.5rem` and align its test and maintained architecture contract.

**Architecture:** The existing semantic radius utilities remain unchanged and continue deriving cards and controls from the theme-level `--radius` variable. Only the SNMIH-Blue token, its focused contract assertion, and the maintained description of its geometry change.

**Tech Stack:** Tailwind CSS 4 theme tokens, Vitest, TypeScript project-context tooling.

## Global Constraints

- SNMIH-Blue must define `--radius: 0.5rem`.
- SNMIH-Green, explicit pills/circles, component markup, Payload Admin, and stored CMS content must remain unchanged.
- Keep all changes uncommitted and unstaged.

---

### Task 1: Restore the SNMIH-Blue radius contract

**Files:**

- Modify: `tests/int/theme-settings.int.spec.ts`
- Modify: `src/styles/themes/theme-snmih-blue.css`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Generated update: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the existing semantic radius utilities that derive from `--radius`.
- Produces: the SNMIH-Blue contract `--radius: 0.5rem` and matching maintained documentation.

- [ ] **Step 1: Change the focused contract first**

In `tests/int/theme-settings.int.spec.ts`, replace:

```ts
expect(blueSource).toContain('--radius: 0;')
```

with:

```ts
expect(blueSource).toContain('--radius: 0.5rem;')
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
pnpm vitest run tests/int/theme-settings.int.spec.ts
```

Expected: FAIL because `theme-snmih-blue.css` still defines `--radius: 0;`.

- [ ] **Step 3: Restore the theme token**

In `src/styles/themes/theme-snmih-blue.css`, replace:

```css
--radius: 0;
```

with:

```css
--radius: 0.5rem;
```

- [ ] **Step 4: Align the maintained architecture wording**

In `.agents/skills/project-context/references/architecture.md`, replace the sentence that says SNMIH-Blue remains square with wording that states:

```md
Cards, media frames, controls, and compact details therefore remain subtly rounded in SNMIH-Blue and more generously rounded in SNMIH-Green, while explicit pills and circular controls continue to use `rounded-full`.
```

- [ ] **Step 5: Format and run affected tests**

Run:

```bash
pnpm exec prettier --write src/styles/themes/theme-snmih-blue.css tests/int/theme-settings.int.spec.ts .agents/skills/project-context/references/architecture.md
pnpm vitest run tests/int/theme-settings.int.spec.ts tests/int/semantic-radius-contract.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 6: Complete the repository context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; a stale knowledge-graph warning may remain non-blocking.

- [ ] **Step 7: Verify the uncommitted diff**

Run:

```bash
git diff --check
git diff --cached --name-only
git status --short
```

Expected: no whitespace errors, no staged files, and the radius changes remain uncommitted.
