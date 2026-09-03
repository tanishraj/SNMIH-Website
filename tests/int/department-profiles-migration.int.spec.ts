import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import { describe, expect, it, vi } from 'vitest'

import { migrations } from '@/migrations'
import {
  down,
  transformDepartmentProfilesLayout,
  up,
} from '@/migrations/20260831_010000_nest_department_profiles'

type JsonRecord = Record<string, unknown>

const legacyLayout = [
  {
    blockType: 'departmentProfiles',
    departments: [
      { id: 'medicine', name: 'Medicine' },
      { id: 'anatomy', name: 'Anatomy' },
    ],
    profiles: [
      { departmentId: 'anatomy', id: 'a-1', name: 'Anatomy One' },
      { departmentId: 'medicine', id: 'm-1', name: 'Medicine One' },
      { departmentId: 'anatomy', id: 'a-2', name: 'Anatomy Two' },
    ],
  },
  { blockType: 'richText', id: 'untouched' },
]

const cloneLayout = (layout: unknown[]) => structuredClone(layout) as unknown[]

const createModel = (documents: JsonRecord[]) => {
  const exec = vi.fn().mockResolvedValue(documents)
  const lean = vi.fn(() => ({ exec }))
  const session = vi.fn(() => ({ lean }))
  const find = vi.fn(() => ({ session }))
  const bulkWrite = vi.fn().mockResolvedValue({ acknowledged: true })

  return {
    bulkWrite,
    exec,
    find,
    lean,
    model: { bulkWrite, find },
    session,
  }
}

const createArgs = (options?: {
  globalVersionLayout?: unknown[]
  pageLayout?: unknown[]
  sharedLayout?: unknown[]
}) => {
  const session = { id: 'department-profile-migration-session' }
  const pageLayout = options?.pageLayout ?? cloneLayout(legacyLayout)
  const sharedLayout = options?.sharedLayout ?? cloneLayout(legacyLayout)
  const globalVersionLayout = options?.globalVersionLayout ?? cloneLayout(legacyLayout)
  const models = {
    globals: createModel([
      {
        _id: 'news-template-current',
        globalType: 'news-events-detail-template',
        layout: cloneLayout(legacyLayout),
      },
    ]),
    globalVersions: createModel([
      {
        _id: 'news-template-version',
        version: { layout: globalVersionLayout },
      },
    ]),
    pages: createModel([{ _id: 'page-current', layout: pageLayout }]),
    pageVersions: createModel([
      { _id: 'page-version', version: { layout: cloneLayout(legacyLayout) } },
    ]),
    reusableSections: createModel([{ _id: 'section-current', layout: sharedLayout }]),
    reusableSectionVersions: createModel([
      { _id: 'section-version', version: { layout: cloneLayout(legacyLayout) } },
    ]),
  }
  const args = {
    payload: {
      db: {
        collections: {
          pages: models.pages.model,
          'reusable-sections': models.reusableSections.model,
        },
        globals: models.globals.model,
        versions: {
          pages: models.pageVersions.model,
          'reusable-sections': models.reusableSectionVersions.model,
          'news-events-detail-template': models.globalVersions.model,
        },
      },
    },
    req: {},
    session,
  } as unknown as MigrateUpArgs

  return { args, models, session }
}

const expectNestedProfiles = (layout: unknown[]) => {
  const block = layout[0] as {
    departments: Array<{ id: string; profiles: Array<Record<string, unknown>> }>
    profiles?: unknown
  }

  expect(block.profiles).toBeUndefined()
  expect(block.departments).toEqual([
    {
      id: 'medicine',
      name: 'Medicine',
      profiles: [{ id: 'm-1', name: 'Medicine One' }],
    },
    {
      id: 'anatomy',
      name: 'Anatomy',
      profiles: [
        { id: 'a-1', name: 'Anatomy One' },
        { id: 'a-2', name: 'Anatomy Two' },
      ],
    },
  ])
}

