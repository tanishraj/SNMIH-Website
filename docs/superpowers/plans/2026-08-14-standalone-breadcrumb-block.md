# Standalone Breadcrumb Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add a theme-aware standalone Breadcrumb block with automatic and custom trails, four separator styles, restrained layout controls, and matching production/live-preview behavior.

**Architecture:** Keep hierarchy resolution in src/lib/pageBreadcrumbs.ts, extract Page Header breadcrumb markup into a shared presentational component, and make the new block a thin composition layer. The existing renderers compute automatic breadcrumbs once and pass them to both Page Header and Breadcrumb blocks, including blocks inside reusable sections.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19 server components, TypeScript, Tailwind CSS 4, Lucide React, Vitest, Playwright.

## Global Constraints

- Automatic mode is the default; Custom supports Page and Custom URL items.
- The standalone block never suppresses Page Header breadcrumbs automatically.
- Separators: Chevron, Slash, Arrow, Dot. Chevron is default.
- Alignment: Left, Center, Right. Left is default.
- Size: Compact, Default. Default is default.
- Show Home and Show Current Page default to enabled.
- Appearance uses shared Background and Border controls.
- Section Padding: None, Compact, Default. Compact is default.
- Use theme tokens; add no bespoke colors, cards, pills, shadows, or animation.
- Wrap safely on mobile; never create horizontal page overflow.
- Emit no block-owned breadcrumb JSON-LD.
- Preserve all unrelated staged and unstaged user work.
- Do not stage or commit until the user explicitly requests it.

---

## File map

Create:

- src/blocks/shared/breadcrumbFields.ts — reusable Payload fields and conditions.
- src/components/BreadcrumbTrail.tsx — shared accessible presentation.
- src/blocks/Breadcrumb/config.ts — standalone block schema.
- src/blocks/Breadcrumb/Component.tsx — resolution, filtering, appearance, spacing.
- tests/int/breadcrumb-block.int.spec.tsx — complete block coverage.
- public/block-thumbnails/breadcrumb.jpg — generated block-picker preview.

Modify:

- src/blocks/PageHeader/config.ts — consume shared breadcrumb fields.
- src/blocks/PageHeader/Component.tsx — consume BreadcrumbTrail.
- src/lib/pageBreadcrumbs.ts — accept structural custom breadcrumb inputs.
- src/collections/Pages.ts — register the block.
- src/collections/ReusableSections.ts — register the block.
- src/blocks/renderPageBlocks.tsx — production rendering.
- src/blocks/renderLivePreviewPageBlocks.tsx — live-preview rendering.
- src/block-thumbnails/definitions.ts — thumbnail metadata.
- src/block-thumbnails/fixtures.tsx — deterministic fixture.
- src/payload-types.ts — regenerate.
- tests/int/page-breadcrumbs.int.spec.tsx — Page Header regression coverage.

---

### Task 1: Share schema and resolver contracts

**Files:**

- Create: src/blocks/shared/breadcrumbFields.ts
- Modify: src/blocks/PageHeader/config.ts
- Modify: src/lib/pageBreadcrumbs.ts
- Test: tests/int/breadcrumb-block.int.spec.tsx
- Test: tests/int/page-breadcrumbs.int.spec.tsx

**Interfaces:**

- createBreadcrumbModeField(options?: { includeHidden?: boolean; label?: string })
- createBreadcrumbsField()
- ManualBreadcrumbInput
- resolveCustomPageBreadcrumbs(items: ManualBreadcrumbInput[] | null | undefined)
- Existing resolvePageHeaderBreadcrumbs remains compatible.

- [ ] **Step 1: Create the failing schema test**

