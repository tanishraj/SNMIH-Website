# Download List Grid and Actions Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable grid icon placement and fully configurable automatic View/Download controls while keeping manual document actions and existing saved content compatible.

**Architecture:** Extend the existing Payload fields without replacing saved names, normalize manual and automatic actions into one serializable per-document contract, and keep appearance/icon rendering inside the shared presentation action renderer. Grid items share one top-right badge contract while switching only the icon/content arrangement.

**Tech Stack:** Payload CMS fields and generated types, React, TypeScript, Tailwind CSS, Lucide React, Vitest, Testing Library, and the existing block-thumbnail generator.

## Global Constraints

- Do not commit, stage, unstage, or alter branch history.
- File-type badges remain fixed at the top right in Boxed Card, Open Grid, and Framed Grid.
- `gridIconPosition` supports Above Content and Inline with Content; default Above Content.
- Inline List ignores `gridIconPosition` and retains its current icon anatomy.
- View is disabled by default; Download is enabled by default.
- Automatic Download defaults to Icon-only with animated `ArrowDown` and accessible name `Download`.
- Automatic View defaults to Link with trailing `ArrowUpRight` when enabled.
- Automatic and manual actions support Link, Button, and Icon-only appearances.
- Labelled action icons trail their labels; Icon-only actions retain `aria-label`, native title, focus visibility, and a minimum touch target.
- Icon-only None or invalid custom icons fall back to the action default.
- Existing manual actions without appearance retain Link-as-Link and Download-as-Button behavior.
- Existing saved automatic settings remain honored; missing settings use the new defaults.
- Existing layout, grid-border, column, filtering, and legacy `compact` fallback behavior remains unchanged.

---

### Task 1: Extend the Payload authoring model

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces block field `gridIconPosition?: 'above' | 'inline' | null`.
- Produces automatic fields `viewActionAppearance`, `viewActionIconMode`, `viewActionIcon`, `downloadActionAppearance`, `downloadActionIconMode`, and `downloadActionIcon`.
- Produces manual action field `actionAppearance?: 'button' | 'iconOnly' | 'link' | null`.

- [ ] **Step 1: Write failing schema tests**

Assert `gridIconPosition` is a required grid-only select with default `above` and options Above Content/Inline with Content.

Update automatic action assertions to require:

```ts
showViewAction: {
  defaultValue: false
}
viewActionAppearance: {
  defaultValue: 'link'
}
viewActionIconMode: {
  defaultValue: 'default'
}
showDownloadAction: {
  defaultValue: true
}
downloadActionAppearance: {
  defaultValue: 'iconOnly'
}
downloadActionIconMode: {
  defaultValue: 'default'
}
```

Assert View-dependent fields hide when View is disabled, Download-dependent fields hide when Download is disabled, and each custom icon field appears only when its action is enabled and its icon mode is Custom.

Assert manual `actionAppearance` offers Link, Button, and Icon-only without a required/default value, preserving old rows.

- [ ] **Step 2: Run focused tests and verify failure**

Run `pnpm exec vitest run tests/int/download-list.int.spec.tsx`.

Expected: failures identify missing fields and the old View default.

- [ ] **Step 3: Add schema conditions and reusable option constants**

Define action appearance and icon-mode options once. Extend sibling types with appearance/icon-mode fields. Add focused conditions for View enabled, Download enabled, View custom icon, and Download custom icon. Reuse the existing grid condition for `gridIconPosition`.

- [ ] **Step 4: Add grid and manual-action fields**

Add `gridIconPosition` after `documentIconSize`. Add optional `actionAppearance` to each manual row with no default and this Admin explanation: missing values preserve Link-as-Link and Download-as-Button behavior.

- [ ] **Step 5: Expand the two automatic action groups**

Change `showViewAction` default to `false`. Add each appearance/icon field beside its existing label and destination settings. Use separate custom Lucide text fields named `viewActionIcon` and `downloadActionIcon`. Keep the existing at-least-one-action validator.

- [ ] **Step 6: Run schema tests**

Expected: the full focused test file passes its schema section.

---

### Task 2: Normalize action appearance and icon defaults

**Files:**

- Modify: `src/blocks/DownloadList/types.ts`
- Modify: `src/blocks/DownloadList/resolveActions.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Adds `DownloadActionAppearance = 'button' | 'iconOnly' | 'link'`.
- Adds `DownloadGridIconPosition = 'above' | 'inline'`.
- Extends `ResolvedDownloadAction` with `appearance` and `defaultIconName?: 'arrow-down' | 'arrow-up-right'`.
- Extends automatic fallback input with appearance/icon configuration for View and Download.

- [ ] **Step 1: Add failing resolver tests**

Verify these normalized outcomes:

- missing automatic fields yield no View and one icon-only Download with `defaultIconName: 'arrow-down'`;
- explicitly enabled View uses its saved appearance, icon mode/name, new-tab behavior, and `defaultIconName: 'arrow-up-right'`;
- saved Download Link/Button/Icon-only appearance is retained;
- manual actions preserve saved appearance;
- manual actions without appearance fall back to Link for Link actions and Button for Download actions;
- valid manual actions still replace automatic actions.

- [ ] **Step 2: Run resolver tests and verify failure**

Expected: action objects lack appearance/default-icon data and View still defaults On in the component.

- [ ] **Step 3: Extend shared types and resolver**

Normalize manual appearance contextually:

```ts
const appearance =
  action.actionAppearance === 'button' ||
  action.actionAppearance === 'iconOnly' ||
  action.actionAppearance === 'link'
    ? action.actionAppearance
    : action.actionType === 'download'
      ? 'button'
      : 'link'
