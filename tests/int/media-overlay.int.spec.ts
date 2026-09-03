import { describe, expect, it } from 'vitest'

import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'
import {
  mediaOverlayTextClasses,
  normalizeMediaOverlayCoverage,
  normalizeMediaOverlayDirection,
  normalizeMediaOverlayStrength,
  resolveMediaOverlay,
  resolveMediaOverlayTone,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'

describe('shared media overlay fields', () => {
  it('defines one consistent tone, strength, direction, and coverage vocabulary', () => {
    expect(createMediaOverlayToneField()).toMatchObject({
      name: 'themeMode',
      label: 'Overlay Tone',
      defaultValue: 'auto',
      options: [{ value: 'auto' }, { value: 'light' }, { value: 'dark' }, { value: 'brand' }],
      required: true,
    })
    expect(createMediaOverlayStrengthField()).toMatchObject({
      name: 'overlayStyle',
      label: 'Overlay Strength',
      defaultValue: 'dark',
      options: [{ value: 'light' }, { value: 'dark' }, { value: 'darker' }],
      required: true,
    })
    expect(createMediaOverlayDirectionField()).toMatchObject({
      name: 'overlayDirection',
      label: 'Overlay Direction',
      defaultValue: 'vertical',
      options: [
        { value: 'vertical' },
        { value: 'leftToRight' },
        { value: 'rightToLeft' },
        { value: 'bottomToTop' },
        { value: 'topToBottom' },
      ],
      required: true,
    })
    expect(createMediaOverlayCoverageField()).toMatchObject({
      name: 'overlayCoverage',
      label: 'Overlay Coverage',
      defaultValue: 'full',
      options: [{ value: 'full' }, { value: 'split' }],
      required: true,
    })
  })

  it('allows card blocks to retain their storage keys and defaults', () => {
    expect(
      createMediaOverlayStrengthField({ defaultValue: 'darker', name: 'overlayStrength' }),
    ).toMatchObject({ defaultValue: 'darker', name: 'overlayStrength' })
    expect(createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' })).toMatchObject({
      defaultValue: 'bottomToTop',
    })
    expect(createMediaOverlayToneField({ required: false })).toMatchObject({ required: false })
  })
})

describe('shared media overlay presentation', () => {
  it('uses the theme foreground contract for every Light overlay text role', () => {
    expect(mediaOverlayTextClasses.light).toEqual({
      title: 'text-light-overlay-foreground',
      secondary: 'text-light-overlay-foreground',
      eyebrow: 'text-light-overlay-foreground',
      link: 'text-light-overlay-foreground',
    })
  })

  it('uses Brand automatically on brand surfaces and Dark elsewhere', () => {
    expect(resolveMediaOverlayTone('auto', 'brand')).toBe('brand')
    expect(resolveMediaOverlayTone('auto', 'gradient-brand')).toBe('brand')
    expect(resolveMediaOverlayTone('auto', 'none')).toBe('dark')
    expect(resolveMediaOverlayTone('auto', 'subtle')).toBe('dark')
  })

  it('keeps explicit tones independent from the section surface', () => {
    expect(resolveMediaOverlayTone('light', 'brand')).toBe('light')
    expect(resolveMediaOverlayTone('dark', 'brand')).toBe('dark')
    expect(resolveMediaOverlayTone('brand', 'none')).toBe('brand')
  })

  it('normalizes legacy Student Experience strengths without invalid output', () => {
    expect(normalizeMediaOverlayStrength('soft')).toBe('light')
    expect(normalizeMediaOverlayStrength('default')).toBe('dark')
    expect(normalizeMediaOverlayStrength('strong')).toBe('darker')
    expect(normalizeMediaOverlayStrength('unknown')).toBe('dark')
    expect(normalizeMediaOverlayStrength('constructor')).toBe('dark')
    expect(normalizeMediaOverlayDirection('unknown', 'bottomToTop')).toBe('bottomToTop')
    expect(normalizeMediaOverlayCoverage('split', 'leftToRight')).toBe('split')
    expect(normalizeMediaOverlayCoverage('split', 'vertical')).toBe('full')
  })

  it('gives every supported combination a tint and readable text contract', () => {
    const tones: MediaOverlayTone[] = ['auto', 'light', 'dark', 'brand']
    const strengths: MediaOverlayStrength[] = ['light', 'dark', 'darker']
    const coverages: MediaOverlayCoverage[] = ['full', 'split']
    const directions: MediaOverlayDirection[] = [
      'vertical',
      'leftToRight',
      'rightToLeft',
      'bottomToTop',
      'topToBottom',
    ]

    for (const tone of tones) {
      for (const strength of strengths) {
        for (const direction of directions) {
          for (const coverage of coverages) {
            const resolved = resolveMediaOverlay({ coverage, direction, strength, tone })

            expect(resolved.className).toContain('bg-')
            expect(resolved.text.title).toMatch(/^text-/)
            expect(resolved.direction).toBe(direction)
            expect(resolved.strength).toBe(strength)
            expect(resolved.coverage).toBe(direction === 'vertical' ? 'full' : coverage)
          }
        }
      }
    }
  })

  it('distinguishes even coverage from top and bottom emphasis', () => {
    expect(resolveMediaOverlay({ direction: 'vertical', tone: 'dark' }).className).toBe(
      'bg-black/74',
    )
    expect(resolveMediaOverlay({ direction: 'bottomToTop', tone: 'dark' }).className).toBe(
      'bg-linear-to-t from-black/86 via-black/64 to-transparent',
    )
    expect(resolveMediaOverlay({ direction: 'topToBottom', tone: 'brand' }).className).toBe(
      'bg-linear-to-b from-primary/92 via-primary/70 to-transparent',
    )
  })

  it('keeps Brand color independent from direction and limits split gradients to one half', () => {
    const even = resolveMediaOverlay({ direction: 'vertical', tone: 'brand' })
    const left = resolveMediaOverlay({ direction: 'leftToRight', tone: 'brand' })
    const rightSplit = resolveMediaOverlay({
      coverage: 'split',
      direction: 'rightToLeft',
      tone: 'brand',
    })

    expect(even.className).toBe('bg-primary/86')
    expect(left.className).toContain('bg-linear-to-r')
    expect(rightSplit.className).toContain('bg-linear-to-l')
    expect(rightSplit.frameClassName).toBe('inset-y-0 right-0 w-1/2')
    expect(rightSplit.className).toContain('to-transparent')
  })

  it('keeps explicit Light and Dark tones stable across the site color mode', () => {
    expect(resolveMediaOverlay({ tone: 'light' })).toMatchObject({
      blockSurface: 'lightOverlay',
      eyebrowSurface: 'lightOverlay',
      text: { title: 'text-light-overlay-foreground' },
    })
    expect(resolveMediaOverlay({ tone: 'dark' })).toMatchObject({
      blockSurface: 'darkOverlay',
      eyebrowSurface: 'darkOverlay',
      text: { title: 'text-white' },
    })
  })
})
