import { test, expect, Page } from '@playwright/test'
import { cleanupHomepage, seedHomepage } from '../helpers/seedHomepage'
import { cleanupTestUser, seedTestUser } from '../helpers/seedUser'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()
    await seedHomepage()

    const context = await browser.newContext()
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await cleanupHomepage()
    await cleanupTestUser()
  })

  test('can go on homepage', async () => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/E2E Homepage/)

    const announcement = page.getByText('E2E Homepage Heading').first()

    await expect(announcement).toBeVisible()
  })
})
