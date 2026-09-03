import { describe, expect, it } from 'vitest'

import {
  getContentTabClasses,
  getContentTabRailClasses,
  type ContentTabSurface,
} from '@/blocks/shared/contentTabRail'

const surfaces: ContentTabSurface[] = ['light', 'brand']
const hasClass = (classes: string, className: string) =>
  classes.split(/\s+/).includes(className)

describe('shared content tab radius contract', () => {
  it.each(surfaces)('rounds the %s Contained rail and every trigger state', (surface) => {
    expect(hasClass(getContentTabRailClasses('contained', surface), 'rounded-control')).toBe(true)

    for (const active of [false, true]) {
      expect(hasClass(getContentTabClasses('contained', active, surface), 'rounded-control')).toBe(
        true,
      )
    }
  })

  it.each(surfaces)('keeps the %s Pill rail and triggers fully rounded', (surface) => {
    expect(hasClass(getContentTabRailClasses('pill', surface), 'rounded-full')).toBe(true)
    expect(hasClass(getContentTabRailClasses('pill', surface), 'rounded-control')).toBe(false)

    for (const active of [false, true]) {
      const classes = getContentTabClasses('pill', active, surface)

      expect(hasClass(classes, 'rounded-full')).toBe(true)
      expect(hasClass(classes, 'rounded-control')).toBe(false)
    }
  })

  it.each(surfaces)('keeps the %s Underline rail and triggers square', (surface) => {
    const railClasses = getContentTabRailClasses('underline', surface)

    expect(hasClass(railClasses, 'rounded-control')).toBe(false)
    expect(hasClass(railClasses, 'rounded-full')).toBe(false)

    for (const active of [false, true]) {
      const classes = getContentTabClasses('underline', active, surface)

      expect(hasClass(classes, 'rounded-control')).toBe(false)
      expect(hasClass(classes, 'rounded-full')).toBe(false)
    }
  })
})
