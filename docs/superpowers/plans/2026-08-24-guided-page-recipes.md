# Guided Page Recipes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the primary full-page Page creation form with a two-choice setup screen that creates either a blank draft or a Landing draft containing Page Header followed by Breadcrumb, then opens Payload's native editor with all 53 blocks available.

**Architecture:** A typed code-owned recipe catalog produces fresh Page layouts. A focused authenticated Pages collection endpoint validates the title and recipe ID, creates a draft through Payload with access enforcement, and returns a configuration-aware edit URL. A client document-view wrapper shows the setup screen only for full-page creation and delegates existing documents and relationship drawers to Payload's `DefaultEditView`.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19, TypeScript, SCSS using Payload theme variables, Vitest/Testing Library, Playwright.

## Global Constraints

- Keep this a one-client-per-deployment starter; do not add tenant data, tenant switching, a template marketplace, or CMS-managed recipes.
- Expose exactly two stable recipe IDs: `blank` and `landing`.
- Landing layout order is exactly `pageHeader`, then `breadcrumb`.
- Page Header is topmost, receives the normalized Page title, and suppresses its internal breadcrumb.
- Standalone Breadcrumb uses automatic Page hierarchy mode.
- Do not add a persisted recipe field or require a database migration.
- Existing Page edit, live preview, API, version, versions, renderers, layouts, and relationship-drawer creation must retain native behavior.
- The complete canonical 53-block Page catalog remains available after draft creation.
- The specialized endpoint accepts no caller-supplied layout or block data.
- Use `overrideAccess: false`, the authenticated user, and the current request for Page creation.
- Do not touch `.env` or expose `PAYLOAD_SECRET`.
- Do not commit implementation changes unless the user explicitly authorizes commits during execution.

---

## File Structure

- Create `src/page-recipes/pageRecipes.ts`: immutable recipe metadata, ID guard, and fresh layout factories.
- Create `src/endpoints/createPageFromRecipe.ts`: authenticated request parsing, access checks, Payload draft creation, safe responses, and configuration-aware edit URL.
- Create `src/components/admin/PageRecipeSetup.tsx`: accessible title/recipe form, request lifecycle, errors, and navigation.
- Create `src/components/admin/PageRecipeSetup.scss`: Payload-themed responsive setup-screen presentation.
- Create `src/components/admin/PageCreateView.tsx`: route-context delegation between setup and `DefaultEditView`.
- Modify `src/collections/Pages.ts`: register the endpoint and default document-view component.
- Create `tests/int/page-recipes.int.spec.ts`: catalog contracts.
- Create `tests/int/page-recipe-endpoint.int.spec.ts`: endpoint access, validation, creation, and error contracts.
- Create `tests/int/page-recipe-setup.int.spec.tsx`: accessible client behavior.
- Create `tests/int/page-create-view.int.spec.tsx`: full-page/create/edit/drawer delegation.
- Create `tests/helpers/pageRecipeDraft.ts`: deterministic E2E cleanup for recipe-created Pages.
- Modify `tests/e2e/admin.e2e.spec.ts`: real Admin recipe journey.
- Modify `docs/guides/blocks.md`: editor-facing recipe behavior.
- Modify `.agents/skills/project-context/references/block-system.md`: canonical recipe/catalog relationship.
- Modify `.agents/skills/project-context/references/architecture.md`: custom create view and endpoint delivery boundary.
- Refresh `src/app/(payload)/admin/importMap.js` and `.agents/skills/project-context/references/project-inventory.json` through repository generators.

---

### Task 1: Typed Page Recipe Catalog

**Files:**
- Create: `tests/int/page-recipes.int.spec.ts`
- Create: `src/page-recipes/pageRecipes.ts`

**Interfaces:**
- Produces: `PageRecipeID = 'blank' | 'landing'`.
- Produces: `pageRecipeOptions: readonly PageRecipeOption[]` for the Admin UI.
- Produces: `isPageRecipeID(value: unknown): value is PageRecipeID` for endpoint validation.
- Produces: `createPageRecipeLayout(recipe: PageRecipeID, title: string): NonNullable<Page['layout']>` for draft creation.

- [ ] **Step 1: Write the failing recipe contracts**

