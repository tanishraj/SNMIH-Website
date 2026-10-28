import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  extractArrayPropertyIdentifiers,
  extractBlockDefinition,
  extractBlockGroupIdentifiers,
  extractExportedObjectKeys,
  extractImports,
  extractSwitchCases,
  extractThumbnailDefinitions,
  getNarrativeReviewWarnings,
  buildProjectInventory,
  stableStringify,
  validateProjectContracts,
  validateSkillReferences,
  writeProjectInventory,
} from '../../.agents/skills/project-context/scripts/project-context-lib.mjs'

const importFixture = `
  import { Pages } from './collections/Pages'
  import { Articles } from './collections/Articles'
`

const configFixture = `${importFixture}
  export default buildConfig({ collections: [Pages, Articles] })
`

const blockFixture = `
  export const ExampleBlock: Block = {
    slug: 'example',
    interfaceName: 'ExampleBlock',
    fields: [],
  }
`

const groupedBlockCatalogFixture = `
  export const pageBlockGroupDefinitions = [
    { group: 'Start', blocks: [PageHeaderBlock, HeroBannerBlock] },
    { group: 'Advanced Library', blocks: [AnnouncementBlock] },
  ] as const
`

const systemFactoryFixture = `
  export const System404Block = createSystemPageBlock({
    fields: [],
    slug: 'system404',
  })
`

const thumbnailFixture = `
  export const definitions = [
    defineThumbnail({ slug: 'alpha', filename: 'alpha.jpg' }),
  ]
`

const fixtureObject = `
  export const blockThumbnailFixtures = {
    alpha: null,
    beta: null,
  }
`

