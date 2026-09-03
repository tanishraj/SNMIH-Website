# Website Theme Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize website theme definitions so Payload Theme Settings and the frontend layout use the same registry when selecting and applying the active public-site theme.

**Architecture:** Add a small typed theme-registry module under `src/lib/themes/` and make both the Payload global schema and the frontend root layout import from it. Verify the refactor with a focused integration test that checks the registry exports, the Theme Settings options, and the layout wiring contract.

**Tech Stack:** Payload CMS 3, Next.js App Router, TypeScript, Vitest

## Global Constraints

- Scope is website only, not Payload admin theming.
- Theme selection remains in the existing Payload `theme-settings` global.
- Use an explicit code registry, not filesystem auto-discovery.
- Keep the current CSS-variable theme model.
- Make future shadcn-based themes pluggable through one registry entry plus one CSS file.

---

### Task 1: Add the shared website theme registry

**Files:**
- Create: `src/lib/themes/websiteThemes.ts`
- Create: `tests/int/theme-settings.int.spec.ts`

**Interfaces:**
- Consumes: existing persisted theme keys `default | blue | sera`
- Produces:
  - `websiteThemes: readonly { label: string; value: WebsiteThemeValue }[]`
  - `websiteThemeOptions: { label: string; value: WebsiteThemeValue }[]`
  - `websiteThemeValues: readonly WebsiteThemeValue[]`
  - `defaultWebsiteTheme: WebsiteThemeValue`
  - `isWebsiteTheme(value: string): value is WebsiteThemeValue`

- [ ] **Step 1: Write the failing test**

Add `tests/int/theme-settings.int.spec.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ThemeSettings } from '@/globals/ThemeSettings'
import {
  defaultWebsiteTheme,
  isWebsiteTheme,
  websiteThemeOptions,
  websiteThemeValues,
} from '@/lib/themes/websiteThemes'

type ThemeField = {
  defaultValue?: unknown
  name: string
  options?: Array<{ label: string; value: string }>
}

const getThemeField = () => {
  const field = ThemeSettings.fields.find(
    (candidate): candidate is ThemeField =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'name' in candidate &&
      candidate.name === 'themeColor',
  )

  if (!field) {
    throw new Error('Expected themeColor field to exist.')
  }

  return field
}

describe('website theme registry', () => {
  it('exports the supported website themes and helpers', () => {
    expect(defaultWebsiteTheme).toBe('default')
    expect(websiteThemeValues).toEqual(['default', 'blue', 'sera'])
    expect(websiteThemeOptions).toEqual([
      { label: 'Default', value: 'default' },
      { label: 'Blue', value: 'blue' },
      { label: 'Sera', value: 'sera' },
    ])
    expect(isWebsiteTheme('default')).toBe(true)
    expect(isWebsiteTheme('blue')).toBe(true)
    expect(isWebsiteTheme('sera')).toBe(true)
    expect(isWebsiteTheme('amber')).toBe(false)
  })

  it('drives the Theme Settings select field from the shared registry', () => {
    const themeField = getThemeField()

    expect(themeField.defaultValue).toBe(defaultWebsiteTheme)
    expect(themeField.options).toEqual(websiteThemeOptions)
  })

  it('wires the frontend layout to the shared registry', () => {
    const layoutSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'), 'utf8')

    expect(layoutSource).toContain("from '@/lib/themes/websiteThemes'")
    expect(layoutSource).toContain('defaultWebsiteTheme')
    expect(layoutSource).toContain('isWebsiteTheme')
    expect(layoutSource).not.toContain("const validThemeColors = new Set(['default', 'blue', 'sera'])")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm run test:int -- tests/int/theme-settings.int.spec.ts
```

Expected:

```text
FAIL  tests/int/theme-settings.int.spec.ts
Cannot find module '@/lib/themes/websiteThemes'
```

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/themes/websiteThemes.ts`:

```ts
export const websiteThemes = [
  { label: 'Default', value: 'default' },
  { label: 'Blue', value: 'blue' },
  { label: 'Sera', value: 'sera' },
] as const

export type WebsiteThemeValue = (typeof websiteThemes)[number]['value']

export const defaultWebsiteTheme: WebsiteThemeValue = 'default'

export const websiteThemeValues = websiteThemes.map(({ value }) => value) as readonly WebsiteThemeValue[]

export const websiteThemeOptions = websiteThemes.map(({ label, value }) => ({
  label,
  value,
}))

export function isWebsiteTheme(value: string): value is WebsiteThemeValue {
  return websiteThemeValues.includes(value as WebsiteThemeValue)
}
```

- [ ] **Step 4: Run test to verify partial progress**

Run:

```bash
pnpm run test:int -- tests/int/theme-settings.int.spec.ts
```

Expected:

```text
FAIL  tests/int/theme-settings.int.spec.ts
Expected theme field options to equal websiteThemeOptions
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/themes/websiteThemes.ts tests/int/theme-settings.int.spec.ts
git commit -m "feat: add website theme registry"
```

### Task 2: Wire Payload Theme Settings and frontend layout to the registry

**Files:**
- Modify: `src/globals/ThemeSettings.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Test: `tests/int/theme-settings.int.spec.ts`

