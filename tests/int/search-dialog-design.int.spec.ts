import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  path.resolve(process.cwd(), 'src/components/global/SearchDialog.tsx'),
  'utf8',
)

describe('global Search Dialog design contract', () => {
  it('keeps a compact command-palette footprint with a larger input hierarchy', () => {
    expect(source).toContain('w-full max-w-2xl')
    expect(source).toContain('gap-4 border-b border-border px-5 py-4 sm:px-6')
    expect(source).toContain(
      'min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-lg',
    )
  })

  it('uses readable result and guidance typography', () => {
    expect(source).toContain('truncate text-base font-medium text-foreground')
    expect(source).toContain('line-clamp-1 text-sm text-muted-foreground')
    expect(source).toContain('px-5 py-4 text-sm text-muted-foreground sm:px-6')
    expect(source).toContain('text-sm text-muted-foreground hover:text-foreground')
  })

  it('provides proportionate icons and an accessible close target', () => {
    expect(source).toContain('size-5 shrink-0 text-muted-foreground')
    expect(source).toContain(
      'flex size-9 shrink-0 items-center justify-center rounded-control text-muted-foreground',
    )
    expect(source).toContain('className="size-5"')
    expect(source).toContain('hidden items-center gap-4 sm:flex')
    expect(source.match(/inline-flex items-center gap-2/g)).toHaveLength(2)
    expect(source).not.toContain('ml-1 rounded-control border border-border')
  })
})
