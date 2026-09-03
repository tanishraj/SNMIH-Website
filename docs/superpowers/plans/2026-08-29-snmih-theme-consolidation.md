# SNMIH Theme Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the public theme system to SNMIH-Green and SNMIH-Blue without changing their persisted identifiers or migrating content.

**Architecture:** Keep the shared theme registry as the single source of truth for Payload options, generated types, and runtime validation. Retain `default` and `snmih`, remove the other registry entries and stylesheets, and let the existing registry guard normalize every retired value to `default`.

**Tech Stack:** Payload CMS 3, Next.js, TypeScript, Tailwind CSS, Vitest, generated Payload types

## Global Constraints

- Preserve stored value `default` and label it `SNMIH-Green`.
- Preserve stored value `snmih` and label it `SNMIH-Blue`.
- Do not add a database migration or automatic data rewrite.
- Do not change the retained palettes' CSS token values.
- Keep the existing System, Light, and Dark color-scheme behavior.
- Do not stage or commit any changes.

---

## File Structure

- `src/lib/themes/websiteThemes.ts`: owns the two supported theme identifiers, labels, options, type guard, and default.
- `src/styles/globals.css`: globally imports only retained theme token files.
- `src/styles/themes/theme-default.css`: retained SNMIH-Green token source; token content unchanged.
- `src/styles/themes/theme-snmih.css`: retained SNMIH-Blue token source; token content unchanged.
- `src/styles/themes/theme-sunset.css`: delete retired preset.
- `src/styles/themes/theme-blue.css`: delete retired preset.
- `src/styles/themes/theme-kodama.css`: delete retired preset.
- `src/app/(frontend)/layout.tsx`: validates the saved key directly and falls back to `default`.
- `src/payload-types.ts`: generated two-value `ThemeSetting.themeColor` union.
- `tests/int/theme-settings.int.spec.ts`: verifies registry labels, CSS loading, retired-value rejection, Payload options, and runtime fallback wiring.
- `tests/int/theme-contracts.int.spec.ts`: runs semantic token and contrast contracts against only the retained themes.
- `docs/guides/theme-settings.md`: editor-facing two-theme guidance.
- `docs/architecture/feature-inventory.md`: maintained feature inventory for the Appearance global.
- `.agents/skills/project-context/references/architecture.md`: maintained project-context theme architecture.
- `.agents/skills/project-context/references/project-inventory.json`: generated structural inventory refreshed after stylesheet deletion.

### Task 1: Lock the two-theme registry and asset contract

**Files:**

- Modify: `tests/int/theme-settings.int.spec.ts`
- Modify: `tests/int/theme-contracts.int.spec.ts`
- Modify: `src/lib/themes/websiteThemes.ts`
- Modify: `src/styles/globals.css`
- Delete: `src/styles/themes/theme-sunset.css`
- Delete: `src/styles/themes/theme-blue.css`
- Delete: `src/styles/themes/theme-kodama.css`

**Interfaces:**

- Consumes: existing `websiteThemes`, `websiteThemeValues`, `websiteThemeOptions`, `defaultWebsiteTheme`, and `isWebsiteTheme(value: string)` exports.
- Produces: `WebsiteThemeValue = 'default' | 'snmih'`, with Admin labels `SNMIH-Green` and `SNMIH-Blue`.

- [ ] **Step 1: Update the registry test to express the new contract**

Replace the first test in `tests/int/theme-settings.int.spec.ts` with:

```ts
it('exports only the two approved SNMIH themes and helpers', () => {
  expect(defaultWebsiteTheme).toBe('default')
  expect(websiteThemeValues).toEqual(['default', 'snmih'])
  expect(websiteThemeOptions).toEqual([
    { label: 'SNMIH-Green', value: 'default' },
    { label: 'SNMIH-Blue', value: 'snmih' },
  ])
  expect(isWebsiteTheme('default')).toBe(true)
  expect(isWebsiteTheme('snmih')).toBe(true)
  expect(isWebsiteTheme('sunset')).toBe(false)
  expect(isWebsiteTheme('blue')).toBe(false)
  expect(isWebsiteTheme('kodama')).toBe(false)
  expect(isWebsiteTheme('amber')).toBe(false)
})
```