**Interfaces:**
- Consumes:
  - `websiteThemeOptions`
  - `defaultWebsiteTheme`
  - `isWebsiteTheme(value: string): value is WebsiteThemeValue`
- Produces:
  - Theme Settings schema backed by the shared registry
  - Frontend layout runtime validation backed by the shared registry

- [ ] **Step 1: Extend the failing test to cover runtime fallback**

Update `tests/int/theme-settings.int.spec.ts` by replacing the layout wiring test with:

```ts
  it('wires the frontend layout to the shared registry and default fallback', () => {
    const layoutSource = fs.readFileSync(path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'), 'utf8')

    expect(layoutSource).toContain("from '@/lib/themes/websiteThemes'")
    expect(layoutSource).toContain('defaultWebsiteTheme')
    expect(layoutSource).toContain('isWebsiteTheme')
    expect(layoutSource).toContain('const themeColor = isWebsiteTheme(savedThemeColor) ? savedThemeColor : defaultWebsiteTheme')
    expect(layoutSource).not.toContain("const validThemeColors = new Set(['default', 'blue', 'sera'])")
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm run test:int -- tests/int/theme-settings.int.spec.ts
```

Expected:

```text
FAIL  tests/int/theme-settings.int.spec.ts
Expected layout source to contain 'const themeColor = isWebsiteTheme(savedThemeColor) ? savedThemeColor : defaultWebsiteTheme'
```

- [ ] **Step 3: Write minimal implementation**

Update `src/globals/ThemeSettings.ts` imports and select field:

```ts
import type { GlobalConfig } from 'payload'

import {
  allowPublicReadOrCapability,
  hideFromUsersWithoutCapability,
  requireCapability,
} from '@/access/adminCapabilities'
import { defaultWebsiteTheme, websiteThemeOptions } from '@/lib/themes/websiteThemes'

export const ThemeSettings: GlobalConfig = {
  slug: 'theme-settings',
  label: 'Theme Settings',
  admin: {
    group: 'Site Settings',
    description: 'Control the frontend theme preset and light or dark mode behavior.',
    hidden: hideFromUsersWithoutCapability('manage_theme_settings'),
  },
  access: {
    read: allowPublicReadOrCapability('manage_theme_settings'),
    readVersions: requireCapability('manage_theme_settings'),
    update: requireCapability('manage_theme_settings'),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'themeColor',
      type: 'select',
      defaultValue: defaultWebsiteTheme,
      required: true,
      admin: {
        description: 'Select which frontend theme preset is loaded for the site.',
      },
      options: websiteThemeOptions,
    },
    {
      name: 'colorScheme',
      type: 'radio',
      defaultValue: 'system',
      required: true,
      admin: {
        description:
          'Choose whether the site follows the system preference or forces light/dark mode.',
      },
      options: [
        { label: 'System', value: 'system' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
    },
  ],
}
```

Update the top of `src/app/(frontend)/layout.tsx`:

```ts
import type { Metadata } from 'next'
import { AdminSessionBar } from '@/components/admin/AdminSessionBar'
import { GlobalAnnouncement } from '@/components/global/GlobalAnnouncement'
import { GlobalFooter } from '@/components/global/GlobalFooter'
import { GlobalHeader } from '@/components/global/GlobalHeader'
import { getCurrentCMSUser } from '@/lib/cmsSession'
import { getMediaAbsoluteUrl } from '@/lib/media'
import { getRobotsMetadata } from '@/lib/seo'
import { getSiteURL } from '@/lib/siteUrl'
import { defaultWebsiteTheme, isWebsiteTheme } from '@/lib/themes/websiteThemes'
import type { Footer, Header } from '@/payload-types'

export const dynamic = 'force-dynamic'

const defaultSiteURL = getSiteURL()
```

Update the theme-resolution block in `src/app/(frontend)/layout.tsx`:

```ts
  const colorScheme = themeSettings.colorScheme ?? 'system'
  const rawThemeColor = String(themeSettings.themeColor ?? defaultWebsiteTheme)
  const savedThemeColor = rawThemeColor === 'amber' ? 'sera' : rawThemeColor
  const themeColor = isWebsiteTheme(savedThemeColor) ? savedThemeColor : defaultWebsiteTheme
```

- [ ] **Step 4: Run tests and lint**

Run:

```bash
pnpm run test:int -- tests/int/theme-settings.int.spec.ts
pnpm run lint -- src/globals/ThemeSettings.ts 'src/app/(frontend)/layout.tsx' src/lib/themes/websiteThemes.ts tests/int/theme-settings.int.spec.ts
```

Expected:

```text
PASS  tests/int/theme-settings.int.spec.ts

✔ No ESLint errors
```

- [ ] **Step 5: Commit**

```bash
git add src/globals/ThemeSettings.ts 'src/app/(frontend)/layout.tsx' tests/int/theme-settings.int.spec.ts
git commit -m "refactor: share website theme definitions"
```

## Self-Review

- Spec coverage: this plan covers the registry module, Payload integration, frontend runtime validation, fallback behavior, and the future theme-add workflow via one registry entry plus one CSS file import.
- Placeholder scan: no `TODO`, `TBD`, or implied steps remain.
- Type consistency: `WebsiteThemeValue`, `defaultWebsiteTheme`, `websiteThemeOptions`, and `isWebsiteTheme` are named consistently across both tasks.
