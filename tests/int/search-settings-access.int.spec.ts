import { describe, expect, it } from 'vitest'

import { SearchSettings } from '@/globals/SearchSettings'

const accessArgs = (user: unknown) => ({ req: { user } }) as never

describe('Search Settings access', () => {
  it('keeps published search suggestions public', () => {
    expect(SearchSettings.access?.read?.(accessArgs(null))).toBe(true)
  })

  it('requires the Search Settings feature for management and version history', () => {
    const editor = accessArgs({ role: 'siteManager', features: {} })
    const siteManager = accessArgs({
      role: 'siteManager',
      features: { searchSettings: true },
    })

    expect(SearchSettings.access?.update?.(editor)).toBe(false)
    expect(SearchSettings.access?.readVersions?.(editor)).toBe(false)
    expect(SearchSettings.access?.update?.(siteManager)).toBe(true)
    expect(SearchSettings.access?.readVersions?.(siteManager)).toBe(true)
  })

  it('keeps recoverable draft versions', () => {
    expect(SearchSettings.versions).toEqual({ drafts: true })
  })
})
