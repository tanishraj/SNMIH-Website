# SNMIH Theme Refinement and Key Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Use delegated/subagent execution only if the user explicitly requests it.

**Goal:** Make SNMIH-Blue the default website theme, rename both theme identifiers and files, migrate legacy Payload values safely, and give SNMIH-Green a consistent green action palette and restrained radius system.

**Architecture:** Keep `src/lib/themes/websiteThemes.ts` as the single public registry, add a narrow legacy-value normalizer at the runtime boundary, and store only the two new identifiers in Payload. Preserve existing appearances with a reversible MongoDB migration, then make the visual refinement through semantic theme tokens plus one shared Tabs primitive correction rather than block-specific overrides.

**Tech Stack:** Payload CMS 3.85, MongoDB/Mongoose adapter, Next.js 16, React 19, Tailwind CSS 4, Radix UI, Vitest, Playwright.

## Global Constraints

- SNMIH-Blue (`snmih-blue`) is the default for new, missing, malformed, retired, unknown, and no-theme-attribute states.
- Legacy `default` must continue to resolve to SNMIH-Green until migration, and legacy `snmih` must continue to resolve to SNMIH-Blue.
- Payload exposes only `snmih-green` and `snmih-blue` to editors.
- Do not execute the new database migration against the configured database without separate user approval.
- Do not stage or commit changes unless the user explicitly asks after reviewing the implementation.
- SNMIH-Blue's visual tokens stay unchanged apart from its filename and selector identifier.
- SNMIH-Green uses the green family already established by SNMIH-Blue's success/ring accents.
- Preserve destructive red, white media controls, paired brand-surface foregrounds, pill geometry, square structural elements, and hidden-scrollbar behavior.
- Use semantic tokens and shared primitives; do not add blanket `a` or `button` recoloring rules.
- Complete the project-context update/check loop after implementation.

---

## File Structure

### Create

- `src/styles/themes/theme-snmih-green.css` — explicit SNMIH-Green light/dark token preset.
- `src/styles/themes/theme-snmih-blue.css` — SNMIH-Blue preset and no-attribute fallback.
- `src/migrations/20260829_000000_rename_snmih_theme_values.ts` — reversible current-global and version-history value migration.
- `src/migrations/index.ts` — Payload migration registry generated in the repository's expected format.
- `tests/int/theme-value-migration.int.spec.ts` — isolated migration contract using mocked Mongoose models.

### Modify

- `src/lib/themes/websiteThemes.ts` — new public values, SNMIH-Blue default, legacy normalizer.
- `src/app/(frontend)/layout.tsx` — normalize stored theme values before rendering the root attribute.
- `src/styles/globals.css` — import the two renamed stylesheets.
- `src/styles/custom.css` — rename SNMIH-Blue-specific selectors from `snmih` to `snmih-blue`.
- `src/components/ui/tabs.tsx` — semantic green active state for the generic framed and line variants.
- `src/payload-types.ts` — regenerate the checked-in Payload union.
- `tests/int/theme-settings.int.spec.ts` — new registry, aliases, imports, default, and runtime contracts.
- `tests/int/theme-contracts.int.spec.ts` — renamed presets, fallback ownership, palette, radius, link, and tabs contracts.
- `tests/int/section-eyebrow.int.spec.tsx` — renamed SNMIH-Blue selector assertions.
- `tests/e2e/calendar.e2e.spec.ts` — use the new SNMIH-Blue data attribute.
- `docs/guides/theme-settings.md` — document the new default and identifiers.
- `.agents/skills/project-context/references/architecture.md` — update maintained architecture terminology and values.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate after the file rename.

### Delete after replacement

- `src/styles/themes/theme-default.css`
- `src/styles/themes/theme-snmih.css`

Historical documents under `docs/superpowers/specs/` and `docs/superpowers/plans/` remain unchanged because they describe the code at the time they were written.

---

### Task 1: Rename the runtime theme contract and preserve legacy values

**Files:**

- Modify: `tests/int/theme-settings.int.spec.ts`
- Modify: `src/lib/themes/websiteThemes.ts`
- Modify: `src/app/(frontend)/layout.tsx`

**Interfaces:**

- Produces: `WebsiteThemeValue = 'snmih-green' | 'snmih-blue'`.
- Produces: `normalizeWebsiteTheme(value: unknown): WebsiteThemeValue`.
- Preserves: `isWebsiteTheme(value: string): value is WebsiteThemeValue` validates only public values.
- Consumed by: `ThemeSettings`, frontend root layout, block-thumbnail layout, migration-adjacent tests, and generated Payload types.

