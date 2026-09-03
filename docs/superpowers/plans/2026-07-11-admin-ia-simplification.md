# Admin IA Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Payload admin into clearer website-oriented groups, rename the most confusing operator-facing labels, and keep capability-based visibility behavior intact without changing slugs or data models.

**Architecture:** This change stays at the admin presentation layer. Collections and globals keep their existing slugs and behavior, but their `admin.group` values and selected labels shift to the approved hybrid editorial IA. Capability labels and docs are aligned with the same vocabulary, and the change is verified through metadata-level tests plus a full integration run.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, TypeScript, Vitest, Markdown operator docs

## Global Constraints

- Do not change collection slugs.
- Do not change global slugs.
- Do not change API routes.
- Do not change stored data shape.
- Do not change workflows.
- Do not change the capabilities model semantics.
- Keep `Admin` fully visible with no hidden sections.
- Non-admin users must continue seeing only sections allowed by their capabilities.
- Empty groups must disappear automatically through existing capability filtering.
- `Operations` must remain last in the admin navigation.
- Keep docs, guides, and capability descriptions aligned with the new operator-facing language.

---

### Task 1: Re-group Collections And Globals Into The Approved Admin IA

**Files:**
- Create: `tests/int/admin-information-architecture.int.spec.ts`
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/Categories.ts`
- Modify: `src/collections/Tags.ts`
- Modify: `src/collections/Articles.ts`
- Modify: `src/collections/Reviews.ts`
- Modify: `src/collections/Media.ts`
- Modify: `src/collections/NavigationLinks.ts`
- Modify: `src/collections/Redirects.ts`
- Modify: `src/collections/Headers.ts`
- Modify: `src/collections/Footers.ts`
- Modify: `src/collections/SystemPages.ts`
- Modify: `src/collections/Forms.ts`
- Modify: `src/collections/FormSubmissions.ts`
- Modify: `src/collections/OperationalAuditEvents.ts`
- Modify: `src/collections/WorkQueue.ts`
- Modify: `src/collections/Users.ts`
- Modify: `src/globals/PageSettings.ts`
- Modify: `src/globals/SystemModeSettings.ts`
- Modify: `src/globals/SiteSettings.ts`
- Modify: `src/globals/ThemeSettings.ts`
- Modify: `src/globals/SEOSettings.ts`

**Interfaces:**
- Consumes: existing `CollectionConfig` and `GlobalConfig` exports from each collection/global file
- Produces:
  - collection/global `admin.group` values:
    - `Website Content`
    - `Website Structure`
    - `Lead Capture`
    - `Site Settings`
    - `Operations`
  - renamed operator-facing labels:
    - `Navigation Links`
    - `Website Defaults`
    - `Website Modes`
    - `Activity Log`
    - `Action Queue`

- [ ] **Step 1: Write the failing IA metadata test**

```ts
import { describe, expect, it } from 'vitest'

import { NavigationLinks } from '@/collections/NavigationLinks'
import { OperationalAuditEvents } from '@/collections/OperationalAuditEvents'
import { WorkQueue } from '@/collections/WorkQueue'
import { PageSettings } from '@/globals/PageSettings'
import { SystemModeSettings } from '@/globals/SystemModeSettings'

describe('admin information architecture', () => {
  it('assigns the approved groups and operator-facing labels', () => {
    expect(NavigationLinks.admin?.group).toBe('Website Structure')
    expect(NavigationLinks.labels?.plural).toBe('Navigation Links')

    expect(PageSettings.label).toBe('Website Defaults')
    expect(PageSettings.admin?.group).toBe('Site Settings')

    expect(SystemModeSettings.label).toBe('Website Modes')
    expect(SystemModeSettings.admin?.group).toBe('Site Settings')

    expect(WorkQueue.labels?.plural).toBe('Action Queue')
    expect(WorkQueue.admin?.group).toBe('Operations')

    expect(OperationalAuditEvents.labels?.plural).toBe('Activity Log')
    expect(OperationalAuditEvents.admin?.group).toBe('Operations')
  })
})
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/admin-information-architecture.int.spec.ts
```

Expected: FAIL because current labels and groups still use `Content`, `Site Structure`, `Forms`, `Admin`, `System Defaults`, and older names like `Links`, `Site Defaults`, `System Modes`, `Operational Audit Events`, and `Work Queue`.

- [ ] **Step 3: Update collection/global groups and approved labels**

Apply the approved group changes. Representative edits:

```ts
// src/collections/Pages.ts
admin: {
  group: 'Website Content',
  // ...
}

