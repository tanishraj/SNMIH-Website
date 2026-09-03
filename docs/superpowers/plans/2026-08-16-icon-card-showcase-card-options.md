# Icon Card Showcase Card Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Icon Card Showcase backgrounds with shared section surfaces, make icons optional, add card-content alignment and eyebrows, and add explicit per-card link/button actions without breaking saved whole-card links.

**Architecture:** Keep changes isolated to `IconCardShowcase`. Normalize retired card values at schema-read and render time, resolve new backgrounds through existing Appearance/card-surface helpers, and render one explicit action per card with shared link and button components. Preserve legacy whole-card links only when a saved destination has no action label.

**Tech Stack:** Payload CMS 3, React Server Components, Next.js 16, TypeScript, Tailwind CSS 4, Lucide React, Vitest

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-16-icon-card-showcase-design.md` exactly.
- Do not add dependencies or modify another block's behavior.
- Preserve the existing staged index; do not stage, unstage, or commit during execution.
- Shared card backgrounds are `default`, `subtle`, `brand`, `gradient-subtle`, and `gradient-brand`.
- Normalize `primary` to `brand`; normalize `secondary`, `muted`, and `accent` to `subtle`.
- A missing icon renders nothing; a non-empty invalid icon renders `Sparkles`.
- A visible card action requires a non-blank label and valid destination.
- A valid destination without an action label remains a legacy whole-card link.
- Never render nested anchors.
- Card Content Alignment is independent of Section Content Alignment and defaults to `center`.

---

### Task 1: Update the Payload schema and migration hooks

**Files:**

- Modify: `src/blocks/IconCardShowcase/config.ts`
- Modify: `tests/int/icon-card-showcase.int.spec.tsx`

**Interfaces:**

- Produces optional `icon`, card `eyebrow`, `actionLabel`, `actionMode`, `actionVariant`, and `showArrow`.
- Produces `cardContentAlignment: 'left' | 'center' | 'right'`.
- Produces shared background values plus `inherit` for card overrides.

- [ ] **Step 1: Write failing schema assertions**

Replace the old background assertions and add these checks in `tests/int/icon-card-showcase.int.spec.tsx`:

```tsx
expect(findField(IconCardShowcaseBlock.fields, 'icon')).toMatchObject({
  name: 'icon',
  type: 'text',
})
expect(findField(IconCardShowcaseBlock.fields, 'icon')).not.toHaveProperty('required', true)
const cardsSchema = findField(IconCardShowcaseBlock.fields, 'cards')
expect(findField((cardsSchema?.fields ?? []) as unknown[], 'eyebrow')).toMatchObject({
  type: 'text',
})
expect(findField(IconCardShowcaseBlock.fields, 'actionLabel')).toMatchObject({ type: 'text' })
expect(findField(IconCardShowcaseBlock.fields, 'actionMode')).toMatchObject({
  defaultValue: 'link',
  required: false,
})
expect(optionValues(findField(IconCardShowcaseBlock.fields, 'actionMode'))).toEqual([
  'link',
  'button',
])
expect(findField(IconCardShowcaseBlock.fields, 'actionVariant')?.admin).toMatchObject({
  condition: expect.any(Function),
})
expect(findField(IconCardShowcaseBlock.fields, 'showArrow')?.admin).toMatchObject({
  condition: expect.any(Function),
})
expect(findField(IconCardShowcaseBlock.fields, 'cardContentAlignment')).toMatchObject({
  defaultValue: 'center',
  required: true,
})
expect(optionValues(findField(IconCardShowcaseBlock.fields, 'cardContentAlignment'))).toEqual([
  'left',
  'center',
  'right',
])
expect(findField(IconCardShowcaseBlock.fields, 'defaultCardBackground')).toMatchObject({
  defaultValue: 'brand',
  required: true,
})
expect(optionValues(findField(IconCardShowcaseBlock.fields, 'defaultCardBackground'))).toEqual([
  'default',
  'subtle',
  'brand',
  'gradient-subtle',
  'gradient-brand',
])
expect(optionValues(findField(IconCardShowcaseBlock.fields, 'cardBackground'))).toEqual([
  'inherit',
  'default',
  'subtle',
  'brand',
  'gradient-subtle',
  'gradient-brand',
])
for (const name of ['defaultCardBackground', 'cardBackground']) {
  expect(findField(IconCardShowcaseBlock.fields, name)?.hooks).toMatchObject({
    afterRead: [expect.any(Function)],
  })
}
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx
```

Expected: FAIL because the current icon is required, new fields are missing, and old surface values remain.

- [ ] **Step 3: Add shared background values and read normalization**

In `src/blocks/IconCardShowcase/config.ts`, replace the background constants with:

```ts
const showcaseCardBackgroundValues = [
  'default',
  'subtle',
  'brand',
  'gradient-subtle',
  'gradient-brand',
] as const

