import { getPayload } from 'payload'
import { cache } from 'react'

import type { Redirect } from '@/payload-types'

import { getPageHref } from './pagePaths'

export const normalizeRedirectPath = (value: string): string => {
  const [rawPathname] = value.trim().split('?')
  const pathname = rawPathname.trim()

  if (!pathname || pathname === '/') {
    return '/'
  }

  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  return withLeadingSlash.replace(/\/+$/, '')
}

const isInternalRedirectDestination = (value: string): boolean => value.startsWith('/')

const resolveRedirectDestination = (
  redirect: Redirect,
): {
  destination?: string
  permanent: boolean
} => {
  const destination =
    redirect.destinationType === 'page'
      ? getPageHref(redirect.page)
      : redirect.url ?? undefined

  return {
    destination,
    permanent: redirect.statusCode !== '302',
  }
}

const getRedirectDocByPath = cache(async (pathname: string): Promise<Redirect | null> => {
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({
    config,
  })

  const result = await payload.find({
    collection: 'redirects',
    where: {
      and: [
        {
          fromPath: {
            equals: normalizeRedirectPath(pathname),
          },
        },
        {
          enabled: {
            equals: true,
          },
        },
      ],
    },
    depth: 1,
    limit: 1,
  })

  return result.docs[0] ?? null
})

const getValidatedRedirectDestination = async (
  pathname: string,
): Promise<{ destination: string; permanent: boolean } | null> => {
  const normalizedPath = normalizeRedirectPath(pathname)
  const redirect = await getRedirectDocByPath(normalizedPath)

  if (!redirect) {
    return null
  }

  const resolved = resolveRedirectDestination(redirect)

  if (!resolved.destination) {
    return null
  }

  if (!isInternalRedirectDestination(resolved.destination)) {
    return resolved as { destination: string; permanent: boolean }
  }

  const normalizedDestination = normalizeRedirectPath(resolved.destination)

  if (normalizedDestination === normalizedPath) {
    return null
  }

  const visited = new Set<string>([normalizedPath])
  let currentPath = normalizedDestination
  let hops = 0

  while (hops < 10) {
    if (visited.has(currentPath)) {
      return null
    }

    visited.add(currentPath)

    const nextRedirect = await getRedirectDocByPath(currentPath)

    if (!nextRedirect) {
      break
    }

    const nextResolved = resolveRedirectDestination(nextRedirect)

    if (!nextResolved.destination) {
      break
    }

    if (!isInternalRedirectDestination(nextResolved.destination)) {
      break
    }

    currentPath = normalizeRedirectPath(nextResolved.destination)
    hops += 1
  }

  return {
    destination: resolved.destination,
    permanent: resolved.permanent,
  }
}

export const getRedirectByPath = cache(
  async (
    pathname: string,
  ): Promise<{ destination: string; permanent: boolean } | null> => {
    return getValidatedRedirectDestination(pathname)
  },
)