Create `tests/int/page-recipes.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  createPageRecipeLayout,
  isPageRecipeID,
  pageRecipeOptions,
} from '@/page-recipes/pageRecipes'

describe('page recipes', () => {
  it('exposes exactly Blank and Landing in editor order', () => {
    expect(pageRecipeOptions).toEqual([
      {
        description: 'Start with an empty layout and add any available block.',
        id: 'blank',
        includedBlocks: [],
        label: 'Blank Page',
      },
      {
        description: 'Start with a page title followed by an automatic breadcrumb trail.',
        id: 'landing',
        includedBlocks: ['Page Header', 'Breadcrumb'],
        label: 'Landing Page',
      },
    ])
  })

  it('recognizes only supported recipe IDs', () => {
    expect(isPageRecipeID('blank')).toBe(true)
    expect(isPageRecipeID('landing')).toBe(true)
    expect(isPageRecipeID('service')).toBe(false)
    expect(isPageRecipeID(null)).toBe(false)
  })

  it('creates a blank layout', () => {
    expect(createPageRecipeLayout('blank', 'About')).toEqual([])
  })

  it('creates Page Header then automatic Breadcrumb for Landing', () => {
    expect(createPageRecipeLayout('landing', '  About the Institute  ')).toEqual([
      {
        appearance: { background: 'none', border: 'none' },
        blockType: 'pageHeader',
        title: 'About the Institute',
        topContent: 'eyebrow',
        variant: 'minimal',
      },
      {
        alignment: 'left',
        appearance: { background: 'none', border: 'none' },
        blockType: 'breadcrumb',
        breadcrumbMode: 'automatic',
        sectionPadding: 'compact',
        separator: 'chevron',
        showCurrentPage: true,
        showHome: true,
        size: 'default',
      },
    ])
  })

  it('returns fresh data for every request', () => {
    const first = createPageRecipeLayout('landing', 'First')
    const second = createPageRecipeLayout('landing', 'Second')

    first[0]!.blockName = 'Changed locally'

    expect(second[0]).not.toHaveProperty('blockName')
    expect(second[0]).toMatchObject({ title: 'Second' })
  })
})
```

- [ ] **Step 2: Run the recipe test and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-recipes.int.spec.ts
```

Expected: FAIL because `@/page-recipes/pageRecipes` does not exist.

- [ ] **Step 3: Implement the immutable catalog and factories**

Create `src/page-recipes/pageRecipes.ts`:

```ts
import type { Page } from '@/payload-types'

export const pageRecipeIDs = ['blank', 'landing'] as const

export type PageRecipeID = (typeof pageRecipeIDs)[number]

export type PageRecipeOption = Readonly<{
  description: string
  id: PageRecipeID
  includedBlocks: readonly string[]
  label: string
}>

export const pageRecipeOptions = [
  {
    description: 'Start with an empty layout and add any available block.',
    id: 'blank',
    includedBlocks: [],
    label: 'Blank Page',
  },
  {
    description: 'Start with a page title followed by an automatic breadcrumb trail.',
    id: 'landing',
    includedBlocks: ['Page Header', 'Breadcrumb'],
    label: 'Landing Page',
  },
] as const satisfies readonly PageRecipeOption[]

export const isPageRecipeID = (value: unknown): value is PageRecipeID =>
  typeof value === 'string' && pageRecipeIDs.some((recipeID) => recipeID === value)

type PageLayout = NonNullable<Page['layout']>

export const createPageRecipeLayout = (recipe: PageRecipeID, title: string): PageLayout => {
  if (recipe === 'blank') return []

  return [
    {
      appearance: { background: 'none', border: 'none' },
      blockType: 'pageHeader',
      title: title.trim(),
      topContent: 'eyebrow',
      variant: 'minimal',
    },
    {
      alignment: 'left',
      appearance: { background: 'none', border: 'none' },
      blockType: 'breadcrumb',
      breadcrumbMode: 'automatic',
      sectionPadding: 'compact',
      separator: 'chevron',
      showCurrentPage: true,
      showHome: true,
      size: 'default',
    },
  ]
}
```

- [ ] **Step 4: Run the recipe contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-recipes.int.spec.ts
```

Expected: 1 file and 5 tests PASS.

- [ ] **Step 5: Review the catalog boundary**

Confirm `src/page-recipes/pageRecipes.ts` imports only types and contains no Payload config, database access, React, or client-only APIs. Confirm the Landing factory returns exactly two fresh objects and contains no `id`, `blockName`, fake copy, media, relationship, or caller-supplied layout data.

- [ ] **Step 6: Commit only with explicit user authorization**

```bash
git add src/page-recipes/pageRecipes.ts tests/int/page-recipes.int.spec.ts
git commit -m "feat(admin): define page recipes"
```

---

### Task 2: Protected Recipe Draft Endpoint

**Files:**
- Create: `tests/int/page-recipe-endpoint.int.spec.ts`
- Create: `src/endpoints/createPageFromRecipe.ts`
- Modify: `src/collections/Pages.ts`

**Interfaces:**
- Consumes: `isPageRecipeID()` and `createPageRecipeLayout()` from Task 1.
- Produces: `createPageFromRecipeEndpoint: Endpoint` at `POST /api/pages/create-from-recipe`.
- Response success: `{ editURL: string; id: string | number }` with HTTP 201.
- Response failure: `{ message: string }` with HTTP 400, 401, 403, or 500.

- [ ] **Step 1: Write endpoint tests before registration**

Create `tests/int/page-recipe-endpoint.int.spec.ts` with a typed request factory and these assertions:

