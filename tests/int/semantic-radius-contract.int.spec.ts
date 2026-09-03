import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const publicRoots = [
  'src/app/(frontend)',
  'src/blocks',
  'src/components',
  'src/styles',
] as const

const sourceExtensions = new Set(['.css', '.ts', '.tsx'])

const walk = (root: string): string[] => {
  if (!fs.existsSync(root)) return []

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(root, entry.name)
    const relativePath = path.relative(process.cwd(), absolutePath)

    if (relativePath.startsWith('src/components/admin/')) return []
    if (entry.isDirectory()) return walk(absolutePath)

    return sourceExtensions.has(path.extname(entry.name)) ? [absolutePath] : []
  })
}

const bannedPatterns = [
  /\brounded(?:-[trblse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)\b/g,
  /\brounded(?:-[trblse]{1,2})?-(?:\[(?:calc\()?var\(--radius\)[^\]]*\]|\(--radius\))/g,
  /(?<![-\w])rounded(?=[\s"'`])/g,
] as const

describe('semantic radius contract', () => {
  it('uses semantic radius roles throughout the public frontend', () => {
    const violations = publicRoots.flatMap((root) =>
      walk(path.resolve(process.cwd(), root)).flatMap((absolutePath) => {
        const source = fs.readFileSync(absolutePath, 'utf8')
        const relativePath = path.relative(process.cwd(), absolutePath)

        return bannedPatterns.flatMap((pattern) => {
          pattern.lastIndex = 0

          return [...source.matchAll(pattern)].map(
            (match) => `${relativePath}: ${match[0]}`,
          )
        })
      }),
    )

    expect(violations).toEqual([])
  })
})
