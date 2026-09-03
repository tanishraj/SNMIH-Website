import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const layoutSource = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')
const globalStyles = readFileSync('src/styles/globals.css', 'utf8')

describe('public font delivery', () => {
  it('uses next/font variables for every semantic family', () => {
    expect(layoutSource).toContain("from 'next/font/google'")
    expect(layoutSource).toContain("variable: '--font-inter'")
    expect(layoutSource).toContain("variable: '--font-playfair-display'")
    expect(layoutSource).toContain("variable: '--font-ibm-plex-mono'")
    expect(globalStyles).toContain('var(--font-inter)')
    expect(globalStyles).toContain('var(--font-playfair-display)')
    expect(globalStyles).toContain('var(--font-ibm-plex-mono)')
  })

  it('contains no runtime Google Fonts stylesheet imports', () => {
    expect(globalStyles).not.toContain('fonts.googleapis.com')
    expect(globalStyles).not.toContain('fonts.gstatic.com')
  })
})
