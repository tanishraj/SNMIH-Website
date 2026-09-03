# Featured Profile Carousel Header Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match shared overlay-card department metadata to the established Department Profile label style and place embedded featured-carousel controls on the same row as its subsection title.

**Architecture:** Add an optional header and control-layout contract to the section-free `ProfileCarouselCollection`, with `ProfileCarouselClient` retaining its current floating control layout by default. Department Profiles opts into inline controls and supplies its semantic subsection heading through the shared collection. The shared overlay card changes only department order and typography; the stacked variant remains unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Embla-backed shadcn Carousel, Vitest, Testing Library.

## Global Constraints

- Do not change Payload fields, generated types, migrations, filters, search, autoplay, card sizing, carousel thresholds, or directory cards.
- Image Overlay cards render Department, Name, then Role / Designation.
- Department uses compact uppercase mono label typography and inherits the resolved overlay foreground.
- Text Below Image cards retain Name, Role / Designation, then Department.
- Department Profiles supplies its existing semantic h2/h3 subsection title through the shared collection.
- Five-to-twelve embedded featured profiles place title and Previous/Next controls in one normal-flow row without `pt-14`.
- One-to-four embedded featured profiles retain a title above the static grid and render no controls.
- Standalone Profile Carousel retains its current floating controls and reserved top spacing.
- Previous/Next accessible names, touch targets, focus treatment, loop behavior, drag/swipe behavior, and responsive item widths remain unchanged.
- Do not stage or commit changes.
- Complete the required project-context update/check loop after implementation.

---

## File Map

- Modify `src/components/profile-carousel-card.tsx`: align overlay department order and label typography.
- Modify `src/components/profile-carousel-client.tsx`: support default floating controls and optional inline header controls.
- Modify `src/components/profile-carousel-collection.tsx`: forward the header/control layout and preserve static-grid behavior.
- Modify `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`: supply the Featured Profiles heading through the collection and opt into inline controls.
- Modify `tests/int/profile-carousel.int.spec.ts`: lock overlay metadata order/typography and standalone-control compatibility.
- Modify `tests/int/department-profiles.int.spec.tsx`: lock the embedded same-row title/control layout and removed spacer.
- Modify `.agents/skills/project-context/references/block-system.md`: record the refined shared overlay label and embedded header/control contract.
- Refresh `.agents/skills/project-context/references/project-inventory.json` only through the required updater.

---

### Task 1: Align shared overlay-card department metadata

**Files:**

- Modify: `src/components/profile-carousel-card.tsx`
- Test: `tests/int/profile-carousel.int.spec.ts`

**Interfaces:**

- Consumes the existing `ProfileCarouselProfile.department` value and resolved overlay foreground.
- Produces `data-profile-carousel-department="true"` on overlay department labels for a stable rendering contract.
- Leaves the stacked-card branch unchanged.

- [ ] **Step 1: Write the failing overlay metadata test**

Extend the existing configurable-overlay test in `tests/int/profile-carousel.int.spec.ts`:

```ts
const departmentIndex = html.indexOf('data-profile-carousel-department="true"')
const nameIndex = html.indexOf('Alex Morgan', departmentIndex)
const roleIndex = html.indexOf('Program Director', nameIndex)

expect(departmentIndex).toBeGreaterThan(-1)
expect(departmentIndex).toBeLessThan(nameIndex)
expect(nameIndex).toBeLessThan(roleIndex)
expect(html).toContain('font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]')
```

Keep the existing stacked-card assertion proving `name < role < department` so the test suite locks both variants independently.

- [ ] **Step 2: Run the Profile Carousel suite and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because the overlay department remains below Role and has no label data attribute or compact mono classes.

- [ ] **Step 3: Move and restyle only the overlay department**

In the overlay content container of `ProfileCarouselCard`, place this block before the profile name:

```tsx
{
  profile.department ? (
    <p
      className="font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]"
      data-profile-carousel-department="true"
    >
      {profile.department}
    </p>
  ) : null
}
```

Keep the name and Role / Designation blocks immediately after it. Remove the former overlay-only department paragraph below Role. Do not change `overlaySecondaryClassName`, the parent overlay text class, or the stacked branch.

- [ ] **Step 4: Run the focused suite and diff check**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts
git diff --check -- src/components/profile-carousel-card.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: all Profile Carousel tests pass and the diff check prints nothing. Do not stage or commit.

---

### Task 2: Add inline featured-heading carousel controls

**Files:**

