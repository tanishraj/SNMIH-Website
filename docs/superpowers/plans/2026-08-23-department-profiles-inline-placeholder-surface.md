# Department Profiles Inline Placeholder Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Inline Department Profile missing-image placeholders a visible tint derived from the resolved card, section, or page surface while leaving Image Overlay placeholders unchanged.

**Architecture:** Keep the private `ProfileMedia` helper's optional placeholder class. Inline cards pass a surface-aware current-color tint without an outline; callers that omit the prop retain the existing neutral fallback.

**Tech Stack:** React, Next.js Image, Tailwind CSS, Vitest, Testing Library

## Global Constraints

- Preserve the existing Image Overlay fallback and all real-image rendering.
- Do not add a Payload field or change generated Payload types.
- Preserve all existing user changes.
- Do not stage or commit changes.

---

### Task 1: Surface-aware Inline placeholder

**Files:**

- Modify: `src/blocks/DepartmentProfiles/DepartmentProfileCard.tsx`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Consumes: `CardSurfaceClasses.secondary` returned by `resolveCardSurface(...)`.
- Produces: optional `placeholderClassName?: string` on the private `ProfileMediaProps` interface.

- [ ] **Step 1: Write the failing rendering assertions**

Extend the existing missing-image card test so the Inline card slice requires a surface-aware tint without a ring while excluding both fixed backgrounds. Also verify the Overlay fallback remains neutral:

```tsx
const inlinePlaceholder = renderDirectory('inline', 'md', [
  createProfile(50, { image: undefined, name: 'Doctor Without Portrait' }),
])
const inlinePlaceholderElement = inlinePlaceholder.slice(
  inlinePlaceholder.indexOf('data-department-profile-placeholder="true"') - 160,
  inlinePlaceholder.indexOf('data-department-profile-placeholder="true"') + 80,
)
expect(inlinePlaceholderElement).toContain('bg-current/10')
expect(inlinePlaceholderElement).not.toContain('ring-')
expect(inlinePlaceholderElement).toContain('text-muted-foreground')
expect(inlinePlaceholderElement).not.toContain('bg-muted')
expect(inlinePlaceholder).not.toContain('bg-background/60')

const overlayPlaceholder = renderDirectory('overlay', 'md', [
  createProfile(51, { image: undefined, name: 'Overlay Without Portrait' }),
])
expect(overlayPlaceholder).toContain('items-center justify-center bg-muted text-muted-foreground')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: the Inline placeholder assertion fails because it still includes the inset ring utilities.

- [ ] **Step 3: Add the optional placeholder surface class**

Update `ProfileMediaProps` and merge the supplied class with the existing fallback:

```tsx
type ProfileMediaProps = {
  className?: string
  imageSizes: string
  placeholderClassName?: string
  profile: ResolvedDepartmentProfile
}

function ProfileMedia({ className, imageSizes, placeholderClassName, profile }: ProfileMediaProps) {
  // Existing image branch remains unchanged.
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Existing image branch */}
      <div
        className={cn(
          'flex size-full items-center justify-center',
          placeholderClassName ?? 'bg-muted text-muted-foreground',
        )}
        data-department-profile-placeholder="true"
      >
        <UserRound aria-hidden="true" className="size-1/3" strokeWidth={1.5} />
      </div>
    </div>
  )
}
```

Pass the Inline surface tint without a fixed wrapper background:

```tsx
<ProfileMedia
  className={cn('shrink-0 rounded-lg', inlineSize.image)}
  imageSizes={inlineSize.imageSizes}
  placeholderClassName={cn('bg-current/10', surface.secondary)}
  profile={profile}
/>
```

Do not pass `placeholderClassName` in the Image Overlay branch.

- [ ] **Step 4: Run focused and shared presentation checks**

Run:

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx tests/int/media-overlay.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DepartmentProfiles tests/int/department-profiles.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DepartmentProfiles
git diff --check
```

Expected: tests, TypeScript, ESLint, and diff checks pass; the detector returns an empty JSON array.

- [ ] **Step 5: Complete the permitted project-context check**

Run:

```bash
pnpm project-context:check
```

Expected: report the known stale inventory if it remains. Do not retry the updater because its previous write escalation was denied and requires separate explicit approval. This presentation-only refinement does not require a narrative block-system update.

- [ ] **Step 6: Review without committing**

Inspect the focused diff and report the result. Do not run `git add` or `git commit`.