Create tests/int/breadcrumb-block.int.spec.tsx:

    import { describe, expect, it } from 'vitest'

    import { createBreadcrumbModeField } from '@/blocks/shared/breadcrumbFields'
    import { PageHeaderBlock } from '@/blocks/PageHeader/config'
    import { resolveCustomPageBreadcrumbs } from '@/lib/pageBreadcrumbs'

    function getTabs(block: typeof PageHeaderBlock) {
      const tabs = block.fields[0]
      if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') {
        throw new Error('Expected static Content and Theme Settings tabs')
      }
      return tabs.tabs
    }

    describe('breadcrumb schemas and resolution', () => {
      it('creates an automatic and custom source field', () => {
        const mode = createBreadcrumbModeField()
        expect(mode).toMatchObject({ defaultValue: 'automatic', required: true })
        expect(mode.options).toEqual([
          { label: 'Automatic — use page hierarchy', value: 'automatic' },
          { label: 'Custom — configure trail below', value: 'custom' },
        ])
      })

      it('preserves hidden mode on Page Header', () => {
        const [, theme] = getTabs(PageHeaderBlock)
        const mode = theme?.fields.find(
          (field) => 'name' in field && field.name === 'breadcrumbMode',
        )
        expect(mode && 'options' in mode ? mode.options : []).toContainEqual({
          label: 'Hidden',
          value: 'hidden',
        })
      })

      it('normalizes structural custom items', () => {
        expect(resolveCustomPageBreadcrumbs([
          { label: 'Admissions', linkType: 'custom', url: '/admissions' },
          { label: 'Apply', linkType: 'custom' },
        ])).toEqual([
          { label: 'Admissions', url: '/admissions' },
          { label: 'Apply', url: undefined },
        ])
      })
    })

- [ ] **Step 2: Run the focused test and prove the shared factory is missing**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx \
      tests/int/page-breadcrumbs.int.spec.tsx

Expected: FAIL because breadcrumbFields.ts does not exist.

- [ ] **Step 3: Implement the shared Payload field factories**

Create src/blocks/shared/breadcrumbFields.ts with:

    import type { ArrayField, RadioField, SelectField } from 'payload'

    type LinkSiblings = { linkType?: 'custom' | 'page' | null }
    type ModeSiblings = {
      breadcrumbMode?: 'automatic' | 'custom' | 'hidden' | null
    }

    const isPage = (_data: unknown, siblings: LinkSiblings) =>
      siblings?.linkType === 'page'
    const isCustom = (_data: unknown, siblings: LinkSiblings) =>
      siblings?.linkType === 'custom'
    const usesCustom = (_data: unknown, siblings: ModeSiblings) =>
      siblings?.breadcrumbMode === 'custom'

    export function createBreadcrumbModeField({
      includeHidden = false,
      label = 'Breadcrumb Source',
    }: {
      includeHidden?: boolean
      label?: string
    } = {}): SelectField {
      return {
        name: 'breadcrumbMode',
        label,
        type: 'select',
        defaultValue: 'automatic',
        required: true,
        admin: {
          description: includeHidden
            ? 'Use the page hierarchy, configure a custom trail, or hide breadcrumbs.'
            : 'Use the page hierarchy or configure a custom trail.',
        },
        options: [
          { label: 'Automatic — use page hierarchy', value: 'automatic' },
          { label: 'Custom — configure trail below', value: 'custom' },
          ...(includeHidden ? [{ label: 'Hidden', value: 'hidden' }] : []),
        ],
      }
    }

    export function createBreadcrumbsField(): ArrayField {
      return {
        name: 'breadcrumbs',
        label: 'Custom Breadcrumbs',
        type: 'array',
        maxRows: 8,
        admin: {
          condition: usesCustom,
          initCollapsed: true,
          description:
            'The last item is the current page and is not linked.',
        },
        fields: [
          { name: 'label', type: 'text', required: true },
          {
            name: 'linkType',
            label: 'Link Type',
            type: 'radio',
            defaultValue: 'page',
            options: [
              { label: 'Page', value: 'page' },
              { label: 'Custom URL', value: 'custom' },
            ],
            admin: { layout: 'horizontal' },
          } satisfies RadioField,
          {
            name: 'page',
            type: 'relationship',
            relationTo: 'pages',
            admin: { condition: isPage },
          },
          {
            name: 'url',
            label: 'Custom URL',
            type: 'text',
            admin: { condition: isCustom },
          },
        ],
      }
    }

- [ ] **Step 4: Generalize custom resolver typing**