Extend the CSS-loading test so it reads `globals.css` and asserts:

```ts
expect(globalsSource).toContain("@import './themes/theme-default.css';")
expect(globalsSource).toContain("@import './themes/theme-snmih.css';")
for (const retiredTheme of ['sunset', 'blue', 'kodama']) {
  expect(globalsSource).not.toContain(`@import './themes/theme-${retiredTheme}.css';`)
  expect(
    fs.existsSync(path.resolve(process.cwd(), `src/styles/themes/theme-${retiredTheme}.css`)),
  ).toBe(false)
}
```

- [ ] **Step 2: Limit the shared theme-contract matrix to retained keys**

In `tests/int/theme-contracts.int.spec.ts`, replace:

```ts
const themes = ['default', 'sunset', 'blue', 'kodama', 'snmih'] as const
```

with:

```ts
const themes = ['default', 'snmih'] as const
```

Rename the palette-specific test to make the new label explicit while preserving all token assertions:

```ts
it('uses the approved SNMIH-Blue brand palette in both modes', () => {
```

- [ ] **Step 3: Run focused tests and confirm the old implementation fails**

Run:

```bash
pnpm exec vitest run tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts
```

Expected: FAIL because the registry still exposes five themes, retired stylesheets are still imported and present, and the Admin labels are still `Default` and `SNMIH`.

- [ ] **Step 4: Reduce the shared registry to the stable two-value contract**

Replace the registry array in `src/lib/themes/websiteThemes.ts` with:

```ts
export const websiteThemes = [
  { label: 'SNMIH-Green', value: 'default' },
  { label: 'SNMIH-Blue', value: 'snmih' },
] as const
```

Keep `defaultWebsiteTheme`, `websiteThemeValues`, `websiteThemeOptions`, and `isWebsiteTheme` unchanged so Payload and the frontend continue consuming one registry.

- [ ] **Step 5: Remove retired CSS from the global bundle**

Keep only these theme imports in `src/styles/globals.css`:

```css
@import './themes/theme-default.css';
@import './themes/theme-snmih.css';
```

Delete:

```text
src/styles/themes/theme-sunset.css
src/styles/themes/theme-blue.css
src/styles/themes/theme-kodama.css
```

Do not modify `theme-default.css` or `theme-snmih.css`.

- [ ] **Step 6: Run the focused theme tests**

Run:

```bash
pnpm exec vitest run tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts
```

Expected: PASS. Both retained palettes pass isolation, light/dark semantic contrast, Calendar accent, overlay foreground, and registry assertions.

### Task 2: Simplify fallback behavior and synchronize Payload types

**Files:**

- Modify: `tests/int/theme-settings.int.spec.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/payload-types.ts` (generated)

**Interfaces:**

- Consumes: `defaultWebsiteTheme: 'default'` and `isWebsiteTheme(value: string): value is 'default' | 'snmih'` from Task 1.
- Produces: direct invalid-value fallback and generated `ThemeSetting.themeColor: 'default' | 'snmih'`.

- [ ] **Step 1: Update the layout wiring assertion**

In `tests/int/theme-settings.int.spec.ts`, replace the runtime assertion with:

```ts
expect(layoutSource).toContain(
  'const themeColor = isWebsiteTheme(rawThemeColor) ? rawThemeColor : defaultWebsiteTheme',
)
expect(layoutSource).not.toContain("rawThemeColor === 'amber'")
expect(layoutSource).not.toContain("'sera'")
```

- [ ] **Step 2: Run the layout contract and confirm it fails**

Run:

```bash
pnpm exec vitest run tests/int/theme-settings.int.spec.ts
```

Expected: FAIL because the frontend layout still declares `savedThemeColor` and the obsolete `amber` to `sera` conversion.

- [ ] **Step 3: Remove obsolete compatibility conversion**

In `src/app/(frontend)/layout.tsx`, replace the theme resolution with:

