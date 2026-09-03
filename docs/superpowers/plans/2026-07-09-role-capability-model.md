# Role Capability Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `admin` / `publisher` / `editor` / `marketingOps` role model with `Admin` / `Site Manager` / `Content Manager`, while preserving capability-based overrides for non-admin users.

**Architecture:** Keep the existing access-control architecture and capability map intact, but change the role enum, legacy-role normalization, default capability presets, and Users admin behavior. Implement the new model as preset roles with explicit capability bundles, then update the admin-facing capability layout and docs so the new trust model is visible and handoff-safe.

**Tech Stack:** Payload CMS 3.x, Next.js App Router, TypeScript, Payload collection access helpers, Vitest integration tests

## Global Constraints

- Roles: `Admin`, `Site Manager`, `Content Manager`
- Keep capability customization.
- `Admin` always has full access regardless of checkbox state.
- `Site Manager` is the only non-admin role with system-level controls by default.
- `Content Manager` can publish normal content but does not publish system pages.
- `Users` management stays admin-only.

---

## File Structure

- Modify: `src/access/editorialRoles.ts`
  - Owns the role enum, legacy-role normalization, and default capability bundles.
- Modify: `src/access/adminCapabilities.ts`
  - Owns capability labels, ordering, grouping, helper functions, and role-to-capability resolution.
- Modify: `src/collections/Users.ts`
  - Owns the admin UX and persistence behavior for roles and capability presets.
- Modify: `tests/int/adminCapabilities.int.spec.ts`
  - Verifies role exposure, capability defaults, access-helper behavior, and Users normalization.
- Modify: `README.md`
  - Updates the public starter contract language for the new roles.
- Modify: `docs/operations/editorial-governance.md`
  - Updates operator-facing role descriptions to match the new model.

## Task 1: Replace Role Names And Legacy Normalization

**Files:**
- Modify: `src/access/editorialRoles.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes: `AdminCapabilitiesMap` from `src/access/adminCapabilities.ts`
- Produces:
  - `editorialRoleOptions: readonly [{ label: string; value: 'admin' | 'siteManager' | 'contentManager' }]`
  - `type EditorialRole = 'admin' | 'siteManager' | 'contentManager'`
  - `normalizeEditorialRole(value: unknown, fallback?: EditorialRole): EditorialRole`
  - `getDefaultCapabilitiesForRole(role: EditorialRole): AdminCapabilitiesMap`

- [ ] **Step 1: Write the failing role-set and legacy-normalization tests**

```ts
it('exposes the new role set', () => {
  expect(editorialRoleOptions.map(({ value }) => value)).toEqual([
    'admin',
    'siteManager',
    'contentManager',
  ])
})