```ts
import type { PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPageFromRecipeEndpoint } from '@/endpoints/createPageFromRecipe'

const create = vi.fn()
const loggerError = vi.fn()

const pageManager = {
  capabilities: ['manage_pages'],
  id: 'manager-1',
  role: 'contentManager',
}

const makeRequest = ({
  body = { recipe: 'landing', title: '  Admissions  ' },
  jsonError,
  user = pageManager,
}: {
  body?: unknown
  jsonError?: Error
  user?: null | typeof pageManager | { id: string; role: 'contentManager' }
} = {}) =>
  ({
    json: jsonError ? vi.fn().mockRejectedValue(jsonError) : vi.fn().mockResolvedValue(body),
    payload: {
      config: { routes: { admin: '/cms' }, serverURL: 'https://example.test' },
      create,
      logger: { error: loggerError },
    },
    user,
  }) as unknown as PayloadRequest

describe('create Page from recipe endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    create.mockResolvedValue({ id: 'page-17' })
  })

  it('creates an access-controlled Landing draft and returns its edit URL', async () => {
    const req = makeRequest()
    const response = await createPageFromRecipeEndpoint.handler(req)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      editURL: '/cms/collections/pages/page-17',
      id: 'page-17',
    })
    expect(create).toHaveBeenCalledWith({
      collection: 'pages',
      data: {
        layout: expect.arrayContaining([
          expect.objectContaining({ blockType: 'pageHeader', title: 'Admissions' }),
          expect.objectContaining({ blockType: 'breadcrumb' }),
        ]),
        title: 'Admissions',
        workflowState: 'draft',
      },
      draft: true,
      overrideAccess: false,
      req,
      user: pageManager,
    })
  })

  it('creates an empty Blank draft', async () => {
    const response = await createPageFromRecipeEndpoint.handler(
      makeRequest({ body: { recipe: 'blank', title: 'Plain Page' } }),
    )

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ layout: [] }) }),
    )
  })

  it.each([
    ['anonymous', makeRequest({ user: null }), 401],
    ['unauthorized', makeRequest({ user: { id: 'writer-1', role: 'contentManager' } }), 403],
    ['malformed JSON', makeRequest({ jsonError: new Error('bad JSON') }), 400],
    ['empty title', makeRequest({ body: { recipe: 'blank', title: '   ' } }), 400],
    ['unknown recipe', makeRequest({ body: { recipe: 'service', title: 'Services' } }), 400],
  ])('rejects %s without mutation', async (_label, req, status) => {
    const response = await createPageFromRecipeEndpoint.handler(req)

    expect(response.status).toBe(status)
    expect(create).not.toHaveBeenCalled()
    expect(await response.json()).toEqual({ message: expect.any(String) })
  })

  it('logs internal failure and returns a safe message', async () => {
    create.mockRejectedValue(new Error('database credentials leaked here'))

    const response = await createPageFromRecipeEndpoint.handler(makeRequest())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Unable to create the Page draft.' })
    expect(loggerError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Page recipe draft creation failed.' }),
    )
  })
})
```

Also assert that `Pages.endpoints` contains the endpoint after registration:

```ts
import { Pages } from '@/collections/Pages'

expect(Pages.endpoints).toContain(createPageFromRecipeEndpoint)
```

- [ ] **Step 2: Run the endpoint test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-recipe-endpoint.int.spec.ts
```

Expected: FAIL because `@/endpoints/createPageFromRecipe` does not exist.

- [ ] **Step 3: Implement safe parsing and draft creation**

Create `src/endpoints/createPageFromRecipe.ts`:

```ts
import { formatAdminURL } from 'payload/shared'
import type { Endpoint, PayloadRequest } from 'payload'

import { hasAdminCapability } from '@/access/adminCapabilities'
import { createPageRecipeLayout, isPageRecipeID } from '@/page-recipes/pageRecipes'
import type { User } from '@/payload-types'

type RecipeRequestBody = { recipe?: unknown; title?: unknown }

const jsonMessage = (message: string, status: number) =>
  Response.json({ message }, { status })

const parseBody = async (req: PayloadRequest): Promise<RecipeRequestBody | null> => {
  try {
    const value = await req.json()
    return value && typeof value === 'object' ? (value as RecipeRequestBody) : null
  } catch {
    return null
  }
}

