import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Tabs Content active color', () => {
  it('uses semantic action colors for every active tab treatment', () => {
    const component = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TabsContent/TabsContentClient.tsx'),
      'utf8',
    )
    const shared = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/shared/contentTabRail.ts'),
      'utf8',
    )

    expect(component).toContain('<ScrollableContentTabRail')
    expect(component).not.toContain('getContentTabRailClasses(tabVariant, tabSurface)')
    expect(component).toContain('getContentTabClasses(tabVariant, isActive, tabSurface)')
    expect(component).not.toContain("'border-primary text-primary'")
    expect(component).not.toContain('shadow-[0_1px_2px_rgba(15,35,65,0.08)]')
    expect(shared).toContain("underline: 'border-b border-border'")
    expect(shared).toContain("underline: 'border-b border-primary-foreground/25'")
    expect(shared).toContain(
      "variant === 'underline' && '-mb-px border-b-2 border-transparent'",
    )
    expect(shared).toContain("'border-primary text-primary'")
    expect(shared).toContain("'border-primary-foreground text-primary-foreground'")
    expect(shared).not.toContain('after:scale-x')
    expect(shared).not.toContain('after:bg')
    expect(shared).toContain("'bg-primary text-primary-foreground'")
    expect(shared).toContain("'bg-primary-foreground text-primary'")
    expect(shared).toContain("'text-primary-foreground hover:bg-primary-foreground/10'")
  })

  it('supports segmented curriculum tabs and keyboard navigation', () => {
    const component = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TabsContent/TabsContentClient.tsx'),
      'utf8',
    )
    const config = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TabsContent/config.ts'),
      'utf8',
    )

    expect(config).toContain("{ label: 'Segmented', value: 'segmented' }")
    expect(config).toContain("{ label: 'Curriculum List', value: 'curriculum' }")
    expect(config).toContain("name: 'items'")
    expect(config).toContain("name: 'tabAlignment'")
    expect(config).toContain("name: 'sectionLayout'")
    expect(config).toContain("{ label: 'Split', value: 'split' }")
    expect(config).toContain("defaultValue: 'center'")
    expect(config).toContain("{ label: 'Right', value: 'right' }")
    expect(component).toContain("event.key === 'ArrowRight'")
    expect(component).toContain('aria-controls={`${tabsId}-panel`}')
    expect(component).toContain('data-tab-alignment={resolvedTabAlignment}')
    expect(component).toContain("resolvedTabAlignment === 'right' && 'self-end'")
    expect(component).toContain("resolvedTabAlignment === 'stretch' ? 'w-full' : 'w-fit'")
    expect(component).toContain("resolvedTabStyle === 'boxed'")
    expect(component).toContain("resolvedTabStyle === 'segmented' && 'min-w-32'")
    expect(component).toContain("resolvedLayout === 'curriculum'")
  })

  it('uses the shared theme radius, typography, and spacing conventions', () => {
    const component = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TabsContent/TabsContentClient.tsx'),
      'utf8',
    )
    const serverComponent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/TabsContent/Component.tsx'),
      'utf8',
    )

    expect(component).toContain("'rounded-card border p-5 sm:p-6'")
    expect(component).toContain('font-[family-name:var(--font-display)]')
    expect(component).toContain("'font-sans text-lg tracking-tight capitalize sm:text-xl'")
    expect(component).toContain('<span className={contentItemDescriptionClasses}>')
    expect(component).not.toContain('shadow-[0_8px_28px_rgba(15,35,65,0.06)]')
    expect(component).not.toContain('gap-y-3 border-t border-current/15')
    expect(component).toContain("data-curriculum-columns={curriculumColumns ?? '2'}")
    expect(component).toContain('className="flex min-w-0 items-center gap-3"')
    expect(component).toContain('md:before:inset-y-0')
    expect(component).toContain('lg:after:left-2/3')
    expect(component).toContain("compactGap ? 'gap-3 md:gap-4' : 'gap-4 md:gap-5'")
    expect(serverComponent).toContain("sectionLayout === 'split' && hasHeader")
    expect(serverComponent).toContain('data-tabs-section-layout={usesSplitLayout')
  })
})