- [ ] **Step 1: Write failing registry and compatibility assertions**

Update the import in `tests/int/theme-settings.int.spec.ts` to include `normalizeWebsiteTheme`, then replace the registry test with:

```ts
it('exports only the two explicit SNMIH themes and normalizes legacy values', () => {
  expect(defaultWebsiteTheme).toBe('snmih-blue')
  expect(websiteThemeValues).toEqual(['snmih-green', 'snmih-blue'])
  expect(websiteThemeOptions).toEqual([
    { label: 'SNMIH-Green', value: 'snmih-green' },
    { label: 'SNMIH-Blue', value: 'snmih-blue' },
  ])

  expect(isWebsiteTheme('snmih-green')).toBe(true)
  expect(isWebsiteTheme('snmih-blue')).toBe(true)
  expect(isWebsiteTheme('default')).toBe(false)
  expect(isWebsiteTheme('snmih')).toBe(false)

  expect(normalizeWebsiteTheme('snmih-green')).toBe('snmih-green')
  expect(normalizeWebsiteTheme('snmih-blue')).toBe('snmih-blue')
  expect(normalizeWebsiteTheme('default')).toBe('snmih-green')
  expect(normalizeWebsiteTheme('snmih')).toBe('snmih-blue')
  expect(normalizeWebsiteTheme('sunset')).toBe('snmih-blue')
  expect(normalizeWebsiteTheme(undefined)).toBe('snmih-blue')
  expect(normalizeWebsiteTheme(null)).toBe('snmih-blue')
})
```

Update the frontend layout contract in the same test file:

```ts
it('wires the frontend layout to the shared normalizer', () => {
  const layoutSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'),
    'utf8',
  )

  expect(layoutSource).toContain("from '@/lib/themes/websiteThemes'")
  expect(layoutSource).toContain('normalizeWebsiteTheme')
  expect(layoutSource).toContain(
    'const themeColor = normalizeWebsiteTheme(themeSettings.themeColor)',
  )
  expect(layoutSource).not.toContain('isWebsiteTheme(rawThemeColor)')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts -t 'exports only the two explicit SNMIH themes and normalizes legacy values|wires the frontend layout to the shared normalizer'
```

Expected: FAIL because `normalizeWebsiteTheme` is not exported and the registry still exposes `default`/`snmih` with Green as the default.

- [ ] **Step 3: Implement the public registry and compatibility normalizer**

Replace the executable portion of `src/lib/themes/websiteThemes.ts` with:

```ts
export const websiteThemes = [
  { label: 'SNMIH-Green', value: 'snmih-green' },
  { label: 'SNMIH-Blue', value: 'snmih-blue' },
] as const

export type WebsiteThemeValue = (typeof websiteThemes)[number]['value']

export const defaultWebsiteTheme: WebsiteThemeValue = 'snmih-blue'

export const websiteThemeValues = websiteThemes.map(
  ({ value }) => value,
) as readonly WebsiteThemeValue[]

export const websiteThemeOptions = websiteThemes.map(({ label, value }) => ({
  label,
  value,
}))

export function isWebsiteTheme(value: string): value is WebsiteThemeValue {
  return websiteThemeValues.includes(value as WebsiteThemeValue)
}

const legacyWebsiteThemeAliases = {
  default: 'snmih-green',
  snmih: 'snmih-blue',
} as const satisfies Record<string, WebsiteThemeValue>

export function normalizeWebsiteTheme(value: unknown): WebsiteThemeValue {
  if (typeof value !== 'string') return defaultWebsiteTheme
  if (isWebsiteTheme(value)) return value

  return (
    legacyWebsiteThemeAliases[value as keyof typeof legacyWebsiteThemeAliases] ??
    defaultWebsiteTheme
  )
}
```

Update the file-level comment so examples refer to explicit theme values rather than `<name>` aliases that imply `default`.

- [ ] **Step 4: Normalize the value in the frontend root layout**

Change the import in `src/app/(frontend)/layout.tsx` to:

```ts
import { normalizeWebsiteTheme } from '@/lib/themes/websiteThemes'
```

Replace the current raw-value/type-guard block with:

```ts
const themeColor = normalizeWebsiteTheme(themeSettings.themeColor)
```

The block-thumbnail layout continues to consume `defaultWebsiteTheme`, so it automatically switches to SNMIH-Blue without a component change.

