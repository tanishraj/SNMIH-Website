# Leadership Profile Card Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Leadership Profiles cards into accessible academic dossiers with one shared card surface and distinct role, designation, qualification, and expertise levels.

**Architecture:** Keep the block server-rendered and non-interactive. Move the semantic card surface to block Theme Settings, resolve one surface for the entire grid with a first-profile legacy fallback, and pass it into every card. Keep card content structurally separate: role nameplate, adaptive name heading, designation accent, qualification definition, and expertise definition/list.

**Tech Stack:** Payload CMS 3, React server components, TypeScript, Tailwind CSS, semantic theme tokens, Vitest, Next Image.

## Global Constraints

- Preserve all existing staged and unstaged user changes.
- Do not stage or commit changes.
- Load `.agents/skills/impeccable/reference/craft-floor.md` immediately before editing UI.
- Preserve the existing card grid, portrait ratio, image crop settings, static interaction model, section header controls, and content normalization.
- Do not hard-code light-theme gray or green on semantic card surfaces.
- Keep existing saved per-profile background values as a runtime-only fallback; do not expose them in new authoring.
- Regenerate Payload types and the Leadership Profiles picker thumbnail.

---

### Task 1: Unify Card Surface Configuration

**Files:**

- Modify: `src/blocks/LeadershipProfiles/config.ts`
- Modify: `src/blocks/LeadershipProfiles/Component.tsx`
- Modify: `src/blocks/LeadershipProfiles/types.ts`
- Modify: `src/blocks/shared/cardThemeFields.ts`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Consumes: `createCardBackgroundField()` and `resolveCardSurface()`.
- Produces: top-level `cardBackground?: CardSurfaceValue | null` authoring and one normalized `resolvedCardBackground` used by every rendered profile.

- [ ] **Step 1: Write failing schema and surface-consistency tests**

Assert that Theme Settings expose one required top-level `cardBackground` with Default, Primary, Secondary, Muted, and Accent choices, while the nested compatibility field is hidden from Admin. Render two profiles with different legacy nested values and no top-level value, then assert both cards use the first valid legacy surface. Render again with an explicit block-level surface and assert it overrides every legacy value.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: the schema and shared-surface assertions fail because backgrounds are still profile-owned.

- [ ] **Step 3: Move the field and normalize compatibility data**

Extend `CreateCardBackgroundFieldOptions` with `adminHidden?: boolean` and apply it only when true:

```ts
admin: {
  description: adminDescription,
  ...(adminHidden ? { hidden: true } : {}),
}
```

Keep the profile-owned field registered with `adminHidden: true` so Payload continues reading existing saved values without showing the control. In `config.ts`, import `createCardBackgroundField` and add this visible field under block Theme Settings:

```ts
createCardBackgroundField({
  defaultOptionLabel: 'Default Card',
  adminDescription:
    'Applies one semantic card surface to every leadership profile for a consistent directory.',
})
```

Keep `cardBackground?: string | null` only on the component's legacy `LeadershipProfileValue`. Add top-level `cardBackground?: string | null` to `LeadershipProfilesBlockLike`. Resolve one value before profile rendering:

```ts
const legacyCardBackground = profiles?.find((profile) => profile.cardBackground)?.cardBackground
const resolvedCardBackground = resolveCardSurface(cardBackground ?? legacyCardBackground).value
```

Pass `resolvedCardBackground` to every `LeadershipProfileCard` and remove card background from `ResolvedLeadershipProfile`. The generated nested compatibility property remains present because its hidden schema field is intentionally retained.

- [ ] **Step 4: Regenerate types and verify the focused contract**

Run:

