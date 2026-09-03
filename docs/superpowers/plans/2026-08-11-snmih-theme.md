# SNMIH Website Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the owner-provided SNMIH CSS token file an isolated, selectable Payload website theme.

**Architecture:** Keep `src/styles/themes/theme-snmih.css` as the token source and scope its two existing blocks to the root `data-theme-color="snmih"` convention. Register the value once in the shared theme registry so both Payload and frontend validation consume it, import the stylesheet globally, and keep checked-in generated types synchronized.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, Tailwind CSS 4, shadcn semantic CSS variables, Vitest, TypeScript

## Global Constraints

- Preserve every owner-provided SNMIH token value exactly.
- Preserve `--radius: 0` exactly.
- Do not modify Default, Sunset, Blue, or Kodama theme values.
- Do not add component-specific style overrides.
- Do not make SNMIH the default theme.
- Do not stage or commit files.

---

### Task 1: Define the SNMIH integration contract

**Files:**

- Modify: `tests/int/theme-settings.int.spec.ts`
- Test: `tests/int/theme-settings.int.spec.ts`

**Interfaces:**

- Consumes: `websiteThemeValues`, `websiteThemeOptions`, `isWebsiteTheme`, `src/styles/globals.css`, and `src/styles/themes/theme-snmih.css`
- Produces: a failing test contract for the `SNMIH` registry option and isolated stylesheet wiring

- [ ] **Step 1: Extend the registry expectations**

Change the expected values and options to include SNMIH after Kodama, and assert runtime validation:

```ts
expect(websiteThemeValues).toEqual(['default', 'sunset', 'blue', 'kodama', 'snmih'])
expect(websiteThemeOptions).toEqual([
  { label: 'Default', value: 'default' },
  { label: 'Sunset', value: 'sunset' },
  { label: 'Blue', value: 'blue' },
  { label: 'Kodama', value: 'kodama' },
  { label: 'SNMIH', value: 'snmih' },
])
expect(isWebsiteTheme('snmih')).toBe(true)
```

- [ ] **Step 2: Add the stylesheet contract test**

Add this test inside `describe('website theme registry', ...)`:

```ts
it('loads the isolated SNMIH token preset', () => {
  const globalsSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/styles/globals.css'),
    'utf8',
  )
  const themeSource = fs.readFileSync(
    path.resolve(process.cwd(), 'src/styles/themes/theme-snmih.css'),
    'utf8',
  )

  expect(globalsSource).toContain("@import './themes/theme-snmih.css';")
  expect(themeSource).toContain(":root[data-theme-color='snmih'] {")
  expect(themeSource).toContain(":root[data-theme-color='snmih'].dark {")
  expect(themeSource).not.toMatch(/^:root\s*\{/m)
  expect(themeSource).not.toMatch(/^\.dark\s*\{/m)
  expect(themeSource).toContain('--primary: oklch(0.488 0.243 264.376);')
  expect(themeSource).toContain('--primary: oklch(0.424 0.199 265.638);')
  expect(themeSource).toContain('--radius: 0;')
})
```

- [ ] **Step 3: Run the focused test and verify the contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts
```

Expected: FAIL because `snmih` is not registered, the global import is missing, and the existing owner-provided selectors are unscoped.

### Task 2: Wire the owner-provided stylesheet into the theme system

**Files:**

- Modify: `src/styles/themes/theme-snmih.css:1`
- Modify: `src/styles/themes/theme-snmih.css:35`
- Modify: `src/styles/globals.css:14`
- Modify: `src/lib/themes/websiteThemes.ts:22`
- Test: `tests/int/theme-settings.int.spec.ts`

**Interfaces:**

- Consumes: the failing contract from Task 1 and the existing owner-provided SNMIH declarations
- Produces: registry value `snmih`, admin label `SNMIH`, and root-scoped light/dark CSS variables

- [ ] **Step 1: Scope the existing light selector without changing declarations**

Replace only the first selector:

```css
:root[data-theme-color='snmih'] {
```

- [ ] **Step 2: Scope the existing dark selector without changing declarations**

Replace only the dark selector:

```css
:root[data-theme-color='snmih'].dark {
```

- [ ] **Step 3: Import the SNMIH preset**

Add the import after the existing Kodama theme import in `src/styles/globals.css`:

```css
@import './themes/theme-snmih.css';
```

- [ ] **Step 4: Register the selectable theme**

Append this entry after Kodama in `websiteThemes`:

```ts
{ label: 'SNMIH', value: 'snmih' },
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts
```

Expected: PASS with all theme registry and stylesheet assertions satisfied.

### Task 3: Synchronize Payload types and verify the change

**Files:**

- Modify: `src/payload-types.ts:5937` (generated)
- Verify: `src/styles/themes/theme-snmih.css`
- Verify: `src/lib/themes/websiteThemes.ts`
- Verify: `src/styles/globals.css`
- Verify: `tests/int/theme-settings.int.spec.ts`

**Interfaces:**

- Consumes: registered `snmih` option in `ThemeSettings` through `websiteThemeOptions`
- Produces: generated `ThemeSetting.themeColor` union containing `'snmih'`

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: `src/payload-types.ts` contains:

```ts
themeColor: 'default' | 'sunset' | 'blue' | 'kodama' | 'snmih'
```

- [ ] **Step 2: Format only the changed source, test, and documentation files**

Run:

```bash
pnpm exec prettier --write src/styles/themes/theme-snmih.css src/styles/globals.css src/lib/themes/websiteThemes.ts tests/int/theme-settings.int.spec.ts docs/superpowers/specs/2026-08-11-snmih-theme-design.md docs/superpowers/plans/2026-08-11-snmih-theme.md
```

Expected: Prettier exits successfully without altering the supplied token values.

- [ ] **Step 3: Run focused tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-settings.int.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run lint on the changed TypeScript files**

Run:

```bash
pnpm exec eslint src/lib/themes/websiteThemes.ts tests/int/theme-settings.int.spec.ts
```

Expected: no lint errors.

- [ ] **Step 5: Run the production build**

Run:

```bash
pnpm run build
```

Expected: the Next.js production build completes successfully. If an environment-dependent service prevents completion, preserve the exact failure output and report it separately from source-code validation.

- [ ] **Step 6: Review the final diff without staging or committing**

Run:

```bash
git diff --check
git status --short
git diff -- src/styles/themes/theme-snmih.css src/styles/globals.css src/lib/themes/websiteThemes.ts src/payload-types.ts tests/int/theme-settings.int.spec.ts
```

Expected: no whitespace errors; only the owner-provided stylesheet, theme integration, generated type, focused test, design spec, and implementation plan are changed or untracked.
