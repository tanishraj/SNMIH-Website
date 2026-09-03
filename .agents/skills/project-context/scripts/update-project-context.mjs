#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildProjectInventory, writeProjectInventory } from './project-context-lib.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../../../..')

try {
  const inventory = await buildProjectInventory(projectRoot)
  const target = await writeProjectInventory(projectRoot, inventory)

  process.stdout.write(`Updated ${path.relative(projectRoot, target)}\n`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)

  process.stderr.write(`Project context update failed: ${message}\n`)
  process.exitCode = 1
}
