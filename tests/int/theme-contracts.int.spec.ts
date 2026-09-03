import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { contrastRatio, parseOklch } from '../helpers/oklchContrast'

const themes = ['snmih-green', 'snmih-blue'] as const
const contrastPairs = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['success', 'success-foreground'],
  ['primary', 'background'],
] as const

type ThemeMode = 'dark' | 'light'

const readTheme = (theme: (typeof themes)[number]) =>
  fs
    .readFileSync(path.resolve(process.cwd(), `src/styles/themes/theme-${theme}.css`), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')

const readTokenBlocks = (source: string) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    declarations: match[2],
    selector: match[1].trim(),
  }))

const getModeTokens = (theme: (typeof themes)[number], mode: ThemeMode): Record<string, string> => {
  const expectedSelector = `data-theme-color='${theme}'`
  const block = readTokenBlocks(readTheme(theme)).find(({ selector }) => {
    const isDark = selector.includes('.dark')

    return selector.includes(expectedSelector) && (mode === 'dark' ? isDark : !isDark)
  })

  if (!block) {
    throw new Error(`Missing ${mode} token block for ${theme}.`)
  }

  return Object.fromEntries(
    [...block.declarations.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  )
}

const expectOklchTokens = (actual: Record<string, string>, expected: Record<string, string>) => {
  for (const [token, expectedValue] of Object.entries(expected)) {
    expect(actual[token], `Missing --${token}`).toBeDefined()
    expect(parseOklch(actual[token]), token).toEqual(parseOklch(expectedValue))
  }
}

describe('website theme contracts', () => {
  it('lets the Card shell own theme-aligned corner clipping', () => {
    const cardSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/card.tsx'),
      'utf8',
    )

    expect(cardSource).toContain('overflow-hidden rounded-card')
    expect(cardSource).not.toContain('rounded-[var(--radius)]')
    expect(cardSource).not.toContain('rounded-4xl')
    expect(cardSource).not.toContain('*:[img:first-child]:rounded-t-4xl')
    expect(cardSource).not.toContain('*:[img:last-child]:rounded-b-4xl')
  })

  it.each(themes)('keeps Calendar accents distinguishable on %s Card surfaces', (theme) => {
    const calendarTokens = {
      light: [
        'oklch(0.48 0.15 145)',
        'oklch(0.46 0.16 260)',
        'oklch(0.47 0.11 220)',
        'oklch(0.5 0.12 75)',
        'oklch(0.46 0.16 300)',
      ],
      dark: [
        'oklch(0.74 0.16 145)',
        'oklch(0.72 0.16 260)',
        'oklch(0.74 0.12 220)',
        'oklch(0.78 0.14 75)',
        'oklch(0.74 0.15 300)',
      ],
    } as const

    for (const mode of ['light', 'dark'] as const) {
      const card = parseOklch(getModeTokens(theme, mode).card)
      for (const token of calendarTokens[mode]) {
        expect(contrastRatio(card, parseOklch(token))).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it.each(themes)('isolates the %s theme tokens to its root selector', (theme) => {
    const source = readTheme(theme)
    const tokenBlocks = readTokenBlocks(source).filter(({ declarations }) =>
      declarations.includes('--background:'),
    )

    expect(tokenBlocks).toHaveLength(2)

    for (const { selector } of tokenBlocks) {
      const selectors = selector.split(',').map((item) => item.trim())

      if (theme === 'snmih-blue') {
        for (const item of selectors) {
          expect(item).toMatch(/data-theme-color='snmih-blue'|:root:not\(\[data-theme-color\]\)/)
        }
      } else {
        for (const item of selectors) {
          expect(item).toContain(`data-theme-color='${theme}'`)
          expect(item).not.toContain(':root:not([data-theme-color])')
        }
      }
    }
  })

  it.each(themes)('meets semantic color contrast in the %s theme', (theme) => {
    for (const mode of ['light', 'dark'] as const) {
      const tokens = getModeTokens(theme, mode)

      for (const [surface, content] of contrastPairs) {
        expect(tokens[surface], `${theme} ${mode} is missing --${surface}`).toBeDefined()
        expect(tokens[content], `${theme} ${mode} is missing --${content}`).toBeDefined()

        const ratio = contrastRatio(parseOklch(tokens[surface]), parseOklch(tokens[content]))

        expect(
          ratio,
          `${theme} ${mode} --${surface}/--${content} contrast is ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it.each(themes)('keeps Light media overlays readable in both %s modes', (theme) => {
    const white = parseOklch('oklch(1 0 0)')

    for (const mode of ['light', 'dark'] as const) {
      const tokens = getModeTokens(theme, mode)
      const overlayForeground = tokens['light-overlay-foreground']

      expect(
        overlayForeground,
        `${theme} ${mode} is missing --light-overlay-foreground`,
      ).toBeDefined()

      const ratio = contrastRatio(parseOklch(overlayForeground), white)

      expect(
        ratio,
        `${theme} ${mode} Light overlay foreground contrast is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('uses the approved SNMIH-Blue brand palette in both modes', () => {
    const light = getModeTokens('snmih-blue', 'light')
    const dark = getModeTokens('snmih-blue', 'dark')

    expectOklchTokens(light, {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.2322 0.0575 258.39)',
      primary: 'oklch(0.2901 0.1025 259.53)',
      'primary-foreground': 'oklch(0.984152 0.003413 247.858)',
      secondary: 'oklch(0.947186 0.013730 258.345)',
      muted: 'oklch(0.9735 0.0076 241.66)',
      accent: 'oklch(0.925732 0.024723 251.905)',
      border: 'oklch(0.9242 0.0139 247.98)',
      ring: 'oklch(0.8018 0.1024 148.89)',
    })
    expectOklchTokens(dark, {
      background: 'oklch(0.176997 0.032292 258.683)',
      foreground: 'oklch(0.974538 0.007928 253.852)',
      card: 'oklch(0.216127 0.040176 256.770)',
      primary: 'oklch(0.769267 0.085353 254.774)',
      'primary-foreground': 'oklch(0.2901 0.1025 259.53)',
      secondary: 'oklch(0.274249 0.048665 256.289)',
      muted: 'oklch(0.251364 0.046287 259.131)',
      accent: 'oklch(0.325710 0.063155 255.477)',
      border: 'oklch(0.351576 0.044540 255.167)',
      ring: 'oklch(0.8018 0.1024 148.89)',
    })
  })

  it('uses the institutional green action palette and restrained radius', () => {
    const light = getModeTokens('snmih-green', 'light')
    const dark = getModeTokens('snmih-green', 'dark')

    expectOklchTokens(light, {
      primary: 'oklch(0.53 0.1415 147.76)',
      'primary-foreground': 'oklch(1 0 0)',
      secondary: 'oklch(0.96 0.025 148)',
      'secondary-foreground': 'oklch(0.245 0.055 150)',
      accent: 'oklch(0.925 0.05 148)',
      'accent-foreground': 'oklch(0.245 0.055 150)',
      ring: 'oklch(0.53 0.1415 147.76)',
    })
    expect(light.radius).toBe('0.75rem')

    expectOklchTokens(dark, {
      primary: 'oklch(0.6608 0.1598 139.63)',
      'primary-foreground': 'oklch(0.16 0.03 150)',
      secondary: 'oklch(0.274 0.025 150)',
      accent: 'oklch(0.31 0.045 148)',
      ring: 'oklch(0.8018 0.1024 148.89)',
    })
    expect(dark.radius).toBe('0.75rem')
  })

  it('uses primary as the only brand action token and a capped semantic radius scale', () => {
    const globalsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/styles/globals.css'),
      'utf8',
    )

    expect(globalsSource).not.toContain('--color-link:')
    expect(globalsSource).toContain('--color-success-foreground: var(--success-foreground);')
    expect(globalsSource).toContain(
      '--color-light-overlay-foreground: var(--light-overlay-foreground);',
    )
    for (const tone of ['green', 'blue', 'cyan', 'amber', 'violet']) {
      expect(globalsSource).toContain(`--calendar-${tone}: oklch(`)
      expect(globalsSource).toContain(`--color-calendar-${tone}: var(--calendar-${tone});`)
    }
    expect(globalsSource).toContain('--radius-card: min(var(--radius, 0.625rem), 0.75rem);')
    expect(globalsSource).toContain('--radius-control: min(var(--radius, 0.625rem), 0.75rem);')
    expect(globalsSource).toContain(
      '--radius-compact: min(calc(var(--radius, 0.625rem) * 0.5), 0.25rem);',
    )
    expect(globalsSource).not.toMatch(/--radius-(?:xs|sm|md|lg|xl|2xl|3xl|4xl):/)
  })

  it('uses the semantic link, radius, and filled-action hover contracts', () => {
    const buttonSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/button.tsx'),
      'utf8',
    )
    const checkboxSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/checkbox.tsx'),
      'utf8',
    )
    const tabsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/shared/contentTabRail.ts'),
      'utf8',
    )
    const uiTabsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/tabs.tsx'),
      'utf8',
    )
    const richTextSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/rich-text/richTextStyles.ts'),
      'utf8',
    )

    expect(buttonSource).toContain(
      'hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_8%)]',
    )
    expect(buttonSource).toContain("link: 'text-primary underline-offset-4 hover:underline'")
    expect(checkboxSource).toContain('rounded-compact')
    expect(checkboxSource).not.toContain('rounded-[5px]')
    expect(tabsSource).toContain("'border-primary text-primary'")
    expect(tabsSource).toContain("'border-primary-foreground text-primary-foreground'")
    expect(uiTabsSource).toContain(
      'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
    )
    expect(uiTabsSource).toContain(
      'group-data-[variant=line]/tabs-list:data-[state=active]:text-primary',
    )
    expect(uiTabsSource).toContain(
      'group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
    )
    expect(richTextSource).toContain('prose-a:text-primary')
  })
})