export const createPageFromRecipeEndpoint: Endpoint = {
  method: 'post',
  path: '/create-from-recipe',
  handler: async (req) => {
    const user = req.user as User | null

    if (!user) return jsonMessage('Authentication is required.', 401)
    if (!hasAdminCapability(user, 'manage_pages')) {
      return jsonMessage('You do not have permission to create Pages.', 403)
    }

    const body = await parseBody(req)
    if (!body) return jsonMessage('Enter a valid Page title and recipe.', 400)

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return jsonMessage('Page title is required.', 400)
    if (!isPageRecipeID(body.recipe)) return jsonMessage('Choose a valid Page recipe.', 400)

    try {
      const page = await req.payload.create({
        collection: 'pages',
        data: {
          layout: createPageRecipeLayout(body.recipe, title),
          title,
          workflowState: 'draft',
        },
        draft: true,
        overrideAccess: false,
        req,
        user,
      })

      const editURL = formatAdminURL({
        adminRoute: req.payload.config.routes.admin,
        path: `/collections/pages/${page.id}`,
        relative: true,
        serverURL: req.payload.config.serverURL,
      })

      return Response.json({ editURL, id: page.id }, { status: 201 })
    } catch (error) {
      req.payload.logger.error({
        error,
        message: 'Page recipe draft creation failed.',
      })
      return jsonMessage('Unable to create the Page draft.', 500)
    }
  },
}
```

- [ ] **Step 4: Register the endpoint on Pages**

In `src/collections/Pages.ts`, import the endpoint and add it beside `access`:

```ts
import { createPageFromRecipeEndpoint } from '@/endpoints/createPageFromRecipe'

// ...
endpoints: [createPageFromRecipeEndpoint],
```

Do not alter existing access functions or hooks.

- [ ] **Step 5: Run endpoint and access contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-recipe-endpoint.int.spec.ts tests/int/page-access.int.spec.ts tests/int/admin-capabilities.int.spec.ts
```

Expected: all selected files PASS. If either existing filename differs, use `rg --files tests/int | rg 'page.*access|admin.*capabil'` and run the exact matching contracts.

- [ ] **Step 6: Commit only with explicit user authorization**

```bash
git add src/endpoints/createPageFromRecipe.ts src/collections/Pages.ts tests/int/page-recipe-endpoint.int.spec.ts
git commit -m "feat(admin): create recipe drafts"
```

---

### Task 3: Accessible Page Setup Screen

**Files:**
- Create: `tests/int/page-recipe-setup.int.spec.tsx`
- Create: `src/components/admin/PageRecipeSetup.tsx`
- Create: `src/components/admin/PageRecipeSetup.scss`

**Interfaces:**
- Consumes: `pageRecipeOptions` and `PageRecipeID` from Task 1.
- Calls: `POST {configuredApiRoute}/pages/create-from-recipe` with `{ recipe, title }`.
- Navigates: successful `editURL` with Next's `router.push()`.
- Produces: `PageRecipeSetup(): React.JSX.Element`.

- [ ] **Step 1: Write client interaction tests**

Create `tests/int/page-recipe-setup.int.spec.tsx`. Mock `@payloadcms/ui` `useConfig`, mock `next/navigation` `useRouter`, and restore `global.fetch` after each test. Cover these exact behaviors:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('@payloadcms/ui', () => ({
  useConfig: () => ({
    config: {
      routes: { admin: '/cms', api: '/backend' },
      serverURL: 'https://example.test',
    },
  }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))

import { PageRecipeSetup } from '@/components/admin/PageRecipeSetup'

describe('Page recipe setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.push.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('starts with Blank selected and describes both recipes', () => {
    render(<PageRecipeSetup />)

    const titleInput = screen.getByRole('textbox', { name: 'Page title' })
    const blankRadio = screen.getByRole('radio', { name: /Blank Page/ }) as HTMLInputElement

    expect(screen.getByRole('heading', { name: 'Create a Page' })).toBeTruthy()
    expect(document.activeElement).toBe(titleInput)
    expect(blankRadio.checked).toBe(true)
    expect(screen.getByText('Page Header → Breadcrumb')).toBeTruthy()
  })

  it('rejects an empty title before requesting creation', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<PageRecipeSetup />)

    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Enter a Page title.')).toBeTruthy()
  })

  it('submits Landing and opens the returned native editor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ editURL: '/cms/collections/pages/page-17', id: 'page-17' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<PageRecipeSetup />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Page title' }), {
      target: { value: '  Admissions  ' },
    })
    fireEvent.click(screen.getByRole('radio', { name: /Landing Page/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/backend/pages/create-from-recipe', {
        body: JSON.stringify({ recipe: 'landing', title: 'Admissions' }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      expect(mocks.push).toHaveBeenCalledWith('/cms/collections/pages/page-17')
    })
  })

  it('locks the form and communicates progress while creating', async () => {
    let resolveRequest: ((response: Response) => void) | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveRequest = resolve
        }),
      ),
    )
    render(<PageRecipeSetup />)

    const titleInput = screen.getByRole('textbox', { name: 'Page title' }) as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'Admissions' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }))

    expect(titleInput.disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Creating draft…' })).toBeTruthy()

    resolveRequest?.(
      new Response(JSON.stringify({ editURL: '/cms/collections/pages/page-17', id: 'page-17' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 201,
      }),
    )
    await waitFor(() => expect(mocks.push).toHaveBeenCalled())
  })

  it('announces server errors and allows retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Unable to create the Page draft.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }),
      ),
    )
    render(<PageRecipeSetup />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Page title' }), {
      target: { value: 'Admissions' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }))

    expect((await screen.findByRole('status')).textContent).toContain(
      'Unable to create the Page draft.',
    )
    expect((screen.getByRole('button', { name: 'Create draft' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })

  it('offers the created draft when client navigation fails', async () => {
    mocks.push.mockImplementation(() => {
      throw new Error('navigation failed')
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ editURL: '/cms/collections/pages/page-17', id: 'page-17' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 201,
        }),
      ),
    )
    render(<PageRecipeSetup />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Page title' }), {
      target: { value: 'Admissions' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }))

    expect(
      (await screen.findByRole('link', { name: 'Open the created draft' })).getAttribute('href'),
    ).toBe('/cms/collections/pages/page-17')
  })
})
```

- [ ] **Step 2: Run the client test and confirm the missing component failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-recipe-setup.int.spec.tsx
```