it('normalizes legacy stored roles into the new model', async () => {
  const hook = Users.hooks?.beforeChange?.[0]

  if (!hook) {
    throw new Error('Expected Users beforeChange hook to exist.')
  }

  const result = await hook({
    data: {
      role: 'marketingOps',
    },
    operation: 'update',
    originalDoc: {
      role: 'marketingOps',
      capabilities: {},
    },
    req: createReq({ role: 'admin' }),
  } as never)

  expect(result.role).toBe('siteManager')
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: FAIL because the role set still exposes `publisher`, `editor`, and `marketingOps`.

- [ ] **Step 3: Replace the role options and extend legacy-role normalization**

Update `src/access/editorialRoles.ts`:

```ts
export const editorialRoleOptions = [
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'Site Manager',
    value: 'siteManager',
  },
  {
    label: 'Content Manager',
    value: 'contentManager',
  },
] as const

export type EditorialRole = (typeof editorialRoleOptions)[number]['value']

const validRoles = new Set<EditorialRole>(editorialRoleOptions.map(({ value }) => value))

const legacyRoleMap = {
  contentEditor: 'contentManager',
  editor: 'contentManager',
  marketingOps: 'siteManager',
  publisher: 'siteManager',
} as const satisfies Record<string, EditorialRole>

export const normalizeEditorialRole = (
  value: unknown,
  fallback: EditorialRole = 'contentManager',
): EditorialRole => {
  if (typeof value === 'string' && value in legacyRoleMap) {
    return legacyRoleMap[value as keyof typeof legacyRoleMap]
  }

  return isEditorialRole(value) ? value : fallback
}
```

- [ ] **Step 4: Update the role assertions in the integration test**

Update `tests/int/adminCapabilities.int.spec.ts`:

```ts
it('exposes the editorial role set', () => {
  expect(editorialRoleOptions.map(({ value }) => value)).toEqual([
    'admin',
    'siteManager',
    'contentManager',
  ])
})

it('normalizes legacy stored roles into the new model', async () => {
  const hook = Users.hooks?.beforeChange?.[0]

  if (!hook) {
    throw new Error('Expected Users beforeChange hook to exist.')
  }

  const siteManagerResult = await hook({
    data: {
      role: 'publisher',
    },
    operation: 'update',
    originalDoc: {
      role: 'publisher',
      capabilities: {},
    },
    req: createReq({ role: 'admin' }),
  } as never)

  expect(siteManagerResult.role).toBe('siteManager')

  const contentManagerResult = await hook({
    data: {
      role: 'editor',
    },
    operation: 'update',
    originalDoc: {
      role: 'editor',
      capabilities: {},
    },
    req: createReq({ role: 'admin' }),
  } as never)

  expect(contentManagerResult.role).toBe('contentManager')
})
```

- [ ] **Step 5: Run the targeted test to verify it passes**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: PASS for the role-set and legacy-normalization assertions.

- [ ] **Step 6: Commit**

```bash
git add src/access/editorialRoles.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "refactor(auth): rename editorial roles"
```

## Task 2: Rebuild Default Capability Presets For The New Roles

**Files:**
- Modify: `src/access/editorialRoles.ts`
- Modify: `src/access/adminCapabilities.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes:
  - `normalizeEditorialRole(...)`
  - `type EditorialRole`
- Produces:
  - `getDefaultCapabilitiesForRole('siteManager')`
  - `getDefaultCapabilitiesForRole('contentManager')`
  - `getCapabilitiesForRole(role: AdminRole): AdminCapabilitiesMap`

- [ ] **Step 1: Write the failing preset-bundle tests**

Add to `tests/int/adminCapabilities.int.spec.ts`:

```ts
it('assigns the approved defaults to site managers and content managers', () => {
  expect(getDefaultCapabilitiesForRole('siteManager')).toEqual(
    expect.objectContaining({
      manage_pages: true,
      manage_articles: true,
      manage_reviews: true,
      manage_media: true,
      manage_taxonomy: true,
      manage_navigation: true,
      manage_redirects: true,
      manage_headers: true,
      manage_footers: true,
      manage_forms: true,
      manage_form_submissions: true,
      manage_work_queue: true,
      manage_page_settings: true,
      manage_site_settings: true,
      manage_theme_settings: true,
      manage_seo_settings: true,
      manage_system_pages: true,
      manage_system_modes: true,
      view_operational_audit: true,
      publish_pages: true,
      publish_articles: true,
      publish_reviews: true,
      publish_system_pages: true,
    }),
  )

  expect(getDefaultCapabilitiesForRole('contentManager')).toEqual(
    expect.objectContaining({
      manage_pages: true,
      manage_articles: true,
      manage_reviews: true,
      manage_media: true,
      publish_pages: true,
      publish_articles: true,
      publish_reviews: true,
      manage_system_pages: false,
      manage_system_modes: false,
      publish_system_pages: false,
      manage_site_settings: false,
    }),
  )
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: FAIL because `siteManager` and `contentManager` presets do not exist yet.

- [ ] **Step 3: Replace the default capability bundles**

Update `src/access/editorialRoles.ts`:

```ts
const contentManagerDefaults = withCapabilities([
  'manage_articles',
  'manage_media',
  'manage_pages',
  'manage_reviews',
  'publish_articles',
  'publish_pages',
  'publish_reviews',
])

const siteManagerDefaults = withCapabilities([
  'manage_articles',
  'manage_footers',
  'manage_form_submissions',
  'manage_forms',
  'manage_headers',
  'manage_media',
  'manage_navigation',
  'manage_page_settings',
  'manage_pages',
  'manage_redirects',
  'manage_reviews',
  'manage_work_queue',
  'manage_seo_settings',
  'manage_site_settings',
  'manage_system_modes',
  'manage_system_pages',
  'manage_taxonomy',
  'manage_theme_settings',
  'publish_articles',
  'publish_pages',
  'publish_reviews',
  'publish_system_pages',
  'view_operational_audit',
])

export const getDefaultCapabilitiesForRole = (
  role: EditorialRole,
): AdminCapabilitiesMap => {
  switch (role) {
    case 'admin':
      return withCapabilities(allCapabilityValues)
    case 'siteManager':
      return {
        ...siteManagerDefaults,
      }
    case 'contentManager':
    default:
      return {
        ...contentManagerDefaults,
      }
  }
}
```

Note: define `allCapabilityValues` in the same file as a single array of every known capability key so the `admin` case stays explicit and local.

- [ ] **Step 4: Update role-based helper expectations**

Update the role fixtures in `tests/int/adminCapabilities.int.spec.ts`:

```ts
const contentManager = {
  role: 'contentManager',
  capabilities: {
    manage_pages: true,
    publish_pages: true,
  },
}

const siteManager = {
  role: 'siteManager',
  capabilities: {
    manage_pages: true,
    publish_pages: true,
    publish_articles: true,
    publish_reviews: true,
    manage_system_modes: true,
    view_operational_audit: true,
  },
}

expect(canPublishArticles(contentManager)).toBe(false)
expect(canPublishArticles(siteManager)).toBe(true)
expect(canManageSystemModes(contentManager)).toBe(false)
expect(canManageSystemModes(siteManager)).toBe(true)
expect(canViewOperationalAudit(siteManager)).toBe(true)
```

- [ ] **Step 5: Run the targeted test to verify it passes**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: PASS for the default-bundle and role-helper assertions.

- [ ] **Step 6: Commit**

```bash
git add src/access/editorialRoles.ts src/access/adminCapabilities.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(auth): add site and content manager presets"
```

## Task 3: Update Users Role Persistence And Capability-Preset Behavior

**Files:**
- Modify: `src/collections/Users.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes:
  - `normalizeEditorialRole(value, fallback?)`
  - `getCapabilitiesForRole(role)`
  - `allAdminCapabilities`
- Produces:
  - deterministic role preset application in the Users `beforeChange` hook
  - updated admin descriptions for role and capability fields

- [ ] **Step 1: Write the failing Users-preset tests**

Add to `tests/int/adminCapabilities.int.spec.ts`:

```ts
it('reapplies the selected role defaults when a non-admin role changes', async () => {
  const hook = Users.hooks?.beforeChange?.[0]

  if (!hook) {
    throw new Error('Expected Users beforeChange hook to exist.')
  }

  const result = await hook({
    data: {
      role: 'contentManager',
      capabilities: {
        manage_system_modes: true,
        manage_system_pages: true,
        publish_system_pages: true,
      },
    },
    operation: 'update',
    originalDoc: {
      role: 'siteManager',
      capabilities: getCapabilitiesForRole('siteManager'),
    },
    req: createReq({ role: 'admin' }),
  } as never)

  expect(result.role).toBe('contentManager')
  expect(result.capabilities).toEqual(getCapabilitiesForRole('contentManager'))
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: FAIL because the current hook preserves submitted capability values even when the role changes.

- [ ] **Step 3: Make role changes reset to the selected preset**

Update `src/collections/Users.ts`:

```ts
const normalizeUserAccessFields: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) {
    return data
  }

  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      overrideAccess: true,
      where: {},
    })

    if (totalDocs === 0) {
      data.role = 'admin'
      data.capabilities = toAdminCapabilitiesMap(allAdminCapabilities)
      return data
    }

    const nextRole = normalizeEditorialRole(data.role, 'contentManager')

    data.role = nextRole
    data.capabilities =
      nextRole === 'admin'
        ? toAdminCapabilitiesMap(allAdminCapabilities)
        : getCapabilitiesForRole(nextRole)

    return data
  }

  const defaultRole = normalizeEditorialRole(originalDoc?.role, 'contentManager')
  const nextRole = normalizeEditorialRole(data.role, defaultRole)
  const roleChanged = nextRole !== defaultRole

  data.role = nextRole

  if (nextRole === 'admin') {
    data.capabilities = toAdminCapabilitiesMap(allAdminCapabilities)
    return data
  }

  if (roleChanged) {
    data.capabilities = getCapabilitiesForRole(nextRole)
    return data
  }

  if (data.capabilities !== undefined) {
    data.capabilities = toAdminCapabilitiesMap(data.capabilities)
    return data
  }

  data.capabilities = toAdminCapabilitiesMap(originalDoc?.capabilities ?? getCapabilitiesForRole(nextRole))
  return data
}
```

This makes role changes deterministic and safe. It intentionally requires admins to save the role change first, then edit exceptions in a second save.

- [ ] **Step 4: Update the admin copy to explain preset-plus-override behavior**

Update the `role` and `capabilities` field configs in `src/collections/Users.ts`:

```ts
{
  name: 'role',
  type: 'select',
  defaultValue: 'contentManager',
  options: [...editorialRoleOptions],
  required: true,
  saveToJWT: true,
  admin: {
    condition: showOnlyForAuthenticatedAdminUser,
    description: 'Choose the base access preset for this user. Saving a changed non-admin role reapplies that role default.',
    position: 'sidebar',
  },
},
{
  name: 'capabilities',
  type: 'group',
  saveToJWT: true,
  admin: {
    condition: showCapabilitiesForNonAdminRole,
    description:
      'Role presets define the default access bundle for non-admin users. After saving the role, adjust these checkboxes only for explicit exceptions.',
  },
  fields: [...adminCapabilityCheckboxFields],
}
```

- [ ] **Step 5: Update the hook expectations in the integration test**

Update the existing hook assertions in `tests/int/adminCapabilities.int.spec.ts`:

```ts
expect(editorResult.capabilities).toEqual(
  expect.objectContaining({
    manage_pages: true,
    manage_taxonomy: false,
    publish_pages: true,
    manage_system_modes: false,
    publish_system_pages: false,
  }),
)
```

Use `role: 'contentManager'` and `originalDoc.role: 'contentManager'` in the fixture.

- [ ] **Step 6: Run the targeted test to verify it passes**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: PASS for the Users hook, legacy-role migration, and preset-reset behavior.

- [ ] **Step 7: Commit**

```bash
git add src/collections/Users.ts tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(users): apply role presets safely"
```

## Task 4: Reorganize Capability Presentation And Update Operator Docs

**Files:**
- Modify: `src/access/adminCapabilities.ts`
- Modify: `README.md`
- Modify: `docs/operations/editorial-governance.md`
- Test: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes:
  - `adminCapabilityFieldOptions`
  - `adminCapabilityCheckboxFields`
- Produces:
  - grouped capability UI sections for the Users admin form
  - doc language aligned with `Admin`, `Site Manager`, and `Content Manager`

- [ ] **Step 1: Write the failing capability-layout test**

Add to `tests/int/adminCapabilities.int.spec.ts`:

```ts
it('groups capabilities by responsibility area for admin presentation', () => {
  const capabilityField = Users.fields.find((field) => field.name === 'capabilities')

  if (!capabilityField || capabilityField.type !== 'group') {
    throw new Error('Expected capabilities group field to exist.')
  }

  const serialized = JSON.stringify(capabilityField.fields)

  expect(serialized).toContain('"label":"Content"')
  expect(serialized).toContain('"label":"Structure"')
  expect(serialized).toContain('"label":"Site Controls"')
  expect(serialized).toContain('"label":"Operations"')
  expect(serialized).toContain('"label":"Publishing"')
})
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts`
Expected: FAIL because the capability UI is still a flat set of generic rows.

- [ ] **Step 3: Replace the flat checkbox rows with grouped collapsible sections**

Update `src/access/adminCapabilities.ts`:

```ts
const createCapabilityCheckbox = ({ label, value }: { label: string; value: AdminCapability }) => ({
  name: value,
  type: 'checkbox' as const,
  label,
  defaultValue: false,
  admin: {
    description: getCapabilityDescription({ label, value }),
    width: '33.33%',
  },
})

const createCapabilityRows = (items: Array<{ label: string; value: AdminCapability }>) =>
  items.reduce<Array<{ fields: ReturnType<typeof createCapabilityCheckbox>[]; type: 'row' }>>(
    (rows, item, index) => {
      const rowIndex = Math.floor(index / 3)

      if (!rows[rowIndex]) {
        rows[rowIndex] = {
          fields: [],
          type: 'row',
        }
      }

      rows[rowIndex].fields.push(createCapabilityCheckbox(item))
      return rows
    },
    [],
  )

const capabilitySections = [
  {
    label: 'Content',
    items: [
      { label: 'Pages', value: 'manage_pages' },
      { label: 'Articles', value: 'manage_articles' },
      { label: 'Reviews', value: 'manage_reviews' },
      { label: 'Media', value: 'manage_media' },
      { label: 'Taxonomy', value: 'manage_taxonomy' },
    ],
  },
  {
    label: 'Structure',
    items: [
      { label: 'Navigation', value: 'manage_navigation' },
      { label: 'Redirects', value: 'manage_redirects' },
      { label: 'Headers', value: 'manage_headers' },
      { label: 'Footers', value: 'manage_footers' },
    ],
  },
  {
    label: 'Site Controls',
    items: [
      { label: 'Site Defaults', value: 'manage_page_settings' },
      { label: 'Site Settings', value: 'manage_site_settings' },
      { label: 'Theme Settings', value: 'manage_theme_settings' },
      { label: 'SEO Settings', value: 'manage_seo_settings' },
      { label: 'System Pages', value: 'manage_system_pages' },
      { label: 'System Modes', value: 'manage_system_modes' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Forms', value: 'manage_forms' },
      { label: 'Form Submissions', value: 'manage_form_submissions' },
      { label: 'Work Queue', value: 'manage_work_queue' },
      { label: 'Operational Audit', value: 'view_operational_audit' },
    ],
  },
  {
    label: 'Publishing',
    items: [
      { label: 'Publish Pages', value: 'publish_pages' },
      { label: 'Publish Articles', value: 'publish_articles' },
      { label: 'Publish Reviews', value: 'publish_reviews' },
      { label: 'Publish System Pages', value: 'publish_system_pages' },
    ],
  },
] as const

export const adminCapabilityCheckboxFields = capabilitySections.map((section) => ({
  type: 'collapsible' as const,
  label: section.label,
  admin: {
    initCollapsed: false,
  },
  fields: createCapabilityRows(section.items),
}))
```

- [ ] **Step 4: Update the starter docs to use the new role names**

Update `README.md`:

```md
## Role Model

- `Admin`: full access, user management, and recovery control
- `Site Manager`: trusted website operator with structural and system-level controls
- `Content Manager`: non-technical publisher for normal website content
```

Update `docs/operations/editorial-governance.md`:

```md
## Editorial Roles

- `Admin`: full system access, user management, and final recovery authority
- `Site Manager`: trusted non-admin website operator who can manage content, structure, settings, and publishing
- `Content Manager`: non-technical content publisher for pages, articles, reviews, and supporting media
```

- [ ] **Step 5: Run the role/capability suite and docs-adjacent integration coverage**

Run: `pnpm test:int -- --run tests/int/adminCapabilities.int.spec.ts tests/int/editorial-workflow.int.spec.ts tests/int/operational-audit.int.spec.ts`
Expected: PASS, with no regression to admin role access, workflow publishing rules, or audit visibility assumptions.

- [ ] **Step 6: Commit**

```bash
git add src/access/adminCapabilities.ts README.md docs/operations/editorial-governance.md tests/int/adminCapabilities.int.spec.ts
git commit -m "feat(admin): group capabilities by role surface"
```

## Task 5: Final Verification Sweep

**Files:**
- Modify: `src/payload-types.ts`
- Test: `tests/int/adminCapabilities.int.spec.ts`

**Interfaces:**
- Consumes:
  - updated Payload config types after schema-facing field changes
- Produces:
  - regenerated role and capability types
  - final verification output for the access-control slice

- [ ] **Step 1: Regenerate Payload types**

Run: `pnpm generate:types`
Expected: PASS and `src/payload-types.ts` updated if role-facing field metadata changed.

- [ ] **Step 2: Run the full CMS integration suite**

Run: `pnpm test:int`
Expected: PASS for the full integration suite, including role access, forms, workflow, SEO, taxonomy, and work queue behavior.

- [ ] **Step 3: Review the worktree before final commit**

Run: `git status --short`
Expected: only the planned role-model files plus generated `src/payload-types.ts` are modified.

- [ ] **Step 4: Commit the completed role-model implementation**

```bash
git add src/access/editorialRoles.ts src/access/adminCapabilities.ts src/collections/Users.ts tests/int/adminCapabilities.int.spec.ts README.md docs/operations/editorial-governance.md src/payload-types.ts
git commit -m "feat(cms): adopt site and content manager roles"
```

## Spec Coverage Check

- Role names: covered by Task 1.
- Legacy-role mapping: covered by Task 1 and Task 3.
- New default bundles: covered by Task 2.
- Admin always full access: preserved and re-verified in Task 2 and Task 5.
- Site Manager as the only default non-admin system-level role: covered by Task 2.
- Content Manager publishing without system-page control: covered by Task 2 and Task 3.
- Preset-plus-override behavior: covered by Task 3.
- Grouped capability presentation: covered by Task 4.
- Doc alignment: covered by Task 4.

## Placeholder Scan

No `TBD`, `TODO`, or deferred implementation markers remain in this plan. Every task includes exact files, code targets, test commands, and commit boundaries.

## Type Consistency Check

- New role values are consistently `admin`, `siteManager`, and `contentManager`.
- Capability helper interfaces remain `AdminCapability`, `AdminCapabilitiesMap`, and `getCapabilitiesForRole(role)`.
- Users normalization continues to flow through `normalizeEditorialRole(...)` and `getCapabilitiesForRole(...)`.