// src/collections/NavigationLinks.ts
labels: {
  singular: 'Navigation Link',
  plural: 'Navigation Links',
},
admin: {
  group: 'Website Structure',
  // ...
}

// src/globals/PageSettings.ts
label: 'Website Defaults',
admin: {
  group: 'Site Settings',
  // ...
},
hooks: {
  afterChange: [
    createGlobalAuditHook({
      entityType: 'page_settings',
      // ...
      title: 'Website Defaults',
    }),
  ],
}

// src/globals/SystemModeSettings.ts
label: 'Website Modes',
admin: {
  group: 'Site Settings',
  // ...
},
hooks: {
  afterChange: [
    createGlobalAuditHook({
      entityType: 'system_mode_settings',
      // ...
      title: 'Website Modes',
    }),
  ],
}

// src/collections/OperationalAuditEvents.ts
labels: {
  singular: 'Activity Log Entry',
  plural: 'Activity Log',
},
admin: {
  group: 'Operations',
  // ...
}

// src/collections/WorkQueue.ts
labels: {
  singular: 'Action Queue Item',
  plural: 'Action Queue',
},
admin: {
  group: 'Operations',
  // ...
}
```

Apply the full grouping map:

- `Website Content`: Pages, Categories, Tags, Articles, Reviews, Media
- `Website Structure`: Navigation Links, Redirects, Headers, Footers, System Pages
- `Lead Capture`: Forms, Form Submissions
- `Site Settings`: Website Defaults, Site Settings, Theme Settings, SEO Settings, Website Modes
- `Operations`: Users, Action Queue, Activity Log

- [ ] **Step 4: Re-run the IA metadata test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/admin-information-architecture.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit the IA metadata change**

```bash
git add tests/int/admin-information-architecture.int.spec.ts src/collections src/globals
git commit -m "feat(admin): regroup cms navigation"
```

### Task 2: Align Capability Vocabulary And Capability Grouping With The New IA

**Files:**
- Modify: `src/access/adminCapabilities.ts`
- Modify: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes:
  - `adminCapabilityFieldOptions`
  - `adminCapabilityCheckboxFields`
  - current capability values like `manage_navigation`, `manage_page_settings`, `manage_system_modes`, `manage_work_queue`, `view_operational_audit`
- Produces:
  - unchanged capability values
  - updated operator-facing labels:
    - `Navigation Links`
    - `Website Defaults`
    - `Website Modes`
    - `Action Queue`
    - `Activity Log`
  - capability collapsible sections aligned to:
    - `Website Content`
    - `Website Structure`
    - `Lead Capture`
    - `Site Settings`
    - `Operations`
    - `Publishing`

- [ ] **Step 1: Extend the capability test to cover the new vocabulary**

Add a test like:

```ts
import {
  adminCapabilityCheckboxFields,
  adminCapabilityFieldOptions,
} from '@/access/adminCapabilities'

it('uses the approved operator-facing capability vocabulary', () => {
  expect(adminCapabilityFieldOptions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ value: 'manage_navigation', label: 'Navigation Links' }),
      expect.objectContaining({ value: 'manage_page_settings', label: 'Website Defaults' }),
      expect.objectContaining({ value: 'manage_system_modes', label: 'Website Modes' }),
      expect.objectContaining({ value: 'manage_work_queue', label: 'Action Queue' }),
      expect.objectContaining({ value: 'view_operational_audit', label: 'Activity Log' }),
    ]),
  )

  expect(adminCapabilityCheckboxFields.map(section => section.label)).toEqual([
    'Website Content',
    'Website Structure',
    'Lead Capture',
    'Site Settings',
    'Operations',
    'Publishing',
  ])
})
```

- [ ] **Step 2: Run the capability test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts
```