In src/lib/pageBreadcrumbs.ts, replace the generated PageHeader row alias with:

    export type ManualBreadcrumbInput = {
      label?: string | null
      linkType?: 'custom' | 'page' | null
      page?: Page | string | number | null
      url?: string | null
    }

Change resolveCustomPageBreadcrumbs to accept ManualBreadcrumbInput[] while preserving its current normalization code. Keep PageHeaderBlock imported for PageHeaderBreadcrumbSource.

- [ ] **Step 5: Refactor Page Header schema onto shared factories**

In src/blocks/PageHeader/config.ts:

    import {
      createBreadcrumbModeField,
      createBreadcrumbsField,
    } from '@/blocks/shared/breadcrumbFields'

    const breadcrumbsField = createBreadcrumbsField()
    const breadcrumbModeField = createBreadcrumbModeField({
      includeHidden: true,
      label: 'Breadcrumb Display',
    })

Delete the local breadcrumb link/mode types, conditions, and duplicated fields. Preserve the current tab placement.

- [ ] **Step 6: Run resolver and Page Header tests**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx \
      tests/int/page-breadcrumbs.int.spec.tsx

Expected: all shared factory, resolver, and Page Header assertions PASS.

- [ ] **Step 7: Review the unstaged diff**

Run git diff for the four source/test files. Confirm only breadcrumb field duplication and typing changed. Do not stage or commit.

---

### Task 2: Extract the accessible BreadcrumbTrail

**Files:**

- Create: src/components/BreadcrumbTrail.tsx
- Modify: src/blocks/PageHeader/Component.tsx
- Test: tests/int/breadcrumb-block.int.spec.tsx
- Test: tests/int/page-breadcrumbs.int.spec.tsx

**Interface:**

    type BreadcrumbTrailProps = {
      alignment?: 'center' | 'left' | 'right'
      className?: string
      items: ResolvedPageBreadcrumb[]
      separator?: 'arrow' | 'chevron' | 'dot' | 'slash'
      showCurrentPage?: boolean
      showHome?: boolean
      size?: 'compact' | 'default'
    }

- [ ] **Step 1: Add failing renderer tests**

Append tests that render three items and assert:

    const trail = [
      { label: 'Home', url: '/' },
      { label: 'Academics', url: '/academics' },
      { label: 'MBBS', url: '/academics/mbbs' },
    ]

    const html = renderToStaticMarkup(<BreadcrumbTrail items={trail} />)
    expect(html).toContain('<nav aria-label="Breadcrumb"')
    expect(html).toContain('<ol')
    expect(html).toContain('href="/academics"')
    expect(html).toContain('aria-current="page"')
    expect(html).not.toContain('href="/academics/mbbs"')

Use it.each for arrow, chevron, dot, and slash and assert data-breadcrumb-separator plus aria-hidden. Add one test with showHome=false and showCurrentPage=false that keeps Academics linked and emits no aria-current.

- [ ] **Step 2: Run the focused test**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx

Expected: FAIL because BreadcrumbTrail does not exist.

- [ ] **Step 3: Implement the shared renderer**

Create src/components/BreadcrumbTrail.tsx. Use ArrowRight and ChevronRight from lucide-react. Export BreadcrumbAlignment, BreadcrumbSeparator, and BreadcrumbSize. Implement:

- nav with aria-label Breadcrumb.
- ol with flex, flex-wrap, min-w-0, theme foreground opacity, and alignment classes.
- li for every visible item.
- decorative separator before every visible item except the first.
- ancestor links with break-words, font-semibold, surface-aware theme color, and hover/focus theme behavior without an underline or embedded action arrow.
- current item as quieter font-normal unlinked text with aria-current=page.
- structural filtering that remembers original indices so hiding the current item never marks an ancestor current.
- Home detection limited to the first item when its URL is `/` or its trimmed label is conventionally `Home`; hiding Home must never remove an arbitrary first custom crumb.
- null return when no item remains.

Use Tailwind scale values only. Avoid nowrap and fixed widths. Give separators data-breadcrumb-separator values for deterministic tests.

