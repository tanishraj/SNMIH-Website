import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PageSettings } from '@/globals/PageSettings'
import { SystemModeSettings } from '@/globals/SystemModeSettings'

const payloadMocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    find: vi.fn(),
    findGlobal: vi.fn(),
  }
})

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    auth: payloadMocks.auth,
    find: payloadMocks.find,
    findGlobal: payloadMocks.findGlobal,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({})),
}))

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

type NamedField = {
  admin?: {
    description?: string
  }
  defaultValue?: unknown
  name: string
  options?: Array<{ value: string }>
}

const getNamedField = (fields: unknown[], fieldName: string): NamedField => {
  const field = fields.find(
    (candidate): candidate is NamedField =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'name' in candidate &&
      candidate.name === fieldName,
  )

  if (!field) {
    throw new Error(`Expected to find "${fieldName}".`)
  }

  return field
}

const loadPageData = async () => {
  vi.resetModules()
  return import('@/app/(frontend)/pageData')
}

describe('system mode settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps Page Settings free of system-mode fields', () => {
    const tabsField = PageSettings.fields.find(
      (field) => typeof field === 'object' && field !== null && 'tabs' in field,
    )

    const typedTabsField = tabsField as { tabs: Array<{ label: string }> } | undefined

    expect(typedTabsField?.tabs.map((tab) => tab.label)).toEqual([
      'Site Structure',
      'Page Appearance',
      'Announcement',
    ])
  })

  it('keeps site mode controls in System Mode Settings without an authenticated bypass', () => {
    const siteModeField = getNamedField(SystemModeSettings.fields, 'siteMode')
    const bypassField = SystemModeSettings.fields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'bypassForLoggedInAdmins',
    )

    expect(siteModeField.defaultValue).toBe('off')
    expect(siteModeField.options?.map(({ value }) => value)).toEqual([
      'off',
      'maintenance',
      'comingSoon',
    ])
    expect(bypassField).toBeUndefined()
  })

  it('keeps maintenance mode active without authenticating the public request', async () => {
    payloadMocks.findGlobal.mockImplementation(async ({ slug }) => {
      if (slug === 'page-settings') {
        return { homepage: null }
      }

      return {
        comingSoonPage: null,
        maintenancePage: null,
        notFoundPage: null,
        siteMode: 'maintenance',
      }
    })

    const { getSystemPageRenderState } = await loadPageData()

    await expect(getSystemPageRenderState('/')).resolves.toEqual({
      mode: 'maintenance',
      page: null,
    })
    expect(payloadMocks.auth).not.toHaveBeenCalled()
  })
})