Expected: FAIL because labels and section names still use the old wording.

- [ ] **Step 3: Update capability labels and regroup the checkbox sections**

Change the label definitions while keeping capability values unchanged:

```ts
export const adminCapabilityFieldOptions = [
  // ...
  { label: 'Navigation Links', value: 'manage_navigation' },
  { label: 'Website Defaults', value: 'manage_page_settings' },
  { label: 'Website Modes', value: 'manage_system_modes' },
  { label: 'Action Queue', value: 'manage_work_queue' },
  { label: 'Activity Log', value: 'view_operational_audit' },
  // ...
] as const

const capabilitySections = [
  {
    label: 'Website Content',
    items: [
      // pages, articles, reviews, media, taxonomy
    ],
  },
  {
    label: 'Website Structure',
    items: [
      // navigation, redirects, headers, footers, system pages
    ],
  },
  {
    label: 'Lead Capture',
    items: [
      // forms, form submissions
    ],
  },
  {
    label: 'Site Settings',
    items: [
      // website defaults, site settings, theme settings, seo settings, website modes
    ],
  },
  {
    label: 'Operations',
    items: [
      // action queue, activity log
    ],
  },
  {
    label: 'Publishing',
    items: [
      // publish_* capabilities
    ],
  },
] as const
```

Keep the generated descriptions intact so they automatically produce clearer copy from the new labels.

- [ ] **Step 4: Re-run the capability suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/adminCapabilities.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit the capability vocabulary update**

```bash
git add src/access/adminCapabilities.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(admin): align capability language"
```

### Task 3: Update Operator Guides And Documentation To Match The New IA

**Files:**
- Modify: `docs/guides/README.md`
- Modify: `docs/guides/links.md`
- Modify: `docs/guides/site-defaults.md`
- Modify: `docs/guides/system-modes.md`
- Modify: `docs/guides/operational-audit-events.md`
- Modify: `docs/guides/work-queue.md`
- Modify: `docs/guides/pages.md`
- Modify: `docs/guides/headers.md`
- Modify: `docs/guides/footers.md`
- Modify: `docs/guides/media.md`
- Modify: `docs/guides/redirects.md`
- Modify: `docs/guides/categories.md`
- Modify: `docs/architecture/content-model-map.md`
- Modify: `README.md`
- Create: `tests/int/admin-documentation.int.spec.ts`

**Interfaces:**
- Consumes:
  - approved top-level groups from the spec
  - approved label renames from Task 1
  - approved capability vocabulary from Task 2
- Produces:
  - guide index grouped as:
    - `Website Content`
    - `Website Structure`
    - `Lead Capture`
    - `Site Settings`
    - `Operations`
  - guide copy using:
    - `Navigation Links`
    - `Website Defaults`
    - `Website Modes`
    - `Activity Log`
    - `Action Queue`

- [ ] **Step 1: Write a docs consistency test**

Create a test like:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('admin documentation vocabulary', () => {
  it('uses the approved operator-facing IA terms', () => {
    const guideIndex = readFileSync('docs/guides/README.md', 'utf8')

    expect(guideIndex).toContain('### Website Content')
    expect(guideIndex).toContain('### Website Structure')
    expect(guideIndex).toContain('### Lead Capture')
    expect(guideIndex).toContain('### Site Settings')
    expect(guideIndex).toContain('### Operations')
    expect(guideIndex).toContain('[Navigation Links](./links.md)')
    expect(guideIndex).toContain('[Website Defaults](./site-defaults.md)')
    expect(guideIndex).toContain('[Website Modes](./system-modes.md)')
    expect(guideIndex).toContain('[Activity Log](./operational-audit-events.md)')
    expect(guideIndex).toContain('[Action Queue](./work-queue.md)')
  })
})
```

- [ ] **Step 2: Run the docs consistency test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/admin-documentation.int.spec.ts
```

Expected: FAIL because the guide index and guide copy still use the old group names and labels.