Expected: FAIL because `PageRecipeSetup` does not exist.

- [ ] **Step 3: Implement the setup form**

Create `src/components/admin/PageRecipeSetup.tsx`:

```tsx
'use client'

import { useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import { type FormEvent, useState } from 'react'

import {
  pageRecipeOptions,
  type PageRecipeID,
} from '@/page-recipes/pageRecipes'

import './PageRecipeSetup.scss'

type CreatePageResult = {
  editURL?: unknown
  message?: unknown
}

export function PageRecipeSetup() {
  const { config } = useConfig()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [recipe, setRecipe] = useState<PageRecipeID>('blank')
  const [error, setError] = useState('')
  const [createdDraftURL, setCreatedDraftURL] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const endpointURL = formatAdminURL({
    apiRoute: config.routes.api,
    path: '/pages/create-from-recipe',
    relative: true,
    serverURL: config.serverURL,
  })
  const pagesURL = formatAdminURL({
    adminRoute: config.routes.admin,
    path: '/collections/pages',
    relative: true,
    serverURL: config.serverURL,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      setError('Enter a Page title.')
      return
    }

    setError('')
    setCreatedDraftURL('')
    setIsSubmitting(true)
    let nextEditURL = ''

    try {
      const response = await fetch(endpointURL, {
        body: JSON.stringify({ recipe, title: normalizedTitle }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const result = (await response.json()) as CreatePageResult

      if (!response.ok || typeof result.editURL !== 'string') {
        setError(
          typeof result.message === 'string'
            ? result.message
            : 'Unable to create the Page draft.',
        )
        return
      }

      nextEditURL = result.editURL
      setCreatedDraftURL(nextEditURL)
      router.push(nextEditURL)
    } catch {
      setError(
        nextEditURL
          ? 'The draft was created, but the editor could not open automatically.'
          : 'Unable to create the Page draft.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-recipe-setup">
      <header>
        <h1>Create a Page</h1>
        <p className="page-recipe-setup__intro">
          Name the Page and choose a starting structure. You can use every Page block after the
          draft opens.
        </p>
      </header>

      <form className="page-recipe-setup__form" onSubmit={handleSubmit}>
        <div className="page-recipe-setup__field">
          <label className="page-recipe-setup__label" htmlFor="page-recipe-title">
            Page title
          </label>
          <input
            autoFocus
            className="page-recipe-setup__title-input"
            disabled={isSubmitting}
            id="page-recipe-title"
            onChange={(event) => setTitle(event.target.value)}
            type="text"
            value={title}
          />
        </div>

        <fieldset className="page-recipe-setup__field" disabled={isSubmitting}>
          <legend>Choose a starting point</legend>
          <div className="page-recipe-setup__recipes">
            {pageRecipeOptions.map((option) => (
              <label className="page-recipe-setup__recipe" key={option.id}>
                <input
                  checked={recipe === option.id}
                  className="page-recipe-setup__radio"
                  name="page-recipe"
                  onChange={() => setRecipe(option.id)}
                  type="radio"
                  value={option.id}
                />
                <span className="page-recipe-setup__card">
                  <span className="page-recipe-setup__recipe-title">{option.label}</span>
                  <span className="page-recipe-setup__recipe-description">
                    {option.description}
                  </span>
                  {option.includedBlocks.length > 0 ? (
                    <span className="page-recipe-setup__recipe-blocks">
                      {option.includedBlocks.join(' → ')}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <p aria-live="polite" className="page-recipe-setup__status" role="status">
          {error}
        </p>

        {createdDraftURL && error ? (
          <a className="page-recipe-setup__recovery" href={createdDraftURL}>
            Open the created draft
          </a>
        ) : null}

        <div className="page-recipe-setup__actions">
          <button className="page-recipe-setup__submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating draft…' : 'Create draft'}
          </button>
          <a
            aria-disabled={isSubmitting}
            className="page-recipe-setup__cancel"
            href={isSubmitting ? undefined : pagesURL}
          >
            Cancel
          </a>
        </div>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Add Payload-themed responsive styles**

Create `src/components/admin/PageRecipeSetup.scss` with the following structure and theme variables:

```scss
.page-recipe-setup {
  width: min(100%, 900px);
  margin: 0 auto;
  padding: 48px var(--gutter-h);

  &__intro { max-width: 62ch; color: var(--theme-elevation-600); }
  &__form { display: grid; gap: 32px; margin-top: 32px; }
  &__field { display: grid; gap: 10px; }
  &__label, legend { font-size: 13px; font-weight: 600; }
  &__title-input {
    min-height: 44px;
    border: 1px solid var(--theme-elevation-250);
    border-radius: 6px;
    background: var(--theme-input-bg);
    color: var(--theme-text);
    padding: 10px 12px;
  }
  &__title-input:focus-visible {
    outline: 2px solid var(--theme-success-500);
    outline-offset: 2px;
  }
  &__recipes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  &__recipe { position: relative; display: block; }
  &__radio { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; }
  &__card {
    display: grid;
    min-height: 168px;
    align-content: start;
    gap: 10px;
    border: 1px solid var(--theme-elevation-250);
    border-radius: 8px;
    background: var(--theme-elevation-50);
    padding: 20px;
    cursor: pointer;
    transition: border-color 120ms ease, background-color 120ms ease, box-shadow 120ms ease;
  }
  &__radio:checked + &__card {
    border-color: var(--theme-success-500);
    background: var(--theme-success-50);
    box-shadow: 0 0 0 1px var(--theme-success-500);
  }
  &__radio:focus-visible + &__card { outline: 2px solid var(--theme-success-500); outline-offset: 3px; }
  &__recipe-title { font-size: 16px; font-weight: 600; }
  &__recipe-description, &__recipe-blocks { color: var(--theme-elevation-600); line-height: 1.5; }
  &__recipe-blocks { font-size: 12px; font-weight: 600; }
  &__status { min-height: 20px; color: var(--theme-error-500); }
  &__actions { display: flex; align-items: center; gap: 16px; }
  &__submit {
    min-height: 40px;
    border: 0;
    border-radius: 4px;
    background: var(--theme-elevation-800);
    color: var(--theme-elevation-0);
    padding: 0 18px;
    font-weight: 600;
    cursor: pointer;
  }
  &__submit:disabled { cursor: wait; opacity: 0.65; }
  &__cancel { color: var(--theme-elevation-700); }
  &__recovery { color: var(--theme-success-700); font-weight: 600; }

  @media (max-width: 700px) {
    padding-top: 32px;
    &__recipes { grid-template-columns: 1fr; }
    &__actions { align-items: stretch; flex-direction: column; }
    &__submit { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    &__card { transition: none; }
  }
}
```

If a listed Payload variable is absent in the rendered Admin theme, replace it with the nearest existing `--theme-elevation-*`, `--theme-success-*`, or `--theme-error-*` token after browser inspection; do not introduce hardcoded brand colors.

- [ ] **Step 5: Run client behavior and accessibility tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-recipe-setup.int.spec.tsx
```

Expected: 1 file and 6 tests PASS without React `act()` warnings.

- [ ] **Step 6: Commit only with explicit user authorization**

```bash
git add src/components/admin/PageRecipeSetup.tsx src/components/admin/PageRecipeSetup.scss tests/int/page-recipe-setup.int.spec.tsx
git commit -m "feat(admin): add page setup screen"
```

---

### Task 4: Native Editor Delegation and Payload Registration

**Files:**
- Create: `tests/int/page-create-view.int.spec.tsx`
- Create: `src/components/admin/PageCreateView.tsx`
- Modify: `src/collections/Pages.ts`
- Generate: `src/app/(payload)/admin/importMap.js`

**Interfaces:**
- Consumes: `PageRecipeSetup` from Task 3.
- Produces: `PageCreateView(props: DocumentViewClientProps)`.
- Delegates to: Payload `DefaultEditView` when `id` exists or `drawerSlug` is truthy.

- [ ] **Step 1: Write delegation tests**

Create `tests/int/page-create-view.int.spec.tsx` and mock Payload UI context before importing the component:

```tsx
import { render, screen } from '@testing-library/react'
import type { DocumentViewClientProps } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ drawerSlug: '', id: undefined as string | undefined }))

vi.mock('@payloadcms/ui', () => ({
  DefaultEditView: () => <div>Native Page editor</div>,
  useDocumentDrawerContext: () => ({ drawerSlug: mocks.drawerSlug }),
  useDocumentInfo: () => ({ id: mocks.id }),
}))
vi.mock('@/components/admin/PageRecipeSetup', () => ({
  PageRecipeSetup: () => <div>Guided Page setup</div>,
}))

import { PageCreateView } from '@/components/admin/PageCreateView'

const props = {} as DocumentViewClientProps

describe('Page create view', () => {
  beforeEach(() => {
    mocks.drawerSlug = ''
    mocks.id = undefined
  })

  it('shows guided setup for full-page creation', () => {
    render(<PageCreateView {...props} />)
    expect(screen.getByText('Guided Page setup')).toBeTruthy()
  })

  it('delegates existing Pages to Payload', () => {
    mocks.id = 'page-17'
    render(<PageCreateView {...props} />)
    expect(screen.getByText('Native Page editor')).toBeTruthy()
  })

  it('delegates relationship-drawer creation to Payload', () => {
    mocks.drawerSlug = 'pages-drawer'
    render(<PageCreateView {...props} />)
    expect(screen.getByText('Native Page editor')).toBeTruthy()
  })
})
```

Add a schema assertion:

```ts
import { Pages } from '@/collections/Pages'

expect(Pages.admin?.components?.views?.edit).toMatchObject({
  default: { Component: '@/components/admin/PageCreateView#PageCreateView' },
})
```

- [ ] **Step 2: Run the delegation test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-create-view.int.spec.tsx
```

Expected: FAIL because `PageCreateView` does not exist.

- [ ] **Step 3: Implement the thin client wrapper**

Create `src/components/admin/PageCreateView.tsx`:

```tsx
'use client'

import {
  DefaultEditView,
  useDocumentDrawerContext,
  useDocumentInfo,
} from '@payloadcms/ui'
import type { DocumentViewClientProps } from 'payload'

import { PageRecipeSetup } from '@/components/admin/PageRecipeSetup'

export function PageCreateView(props: DocumentViewClientProps) {
  const { drawerSlug } = useDocumentDrawerContext()
  const { id } = useDocumentInfo()

  if (id || drawerSlug) return <DefaultEditView {...props} />

  return <PageRecipeSetup />
}
```

- [ ] **Step 4: Register only the default Page document view**

Extend `Pages.admin` in `src/collections/Pages.ts`:

```ts
components: {
  views: {
    edit: {
      default: {
        Component: '@/components/admin/PageCreateView#PageCreateView',
      },
    },
  },
},
```

Do not configure `root`; that would replace live preview, versions, API, and every nested document route. Do not change other collections.

- [ ] **Step 5: Regenerate and verify the Admin import map**

Run:

```bash
pnpm generate:importmap
```

Expected: PASS. `src/app/(payload)/admin/importMap.js` gains one `PageCreateView` import and one matching map key; unrelated imports remain present.

- [ ] **Step 6: Run delegation, schema, and import-boundary contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-create-view.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: all selected files PASS.

- [ ] **Step 7: Commit only with explicit user authorization**

```bash
git add src/components/admin/PageCreateView.tsx src/collections/Pages.ts 'src/app/(payload)/admin/importMap.js' tests/int/page-create-view.int.spec.tsx
git commit -m "feat(admin): guide page creation"
```

---

### Task 5: Real Admin Journey and Deterministic Cleanup

**Files:**
- Create: `tests/helpers/pageRecipeDraft.ts`
- Modify: `tests/e2e/admin.e2e.spec.ts`

**Interfaces:**
- Produces: `recipeE2ETitle = 'E2E Landing Recipe'`.
- Produces: `cleanupPageRecipeDraft(): Promise<void>` using trusted Local API cleanup for only that exact title.

- [ ] **Step 1: Add the cleanup helper**

Create `tests/helpers/pageRecipeDraft.ts`:

```ts
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

export const recipeE2ETitle = 'E2E Landing Recipe'

export async function cleanupPageRecipeDraft(): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'pages',
    overrideAccess: true,
    where: { title: { equals: recipeE2ETitle } },
  })
}
```

The exact-title constraint is mandatory; do not delete all drafts or use a broad prefix query.

- [ ] **Step 2: Add a Playwright recipe journey**

In `tests/e2e/admin.e2e.spec.ts`, import the helper, call cleanup before and after the suite, and add:

```ts
test('creates a Landing Page draft from the guided setup', async () => {
  await page.goto('http://localhost:3000/admin/collections/pages/create')

  await expect(page.getByRole('heading', { name: 'Create a Page' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /Blank Page/ })).toBeChecked()

  await page.getByRole('textbox', { name: 'Page title' }).fill(recipeE2ETitle)
  await page.getByRole('radio', { name: /Landing Page/ }).check()
  await page.getByRole('button', { name: 'Create draft' }).click()

  await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+$/)
  await expect(page.locator('input[name="title"]')).toHaveValue(recipeE2ETitle)

  const blockLabels = page.locator('.blocks-field__row .blocks-field__block-header')
  await expect(blockLabels).toHaveCount(2)
  await expect(blockLabels.nth(0)).toContainText('Page Header')
  await expect(blockLabels.nth(1)).toContainText('Breadcrumb')
})
```

If Payload 3.85.2's rendered block-row selectors differ, inspect the two visible block headers and replace only the selectors with the narrowest stable Payload classes or accessible names. Keep the assertions on exact count and order.

- [ ] **Step 3: Run the Admin browser journey**

Run:

```bash
pnpm exec playwright test admin.e2e.spec.ts --project=chromium
```

Expected: all Admin Panel tests PASS and the test Page is removed after the suite. If local MongoDB or the dev server is unavailable, record the environmental blocker and do not weaken the test.

- [ ] **Step 4: Commit only with explicit user authorization**

```bash
git add tests/helpers/pageRecipeDraft.ts tests/e2e/admin.e2e.spec.ts
git commit -m "test(admin): cover page recipes"
```

---

### Task 6: Documentation, Project Context, and Release Verification

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`
- Inspect: `src/payload-types.ts`
- Inspect: `src/app/(payload)/admin/importMap.js`