- [ ] **Step 5: Run the focused test and inspect the diff**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts -t 'exports only the two explicit SNMIH themes and normalizes legacy values|wires the frontend layout to the shared normalizer'
git diff --check
git diff -- src/lib/themes/websiteThemes.ts 'src/app/(frontend)/layout.tsx' tests/int/theme-settings.int.spec.ts
```

Expected: the isolated registry and normalizer assertions PASS. The not-yet-selected stylesheet tests remain intentionally unexecuted until Task 3. Do not stage or commit.

---

### Task 2: Add the reversible Payload theme-value migration

**Files:**

- Create: `tests/int/theme-value-migration.int.spec.ts`
- Create: `src/migrations/20260829_000000_rename_snmih_theme_values.ts`
- Create: `src/migrations/index.ts`

**Interfaces:**

- Consumes: Payload Mongo `MigrateUpArgs` and `MigrateDownArgs`.
- Produces: `up(args): Promise<void>` and `down(args): Promise<void>`.
- Updates: `payload.db.globals` and `payload.db.versions['theme-settings']` through their Mongoose models with the provided session.
- Does not connect to or mutate the configured database during tests.

- [ ] **Step 1: Write the isolated failing migration test**

Create `tests/int/theme-value-migration.int.spec.ts`:

```ts
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import { describe, expect, it, vi } from 'vitest'

import { down, up } from '@/migrations/20260829_000000_rename_snmih_theme_values'

const createArgs = () => {
  const updateGlobals = vi.fn().mockResolvedValue({ acknowledged: true })
  const updateVersions = vi.fn().mockResolvedValue({ acknowledged: true })
  const session = { id: 'theme-migration-session' }
  const args = {
    payload: {
      db: {
        globals: { updateMany: updateGlobals },
        versions: {
          'theme-settings': { updateMany: updateVersions },
        },
      },
    },
    req: {},
    session,
  } as unknown as MigrateUpArgs

  return { args, session, updateGlobals, updateVersions }
}

