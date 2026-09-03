# Download List Manual Actions Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine Download List with editor-authored Link and Download actions, trailing Lucide icons, configurable document-icon sizing, type badges above sans-serif titles, and backward-compatible automatic actions.

**Architecture:** Keep Payload authoring in `config.ts`, move action normalization into a focused server-safe resolver, and pass fully serializable per-document actions into the existing client/presentation boundary. Presentation code owns icon-name validation, icon placement, action styling, and the consistent document hierarchy across all five layouts.

**Tech Stack:** Payload CMS fields and generated types, React Server/Client Components, TypeScript, Tailwind CSS, Lucide React dynamic icons, Vitest, and Testing Library.

## Global Constraints

- Do not create a Git commit, stage files, unstage files, or otherwise alter the user's current staging state.
- Manual actions are optional and limited to two actions per document.
- At least one valid manual action replaces automatic actions; zero valid manual actions retain the existing automatic View/Download fallback.
- Link actions use text-link styling and default to no icon.
- Download actions use compact button styling and default to a trailing `CircleChevronDown` icon.
- `iconMode` supports Default, None, and Custom; every rendered icon appears after the visible label.
- Unknown custom Lucide icon names fall back to the selected action type's default.
- The main document icon supports Small, Medium, and Large; Medium preserves the current size.
- Every layout places the file-type badge above a sans-serif document title.
- Card Grid, Open Grid, Framed Grid, Inline List, Table, category filtering, and existing saved values remain compatible.
- No database migration or new dependency is required.

---

## File Structure

- Modify `src/blocks/DownloadList/config.ts`: define icon-size and nested manual-action authoring fields, conditions, and validation.
- Modify `src/blocks/DownloadList/types.ts`: define serializable action and icon-size contracts shared by server, client, and presentation.
- Create `src/blocks/DownloadList/resolveActions.ts`: resolve manual actions and the automatic compatibility fallback without JSX.
- Modify `src/blocks/DownloadList/Component.tsx`: normalize each document through the resolver and pass icon size downstream.
- Modify `src/blocks/DownloadList/DownloadListClient.tsx`: remove block-wide action settings and forward icon size.
- Modify `src/blocks/DownloadList/Presentation.tsx`: render the revised hierarchy, icon sizes, action modes, and dynamic trailing icons.
- Modify `tests/int/download-list.int.spec.tsx`: cover schema, resolution, compatibility, styling contracts, icon behavior, and every layout.
- Modify `src/block-thumbnails/fixtures.tsx`: demonstrate manual Link and Download actions in the Framed Grid fixture.
- Regenerate `src/payload-types.ts` and `public/block-thumbnails/download-list.jpg`.
- Modify `docs/guides/blocks.md` and `.agents/skills/project-context/references/block-system.md`: document the final editor/runtime contract.
- Refresh `.agents/skills/project-context/references/project-inventory.json` through the required updater.

---

### Task 1: Add the Payload authoring model

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces block field `documentIconSize?: 'small' | 'medium' | 'large' | null`.
- Produces document field `actions?: DownloadManualActionInput[] | null`, capped at two rows.
- Manual action row fields are `actionType`, `label`, `linkType`, `page`, `url`, `openInNewTab`, `file`, `iconMode`, and `icon`.

- [ ] **Step 1: Add failing schema tests**

Extend the schema suite with assertions equivalent to:

```ts
it('configures three main document icon sizes', () => {
  expect(findNamedField(DownloadListBlock.fields, 'documentIconSize')).toMatchObject({
    type: 'select',
    defaultValue: 'medium',
    required: true,
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
      { label: 'Large', value: 'large' },
    ],
  })
})

it('allows at most two conditional manual actions per document', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const manualActions = findNamedField(downloads.fields, 'actions') as ArrayField

  expect(manualActions).toMatchObject({ type: 'array', maxRows: 2 })
  expect(findNamedField(manualActions.fields, 'actionType')).toMatchObject({
    type: 'radio',
    defaultValue: 'link',
  })
  expect(findNamedField(manualActions.fields, 'iconMode')).toMatchObject({
    type: 'select',
    defaultValue: 'default',
  })
})
```

