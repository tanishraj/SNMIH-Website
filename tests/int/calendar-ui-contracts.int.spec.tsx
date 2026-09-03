import fs from 'node:fs'
import path from 'node:path'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'

describe('Calendar shadcn primitives', () => {
  it('exposes accessible Tabs behavior with the line variant', () => {
    render(
      <Tabs defaultValue="calendar">
        <TabsList aria-label="Calendar view" variant="line">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">Month grid</TabsContent>
        <TabsContent value="timeline">Timeline list</TabsContent>
      </Tabs>,
    )

    const calendarTab = screen.getByRole('tab', { name: 'Calendar' })

    expect(calendarTab.getAttribute('aria-selected')).toBe('true')
    expect(calendarTab.getAttribute('data-state')).toBe('active')
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Timeline' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
    expect(screen.getByText('Timeline list')).toBeTruthy()
  })

  it('composes a semantic recoverable alert', () => {
    render(
      <Alert variant="destructive">
        <AlertDescription>Calendar unavailable.</AlertDescription>
        <AlertAction>
          <button type="button">Retry</button>
        </AlertAction>
      </Alert>,
    )

    expect(screen.getByRole('alert').textContent).toContain('Calendar unavailable.')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })

  it('keeps Calendar controls semantic and radius-owned without global Select changes', () => {
    const styles = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/calendarStyles.ts'),
      'utf8',
    )
    const select = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ui/select.tsx'),
      'utf8',
    )

    expect(styles).toContain('rounded-control')
    expect(styles).toContain('rounded-card')
    expect(styles).toContain('border-border')
    expect(styles).not.toMatch(/dark:/)
    expect(select).toContain('rounded-control')
    expect(select).toContain('rounded-card')
  })

  it('uses transparent inherited panels for light and brand Calendar surfaces', () => {
    const light = resolveCalendarSurfaceClasses('light')
    const brand = resolveCalendarSurfaceClasses('brand')

    expect(light.panel).toContain('bg-transparent')
    expect(light.panel).toContain('border-border')
    expect(brand.panel).toContain('bg-transparent')
    expect(brand.panel).toContain('border-primary-foreground/20')
    expect(brand.supportingText).toContain('text-primary-foreground/70')

    const sources = `${light.panel}${light.toolbar}${brand.panel}${brand.toolbar}`
    expect(sources).not.toContain('bg-card')
    expect(sources).not.toContain('text-card-foreground')
  })

  it('wires the normalized setting and section surface into CalendarClient', () => {
    const presentation = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/Presentation.tsx'),
      'utf8',
    )

    expect(presentation).toContain('surface={appearanceClasses.surface}')
    expect(presentation).toContain('normalizeCalendarAdjacentMonthDates')
  })

  it('uses framed Tabs and the Calendar surface resolver in the toolbar', () => {
    const client = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarClient.tsx'),
      'utf8',
    )

    expect(client).toContain('variant="default"')
    expect(client).not.toContain('variant="line"')
    expect(client).toContain('resolveCalendarSurfaceClasses(surface)')
  })

  it('styles the actual Radix active-state attribute', () => {
    const tabs = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ui/tabs.tsx'), 'utf8')
    const calendarStyles = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/calendarStyles.ts'),
      'utf8',
    )

    expect(`${tabs}${calendarStyles}`).toContain('data-[state=active]')
    expect(`${tabs}${calendarStyles}`).not.toMatch(/\bdata-active:/)
  })

  it('reserves display typography for the Calendar section heading', () => {
    const read = (file: string) =>
      fs.readFileSync(path.resolve(process.cwd(), `src/blocks/Calendar/${file}`), 'utf8')

    expect(read('Presentation.tsx')).toContain('contentSectionHeadingClasses')
    for (const child of [
      'CalendarClient.tsx',
      'CalendarMonthView.tsx',
      'CalendarTimelineView.tsx',
      'CalendarUpcoming.tsx',
    ]) {
      expect(read(child), child).not.toContain('font-display')
    }
  })

  it('uses Calendar color only for accents and semantic tokens for text', () => {
    const month = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarMonthView.tsx'),
      'utf8',
    )
    const timeline = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarTimelineView.tsx'),
      'utf8',
    )
    const upcoming = fs.readFileSync(
      path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarUpcoming.tsx'),
      'utf8',
    )
    const sources = `${month}${timeline}${upcoming}`

    expect(sources).not.toContain('text-[var(--calendar-tone)]')
    expect(sources).toContain('text-current')
    expect(sources).toContain('text-muted-foreground')
  })

  it('keeps Calendar body regions transparent and free of forced card foregrounds', () => {
    const read = (file: string) =>
      fs.readFileSync(path.resolve(process.cwd(), `src/blocks/Calendar/${file}`), 'utf8')

    for (const child of [
      'CalendarMonthView.tsx',
      'CalendarTimelineView.tsx',
      'CalendarUpcoming.tsx',
    ]) {
      const source = read(child)
      expect(source, child).not.toContain('bg-card')
      expect(source, child).not.toContain('text-card-foreground')
    }
  })
})