```ts
const colorScheme = themeSettings.colorScheme ?? 'system'
const rawThemeColor = String(themeSettings.themeColor ?? defaultWebsiteTheme)
const themeColor = isWebsiteTheme(rawThemeColor) ? rawThemeColor : defaultWebsiteTheme
```

This makes `sunset`, `blue`, `kodama`, `amber`, `sera`, and any unknown key resolve to SNMIH-Green without writing to the database.

- [ ] **Step 4: Regenerate checked-in Payload types**

Run:

```bash
pnpm generate:types
```

Expected: success, and `src/payload-types.ts` contains:

```ts
themeColor: 'default' | 'snmih'
```

- [ ] **Step 5: Verify focused runtime and schema contracts**

Run:

```bash
pnpm exec vitest run tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/lib/themes/websiteThemes.ts 'src/app/(frontend)/layout.tsx' tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts
```

Expected: all commands PASS with no TypeScript or lint errors.

### Task 3: Refresh maintained documentation and repository knowledge

**Files:**

- Modify: `docs/guides/theme-settings.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` (generated)

**Interfaces:**

- Consumes: the final two-theme registry and retained file structure from Tasks 1 and 2.
- Produces: editor and maintainer documentation that describes only SNMIH-Green and SNMIH-Blue.

- [ ] **Step 1: Update editor-facing Appearance guidance**

In `docs/guides/theme-settings.md`, describe `Appearance` as offering `SNMIH-Green` and `SNMIH-Blue`. Preserve the existing System/Light/Dark instructions and add this decision aid:

```markdown
- `SNMIH-Green` is the default and fallback institutional palette.
- `SNMIH-Blue` uses the alternate blue institutional palette.
```

- [ ] **Step 2: Update maintained architecture summaries**

Change the Appearance row in `docs/architecture/feature-inventory.md` to:

```markdown
| Settings | Appearance | SNMIH-Green/SNMIH-Blue theme and system/light/dark color scheme |
```

Replace the theme count sentence in `.agents/skills/project-context/references/architecture.md` with:

```markdown
Two theme presets are registered: SNMIH-Green (`default`) and SNMIH-Blue (`snmih`). Theme files live under [src/styles/themes](../../../../src/styles/themes). Block sections use semantic page/subtle/brand surfaces; card surfaces use Default, Primary, Secondary, Muted, and Accent. Renderers resolve foreground, supporting text, icon, divider, link, and button contrast from those semantics.
```

- [ ] **Step 3: Format all changed source, tests, and maintained docs**

Run:

```bash
pnpm exec prettier --write src/lib/themes/websiteThemes.ts src/styles/globals.css 'src/app/(frontend)/layout.tsx' src/payload-types.ts tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts docs/guides/theme-settings.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-29-snmih-theme-consolidation-design.md docs/superpowers/plans/2026-08-29-snmih-theme-consolidation.md
```

Expected: command succeeds and subsequent `pnpm exec prettier --check` reports all listed files formatted.

- [ ] **Step 4: Refresh generated project context**

Run:

```bash
pnpm project-context:update
```

Expected: `.agents/skills/project-context/references/project-inventory.json` reflects only `theme-default.css` and `theme-snmih.css`. Review the generated diff and preserve the manually updated two-theme architecture narrative.

- [ ] **Step 5: Run final verification**

Run:

```bash
pnpm exec prettier --check src/lib/themes/websiteThemes.ts src/styles/globals.css 'src/app/(frontend)/layout.tsx' src/payload-types.ts tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts docs/guides/theme-settings.md docs/architecture/feature-inventory.md docs/superpowers/specs/2026-08-29-snmih-theme-consolidation-design.md docs/superpowers/plans/2026-08-29-snmih-theme-consolidation.md
pnpm exec vitest run tests/int/theme-settings.int.spec.ts tests/int/theme-contracts.int.spec.ts
pnpm exec tsc --noEmit
pnpm project-context:check
git diff --check
git status --short
```

Expected: formatting, focused tests, TypeScript, project-context validation, and whitespace checks PASS. `git status --short` lists only the intended unstaged theme, generated type, test, documentation, specification, plan, and project-context changes; no commit is created.