**Interfaces:**
- Consumes: the completed recipe catalog, endpoint, setup UI, and Page view registration.
- Produces: maintained operator and architecture contracts synchronized with current source.

- [ ] **Step 1: Update the editor block guide**

Add a concise `Page recipes` subsection to `docs/guides/blocks.md` stating:

```md
## Page recipes

Full-page creation starts with Blank Page or Landing Page. Blank Page has no layout blocks. Landing Page starts with Page Header followed by an automatic Breadcrumb. Recipes are editable starting points: after the draft opens, editors can remove or reorder those blocks and add any block from the complete catalog. Page creation inside a relationship drawer retains Payload's native blank form.
```

- [ ] **Step 2: Update maintained architecture references**

In `.agents/skills/project-context/references/block-system.md`, document the exact two recipes, Landing order, internal Page Header breadcrumb suppression, and continued 53-block availability.

In `.agents/skills/project-context/references/architecture.md`, add the full-page Page Setup view and authenticated `/api/pages/create-from-recipe` collection endpoint. State that the endpoint accepts only title and recipe ID, creates with `draft: true` plus access enforcement, and that relationship drawers preserve native creation.

- [ ] **Step 3: Refresh generated project knowledge**

Run:

```bash
pnpm project-context:update
```

Expected: PASS. Inspect `project-inventory.json`; endpoint/custom-component facts should reflect source when the inventory parser tracks them. Do not hand-edit generated facts.