- [ ] **Step 4: Replace Page Header local breadcrumb markup**

In src/blocks/PageHeader/Component.tsx:

    import { BreadcrumbTrail } from '@/components/BreadcrumbTrail'

Delete the local Breadcrumbs function and direct ChevronRight import. Replace both calls with:

    <BreadcrumbTrail className="mb-4" items={resolvedBreadcrumbs} />

No new Page Header presentation controls are added.

- [ ] **Step 5: Run renderer regressions**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx \
      tests/int/page-breadcrumbs.int.spec.tsx \
      tests/int/page-header-actions.int.spec.tsx

Expected: all shared-renderer and Page Header tests PASS.

- [ ] **Step 6: Review the unstaged diff**

Confirm hierarchy resolution and Page Header layout are unchanged outside breadcrumb semantics and approved typography.

---

### Task 3: Implement the standalone block

**Files:**

- Create: src/blocks/Breadcrumb/config.ts
- Create: src/blocks/Breadcrumb/Component.tsx
- Test: tests/int/breadcrumb-block.int.spec.tsx

**Interfaces:**

- BreadcrumbBlock slug: breadcrumb.
- BreadcrumbBlockComponent consumes automaticBreadcrumbs and generated block fields.
- It passes resolved, filtered presentation data to BreadcrumbTrail.

- [ ] **Step 1: Add failing schema control tests**

Inspect the Theme Settings tab and assert:

    separator: defaultValue chevron, required true
    alignment: defaultValue left, required true
    size: defaultValue default, required true
    showHome: defaultValue true
    showCurrentPage: defaultValue true
    sectionPadding: defaultValue compact, required true
    appearance: present

Also assert separator options exactly Chevron, Slash, Arrow, Dot and section padding exactly None, Compact, Default.

- [ ] **Step 2: Add failing component tests**

Render automatic and custom blocks. Assert data-breadcrumb-block=true, selected data-block-surface, separator, alignment class, current-page semantics, and empty output when filters hide the only item.

- [ ] **Step 3: Run the focused test**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx

Expected: FAIL because schema controls and component are absent.

- [ ] **Step 4: Complete src/blocks/Breadcrumb/config.ts**

Use Content and Theme Settings tabs.

Content:

    createBreadcrumbModeField()
    createBreadcrumbsField()

Theme Settings:

    createBlockAppearanceFields()

    separator select:
      chevron / Chevron (›)
      slash / Slash (/)
      arrow / Arrow (→)
      dot / Dot (•)

    alignment select:
      left / Left
      center / Center
      right / Right

    size select:
      compact / Compact
      default / Default

    showHome checkbox, default true
    showCurrentPage checkbox, default true

    sectionPadding select:
      none / None
      compact / Compact
      default / Default

Use interfaceName BreadcrumbBlock and required select fields. Leave the admin thumbnail property out until Task 5 adds the typed thumbnail definition and its matching admin registration together.

- [ ] **Step 5: Implement src/blocks/Breadcrumb/Component.tsx**

The component must:

    const items =
      breadcrumbMode === 'custom'
        ? resolveCustomPageBreadcrumbs(breadcrumbs)
        : automaticBreadcrumbs ?? []

    const visibleItems = filter using the original last position for current-page
      state; treat the first item as Home only when its URL is '/' or its
      trimmed, case-insensitive label equals 'home'

    if (visibleItems.length === 0) return null

    const { className, surface } = resolveBlockAppearanceClasses(appearance)

    return (
      <section
        className={cn(
          regularBlockMobilePaddingClasses[sectionPadding ?? 'compact'],
          className,
        )}
        data-block-surface={surface}
        data-breadcrumb-block="true"
      >
        <div className={regularBlockContainerClasses}>
          <BreadcrumbTrail
            alignment={alignment ?? 'left'}
            items={items}
            separator={separator ?? 'chevron'}
            showCurrentPage={showCurrentPage !== false}
            showHome={showHome !== false}
            size={size ?? 'default'}
          />
        </div>
      </section>
    )