- Modify: `src/components/profile-carousel-client.tsx`
- Modify: `src/components/profile-carousel-collection.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Test: `tests/int/profile-carousel.int.spec.ts`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces `ProfileCarouselControlsLayout = 'floating' | 'inline'` from `profile-carousel-client.tsx`.
- `ProfileCarouselClient` accepts `controlsLayout?: ProfileCarouselControlsLayout` and `header?: ReactNode`.
- `ProfileCarouselCollection` accepts and forwards the same optional properties.
- Default `controlsLayout` is `floating`, preserving the standalone Profile Carousel.

- [ ] **Step 1: Add failing embedded and standalone layout assertions**

In `tests/int/department-profiles.int.spec.tsx`, add a five-profile client rendering test:

```tsx
it('places featured carousel controls in the subsection heading row', () => {
  const profiles = Array.from({ length: 5 }, (_, index) =>
    createProfile(index + 1, { featured: true }),
  )
  const html = renderToStaticMarkup(
    <DepartmentProfilesClient
      {...baseClientProps}
      featuredCarouselTitle="Featured Profiles"
      profiles={profiles}
      showFeaturedCarousel
    />,
  )
  const headerStart = html.indexOf('data-profile-carousel-header="inline"')
  const headerEnd = html.indexOf('</div>', headerStart)
  const inlineHeader = html.slice(headerStart, headerEnd)

  expect(headerStart).toBeGreaterThan(-1)
  expect(inlineHeader).toContain('Featured Profiles')
  expect(inlineHeader).toContain('aria-label="Previous profile"')
  expect(inlineHeader).toContain('aria-label="Next profile"')
  expect(html).not.toContain('relative w-full pt-14')
})
```

Because the header contains nested button `<div>` elements, make the boundary assertion resilient by replacing `headerEnd` with the next `data-slot="carousel-content"` index if the generated markup includes nested closing tags:

```ts
const contentStart = html.indexOf('data-slot="carousel-content"', headerStart)
const inlineHeader = html.slice(headerStart, contentStart)
```

In the existing standalone five-profile test in `tests/int/profile-carousel.int.spec.ts`, add:

```ts
expect(html).toContain('relative w-full pt-14')
expect(html).not.toContain('data-profile-carousel-header="inline"')
```

- [ ] **Step 2: Run both suites and confirm the inline-header test fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: Department Profiles fails because its heading remains outside the carousel and the carousel still uses `pt-14`; standalone assertions continue to pass.

- [ ] **Step 3: Add the control-layout contract to the client carousel**

In `src/components/profile-carousel-client.tsx`, import `type ReactNode` and `cn`, then add:

```ts
export type ProfileCarouselControlsLayout = 'floating' | 'inline'
```

Add these props:

```ts
controlsLayout?: ProfileCarouselControlsLayout
header?: ReactNode
```

Default `controlsLayout = 'floating'`. Extract the repeated buttons into a local component:

```tsx
function ProfileCarouselControls({ className }: { className: string }) {
  return (
    <div className={className}>
      <CarouselPrevious
        aria-label="Previous profile"
        className="static inset-auto translate-y-0"
        variant="default"
      />
      <CarouselNext
        aria-label="Next profile"
        className="static inset-auto translate-y-0"
        variant="default"
      />
    </div>
  )
}
```

Replace the carousel shell/control block with:

```tsx
<Carousel
  className={cn('relative w-full', controlsLayout === 'floating' && 'pt-14')}
  data-carousel-loop="true"
  opts={{ align: 'start', loop: true }}
>
  {controlsLayout === 'inline' ? (
    <div
      className="mb-5 flex min-h-11 min-w-0 items-center gap-4 md:mb-6"
      data-profile-carousel-header="inline"
    >
      {header ? <div className="min-w-0 flex-1">{header}</div> : null}
      <ProfileCarouselControls className="ml-auto flex shrink-0 items-center justify-end gap-2" />
    </div>
  ) : (
    <ProfileCarouselControls className="absolute top-0 right-0 flex h-10 items-center justify-end gap-2" />
  )}
  <CarouselContent className="-ml-5">
    {profiles.map((profile, index) => (
      <CarouselItem className="pl-5 md:basis-1/2 lg:basis-1/4" key={`${profile.name}-${index}`}>
        <ProfileCarouselCard
          overlayAlignment={overlayAlignment}
          overlayCoverage={overlayCoverage}
          overlayDirection={overlayDirection}
          overlayStyle={overlayStyle}
          profile={profile}
          sectionBackground={sectionBackground}
          size={size}
          themeMode={themeMode}
          variant={cardVariant}
        />
      </CarouselItem>
    ))}
  </CarouselContent>
</Carousel>
```

The existing item map remains byte-for-byte equivalent inside `CarouselContent`.

- [ ] **Step 4: Forward the optional header through the shared collection**

In `src/components/profile-carousel-collection.tsx`, import `type ReactNode` and `type ProfileCarouselControlsLayout`. Add props:

```ts
controlsLayout?: ProfileCarouselControlsLayout
header?: ReactNode
```

Default `controlsLayout = 'floating'` and pass both properties to `ProfileCarouselClient` in the five-plus branch:

```tsx
<ProfileCarouselClient
  cardVariant={cardVariant}
  controlsLayout={controlsLayout}
  header={header}
  overlayAlignment={overlayAlignment}
  overlayCoverage={overlayCoverage}
  overlayDirection={overlayDirection}
  overlayStyle={overlayStyle}
  profiles={visibleProfiles}
  sectionBackground={sectionBackground}
  size={size}
  themeMode={themeMode}
