export type MediaRemotePattern = {
  hostname: string
  pathname: '/**'
  port: string
  protocol: 'https'
}

const invalidPublicURLError = (): Error =>
  new Error(
    'Invalid S3_PUBLIC_URL. Use an HTTPS origin without credentials, path, query, or fragment.',
  )

export const normalizeMediaPublicURL = (value: string | undefined): string | null => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  let parsedURL: URL

  try {
    parsedURL = new URL(trimmedValue)
  } catch {
    throw invalidPublicURLError()
  }

  if (
    parsedURL.protocol !== 'https:' ||
    parsedURL.username ||
    parsedURL.password ||
    parsedURL.pathname !== '/' ||
    parsedURL.search ||
    parsedURL.hash
  ) {
    throw invalidPublicURLError()
  }

  return parsedURL.origin
}

export const buildMediaPublicURL = ({
  filename,
  prefix,
  publicURL,
}: {
  filename: string
  prefix?: string
  publicURL: string
}): string => {
  const normalizedPublicURL = normalizeMediaPublicURL(publicURL)

  if (!normalizedPublicURL) {
    throw invalidPublicURLError()
  }

  const objectKey = [prefix, filename]
    .flatMap((segment) => segment?.split('/') ?? [])
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${normalizedPublicURL}/${objectKey}`
}

export const getMediaRemotePattern = (value: string | undefined): MediaRemotePattern | null => {
  const publicURL = normalizeMediaPublicURL(value)

  if (!publicURL) {
    return null
  }

  const parsedURL = new URL(publicURL)

  return {
    hostname: parsedURL.hostname,
    pathname: '/**',
    port: parsedURL.port,
    protocol: 'https',
  }
}