type ShowcaseCardBackground = (typeof showcaseCardBackgroundValues)[number]

const normalizeShowcaseCardBackground = (
  value?: string | null,
  fallback: ShowcaseCardBackground | 'inherit' = 'default',
): ShowcaseCardBackground | 'inherit' => {
  if (value === 'inherit') return 'inherit'
  if (showcaseCardBackgroundValues.includes(value as ShowcaseCardBackground)) {
    return value as ShowcaseCardBackground
  }
  if (value === 'primary') return 'brand'
  if (value === 'secondary' || value === 'muted' || value === 'accent') return 'subtle'
  return fallback
}

const cardBackgroundOptions = [
  { label: 'Match Section', value: 'default' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Brand', value: 'brand' },
  { label: 'Gradient: Subtle', value: 'gradient-subtle' },
  { label: 'Gradient: Brand', value: 'gradient-brand' },
] as const
```

Add this hook to `cardBackgroundField`:

```ts
hooks: {
  afterRead: [({ value }) =>
    normalizeShowcaseCardBackground(value as string | null | undefined, 'inherit')],
},
```

Set `defaultCardBackground.defaultValue` to `brand` and add:

```ts
hooks: {
  afterRead: [({ value }) =>
    normalizeShowcaseCardBackground(value as string | null | undefined, 'brand')],
},
```

- [ ] **Step 4: Make icon optional and add card eyebrow/action fields**

Import `buttonVariantDescription` and `buttonVariantOptions`. Extend sibling data and conditions:

```ts
type CardSiblingData = {
  actionLabel?: string | null
  actionMode?: 'button' | 'link' | null
  linkType?: 'custom' | 'none' | 'page' | null
}

const hasActionLabel = (_data: unknown, siblingData: CardSiblingData) =>
  Boolean(siblingData?.actionLabel?.trim())
const isButtonAction = (_data: unknown, siblingData: CardSiblingData) =>
  hasActionLabel(_data, siblingData) && siblingData?.actionMode === 'button'
```

Replace `createIconField({ required: true })` with `createIconField({ required: false })`. Insert these fields into the card Content tab:

```ts
{
  name: 'eyebrow',
  type: 'text',
  admin: { description: 'Optional short label shown above the card title.' },
},
{ name: 'title', type: 'text', required: true },
{
  name: 'actionLabel',
  label: 'Action Label',
  type: 'text',
  admin: { description: 'Adds a visible action when a valid destination is selected.' },
},
```

Keep the destination/new-tab fields in `contentFields`. Add the following controls to the
`themeFields` array before `cardBackgroundField`, so presentation choices stay in the card's
Theme Settings tab:

```ts
const actionModeField = {
  name: 'actionMode',
  label: 'Display Action As',
  type: 'select',
  defaultValue: 'link',
  required: false,
  options: [
    { label: 'Link', value: 'link' },
    { label: 'Button', value: 'button' },
  ],
  admin: { condition: hasActionLabel },
} satisfies SelectField

const actionVariantField = {
  name: 'actionVariant',
  label: 'Button Variant',
  type: 'select',
  defaultValue: 'default',
  required: true,
  options: buttonVariantOptions,
  admin: { condition: isButtonAction, description: buttonVariantDescription },
} satisfies SelectField

const showArrowField = {
  name: 'showArrow',
  label: 'Show arrow',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    condition: isButtonAction,
    description: 'Adds a trailing arrow to this button action.',
  },
} satisfies CheckboxField
```

The final `createCardTabs` call must pass:

```ts
themeFields: [actionModeField, actionVariantField, showArrowField, cardBackgroundField],
```

Do not place these presentation controls in `contentFields`.

- [ ] **Step 5: Add Card Content Alignment**

After Section Content Alignment in Theme Settings, add:

```ts
select('cardContentAlignment', 'Card Content Alignment', 'center', [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
]),
```

- [ ] **Step 6: Run the focused schema suite**

Run the command from Step 2.

Expected: schema assertions pass; renderer assertions remain unchanged until Task 2.

---

### Task 2: Render backgrounds, alignment, eyebrows, and actions

**Files:**

- Modify: `src/blocks/IconCardShowcase/Component.tsx`
- Modify: `tests/int/icon-card-showcase.int.spec.tsx`

**Interfaces:**

- Consumes shared Appearance, card surface, `SectionEyebrow`, `ContentLink`, `Button`, and `ActionButtonContent`.
- Produces a surface-aware `ShowcaseCard`, explicit action rendering, and backward-compatible legacy links.

- [ ] **Step 1: Add failing renderer tests**

Append:

```tsx
it('uses shared backgrounds and normalizes retired values', () => {
  const brand = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent cards={[{ title: 'Brand' }]} />,
  )
  const subtle = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[{ cardBackground: 'secondary' as never, title: 'Legacy subtle' }]}
    />,
  )
  const gradient = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[{ cardBackground: 'gradient-brand', title: 'Gradient' }]}
    />,
  )

  expect(brand).toContain('bg-brand text-primary-foreground')
  expect(subtle).toContain('bg-subtle text-foreground')
  expect(gradient).toContain('bg-gradient-brand text-primary-foreground')
})