Type breadcrumbs as ManualBreadcrumbInput[] and automaticBreadcrumbs as ResolvedPageBreadcrumb[]. Use BlockAppearance and exported BreadcrumbTrail option types. Do not query Payload.

- [ ] **Step 6: Run focused tests**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx \
      tests/int/page-breadcrumbs.int.spec.tsx

Expected: PASS.

- [ ] **Step 7: Load the UI craft floor before polishing**

Read .agents/skills/impeccable/reference/craft-floor.md. Confirm no hard-coded brand color, arbitrary width, unsupported nowrap, decorative card, shadow, or animation entered the block.

---

### Task 4: Register production, reusable, and live-preview paths

**Files:**

- Modify: src/collections/Pages.ts
- Modify: src/collections/ReusableSections.ts
- Modify: src/blocks/renderPageBlocks.tsx
- Modify: src/blocks/renderLivePreviewPageBlocks.tsx
- Modify: src/payload-types.ts
- Test: tests/int/breadcrumb-block.int.spec.tsx

- [ ] **Step 1: Add failing context tests**

Build typed Page fixtures containing:

- A direct automatic Breadcrumb block.
- A custom Breadcrumb block.
- A Breadcrumb nested inside a populated Reusable Section.
- The same direct block rendered through renderLivePreviewPageBlocks.

Assert the current page title, ancestor link, and aria-current appear in the automatic production, reusable-section, and live-preview outputs. Assert the selected custom URL appears in the custom production output.

- [ ] **Step 2: Run tests and verify missing registration**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx

Expected: FAIL because render switches do not recognize breadcrumb.

- [ ] **Step 3: Register both Payload collections**

Import BreadcrumbBlock in src/collections/Pages.ts and src/collections/ReusableSections.ts. Add it immediately after PageHeaderBlock in both layout block arrays.

- [ ] **Step 4: Register production rendering**

In src/blocks/renderPageBlocks.tsx import BreadcrumbBlockComponent and add:

    case 'breadcrumb':
      return wrap(
        <BreadcrumbBlockComponent
          {...block}
          automaticBreadcrumbs={args.automaticBreadcrumbs}
        />,
      )

Keep the existing RenderArgs and recursion unchanged.

- [ ] **Step 5: Register live-preview rendering**

In src/blocks/renderLivePreviewPageBlocks.tsx import BreadcrumbBlockComponent and add:

    case 'breadcrumb':
      return (
        <BreadcrumbBlockComponent
          key={key}
          {...block}
          automaticBreadcrumbs={automaticBreadcrumbs}
        />
      )

Keep SnapshotArgs and reusable-section recursion unchanged.

- [ ] **Step 6: Generate Payload types**

Run:

    pnpm run generate:types

Expected: exit 0. src/payload-types.ts contains BreadcrumbBlock and blockType breadcrumb in Page and Reusable Section layout unions.

- [ ] **Step 7: Run context tests**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx \
      tests/int/page-breadcrumbs.int.spec.tsx

Expected: PASS for direct, reusable, and live-preview paths.

---

### Task 5: Add block-picker preview

**Files:**

- Modify: src/block-thumbnails/definitions.ts
- Modify: src/block-thumbnails/fixtures.tsx
- Modify: src/blocks/Breadcrumb/config.ts
- Create: public/block-thumbnails/breadcrumb.jpg
- Test: tests/int/breadcrumb-block.int.spec.tsx

- [ ] **Step 1: Add a failing definition test**

Assert blockThumbnailDefinitions contains:

    {
      filename: 'breadcrumb.jpg',
      label: 'Breadcrumb',
      slug: 'breadcrumb',
    }

- [ ] **Step 2: Add thumbnail metadata**

Near Page Header in src/block-thumbnails/definitions.ts add:

    defineThumbnail({
      alt: 'Breadcrumb block preview',
      filename: 'breadcrumb.jpg',
      label: 'Breadcrumb',
      slug: 'breadcrumb',
    })

Then import getBlockThumbnailAdmin from the definitions module in src/blocks/Breadcrumb/config.ts and add this property to the existing BreadcrumbBlock object without changing its other fields:

    admin: getBlockThumbnailAdmin('breadcrumb'),

