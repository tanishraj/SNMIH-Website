const fallbackSiteURL = 'http://localhost:3000'

export const getSiteURL = (): string => {
  const configuredURL = process.env.NEXT_PUBLIC_SERVER_URL?.trim()

  if (!configuredURL) {
    return fallbackSiteURL
  }

  try {
    return new URL(configuredURL).toString().replace(/\/$/, '')
  } catch {
    return fallbackSiteURL
  }
}

export const toAbsoluteSiteUrl = (pathname: string): string => {
  return new URL(pathname, `${getSiteURL()}/`).toString()
}
