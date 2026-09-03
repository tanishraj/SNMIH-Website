import type { Endpoint, PayloadRequest } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { hasFeature } from '@/access/featureAccess'
import { createPageRecipeLayout, isPageRecipeID } from '@/page-recipes/pageRecipes'
import type { User } from '@/payload-types'

type RecipeRequestBody = {
  recipe?: unknown
  title?: unknown
}

const jsonMessage = (message: string, status: number) => Response.json({ message }, { status })

const parseBody = async (req: PayloadRequest): Promise<RecipeRequestBody | null> => {
  if (typeof req.json !== 'function') return null

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
    if (!hasFeature(user, 'pages')) {
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