Also call each conditional field's `admin.condition` with Link, Download, Default, and Custom sibling data. Assert that Page/URL/new-tab fields show only for Link, Media shows only for Download, and the icon-name field shows only for Custom.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx
```

Expected: schema tests fail because `documentIconSize` and per-document `actions` do not exist.

- [ ] **Step 3: Add action conditions and validation helpers**

Add explicit sibling types and conditions near the top of `config.ts`:

```ts
type ManualActionSiblingData = {
  actionType?: 'download' | 'link' | null
  iconMode?: 'custom' | 'default' | 'none' | null
  linkType?: 'custom' | 'page' | null
}

const isLinkAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'link'
const isDownloadAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'download'
const isPageAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'link' && siblingData?.linkType === 'page'
const isCustomUrlAction = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.actionType === 'link' && siblingData?.linkType === 'custom'
const isCustomIcon = (_data: unknown, siblingData: ManualActionSiblingData) =>
  siblingData?.iconMode === 'custom'
```

Use field validators that return a clear string when the active action type lacks its required Page, URL, or Media destination. Hidden inactive fields return `true` so switching action type does not make hidden stale values block saving.

- [ ] **Step 4: Add the block-level icon-size select and nested manual-action array**

Add `documentIconSize` under the Download List presentation/theme settings. Add `actions` inside each document row with `maxRows: 2`, collapsed rows, and these exact editor defaults:

```ts
actionType: 'link'
linkType: 'page'
openInNewTab: false
iconMode: 'default'
```

Use a Pages relationship for internal links, a text URL for custom links, an upload related to `media` for downloads, and `createIconField()` for the conditional custom Lucide name. Keep existing block-wide automatic action fields and relabel their collapsible group as compatibility fallback settings.

- [ ] **Step 5: Run the schema suite**

Run the focused Vitest command again.

Expected: all schema tests pass; rendering tests remain unchanged.

---

### Task 2: Normalize manual and automatic actions

**Files:**

- Modify: `src/blocks/DownloadList/types.ts`
- Create: `src/blocks/DownloadList/resolveActions.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Consumes `resolveCmsLink(value: CmsLinkValue)` and `getMediaAbsoluteUrl(media: Media)`.
- Produces `resolveDocumentActions(item, fallback): ResolvedDownloadAction[]`.
- Produces these shared contracts:

```ts
export type DownloadDocumentIconSize = 'large' | 'medium' | 'small'
export type DownloadActionKind = 'download' | 'link'
export type DownloadActionIconMode = 'custom' | 'default' | 'none'

export type ResolvedDownloadAction = {
  href: string
  iconMode: DownloadActionIconMode
  iconName?: string
  kind: DownloadActionKind
  label: string
  openInNewTab: boolean
}

export type ResolvedDownload = {
  actions: ResolvedDownloadAction[]
  cardBackground?: string
  category?: string
  description?: string
  fileType?: string
  id: string | number
  title: string
}
```

- [ ] **Step 1: Write failing action-resolution tests**

Add direct tests for `resolveDocumentActions` covering:

```ts
expect(resolveDocumentActions(linkItem, fallback)).toEqual([
  {
    href: '/admissions',
    iconMode: 'default',
    kind: 'link',
    label: 'Read requirements',
    openInNewTab: false,
  },
])

expect(resolveDocumentActions(downloadItem, fallback)).toEqual([
  {
    href: '/api/media/file/form.pdf',
    iconMode: 'default',
    kind: 'download',
    label: 'Download form',
    openInNewTab: false,
  },
])
```

Cover two links, two downloads, one of each, trimming labels/URLs/icon names, invalid manual rows, and manual actions replacing fallback only when at least one row resolves. Preserve the existing file-only, URL-only, combined, and unresolved fallback cases.

- [ ] **Step 2: Run the resolver tests and verify failure**

