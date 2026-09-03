import { describe, expect, it } from 'vitest'
import type { Block } from 'payload'

import { Footers } from '@/collections/Footers'
import { Headers } from '@/collections/Headers'
import { Pages } from '@/collections/Pages'
import { SystemPages } from '@/collections/SystemPages'

const collectBlocks = (fields: unknown[]): Block[] =>
  fields.flatMap((field) => {
    if (!field || typeof field !== 'object') return []

    const direct =
      'blocks' in field && Array.isArray(field.blocks) ? (field.blocks as Block[]) : []
    const nested =
      'fields' in field && Array.isArray(field.fields) ? collectBlocks(field.fields) : []
    const tabs =
      'tabs' in field && Array.isArray(field.tabs)
        ? field.tabs.flatMap((tab) =>
            tab &&
            typeof tab === 'object' &&
            'fields' in tab &&
            Array.isArray(tab.fields)
              ? collectBlocks(tab.fields)
              : [],
          )
        : []

    return [...direct, ...nested, ...tabs]
  })

const collectTabLabels = (fields: unknown[]): string[] =>
  fields.flatMap((field) => {
    if (!field || typeof field !== 'object') return []

    const nested =
      'fields' in field && Array.isArray(field.fields) ? collectTabLabels(field.fields) : []
    const tabs =
      'tabs' in field && Array.isArray(field.tabs)
        ? field.tabs.flatMap((tab) => {
            if (!tab || typeof tab !== 'object') return []
            const label = 'label' in tab && typeof tab.label === 'string' ? [tab.label] : []
            const tabFields =
              'fields' in tab && Array.isArray(tab.fields) ? collectTabLabels(tab.fields) : []

            return [...label, ...tabFields]
          })
        : []

    return [...tabs, ...nested]
  })

const registeredBlocks = [Pages, Headers, Footers, SystemPages]
  .flatMap((collection) => collectBlocks(collection.fields))
  .filter((block) => block.slug !== 'reusableSection')

describe('block Content and Theme Settings tabs', () => {
  it('uses the same top-level tabs for every configurable visual block', () => {
    expect(registeredBlocks.length).toBeGreaterThan(40)

    for (const block of registeredBlocks) {
      const tabs = block.fields[0]

      expect(tabs, block.slug).toMatchObject({ type: 'tabs' })
      if (tabs && typeof tabs === 'object' && 'tabs' in tabs && Array.isArray(tabs.tabs)) {
        expect(tabs.tabs.map(({ label }) => label), block.slug).toEqual([
          'Content',
          'Theme Settings',
        ])
      }
    }
  })

  it('does not leave legacy presentation labels in nested block tabs', () => {
    const labels = registeredBlocks.flatMap((block) => collectTabLabels(block.fields))

    expect(labels).not.toContain('Layout')
    expect(labels).not.toContain('Layout & Theme')
  })
})