describe('Department Profiles nested authoring migration', () => {
  it('registers after the legal Pages migration', () => {
    expect(migrations.map(({ name }) => name)).toContain('20260831_010000_nest_department_profiles')
  })

  it('groups flat profiles by department and reverses in department order', () => {
    const untouchedBlock = legacyLayout[1]
    const migrated = transformDepartmentProfilesLayout(legacyLayout, 'up', 'test.layout')

    expect(migrated.changed).toBe(true)
    expectNestedProfiles(migrated.layout)
    expect(migrated.layout[1]).toBe(untouchedBlock)

    const repeatedUp = transformDepartmentProfilesLayout(migrated.layout, 'up', 'test.layout')
    expect(repeatedUp).toEqual({ changed: false, layout: migrated.layout })

    const restored = transformDepartmentProfilesLayout(migrated.layout, 'down', 'test.layout')
    expect(restored.changed).toBe(true)
    expect(restored.layout[0]).toEqual({
      blockType: 'departmentProfiles',
      departments: [
        { id: 'medicine', name: 'Medicine' },
        { id: 'anatomy', name: 'Anatomy' },
      ],
      profiles: [
        { departmentId: 'medicine', id: 'm-1', name: 'Medicine One' },
        { departmentId: 'anatomy', id: 'a-1', name: 'Anatomy One' },
        { departmentId: 'anatomy', id: 'a-2', name: 'Anatomy Two' },
      ],
    })

    const repeatedDown = transformDepartmentProfilesLayout(restored.layout, 'down', 'test.layout')
    expect(repeatedDown).toEqual({ changed: false, layout: restored.layout })
  })

  it('fails instead of dropping a profile assigned to a missing department', () => {
    expect(() =>
      transformDepartmentProfilesLayout(
        [
          {
            blockType: 'departmentProfiles',
            departments: [{ id: 'medicine', name: 'Medicine' }],
            profiles: [{ departmentId: 'missing', id: 'orphan', name: 'Orphan' }],
          },
        ],
        'up',
        'pages:page-1.layout',
      ),
    ).toThrow(/orphan.*missing department/i)
  })

  it('migrates current and versioned Pages, Reusable Sections, and the detail template', async () => {
    const { args, models, session } = createArgs()

    await up(args)

    expect(models.pages.find).toHaveBeenCalledWith({
      'layout.blockType': 'departmentProfiles',
    })
    expect(models.pageVersions.find).toHaveBeenCalledWith({
      'version.layout.blockType': 'departmentProfiles',
    })
    expect(models.reusableSections.find).toHaveBeenCalledWith({
      'layout.blockType': 'departmentProfiles',
    })
    expect(models.reusableSectionVersions.find).toHaveBeenCalledWith({
      'version.layout.blockType': 'departmentProfiles',
    })
    expect(models.globals.find).toHaveBeenCalledWith({
      globalType: 'news-events-detail-template',
      'layout.blockType': 'departmentProfiles',
    })
    expect(models.globalVersions.find).toHaveBeenCalledWith({
      'version.layout.blockType': 'departmentProfiles',
    })

    for (const model of Object.values(models)) {
      expect(model.session).toHaveBeenCalledWith(session)
      expect(model.bulkWrite).toHaveBeenCalledTimes(1)
    }

    const pageOperation = models.pages.bulkWrite.mock.calls[0]?.[0]?.[0]
    expect(pageOperation).toMatchObject({
      updateOne: {
        filter: { _id: 'page-current' },
        update: { $set: { layout: expect.any(Array) } },
      },
    })
    expectNestedProfiles(pageOperation.updateOne.update.$set.layout)

    const pageVersionOperation = models.pageVersions.bulkWrite.mock.calls[0]?.[0]?.[0]
    expect(pageVersionOperation).toMatchObject({
      updateOne: {
        filter: { _id: 'page-version' },
        update: { $set: { 'version.layout': expect.any(Array) } },
      },
    })
  })

  it('preflights every target before writing and skips unchanged targets', async () => {
    const unchangedLayout = [{ blockType: 'richText', id: 'unchanged' }]
    const orphanLayout = [
      {
        blockType: 'departmentProfiles',
        departments: [{ id: 'medicine', name: 'Medicine' }],
        profiles: [{ departmentId: 'missing', id: 'orphan', name: 'Orphan' }],
      },
    ]
    const failed = createArgs({ globalVersionLayout: orphanLayout })

    await expect(up(failed.args)).rejects.toThrow(/orphan.*missing department/i)
    for (const model of Object.values(failed.models)) {
      expect(model.bulkWrite).not.toHaveBeenCalled()
    }

    const unchanged = createArgs({ pageLayout: unchangedLayout })
    await up(unchanged.args)
    expect(unchanged.models.pages.bulkWrite).not.toHaveBeenCalled()
    expect(unchanged.models.pageVersions.bulkWrite).toHaveBeenCalledTimes(1)
  })

  it('runs the same six targets in reverse without truncating profiles', async () => {
    const nestedLayout = transformDepartmentProfilesLayout(
      cloneLayout(legacyLayout),
      'up',
      'fixture.layout',
    ).layout
    const { args, models } = createArgs({
      globalVersionLayout: cloneLayout(nestedLayout),
      pageLayout: cloneLayout(nestedLayout),
      sharedLayout: cloneLayout(nestedLayout),
    })

    models.globals.exec.mockResolvedValue([
      {
        _id: 'news-template-current',
        globalType: 'news-events-detail-template',
        layout: cloneLayout(nestedLayout),
      },
    ])
    models.pageVersions.exec.mockResolvedValue([
      { _id: 'page-version', version: { layout: cloneLayout(nestedLayout) } },
    ])
    models.reusableSectionVersions.exec.mockResolvedValue([
      { _id: 'section-version', version: { layout: cloneLayout(nestedLayout) } },
    ])

    await down(args as unknown as MigrateDownArgs)

    for (const model of Object.values(models)) {
      expect(model.bulkWrite).toHaveBeenCalledTimes(1)
    }

    const pageOperation = models.pages.bulkWrite.mock.calls[0]?.[0]?.[0]
    const restoredProfiles = pageOperation.updateOne.update.$set.layout[0].profiles
    expect(restoredProfiles.map(({ id }: { id: string }) => id)).toEqual(['m-1', 'a-1', 'a-2'])
  })
})
