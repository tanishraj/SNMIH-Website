export type SiteOfficeLocationSource = {
  address?: string | null
  city?: string | null
  email?: string | null
  id?: string | null
  mapEmbedUrl?: string | null
  mapTitle?: string | null
  mapUrl?: string | null
  phone?: string | null
  region?: string | null
  showAddressDetails?: boolean | null
}

export type SiteOfficeLocation = {
  address: string | null
  city: string | null
  email: string | null
  id: string
  mapEmbedUrl: string
  mapTitle: string | null
  mapUrl: string
  phone: string | null
  phoneHref: string | null
  region: string | null
  showAddressDetails: boolean
}

const httpsUrlError = 'Enter a complete HTTPS URL.'

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export const validateHttpsUrl = (value: unknown): true | string => {
  if (typeof value !== 'string' || !value.trim()) {
    return true
  }

  return isHttpsUrl(value.trim()) ? true : httpsUrlError
}

const trimValue = (value: string | null | undefined) => value?.trim() ?? ''

export function normalizeSiteOfficeLocations(
  values: SiteOfficeLocationSource[] | null | undefined,
): SiteOfficeLocation[] {
  return (values ?? []).flatMap((office, index): SiteOfficeLocation[] => {
    const mapEmbedUrl = trimValue(office.mapEmbedUrl)
    const mapUrl = trimValue(office.mapUrl)

    // Only the two map URLs are mandatory — skip entries that lack them.
    if (!isHttpsUrl(mapEmbedUrl) || !isHttpsUrl(mapUrl)) {
      return []
    }

    const showAddressDetails = office.showAddressDetails !== false
    const phone = trimValue(office.phone)
    const phoneTarget = phone.replace(/[^\d+]/g, '')

    return [
      {
        address: trimValue(office.address) || null,
        city: trimValue(office.city) || null,
        email: trimValue(office.email) || null,
        id: trimValue(office.id) || `office-${index + 1}`,
        mapEmbedUrl,
        mapTitle: trimValue(office.mapTitle) || null,
        mapUrl,
        phone: phone || null,
        phoneHref: phoneTarget ? `tel:${phoneTarget}` : null,
        region: trimValue(office.region) || null,
        showAddressDetails,
      },
    ]
  })
}
