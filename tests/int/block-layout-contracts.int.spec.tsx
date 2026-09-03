import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  formatStepLabel,
  TimelineBlockComponent,
} from '@/blocks/Timeline/Component'
import { getNumberedStepsGridClasses } from '@/blocks/NumberedSteps/Component'
import { getTeamGridClasses } from '@/components/team-showcase'

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

describe('responsive block layout contracts', () => {
  it('generates stable horizontal Timeline labels from item order', () => {
    expect(Array.from({ length: 4 }, (_, index) => formatStepLabel(index))).toEqual([
      'Step 01',
      'Step 02',
      'Step 03',
      'Step 04',
    ])

    const markup = renderToStaticMarkup(
      createElement(TimelineBlockComponent, {
        title: 'Admissions',
        variant: 'horizontal',
        items: Array.from({ length: 4 }, (_, index) => ({
          date: 'Step 01',
          title: `Milestone ${index + 1}`,
        })),
      }),
    )

    for (const label of ['Step 01', 'Step 02', 'Step 03', 'Step 04']) {
      expect(markup.match(new RegExp(label, 'g'))).toHaveLength(2)
    }
  })

  it('gives Team images a mobile aspect ratio and derives desktop columns', () => {
    expect(read('src/components/team-showcase.tsx')).toMatch(
      /aspect-square w-full[^"']*md:size-12 md:aspect-auto/,
    )
    expect(getTeamGridClasses(2)).toContain('md:grid-cols-2')
    expect(getTeamGridClasses(3)).toContain('md:grid-cols-3')
    expect(getTeamGridClasses(4)).toContain('lg:grid-cols-4')
  })

  it('derives Numbered Steps columns from the number of cards', () => {
    expect(getNumberedStepsGridClasses(3)).toContain('lg:grid-cols-3')
    expect(getNumberedStepsGridClasses(4)).toContain('lg:grid-cols-4')
    expect(getNumberedStepsGridClasses(5)).toContain('lg:grid-cols-3')
  })

  it('reserves fan clearance and removes duplicate page-stack spacing', () => {
    const fanSource = read('src/components/gallery-showcase-fan.tsx')
    const showcaseSource = read('src/components/gallery-showcase.tsx')
    const stackSource = read('src/blocks/PageBlockStack.tsx')

    expect(fanSource).toContain("none: 'h-48 sm:h-60 lg:h-68'")
    expect(fanSource).toContain("compact: 'h-44 sm:h-56 lg:h-60'")
    expect(fanSource).toContain("comfortable: 'h-52 sm:h-68 lg:h-72'")
    expect(showcaseSource).toContain("'flex flex-col gap-8 sm:gap-10'")
    expect(stackSource).toContain('className="flex flex-col"')
    expect(stackSource).not.toContain('gap-4')
  })
})
