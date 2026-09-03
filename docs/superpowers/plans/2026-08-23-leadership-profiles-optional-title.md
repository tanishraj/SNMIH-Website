# Leadership Profiles Optional Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Leadership Profiles section title optional without leaving an empty header or unwanted spacing.

**Architecture:** Keep the existing Payload block shape and server-rendered component. Normalize each optional header value once, derive whether a header exists, and conditionally render the current header composition while leaving profile cards and footer actions unchanged.

**Tech Stack:** Payload CMS 3, React server components, TypeScript, Tailwind CSS, Vitest.

## Global Constraints

- Preserve all existing staged and unstaged user changes.
- Do not commit or stage changes.
- Do not create fallback title content.
- Existing titled blocks must render unchanged.

---

### Task 1: Make the Leadership Profiles Header Optional

**Files:**
- Modify: `src/blocks/LeadershipProfiles/config.ts`
- Modify: `src/blocks/LeadershipProfiles/Component.tsx`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Regenerate: `src/payload-types.ts`
- Modify if required by the context loop: `.agents/skills/project-context/references/block-system.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the existing `LeadershipProfilesBlockLike` optional header fields and normalized profiles.
- Produces: an optional Payload `title` property and conditional server-rendered header markup.

- [ ] **Step 1: Write failing schema and renderer tests**

Change the schema assertion to require an optional text field:

```ts
expect(findField(contentFields, 'title')).toMatchObject({ type: 'text' })
expect(findField(contentFields, 'title')?.required).not.toBe(true)
```

Replace the title-required rendering assertion with cases proving that profiles render without a title, accent title can stand alone as the `h2`, optional non-title header content remains visible, and a completely empty header produces neither header markup nor an empty heading.

- [ ] **Step 2: Run the focused test and verify the new assertions fail**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: failure because `title` remains required and the component returns `null` without it.

- [ ] **Step 3: Make the schema and renderer changes**

Remove `required: true` from the Payload title field. In the component, trim every optional header value, derive a `hasHeader` boolean, remove the title-based early return, and render the header only when `hasHeader` is true. Render an `h2` only when either title value exists:

```tsx
const resolvedEyebrow = eyebrow?.trim()
const resolvedTitle = title?.trim()
const resolvedAccentTitle = accentTitle?.trim()
const resolvedDescription = description?.trim()
const hasHeading = Boolean(resolvedTitle || resolvedAccentTitle)
const hasHeader = Boolean(
  resolvedEyebrow || hasHeading || resolvedDescription || resolvedActions.length,
)
```

Keep the grid gap by placing the existing gap on the header-and-grid wrapper only when the header exists. Do not derive a title from any profile field.

- [ ] **Step 4: Regenerate Payload types and run verification**

Run:

```bash
pnpm generate:types
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
pnpm exec tsc --noEmit
pnpm project-context:update
pnpm project-context:check
git diff --check
```

Expected: all focused tests and TypeScript pass; generated types expose optional `title`; project context is current apart from accepted repository warnings; diff check is clean.

- [ ] **Step 5: Review the final diff without staging or committing**

Run:

```bash
git status --short
git diff -- src/blocks/LeadershipProfiles/config.ts src/blocks/LeadershipProfiles/Component.tsx tests/int/leadership-profiles.int.spec.tsx src/payload-types.ts .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: only the approved optional-title behavior and required generated/context updates are present; no commit is created.
