# Leadership Profile Name Sans Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Leadership Profiles card names with the project sans-serif font while preserving their existing hierarchy and spacing.

**Architecture:** Keep the change local to the name heading in `LeadershipProfileCard`. Strengthen the existing rendering contract before replacing the display-font utility with `font-sans`; no Payload schema or generated type changes are required.

**Tech Stack:** React, Next.js, Tailwind CSS, Vitest, TypeScript

## Global Constraints

- Preserve the existing heading level selection, font size, weight, line height, wrapping, and responsive behavior.
- Do not change section title typography, designation, qualification, expertise, schema, or saved content.
- Do not stage or commit changes.

---

### Task 1: Use Sans Typography for Profile Names

**Files:**

- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Modify: `src/blocks/LeadershipProfiles/Component.tsx`

**Interfaces:**

- Consumes: `LeadershipProfilesBlockComponent` static rendering and the existing adaptive `h2`/`h3` name-heading behavior.
- Produces: Profile name headings with `font-sans` and without `font-[family-name:var(--font-display)]`.

- [ ] **Step 1: Strengthen the rendering contract**

Add these assertions to the existing static-card test after the profile heading assertion:

```tsx
expect(html).toMatch(/<h3[^>]*class="[^"]*font-sans[^"]*"[^>]*>Dr\. Ananya Sharma<\/h3>/)
expect(html).not.toMatch(
  /<h3[^>]*class="[^"]*font-\[family-name:var\(--font-display\)\][^"]*"[^>]*>Dr\. Ananya Sharma<\/h3>/,
)
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: the `font-sans` assertion fails because the profile name still uses the display-font utility.

- [ ] **Step 3: Replace only the profile-name font utility**

Change the `NameHeading` class in `src/blocks/LeadershipProfiles/Component.tsx` to:

```tsx
<NameHeading className="break-words font-sans text-xl leading-tight font-semibold text-current sm:text-2xl">
```

- [ ] **Step 4: Run focused and type verification**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: the Leadership Profiles test file passes and TypeScript reports no errors.

- [ ] **Step 5: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
```

Expected: project context is current and the diff contains no whitespace errors. Since the behavior and architecture contract do not change, the inventory update may be a no-op and no narrative reference update is required.
