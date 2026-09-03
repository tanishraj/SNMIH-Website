import { describe, expect, it } from 'vitest'

import {
  createPageRecipeLayout,
  isPageRecipeID,
  pageRecipeOptions,
} from '@/page-recipes/pageRecipes'

describe('page recipes', () => {
  it('exposes exactly Blank and Landing in editor order', () => {
    expect(pageRecipeOptions).toEqual([
      {
        description: 'Start with an empty layout and add any available block.',
        id: 'blank',
        includedBlocks: [],
        label: 'Blank Page',
      },
      {
        description: 'Start with a page title followed by an automatic breadcrumb trail.',
        id: 'landing',
        includedBlocks: ['Page Header', 'Breadcrumb'],
        label: 'Landing Page',
      },
    ])
  })

  it('recognizes only supported recipe IDs', () => {
    expect(isPageRecipeID('blank')).toBe(true)
    expect(isPageRecipeID('landing')).toBe(true)
    expect(isPageRecipeID('service')).toBe(false)
    expect(isPageRecipeID(null)).toBe(false)
  })

  it('creates a blank layout', () => {
    expect(createPageRecipeLayout('blank', 'About')).toEqual([])
  })

  it('creates Page Header then automatic Breadcrumb for Landing', () => {
    expect(createPageRecipeLayout('landing', '  About the Institute  ')).toEqual([
      {
        appearance: { background: 'none', border: 'none' },
        blockType: 'pageHeader',
        title: 'About the Institute',
        topContent: 'eyebrow',
        variant: 'minimal',
      },
      {
        alignment: 'left',
        appearance: { background: 'none', border: 'none' },
        blockType: 'breadcrumb',
        breadcrumbMode: 'automatic',
        sectionPadding: 'compact',
        separator: 'chevron',
        showCurrentPage: true,
        showHome: true,
        size: 'default',
      },
    ])
  })

  it('returns fresh data for every request', () => {
    const first = createPageRecipeLayout('landing', 'First')
    const second = createPageRecipeLayout('landing', 'Second')

    first[0]!.blockName = 'Changed locally'

    expect(second[0]).not.toHaveProperty('blockName')
    expect(second[0]).toMatchObject({ title: 'Second' })
  })
})