describe('project context parser', () => {
  it('extracts imports and registered identifiers', () => {
    expect(extractImports(importFixture, 'src/payload.config.ts')).toEqual({
      Articles: './collections/Articles',
      Pages: './collections/Pages',
    })
    expect(
      extractArrayPropertyIdentifiers(configFixture, 'src/payload.config.ts', 'collections'),
    ).toEqual(['Pages', 'Articles'])
  })

  it('extracts object and factory-created block identities', () => {
    expect(extractBlockDefinition(blockFixture, 'src/blocks/Example/config.ts')).toEqual({
      configPath: 'src/blocks/Example/config.ts',
      interfaceName: 'ExampleBlock',
      slug: 'example',
      symbol: 'ExampleBlock',
    })
    expect(extractBlockDefinition(systemFactoryFixture, 'src/blocks/System404/config.ts')).toEqual({
      configPath: 'src/blocks/System404/config.ts',
      interfaceName: 'System404Block',
      slug: 'system404',
      symbol: 'System404Block',
    })
  })

  it('extracts canonical grouped block registries in drawer order', () => {
    expect(
      extractBlockGroupIdentifiers(
        groupedBlockCatalogFixture,
        'src/blocks/blockCatalog.ts',
        'pageBlockGroupDefinitions',
      ),
    ).toEqual(['PageHeaderBlock', 'HeroBannerBlock', 'AnnouncementBlock'])
  })

  it('extracts renderer, thumbnail, and fixture coverage', () => {
    expect(extractSwitchCases("case 'alpha': break; case 'beta': break")).toEqual(['alpha', 'beta'])
    expect(extractThumbnailDefinitions(thumbnailFixture, 'definitions.ts')).toEqual([
      { filename: 'alpha.jpg', slug: 'alpha' },
    ])
    expect(
      extractExportedObjectKeys(fixtureObject, 'fixtures.tsx', 'blockThumbnailFixtures'),
    ).toEqual(['alpha', 'beta'])
  })

  it('serializes object keys deterministically without reordering arrays', () => {
    expect(stableStringify({ z: 1, a: { d: 2, b: 1 }, rows: ['b', 'a'] })).toBe(
      '{\n  "a": {\n    "b": 1,\n    "d": 2\n  },\n  "rows": [\n    "b",\n    "a"\n  ],\n  "z": 1\n}\n',
    )
  })

  it('builds the current registered Payload and block inventory', async () => {
    const inventory = await buildProjectInventory(process.cwd())

    expect(inventory.schemaVersion).toBe(1)
    expect(inventory.knowledgeGraph).toBeNull()
    expect(inventory.payload.collections).toHaveLength(26)
    expect(inventory.payload.globals).toHaveLength(9)
    expect(inventory.blocks.page).toHaveLength(63)
    expect(inventory.blocks.page).toEqual(expect.arrayContaining(['logos20', 'integration23']))
    expect(inventory.blocks.page).toContain('pgFeeStructure')
    expect(inventory.blocks.reusableSection).toEqual(
      inventory.blocks.page.filter((slug: string) => slug !== 'reusableSection'),
    )
    expect(inventory.blocks.header).toEqual(['headerNavbar12'])
    expect(inventory.blocks.footer).toEqual(['footer56', 'footerMinimal'])
    expect(inventory.blocks.systemPage).toEqual([
      'system404',
      'systemMaintenance',
      'systemComingSoon',
    ])
  })

  it('writes stable inventory and leaves no temporary sibling', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'project-context-'))
    const target = path.join(directory, 'inventory.json')

    await writeFile(target, '{"old":true}\n')
    await writeProjectInventory(directory, { schemaVersion: 1, value: 'stable' }, target)

    expect(await readFile(target, 'utf8')).toBe(
      '{\n  "schemaVersion": 1,\n  "value": "stable"\n}\n',
    )
    await expect(readFile(`${target}.tmp`, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('names duplicate and missing block contracts', async () => {
    const inventory = await buildProjectInventory(process.cwd())
    const broken = structuredClone(inventory)

    broken.blocks.page.push(broken.blocks.page[0])
    broken.blocks.productionRenderer = broken.blocks.productionRenderer.filter(
      (slug: string) => slug !== 'contentHighlights',
    )

    const result = await validateProjectContracts(process.cwd(), broken)

    expect(result.errors).toContain(`Duplicate Page block slug: ${broken.blocks.page[0]}`)
    expect(result.errors).toContain(
      'Page block contentHighlights is missing from src/blocks/renderPageBlocks.tsx',
    )
  })

  it('treats stale knowledge graph metadata as a warning', async () => {
    const inventory = {
      ...(await buildProjectInventory(process.cwd())),
      knowledgeGraph: {
        analyzedFiles: 0,
        gitCommitHash: 'stale-commit',
        lastAnalyzedAt: '2026-01-01T00:00:00.000Z',
      },
    }

    const result = await validateProjectContracts(process.cwd(), inventory, {
      gitHead: 'current-commit',
    })

    expect(result.errors).toEqual([])
    expect(result.warnings).toContain(
      'Knowledge graph is stale: analyzed stale-commit, current current-commit.',
    )
  })

  it('warns when changed block files have no narrative review', () => {
    expect(getNarrativeReviewWarnings(['src/blocks/Example/config.ts'])).toEqual([
      'block system files changed; review .agents/skills/project-context/references/block-system.md and update it if the project contract changed.',
    ])
    expect(
      getNarrativeReviewWarnings([
        'src/blocks/Example/config.ts',
        '.agents/skills/project-context/references/block-system.md',
      ]),
    ).toEqual([])
  })

  it('reports broken local Markdown references', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'project-context-links-'))
    const skillRoot = path.join(projectRoot, '.agents/skills/project-context')

    await mkdir(skillRoot, { recursive: true })
    await writeFile(
      path.join(skillRoot, 'SKILL.md'),
      '# Fixture\n\n[Missing](references/missing.md)\n',
    )

    const errors = await validateSkillReferences(projectRoot)

    expect(errors).toContain(
      'Broken project-context reference: references/missing.md from SKILL.md.',
    )
  })
})
