import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { ThemeSettings } from '@/globals/ThemeSettings'
import {
  defaultWebsiteTheme,
  isWebsiteTheme,
  normalizeWebsiteTheme,
  websiteThemeOptions,
  websiteThemeValues,
} from '@/lib/themes/websiteThemes'

type ThemeField = {
  defaultValue?: unknown
  name: string
  options?: Array<{ label: string; value: string }>
}

const getThemeField = () => {
  const field = ThemeSettings.fields.find(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'name' in candidate &&
      candidate.name === 'themeColor',
  ) as ThemeField | undefined

  if (!field) {
    throw new Error('Expected themeColor field to exist.')
  }

  return field
}

describe('website theme registry', () => {
  it('exports only the two explicit SNMIH themes and normalizes legacy values', () => {
    expect(defaultWebsiteTheme).toBe('snmih-blue')
    expect(websiteThemeValues).toEqual(['snmih-green', 'snmih-blue'])
    expect(websiteThemeOptions).toEqual([
      { label: 'SNMIH-Green', value: 'snmih-green' },
      { label: 'SNMIH-Blue', value: 'snmih-blue' },
    ])

    expect(isWebsiteTheme('snmih-green')).toBe(true)
    expect(isWebsiteTheme('snmih-blue')).toBe(true)
    expect(isWebsiteTheme('default')).toBe(false)
    expect(isWebsiteTheme('snmih')).toBe(false)

    expect(normalizeWebsiteTheme('snmih-green')).toBe('snmih-green')
    expect(normalizeWebsiteTheme('snmih-blue')).toBe('snmih-blue')
    expect(normalizeWebsiteTheme('default')).toBe('snmih-green')
    expect(normalizeWebsiteTheme('snmih')).toBe('snmih-blue')
    expect(normalizeWebsiteTheme('sunset')).toBe('snmih-blue')
    expect(normalizeWebsiteTheme(undefined)).toBe('snmih-blue')
    expect(normalizeWebsiteTheme(null)).toBe('snmih-blue')
  })

  it('loads only the explicit SNMIH token presets with Blue as the CSS fallback', () => {
    const globalsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/styles/globals.css'),
      'utf8',
    )
    const greenSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/styles/themes/theme-snmih-green.css'),
      'utf8',
    )
    const blueSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/styles/themes/theme-snmih-blue.css'),
      'utf8',
    )

    expect(globalsSource).toContain("@import './themes/theme-snmih-green.css';")
    expect(globalsSource).toContain("@import './themes/theme-snmih-blue.css';")
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/styles/themes/theme-default.css'))).toBe(
      false,
    )
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/styles/themes/theme-snmih.css'))).toBe(
      false,
    )
    for (const retiredTheme of ['sunset', 'blue', 'kodama']) {
      expect(globalsSource).not.toContain(`@import './themes/theme-${retiredTheme}.css';`)
      expect(
        fs.existsSync(path.resolve(process.cwd(), `src/styles/themes/theme-${retiredTheme}.css`)),
      ).toBe(false)
    }
    expect(greenSource).toContain(":root[data-theme-color='snmih-green'] {")
    expect(greenSource).not.toContain(':root:not([data-theme-color])')
    expect(blueSource).toContain(":root[data-theme-color='snmih-blue'] {")
    expect(blueSource).toContain(':root:not([data-theme-color])')
    expect(blueSource).toContain('--primary: oklch(0.2901 0.1025 259.53);')
    expect(blueSource).toContain('--primary: oklch(0.769267 0.085353 254.774);')
    expect(blueSource).toContain('--radius: 0.5rem;')
  })

  it('drives the Theme Settings select field from the shared registry', () => {
    const themeField = getThemeField()

    expect(themeField.defaultValue).toBe(defaultWebsiteTheme)
    expect(themeField.options).toEqual(websiteThemeOptions)
  })

  it('wires the frontend layout to the shared normalizer', () => {
    const layoutSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'),
      'utf8',
    )

    expect(layoutSource).toContain("from '@/lib/themes/websiteThemes'")
    expect(layoutSource).toContain('normalizeWebsiteTheme')
    expect(layoutSource).toContain(
      'const themeColor = normalizeWebsiteTheme(themeSettings.themeColor)',
    )
    expect(layoutSource).not.toContain('isWebsiteTheme(rawThemeColor)')
  })
})
