import { expect, test } from '@playwright/test'

const calendarPreviewURL = 'http://localhost:3000/block-thumbnail-previews/calendar'

test.describe('Calendar block', () => {
  test('uses the month grid on desktop and the timeline on mobile', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 })
    await page.goto(calendarPreviewURL)

    const root = page.locator('html')
    await root.evaluate((element) => {
      element.setAttribute('data-theme-color', 'snmih-blue')
      element.setAttribute('data-color-scheme', 'light')
      element.classList.remove('dark')
    })

    const calendar = page.locator('[data-calendar-block="true"]')
    const tablist = calendar.getByRole('tablist', { name: 'Calendar view' })
    const filter = calendar.getByLabel('Filter events by classification')
    const upcoming = calendar.locator('[data-calendar-upcoming="true"]')
    await expect(calendar).toBeVisible()
    await expect(calendar.locator('[data-calendar-month-view="true"]')).toBeVisible()
    await expect(tablist).toBeVisible()
    await expect(tablist).toHaveAttribute('data-variant', 'default')
    await expect(tablist).toHaveCSS('height', '44px')
    await expect(filter).toHaveCSS('height', '44px')
    await expect(upcoming).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    const calendarTab = calendar.getByRole('tab', { name: 'Calendar' })
    const timelineTab = calendar.getByRole('tab', { name: 'Timeline' })

    await expect(calendarTab).toHaveAttribute('aria-selected', 'true')
    await expect(calendarTab).toHaveAttribute('data-state', 'active')
    await expect(calendarTab).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(upcoming).not.toContainText(/GMT|UTC/)

    const idleTimelineColor = await timelineTab.evaluate(
      (element) => getComputedStyle(element).color,
    )
    await timelineTab.hover()
    await expect
      .poll(() => timelineTab.evaluate((element) => getComputedStyle(element).color))
      .not.toBe(idleTimelineColor)

    const lightForeground = await upcoming.evaluate((element) => getComputedStyle(element).color)

    await root.evaluate((element) => {
      element.setAttribute('data-color-scheme', 'dark')
      element.classList.add('dark')
    })

    const darkForeground = await upcoming.evaluate((element) => getComputedStyle(element).color)
    expect(darkForeground).not.toBe(lightForeground)

    await page.setViewportSize({ height: 844, width: 390 })

    await expect(calendar.locator('[data-calendar-timeline-view="true"]')).toBeVisible()
    await expect(calendar.locator('[data-calendar-month-view="true"]')).toBeHidden()
    await expect(tablist).toBeHidden()
  })
})
