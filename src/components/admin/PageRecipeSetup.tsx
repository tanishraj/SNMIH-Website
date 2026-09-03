'use client'

import { useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import { type FormEvent, useState } from 'react'

import { pageRecipeOptions, type PageRecipeID } from '@/page-recipes/pageRecipes'

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