```

Manual Link Default icon remains none; manual Download Default uses `arrow-down`. Automatic View Default uses `arrow-up-right`; automatic Download Default uses `arrow-down`.

- [ ] **Step 4: Thread automatic settings and grid position from the server**

Extend `DownloadListBlockLike` and its defaults:

```ts
gridIconPosition = 'above'
showViewAction = false
viewActionAppearance = 'link'
viewActionIconMode = 'default'
downloadActionAppearance = 'iconOnly'
downloadActionIconMode = 'default'
```

Pass the action configuration into `resolveDocumentActions` and pass normalized `gridIconPosition` through `DownloadListClient`.

- [ ] **Step 5: Run resolver tests and TypeScript**

Expected: resolver tests and `pnpm exec tsc --noEmit` pass after presentation props are updated in Task 3.

---

### Task 3: Render Link, Button, and Icon-only actions accessibly

**Files:**

- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Consumes normalized `ResolvedDownloadAction.appearance` and `defaultIconName`.
- Consumes `gridIconPosition` in grid presentations.

- [ ] **Step 1: Write failing action-rendering tests**

Verify default block rendering contains only one Download action, uses Icon-only button markup, hides visible label text, and includes `aria-label="Download"`, `title="Download"`, `data-document-action-appearance="iconOnly"`, and `data-document-action-icon="arrow-down"`.

Add cases for View-only, both enabled, both disabled validation at schema level, Link/Button/Icon-only appearances, automatic custom icons, None on labelled actions, invalid icon fallback for Icon-only, and manual legacy appearance fallback.

- [ ] **Step 2: Run tests and verify failure**

Expected: the renderer assumes Link by kind and Button by Download kind, and icon-only accessibility attributes are absent.

- [ ] **Step 3: Refactor the shared action renderer**

Build one anchor attribute set per action. Apply `download` only to Download actions and target/rel only when requested. Render:

- Link: shared underlined text-link classes, visible label, trailing icon;
- Button: semantic small button classes, visible label, trailing icon;
- Icon-only: semantic `icon-sm` button classes, `aria-label`, `title`, no visible label, and icon only.

Use card surface button classes for Button/Icon-only and surface link classes for Link. Add stable appearance data attributes.

- [ ] **Step 4: Generalize action icon fallback**

Resolve a valid custom icon first. For Default use `action.defaultIconName`. For None omit the icon unless appearance is Icon-only; Icon-only falls back to `defaultIconName` or `arrow-down`/`arrow-up-right` by action kind. Keep animated ArrowDown, render static ArrowUpRight, and leave other custom icons static.

- [ ] **Step 5: Run focused tests and TypeScript**

Expected: all action tests and type checking pass.

---

### Task 4: Implement grid icon positioning with fixed badges

**Files:**

- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

- [ ] **Step 1: Write failing grid-anatomy tests**

For Boxed Card, Open Grid, and Framed Grid, assert the badge appears once, remains inside a top-level right-side slot, and precedes the title in DOM order for both positions. Assert Above Content uses `data-grid-icon-position="above"` with icon opposite badge and content below. Assert Inline with Content uses `data-grid-icon-position="inline"` with icon beside a title/description stack. Verify Inline List ignores the setting.

- [ ] **Step 2: Run tests and verify failure**

Expected: Open/Framed badges currently sit above titles and no icon-position setting exists.

- [ ] **Step 3: Build the two grid anatomies**

Keep one fixed top-right badge slot across all grids. Above Content renders icon and badge in the top row, then title/description below. Inline with Content renders a top row containing an icon-plus-content group on the left and badge on the right. Category and actions remain below without duplicate badges or titles.

- [ ] **Step 4: Preserve grid surface and border contracts**

Confirm Boxed Cards retain semantic surfaces/radii, Open retains border-y without side borders, Framed retains one square outline, and all grid modes retain 1–8 responsive columns/internal dividers.

- [ ] **Step 5: Run focused tests, TypeScript, ESLint, and design detector**

Expected: all pass; detector returns `[]`.

---

### Task 5: Regenerate artifacts, documentation, and context

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `src/payload-types.ts`
- Regenerate: `public/block-thumbnails/download-list.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

- [ ] **Step 1: Update the thumbnail fixture**

Use one grid icon position and ensure the fixture demonstrates fixed top-right badges plus the default icon-only Download. Remove manual actions from at least one uploaded-file item so the new automatic default is visible.

- [ ] **Step 2: Regenerate Payload types**

Run `pnpm generate:types` and verify all new fields/unions appear.

- [ ] **Step 3: Regenerate and inspect the Download List thumbnail**

Run `BLOCK_THUMBNAIL_SLUG=downloadList pnpm generate:block-thumbnails`. Confirm badge alignment, icon/content alignment, action accessibility markup, no clipping, and correct ruled frame.

- [ ] **Step 4: Update maintained documentation**

Document grid icon positioning, fixed grid badges, automatic action defaults, all three appearances, icon-only accessibility, manual overrides, and compatibility behavior.

- [ ] **Step 5: Run the required project-context loop**

Run `pnpm project-context:update` and `pnpm project-context:check`. Only the known stale knowledge-graph warning may remain.

- [ ] **Step 6: Run final verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/config.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/types.ts src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx src/payload-types.ts docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
git diff --check
git diff --cached --check
```

Expected: every command succeeds. Inspect staged and unstaged diffs separately without changing the index, and report that no commit was created.
