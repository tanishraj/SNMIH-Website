# Profile Carousel Department Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional editor-authored Department metadata to every Profile Carousel profile and render it beneath Role / Designation in both card variants.

**Architecture:** Extend the existing embedded profile schema with one optional text field, normalize it in the server block component, and carry it through the existing shared `ProfileCarouselProfile` presentation type. The shared card component remains the single rendering owner for static and carousel modes, so both modes receive identical metadata behavior without new client state.

**Tech Stack:** Payload CMS 3 fields and generated types, React 19 server/client components, TypeScript, Tailwind CSS semantic theme tokens, Vitest server-rendered integration tests.

## Global Constraints

- `department` is optional editor-authored text stored inside each Profile Carousel profile row.
- Render metadata in this order: Name, Role / Designation when present, Department when present.
- Blank or whitespace-only departments render nothing.
- Existing records require no migration or backfill.
- Carousel behavior, images, surfaces, overlays, actions, and section settings remain unchanged.
- Do not stage or commit any changes.

---

### Task 1: Extend the Profile Carousel authoring schema

**Files:**

- Modify: `tests/int/profile-carousel.int.spec.ts:64-192`
- Modify: `src/blocks/ProfileCarousel/config.ts:34-63`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Consumes: the existing nested `profiles` array and its `createCardTabs` Content fields.
- Produces: optional `department?: string | null` on generated Profile Carousel profile rows.

- [ ] **Step 1: Write the failing schema assertion**

Add the Department lookup after `roleField`:

```ts
const roleField = getField(profileContentTab?.fields ?? [], 'role')
const departmentField = getField(profileContentTab?.fields ?? [], 'department')
```

Add these assertions after the existing Role assertion:

```ts
expect(roleField?.type).toBe('text')
expect(departmentField).toMatchObject({ label: 'Department', type: 'text' })
expect(departmentField?.required).not.toBe(true)

const profileContentNames = (profileContentTab?.fields ?? []).flatMap(({ name }) =>
  name ? [name] : [],
)
expect(profileContentNames.indexOf('department')).toBe(profileContentNames.indexOf('role') + 1)
```

- [ ] **Step 2: Run the focused test and verify the new assertion fails**

Run:

