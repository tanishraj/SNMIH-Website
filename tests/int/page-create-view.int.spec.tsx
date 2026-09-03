import { cleanup, render, screen } from '@testing-library/react'
import type { DocumentViewClientProps } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ drawerSlug: '', id: undefined as string | undefined }))

vi.mock('@payloadcms/ui', () => ({
  DefaultEditView: () => <div>Native Page editor</div>,
  useDocumentDrawerContext: () => ({ drawerSlug: mocks.drawerSlug }),
  useDocumentInfo: () => ({ id: mocks.id }),
}))
vi.mock('@/components/admin/PageRecipeSetup', () => ({
  PageRecipeSetup: () => <div>Guided Page setup</div>,
}))

import { Pages } from '@/collections/Pages'
import { PageCreateView } from '@/components/admin/PageCreateView'

const props = {} as DocumentViewClientProps

describe('Page create view', () => {
  beforeEach(() => {
    mocks.drawerSlug = ''
    mocks.id = undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('is registered as the default Page document view', () => {
    expect(Pages.admin?.components?.views?.edit).toMatchObject({
      default: { Component: '@/components/admin/PageCreateView#PageCreateView' },
    })
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
