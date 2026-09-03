# Leadership Profile Overlay Label Accent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Image Overlay Leadership Label an adaptive SNMIH green highlight while preserving the Standard layout and every other overlay text color.

**Architecture:** Keep the change local to the existing server component. Derive the label utility from the already normalized overlay tone, apply it only to the Image Overlay label, and lock the three tone outcomes with focused render tests.

**Tech Stack:** React Server Components, Tailwind CSS v4 semantic tokens, Vitest, TypeScript

## Global Constraints

- Light overlay tone uses `text-success`.
- Dark and Brand overlay tones use `text-ring`.
- The label remains plain uppercase monospace text with no pill, background, border, icon, link, or interaction.
- Standard cards retain their existing surface-aware label color.
- No Payload schema, generated type, migration, or content change is required.
- Preserve all current user changes and do not stage or commit files.

---

### Task 1: Add the Adaptive Image Overlay Label Accent

**Files:**

- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Modify: `src/blocks/LeadershipProfiles/Component.tsx`
- Regenerate: `public/block-thumbnails/leadership-profiles.jpg`
- Verify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: `overlay.tone` from `ReturnType<typeof resolveMediaOverlay>`, normalized to `light`, `dark`, or `brand`.
- Produces: one Image Overlay label class: `text-success` for `light`, otherwise `text-ring`.

- [ ] **Step 1: Add the failing adaptive-color render contract**

Add this test immediately after the existing Image Overlay rendering test in `tests/int/leadership-profiles.int.spec.tsx`:

```tsx
it.each([
  ['light', 'text-success'],
  ['dark', 'text-ring'],
  ['brand', 'text-ring'],
] as const)('highlights the Image Overlay label for the %s tone', (themeMode, expectedClass) => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      cardLayout="imageOverlay"
      profiles={[
        {
          image: validImage,
          leadershipLabel: 'General Medicine',
          name: 'Dr. Rakesh Kumar Jha',
        },
      ]}
      themeMode={themeMode}
    />,
  )

  expect(html).toMatch(
    new RegExp(`<p class="[^"]*${expectedClass}[^"]*" data-leadership-profile-label="true">`),
  )
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: the three new cases fail because the Image Overlay label still uses the shared overlay eyebrow color.

- [ ] **Step 3: Derive and apply the semantic green label class**

In `LeadershipProfileCard`, immediately after `staticAccentClass`, add:

```tsx
const overlayLabelClass = overlay.tone === 'light' ? 'text-success' : 'text-ring'
```

In the Image Overlay label, replace `overlay.text.eyebrow` with `overlayLabelClass`:

```tsx
<p
  className={cn(
    'wrap-break-word font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]',
    overlayLabelClass,
  )}
  data-leadership-profile-label="true"
>
  {profile.leadershipLabel}
</p>
```

Do not change the Standard branch, the name, or the designation.

- [ ] **Step 4: Run focused render and type verification**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all Leadership Profiles tests pass and TypeScript reports no errors.

- [ ] **Step 5: Regenerate and inspect only the Leadership Profiles thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=leadershipProfiles pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/leadership-profiles.jpg` remains 1600×900 and shows a green Leadership Label on every dark portrait overlay without changing card geometry or the white name/designation hierarchy.

- [ ] **Step 6: Complete repository verification**

Run:

```bash
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/LeadershipProfiles/Component.tsx
pnpm project-context:update
pnpm project-context:check
git diff --check
git diff --cached --check
```

Expected: lint has no errors, the UI detector returns `[]`, project context is current, and both diff checks pass. The existing unrelated Google Tag Manager lint warning and stale knowledge-graph warning may remain.

- [ ] **Step 7: Audit the final unstaged diff**

Confirm that the implementation changes only the Image Overlay label color, its focused test coverage, the targeted thumbnail artifact, and the generated project inventory if its facts change. Confirm that no files were staged or committed and that all pre-existing user changes remain present.