```bash
pnpm generate:types
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: generated types expose block-level `cardBackground`, retain the nested compatibility property, and the focused test passes.

---

### Task 2: Build the Academic Dossier Hierarchy

**Files:**

- Modify: `src/blocks/LeadershipProfiles/Component.tsx`
- Modify: `src/styles/custom.css`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Modify: `tests/int/card-block-theme-contract.int.spec.ts`

**Interfaces:**

- Consumes: the normalized card surface from Task 1 and the existing `surface.secondary`, `surface.link`, and SNMIH semantic tokens.
- Produces: `data-leadership-profile-label`, `data-leadership-profile-designation`, `data-leadership-profile-qualification`, and `data-leadership-profile-expertise` hooks plus adaptive `h2`/`h3` profile names.

- [ ] **Step 1: Write failing hierarchy, heading, and theme tests**

Add assertions that:

```ts
expect(titledHtml).toMatch(/<h3[^>]*>Dr\. Ananya Sharma<\/h3>/)
expect(titleFreeHtml).toMatch(/<h2[^>]*>Dr\. Ananya Sharma<\/h2>/)
expect(html).toContain('data-leadership-profile-qualification="true"')
expect(html).toContain('data-leadership-profile-expertise="true"')
expect(html).toContain('text-xs')
expect(html).not.toContain('absolute top-4 left-4')
```

Assert the role label appears after the image container and before the name, expertise alone owns its separator count, and designation/label carry the surface-aware accent data attribute.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts
```

Expected: hierarchy and adaptive-heading assertions fail against the flattened metadata implementation.

- [ ] **Step 3: Implement semantic hierarchy**

Remove the shared `Badge` import. Give `LeadershipProfileCard` `cardBackground` and `nameHeadingLevel: 'h2' | 'h3'` props. Inside the card, use `const NameHeading = nameHeadingLevel` and render:

```tsx
{
  profile.leadershipLabel ? (
    <p
      className="break-words font-mono text-[0.6875rem] leading-5 font-semibold uppercase tracking-[0.16em]"
      data-leadership-profile-accent-surface={surface.value}
      data-leadership-profile-label="true"
    >
      {profile.leadershipLabel}
    </p>
  ) : null
}
;<NameHeading className="break-words font-[family-name:var(--font-display)] text-xl leading-tight font-semibold text-current sm:text-2xl">
  {profile.name}
</NameHeading>
```

Keep designation sans-serif at `text-sm font-medium` with the same accent data attribute. Replace the combined metadata array with a compact `dl`: a screen-reader-only `Qualification` term and `text-sm` value, followed by a screen-reader-only `Expertise` term and a `text-xs` dot-separated list. Use `text-muted-foreground` for Default and `surface.secondary` for explicit surfaces.

Pass `nameHeadingLevel={hasHeading ? 'h3' : 'h2'}` from the block component.

- [ ] **Step 4: Add the SNMIH surface-aware accent contract**

In `src/styles/custom.css`, add disjoint selectors for `data-leadership-profile-accent-surface`:

- SNMIH light mode Default/Secondary/Muted/Accent: mix `--success` toward `--foreground` until normal text reaches AA contrast.
- SNMIH light-mode Primary: use `--ring` on the navy surface.
- SNMIH dark-mode Default/Secondary/Muted/Accent: use `--ring` on dark surfaces.
- SNMIH dark-mode Primary: use `--primary-foreground` on the inverted light surface.

Other themes retain the component's semantic surface accent fallback. Do not add literal component-level color values.

- [ ] **Step 5: Run hierarchy and theme tests**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all hierarchy, theme, server-only, and shared-eyebrow contracts pass.

---

### Task 3: Refresh Visual Evidence and Documentation

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx` only if required to demonstrate the approved hierarchy
- Regenerate: `public/block-thumbnails/leadership-profiles.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the final production component from Tasks 1–2.
- Produces: an accurate 1600×900 picker preview and current operator/architecture contracts.

- [ ] **Step 1: Update documentation contracts**

Document the single block-wide semantic card surface, content-area academic role nameplate, optional heading behavior, adaptive profile heading level, and separated designation/qualification/expertise hierarchy.

- [ ] **Step 2: Regenerate and inspect the picker thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Inspect `public/block-thumbnails/leadership-profiles.jpg` at original resolution. Confirm the role nameplate no longer overlays portraits, designation remains subordinate to the name, qualification and expertise are distinct, cards align at equal height, and the 1600×900 output is clean.

- [ ] **Step 3: Run the complete affected verification suite**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/section-eyebrow.int.spec.tsx tests/int/system-page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/LeadershipProfiles/Component.tsx
pnpm project-context:update
pnpm project-context:check
git diff --check
git diff --cached --check
```

Expected: all tests and TypeScript pass; lint reports zero errors; detector returns `[]`; project context is current apart from accepted repository warnings; both diff checks are clean.

- [ ] **Step 4: Review final impact without staging or committing**

Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md`. Confirm generated types have native Payload formatting, no unrelated user change was overwritten, existing staged state was preserved, and no new staging or commit occurred.