- [ ] **Step 4: Verify generated Payload artifacts**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: both PASS. Because no Page fields changed, `src/payload-types.ts` should have no semantic document-type changes. The import map should contain `PageCreateView` exactly once.

- [ ] **Step 5: Run focused feature contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/page-recipes.int.spec.ts \
  tests/int/page-recipe-endpoint.int.spec.ts \
  tests/int/page-recipe-setup.int.spec.tsx \
  tests/int/page-create-view.int.spec.tsx \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: all selected files PASS.

- [ ] **Step 6: Run repository quality gates**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
pnpm project-context:check
git diff --check
```

Expected:

- TypeScript exits 0.
- Lint exits 0; pre-existing warnings may be reported separately but no new warnings are introduced.
- Full integration suite exits 0.
- Project-context check exits 0; an optional stale Understand knowledge-graph warning may be reported separately.
- Diff check exits 0.

- [ ] **Step 7: Inspect the final change-impact surface**

Read `.agents/skills/project-context/references/change-impact-map.md` again. Inspect `git diff --stat`, `git diff -- src/collections/Pages.ts src/endpoints/createPageFromRecipe.ts src/page-recipes/pageRecipes.ts`, and `git status --short`. Confirm:

- no `.env`, backup, secret, unrelated generated file, or unrelated user change is staged;
- no Page schema field or saved-layout migration was introduced;
- the endpoint is access-enforced and accepts no layout body;
- Page edit/drawer behavior delegates to Payload;
- all 53 blocks remain registered;
- maintained context matches source.

- [ ] **Step 8: Commit the completed tranche only with explicit user authorization**

If earlier task commits were not authorized, stage the complete verified tranche only after the user approves:

```bash
git add \
  .agents/skills/project-context/references/architecture.md \
  .agents/skills/project-context/references/block-system.md \
  .agents/skills/project-context/references/project-inventory.json \
  docs/guides/blocks.md \
  docs/superpowers/specs/2026-08-24-guided-page-recipes-design.md \
  docs/superpowers/plans/2026-08-24-guided-page-recipes.md \
  'src/app/(payload)/admin/importMap.js' \
  src/collections/Pages.ts \
  src/components/admin/PageCreateView.tsx \
  src/components/admin/PageRecipeSetup.scss \
  src/components/admin/PageRecipeSetup.tsx \
  src/endpoints/createPageFromRecipe.ts \
  src/page-recipes/pageRecipes.ts \
  tests/e2e/admin.e2e.spec.ts \
  tests/helpers/pageRecipeDraft.ts \
  tests/int/page-create-view.int.spec.tsx \
  tests/int/page-recipe-endpoint.int.spec.ts \
  tests/int/page-recipe-setup.int.spec.tsx \
  tests/int/page-recipes.int.spec.ts
git commit -m "feat(admin): guide page creation"
```

Expected: the commit contains only the approved guided-page-recipes tranche.