- [ ] **Step 3: Add a real fixture**

Import BreadcrumbBlockComponent in fixtures.tsx and add:

    breadcrumb: (
      <BreadcrumbBlockComponent
        alignment="left"
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        automaticBreadcrumbs={[
          { label: 'Home', url: '/' },
          { label: 'Academics', url: '/academics' },
          { label: 'MBBS Programme', url: '/academics/mbbs' },
        ]}
        breadcrumbMode="automatic"
        sectionPadding="compact"
        separator="chevron"
        showCurrentPage
        showHome
        size="default"
      />
    )

- [ ] **Step 4: Generate only this thumbnail**

Run:

    BLOCK_THUMBNAIL_SLUG=breadcrumb pnpm run generate:block-thumbnails

Expected: exit 0; public/block-thumbnails/breadcrumb.jpg exists; no browser console errors.

- [ ] **Step 5: Inspect the image**

Verify hierarchy is readable, separators are quiet, no content clips, and no unintended card appears.

- [ ] **Step 6: Run focused tests**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx

Expected: PASS.

---

### Task 6: Full verification

**Files:**

- Verification target: shared renderer, Breadcrumb component, and focused tests. Apply changes only for concrete failures produced by the listed checks.

- [ ] **Step 1: Format only touched files**

Run Prettier with --write against every created or modified Breadcrumb, Page Header, renderer, collection, thumbnail, and test file.

Expected: exit 0.

- [ ] **Step 2: Type-check**

Run:

    pnpm exec tsc --noEmit

Expected: exit 0.

- [ ] **Step 3: Run focused regressions**

Run:

    pnpm exec vitest run --config ./vitest.config.mts \
      tests/int/breadcrumb-block.int.spec.tsx \
      tests/int/page-breadcrumbs.int.spec.tsx \
      tests/int/page-header-actions.int.spec.tsx \
      tests/int/block-appearance.int.spec.tsx

Expected: all PASS.

- [ ] **Step 4: Run the full integration suite**

Run:

    pnpm run test:int

Expected: exit 0 with all tests passing.

- [ ] **Step 5: Run lint**

Run:

    pnpm run lint

Expected: exit 0 with no new errors or warnings.

- [ ] **Step 6: Run production build**

Run:

    pnpm run build

Expected: compilation, TypeScript, page-data collection, and static generation complete successfully.

- [ ] **Step 7: Inspect desktop and mobile together**

At 1440px and 375px, inspect neutral and Brand backgrounds, all separators, all alignments, hidden Home, hidden current Page, a long ancestor label, and Page Header plus standalone Breadcrumb.

Expected:

- No horizontal overflow.
- Wrapped labels remain readable.
- Links retain clear theme-aware focus and hover visibility without an underline.
- Current page is distinguishable without color alone.
- Muted separators have sufficient contrast.
- Page Header remains independently controlled.

- [ ] **Step 8: Run one Impeccable detector pass**

Run:

    node .agents/skills/impeccable/scripts/detect.mjs --json \
      src/components/BreadcrumbTrail.tsx \
      src/blocks/Breadcrumb/Component.tsx

Expected: no unresolved mechanical findings. Apply material fixes in one batch and perform at most one visual confirmation pass.

- [ ] **Step 9: Review the final unstaged workspace**

Run:

    git status --short
    git diff --check
    git diff --stat

Expected: no whitespace errors, all approved Breadcrumb files present, unrelated user changes untouched, and nothing newly staged or committed.

---

## Completion criteria

- Breadcrumb is available in Pages and Reusable Sections.
- Automatic and Custom sources work in production and live preview.
- Chevron, Slash, Arrow, and Dot render decoratively and accessibly.
- Alignment, size, visibility, appearance, border, and padding controls work.
- Page Header uses the shared renderer without losing existing modes.
- Trails wrap safely and inherit all selected themes.
- Page-level structured data remains single-source and unchanged.
- Payload types, thumbnail, tests, lint, TypeScript, and build pass.
- All changes remain unstaged and uncommitted until requested.
