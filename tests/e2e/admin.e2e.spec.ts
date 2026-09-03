import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { cleanupPageRecipeDraft, recipeE2ETitle } from '../helpers/pageRecipeDraft'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await cleanupPageRecipeDraft()
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupPageRecipeDraft()
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('creates a Landing Page draft from the guided setup', async () => {
    await page.goto('http://localhost:3000/admin/collections/pages/create')

    await expect(page.getByRole('heading', { name: 'Create a Page' })).toBeVisible()
    await expect(page.getByRole('radio', { name: /Blank Page/ })).toBeChecked()

    await page.getByRole('textbox', { name: 'Page title' }).fill(recipeE2ETitle)
    await page.getByRole('radio', { name: /Landing Page/ }).check()
    await page.getByRole('button', { name: 'Create draft' }).click()

    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+$/)
    await expect(page.locator('input[name="title"]')).toHaveValue(recipeE2ETitle)

    const blockLabels = page.locator('.blocks-field__row .blocks-field__block-header')
    await expect(blockLabels).toHaveCount(2)
    await expect(blockLabels.nth(0)).toContainText('Page Header')
    await expect(blockLabels.nth(1)).toContainText('Breadcrumb')
  })
})