it('omits missing icons and falls back for invalid supplied icons', () => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[{ title: 'No icon' }, { icon: 'UnknownIcon', title: 'Fallback' }]}
    />,
  )
  expect(html.match(/data-icon-card-showcase-icon=/g)).toHaveLength(1)
  expect(html).toContain('data-icon-card-showcase-icon="Sparkles"')
})

it.each([
  ['left', 'items-start text-left'],
  ['center', 'items-center text-center'],
  ['right', 'items-end text-right'],
] as const)('aligns card content %s', (cardContentAlignment, classes) => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cardContentAlignment={cardContentAlignment}
      cards={[{ eyebrow: 'Principle', title: 'Integrity' }]}
    />,
  )
  expect(html).toContain(`data-icon-card-showcase-card-alignment="${cardContentAlignment}"`)
  expect(html).toContain(classes)
  expect(html).toContain('data-section-eyebrow="true"')
  expect(html).toContain('data-section-eyebrow-surface="brand"')
})

it('renders an explicit shared link without making the card an anchor', () => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[
        {
          actionLabel: 'Read more',
          actionMode: 'link',
          linkType: 'custom',
          openInNewTab: true,
          title: 'Integrity',
          url: '/integrity',
        },
      ]}
    />,
  )
  expect(html).toContain('<article')
  expect(html).toContain('data-icon-card-showcase-action="link"')
  expect(html).toContain('data-content-link="true"')
  expect(html).toContain('target="_blank"')
  expect(html).toContain('rel="noreferrer"')
  expect(html).not.toMatch(/<a[^>]*data-icon-card-showcase-card="true"/)
})

it('renders a shared button action with variant and arrow', () => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[
        {
          actionLabel: 'Explore',
          actionMode: 'button',
          actionVariant: 'whiteOutline',
          linkType: 'custom',
          showArrow: true,
          title: 'Excellence',
          url: '/excellence',
        },
      ]}
    />,
  )
  expect(html).toContain('data-icon-card-showcase-action="button"')
  expect(html).toContain('data-variant="whiteOutline"')
  expect(html).toContain('data-action-arrow="true"')
})

it('keeps legacy whole-card links and omits incomplete actions', () => {
  const html = renderToStaticMarkup(
    <IconCardShowcaseBlockComponent
      cards={[
        { linkType: 'custom', title: 'Legacy', url: '/legacy' },
        { actionLabel: 'Missing destination', title: 'Static' },
      ]}
    />,
  )
  expect(html).toMatch(/<a[^>]*data-icon-card-showcase-card="true"[^>]*href="\/legacy"/)
  expect(html.match(/data-icon-card-showcase-action=/g)).toBeNull()
})
```

- [ ] **Step 2: Run the focused test and verify renderer failures**

Run the focused Vitest command from Task 1.

Expected: FAIL on new surface, icon, alignment, eyebrow, and action contracts.

- [ ] **Step 3: Replace card-surface types and add a shared-background resolver**

Define:

```ts
type ShowcaseCardBackground = 'default' | 'subtle' | 'brand' | 'gradient-subtle' | 'gradient-brand'
type ShowcaseCardBackgroundOverride = ShowcaseCardBackground | 'inherit'

const showcaseCardBackgroundValues = new Set<ShowcaseCardBackground>([
  'default',
  'subtle',
  'brand',
  'gradient-subtle',
  'gradient-brand',
])

function normalizeShowcaseCardBackground(
  value: string | null | undefined,
  fallback: ShowcaseCardBackground,
): ShowcaseCardBackground {
  if (showcaseCardBackgroundValues.has(value as ShowcaseCardBackground)) {
    return value as ShowcaseCardBackground
  }
  if (value === 'primary') return 'brand'
  if (value === 'secondary' || value === 'muted' || value === 'accent') return 'subtle'
  return fallback
}