Run the focused Vitest file.

Expected: imports or assertions fail because `resolveActions.ts` and the per-document action contract do not exist.

- [ ] **Step 3: Implement the serializable action types and resolver**

Define `DownloadManualActionInput` with Payload-compatible Page and Media relationship unions. In `resolveActions.ts`:

1. Slice manual rows to two.
2. Trim and require the label.
3. Resolve Link destinations with `resolveCmsLink`.
4. Resolve Download destinations only from populated Media with a usable absolute URL.
5. Normalize `iconMode` to Default unless it is explicitly None or Custom.
6. Preserve a trimmed custom icon name without importing React into the resolver.
7. Return valid manual actions when at least one exists.
8. Otherwise create automatic View and Download actions from the legacy fields and document file/View URL.

Automatic View must be `kind: 'link'` with Default icon mode. Automatic Download must be `kind: 'download'` with Default icon mode.

- [ ] **Step 4: Refactor the server component to use per-document actions**

Add `documentIconSize = 'medium'` to the block-like props. For each titled document, resolve file type and actions; omit the document only when no valid manual or fallback action exists. Store actions on `ResolvedDownload` and remove `viewHref`/`downloadHref` from its presentation contract.

Pass normalized `documentIconSize` to `DownloadListClient`. Remove the old block-wide `actions` prop from the client because fallback settings are consumed during server resolution.

- [ ] **Step 5: Run focused tests and TypeScript**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: resolver tests pass; presentation-related type failures identify the exact props Task 3 must update.

---

### Task 3: Redesign document hierarchy and actions

**Files:**

- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Consumes `ResolvedDownload.actions` and `DownloadDocumentIconSize` from Task 2.
- Produces `DownloadListPresentation` with `documentIconSize` and without block-wide action settings.
- Uses `DynamicIcon`, `iconNames`, and `IconName` from `lucide-react/dynamic` for custom action icons.

- [ ] **Step 1: Add failing presentation tests**

Add rendering assertions for:

- `data-document-icon-size="small|medium|large"` and the static size classes for each option;
- a type badge preceding the title in rendered markup;
- `font-sans` on each grid/list/table/mobile title;
- a manual Link rendered with `data-document-action="link"` and no default icon;
- a manual Download rendered with `data-document-action="download"`, button classes, `download`, and a trailing `circle-chevron-down` icon;
- None suppressing the Download icon;
- a valid custom icon rendering after the label;
- an invalid custom Link icon producing no icon and an invalid custom Download icon producing `CircleChevronDown`;
- the desktop table headers being Document, Category, and Actions with no separate Type header.

Use substring positions or Testing Library DOM sibling checks to prove the badge appears before the title and the icon appears after the label; do not rely only on snapshots.

- [ ] **Step 2: Run the presentation tests and verify failure**

Run the focused Vitest file.

Expected: failures show the old top-row badge placement, serif-inherited title, leading Download icon, and four-column table.

- [ ] **Step 3: Implement safe dynamic action-icon resolution**

Create a module-level `Set` from `iconNames` and normalize CamelCase, spaces, and underscores to Lucide's kebab-case names. Implement a focused component with this behavior:

```tsx
function ActionIcon({ action }: { action: ResolvedDownloadAction }) {
  const defaultName = action.kind === 'download' ? 'circle-chevron-down' : undefined
  const requestedName =
    action.iconMode === 'custom' ? normalizeIconName(action.iconName) : undefined
  const resolvedName =
    action.iconMode === 'none'
      ? undefined
      : requestedName && availableIconNames.has(requestedName)
        ? requestedName
        : defaultName

  return resolvedName ? <DynamicIcon aria-hidden="true" name={resolvedName as IconName} /> : null
}
```

Keep the icon decorative and give it a fixed `size-4 shrink-0` class.

- [ ] **Step 4: Replace automatic-only action markup with normalized actions**

