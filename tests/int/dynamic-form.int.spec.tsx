import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { blockThumbnailDefinitions } from '@/block-thumbnails/definitions'
import { blockThumbnailFixtures } from '@/block-thumbnails/fixtures'
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
import { DynamicFormBlockComponent } from '@/blocks/DynamicForm/Component'
import { DynamicFormBlock, dynamicFormLayoutOptions } from '@/blocks/DynamicForm/config'
import { DynamicForm, type DynamicFormLike } from '@/components/DynamicForm'

const applicationForm: DynamicFormLike = {
  fields: [
    { label: 'Full name', name: 'fullName', required: true, type: 'text' },
    { label: 'Email', name: 'email', required: true, type: 'email' },
    {
      label: 'Post',
      name: 'post',
      options: [{ label: 'Professor', value: 'prof' }],
      required: false,
      type: 'select',
    },
    {
      fileTypes: ['pdf'],
      label: 'CV',
      maxFileSizeMB: 2,
      name: 'cv',
      required: true,
      type: 'file',
    },
    { label: 'Cover note', name: 'coverNote', required: false, type: 'textarea' },
    { label: 'I agree', name: 'consent', required: true, type: 'checkbox' },
  ],
  slug: 'career-application',
  submitButtonLabel: 'Submit application',
  successMessage: 'Thanks. Your application has been received.',
  title: 'Career Application',
}

describe('Dynamic Form block', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('is registered for Pages and Reusable Sections with two layouts and a thumbnail', () => {
    expect(DynamicFormBlock.slug).toBe('dynamicForm')
    expect(pageBuilderBlocks.some((block) => block.slug === 'dynamicForm')).toBe(true)
    expect(reusableSectionBuilderBlocks.some((block) => block.slug === 'dynamicForm')).toBe(true)
    expect(blockThumbnailDefinitions.some((definition) => definition.slug === 'dynamicForm')).toBe(
      true,
    )
    expect(blockThumbnailFixtures.dynamicForm).toBeTruthy()
    expect(dynamicFormLayoutOptions.map((option) => option.value)).toEqual(['split', 'stacked'])
  })

  it('renders every field type in a two-column grid with file hints and multipart encoding', () => {
    const html = renderToStaticMarkup(
      <DynamicFormBlockComponent
        description="Send your CV."
        eyebrow="Careers"
        form={applicationForm}
        layout="split"
        title="Apply for a post"
      />,
    )

    expect(html).toContain('data-dynamic-form-layout="split"')
    expect(html).toMatch(/enc[tT]ype="multipart\/form-data"/)
    expect(html).toContain('type="file"')
    expect(html).toContain('accept=".pdf"')
    expect(html).toContain('PDF, up to 2 MB')
    expect(html).toContain('Choose a file')
    const fieldTag = (type: string) =>
      html.match(new RegExp(`<div[^>]*data-dynamic-form-field="${type}"[^>]*>`))?.[0] ?? ''
    expect(fieldTag('text')).toContain('sm:col-span-1')
    expect(fieldTag('select')).toContain('sm:col-span-1')
    expect(fieldTag('file')).toContain('sm:col-span-2')
    expect(fieldTag('textarea')).toContain('sm:col-span-2')
    expect(html).toContain('Submit application')

    const stacked = renderToStaticMarkup(
      <DynamicFormBlockComponent
        contentAlignment="center"
        form={applicationForm}
        layout="stacked"
        title="Apply"
      />,
    )
    expect(stacked).toContain('data-dynamic-form-layout="stacked"')
    expect(stacked).toContain('max-w-3xl mx-auto')

    const unavailable = renderToStaticMarkup(
      <DynamicFormBlockComponent form="form-id" title="Apply" />,
    )
    expect(unavailable).toContain('data-dynamic-form-unavailable="true"')
  })

  it('validates on the client and posts multipart form data with the chosen file', async () => {
    const fetchMock = vi.fn(async () => ({
      json: async () => ({ message: 'Thanks. Your application has been received.' }),
      ok: true,
      status: 200,
    }))
    vi.stubGlobal('fetch', fetchMock)
    // Radix Select measures its trigger; jsdom has no ResizeObserver.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect() {}
        observe() {}
        unobserve() {}
      },
    )

    render(<DynamicForm form={applicationForm} />)

    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }))
    expect(await screen.findByText('Full name is required.')).toBeTruthy()
    expect(screen.getByText('CV is required.')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Asha Verma' } })
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'asha@example.com' } })
    const file = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/^CV/), { target: { files: [file] } })
    expect(await screen.findByText('cv.pdf')).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox'))

    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/forms/career-application/submit')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    const body = init.body as FormData
    expect((body.get('cv') as File).name).toBe('cv.pdf')
    expect(body.get('fullName')).toBe('Asha Verma')
    expect(body.get('consent')).toBe('true')
    expect(body.get('website')).toBe('')
    expect(JSON.parse(body.get('metadata') as string)).toHaveProperty('landingPage')

    expect((await screen.findByRole('status')).textContent).toContain(
      'Thanks. Your application has been received.',
    )
  })
})