type ShowcaseCardSurface = ReturnType<typeof resolveCardSurface> & {
  eyebrowSurface: SectionEyebrowSurface
  value: ShowcaseCardBackground
}

function resolveShowcaseCardSurface(
  value: ShowcaseCardBackground,
  sectionBackground: BlockBackground,
): ShowcaseCardSurface {
  const background = value === 'default' ? sectionBackground : value
  const surface = resolveCardSurface('default', background)
  return {
    ...surface,
    className:
      value === 'default'
        ? surface.className
        : resolveBlockAppearanceClasses({ background, border: 'none' }).className,
    eyebrowSurface: background,
    value,
  }
}
```

Import `BlockBackground`, change the global fallback to `brand`, and add `cardContentAlignment?: ContentAlignment | null` to block props.

- [ ] **Step 4: Resolve optional icons, eyebrows, explicit actions, and legacy links**

Import `ActionButtonContent`, `ContentLink`, `Button`, `CmsActionMode`, and `CmsActionVariant`. Extend card input and output:

```ts
type ShowcaseCardValue = Omit<CmsLinkValue, 'linkType'> & {
  actionLabel?: string | null
  actionMode?: CmsActionMode | null
  actionVariant?: CmsActionVariant | null
  cardBackground?: ShowcaseCardBackgroundOverride | null
  description?: string | null
  eyebrow?: string | null
  icon?: string | null
  id?: string | null
  linkType?: 'custom' | 'none' | 'page' | null
  showArrow?: boolean | null
  title?: string | null
}

type ResolvedShowcaseCard = {
  action?: {
    href: string
    label: string
    mode: CmsActionMode
    openInNewTab: boolean
    showArrow: boolean
    variant: CmsActionVariant
  }
  background: ShowcaseCardBackground
  description?: string
  eyebrow?: string
  icon?: LucideIcon
  iconName?: string
  id: string
  legacyLink?: { href: string; openInNewTab: boolean }
  title: string
}
```

Inside the existing `flatMap`, use:

```ts
const requestedIcon = card.icon?.trim()
const Icon = requestedIcon
  ? ((LucideIcons as Record<string, unknown>)[requestedIcon] as LucideIcon | undefined)
  : undefined
const destination = resolveCmsLink({
  ...card,
  linkType: card.linkType === 'none' ? null : card.linkType,
})
const href = destination.href?.trim() || undefined
const actionLabel = card.actionLabel?.trim()
const action =
  actionLabel && href
    ? {
        href,
        label: actionLabel,
        mode: card.actionMode ?? 'link',
        openInNewTab: Boolean(destination.openInNewTab),
        showArrow: Boolean(card.showArrow),
        variant: card.actionVariant ?? 'default',
      }
    : undefined
const legacyLink =
  href && !actionLabel ? { href, openInNewTab: Boolean(destination.openInNewTab) } : undefined