```bash
pnpm exec vitest run tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because the `department` field is absent.

- [ ] **Step 3: Add the optional Payload text field**

In `profilesField` Content fields, directly after `role`, add:

```ts
{
  name: 'department',
  label: 'Department',
  type: 'text',
},
```

Do not make the field required and do not add a default value.

- [ ] **Step 4: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `department?: string | null` in the `ProfileCarouselBlock.profiles` row and matching select types.

- [ ] **Step 5: Run the schema test again**

Run:

```bash
pnpm exec vitest run tests/int/profile-carousel.int.spec.ts
```

Expected: PASS.

---

### Task 2: Normalize and render Department in both card variants

**Files:**

- Modify: `tests/int/profile-carousel.int.spec.ts:32-62,194-387`
- Modify: `src/blocks/ProfileCarousel/Component.tsx:22-87`
- Modify: `src/components/profile-carousel-card.tsx:19-30,73-184`

**Interfaces:**

- Consumes: optional `department?: string | null` from a saved profile row.
- Produces: `ProfileCarouselProfile.department?: string | null`, normalized to trimmed text or `undefined` by `ProfileCarouselBlockComponent`.

- [ ] **Step 1: Add failing normalization and presentation coverage**

Add `department: 'Academic Affairs'` to the first shared profile fixture.

In the stacked-card test, assert the metadata and order:

```ts
expect(html).toContain('Academic Affairs')
expect(html.indexOf('Alex Morgan')).toBeLessThan(html.indexOf('Program Director'))
expect(html.indexOf('Program Director')).toBeLessThan(html.indexOf('Academic Affairs'))
```

In the overlay-card test, assert the same Department value is rendered:

```ts
expect(html).toContain('Academic Affairs')
```

Extend the server-component test input with deliberately padded text:

```ts
department: index === 0 ? '  Academic Affairs  ' : undefined,
```

Then assert normalization:

```ts
expect(html).toContain('Academic Affairs')
expect(html).not.toContain('  Academic Affairs  ')
```

Add a focused test proving Department renders without Role and blank Department is omitted:

```ts
it('renders optional department independently and omits blank metadata', () => {
  const html = renderToStaticMarkup(
    ProfileCarouselBlockComponent({
      profiles: [
        {
          department: '  Clinical Sciences  ',
          image: { alt: 'Dr Mira Shah', id: 1, url: '/mira.jpg' },
          name: 'Dr Mira Shah',
        },
        {
          department: '   ',
          image: { alt: 'Dr Arun Rao', id: 2, url: '/arun.jpg' },
          name: 'Dr Arun Rao',
        },
      ],
      title: 'Faculty',
    }),
  )

  expect(html).toContain('Clinical Sciences')
  expect(html).not.toContain('  Clinical Sciences  ')
  expect(html).not.toContain('>   <')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because Department is not part of the runtime profile type or card markup.

- [ ] **Step 3: Extend server normalization**

Add the property to `ProfileCarouselBlockLike.profiles`:

```ts
department?: string | null
```

Pass the normalized value into each resolved profile:

```ts
department: profile.department?.trim() || undefined,
```

Leave the existing name-and-image validity rule unchanged.

- [ ] **Step 4: Extend the shared presentation type**

Add this property to `ProfileCarouselProfile` in `profile-carousel-card.tsx`:

```ts
department?: string | null
```

No changes are required in `profile-carousel.tsx` or `profile-carousel-client.tsx`; both already pass complete profile objects to `ProfileCarouselCard`.

- [ ] **Step 5: Render the third metadata line in Overlay cards**

Immediately after the Role element, add:

```tsx
{
  profile.department ? (
    <p className={cn('text-xs leading-5', overlaySecondaryClassName)}>{profile.department}</p>
  ) : null
}
```

This inherits the resolved overlay foreground and remains subordinate to Role.

- [ ] **Step 6: Render the third metadata line in Stacked cards**

Immediately after the Role element, add:

```tsx
{
  profile.department ? (
    <p className={cn('text-xs leading-5', surface.secondary)}>{profile.department}</p>
  ) : null
}
```

This inherits the resolved semantic card surface and wraps naturally.

- [ ] **Step 7: Run Profile Carousel and shared card-renderer tests**

Run:

```bash
pnpm exec vitest run tests/int/profile-carousel.int.spec.ts tests/int/card-block-renderers.int.spec.tsx
```

Expected: PASS with Department visible in stacked and overlay output and all existing surface assertions intact.

---

### Task 3: Document and verify the completed contract

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`
- Verify: `src/payload-types.ts`

**Interfaces:**

- Consumes: the completed Profile Carousel schema and presentation behavior.
- Produces: current maintained project context and verified generated contracts.

- [ ] **Step 1: Update the maintained Profile Carousel narrative**

In `block-system.md`, document that every embedded profile supports optional editor-authored Department metadata, normalized as trimmed text and rendered beneath Role / Designation in both Text Below Image and Image Overlay cards. State that blank values are omitted and existing content needs no migration.

- [ ] **Step 2: Run formatting and focused verification**

Run:

```bash
pnpm exec prettier --check src/blocks/ProfileCarousel/config.ts src/blocks/ProfileCarousel/Component.tsx src/components/profile-carousel-card.tsx tests/int/profile-carousel.int.spec.ts .agents/skills/project-context/references/block-system.md
pnpm exec vitest run tests/int/profile-carousel.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
```

Expected: formatting, tests, and TypeScript pass. Lint may report only pre-existing warnings unrelated to these files.

- [ ] **Step 3: Refresh and check maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. A stale optional knowledge-graph warning is acceptable under the repository contract.

- [ ] **Step 4: Inspect the final change impact**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only intended files plus the user's pre-existing workspace changes are present. Do not stage or commit the implementation.