describe('SNMIH theme value migration', () => {
  it('maps legacy current and versioned values to explicit identifiers', async () => {
    const { args, session, updateGlobals, updateVersions } = createArgs()

    await up(args)

    expect(updateGlobals).toHaveBeenNthCalledWith(
      1,
      { globalType: 'theme-settings', themeColor: 'default' },
      { $set: { themeColor: 'snmih-green' } },
      { session },
    )
    expect(updateGlobals).toHaveBeenNthCalledWith(
      2,
      { globalType: 'theme-settings', themeColor: 'snmih' },
      { $set: { themeColor: 'snmih-blue' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      1,
      { 'version.themeColor': 'default' },
      { $set: { 'version.themeColor': 'snmih-green' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      2,
      { 'version.themeColor': 'snmih' },
      { $set: { 'version.themeColor': 'snmih-blue' } },
      { session },
    )
  })

  it('reverses only the explicit identifiers', async () => {
    const { args, session, updateGlobals, updateVersions } = createArgs()

    await down(args as unknown as MigrateDownArgs)

    expect(updateGlobals).toHaveBeenNthCalledWith(
      1,
      { globalType: 'theme-settings', themeColor: 'snmih-green' },
      { $set: { themeColor: 'default' } },
      { session },
    )
    expect(updateGlobals).toHaveBeenNthCalledWith(
      2,
      { globalType: 'theme-settings', themeColor: 'snmih-blue' },
      { $set: { themeColor: 'snmih' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      1,
      { 'version.themeColor': 'snmih-green' },
      { $set: { 'version.themeColor': 'default' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      2,
      { 'version.themeColor': 'snmih-blue' },
      { $set: { 'version.themeColor': 'snmih' } },
      { session },
    )
  })
})
```

- [ ] **Step 2: Run the migration test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-value-migration.int.spec.ts
```

Expected: FAIL because the migration module does not exist.

- [ ] **Step 3: Implement the session-aware migration**

Create `src/migrations/20260829_000000_rename_snmih_theme_values.ts`:

```ts
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

type MigrationArgs = Pick<MigrateUpArgs, 'payload' | 'session'>
type ThemeValueMapping = readonly [from: string, to: string]

const upMappings = [
  ['default', 'snmih-green'],
  ['snmih', 'snmih-blue'],
] as const satisfies readonly ThemeValueMapping[]

const downMappings = [
  ['snmih-green', 'default'],
  ['snmih-blue', 'snmih'],
] as const satisfies readonly ThemeValueMapping[]

async function migrateThemeValues(
  { payload, session }: MigrationArgs,
  mappings: readonly ThemeValueMapping[],
): Promise<void> {
  const versions = payload.db.versions['theme-settings']

  for (const [from, to] of mappings) {
    await Promise.all([
      payload.db.globals.updateMany(
        { globalType: 'theme-settings', themeColor: from },
        { $set: { themeColor: to } },
        { session },
      ),
      versions.updateMany(
        { 'version.themeColor': from },
        { $set: { 'version.themeColor': to } },
        { session },
      ),
    ])
  }
}

export async function up(args: MigrateUpArgs): Promise<void> {
  await migrateThemeValues(args, upMappings)
}

export async function down(args: MigrateDownArgs): Promise<void> {
  await migrateThemeValues(args, downMappings)
}
```

Create `src/migrations/index.ts` in Payload's generated format:

```ts
import * as migration_20260829_000000_rename_snmih_theme_values from './20260829_000000_rename_snmih_theme_values'

export const migrations = [
  {
    up: migration_20260829_000000_rename_snmih_theme_values.up,
    down: migration_20260829_000000_rename_snmih_theme_values.down,
    name: '20260829_000000_rename_snmih_theme_values',
  },
]
```

- [ ] **Step 4: Run the isolated migration contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-value-migration.int.spec.ts
git diff --check
```

Expected: both up/down tests PASS; no database connection is opened and no configured data changes.

- [ ] **Step 5: Review without executing the migration**

Run only read-only checks:

```bash
git diff -- src/migrations tests/int/theme-value-migration.int.spec.ts
```

Expected: exact-match mappings, current globals, version history, and `{ session }` are present. Do **not** run `pnpm payload migrate`, `migrate:down`, `migrate:refresh`, `migrate:reset`, or `migrate:fresh`.

---

### Task 3: Rename the stylesheets and refine SNMIH-Green tokens

**Files:**

- Modify: `tests/int/theme-settings.int.spec.ts`
- Modify: `tests/int/theme-contracts.int.spec.ts`
- Modify: `tests/int/section-eyebrow.int.spec.tsx`
- Modify: `tests/e2e/calendar.e2e.spec.ts`
- Create: `src/styles/themes/theme-snmih-green.css`
- Create: `src/styles/themes/theme-snmih-blue.css`
- Modify: `src/styles/globals.css`
- Modify: `src/styles/custom.css`
- Delete: `src/styles/themes/theme-default.css`
- Delete: `src/styles/themes/theme-snmih.css`

**Interfaces:**

- Produces: explicit root selectors for `snmih-green` and `snmih-blue`.
- Produces: SNMIH-Blue ownership of `:root:not([data-theme-color])` in both light and dark modes.
- Preserves: every existing SNMIH-Blue declaration value.
- Consumed by: all Tailwind semantic utilities, custom SNMIH-Blue presentation selectors, E2E fixtures, and theme contract tests.

- [ ] **Step 1: Update tests to describe the renamed presets and fallback owner**

In `tests/int/theme-contracts.int.spec.ts`:

```ts
const themes = ['snmih-green', 'snmih-blue'] as const
```

Change the isolation special case to:

```ts
if (theme === 'snmih-blue') {
  for (const item of selectors) {
    expect(item).toMatch(/data-theme-color='snmih-blue'|:root:not\(\[data-theme-color\]\)/)
  }
} else {
  for (const item of selectors) {
    expect(item).toContain(`data-theme-color='${theme}'`)
    expect(item).not.toContain(':root:not([data-theme-color])')
  }
}
```

Rename the SNMIH-Blue palette test input from `snmih` to `snmih-blue`, and add this SNMIH-Green contract:

```ts
it('uses the institutional green action palette and restrained radius', () => {
  const light = getModeTokens('snmih-green', 'light')
  const dark = getModeTokens('snmih-green', 'dark')

  expectOklchTokens(light, {
    primary: 'oklch(0.53 0.1415 147.76)',
    'primary-foreground': 'oklch(1 0 0)',
    secondary: 'oklch(0.96 0.025 148)',
    'secondary-foreground': 'oklch(0.245 0.055 150)',
    accent: 'oklch(0.925 0.05 148)',
    'accent-foreground': 'oklch(0.245 0.055 150)',
    ring: 'oklch(0.53 0.1415 147.76)',
  })
  expect(light.radius).toBe('0.75rem')

  expectOklchTokens(dark, {
    primary: 'oklch(0.6608 0.1598 139.63)',
    'primary-foreground': 'oklch(0.16 0.03 150)',
    secondary: 'oklch(0.274 0.025 150)',
    accent: 'oklch(0.31 0.045 148)',
    ring: 'oklch(0.8018 0.1024 148.89)',
  })
  expect(dark.radius).toBe('0.75rem')
})
```

Update `tests/int/theme-settings.int.spec.ts` to read/import the two explicit files, assert the Blue file owns the no-attribute fallback, and assert neither legacy file exists:

```ts
expect(globalsSource).toContain("@import './themes/theme-snmih-green.css';")
expect(globalsSource).toContain("@import './themes/theme-snmih-blue.css';")
expect(fs.existsSync(path.resolve(process.cwd(), 'src/styles/themes/theme-default.css'))).toBe(
  false,
)
expect(fs.existsSync(path.resolve(process.cwd(), 'src/styles/themes/theme-snmih.css'))).toBe(false)
expect(greenSource).toContain(":root[data-theme-color='snmih-green'] {")
expect(greenSource).not.toContain(':root:not([data-theme-color])')
expect(blueSource).toContain(":root[data-theme-color='snmih-blue'] {")
expect(blueSource).toContain(':root:not([data-theme-color])')
```

Replace each literal `data-theme-color='snmih'` expectation in `tests/int/section-eyebrow.int.spec.tsx` with `data-theme-color='snmih-blue'`. Change the E2E setup in `tests/e2e/calendar.e2e.spec.ts` to:

```ts
element.setAttribute('data-theme-color', 'snmih-blue')
```

- [ ] **Step 2: Run the focused contracts and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: FAIL because the renamed files/selectors do not exist and Green still owns the no-attribute fallback.

- [ ] **Step 3: Rename SNMIH-Blue without changing its palette**

Create `src/styles/themes/theme-snmih-blue.css` from the complete current contents of `src/styles/themes/theme-snmih.css`, then make only these selector/comment changes:

```diff
-/* SNMIH — palette mirrors the homepage prototype.
+/* SNMIH-Blue — palette mirrors the homepage prototype.
```

```diff
-:root[data-theme-color='snmih'] {
+:root:not([data-theme-color]),
+:root[data-theme-color='snmih-blue'] {
```

```diff
-:root[data-theme-color='snmih'].dark {
+:root:not([data-theme-color]).dark,
+:root[data-theme-color='snmih-blue'].dark {
```

Do not change any SNMIH-Blue declaration values, including `--radius: 0`.

- [ ] **Step 4: Create the explicit SNMIH-Green preset**

Create `src/styles/themes/theme-snmih-green.css` from the current `theme-default.css`. Remove the no-attribute selector from both mode blocks and use:

```css
:root[data-theme-color='snmih-green'] {
```

```css
:root[data-theme-color='snmih-green'].dark {
```

Apply this exact light-token diff while preserving unlisted declarations:

```diff
-  --primary: oklch(0.527 0.154 150.069);
-  --primary-foreground: oklch(0.982 0.018 155.826);
-  --secondary: oklch(0.967 0.001 286.375);
-  --secondary-foreground: oklch(0.21 0.006 285.885);
-  --muted: oklch(0.97 0 0);
-  --muted-foreground: oklch(0.52 0 0);
-  --accent: oklch(0.97 0 0);
-  --accent-foreground: oklch(0.205 0 0);
+  --primary: oklch(0.53 0.1415 147.76);
+  --primary-foreground: oklch(1 0 0);
+  --secondary: oklch(0.96 0.025 148);
+  --secondary-foreground: oklch(0.245 0.055 150);
+  --muted: oklch(0.97 0.008 148);
+  --muted-foreground: oklch(0.45 0.025 150);
+  --accent: oklch(0.925 0.05 148);
+  --accent-foreground: oklch(0.245 0.055 150);
```

```diff
-  --border: oklch(0.922 0 0);
-  --input: oklch(0.922 0 0);
-  --ring: oklch(0.708 0 0);
-  --chart-1: oklch(0.87 0 0);
-  --chart-2: oklch(0.556 0 0);
-  --chart-3: oklch(0.439 0 0);
-  --chart-4: oklch(0.371 0 0);
-  --chart-5: oklch(0.269 0 0);
-  --radius: 0.875rem;
+  --border: oklch(0.9 0.02 148);
+  --input: oklch(0.9 0.02 148);
+  --ring: oklch(0.53 0.1415 147.76);
+  --chart-1: oklch(0.53 0.1415 147.76);
+  --chart-2: oklch(0.62 0.1 145);
+  --chart-3: oklch(0.74 0.08 148);
+  --chart-4: oklch(0.88 0.045 148);
+  --chart-5: oklch(0.32 0.08 150);
+  --radius: 0.75rem;
```

```diff
-  --sidebar-primary: oklch(0.627 0.194 149.214);
-  --sidebar-primary-foreground: oklch(0.982 0.018 155.826);
-  --sidebar-accent: oklch(0.97 0 0);
-  --sidebar-accent-foreground: oklch(0.205 0 0);
-  --sidebar-border: oklch(0.922 0 0);
-  --sidebar-ring: oklch(0.708 0 0);
+  --sidebar-primary: oklch(0.53 0.1415 147.76);
+  --sidebar-primary-foreground: oklch(1 0 0);
+  --sidebar-accent: oklch(0.96 0.025 148);
+  --sidebar-accent-foreground: oklch(0.245 0.055 150);
+  --sidebar-border: oklch(0.9 0.02 148);
+  --sidebar-ring: oklch(0.53 0.1415 147.76);
```

Apply this exact dark-token diff while preserving unlisted declarations:

```diff
-  --primary: oklch(0.72 0.16 150);
-  --primary-foreground: oklch(0.145 0 0);
-  --secondary: oklch(0.274 0.006 286.033);
+  --primary: oklch(0.6608 0.1598 139.63);
+  --primary-foreground: oklch(0.16 0.03 150);
+  --secondary: oklch(0.274 0.025 150);
```

```diff
-  --muted: oklch(0.269 0 0);
-  --muted-foreground: oklch(0.708 0 0);
-  --accent: oklch(0.269 0 0);
+  --muted: oklch(0.245 0.015 150);
+  --muted-foreground: oklch(0.75 0.025 148);
+  --accent: oklch(0.31 0.045 148);
```

```diff
-  --ring: oklch(0.556 0 0);
-  --chart-1: oklch(0.87 0 0);
-  --chart-2: oklch(0.556 0 0);
-  --chart-3: oklch(0.439 0 0);
-  --chart-4: oklch(0.371 0 0);
-  --chart-5: oklch(0.269 0 0);
+  --ring: oklch(0.8018 0.1024 148.89);
+  --chart-1: oklch(0.6608 0.1598 139.63);
+  --chart-2: oklch(0.58 0.11 145);
+  --chart-3: oklch(0.76 0.09 148);
+  --chart-4: oklch(0.36 0.065 150);
+  --chart-5: oklch(0.84 0.06 148);
+  --radius: 0.75rem;
```

The current dark block does not declare `--radius`; add the new declaration once after the chart tokens.

```diff
-  --sidebar-primary: oklch(0.723 0.219 149.579);
-  --sidebar-primary-foreground: oklch(0.982 0.018 155.826);
-  --sidebar-accent: oklch(0.269 0 0);
+  --sidebar-primary: oklch(0.6608 0.1598 139.63);
+  --sidebar-primary-foreground: oklch(0.16 0.03 150);
+  --sidebar-accent: oklch(0.31 0.045 148);
```

```diff
-  --sidebar-border: oklch(1 0 0 / 10%);
-  --sidebar-ring: oklch(0.556 0 0);
+  --sidebar-border: oklch(1 0 0 / 12%);
+  --sidebar-ring: oklch(0.8018 0.1024 148.89);
```

- [ ] **Step 5: Switch global imports and SNMIH-Blue-specific selectors**

Replace the imports in `src/styles/globals.css`:

```css
@import './themes/theme-snmih-green.css';
@import './themes/theme-snmih-blue.css';
```

In `src/styles/custom.css`, replace every selector occurrence of:

```css
[data-theme-color='snmih']
```

with:

```css
[data-theme-color='snmih-blue']
```

Do not move those custom presentation rules to SNMIH-Green; they are incumbent SNMIH-Blue brand treatments.

Delete `src/styles/themes/theme-default.css` and `src/styles/themes/theme-snmih.css` only after both replacement files are complete.

- [ ] **Step 6: Run theme, contrast, eyebrow, and E2E source contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
pnpm exec playwright test tests/e2e/calendar.e2e.spec.ts --config=playwright.config.ts
git diff --check
```

Expected: all focused contracts PASS. If Playwright cannot start the local app in the sandbox, record that environment failure and complete browser validation in Task 6; do not weaken assertions.

- [ ] **Step 7: Prove the Blue palette was not altered**

Run:

```bash
git diff --find-renames=90% -- src/styles/themes/theme-snmih.css src/styles/themes/theme-snmih-blue.css
```

Expected: Git presents the Blue stylesheet as a rename, and its diff contains only the approved comment and selector changes. There must be no declaration-value changes in SNMIH-Blue.

Do not stage or commit.

---

### Task 4: Make the generic Tabs primitive use semantic active colors

**Files:**

- Modify: `tests/int/theme-contracts.int.spec.ts`
- Modify: `src/components/ui/tabs.tsx`

**Interfaces:**

- Produces: framed active tabs use `bg-primary text-primary-foreground`.
- Produces: line active tabs use `text-primary` with the existing primary underline.
- Preserves: Calendar brand-surface overrides, focus rings, vertical orientation, disabled state, dimensions, and overflow behavior.

- [ ] **Step 1: Add a failing shared Tabs contract**

Extend the semantic component contract in `tests/int/theme-contracts.int.spec.ts`:

```ts
const uiTabsSource = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/ui/tabs.tsx'),
  'utf8',
)
const richTextSource = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/rich-text/richTextStyles.ts'),
  'utf8',
)

expect(uiTabsSource).toContain(
  'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
)
expect(uiTabsSource).toContain(
  'group-data-[variant=line]/tabs-list:data-[state=active]:text-primary',
)
expect(uiTabsSource).toContain(
  'group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
)
expect(richTextSource).toContain('prose-a:text-primary')
```

- [ ] **Step 2: Run the contract and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts
```

Expected: FAIL because the generic framed active tab still uses neutral background/foreground.

- [ ] **Step 3: Update the shared trigger state classes**

In `src/components/ui/tabs.tsx`, replace the neutral active state inside `TabsTrigger`:

```diff
-data-[state=active]:bg-background data-[state=active]:text-foreground
+data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
```

Replace the line-variant override string with:

```ts
'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:text-primary'
```

Keep the existing `after:bg-primary`, focus-visible, disabled, orientation, height, padding, border, and radius classes unchanged. Calendar passes its surface-aware active classes after the primitive classes, so `cn`/Tailwind merge continues to preserve the brand-surface inversion.

- [ ] **Step 4: Run shared tabs and Calendar regression contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/tabs-content-active-color.int.spec.ts tests/int/calendar-ui-contracts.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx
git diff --check
```

Expected: all tests PASS; no overflow or scrollbar classes change.

- [ ] **Step 5: Inspect the primitive-only diff**

Run:

```bash
git diff -- src/components/ui/tabs.tsx tests/int/theme-contracts.int.spec.ts
```

Expected: only semantic active colors and their test contract changed. Do not stage or commit.

---

### Task 5: Regenerate Payload types and update maintained documentation

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `docs/guides/theme-settings.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Produces: generated `themeColor: 'snmih-green' | 'snmih-blue'`.
- Documents: SNMIH-Blue default, explicit stored identifiers, and legacy migration behavior.
- Preserves: historical superpowers plans/specs.

- [ ] **Step 1: Generate Payload types from the new field options**

Run:

```bash
pnpm generate:types
```

Expected generated contract:

```ts
themeColor: 'snmih-green' | 'snmih-blue'
```

Verify:

```bash
rg -n "themeColor: 'snmih-green' \| 'snmih-blue'" src/payload-types.ts
```

- [ ] **Step 2: Update the maintained editor guide**

In `docs/guides/theme-settings.md`, replace the palette description with:

```markdown
- `SNMIH-Blue` is the default and fallback institutional palette.
- `SNMIH-Green` is the alternate institutional palette with green actions and restrained rounded controls.
```

Add this deployment note:

```markdown
Existing deployments using the former `default` or `snmih` values must run the checked-in theme-value migration during their normal release process. The frontend accepts those legacy values until migration, so the existing visual selection remains stable during rollout.
```

- [ ] **Step 3: Update maintained project architecture**

Change the theme sentence in `.agents/skills/project-context/references/architecture.md` to:

```markdown
Two theme presets are registered: SNMIH-Green (`snmih-green`) and SNMIH-Blue (`snmih-blue`). SNMIH-Blue is the default and runtime fallback; legacy `default` and `snmih` values are normalized until the reversible Payload migration runs. Theme files live under [src/styles/themes](../../../../src/styles/themes). Block sections use semantic page/subtle/brand surfaces; card surfaces use Default, Primary, Secondary, Muted, and Accent. Renderers resolve foreground, supporting text, icon, divider, link, and button contrast from those semantics.
```

- [ ] **Step 4: Run the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: inventory records the new stylesheet and migration files, removes the deleted stylesheet paths, and the check passes.

- [ ] **Step 5: Verify maintained references contain no stale runtime names**

Run:

```bash
rg -n 'theme-default\.css|theme-snmih\.css|SNMIH-Green \(`default`\)|SNMIH-Blue \(`snmih`\)' src tests docs/guides docs/architecture .agents/skills/project-context/references
```

Expected: no matches outside the migration's deliberate legacy mappings and generated/historical inventory metadata that the update script legitimately retains. Do not rewrite historical files under `docs/superpowers/`.

---

### Task 6: Complete static, build, and live visual verification

**Files:**

- Verify all files changed by Tasks 1–5.
- Do not modify the migration based on live database contents.

**Interfaces:**

- Confirms: token contrast, semantic components, Payload types, migration isolation, runtime aliases, responsive presentation, and project knowledge.

- [ ] **Step 1: Format only the touched source, tests, docs, and migration files**

Run:

```bash
pnpm exec prettier --write src/lib/themes/websiteThemes.ts 'src/app/(frontend)/layout.tsx' src/migrations/20260829_000000_rename_snmih_theme_values.ts src/migrations/index.ts src/styles/globals.css src/styles/custom.css src/styles/themes/theme-snmih-green.css src/styles/themes/theme-snmih-blue.css src/components/ui/tabs.tsx tests/int/theme-settings.int.spec.ts tests/int/theme-value-migration.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/section-eyebrow.int.spec.tsx tests/e2e/calendar.e2e.spec.ts docs/guides/theme-settings.md .agents/skills/project-context/references/architecture.md
git diff --check
```

Expected: no whitespace errors and no unrelated files reformatted.

- [ ] **Step 2: Run all focused integration contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts tests/int/theme-value-migration.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/section-eyebrow.int.spec.tsx tests/int/tabs-content-active-color.int.spec.ts tests/int/calendar-ui-contracts.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 3: Run the full static verification suite**

Run:

```bash
pnpm test:int
pnpm lint
pnpm build
pnpm project-context:check
```

Expected: all commands PASS. If an integration test cannot start `mongodb-memory-server` because the sandbox blocks a local port, rerun that test with the required permission and report the environment condition; do not alter production code to accommodate the sandbox.

- [ ] **Step 4: Audit exact legacy references**

Run:

```bash
rg -n "data-theme-color=['\"](?:default|snmih)['\"]|themeColor: 'default'|themeColor: 'snmih'|theme-default\.css|theme-snmih\.css" src tests docs/guides docs/architecture .agents/skills/project-context/references
```

Expected: legacy theme values appear only in the compatibility normalizer, reversible migration, and migration tests. Legacy filenames have no maintained runtime references.

- [ ] **Step 5: Validate representative UI in the browser without saving settings**

Start the app:

```bash
pnpm dev
```

Using the in-app browser, inspect a representative content page plus Calendar/Department Profiles in:

1. `data-theme-color="snmih-green"`, light mode, desktop.
2. `data-theme-color="snmih-green"`, dark mode, desktop.
3. `data-theme-color="snmih-green"`, light and dark mobile widths.
4. `data-theme-color="snmih-blue"`, light and dark desktop.
5. No `data-theme-color` attribute, which must visually match SNMIH-Blue.

Change the root attribute only in the temporary browser DOM; do not save the global or run the migration. Confirm:

- Primary/default, outline, link, secondary, ghost, destructive, white, and white-outline buttons.
- Rich-text links, ContentLink, card links, breadcrumbs, and footer actions.
- Framed, underline, centered, stretched, overflowing, and Calendar brand-surface tabs.
- Input, select, checkbox, radio, focus-visible, disabled, and invalid states.
- Cards, joined controls, table rows, timeline connectors, nested panels, and media overlays.
- Green theme control radii are approximately 9px and panels approximately 12px; pills remain pills and structural square edges remain square.
- SNMIH-Blue retains its incumbent square geometry and blue palette.
- No horizontal page overflow, visible tab scrollbar, clipped focus ring, double-rounded seam, or unreadable green-on-green state.

- [ ] **Step 6: Final review and handoff**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only approved implementation, generated types, maintained docs, and regenerated project context are changed. Report the migration filename and explicitly state that it was **not executed**. Do not stage or commit.