```

Return `icon: requestedIcon ? Icon ?? Sparkles : undefined`, the matching optional `iconName`, trimmed eyebrow, action, and legacy link. Resolve `inherit` against the global background and normalize every other stored value.

- [ ] **Step 5: Render card actions and independent alignment**

Add:

```ts
const cardAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const satisfies Record<ContentAlignment, string>
```

Add this component outside the block component:

```tsx
function ShowcaseCardAction({
  action,
  surface,
}: {
  action: NonNullable<ResolvedShowcaseCard['action']>
  surface: ShowcaseCardSurface
}) {
  if (action.mode === 'button' && action.variant !== 'link') {
    return (
      <Button
        asChild
        className={surface.button[action.variant]}
        data-icon-card-showcase-action="button"
        size="lg"
        variant={action.variant}
      >
        <a
          href={action.href}
          rel={action.openInNewTab ? 'noreferrer' : undefined}
          target={action.openInNewTab ? '_blank' : undefined}
        >
          <ActionButtonContent label={action.label} showArrow={action.showArrow} />
        </a>
      </Button>
    )
  }
  return (
    <ContentLink
      className={surface.link}
      data-icon-card-showcase-action="link"
      href={action.href}
      label={action.label}
      openInNewTab={action.openInNewTab}
    />
  )
}
```

Pass normalized `cardContentAlignment` into each card. Apply `cardAlignmentClasses[cardContentAlignment]` to the shell and inner content, set `data-icon-card-showcase-card-alignment`, render icon only when present, render `SectionEyebrow` with `surface.eyebrowSurface`, and render `ShowcaseCardAction` after the description. Wrap the shell in an anchor only for `card.legacyLink`; explicit-action and static cards render as `article`.

- [ ] **Step 6: Expose normalized Card Content Alignment**

Destructure `cardContentAlignment`, normalize it through `validContentAlignments` with `center`, add the data attribute to the section, and pass it to every card. Leave Section Content Alignment responsible only for the header and footer.

- [ ] **Step 7: Run the focused renderer suite**

Run the focused Vitest command.

Expected: every Icon Card Showcase schema and renderer test passes.

---

### Task 3: Regenerate types and refresh the thumbnail

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Generate: `src/payload-types.ts`
- Generate: `public/block-thumbnails/icon-card-showcase.jpg`
- Modify: `tests/int/icon-card-showcase.int.spec.tsx`

**Interfaces:**

- Produces updated generated types and a production-component thumbnail fixture covering the new options.

- [ ] **Step 1: Add failing generated-type assertions**

Replace the old background assertion with:

```tsx
expect(contract).toContain("cardContentAlignment: 'left' | 'center' | 'right'")
expect(contract).toContain(
  "defaultCardBackground: 'default' | 'subtle' | 'brand' | 'gradient-subtle' | 'gradient-brand'",
)
expect(contract).toContain('icon?: string | null')
expect(contract).toContain('eyebrow?: string | null')
expect(contract).toContain('actionLabel?: string | null')
expect(contract).toContain("actionMode?: ('link' | 'button') | null")
```

- [ ] **Step 2: Verify generated types are stale, then regenerate**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx
pnpm generate:types
```

Expected: the first command fails only on generated types; generation completes successfully.

- [ ] **Step 3: Update the thumbnail fixture**

Replace its `iconCardShowcase` entry with:

```tsx
iconCardShowcase: (
  <IconCardShowcaseBlockComponent
    appearance={{ background: 'subtle', border: 'topAndBottom' }}
    cardContentAlignment="center"
    cardHeight="standard"
    cards={[
      { eyebrow: 'Value', icon: 'Handshake', title: 'Integrity' },
      {
        actionLabel: 'Learn more',
        actionMode: 'link',
        eyebrow: 'Value',
        icon: 'Scale',
        linkType: 'custom',
        title: 'Compassion',
        url: '#',
      },
      { eyebrow: 'Value', title: 'Excellence' },
    ]}
    cardWidth="standard"
    defaultCardBackground="brand"
    iconSize="large"
    size="compact"
  />
),
```

- [ ] **Step 4: Generate only this block's JPEG**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=iconCardShowcase pnpm generate:block-thumbnails
```

Expected: a non-empty 1600×900 JPEG. If sandboxing blocks the local server/browser, rerun with approved local-server access.

- [ ] **Step 5: Run type and thumbnail contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all tests pass.

---

### Task 4: Format and verify the complete refinement

**Files:**

- Verify all files changed in Tasks 1–3.

**Interfaces:**

- Produces a formatted, type-safe, regression-tested change while preserving the staged index.

- [ ] **Step 1: Format authored files**

Run:

```bash
pnpm exec prettier --write src/blocks/IconCardShowcase/config.ts src/blocks/IconCardShowcase/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/icon-card-showcase.int.spec.tsx docs/superpowers/specs/2026-08-16-icon-card-showcase-design.md docs/superpowers/plans/2026-08-16-icon-card-showcase-card-options.md
```

Expected: success. Do not separately format generated `src/payload-types.ts`.

- [ ] **Step 2: Run focused and related tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/icon-card-showcase.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts tests/int/block-appearance-contract.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx
```

Expected: all selected tests pass.

- [ ] **Step 3: Run static and design checks**

Run each command:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/IconCardShowcase/config.ts src/blocks/IconCardShowcase/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/icon-card-showcase.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/IconCardShowcase/Component.tsx
git diff --check
```

Expected: TypeScript and ESLint pass, detector output has no unexplained findings, and the diff check is clean.

- [ ] **Step 4: Run the full integration suite**

Run:

```bash
pnpm run test:int
```

Expected: all integration tests pass. If MongoMemoryServer receives sandbox `EPERM`, rerun with approved local-port access.

- [ ] **Step 5: Audit without changing the staged index**

Run:

```bash
git diff --cached --name-only
git status --short
git diff --stat
```

Expected: no file was newly staged, unstaged, or committed. Files staged before execution may show both staged and unstaged changes; leave them intact.
