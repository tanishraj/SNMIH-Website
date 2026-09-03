# Academic Programmes Inline Action with Bottom Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the programme action as an adjacent-arrow inline link below summary content whenever a card has bottom-positioned metadata.

**Architecture:** Keep the full card as the only anchor and derive a `usesInlineAction` presentation state inside `ProgrammeCard`. Reuse the same label and `ActionArrow`, but conditionally compose an unruled intrinsic-width action before the flexible spacer while preserving the existing ruled footer action for every other state.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Apply the inline treatment only when bottom-positioned metadata and a valid link are both present.
- Put the inline action after the description, or after the title when no description exists.
- Keep the arrow directly beside the label with a compact gap.
- Do not add a nested anchor.
- Preserve the ruled action footer for flow mode and bottom mode without metadata.
- Preserve the edge-to-edge metadata footer, theming, accessibility, and responsive behaviour.
- Do not add CMS fields or regenerate Payload types.
- Preserve unrelated and user-authored uncommitted changes.
- Do not stage, unstage, or commit files.

---

### Task 1: Define the conditional action contract

**Files:**

- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`

**Interfaces:**

- Produces `data-academic-programme-action="inline" | "ruled"` for focused presentation assertions.
- Consumes the existing `metadataPosition`, resolved `href`, description, and metadata values.

- [ ] **Step 1: Add failing inline-action assertions**

Give the existing linked bottom-metadata render a description, then assert:

```ts
expect(html).toContain('data-academic-programme-action="inline"')
expect(html.indexOf('Programme summary')).toBeLessThan(html.indexOf('Explore MBBS'))
expect(html.indexOf('Explore MBBS')).toBeLessThan(html.indexOf('Programme duration'))

const inlineActionClasses =
  html.match(/<div class="([^"]+)" data-academic-programme-action="inline">/)?.[1]?.split(' ') ?? []
expect(inlineActionClasses).not.toContain('border-t')
expect(html).toContain('inline-flex items-center gap-2')
```

- [ ] **Step 2: Add failing compatibility assertions**

For bottom mode with a link but no metadata, assert `data-academic-programme-action="ruled"`, `border-t`, and `w-full items-center justify-between`.

Add a linked bottom-metadata client render without a description and assert DOM order is title, inline action, metadata. Confirm only the outer programme card is an anchor.

- [ ] **Step 3: Run focused tests and confirm failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx
```

Expected: failures because the current action remains ruled and full-width in bottom-metadata cards.

### Task 2: Implement the inline action and verify the repository

**Files:**

- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify if needed: `.agents/skills/project-context/references/block-system.md`
- Modify through updater: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- `usesInlineAction` is true only for `hasBottomMetadata && programme.href`.
- `actionElement` retains one implementation boundary and exposes the selected presentation through a data attribute.

- [ ] **Step 1: Derive the conditional action state**

```ts
const usesInlineAction = hasBottomMetadata && Boolean(programme.href)
```

- [ ] **Step 2: Apply inline or ruled action classes**

```tsx
<div
  className={cn(
    usesInlineAction
      ? 'mt-5'
      : [
          'border-t pt-5',
          programme.description || hasMetadata ? 'mt-8' : 'mt-6',
          metadataPosition === 'flow' && 'mt-auto',
          dividerClassName,
        ],
  )}
  data-academic-programme-action={usesInlineAction ? 'inline' : 'ruled'}
>
  <span
    className={cn(
      'text-sm font-semibold',
      usesInlineAction
        ? 'inline-flex items-center gap-2'
        : 'flex w-full items-center justify-between',
      !usesDefaultSurface && surface.link,
    )}
  >
```

Keep the existing underlined label and `ActionArrow` children.

- [ ] **Step 3: Place inline action outside the bottom footer wrapper**

Compose bottom mode as:

```tsx
<>
  {usesInlineAction ? actionElement : null}
  {hasMetadata || (!usesInlineAction && actionElement) ? (
    <div className="mt-auto flow-root" data-academic-programme-bottom-content="true">
      {usesInlineAction ? null : actionElement}
      {metadataElement}
    </div>
  ) : null}
</>
```

Keep flow mode as metadata followed by the ruled action.

- [ ] **Step 4: Run focused and neighbouring tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts
```

Expected: all selected tests pass.

- [ ] **Step 5: Run static quality checks**

```bash
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AcademicProgrammes
```

Expected: TypeScript passes, lint has no new issues, and the detector returns `[]`.

- [ ] **Step 6: Complete project-context maintenance**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands succeed. Update the Academic Programmes paragraph only if the inline-action condition materially changes its maintained presentation contract.

- [ ] **Step 7: Audit the final diff**

```bash
git diff --check
git status --short
git diff -- src/blocks/AcademicProgrammes tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx .agents/skills/project-context/references docs/superpowers
```

Expected: no whitespace errors; only the intended refinement plus existing user work. Do not stage, unstage, or commit.
