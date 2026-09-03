#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkProjectContext } from './project-context-lib.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '../../../..')

try {
  const { errors, warnings } = await checkProjectContext(projectRoot)

  for (const warning of warnings) {
    process.stderr.write(`Warning: ${warning}\n`)
  }

  for (const error of errors) {
    process.stderr.write(`Error: ${error}\n`)
  }

  if (errors.length > 0) {
    process.exitCode = 1
  } else {
    process.stdout.write('Project context is current.\n')
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)

  process.stderr.write(`Project context check failed: ${message}\n`)
  process.exitCode = 1
}
