# Semantic Radius Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public-frontend radius drift with theme-derived card, control, compact, pill, and square roles while capping cards and standard controls at 12px.

**Architecture:** Add semantic Tailwind radius tokens derived from the selected theme's `--radius`, migrate every public frontend radius utility to a semantic role, and enforce the contract with a scoped source audit. Parent surfaces own clipping; joined children remain square; only explicit pill/circle variants use `rounded-full`.

**Tech Stack:** Tailwind CSS 4, React 19, Next.js 16, Vitest, Testing Library, Payload CMS project-context tooling.

## Global Constraints

- Public website and shared frontend primitives only; do not restyle Payload Admin.
- `--radius-card` and `--radius-control` equal `min(var(--radius, 0.625rem), 0.75rem)`.
- `--radius-compact` equals `min(calc(var(--radius, 0.625rem) * 0.5), 0.25rem)`.
- Cards and standard controls never exceed 12px; compact elements never exceed 4px.
- `rounded-full` is reserved for explicit pills, circles, avatars, badges, chips, progress tracks, and circular icon controls.
- Joined children and parent-clipped nested content use `rounded-none` or no radius utility.
- Preserve colors, borders, shadows, typography, spacing, motion, behavior, and Payload data contracts.
- Do not stage or commit changes unless the user explicitly requests it.

## Repository Inventory

The initial audit found 240 radius usages in 100 public frontend files:

```text
50 rounded-full
49 rounded-[var(--radius)]
37 rounded-md
22 rounded-xl
19 rounded-lg
17 rounded-2xl
16 rounded-3xl
13 rounded-none
11 rounded-sm
5  rounded
8  edge/raw/calc radius variants
```

The 50 existing `rounded-full` usages require an intentional-shape review but are not mechanically replaced. All fixed, bare, and raw theme-radius utilities must migrate.

---

### Task 1: Establish semantic tokens and a failing repository contract

**Files:**

- Modify: `tests/int/theme-contracts.int.spec.ts`
- Create: `tests/int/semantic-radius-contract.int.spec.ts`
- Modify: `src/styles/globals.css`

**Interfaces:**

- Produces Tailwind utilities: `rounded-card`, `rounded-control`, `rounded-compact`, their edge variants, `rounded-full`, and `rounded-none`.
- The source audit consumes public `.ts`, `.tsx`, and `.css` files and returns exact file/line violations.

- [ ] **Step 1: Replace the old scale assertions with failing semantic-token assertions**

In `theme-contracts.int.spec.ts`, change the shared Card expectation to `rounded-card` and replace the old `--radius-xs` through `--radius-4xl` expectations with:

```ts
expect(globalsSource).toContain('--radius-card: min(var(--radius, 0.625rem), 0.75rem);')
expect(globalsSource).toContain('--radius-control: min(var(--radius, 0.625rem), 0.75rem);')
expect(globalsSource).toContain(
  '--radius-compact: min(calc(var(--radius, 0.625rem) * 0.5), 0.25rem);',
)
for (const legacyToken of ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']) {
  expect(globalsSource).not.toContain(`--radius-${legacyToken}:`)
}
```

- [ ] **Step 2: Add the failing scoped source audit**

Create `tests/int/semantic-radius-contract.int.spec.ts` with a recursive scanner:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const roots = ['src/app/(frontend)', 'src/blocks', 'src/components', 'src/styles']
const extensions = new Set(['.css', '.ts', '.tsx'])
const excludedSegments = [`${path.sep}components${path.sep}admin${path.sep}`]

const walk = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (excludedSegments.some((segment) => absolutePath.includes(segment))) return []
    if (entry.isDirectory()) return walk(absolutePath)
    return extensions.has(path.extname(entry.name)) ? [absolutePath] : []
  })

