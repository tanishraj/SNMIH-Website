import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

type MigrationArgs = Pick<MigrateUpArgs, 'payload' | 'session'>
type ThemeValueMapping = readonly [from: string, to: string]

const upMappings = [
  ['default', 'snmih-green'],
  ['snmih', 'snmih-blue'],
] as const satisfies readonly ThemeValueMapping[]

const downMappings = [
  ['snmih-green', 'default'],
  ['snmih-blue', 'snmih'],
] as const satisfies readonly ThemeValueMapping[]

async function migrateThemeValues(
  { payload, session }: MigrationArgs,
  mappings: readonly ThemeValueMapping[],
): Promise<void> {
  const versions = payload.db.versions['theme-settings']
  // The adapter and Mongoose currently resolve different transitive MongoDB
  // ClientSession type identities. The migration supplies the same runtime
  // session to both models, so narrow the duplicate-driver type at this edge.
  const sessionOptions = { session: session as never }

  for (const [from, to] of mappings) {
    await Promise.all([
      payload.db.globals.updateMany(
        { globalType: 'theme-settings', themeColor: from },
        { $set: { themeColor: to } },
        sessionOptions,
      ),
      versions.updateMany(
        { 'version.themeColor': from },
        { $set: { 'version.themeColor': to } },
        sessionOptions,
      ),
    ])
  }
}

export async function up(args: MigrateUpArgs): Promise<void> {
  await migrateThemeValues(args, upMappings)
}

export async function down(args: MigrateDownArgs): Promise<void> {
  await migrateThemeValues(args, downMappings)
}
