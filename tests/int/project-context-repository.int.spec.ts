import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  buildProjectInventory,
  validateProjectContracts,
} from '../../.agents/skills/project-context/scripts/project-context-lib.mjs'

describe('project context repository contract', () => {
  it('routes directly to every canonical reference and completion command', () => {
    const skill = readFileSync('.agents/skills/project-context/SKILL.md', 'utf8')

    for (const reference of [
      'references/architecture.md',
      'references/payload-model.md',
      'references/block-system.md',
      'references/change-impact-map.md',
      'references/project-inventory.json',
    ]) {
      expect(skill).toContain(reference)
      expect(existsSync(`.agents/skills/project-context/${reference}`)).toBe(true)
    }

    expect(skill).toContain('pnpm project-context:update')
    expect(skill).toContain('pnpm project-context:check')
  })

  it('passes all source-derived contracts', async () => {
    const inventory = await buildProjectInventory(process.cwd())
    const result = await validateProjectContracts(process.cwd(), inventory)

    expect(result.errors).toEqual([])
  })

  it('keeps maintained Page block and global counts aligned with source', async () => {
    const inventory = await buildProjectInventory(process.cwd())
    const readme = readFileSync('README.md', 'utf8')
    const featureInventory = readFileSync('docs/architecture/feature-inventory.md', 'utf8')

    expect(readme).toContain(`${inventory.blocks.page.length} selectable Page blocks`)
    expect(readme).toContain(`${inventory.payload.globals.length} globals own`)
    expect(featureInventory).toContain(`${inventory.blocks.page.length}-block layouts`)
    expect(featureInventory).toContain('Icon Card Showcase')
    expect(featureInventory).toContain('| Configuration | Search Settings')
  })
})
