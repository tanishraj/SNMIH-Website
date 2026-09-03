import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  path.resolve(process.cwd(), 'src/app/(frontend)/search/page.tsx'),
  'utf8',
)

describe('full Search page design contract', () => {
  it('uses the deployment theme instead of unrelated result palettes', () => {
    expect(source).not.toMatch(/(?:violet|sky|emerald|rose)-(?:100|300|700|950)/)
    expect(source).toContain('border-primary/20 bg-primary/10')
    expect(source).toContain('text-primary')
  })

  it('uses visible labels and decorative type icons', () => {
    expect(source).toContain('FileText')
    expect(source).toContain('Newspaper')
    expect(source).toContain('CalendarDays')
    expect(source).toContain('Star')
    expect(source).toContain('aria-hidden="true"')
    expect(source).toContain('{item.label}')
  })

  it('supports legacy suggestions and keyboard-visible chips', () => {
    expect(source).toContain('normalizeSuggestedSearchTerms')
    expect(source).toContain('data-search-suggestion="true"')
    expect(source).toContain('focus-visible:ring-2')
  })
})