- [ ] **Step 3: Update the guide index and renamed guide headings**

Representative edits:

```md
### Website Structure

- [Navigation Links](./links.md)

### Site Settings

- [Website Defaults](./site-defaults.md)
- [Website Modes](./system-modes.md)

### Operations

- [Activity Log](./operational-audit-events.md)
- [Action Queue](./work-queue.md)
```

Update the renamed guide files in place without changing their file paths:

```md
# Navigation Links Guide
# Website Defaults Guide
# Website Modes Guide
# Activity Log Guide
# Action Queue Guide
```

Update inline references in related guides so `Links` becomes `Navigation Links`, `Site Defaults` becomes `Website Defaults`, and so on.

- [ ] **Step 4: Re-run the docs consistency test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/admin-documentation.int.spec.ts
```

Expected: PASS

- [ ] **Step 5: Commit the documentation alignment**

```bash
git add docs/guides docs/architecture/content-model-map.md README.md tests/int/admin-documentation.int.spec.ts
git commit -m "docs(admin): align operator navigation copy"
```

### Task 4: Run Full Verification And Manual Admin Smoke Checks

**Files:**
- Test: `tests/int/admin-information-architecture.int.spec.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`
- Test: `tests/int/admin-documentation.int.spec.ts`
- Test: `tests/int/starter-productization.int.spec.ts`

**Interfaces:**
- Consumes:
  - admin metadata changes from Task 1
  - capability vocabulary changes from Task 2
  - docs alignment changes from Task 3
- Produces:
  - fully verified admin IA change set
  - manual validation notes for Admin, Site Manager, and Content Manager

- [ ] **Step 1: Run focused verification for IA, capabilities, and docs**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/admin-information-architecture.int.spec.ts \
  tests/int/adminCapabilities.int.spec.ts \
  tests/int/admin-documentation.int.spec.ts \
  tests/int/starter-productization.int.spec.ts
```

Expected: PASS

- [ ] **Step 2: Run the full integration suite**

Run:

```bash
pnpm run test:int
```

Expected: PASS with the existing suite count increasing to include the new IA/docs tests.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected: exit code `0` with the repo's existing warnings only and no new errors introduced by this work.

- [ ] **Step 4: Perform manual admin smoke verification**

Run:

```bash
pnpm dev
```

Manual checklist:

- log in as `Admin`
- confirm top-level groups appear in this order:
  - `Website Content`
  - `Website Structure`
  - `Lead Capture`
  - `Site Settings`
  - `Operations`
- confirm renamed sections show:
  - `Navigation Links`
  - `Website Defaults`
  - `Website Modes`
  - `Activity Log`
  - `Action Queue`
- log in as `Site Manager`
- confirm inaccessible sections are hidden
- confirm empty groups do not appear
- log in as `Content Manager`
- confirm only website-content sections they can manage remain visible

Expected: the left panel feels simpler without changing the underlying data model.

- [ ] **Step 5: Commit the verified implementation**

```bash
git add src/access/adminCapabilities.ts src/collections src/globals docs tests
git commit -m "feat(admin): simplify operator information architecture"
```

## Self-Review

### Spec coverage

- approved top-level grouping: covered by Task 1
- approved label changes: covered by Tasks 1 and 3
- capability label alignment: covered by Task 2
- Admin full visibility and non-admin capability filtering: covered by Tasks 2 and 4
- docs alignment: covered by Task 3
- no slug/API/data-model changes: protected by constraints and full verification in Task 4

No gaps found.

### Placeholder scan

- no `TODO`
- no `TBD`
- no implicit “write tests later” steps
- all tasks include concrete files, commands, and expected outcomes

### Type consistency

- all renamed labels are consistent across plan sections:
  - `Navigation Links`
  - `Website Defaults`
  - `Website Modes`
  - `Activity Log`
  - `Action Queue`
- all group names are consistent across plan sections:
  - `Website Content`
  - `Website Structure`
  - `Lead Capture`
  - `Site Settings`
  - `Operations`

No inconsistencies found.
