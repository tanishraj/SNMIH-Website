import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

describe('repository hygiene', () => {
  it('does not ship the starter example endpoint', () => {
    expect(existsSync('src/app/my-route/route.ts')).toBe(false)
  })

  it('excludes checked-in agent and preview tooling from product lint', () => {
    const source = readFileSync('eslint.config.mjs', 'utf8')

    expect(source).toContain("'.claude/**'")
    expect(source).toContain("'.superpowers/**'")
  })

  it('keeps database archives out of Git', () => {
    const trackedArchives = execFileSync('git', ['ls-files', 'backups/*.archive'], {
      encoding: 'utf8',
    }).trim()
    const gitignore = readFileSync('.gitignore', 'utf8')

    expect(trackedArchives).toBe('')
    expect(gitignore).toContain('/backups/')
    expect(gitignore).toContain('*.archive')
  })
})