/>
```

For the static branch, preserve the exact grid when no header exists. When a header exists, wrap it without adding a section:

```tsx
const grid = (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
    {visibleProfiles.map((profile, index) => (
      <ProfileCarouselCard
        key={`${profile.name}-${index}`}
        overlayAlignment={overlayAlignment}
        overlayCoverage={overlayCoverage}
        overlayDirection={overlayDirection}
        overlayStyle={overlayStyle}
        profile={profile}
        sectionBackground={sectionBackground}
        size={size}
        themeMode={themeMode}
        variant={cardVariant}
      />
    ))}
  </div>
)

if (!header) return grid

return (
  <div className="flex min-w-0 flex-col gap-5 md:gap-6">
    <div data-profile-carousel-header="static">{header}</div>
    {grid}
  </div>
)
```

- [ ] **Step 5: Supply the Department Profiles heading through the collection**

In the `showFeaturedRegion` branch of `DepartmentProfilesClient`, remove the separate heading and outer gap classes. Pass the semantic title and inline layout directly:

```tsx
<div data-department-profiles-featured="true">
  <ProfileCarouselCollection
    key={activeId}
    cardVariant={featuredCarouselCardVariant}
    controlsLayout="inline"
    header={
      featuredCarouselTitle ? (
        <SubsectionHeading className="font-sans text-xl leading-tight font-semibold tracking-tight text-current sm:text-2xl">
          {featuredCarouselTitle}
        </SubsectionHeading>
      ) : undefined
    }
    overlayAlignment={featuredCarouselOverlayAlignment}
    overlayCoverage={featuredCarouselOverlayCoverage}
    overlayDirection={featuredCarouselOverlayDirection}
    overlayStyle={featuredCarouselOverlayStyle}
    profiles={featuredProfiles}
    sectionBackground={background}
    size={featuredCarouselSize}
    themeMode={featuredCarouselThemeMode}
  />
</div>
```

Do not change `showFeaturedRegion`, department filtering, search suppression, the collection key, directory title, status region, grid, or Load More.

- [ ] **Step 6: Run focused tests and static checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx src/components/profile-carousel-card.tsx src/components/profile-carousel-client.tsx src/components/profile-carousel-collection.tsx tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
git diff --check -- src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx src/components/profile-carousel-card.tsx src/components/profile-carousel-client.tsx src/components/profile-carousel-collection.tsx tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: both focused suites, TypeScript, and lint pass; the diff check prints nothing. Do not stage or commit.

---

### Task 3: Update maintained context and complete verification

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify through updater: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Documents the shared overlay department-label order and Department Profiles inline-control ownership.
- Does not change Payload schema or generated Payload types.

- [ ] **Step 1: Update the maintained block contract**

In the Profile Carousel paragraph of `block-system.md`, replace the overlay metadata description with:

```markdown
Image Overlay renders Department as compact uppercase mono label metadata above Name and Role /
Designation; Text Below Image retains Name, Role / Designation, then Department as secondary copy.
```

Extend the Department Profiles featured-area paragraph with:

```markdown
When the featured set uses the manual carousel, its semantic subsection title and Previous/Next
controls share one normal-flow header row; static featured sets retain the title without controls.
```

- [ ] **Step 2: Run formatting and focused regression checks**

Run:

```bash
pnpm exec prettier --check src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx src/components/profile-carousel-card.tsx src/components/profile-carousel-client.tsx src/components/profile-carousel-collection.tsx tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts docs/superpowers/specs/2026-08-28-featured-profile-carousel-header-design.md docs/superpowers/plans/2026-08-28-featured-profile-carousel-header.md
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: formatting and all focused tests pass.

- [ ] **Step 3: Run the mandatory project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: maintained inventory is current. A stale optional knowledge-graph warning is non-blocking.

- [ ] **Step 4: Review the final unstaged diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; the intended implementation, tests, context, spec, and plan remain unstaged and uncommitted alongside the previously approved featured-carousel work.

## Final Acceptance Checklist

- Overlay cards render Department before Name and Role / Designation with compact uppercase mono styling.
- Stacked cards retain Name, Role / Designation, then Department.
- Embedded five-plus carousel title and buttons share `data-profile-carousel-header="inline"`.
- Embedded five-plus carousel has no `pt-14` reserved spacer.
- Embedded static collections display the semantic title and no buttons.
- Standalone carousel retains floating controls and `pt-14`.
- Buttons retain existing accessible names, sizes, focus states, and behavior.
- Filtering, search suppression, carousel reset key, directory contents, and Load More remain unchanged.
- Focused tests, TypeScript, lint, Prettier, diff check, and project-context check pass.
