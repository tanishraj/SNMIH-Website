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
