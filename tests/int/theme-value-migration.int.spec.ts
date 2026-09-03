import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import { describe, expect, it, vi } from 'vitest'

import { down, up } from '@/migrations/20260829_000000_rename_snmih_theme_values'

const createArgs = () => {
  const updateGlobals = vi.fn().mockResolvedValue({ acknowledged: true })
  const updateVersions = vi.fn().mockResolvedValue({ acknowledged: true })
  const session = { id: 'theme-migration-session' }
  const args = {
    payload: {
      db: {
        globals: { updateMany: updateGlobals },
        versions: {
          'theme-settings': { updateMany: updateVersions },
        },
      },
    },
    req: {},
    session,
  } as unknown as MigrateUpArgs

  return { args, session, updateGlobals, updateVersions }
}

describe('SNMIH theme value migration', () => {
  it('maps legacy current and versioned values to explicit identifiers', async () => {
    const { args, session, updateGlobals, updateVersions } = createArgs()

    await up(args)

    expect(updateGlobals).toHaveBeenNthCalledWith(
      1,
      { globalType: 'theme-settings', themeColor: 'default' },
      { $set: { themeColor: 'snmih-green' } },
      { session },
    )
    expect(updateGlobals).toHaveBeenNthCalledWith(
      2,
      { globalType: 'theme-settings', themeColor: 'snmih' },
      { $set: { themeColor: 'snmih-blue' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      1,
      { 'version.themeColor': 'default' },
      { $set: { 'version.themeColor': 'snmih-green' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      2,
      { 'version.themeColor': 'snmih' },
      { $set: { 'version.themeColor': 'snmih-blue' } },
      { session },
    )
  })

  it('reverses only the explicit identifiers', async () => {
    const { args, session, updateGlobals, updateVersions } = createArgs()

    await down(args as unknown as MigrateDownArgs)

    expect(updateGlobals).toHaveBeenNthCalledWith(
      1,
      { globalType: 'theme-settings', themeColor: 'snmih-green' },
      { $set: { themeColor: 'default' } },
      { session },
    )
    expect(updateGlobals).toHaveBeenNthCalledWith(
      2,
      { globalType: 'theme-settings', themeColor: 'snmih-blue' },
      { $set: { themeColor: 'snmih' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      1,
      { 'version.themeColor': 'snmih-green' },
      { $set: { 'version.themeColor': 'default' } },
      { session },
    )
    expect(updateVersions).toHaveBeenNthCalledWith(
      2,
      { 'version.themeColor': 'snmih-blue' },
      { $set: { 'version.themeColor': 'snmih' } },
      { session },
    )
  })
})