Map `document.actions` in order. Render Link actions with the existing underlined link treatment and safe target/rel attributes. Render Download actions with `buttonVariants({ variant: 'default', size: 'sm' })`, the HTML `download` attribute, and the trailing `ActionIcon`. Add stable `data-document-action`, `data-document-action-label`, and `data-document-action-icon` attributes for tests and thumbnail inspection.

- [ ] **Step 5: Implement icon-size maps and the approved hierarchy**

Use static class maps so Tailwind detects every option:

```ts
const documentIconClasses = {
  small: { container: 'size-8', icon: 'size-4' },
  medium: { container: 'size-10', icon: 'size-5' },
  large: { container: 'size-12', icon: 'size-6' },
} as const
```

Apply this order in Card/Open/Framed Grid, Inline List, desktop Table Document cells, and mobile Table rows:

```text
main document icon
file-type badge
sans-serif title
description/category as appropriate
actions
```

The icon may remain in a left-side column when the layout is horizontal, but the badge must live in the title/content stack directly above the title. Add `font-sans` explicitly to all document titles. Change desktop Table to three semantic columns: Document, Category, Actions.

- [ ] **Step 6: Run the complete Download List suite**

Run the focused Vitest file and TypeScript.

Expected: all Download List tests and type checking pass.

---

### Task 4: Regenerate contracts and visual fixture

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `src/payload-types.ts`
- Regenerate: `public/block-thumbnails/download-list.jpg`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Fixture uses the generated `DownloadListBlock` shape.
- Thumbnail demonstrates Medium document icons, badge-above-title hierarchy, one manual Link, and one manual Download with its default trailing icon.

- [ ] **Step 1: Add fixture contract assertions**

Assert the Download List fixture source contains `documentIconSize="medium"`, a manual Link action, and a manual Download action. Keep the existing Framed Grid and two-column evidence.

- [ ] **Step 2: Update the fixture**

Configure one document with both action kinds. Use a valid uploaded PDF fixture for Download and a custom URL for Link. Keep labels short enough to demonstrate spacing without wrapping in the 1600×900 picker thumbnail.

- [ ] **Step 3: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` includes `documentIconSize` and the nested manual action union fields.

- [ ] **Step 4: Format generated and edited files**

Run Prettier on the Download List source, fixture, tests, generated types, and documentation touched by this plan.

- [ ] **Step 5: Generate and inspect the block thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=downloadList pnpm generate:block-thumbnails
```

Inspect `public/block-thumbnails/download-list.jpg` at full size. Confirm no clipping, the PDF badge is above the sans title, the main icon is balanced, the Download icon trails its label, and the frame has only one outer border.

---

### Task 5: Documentation and final verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Operator documentation must describe manual-action precedence, fallback behavior, icon defaults, icon sizing, and Table's three-column structure.

- [ ] **Step 1: Update maintained documentation**

Document that each row accepts up to two manual actions, valid manual actions replace automatic actions, automatic actions preserve old content, Link defaults to no icon, Download defaults to trailing `CircleChevronDown`, and unknown custom icons fall back safely.

- [ ] **Step 2: Run the design detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/DownloadListClient.tsx
```

Expected: an empty JSON array. Resolve any concrete finding within Download List scope before continuing.

- [ ] **Step 3: Refresh repository context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory includes `resolveActions.ts`, project context is current, and only the allowed stale knowledge-graph warning may remain.

- [ ] **Step 4: Run affected test contracts**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all discovered test files pass.

- [ ] **Step 5: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/config.ts src/blocks/DownloadList/resolveActions.ts src/blocks/DownloadList/types.ts src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx
pnpm exec prettier --check src/blocks/DownloadList docs/guides/blocks.md .agents/skills/project-context/references/block-system.md tests/int/download-list.int.spec.tsx
git diff --check
git diff --cached --check
```

Expected: every command exits successfully.

- [ ] **Step 6: Review final scope and staging preservation**

Run `git status --short`, inspect the complete unstaged and staged diffs separately, and verify that no unrelated file was modified and no staging state was changed. Report changed files, generated artifacts, test totals, thumbnail inspection, and the absence of a commit.