const bannedPatterns = [
  /\brounded(?:-[trblse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)\b/g,
  /\brounded(?:-[trblse]{1,2})?-(?:\[(?:calc\()?var\(--radius\)[^\]]*\]|\(--radius\))/g,
  /(?<![-\w])rounded(?=[\s"'`])/g,
]

describe('semantic radius contract', () => {
  it('uses only semantic radius roles in public frontend source', () => {
    const violations = roots.flatMap((root) =>
      walk(path.join(projectRoot, root)).flatMap((absolutePath) => {
        const relativePath = path.relative(projectRoot, absolutePath)
        return fs
          .readFileSync(absolutePath, 'utf8')
          .split('\n')
          .flatMap((line, index) =>
            bannedPatterns.some((pattern) => {
              pattern.lastIndex = 0
              return pattern.test(line)
            })
              ? [`${relativePath}:${index + 1}: ${line.trim()}`]
              : [],
          )
      }),
    )

    expect(violations).toEqual([])
  })
})
```

- [ ] **Step 3: Run contracts and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/semantic-radius-contract.int.spec.ts
```

Expected: FAIL for missing semantic tokens and the existing fixed/raw radius usages.

- [ ] **Step 4: Add semantic Tailwind tokens and remove the custom visual scale**

In `@theme inline` in `globals.css`, replace the current `--radius-xs` through `--radius-xl` block and remove the later `--radius-2xl` through `--radius-4xl` declarations:

```css
--radius-card: min(var(--radius, 0.625rem), 0.75rem);
--radius-control: min(var(--radius, 0.625rem), 0.75rem);
--radius-compact: min(calc(var(--radius, 0.625rem) * 0.5), 0.25rem);
```

- [ ] **Step 5: Re-run the token contract**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts
```

Expected: token assertions PASS; the source audit remains red until Tasks 2–4 finish.

---

### Task 2: Migrate shared UI primitives

**Files:**

- Modify: `src/components/ui/accordion.tsx`
- Modify: `src/components/ui/alert.tsx`
- Verify only: `src/components/ui/avatar.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/components/ui/empty.tsx`
- Modify: `src/components/ui/field.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/navigation-menu.tsx`
- Verify only: `src/components/ui/progress.tsx`
- Verify only: `src/components/ui/radio-group.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/toggle-group.tsx`
- Modify: `src/components/ui/toggle.tsx`
- Test: `tests/int/theme-contracts.int.spec.ts`
- Test: `tests/int/theme-block-outliers.int.spec.tsx`

**Role mapping:**

| Primitive                                                                                        | Radius role                                                                                        |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Accordion, Alert, Card, Empty shell, Select popup, navigation popup                              | `rounded-card`                                                                                     |
| Button, Input, Select trigger/item, Tabs list/trigger, Textarea, Toggle, navigation trigger/link | `rounded-control`                                                                                  |
| Checkbox, keyboard-sized navigation arrow, tiny inline control                                   | `rounded-compact`                                                                                  |
| Badge, Avatar, Progress, Radio                                                                   | intentional `rounded-full`                                                                         |
| Joined Toggle Group children                                                                     | outer `rounded-control`; inner `rounded-none`; first/last edges use semantic control edge variants |

- [ ] **Step 1: Apply the primitive role mapping**

Use semantic classes only:

```tsx
// Standalone surfaces
'overflow-hidden rounded-card border'

// Standard controls
'rounded-control'

// Tiny square controls
'rounded-compact'

// Joined controls
'rounded-control ... first:rounded-l-control last:rounded-r-control'
```

Remove independent Card header/footer/image rounding; the Card shell remains `overflow-hidden rounded-card`.

- [ ] **Step 2: Preserve intentional full shapes**

Inspect every `rounded-full` occurrence in Badge, Avatar, Progress, and Radio. Retain it only where the element is explicitly a badge, avatar, progress track/indicator, radio circle, or circular status item.

- [ ] **Step 3: Update primitive-focused assertions**

Update the Card contract to:

```ts
expect(cardSource).toContain('overflow-hidden rounded-card')
expect(cardSource).not.toContain('rounded-[var(--radius)]')
```

Update any primitive source assertions in `theme-block-outliers.int.spec.tsx` to expect `rounded-card`, `rounded-control`, or `rounded-compact` according to the table.

- [ ] **Step 4: Format and run primitive consumers**

```bash
pnpm exec prettier --write src/components/ui tests/int/theme-contracts.int.spec.ts tests/int/theme-block-outliers.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/theme-block-outliers.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx tests/int/fee-structure.int.spec.tsx tests/int/tabs-content-active-color.int.spec.ts
```

Expected: primitive and consumer tests PASS; source audit remains red only for unmigrated components and blocks.

---

### Task 3: Migrate global shell, content pages, and reusable public components

**Files — structural `rounded-card`:**

- `src/components/articles/ArticleArchivePage.tsx`
- `src/components/articles/ArticlePage.tsx`
- `src/components/reviews/ReviewArchivePage.tsx`
- `src/components/reviews/ReviewPage.tsx`
- `src/components/review-feed-list.tsx`
- `src/components/contact24.tsx`
- `src/components/contact33.tsx`
- `src/components/content-highlights.tsx`
- `src/components/event-gallery-client.tsx`
- `src/components/feature-matrix.tsx`
- `src/components/gallery-showcase-fan.tsx`
- `src/components/image-mosaic-presentation.ts`
- `src/components/news-events/NewsEventStory.tsx`
- `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- `src/components/profile-carousel-card.tsx`
- `src/components/services21.tsx`
- `src/components/team-showcase.tsx`
- `src/components/global/CookieConsentBanner.tsx`
- `src/components/global/SearchDialog.tsx`
- `src/components/rich-text/richTextStyles.ts`

**Files — control/compact roles:**

- `src/app/(frontend)/search/SearchInput.tsx`
- `src/app/(frontend)/search/page.tsx`
- `src/components/announcement/AnnouncementBar.tsx`
- `src/components/announcement/MarqueeAnnouncementContent.tsx`
- `src/components/announcement/RotatingAnnouncementContent.tsx`
- `src/components/footer56.tsx`
- `src/components/header/HeaderMobileMenu.tsx`
- `src/components/header/SearchTriggerButton.tsx`
- `src/components/navbar12.tsx`
- `src/components/shadcnblocks/border-button.tsx`

**Files — intentional full/none verification:**

- `src/app/(frontend)/error.tsx`
- `src/app/(frontend)/layout.tsx`
- `src/components/gallery-slideshow-viewer.tsx`
- `src/components/system-pages/System404View.tsx`
- `src/components/system-pages/SystemComingSoonView.tsx`
- `src/components/system-pages/SystemMaintenanceView.tsx`

**Role details:**

```text
Article/review cards, media, archives, empty states, modal/banner panels: rounded-card
Form inputs, search rows, navigation items, announcement/header buttons: rounded-control
Checkboxes, kbd labels, inline code: rounded-compact
Tags/badges, progress dots, circular gallery controls, decorative circles: rounded-full
Direct images inside an overflow-clipped card: no child radius
```

- [ ] **Step 1: Convert structural surfaces**

Replace fixed/raw card and media-frame utilities with `rounded-card`. Convert edge-specific rich-text treatment to semantic edges, for example:

```ts
'prose-blockquote:rounded-r-card'
'prose-code:rounded-compact'
'prose-pre:rounded-card'
'[&_img]:rounded-card'
```

- [ ] **Step 2: Convert controls and tiny inline elements**

Use `rounded-control` for buttons, inputs, search results, navigation items, and form controls. Use `rounded-compact` for keyboard hints, checkboxes, inline code, and similarly small square elements.

- [ ] **Step 3: Review full shapes**

Retain `rounded-full` only for explicit cookie-preference pills, article tags, gallery progress/control circles, avatars, system-page decorative circles, and similarly named pill/circle UI.

- [ ] **Step 4: Update focused component contracts**

Update expectations in:

- `tests/int/contact33-render.int.spec.tsx`
- `tests/int/content-highlights.int.spec.tsx`
- `tests/int/feature-matrix.int.spec.ts`
- `tests/int/news-event-story.int.spec.tsx`
- `tests/int/news-events-featured-carousel.int.spec.tsx`
- `tests/int/theme-block-outliers.int.spec.tsx`

Every card assertion must expect `rounded-card`; every standard control assertion must expect `rounded-control`; compact assertions must expect `rounded-compact`.

- [ ] **Step 5: Format and run public component tests**

```bash
pnpm exec prettier --write 'src/app/(frontend)' src/components tests/int/contact33-render.int.spec.tsx tests/int/content-highlights.int.spec.tsx tests/int/feature-matrix.int.spec.ts tests/int/news-event-story.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/theme-block-outliers.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/contact33-render.int.spec.tsx tests/int/content-highlights.int.spec.tsx tests/int/feature-matrix.int.spec.ts tests/int/news-event-story.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/theme-block-outliers.int.spec.tsx
```

Expected: component tests PASS; remaining source-audit failures belong only to block files.

---

### Task 4: Migrate every public block surface and control

**Files — block cards, panels, media, and outer joined containers use `rounded-card`:**

- `src/blocks/AboutSection/Component.tsx`
- `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- `src/blocks/AcademicProgrammes/DetailedProgrammeCard.tsx`
- `src/blocks/AccreditationCards/Component.tsx`
- `src/blocks/AnnualCalendar/Presentation.tsx`
- `src/blocks/AwardsList/Component.tsx`
- `src/blocks/BentoGrid/Component.tsx`
- `src/blocks/Calendar/CalendarTimelineView.tsx`
- `src/blocks/Calendar/CalendarUpcoming.tsx`
- `src/blocks/Calendar/Presentation.tsx`
- `src/blocks/DepartmentProfiles/DepartmentProfileCard.tsx`
- `src/blocks/DownloadList/Presentation.tsx`
- `src/blocks/EditorialReasons/Component.tsx`
- `src/blocks/FeatureSpotlight/Component.tsx`
- `src/blocks/FeeStructure/FeeStructureClient.tsx`
- `src/blocks/FeeStructure/FeeStructureDownload.tsx`
- `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`
- `src/blocks/GalleryCoverflow/GalleryCoverflowClient.tsx`
- `src/blocks/IconCardShowcase/Component.tsx`
- `src/blocks/IconGrid/Component.tsx`
- `src/blocks/LeadershipProfiles/Component.tsx`
- `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`
- `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- `src/blocks/NewsGrid/Presentation.tsx`
- `src/blocks/NumberedSteps/Component.tsx`
- `src/blocks/ProgramMatrix/Component.tsx`
- `src/blocks/QuoteBlock/Component.tsx`
- `src/blocks/ReviewSubmission/Component.tsx`
- `src/blocks/StudentExperience/Component.tsx`
- `src/blocks/TabsContent/TabsContentClient.tsx`
- `src/blocks/TestimonialGrid/Component.tsx`
- `src/blocks/TestimonialSpotlight/Component.tsx`
- `src/blocks/Timeline/Component.tsx`
- `src/blocks/VideoEmbed/Component.tsx`
- `src/blocks/shared/BlockErrorBoundary.tsx`

**Files — block controls use `rounded-control` or `rounded-compact`:**

- `src/blocks/AnnualCalendar/AnnualCalendarYearStream.tsx`
- `src/blocks/Calendar/CalendarMonthView.tsx`
- `src/blocks/Calendar/calendarStyles.ts`
- `src/blocks/FooterMinimal/Component.tsx`
- `src/blocks/GalleryCoverflow/Component.tsx`
- `src/blocks/HeroCarousel/HeroCarouselClient.tsx`
- `src/blocks/QaAccordion/Component.tsx`
- `src/blocks/shared/contentStyles.ts`
- `src/blocks/shared/contentTabRail.ts`

**Role details:**

```text
Cards, image frames, tables, empty states, downloads, framed split layouts: rounded-card
Buttons, tabs, selects, action links, icon tiles >= 24px: rounded-control
Calendar dates, tiny labels, checkbox-like toggles, inline focus boxes: rounded-compact
Badges, number circles, avatars, dots, circular carousel controls: rounded-full
Table cells, segmented children, grouped rows: rounded-none; outer container rounded-card
```

- [ ] **Step 1: Convert block structural surfaces**

Replace every fixed/raw structural radius with `rounded-card`. Ensure an image-bearing Academic Programme card and its focus wrapper both use `rounded-card`; News Grid image and text feature variants both use `rounded-card`; Testimonial Spotlight outlined and filled variants both use `rounded-card`.

- [ ] **Step 2: Convert block controls and compact elements**

Use `rounded-control` for tabs, selects, buttons, action links, and icon tiles. Use `rounded-compact` for Calendar date markers, tiny code-like labels, and checkbox-sized elements.

- [ ] **Step 3: Preserve joined and circular geometry**

Keep internal table/grid cells `rounded-none`. Retain `rounded-full` only for number markers, avatars, dots, pill badges, and explicitly circular controls. Do not let a nested image/header/footer add a second radius inside an overflow-clipped card.

- [ ] **Step 4: Update block contracts**

Update radius expectations in:

- `tests/int/academic-programmes-client.int.spec.tsx`
- `tests/int/calendar-ui-contracts.int.spec.tsx`
- `tests/int/carousel-blocks.int.spec.tsx`
- `tests/int/content-highlights.int.spec.tsx`
- `tests/int/editorial-reasons.int.spec.tsx`
- `tests/int/news-grid.int.spec.tsx`
- `tests/int/tabs-content-active-color.int.spec.ts`
- `tests/int/testimonial-spotlight-render.int.spec.tsx`
- `tests/int/theme-block-outliers.int.spec.tsx`

The superseded `rounded-sm` branch assertions must be removed; all card variants now expect `rounded-card`.

- [ ] **Step 5: Format and run block tests**

```bash
pnpm exec prettier --write src/blocks tests/int/academic-programmes-client.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx tests/int/content-highlights.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/tabs-content-active-color.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/theme-block-outliers.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes-client.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/carousel-blocks.int.spec.tsx tests/int/content-highlights.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/tabs-content-active-color.int.spec.ts tests/int/testimonial-spotlight-render.int.spec.tsx tests/int/theme-block-outliers.int.spec.tsx
```

Expected: focused block tests PASS.

---

### Task 5: Close the repository-wide contract

**Files:**

- Test: `tests/int/semantic-radius-contract.int.spec.ts`
- Test: `tests/int/theme-contracts.int.spec.ts`
- Verify all scoped files from Tasks 2–4.

- [ ] **Step 1: Run the semantic source audit**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/semantic-radius-contract.int.spec.ts
```

Expected: PASS with an empty violations array.

- [ ] **Step 2: Independently inspect remaining radius tokens**

```bash
rg -n --glob '*.{ts,tsx,css}' --glob '!src/components/admin/**' --glob '!src/app/(payload)/**' 'rounded(?:-[A-Za-z0-9_\[\]().,:/%-]+)?' 'src/app/(frontend)' src/blocks src/components src/styles
```

Expected: public classes resolve only to semantic card/control/compact roles, `rounded-full`, `rounded-none`, or semantic edge variants. Review every remaining `rounded-full` line against the intentional-shape rule.

- [ ] **Step 3: Run the full integration suite**

```bash
pnpm test:int
```

Expected: PASS. Any old class-string assertion must be updated only when it describes the approved semantic radius behavior; do not weaken unrelated contracts.

---

### Task 6: Update maintained project context

**Files:**

- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Potential generated update: `.agents/skills/project-context/references/project-inventory.json`

- [ ] **Step 1: Document theme radius ownership**

Add a concise contract to `architecture.md`: the selected website theme owns raw `--radius`, public components consume card/control/compact semantic tokens, card/control cap at 12px, compact caps at 4px, and explicit pills/circles use full rounding.

- [ ] **Step 2: Document block presentation requirements**

Add to `block-system.md`: blocks must use semantic radius roles, outer containers own clipping, joined children stay square, and block configs may choose a pill variant but may not invent radius values.

- [ ] **Step 3: Run the required update/check loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: PASS. If sandbox permissions prevent the updater's temporary inventory write, request the required scoped approval and rerun. Keep `project-inventory.json` only when the generator produces a factual delta.

---

### Task 7: Verify responsive UX and production readiness

**Files:**

- Verify all changed public frontend files and tests.

- [ ] **Step 1: Run formatting and lint**

```bash
pnpm exec prettier --check 'src/app/(frontend)' src/blocks src/components src/styles tests/int docs/superpowers/specs/2026-08-29-semantic-radius-contract-design.md docs/superpowers/plans/2026-08-29-semantic-radius-contract.md
pnpm lint
```

Expected: formatting PASS; lint has zero errors. Report any pre-existing warnings by exact path.

- [ ] **Step 2: Perform one bounded browser pass**

On representative public pages, inspect desktop and mobile widths for SNMIH Green and SNMIH Blue, including light/dark mode where available:

```text
Cards/panels/media/tables: one consistent outer radius; no nested white wedges.
Standard buttons/inputs/selects/framed tabs: control radius; no unexpected pills.
Checkboxes/kbd/code labels/calendar dates: compact radius; still visibly square.
Pill tabs/badges/avatars/circular controls: fully rounded by explicit intent.
Joined rows/cells: square internally; only the outer shell rounds.
Hover/focus/selected/disabled: geometry remains stable and focus is not clipped.
```

Use one desktop/mobile defect scan, one batched correction if required, and at most one confirmation pass.

- [ ] **Step 3: Run the production build without disrupting the user's dev server**

If a user-owned Next.js dev server is active in the same workspace, request permission before stopping it because `next build` shares `.next`. Once the workspace is free:

```bash
pnpm build
```

Expected: production build PASS with no Tailwind utility-generation, type, or route errors.

- [ ] **Step 4: Inspect the final diff**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no Payload schema/type changes, no admin styling changes, no unrelated edits, and no new commit.
