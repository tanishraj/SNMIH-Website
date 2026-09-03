import type { Page } from '@/payload-types'

export const pageRecipeIDs = ['blank', 'landing'] as const

export type PageRecipeID = (typeof pageRecipeIDs)[number]

export type PageRecipeOption = Readonly<{
  description: string
  id: PageRecipeID
  includedBlocks: readonly string[]
  label: string
}>

export const pageRecipeOptions = [
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
] as const satisfies readonly PageRecipeOption[]

export const isPageRecipeID = (value: unknown): value is PageRecipeID =>
  typeof value === 'string' && pageRecipeIDs.some((recipeID) => recipeID === value)

type PageLayout = NonNullable<Page['layout']>

export const createPageRecipeLayout = (recipe: PageRecipeID, title: string): PageLayout => {
  if (recipe === 'blank') return []

  return [
    {
      appearance: { background: 'none', border: 'none' },
      blockType: 'pageHeader',
      title: title.trim(),
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
  ]
}
