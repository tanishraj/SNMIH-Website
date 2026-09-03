import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'

type JsonRecord = Record<string, unknown>
type MigrationArgs = Pick<MigrateUpArgs, 'payload' | 'session'>
type MigrationDirection = 'down' | 'up'

type LayoutTransformResult = {
  changed: boolean
  layout: unknown[]
}

type MigrationModel = {
  bulkWrite: (
    operations: Array<{
      updateOne: {
        filter: { _id: unknown }
        update: { $set: Record<string, unknown> }
      }
    }>,
    options: { session: never },
  ) => Promise<unknown>
  find: (query: JsonRecord) => {
    session: (session: never) => {
      lean: () => {
        exec: () => Promise<JsonRecord[]>
      }
    }
  }
}

type MigrationTarget = {
  label: string
  model: MigrationModel
  path: 'layout' | 'version.layout'
  query: JsonRecord
}

type PreparedTarget = {
  changes: Array<{ id: unknown; layout: unknown[] }>
  target: MigrationTarget
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const ownsArray = (record: JsonRecord, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key) && Array.isArray(record[key])

const migrateBlockUp = (block: JsonRecord, location: string): JsonRecord => {
  const legacyProfiles = block.profiles
  if (!Array.isArray(legacyProfiles)) return block

  if (!Array.isArray(block.departments)) {
    throw new Error(`${location}: Department Profiles block is missing its departments.`)
  }

  const departments = block.departments.map((department, index) => {
    if (!isRecord(department)) {
      throw new Error(`${location}: department row ${index + 1} is invalid.`)
    }
    return department
  })
  const profilesByDepartment = new Map<string, JsonRecord[]>()

  for (const department of departments) {
    const id = asTrimmedString(department.id)
    if (!id) throw new Error(`${location}: department is missing its stable row ID.`)
    if (ownsArray(department, 'profiles')) {
      throw new Error(`${location}: block contains both flat and nested profile data.`)
    }
    if (profilesByDepartment.has(id)) {
      throw new Error(`${location}: duplicate department row ID “${id}”.`)
    }
    profilesByDepartment.set(id, [])
  }

  for (const profile of legacyProfiles) {
    if (!isRecord(profile)) throw new Error(`${location}: profile row is invalid.`)

    const departmentId = asTrimmedString(profile.departmentId)
    const destination = departmentId ? profilesByDepartment.get(departmentId) : undefined
    if (!destination) {
      const profileName = asTrimmedString(profile.name) || 'Unnamed profile'
      throw new Error(`${location}: profile “${profileName}” references a missing department.`)
    }

    const { departmentId: _departmentId, ...nestedProfile } = profile
    destination.push(nestedProfile)
  }

  const { profiles: _legacyProfiles, ...blockWithoutLegacyProfiles } = block

  return {
    ...blockWithoutLegacyProfiles,
    departments: departments.map((department) => ({
      ...department,
      profiles: profilesByDepartment.get(asTrimmedString(department.id)) ?? [],
    })),
  }
}

const migrateBlockDown = (block: JsonRecord, location: string): JsonRecord => {
  if (!Array.isArray(block.departments)) return block

  const departments = block.departments.map((department, index) => {
    if (!isRecord(department)) {
      throw new Error(`${location}: department row ${index + 1} is invalid.`)
    }
    return department
  })
  if (!departments.some((department) => ownsArray(department, 'profiles'))) return block

  const flatProfiles: JsonRecord[] = []
  const flatDepartments = departments.map((department) => {
    const id = asTrimmedString(department.id)
    if (!id) throw new Error(`${location}: department is missing its stable row ID.`)

    const nestedProfiles = Array.isArray(department.profiles) ? department.profiles : []
    for (const profile of nestedProfiles) {
      if (!isRecord(profile)) throw new Error(`${location}: profile row is invalid.`)
      flatProfiles.push({ ...profile, departmentId: id })
    }

    const { profiles: _profiles, ...departmentWithoutProfiles } = department
    return departmentWithoutProfiles
  })
  const { profiles: _legacyProfiles, ...blockWithoutLegacyProfiles } = block

  return {
    ...blockWithoutLegacyProfiles,
    departments: flatDepartments,
    profiles: flatProfiles,
  }
}

export const transformDepartmentProfilesLayout = (
  layout: unknown,
  direction: MigrationDirection,
  location: string,
): LayoutTransformResult => {
  if (!Array.isArray(layout)) return { changed: false, layout: [] }

  let changed = false
  const migratedLayout = layout.map((value, index) => {
    if (!isRecord(value) || value.blockType !== 'departmentProfiles') return value

    const migrated =
      direction === 'up'
        ? migrateBlockUp(value, `${location}[${index}]`)
        : migrateBlockDown(value, `${location}[${index}]`)
    if (migrated !== value) changed = true
    return migrated
  })

  return changed ? { changed: true, layout: migratedLayout } : { changed: false, layout }
}

const getLayout = (document: JsonRecord, path: MigrationTarget['path']): unknown => {
  if (path === 'layout') return document.layout
  return isRecord(document.version) ? document.version.layout : undefined
}

const getTargets = ({ payload }: MigrationArgs): MigrationTarget[] => [
  {
    label: 'pages',
    model: payload.db.collections.pages as unknown as MigrationModel,
    path: 'layout',
    query: { 'layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'page versions',
    model: payload.db.versions.pages as unknown as MigrationModel,
    path: 'version.layout',
    query: { 'version.layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'reusable-sections',
    model: payload.db.collections['reusable-sections'] as unknown as MigrationModel,
    path: 'layout',
    query: { 'layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'reusable-section versions',
    model: payload.db.versions['reusable-sections'] as unknown as MigrationModel,
    path: 'version.layout',
    query: { 'version.layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'news-events-detail-template',
    model: payload.db.globals as unknown as MigrationModel,
    path: 'layout',
    query: {
      globalType: 'news-events-detail-template',
      'layout.blockType': 'departmentProfiles',
    },
  },
  {
    label: 'news-events-detail-template versions',
    model: payload.db.versions['news-events-detail-template'] as unknown as MigrationModel,
    path: 'version.layout',
    query: { 'version.layout.blockType': 'departmentProfiles' },
  },
]

const migrateStoredLayouts = async (
  args: MigrationArgs,
  direction: MigrationDirection,
): Promise<void> => {
  const { session } = args
  const preparedTargets: PreparedTarget[] = []

  for (const target of getTargets(args)) {
    const documents = await target.model
      .find(target.query)
      .session(session as never)
      .lean()
      .exec()
    const changes: PreparedTarget['changes'] = []

    for (const document of documents) {
      const id = document._id
      if (id == null) throw new Error(`${target.label}: document is missing its MongoDB ID.`)

      const transformed = transformDepartmentProfilesLayout(
        getLayout(document, target.path),
        direction,
        `${target.label}:${String(id)}.${target.path}`,
      )
      if (transformed.changed) changes.push({ id, layout: transformed.layout })
    }

    preparedTargets.push({ changes, target })
  }

  for (const { changes, target } of preparedTargets) {
    if (changes.length === 0) continue

    await target.model.bulkWrite(
      changes.map(({ id, layout }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { [target.path]: layout } },
        },
      })),
      { session: session as never },
    )
  }
}

export async function up(args: MigrateUpArgs): Promise<void> {
  await migrateStoredLayouts(args, 'up')
}

export async function down(args: MigrateDownArgs): Promise<void> {
  await migrateStoredLayouts(args, 'down')
}
